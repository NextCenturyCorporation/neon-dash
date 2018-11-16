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
import { FieldMetaData } from '../../dataset';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';

/**
 * Data used to draw the scatter plot
 */
class ScatterPlotData {
    xLabels: any[] = [];
    yLabels: any[] = [];
    labels: any[] = [];
    // The data to graph
    datasets: ScatterDataSet[] = [];
}

/**
 * One set of bars to draw
 */
class ScatterDataSet {
    fill: boolean = false;
    showLine: boolean = false;
    borderWidth: number = 1;

    // The name of the data set
    label: string;
    // The data
    data: {x: any, y: any}[] = [];

    // The colors of the points
    backgroundColor: string;
    borderColor: string;

    // The color of the data set
    color: Color;

    constructor(color: Color) {
        this.color = color;
        this.setActive();
    }

    /**
     * Set the background color to the default color of this set
     */
    setInactive() {
        for (let item of this.data) {
            this.backgroundColor = this.color.getInactiveRgba();
            this.borderColor = this.backgroundColor;
        }
    }

    /**
     * Set the background color of the set to the active color
     */
    setActive() {
        this.backgroundColor = this.color.toRgb();
        this.borderColor = this.backgroundColor;
    }
}

/**
 * Manages configurable options for the specific visualization.
 */
export class ScatterPlotOptions extends BaseNeonOptions {
    public colorField: FieldMetaData;
    public displayGridLines: boolean;
    public displayTicks: boolean;
    public labelField: FieldMetaData;
    public xField: FieldMetaData;
    public yField: FieldMetaData;

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        bindings.displayGridLines = this.displayGridLines;
        bindings.displayTicks = this.displayTicks;

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
            'colorField',
            'labelField',
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
        this.displayGridLines = this.injector.get('displayGridLines', true);
        this.displayTicks = this.injector.get('displayTicks', true);
    }
}

