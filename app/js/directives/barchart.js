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
 * This directive adds a barchart to the DOM and drives the visualization data from
 * whatever database and table are currently selected in neon.  This directive accomplishes that
 * by using getting a neon connection from a connection service and listening for
 * neon system events (e.g., data tables changed).  On these events, it requeries the active
 * connection for data and updates applies the change to its scope.  The contained
 * barchart will update as a result.
 * @namespace neonDemo.directives
 * @class barchart
 * @constructor
 */
angular.module('neonDemo.directives')
.directive('barchart', ['ConnectionService', 'DatasetService', 'ErrorNotificationService', 'FilterService',
function(connectionService, datasetService, errorNotificationService, filterService) {
    return {
        templateUrl: 'partials/directives/barchart.html',
        restrict: 'EA',
        scope: {
            bindXAxisField: '=',
            bindYAxisField: '=',
            bindAggregationField: '=',
            bindTable: '=',
            bindDatabase: '=',
            hideHeader: '=?',
            hideAdvancedOptions: '=?'
        },
        link: function($scope, $element) {
            $element.addClass('barchartDirective');

            $scope.element = $element;

            $scope.databases = [];
            $scope.tables = [];
            $scope.fields = [];
            $scope.chart = undefined;
            $scope.filterKeys = {};
            $scope.filterSet = undefined;
            $scope.errorMessage = undefined;
            $scope.loadingData = false;

            $scope.options = {
                database: "",
                table: "",
                attrX: "",
                attrY: "",
                barType: "count"
            };

            var COUNT_FIELD_NAME = 'Count';

            var updateChartSize = function() {
                if($scope.chart) {
                    var headerHeight = 0;
                    $element.find(".header-container").each(function() {
                        headerHeight += $(this).outerHeight(true);
                    });
                    $element.find('.barchart').height($element.height() - headerHeight);
                    $scope.chart.draw();
                }
            };

            var initialize = function() {
                drawBlankChart();

                $scope.messenger.events({
                    filtersChanged: onFiltersChanged
                });

                $scope.$on('$destroy', function() {
                    XDATA.userALE.log({
                        activity: "remove",
                        action: "click",
                        elementId: "barchart",
                        elementType: "button",
                        elementSub: "barchart-bar",
                        elementGroup: "chart_group",
                        source: "user",
                        tags: ["remove", "barchart"]
                    });
                    $element.off("resize", updateChartSize);
                    $scope.messenger.removeEvents();
                    // Remove our filter if we had an active one.
                    if($scope.filterSet) {
                        filterService.removeFilters($scope.messenger, $scope.filterKeys);
                    }
                });

                $scope.$watch('options.attrX', function() {
                    XDATA.userALE.log({
                        activity: "select",
                        action: "click",
                        elementId: "barchart",
                        elementType: "combobox",
                        elementSub: "barchart-x-axis",
                        elementGroup: "chart_group",
                        source: "user",
                        tags: ["options", "barchart"]
                    });
                    if(!$scope.loadingData && $scope.options.database && $scope.options.table) {
                        $scope.queryForData(true);
                    }
                });

                $scope.$watch('options.attrY', function() {
                    XDATA.userALE.log({
                        activity: "select",
                        action: "click",
                        elementId: "barchart",
                        elementType: "combobox",
                        elementSub: "barchart-y-axis",
                        elementGroup: "chart_group",
                        source: "user",
                        tags: ["options", "barchart"]
                    });
                    if(!$scope.loadingData && $scope.options.database && $scope.options.table) {
                        $scope.queryForData(true);
                    }
                });

                $scope.$watch('options.barType', function() {
                    XDATA.userALE.log({
                        activity: "select",
                        action: "click",
                        elementId: "barchart",
                        elementType: "combobox",
                        elementSub: "barchart-aggregation",
                        elementGroup: "chart_group",
                        source: "user",
                        tags: ["options", "barchart"]
                    });
                    if(!$scope.loadingData && $scope.options.database && $scope.options.table) {
                        $scope.queryForData(false);
                    }
                });

                // This resizes the chart when the div changes.  This rely's on jquery's resize plugin to fire
                // on the associated element and not just the window.
                $element.resize(updateChartSize);
            };

            /**
             * Event handler for filter changed events issued over Neon's messaging channels.
             * @param {Object} message A Neon filter changed message.
             * @method onFiltersChanged
             * @private
             */
            var onFiltersChanged = function(message) {
                XDATA.userALE.log({
                    activity: "alter",
                    action: "query",
                    elementId: "barchart",
                    elementType: "canvas",
                    elementSub: "barchart",
                    elementGroup: "chart_group",
                    source: "system",
                    tags: ["filter-change", "barchart"]
                });

                if(message.addedFilter && message.addedFilter.databaseName === $scope.options.database && message.addedFilter.tableName === $scope.options.table) {
                    $scope.queryForData(false);
                }
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

                $scope.databases = datasetService.getDatabaseNames();
                $scope.options.database = $scope.databases[0];
                if($scope.bindDatabase && $scope.databases.indexOf($scope.bindDatabase) >= 0) {
                    $scope.options.database = $scope.bindDatabase;
                }
                $scope.filterKeys = filterService.createFilterKeys("barchart", datasetService.getDatabaseAndTableNames());

                if(initializing) {
                    $scope.updateTables();
                } else {
                    $scope.$apply(function() {
                        $scope.updateTables();
                    });
                }
            };

            $scope.updateTables = function() {
                $scope.tables = datasetService.getTableNames($scope.options.database);
                if($scope.bindTable && $scope.tables.indexOf($scope.bindTable) >= 0) {
                    $scope.options.table = $scope.bindTable;
                } else {
                    $scope.options.table = datasetService.getFirstTableNameWithMappings($scope.options.database, ["bar_x_axis", "y_axis"]) || $scope.tables[0];
                }
                $scope.updateFields();
            };

            $scope.updateFields = function() {
                $scope.loadingData = true;
                $scope.options.attrX = $scope.bindXAxisField || datasetService.getMapping($scope.options.database, $scope.options.table, "bar_x_axis") || "";
                $scope.options.attrY = $scope.bindYAxisField || datasetService.getMapping($scope.options.database, $scope.options.table, "y_axis") || "";
                $scope.fields = datasetService.getDatabaseFields($scope.options.database, $scope.options.table);
                $scope.fields.sort();
                if($scope.filterSet) {
                    $scope.clearFilterSet();
                }
                $scope.queryForData(true);
            };

            $scope.queryForData = function(rebuildChart) {
                if($scope.errorMessage) {
                    errorNotificationService.hideErrorMessage($scope.errorMessage);
                    $scope.errorMessage = undefined;
                }

                var connection = connectionService.getActiveConnection();

                if(!connection || !$scope.options.attrX || (!$scope.options.attrY && $scope.options.barType !== "count")) {
                    drawBlankChart();
                    $scope.loadingData = false;
                    return;
                }

                var query = new neon.query.Query()
                    .selectFrom($scope.options.database, $scope.options.table)
                    .where($scope.options.attrX, '!=', null)
                    .groupBy($scope.options.attrX);

                query.ignoreFilters([$scope.filterKeys[$scope.options.database][$scope.options.table]]);

                var queryType;
                if($scope.options.barType === 'count') {
                    queryType = neon.query.COUNT;
                } else if($scope.options.barType === 'sum') {
                    queryType = neon.query.SUM;
                } else if($scope.options.barType === 'average') {
                    queryType = neon.query.AVG;
                }

                if($scope.options.barType === "count") {
                    query.aggregate(queryType, '*', COUNT_FIELD_NAME);
                } else {
                    query.aggregate(queryType, $scope.options.attrY, COUNT_FIELD_NAME);
                }

                XDATA.userALE.log({
                    activity: "alter",
                    action: "query",
                    elementId: "barchart",
                    elementType: "canvas",
                    elementSub: "barchart",
                    elementGroup: "chart_group",
                    source: "system",
                    tags: ["query", "barchart"]
                });

                connection.executeQuery(query, function(queryResults) {
                    $scope.$apply(function() {
                        XDATA.userALE.log({
                            activity: "alter",
                            action: "receive",
                            elementId: "barchart",
                            elementType: "canvas",
                            elementSub: "barchart",
                            elementGroup: "chart_group",
                            source: "system",
                            tags: ["receive", "barchart"]
                        });
                        doDrawChart(queryResults, rebuildChart);
                        $scope.loadingData = false;
                        XDATA.userALE.log({
                            activity: "alter",
                            action: "render",
                            elementId: "barchart",
                            elementType: "canvas",
                            elementSub: "barchart",
                            elementGroup: "chart_group",
                            source: "system",
                            tags: ["render", "barchart"]
                        });
                    });
                }, function(response) {
                    XDATA.userALE.log({
                        activity: "alter",
                        action: "failed",
                        elementId: "barchart",
                        elementType: "canvas",
                        elementSub: "barchart",
                        elementGroup: "chart_group",
                        source: "system",
                        tags: ["failed", "barchart"]
                    });
                    drawBlankChart();
                    $scope.loadingData = false;
                    if(response.responseJSON) {
                        $scope.errorMessage = errorNotificationService.showErrorMessage($element, response.responseJSON.error, response.responseJSON.stackTrace);
                    }
                });
            };

            var drawBlankChart = function() {
                doDrawChart({
                    data: []
                }, true);
            };

            var clickFilterHandler = function(value) {
                if(!$scope.options.attrX) {
                    return;
                }

                var filterExists = $scope.filterSet ? true : false;
                handleFilterSet($scope.options.attrX, value);

                // Store the value for the filter to use during filter creation.
                $scope.filterValue = value;

                var connection = connectionService.getActiveConnection();
                if($scope.messenger && connection) {
                    var relations = datasetService.getRelations($scope.options.database, $scope.options.table, [$scope.options.attrX]);
                    if(filterExists) {
                        XDATA.userALE.log({
                            activity: "select",
                            action: "click",
                            elementId: "barchart",
                            elementType: "canvas",
                            elementSub: "barchart-bar",
                            elementGroup: "chart_group",
                            source: "user",
                            tags: ["filter", "barchart"]
                        });
                        filterService.replaceFilters($scope.messenger, relations, $scope.filterKeys, $scope.createFilterClauseForXAxis);
                    } else {
                        XDATA.userALE.log({
                            activity: "select",
                            action: "click",
                            elementId: "barchart",
                            elementType: "canvas",
                            elementSub: "barchart-bar",
                            elementGroup: "chart_group",
                            source: "user",
                            tags: ["filter", "barchart"]
                        });
                        filterService.addFilters($scope.messenger, relations, $scope.filterKeys, $scope.createFilterClauseForXAxis);
                    }
                }
            };

            /**
             * Creates and returns a filter using the given table and x-axis field using the value set by this visualization.
             * @param {String} The name of the table on which to filter
             * @param {String} The name of the x-axis field on which to filter
             * @method createFilterClauseForXAxis
             * @return {Object} A neon.query.Filter object
             */
            $scope.createFilterClauseForXAxis = function(tableName, xAxisFieldName) {
                return neon.query.where(xAxisFieldName, '=', $scope.filterValue);
            };

            var handleFilterSet = function(key, val) {
                $scope.filterSet = {
                    key: key,
                    value: val
                };
                //no need to requery because barchart ignores its own filter
            };

            var clearFilterSet = function() {
                $scope.filterSet = undefined;
            };

            $scope.clearFilterSet = function() {
                if($scope.messenger) {
                    XDATA.userALE.log({
                        activity: "deselect",
                        action: "click",
                        elementId: "barchart",
                        elementType: "button",
                        elementGroup: "chart_group",
                        source: "user",
                        tags: ["filter", "barchart"]
                    });
                    filterService.removeFilters($scope.messenger, $scope.filterKeys, function() {
                        $scope.chart.clearSelectedBar();
                        clearFilterSet();
                    });
                }
            };

            var doDrawChart = function(data, destroy) {
                var opts = {
                    data: data.data,
                    x: $scope.options.attrX,
                    y: COUNT_FIELD_NAME,
                    responsive: false,
                    clickHandler: clickFilterHandler
                };

                if($scope.filterSet && $scope.filterSet.value) {
                    opts.selectedKey = $scope.filterSet.value;
                }

                // Destroy the old chart and rebuild it.
                if($scope.chart && destroy) {
                    $scope.chart.destroy();
                    $scope.chart = new charts.BarChart($element[0], '.barchart', opts);
                } else if($scope.chart) {
                    $scope.chart.setOptsConfiguration(opts);
                } else {
                    $scope.chart = new charts.BarChart($element[0], '.barchart', opts);
                }
                updateChartSize();
            };

            $scope.getLegendText = function() {
                if($scope.options.barType === "average") {
                    return "Average " + $scope.options.attrY + " vs. " + $scope.options.attrX;
                }
                if($scope.options.barType === "sum") {
                    return "Sum " + $scope.options.attrY + " vs. " + $scope.options.attrX;
                }
                if($scope.options.barType === "count") {
                    return "Count";
                }
                return "";
            };

            neon.ready(function() {
                $scope.messenger = new neon.eventing.Messenger();
                initialize();
                $scope.displayActiveDataset(true);
            });
        }
    };
}]);
