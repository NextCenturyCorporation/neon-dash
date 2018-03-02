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
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ChartComponent } from '../chart/chart.component';
import { VisualizationService } from '../../services/visualization.service';
/**
 * Data used to draw the scatter plot
 */
var ScatterPlotData = /** @class */ (function () {
    function ScatterPlotData() {
        this.xLabels = [];
        this.yLabels = [];
        this.labels = [];
        // The data to graph
        this.datasets = [];
    }
    return ScatterPlotData;
}());
/**
 * One set of bars to draw
 */
var ScatterDataSet = /** @class */ (function () {
    function ScatterDataSet(color) {
        this.fill = false;
        this.showLine = false;
        this.borderWidth = 1;
        // The data
        this.data = [];
        this.color = color;
        this.setActive();
    }
    /**
     * Set the background color to the default color of this set
     */
    ScatterDataSet.prototype.setInactive = function () {
        for (var _i = 0, _a = this.data; _i < _a.length; _i++) {
            var item = _a[_i];
            this.backgroundColor = this.color.getInactiveRgba();
            this.borderColor = this.backgroundColor;
        }
    };
    /**
     * Set the background color of the set to the active color
     */
    ScatterDataSet.prototype.setActive = function () {
        this.backgroundColor = this.color.toRgb();
        this.borderColor = this.backgroundColor;
    };
    return ScatterDataSet;
}());
var ScatterPlotComponent = /** @class */ (function (_super) {
    __extends(ScatterPlotComponent, _super);
    function ScatterPlotComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, colorSchemeSrv, ref, visualizationService) {
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
            xField: _this.injector.get('xField', null),
            yField: _this.injector.get('yField', null),
            labelField: _this.injector.get('labelField', null),
            colorField: _this.injector.get('colorField', null),
            limit: _this.injector.get('limit', 200),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            displayGridLines: _this.injector.get('displayGridLines', true),
            displayTicks: _this.injector.get('displayTicks', true)
        };
        _this.colorSchemeService = colorSchemeSrv;
        _this.filters = [];
        _this.mouseEventValid = false;
        _this.active = {
            xField: new FieldMetaData(),
            yField: new FieldMetaData(),
            labelField: new FieldMetaData(),
            andFilters: true,
            limit: _this.optionsFromConfig.limit,
            newLimit: _this.optionsFromConfig.limit,
            filterable: true,
            layers: [],
            xAxisIsNumeric: true,
            yAxisIsNumeric: true,
            pointLabels: []
        };
        _this.selection = {
            mouseDown: false,
            height: 20,
            width: 20,
            x: 20,
            y: 200,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            visibleOverlay: false
        };
        _this.onHover = _this.onHover.bind(_this);
        _this.xAxisTickCallback = _this.xAxisTickCallback.bind(_this);
        _this.yAxisTickCallback = _this.yAxisTickCallback.bind(_this);
        var tooltipTitleFunc = function (tooltips) {
            return _this.active.pointLabels[tooltips[0].index];
        };
        var tooltipDataFunc = function (tooltips) {
            var dataPoint = _this.chart.data.datasets[tooltips.datasetIndex].data[tooltips.index];
            var xLabel;
            var yLabel;
            if (_this.active.xAxisIsNumeric) {
                xLabel = dataPoint.x;
            }
            else {
                xLabel = _this.chart.data.xLabels[dataPoint.x];
            }
            if (_this.active.yAxisIsNumeric) {
                yLabel = dataPoint.y;
            }
            else {
                yLabel = _this.chart.data.yLabels[dataPoint.y];
            }
            return _this.active.xField.prettyName + ': ' + xLabel + '  ' + _this.active.yField.prettyName + ': ' + yLabel;
        };
        _this.chart = {
            type: 'scatter',
            data: new ScatterPlotData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                animation: {
                    duration: 0 // general animation time
                },
                hover: {
                    mode: 'point',
                    intersect: false,
                    onHover: _this.onHover
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                            gridLines: {
                                display: _this.optionsFromConfig.displayGridLines
                            },
                            ticks: {
                                display: _this.optionsFromConfig.displayTicks,
                                callback: _this.xAxisTickCallback
                            },
                            position: 'bottom',
                            type: 'linear'
                        }],
                    yAxes: [{
                            gridLines: {
                                display: _this.optionsFromConfig.displayGridLines
                            },
                            ticks: {
                                display: _this.optionsFromConfig.displayTicks,
                                callback: _this.yAxisTickCallback
                            },
                            type: 'linear'
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
    ScatterPlotComponent.prototype.getChart = function () {
        /* tslint:disable:no-string-literal */
        return this.chartModule['chart'];
        /* tslint:enable:no-string-literal */
    };
    ScatterPlotComponent.prototype.subNgOnInit = function () {
        // do nothing
    };
    ScatterPlotComponent.prototype.postInit = function () {
        this.executeQueryChain();
        this.defaultActiveColor = this.getPrimaryThemeColor();
        this.chart.data.datasets.push(new ScatterDataSet(this.defaultActiveColor));
        this.selectionOffset.y = this.filterContainer.nativeElement.scrollHeight;
        this.selectionOffset.x = Number.parseInt(this.getComputedStyle(this.chartContainer.nativeElement).paddingLeft || '0');
    };
    ScatterPlotComponent.prototype.subNgOnDestroy = function () {
        this.getChart().destroy();
    };
    ScatterPlotComponent.prototype.getOptionFromConfig = function (field) {
        return this.optionsFromConfig[field];
    };
    ScatterPlotComponent.prototype.subGetBindings = function (bindings) {
        bindings.xField = this.active.xField.columnName;
        bindings.yField = this.active.yField.columnName;
        bindings.labelField = this.active.labelField.columnName;
        bindings.limit = this.active.limit;
    };
    ScatterPlotComponent.prototype.onUpdateFields = function () {
        this.active.xField = this.findFieldObject('xField', neonMappings.TAGS);
        this.active.yField = this.findFieldObject('yField', neonMappings.TAGS);
        this.active.labelField = this.findFieldObject('labelField', neonMappings.TAGS);
        this.meta.colorField = this.findFieldObject('colorField', neonMappings.TAGS);
    };
    ScatterPlotComponent.prototype.createFilter = function (key, startDate, endDate) {
        return {
            key: key,
            startDate: startDate,
            endDate: endDate
        };
    };
    ScatterPlotComponent.prototype.addLocalFilter = function (f) {
        this.filters[0] = f;
    };
    ScatterPlotComponent.prototype.getExportFields = function () {
        var usedFields = [this.active.xField,
            this.active.yField,
            this.active.labelField];
        return usedFields
            .filter(function (header) { return header && header.columnName; })
            .map(function (header) {
            return {
                columnName: header.columnName,
                prettyName: header.prettyName
            };
        });
    };
    /**
     * returns -1 if cannot be found
     */
    ScatterPlotComponent.prototype.getPointXLocationByIndex = function (chart, index) {
        var dsMeta = chart.controller.getDatasetMeta(0);
        if (dsMeta.data.length > index) {
            var pointMeta = dsMeta.data[index];
            return pointMeta.getCenterPoint().x;
        }
        return -1;
    };
    ScatterPlotComponent.prototype.forcePosInsideChart = function (pos, min, max) {
        return pos < min ? min : (pos > max ? max : pos);
    };
    ScatterPlotComponent.prototype.legendItemSelected = function (data) {
        var key = data.value;
        // Chartjs only seem to update if the entire data object was changed
        // Create a copy of the data object to set at the end
        var chartData = {
            xLabels: this.chart.data.xLabels,
            yLabels: this.chart.data.yLabels,
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
            // Make sure to remove the key frm the map
            this.disabledDatasets.delete(key);
        }
        // Update the display
        this.chart.data = chartData;
        this.refreshVisualization();
        this.disabledList = Array.from(this.disabledDatasets.keys());
    };
    ScatterPlotComponent.prototype.mouseLeave = function (event) {
        this.mouseEventValid = false;
        this.selection.mouseDown = false;
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
    };
    ScatterPlotComponent.prototype.mouseDown = function (event) {
        if (event.buttons > 0) {
            this.mouseEventValid = true;
        }
    };
    ScatterPlotComponent.prototype.mouseUp = function (event) {
        if (this.selection.mouseDown && event.buttons === 0) {
            // mouse up event
            this.selection.mouseDown = false;
            if (this.mouseEventValid) {
                var filter = this.getFilterFromSelectionPositions();
                if (this.filters.length > 0) {
                    filter.id = this.filters[0].id;
                }
                this.addLocalFilter(filter);
                if (filter.id) {
                    this.replaceNeonFilter(true, filter);
                }
                else {
                    this.addNeonFilter(true, filter);
                }
            }
        }
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
        if (event.buttons === 0) {
            this.mouseEventValid = false;
        }
    };
    ScatterPlotComponent.prototype.onHover = function (event) {
        var chartArea = this.getChart().chartArea;
        var chartXPos = event.offsetX;
        var chartYPos = event.offsetY;
        if (!this.selection.mouseDown && event.buttons > 0 && this.mouseEventValid) {
            // mouse down event
            this.selection.mouseDown = true;
            this.selection.startX = this.forcePosInsideChart(chartXPos, chartArea.left, chartArea.right);
            this.selection.startY = this.forcePosInsideChart(chartYPos, chartArea.top, chartArea.bottom);
        }
        if (this.selection.mouseDown && this.mouseEventValid) {
            // drag event near items
            this.selection.endX = this.forcePosInsideChart(chartXPos, chartArea.left, chartArea.right);
            this.selection.endY = this.forcePosInsideChart(chartYPos, chartArea.top, chartArea.bottom);
            this.selection.x = Math.min(this.selection.startX, this.selection.endX);
            this.selection.y = Math.min(this.selection.startY, this.selection.endY);
            this.selection.width = Math.abs(this.selection.startX - this.selection.endX);
            this.selection.height = Math.abs(this.selection.startY - this.selection.endY);
        }
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
    };
    ScatterPlotComponent.prototype.getFilterFromSelectionPositions = function () {
        var chart = this.getChart();
        var x1 = chart.scales['x-axis-1'].getValueForPixel(this.selection.startX);
        var y1 = chart.scales['y-axis-1'].getValueForPixel(this.selection.startY);
        var x2 = chart.scales['x-axis-1'].getValueForPixel(this.selection.endX);
        var y2 = chart.scales['y-axis-1'].getValueForPixel(this.selection.endY);
        var temp = Math.max(x1, x2);
        x1 = Math.min(x1, x2);
        x2 = temp;
        temp = Math.max(y1, y2);
        y1 = Math.min(y1, y2);
        y2 = temp;
        if (!this.active.xAxisIsNumeric) {
            var i = Math.ceil(x1);
            x1 = this.chart.data.xLabels[i];
            i = Math.floor(x2);
            x2 = this.chart.data.xLabels[i];
        }
        if (!this.active.yAxisIsNumeric) {
            var i = Math.ceil(y1);
            y1 = this.chart.data.yLabels[i];
            i = Math.floor(y2);
            y2 = this.chart.data.yLabels[i];
        }
        return {
            id: undefined,
            xMin: x1,
            xMax: x2,
            yMin: y1,
            yMax: y2,
            xField: this.active.xField.columnName,
            yField: this.active.yField.columnName
        };
    };
    ScatterPlotComponent.prototype.createNeonFilterClauseEquals = function (database, table, xyFieldNames) {
        var filterClauses = [];
        var xField = xyFieldNames[0];
        var yField = xyFieldNames[1];
        var filter = this.filters[0];
        filterClauses[0] = neon.query.where(xField, '>=', filter.xMin);
        filterClauses[1] = neon.query.where(xField, '<=', filter.xMax);
        filterClauses[2] = neon.query.where(yField, '>=', filter.yMin);
        filterClauses[3] = neon.query.where(yField, '<=', filter.yMax);
        return neon.query.and.apply(neon.query, filterClauses);
    };
    ScatterPlotComponent.prototype.getFilterText = function () {
        return '';
    };
    ScatterPlotComponent.prototype.getNeonFilterFields = function () {
        return [this.active.xField.columnName, this.active.yField.columnName];
    };
    ScatterPlotComponent.prototype.getVisualizationName = function () {
        return 'Scatter Plot';
    };
    ScatterPlotComponent.prototype.refreshVisualization = function () {
        this.getChart().update();
    };
    ScatterPlotComponent.prototype.isValidQuery = function () {
        var valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.xField && this.active.xField.columnName && valid);
        valid = (this.active.yField && this.active.yField.columnName && valid);
        return valid;
    };
    ScatterPlotComponent.prototype.createQuery = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var query = new neon.query.Query().selectFrom(databaseName, tableName);
        var whereClauses = [];
        var xField = this.active.xField.columnName;
        var yField = this.active.yField.columnName;
        whereClauses.push(neon.query.where(xField, '!=', null));
        whereClauses.push(neon.query.where(yField, '!=', null));
        var groupBys = [];
        groupBys.push(xField);
        groupBys.push(yField);
        if (this.active.labelField && this.active.labelField.columnName !== '') {
            whereClauses.push(neon.query.where(this.active.labelField.columnName, '!=', null));
            groupBys.push(this.active.labelField);
        }
        // Check for unshared filters
        if (this.hasUnsharedFilter()) {
            whereClauses.push(neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }
        if (this.hasColorField()) {
            whereClauses.push(neon.query.where(this.meta.colorField.columnName, '!=', null));
            groupBys.push(this.meta.colorField.columnName);
        }
        query = query.groupBy(groupBys);
        query = query.sortBy(xField, neonVariables.ASCENDING);
        query.where(neon.query.and.apply(query, whereClauses));
        query = query.aggregate(neonVariables.COUNT, '*', 'value');
        return query;
    };
    ScatterPlotComponent.prototype.getFiltersToIgnore = function () {
        return null;
    };
    ScatterPlotComponent.prototype.onQuerySuccess = function (response) {
        this.disabledList = [];
        this.disabledDatasets.clear();
        // TODO much of this method could be optimized, but we'll worry about that later
        var xField = this.active.xField.columnName;
        var yField = this.active.yField.columnName;
        var colorField = this.meta.colorField.columnName;
        var hasColor = this.hasColorField();
        var data = response.data;
        var xAxisIsNumeric = true;
        var yAxisIsNumeric = true;
        var xAxisLabels = [];
        var yAxisLabels = [];
        this.active.pointLabels = [];
        // Map of colorField value to scatter data
        var dataSetMap = new Map();
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var point = data_1[_i];
            var x = point[xField];
            var y = point[yField];
            var p = {
                x: x,
                y: y
            };
            // The key of the dataset is the value of the color field, or ''
            var dataSetKey = '';
            if (hasColor) {
                dataSetKey = point[colorField];
            }
            var dataSet = dataSetMap.get(dataSetKey);
            if (!dataSet) {
                var color = this.defaultActiveColor;
                if (hasColor) {
                    color = this.colorSchemeService.getColorFor(this.meta.colorField.columnName, dataSetKey);
                }
                dataSet = new ScatterDataSet(color);
                dataSet.label = dataSetKey;
                dataSetMap.set(dataSetKey, dataSet);
            }
            xAxisLabels.push(x);
            yAxisLabels.push(y);
            xAxisIsNumeric = xAxisIsNumeric && _super.prototype.isNumber.call(this, x);
            yAxisIsNumeric = yAxisIsNumeric && _super.prototype.isNumber.call(this, y);
            dataSet.data.push(p);
            var label = '';
            if (point.hasOwnProperty(this.active.labelField.columnName)) {
                label = point[this.active.labelField.columnName];
            }
            this.active.pointLabels.push(label);
        }
        // Un-map the data sets
        var allDataSets = Array.from(dataSetMap.values());
        if (xAxisIsNumeric) {
            this.chart.data.xLabels = xAxisLabels;
        }
        else {
            var xLabels = this.removeDuplicatesAndSort(xAxisLabels);
            this.chart.data.xLabels = xLabels;
            for (var _a = 0, allDataSets_1 = allDataSets; _a < allDataSets_1.length; _a++) {
                var dataSet = allDataSets_1[_a];
                for (var _b = 0, _c = dataSet.data; _b < _c.length; _b++) {
                    var p = _c[_b];
                    var val = p.x;
                    p.x = xLabels.indexOf(val);
                }
            }
        }
        if (yAxisIsNumeric) {
            this.chart.data.yLabels = yAxisLabels;
        }
        else {
            var yLabels = this.removeDuplicatesAndSort(yAxisLabels);
            this.chart.data.yLabels = yLabels;
            for (var _d = 0, allDataSets_2 = allDataSets; _d < allDataSets_2.length; _d++) {
                var dataSet = allDataSets_2[_d];
                for (var _e = 0, _f = dataSet.data; _e < _f.length; _e++) {
                    var p = _f[_e];
                    var val = p.y;
                    p.y = yLabels.indexOf(val);
                }
            }
        }
        this.chart.data.labels = this.chart.data.xLabels;
        this.chart.data.datasets = allDataSets;
        if (this.chart.data.labels.length > this.active.limit) {
            var pointCount_1 = 0;
            var pointLimit_1 = this.active.limit;
            this.chart.data.datasets = this.chart.data.datasets.map(function (dataset) {
                if (pointCount_1 >= pointLimit_1) {
                    dataset.data = [];
                }
                else {
                    if (pointCount_1 + dataset.data.length > pointLimit_1) {
                        dataset.data = dataset.data.slice(0, pointLimit_1 - pointCount_1);
                    }
                    pointCount_1 += dataset.data.length;
                }
                return dataset;
            });
        }
        this.active.xAxisIsNumeric = xAxisIsNumeric;
        this.active.yAxisIsNumeric = yAxisIsNumeric;
        this.refreshVisualization();
        // Force the legend to update
        this.colorByFields = [this.meta.colorField.columnName];
    };
    ScatterPlotComponent.prototype.xAxisTickCallback = function (value) {
        if (this.active.xAxisIsNumeric) {
            return value;
        }
        var t = this.chart.data.xLabels[value];
        if (t !== undefined) {
            return t;
        }
        return '';
    };
    ScatterPlotComponent.prototype.yAxisTickCallback = function (value) {
        if (this.active.yAxisIsNumeric) {
            return value;
        }
        var t = this.chart.data.yLabels[value];
        if (t !== undefined) {
            return t;
        }
        return '';
    };
    ScatterPlotComponent.prototype.removeDuplicatesAndSort = function (inputArray) {
        return inputArray.sort().filter(function (element, index, array) {
            return !index || element !== array[index - 1];
        });
    };
    ScatterPlotComponent.prototype.setupFilters = function () {
        // Do nothing
    };
    /**
     * Updates the limit, resets the seen bars, and reruns the bar chart query.
     */
    ScatterPlotComponent.prototype.handleChangeLimit = function () {
        if (_super.prototype.isNumber.call(this, this.active.newLimit)) {
            var newLimit = parseFloat('' + this.active.newLimit);
            if (newLimit > 0) {
                this.active.limit = newLimit;
                // TODO THOR-526 Redraw the scatter plot but do not requery because we can use the same data from the original query.
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
    ScatterPlotComponent.prototype.handleChangeXField = function () {
        this.logChangeAndStartQueryChain();
    };
    ScatterPlotComponent.prototype.handleChangeYField = function () {
        this.logChangeAndStartQueryChain();
    };
    ScatterPlotComponent.prototype.handleChangeLabelField = function () {
        this.logChangeAndStartQueryChain();
    };
    ScatterPlotComponent.prototype.handleChangeColorField = function () {
        this.logChangeAndStartQueryChain();
    };
    ScatterPlotComponent.prototype.handleChangeAndFilters = function () {
        this.logChangeAndStartQueryChain();
    };
    ScatterPlotComponent.prototype.unsharedFilterChanged = function () {
        this.logChangeAndStartQueryChain();
    };
    ScatterPlotComponent.prototype.unsharedFilterRemoved = function () {
        this.logChangeAndStartQueryChain();
    };
    // Get filters and format for each call in HTML
    ScatterPlotComponent.prototype.getCloseableFilters = function () {
        if (this.filters.length > 0) {
            return [{
                    id: this.filters[0].id,
                    value: 'Scatter Filter'
                }];
        }
        else {
            return [];
        }
    };
    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    ScatterPlotComponent.prototype.getButtonText = function () {
        if (!this.chart.data.labels || !this.chart.data.labels.length) {
            return 'No Data';
        }
        if (this.chart.data.labels.length <= this.active.limit) {
            return 'Total ' + _super.prototype.prettifyInteger.call(this, this.chart.data.labels.length);
        }
        return _super.prototype.prettifyInteger.call(this, this.active.limit) + ' of ' + _super.prototype.prettifyInteger.call(this, this.chart.data.labels.length);
    };
    ScatterPlotComponent.prototype.getFilterTitle = function () {
        return this.active.xField.columnName + ' vs ' + this.active.yField.columnName;
    };
    ScatterPlotComponent.prototype.getFilterCloseText = function (value) {
        return value;
    };
    ScatterPlotComponent.prototype.getRemoveFilterTooltip = function () {
        return 'Delete Filter ' + this.getFilterTitle();
    };
    ScatterPlotComponent.prototype.removeFilter = function () {
        this.filters = [];
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    ScatterPlotComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], ScatterPlotComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], ScatterPlotComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], ScatterPlotComponent.prototype, "infoText", void 0);
    __decorate([
        ViewChild('scatter'),
        __metadata("design:type", ChartComponent)
    ], ScatterPlotComponent.prototype, "chartModule", void 0);
    __decorate([
        ViewChild('filterContainer'),
        __metadata("design:type", ElementRef)
    ], ScatterPlotComponent.prototype, "filterContainer", void 0);
    __decorate([
        ViewChild('chartContainer'),
        __metadata("design:type", ElementRef)
    ], ScatterPlotComponent.prototype, "chartContainer", void 0);
    ScatterPlotComponent = __decorate([
        Component({
            selector: 'app-scatter-plot',
            templateUrl: './scatter-plot.component.html',
            styleUrls: ['./scatter-plot.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ColorSchemeService, ChangeDetectorRef, VisualizationService])
    ], ScatterPlotComponent);
    return ScatterPlotComponent;
}(BaseNeonComponent));
export { ScatterPlotComponent };
var ScatterPlotFilter = /** @class */ (function () {
    function ScatterPlotFilter() {
    }
    return ScatterPlotFilter;
}());
export { ScatterPlotFilter };
//# sourceMappingURL=scatter-plot.component.js.map