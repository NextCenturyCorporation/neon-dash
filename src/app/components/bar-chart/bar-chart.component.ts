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

import { Color } from '../../color';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { ChartComponent } from '../chart/chart.component';
import { Chart } from 'chart.js';
import { FieldMetaData } from '../../dataset';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { IfStmt } from '@angular/compiler';

/**
 * Data used to draw the bar chart
 */
export class BarData {
    // The X-Axis labels
    labels: string[] = [];
    // The data to graph
    datasets: BarDataSet[] = [];
}

/**
 * One set of bars to draw
 */
export class BarDataSet {
    data: number[] = [];

    // The backgroundColor, hoverBackgroundColor, and label properties are all used by ChartJS.
    backgroundColor: string[] = [];
    hoverBackgroundColor: string[] = [];

    constructor(length: number, public label: string, public color: Color, public hoverColor: Color) {
        if (length) {
            for (let i = 0; i < length; i++) {
                this.data[i] = 0;
                this.backgroundColor[i] = this.color.toRgb();
                this.hoverBackgroundColor[i] = this.hoverColor.toRgb();
            }
        }
    }

    /**
     * Set all the background colors to the default color of this set
     */
    setAllActive() {
        for (let i = 0; i < this.data.length; i++) {
            this.backgroundColor[i] = this.color.toRgb();
        }
    }

    /**
     * Set all the background colors to the default color of this set
     */
    setAllInactive() {
        for (let i = 0; i < this.data.length; i++) {
            this.backgroundColor[i] = this.color.getInactiveRgba();
        }
    }

    /**
     * Set the background color of a single bar to the active color
     * @param {number} position
     */
    setActiveColor(position: number) {
        this.backgroundColor[position] = this.color.toRgb();
    }

    /**
     * set the background color of a single bar to the inactive color
     * @param {number} position
     */
    setInactiveColor(position: number) {
        this.backgroundColor[position] = this.color.getInactiveRgba();
    }
}

/**
 * Manages configurable options for the specific visualization.
 */
export class BarChartOptions extends BaseNeonOptions {
    public aggregation: string;
    public aggregationField: FieldMetaData;
    public andFilters: boolean;
    public colorField: FieldMetaData;
    public dataField: FieldMetaData;
    public ignoreSelf: boolean;
    public logScale: boolean;
    public saveSeenBars: boolean;
    public scaleManually: boolean;
    public scaleMax: string;
    public scaleMin: string;
    public sortAlphabetically: boolean;
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
        bindings.andFilters = this.andFilters;
        bindings.chartType = this.type;
        bindings.ignoreSelf = this.ignoreSelf;
        bindings.logScale = this.logScale;
        bindings.saveSeenBars = this.saveSeenBars;
        bindings.scaleManually = this.scaleManually;
        bindings.scaleMax = this.scaleMax;
        bindings.scaleMin = this.scaleMin;
        bindings.sortAlphabetically = this.sortAlphabetically;
        bindings.yPercentage = this.yPercentage;