@Component({
    selector: 'app-scatter-plot',
    templateUrl: './scatter-plot.component.html',
    styleUrls: ['./scatter-plot.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScatterPlotComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('scatter') chartModule: ChartComponent;
    @ViewChild('filterContainer') filterContainer: ElementRef;
    @ViewChild('chartContainer') chartContainer: ElementRef;

    public filters: ScatterPlotFilter[] = [];

    public options: ScatterPlotOptions;

    public selection: {
        mouseDown: boolean
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        height: number,
        width: number,
        x: number,
        y: number,
        visibleOverlay: boolean
    } = {
        mouseDown: false,
        height: 20,
        width: 20,
        x: 20,
        y: 200,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        visibleOverlay: false
    };

    public chart: {
        data: ScatterPlotData,
        type: string,
        options: any
    };

    public colorKeys: string[] = [];
    public defaultActiveColor;
    public displayGridLines: boolean;
    public displayTicks: boolean;
    public disabledDatasets: Map<string, any> = new Map<string, any>();
    public disabledList: string[] = [];
    public mouseEventValid: boolean = false;
    public pointLabels: string[] = [];
    public selectionOffset = {
        x: 0,
        y: 0
    };
    public xAxisIsNumeric: boolean = true;
    public yAxisIsNumeric: boolean = true;

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        protected widgetService: AbstractWidgetService,
        ref: ChangeDetectorRef
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            ref
        );

        console.warn('The scatter-plot component is deprecated.  Please use the aggregation component with type=scatter-xy.');

        this.options = new ScatterPlotOptions(this.injector, this.datasetService, 'Scatter Plot', 1000);

        this.onHover = this.onHover.bind(this);
        this.xAxisTickCallback = this.xAxisTickCallback.bind(this);
        this.yAxisTickCallback = this.yAxisTickCallback.bind(this);

        let tooltipTitleFunc = (tooltips) => {
            return this.pointLabels[tooltips[0].index];
        };

        let tooltipDataFunc = (tooltips) => {
            let dataPoint = this.chart.data.datasets[tooltips.datasetIndex].data[tooltips.index];
            let xLabel;
            let yLabel;
            if (this.xAxisIsNumeric) {
                xLabel = dataPoint.x;
            } else {
                xLabel = this.chart.data.xLabels[dataPoint.x];
            }
            if (this.yAxisIsNumeric) {
                yLabel = dataPoint.y;
            } else {
                yLabel = this.chart.data.yLabels[dataPoint.y];
            }
            return this.options.xField.prettyName + ': ' + xLabel + '  ' + this.options.yField.prettyName + ': ' + yLabel;
        };

        this.chart = {
            type: 'scatter',
            data: new ScatterPlotData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                animation: {
                  duration: 0 // general animation time
                },
                hover: {
                    mode: 'point',
                    intersect: false,
                    onHover: this.onHover
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            display: this.displayGridLines
                        },
                        ticks: {
                            display: this.displayTicks,
                            callback: this.xAxisTickCallback
                        },
                        position: 'bottom',
                        type: 'linear'
                    }],
                    yAxes: [{
                        gridLines: {
                            display: this.displayGridLines
                        },
                        ticks: {
                            display: this.displayTicks,
                            callback: this.yAxisTickCallback
                        },
                        type: 'linear'
                    }]
                },
                tooltips: {
                    callbacks: {
                        title: tooltipTitleFunc.bind(this),
                        label: tooltipDataFunc.bind(this)
                    }
                }
            }
        };
    }

    /**
     * Returns the chart in the chart module.
     *
     * @return {object}
     * @private
     */
    private getChart() {
        /* tslint:disable:no-string-literal */
        return this.chartModule['chart'];
        /* tslint:enable:no-string-literal */
    }

    subNgOnInit() {
        // do nothing
    }

    postInit() {
        this.executeQueryChain();

        this.defaultActiveColor = this.getPrimaryThemeColor();

        this.chart.data.datasets.push(new ScatterDataSet(this.defaultActiveColor));

        this.selectionOffset.y = this.filterContainer.nativeElement.scrollHeight;
        this.selectionOffset.x = Number.parseInt(this.getComputedStyle(this.chartContainer.nativeElement).paddingLeft || '0');
    }

    subNgOnDestroy() {
        this.getChart().destroy();
    }

    createFilter(key, startDate, endDate) {
        return {
            key: key,
            startDate: startDate,
            endDate: endDate
        };
    }

    addLocalFilter(filter) {
        this.filters[0] = filter;
    }

    forcePosInsideChart(pos, min, max) {
        return pos < min ? min : (pos > max ? max : pos);
    }

    legendItemSelected(data: any): void {
        let key = data.value;

        // Chartjs only seem to update if the entire data object was changed
        // Create a copy of the data object to set at the end
        let chartData: ScatterPlotData = {
            xLabels: this.chart.data.xLabels,
            yLabels: this.chart.data.yLabels,
            labels: this.chart.data.labels,
            datasets: this.chart.data.datasets
        };

        if (data.currentlyActive) {
            let updatedDatasets = [];
            // Search for the dataset and move it to the disabled map
            for (let dataset of chartData.datasets) {
                if (dataset.label === key) {
                    this.disabledDatasets.set(key, dataset);
                } else {
                    updatedDatasets.push(dataset);
                }
            }
            // Put something in the disabled dataset map, so the value will be marked as disabled
            if (!this.disabledDatasets.get(key)) {
                this.disabledDatasets.set(key, null);
            }
            chartData.datasets = updatedDatasets;
        } else {
            // Check the disabled map and move it back to the normal data
            let dataset = this.disabledDatasets.get(key);
            if (dataset) {
                chartData.datasets.push(dataset);
            }
            // Make sure to remove the key frm the map
            this.disabledDatasets.delete(key);
        }

        // Update the display
        this.chart.data = chartData;
        this.refreshVisualization();
        this.disabledList = Array.from(this.disabledDatasets.keys());
    }

    mouseLeave(event) {
        this.mouseEventValid = false;
        this.selection.mouseDown = false;
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
    }

    mouseDown(event) {
        if (event.buttons > 0) {
            this.mouseEventValid = true;
        }
    }

    mouseUp(event) {
        if (this.selection.mouseDown && event.buttons === 0) {
            // mouse up event
            this.selection.mouseDown = false;
            if (this.mouseEventValid) {
                let filter = this.getFilterFromSelectionPositions();
                if (this.filters.length > 0) {
                    filter.id = this.filters[0].id;
                }
                this.addLocalFilter(filter);
                if (filter.id) {
                    this.replaceNeonFilter(true, filter, this.createNeonFilter(filter));
                } else {
                    this.addNeonFilter(true, filter, this.createNeonFilter(filter));
                }
            }
        }
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
        if (event.buttons === 0) {
            this.mouseEventValid = false;
        }
    }

    onHover(event) {
        let chartArea = this.getChart().chartArea;
        let chartXPos = event.offsetX;
        let chartYPos = event.offsetY;
        if (!this.selection.mouseDown && event.buttons > 0 && this.mouseEventValid) {
            // mouse down event
            this.selection.mouseDown = true;
            this.selection.startX = this.forcePosInsideChart(chartXPos, chartArea.left, chartArea.right);
            this.selection.startY = this.forcePosInsideChart(chartYPos, chartArea.top, chartArea.bottom);
        }

        if (this.selection.mouseDown && this.mouseEventValid) {
            // drag event near items
            this.selection.endX = this.forcePosInsideChart(chartXPos, chartArea.left, chartArea.right);
            this.selection.endY = this.forcePosInsideChart(chartYPos, chartArea.top, chartArea.bottom);
            this.selection.x = Math.min(this.selection.startX, this.selection.endX);
            this.selection.y = Math.min(this.selection.startY, this.selection.endY);
            this.selection.width = Math.abs(this.selection.startX - this.selection.endX);
            this.selection.height = Math.abs(this.selection.startY - this.selection.endY);
        }
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
    }

    getFilterFromSelectionPositions() {
        let chart = this.getChart();
        let x1 = chart.scales['x-axis-1'].getValueForPixel(this.selection.startX);
        let y1 = chart.scales['y-axis-1'].getValueForPixel(this.selection.startY);
        let x2 = chart.scales['x-axis-1'].getValueForPixel(this.selection.endX);
        let y2 = chart.scales['y-axis-1'].getValueForPixel(this.selection.endY);
        let temp = Math.max(x1, x2);
        x1 = Math.min(x1, x2);
        x2 = temp;
        temp = Math.max(y1, y2);
        y1 = Math.min(y1, y2);
        y2 = temp;
        if (!this.xAxisIsNumeric) {
            let i = Math.ceil(x1);
            x1 = this.chart.data.xLabels[i];
            i = Math.floor(x2);
            x2 = this.chart.data.xLabels[i];
        }
        if (!this.yAxisIsNumeric) {
            let i = Math.ceil(y1);
            y1 = this.chart.data.yLabels[i];
            i = Math.floor(y2);
            y2 = this.chart.data.yLabels[i];
        }
        return {
            xMin: x1,
            xMax: x2,
            yMin: y1,
            yMax: y2,
            xField: this.options.xField.columnName,
            yField: this.options.yField.columnName,
            xPrettyField: this.options.xField.prettyName,
            yPrettyField: this.options.yField.prettyName,
            id: undefined
        };
    }

    /**
     * Creates and returns the neon filter object using the given timeline filter object.
     *
     * @arg {object} filter
     * @return {neon.query.WherePredicate}
     * @override
     */
    createNeonFilter(filter: any): neon.query.WherePredicate {
        let filterClauses = [
            neon.query.where(filter.xField, '>=', filter.xMin),
            neon.query.where(filter.xField, '<=', filter.xMax),
            neon.query.where(filter.yField, '>=', filter.yMin),
            neon.query.where(filter.yField, '<=', filter.yMax)
        ];
        return neon.query.and.apply(neon.query, filterClauses);
    }

    getFilterText(filter) {
        return filter.xPrettyField + ' from ' + filter.xMin + ' to ' + filter.xMax + ' and ' + filter.yPrettyField + ' from ' +
            filter.yMin + ' to ' + filter.yMax;
    }

    refreshVisualization() {
        this.getChart().update();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.options.database && this.options.database.name && valid);
        valid = (this.options.table && this.options.table.name && valid);
        valid = (this.options.xField && this.options.xField.columnName && valid);
        valid = (this.options.yField && this.options.yField.columnName && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);
        let whereClauses = [];
        whereClauses.push(neon.query.where(this.options.xField.columnName, '!=', null));
        whereClauses.push(neon.query.where(this.options.yField.columnName, '!=', null));
        let groupBys: any[] = [];
        groupBys.push(this.options.xField.columnName);
        groupBys.push(this.options.yField.columnName);
        if (this.options.labelField && this.options.labelField.columnName !== '') {
            whereClauses.push(neon.query.where(this.options.labelField.columnName, '!=', null));
            groupBys.push(this.options.labelField);
        }
        // Check for unshared filters
        if (this.hasUnsharedFilter()) {
            whereClauses.push(neon.query.where(this.options.unsharedFilterField.columnName, '=',
                this.options.unsharedFilterValue));
        }
        if (!!this.options.colorField.columnName) {
            whereClauses.push(neon.query.where(this.options.colorField.columnName, '!=', null));
            groupBys.push(this.options.colorField.columnName);
        }

        query = query.groupBy(groupBys);
        query = query.sortBy(this.options.xField.columnName, neonVariables.ASCENDING);
        query.where(neon.query.and.apply(query, whereClauses));
        query = query.aggregate(neonVariables.COUNT, '*', 'value');
        return query;
    }

    getFiltersToIgnore() {
        return null;
    }

    onQuerySuccess(response) {
        this.disabledList = [];
        this.disabledDatasets.clear();

        // TODO much of this method could be optimized, but we'll worry about that later
        let colorField = this.options.colorField.columnName;

        let data = response.data;
        let xAxisIsNumeric = true;
        let yAxisIsNumeric = true;
        let xAxisLabels = [];
        let yAxisLabels = [];
        this.pointLabels = [];

        // Map of colorField value to scatter data
        let dataSetMap = new Map<string, ScatterDataSet>();

        for (let point of data) {
            let x = point[this.options.xField.columnName];
            let y = point[this.options.yField.columnName];
            let p = {
                x: x,
                y: y
            };

            // The key of the dataset is the value of the color field, or ''
            let dataSetKey = '';
            if (!!this.options.colorField.columnName) {
                dataSetKey = point[colorField];
            }

            let dataSet = dataSetMap.get(dataSetKey);
            if (!dataSet) {
                let color = this.defaultActiveColor;
                if (!!this.options.colorField.columnName) {
                    color = this.widgetService.getColor(this.options.database.name, this.options.table.name,
                        this.options.colorField.columnName, dataSetKey);
                }
                dataSet = new ScatterDataSet(color);
                dataSet.label = dataSetKey;
                dataSetMap.set(dataSetKey, dataSet);
            }

            xAxisLabels.push(x);
            yAxisLabels.push(y);
            xAxisIsNumeric = xAxisIsNumeric && super.isNumber(x);
            yAxisIsNumeric = yAxisIsNumeric && super.isNumber(y);

            dataSet.data.push(p);
            let label = '';
            if (point.hasOwnProperty(this.options.labelField.columnName)) {
                label = point[this.options.labelField.columnName];
            }
            this.pointLabels.push(label);
        }

        // Un-map the data sets
        let allDataSets = Array.from(dataSetMap.values());

        if (xAxisIsNumeric) {
            this.chart.data.xLabels = xAxisLabels;
        } else {
            let xLabels = this.removeDuplicatesAndSort(xAxisLabels);
            this.chart.data.xLabels = xLabels;
            for (let dataSet of allDataSets) {
                for (let p of dataSet.data) {
                    let val = p.x;
                    p.x = xLabels.indexOf(val);
                }
            }
        }

        if (yAxisIsNumeric) {
            this.chart.data.yLabels = yAxisLabels;
        } else {
            let yLabels = this.removeDuplicatesAndSort(yAxisLabels);
            this.chart.data.yLabels = yLabels;
            for (let dataSet of allDataSets) {
                for (let p of dataSet.data) {
                    let val = p.y;
                    p.y = yLabels.indexOf(val);
                }
            }
        }

        this.chart.data.labels = this.chart.data.xLabels;
        this.chart.data.datasets = allDataSets;

        if (this.chart.data.labels.length > this.options.limit) {
            let pointCount = 0;
            let pointLimit = this.options.limit;
            this.chart.data.datasets = this.chart.data.datasets.map((dataset) => {
                if (pointCount >= pointLimit) {
                    dataset.data = [];
                } else {
                    if (pointCount + dataset.data.length > pointLimit) {
                        dataset.data = dataset.data.slice(0, pointLimit - pointCount);
                    }
                    pointCount += dataset.data.length;
                }
                return dataset;
            });
        }

        this.xAxisIsNumeric = xAxisIsNumeric;
        this.yAxisIsNumeric = yAxisIsNumeric;

        this.refreshVisualization();
        // Force the legend to update
        this.colorKeys = [this.widgetService.getColorKey(this.options.database.name, this.options.table.name,
            this.options.colorField.columnName)];
    }

    xAxisTickCallback(value): string {
        if (this.xAxisIsNumeric) {
            return value;
        }
        let t = this.chart.data.xLabels[value];
        if (t !== undefined) {
            return t;
        }
        return '';
    }

    yAxisTickCallback(value): string {
        if (this.yAxisIsNumeric) {
            return value;
        }
        let t = this.chart.data.yLabels[value];
        if (t !== undefined) {
            return t;
        }
        return '';
    }

    removeDuplicatesAndSort(inputArray) {
        return inputArray.sort().filter((element, index, array) => {
            return !index || element !== array[index - 1];
        });
    }

    setupFilters() {
        // Do nothing
    }

    /**
     * Updates the scatter plot after limit change.
     *
     * @override
     */
    subHandleChangeLimit() {
        // TODO THOR-526 Redraw the scatter plot but do not requery because we can use the same data from the original query.
        this.logChangeAndStartQueryChain();
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

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        if (!this.chart.data.labels || !this.chart.data.labels.length) {
            return 'No Data';
        }
        if (this.chart.data.labels.length <= this.options.limit) {
            return 'Total ' + super.prettifyInteger(this.chart.data.labels.length);
        }
        return super.prettifyInteger(this.options.limit) + ' of ' + super.prettifyInteger(this.chart.data.labels.length);
    }

    removeFilter() {
        this.filters = [];
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
}

export class ScatterPlotFilter {
    id: string;
    xMin: any;
    xMax: any;
    yMin: any;
    yMax: any;
    xField: string;
    yField: string;
    xPrettyField: string;
    yPrettyField: string;
}
