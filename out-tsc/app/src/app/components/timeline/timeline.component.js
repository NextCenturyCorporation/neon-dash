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
/// <reference path="../../../../node_modules/@types/d3/index.d.ts" />
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
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
import * as _ from 'lodash';
import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { TimelineSelectorChart, TimelineData } from './TimelineSelectorChart';
import { YearBucketizer } from '../bucketizers/YearBucketizer';
import { VisualizationService } from '../../services/visualization.service';
var TimelineComponent = /** @class */ (function (_super) {
    __extends(TimelineComponent, _super);
    function TimelineComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, colorSchemeSrv, ref, visualizationService) {
        var _this = _super.call(this, activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) || this;
        _this.optionsFromConfig = {
            title: _this.injector.get('title', null),
            database: _this.injector.get('database', null),
            table: _this.injector.get('table', null),
            dateField: _this.injector.get('dateField', null),
            granularity: _this.injector.get('granularity', 'day')
        };
        _this.colorSchemeService = colorSchemeSrv;
        _this.filters = [];
        _this.active = {
            data: [],
            dateField: new FieldMetaData(),
            granularity: _this.optionsFromConfig.granularity,
            ylabel: 'Count',
            docCount: 0
        };
        _this.timelineData = new TimelineData();
        _this.timelineData.focusGranularityDifferent = _this.active.granularity.toLowerCase() === 'minute';
        _this.timelineData.granularity = _this.active.granularity;
        _this.timelineData.bucketizer = _this.getBucketizer();
        _this.enableRedrawAfterResize(true);
        return _this;
    }
    TimelineComponent.prototype.subNgOnInit = function () {
        this.timelineChart = new TimelineSelectorChart(this, this.svg, this.timelineData);
    };
    TimelineComponent.prototype.postInit = function () {
        this.executeQueryChain();
        this.defaultActiveColor = this.getPrimaryThemeColor();
    };
    TimelineComponent.prototype.subNgOnDestroy = function () {
        // Do nothing.
    };
    TimelineComponent.prototype.subGetBindings = function (bindings) {
        bindings.dateField = this.active.dateField.columnName;
        bindings.granularity = this.active.granularity;
    };
    TimelineComponent.prototype.getExportFields = function () {
        var fields = [{
                columnName: 'value',
                prettyName: 'Count'
            }];
        switch (this.active.granularity) {
            case 'minute':
                fields.push({
                    columnName: 'minute',
                    prettyName: 'Minute'
                });
            /* falls through */
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
    TimelineComponent.prototype.getOptionFromConfig = function (field) {
        return this.optionsFromConfig[field];
    };
    TimelineComponent.prototype.onUpdateFields = function () {
        this.active.dateField = this.findFieldObject('dateField', neonMappings.DATE);
    };
    TimelineComponent.prototype.addLocalFilter = function (id, key, startDate, endDate, local) {
        try {
            this.filters[0] = {
                id: id,
                key: key,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                local: local
            };
        }
        catch (e) {
            // Ignore potential date format errors
        }
    };
    TimelineComponent.prototype.onTimelineSelection = function (startDate, endDate) {
        // By default, this will give us too many values in other visualizations. For example, selecting March
        // will give a filter from 3/1 to 4/1, which causes all other visualizations to pull March and April
        // documents. To avoid this, decrement the next granularity down by 1.
        switch (this.active.granularity) {
            case 'year':
                endDate.setMonth(endDate.getMonth() - 1);
                break;
            case 'month':
                endDate.setDate(endDate.getDate() - 1);
                break;
            case 'day':
                endDate.setHours(endDate.getHours() - 1);
                break;
            case 'hour':
                endDate.setMinutes(endDate.getMinutes() - 1);
                break;
            case 'minute':
                endDate.setSeconds(endDate.getSeconds() - 1);
                break;
        }
        var filter = {
            id: undefined,
            key: this.active.dateField.columnName,
            startDate: startDate,
            endDate: endDate,
            local: true
        };
        if (this.filters.length > 0) {
            filter.id = this.filters[0].id;
        }
        this.filters[0] = filter;
        if (filter.id === undefined) {
            this.addNeonFilter(false, filter);
        }
        else {
            this.replaceNeonFilter(false, filter);
        }
        // Update the charts
        this.filterAndRefreshData();
    };
    TimelineComponent.prototype.createNeonFilterClauseEquals = function (database, table, fieldName) {
        for (var _i = 0, _a = this.filters; _i < _a.length; _i++) {
            var filter = _a[_i];
            // Only apply filters that aren't local
            var filterClauses = [];
            filterClauses[0] = neon.query.where(fieldName, '>=', filter.startDate);
            var endDatePlusOne = filter.endDate.getTime() + DateBucketizer.MILLIS_IN_DAY;
            var endDatePlusOneDate = new Date(endDatePlusOne);
            filterClauses[1] = neon.query.where(fieldName, '<', endDatePlusOneDate);
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return null;
    };
    TimelineComponent.prototype.getFilterText = function (filter) {
        // I.E. TIMELINE - EARTHQUAKES: 8 AUG 2015 TO 20 DEC 2015
        var database = this.meta.database.name;
        var table = this.meta.table.name;
        var field = this.active.dateField.columnName;
        var text = database + ' - ' + table + ' - ' + field + ' = ';
        var date = filter.startDate;
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        date = filter.endDate;
        text += ' to ';
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        return text;
    };
    TimelineComponent.prototype.getNeonFilterFields = function () {
        return [this.active.dateField.columnName];
    };
    TimelineComponent.prototype.getVisualizationName = function () {
        return 'Timeline';
    };
    TimelineComponent.prototype.refreshVisualization = function () {
        this.timelineChart.redrawChart();
    };
    TimelineComponent.prototype.isValidQuery = function () {
        var valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dateField && this.active.dateField.columnName && valid);
        return valid;
    };
    TimelineComponent.prototype.createQuery = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var query = new neon.query.Query().selectFrom(databaseName, tableName);
        var whereClause = neon.query.where(this.active.dateField.columnName, '!=', null);
        var dateField = this.active.dateField.columnName;
        query = query.aggregate(neonVariables.MIN, dateField, 'date');
        var groupBys = [];
        switch (this.active.granularity) {
            // Passthrough is intentional and expected!  falls through comments tell the linter that it is ok.
            case 'minute':
                groupBys.push(new neon.query.GroupByFunctionClause('minute', dateField, 'minute'));
            /* falls through */
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
        query = query.groupBy(groupBys);
        query = query.sortBy('date', neonVariables.ASCENDING);
        query = query.where(whereClause);
        // Add the unshared filter field, if it exists
        if (this.hasUnsharedFilter()) {
            query.where(neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }
        return query.aggregate(neonVariables.COUNT, '*', 'value');
    };
    TimelineComponent.prototype.getDocCount = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var whereClause = neon.query.where(this.active.dateField.columnName, '!=', null);
        var countQuery = new neon.query.Query()
            .selectFrom(databaseName, tableName)
            .where(whereClause)
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
    };
    TimelineComponent.prototype.getFiltersToIgnore = function () {
        var database = this.meta.database.name;
        var table = this.meta.table.name;
        var fields = [this.active.dateField.columnName];
        var ignoredFilterIds = [];
        var neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (var _i = 0, neonFilters_1 = neonFilters; _i < neonFilters_1.length; _i++) {
                var filter = neonFilters_1[_i];
                // The data we want is in the whereClause's subclauses
                var whereClause = filter.filter.whereClause;
                if (whereClause && whereClause.whereClauses.length === 2) {
                    ignoredFilterIds.push(filter.id);
                }
            }
        }
        return (ignoredFilterIds.length > 0 ? ignoredFilterIds : null);
    };
    TimelineComponent.prototype.onQuerySuccess = function (response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.active.docCount = response.data[0]._docCount;
        }
        else {
            // Convert all the dates into Date objects
            this.active.data = response.data.map(function (item) {
                item.date = new Date(item.date);
                return item;
            });
            this.filterAndRefreshData();
            this.getDocCount();
        }
    };
    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    TimelineComponent.prototype.getButtonText = function () {
        var shownCount = (this.active.data || []).reduce(function (sum, element) {
            return sum + element.value;
        }, 0);
        if (!shownCount) {
            return 'No Data';
        }
        if (this.active.docCount <= shownCount) {
            return 'Total ' + _super.prototype.prettifyInteger.call(this, shownCount);
        }
        return _super.prototype.prettifyInteger.call(this, shownCount) + ' of ' + _super.prototype.prettifyInteger.call(this, this.active.docCount);
    };
    /**
     * Filter the raw data and re-draw the chart
     */
    TimelineComponent.prototype.filterAndRefreshData = function () {
        var series = {
            color: this.defaultActiveColor,
            name: 'Total',
            type: 'bar',
            options: {},
            data: [],
            focusData: [],
            startDate: null,
            endDate: null
        };
        if (this.active.data.length > 0) {
            // The query includes a sort, so it *should* be sorted.
            // Start date will be the first entry, and the end date will be the last
            series.startDate = this.active.data[0].date;
            var lastDate = this.active.data[this.active.data.length - 1].date;
            series.endDate = d3.time[this.active.granularity]
                .utc.offset(lastDate, 1);
            var filter = null;
            if (this.filters.length > 0) {
                filter = this.filters[0];
            }
            // If we have a bucketizer, use it
            if (this.timelineData.bucketizer) {
                this.timelineData.bucketizer.setStartDate(series.startDate);
                this.timelineData.bucketizer.setEndDate(series.endDate);
                var numBuckets = this.timelineData.bucketizer.getNumBuckets();
                for (var i = 0; i < numBuckets; i++) {
                    var bucketDate = this.timelineData.bucketizer.getDateForBucket(i);
                    series.data[i] = {
                        date: bucketDate,
                        value: 0
                    };
                }
                for (var _i = 0, _a = this.active.data; _i < _a.length; _i++) {
                    var row = _a[_i];
                    // Check if this should be in the focus data
                    // Focus data is not bucketized, just zeroed
                    if (filter) {
                        if (filter.startDate <= row.date && filter.endDate >= row.date) {
                            series.focusData.push({
                                date: this.zeroDate(row.date),
                                value: row.value
                            });
                        }
                    }
                    var bucketIndex = this.timelineData.bucketizer.getBucketIndex(row.date);
                    if (series.data[bucketIndex]) {
                        series.data[bucketIndex].value += row.value;
                    }
                }
            }
            else {
                // No bucketizer, just add the data
                for (var _b = 0, _c = this.active.data; _b < _c.length; _b++) {
                    var row = _c[_b];
                    // Check if this should be in the focus data
                    if (filter) {
                        if (filter.startDate <= row.date && filter.endDate >= row.date) {
                            series.focusData.push({
                                date: row.date,
                                value: row.value
                            });
                        }
                    }
                    series.data.push({
                        date: row.date,
                        value: row.value
                    });
                }
            }
            // Commenting this out fixes the issue of focus selections being truncated by one.
            /*if (series.focusData && series.focusData.length > 0) {
                let extentStart = series.focusData[0].date;
                let extentEnd = series.focusData[series.focusData.length].date;
                this.timelineData.extent = [extentStart, extentEnd];
            }*/
        }
        // Make sure to update both the data and primary series
        this.timelineData.data = [series];
        this.timelineData.primarySeries = series;
        this.refreshVisualization();
    };
    TimelineComponent.prototype.onResize = function () {
        var _this = this;
        _.debounce(function () {
            _this.timelineChart.redrawChart();
        }, 500)();
    };
    /**
     * Zero out a date, if needed
     */
    TimelineComponent.prototype.zeroDate = function (date) {
        if (this.timelineData.bucketizer && this.timelineData.granularity !== 'minute') {
            return this.timelineData.bucketizer.zeroOutDate(date);
        }
        return date;
    };
    TimelineComponent.prototype.handleChangeGranularity = function () {
        this.timelineData.focusGranularityDifferent = this.active.granularity.toLowerCase() === 'minute';
        this.timelineData.bucketizer = this.getBucketizer();
        this.timelineData.granularity = this.active.granularity;
        this.logChangeAndStartQueryChain();
    };
    TimelineComponent.prototype.getBucketizer = function () {
        switch (this.active.granularity.toLowerCase()) {
            case 'minute':
            case 'hour':
                var bucketizer = new DateBucketizer();
                bucketizer.setGranularity(DateBucketizer.HOUR);
                return bucketizer;
            case 'day':
                return new DateBucketizer();
            case 'month':
                return new MonthBucketizer();
            case 'year':
                return new YearBucketizer();
            default:
                return null;
        }
    };
    TimelineComponent.prototype.setupFilters = function () {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        var database = this.meta.database.name;
        var table = this.meta.table.name;
        var fields = [this.active.dateField.columnName];
        var neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (var _i = 0, neonFilters_2 = neonFilters; _i < neonFilters_2.length; _i++) {
                var filter = neonFilters_2[_i];
                // The data we want is in the whereClause's subclauses
                var whereClause = filter.filter.whereClause;
                if (whereClause && whereClause.whereClauses.length === 2) {
                    var key = whereClause.whereClauses[0].lhs;
                    var startDate = whereClause.whereClauses[0].rhs;
                    var endDate = whereClause.whereClauses[1].rhs;
                    this.addLocalFilter(filter.id, key, startDate, endDate);
                }
            }
        }
        else {
            this.removeFilter();
        }
    };
    TimelineComponent.prototype.handleChangeDateField = function () {
        this.logChangeAndStartQueryChain();
    };
    TimelineComponent.prototype.logChangeAndStartQueryChain = function () {
        if (!this.initializing) {
            this.executeQueryChain();
        }
    };
    // Get filters and format for each call in HTML
    TimelineComponent.prototype.getCloseableFilters = function () {
        return this.filters;
    };
    TimelineComponent.prototype.getFilterTitle = function (value) {
        return this.active.dateField.columnName + ' = ' + value;
    };
    TimelineComponent.prototype.getRemoveFilterTooltip = function (value) {
        return 'Delete Filter ' + this.getFilterTitle(value);
    };
    TimelineComponent.prototype.unsharedFilterChanged = function () {
        // Update the data
        this.executeQueryChain();
    };
    TimelineComponent.prototype.unsharedFilterRemoved = function () {
        // Update the data
        this.executeQueryChain();
    };
    TimelineComponent.prototype.removeFilter = function () {
        this.filters = [];
        if (this.timelineChart) {
            this.timelineChart.clearBrush();
        }
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    TimelineComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], TimelineComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], TimelineComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], TimelineComponent.prototype, "infoText", void 0);
    __decorate([
        ViewChild('svg'),
        __metadata("design:type", ElementRef)
    ], TimelineComponent.prototype, "svg", void 0);
    __decorate([
        HostListener('window:resize'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], TimelineComponent.prototype, "onResize", null);
    TimelineComponent = __decorate([
        Component({
            selector: 'app-timeline',
            templateUrl: './timeline.component.html',
            styleUrls: ['./timeline.component.scss'],
            encapsulation: ViewEncapsulation.None,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ColorSchemeService, ChangeDetectorRef, VisualizationService])
    ], TimelineComponent);
    return TimelineComponent;
}(BaseNeonComponent));
export { TimelineComponent };
//# sourceMappingURL=timeline.component.js.map