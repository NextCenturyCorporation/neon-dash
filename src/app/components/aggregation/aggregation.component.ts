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
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { Color } from 'nucleus/dist/core/models/color';

import { AbstractSearchService, FilterClause, SearchObject } from 'nucleus/dist/core/services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import {
    AbstractFilter,
    AbstractFilterDesign,
    BoundsFilter,
    BoundsFilterDesign,
    BoundsValues,
    DomainFilter,
    DomainFilterDesign,
    DomainValues,
    FilterCollection,
    ListFilter,
    ListFilterDesign
} from 'nucleus/dist/core/models/filters';
import { DatasetUtil, FieldKey } from 'nucleus/dist/core/models/dataset';
import { DateUtil } from 'nucleus/dist/core/date.util';
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
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOptionNumber,
    ConfigOption,
    ConfigOptionSelect
} from 'nucleus/dist/core/models/config-option';

import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { YearBucketizer } from '../bucketizers/YearBucketizer';

import * as _ from 'lodash';
import { MatDialog } from '@angular/material';
import { CoreUtil } from 'nucleus/dist/core/core.util';
import { StatisticsUtil } from '../../util/statistics.util';
import flatpickr from 'flatpickr';
import rangePlugin from 'flatpickr/dist/plugins/rangePlugin';
import * as moment from 'moment';

let styleImport: any;

