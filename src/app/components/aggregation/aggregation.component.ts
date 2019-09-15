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
    FilterClause,
    QueryGroup,
    QueryPayload
} from '../../library/core/services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import {
    AbstractFilter,
    BoundsFilter,
    BoundsFilterDesign,
    BoundsValues,
    DomainFilter,
    DomainFilterDesign,
    DomainValues,
    FilterCollection,
    FilterConfig,
    ListFilter,
    ListFilterDesign
} from '../../library/core/models/filters';
import { DatasetUtil } from '../../library/core/models/dataset';
import { DateUtil } from '../../library/core/date.util';
import { InjectableFilterService } from '../../services/injectable.filter.service';

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
    AggregationType,
    CompoundFilterType,
    OptionChoices,
    SortOrder,
    TimeInterval,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNumberOption,
    WidgetOption,
    WidgetSelectOption
} from '../../library/core/models/widget-option';

import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { YearBucketizer } from '../bucketizers/YearBucketizer';

import * as _ from 'lodash';
import { MatDialog } from '@angular/material';
import { CoreUtil } from '../../library/core/core.util';

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

    // Save the values of the filters in the FilterService that are compatible with this visualization's filters.
    private _filteredLegendValues: any[] = [];
    private _filteredSingleValues: any[] = [];

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        dialog: MatDialog,
        protected colorThemeService: InjectableColorThemeService,
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
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {FilterConfig[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterConfig[] {
        let designs: FilterConfig[] = [];

        if (this.options.groupField.columnName) {
            designs.push(this.createFilterConfigOnLegendList());
        }

        if (this.options.xField.columnName) {
            designs.push(this.createFilterConfigOnItemList());
            designs.push(this.createFilterConfigOnDomain());

            if (this.options.yField.columnName) {
                designs.push(this.createFilterConfigOnBounds());
            }
        }

        return designs;
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
                case TimeInterval.MINUTE:
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.MINUTE));
                // Falls through
                case TimeInterval.HOUR:
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.HOUR));
                // Falls through
                case TimeInterval.DAY_OF_MONTH:
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.DAY_OF_MONTH));
                // Falls through
                case TimeInterval.MONTH:
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.MONTH));
                // Falls through
                case TimeInterval.YEAR:
                    groups.push(this.searchService.buildDateQueryGroup(options.xField.columnName, TimeInterval.YEAR));
                // Falls through
            }
            this.searchService.updateAggregation(query, AggregationType.MIN, this.searchService.getAggregationName('date'),
                options.xField.columnName).updateSort(query, this.searchService.getAggregationName('date'));
            countField = '_' + options.granularity;
        } else if (!options.sortByAggregation) {
            groups.push(this.searchService.buildQueryGroup(options.xField.columnName));
            this.searchService.updateSort(query, options.xField.columnName);
        } else {
            groups.push(this.searchService.buildQueryGroup(options.xField.columnName));
            this.searchService.updateSort(query, this.searchService.getAggregationName(), SortOrder.DESCENDING);
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
            this.searchService.updateAggregation(query, options.aggregation, this.searchService.getAggregationName(),
                (options.aggregation === AggregationType.COUNT ? countField : options.aggregationField.columnName));
        }

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filters)))
            .updateGroups(query, groups);

        return query;
    }

    private createFilterConfigOnBounds(beginX?: any, endX?: any, beginY?: any, endY?: any): BoundsFilterDesign {
        return new BoundsFilterDesign(
            `${this.options.datastore.name}.${this.options.database.name}.${this.options.table.name}.${this.options.xField.columnName}`,
            `${this.options.datastore.name}.${this.options.database.name}.${this.options.table.name}.${this.options.yField.columnName}`,
            beginX, beginY, endX, endY
        );
    }

    private createFilterConfigOnDomain(beginX?: any, endX?: any): DomainFilterDesign {
        return new DomainFilterDesign(
            `${this.options.datastore.name}.${this.options.database.name}.${this.options.table.name}.${this.options.xField.columnName}`,
            beginX, endX
        );
    }

    private createFilterConfigOnLegendList(values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.AND, this.options.datastore.name + '.' + this.options.database.name + '.' +
            this.options.table.name + '.' + this.options.groupField.columnName, '!=', values);
    }

    private createFilterConfigOnItemList(values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(this.options.requireAll ? CompoundFilterType.AND : CompoundFilterType.OR, this.options.datastore.name +
            '.' + this.options.database.name + '.' + this.options.table.name + '.' + this.options.xField.columnName, '=', values);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    protected createOptions(): WidgetOption[] {
        return [
            new WidgetFieldOption('aggregationField', 'Aggregation Field', true, this.optionsAggregationIsNotCount.bind(this)),
            new WidgetFieldOption('groupField', 'Group Field', false),
            new WidgetFieldOption('xField', 'X Field', true),
            new WidgetFieldOption('yField', 'Y Field', true, this.optionsTypeIsXY.bind(this)),
            new WidgetSelectOption('aggregation', 'Aggregation', false, AggregationType.COUNT, OptionChoices.Aggregation,
                this.optionsTypeIsNotXY.bind(this)),
            new WidgetSelectOption('countByAggregation', 'Count Aggregations', false, false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('timeFill', 'Date Fill', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsXFieldIsDate.bind(this)),
            new WidgetSelectOption('granularity', 'Date Granularity', false, TimeInterval.YEAR, OptionChoices.DateGranularity,
                this.optionsXFieldIsDate.bind(this)),
            new WidgetSelectOption('dualView', 'Dual View', false, '', [{
                prettyName: 'Always Off',
                variable: ''
            }, {
                prettyName: 'Always On',
                variable: 'on'
            }, {
                prettyName: 'Only On Filter',
                variable: 'filter'
            }], this.optionsTypeIsDualViewCompatible.bind(this)),
            new WidgetSelectOption('notFilterable', 'Filterable', false, false, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('requireAll', 'Filter Operator', false, false, OptionChoices.OrFalseAndTrue),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, true, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('hideGridLines', 'Grid Lines', false, false, OptionChoices.ShowFalseHideTrue,
                this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('hideGridTicks', 'Grid Ticks', false, false, OptionChoices.ShowFalseHideTrue,
                this.optionsTypeUsesGrid.bind(this)),
            new WidgetFreeTextOption('axisLabelX', 'Label of X-Axis', false, '', this.optionsTypeUsesGrid.bind(this)),
            new WidgetFreeTextOption('axisLabelY', 'Label of Y-Axis', false, '', this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('lineCurveTension', 'Line Curve Tension', false, 0.3, [{
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
            new WidgetSelectOption('lineFillArea', 'Line Fill Area Under Curve', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsLine.bind(this)),
            new WidgetSelectOption('logScaleX', 'Log X-Axis Scale', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('logScaleY', 'Log Y-Axis Scale', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('savePrevious', 'Save Previously Seen', false, false, OptionChoices.NoFalseYesTrue),
            new WidgetNumberOption('scaleMinX', 'Scale Min X', false, null, this.optionsTypeUsesGrid.bind(this)),
            new WidgetNumberOption('scaleMaxX', 'Scale Max X', false, null, this.optionsTypeUsesGrid.bind(this)),
            new WidgetNumberOption('scaleMinY', 'Scale Min Y', false, null, this.optionsTypeUsesGrid.bind(this)),
            new WidgetNumberOption('scaleMaxY', 'Scale Max Y', false, null, this.optionsTypeUsesGrid.bind(this)),
            new WidgetSelectOption('showHeat', 'Show Heated List', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsList.bind(this)),
            new WidgetSelectOption('showLegend', 'Show Legend', false, true, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('sortByAggregation', 'Sort By', false, false, [{
                prettyName: 'Label',
                variable: false
            }, {
                prettyName: 'Aggregation',
                variable: true
            }]),
            new WidgetSelectOption('type', 'Visualization Type', true, 'line', [{
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
            new WidgetSelectOption('yPercentage', 'Y-Axis Max Width', false, 0.3, [{
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
            this._filteredLegendValues = CoreUtil.changeOrToggleValues(event.value, this._filteredLegendValues, true);
            if (this._filteredLegendValues.length) {
                this.exchangeFilters([this.createFilterConfigOnLegendList(this._filteredLegendValues)]);
            } else {
                this.exchangeFilters([], [this.createFilterConfigOnLegendList()]);
            }
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
        let textColorHex = this.colorThemeService.getThemeTextColorHex();

        switch (this.options.type) {
            case 'bar-h':
                subcomponentObject = new ChartJsBarSubcomponent(this.options, this, elementRef, textColorHex, true);
                break;
            case 'bar-v':
                subcomponentObject = new ChartJsBarSubcomponent(this.options, this, elementRef, textColorHex);
                break;
            case 'doughnut':
                subcomponentObject = new ChartJsDoughnutSubcomponent(this.options, this, elementRef, textColorHex);
                break;
            case 'histogram':
                subcomponentObject = new ChartJsHistogramSubcomponent(this.options, this, elementRef, textColorHex);
                break;
            case 'line':
            case 'line-xy':
                subcomponentObject = new ChartJsLineSubcomponent(this.options, this, elementRef, textColorHex);
                break;
            case 'list':
                subcomponentObject = new ListSubcomponent(this.options, this, elementRef);
                break;
            case 'pie':
                subcomponentObject = new ChartJsPieSubcomponent(this.options, this, elementRef, textColorHex);
                break;
            case 'scatter':
                subcomponentObject = new ChartJsScatterSubcomponent(this.options, this, elementRef, textColorHex, true);
                break;
            case 'scatter-xy':
                subcomponentObject = new ChartJsScatterSubcomponent(this.options, this, elementRef, textColorHex);
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
     * @arg {FilterCollection} filters
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[], filters: FilterCollection): number {
        let isXY = this.optionsTypeIsXY(options);
        let xList = [];
        let yList = [];
        let groupsToColors = new Map<string, Color>();
        if (!options.groupField.columnName) {
            groupsToColors.set(this.DEFAULT_GROUP, this.colorThemeService.getThemeAccentColor());
        }

        let findGroupColor = (group: string): Color => {
            let color = groupsToColors.get(group);
            if (!color) {
                color = this.colorThemeService.getColor(options.database.name, options.table.name, options.groupField.columnName, group);
                groupsToColors.set(group, color);
            }
            return color;
        };

        let createTransformationFromItem = (item: any) => {
            let group = options.groupField.columnName ? CoreUtil.deepFind(item, options.groupField.columnName) : this.DEFAULT_GROUP;
            return {
                color: findGroupColor(group),
                group: group,
                x: CoreUtil.deepFind(item, options.xField.columnName),
                y: isXY ? CoreUtil.deepFind(item, options.yField.columnName) :
                    (Math.round(item[this.searchService.getAggregationName()] * 10000) / 10000)
            };
        };

        let queryResults = results;
        let shownResults = [];

        if (!isXY) {
            queryResults = queryResults.filter((item) => item[this.searchService.getAggregationName()] !== 'NaN');
        }

        if (options.xField.type === 'date' && queryResults.length) {
            // Transform date data.
            switch (options.granularity) {
                case TimeInterval.MINUTE:
                case TimeInterval.HOUR:
                    this.dateBucketizer = new DateBucketizer();
                    this.dateBucketizer.setGranularity(DateBucketizer.HOUR);
                    break;
                case TimeInterval.DAY_OF_MONTH:
                    this.dateBucketizer = new DateBucketizer();
                    break;
                case TimeInterval.MONTH:
                    this.dateBucketizer = new MonthBucketizer();
                    break;
                case TimeInterval.YEAR:
                    this.dateBucketizer = new YearBucketizer();
                    break;
            }

            let beginDate = options.savePrevious && this.xList.length ? this.xList[0] :
                queryResults[0][this.searchService.getAggregationName('date')];
            let endDate = options.savePrevious && this.xList.length ? this.xList[this.xList.length - 1] :
                queryResults[queryResults.length - 1][this.searchService.getAggregationName('date')];
            this.dateBucketizer.setStartDate(new Date(beginDate));
            this.dateBucketizer.setEndDate(new Date(endDate));

            let groupToTransformations = new Map<string, any[]>();

            // Add 1 to the domain length for months or years because the month and year bucketizers are not inclusive.
            let xDomainLength = this.dateBucketizer.getNumBuckets() + (options.granularity === TimeInterval.MONTH ||
                options.granularity === TimeInterval.YEAR ? 1 : 0);

            // Create the X list now so it is properly sorted.  Items will be removed as needed.
            xList = _.range(xDomainLength).map((index) => DateUtil.fromDateToString(this.dateBucketizer.getDateForBucket(index)));

            queryResults.forEach((item) => {
                let transformation = createTransformationFromItem(item);
                let transformations = groupToTransformations.get(transformation.group);
                if (!transformations) {
                    // Create an empty array for each date bucket.
                    transformations = new Array(xDomainLength).fill(undefined).map(() => []);
                    groupToTransformations.set(transformation.group, transformations);
                }
                let index = this.dateBucketizer.getBucketIndex(new Date(item[this.searchService.getAggregationName('date')]));
                // Fix the X so it is a readable date string.
                transformation.x = DateUtil.fromDateToString(this.dateBucketizer.getDateForBucket(index));
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
                            x: DateUtil.fromDateToString(this.dateBucketizer.getDateForBucket(index)),
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

        this.xList = options.savePrevious && this.xList.length ? this.xList : xList;
        this.yList = yList;

        this.aggregationData = shownResults;

        // Set the legend groups with the original groups.
        let groups = Array.from(groupsToColors.keys()).sort();
        if (!this.legendGroups.length) {
            this.legendGroups = groups;
        }

        this.redrawFilters(filters);

        // Set the active groups to all the groups in the active data.
        this.legendActiveGroups = this.legendGroups.filter((group) => groups.indexOf(group) >= 0 &&
            this.legendDisabledGroups.indexOf(group) < 0);

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

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        // Add or remove disabled legend groups depending on the filtered legend groups.
        let legendFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterConfigOnLegendList()) as ListFilter[];
        this._filteredLegendValues = CoreUtil.retrieveValuesFromListFilters(legendFilters);
        this.legendDisabledGroups = [].concat(this._filteredLegendValues);

        // Set the active groups to all the groups that are NOT disabled/filtered since the group filters are all negative (!=).
        this.legendActiveGroups = this.legendGroups.filter((group) => this.legendDisabledGroups.indexOf(group) < 0);

        // Add or remove the selected bounds/domain on the chart depending on if the bounds/domain is filtered.
        let boundsFilters: AbstractFilter[] = filters.getCompatibleFilters(this.createFilterConfigOnBounds());
        let domainFilters: AbstractFilter[] = filters.getCompatibleFilters(this.createFilterConfigOnDomain());
        if (boundsFilters.length || domainFilters.length) {
            // TODO THOR-1100 How should we handle multiple bounds and/or domain filters?  Should we draw multiple selected areas?
            for (const boundsFilter of boundsFilters) {
                const bounds: BoundsValues = (boundsFilter as BoundsFilter).retrieveValues();
                const fieldKey1 = DatasetUtil.deconstructTableOrFieldKeySafely(bounds.field1);
                const fieldKey2 = DatasetUtil.deconstructTableOrFieldKeySafely(bounds.field2);
                if (fieldKey1.field === this.options.xField.columnName && fieldKey2.field === this.options.yField.columnName) {
                    this.subcomponentMain.select([{
                        beginX: bounds.begin1,
                        endX: bounds.end1,
                        beginY: bounds.begin2,
                        endY: bounds.end2
                    }]);
                }
                if (fieldKey1.field === this.options.yField.columnName && fieldKey2.field === this.options.xField.columnName) {
                    this.subcomponentMain.select([{
                        beginX: bounds.begin2,
                        endX: bounds.end2,
                        beginY: bounds.begin1,
                        endY: bounds.end1
                    }]);
                }
            }

            for (const domainFilter of domainFilters) {
                let domain: DomainValues = (domainFilter as DomainFilter).retrieveValues();
                const fieldKey = DatasetUtil.deconstructTableOrFieldKeySafely(domain.field);
                if (fieldKey.field === this.options.xField.columnName) {
                    this.subcomponentMain.select([{
                        beginX: domain.begin,
                        endX: domain.end
                    }]);
                }
            }

            // TODO THOR-1057 Update the selectedArea
            // this.selectedArea = null;
        } else {
            this.subcomponentMain.select([]);
            this.selectedArea = null;
        }

        // Select individual filtered items.
        // TODO THOR-1057 Maybe this should be a "filtered" property on the individual data items.
        let listFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterConfigOnItemList()) as ListFilter[];
        this._filteredSingleValues = CoreUtil.retrieveValuesFromListFilters(listFilters);
        this.subcomponentMain.select(this._filteredSingleValues);
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
        this.refreshVisualization();
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        if (!this.aggregationData) {
            return;
        }

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

        // TODO FIXME Only redraw if the unfiltered data is changed.
        // Update the overview if dualView is off or if it is not filtered.  It will only show the unfiltered data.
        if (this.subcomponentMain) {
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

        this.colorKeys = [this.colorThemeService.getColorKey(this.options.database.name, this.options.table.name,
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
        return this.options.dualView === 'on' || (this.options.dualView === 'filter' &&
            !!this.filterService.retrieveCompatibleFilterCollection(this.designEachFilterWithNoValues()).getFilters().length);
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

        this._filteredSingleValues = CoreUtil.changeOrToggleValues(value, this._filteredSingleValues, !doNotReplace);
        if (this._filteredSingleValues.length) {
            this.exchangeFilters([this.createFilterConfigOnItemList(this._filteredSingleValues)]);
        } else {
            this.exchangeFilters([], [this.createFilterConfigOnItemList()]);
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
    subcomponentRequestsFilterOnBounds(beginX: any, beginY, endX: any, endY: any, __doNotReplace?: boolean) {
        if (!(this.options.dualView || this.options.ignoreSelf)) {
            this.selectedArea = null;
        }

        if (this.options.notFilterable) {
            return;
        }

        this.exchangeFilters([this.createFilterConfigOnBounds(beginX, endX, beginY, endY)], [], true);
    }

    /**
     * Filters the given domain.  From SubcomponentListener.
     *
     * @arg {any} beginX
     * @arg {any} endX
     * @arg {boolean} doNotReplace
     * @override
     */
    subcomponentRequestsFilterOnDomain(beginX: any, endX: any, __doNotReplace?: boolean) {
        if (!(this.options.dualView || this.options.ignoreSelf)) {
            this.selectedArea = null;
        }

        if (this.options.notFilterable) {
            return;
        }

        this.exchangeFilters([this.createFilterConfigOnDomain(beginX, endX)]);
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
        let bodyContainer = this.visualization.nativeElement.getElementsByClassName('body-container').item(0) as HTMLElement;
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
