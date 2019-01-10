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

import { Color } from '../../color';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import {
    AbstractAggregationSubcomponent,
    AggregationSubcomponentListener
} from './subcomponent.aggregation.abstract';
import { BaseNeonComponent, TransformedVisualizationData } from '../base-neon-component/base-neon.component';
import { ChartJsBarSubcomponent } from './subcomponent.chartjs.bar';
import { ChartJsDoughnutSubcomponent } from './subcomponent.chartjs.doughnut';
import { ChartJsHistogramSubcomponent } from './subcomponent.chartjs.histogram';
import { ChartJsLineSubcomponent } from './subcomponent.chartjs.line';
import { ChartJsPieSubcomponent } from './subcomponent.chartjs.pie';
import { ChartJsScatterSubcomponent } from './subcomponent.chartjs.scatter';
import { FieldMetaData } from '../../dataset';
import { ListSubcomponent } from './subcomponent.list';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import { neonVariables } from '../../neon-namespaces';

import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { YearBucketizer } from '../bucketizers/YearBucketizer';

import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import * as neon from 'neon-framework';

class Filter {
    public field: string | { x: string, y: string };
    public label: string;
    public neonFilter: neon.query.WherePredicate;
    public prettyField: string | { x: string, y: string };
    public value: any | { beginX: any, endX: any } | { beginX: any, beginY: any, endX: any, endY: any };
}

export class TransformedAggregationData extends TransformedVisualizationData {
    constructor(data: any[]) {
        super(data);
    }

    /**
     * Returns the sum of the Y value of each element in the data.
     *
     * @return {number}
     * @override
     */
    public count(): number {
        return this._data.reduce((count, element) => count + element.y, 0);
    }
}

