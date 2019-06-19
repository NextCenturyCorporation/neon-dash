/**
 * Copyright 2019 Next Century Corporation
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
 */
import {
    AfterViewInit,
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

import { Color } from '../../models/color';

import {
    AbstractSearchService,
    AggregationType,
    CompoundFilterType,
    FilterClause,
    QueryGroup,
    QueryPayload,
    SortOrder,
    TimeInterval
} from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import {
    CompoundFilterDesign,
    FilterBehavior,
    FilterDesign,
    FilterService,
    FilterUtil,
    SimpleFilterDesign
} from '../../services/filter.service';

import {
    AbstractAggregationSubcomponent,
    AggregationSubcomponentListener
} from './subcomponent.aggregation.abstract';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ChartJsBarSubcomponent } from './subcomponent.chartjs.bar';
import { ChartJsDoughnutSubcomponent } from './subcomponent.chartjs.doughnut';
import { ChartJsHistogramSubcomponent } from './subcomponent.chartjs.histogram';
import { ChartJsLineSubcomponent } from './subcomponent.chartjs.line';
import { ChartJsPieSubcomponent } from './subcomponent.chartjs.pie';
import { ChartJsScatterSubcomponent } from './subcomponent.chartjs.scatter';
import { ListSubcomponent } from './subcomponent.list';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNumberOption,
    WidgetOption,
    WidgetSelectOption
} from '../../models/widget-option';

import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { YearBucketizer } from '../bucketizers/YearBucketizer';

