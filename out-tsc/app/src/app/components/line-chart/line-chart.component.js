var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { YearBucketizer } from '../bucketizers/YearBucketizer';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ChartComponent } from '../chart/chart.component';
import * as moment from 'moment-timezone';
import { VisualizationService } from '../../services/visualization.service';
var LocalFilter = /** @class */ (function () {
    function LocalFilter(key, startDate, endDate, id) {
        this.key = key;
        this.startDate = startDate;
        this.endDate = endDate;
        this.id = id;
    }
    return LocalFilter;
}());
var LineChartComponent = /** @class */ (function (_super) {
    __extends(LineChartComponent, _super);
    function LineChartComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, colorSchemeSrv, ref, visualizationService) {
        var _this = _super.call(this, activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) || this;
        _this.colorByFields = [];
        _this.disabledList = [];
        _this.disabledDatasets = new Map();
        _this.selectionOffset = {
            x: 0,
            y: 0
        };
        _this.optionsFromConfig = {
            title: _this.injector.get('title', null),
            database: _this.injector.get('database', null),
            table: _this.injector.get('table', null),
            dateField: _this.injector.get('dateField', null),
            groupField: _this.injector.get('groupField', null),
            aggregation: _this.injector.get('aggregation', null),
            aggregationField: _this.injector.get('aggregationField', null),
            limit: _this.injector.get('limit', 10),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        _this.colorSchemeService = colorSchemeSrv;
        _this.active = {
            dateField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            groupField: new FieldMetaData(),
            andFilters: true,
            limit: _this.optionsFromConfig.limit,
            newLimit: _this.optionsFromConfig.limit,
            filterable: true,
            aggregation: 'count',
            dateBucketizer: null,
            granularity: 'day',
            filter: null
        };
        _this.selection = {
            mouseDown: false,
            height: 20,
            width: 20,
            x: 20,
            y: 200,
            startX: 0,
            visibleOverlay: false,
            startIndex: -1,
            endIndex: -1,
            startDate: null,
            endDate: null
        };
        _this.mouseEventValid = false;
        _this.onHover = _this.onHover.bind(_this);
        var tooltipTitleFunc = function (tooltips) {
            var index = tooltips[0].index;
            var dsIndex = tooltips[0].datasetIndex;
            // Chart.js uses moment to format the date axis, so use moment for the tooltips as well
            var date = moment(_this.active.dateBucketizer.getDateForBucket(index));
            // 'll' is the locale-specific format for displaying month, day, and year in an
            // abbreviated format. See "Localized formats" in http://momentjs.com/docs/#/displaying/format/
            var format = 'll';
            switch (_this.active.granularity) {
                case 'hour':
                    format = 'lll';
                    break;
                case 'day':
                    format = 'll';
                    break;
                case 'month':
                    format = 'MMM YYYY';
                    break;
                case 'year':
                    format = 'YYYY';
                    break;
            }
            return _this.chart.data.datasets[dsIndex].label + ' - ' + date.tz('GMT').format(format);
        };
        var tooltipDataFunc = function (tooltips) {
            return _this.active.aggregation + ': ' + tooltips.yLabel;
        };
        _this.chart = {
            type: null,
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'dataset',
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                onClick: null,
                animation: {
                    duration: 0 // general animation time
                },
                hover: {
                    mode: 'index',
                    intersect: false,
                    onHover: _this.onHover
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                            type: 'time',
                            position: 'bottom'
                        }]
                },
                tooltips: {
                    callbacks: {
                        title: tooltipTitleFunc.bind(_this),
                        label: tooltipDataFunc.bind(_this)
                    }
                }
            }
        };
        return _this;
    }
    /**
     * Returns the chart in the chart module.
     *
     * @return {object}
     * @private
     */
    LineChartComponent.prototype.getChart = function () {
        /* tslint:disable:no-string-literal */
        return this.chartModule['chart'];
        /* tslint:enable:no-string-literal */
    };
    LineChartComponent.prototype.subNgOnInit = function () {
        this.chart.type = 'line';
    };
    LineChartComponent.prototype.postInit = function () {
        // Do nothing.  An on change unfortunately kicks off the initial query.
        this.logChangeAndStartQueryChain();
        this.selectionOffset.y = this.filterContainer.nativeElement.scrollHeight;
        this.selectionOffset.x = Number.parseInt(this.getComputedStyle(this.chartContainer.nativeElement).paddingLeft || '0');
    };
    LineChartComponent.prototype.subNgOnDestroy = function () {
        this.getChart().destroy();
        this.chart.data = {
            labels: [],
            datasets: []
        };
        this.chart.options = {};
    };
    LineChartComponent.prototype.getExportFields = function () {
        var valuePrettyName = this.active.aggregation +
            (this.active.aggregationFieldHidden ? '' : '-' + this.active.aggregationField.prettyName);
        valuePrettyName = valuePrettyName.charAt(0).toUpperCase() + valuePrettyName.slice(1);
        var fields = [{
                columnName: this.active.groupField.columnName,
                prettyName: this.active.groupField.prettyName
            }, {
                columnName: 'value',
                prettyName: valuePrettyName
            }];
        switch (this.active.granularity) {
            case 'hour':
                fields.push({
                    columnName: 'hour',
                    prettyName: 'Hour'
                });
            /* falls through */
            case 'day':
                fields.push({
                    columnName: 'day',
                    prettyName: 'Day'
                });
            /* falls through */
            case 'month':
                fields.push({
                    columnName: 'month',
                    prettyName: 'Month'
                });
            /* falls through */
            case 'year':
                fields.push({
                    columnName: 'year',
                    prettyName: 'Year'
                });
        }
        return fields;
    };
    LineChartComponent.prototype.subGetBindings = function (bindings) {
        bindings.dateField = this.active.dateField.columnName;
        bindings.groupField = this.active.groupField.columnName;
        bindings.aggregation = this.active.aggregation;
        bindings.aggregationField = this.active.aggregationField.columnName;
        bindings.limit = this.active.limit;
    };
    LineChartComponent.prototype.getOptionFromConfig = function (field) {
        return this.optionsFromConfig[field];
    };
    LineChartComponent.prototype.onUpdateFields = function () {
        if (this.optionsFromConfig.aggregation) {
            this.active.aggregation = this.optionsFromConfig.aggregation;
        }
        this.active.aggregationField = this.findFieldObject('aggregationField', neonMappings.TAGS);
        this.active.dateField = this.findFieldObject('dateField', neonMappings.TAGS);
        this.active.groupField = this.findFieldObject('groupField', neonMappings.TAGS);
        this.active = Object.assign({}, this.active);
    };
    LineChartComponent.prototype.legendItemSelected = function (data) {
        var key = data.value;
        // Chartjs only seem to update if the entire data object was changed
        // Create a copy of the data object to set at the end
        var chartData = {
            labels: this.chart.data.labels,
            datasets: this.chart.data.datasets
        };
        if (data.currentlyActive) {
            var updatedDatasets = [];
            // Search for the dataset and move it to the disabled map
            for (var _i = 0, _a = chartData.datasets; _i < _a.length; _i++) {
                var dataset = _a[_i];
                if (dataset.label === key) {
                    this.disabledDatasets.set(key, dataset);
                }
                else {
                    updatedDatasets.push(dataset);
                }
            }
            // Put something in the disabled dataset map, so the value will be marked as disabled
            if (!this.disabledDatasets.get(key)) {
                this.disabledDatasets.set(key, null);
            }
            chartData.datasets = updatedDatasets;
        }
        else {
            // Check the disabled map and move it back to the normal data
            var dataset = this.disabledDatasets.get(key);
            if (dataset) {
                chartData.datasets.push(dataset);
            }
            // Make sure to remove the key from the map
            this.disabledDatasets.delete(key);
        }
        // Update the display
        this.chart.data = chartData;
        this.refreshVisualization();
        this.disabledList = Array.from(this.disabledDatasets.keys());
    };
    /**
     * returns -1 if cannot be found
     */
    LineChartComponent.prototype.getPointXLocationByIndex = function (chart, index) {
        var dsMeta = chart.controller.getDatasetMeta(0);
        if (dsMeta.data.length > index) {
            return dsMeta.data[index].getCenterPoint().x;
        }
        return -1;
    };
    LineChartComponent.prototype.mouseLeave = function (event) {
        this.mouseEventValid = false;
        this.selection.mouseDown = false;
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
    };
    LineChartComponent.prototype.mouseDown = function (event) {
        if (event.buttons > 0) {
            this.mouseEventValid = true;
        }
    };
    LineChartComponent.prototype.mouseUp = function () {
        // Do nothing.
    };
    LineChartComponent.prototype.onHover = function (event, items) {
        if (items.length === 0) {
            return;
        }
        var isMouseUp = false;
        var redraw = false;
        if (!this.selection.mouseDown && event.buttons > 0 && this.mouseEventValid) {
            // mouse down event
            this.selection.mouseDown = true;
            this.selection.startX = items[0].getCenterPoint().x;
            this.selection.startIndex = items[0]._index;
            redraw = true;
        }
        if (this.selection.mouseDown && event.buttons === 0 && this.mouseEventValid) {
            // mouse up event
            this.selection.mouseDown = false;
            this.selection.endIndex = items[0]._index;
            isMouseUp = true;
            redraw = true;
        }
        if (items && items.length > 0 && this.selection.mouseDown && this.mouseEventValid) {
            // drag event near items
            var chartArea = items[0]._chart.controller.chartArea;
            var chartBottom = chartArea.bottom;
            var chartTop = chartArea.top;
            var startIndex = this.selection.startIndex;
            var endIndex = items[0]._index;
            var endX = -1;
            var startX = -1;
            if (startIndex > endIndex) {
                var temp = startIndex;
                startIndex = endIndex;
                endIndex = temp;
            }
            // at this point, start Index is <= end index
            if (startIndex === 0) {
                // first element, so don't go off the chart
                startX = this.getPointXLocationByIndex(items[0]._chart, startIndex);
            }
            else {
                var a = this.getPointXLocationByIndex(items[0]._chart, startIndex - 1);
                var b = this.getPointXLocationByIndex(items[0]._chart, startIndex);
                startX = (b - a) / 2 + a;
            }
            if (endIndex >= this.chart.data.labels.length - 1) {
                // last element, so don't go off the chart
                endX = this.getPointXLocationByIndex(items[0]._chart, endIndex);
            }
            else {
                var a = this.getPointXLocationByIndex(items[0]._chart, endIndex);
                var b = this.getPointXLocationByIndex(items[0]._chart, endIndex + 1);
                endX = (b - a) / 2 + a;
            }
            this.selection.width = Math.abs(startX - endX);
            this.selection.x = Math.min(startX, endX);
            this.selection.height = chartBottom - chartTop;
            this.selection.y = chartTop;
            redraw = true;
        }
        if (isMouseUp) {
            // The button was clicked, handle the selection.
            var start = this.active.dateBucketizer.getDateForBucket(this.selection.startIndex), end = this.active.dateBucketizer.getDateForBucket(this.selection.endIndex), invert = start > end;
            this.selection.startDate = invert ? end : start;
            this.selection.endDate = invert ? start : end;
            var key = this.active.dateField.columnName;
            var f = new LocalFilter(key, this.selection.startDate, this.selection.endDate);
            if (this.active.filter) {
                f.id = this.active.filter.id;
                this.replaceNeonFilter(true, f);
            }
            else {
                this.addNeonFilter(true, f);
            }
            redraw = true;
        }
        this.stopEventPropagation(event);
        if (redraw) {
            this.changeDetection.detectChanges();
        }
    };
    LineChartComponent.prototype.createNeonFilterClauseEquals = function (database, table, fieldName) {
        if (typeof fieldName === 'string') {
            var filterClauses = [];
            filterClauses[0] = neon.query.where(fieldName, '>=', this.selection.startDate);
            var endDatePlusOne = this.selection.endDate.getTime() + this.active.dateBucketizer.getMillisMultiplier();
            var endDatePlusOneDate = new Date(endDatePlusOne);
            filterClauses[1] = neon.query.where(fieldName, '<', endDatePlusOneDate);
            return neon.query.and.apply(neon.query, filterClauses);
        }
        else {
            return null;
        }
    };
    LineChartComponent.prototype.getFilterText = function () {
        // I.E. test - earthquakes - time = 10/11/2015 to 5/1/2016"
        var database = this.meta.database.name;
        var table = this.meta.table.name;
        var field = this.active.dateField.columnName;
        var text = database + ' - ' + table + ' - ' + field + ' = ';
        var date = this.selection.startDate;
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        date = this.selection.endDate;
        text += ' to ';
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        return text;
    };
    LineChartComponent.prototype.getNeonFilterFields = function () {
        return [this.active.dateField.columnName];
    };
    LineChartComponent.prototype.getVisualizationName = function () {
        return 'Line Chart';
    };
    LineChartComponent.prototype.refreshVisualization = function () {
        this.getChart().update();
    };
    LineChartComponent.prototype.isValidQuery = function () {
        var valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dateField && this.active.dateField.columnName && valid);
        valid = (this.active.aggregation && valid);
        if (valid && this.active.aggregation !== 'count') {
            var aggCol = this.active.aggregationField.columnName;
            valid = aggCol && valid && aggCol !== '';
        }
        return valid;
    };
    LineChartComponent.prototype.createQuery = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var query = new neon.query.Query().selectFrom(databaseName, tableName);
        var whereClause = neon.query.where(this.active.dateField.columnName, '!=', null);
        var yAxisField = this.active.aggregationField.columnName;
        var dateField = this.active.dateField.columnName;
        var groupField = this.active.groupField.columnName;
        query = query.aggregate(neonVariables.MIN, dateField, 'date');
        var groupBys = [];
        switch (this.active.granularity) {
            case 'hour':
                groupBys.push(new neon.query.GroupByFunctionClause('hour', dateField, 'hour'));
            /* falls through */
            case 'day':
                groupBys.push(new neon.query.GroupByFunctionClause('dayOfMonth', dateField, 'day'));
            /* falls through */
            case 'month':
                groupBys.push(new neon.query.GroupByFunctionClause('month', dateField, 'month'));
            /* falls through */
            case 'year':
                groupBys.push(new neon.query.GroupByFunctionClause('year', dateField, 'year'));
        }
        groupBys.push(groupField);
        query = query.groupBy(groupBys);
        // we assume sorted by date later to get min and max date!
        query = query.sortBy('date', neonVariables.ASCENDING);
        query = query.where(whereClause);
        switch (this.active.aggregation) {
            case 'count':
                return query.aggregate(neonVariables.COUNT, '*', 'value');
            case 'sum':
                return query.aggregate(neonVariables.SUM, yAxisField, 'value');
            case 'average':
                return query.aggregate(neonVariables.AVG, yAxisField, 'value');
            case 'min':
                return query.aggregate(neonVariables.MIN, yAxisField, 'value');
            case 'max':
                return query.aggregate(neonVariables.MAX, yAxisField, 'value');
        }
    };
    LineChartComponent.prototype.getColorFromScheme = function (name) {
        return this.colorSchemeService.getColorFor(this.active.groupField.columnName, name).toRgb();
    };
    LineChartComponent.prototype.getFiltersToIgnore = function () {
        return null;
    };
    LineChartComponent.prototype.onQuerySuccess = function (response) {
        this.disabledDatasets.clear();
        this.disabledList = [];
        // need to reset chart when data potentially changes type (or number of datasets)
        var dataSetField = this.active.groupField.columnName;
        var myData = {};
        switch (this.active.granularity) {
            case 'hour':
                this.active.dateBucketizer = new DateBucketizer();
                this.active.dateBucketizer.setGranularity(DateBucketizer.HOUR);
                break;
            case 'day':
                this.active.dateBucketizer = new DateBucketizer();
                this.active.dateBucketizer.setGranularity(DateBucketizer.DAY);
                break;
            case 'month':
                this.active.dateBucketizer = new MonthBucketizer();
                break;
            case 'year':
                this.active.dateBucketizer = new YearBucketizer();
                break;
        }
        var datasets = [], // TODO type to chartjs
        labels = this.chart.data.labels || []; // maintain previous labels in case no data was returned
        if (response.data.length > 0) {
            var bucketizer = this.active.dateBucketizer;
            bucketizer.setStartDate(new Date(response.data[0].date));
            bucketizer.setEndDate(new Date(response.data[response.data.length - 1].date));
            var length_1 = bucketizer.getNumBuckets();
            var fillValue = (this.active.aggregation === 'count' ? 0 : null);
            var numDatasets = 0;
            var totals = {};
            for (var _i = 0, _a = response.data; _i < _a.length; _i++) {
                var row = _a[_i];
                if (row[dataSetField]) {
                    var dataSet = row[dataSetField];
                    var idx = bucketizer.getBucketIndex(new Date(row.date));
                    var ds = myData[dataSet];
                    if (!ds) {
                        myData[dataSet] = new Array(length_1).fill(fillValue);
                        totals[dataSet] = 0;
                        numDatasets++;
                    }
                    myData[dataSet][idx] = row.value;
                    totals[dataSet] += row.value;
                }
            }
            var datasetIndex = 0;
            for (var datasetName in myData) {
                if (myData.hasOwnProperty(datasetName)) {
                    var colorString = this.getColorFromScheme(datasetName);
                    var d = {
                        label: datasetName,
                        data: myData[datasetName],
                        borderColor: colorString,
                        pointBorderColor: colorString,
                        total: totals[datasetName]
                    };
                    datasets.push(d);
                    datasetIndex++;
                }
            }
            datasets = datasets.sort(function (a, b) {
                return b.total - a.total;
            });
            if (datasets.length > this.active.limit) {
                datasets = datasets.slice(0, this.active.limit);
            }
            labels = new Array(length_1);
            for (var i = 0; i < length_1; i++) {
                var date = bucketizer.getDateForBucket(i);
                var dateString = null;
                switch (this.active.granularity) {
                    case 'hour':
                        dateString = this.dateToIsoDayHour(date);
                        break;
                    case 'day':
                        dateString = this.dateToIsoDay(date);
                        break;
                    case 'month':
                        dateString = this.dateToIsoMonth(date);
                        break;
                    case 'year':
                        dateString = this.dateToIsoYear(date);
                        break;
                }
                labels[i] = dateString;
            }
        }
        this.chart.data = {
            labels: labels,
            datasets: datasets
        };
        this.refreshVisualization();
        var title = '';
        switch (this.active.aggregation) {
            case 'count':
                title = 'Count';
                break;
            case 'average':
                title = 'Average';
                break;
            case 'sum':
                title = 'Sum';
                break;
            case 'min':
                title = 'Minimum';
                break;
            case 'max':
                title = 'Maximum';
                break;
        }
        if (this.active.groupField && this.active.groupField.prettyName) {
            title += ' by ' + this.active.groupField.prettyName;
        }
        this.updateLegend();
        // THOR-252: only way to know if filter was applied is to wait for querySuccess. See #onHover
        this.setupFilters();
    };
    LineChartComponent.prototype.updateLegend = function () {
        this.colorByFields = [this.active.groupField.columnName];
    };
    LineChartComponent.prototype.dateToIsoDayHour = function (date) {
        // 2017-03-09T15:21:01Z
        var ret = this.dateToIsoDay(date);
        var tmp = date.getUTCHours();
        var hours = String(tmp);
        hours = (tmp < 10 ? '0' + hours : hours);
        tmp = date.getUTCMinutes();
        var mins = String(tmp);
        mins = (tmp < 10 ? '0' + mins : mins);
        tmp = date.getUTCSeconds();
        var secs = String(tmp);
        secs = (tmp < 10 ? '0' + secs : secs);
        ret += 'T' + hours + ':' + mins + ':' + secs + 'Z';
        return ret;
    };
    LineChartComponent.prototype.dateToIsoDay = function (date) {
        // 2017-03-09
        // TODO is there a better way to get date into ISO format so moment is happy?
        var tmp = date.getUTCMonth() + 1;
        var month = String(tmp);
        month = (tmp < 10 ? '0' + month : month);
        tmp = date.getUTCDate();
        var day = String(date.getUTCDate());
        day = (tmp < 10 ? '0' + day : day);
        return date.getUTCFullYear() + '-' + month + '-' + day;
    };
    LineChartComponent.prototype.dateToIsoMonth = function (date) {
        var tmp = date.getUTCMonth() + 1;
        var month = String(tmp);
        month = (tmp < 10 ? '0' + month : month);
        return date.getUTCFullYear() + '-' + month;
    };
    LineChartComponent.prototype.dateToIsoYear = function (date) {
        return '' + date.getUTCFullYear();
    };
    LineChartComponent.prototype.handleChangeAggregation = function () {
        this.active.aggregationFieldHidden = (this.active.aggregation === 'count');
        this.logChangeAndStartQueryChain();
    };
    LineChartComponent.prototype.handleChangeGranularity = function () {
        this.logChangeAndStartQueryChain();
    };
    LineChartComponent.prototype.setupFilters = function () {
        var localFilters = [], filters = this.filterService.getFiltersForFields(this.meta.database.name, this.meta.table.name, [this.active.dateField.columnName]);
        for (var _i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
            var filter = filters_1[_i];
            var whereClause = filter.filter.whereClause;
            if (whereClause && whereClause.whereClauses.length === 2) {
                localFilters.push(new LocalFilter(whereClause.whereClauses[0].lhs, whereClause.whereClauses[0].rhs, whereClause.whereClauses[1].rhs, filter.id));
            }
        }
        this.active.filter = localFilters.length ? localFilters[0] : null;
    };
    /**
     * Updates the limit, resets the seen bars, and reruns the bar chart query.
     */
    LineChartComponent.prototype.handleChangeLimit = function () {
        if (_super.prototype.isNumber.call(this, this.active.newLimit)) {
            var newLimit = parseFloat('' + this.active.newLimit);
            if (newLimit > 0) {
                this.active.limit = newLimit;
                // TODO THOR-526 Redraw the line chart but do not requery because we can use the same data from the original query.
                this.logChangeAndStartQueryChain();
            }
            else {
                this.active.newLimit = this.active.limit;
            }
        }
        else {
            this.active.newLimit = this.active.limit;
        }
    };
    LineChartComponent.prototype.handleChangeDateField = function () {
        this.logChangeAndStartQueryChain();
    };
    LineChartComponent.prototype.handleChangeGroupField = function () {
        this.logChangeAndStartQueryChain();
    };
    LineChartComponent.prototype.handleChangeAggregationField = function () {
        this.logChangeAndStartQueryChain();
    };
    LineChartComponent.prototype.handleChangeAndFilters = function () {
        this.logChangeAndStartQueryChain();
    };
    LineChartComponent.prototype.logChangeAndStartQueryChain = function () {
        if (!this.initializing) {
            this.executeQueryChain();
        }
    };
    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    LineChartComponent.prototype.getButtonText = function () {
        if (!this.chart.data.labels || !this.chart.data.labels.length) {
            return 'No Data';
        }
        if (this.chart.data.labels.length <= this.active.limit) {
            return 'Total ' + _super.prototype.prettifyInteger.call(this, this.chart.data.labels.length);
        }
        return _super.prototype.prettifyInteger.call(this, this.active.limit) + ' of ' + _super.prototype.prettifyInteger.call(this, this.chart.data.labels.length);
    };
    LineChartComponent.prototype.getFilterTitle = function (filter) {
        return filter.startDate + ' >= ' + this.active.dateField.columnName + ' < ' + filter.endDate;
    };
    LineChartComponent.prototype.getFilterCloseText = function (value) {
        return value;
    };
    LineChartComponent.prototype.getRemoveFilterTooltip = function (filter) {
        return 'Delete Filter ' + this.getFilterTitle(filter);
    };
    LineChartComponent.prototype.removeFilter = function () {
        this.setupFilters();
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    LineChartComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], LineChartComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], LineChartComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], LineChartComponent.prototype, "infoText", void 0);
    __decorate([
        ViewChild('myChart'),
        __metadata("design:type", ChartComponent)
    ], LineChartComponent.prototype, "chartModule", void 0);
    __decorate([
        ViewChild('filterContainer'),
        __metadata("design:type", ElementRef)
    ], LineChartComponent.prototype, "filterContainer", void 0);
    __decorate([
        ViewChild('chartContainer'),
        __metadata("design:type", ElementRef)
    ], LineChartComponent.prototype, "chartContainer", void 0);
    LineChartComponent = __decorate([
        Component({
            selector: 'app-line-chart',
            templateUrl: './line-chart.component.html',
            styleUrls: ['./line-chart.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ColorSchemeService, ChangeDetectorRef, VisualizationService])
    ], LineChartComponent);
    return LineChartComponent;
}(BaseNeonComponent));
export { LineChartComponent };
//# sourceMappingURL=line-chart.component.js.map