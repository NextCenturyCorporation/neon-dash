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
import { ListSubcomponent } from './subcomponent.list';
import { FieldMetaData } from '../../dataset';
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
    public dualView: string;
    public granularity: string;
    public hideGridLines: boolean;
    public hideGridTicks: boolean;
    public ignoreSelf: boolean;
    public lineCurveTension: number;
    public lineFillArea: boolean;
    public logScaleX: boolean;
    public logScaleY: boolean;
    public newType: string;
    public notFilterable: boolean;
    public requireAll: boolean;
    public savePrevious: boolean;
    public scaleMaxX: string;
    public scaleMaxY: string;
    public scaleMinX: string;
    public scaleMinY: string;
    public showHeat: boolean;
    public sortByAggregation: boolean;
    public timeFill: boolean;
    public type: string;
    public yPercentage: number;

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        bindings.aggregation = this.aggregation;
        bindings.dualView = this.dualView;
        bindings.granularity = this.granularity;
        bindings.hideGridLines = this.hideGridLines;
        bindings.hideGridTicks = this.hideGridTicks;
        bindings.ignoreSelf = this.ignoreSelf;
        bindings.lineCurveTension = this.lineCurveTension;
        bindings.lineFillArea = this.lineFillArea;
        bindings.logScaleX = this.logScaleX;
        bindings.logScaleY = this.logScaleY;
        bindings.notFilterable = this.notFilterable;
        bindings.requireAll = this.requireAll;
        bindings.savePrevious = this.savePrevious;
        bindings.scaleMaxX = this.scaleMaxX;
        bindings.scaleMaxY = this.scaleMaxY;
        bindings.scaleMinX = this.scaleMinX;
        bindings.scaleMinY = this.scaleMinY;
        bindings.showHeat = this.showHeat;
        bindings.sortByAggregation = this.sortByAggregation;
        bindings.timeFill = this.timeFill;
        bindings.type = this.type;
        bindings.yPercentage = this.yPercentage;

        return bindings;
    }

    /**
     * Returns the list of field properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldProperties(): string[] {
        return [
            'aggregationField',
            'groupField',
            'xField',
            'yField'
        ];
    }

    /**
     * Returns the list of field array properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldArrayProperties(): string[] {
        return [];
    }

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @override
     */
    initializeNonFieldBindings() {
        this.aggregation = this.injector.get('aggregation', 'count');
        this.dualView = this.injector.get('dualView', '');
        this.granularity = this.injector.get('granularity', 'year');
        this.hideGridLines = this.injector.get('hideGridLines', false);
        this.hideGridTicks = this.injector.get('hideGridTicks', false);
        this.ignoreSelf = this.injector.get('ignoreSelf', false);
        this.lineCurveTension = this.injector.get('lineCurveTension', 0.3);
        this.lineFillArea = this.injector.get('lineFillArea', false);
        this.logScaleX = this.injector.get('logScaleX', false);
        this.logScaleY = this.injector.get('logScaleY', false);
        this.notFilterable = this.injector.get('notFilterable', false);
        this.requireAll = this.injector.get('requireAll', false);
        this.savePrevious = this.injector.get('savePrevious', false);
        this.scaleMaxX = this.injector.get('scaleMaxX', '');
        this.scaleMaxY = this.injector.get('scaleMaxY', '');
        this.scaleMinX = this.injector.get('scaleMinX', '');
        this.scaleMinY = this.injector.get('scaleMinY', '');
        this.showHeat = this.injector.get('showHeat', false);
        this.sortByAggregation = this.injector.get('sortByAggregation', false);
        this.timeFill = this.injector.get('timeFill', false);
        this.type = this.injector.get('type', 'line');
        this.yPercentage = this.injector.get('yPercentage', 0.3);
        this.newType = this.type;
    }
}

