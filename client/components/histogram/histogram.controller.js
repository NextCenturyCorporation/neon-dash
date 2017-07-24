'use strict';

/*
 * Copyright 2017 Next Century Corporation
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

/*
 * This visualization shows aggregated numerical data in a timeline.
 * @namespace neonDemo.controllers
 * @class histogramController
 * @constructor
 */
angular.module('neonDemo.controllers').controller('histogramController', ['$scope', '$timeout', '$interval', '$filter', 'opencpu', function($scope, $timeout, $interval, $filter, opencpu) {
    $scope.active.OPENCPU = opencpu;
    $scope.active.LINEAR_SCALE = 'linear';
    $scope.active.LOG_SCALE = 'logarithmic';

    $scope.data = [];
    $scope.bucketizer = numberBucketizer();
    $scope.referenceStartValue = undefined;
    $scope.referenceEndValue = undefined;

    // The extent filter for the chart brush. Contains either nothing or startValue and endValue fields.
    $scope.extent = {};

    $scope.active.startValueForDisplay = undefined;
    $scope.active.endValueForDisplay = undefined;
    $scope.active.filter = {
        start: undefined,
        end: undefined
    };

    // Menu options
    $scope.active.bucketField = {};
    $scope.active.numberValid = 0;
    $scope.active.primarySeries = undefined;
    $scope.active.showFocus = 'on_filter';
    $scope.active.yAxisScale = $scope.active.LINEAR_SCALE;

    // Animation controls.
    $scope.active.animatingTime = false;
    $scope.active.animationFrame = 0;
    $scope.active.animationStartFrame = 0;
    $scope.active.animationFrameDelay = 250;
    $scope.active.showAnimationControls = false;

    var valuesEqual = function(a, b) {
        return a === b;
    };

    var getValuePickerStart = function() {
        return $scope.active.filter.start;
    };

    var setValuePickerStart = function(start) {
        $scope.active.filter.start = start;
    };

    var getValuePickerEnd = function() {
        return $scope.active.filter.end;
    };

    var setValuePickerEnd = function(end) {
        $scope.active.filter.end = end;
    };




    // Animation methods go here. Need to do the other stuff first.



    var nextNonEmptyBucket = function(startBucket, maxBucket) {
        if(startBucket >= maxBucket) { // MaxBucket is exclusive
            return -1;
        }
        var index = startBucket;
        while(index < maxBucket) {
            if($scope.data[index].count > 0) {
                break;
            }
            index++;
        }
        return (index === maxBucket) ? -1 : index; 
    };



    // Another animation method here



    var previousNonEmptyBucket = function(startBucket, minBucket) {
        if(startBucket < minBucket) { // MinBucket is inclusive
            return -1;
        }
        var index = startBucket;
        while(index >= minBucket) {
            if($scope.data[index].count > 0) {
                break;
            }
            index--;
        }
        return (index === minBucket - 1) ? -1 : index; 
    };



    // Another animation method here

    // handleDateTimePickChange, handleDateTimePickSave, and handleDateTimePickCancel deal with the calendar thing and aren't needed.

    // updateBucketizer is unnecessary.



    // var updateDates = function() {} // Don't think we need these. Might if filtering is implemented via a numberline equivalent of the two calendars.
    // var setDisplayDates = function(startDate, endDate) {}
    // var clearDisplayDates = function() {}



    // $scope.formatStartDate and $scope.formatEndDate are unnecessary


    $scope.functions.onInit = function() {
        $scope.chart = new charts.HistogramSelectorChart($scope.functions.getElement(".histogram-selector-chart")[0]);
        $scope.chart.setBucketizer($scope.bucketizer);
        $scope.chart.render([]);

        $scope.chart.addBrushHandler(function(extent) {
            // Wrap our extent change in $apply since this is fired from a D3 event and outside of angular's digest cycle.
            $scope.$apply(function() {
                XDATA.userALE.log({
                    activity: "select",
                    action: "click",
                    elementId: "histogram-range",
                    elementType: "canvas",
                    elementGroup: "chart_group",
                    source: "user",
                    tags: ["histogram", "filter"]
                });

                $scope.extent = extent;
                onChangeFilter();

                if($scope.active.showFocus === "on_filter") {
                    $scope.chart.toggleFocus(true);
                }
            });
        });

        $scope.active.yAxisScale = $scope.bindings.yAxisScale === $scope.active.LOG_SCALE ? $scope.active.LOG_SCALE : $scope.active.LINEAR_SCALE;
    }

    // onDateSelected is unnecessary

    $scope.functions.onResize = function(elementHeight, elementWidth, titleHeight, headersHeight) {
        if($scope.chart) {
            // TODO Fix size calculations in the timeline selector chart so we don't have to add/subtract these values to make the chart fit the visualization.
            $scope.chart.config.height = elementHeight - headersHeight - 20;
            $scope.chart.config.width = elementWidth + 30;

            if($scope.active.showFocus === "always" || ($scope.active.showFocus === "on_filter" && $scope.extent.start !== undefined && $scope.extent.end !== undefined)) {
                $scope.chart.toggleFocus(true);
            } else {
                $scope.chart.toggleFocus(false);
            }
        }
    };

    // resizeDateTimePickerDropdownToggle is unnecessary

    // $scope.handleChangeGranularity is unnecessary

    var onChangeFilter = function() {
        if($scope.extent.start !== undefined && $scope.extent.end !== undefined) {
            if($scope.extent.start === $scope.extent.end && $scope.bucketizer.getStartValue() !== undefined && $scope.bucketizer.getEndValue() !== undefined) {
                $scope.removeFilter();
                return;
            }
            if($scope.extent.start === $scope.bucketizer.getStartValue() && $scope.extent.end === $scope.bucketizer.getEndValue()) {
                $scope.removeFilter();
                return;
            }
        }

        if($scope.extent.start === undefined && $scope.extent.end === undefined) {
            $scope.chart.clearBrush();
        }

        setValuePickerStart($scope.extent.start || $scope.bucketizer.getStartValue());
        setValuePickerEnd($scope.extent.end || $scope.bucketizer.getEndValue());

        $scope.chart.renderExtent($scope.extent);

        updateChartTimesAndTotal();

        if($scope.extent.start === undefined && $scope.extent.end === undefined) {
            $scope.functions.updateNeonFilter();
        }

        if($scope.showFocus === "on_filter") {
            $scope.chart.toggleFocus($scope.extent.start === undefined && $scope.extent.end === undefined);
        }
    };

    $scope.handleChangeYAxisScale = function() {
        XDATA.userALE.log({
            activity: "alter",
            action: "click",
            elementId: "histogram",
            elementType: "button",
            elementSub: "showFocus",
            elementGroup: "chart_group",
            source: "user",
            tags: ["histogram", "yAxisScale", $scope.active.yAxisScale]
        });

        $scope.chart.setYAxisScaleLogarithmic($scope.active.yAxisScale === $scope.active.LOG_SCALE);
        $scope.chart.redrawChart();
    };

    $scope.handleChangeShowFocus = function() {
        XDATA.userALE.log({
            activity: "alter",
            action: "click",
            elementId: "histogram",
            elementType: "button",
            elementSub: "showFocus",
            elementGroup: "chart_group",
            source: "user",
            tags: ["histogram", "showFocus", $scope.active.showFocus]
        });

        if($scope.active.showFocus === 'always') {
            $scope.chart.toggleFocus(true);
        } else if($scope.active.showFocus === 'never') {
            $scope.chart.toggleFocus(false);
        } else if($scope.active.showFocus === 'on_filter' && $scope.extent.start !== undefined && scope.extent.end !== undefined) {
            $scope.chart.toggleFocus(true);
        }
    };

    $scope.functions.createFilterTrayText = function() {
        return ($scope.extent.start || $scope.bucketizer.getStartValue()) + " to " + ($scope.extent.end || $scope.bucketizer.getEndValue());
    };

    // $scope.handleToggleInvalidDateFilter is unnecessary



    // $scope.handleToggleShowAnimationControls goes here



    $scope.functions.createNeonFilterClause = function(databaseAndTableName, fieldName) {
        var clauses = [];
        var startValue = $scope.extent.start || $scope.bucketizer.getStartValue();
        var endValue = $scope.extent.end || $scope.bucketizer.getEndValue();
        var startFilterClause = neon.query.where(fieldName, '>=', startValue);
        var endFilterClause = neon.query.where(fieldName, '<', endValue);
        clauses = [startFilterClause, endFilterClause];
        return neon.query.and.apply(this, clauses);
    };

    // getFilterStartDate and getFilterEndDate are unnecessary

    $scope.functions.isFilterSet = function() {
        return $scope.extent.start !== undefined && $scope.extent.end !== undefined;
    };

    $scope.functions.areDataFieldsValid = function() {
        return $scope.functions.isFieldValid($scope.active.groupField); // Should I be using groupField here? I don't know.
    };

    $scope.functions.getFilterFields = function() {
        return [$scope.active.groupField]; // Same question as above. Should I be using groupField here?
    }

        $scope.functions.updateFilterValues = function(neonFilter) {
        if($scope.functions.getNumberOfFilterClauses(neonFilter) === 2) {
            $scope.extent.start = neonFilter.whereClause.whereClauses[0].rhs;
            $scope.extent.end = neonFilter.whereClause.whereClauses[1].lhs;
            setValuePickerStart($scope.extent.start);
            setValuePickerEnd($scope.extent.end);
        }
    };

    $scope.functions.removeFilterValues = function() {
        $scope.extent = {};
        onChangeFilter();
    };

    $scope.functions.onUpdateFields = function() {
        $scope.active.groupField = $scope.functions.findFieldObject("groupField", neonMappings.GROUP);
    };

    $scope.functions.onChangeOption = function() {
        $scope.bucketizer.setStartValue(undefined);
        // clearDisplayDates();
        $scope.referenceStartValue = undefined;
        $scope.referenceEndValue = undefined;
        $scope.data = [];
    };

    // $scope.buildValidDatesQuery and $scope.buildInvalidDatesQuery are unnecessary

    $scope.functions.addToQuery = function(query, unsharedFilterWhereClause) {
        var buckets = [];
        var lowerBound = $scope.bucketizer.getStartValue() || $scope.referenceStartValue;
        var upperBound = $scope.bucketizer.getEndValue() || $scope.referenceEndValue;
        while(lowerBound <upperBound) {
            buckets.push({
                bottom: lowerBound,
                top: lowerBound + $scope.bucketizer.getBucketSize()
            });
            lowerBound += bucketSize;
        }
        var bucketGroupClause = new neon.query.GroupByBucketClause(buckets, $scope.active.groupField.columnName);

        query.where(unsharedFilterWhereClause);
        query.groupBy(bucketGroupClause);
        return query;
    };

    $scope.functions.executeQuery = function(connection, query) {
        return connection.executeQuery(query);
    };

    var updateChartTimesAndTotal = function() {
        $scope.chart.updatePrimarySeries($scope.data); // TODO fix this if there is no "updatePrimarySeries" method in the chart when all's said and done.
        $scope.chart.render($scope.data);
        $scope.chart.renderExtent($scope.extent); // TODO this might break right now because I think this method expects an array. 

        // Handle bound conditions.

        var extentStartValue = ($scope.extent.start !== undefined) ? $scope.extent.start : $scope.bucketizer.getStartValue();
        var extentEndValue = ($scope.extent.end !== undefined) ? $scope.extent.end : $scope.bucketizer.getEndValue();
        
        var total = 0;

        if(extentStartValue && extentEndValue) {
            var startIdx = $scope.bucketizer.getBucketIndex(extentStartValue);
            var endIdx = $scope.bucketizer.getBucketIndex(extentEndValue);

            // Update the start/end times and totals used for the Neon selection and their
            // display versions.  Since Angular formats dates as local values, we create new display values
            // for the appropriate date we want to appear in this directive's associated partial.
            // This essentially shifts the display times from local to the value we want to appear in UTC time.

            // endIdx points to the start of the day/hour just after the buckets we want to count, so do not
            // include the bucket at endIdx.
            for(i = startIdx; i < endIdx; i++) {
                if($scope.data[i]) {
                    total += $scope.data[i].value;
                }
            }
        }

        if(isNaN(extentStartValue) || isNaN(extentEndValue)) {
            clearDisplayDates();
        }   //else {
            // neon.safeApply($scope, function() {
            //     setDisplayDates(extentStartValue, extentEndValue);
            // });
            //}

        $scope.active.numberValid = total;
    };

    $scope.functions.updateData = function(data) {
        if(!$scope.bucketizer.getStartValue() || !$scope.bucketizer.getEndValue()) {
            queryForMinAndMaxValues();
        }
        if(data && data.length > 0) {
            var updateValuesCallback = function() {
                var histogramData = createHistogramData(data);
                $scope.data = histogramData;
                //$scope.active.showNoDataError = 
                console.log($scope.data);
            }
        }
    };

    var queryForMinAndMaxValues = function(callback) {
        var queryForStartValue = true, queryforEndValue = true;
        if($scope.bindings.overrideStartValue) {
            $scope.referenceStartValue = $scope.bindings.overrideStartValue;
            queryForStartValue = false;
        }
        if($scope.bindings.overrideEndValue) {
            $scope.referenceEndValue = $scope.bindings.overrideEndValue;
            queryforEndValue = false;
        }
        if(queryForStartValue && !queryforEndValue) {
            if(callback) {
                callback();
            }
        }
        else {
            $scope.functions.queryAndUpdate({
                addToQuery: function(query) {
                    var maxQuery = angular.copy(query);
                    query.sortBy($scope.active.groupField.columnName, neon.query.ASCENDING).limit(1).ignoreFilters();
                    maxQuery.sortBy($scope.active.groupField.columnName, neon.query.DESCENDING).limit(1).ignoreFilters();
                    var group = new neon.query.QueryGroup();
                    if(queryForStartValue) {
                        group.addQuery(query);
                    }
                    if(queryforEndValue) {
                        group.addQuery(maxQuery);
                    }
                    return group;
                },
                executeQuery: function(connection, query) {
                    return connection.executeQueryGroup(query);
                },
                updateData: function(data) {
                    if(queryForStartValue) {
                        $scope.referenceStartValue = data[0].bottom;
                        if(queryforEndValue) {
                            $scope.referenceEndValue = data[1].top;
                        }
                    }
                    else {
                        $scope.referenceEndValue = data[0].top;
                    }
                    $scope.bucketizer.setStartValue($scope.referenceStartValue);
                    $scope.bucketizer.setEndValue($scope.referenceEndValue);
                }
            });
        }
    };

    var getValues = function(dataItem) {
        return neon.helpers.getNestedValues(dataItem, [$scope.active.groupField.columnName]).filter(function(value) {
            return value[$scope.active.groupField.columnName];
        }).map(function(value) {
            return new Date(value[$scope.active.groupField.columnName]);
        }).sort(function(a, b) {
            return a - b;
        });
    };

    var createHistogramData = function(data) {
        var queryData = [];

        if(data.length > 0) {
            var numBuckets = $scope.bucketizer.getNumBuckets();
            for(var i = 0; i < numBuckets; i++) {
                var bucket = $scope.bucketizer.getRangeForBucket(i);
                queryData[i] = {
                    bottom: bucket.bottom,
                    top: bucket.top,
                    value: 0
                };
            }
            for(var i = 0; i < data.length; i++) {
                var bucketIndex = $scope.bucketizer.getBucketIndex(data[i].bottom + ((data[i].top - data[i].bottom) / 2));
                if(queryData[bucketIndex]) {
                    queryData[bucketIndex].value += data[i].count;
                }
            }
        }

        return [{
            name: 'Total',
            type: 'bar',
            color: '#39b54a',
            data: queryData            
        }];
    };

    // addTimeSeriesAnalysis and runMMPP and addMmppTimeSeriesAnalysis and addStl2TimeSeriesAnalysis and addAnomalyDetectionAnalysis are unnecessary

    $scope.removeFilter = function() {
        if($scope.bucketizer.getStartValue() && $scope.bucketizer.getEndValue()) {
            setValuePickerStart($scope.bucketizer.getStartValue());
            setValuePickerEnd($scope.bucketIndex.getEndValue());
        }
        scope.functions.removeNeonFilter();
    };

    $scope.handleChangeGroupField = function() {
        $scope.functions.logChangeAndUpdate("groupField", $scope.active.groupField.columnName);
    };

    $scope.functions.createExportDataObject = function(exportId, query) {
        // TODO Fill this in.
        return {};
    };

    $scope.functions.addToBindings = function(bindings) {
        bindings.groupField = $scope.functions.isFieldValid($scope.active.groupField) ? $scope.active.groupField.columnName : undefined;
        bindings.yAxisScale = $scope.active.yAxisScale || undefined;
        return bindings;
    };

    $scope.functions.createMenuText = function() {
        return ($scope.active.numberValid || "No") + " Valid Records";
    };

    $scope.functions.getVisualizationName = function() {
        return "Histogram";
    };

    $scope.functions.showMenuText = function() {
        return $scope.active.numberValid || '';
    };

    $scope.functions.hideHeaders = function() {
        return false;
    };

    $scope.getFilterData = function() {
        return $scope.showInvalidDatesFilter ? ["All Invalid Dates"] : ($scope.extent.length ? ["Date Filter"] : []);
    };

    $scope.getFilterDesc = function() {
        return $scope.showInvalidDatesFilter ? "All Invalid Dates" : "Date from " + $scope.active.startDateForDisplay + " to " + $scope.active.endDateForDisplay;
    };

    $scope.getFilterText = function(value) {
        return value;
    };
}]);