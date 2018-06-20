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
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import {
    AbstractAggregationSubcomponent,
    AggregationSubcomponentListener,
    AggregationSubcomponentOptions
} from './subcomponent.aggregation.abstract';
import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { ChartJsBarSubcomponent } from './subcomponent.chartjs.bar';
import { ChartJsDoughnutSubcomponent } from './subcomponent.chartjs.doughnut';
import { ChartJsHistogramSubcomponent } from './subcomponent.chartjs.histogram';
import { ChartJsLineSubcomponent } from './subcomponent.chartjs.line';
import { ChartJsPieSubcomponent } from './subcomponent.chartjs.pie';
import { ChartJsScatterSubcomponent } from './subcomponent.chartjs.scatter';
import { EMPTY_FIELD, FieldMetaData } from '../../dataset';
import { neonVariables } from '../../neon-namespaces';

import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { YearBucketizer } from '../bucketizers/YearBucketizer';

import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import * as neon from 'neon-framework';

/**
 * Manages configurable options for the specific visualization.
 */
export class AggregationOptions extends BaseNeonOptions implements AggregationSubcomponentOptions {
    public aggregationField: FieldMetaData;
    public groupField: FieldMetaData;
    public xField: FieldMetaData;
    public yField: FieldMetaData;

    public aggregation: string;
    public granularity: string;
    public hideGridLines: boolean;
    public hideGridTicks: boolean;
    public ignoreSelf: boolean;
    public lineCurveTension: number;
    public lineFillArea: boolean;
    public logScaleX: boolean;
    public logScaleY: boolean;
    public newType: string;
    public scaleMaxX: string;
    public scaleMaxY: string;
    public scaleMinX: string;
    public scaleMinY: string;
    public sortByAggregation: boolean;
    public timeFill: boolean;
    public type: string;
    public yPercentage: number;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.aggregation = this.injector.get('aggregation', 'count');
        this.ignoreSelf = this.injector.get('ignoreSelf', false);
        this.granularity = this.injector.get('granularity', 'year');
        this.hideGridLines = this.injector.get('hideGridLines', false);
        this.hideGridTicks = this.injector.get('hideGridTicks', false);
        this.lineCurveTension = this.injector.get('lineCurveTension', 0.3);
        this.lineFillArea = this.injector.get('lineFillArea', false);
        this.logScaleX = this.injector.get('logScaleX', false);
        this.logScaleY = this.injector.get('logScaleY', false);
        this.scaleMaxX = this.injector.get('scaleMaxX', '');
        this.scaleMaxY = this.injector.get('scaleMaxY', '');
        this.scaleMinX = this.injector.get('scaleMinX', '');
        this.scaleMinY = this.injector.get('scaleMinY', '');
        this.sortByAggregation = this.injector.get('sortByAggregation', false);
        this.timeFill = this.injector.get('timeFill', false);
        this.type = this.injector.get('type', 'line');
        this.yPercentage = this.injector.get('yPercentage', 0.3);
        this.newType = this.type;
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.aggregationField = this.findFieldObject('aggregationField');
        this.groupField = this.findFieldObject('groupField');
        this.xField = this.findFieldObject('xField');
        this.yField = this.findFieldObject('yField');
    }
}

