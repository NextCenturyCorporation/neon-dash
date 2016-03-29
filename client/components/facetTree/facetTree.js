'use strict';

angular.module('neonDemo.directives')
.directive('facetTree', ['FilterService', 'DatasetService', 'ConnectionService',
function(filterService, datasetService, connectionService) {
    return {
        templateUrl: 'partials/directives/facetTree.html',
        restrict: 'EA',
        scope: {
            bindDatabase: "=?",
            bindTable: "=?",
            treeConfigPath: '=',
            facetField: "=?"
        },
        link: function($scope, el) {
            $scope.el = el;
            el.addClass("facet-tree-directive");
            $scope.renderEl = $scope.el.find('.tree-div')[0];

            var setHeight = function() {
                var topHeight = $($scope.el).find('.header-container').outerHeight(true);
                $($scope.renderEl).height($($scope.el).height() - topHeight);
            };

            setHeight();

            $scope.el.resize(setHeight);

            $scope.init();
        },
        controller: function($scope) {
            $scope.active = {};

            $scope.init = function() {
                $scope.messenger = new neon.eventing.Messenger();
                $scope.messenger.events({
                    filtersChanged: $scope.queryForData
                });

                $scope.messenger.subscribe(datasetService.UPDATE_DATA_CHANNEL, $scope.queryForData);

                $scope.messenger.subscribe(filterService.REQUEST_REMOVE_FILTER, function(ids) {
                    if(filterService.containsKey($scope.filterKeys, ids)) {
                        $scope.clearFilterSet();
                    }
                });

                $scope.$on('$destroy', function() {
                    $scope.messenger.removeEvents();
                    // Remove our filter if we had an active one.
                    if($scope.filterSet) {
                        filterService.removeFilters($scope.messenger, $scope.filterKeys);
                    }
                    $scope.el.off('resize');

                    if($scope.outstandingQuery) {
                        $scope.outstandingQuery.abort();
                    }
                });

                initDataset();
                initTables();
                initFields();

                $scope.filterKeys = filterService.createFilterKeys("facetTree", datasetService.getDatabaseAndTableNames());

                $scope.queryForData();
            };

            var initDataset = function() {
                if(!datasetService.hasDataset() || $scope.loadingData) {
                    return;
                }

                $scope.databases = datasetService.getDatabases();
                $scope.active.database = $scope.databases[0];
                if($scope.bindDatabase) {
                    for(var i = 0; i < $scope.databases.length; ++i) {
                        if($scope.bindDatabase === $scope.databases[i].name) {
                            $scope.active.database = $scope.databases[i];
                            break;
                        }
                    }
                }
                $scope.filterKeys = filterService.createFilterKeys("facetTree", datasetService.getDatabaseAndTableNames());
            };

            var initTables = function() {
                $scope.tables = datasetService.getTables($scope.active.database.name);
                $scope.active.table = $scope.tables[0];
                if($scope.bindTable) {
                    for(var i = 0; i < $scope.tables.length; ++i) {
                        if($scope.bindTable === $scope.tables[i].name) {
                            $scope.active.table = $scope.tables[i];
                            break;
                        }
                    }
                }
            };

            var initFields = function() {
                $scope.fields = datasetService.getSortedFields($scope.active.database.name, $scope.active.table.name);

                var fieldName = $scope.facetField || "";

                $scope.active.field = _.find($scope.fields, function(field) {
                    return field.columnName === fieldName;
                }) || datasetService.createBlankField();
            };

            var buildQuery = function() {
                if($scope.active && $scope.active.field && $scope.active.field.columnName !== "") {
                    var query = new neon.query.Query()
                        .selectFrom($scope.active.database.name, $scope.active.table.name)
                        .where($scope.active.field.columnName, '!=', null)
                        .groupBy($scope.active.field.columnName)
                        .aggregate(neon.query.COUNT, '*', 'count')
                        .ignoreFilters([$scope.filterKeys[$scope.active.database.name][$scope.active.table.name]]);
                    return query;
                }

                return;
            };

            $scope.queryForData = function() {
                var connection = connectionService.getActiveConnection();

                if(!connection) {
                    //TODO error message
                    return;
                }

                var query = buildQuery();

                if(query) {
                    if($scope.outstandingQuery) {
                        $scope.outstandingQuery.abort();
                    }

                    $scope.outstandingQuery = connection.executeQuery(query);
                    $scope.outstandingQuery.always(function() {
                        $scope.outstandingQuery = undefined;
                    });
                    $scope.outstandingQuery.done(function(queryResults) {
                        $scope.$apply(function() {
                            $scope.data = queryResults.data;
                            draw();
                            $scope.loadingData = false;
                        });
                    });
                    $scope.outstandingQuery.fail(function() {
                        //TODO error
                    });
                }
            };

            var getCount = function(name) {
                for(var i = 0; i < $scope.data.length; i++) {
                    if($scope.data[i][$scope.active.field.columnName] === name) {
                        return $scope.data[i].count;
                    }
                }

                return 0;
            };

            var injectCounts = function(treeConfig) {
                var toInject = [treeConfig];
                while(toInject.length) {
                    var checking = toInject.shift();
                    if(checking.children) {
                        toInject = toInject.concat(checking.children);
                    } else {
                        checking.count = getCount(checking.name);
                    }
                }

                return treeConfig;
            };

            var toggleFilter = function(name) {
                if($scope.filter && $scope.filter === name) {
                    removeFilter();
                } else {
                    $scope.filter = name;
                    var createFilterClause = function() {
                        var filterClause = neon.query.where($scope.active.field.columnName, '=', name);
                        return filterClause;
                    };

                    var relations = datasetService.getRelations($scope.active.database.name, $scope.active.table.name, [$scope.active.field]);
                    filterService.replaceFilters($scope.messenger, relations, $scope.filterKeys, createFilterClause, 'facet-tree', function() {
                        $scope.queryForData();
                    });
                }
            };

            var removeFilter = function() {
                filterService.removeFilters($scope.messenger, $scope.filterKeys, function() {
                    $scope.filter = null;
                });
            };

            var draw = function() {
                $($scope.renderEl).empty();

                var marginLeft = 20;
                var marginRight = 0;
                var margin = {
                    top: 30,
                    right: marginRight,
                    bottom: 30,
                    left: marginLeft
                };
                var width = $($scope.renderEl).width() - marginRight - marginLeft;
                var barHeight = 20;
                var barWidth = width * 0.8;

                var i = 0;
                var duration = 400;
                var root;

                var tree = d3.layout.tree()
                .nodeSize([0, 20]);

                var svg = d3.select($scope.renderEl)
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .classed("tree-svg", true)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                function processJson(error, config) {
                    if(error) {
                        throw error;
                    }

                    config = injectCounts(config);

                    config.x0 = 0;
                    config.y0 = 0;
                    update(root = config);
                }

                if($scope.treeConfig) {
                    processJson(null, $scope.treeConfig);
                } else {
                    d3.json($scope.treeConfigPath, function(error, config) {
                        $scope.treeConfig = config;
                        processJson(error, config);
                    });
                }

                function update(source) {
                    var nodes = tree.nodes(root);
                    var height = Math.max(500, nodes.length * barHeight + margin.top + margin.bottom);

                    d3.select("svg").transition()
                        .duration(duration)
                        .attr("height", height);

                    d3.select(self.frameElement).transition()
                        .duration(duration)
                        .style("height", height + "px");

                    // Compute the "layout".
                    nodes.forEach(function(n, i) {
                        n.x = i * barHeight;
                    });

                    // Update the nodes…
                    var node = svg.selectAll("g.node")
                        .data(nodes, function(d) {
                            return d.id || (d.id = ++i);
                        });

                    var nodeEnter = node.enter().append("g")
                        .attr("class", "node")
                        .attr("transform", function(d) {
                            return "translate(" + d.y + "," + d.x + ")";
                        })
                        .style("opacity", 1e-6);

                    // Enter any new nodes at the parent's previous position.
                    nodeEnter.append("rect")
                        .attr("y", -barHeight / 2)
                        .attr("height", barHeight)
                        .attr("width", barWidth)
                        .classed("parentNode", isParent)
                        .classed("childNode", isChild)
                        .classed("filtered", isFiltered)
                        .on("click", click);

                    nodeEnter.append("text")
                        .attr("dy", 3.5)
                        .attr("dx", 5.5)
                        .text(function(d) {
                            return d.name;
                        });

                    nodeEnter.append("text")
                        .attr('text-anchor', 'end')
                        .attr("dy", 3.5)
                        .attr("dx", barWidth - 5)
                        .text(function(d) {
                            return d.count !== undefined ? '(' + d.count + ')' : '';
                        });

                    // Transition nodes to their new position.
                    nodeEnter.transition()
                    .duration(duration)
                    .attr("transform", function(d) {
                        return "translate(" + d.y + "," + d.x + ")";
                    })
                    .style("opacity", 1);

                    node.transition()
                    .duration(duration)
                    .attr("transform", function(d) {
                        return "translate(" + d.y + "," + d.x + ")";
                    })
                    .style("opacity", 1);

                    // Transition exiting nodes to the parent's new position.
                    node.exit().transition()
                        .duration(duration)
                        .attr("transform", function(d) {
                            return "translate(" + source.y + "," + source.x + ")";
                        })
                        .style("opacity", 1e-6)
                        .remove();

                    // Stash the old positions for transition.
                    nodes.forEach(function(d) {
                        d.x0 = d.x;
                        d.y0 = d.y;
                    });
                }

                // Toggle children on click.
                function click(d) {
                    if(d.children) {
                        d._children = d.children;
                        d.children = null;
                    } else {
                        d.children = d._children;
                        d._children = null;
                    }

                    if(!d.children && !d._children) {
                        toggleFilter(d.name);
                    } else {
                        update(d);
                    }
                }

                function isParent(d) {
                    return d._children ? true : d.children ? true : false;
                }

                function isChild(d) {
                    return !isParent(d);
                }

                function isFiltered(d) {
                    return ($scope.filter && $scope.filter !== d.name);
                }
            };
        }
    };
}]);