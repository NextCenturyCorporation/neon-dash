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
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ChartComponent } from '../chart/chart.component';
import { Chart } from 'chart.js';
import { VisualizationService } from '../../services/visualization.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
/**
 * Data used to draw the bar chart
 */
var BarData = /** @class */ (function () {
    function BarData() {
        // The X-Axis labels
        this.labels = [];
        // The data to graph
        this.datasets = [];
    }
    return BarData;
}());
export { BarData };
/**
 * One set of bars to draw
 */
var BarDataSet = /** @class */ (function () {
    function BarDataSet(length, color) {
        // The data
        this.data = [];
        // The colors of the bars.
        this.backgroundColor = [];
        if (length) {
            for (var i = 0; i < length; i++) {
                this.data[i] = 0;
            }
        }
        this.color = color;
    }
    /**
     * Set all the background colors to the default color of this set
     */
    BarDataSet.prototype.setAllActive = function () {
        for (var i = 0; i < this.data.length; i++) {
            this.backgroundColor[i] = this.color.toRgb();
        }
    };
    /**
     * Set all the background colors to the default color of this set
     */
    BarDataSet.prototype.setAllInactive = function () {
        for (var i = 0; i < this.data.length; i++) {
            this.backgroundColor[i] = this.color.getInactiveRgba();
        }
    };
    /**
     * Set the background color of a single bar to the active color
     * @param {number} position
     */
    BarDataSet.prototype.setActiveColor = function (position) {
        this.backgroundColor[position] = this.color.toRgb();
    };
    /**
     * set the background color of a single bar to the inactive color
     * @param {number} position
     */
    BarDataSet.prototype.setInactiveColor = function (position) {
        this.backgroundColor[position] = this.color.getInactiveRgba();
    };
    return BarDataSet;
}());
export { BarDataSet };
var BarChartComponent = /** @class */ (function (_super) {
    __extends(BarChartComponent, _super);
    function BarChartComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService, colorSchemeService) {
        var _this = _super.call(this, activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) || this;
        _this.colorSchemeService = colorSchemeService;
        // Used to change the colors between active/inactive in the legend
        _this.selectedLabels = [];
        _this.colorFieldNames = [];
        _this.optionsFromConfig = {
            title: _this.injector.get('title', null),
            database: _this.injector.get('database', null),
            table: _this.injector.get('table', null),
            dataField: _this.injector.get('dataField', null),
            aggregation: _this.injector.get('aggregation', null),
            aggregationField: _this.injector.get('aggregationField', null),
            colorField: _this.injector.get('colorField', null),
            limit: _this.injector.get('limit', 10),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            chartType: _this.injector.get('chartType', 'bar')
        };
        _this.filters = [];
        _this.active = {
            dataField: new FieldMetaData(),
            colorField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            andFilters: true,
            limit: _this.optionsFromConfig.limit,
            newLimit: _this.optionsFromConfig.limit,
            page: 1,
            lastPage: true,
            filterable: true,
            layers: [],
            data: [],
            aggregation: 'count',
            chartType: _this.optionsFromConfig.chartType || 'horizontalBar',
            minScale: undefined,
            maxScale: undefined,
            maxNum: 0,
            scaleManually: false,
            bars: [],
            seenBars: []
        };
        _this.onClick = _this.onClick.bind(_this);
        // Arbitrary size in pixels of a character in a chart label.  (Obviously real characters are varied in size.)
        var CHAR_SIZE = 6.0;
        // Arbitrary margin for the labels.  (Not sure about the size of the real margin but this value looks fine.)
        var LABELS_MARGIN = 30;
        // Percentage of the chart for the labels specified by UX.
        var LABELS_PERCENTAGE = 0.2;
        var resizeChartLabelX = function (scaleInstance) {
            // Set the label height to either its minimum needed height or a percentage of the chart height (whatever is lower).
            var height = Math.round(LABELS_PERCENTAGE * _this.chartModule.getNativeElement().clientHeight);
            scaleInstance.height = Math.min(scaleInstance.minSize.height, height);
        };
        var resizeChartLabelY = function (scaleInstance) {
            // Set the label width to either its minimum needed width or a percentage of the chart width (whatever is lower).
            var width = Math.round(LABELS_PERCENTAGE * _this.chartModule.getNativeElement().clientWidth);
            // If the bar chart has multiple pages, always return a consistent width.
            scaleInstance.width = _this.active.limit < _this.active.bars.length ? width : Math.min(scaleInstance.minSize.width, width);
        };
        var truncateText = function (length, text) {
            var output = _this.formatNumber(text).trim();
            return output.length > (length + 1) ? (output.substring(0, length).trim() + '...') : output;
        };
        var truncateBarLabelTextX = function (text) {
            // Fit the number of characters to the bar width (bar width = chart width / number of bars - margin).
            var length = Math.round((_this.chartModule.getNativeElement().clientWidth / _this.chartInfo.data.labels.length - LABELS_MARGIN) /
                CHAR_SIZE);
            return truncateText(length, text);
        };
        var truncateBarLabelTextY = function (text) {
            // Fit the number of characters to the label width (label width = a percentage of chart width - margin).
            var length = Math.round((LABELS_PERCENTAGE * _this.chartModule.getNativeElement().clientWidth - LABELS_MARGIN) / CHAR_SIZE);
            return truncateText(length, text);
        };
        var truncateTooltipLabelText = function (text) {
            // Fit the number of characters to the chart width.
            var length = Math.round(_this.chartModule.getNativeElement().clientWidth / CHAR_SIZE);
            return truncateText(length, text);
        };
        _this.chartInfo = {
            type: _this.active.chartType,
            data: {
                labels: [],
                datasets: [new BarDataSet(0, _this.defaultActiveColor)]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                onClick: _this.onClick,
                animation: {
                    duration: 0 // general animation time
                },
                hover: {
                    mode: 'point',
                    onHover: null
                },
                scales: {
                    xAxes: [{
                            afterFit: resizeChartLabelX,
                            stacked: true,
                            ticks: {
                                maxRotation: 0,
                                minRotation: 0,
                                beginAtZero: true,
                                callback: truncateBarLabelTextX
                            }
                        }],
                    yAxes: [{
                            afterFit: resizeChartLabelY,
                            stacked: true,
                            ticks: {
                                beginAtZero: true,
                                callback: truncateBarLabelTextY
                            }
                        }]
                },
                legend: {
                    display: false
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {}
                }
            }
        };
        var createTooltipTitle = function (tooltipList, data) {
            var count = tooltipList.reduce(function (sum, tooltipItem) {
                var dataset = data.datasets[tooltipItem.datasetIndex];
                return sum + dataset.data[tooltipItem.index];
            }, 0);
            return truncateTooltipLabelText(data.labels[tooltipList[0].index]) + ': ' + _this.formatNumber(count);
        };
        var createTooltipLabel = function (tooltipItem, data) {
            var dataset = data.datasets[tooltipItem.datasetIndex];
            var count = dataset.data[tooltipItem.index];
            // Returning null removes the row from the tooltip
            return data.datasets.length === 1 || count === 0 ? null : truncateTooltipLabelText(dataset.label) + ': ' +
                _this.formatNumber(count);
        };
        _this.chartInfo.options.tooltips.callbacks.title = createTooltipTitle.bind(_this);
        _this.chartInfo.options.tooltips.callbacks.label = createTooltipLabel.bind(_this);
        return _this;
    }
    /**
     * Initializes any bar chart sub-components needed.
     *
     * @override
     */
    BarChartComponent.prototype.subNgOnInit = function () {
        // Do nothing.
    };
    /**
     * Handles any bar chart component post-initialization behavior needed.
     *
     * @override
     */
    BarChartComponent.prototype.postInit = function () {
        this.executeQueryChain();
        //This does nothing, but it is here to hide a bug: without it, if you open a barchart, and switch the type once,
        //then the chart will not resize with the widget. Resizing works again after any subsequent type-switch. So if we call
        //this at the outset of the program, the chart should always resize correctly. I would think we'd need to call this
        //method twice, but for some reason it appears it only needs one call to work.
        this.handleChangeChartType();
        this.defaultActiveColor = this.getPrimaryThemeColor();
    };
    /**
     * Deletes any bar chart sub-components needed.
     *
     * @override
     */
    BarChartComponent.prototype.subNgOnDestroy = function () {
        this.chartModule.chart.destroy();
    };
    /**
     * Sets the properties in the given bindings for the bar chart.
     *
     * @arg {any} bindings
     * @override
     */
    BarChartComponent.prototype.subGetBindings = function (bindings) {
        bindings.dataField = this.active.dataField.columnName;
        bindings.aggregation = this.active.aggregation;
        bindings.aggregationField = this.active.aggregationField.columnName;
        bindings.limit = this.active.limit;
    };
    /**
     * Returns the bar chart export fields.
     *
     * @return {array}
     * @override
     */
    BarChartComponent.prototype.getExportFields = function () {
        var valuePrettyName = this.active.aggregation +
            (this.active.aggregationFieldHidden ? '' : '-' + this.active.aggregationField.prettyName);
        valuePrettyName = valuePrettyName.charAt(0).toUpperCase() + valuePrettyName.slice(1);
        return [{
                columnName: this.active.dataField.columnName,
                prettyName: this.active.dataField.prettyName
            }, {
                columnName: 'value',
                prettyName: valuePrettyName
            }];
    };
    /**
     * Returns the option for the given property from the bar chart config.
     *
     * @arg {string} option
     * @return {any}
     * @override
     */
    BarChartComponent.prototype.getOptionFromConfig = function (option) {
        return this.optionsFromConfig[option];
    };
    /**
     * Adds, replaces, or removes filters using the bar chart data in the given elements.
     *
     * @arg {any} _event
     * @arg {array} elements
     */
    BarChartComponent.prototype.onClick = function (_event, elements) {
        if (elements.length) {
            var value = elements[0]._model.label;
            var key = this.active.dataField.columnName;
            var prettyKey = this.active.dataField.prettyName;
            var filter = {
                id: undefined,
                key: key,
                value: value,
                prettyKey: prettyKey
            };
            if (_event.ctrlKey || _event.metaKey) {
                if (this.filterIsUnique(filter)) {
                    this.addLocalFilter(filter);
                    var whereClause = neon.query.where(filter.key, '=', filter.value);
                    this.addNeonFilter(true, filter, whereClause);
                }
                else {
                    for (var _i = 0, _a = this.filters; _i < _a.length; _i++) {
                        var f = _a[_i];
                        if (f.key === filter.key && f.value === filter.value) {
                            this.removeLocalFilterFromLocalAndNeon(f, true, true);
                            break;
                        }
                    }
                }
            }
            else {
                if (this.filters.length === 0) {
                    this.addLocalFilter(filter);
                    this.addNeonFilter(true, filter);
                }
                else if (this.filters.length === 1 && this.filterIsUnique(filter)) {
                    filter.id = this.filters[0].id;
                    this.filters[0] = filter;
                    this.replaceNeonFilter(true, filter);
                }
                else {
                    this.removeAllFilters(false, false);
                    this.addLocalFilter(filter);
                    this.addNeonFilter(true, filter);
                }
            }
            this.refreshVisualization();
        }
    };
    /**
     * Updates the fields for the bar chart.
     *
     * @override
     */
    BarChartComponent.prototype.onUpdateFields = function () {
        if (this.optionsFromConfig.aggregation) {
            this.active.aggregation = this.optionsFromConfig.aggregation;
        }
        this.active.aggregationField = this.findFieldObject('aggregationField', neonMappings.TAGS);
        this.active.dataField = this.findFieldObject('dataField', neonMappings.TAGS);
        this.active.colorField = this.findFieldObject('colorField', neonMappings.TAGS);
    };
    /**
     * Adds the given filter object to the bar chart's list of filter objects.
     *
     * @arg {object} filter
     */
    BarChartComponent.prototype.addLocalFilter = function (filter) {
        if (this.filterIsUnique(filter)) {
            this.filters = [].concat(this.filters).concat([filter]);
        }
    };
    /**
     * Returns true if the given filter object does not match any filter in the list of bar chart component filter objects.
     *
     * @arg {any} filter
     * @return {boolean}
     */
    BarChartComponent.prototype.filterIsUnique = function (filter) {
        for (var _i = 0, _a = this.filters; _i < _a.length; _i++) {
            var f = _a[_i];
            if (f.value === filter.value && f.key === filter.key) {
                return false;
            }
        }
        return true;
    };
    /**
     * Creates and returns the neon filter clause object using the given database, table, and data field names.
     *
     * @arg {string} database
     * @arg {string} table
     * @arg {string} fieldName
     * @return {object}
     * @override
     */
    BarChartComponent.prototype.createNeonFilterClauseEquals = function (database, table, fieldName) {
        var filterClauses = this.filters.map(function (filter) {
            return neon.query.where(fieldName, '=', filter.value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.active.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    };
    /**
     * Returns the list of filter fields for the bar chart.
     *
     * @return {array}
     * @override
     */
    BarChartComponent.prototype.getNeonFilterFields = function () {
        return [this.active.dataField.columnName];
    };
    /**
     * Returns the bar chart's visualization name.
     *
     * @return {string}
     * @override
     */
    BarChartComponent.prototype.getVisualizationName = function () {
        return 'Bar Chart';
    };
    /**
     * Returns the bar chart filter text using the given filter object.
     *
     * @arg {any} filter
     * @return {string}
     * @override
     */
    BarChartComponent.prototype.getFilterText = function (filter) {
        return filter.value;
    };
    /**
     * Updates the bar colors and legend and refreshes the bar chart.
     */
    BarChartComponent.prototype.refreshVisualization = function () {
        var selectedLabels = [];
        if (this.filters.length >= 1) {
            var activeFilterValues_1 = this.filters.map(function (el) { return el.value; });
            var activeLabelIndexes = this.chartInfo.data.labels.map(function (label, index) {
                return (activeFilterValues_1.indexOf(label) >= 0 ? index : -1);
            }).filter(function (index) {
                return index >= 0;
            });
            for (var _i = 0, _a = this.chartInfo.data.datasets; _i < _a.length; _i++) {
                var dataset = _a[_i];
                dataset.setAllInactive();
                for (var index = activeLabelIndexes.length - 1; index >= 0; index--) {
                    dataset.setActiveColor(activeLabelIndexes[index]);
                }
                for (var index = activeLabelIndexes.length - 1; index >= 0; index--) {
                    if (dataset.data[activeLabelIndexes[index]] > 0) {
                        selectedLabels.push(dataset.label);
                        continue;
                    }
                }
            }
        }
        else {
            // Set all bars active
            for (var _b = 0, _c = this.active.data; _b < _c.length; _b++) {
                var dataset = _c[_b];
                dataset.setAllActive();
            }
        }
        this.selectedLabels = selectedLabels;
        this.chartModule.chart.update();
    };
    /**
     * Returns whether the fields for the bar chart are valid.
     *
     * @return {boolean}
     * @override
     */
    BarChartComponent.prototype.isValidQuery = function () {
        var valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        valid = (this.active.aggregation && this.active.aggregation && valid); // what?
        if (this.active.aggregation !== 'count') {
            valid = (this.active.aggregationField !== undefined && this.active.aggregationField.columnName !== '' && valid);
            //This would mean though that if the data is just a number being represented by a string, it would simply fail.
            //As opposed to first trying to parse it.
            //This also makes it silently fail, without letting the user know that it failed or why. One could easily change the
            //aggregation type, not notice that the chart didn't change, and
            valid = ((this.active.aggregationField.type !== 'string') && valid);
        }
        return valid;
    };
    /**
     * Creates and returns the query for the bar chart.
     *
     * @return {neon.query.Query}
     * @override
     */
    BarChartComponent.prototype.createQuery = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var query = new neon.query.Query().selectFrom(databaseName, tableName);
        var whereClauses = [];
        whereClauses.push(neon.query.where(this.active.dataField.columnName, '!=', null));
        var yAxisField = this.active.aggregationField.columnName;
        var groupBy = [this.active.dataField.columnName];
        if (this.active.colorField && this.active.colorField.columnName !== '') {
            whereClauses.push(neon.query.where(this.active.colorField.columnName, '!=', null));
            groupBy.push(this.active.colorField.columnName);
        }
        if (this.hasUnsharedFilter()) {
            // Add the unshared filter
            whereClauses.push(neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }
        query.where(neon.query.and.apply(query, whereClauses)).groupBy(groupBy);
        switch (this.active.aggregation) {
            case 'average':
                query.aggregate(neonVariables.AVG, yAxisField, 'value');
                break;
            case 'min':
                query.aggregate(neonVariables.MIN, yAxisField, 'value');
                break;
            case 'max':
                query.aggregate(neonVariables.MAX, yAxisField, 'value');
                break;
            case 'sum':
                query.aggregate(neonVariables.SUM, yAxisField, 'value');
                break;
            case 'count':
            default:
                query.aggregate(neonVariables.COUNT, '*', 'value');
        }
        return query.sortBy('value', neonVariables.DESCENDING);
    };
    /**
     * Returns the list of filters for the bar chart to ignore.
     *
     * @return {any}
     * @override
     */
    BarChartComponent.prototype.getFiltersToIgnore = function () {
        var database = this.meta.database.name;
        var table = this.meta.table.name;
        var fields = this.getNeonFilterFields();
        // get relevant neon filters and check for filters that should be ignored and add that to query
        var neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters.length > 0) {
            var ignoredFilterIds = [];
            for (var _i = 0, neonFilters_1 = neonFilters; _i < neonFilters_1.length; _i++) {
                var filter = neonFilters_1[_i];
                ignoredFilterIds.push(filter.id);
            }
            return ignoredFilterIds;
        }
        return null;
    };
    /**
     * Handles the query results for the bar chart and draws the new bar chart.
     */
    BarChartComponent.prototype.onQuerySuccess = function (response) {
        this.active.bars = [];
        // Use our seen values list to create dummy values for every category not returned this time.
        var seenData = [];
        for (var _i = 0, _a = this.active.seenBars; _i < _a.length; _i++) {
            var barLabel = _a[_i];
            var exists = false;
            for (var _b = 0, _c = response.data; _b < _c.length; _b++) {
                var item = _c[_b];
                if (item[this.active.dataField.columnName] === barLabel) {
                    exists = true;
                }
            }
            if (!exists) {
                var item = {
                    value: 0
                };
                item[this.active.dataField.columnName] = barLabel;
                seenData.push(item);
            }
        }
        var data = response.data.concat(seenData);
        // Update the bars from the data.
        for (var _d = 0, data_1 = data; _d < data_1.length; _d++) {
            var item = data_1[_d];
            var barLabel = item[this.active.dataField.columnName];
            if (!barLabel) {
                continue;
            }
            // Add any labels that we haven't seen before to our "seen values" list so we have them for next time.
            if (this.active.seenBars.indexOf(barLabel) < 0) {
                this.active.seenBars.push(barLabel);
            }
            if (this.active.bars.indexOf(barLabel) < 0) {
                this.active.bars.push(barLabel);
            }
        }
        var groupsToDatasets = new Map();
        var colorFieldExists = (this.active.colorField && this.active.colorField.columnName !== '');
        var _loop_1 = function (item) {
            var barLabel = item[this_1.active.dataField.columnName];
            if (!barLabel) {
                return "continue";
            }
            // Each barLabel will create a new bar.  Each barSegment will create a new piece of a whole bar.
            var barSegment = colorFieldExists ? (item[this_1.active.colorField.columnName] || '') : '';
            var barDataset = groupsToDatasets.get(barSegment);
            if (!barDataset) {
                barDataset = new BarDataSet(this_1.active.bars.length);
                barDataset.label = barSegment;
                barDataset.color = colorFieldExists ? this_1.colorSchemeService.getColorFor(this_1.active.colorField.columnName, barSegment) :
                    this_1.defaultActiveColor;
                barDataset.backgroundColor = this_1.active.bars.map(function (bar) {
                    return barDataset.color.toRgb();
                });
                groupsToDatasets.set(barSegment, barDataset);
            }
            barDataset.data[this_1.active.bars.indexOf(barLabel)] = item.value;
        };
        var this_1 = this;
        // Update the segments and counts from the bars and the data.
        for (var _e = 0, data_2 = data; _e < data_2.length; _e++) {
            var item = data_2[_e];
            _loop_1(item);
        }
        this.active.data = Array.from(groupsToDatasets.values());
        this.active.page = 1;
        this.active.lastPage = (this.active.bars.length <= this.active.limit);
        this.updateBarChart(0, this.active.limit);
    };
    /**
     * Updates the bar chartInfo with the active.bars and active.data using the given bar index and bar limit.
     *
     * @arg {number} barIndex
     * @arg {number} barLimit
     */
    BarChartComponent.prototype.updateBarChart = function (barIndex, barLimit) {
        var barChartData = new BarData();
        barChartData.labels = this.active.bars.slice(barIndex, barIndex + barLimit);
        barChartData.datasets = this.active.data.map(function (wholeDataset) {
            var limitedDataset = new BarDataSet(barChartData.labels.length);
            limitedDataset.label = wholeDataset.label;
            limitedDataset.color = wholeDataset.color;
            limitedDataset.backgroundColor = wholeDataset.backgroundColor.slice(barIndex, barIndex + barLimit);
            limitedDataset.data = wholeDataset.data.slice(barIndex, barIndex + barLimit);
            return limitedDataset;
        });
        // Set this to force the legend to update
        this.colorFieldNames = [this.active.colorField.columnName];
        this.chartInfo.data = barChartData;
        this.refreshVisualization();
    };
    /**
     * If the given item is a number, returns it as a rounded string; otherwise, returns the given item.
     *
     * @arg {any} item
     * @return {string}
     */
    BarChartComponent.prototype.formatNumber = function (item) {
        if (_super.prototype.isNumber.call(this, item)) {
            //round to at most 3 decimal places, so as to not display tiny floating-point errors
            var output = Math.round((parseFloat(item) + 0.00001) * 1000) / 1000;
            if (output > 999) {
                return _super.prototype.prettifyInteger.call(this, Math.trunc(output));
            }
            return '' + output;
        }
        // can't be converted to a number, so just use it as-is.
        return '' + item;
    };
    /**
     * Updates the aggregation type and reruns the bar chart query.
     */
    BarChartComponent.prototype.handleChangeAggregation = function () {
        this.active.aggregationFieldHidden = (this.active.aggregation === 'count');
        this.executeQueryChain();
    };
    /**
     * Updates the bar chart type and redraws the bar chart.
     */
    BarChartComponent.prototype.handleChangeChartType = function () {
        if (!this.chartModule.chart) {
            return;
        }
        var barData = this.chartInfo.data;
        var barOptions = this.chartInfo.options;
        var ctx = this.chartModule.chart.ctx;
        this.chartModule.chart.destroy();
        var clonedChart = new Chart(ctx, {
            type: this.active.chartType,
            data: barData,
            options: barOptions
        });
        this.chartInfo = {
            type: this.active.chartType,
            data: barData,
            options: barOptions
        };
        this.chartModule.chart = clonedChart;
        this.handleChangeScale();
        this.refreshVisualization();
    };
    BarChartComponent.prototype.setGraphMaximum = function (newMax) {
        if (this.chartModule.chart.config.type === 'bar') {
            this.chartModule.chart.config.options.scales.yAxes[0].ticks.max = newMax;
        }
        else if ('horizontalBar') {
            this.chartModule.chart.config.options.scales.xAxes[0].ticks.max = newMax;
        }
        else {
            //what
        }
    };
    BarChartComponent.prototype.setGraphMinimum = function (newMin) {
        if (this.chartModule.chart.config.type === 'bar') {
            this.chartModule.chart.config.options.scales.yAxes[0].ticks.min = newMin;
        }
        else if ('horizontalBar') {
            this.chartModule.chart.config.options.scales.xAxes[0].ticks.min = newMin;
        }
        else {
            //what
        }
    };
    /**
     * Updates the graph scale and reruns the bar chart query.
     */
    BarChartComponent.prototype.handleChangeScale = function () {
        if (this.active.scaleManually) {
            if (this.active.maxScale === undefined
                || this.active.maxScale === ''
                || isNaN(Number(this.active.maxScale))) {
                this.setGraphMaximum(undefined); // not usable input, so default to automatic scaling
            }
            else {
                this.setGraphMaximum(Number(this.active.maxScale));
            }
            if (this.active.minScale === undefined
                || this.active.minScale === ''
                || isNaN(Number(this.active.minScale))) {
                this.setGraphMinimum(undefined); // not usable input, so default to automatic scaling
            }
            else {
                this.setGraphMinimum(Number(this.active.minScale));
            }
        }
        else {
            this.setGraphMaximum(undefined);
            this.setGraphMinimum(undefined);
        }
        this.logChangeAndStartQueryChain();
    };
    /**
     * Creates filters on init if needed.
     *
     * @override
     */
    BarChartComponent.prototype.setupFilters = function () {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        var database = this.meta.database.name;
        var table = this.meta.table.name;
        var fields = [this.active.dataField.columnName];
        var neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (var _i = 0, neonFilters_2 = neonFilters; _i < neonFilters_2.length; _i++) {
                var filter = neonFilters_2[_i];
                var key = filter.filter.whereClause.lhs;
                var value = filter.filter.whereClause.rhs;
                var f = {
                    id: filter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                };
                this.addLocalFilter(f);
            }
        }
        else {
            this.filters = [];
        }
    };
    /**
     * Updates the limit, resets the seen bars, and reruns the bar chart query.
     */
    BarChartComponent.prototype.handleChangeLimit = function () {
        if (_super.prototype.isNumber.call(this, this.active.newLimit)) {
            var newLimit = parseFloat('' + this.active.newLimit);
            if (newLimit > 0) {
                this.active.limit = newLimit;
                this.active.seenBars = [];
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
    /**
     * Resets the seen bars and reruns the bar chart query.
     */
    BarChartComponent.prototype.handleChangeField = function () {
        this.active.seenBars = [];
        this.logChangeAndStartQueryChain();
    };
    /**
     * Reruns the bar chart query.
     */
    BarChartComponent.prototype.unsharedFilterChanged = function () {
        // Update the data
        this.executeQueryChain();
    };
    /**
     * Reruns the bar chart query.
     */
    BarChartComponent.prototype.unsharedFilterRemoved = function () {
        // Update the data
        this.executeQueryChain();
    };
    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    BarChartComponent.prototype.getButtonText = function () {
        if (!this.active.bars || !this.active.bars.length) {
            return 'No Data';
        }
        if (this.active.bars.length <= this.active.limit) {
            return 'Total ' + _super.prototype.prettifyInteger.call(this, this.active.bars.length);
        }
        var begin = _super.prototype.prettifyInteger.call(this, (this.active.page - 1) * this.active.limit + 1);
        var end = _super.prototype.prettifyInteger.call(this, Math.min(this.active.page * this.active.limit, this.active.bars.length));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + _super.prototype.prettifyInteger.call(this, this.active.bars.length);
    };
    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     */
    BarChartComponent.prototype.getCloseableFilters = function () {
        return this.filters;
    };
    /**
     * Returns the bar chart filter tooltip title text using the given filter value.
     *
     * @arg {string} value
     * @return {string}
     */
    BarChartComponent.prototype.getFilterTitle = function (value) {
        return this.active.dataField.columnName + ' = ' + value;
    };
    /**
     * Returns the bar chart filter text using the given filter value.
     *
     * @arg {string} value
     * @return {string}
     */
    BarChartComponent.prototype.getFilterCloseText = function (value) {
        return value;
    };
    /**
     * Returns the bar chart remove button tooltip title text using the given filter value.
     *
     * @arg {string} value
     * @return {string}
     */
    BarChartComponent.prototype.getRemoveFilterTooltip = function (value) {
        return 'Delete Filter ' + this.getFilterTitle(value);
    };
    //Would love to refactor this but cannot because it's called in base neon.
    /**
     * Removes the given filter object from this bar chart component.
     *
     * @arg {any} filter
     */
    BarChartComponent.prototype.removeFilter = function (filter) {
        for (var index = this.filters.length - 1; index >= 0; index--) {
            if (this.filters[index].id === filter.id) {
                this.filters.splice(index, 1);
            }
        }
    };
    /**
     * Removes all filters from this bar chart component and neon, optionally requerying and/or refreshing.
     *
     * @arg {boolean=true} shouldRequery
     * @arg {boolean=true} shouldRefresh
     */
    BarChartComponent.prototype.removeAllFilters = function (shouldRequery, shouldRefresh) {
        if (shouldRequery === void 0) { shouldRequery = true; }
        if (shouldRefresh === void 0) { shouldRefresh = true; }
        for (var index = this.filters.length - 1; index >= 0; index--) {
            this.removeLocalFilterFromLocalAndNeon(this.filters[index], false, false);
        }
        // Do these once we're finished removing all filters, rather than after each one.
        if (shouldRequery) {
            this.executeQueryChain();
        }
        if (shouldRefresh) {
            this.refreshVisualization();
        }
    };
    /**
     * Increases the page and updates the bar chart data.
     */
    BarChartComponent.prototype.nextPage = function () {
        if (!this.active.lastPage) {
            this.active.page++;
            this.updatePageData();
        }
    };
    /**
     * Decreases the page and updates the bar chart data.
     */
    BarChartComponent.prototype.previousPage = function () {
        if (this.active.page !== 1) {
            this.active.page--;
            this.updatePageData();
        }
    };
    /**
     * Updates lastPage and the bar chart data using the page and limit.
     */
    BarChartComponent.prototype.updatePageData = function () {
        var offset = (this.active.page - 1) * this.active.limit;
        this.active.lastPage = (this.active.bars.length <= (offset + this.active.limit));
        this.updateBarChart(offset, this.active.limit);
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    BarChartComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], BarChartComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], BarChartComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], BarChartComponent.prototype, "infoText", void 0);
    __decorate([
        ViewChild('myChart'),
        __metadata("design:type", ChartComponent)
    ], BarChartComponent.prototype, "chartModule", void 0);
    BarChartComponent = __decorate([
        Component({
            selector: 'app-bar-chart',
            templateUrl: './bar-chart.component.html',
            styleUrls: ['./bar-chart.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ChangeDetectorRef, VisualizationService, ColorSchemeService])
    ], BarChartComponent);
    return BarChartComponent;
}(BaseNeonComponent));
export { BarChartComponent };
//# sourceMappingURL=bar-chart.component.js.map