@Component({
    selector: 'app-aggregation',
    templateUrl: './aggregation.component.html',
    styleUrls: ['./aggregation.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AggregationComponent extends BaseNeonComponent implements OnInit, OnDestroy, AfterViewInit, AggregationSubcomponentListener {
    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('hiddenCanvas', { static: true }) hiddenCanvas: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;
    @ViewChild('subcomponentMain', { static: true }) subcomponentMainElementRef: ElementRef;
    @ViewChild('subcomponentZoom', { static: true }) subcomponentZoomElementRef: ElementRef;

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

    public maximumAggregation = 0;
    public xList: any[] = [];
    public yList: any[] = [];

    private viewInitialized = false;

    private calendarComponent: any = null;
    private savedDates: Date[] = null;
    private changedThroughPickr: boolean = false;

    // Save the values of the filters in the FilterService that are compatible with this visualization's filters.
    private _filteredLegendValues: any[] = [];
    private _filteredSingleValues: any[] = [];

    private _rocCurveAUCs = new Map<string, number>();

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        ref: ChangeDetectorRef,
        dialog: MatDialog,
        protected colorThemeService: InjectableColorThemeService,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            ref,
            dialog
        );

        if (!styleImport) {
            styleImport = document.createElement('link');
            styleImport.rel = 'stylesheet';
            styleImport.href = 'assets/flatpickr/dist/flatpickr.min.css';
            document.head.appendChild(styleImport);
        }
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
        this._createDatePickerIfNeeded();
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {AbstractFilterDesign[]}
     * @override
     */
    protected designEachFilterWithNoValues(): AbstractFilterDesign[] {
        let designs: AbstractFilterDesign[] = [];

        if (this.options.groupField.columnName) {
            designs.push(this.createFilterDesignOnLegendList());
        }

        if (this.options.xField.columnName) {
            designs.push(this.createFilterDesignOnItemList());
            designs.push(this.createFilterDesignOnDomain());

            if (this.options.yField.columnName) {
                designs.push(this.createFilterDesignOnBounds());
            }
        }

        return designs;
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {SearchObject} SearchObject
     * @arg {FilterClause[]} filters
     * @return {SearchObject}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: SearchObject, filters: FilterClause[]): SearchObject {
        let visualizationFilters: FilterClause[] = [this.searchService.createFilterClause({
            datastore: options.datastore.name,
            database: options.database.name,
            table: options.table.name,
            field: options.xField.columnName
        } as FieldKey, '!=', null)];
        let countField = options.xField.columnName;
        let countGroup = null;

        if (options.xField.type === 'date') {
            switch (options.granularity) {
                case TimeInterval.SECOND:
                    this.searchService.withGroupByDate(query, {
                        datastore: options.datastore.name,
                        database: options.database.name,
                        table: options.table.name,
                        field: options.xField.columnName
                    } as FieldKey, TimeInterval.SECOND, '_' + TimeInterval.SECOND);
                // Falls through
                case TimeInterval.MINUTE:
                    this.searchService.withGroupByDate(query, {
                        datastore: options.datastore.name,
                        database: options.database.name,
                        table: options.table.name,
                        field: options.xField.columnName
                    } as FieldKey, TimeInterval.MINUTE, '_' + TimeInterval.MINUTE);
                // Falls through
                case TimeInterval.HOUR:
                    this.searchService.withGroupByDate(query, {
                        datastore: options.datastore.name,
                        database: options.database.name,
                        table: options.table.name,
                        field: options.xField.columnName
                    } as FieldKey, TimeInterval.HOUR, '_' + TimeInterval.HOUR);
                // Falls through
                case TimeInterval.DAY_OF_MONTH:
                    this.searchService.withGroupByDate(query, {
                        datastore: options.datastore.name,
                        database: options.database.name,
                        table: options.table.name,
                        field: options.xField.columnName
                    } as FieldKey, TimeInterval.DAY_OF_MONTH, '_' + TimeInterval.DAY_OF_MONTH);
                // Falls through
                case TimeInterval.MONTH:
                    this.searchService.withGroupByDate(query, {
                        datastore: options.datastore.name,
                        database: options.database.name,
                        table: options.table.name,
                        field: options.xField.columnName
                    } as FieldKey, TimeInterval.MONTH, '_' + TimeInterval.MONTH);
                // Falls through
                case TimeInterval.YEAR:
                    this.searchService.withGroupByDate(query, {
                        datastore: options.datastore.name,
                        database: options.database.name,
                        table: options.table.name,
                        field: options.xField.columnName
                    } as FieldKey, TimeInterval.YEAR, '_' + TimeInterval.YEAR);
                // Falls through
            }
            this.searchService.withAggregation(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.xField.columnName
            } as FieldKey, this.searchService.getAggregationLabel('date'), AggregationType.MIN);
            this.searchService.withOrderByOperation(query, this.searchService.getAggregationLabel('date'));
            countField = null;
            countGroup = '_' + options.granularity;
        } else {
            this.searchService.withGroup(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.xField.columnName
            } as FieldKey);
            if (!options.sortByAggregation) {
                this.searchService.withOrder(query, {
                    datastore: options.datastore.name,
                    database: options.database.name,
                    table: options.table.name,
                    field: options.xField.columnName
                } as FieldKey);
            } else {
                this.searchService.withOrderByOperation(query, this.searchService.getAggregationLabel(), SortOrder.DESCENDING);
            }
        }

        if (this.optionsTypeIsXY(options)) {
            this.searchService.withGroup(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.yField.columnName
            } as FieldKey);
            visualizationFilters.push(this.searchService.createFilterClause({
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.yField.columnName
            } as FieldKey, '!=', null));
        }

        if (options.groupField.columnName) {
            this.searchService.withGroup(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.groupField.columnName
            } as FieldKey);
            countField = options.groupField.columnName;
            countGroup = null;
        }

        if (options.aggregation !== AggregationType.COUNT || countField) {
            this.searchService.withAggregation(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: (options.aggregation === AggregationType.COUNT ? countField : options.aggregationField.columnName)
            } as FieldKey, this.searchService.getAggregationLabel(), options.aggregation);
        } else if (countGroup) {
            this.searchService.withAggregationByGroupCount(query, countGroup, this.searchService.getAggregationLabel());
        }

        this.searchService.withFilter(query, this.searchService.createCompoundFilterClause(filters.concat(visualizationFilters)));

        return query;
    }

    private createFilterDesignOnBounds(beginX?: any, endX?: any, beginY?: any, endY?: any): BoundsFilterDesign {
        return new BoundsFilterDesign(
            `${this.options.datastore.name}.${this.options.database.name}.${this.options.table.name}.${this.options.xField.columnName}`,
            `${this.options.datastore.name}.${this.options.database.name}.${this.options.table.name}.${this.options.yField.columnName}`,
            beginX, beginY, endX, endY
        );
    }

    private createFilterDesignOnDomain(beginX?: any, endX?: any): DomainFilterDesign {
        return new DomainFilterDesign(
            `${this.options.datastore.name}.${this.options.database.name}.${this.options.table.name}.${this.options.xField.columnName}`,
            beginX, endX
        );
    }

    private createFilterDesignOnLegendList(values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.AND, this.options.datastore.name + '.' + this.options.database.name + '.' +
            this.options.table.name + '.' + this.options.groupField.columnName, '!=', values);
    }

    private createFilterDesignOnItemList(values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(this.options.requireAll ? CompoundFilterType.AND : CompoundFilterType.OR, this.options.datastore.name +
            '.' + this.options.database.name + '.' + this.options.table.name + '.' + this.options.xField.columnName, '=', values);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('aggregationField', 'Aggregation Field', true, this.optionsAggregationIsCountOrNA.bind(this)),
            new ConfigOptionField('groupField', 'Group Field', false),
            new ConfigOptionField('xField', 'X Field', true),
            new ConfigOptionField('yField', 'Y Field', true, this.optionsTypeIsNotXY.bind(this)),
            new ConfigOptionSelect('aggregation', 'Aggregation', false, AggregationType.COUNT, OptionChoices.Aggregation,
                this.optionsTypeIsXY.bind(this)),
            new ConfigOptionSelect('countByAggregation', 'Count Aggregations', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('timeFill', 'Date Fill', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsXFieldIsNotDate.bind(this)),
            new ConfigOptionSelect('granularity', 'Date Granularity', false, TimeInterval.YEAR, OptionChoices.DateGranularity,
                this.optionsXFieldIsNotDate.bind(this)),
            new ConfigOptionSelect('dualView', 'Dual View', false, '', [{
                prettyName: 'Always Off',
                variable: ''
            }, {
                prettyName: 'Always On',
                variable: 'on'
            }, {
                prettyName: 'Only On Filter',
                variable: 'filter'
            }], this.optionsTypeIsNotDualViewCompatible.bind(this)),
            new ConfigOptionSelect('notFilterable', 'Filterable', false, false, OptionChoices.YesFalseNoTrue),
            new ConfigOptionSelect('requireAll', 'Filter Operator', false, false, OptionChoices.OrFalseAndTrue),
            new ConfigOptionSelect('ignoreSelf', 'Filter Self', false, true, OptionChoices.YesFalseNoTrue),
            new ConfigOptionSelect('hideGridLines', 'Grid Lines', false, false, OptionChoices.ShowFalseHideTrue,
                this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionSelect('hideGridTicks', 'Grid Ticks', false, false, OptionChoices.ShowFalseHideTrue,
                this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionFreeText('axisLabelX', 'Label of X-Axis', false, '', this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionFreeText('axisLabelY', 'Label of Y-Axis', false, '', this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionSelect('lineCurveTension', 'Line Curve Tension', false, 0.3, [{
                prettyName: '0',
                variable: 0
            }, {
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
            }], this.optionsTypeIsNotLine.bind(this)),
            new ConfigOptionSelect('lineFillArea', 'Line Fill Area Under Curve', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsNotLine.bind(this)),
            new ConfigOptionSelect('listWrap', 'List Wrap', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsNotList.bind(this)),
            new ConfigOptionSelect('logScaleX', 'Log X-Axis Scale', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionSelect('logScaleY', 'Log Y-Axis Scale', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionSelect('rocCurve', 'ROC Curve', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsNotLine.bind(this)),
            new ConfigOptionSelect('savePrevious', 'Save Previously Seen', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionNumber('scaleMinX', 'Scale Min X', false, null, this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionNumber('scaleMaxX', 'Scale Max X', false, null, this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionNumber('scaleMinY', 'Scale Min Y', false, null, this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionNumber('scaleMaxY', 'Scale Max Y', false, null, this.optionsTypeIsNotGrid.bind(this)),
            new ConfigOptionSelect('showHeat', 'Show Heated List', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsNotList.bind(this)),
            new ConfigOptionSelect('showLegend', 'Show Legend', false, true, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('sortByAggregation', 'Sort By', false, false, [{
                prettyName: 'Label',
                variable: false
            }, {
                prettyName: 'Aggregation',
                variable: true
            }]),
            new ConfigOptionSelect('type', 'Visualization Type', true, 'line', [{
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
            new ConfigOptionSelect('yPercentage', 'Y-Axis Max Width', false, 0.3, [{
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
            }], this.optionsTypeIsNotGrid.bind(this))
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
        if (this.optionsTypeIsNotDualViewCompatible(this.options)) {
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
                this.exchangeFilters([this.createFilterDesignOnLegendList(this._filteredLegendValues)]);
            } else {
                // If we won't set any filters, create a FilterDesign without a value to delete all the old filters on the group field.
                this.exchangeFilters([], [this.createFilterDesignOnLegendList()]);
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
        if (this.optionsTypeIsNotDualViewCompatible(this.options)) {
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
            if (cannotSelect || this.options.rocCurve) {
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
        this.maximumAggregation = 0;
        this.xList = [];
        this.yList = [];
        this._createDatePickerIfNeeded();
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

        let maximumAggregation = 0;
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
            let transformation = {
                // The aggregation value for X/Y subcomponents.
                aggregation: isXY ? (Math.round((item[this.searchService.getAggregationLabel()] || 0) * 10000) / 10000) : undefined,
                color: findGroupColor(group),
                group: group,
                x: CoreUtil.deepFind(item, options.xField.columnName),
                y: isXY ? CoreUtil.deepFind(item, options.yField.columnName) :
                    (Math.round(item[this.searchService.getAggregationLabel()] * 10000) / 10000)
            };
            maximumAggregation = Math.max(maximumAggregation, (isXY ? transformation.aggregation : transformation.y));
            return transformation;
        };

        let queryResults = results;
        let shownResults = [];

        if (!isXY) {
            queryResults = queryResults.filter((item) => item[this.searchService.getAggregationLabel()] !== 'NaN');
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
                queryResults[0][this.searchService.getAggregationLabel('date')];
            let endDate = options.savePrevious && this.xList.length ? this.xList[this.xList.length - 1] :
                queryResults[queryResults.length - 1][this.searchService.getAggregationLabel('date')];
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
                let index = this.dateBucketizer.getBucketIndex(new Date(item[this.searchService.getAggregationLabel('date')]));
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
                            aggregation: 0,
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

        this.maximumAggregation = maximumAggregation;
        this.xList = options.savePrevious && this.xList.length ? this.xList : xList;
        this.yList = yList;

        this.aggregationData = shownResults;

        // Set legendGroups to groups.  Only update legendGroups if groups is bigger (filters were removed).
        let groups = Array.from(groupsToColors.keys()).sort();
        if (this.legendGroups.length < groups.length) {
            this.legendGroups = groups;
        }

        if (options.rocCurve && options.type === 'line-xy') {
            this._createRocCurve(options, groups, groupsToColors);
        }

        // Redraw the latest filters in the visualization element.
        this.redrawFilters(filters);

        // Set the active groups to all the groups in the active data.
        this.legendActiveGroups = this.legendGroups.filter((group) => groups.indexOf(group) >= 0 &&
            this.legendDisabledGroups.indexOf(group) < 0);

        return this._retrieveElementCount(options, groups);
    }

    /**
     * Returns whether the subcomponent type doesn't show aggregations or the aggregation type is count.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsAggregationIsCountOrNA(options: any): boolean {
        return this.optionsTypeIsXY(options) || options.aggregation === AggregationType.COUNT;
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
     * Returns whether the subcomponent type is not compatible with dual view.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsNotDualViewCompatible(options: any): boolean {
        switch (options.type) {
            case 'histogram':
            case 'line':
            case 'line-xy':
                return false;
            case 'bar-h':
            case 'bar-v':
            case 'doughnut':
            case 'list':
            case 'pie':
            case 'scatter':
            case 'scatter-xy':
            default:
                return true;
        }
    }

    /**
     * Returns whether the subcomponent type is not line.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsNotLine(options: any): boolean {
        return options.type !== 'line' && options.type !== 'line-xy';
    }

    /**
     * Returns whether the subcomponent type is not list.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsNotList(options: any): boolean {
        return options.type !== 'list';
    }

    /**
     * Returns whether the subcomponent type does not use the grid and axes.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsNotGrid(options: any): boolean {
        switch (options.type) {
            case 'bar-h':
            case 'bar-v':
            case 'histogram':
            case 'line':
            case 'line-xy':
            case 'scatter':
            case 'scatter-xy':
                return false;
            case 'doughnut':
            case 'list':
            case 'pie':
            default:
                return true;
        }
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
     * Returns whether the subcomponent type requires both X and Y fields.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsTypeIsXY(options: any): boolean {
        return options.type === 'line-xy' || options.type === 'scatter-xy';
    }

    /**
     * Returns whether the X field data type is not date.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsXFieldIsNotDate(options: any): boolean {
        return options.xField.type !== 'date';
    }

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        // Add or remove disabled legend groups depending on the filtered legend groups.
        let legendFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnLegendList()) as ListFilter[];
        this._filteredLegendValues = CoreUtil.retrieveValuesFromListFilters(legendFilters);
        this.legendDisabledGroups = [].concat(this._filteredLegendValues);

        // Set the active groups to all the groups that are NOT disabled/filtered since the group filters are all negative (!=).
        this.legendActiveGroups = this.legendGroups.filter((group) => this.legendDisabledGroups.indexOf(group) < 0);

        // Add or remove the selected bounds/domain on the chart depending on if the bounds/domain is filtered.
        let boundsFilters: AbstractFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnBounds());
        let domainFilters: AbstractFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnDomain());
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
                    // Ensures date picker is updated when present.
                    if (this.canHaveDatePicker() && !this.changedThroughPickr) {
                        this.calendarComponent.setDate([domain.begin, domain.end], true);
                        this.savedDates = this.calendarComponent.selectedDates;
                        this.calendarComponent.redraw();
                    }
                    this.changedThroughPickr = false;

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
            if (this.canHaveDatePicker() && this.calendarComponent) {
                this.calendarComponent.clear();
                this.savedDates = null;
            }
        }

        // Select individual filtered items.
        let listFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnItemList()) as ListFilter[];
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

        let findAxisType = (type) => ((type === 'decimal' || type === 'integer') ? 'number' : (type === 'date' ? 'date' : 'string'));

        let isXY = this.optionsTypeIsXY(this.options);
        let meta = {
            aggregationField: this.options.aggregationField.prettyName,
            aggregationLabel: this.options.aggregation,
            dataLength: this.aggregationData.length,
            groups: this.legendGroups,
            legend: this.options.rocCurve ? {
                groupsToLabels: this.legendGroups.reduce((map, group) => {
                    map.set(group, group + ' AUC=' + (this._rocCurveAUCs.has(group) ? this._rocCurveAUCs.get(group) : '?'));
                    return map;
                }, new Map<string, string>())
            } : null,
            maximumAggregation: this.maximumAggregation,
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
     * @override
     */
    protected retrieveCompatibleFiltersToIgnore(compatibleFilters: AbstractFilter[]): AbstractFilterDesign[] {
        // Never ignore legend filters.
        let groupFieldKey = this.options.datastore.name + '.' + this.options.database.name + '.' + this.options.table.name + '.' +
            this.options.groupField.columnName;
        return compatibleFilters.map((filter) => filter.toDesign()).filter((filterDesign) =>
            !(filterDesign instanceof ListFilterDesign && filterDesign.fieldKey === groupFieldKey && filterDesign.operator === '!='));
    }

    canHaveDatePicker(): boolean {
        return this.options.type === 'histogram' && !this.optionsXFieldIsNotDate(this.options);
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

        this._filteredSingleValues = CoreUtil.changeOrToggleValues(value, this._filteredSingleValues, doNotReplace);
        if (this._filteredSingleValues.length) {
            this.exchangeFilters([this.createFilterDesignOnItemList(this._filteredSingleValues)]);
        } else {
            // If we won't set any filters, create a FilterDesign without a value to delete all the old filters on the data field.
            this.exchangeFilters([], [this.createFilterDesignOnItemList()]);
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

        // Always keep the existing filter (don't remove it) if the user happens to draw exactly the same bounding box twice.
        this.exchangeFilters([this.createFilterDesignOnBounds(beginX, endX, beginY, endY)], [], true);
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

        // If you are setting a date filter by the click and scroll, make sure to update the calendar setter.
        if (this.canHaveDatePicker()) {
            let newBegin = moment.parseZone(beginX).local().toDate();
            let newEnd = moment.parseZone(endX).local().toDate();
            if (!DateUtil.USE_LOCAL_TIME) {
                newBegin.setHours(beginX.getUTCHours());
                newEnd.setHours(endX.getUTCHours());
            }
            this.calendarComponent.setDate([newBegin, newEnd], true);
            this.calendarComponent.redraw();
            this.changedThroughPickr = true;
            this.savedDates = [newBegin, newEnd];
        }

        this.exchangeFilters([this.createFilterDesignOnDomain(beginX, endX)]);
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
        if (!this.options.notFilterable) {
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

    private _createDatePickerIfNeeded(): void {
        if (this.canHaveDatePicker()) {
            this.calendarComponent = flatpickr('#begin_date_' + this.options._id, {
                enableTime: true,
                defaultHour: 0,
                plugins: [rangePlugin({ input: '#end_date_' + this.options._id })],
                dateFormat: 'M d, Y, h:i K',
                onOpen: (__selectedDates, __dateStr, instance) => {
                    instance.clear();
                },
                onClose: (selectedDates, __dateStr, instance) => {
                    if (selectedDates[0] !== undefined && selectedDates[1] !== undefined) {
                        let deepCopyDates: Date[] = [new Date(selectedDates[0].getTime()), new Date(selectedDates[1].getTime())];
                        if (!DateUtil.USE_LOCAL_TIME) {
                            deepCopyDates[0].setUTCHours(selectedDates[0].getHours());
                            deepCopyDates[1].setUTCHours(selectedDates[1].getHours());
                        }
                        this.changedThroughPickr = true;
                        this.exchangeFilters([this.createFilterDesignOnDomain(deepCopyDates[0], deepCopyDates[1])]);
                        this.savedDates = selectedDates;
                    }
                    if (this.savedDates) {
                        instance.setDate(this.savedDates, true);
                        instance.redraw();
                    }
                }
            });
        }
    }

    private _createRocCurve(options: any, groups: string[], groupsToColors: Map<string, Color>): void {
        options.lineCurveTension = 0;
        options.notFilterable = true;

        const rocCurveCallback = (category: string, xValue: number, yValue: number): any => ({
            aggregation: 1,
            color: category ? groupsToColors.get(category) : Color.fromHexString('#888'),
            group: category || 'Random',
            x: xValue,
            y: yValue
        });

        const rocCurveData = StatisticsUtil.rocCurve(groups.reduce((rocCurveInputArray, group) =>
            rocCurveInputArray.concat({
                category: group,
                data: this.aggregationData.filter((item) => item.group === group).reduce((categoryData, item) => {
                    for (let aggregationIndex = 0; aggregationIndex < item.aggregation; ++aggregationIndex) {
                        categoryData.push({
                            label: item.y,
                            score: item.x
                        });
                    }
                    return categoryData;
                }, [])
            }), []), rocCurveCallback);

        this.aggregationData = rocCurveData.points;
        this.xList = rocCurveData.xArray;
        this.yList = rocCurveData.yArray;
        this._rocCurveAUCs = rocCurveData.aucs;
    }

    private _retrieveElementCount(options: any, groups: string[]) {
        if (options.countByAggregation || !this.optionsAggregationIsCountOrNA(options)) {
            switch (options.type) {
                case 'line':
                case 'line-xy':
                    return groups.length;
                case 'bar-h':
                case 'bar-v':
                case 'doughnut':
                case 'histogram':
                case 'list':
                case 'pie':
                    return this.xList.length;
                case 'scatter':
                case 'scatter-xy':
                default:
                    return this.aggregationData.length;
            }
        }

        return this.aggregationData.reduce((count, element) => count + element.y, 0);
    }
}