class Filter {
    public field: string | { x: string, y: string };
    public label: string;
    public neonFilter: neon.query.WherePredicate;
    public prettyField: string | { x: string, y: string };
    public value: any | { beginX: any, endX: any } | { beginX: any, beginY: any, endX: any, endY: any };
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
    @ViewChild('subcomponentMain') subcomponentMainElementRef: ElementRef;
    @ViewChild('subcomponentZoom') subcomponentZoomElementRef: ElementRef;

    private DEFAULT_GROUP: string = 'All';

    public filterToPassToSuperclass: {
        id?: string
    } = {};

    public groupFilters: Filter[] = [];
    public valueFilters: Filter[] = [];

    public options: AggregationOptions;

    // The data pagination properties.
    public lastPage: boolean = true;
    public page: number = 1;

    // The data shown in the visualization (limited).
    public activeData: any[] = [];
    protected totalY: number = 0;

    // The data returned by the visualization query response (not limited).
    public responseData: any[] = [];

    // The bucketizer for any date data.
    public dateBucketizer: any;

    // The minimum dimensions for the subcomponent.
    public minimumDimensionsMain: {
        height: number,
        width: number
    } = {
        height: 50,
        width: 50
    };
    public minimumDimensionsZoom: {
        height: number,
        width: number
    } = {
        height: 50,
        width: 50
    };

    // The selected area on the subcomponent (box or range).
    public selectedArea: {
        height: number,
        width: number,
        x: number,
        y: number
    } = null;

    // The selected area offset from the subcomponent location.
    public selectedAreaOffset: {
        x: number,
        y: number
    } = {
        x: 0,
        y: 0
    };

    // The subcomponents.  If dualView is on, both are used.  Otherwise, only main is used.
    public subcomponentMain: AbstractAggregationSubcomponent;
    public subcomponentZoom: AbstractAggregationSubcomponent;

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
        name: 'Text List (Aggregations)',
        type: 'list'
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