@Component({
    selector: 'app-aggregation',
    templateUrl: './aggregation.component.html',
    styleUrls: ['./aggregation.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AggregationComponent extends BaseNeonComponent implements OnInit, OnDestroy, AfterViewInit, AggregationSubcomponentListener {
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

    public colorKeys: any[] = [];
    public legendActiveGroups: any[] = [];
    public legendGroups: any[] = [];

    public xList: any[] = [];
    public yList: any[] = [];

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef,
        protected widgetService: AbstractWidgetService
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
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
                xText = moment.utc(filter.value.beginX).format('ddd, MMM D, YYYY, h:mm:ss A') + ' to ' +
                    moment.utc(filter.value.endX).format('ddd, MMM D, YYYY, h:mm:ss A');
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
                this.replaceNeonFilter(this.options, runQuery, this.filterToPassToSuperclass, neonFilter);
            } else {
                this.addNeonFilter(this.options, runQuery, this.filterToPassToSuperclass, neonFilter);
            }
        } else if (this.filterToPassToSuperclass.id) {
            this.removeLocalFilterFromLocalAndNeon(this.options, this.filterToPassToSuperclass, true, true);
        }
    }

    /**
     * Finalizes the given visualization query by adding the where predicates, aggregations, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {neon.query.Query} query
     * @arg {neon.query.WherePredicate[]} wherePredicates
     * @return {neon.query.Query}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: neon.query.Query, wherePredicates: neon.query.WherePredicate[]): neon.query.Query {
        let groups: any[] = [];
        let wheres: neon.query.WherePredicate[] = wherePredicates.concat(neon.query.where(options.xField.columnName, '!=', null));

        if (options.xField.type === 'date') {
            switch (options.granularity) {
                case 'minute':
                    groups.push(new neon.query.GroupByFunctionClause('minute', options.xField.columnName, '_minute'));
                /* falls through */
                case 'hour':
                    groups.push(new neon.query.GroupByFunctionClause('hour', options.xField.columnName, '_hour'));
                    /* falls through */
                case 'day':
                    groups.push(new neon.query.GroupByFunctionClause('dayOfMonth', options.xField.columnName, '_day'));
                    /* falls through */
                case 'month':
                    groups.push(new neon.query.GroupByFunctionClause('month', options.xField.columnName, '_month'));
                    /* falls through */
                case 'year':
                    groups.push(new neon.query.GroupByFunctionClause('year', options.xField.columnName, '_year'));
                    /* falls through */
            }
            query.aggregate(neonVariables.MIN, options.xField.columnName, '_date').sortBy('_date', neonVariables.ASCENDING);
        } else if (!options.sortByAggregation) {
            groups.push(options.xField.columnName);
            query.sortBy(options.xField.columnName, neonVariables.ASCENDING);
        } else {
            groups.push(options.xField.columnName);
            query.sortBy('_aggregation', neonVariables.DESCENDING);
        }

        if (this.optionsTypeIsXY(options)) {
            groups.push(options.yField.columnName);
            wheres.push(neon.query.where(options.yField.columnName, '!=', null));
        } else {
            query.aggregate(options.aggregation, (options.aggregation === neonVariables.COUNT ? '*' :
                options.aggregationField.columnName), '_aggregation');
        }

        if (options.groupField.columnName) {
            groups.push(options.groupField.columnName);
        }

        return query.groupBy(groups).where(wheres.length > 1 ? neon.query.and.apply(neon.query, wheres) : wheres[0]);
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('aggregationField', 'Aggregation Field', true, this.optionsAggregationIsNotCount),
            new WidgetFieldOption('groupField', 'Group Field', false),
            new WidgetFieldOption('xField', 'X Field', true),
            new WidgetFieldOption('yField', 'Y Field', true, this.optionsTypeIsXY)
        ];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('aggregation', 'Aggregation', neonVariables.COUNT, OptionChoices.AggregationType,
                this.optionsTypeIsNotXY),
            new WidgetSelectOption('timeFill', 'Date Fill', false, OptionChoices.NoFalseYesTrue, this.optionsXFieldIsDate),
            new WidgetSelectOption('granularity', 'Date Granularity', 'year', OptionChoices.DateGranularity, this.optionsXFieldIsDate),
            new WidgetSelectOption('dualView', 'Dual View', '', [{
                prettyName: 'Always Off',
                variable: ''
            }, {
                prettyName: 'Always On',
                variable: 'on'
            }, {
                prettyName: 'Only On Filter',
                variable: 'filter'
            }], this.optionsTypeIsDualViewCompatible),
            new WidgetSelectOption('notFilterable', 'Filterable', false, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('requireAll', 'Filter Operator', false, OptionChoices.OrFalseAndTrue),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('hideGridLines', 'Grid Lines', false, OptionChoices.ShowFalseHideTrue, this.optionsTypeUsesGrid),
            new WidgetSelectOption('hideGridTicks', 'Grid Ticks', false, OptionChoices.ShowFalseHideTrue, this.optionsTypeUsesGrid),
            new WidgetFreeTextOption('axisLabelX', 'Label of X-Axis', '', this.optionsTypeUsesGrid),
            new WidgetFreeTextOption('axisLabelY', 'Label of Y-Axis', '', this.optionsTypeUsesGrid),
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
            }], this.optionsTypeIsLine),
            new WidgetSelectOption('lineFillArea', 'Line Fill Area Under Curve', false, OptionChoices.NoFalseYesTrue,
                this.optionsTypeIsLine),
            new WidgetSelectOption('logScaleX', 'Log X-Axis Scale', false, OptionChoices.NoFalseYesTrue, this.optionsTypeUsesGrid),
            new WidgetSelectOption('logScaleY', 'Log Y-Axis Scale', false, OptionChoices.NoFalseYesTrue, this.optionsTypeUsesGrid),
            new WidgetSelectOption('savePrevious', 'Save Previously Seen', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('scaleMinX', 'Scale Min X', '', this.optionsTypeUsesGrid),
            new WidgetFreeTextOption('scaleMaxX', 'Scale Max X', '', this.optionsTypeUsesGrid),
            new WidgetFreeTextOption('scaleMinY', 'Scale Min Y', '', this.optionsTypeUsesGrid),
            new WidgetFreeTextOption('scaleMaxY', 'Scale Max Y', '', this.optionsTypeUsesGrid),
            new WidgetSelectOption('showHeat', 'Show Heated List', false, OptionChoices.NoFalseYesTrue, this.optionsTypeIsList),
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
            }], this.optionsTypeUsesGrid)
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
     * Transforms the given array of query results using the given options into the array of objects to be shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {TransformedVisualizationData} results
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): TransformedVisualizationData {
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
                y: isXY ? item[options.yField.columnName] : item._aggregation
            };
        };

        let queryResults = results;
        let shownResults = [];

        if (!isXY) {
            queryResults = queryResults.filter((item) => {
                return item._aggregation !== 'NaN';
            });
        }

        if (options.xField.type === 'date') {
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
            xList = _.range(xDomainLength).map((index) => {
                return moment(this.dateBucketizer.getDateForBucket(index)).toISOString();
            });

            queryResults.forEach((item) => {
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

            shownResults = Array.from(groupToTransformations.keys()).reduce((transformations, group) => {
                let nextTransformations = groupToTransformations.get(group);
                if (options.timeFill) {
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
            if (options.type !== 'histogram') {
                xList = xList.filter((x) => {
                    return xExists.get(x);
                });
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

        this.legendActiveGroups = this.legendGroups.filter((group) => {
            return groups.indexOf(group) >= 0;
        });

        this.xList = options.savePrevious && this.xList.length ? this.xList : xList;
        this.yList = yList;
        return new TransformedAggregationData(shownResults);
    }

    /**
     * Returns whether the subcomponent type shows aggregations and the aggregation type is not count.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsAggregationIsNotCount(options: any): boolean {
        return this.optionsTypeIsNotXY(options) && options.aggregation !== neonVariables.COUNT;
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
     * Publishes the component's option object and handle change callbacks to the gear component
     *
     * @override
     */
    publishOptions() {
        let handleChangeData: () => void = this.handleChangeData.bind(this);
        let handleChangeDatabase: () => void = this.handleChangeDatabase.bind(this);
        let handleChangeFilterField: () => void = this.handleChangeFilterField.bind(this);
        let handleChangeLimit: () => void = this.handleChangeLimit.bind(this);
        let handleChangeSubcomponentType: () => void = this.handleChangeSubcomponentType.bind(this);
        let handleChangeTable: () => void = this.handleChangeTable.bind(this);
        this.messenger.publish('options', {
            options: this.options,
            changeData: handleChangeData,
            changeDatabase: handleChangeDatabase,
            changeFilterFIeld: handleChangeFilterField,
            changeLimitCallback: handleChangeLimit,
            changeHandleSubcomponentType: handleChangeSubcomponentType,
            changeTable: handleChangeTable,
            componentThis: this
        });
    }

    /**
     * Publishes the toggleGear so the app component can toggle the gear panel
     */
    publishToggleGear() {
        this.messenger.publish('toggleGear', {
            toggleGear: true
        });
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
            /* tslint:disable:prefer-switch */
            if (type === 'long' || type === 'integer' || type === 'short' || type === 'byte' || type === 'double' || type === 'float' ||
                type === 'half_float' || type === 'scaled_float') {
                return 'number';
            }
            /* tslint:enable:prefer-switch */
            return type === 'date' ? 'date' : 'string';
        };

        let isXY = this.optionsTypeIsXY(this.options);
        let meta = {
            aggregationField: isXY ? undefined : this.options.aggregationField.prettyName,
            aggregationLabel: isXY ? undefined : this.options.aggregation,
            dataLength: this.getActiveData(this.options).data.length,
            groups: this.legendGroups,
            sort: this.options.sortByAggregation ? 'y' : 'x',
            xAxis: findAxisType(this.options.xField.type),
            xList: this.xList,
            yAxis: !isXY ? 'number' : findAxisType(this.options.yField.type),
            yList: this.yList
        };

        // Update the overview if dualView is off or if it is not filtered.  It will only show the unfiltered data.
        if (this.subcomponentMain && (redrawMain || !this.options.dualView || !this.filterToPassToSuperclass.id)) {
            this.subcomponentMain.draw(this.getActiveData(this.options).data, meta);
        }

        // Update the zoom if dualView is truthy.  It will show both the unfiltered and filtered data.
        if (this.subcomponentZoom && this.options.dualView) {
            this.subcomponentZoom.draw(this.getActiveData(this.options).data, meta);
        }

        this.updateOnResize();

        this.colorKeys = [this.widgetService.getColorKey(this.options.database.name, this.options.table.name,
            this.options.groupField.columnName || '')];
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
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        let validFields = options.xField.columnName && (this.optionsTypeIsXY(options) ? options.yField.columnName : true) &&
            (options.aggregation !== neonVariables.COUNT ? options.aggregationField.columnName : true);
        return !!(options.database.name && options.table.name && validFields);
    }
}