@Component({
    selector: 'app-aggregation',
    templateUrl: './aggregation.component.html',
    styleUrls: ['./aggregation.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AggregationComponent extends BaseNeonComponent implements OnInit, OnDestroy, AggregationSubcomponentListener {
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('hiddenCanvas') hiddenCanvas: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('subcomponent') subcomponentHtml: ElementRef;

    private DEFAULT_GROUP: string = 'All';

    public filters: {
        id: string,
        field: string | { x: string, y: string },
        label: string,
        prettyField: string | { x: string, y: string },
        value: string | { beginX: number, endX: number } | { beginX: number, beginY: number, endX: number, endY: number }
    }[] = [];

    public options: AggregationOptions;

    // The data pagination properties.
    public lastPage: boolean = true;
    public page: number = 1;

    // The data shown in the visualization (limited).
    public activeData: any[] = [];

    // The data returned by the visualization query response (not limited).
    public responseData: any[] = [];

    // The bucketizer for any date data.
    public dateBucketizer: any;

    // The minimum dimensions for the chart.
    public minimumDimensions: {
        height: number,
        width: number
    } = {
        height: 100,
        width: 100
    };

    // The selected area on the chart (box or range).
    public selectedArea: {
        height: number,
        width: number,
        x: number,
        y: number
    } = null;

    // The selected area offset from the borders or margins.
    public selectedAreaOffset: {
        x: number,
        y: number
    } = {
        x: 0,
        y: 0
    };

    public subcomponentObject: AbstractAggregationSubcomponent;
    public subcomponentTypes: { name: string, type: string }[] = [{
        name: 'Bar, Horizontal (Aggregations)',
        type: 'bar-h'
    }, {
        name: 'Bar, Vertical (Aggregations)',
        type: 'bar-v'
    }, {
        name: 'Doughnut (Aggregations)',
        type: 'doughnut'
    }, {
        name: 'Histogram (Aggregations)',
        type: 'histogram'
    }, {
        name: 'Line (Aggregations)',
        type: 'line'
    }, {
        name: 'Line (Points)',
        type: 'line-xy'
    }, {
        name: 'Pie (Aggregations)',
        type: 'pie'
    }, {
        name: 'Scatter (Aggregations)',
        type: 'scatter'
    }, {
        name: 'Scatter (Points)',
        type: 'scatter-xy'
    }, {
        name: 'Table (Aggregations)',
        type: 'table'
    }];

    public legendActiveGroups: any[] = [];
    public legendFields: any[] = [];
    public legendGroups: any[] = [];

    public xList: any[] = [];
    public yList: any[] = [];

    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService,
        protected colorSchemeService: ColorSchemeService
    ) {

        super(
            activeGridService,
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            ref,
            visualizationService
        );

        this.options = new AggregationOptions(this.injector, this.datasetService, 'Aggregation', 10000);
    }

    /**
     * Adds the given filters in both neon and the visualization replacing all the existing filters unless doNotReplace is true.
     *
     * @arg {any} filter
     * @arg {neon.query.WherePredicate} neonFilter
     * @arg {boolean} [doNotReplace=false]
     */
    addOrReplaceFilter(filter: any, neonFilter: neon.query.WherePredicate, doNotReplace: boolean = false) {
        if (doNotReplace) {
            // If the new filter is unique, add the filter to the existing filters in both neon and the visualization.
            if (!this.findMatchingFilters(filter.field, filter.label, filter.value).length) {
                this.addVisualizationFilter(filter);
                this.addNeonFilter(true, filter, neonFilter);
            }
        } else {
            if (this.filters.length === 1) {
                // If we have a single existing filter, keep the ID and replace the old filter with the new filter.
                filter.id = this.filters[0].id;
                this.filters = [filter];
                this.replaceNeonFilter(true, filter, neonFilter);
            } else if (this.filters.length > 1) {
                // If we have multiple existing filters, remove all the old filters and add the new filter once done.
                // Use concat to copy the filter list.
                this.removeAllFilters([].concat(this.filters), () => {
                    this.filters = [filter];
                    this.addNeonFilter(true, filter, neonFilter);
                });
            } else {
                // If we don't have an existing filter, add the new filter.
                this.filters = [filter];
                this.addNeonFilter(true, filter, neonFilter);
            }
        }
    }

    /**
     * Adds the given filter object to the visualization and removes any existing filter object with ID matching the given filter ID.
     *
     * @arg {object} filter
     */
    addVisualizationFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        }).concat(filter);
    }

    /**
     * Creates and returns the query for the visualization.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);
        let groups: any[] = [];
        let wheres: neon.query.WherePredicate[] = [neon.query.where(this.options.xField.columnName, '!=', null)];

        if (this.options.xField.type === 'date') {
            switch (this.options.granularity) {
                case 'minute':
                    groups.push(new neon.query.GroupByFunctionClause('minute', this.options.xField.columnName, '_minute'));
                /* falls through */
                case 'hour':
                    groups.push(new neon.query.GroupByFunctionClause('hour', this.options.xField.columnName, '_hour'));
                    /* falls through */
                case 'day':
                    groups.push(new neon.query.GroupByFunctionClause('dayOfMonth', this.options.xField.columnName, '_day'));
                    /* falls through */
                case 'month':
                    groups.push(new neon.query.GroupByFunctionClause('month', this.options.xField.columnName, '_month'));
                    /* falls through */
                case 'year':
                    groups.push(new neon.query.GroupByFunctionClause('year', this.options.xField.columnName, '_year'));
                    /* falls through */
            }
            query.aggregate(neonVariables.MIN, this.options.xField.columnName, '_date').sortBy('_date', neonVariables.ASCENDING);
        } else if (!this.options.sortByAggregation) {
            groups.push(this.options.xField.columnName);
            query.sortBy(this.options.xField.columnName, neonVariables.ASCENDING);
        } else {
            groups.push(this.options.xField.columnName);
            query.sortBy('_aggregation', neonVariables.DESCENDING);
        }

        if (this.isXYSubcomponent(this.options.type)) {
            groups.push(this.options.yField.columnName);
            wheres.push(neon.query.where(this.options.yField.columnName, '!=', null));
        } else {
            switch (this.options.aggregation) {
                case 'average':
                    query.aggregate(neonVariables.AVG, this.options.aggregationField.columnName, '_aggregation');
                    break;
                case 'min':
                    query.aggregate(neonVariables.MIN, this.options.aggregationField.columnName, '_aggregation');
                    break;
                case 'max':
                    query.aggregate(neonVariables.MAX, this.options.aggregationField.columnName, '_aggregation');
                    break;
                case 'sum':
                    query.aggregate(neonVariables.SUM, this.options.aggregationField.columnName, '_aggregation');
                    break;
                case 'count':
                default:
                    query.aggregate(neonVariables.COUNT, '*', '_aggregation');
            }
        }

        if (this.options.groupField.columnName) {
            groups.push(this.options.groupField.columnName);
        }

        if (this.options.filter) {
            wheres.push(neon.query.where(this.options.filter.lhs, this.options.filter.operator, this.options.filter.rhs));
        }

        if (this.hasUnsharedFilter()) {
            wheres.push(neon.query.where(this.options.unsharedFilterField.columnName, '=', this.options.unsharedFilterValue));
        }

        return query.groupBy(groups).where(wheres.length > 1 ? neon.query.and.apply(neon.query, wheres) : wheres[0])
            .limit(this.options.limit);
    }

    /**
     * Returns the list of visualization filter objects matching the given properties.
     *
     * @arg {any} field
     * @arg {string} label
     * @arg {any} value
     * @return {any[]}
     */
    findMatchingFilters(field: any, label: string, value: any): any[] {
        return this.filters.filter((existingFilter) => {
            return _.isEqual(existingFilter.field, field) && _.isEqual(existingFilter.value, value) && existingFilter.label === label;
        });
    }

    /**
     * Creates and returns the text for the settings button and menu.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        if (!this.responseData.length || !this.activeData.length) {
            return 'No Data';
        }
        if (this.activeData.length === this.responseData.length) {
            return 'Total ' + super.prettifyInteger(this.activeData.length);
        }
        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1);
        let end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.responseData.length));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.responseData.length);
    }

    /**
     * Returns the filter list for the visualization.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return this.filters;
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization needed for the resizing behavior.
     *
     * @return {object} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs(): any {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    }

    /**
     * Returns the export fields for the visualization.
     *
     * @return {array}
     * @override
     */
    getExportFields(): any[] {
        let fields = [{
            columnName: this.options.xField.columnName,
            prettyName: this.options.xField.prettyName
        }];

        if (this.isXYSubcomponent(this.options.type)) {
            fields.push({
                columnName: this.options.yField.columnName,
                prettyName: this.options.yField.prettyName
            });
        } else if (this.options.aggregationField.columnName) {
            fields.push({
                columnName: this.options.aggregationField.columnName,
                prettyName: this.options.aggregationField.prettyName
            });
        }

        if (this.options.groupField.columnName) {
            fields.push({
                columnName: this.options.groupField.columnName,
                prettyName: this.options.groupField.prettyName
            });
        }

        return fields;
    }

    /**
     * Returns the list of filter IDs for the visualization to ignore.
     *
     * @return {array}
     * @override
     */
    getFiltersToIgnore(): string[] {
        if (!this.options.ignoreSelf) {
            return null;
        }

        // Get all the neon filters relevant to this visualization.
        let xNeonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.xField.columnName].concat(this.options.type === 'scatter-xy' ? this.options.yField.columnName : []));
        let groupNeonFilters = this.options.groupField.columnName ? this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, [this.options.groupField.columnName]) : [];

        let filterIdsToIgnore = xNeonFilters.concat(groupNeonFilters).map((neonFilter) => {
            return neonFilter.id;
        }).filter((neonFilterId) => {
            return this.filters.some((existingFilter) => {
                return neonFilterId === existingFilter.id;
            });
        });

        return filterIdsToIgnore.length ? filterIdsToIgnore : null;
    }

    /**
     * Returns the filter text for the given visualization filter object.
     *
     * @arg {any} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        if (filter.value.beginX && filter.value.endX) {
            let xText = filter.value.beginX + ' to ' + filter.value.endX;
            if (this.options.xField.type === 'date') {
                xText = moment.utc(filter.value.beginX).format('ddd, MMM D, YYYY, h:mm A') + ' to ' +
                    moment.utc(filter.value.endX).format('ddd, MMM D, YYYY, h:mm A');
            }
            if (filter.value.beginY && filter.value.endY && filter.prettyField.x && filter.prettyField.y) {
                return filter.prettyField.x + ' from ' + xText + ' and ' + filter.prettyField.y + ' from ' + filter.value.beginY + ' to ' +
                    filter.value.endY;
            }
            return filter.prettyField + ' from ' + xText;
        }
        return filter.prettyField + ' is ' + filter.label;
    }

    /**
     * Returns the hidden canvas element reference for the SubcomponentListener interface.
     *
     * @return {ElementRef}
     */
    getHiddenCanvas(): ElementRef {
        return this.hiddenCanvas;
    }

    /**
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
    }

    /**
     * Returns the label for the X Field in the gear option menu using the given subcomponent type.
     *
     * @arg {string} type
     * @return {string}
     */
    getXFieldLabel(type: string): string {
        switch (type) {
            case 'bar-h':
            case 'bar-v':
            case 'histogram':
                return 'Bar Field';
            case 'doughnut':
            case 'pie':
                return 'Slice Field';
            case 'table':
                return 'Row Field';
            case 'line':
            case 'line-xy':
            case 'scatter':
            case 'scatter-xy':
            default:
                return 'X Field';
        }
    }

    /**
     * Increases the page and updates the active data.
     */
    goToNextPage() {
        if (!this.lastPage) {
            this.page++;
            this.updateActiveData();
        }
    }

    /**
     * Decreases the page and updates the active data.
     */
    goToPreviousPage() {
        if (this.page !== 1) {
            this.page--;
            this.updateActiveData();
        }
    }

    /**
     * Updates properties and/or sub-components whenever a config option is changed and reruns the visualization query.
     *
     * @override
     */
    handleChangeData() {
        this.legendActiveGroups = [];
        this.legendGroups = [];
        this.legendFields = [];
        super.handleChangeData();
    }

    /**
     * Updates the sub-component and reruns the visualization query.
     */
    handleChangeSubcomponentType() {
        if (this.options.type !== this.options.newType) {
            this.options.type = this.options.newType;
            if (!this.isSortableByAggregation(this.options.type)) {
                this.options.sortByAggregation = false;
            }
            if (this.subcomponentObject) {
                this.subcomponentObject.destroy();
                this.subcomponentObject = null;
            }
            this.initializeSubcomponent();
            this.handleChangeData();
        }
    }

    /**
     * Handles a selected item in the legend.
     *
     * @arg {any} event
     */
    handleLegendItemSelected(event) {
        if (event.value && this.options.groupField.columnName) {
            let matching = this.findMatchingFilters(this.options.groupField.columnName, 'not ' + event.value, event.value);
            if (!matching.length) {
                let neonFilter = neon.query.where(this.options.groupField.columnName, '!=', event.value);
                this.addOrReplaceFilter({
                    id: undefined,
                    field: this.options.groupField.columnName,
                    label: 'not ' + event.value,
                    prettyField: this.options.groupField.prettyName,
                    value: event.value
                }, neonFilter, true);
            } else {
                this.removeLocalFilterFromLocalAndNeon(matching[0], true, true);
            }
        }
    }

    /**
     * Initializes the sub-component.
     */
    initializeSubcomponent() {
        switch (this.options.type) {
            case 'bar-h':
                this.subcomponentObject = new ChartJsBarSubcomponent(this.options, this, this.subcomponentHtml, true);
                break;
            case 'bar-v':
                this.subcomponentObject = new ChartJsBarSubcomponent(this.options, this, this.subcomponentHtml);
                break;
            case 'doughnut':
                this.subcomponentObject = new ChartJsDoughnutSubcomponent(this.options, this, this.subcomponentHtml);
                break;
            case 'histogram':
                this.subcomponentObject = new ChartJsHistogramSubcomponent(this.options, this, this.subcomponentHtml);
                break;
            case 'line':
            case 'line-xy':
                this.subcomponentObject = new ChartJsLineSubcomponent(this.options, this, this.subcomponentHtml);
                break;
            case 'pie':
                this.subcomponentObject = new ChartJsPieSubcomponent(this.options, this, this.subcomponentHtml);
                break;
            case 'scatter':
                this.subcomponentObject = new ChartJsScatterSubcomponent(this.options, this, this.subcomponentHtml, true);
                break;
            case 'scatter-xy':
                this.subcomponentObject = new ChartJsScatterSubcomponent(this.options, this, this.subcomponentHtml);
                break;
            default:
                this.subcomponentObject = null;
        }

        if (this.subcomponentObject) {
            // Do not call initialize inside the constructor due to how angular handles subclass property initialization.
            this.subcomponentObject.initialize();
        }
    }

    /**
     * Returns whether the given subcomponent type is scaled.
     *
     * @arg {string} type
     * @return {boolean}
     */
    isScaled(type: string): boolean {
        switch (type) {
            case 'bar-h':
            case 'bar-v':
            case 'histogram':
            case 'line':
            case 'line-xy':
            case 'scatter':
            case 'scatter-xy':
                return true;
            case 'doughnut':
            case 'pie':
            case 'table':
            default:
                return false;
        }
    }

    /**
     * Returns whether the given subcomponent type is sortable by aggregation.
     *
     * @arg {string} type
     * @return {boolean}
     */
    isSortableByAggregation(type: string): boolean {
        switch (type) {
            case 'bar-h':
            case 'bar-v':
            case 'doughnut':
            case 'histogram':
            case 'pie':
            case 'table':
                return true;
            case 'line':
            case 'line-xy':
            case 'scatter':
            case 'scatter-xy':
            default:
                return false;
        }
    }

    /**
     * Returns whether the data and fields for the visualization are valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        let validFields = this.options.xField.columnName &&
            (this.isXYSubcomponent(this.options.type) ? this.options.yField.columnName : true) &&
            (this.options.aggregation !== 'count' ? this.options.aggregationField.columnName : true);
        return !!(this.options.database.name && this.options.table.name && validFields);
    }

    /**
     * Returns whether the given subcomponent type requires both X and Y fields.
     *
     * @arg {string} type
     * @return {boolean}
     */
    isXYSubcomponent(type): boolean {
        return type === 'line-xy' || type === 'scatter-xy';
    }

    /**
     * Handles the query results for the visualization; updates and/or redraws any properties and/or sub-components as needed.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        this.page = 1;

        if (!response || !response.data || !response.data.length) {
            this.errorMessage = 'No Data';
            this.responseData = [];
            this.updateActiveData();
            return;
        }

        this.errorMessage = '';

        let isXY = this.isXYSubcomponent(this.options.type);
        let xExists = new Map<any, boolean>();
        let yExists = new Map<any, boolean>();
        let groupsToColors = new Map<string, Color>();
        if (!this.options.groupField.columnName) {
            groupsToColors.set(this.DEFAULT_GROUP, this.colorSchemeService.getColorFor('', this.DEFAULT_GROUP));
        }

        let findGroupColor = (group: string): Color => {
            let color = groupsToColors.get(group);
            if (!color) {
                color = this.colorSchemeService.getColorFor(this.options.groupField.columnName, group);
                groupsToColors.set(group, color);
            }
            return color;
        };

        let createTransformationFromItem = (item: any) => {
            let group = this.options.groupField.columnName ? item[this.options.groupField.columnName] : this.DEFAULT_GROUP;
            return {
                color: findGroupColor(group),
                group: group,
                x: item[this.options.xField.columnName],
                y: isXY ? item[this.options.yField.columnName] : item._aggregation
            };
        };

        if (this.options.xField.type === 'date') {
            switch (this.options.granularity) {
                case 'minute':
                case 'hour':
                    this.dateBucketizer = new DateBucketizer();
                    this.dateBucketizer.setGranularity(DateBucketizer.HOUR);
                    break;
                case 'day':
                    this.dateBucketizer = new DateBucketizer();
                    break;
                case 'month':
                    this.dateBucketizer = new MonthBucketizer();
                    break;
                case 'year':
                    this.dateBucketizer = new YearBucketizer();
                    break;
            }
            this.dateBucketizer.setStartDate(new Date(response.data[0]._date));
            this.dateBucketizer.setEndDate(new Date(response.data[response.data.length - 1]._date));

            let groupToTransformations = new Map<string, any[]>();

            // Add 1 to the domain length for months or years because the month and year bucketizers are not inclusive.
            let xDomainLength = this.dateBucketizer.getNumBuckets() + (this.options.granularity === 'month' ||
                this.options.granularity === 'year' ? 1 : 0);

            response.data.forEach((item) => {
                let transformation = createTransformationFromItem(item);
                let transformations = groupToTransformations.get(transformation.group);
                if (!transformations) {
                    transformations = new Array(xDomainLength).fill(undefined).map(() => {
                        return [];
                    });
                    groupToTransformations.set(transformation.group, transformations);
                }
                let index = this.dateBucketizer.getBucketIndex(new Date(item._date));
                transformation.x = moment(this.dateBucketizer.getDateForBucket(index)).toISOString();
                transformations[index].push(transformation);
            });

            this.responseData = Array.from(groupToTransformations.keys()).reduce((transformations, group) => {
                let nextTransformations = groupToTransformations.get(group);
                if (this.options.timeFill) {
                    nextTransformations = nextTransformations.map((transformationArray, index) => {
                        return transformationArray.length ? transformationArray : [{
                            color: findGroupColor(group),
                            group: group,
                            x: moment(this.dateBucketizer.getDateForBucket(index)).toISOString(),
                            y: 0
                        }];
                    });
                }
                return transformations.concat(_.flatten(nextTransformations.filter((transformationArray) => {
                    transformationArray.forEach((transformation) => {
                        xExists.set(transformation.x, true);
                        yExists.set(transformation.y, true);
                    });
                    return transformationArray.length;
                })));
            }, []);
        } else {
            this.dateBucketizer = null;

            this.responseData = response.data.map((item) => {
                let transformation = createTransformationFromItem(item);
                xExists.set(transformation.x, true);
                yExists.set(transformation.y, true);
                return transformation;
            });
        }

        if (!this.legendGroups.length) {
            this.legendGroups = Array.from(groupsToColors.keys());
        }

        let groups = Array.from(groupsToColors.keys());
        this.legendActiveGroups = this.legendGroups.filter((group) => {
            return groups.indexOf(group) >= 0;
        });

        this.xList = Array.from(xExists.keys());
        this.yList = Array.from(yExists.keys());
        this.updateActiveData();
    }

    /**
     * Handles any post-initialization behavior needed with properties or sub-components for the visualization.
     *
     * @override
     */
    postInit() {
        this.selectedAreaOffset.y = Number.parseInt(this.subcomponentHtml.nativeElement.style.paddingTop || '0');
        this.selectedAreaOffset.x = Number.parseInt(this.subcomponentHtml.nativeElement.style.paddingLeft || '0');

        this.executeQueryChain();
    }

    /**
     * Updates any properties and/or sub-components as needed.
     *
     * @override
     */
    refreshVisualization() {
        let findAxisType = (type) => {
            // https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html
            /* tslint:disable:prefer-switch */
            if (type === 'long' || type === 'integer' || type === 'short' || type === 'bype' || type === 'double' || type === 'float' ||
                type === 'half_float' || type === 'scaled_float') {
                return 'number';
            }
            /* tslint:enable:prefer-switch */
            return type === 'date' ? 'date' : 'string';
        };

        if (this.subcomponentObject) {
            let isXY = this.isXYSubcomponent(this.options.type);
            this.subcomponentObject.draw(this.activeData, {
                aggregationField: isXY ? undefined : this.options.aggregationField.prettyName,
                aggregationLabel: isXY ? undefined : this.options.aggregation,
                dataLength: this.activeData.length,
                xAxis: findAxisType(this.options.xField.type),
                xList: this.xList,
                yAxis: !isXY ? 'number' : findAxisType(this.options.yField.type),
                yList: this.yList
            });
            this.subOnResizeStop();
        }

        this.legendFields = this.options.groupField.columnName ? [this.options.groupField.columnName] : [''];
    }

    /**
     * Removes the given visualization filter object from this visualization.
     *
     * @arg {object} filter
     * @override
     */
    removeFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        });
        this.selectedArea = null;
        this.subcomponentObject.deselect(filter.value);
    }

    /**
     * Updates the filters for the visualization on initialization or whenever filters are changed externally.
     *
     * @override
     */
    setupFilters() {
        // TODO
    }

    /**
     * Returns whether any components are shown in the footer-container.
     *
     * @return {boolean}
     */
    showFooterContainer(): boolean {
        return this.activeData.length < this.responseData.length;
    }

    /**
     * Deselects the selected area.  From SubcomponentListener.
     *
     * @override
     */
    subcomponentRequestsDeselect() {
        this.selectedArea = null;
    }

    /**
     * Filters the given item.  From SubcomponentListener.
     *
     * @arg {any} value
     * @arg {boolean} doNotReplace
     * @override
     */
    subcomponentRequestsFilter(item: any, doNotReplace: boolean = false) {
        let neonFilter = neon.query.where(this.options.xField.columnName, '=', item);
        this.addOrReplaceFilter({
            id: undefined,
            field: this.options.xField.columnName,
            label: '' + item,
            prettyField: this.options.xField.prettyName,
            value: item
        }, neonFilter, doNotReplace);
    }

    /**
     * Filters the given bounds.  From SubcomponentListener.
     *
     * @arg {any} beginX
     * @arg {any} beginY
     * @arg {any} endX
     * @arg {any} endY
     * @arg {boolean} doNotReplace
     * @override
     */
    subcomponentRequestsFilterOnBounds(beginX: any, beginY, endX: any, endY, doNotReplace: boolean = false) {
        if (!this.options.ignoreSelf) {
            this.selectedArea = null;
        }

        let neonFilter = neon.query.and.apply(neon.query, [
            neon.query.where(this.options.xField.columnName, '>=', beginX),
            neon.query.where(this.options.yField.columnName, '>=', beginY),
            neon.query.where(this.options.xField.columnName, '<=', endX),
            neon.query.where(this.options.yField.columnName, '<=', endY)
        ]);
        this.addOrReplaceFilter({
            id: undefined,
            field: {
                x: this.options.xField.columnName,
                y: this.options.yField.columnName
            },
            label: '',
            prettyField: {
                x: this.options.xField.prettyName,
                y: this.options.yField.prettyName
            },
            value: {
                beginX: beginX,
                beginY: beginY,
                endX: endX,
                endY: endY
            }
        }, neonFilter, doNotReplace);
    }

    /**
     * Filters the given domain.  From SubcomponentListener.
     *
     * @arg {any} beginX
     * @arg {any} endX
     * @arg {boolean} doNotReplace
     * @override
     */
    subcomponentRequestsFilterOnDomain(beginX: any, endX: any, doNotReplace: boolean = false) {
        if (!this.options.ignoreSelf) {
            this.selectedArea = null;
        }

        let neonFilter = neon.query.and.apply(neon.query, [
            neon.query.where(this.options.xField.columnName, '>=', beginX),
            neon.query.where(this.options.xField.columnName, '<=', endX)
        ]);
        this.addOrReplaceFilter({
            id: undefined,
            field: this.options.xField.columnName,
            label: '',
            prettyField: this.options.xField.prettyName,
            value: {
                beginX: beginX,
                endX: endX
            }
        }, neonFilter, doNotReplace);
    }

    /**
     * Redraws the component.  From SubcomponentListener.
     *
     * @arg {event} [event]
     * @override
     */
    subcomponentRequestsRedraw(event?) {
        if (event) {
            this.stopEventPropagation(event);
        }
        this.changeDetection.detectChanges();
    }

    /**
     * Selects the given area.  From SubcomponentListener.
     *
     * @arg {any} x
     * @arg {any} y
     * @arg {any} width
     * @arg {any} height
     *
     * @override
     */
    subcomponentRequestsSelect(x: number, y: number, width: number, height: number) {
        this.selectedArea = {
            height: height,
            width: width,
            x: this.selectedAreaOffset.x + x,
            y: this.selectedAreaOffset.y + y
        };
    }

    /**
     * Sets the visualization fields and properties in the given bindings object needed to save layout states.
     *
     * @arg {object} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.aggregationField = this.options.aggregationField.columnName;
        bindings.groupField = this.options.groupField.columnName;
        bindings.xField = this.options.xField.columnName;
        bindings.yField = this.options.yField.columnName;

        bindings.aggregation = this.options.aggregation;
        bindings.granularity = this.options.granularity;
        bindings.hideGridLines = this.options.hideGridLines;
        bindings.hideGridTicks = this.options.hideGridTicks;
        bindings.ignoreSelf = this.options.ignoreSelf;
        bindings.lineCurveTension = this.options.lineCurveTension;
        bindings.lineFillArea = this.options.lineFillArea;
        bindings.logScaleX = this.options.logScaleX;
        bindings.logScaleY = this.options.logScaleY;
        bindings.scaleMaxX = this.options.scaleMaxX;
        bindings.scaleMaxY = this.options.scaleMaxY;
        bindings.scaleMinX = this.options.scaleMinX;
        bindings.scaleMinY = this.options.scaleMinY;
        bindings.sortByAggregation = this.options.sortByAggregation;
        bindings.timeFill = this.options.timeFill;
        bindings.type = this.options.type;
        bindings.yPercentage = this.options.yPercentage;
    }

    /**
     * Updates properties and/or sub-components whenever the limit is changed and reruns the visualization query.
     *
     * @override
     */
    subHandleChangeLimit() {
        this.legendActiveGroups = [];
        this.legendGroups = [];
        this.legendFields = [];
        super.subHandleChangeLimit();
    }

    /**
     * Deletes any properties and/or sub-components needed.
     *
     * @override
     */
    subNgOnDestroy() {
        if (this.subcomponentObject) {
            this.subcomponentObject.destroy();
        }
    }

    /**
     * Initializes any properties and/or sub-components needed once databases, tables, fields, and other options properties are set.
     *
     * @override
     */
    subNgOnInit() {
        this.initializeSubcomponent();
    }

    /**
     * Resizes the sub-components.
     *
     * @override
     */
    subOnResizeStop() {
        if (this.subcomponentObject) {
            this.minimumDimensions = this.subcomponentObject.getMinimumDimensions();
            this.subcomponentObject.redraw();
            // TODO Update selectedArea.
        }
    }

    /**
     * Updates the pagination properties and the active data.
     */
    updateActiveData() {
        let offset = (this.page - 1) * this.options.limit;
        this.activeData = this.responseData.slice(offset, (offset + this.options.limit));
        this.lastPage = (this.responseData.length <= (offset + this.options.limit));
        this.refreshVisualization();
    }
}