        // Check for the boolean value true (not just any truthy value) and fix it.
        this.options.dualView = ('' + this.options.dualView) === 'true' ? 'on' : this.options.dualView;
        if (!this.allowDualView(this.options.type)) {
            this.options.dualView = '';
        }
    }

    /**
     * Returns whether the given subcomponent type allows dual view.
     *
     * @arg {string} type
     * @return {boolean}
     */
    allowDualView(type: string): boolean {
        switch (type) {
            case 'histogram':
            case 'line':
            case 'line-xy':
                return true;
            case 'bar-h':
            case 'bar-v':
            case 'doughnut':
            case 'list':
            case 'pie':
            case 'scatter':
            case 'scatter-xy':
            default:
                return false;
        }
    }

    /**
     * Returns the pretty text for the given filter object.
     *
     * @arg {Filter} filter
     * @return {string}
     */
    createFilterPrettyText(filter: any): string {
        if (typeof filter.value === 'object' && filter.value.beginX && filter.value.endX) {
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
     * Creates (and replaces) or removes the neon filter using the visualization filters.
     */
    createOrRemoveNeonFilter() {
        // Always AND all group filters.
        let groupNeonFilters = this.groupFilters.length > 1 ? neon.query.and.apply(neon.query, this.groupFilters.map((filter) => {
            return filter.neonFilter;
        })) : (this.groupFilters.length === 1 ? this.groupFilters[0].neonFilter : null);

        let neonFunction = this.options.requireAll ? neon.query.and : neon.query.or;
        let valueNeonFilters = this.valueFilters.length > 1 ? neonFunction.apply(neon.query, this.valueFilters.map((filter) => {
            return filter.neonFilter;
        })) : (this.valueFilters.length === 1 ? this.valueFilters[0].neonFilter : null);

        let neonFilter = groupNeonFilters && valueNeonFilters ? neon.query.and.apply(neon.query, [groupNeonFilters, valueNeonFilters]) :
            (groupNeonFilters || valueNeonFilters);

        if (neonFilter) {
            let runQuery = !this.options.ignoreSelf || !!this.options.dualView;
            if (this.filterToPassToSuperclass.id) {
                this.replaceNeonFilter(runQuery, this.filterToPassToSuperclass, neonFilter);
            } else {
                this.addNeonFilter(runQuery, this.filterToPassToSuperclass, neonFilter);
            }
        } else if (this.filterToPassToSuperclass.id) {
            this.removeLocalFilterFromLocalAndNeon(this.filterToPassToSuperclass, true, true);
        }
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
     * Creates and returns the text for the settings button and menu.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        if (!this.responseData.length || !this.activeData.length) {
            if (this.options.hideUnfiltered) {
                return 'Please Filter';
            }
            return 'No Data';
        }
        if (this.activeData.length === this.responseData.length) {
            return 'Total ' + super.prettifyInteger(this.totalY);
        }
        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1);
        let end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.responseData.length));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.responseData.length);
    }

    /**
     * Returns the superclass filter object.
     *
     * @return {any[]}
     * @override
     */
    getCloseableFilters(): any[] {
        return this.filterToPassToSuperclass.id ? [this.filterToPassToSuperclass] : [];
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
     * Returns the list of filter IDs for the visualization to ignore.
     *
     * @return {array}
     * @override
     */
    getFiltersToIgnore(): string[] {
        if (!this.options.ignoreSelf) {
            return null;
        }

        let groupNeonFilters = this.options.groupField.columnName ? this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, [this.options.groupField.columnName]) : [];
        let valueNeonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.xField.columnName].concat(this.options.type === 'scatter-xy' ? this.options.yField.columnName : []));

        let filterIdsToIgnore = groupNeonFilters.concat(valueNeonFilters).map((neonFilter) => {
            return neonFilter.id;
        }).filter((neonFilterId) => {
            return neonFilterId === this.filterToPassToSuperclass.id;
        });

        return filterIdsToIgnore.length ? filterIdsToIgnore : null;
    }

    /**
     * Returns the text for the superclass filter object.
     *
     * @arg {any} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        let filters = this.groupFilters.concat(this.valueFilters);
        return filters.length === 1 ? this.createFilterPrettyText(filters[0]) : filters.length + ' Filters';
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
            case 'list':
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
        this.xList = [];
        this.yList = [];
        super.handleChangeData();
    }

    /**
     * Updates the sub-component and reruns the visualization query.
     */
    handleChangeSubcomponentType() {
        if (this.options.type !== this.options.newType) {
            this.options.type = this.options.newType;
            if (!this.allowDualView(this.options.type)) {
                this.options.dualView = '';
            }
            if (this.isContinuous(this.options.type)) {
                this.options.sortByAggregation = false;
            }
            this.redrawSubcomponents();
        }
    }

    /**
     * Handles a selected item in the legend.
     *
     * @arg {any} event
     */
    handleLegendItemSelected(event) {
        if (event.value && this.options.groupField.columnName && !this.options.notFilterable) {
            let neonFilter = neon.query.where(this.options.groupField.columnName, '!=', event.value);
            let filter = {
                field: this.options.groupField.columnName,
                label: 'not ' + event.value,
                neonFilter: neon.query.where(this.options.groupField.columnName, '!=', event.value),
                prettyField: this.options.groupField.prettyName,
                value: event.value
            };
            this.toggleFilter(this.groupFilters, filter);
        }
    }

    /**
     * Initializes the sub-component.
     *
     * @arg {ElementRef} elementRef
     * @arg {boolean} cannotSelect
     * @return {AbstractAggregationSubcomponent}
     */
    initializeSubcomponent(elementRef: ElementRef, cannotSelect: boolean = false): AbstractAggregationSubcomponent {
        let subcomponentObject = null;

        switch (this.options.type) {
            case 'bar-h':
                subcomponentObject = new ChartJsBarSubcomponent(this.options, this, elementRef, cannotSelect, true);
                break;
            case 'bar-v':
                subcomponentObject = new ChartJsBarSubcomponent(this.options, this, elementRef, cannotSelect);
                break;
            case 'doughnut':
                subcomponentObject = new ChartJsDoughnutSubcomponent(this.options, this, elementRef, cannotSelect);
                break;
            case 'histogram':
                subcomponentObject = new ChartJsHistogramSubcomponent(this.options, this, elementRef, cannotSelect);
                break;
            case 'line':
            case 'line-xy':
                subcomponentObject = new ChartJsLineSubcomponent(this.options, this, elementRef, cannotSelect);
                break;
            case 'list':
                subcomponentObject = new ListSubcomponent(this.options, this, elementRef, cannotSelect);
                break;
            case 'pie':
                subcomponentObject = new ChartJsPieSubcomponent(this.options, this, elementRef, cannotSelect);
                break;
            case 'scatter':
                subcomponentObject = new ChartJsScatterSubcomponent(this.options, this, elementRef, cannotSelect, true);
                break;
            case 'scatter-xy':
                subcomponentObject = new ChartJsScatterSubcomponent(this.options, this, elementRef, cannotSelect);
                break;
        }

        if (subcomponentObject) {
            // Do not call initialize inside the constructor due to how angular handles subclass property initialization.
            subcomponentObject.initialize();
        }

        return subcomponentObject;
    }

    /**
     * Returns whether the given subcomponent type is continuous.
     *
     * @arg {string} type
     * @return {boolean}
     */
    isContinuous(type: string): boolean {
        switch (type) {
            case 'histogram':
            case 'line':
            case 'line-xy':
            case 'scatter':
            case 'scatter-xy':
                return true;
            case 'bar-h':
            case 'bar-v':
            case 'doughnut':
            case 'list':
            case 'pie':
            default:
                return false;
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
            case 'list':
            case 'pie':
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
        let xList = [];
        let yList = [];
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

        if (!isXY) {
            response.data = response.data.filter((item) => {
                return item._aggregation !== 'NaN';
            });
        }

        if (this.options.xField.type === 'date') {
            // Transform date data.
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

            let beginDate = this.options.savePrevious && this.xList.length ? this.xList[0] : response.data[0]._date;
            let endDate = this.options.savePrevious && this.xList.length ? this.xList[this.xList.length - 1] :
                response.data[response.data.length - 1]._date;
            this.dateBucketizer.setStartDate(new Date(beginDate));
            this.dateBucketizer.setEndDate(new Date(endDate));

            let groupToTransformations = new Map<string, any[]>();

            // Add 1 to the domain length for months or years because the month and year bucketizers are not inclusive.
            let xDomainLength = this.dateBucketizer.getNumBuckets() + (this.options.granularity === 'month' ||
                this.options.granularity === 'year' ? 1 : 0);

            // Create the X list now so it is properly sorted.  Items will be removed as needed.
            xList = _.range(xDomainLength).map((index) => {
                return moment(this.dateBucketizer.getDateForBucket(index)).toISOString();
            });

            response.data.forEach((item) => {
                let transformation = createTransformationFromItem(item);
                let transformations = groupToTransformations.get(transformation.group);
                if (!transformations) {
                    // Create an empty array for each date bucket.
                    transformations = new Array(xDomainLength).fill(undefined).map(() => {
                        return [];
                    });
                    groupToTransformations.set(transformation.group, transformations);
                }
                let index = this.dateBucketizer.getBucketIndex(new Date(item._date));
                // Fix the X so it is a readable date string.
                transformation.x = moment(this.dateBucketizer.getDateForBucket(index)).toISOString();
                transformations[index].push(transformation);
            });

            // Save each X that exists in order to update the xList.
            let xExists = new Map<any, boolean>();

            this.responseData = Array.from(groupToTransformations.keys()).reduce((transformations, group) => {
                let nextTransformations = groupToTransformations.get(group);
                if (this.options.timeFill) {
                    nextTransformations = nextTransformations.map((transformationArray, index) => {
                        // If timeFill is true and the date bucket is an empty array, replace it with a single item with a Y of zero.
                        return transformationArray.length ? transformationArray : [{
                            color: findGroupColor(group),
                            group: group,
                            x: moment(this.dateBucketizer.getDateForBucket(index)).toISOString(),
                            y: 0
                        }];
                    });
                }

                // Update the X and Y lists, remove each empty array, and flatten all date buckets into one big array.
                return transformations.concat(_.flatten(nextTransformations.filter((transformationArray) => {
                    transformationArray.forEach((transformation) => {
                        xExists.set(transformation.x, true);
                        if (yList.indexOf(transformation.y) < 0) {
                            yList.push(transformation.y);
                        }
                    });
                    return transformationArray.length;
                })));
            }, []);

            // Remove each X from the list that does not exist in the data unless the subcomponent is a histogram.
            if (this.options.type !== 'histogram') {
                xList = xList.filter((x) => {
                    return xExists.get(x);
                });
            }
        } else {
            // Transform non-date data.
            this.dateBucketizer = null;

            this.responseData = response.data.map((item) => {
                let transformation = createTransformationFromItem(item);

                if (xList.indexOf(transformation.x) < 0) {
                    xList.push(transformation.x);
                }
                if (yList.indexOf(transformation.y) < 0) {
                    yList.push(transformation.y);
                }

                return transformation;
            });

            // TODO Add missing X to xList of numeric histograms.
        }

        // Set the legend groups once with the original groups.  Then (always) update the active groups with the groups in the active data.
        let groups = Array.from(groupsToColors.keys()).sort();
        if (!this.legendGroups.length) {
            this.legendGroups = groups;
        }

        this.legendActiveGroups = this.legendGroups.filter((group) => {
            return groups.indexOf(group) >= 0;
        });

        this.xList = this.options.savePrevious && this.xList.length ? this.xList : xList;
        this.yList = yList;
        this.updateActiveData();
    }

    /**
     * Handles any post-initialization behavior needed with properties or sub-components for the visualization.
     *
     * @override
     */
    postInit() {
        this.executeQueryChain();
    }

    /**
     * Redraws the subcomponents.
     */
    redrawSubcomponents() {
        if (this.subcomponentMain) {
            this.subcomponentMain.destroy();
            this.subcomponentMain = null;
        }
        if (this.subcomponentZoom) {
            this.subcomponentZoom.destroy();
            this.subcomponentZoom = null;
        }
        this.subcomponentMain = this.initializeSubcomponent(this.subcomponentMainElementRef);
        if (this.options.dualView) {
            this.subcomponentZoom = this.initializeSubcomponent(this.subcomponentZoomElementRef, true);
        }
        this.refreshVisualization(true);
    }

    /**
     * Updates any properties and/or sub-components as needed.
     *
     * @arg {boolean} [redrawMain=false]
     * @override
     */
    refreshVisualization(redrawMain: boolean = false) {
        let findAxisType = (type) => {
            // https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html
            /* tslint:disable:prefer-switch */
            if (type === 'long' || type === 'integer' || type === 'short' || type === 'byte' || type === 'double' || type === 'float' ||
                type === 'half_float' || type === 'scaled_float') {
                return 'number';
            }
            /* tslint:enable:prefer-switch */
            return type === 'date' ? 'date' : 'string';
        };

        let isXY = this.isXYSubcomponent(this.options.type);
        let meta = {
            aggregationField: isXY ? undefined : this.options.aggregationField.prettyName,
            aggregationLabel: isXY ? undefined : this.options.aggregation,
            dataLength: this.activeData.length,
            groups: this.legendGroups,
            sort: this.options.sortByAggregation ? 'y' : 'x',
            xAxis: findAxisType(this.options.xField.type),
            xList: this.xList,
            yAxis: !isXY ? 'number' : findAxisType(this.options.yField.type),
            yList: this.yList
        };

        // Update the overview if dualView is off or if it is not filtered.  It will only show the unfiltered data.
        if (this.subcomponentMain && (redrawMain || !this.options.dualView || !this.filterToPassToSuperclass.id)) {
            this.subcomponentMain.draw(this.activeData, meta);
        }

        // Update the zoom if dualView is truthy.  It will show both the unfiltered and filtered data.
        if (this.subcomponentZoom && this.options.dualView) {
            this.subcomponentZoom.draw(this.activeData, meta);
        }

        this.subOnResizeStop();

        this.legendFields = this.options.groupField.columnName ? [this.options.groupField.columnName] : [''];
        this.totalY = this.activeData.reduce((a, b) => ({ y: (a.y + b.y) }), { y: 0 }).y;
    }

    /**
     * Deselects the selected area and removes the superclass filter object and all visualization filters.
     *
     * @arg {any} filter
     * @override
     */
    removeFilter(filter: any) {
        if (filter.id === this.filterToPassToSuperclass.id) {
            this.filterToPassToSuperclass = {};
            this.groupFilters = [];
            this.valueFilters = [];
            this.selectedArea = null;
            this.subcomponentMain.deselect();
        }
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
     * Returns whether to show both the main and the zoom views.
     *
     * @return {boolean}
     */
    showBothViews(): boolean {
        return this.options.dualView === 'on' || (this.options.dualView === 'filter' && !!this.filterToPassToSuperclass.id);
    }

    /**
     * Returns whether any components are shown in the footer container.
     *
     * @return {boolean}
     */
    showFooterContainer(): boolean {
        return this.activeData.length < this.responseData.length;
    }

    /**
     * Returns whether any components are shown in the header container.
     *
     * @return {boolean}
     */
    showHeaderContainer(): boolean {
        return this.showLegend() || !!this.groupFilters.length || !!this.valueFilters.length;
    }

    /**
     * Returns whether the legend is shown.
     *
     * @return {boolean}
     */
    showLegend(): boolean {
        // Always show the legend for a line or scatter chart in order to avoid a bug resizing the selected area within the chart.
        /* tslint:disable:prefer-switch */
        if (this.options.type === 'line' || this.options.type === 'line-xy' || this.options.type === 'scatter' ||
            this.options.type === 'scatter-xy') {
            return true;
        }
        /* tslint:enable:prefer-switch */
        return this.legendGroups.length > 1;
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
     * Filters the given value.  From SubcomponentListener.
     *
     * @arg {string} group
     * @arg {any} value
     * @arg {boolean} doNotReplace
     * @override
     */
    subcomponentRequestsFilter(group: string, value: any, doNotReplace: boolean = false) {
        if (this.options.notFilterable) {
            return;
        }

        let neonFilter = neon.query.where(this.options.xField.columnName, '=', value);
        let filter = {
            field: this.options.xField.columnName,
            label: '' + value,
            neonFilter: neonFilter,
            prettyField: this.options.xField.prettyName,
            value: value
        };
        if (doNotReplace) {
            this.toggleFilter(this.valueFilters, filter);
        } else {
            this.valueFilters = [filter];
            this.createOrRemoveNeonFilter();
        }
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
        if (!(this.options.dualView || this.options.ignoreSelf)) {
            this.selectedArea = null;
        }

        if (this.options.notFilterable) {
            return;
        }

        let neonFilter = neon.query.and.apply(neon.query, [
            neon.query.where(this.options.xField.columnName, '>=', beginX),
            neon.query.where(this.options.yField.columnName, '>=', beginY),
            neon.query.where(this.options.xField.columnName, '<=', endX),
            neon.query.where(this.options.yField.columnName, '<=', endY)
        ]);
        let filter = {
            field: {
                x: this.options.xField.columnName,
                y: this.options.yField.columnName
            },
            label: '',
            neonFilter: neonFilter,
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
        };
        if (doNotReplace) {
            this.toggleFilter(this.valueFilters, filter);
        } else {
            this.valueFilters = [filter];
            this.createOrRemoveNeonFilter();
        }
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
        if (!(this.options.dualView || this.options.ignoreSelf)) {
            this.selectedArea = null;
        }

        if (this.options.notFilterable) {
            return;
        }

        let neonFilter = neon.query.and.apply(neon.query, [
            neon.query.where(this.options.xField.columnName, '>=', beginX),
            neon.query.where(this.options.xField.columnName, '<=', endX)
        ]);
        let filter = {
            field: this.options.xField.columnName,
            label: '',
            neonFilter: neonFilter,
            prettyField: this.options.xField.prettyName,
            value: {
                beginX: beginX,
                endX: endX
            }
        };
        if (doNotReplace) {
            this.toggleFilter(this.valueFilters, filter);
        } else {
            this.valueFilters = [filter];
            this.createOrRemoveNeonFilter();
        }
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
        /* tslint:disable:no-string-literal */
        if (!this.changeDetection['destroyed']) {
            this.changeDetection.detectChanges();
        }
        /* tslint:enable:no-string-literal */
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
        this.selectedAreaOffset = {
            x: Number.parseInt(this.subcomponentMainElementRef.nativeElement.offsetLeft || '0'),
            y: Number.parseInt(this.subcomponentMainElementRef.nativeElement.offsetTop || '0')
        };
        this.selectedArea = {
            height: height,
            width: width,
            x: x,
            y: y
        };
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
        this.xList = [];
        this.yList = [];
        super.subHandleChangeLimit();
    }

    /**
     * Deletes any properties and/or sub-components needed.
     *
     * @override
     */
    subNgOnDestroy() {
        if (this.subcomponentMain) {
            this.subcomponentMain.destroy();
        }
        if (this.subcomponentZoom) {
            this.subcomponentZoom.destroy();
        }
    }

    /**
     * Initializes any properties and/or sub-components needed once databases, tables, fields, and other options properties are set.
     *
     * @override
     */
    subNgOnInit() {
        this.subcomponentMain = this.initializeSubcomponent(this.subcomponentMainElementRef);
        if (this.options.dualView) {
            this.subcomponentZoom = this.initializeSubcomponent(this.subcomponentZoomElementRef, true);
        }
    }

    /**
     * Resizes the sub-components.
     *
     * @override
     */
    subOnResizeStop() {
        if (this.subcomponentMain) {
            this.minimumDimensionsMain = this.subcomponentMain.getMinimumDimensions();
            this.subcomponentMain.redraw();
        }

        if (this.subcomponentZoom) {
            this.minimumDimensionsZoom = this.subcomponentZoom.getMinimumDimensions();
            this.subcomponentZoom.redraw();
        }

        // Update the selected area and offset AFTER redrawing the subcomponents.
        this.selectedAreaOffset = {
            x: Number.parseInt(this.subcomponentMainElementRef.nativeElement.offsetLeft || '0'),
            y: Number.parseInt(this.subcomponentMainElementRef.nativeElement.offsetTop || '0')
        };

        // Change the height of the selected area if the dual view was changed (and the height of the main subcomponent was changed).
        if (this.selectedArea) {
            // Subtract 30 pixels for the height of the X axis.
            let subcomponentHeight = this.subcomponentMainElementRef.nativeElement.clientHeight - (this.options.hideGridTicks ? 10 : 30);
            if (this.options.dualView) {
                this.selectedArea.height = Math.min(this.selectedArea.height, subcomponentHeight);
            } else {
                this.selectedArea.height = Math.max(this.selectedArea.height, subcomponentHeight);
            }
        }

        // TODO Update the selectedArea if the visualization was resized.
    }

    /**
     * Toggles the given filter in the given filter list and recreates or removes the neon filter.
     *
     * @arg {Filter} filter
     */
    toggleFilter(filters: any[], filter: any) {
        let indexMatches = filters.reduce((indexArray, existingFilter, index) => {
            if (_.isEqual(existingFilter.field, filter.field) && _.isEqual(existingFilter.value, filter.value) &&
                existingFilter.label === filter.label) {
                indexArray.push(index);
            }
            return indexArray;
        }, []);

        if (indexMatches.length) {
            indexMatches.reverse().forEach((indexMatch) => {
                let existingFilter = filters.splice(indexMatch, 1);
                this.subcomponentMain.deselect(existingFilter[0].value);
            });
        } else {
            filters.push(filter);
        }

        this.createOrRemoveNeonFilter();
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
