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
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ChartComponent } from '../chart/chart.component';
import { Chart } from 'chart.js';
import { VisualizationService } from '../../services/visualization.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';

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
    // The name of the data set
    label: string;
    // The data
    data: number[] = [];
    // The colors of the bars.
    backgroundColor: string[] = [];
    // The color of the data set
    color: Color;

    constructor(length?: number, color?: Color) {
        if (length) {
            for (let i = 0; i < length; i++) {
                this.data[i] = 0;
            }
        }
        this.color = color;
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

    @ViewChild('myChart') chartModule: ChartComponent;
    @ViewChild('hiddenCanvas') hiddenCanvas: ElementRef;

    private filters: {
        id: string,
        key: string,
        value: string,
        prettyKey: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        aggregation: string,
        aggregationField: string,
        unsharedFilterField: any,
        unsharedFilterValue: string,
        colorField: string,
        limit: number,
        chartType: string // bar or horizontalBar
    };

    public active: {
        dataField: FieldMetaData,
        colorField: FieldMetaData,
        aggregationField: FieldMetaData,
        aggregationFieldHidden: boolean,
        andFilters: boolean,
        limit: number,
        newLimit: number,
        page: number,
        lastPage: boolean,
        filterable: boolean,
        layers: any[],
        data: any[],
        aggregation: string,
        chartType: string,
        maxCount: number,
        minScale: string,
        maxScale: string,
        scaleManually: boolean,
        bars: string[],
        seenBars: string[]
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
    private defaultActiveColor;

    constructor(activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService,
        private colorSchemeService: ColorSchemeService) {

        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);

        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            aggregation: this.injector.get('aggregation', null),
            aggregationField: this.injector.get('aggregationField', null),
            colorField: this.injector.get('colorField', null),
            limit: this.injector.get('limit', 10),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            chartType: this.injector.get('chartType', 'bar')
        };
        this.filters = [];
        this.active = {
            dataField: new FieldMetaData(),
            colorField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            newLimit: this.optionsFromConfig.limit,
            page: 1,
            lastPage: true,
            filterable: true,
            layers: [],
            data: [],
            aggregation: 'count',
            chartType: this.optionsFromConfig.chartType || 'horizontalBar',
            maxCount: 0,
            minScale: undefined,
            maxScale: undefined,
            scaleManually: false,
            bars: [],
            seenBars: []
        };

        this.onClick = this.onClick.bind(this);

        // Margin for the y-axis labels.
        let LABELS_MARGIN = 20;
        // Percentage of the chart for the y-axis labels specified by the UX team.
        let LABELS_PERCENTAGE = 0.2;
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
            let yLabels: any[] = (this.active.chartType === 'bar' ? [this.active.maxCount] : this.active.bars);
            let yLabelWidth = yLabels.reduce((max, yLabel) => {
                return Math.max(max, calculateTextWidth(yLabel));
            }, 0);
            return yLabelWidth;
        };

        let resizeXLabel = (scaleInstance) => {
            // Set the left padding to equal the Y label width plus the margin.  Set the X label width accordingly.
            let yLabelMaxWidth = Math.floor(LABELS_PERCENTAGE * this.chartModule.getNativeElement().clientWidth);
            scaleInstance.paddingLeft = Math.min(yLabelMaxWidth, calculateYLabelWidth()) + LABELS_MARGIN;
            scaleInstance.paddingRight = 10;
            scaleInstance.width = this.chartModule.getNativeElement().clientWidth - scaleInstance.paddingLeft - scaleInstance.paddingRight;
        };

        let resizeYLabel = (scaleInstance) => {
            // Set the Y label width to either its minimum needed width or a percentage of the chart width (whatever is lower).
            let yLabelMaxWidth = Math.floor(LABELS_PERCENTAGE * this.chartModule.getNativeElement().clientWidth);
            scaleInstance.width = Math.min(yLabelMaxWidth, calculateYLabelWidth());
        };

        let truncateText = (containerWidth, text, suffix = '') => {
            // Format number strings first.
            let formatted = this.formatNumber(text);
            // Subtract three characters for the ellipsis.
            let truncated = ('' + text).substring(0, ('' + text).length - 3);
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
            let containerWidth = Math.floor(this.chartModule.getNativeElement().clientWidth / this.chartInfo.data.labels.length);
            return truncateText(containerWidth, text);
        };

        let truncateYLabelText = (text) => {
            let containerWidth = Math.floor(LABELS_PERCENTAGE * this.chartModule.getNativeElement().clientWidth - LABELS_MARGIN);
            return truncateText(containerWidth, text);
        };

        let truncateTooltipLabelText = (text, suffix = '') => {
            let containerWidth = this.chartModule.getNativeElement().clientWidth - TOOLTIPS_MARGIN;
            return truncateText(containerWidth, text, suffix);
        };

        this.chartInfo = {
            type: this.active.chartType,
            data: {
                labels: [],
                datasets: [new BarDataSet(0, this.defaultActiveColor)]
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
            this.chartModule.chart.tooltip._lastActive = [];

            let count = tooltipList.reduce((sum, tooltipItem) => {
                let dataset = data.datasets[tooltipItem.datasetIndex];
                return sum + dataset.data[tooltipItem.index];
            }, 0);
            return [
                truncateTooltipLabelText(data.labels[tooltipList[0].index]),
                this.active.aggregation + ': ' + this.formatNumber(count)
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
        this.handleChangeChartType();

        this.defaultActiveColor = this.getPrimaryThemeColor();
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
     * Sets the properties in the given bindings for the bar chart.
     *
     * @arg {any} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.dataField = this.active.dataField.columnName;
        bindings.aggregation = this.active.aggregation;
        bindings.aggregationField = this.active.aggregationField.columnName;
        bindings.limit = this.active.limit;
    }

    /**
     * Returns the bar chart export fields.
     *
     * @return {array}
     * @override
     */
    getExportFields(): any[] {
        let valuePrettyName = this.active.aggregation +
            (this.active.aggregationFieldHidden ? '' : '-' + this.active.aggregationField.prettyName);
        valuePrettyName = valuePrettyName.charAt(0).toUpperCase() + valuePrettyName.slice(1);
        return [{
            columnName: this.active.dataField.columnName,
            prettyName: this.active.dataField.prettyName
        }, {
            columnName: 'value',
            prettyName: valuePrettyName
        }];
    }

    /**
     * Returns the option for the given property from the bar chart config.
     *
     * @arg {string} option
     * @return {any}
     * @override
     */
    getOptionFromConfig(option: string): any {
        return this.optionsFromConfig[option];
    }

    /**
     * Adds, replaces, or removes filters using the bar chart data in the given elements.
     *
     * @arg {any} _event
     * @arg {array} elements
     */
    onClick(_event: any, elements: any[]) {
        if (elements.length) {
            let value = elements[0]._model.label;
            let key = this.active.dataField.columnName;
            let prettyKey = this.active.dataField.prettyName;
            let filter = {
                id: undefined,
                key: key,
                value: value,
                prettyKey: prettyKey
            };
            if (_event.ctrlKey || _event.metaKey) { // If Ctrl (or Command on Mac) is pressed...
                if (this.filterIsUnique(filter)) {
                    this.addLocalFilter(filter);
                    let whereClause = neon.query.where(filter.key, '=', filter.value);
                    this.addNeonFilter(true, filter, whereClause);
                } else {
                    for (let existingFilter of this.filters) {
                        if (existingFilter.key === filter.key && existingFilter.value === filter.value) {
                            this.removeLocalFilterFromLocalAndNeon(existingFilter, true, true);
                            break;
                        }
                    }
                }
            } else { // If Ctrl isn't pressed...
                if (this.filters.length === 0) {
                    this.addLocalFilter(filter);
                    this.addNeonFilter(true, filter);
                } else if (this.filters.length === 1 && this.filterIsUnique(filter)) {
                    filter.id = this.filters[0].id;
                    this.filters[0] = filter;
                    this.replaceNeonFilter(true, filter);
                } else {
                    // Use concat to copy the list of filters.
                    this.removeAllFilters([].concat(this.filters), () => {
                        this.addLocalFilter(filter);
                        this.addNeonFilter(true, filter);
                    });
                }
            }

            this.refreshVisualization();
        }
    }

    /**
     * Updates the fields for the bar chart.
     *
     * @override
     */
    onUpdateFields() {
        if (this.optionsFromConfig.aggregation) {
            this.active.aggregation = this.optionsFromConfig.aggregation;
        }
        this.active.aggregationField = this.findFieldObject('aggregationField');
        this.active.dataField = this.findFieldObject('dataField');
        this.active.colorField = this.findFieldObject('colorField');
    }

    /**
     * Adds the given filter object to the bar chart's list of filter objects.
     *
     * @arg {object} filter
     */
    addLocalFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        }).map((existingFilter) => {
            return existingFilter;
        }).concat([filter]);
    }

    /**
     * Returns true if the given filter object does not match any filter in the list of bar chart component filter objects.
     *
     * @arg {any} filter
     * @return {boolean}
     */
    filterIsUnique(filter: any): boolean {
        for (let existingFilter of this.filters) {
            if (existingFilter.value === filter.value && existingFilter.key === filter.key) {
                return false;
            }
        }
        return true;
    }

    /**
     * Creates and returns the neon filter clause object using the given database, table, and data field names.
     *
     * @arg {string} database
     * @arg {string} table
     * @arg {string} fieldName
     * @return {object}
     * @override
     */
    createNeonFilterClauseEquals(database: string, table: string, fieldName: string): object {
        let filterClauses = this.filters.map((filter) => {
            return neon.query.where(fieldName, '=', filter.value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.active.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    }

    /**
     * Returns the list of filter fields for the bar chart.
     *
     * @return {array}
     * @override
     */
    getNeonFilterFields(): string[] {
        return [this.active.dataField.columnName];
    }

    /**
     * Returns the bar chart's visualization name.
     *
     * @return {string}
     * @override
     */
    getVisualizationName(): string {
        return 'Bar Chart';
    }

    /**
     * Returns the bar chart filter text using the given filter object.
     *
     * @arg {any} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        return filter.value;
    }

    /**
     * Updates the bar colors and legend and refreshes the bar chart.
     */
    refreshVisualization() {
        let selectedLabels: string[] = [];
        if (this.filters.length >= 1) {
            let activeFilterValues = this.filters.map((el) => el.value);
            let activeLabelIndexes = this.chartInfo.data.labels.map((label, index) => {
                return (activeFilterValues.indexOf(label) >= 0 ? index : -1);
            }).filter((index) => {
                return index >= 0;
            });

            for (let dataset of this.chartInfo.data.datasets) {
                dataset.setAllInactive();
                for (let index = activeLabelIndexes.length - 1; index >= 0; index--) {
                    dataset.setActiveColor(activeLabelIndexes[index]);
                }
                for (let index = activeLabelIndexes.length - 1; index >= 0; index--) {
                    if (dataset.data[activeLabelIndexes[index]] > 0) {
                        selectedLabels.push(dataset.label);
                        continue;
                    }
                }
            }
        } else {
            // Set all bars active
            for (let dataset of this.active.data) {
                dataset.setAllActive();
            }
        }

        this.selectedLabels = selectedLabels;
        this.chartModule.chart.update();
    }

    /**
     * Returns whether the fields for the bar chart are valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        let valid = true;
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
    }

    /**
     * Creates and returns the query for the bar chart.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClauses: neon.query.WherePredicate[] = [];
        whereClauses.push(neon.query.where(this.active.dataField.columnName, '!=', null));
        let yAxisField = this.active.aggregationField.columnName;
        let groupBy: any[] = [this.active.dataField.columnName];

        if (this.active.colorField && this.active.colorField.columnName !== '') {
            whereClauses.push(neon.query.where(this.active.colorField.columnName, '!=', null));
            groupBy.push(this.active.colorField.columnName);
        }

        if (this.hasUnsharedFilter()) {
            // Add the unshared filter
            whereClauses.push(
                neon.query.where(this.meta.unsharedFilterField.columnName, '=',
                    this.meta.unsharedFilterValue));
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
    }

    /**
     * Returns the list of filters for the bar chart to ignore.
     *
     * @return {any}
     * @override
     */
    getFiltersToIgnore() {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = this.getNeonFilterFields();
        // get relevant neon filters and check for filters that should be ignored and add that to query
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters.length > 0) {
            let ignoredFilterIds = [];
            for (let neonFilter of neonFilters) {
                if (!neonFilter.filter.whereClause.whereClauses) {
                    ignoredFilterIds.push(neonFilter.id);
                }
            }
            return ignoredFilterIds;
        }
        return null;
    }

    /**
     * Handles the query results for the bar chart and draws the new bar chart.
     */
    onQuerySuccess(response: any) {
        this.active.bars = [];

        // Use our seen values list to create dummy values for every category not returned this time.
        let seenData = [];
        for (let barLabel of this.active.seenBars) {
            let exists = false;
            for (let item of response.data) {
                if (item[this.active.dataField.columnName] === barLabel) {
                    exists = true;
                }
            }
            if (!exists) {
                let item = {
                    value: 0
                };
                item[this.active.dataField.columnName] = barLabel;
                seenData.push(item);
            }
        }
        let data = response.data.concat(seenData);

        // Update the bars from the data.
        for (let item of data) {
            let barLabel: string = item[this.active.dataField.columnName];

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

        let groupsToDatasets = new Map<string, BarDataSet>();
        let colorFieldExists = (this.active.colorField && this.active.colorField.columnName !== '');

        // Update the segments and counts from the bars and the data.
        for (let item of data) {
            let barLabel: string = item[this.active.dataField.columnName];

            if (!barLabel) {
                continue;
            }

            // Each barLabel will create a new bar.  Each barSegment will create a new piece of a whole bar.
            let barSegment = colorFieldExists ? (item[this.active.colorField.columnName] || '') : '';

            let barDataset = groupsToDatasets.get(barSegment);

            if (!barDataset) {
                barDataset = new BarDataSet(this.active.bars.length);
                barDataset.label = barSegment;
                barDataset.color = colorFieldExists ? this.colorSchemeService.getColorFor(this.active.colorField.columnName, barSegment) :
                    this.defaultActiveColor;
                barDataset.backgroundColor = this.active.bars.map((bar) => {
                    return barDataset.color.toRgb();
                });
                groupsToDatasets.set(barSegment, barDataset);
            }

            barDataset.data[this.active.bars.indexOf(barLabel)] = item.value;
        }

        this.active.data = Array.from(groupsToDatasets.values());
        this.active.page = 1;
        this.active.lastPage = (this.active.bars.length <= this.active.limit);

        let counts = !this.active.data.length ? [] : this.active.data.slice(1).reduce((array, dataset) => {
            return dataset.data.map((value, index) => {
                return array[index] + value;
            });
        }, this.active.data[0].data);

        this.active.maxCount = counts.reduce((a, b) => {
            return Math.max(a, b);
        }) || 0;

        if (!this.active.scaleManually) {
            let maxCountLength = ('' + Math.ceil(this.active.maxCount)).length;
            let stepSize = Math.pow(10, maxCountLength - 1);
            let nextStepSize = Math.pow(10, maxCountLength);
            if (nextStepSize / 2.0 > this.active.maxCount) {
                stepSize /= 2.0;
            }
            if (this.active.chartType === 'horizontalBar') {
                this.chartModule.chart.config.options.scales.xAxes[0].ticks.min = 0;
                this.chartModule.chart.config.options.scales.xAxes[0].ticks.max = Math.ceil(this.active.maxCount / stepSize) * stepSize;
                this.chartModule.chart.config.options.scales.xAxes[0].ticks.stepSize = stepSize;
            }
            if (this.active.chartType === 'bar') {
                this.chartModule.chart.config.options.scales.yAxes[0].ticks.min = 0;
                this.chartModule.chart.config.options.scales.yAxes[0].ticks.max = Math.ceil(this.active.maxCount / stepSize) * stepSize;
                this.chartModule.chart.config.options.scales.yAxes[0].ticks.stepSize = stepSize;
            }
        }

        this.updateBarChart(0, this.active.limit);
    }

    /**
     * Updates the bar chartInfo with the active.bars and active.data using the given bar index and bar limit.
     *
     * @arg {number} barIndex
     * @arg {number} barLimit
     */
    updateBarChart(barIndex: number, barLimit: number) {
        let barChartData = new BarData();
        barChartData.labels = this.active.bars.slice(barIndex, barIndex + barLimit);
        barChartData.datasets = this.active.data.map((wholeDataset) => {
            let limitedDataset = new BarDataSet(barChartData.labels.length);
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
    }

    /**
     * If the given item is a number, returns it as a rounded string; otherwise, returns the given item.
     *
     * @arg {any} item
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
     * Updates the aggregation type and reruns the bar chart query.
     */
    handleChangeAggregation() {
        this.active.aggregationFieldHidden = (this.active.aggregation === 'count');
        this.executeQueryChain();
    }

    /**
     * Updates the bar chart type and redraws the bar chart.
     */
    handleChangeChartType() {
        if (!this.chartModule.chart) {
            return;
        }

        let barData = this.chartInfo.data;
        let barOptions = this.chartInfo.options;

        let ctx = this.chartModule.chart.ctx;

        this.chartModule.chart.destroy();

        let clonedChart = new Chart(ctx, {
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
     */
    handleChangeScale() {
        if (this.active.scaleManually) {
            if (this.active.maxScale === undefined
                || this.active.maxScale === ''
                || isNaN(Number(this.active.maxScale))) {
                this.setGraphMaximum(undefined); // not usable input, so default to automatic scaling
            } else {
                this.setGraphMaximum(Number(this.active.maxScale));
            }

            if (this.active.minScale === undefined
                || this.active.minScale === ''
                || isNaN(Number(this.active.minScale))) {
                this.setGraphMinimum(undefined); // not usable input, so default to automatic scaling
            } else {
                this.setGraphMinimum(Number(this.active.minScale));
            }
        }

        this.logChangeAndStartQueryChain();
    }

    /**
     * Creates filters on init if needed.
     *
     * @override
     */
    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.dataField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        this.filters = [];
        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let key = neonFilter.filter.whereClause.lhs;
                let value = neonFilter.filter.whereClause.rhs;
                let filter = {
                    id: neonFilter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                };
                if (this.filterIsUnique(filter)) {
                    this.addLocalFilter(filter);
                }
            }
        }
    }

    /**
     * Updates the limit, resets the seen bars, and reruns the bar chart query.
     */
    handleChangeLimit() {
        if (super.isNumber(this.active.newLimit)) {
            let newLimit = parseFloat('' + this.active.newLimit);
            if (newLimit > 0) {
                this.active.limit = newLimit;
                this.active.seenBars = [];
                this.logChangeAndStartQueryChain();
            } else {
                this.active.newLimit = this.active.limit;
            }
        } else {
            this.active.newLimit = this.active.limit;
        }
    }

    /**
     * Resets the seen bars and reruns the bar chart query.
     */
    handleChangeDataInBarChart() {
        this.active.seenBars = [];
        this.logChangeAndStartQueryChain();
    }

    /**
     * Reruns the bar chart query.
     */
    unsharedFilterChanged() {
        // Update the data
        this.executeQueryChain();
    }

    /**
     * Reruns the bar chart query.
     */
    unsharedFilterRemoved() {
        // Update the data
        this.executeQueryChain();
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        if (!this.active.bars || !this.active.bars.length) {
            return 'No Data';
        }
        if (this.active.bars.length <= this.active.limit) {
            return 'Total ' + super.prettifyInteger(this.active.bars.length);
        }
        let begin = super.prettifyInteger((this.active.page - 1) * this.active.limit + 1);
        let end = super.prettifyInteger(Math.min(this.active.page * this.active.limit, this.active.bars.length));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.active.bars.length);
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     */
    getCloseableFilters() {
        return this.filters;
    }

    /**
     * Returns the bar chart filter tooltip title text using the given filter value.
     *
     * @arg {string} value
     * @return {string}
     */
    getFilterTitle(value: string) {
        return this.active.dataField.columnName + ' = ' + value;
    }

    /**
     * Returns the bar chart filter text using the given filter value.
     *
     * @arg {string} value
     * @return {string}
     */
    getFilterCloseText(value: string): string {
        return value;
    }

    /**
     * Returns the bar chart remove button tooltip title text using the given filter value.
     *
     * @arg {string} value
     * @return {string}
     */
    getRemoveFilterTooltip(value: string): string {
        return 'Delete Filter ' + this.getFilterTitle(value);
    }

    //Would love to refactor this but cannot because it's called in base neon.
    /**
     * Removes the given filter object from this bar chart component.
     *
     * @arg {any} filter
     */
    removeFilter(filter: any) {
        for (let index = this.filters.length - 1; index >= 0; index--) {
            if (this.filters[index].id === filter.id) {
                this.filters.splice(index, 1);
            }
        }
    }

    /**
     * Removes all filters from this bar chart component and neon, optionally requerying and/or refreshing.
     *
     * @arg {array} filters
     * @arg {function} callback
     */
    removeAllFilters(filters: any[], callback?: Function) {
        if (!filters.length) {
            if (callback) {
                callback();
            }
            return;
        }

        this.removeLocalFilterFromLocalAndNeon(filters[0], false, false, () => {
            this.removeAllFilters(filters.slice(1), callback);
        });
    }

    /**
     * Increases the page and updates the bar chart data.
     */
    nextPage() {
        if (!this.active.lastPage) {
            this.active.page++;
            this.updatePageData();
        }
    }

    /**
     * Decreases the page and updates the bar chart data.
     */
    previousPage() {
        if (this.active.page !== 1) {
            this.active.page--;
            this.updatePageData();
        }
    }

    /**
     * Updates lastPage and the bar chart data using the page and limit.
     */
    updatePageData() {
        let offset = (this.active.page - 1) * this.active.limit;
        this.active.lastPage = (this.active.bars.length <= (offset + this.active.limit));
        this.updateBarChart(offset, this.active.limit);
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

    hasColorField() {
        return !!this.active.colorField.columnName;
    }
}
