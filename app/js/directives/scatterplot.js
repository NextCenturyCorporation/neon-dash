'use strict';

/*
 * Copyright 2014 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/**
 * This directive adds a scatterplot to the DOM and drives the visualization data from
 * whatever database and table are currently selected in neon.  This directive accomplishes that
 * by using getting a neon connection from a connection service and listening for
 * neon system events (e.g., data tables changed).  On these events, it requeries the active
 * connection for data and updates applies the change to its scope.  The contained
 * scatterplot will update as a result.
 * @namespace neonDemo.directives
 * @class scatterplot
 * @constructor
 */

angular.module('neonDemo.directives')
.directive('scatterplot', ['ConnectionService', 'DatasetService', 'ErrorNotificationService', 'FilterService', '$timeout', '$filter',
function(connectionService, datasetService, errorNotificationService, filterService, $timeout, $filter) {
    return {
        templateUrl: 'partials/directives/scatterplot.html',
        restrict: 'EA',
        scope: {
            bindTable: '=',
            bindDatabase: '=',
            bindAttrX: '=',
            bindAttrY: '=',
            colorMappings: '&',
            hideHeader: '=?',
            hideAdvancedOptions: '=?'
        },
        link: function($scope, $element) {
            $element.addClass('scatterplotDirective');

            $scope.element = $element;

            $scope.optionsMenuButtonText = function() {
                if($scope.noData) {
                    return "No Data";
                }
                if($scope.colorMappings.length >= $scope.seriesLimit) {
                    return "Top " + $scope.seriesLimit;
                }
                return "";
            };
            $scope.showOptionsMenuButtonText = function() {
                return $scope.noData || $scope.colorMappings.length >= $scope.seriesLimit;
            };

            $scope.databases = [];
            $scope.tables = [];
            $scope.totalType = 'count';
            $scope.fields = [];
            $scope.filterKeys = {};
            $scope.filteredNodes = [];
            $scope.chart = undefined;
            $scope.colorMappings = [];
            $scope.dateStringToDataIndex = {};
            $scope.seriesLimit = 10;
            $scope.errorMessage = undefined;
            $scope.loadingData = false;
            $scope.noData = true;
            $scope.data = [];

            $scope.options = {
                database: {},
                table: {},
                attrX: "",
                attrY: "",
                limitCount: 5000
            };

            var updateChartSize = function() {
                if($scope.chart) {
                    var headerHeight = 0;
                    $element.find(".header-container").each(function() {
                        headerHeight += $(this).outerHeight(true);
                    });
                    $element.find('.scatterplot').height($element.height() - headerHeight);
                    // Redraw the line chart.
                    $scope.chart.draw();
                }
            };

            var initialize = function() {
                $scope.messenger = new neon.eventing.Messenger();
                $scope.messenger.events({
                    filtersChanged: onFiltersChanged
                });

                $scope.$on('$destroy', function() {
                    XDATA.userALE.log({
                        activity: "remove",
                        action: "remove",
                        elementId: "scatterplot",
                        elementType: "canvas",
                        elementSub: "scatterplot",
                        elementGroup: "chart_group",
                        source: "system",
                        tags: ["remove", "scatterplot"]
                    });
                    $element.off("resize", updateChartSize);
                    $scope.messenger.removeEvents();
                    if($scope.filteredNodes.length) {
                        filterService.removeFilters($scope.messenger, $scope.filterKeys);
                    }
                    if($scope.outstandingQuery) {
                        $scope.outstandingQuery.abort();
                    }
                });

                // This resizes the chart when the div changes.  This rely's on jquery's resize plugin to fire
                // on the associated element and not just the window.
                $element.resize(updateChartSize);

                // The size of the legend will change whenever the filter notification is added or removed so the chart may need to be resized and redrawn.
                $element.find(".legend").resize(updateChartSize);

                $scope.$watch('options.attrX', function(newValue) {
                    onFieldChange('attrX', newValue);
                    if(!$scope.loadingData && $scope.options.database.name && $scope.options.table.name) {
                        $scope.queryForData();
                    }
                });
                $scope.$watch('options.attrY', function(newValue) {
                    onFieldChange('attrY', newValue);
                    if(!$scope.loadingData && $scope.options.database.name && $scope.options.table.name) {
                        $scope.queryForData();
                    }
                });
            };

            var onFieldChange = function(field, newValue) {
                var source = "user";
                var action = "click";

                // Override the default action if a field changes while loading data during
                // intialization or a dataset change.
                if($scope.loadingData) {
                    source = "system";
                    action = "reset";
                }

                XDATA.userALE.log({
                    activity: "select",
                    action: action,
                    elementId: "scatterplot",
                    elementType: "combobox",
                    elementSub: "scatterplot-" + field,
                    elementGroup: "chart_group",
                    source: source,
                    tags: ["options", "scatterplot", newValue]
                });
            };

            /**
             * Event handler for filter changed events issued over Neon's messaging channels.
             * @param {Object} message A Neon filter changed message.
             * @method onFiltersChanged
             * @private
             */
            var onFiltersChanged = function(message) {
                if(message.addedFilter && message.addedFilter.databaseName === $scope.options.database.name && message.addedFilter.tableName === $scope.options.table.name) {
                    if(message.type.toUpperCase() === "ADD" || message.type.toUpperCase() === "REPLACE") {
                        if(message.addedFilter.whereClause) {
                            $scope.addFilterWhereClauseToFilterList(message.addedFilter.whereClause);
                        }
                    }

                    $scope.queryForData();
                }
            };

            /**
             * Adds the filter with the given where clause (or its children) to the list of graph filters if the filter's field matches the selected node field.
             * @param {Object} A where clause containing either {String} lhs and {String} rhs or {Array} whereClauses containing other where clause Objects.
             * @method addFilterWhereClauseToFilterList
             */
            $scope.addFilterWhereClauseToFilterList = function(whereClause) {
                if(whereClause.whereClauses) {
                    for(var i = 0; i < whereClause.whereClauses.length; ++i) {
                        $scope.addFilterWhereClauseToFilterList(whereClause.whereClauses[i]);
                    }
                } else if(whereClause.lhs === $scope.options.selectedNodeField && whereClause.lhs && whereClause.rhs) {
                    $scope.addFilter(whereClause.rhs);
                }
            };

            $scope.queryForData = function() {
                XDATA.userALE.log({
                    activity: "alter",
                    action: "query",
                    elementId: "scatterplot",
                    elementType: "canvas",
                    elementSub: "scatterplot",
                    elementGroup: "chart_group",
                    source: "system",
                    tags: ["query", "scatterplot"]
                });

                if($scope.errorMessage) {
                    errorNotificationService.hideErrorMessage($scope.errorMessage);
                    $scope.errorMessage = undefined;
                }

                var connection = connectionService.getActiveConnection();

                if(!connection || !$scope.options.attrX || !$scope.options.attrY) {
                    drawscatterplot();
                    return;
                }

                //TODO is the below used?
                if($scope.options.categoryField) {
                    groupByClause.push($scope.options.categoryField);
                }

                var query = new neon.query.Query()
                    .selectFrom($scope.options.database.name, $scope.options.table.name)
                    .where($scope.options.attrX.columnName, '!=', null)
                    .limit($scope.options.limitCount);



                if($scope.outstandingQuery) {
                    $scope.outstandingQuery.abort();
                }

                $scope.outstandingQuery = connection.executeQuery(query);
                $scope.outstandingQuery.always(function() {
                    $scope.outstandingQuery = undefined;
                });
                $scope.outstandingQuery.done(handleQuerySuccess);
                $scope.outstandingQuery.fail(handleQueryFailure);
            };

            /**
             * Displays data for any currently active datasets.
             * @param {Boolean} Whether this function was called during visualization initialization.
             * @method displayActiveDataset
             */
            $scope.displayActiveDataset = function(initializing) {
                if(!datasetService.hasDataset() || $scope.loadingData) {
                    return;
                }

                $scope.databases = datasetService.getDatabases();
                $scope.options.database = $scope.databases[0];
                if($scope.bindDatabase) {
                    for(var i = 0; i < $scope.databases.length; ++i) {
                        if($scope.bindDatabase === $scope.databases[i].name) {
                            $scope.options.database = $scope.databases[i];
                        }
                    }
                }

                $scope.filterKeys = filterService.createFilterKeys("scatterplot", datasetService.getDatabaseAndTableNames());

                if(initializing) {
                    $scope.updateTables();
                } else {
                    $scope.$apply(function() {
                        $scope.updateTables();
                    });
                }
            };

            $scope.updateTables = function() {
                $scope.tables = datasetService.getTables($scope.options.database.name);
                $scope.options.table = datasetService.getFirstTableWithMappings($scope.options.database.name, ["x_attr"]) || $scope.tables[0];
                if($scope.bindTable) {
                    for(var i = 0; i < $scope.tables.length; ++i) {
                        if($scope.bindTable === $scope.tables[i].name) {
                            $scope.options.table = $scope.tables[i];
                            break;
                        }
                    }
                }
                $scope.updateFields();
            };

            $scope.updateFields = function() {
                $scope.loadingData = true;

                $scope.fields = datasetService.getSortedFields($scope.options.database.name, $scope.options.table.name);

                var xFieldName = $scope.bindAttrX ||
                    datasetService.getMapping($scope.options.database.name, $scope.options.table.name, "x_attr") ||
                    "";

                $scope.options.attrX = _.find($scope.fields, function(field) {
                    return field.columnName === xFieldName;
                }) || datasetService.createBlankField();

                var yFieldName = $scope.bindAttrY ||
                    datasetService.getMapping($scope.options.database.name, $scope.options.table.name, "y_attr") ||
                    "";
                $scope.options.attrY = _.find($scope.fields, function(field) {
                    return field.columnName === yFieldName;
                }) || datasetService.createBlankField();

                $scope.queryForData();
            };

            $scope.addFilter = function(value) {
                var nodesIndex = value;
                if(nodesIndex < 0) {
                    return;
                }

                var filteredNodesIndex = $scope.filteredNodes.indexOf(value);
                if(filteredNodesIndex >= 0) {
                    return;
                }

                $scope.filteredNodes.push(value);
                if($scope.messenger) {
                    var relations = datasetService.getRelations($scope.options.database.name, $scope.options.table.name, [$scope.options.textField]);
                    filterService.replaceFilters($scope.messenger, relations, $scope.filterKeys, $scope.createFilterClauseForNode, $scope.queryForData);
                }
            };

            $scope.createFilterClauseForNode = function() {
                var i = 0;
                var filterClause = neon.query.where($scope.options.attrX.columnName, '=', $scope.data[$scope.filteredNodes[0]].sentiment);
                filterClause = neon.query.and(filterClause, neon.query.where($scope.options.attrY.columnName, '=', $scope.data[$scope.filteredNodes[0]].arousal));
                for(i = 1; i < $scope.filteredNodes.length; ++i) {
                    var tempClause = neon.query.where($scope.options.attrX.columnName, '=', $scope.filteredNodes[0].sentiment);
                    filterClause = neon.query.or(filterClause, neon.query.and(tempClause, neon.query.where($scope.options.attrY.columnName, '=', $scope.filteredNodes[0].arousal)));
                }
                return filterClause;
            };

            $scope.clearFilters = function() {
                $scope.filteredNodes = [];
                if($scope.messenger) {
                    filterService.removeFilters($scope.messenger, $scope.filterKeys, function() {
                        $scope.queryForData();
                    });
                }
            };

            /**
             * Draws a new line chart with the given results from the successful query.
             * @param {Object} results
             * @method handleQuerySuccess
             */
            var handleQuerySuccess = function(results) {
                $scope.data = results.data;

                var scatterplotData = createScatterplotData(results.data);

                $scope.$apply(function() {
                    drawscatterplot(scatterplotData);
                });
            };

            /**
             * Creates the line series data using the given data.
             * @param {Object} data
             * @method createScatterplotData
             */
            var createScatterplotData = function(data) {
                var tweets = [];
                var minX;
                var maxX;

                var i;
                //this prevents an error in older mongo caused when the xAxis value is invalid as it is not
                //included as a key in the response
                for(i = 0; i < data.length; i++) {
                    if(typeof(data[i][$scope.options.attrX.columnName]) === 'undefined') {
                        data[i][$scope.options.attrX.columnName] = null;
                    }
                }

                if(data.length > 0) {
                    for(i = 0; i < data.length; i++) {
                        tweets.push([data[i].id, data[i].sentiment, data[i].arousal, data[i].text, data[i].user_screen_name]); //tweet ID, valence (x), arousal (y), text, screen name
                    }
                    var range = d3.extent(tweets, function(d) {
                        return d[1];
                    });
                    minX = range[0];
                    maxX = range[1];
                } else {
                    minX = 0;
                    maxX = 10;
                }

                var seriesData = [];

                for(var series in tweets) {
                    if(Object.prototype.hasOwnProperty.call(tweets, series)) {
                        seriesData.push(tweets[series]);
                    }
                }

                XDATA.userALE.log({
                    activity: "alter",
                    action: "receive",
                    elementId: "scatterplot",
                    elementType: "canvas",
                    elementSub: "scatterplot",
                    elementGroup: "chart_group",
                    source: "system",
                    tags: ["receive", "scatterplot"]
                });

                return seriesData;
            };

            /**
             * Draws a blank line chart and displays the error in the given response from the failed query.
             * @param {Object} response
             * @method handleQueryFailure
             */
            var handleQueryFailure = function(response) {
                XDATA.userALE.log({
                    activity: "alter",
                    action: "failed",
                    elementId: "scatterplot",
                    elementType: "canvas",
                    elementSub: "scatterplot",
                    elementGroup: "chart_group",
                    source: "system",
                    tags: ["failed", "scatterplot"]
                });

                drawscatterplot();

                if(response.responseJSON) {
                    $scope.errorMessage = errorNotificationService.showErrorMessage($element, response.responseJSON.error, response.responseJSON.stackTrace);
                }
            };

            $scope.toggleSeries = function(series) {
                var activity = $scope.chart.toggleSeries(series);
                XDATA.userALE.log({
                    activity: activity,
                    action: "click",
                    elementId: "scatterplot",
                    elementType: "canvas",
                    elementSub: "scatterplot",
                    elementGroup: "chart_group",
                    source: "system",
                    tags: ["render", "scatterplot", series]
                });
            };

            var onHover = function(startDate, endDate) {
                $scope.messenger.publish("date_selected", {
                    start: startDate,
                    end: endDate
                });
            };

            /**
             * Creates and draws a new line chart with the given data, if any.
             * @param {Array} data
             * @method drawscatterplot
             */
            var drawscatterplot = function(data) {
                var opts = {
                    message: "text",
                    hoverListener: onHover,
                    responsive: true,
                    clickHandler: $scope.createClickHandler
                };

                // Destroy the old chart and rebuild it.
                if($scope.chart) {
                    $scope.chart.destroy();
                }
                $scope.chart = new charts.scatterplot($element[0], '.scatterplot', opts);
                $scope.chart.draw(data);
                $scope.colorMappings = $scope.chart.getColorMappings();
                $scope.noData = !data || !data.length || !data[0].data || !data[0].data.length;
                $scope.loadingData = false;

                // Use a timeout so we resize the chart after the legend renders (since the legend size affects the chart size).
                $timeout(function() {
                    updateChartSize();
                }, 100);

                XDATA.userALE.log({
                    activity: "alter",
                    action: "render",
                    elementId: "scatterplot",
                    elementType: "canvas",
                    elementSub: "scatterplot",
                    elementGroup: "chart_group",
                    source: "system",
                    tags: ["render", "scatterplot"]
                });
            };

            /**
             * Sets the minutes, seconds and millis to 0. If the granularity of the date is day, then the hours are also zeroed
             * @param date
             * @returns {Date}
             */
            var zeroOutDate = function(date) {
                var zeroed = new Date(date);
                zeroed.setUTCMinutes(0);
                zeroed.setUTCSeconds(0);
                zeroed.setUTCMilliseconds(0);
                zeroed.setUTCHours(0);
                return zeroed;
            };

            /**
             * Returns the text to display in the legend containing the aggregated value for the given object.
             * @param {Object} colorMappingObject
             * @method getLegendItemAggregationText
             * @return {String}
             */
            $scope.getLegendItemAggregationText = function(colorMappingObject) {
                var total = 0;
                if($scope.options.aggregation === "count" || $scope.options.aggregation === "sum") {
                    total = colorMappingObject.total;
                    return "(" + $filter('number')(total) + ")";
                }
                if($scope.options.aggregation === "min") {
                    var min = colorMappingObject.min;
                    return "(" + min + ")";
                }
                if($scope.options.aggregation === "max") {
                    var max = colorMappingObject.max;
                    return "(" + max + ")";
                }
                return "";
            };

            /**
             * Redraws the line chart using the data from the previous query within the current brush extent.
             * @method updatescatterplotForBrushExtent
             */
            var updatescatterplotForBrushExtent = function() {
                // If the user changed a field or filter while the chart contained data filtered by date then the chart will need to query for new data since the saved data from
                // the previous query will be stale.  Otherwise use the data from the previous query and the current brush extent to redraw the chart.

                var startIndex = 0;
                var endIndex = $scope.data.length;
                var seriesData = createScatterplotData($scope.data.slice(startIndex, endIndex));
                drawscatterplot(seriesData);
            };

            $scope.updateTextField = function() {
                // TODO Logging
                if(!$scope.loadingData) {
                    $scope.queryForData();
                }
            };

            $scope.createClickHandler = function(item) {
                var index;
                for(var i = 0; i < $scope.data.length; i++) {
                    if($scope.data[i].id === item[0] && $scope.data[i].user_screen_name === item[4] && $scope.data[i].text === item[3]) {
                        index = i;
                        break;
                    }
                }

                if(index >= 0) {
                    $scope.$apply(function() {
                        $scope.addFilter(index);
                    });
                } else {
                    $scope.$apply(function() {
                        $scope.removeFilter(index);
                    });
                }
            };

            neon.ready(function() {
                $scope.messenger = new neon.eventing.Messenger();
                initialize();
                $scope.displayActiveDataset(true);
            });
        }
    };
}]);