import * as _ from 'lodash';
import * as moment from 'moment';
import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-aggregation',
    templateUrl: './aggregation.component.html',
    styleUrls: ['./aggregation.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AggregationComponent extends BaseNeonComponent implements OnInit, OnDestroy, AfterViewInit, AggregationSubcomponentListener {
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('hiddenCanvas') hiddenCanvas: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('subcomponentMain') subcomponentMainElementRef: ElementRef;
    @ViewChild('subcomponentZoom') subcomponentZoomElementRef: ElementRef;

    private DEFAULT_GROUP: string = 'All';

    // The bucketizer for any date data.
    public dateBucketizer: any;

    // The minimum dimensions for the subcomponent.
    public minimumDimensionsMain: {
        height: number;
        width: number;
    } = {
        height: 50,
        width: 50
    };

    public minimumDimensionsZoom: {
        height: number;
        width: number;
    } = {
        height: 50,
        width: 50
    };

    // TODO THOR-1067 The subcomponent should draw this!
    // The selected area on the subcomponent (box or range).
    public selectedArea: {
        height: number;
        width: number;
        x: number;
        y: number;
    } = null;

    // The selected area offset from the subcomponent location.
    public selectedAreaOffset: {
        x: number;
        y: number;
    } = {
        x: 0,
        y: 0
    };

    // The subcomponents.  If dualView is on, both are used.  Otherwise, only main is used.
    public subcomponentMain: AbstractAggregationSubcomponent;
    public subcomponentZoom: AbstractAggregationSubcomponent;

    // TODO THOR-349 Remove once future widget option menu is finished
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

    public aggregationData: any[] = null;

    public colorKeys: any[] = [];
    public legendActiveGroups: any[] = [];
    public legendDisabledGroups: string[] = [];
    public legendGroups: string[] = [];

    public xList: any[] = [];
    public yList: any[] = [];

    private viewInitialized = false;
    private pendingFilters: FilterDesign[] = [];

    constructor(
        dashboardService: DashboardService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        dialog: MatDialog,
        protected widgetService: AbstractWidgetService,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
        );
    }

    /**
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
        this.subcomponentMain = this.initializeSubcomponent(this.subcomponentMainElementRef);
        if (this.options.dualView) {
            this.subcomponentZoom = this.initializeSubcomponent(this.subcomponentZoomElementRef, true);
        }

        if (!this.options.axisLabelX) {
            this.options.axisLabelX =
                (this.subcomponentMain && this.subcomponentMain.isHorizontal()) ?
                    this.options.aggregation || this.options.yField.prettyName :
                    this.options.xField.prettyName;
        }
        if (!this.options.axisLabelY) {
            this.options.axisLabelY =
                (this.subcomponentMain && this.subcomponentMain.isHorizontal()) ?
                    this.options.xField.prettyName :
                    this.options.aggregation || this.options.yField.prettyName;
        }
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        this.viewInitialized = true;
        if (this.pendingFilters && this.pendingFilters.length) {
            this.redrawFilteredItems(this.pendingFilters);
            delete this.pendingFilters;
        }
    }

    /**
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        let behaviors: FilterBehavior[] = [];

        if (this.options.groupField.columnName) {
            behaviors.push({
                filterDesign: this.createFilterDesignOnLegend(),
                redrawCallback: this.redrawLegend.bind(this)
            } as FilterBehavior);
        }

        if (this.options.xField.columnName) {
            behaviors.push({
                filterDesign: this.createFilterDesignOnItem(),
                redrawCallback: this.redrawFilteredItems.bind(this)
            } as FilterBehavior);

            behaviors.push({
                filterDesign: this.createFilterDesignOnDomain(),
                redrawCallback: this.redrawDomain.bind(this)
            } as FilterBehavior);

            if (this.options.yField.columnName) {
                behaviors.push({
                    filterDesign: this.createFilterDesignOnBounds(),
                    redrawCallback: this.redrawBounds.bind(this)
                } as FilterBehavior);
            }
        }

        return behaviors;
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause[]} sharedFilters
     * @return {QueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: QueryPayload, sharedFilters: FilterClause[]): QueryPayload {
        let groups: QueryGroup[] = [];
        let filters: FilterClause[] = [this.searchService.buildFilterClause(options.xField.columnName, '!=', null)];
        let countField = options.xField.columnName;

        if (options.xField.type === 'date') {
            switch (options.granularity) {
                case 'minute':
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.MINUTE));
                // Falls through
                case 'hour':
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.HOUR));
                // Falls through
                case 'day':
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.DAY_OF_MONTH));
                // Falls through
                case 'month':
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.MONTH));
                // Falls through
                case 'year':
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.YEAR));
                // Falls through
            }
            this.searchService.updateAggregation(query, AggregationType.MIN, '_date', options.xField.columnName).updateSort(query, '_date');
            countField = '_' + options.granularity;
        } else if (!options.sortByAggregation) {
            groups.push(this.searchService.buildQueryGroup(options.xField.columnName));
            this.searchService.updateSort(query, options.xField.columnName);
        } else {
            groups.push(this.searchService.buildQueryGroup(options.xField.columnName));
            this.searchService.updateSort(query, '_aggregation', SortOrder.DESCENDING);
        }

        if (this.optionsTypeIsXY(options)) {
            groups.push(this.searchService.buildQueryGroup(options.yField.columnName));
            filters.push(this.searchService.buildFilterClause(options.yField.columnName, '!=', null));
        }

        if (options.groupField.columnName) {
            groups.push(this.searchService.buildQueryGroup(options.groupField.columnName));
            countField = options.groupField.columnName;
        }

        if (!this.optionsTypeIsXY(options)) {
            this.searchService.updateAggregation(query, options.aggregation, '_aggregation',
                (options.aggregation === AggregationType.COUNT ? countField : options.aggregationField.columnName));
        }

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filters)))
            .updateGroups(query, groups);

        return query;
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('aggregationField', 'Aggregation Field', true, this.optionsAggregationIsNotCount.bind(this)),
            new WidgetFieldOption('groupField', 'Group Field', false),
            new WidgetFieldOption('xField', 'X Field', true),
            new WidgetFieldOption('yField', 'Y Field', true, this.optionsTypeIsXY.bind(this))
        ];
    }

    private createFilterDesignOnBounds(beginX?: any, endX?: any, beginY?: any, endY?: any): FilterDesign {
        return {
            type: CompoundFilterType.AND,
            filters: [{
                datastore: '',
                database: this.options.database,
                table: this.options.table,
                field: this.options.xField,
                operator: '>=',
                value: beginX
            }, {
                datastore: '',
                database: this.options.database,
                table: this.options.table,
                field: this.options.xField,
                operator: '<=',
                value: endX
            }, {
                datastore: '',
                database: this.options.database,
                table: this.options.table,
                field: this.options.yField,
                operator: '>=',
                value: beginY
            }, {
                datastore: '',
                database: this.options.database,
                table: this.options.table,
                field: this.options.yField,
                operator: '<=',
                value: endY
            }] as SimpleFilterDesign[]
        } as CompoundFilterDesign;
    }

    private createFilterDesignOnDomain(beginX?: any, endX?: any): FilterDesign {
        return {
            type: CompoundFilterType.AND,
            filters: [{
                datastore: '',
                database: this.options.database,
                table: this.options.table,
                field: this.options.xField,
                operator: '>=',
                value: beginX
            }, {
                datastore: '',
                database: this.options.database,
                table: this.options.table,
                field: this.options.xField,
                operator: '<=',
                value: endX
            }] as SimpleFilterDesign[]
        } as CompoundFilterDesign;
    }

    private createFilterDesignOnItem(value?: any): FilterDesign {
        return {
            root: this.options.requireAll ? CompoundFilterType.AND : CompoundFilterType.OR,
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: this.options.xField,
            operator: '=',
            value: value
        } as SimpleFilterDesign;
    }

    private createFilterDesignOnLegend(value?: any): FilterDesign {
        return {
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: this.options.groupField,
            operator: '!=',
            value: value
        } as SimpleFilterDesign;
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('aggregation', 'Aggregation', AggregationType.COUNT, OptionChoices.Aggregation,
                this.optionsTypeIsNotXY.bind(this)),
            new WidgetSelectOption('countByAggregation', 'Count Aggregations', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('timeFill', 'Date Fill', false, OptionChoices.NoFalseYesTrue, this.optionsXFieldIsDate.bind(this)),
            new WidgetSelectOption('granularity', 'Date Granularity', 'year', OptionChoices.DateGranularity,
                this.optionsXFieldIsDate.bind(this)),
            new WidgetSelectOption('dualView', 'Dual View', '', [{
                prettyName: 'Always Off',
                variable: ''
            }, {
                prettyName: 'Always On',
                variable: 'on'
            }, {
                prettyName: 'Only On Filter',
                variable: 'filter'
            }], this.optionsTypeIsDualViewCompatible.bind(this)),
            new WidgetSelectOption('notFilterable', 'Filterable', false, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('requireAll', 'Filter Operator', false, OptionChoices.OrFalseAndTrue),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', true, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('hideGridLines', 'Grid Lines', false, OptionChoices.ShowFalseHideTrue,
                this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('hideGridTicks', 'Grid Ticks', false, OptionChoices.ShowFalseHideTrue,
                this.optionsTypeUsesGrid.bind(this)),
            new WidgetFreeTextOption('axisLabelX', 'Label of X-Axis', '', this.optionsTypeUsesGrid.bind(this)),
            new WidgetFreeTextOption('axisLabelY', 'Label of Y-Axis', '', this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('lineCurveTension', 'Line Curve Tension', 0.3, [{
                prettyName: '0.1',
                variable: 0.1
            }, {
                prettyName: '0.2',
                variable: 0.2
            }, {
                prettyName: '0.3',
                variable: 0.3
            }, {
                prettyName: '0.4',
                variable: 0.4
            }, {
                prettyName: '0.5',
                variable: 0.5
            }, {
                prettyName: '0.6',
                variable: 0.6
            }, {
                prettyName: '0.7',
                variable: 0.7
            }, {
                prettyName: '0.8',
                variable: 0.8
            }, {
                prettyName: '0.9',
                variable: 0.9
            }], this.optionsTypeIsLine.bind(this)),
            new WidgetSelectOption('lineFillArea', 'Line Fill Area Under Curve', false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsLine.bind(this)),
            new WidgetSelectOption('logScaleX', 'Log X-Axis Scale', false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('logScaleY', 'Log Y-Axis Scale', false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('savePrevious', 'Save Previously Seen', false, OptionChoices.NoFalseYesTrue),
            new WidgetNumberOption('scaleMinX', 'Scale Min X', null, this.optionsTypeUsesGrid.bind(this)),
            new WidgetNumberOption('scaleMaxX', 'Scale Max X', null, this.optionsTypeUsesGrid.bind(this)),
            new WidgetNumberOption('scaleMinY', 'Scale Min Y', null, this.optionsTypeUsesGrid.bind(this)),
            new WidgetNumberOption('scaleMaxY', 'Scale Max Y', null, this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('showHeat', 'Show Heated List', false, OptionChoices.NoFalseYesTrue, this.optionsTypeIsList.bind(this)),
            new WidgetSelectOption('showLegend', 'Show Legend', true, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('sortByAggregation', 'Sort By', false, [{
                prettyName: 'Label',
                variable: false
            }, {
                prettyName: 'Aggregation',
                variable: true
            }]),
            new WidgetSelectOption('type', 'Visualization Type', 'line', [{
                prettyName: 'Bar, Horizontal (Aggregations)',
                variable: 'bar-h'
            }, {
                prettyName: 'Bar, Vertical (Aggregations)',
                variable: 'bar-v'
            }, {
                prettyName: 'Doughnut (Aggregations)',
                variable: 'doughnut'
            }, {
                prettyName: 'Histogram (Aggregations)',
                variable: 'histogram'
            }, {
                prettyName: 'Line (Aggregations)',
                variable: 'line'
            }, {
                prettyName: 'Line (Points)',
                variable: 'line-xy'
            }, {
                prettyName: 'Pie (Aggregations)',
                variable: 'pie'
            }, {
                prettyName: 'Scatter (Aggregations)',
                variable: 'scatter'
            }, {
                prettyName: 'Scatter (Points)',
                variable: 'scatter-xy'
            }, {
                prettyName: 'Text List (Aggregations)',
                variable: 'list'
            }]),
            new WidgetSelectOption('yPercentage', 'Y-Axis Max Width', 0.3, [{
                prettyName: '0.1',
                variable: 0.1
            }, {
                prettyName: '0.2',
                variable: 0.2
            }, {
                prettyName: '0.3',
                variable: 0.3
            }, {
                prettyName: '0.4',
                variable: 0.4
            }, {
                prettyName: '0.5',
                variable: 0.5
            }], this.optionsTypeUsesGrid.bind(this))
        ];
    }

    /**
     * Removes any visualization elements when the widget is deleted.
     *
     * @override
     */
    destroyVisualization() {
        if (this.subcomponentMain) {
            this.subcomponentMain.destroy();
        }
        if (this.subcomponentZoom) {
            this.subcomponentZoom.destroy();
        }
    }

    private findMatchingFilterDesign(configs: SimpleFilterDesign[], fieldBinding: string, operator: string) {
        let matching: SimpleFilterDesign[] = configs.filter((config) => config.operator === operator &&
            this.options.database.name === config.database.name && this.options.table.name === config.table.name &&
            this.options[fieldBinding].columnName === config.field.columnName);
        return matching.length ? matching[0].value : undefined;
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
     * Returns the hidden canvas element reference for the SubcomponentListener interface.
     *
     * @return {ElementRef}
     */
    getHiddenCanvas(): ElementRef {
        return this.hiddenCanvas;
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 10000;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Aggregation';
    }

    /**
     * Returns the label for the objects that are currently shown in this visualization (Bars, Lines, Nodes, Points, Rows, Terms, ...).
     * Uses the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        let label = 'Result';
        if (this.options.countByAggregation) {
            switch (this.options.type) {
                case 'bar-h':
                case 'bar-v':
                case 'histogram':
                    label = 'Bar';
                    break;
                case 'doughnut':
                case 'pie':
                    label = 'Slice';
                    break;
                case 'list':
                    label = 'Row';
                    break;
                case 'line':
                case 'line-xy':
                    label = 'Line';
                    break;
                case 'scatter':
                case 'scatter-xy':
                    label = 'Point';
                    break;
            }
        }
        return label + (count === 1 ? '' : 's');
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
     * Updates the sub-component and reruns the visualization query.
     * @override
     */
    handleChangeSubcomponentType() {
        if (!this.optionsTypeIsDualViewCompatible(this.options)) {
            this.options.dualView = '';
        }
        if (this.optionsTypeIsContinuous(this.options)) {
            this.options.sortByAggregation = false;
        }
        this.redrawSubcomponents();
    }

    /**
     * Handles a selected item in the legend.
     *
     * @arg {any} event
     */
    handleLegendItemSelected(event) {
        if (event.value && this.options.groupField.columnName && !this.options.notFilterable) {
            this.toggleFilters([this.createFilterDesignOnLegend(event.value)]);
        }
    }

    /**
     * Initilizes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Check for the boolean value true (not just any truthy value) and fix it.
        this.options.dualView = ('' + this.options.dualView) === 'true' ? 'on' : this.options.dualView;
        if (!this.optionsTypeIsDualViewCompatible(this.options)) {
            this.options.dualView = '';
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
                subcomponentObject = new ChartJsBarSubcomponent(this.options, this, elementRef, true);
                break;
            case 'bar-v':
                subcomponentObject = new ChartJsBarSubcomponent(this.options, this, elementRef);
                break;
            case 'doughnut':
                subcomponentObject = new ChartJsDoughnutSubcomponent(this.options, this, elementRef);
                break;
            case 'histogram':
                subcomponentObject = new ChartJsHistogramSubcomponent(this.options, this, elementRef);
                break;
            case 'line':
            case 'line-xy':
                subcomponentObject = new ChartJsLineSubcomponent(this.options, this, elementRef);
                break;
            case 'list':
                subcomponentObject = new ListSubcomponent(this.options, this, elementRef);
                break;
            case 'pie':
                subcomponentObject = new ChartJsPieSubcomponent(this.options, this, elementRef);
                break;
            case 'scatter':
                subcomponentObject = new ChartJsScatterSubcomponent(this.options, this, elementRef, true);
                break;
            case 'scatter-xy':
                subcomponentObject = new ChartJsScatterSubcomponent(this.options, this, elementRef);
                break;
        }

        if (subcomponentObject) {
            if (cannotSelect) {
                subcomponentObject.ignoreSelectEvents();
            }
            // Do not call initialize inside the constructor due to how angular handles subclass property initialization.
            subcomponentObject.initialize();
        }

        return subcomponentObject;
    }

    /**
     * Updates elements and properties whenever the widget config is changed.
     *
     * @override
     */
    onChangeData() {
        this.legendActiveGroups = [];
        this.legendGroups = [];
        this.colorKeys = [];
        this.xList = [];
        this.yList = [];
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): number {
        let isXY = this.optionsTypeIsXY(options);
        let xList = [];
        let yList = [];
        let groupsToColors = new Map<string, Color>();
        if (!options.groupField.columnName) {
            groupsToColors.set(this.DEFAULT_GROUP, this.widgetService.getColor(options.database.name, options.table.name, '',
                this.DEFAULT_GROUP));
        }

        let findGroupColor = (group: string): Color => {
            let color = groupsToColors.get(group);
            if (!color) {
                color = this.widgetService.getColor(options.database.name, options.table.name, options.groupField.columnName, group);
                groupsToColors.set(group, color);
            }
            return color;
        };

        let createTransformationFromItem = (item: any) => {
            let group = options.groupField.columnName ? item[options.groupField.columnName] : this.DEFAULT_GROUP;
            return {
                color: findGroupColor(group),
                group: group,
                x: item[options.xField.columnName],
                y: isXY ? item[options.yField.columnName] : (Math.round((item._aggregation) * 10000) / 10000)
            };
        };

        let queryResults = results;
        let shownResults = [];

        if (!isXY) {
            queryResults = queryResults.filter((item) => item._aggregation !== 'NaN');
        }

        if (options.xField.type === 'date' && queryResults.length) {
            // Transform date data.
            switch (options.granularity) {
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

            let beginDate = options.savePrevious && this.xList.length ? this.xList[0] : queryResults[0]._date;
            let endDate = options.savePrevious && this.xList.length ? this.xList[this.xList.length - 1] :
                queryResults[queryResults.length - 1]._date;
            this.dateBucketizer.setStartDate(new Date(beginDate));
            this.dateBucketizer.setEndDate(new Date(endDate));

            let groupToTransformations = new Map<string, any[]>();

            // Add 1 to the domain length for months or years because the month and year bucketizers are not inclusive.
            let xDomainLength = this.dateBucketizer.getNumBuckets() + (options.granularity === 'month' ||
                options.granularity === 'year' ? 1 : 0);

            // Create the X list now so it is properly sorted.  Items will be removed as needed.
            xList = _.range(xDomainLength).map((index) => moment(this.dateBucketizer.getDateForBucket(index)).toISOString());

            queryResults.forEach((item) => {
                let transformation = createTransformationFromItem(item);
                let transformations = groupToTransformations.get(transformation.group);
                if (!transformations) {
                    // Create an empty array for each date bucket.
                    transformations = new Array(xDomainLength).fill(undefined).map(() => []);
                    groupToTransformations.set(transformation.group, transformations);
                }
                let index = this.dateBucketizer.getBucketIndex(new Date(item._date));
                // Fix the X so it is a readable date string.
                transformation.x = moment(this.dateBucketizer.getDateForBucket(index)).toISOString();
                transformations[index].push(transformation);
            });

            // Save each X that exists in order to update the xList.
            let xExists = new Map<any, boolean>();

            shownResults = Array.from(groupToTransformations.keys()).reduce((transformations, group) => {
                let nextTransformations = groupToTransformations.get(group);
                if (options.timeFill) {
                    nextTransformations = nextTransformations.map((transformationArray, index) =>
                        // If timeFill is true and the date bucket is an empty array, replace it with a single item with a Y of zero.
                        transformationArray.length ? transformationArray : [{
                            color: findGroupColor(group),
                            group: group,
                            x: moment(this.dateBucketizer.getDateForBucket(index)).toISOString(),
                            y: 0
                        }]);
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
            if (options.type !== 'histogram') {
                xList = xList.filter((xValue) => xExists.get(xValue));
            }
        } else {
            // Transform non-date data.
            this.dateBucketizer = null;

            shownResults = queryResults.map((item) => {
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

        this.legendActiveGroups = this.legendGroups.filter((group) => groups.indexOf(group) >= 0 &&
            this.legendDisabledGroups.indexOf(group) < 0);

        this.xList = options.savePrevious && this.xList.length ? this.xList : xList;
        this.yList = yList;

        this.aggregationData = shownResults;

        return this.options.countByAggregation ? this.aggregationData.length : this.aggregationData.reduce((count, element) =>
            count + element.y, 0);
    }

    /**
     * Returns whether the subcomponent type shows aggregations and the aggregation type is not count.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsAggregationIsNotCount(options: any): boolean {
        return this.optionsTypeIsNotXY(options) && options.aggregation !== AggregationType.COUNT;
    }

    /**
     * Returns whether the subcomponent type is continuous.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsContinuous(options: any): boolean {
        switch (options.type) {
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
     * Returns whether the subcomponent type is compatible with dual view.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsDualViewCompatible(options: any): boolean {
        switch (options.type) {
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
     * Returns whether the subcomponent type is line.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsLine(options: any): boolean {
        return options.type === 'line' || options.type === 'line-xy';
    }

    /**
     * Returns whether the subcomponent type is list.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsList(options: any): boolean {
        return options.type === 'list';
    }

    /**
     * Returns whether the subcomponent type does not require both X and Y fields.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsNotXY(options: any): boolean {
        return !this.optionsTypeIsXY(options);
    }

    /**
     * Returns whether the subcomponent type uses the grid and axes.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeUsesGrid(options: any): boolean {
        switch (options.type) {
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
     * Returns whether the subcomponent type requires both X and Y fields.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsXY(options: any): boolean {
        return options.type === 'line-xy' || options.type === 'scatter-xy';
    }

    /**
     * Returns whether the X field data type is date.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsXFieldIsDate(options: any): boolean {
        return options.xField.type === 'date';
    }

    private redrawBounds(filters: FilterDesign[]): void {
        let removeFilter = true;

        // Find the boundds inside the compound filter with an expected structure like createFilterDesignOnBounds.
        // TODO THOR-1100 How should we handle multiple bounds filters?  Should we draw multiple areas?
        if (filters.length && FilterUtil.isCompoundFilterDesign(filters[0])) {
            let boundsFilter: CompoundFilterDesign = (filters[0] as CompoundFilterDesign);

            if (boundsFilter && boundsFilter.type === CompoundFilterType.AND && boundsFilter.filters.length === 4 &&
                FilterUtil.isSimpleFilterDesign(boundsFilter.filters[0]) &&
                FilterUtil.isSimpleFilterDesign(boundsFilter.filters[1]) &&
                FilterUtil.isSimpleFilterDesign(boundsFilter.filters[2]) &&
                FilterUtil.isSimpleFilterDesign(boundsFilter.filters[3])) {
                let nestedFilters: SimpleFilterDesign[] = boundsFilter.filters as SimpleFilterDesign[];
                let beginX = this.findMatchingFilterDesign(nestedFilters, 'xField', '>=');
                let endX = this.findMatchingFilterDesign(nestedFilters, 'xField', '<=');
                let beginY = this.findMatchingFilterDesign(nestedFilters, 'yField', '>=');
                let endY = this.findMatchingFilterDesign(nestedFilters, 'yField', '<=');

                if (this.subcomponentMain && typeof beginX !== 'undefined' && typeof endX !== 'undefined' &&
                    typeof beginY !== 'undefined' && typeof endY !== 'undefined') {
                    this.subcomponentMain.select([{
                        beginX: beginX,
                        endX: endX,
                        beginY: beginY,
                        endY: endY
                    }]);

                    this.refreshVisualization(true);

                    removeFilter = false;

                    // TODO THOR-1057 Update the selectedArea
                    // this.selectedArea = null;
                }
            }
        }

        if (removeFilter) {
            if (this.subcomponentMain) {
                this.subcomponentMain.select([]);
                this.refreshVisualization(true);
            }
            this.selectedArea = null;
        }
    }

    private redrawDomain(filters: FilterDesign[]): void {
        let removeFilter = true;

        // Find the domain inside the compound filter with an expected structure like createFilterDesignOnDomain.
        // TODO THOR-1100 How should we handle multiple domain filters?  Should we draw multiple areas?
        if (filters.length && FilterUtil.isCompoundFilterDesign(filters[0])) {
            let domainFilter: CompoundFilterDesign = (filters[0] as CompoundFilterDesign);

            if (domainFilter && domainFilter.type === CompoundFilterType.AND && domainFilter.filters.length === 2 &&
                FilterUtil.isSimpleFilterDesign(domainFilter.filters[0]) &&
                FilterUtil.isSimpleFilterDesign(domainFilter.filters[1])) {
                let nestedFilters: SimpleFilterDesign[] = domainFilter.filters as SimpleFilterDesign[];
                let beginX = this.findMatchingFilterDesign(nestedFilters, 'xField', '>=');
                let endX = this.findMatchingFilterDesign(nestedFilters, 'xField', '<=');

                if (this.subcomponentMain && typeof beginX !== 'undefined' && typeof endX !== 'undefined') {
                    this.subcomponentMain.select([{
                        beginX: beginX,
                        endX: endX
                    }]);

                    this.refreshVisualization(true);

                    removeFilter = false;

                    // TODO THOR-1057 Update the selectedArea
                    // this.selectedArea = null;
                }
            }
        }

        if (removeFilter) {
            if (this.subcomponentMain) {
                this.subcomponentMain.select([]);
                this.refreshVisualization(true);
            }
            this.selectedArea = null;
        }
    }

    private redrawFilteredItems(filterDesigns: FilterDesign[]): void {
        if (!this.subcomponentMain && !this.viewInitialized) {
            this.pendingFilters = filterDesigns;
        }
        if (this.subcomponentMain) {
            // Find the values inside the filters with an expected structure of createFilterDesignOnItem.
            this.subcomponentMain.select(filterDesigns.reduce((values, filterDesign) => {
                if (FilterUtil.isSimpleFilterDesign(filterDesign)) {
                    let value = this.findMatchingFilterDesign([filterDesign], 'xField', '=');
                    return value ? values.concat(value) : values;
                }
                return values;
            }, []));

            this.refreshVisualization(true);
        }
    }

    private redrawLegend(filterDesigns: FilterDesign[]): void {
        // Find the values inside the filters with an expected structure of createFilterDesignOnLegend.
        this.legendDisabledGroups = filterDesigns.reduce((groups, filterDesign) => {
            if (FilterUtil.isSimpleFilterDesign(filterDesign)) {
                let group = this.findMatchingFilterDesign([filterDesign], 'groupField', '!=');
                return group ? groups.concat(group) : groups;
            }
            return groups;
        }, []);

        // Set the active groups to all the groups that are NOT disabled/filtered since the group filters are all negative (!=).
        this.legendActiveGroups = this.legendGroups.filter((group) => this.legendDisabledGroups.indexOf(group) < 0);
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
     * Updates and redraws the elements and properties for the visualization.
     *
     * @arg {boolean} [redrawMain=false]
     * @override
     */
    refreshVisualization(redrawMain: boolean = false) {
        let findAxisType = (type) => {
            // https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html
            if (type === 'long' || type === 'integer' || type === 'short' || type === 'byte' || type === 'double' || type === 'float' ||
                type === 'half_float' || type === 'scaled_float') {
                return 'number';
            }
            return type === 'date' ? 'date' : 'string';
        };

        let isXY = this.optionsTypeIsXY(this.options);
        let meta = {
            aggregationField: isXY ? undefined : this.options.aggregationField.prettyName,
            aggregationLabel: isXY ? undefined : this.options.aggregation,
            dataLength: this.aggregationData.length,
            groups: this.legendGroups,
            sort: this.options.sortByAggregation ? 'y' : 'x',
            xAxis: findAxisType(this.options.xField.type),
            xList: this.xList,
            yAxis: !isXY ? 'number' : findAxisType(this.options.yField.type),
            yList: this.yList
        };

        // Update the overview if dualView is off or if it is not filtered.  It will only show the unfiltered data.
        if (this.subcomponentMain && (redrawMain || !this.options.dualView || !this.isFiltered())) {
            this.subcomponentMain.draw(this.aggregationData, meta);
        }

        // Update the zoom if dualView is truthy.  It will show both the unfiltered and filtered data.
        if (this.options.dualView) {
            if (!this.subcomponentZoom) {
                this.subcomponentZoom = this.initializeSubcomponent(this.subcomponentZoomElementRef, true);
            }
            this.subcomponentZoom.draw(this.aggregationData, meta);
        }

        this.updateOnResize();

        this.colorKeys = [this.widgetService.getColorKey(this.options.database.name, this.options.table.name,
            this.options.groupField.columnName || '')];
    }

    /**
     * Returns whether this visualization should filter itself.
     *
     * @return {boolean}
     * @override
     */
    protected shouldFilterSelf(): boolean {
        return !this.options.ignoreSelf || !!this.options.dualView;
    }

    /**
     * Returns whether to show both the main and the zoom views.
     *
     * @return {boolean}
     */
    showBothViews(): boolean {
        return this.options.dualView === 'on' || (this.options.dualView === 'filter' && this.isFiltered());
    }

    /**
     * Returns whether the legend is shown.
     *
     * @return {boolean}
     */
    showLegend(): boolean {
        // TODO THOR-973
        // Always show the legend for histogram, line, or scatter in order to avoid a bug resizing the selected area within the chart.
        return this.optionsTypeIsContinuous(this.options) || (this.options.showLegend && this.legendGroups.length > 1);
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
    subcomponentRequestsFilter(__group: string, value: any, doNotReplace: boolean = false) {
        if (this.options.notFilterable) {
            return;
        }

        if (doNotReplace) {
            this.toggleFilters([this.createFilterDesignOnItem(value)]);
        } else {
            this.exchangeFilters([this.createFilterDesignOnItem(value)]);
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
    subcomponentRequestsFilterOnBounds(beginX: any, beginY, endX: any, endY: any, doNotReplace: boolean = false) {
        if (!(this.options.dualView || this.options.ignoreSelf)) {
            this.selectedArea = null;
        }

        if (this.options.notFilterable) {
            return;
        }

        if (doNotReplace) {
            this.toggleFilters([this.createFilterDesignOnBounds(beginX, endX, beginY, endY)]);
        } else {
            this.exchangeFilters([this.createFilterDesignOnBounds(beginX, endX, beginY, endY)]);
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

        if (doNotReplace) {
            this.toggleFilters([this.createFilterDesignOnDomain(beginX, endX)]);
        } else {
            this.exchangeFilters([this.createFilterDesignOnDomain(beginX, endX)]);
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

        /* eslint-disable-next-line dot-notation */
        if (!this.changeDetection['destroyed']) {
            this.changeDetection.detectChanges();
        }
    }

    /**
     * Selects the given area.  From SubcomponentListener.
     *
     * @arg {any} xValue
     * @arg {any} yValue
     * @arg {any} width
     * @arg {any} height
     *
     * @override
     */
    subcomponentRequestsSelect(xValue: number, yValue: number, width: number, height: number) {
        this.selectedAreaOffset = {
            x: Number.parseInt(this.subcomponentMainElementRef.nativeElement.offsetLeft || '0', 10),
            y: Number.parseInt(this.subcomponentMainElementRef.nativeElement.offsetTop || '0', 10)
        };
        this.selectedArea = {
            height: height,
            width: width,
            x: xValue,
            y: yValue
        };
    }

    /**
     * Toggles the body container if the data message component is present
     * @override
     */
    toggleBodyContainer() {
        let bodyContainer = document.getElementsByClassName('body-container').item(0) as HTMLElement;
        bodyContainer.setAttribute('style', 'display: ' + (this.showNoData ? 'none' : 'show'));
    }

    /**
     * Updates the visualization as needed whenever it is resized.
     *
     * @override
     */
    updateOnResize() {
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
            x: Number.parseInt(this.subcomponentMainElementRef.nativeElement.offsetLeft || '0', 10),
            y: Number.parseInt(this.subcomponentMainElementRef.nativeElement.offsetTop || '0', 10)
        };

        // TODO THOR-973 Change the height of the selected area if the dual view was changed (and the height of the main subcomponent).
        /* FIXME
        if (this.selectedArea) {
            // Subtract 30 pixels for the height of the X axis.
            let subcomponentHeight = this.subcomponentMainElementRef.nativeElement.clientHeight - (this.options.hideGridTicks ? 10 : 30);
            if (this.options.dualView) {
                this.selectedArea.height = Math.min(this.selectedArea.height, subcomponentHeight);
            } else {
                this.selectedArea.height = Math.max(this.selectedArea.height, subcomponentHeight);
            }
        }
        */

        // TODO THOR-973 Update the selectedArea if the visualization was resized.
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        let validFields = options.xField.columnName && (this.optionsTypeIsXY(options) ? options.yField.columnName : true) &&
            (options.aggregation !== AggregationType.COUNT ? options.aggregationField.columnName : true);
        return !!(options.database.name && options.table.name && validFields);
    }
}