        return bindings;
    }

    /**
     * Returns the list of fields to export.
     *
     * @return {{ columnName: string, prettyName: string }[]}
     * @override
     */
    getExportFields(): any[] {
        return [{
            columnName: this.dataField.columnName,
            prettyName: this.dataField.prettyName
        }, {
            columnName: 'value',
            prettyName: (this.aggregation.charAt(0).toUpperCase() + this.aggregation.slice(1)) + (this.aggregation === 'count' ? '' :
                ('_' + this.aggregationField.prettyName))
        }];
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
            'dataField',
            'colorField'
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
        this.andFilters = this.injector.get('andFilters', true);
        this.ignoreSelf = this.injector.get('ignoreSelf', true);
        this.logScale = this.injector.get('logScale', false);
        this.saveSeenBars = this.injector.get('saveSeenBars', true);
        this.scaleManually = this.injector.get('scaleManually', false);
        this.scaleMax = this.injector.get('scaleMax', '');
        this.scaleMin = this.injector.get('scaleMin', '');
        this.sortAlphabetically = this.injector.get('sortAlphabetically', false);
        this.type = this.injector.get('chartType', 'bar');
        this.yPercentage = this.injector.get('yPercentage', 0.2);
    }
}

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarChartComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('chartContainer') chartContainer: ElementRef;
    @ViewChild('barChart') chartModule: ChartComponent;
    @ViewChild('hiddenCanvas') hiddenCanvas: ElementRef;

    public filters: {
        id: string,
        field: string,
        value: string,
        prettyField: string,
        operator: any
    }[] = [];

    public options: BarChartOptions;

    public activeData: any[] = [];
    public bars: string[] = [];
    public seenBars: string[] = [];

    public labelCount: number = 0;
    public labelMax: number = 0;

    public lastPage: boolean = true;
    public page: number = 1;

    public minSize: {
        height: number,
        width: number
    } = {
        height: 0,
        width: 0
    };

    //this is what gets loaded into the Chart object; it should always(?) be identical to chartModule.chart.config
    public chartInfo: {
        data: {
            labels: string[],
            datasets: BarDataSet[]
        },
        type: string,
        options: any
    };

    // Used to change the colors between active/inactive in the legend
    public selectedLabels: string[] = [];
    public colorFieldNames: string[] = [];

    public defaultBarColor;
    public defaultHighlightColor;

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        ref: ChangeDetectorRef,
        protected widgetService: AbstractWidgetService
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            ref
        );

        console.warn('The bar-chart component is deprecated.  Please use the aggregation component with type=bar-v or type=bar-h.');

        this.options = new BarChartOptions(this.injector, this.datasetService, 'Bar Chart', 10);

        this.onClick = this.onClick.bind(this);

        // Margin for the y-axis labels.
        let LABELS_MARGIN = 20;
        // Margin for the tooltip labels.
        let TOOLTIPS_MARGIN = 20;

        let calculateTextWidth = (text) => {
            if (!text) {
                return 0;
            }
            let element = this.hiddenCanvas.nativeElement;
            let context = element.getContext('2d');
            context.font = '10px sans-serif';
            return context.measureText(text).width;
        };

        let calculateYLabelWidth = () => {
            let yLabels: any[] = (this.options.type === 'bar' ? [this.labelMax] : this.bars);
            let yLabelWidth = yLabels.reduce((max, yLabel) => {
                return Math.max(max, calculateTextWidth(yLabel));
            }, 0);
            return yLabelWidth;
        };

        let resizeXLabel = (scaleInstance) => {
            // Set the left padding to equal the Y label width plus the margin.  Set the X label width accordingly.
            let yLabelMaxWidth = Math.floor(this.options.yPercentage * this.chartModule.getNativeElement().clientWidth);
            scaleInstance.paddingLeft = Math.min(yLabelMaxWidth, calculateYLabelWidth()) + LABELS_MARGIN;
            scaleInstance.paddingRight = 10;
            scaleInstance.width = this.chartModule.getNativeElement().clientWidth - scaleInstance.paddingLeft - scaleInstance.paddingRight;
        };

        let resizeYLabel = (scaleInstance) => {
            // Set the Y label width to either its minimum needed width or a percentage of the chart width (whatever is lower).
            let yLabelMaxWidth = Math.floor(this.options.yPercentage * this.chartModule.getNativeElement().clientWidth);
            scaleInstance.width = Math.min(yLabelMaxWidth, calculateYLabelWidth());
        };

        let truncateText = (containerWidth, text, suffix = '') => {
            // Format number strings first.
            let formatted = this.formatNumber(text);
            // Subtract three characters for the ellipsis.
            let truncated = ('' + formatted).substring(0, ('' + formatted).length - 3);
            let elementWidth = calculateTextWidth(formatted + suffix);

            if (!elementWidth || elementWidth < 0 || !containerWidth || containerWidth < 0 || elementWidth < containerWidth) {
                return (formatted || '') + suffix;
            }

            while (elementWidth > containerWidth) {
                // Truncate multiple characters of long text to increase speed performance.
                let chars = Math.ceil(truncated.length / 20.0);
                truncated = truncated.substring(0, truncated.length - chars);
                if (!truncated) {
                    return '...' + suffix;
                }
                elementWidth = calculateTextWidth(truncated + '...' + suffix);
            }

            return truncated.trim() + '...' + suffix;
        };

        let truncateXLabelText = (text) => {
            let xLabelCount = (this.options.type === 'bar' ? Math.min(this.bars.length, this.options.limit) : this.labelCount);
            let containerWidth = Math.floor(this.chartModule.getNativeElement().clientWidth / xLabelCount);
            return truncateText(containerWidth, text);
        };

        let truncateYLabelText = (text) => {
            let containerWidth = Math.floor(this.options.yPercentage * this.chartModule.getNativeElement().clientWidth - LABELS_MARGIN);
            return truncateText(containerWidth, text);
        };

        let truncateTooltipLabelText = (text, suffix = '') => {
            let containerWidth = this.chartModule.getNativeElement().clientWidth - TOOLTIPS_MARGIN;
            return truncateText(containerWidth, text, suffix);
        };

        this.chartInfo = {
            type: this.options.type,
            data: {
                labels: [],
                datasets: [new BarDataSet(0, '', this.defaultBarColor, this.defaultHighlightColor)]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                onClick: this.onClick,
                animation: {
                    duration: 0 // general animation time
                },
                hover: {
                    mode: 'point',
                    onHover: null
                },
                scales: {
                    xAxes: [{
                        afterFit: resizeXLabel,
                        barPercentage: 0.9,
                        categoryPercentage: 0.9,
                        stacked: true,
                        ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            beginAtZero: true,
                            callback: truncateXLabelText
                        }
                    }],
                    yAxes: [{
                        afterFit: resizeYLabel,
                        barPercentage: 0.9,
                        categoryPercentage: 0.9,
                        stacked: true,
                        ticks: {
                            beginAtZero: true,
                            callback: truncateYLabelText
                        }
                    }]
                },
                legend: {
                    display: false
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {},
                    position: 'neonBarMousePosition'
                }
            }
        };

        let createTooltipTitle = (tooltipList, data) => {
            // Hack to reposition the tooltip to the mouse cursor position.
            this.chartModule.chart.tooltip._lastActive = [{}];

            let count = tooltipList.reduce((sum, tooltipItem) => {
                let dataset = data.datasets[tooltipItem.datasetIndex];
                return sum + dataset.data[tooltipItem.index];
            }, 0);
            return [
                truncateTooltipLabelText(data.labels[tooltipList[0].index]),
                this.options.aggregation + ': ' + this.formatNumber(count)
            ];
        };

        let createTooltipLabel = (tooltipItem, data) => {
            let dataset = data.datasets[tooltipItem.datasetIndex];
            let count = dataset.data[tooltipItem.index];
            // Returning null removes the row from the tooltip
            return data.datasets.length === 1 || count === 0 ? null : truncateTooltipLabelText(dataset.label, ': ' +
                this.formatNumber(count));
        };

        this.chartInfo.options.tooltips.callbacks.title = createTooltipTitle.bind(this);
        this.chartInfo.options.tooltips.callbacks.label = createTooltipLabel.bind(this);
    }

    /**
     * Initializes any bar chart sub-components needed.
     *
     * @override
     */
    subNgOnInit() {
        // Do nothing.
    }

    /**
     * Handles any bar chart component post-initialization behavior needed.
     *
     * @override
     */
    postInit() {
        this.executeQueryChain();

        //This does nothing, but it is here to hide a bug: without it, if you open a barchart, and switch the type once,
        //then the chart will not resize with the widget. Resizing works again after any subsequent type-switch. So if we call
        //this at the outset of the program, the chart should always resize correctly. I would think we'd need to call this
        //method twice, but for some reason it appears it only needs one call to work.
        this.handleChangeBarChartObject();

        this.defaultBarColor = this.getPrimaryThemeColor();
        this.defaultHighlightColor = this.getHighlightThemeColor();
    }

    /**
     * Deletes any bar chart sub-components needed.
     *
     * @override
     */
    subNgOnDestroy() {
        this.chartModule.chart.destroy();
    }

    /**
     * Adds, replaces, or removes filters using the bar chart data in the given elements.
     *
     * @arg {object} _event
     * @arg {array} elements
     */
    onClick(_event: any, elements: any[]) {
        if (elements.length) {
            let filter = {
                id: undefined,
                field: this.options.dataField.columnName,
                value: elements[0]._model.label,
                prettyField: this.options.dataField.prettyName,
                operator: '='
            };
            if (_event.ctrlKey || _event.metaKey) { // If Ctrl (or Command on Mac) is pressed...
                if (this.filterIsUnique(filter)) {
                    this.addLocalFilter(filter);
                    let whereClause = neon.query.where(filter.field, filter.operator, filter.value);
                    this.addNeonFilter(true, filter, whereClause);
                } else {
                    for (let existingFilter of this.filters) {
                        if (existingFilter.field === filter.field && existingFilter.value === filter.value) {
                            this.removeLocalFilterFromLocalAndNeon(existingFilter, true, true);
                            break;
                        }
                    }
                }
            } else { // If Ctrl isn't pressed...
                if (this.filters.length === 0) {
                    this.addLocalFilter(filter);
                    this.addNeonFilter(true, filter, this.createNeonFilter(this.filters));
                } else if (this.filters.length === 1 && this.filterIsUnique(filter)) {
                    filter.id = this.filters[0].id;
                    this.filters[0] = filter;
                    this.replaceNeonFilter(true, filter, this.createNeonFilter(this.filters));
                } else {
                    // Use concat to copy the list of filters.
                    this.removeAllFilters([].concat(this.filters), () => {
                        this.addLocalFilter(filter);
                        this.addNeonFilter(true, filter, this.createNeonFilter(this.filters));
                    });
                }
            }

            this.refreshVisualization();
        }
    }

    /**
     * Adds the given filter object to the bar chart's list of filter objects.
     *
     * @arg {object} filter
     */
    addLocalFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.value !== filter.value;
        }).concat([filter]);
    }

    /**
     * Returns true if the given filter object does not match any filter in the list of bar chart component filter objects.
     *
     * @arg {object} filter
     * @return {boolean}
     */
    filterIsUnique(filter: any): boolean {
        for (let existingFilter of this.filters) {
            if (existingFilter.value === filter.value && existingFilter.field === filter.field) {
                return false;
            }
        }
        return true;
    }

    /**
     * Creates and returns the neon filter object using the given filters.
     *
     * @arg {array} filters
     * @return {neon.query.WherePredicate}
     * @override
     */
    createNeonFilter(filters: any[]): neon.query.WherePredicate {
        let filterClauses = filters.map((filter) => {
            return neon.query.where(filter.field, '=', filter.value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.options.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    }

    /**
     * Returns the bar chart filter text using the given filter object.
     *
     * @arg {object} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        return filter.prettyField + ' = ' + filter.value;
    }

    /**
     * Updates the bar colors and legend and refreshes the bar chart.
     *
     * @override
     */
    refreshVisualization() {
        let selectedLabels: string[] = [];
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.dataField.columnName]);
        let andFilter;
        if (this.filters.length > 0) {
            let activeLabelIndexes = [];

            if (neonFilters.length === 0 || neonFilters[0].filter.whereClause.type === undefined) {
                andFilter = false;
            } else {
                andFilter = neonFilters[0].filter.whereClause.type === 'and';
            }
            for (let thisFilter of this.filters) {
                let activeFilterValue = thisFilter.value;
                activeLabelIndexes = activeLabelIndexes.concat(this.chartInfo.data.labels.map((label, index) => {
                    let labelNum = <any> label;
                        switch (thisFilter.operator) {
                            case '<':
                                return label < activeFilterValue ? index : -1;
                            case '>':
                                return label > activeFilterValue ? index : -1;
                            case '>=':
                                return label >= activeFilterValue ? index : -1;
                            case '<=':
                                return label <= activeFilterValue ? index : -1;
                            case 'not contains':
                                if (isNaN(labelNum)) { //.incluses() created an error if label is a number.
                                    return !label.includes(activeFilterValue) ? index : -1;
                                }
                                return index;
                            case 'contains':
                                if (isNaN(labelNum)) { //.incluses() created an error if label is a number.
                                    return label.includes(activeFilterValue) ? index : -1;
                                }
                                return index;
                            case '!=':
                                return label !== activeFilterValue ? index : -1;
                            case '=':
                                return label === activeFilterValue ? index : -1;
                        }

                }));
            }
            activeLabelIndexes = activeLabelIndexes.filter((index) => {
                if (index < 0) {
                    return false;
                } else {
                    if (andFilter) {
                        let count = activeLabelIndexes.reduce(function(n, val) {
                            return n + (val === index);
                        }, 0);
                        return (count === this.filters.length);
                    } else {
                        return true;
                    }
                }
            });
            //change bars to the correct color
            for (let dataset of this.chartInfo.data.datasets) {
                dataset.setAllInactive();
                for (let index = activeLabelIndexes.length - 1; index >= 0; index--) {
                    dataset.setActiveColor(activeLabelIndexes[index]);
                    if (dataset.data[activeLabelIndexes[index]] > 0) {
                        selectedLabels.push(dataset.label);

                    }
                }
            }
        } else {
            // Set all bars active
            for (let dataset of this.activeData) {
                dataset.setAllActive();
            }
        }
        this.selectedLabels = selectedLabels;
        this.subOnResizeStop();
    }

    /**
     * Returns whether the fields for the bar chart are valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        let valid = true;
        valid = (this.options.database && this.options.database.name && valid);
        valid = (this.options.table && this.options.table.name && valid);
        valid = (this.options.dataField && this.options.dataField.columnName && valid);
        valid = (this.options.aggregation && valid);
        if (this.options.aggregation !== 'count') {
            valid = (this.options.aggregationField !== undefined && this.options.aggregationField.columnName !== '' && valid);
            //This would mean though that if the data is just a number being represented by a string, it would simply fail.
            //As opposed to first trying to parse it.
            //This also makes it silently fail, without letting the user know that it failed or why. One could easily change the
            //aggregation type, not notice that the chart didn't change, and
            valid = ((this.options.aggregationField.type !== 'string') && valid);

        }
        return valid;
    }

    /**
     * Creates and returns the query for the bar chart.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let databaseName = this.options.database.name;
        let tableName = this.options.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClauses: neon.query.WherePredicate[] = [];
        whereClauses.push(neon.query.where(this.options.dataField.columnName, '!=', null));
        let yAxisField = this.options.aggregationField.columnName;
        let groupBy: any[] = [this.options.dataField.columnName];

        if (this.options.colorField && this.options.colorField.columnName !== '') {
            whereClauses.push(neon.query.where(this.options.colorField.columnName, '!=', null));
            groupBy.push(this.options.colorField.columnName);
        }

        if (this.hasUnsharedFilter()) {
            // Add the unshared filter
            whereClauses.push(
                neon.query.where(this.options.unsharedFilterField.columnName, '=',
                    this.options.unsharedFilterValue));
        }

        query.where(neon.query.and.apply(query, whereClauses)).groupBy(groupBy);

        switch (this.options.aggregation) {
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

        // This sort is overridden because the response data will be resorted.
        return query.sortBy('value', neonVariables.DESCENDING);
    }

    /**
     * Returns the list of filters for the visualization to ignore.
     *
     * @return {any[]}
     * @override
     */
    getFiltersToIgnore() {
        if (!this.options.ignoreSelf) {
            return null;
        }

        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.dataField.columnName]);

        let ignoredFilterIds = neonFilters.map((neonFilter) => {
            return neonFilter.id;
        });

        return ignoredFilterIds.length ? ignoredFilterIds : null;
    }

    /**
     * Handles the query results for the bar chart and draws the new bar chart.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        this.bars = [];

        // Use our seen values list to create dummy values for every category not returned this time.
        let seenData = [];
        for (let barLabel of this.seenBars) {
            let exists = false;
            for (let item of response.data) {
                if (item[this.options.dataField.columnName] === barLabel) {
                    exists = true;
                }
            }
            if (!exists) {
                let item = {
                    value: 0
                };
                item[this.options.dataField.columnName] = barLabel;
                seenData.push(item);
            }
        }

        // Sort here because neon.query.Query.sortBy does not sort strings like NaN in the response data.
        let data = response.data.concat(seenData).sort((itemA, itemB) => {
            let valueA = (typeof itemA.value === 'number') ? itemA.value : 0;
            let valueB = (typeof itemB.value === 'number') ? itemB.value : 0;
            if (this.options.sortAlphabetically || valueA === valueB) {
                let labelA = itemA[this.options.dataField.columnName];
                let labelB = itemB[this.options.dataField.columnName];
                return (labelA < labelB ? -1 : (labelB < labelA ? 1 : 0));
            }
            return valueB - valueA;
        });

        // Update the bars from the data.
        for (let item of data) {
            let barLabel: string = item[this.options.dataField.columnName];

            if (!barLabel) {
                continue;
            }

            // Add any labels that we haven't seen before to our "seen values" list so we have them for next time.
            if (this.options.saveSeenBars && this.seenBars.indexOf(barLabel) < 0) {
                this.seenBars.push(barLabel);
            }

            if (this.bars.indexOf(barLabel) < 0) {
                this.bars.push(barLabel);
            }
        }

        let groupsToDatasets = new Map<string, BarDataSet>();
        let colorFieldExists = (this.options.colorField && this.options.colorField.columnName !== '');
        // Update the segments and counts from the bars and the data.
        for (let item of data) {
            let barLabel: string = item[this.options.dataField.columnName];

            if (!barLabel) {
                continue;
            }

            // Each barLabel will create a new bar.  Each barSegment will create a new piece of a whole bar.
            let barSegment = colorFieldExists ? (item[this.options.colorField.columnName] || '') : '';

            let barDataset = groupsToDatasets.get(barSegment);

            if (!barDataset) {
                barDataset = new BarDataSet(this.bars.length, barSegment, (colorFieldExists ?
                    this.widgetService.getColor(this.options.database.name, this.options.table.name, this.options.colorField.columnName,
                        barSegment) : this.defaultBarColor),
                    this.defaultHighlightColor);
                groupsToDatasets.set(barSegment, barDataset);
            }

            barDataset.data[this.bars.indexOf(barLabel)] = (typeof item.value === 'number') ? item.value : 0;
        }

        this.activeData = Array.from(groupsToDatasets.values());
        this.page = 1;
        this.lastPage = (this.bars.length <= this.options.limit);

        let counts = !this.activeData.length ? [] : this.activeData.slice(1).reduce((array, dataset) => {
            return dataset.data.map((value, index) => {
                return array[index] + value;
            });
        }, this.activeData[0].data);

        this.labelMax = counts.reduce((a, b) => {
            return Math.max(a, b);
        }, 0);

        // Must change the scale (linear or logarithmic) based on the labelMax.
        this.handleChangeBarChartObject(true);

        if (!this.options.scaleManually) {
            let maxCountLength = ('' + Math.ceil(this.labelMax)).length;
            let stepSize = Math.pow(10, maxCountLength - 1);
            let nextStepSize = Math.pow(10, maxCountLength);
            if (nextStepSize / 2.0 > this.labelMax) {
                stepSize /= 2.0;
            }
            this.labelCount = Math.ceil(this.labelMax / stepSize) + 1;
            if (this.options.type === 'horizontalBar') {
                this.chartModule.chart.config.options.scales.xAxes[0].ticks.min = 0;
                this.chartModule.chart.config.options.scales.xAxes[0].ticks.max = Math.ceil(this.labelMax / stepSize) * stepSize;
                this.chartModule.chart.config.options.scales.xAxes[0].ticks.stepSize = stepSize;
            }
            if (this.options.type === 'bar') {
                this.chartModule.chart.config.options.scales.yAxes[0].ticks.min = 0;
                this.chartModule.chart.config.options.scales.yAxes[0].ticks.max = Math.ceil(this.labelMax / stepSize) * stepSize;
                this.chartModule.chart.config.options.scales.yAxes[0].ticks.stepSize = stepSize;
            }
        }

        this.updateBarChart(0, this.options.limit);
    }

    /**
     * Updates the bar chartInfo with the bars and activeData using the given bar index and bar limit.
     *
     * @arg {number} barIndex
     * @arg {number} barLimit
     */
    updateBarChart(barIndex: number, barLimit: number) {
        let barChartData = new BarData();
        barChartData.labels = this.bars.slice(barIndex, barIndex + barLimit);
        barChartData.datasets = this.activeData.map((wholeDataset) => {
            let limitedDataset = new BarDataSet(barChartData.labels.length, wholeDataset.label, wholeDataset.color,
                wholeDataset.hoverColor);
            limitedDataset.backgroundColor = wholeDataset.backgroundColor.slice(barIndex, barIndex + barLimit);
            limitedDataset.data = wholeDataset.data.slice(barIndex, barIndex + barLimit);
            return limitedDataset;
        });

        // Set this to force the legend to update
        this.colorFieldNames = [this.options.colorField.columnName];

        this.chartInfo.data = barChartData;
        this.refreshVisualization();
    }

    /**
     * If the given item is a number, returns it as a rounded string; otherwise, returns the given item.
     *
     * @arg {object} item
     * @return {string}
     */
    formatNumber(item: any): string {
        if (super.isNumber(item)) {
            //round to at most 3 decimal places, so as to not display tiny floating-point errors
            let output = Math.round((parseFloat(item) + 0.00001) * 1000) / 1000;
            if (output > 999) {
                return super.prettifyInteger(Math.trunc(output));
            }
            return '' + output;
        }
        // can't be converted to a number, so just use it as-is.
        return '' + item;
    }

    /**
     * Updates the bar chart object and redraws the bar chart.
     *
     * @arg {boolean} doNotRefresh
     */
    handleChangeBarChartObject(doNotRefresh?: boolean) {
        if (!this.chartModule.chart) {
            return;
        }

        // Update axis type.
        this.chartInfo.options.scales.xAxes[0].type = (this.options.type === 'horizontalBar' ? (this.options.logScale &&
            this.labelMax > 10 ?  'logarithmic' : 'linear') : 'category');
        this.chartInfo.options.scales.yAxes[0].type = (this.options.type === 'bar' ? (this.options.logScale && this.labelMax > 10 ?
            'logarithmic' : 'linear') : 'category');

        let barData = this.chartInfo.data;
        let barOptions = this.chartInfo.options;

        let ctx = this.chartModule.chart.ctx;

        this.chartModule.chart.destroy();

        let clonedChart = new Chart(ctx, {
            type: this.options.type,
            data: barData,
            options: barOptions
        });

        this.chartInfo = {
            type: this.options.type,
            data: barData,
            options: barOptions
        };
        this.chartModule.chart = clonedChart;

        this.handleChangeScale(doNotRefresh);

        if (!doNotRefresh) {
            this.refreshVisualization();
        }

    }

    setGraphMaximum(newMax) {
        if (this.chartModule.chart.config.type === 'bar') {
            this.chartModule.chart.config.options.scales.yAxes[0].ticks.max = newMax;
        } else if ('horizontalBar') {
            this.chartModule.chart.config.options.scales.xAxes[0].ticks.max = newMax;
        }
    }

    setGraphMinimum(newMin) {
        if (this.chartModule.chart.config.type === 'bar') {
            this.chartModule.chart.config.options.scales.yAxes[0].ticks.min = newMin;
        } else if ('horizontalBar') {
            this.chartModule.chart.config.options.scales.xAxes[0].ticks.min = newMin;
        }
    }

    /**
     * Updates the graph scale and reruns the bar chart query.
     *
     * @arg {boolean} doNotQuery
     */
    handleChangeScale(doNotQuery?: boolean) {
        if (this.options.scaleManually) {
            if (this.options.scaleMax === '' || isNaN(Number(this.options.scaleMax))) {
                this.setGraphMaximum(undefined); // not usable input, so default to automatic scaling
            } else {
                this.setGraphMaximum(Number(this.options.scaleMax));
            }

            if (this.options.scaleMin === '' || isNaN(Number(this.options.scaleMin))) {
                this.setGraphMinimum(undefined); // not usable input, so default to automatic scaling
            } else {
                this.setGraphMinimum(Number(this.options.scaleMin));
            }
        }

        if (!doNotQuery) {
            this.logChangeAndStartQueryChain();
        }
    }

    /**
     * Creates filters on init if needed.
     *
     * @override
     */
    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.dataField.columnName]);
        this.filters = [];

        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.options.findField(neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                let operator = neonFilter.filter.whereClause.operator;
                let filter = {
                    id: neonFilter.id,
                    field: field.columnName,
                    value: value,
                    prettyField: field.prettyName,
                    operator: operator
                };
                if (this.filterIsUnique(filter)) {
                    this.addLocalFilter(filter);
                }
            } else {
                for (let clause of neonFilter.filter.whereClause.whereClauses) {
                    let field = this.options.findField(clause.lhs);
                    let value = clause.rhs;
                    let operator = clause.operator;
                    let filter = {
                        id: neonFilter.id,
                        field: field.columnName,
                        value: value,
                        prettyField: field.prettyName,
                        operator: operator
                    };
                    if (this.filterIsUnique(filter)) {
                        this.addLocalFilter(filter);
                    }
                }
            }
        }
    }

    /**
     * Updates properties and/or sub-components whenever the limit is changed and reruns the visualization query.
     *
     * @override
     */
    subHandleChangeLimit() {
        this.seenBars = [];
        this.logChangeAndStartQueryChain();
    }

    /**
     * Updates properties and/or sub-components whenever a config option is changed and reruns the visualization query.
     *
     * @override
     */
    handleChangeData() {
        this.seenBars = [];
        super.handleChangeData();
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        if (!this.bars || !this.bars.length) {
            return 'No Data';
        }
        if (this.bars.length <= this.options.limit) {
            return 'Total ' + super.prettifyInteger(this.bars.length);
        }
        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1);
        let end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.bars.length));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.bars.length);
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters() {
        return this.filters;
    }

    //Would love to refactor this but cannot because it's called in base neon.
    /**
     * Removes the given filter object from this bar chart component.
     *
     * @arg {object} filter
     * @override
     */
    removeFilter(filter: any) {
        for (let index = this.filters.length - 1; index >= 0; index--) {
            if (this.filters[index].id === filter.id) {
                this.filters.splice(index, 1);
            }
        }
    }

    /**
     * Increases the page and updates the bar chart data.
     */
    nextPage() {
        if (!this.lastPage) {
            this.page++;
            this.updatePageData();
        }
    }

    /**
     * Decreases the page and updates the bar chart data.
     */
    previousPage() {
        if (this.page !== 1) {
            this.page--;
            this.updatePageData();
        }
    }

    /**
     * Updates lastPage and the bar chart data using the page and limit.
     */
    updatePageData() {
        let offset = (this.page - 1) * this.options.limit;
        this.lastPage = (this.bars.length <= (offset + this.options.limit));
        this.updateBarChart(offset, this.options.limit);
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
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
     * Resizes the bar chart.
     *
     * @override
     */
    subOnResizeStop() {
        let xLabelCount = (this.options.type === 'bar' ? Math.min(this.bars.length, this.options.limit) : this.labelCount);
        let yLabelCount = (this.options.type === 'bar' ? this.labelCount : Math.min(this.bars.length, this.options.limit));

        this.minSize = {
            // The height of the y-axis labels is approx. 15 px each and the height of the x-axis labels is approx. 20 px (arbitrary).
            height: yLabelCount * 15 + 20,
            // The width of the x-axis labels is minimum 25 px each and the width of the y-axis labels is 40 px (arbitrary).
            width: xLabelCount * 25 + 40
        };

        this.chartModule.chart.update();
    }
}
