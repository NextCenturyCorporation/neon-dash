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
import { ElementRef } from '@angular/core';
import { AbstractAggregationSubcomponent, AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { AggregationOptions } from './aggregation.component';
import { Color } from '../../services/color-scheme.service';

import * as _ from 'lodash';
import 'chart.js';

declare let Chart;

export abstract class AbstractChartJsDataset {
    public data: any[] = [];
    public xToY: Map<any, any> = new Map<any, any[]>();

    constructor(public color: Color, public label: string, xList: string[]) {
        xList.forEach((x) => {
            this.xToY.set(x, []);
        });
    }

    public addPoint(x: any, y: any) {
        // All X values should already exist in the Map (if not, show an error).
        this.xToY.set(x, this.xToY.get(x).concat(y));
    }

    public abstract finalizeData();

    public getColorBackground(): string {
        return this.color.toRgba(0.33);
    }

    public getColorDeselected(): string {
        return this.color.toRgba(0.66);
    }

    public getColorSelected(): string {
        return this.color.toRgb();
    }

    public getLabels(): any[] {
        return undefined;
    }
}

export class ChartJsData {
    constructor(
        public datasets: AbstractChartJsDataset[],
        public labels: string[]
    ) {}
}

export abstract class AbstractChartJsSubcomponent extends AbstractAggregationSubcomponent {
    private DEFAULT_CHART_ELEMENT_WIDTH = 10;
    private HORIZONTAL_MARGIN = 10;
    private X_AXIS_HEIGHT = 20;

    private canvas: any;
    private chart: any;
    private hiddenCanvas: any;

    private cancelSelect: boolean = false;
    private ignoreSelect: boolean = false;

    private selectedBounds: {
        beginX: number,
        beginY: number,
        endX: number,
        endY: number
    } = null;

    private selectedDomain: {
        beginIndex: number,
        beginX: number,
        endIndex: number,
        endX: number
    } = null;

    // Save only the tick labels shown in the chart (adjusted for its size) rather than the chart.data.labels which are all the labels.
    private tickLabels: {
        x: any[],
        y: any[]
    } = {
        x: [],
        y: []
    };

    protected selectedLabels: any[] = [];

    /**
     * @constructor
     * @arg {AggregationOptions} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     * @arg {boolean} [cannotSelect=false]
     */
    constructor(options: AggregationOptions, listener: AggregationSubcomponentListener, elementRef: ElementRef,
        protected cannotSelect: boolean = false) {

        super(options, listener, elementRef);
    }

    /**
     * Calculates and returns the pixel width of the given text.
     *
     * @arg {string} text
     * @return {number}
     * @private
     */
    private computeTextWidth(text: string) {
        if (!text) {
            return 0;
        }
        // Render the text on a hidden canvas to measure it.
        return this.hiddenCanvas.measureText(text).width;
    }

    /**
     * Calculates and returns the pixel width of the current longest y-axis label.
     *
     * @arg {number} chartWidth
     * @arg {boolean} [withMargins=false]
     * @return {number}
     * @private
     */
    private computeCurrentWidthAxisY(chartWidth: number, withMargins: boolean = false) {
        let maxWidth = Math.floor(this.options.yPercentage * chartWidth);
        if (!this.tickLabels.y || !this.tickLabels.y.length) {
            return maxWidth;
        }
        let labelWidth = this.tickLabels.y.reduce((max, yLabel) => {
            return Math.max(max, this.computeTextWidth(yLabel));
        }, 0);
        return Math.min(labelWidth, maxWidth) + (withMargins ? (2 * this.HORIZONTAL_MARGIN) : 0);
    }

    /**
     * Calculates and returns the pixel width of the maximum longest y-axis label.
     *
     * @arg {number} chartWidth
     * @arg {boolean} [withMargins=false]
     * @return {number}
     * @private
     */
    private computeMaximumWidthAxisY(chartWidth: number, withMargins: boolean = false) {
        return Math.floor(this.options.yPercentage * chartWidth) + (withMargins ? (2 * this.HORIZONTAL_MARGIN) : 0);
    }

    /**
     * Creates and returns the chart options.
     *
     * @arg {any} meta
     * @return {any}
     */
    private createChartOptions(meta: any): any {
        let defaultOptions: any = {
            animation: {
                duration: 0
            },
            events: ['click', 'mousemove', 'mouseover', 'mouseout', 'touchend', 'touchmove', 'touchstart'],
            hover: {
                intersect: false,
                mode: 'index',
                onHover: this.onHoverEvent.bind(this)
            },
            legend: {
                display: false
            },
            maintainAspectRatio: false,
            onClick: this.onClickEvent.bind(this),
            scales: {
                xAxes: [{
                    afterFit: this.resizeAxisX.bind(this),
                    afterTickToLabelConversion: this.saveTickLabelsX.bind(this),
                    gridLines: {
                        display: !this.options.hideGridLines
                    },
                    labels: (this.isHorizontal() ? meta.yList : meta.xList),
                    position: 'bottom',
                    ticks: {
                        display: !this.options.hideGridTicks,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: this.formatAndTruncateTextX.bind(this)
                    },
                    type: 'category'
                }],
                yAxes: [{
                    afterFit: this.resizeAxisY.bind(this),
                    afterTickToLabelConversion: this.saveTickLabelsY.bind(this),
                    gridLines: {
                        display: !this.options.hideGridLines
                    },
                    labels: (this.isHorizontal() ? meta.xList : meta.yList),
                    position: 'left',
                    ticks: {
                        display: !this.options.hideGridTicks,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: this.formatAndTruncateTextY.bind(this)
                    },
                    type: 'category'
                }]
            },
            tooltips: {
                intersect: false,
                mode: 'index',
                position: 'nearest',
                callbacks: {
                    label: this.createTooltipLabel.bind(this),
                    title: this.createTooltipTitle.bind(this)
                }
            }
        };

        // Compare here to an empty string so we do not ignore zero!
        if (this.options.scaleMaxX !== '' && !isNaN(Number(this.options.scaleMaxX))) {
            defaultOptions.scales.xAxes[0].ticks.max = Number(this.options.scaleMaxX);
        }

        if (this.options.scaleMinX !== '' && !isNaN(Number(this.options.scaleMinX))) {
            defaultOptions.scales.xAxes[0].ticks.min = Number(this.options.scaleMinX);
        }

        if (this.options.scaleMaxY !== '' && !isNaN(Number(this.options.scaleMaxY))) {
            defaultOptions.scales.yAxes[0].ticks.max = Number(this.options.scaleMaxY);
        }

        if (this.options.scaleMinY !== '' && !isNaN(Number(this.options.scaleMinY))) {
            defaultOptions.scales.yAxes[0].ticks.min = Number(this.options.scaleMinY);
        }

        return this.finalizeChartOptions(defaultOptions, meta);
    }

    /**
     * Creates and returns the chart data and options from the given query data and metadata.
     *
     * @arg {array} data
     * @arg {any} meta
     * @return {{ data: ChartJsData, options: any }}
     * @protected
     */
    protected createChartDataAndOptions(data: any[], meta: any): { data: ChartJsData, options: any } {
        let groupsToDatasets = new Map<string, any>();
        data.forEach((item) => {
            let dataset = groupsToDatasets.get(item.group);
            if (!dataset) {
                dataset = this.createChartDataset(item.color, item.group, meta.xList);
                groupsToDatasets.set(item.group, dataset);
            }
            dataset.addPoint(item.x, item.y);
        });

        let datasets = Array.from(groupsToDatasets.values());
        datasets.forEach((dataset) => {
            dataset.finalizeData();
        });

        return {
            data: new ChartJsData(datasets, this.isHorizontal() ? meta.yList : meta.xList),
            options: this.createChartOptions(meta)
        };
    }

    /**
     * Creates and returns the chart dataset object for the given color and label and array of X values.
     *
     * @arg {Color} color
     * @arg {string} label
     * @arg {any[]} xList
     * @return {AbstractChartJsDataset}
     * @protected
     * @abstract
     */
    protected abstract createChartDataset(color: Color, label: string, xList: any[]): AbstractChartJsDataset;

    /**
     * Creates and returns a tooltip label for the given item and data.
     *
     * @arg {any} tooltipItem
     * @arg {any} chartData
     * @return {string}
     * @private
     */
    private createTooltipLabel(tooltipItem: any, chartData: any): string {
        let axisType = this.findAxisTypeY();
        let dataset = chartData.datasets[tooltipItem.datasetIndex];
        // Do not use tooltipItem.yLabel because it can be incorrect for category axes.
        let item = dataset.data[tooltipItem.index];
        let text = typeof item === 'object' ? (this.isHorizontal() ? item.x : item.y) : item;

        if (text === null) {
            return null;
        }
        if (axisType === 'number') {
            // Do not truncate the y-axis text if it is a number (just truncate the dataset label).
            let label = this.isNumberString(text) ? this.toNumberString(text) : text;
            return this.truncateTooltipLabel(dataset.label, ': ' + label);
        }

        return this.truncateTooltipLabel(dataset.label + ': ' + text, '');
    }

    /**
     * Creates and returns a tooltip title for the given list and data.
     *
     * @arg {any[]} tooltipList
     * @arg {any} chartData
     * @return {string}
     * @private
     */
    private createTooltipTitle(tooltipList: any[], chartData: any): string {
        let axisType = this.findAxisTypeX();
        let dataset = chartData.datasets[tooltipList[0].datasetIndex];
        // Do not use tooltipList[0].xLabel because it can be incorrect for category axes.
        let item = dataset.data[tooltipList[0].index];
        let text = typeof item === 'object' ? (this.isHorizontal() ? item.y : item.x) :
            (dataset.getLabels() || chartData.labels)[tooltipList[0].index];

        if (text === null) {
            return null;
        }
        if (axisType === 'date') {
            return this.isDateString(text) ? this.toDateLongString(text) : text;
        }
        if (axisType === 'number') {
            return this.isNumberString(text) ? this.toNumberString(text) : text;
        }

        return this.truncateTooltipLabel(text, '');
    }

    /**
     * Deselects the given items (or all items) in the given chart.
     *
     * @arg {any} chart
     * @arg {any[]} [items]
     * @protected
     */
    protected dataDeselect(chart: any, items?: any[]) {
        // Do nothing.
    }

    /**
     * Selects the given items in the given chart.
     *
     * @arg {any} chart
     * @arg {any[]} items
     * @protected
     */
    protected dataSelect(chart: any, items: any[]) {
        // Do nothing.
    }

    /**
     * Deselects the given item or all the subcomponent elements.
     *
     * @arg {any} [item]
     * @override
     */
    public deselect(item?: any) {
        this.selectedLabels = item ? this.selectedLabels.filter((existingItem) => {
            return existingItem !== item;
        }) : [];
        this.dataDeselect(this.chart, item ? [item] : undefined);
    }

    /**
     * Destroys all the subcomponent elements.
     *
     * @override
     */
    public destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.elementRef.nativeElement.removeChild(this.elementRef.nativeElement.firstChild);
        }
    }

    /**
     * Draws all the subcomponent elements with the given data and metadata.
     *
     * @arg {array} data
     * @arg {any} meta
     * @override
     */
    public draw(data: any[], meta: any) {
        if (this.chart) {
            let dataAndOptions = this.createChartDataAndOptions(data, meta);
            this.chart.data = dataAndOptions.data;
            this.chart.options = dataAndOptions.options;
            this.chart.update();
        }
    }

    /**
     * Returns the type of the x-axis as date, number, or string.
     *
     * @return {string}
     * @protected
     */
    protected findAxisTypeX(): string {
        let axisType = this.chart.options.scales.xAxes[0].type;
        return (axisType === 'linear' || axisType === 'logarithmic' ? 'number' : (axisType === 'time' ? 'date' : 'string'));
    }

    /**
     * Returns the type of the y-axis as date, number, or string.
     *
     * @return {string}
     * @protected
     */
    protected findAxisTypeY(): string {
        let axisType = this.chart.options.scales.yAxes[0].type;
        return (axisType === 'linear' || axisType === 'logarithmic' ? 'number' : (axisType === 'time' ? 'date' : 'string'));
    }

    /**
     * Returns an item to select from the given items and chart.
     *
     * @arg {any[]} items
     * @arg {any} chart
     * @return {any}
     * @protected
     */
    protected findItemInDataToSelect(items: any[], chart: any): any {
        if (this.isHorizontal()) {
            return chart.data.datasets[items[0]._datasetIndex].data[items[0]._index].y;
        }
        return chart.data.datasets[items[0]._datasetIndex].data[items[0]._index].x;
    }

    /**
     * Returns the width of the given chart element.
     *
     * @arg {any} item
     * @return {number}
     * @protected
     */
    protected findChartElementWidth(item: any): number {
        return this.DEFAULT_CHART_ELEMENT_WIDTH;
    }

    /**
     * Finalizes and returns the given chart options.
     *
     * @arg {any} chartOptions
     * @arg {any} meta
     * @return {any}
     * @protected
     * @abstract
     */
    protected abstract finalizeChartOptions(chartOptions: any, meta: any): any;

    /**
     * Returns the given min or max if the pixel value does not fit; otherwise returns the given pixel value.
     *
     * @arg {number} pixel
     * @arg {number} min
     * @arg {number} max
     * @return {number}
     * @private
     */
    private forceInChart(pixel: number, min: number, max: number): number {
        return pixel < min ? min : (pixel > max ? max : pixel);
    }

    /**
     * Formats, truncates (if needed), and returns the given x-label text to fit inside the chart.
     *
     * @arg {string} text
     * @return {string}
     * @private
     */
    private formatAndTruncateTextX(text: string) {
        // Only truncate text of string x-axes.
        let axisType = this.findAxisTypeX();
        if (axisType === 'date' && this.isDateString(text)) {
            return this.toDateShortLabel(text);
        }
        if (axisType === 'number' && this.isNumberString(text)) {
            return this.toNumberString(text);
        }
        // Find the width of each individual x-axis tick by dividing the total available width by the number of x-axis ticks.
        let xTickWidth = Math.floor((this.canvas.clientWidth - this.computeCurrentWidthAxisY(this.canvas.clientWidth, true)) /
            this.tickLabels.x.length);
        // Subtract a margin from each x-axis tick.
        return this.truncateText(xTickWidth - (2 * this.HORIZONTAL_MARGIN), text);
    }

    /**
     * Formats, truncates (if needed), and returns the given y-label text to fit inside the chart.
     *
     * @arg {string} text
     * @return {string}
     * @private
     */
    private formatAndTruncateTextY(text: string) {
        // Always truncate y-axes regardless type.
        let textToTruncate = text;
        let axisType = this.findAxisTypeY();
        if (axisType === 'date' && this.isDateString(text)) {
            textToTruncate = this.toDateShortLabel(text);
        }
        if (axisType === 'number' && this.isNumberString(text)) {
            textToTruncate = this.toNumberString(text);
        }
        // Truncate using the maximum available y-axis width.
        return this.truncateText(this.computeMaximumWidthAxisY(this.canvas.clientWidth), textToTruncate);
    }

    /**
     * Returns the ChartJs chart type.
     *
     * @return {string}
     * @protected
     * @abstract
     */
    protected abstract getChartType(): string;

    /**
     * Returns the minimum dimensions needed for the subcomponent.
     *
     * @return { { height: number, width: number } }
     * @override
     */
    public getMinimumDimensions(): { height: number, width: number } {
        let axisTypeX = this.findAxisTypeX();
        let axisTypeY = this.findAxisTypeY();
        let height = this.getMinimumTickCountY(axisTypeY, this.tickLabels.y.length) * this.getMinimumTickHeight(axisTypeY) +
            this.X_AXIS_HEIGHT;
        let width = this.getMinimumTickCountX(axisTypeX, this.tickLabels.x.length) * this.getMinimumTickWidth(axisTypeX) +
            this.computeCurrentWidthAxisY(this.canvas.clientWidth, true);
        return {
            height: height,
            width: width
        };
    }

    /**
     * Returns the minimum number of X ticks.
     *
     * @arg {string} axisType
     * @arg {number} tickLength
     * @return {number}
     * @protected
     */
    protected getMinimumTickCountX(axisType: string, tickLength: number): number {
        // Default of non-string axes is 3 ticks (begin, middle, end).
        return axisType === 'string' ? tickLength : 3;
    }

    /**
     * Returns the minimum number of Y ticks.
     *
     * @arg {string} axisType
     * @arg {number} tickLength
     * @return {number}
     * @protected
     */
    protected getMinimumTickCountY(axisType: string, tickLength: number): number {
        // Default of non-string axes is 3 ticks (begin, middle, end).
        return axisType === 'string' ? tickLength : 3;
    }

    /**
     * Returns the minimum tick height.
     *
     * @arg {string} axisType
     * @return {number}
     * @protected
     */
    protected getMinimumTickHeight(axisType: string): number {
        return 25;
    }

    /**
     * Returns the minimum tick width.
     *
     * @arg {string} axisType
     * @return {number}
     * @protected
     */
    protected getMinimumTickWidth(axisType: string): number {
        return 50;
    }

    /**
     * Handles the given click event as needed by this subcomponent.
     *
     * @arg {event} event
     * @arg {any[]} items
     * @arg {any} chart
     * @protected
     */
    protected handleClickEvent(event, items: any[], chart: any) {
        // Do nothing.
    }

    /**
     * Handles the given hover event as needed by this subcomponent.
     *
     * @arg {event} event
     * @arg {any[]} items
     * @arg {any} chart
     * @protected
     */
    protected handleHoverEvent(event, items: any[], chart: any) {
        // Do nothing.
    }

    /**
     * Initializes all the subcomponent elements.
     *
     * @override
     */
    public initialize() {
        Chart.defaults.global.defaultFontFamily = 'Roboto, sans-serif';
        Chart.defaults.global.defaultFontSize = 12;

        this.hiddenCanvas = this.listener.getHiddenCanvas().nativeElement.getContext('2d');
        this.hiddenCanvas.font = '12px Roboto, sans-serif';

        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.elementRef.nativeElement.appendChild(this.canvas);
            this.chart = new Chart(this.canvas, {
                data: {
                    labels: [],
                    datasets: []
                },
                options: this.createChartOptions({}),
                type: this.getChartType()
            });
        }
    }

    /**
     * Returns whether the chart is horizontal.
     *
     * @return {boolean}
     * @protected
     */
    protected isHorizontal(): boolean {
        return false;
    }

    /**
     * Returns whether the location of the chart with the given items is selectable.
     *
     * @arg {any[]} items
     * @return {boolean}
     * @protected
     */
    protected isSelectable(items: any[]): boolean {
        return !this.cannotSelect && !!items.length;
    }

    /**
     * Handles the given click event.
     *
     * @arg {event} event
     * @arg {any[]} items
     */
    public onClickEvent(event, items: any[]) {
        this.handleClickEvent(event, items, this.chart);
    }

    /**
     * Handles the given hover event.
     *
     * @arg {event} event
     * @arg {any[]} items
     */
    public onHoverEvent(event, items: any[]) {
        this.elementRef.nativeElement.style.cursor = this.isSelectable(items) ? 'pointer' : 'default';
        this.handleHoverEvent(event, items, this.chart);
    }

    /**
     * Redraws all the subcomponent elements.
     *
     * @override
     */
    public redraw() {
        this.chart.update();
        this.listener.subcomponentRequestsRedraw();
    }

    /**
     * Resizes the given x-axis object as needed.
     *
     * @arg {any} xAxis
     * @private
     */
    private resizeAxisX(xAxis: any) {
        xAxis.paddingLeft = this.computeCurrentWidthAxisY(this.canvas.clientWidth, true);
        xAxis.paddingRight = this.HORIZONTAL_MARGIN;
        xAxis.width = this.canvas.clientWidth - xAxis.paddingLeft - xAxis.paddingRight;
    }

    /**
     * Resizes the given y-axis object as needed.
     *
     * @arg {any} yAxis
     * @private
     */
    private resizeAxisY(yAxis: any) {
        yAxis.width = this.computeCurrentWidthAxisY(this.canvas.clientWidth);
    }

    /**
     * Saves the tick labels for the given x-axis.
     *
     * @arg {any} xAxis
     * @private
     */
    private saveTickLabelsX(xAxis: any) {
        this.tickLabels.x = [].concat(xAxis.ticks);
    }

    /**
     * Saves the tick labels for the given y-axis.
     *
     * @arg {any} yAxis
     * @private
     */
    private saveTickLabelsY(yAxis: any) {
        this.tickLabels.y = [].concat(yAxis.ticks);
    }

    /**
     * Selects a bounds using the given event and items.
     *
     * @arg {event} event
     * @arg {any[]} items
     * @arg {any} chart
     * @arg {boolean} [domainOnly=false]
     * @protected
     */
    protected selectBounds(event, items: any[], chart: any, domainOnly: boolean = false) {
        if (event.type === 'mouseover' && event.buttons > 0) {
            this.ignoreSelect = true;
        }

        if (event.buttons === 0) {
            this.cancelSelect = false;
            this.ignoreSelect = false;
        }

        if (event.type === 'mouseout' || this.cancelSelect || this.ignoreSelect) {
            return;
        }

        // Selection yes, mouse press cancel...
        if (this.selectedBounds && event.buttons > 1) {
            this.selectedLabels = [];
            this.dataDeselect(chart);
            this.listener.subcomponentRequestsDeselect();
            this.listener.subcomponentRequestsRedraw(event);
            this.selectedBounds = null;
            this.cancelSelect = true;
        }

        // Selection no, mouse press yes...
        if (!this.selectedBounds && event.buttons === 1) {
            let beginX = this.forceInChart(event.offsetX, chart.chartArea.left, chart.chartArea.right);
            let beginY = this.forceInChart(event.offsetY, chart.chartArea.top, chart.chartArea.bottom);
            this.selectedBounds = {
                beginX: beginX,
                beginY: beginY,
                endX: beginX,
                endY: beginY
            };
        }

        // Selection yes, mouse press yes...
        if (this.selectedBounds && event.buttons === 1) {
            this.selectedBounds = {
                beginX: this.selectedBounds.beginX,
                beginY: domainOnly ? chart.chartArea.top : this.selectedBounds.beginY,
                endX: this.forceInChart(event.offsetX, chart.chartArea.left, chart.chartArea.right),
                endY: domainOnly ? chart.chartArea.bottom : this.forceInChart(event.offsetY, chart.chartArea.top,
                    chart.chartArea.bottom)
            };

            if (items.length) {
                this.selectedLabels = this.selectedLabels.indexOf(items[0]._model.label) < 0 ?
                    this.selectedLabels.concat(items[0]._model.label) : this.selectedLabels;

                this.dataSelect(chart, items);
            }

            this.listener.subcomponentRequestsSelect(
                Math.min(this.selectedBounds.beginX, this.selectedBounds.endX),
                Math.min(this.selectedBounds.beginY, this.selectedBounds.endY),
                Math.abs(this.selectedBounds.beginX - this.selectedBounds.endX),
                Math.abs(this.selectedBounds.beginY - this.selectedBounds.endY)
            );

            this.listener.subcomponentRequestsRedraw(event);
        }

        // Selection yes, mouse press no...
        if (this.selectedBounds && event.buttons === 0) {
            let beginValueX = chart.scales['x-axis-0'].getValueForPixel(this.selectedBounds.beginX);
            let beginValueY = chart.scales['y-axis-0'].getValueForPixel(this.selectedBounds.beginY);
            let endValueX = chart.scales['x-axis-0'].getValueForPixel(this.selectedBounds.endX);
            let endValueY = chart.scales['y-axis-0'].getValueForPixel(this.selectedBounds.endY);

            let beginLabelX, beginLabelY, endLabelX, endLabelY;
            if (this.findAxisTypeX() === 'string') {
                beginValueX = chart.scales['x-axis-0'].getLabelForIndex(beginValueX, 0);
                endValueX = chart.scales['x-axis-0'].getLabelForIndex(endValueX, 0);
                beginLabelX = beginValueX < endValueX ? beginValueX : endValueX;
                endLabelX = beginValueX > endValueX ? beginValueX : endValueX;
            } else if (this.findAxisTypeX() === 'date') {
                beginLabelX = new Date(Math.min(beginValueX, endValueX));
                endLabelX = new Date(Math.max(beginValueX, endValueX));
            } else {
                beginLabelX = Math.min(beginValueX, endValueX);
                endLabelX = Math.max(beginValueX, endValueX);
            }

            if (this.findAxisTypeY() === 'string') {
                beginValueY = chart.scales['y-axis-0'].getLabelForIndex(beginValueY, 0);
                endValueY = chart.scales['y-axis-0'].getLabelForIndex(endValueY, 0);
                beginLabelY = beginValueY < endValueY ? beginValueY : endValueY;
                endLabelY = beginValueY > endValueY ? beginValueY : endValueY;
            } else {
                beginLabelY = Math.min(beginValueY, endValueY);
                endLabelY = Math.max(beginValueY, endValueY);
            }

            if (domainOnly) {
                this.listener.subcomponentRequestsFilterOnDomain(beginLabelX, endLabelX);
            } else {
                this.listener.subcomponentRequestsFilterOnBounds(beginLabelX, beginLabelY, endLabelX, endLabelY);
            }
            this.selectedBounds = null;
        }
    }

    /**
     * Selects a domain using the given event and items.
     *
     * @arg {event} event
     * @arg {any[]} items
     * @arg {any} chart
     * @protected
     */
    protected selectDomain(event, items: any[], chart: any) {
        if (event.type === 'mouseover' && event.buttons > 0) {
            this.ignoreSelect = true;
        }

        if (event.buttons === 0) {
            this.cancelSelect = false;
            this.ignoreSelect = false;
        }

        if (event.type === 'mouseout' || this.cancelSelect || this.ignoreSelect) {
            return;
        }

        // Selection yes, mouse press cancel...
        if (this.selectedDomain && event.buttons > 1) {
            this.selectedLabels = [];
            this.dataDeselect(chart);
            this.listener.subcomponentRequestsDeselect();
            this.listener.subcomponentRequestsRedraw(event);
            this.selectedDomain = null;
            this.cancelSelect = true;
        }

        // Selection no, mouse press yes...
        if (!this.selectedDomain && event.buttons === 1 && items.length) {
            // Just use the first item here since each item should have the same X value / index.
            this.selectedDomain = {
                beginIndex: items[0]._index,
                beginX: items[0]._model.x,
                endIndex: items[0]._index,
                endX: items[0]._model.x
            };
        }

        // Selection yes, mouse press yes...
        if (this.selectedDomain && event.buttons === 1 && items.length) {
            this.selectedDomain = {
                beginIndex: this.selectedDomain.beginIndex,
                beginX: this.selectedDomain.beginX,
                endIndex: items[0]._index,
                endX: items[0]._model.x
            };

            this.selectedLabels = this.selectedLabels.indexOf(items[0]._model.label) < 0 ?
                this.selectedLabels.concat(items[0]._model.label) : this.selectedLabels;

            let elementWidth = this.findChartElementWidth(items[0]);

            this.dataSelect(chart, items);

            this.listener.subcomponentRequestsSelect(
                Math.min(this.selectedDomain.beginX, this.selectedDomain.endX) - Math.ceil(elementWidth / 2.0),
                chart.chartArea.top,
                Math.abs(this.selectedDomain.beginX - this.selectedDomain.endX) + elementWidth,
                (chart.chartArea.bottom - chart.chartArea.top)
            );

            this.listener.subcomponentRequestsRedraw(event);
        }

        // Selection yes, mouse press no...
        if (this.selectedDomain && event.buttons === 0) {
            let beginLabelX = chart.scales['x-axis-0'].getLabelForIndex(Math.min(this.selectedDomain.beginIndex,
                this.selectedDomain.endIndex), 0);
            let endLabelX = chart.scales['x-axis-0'].getLabelForIndex(Math.max(this.selectedDomain.beginIndex,
                this.selectedDomain.endIndex), 0);
            if (this.findAxisTypeX() === 'date') {
                beginLabelX = new Date(beginLabelX);
                endLabelX = new Date(endLabelX);
            }
            if (this.findAxisTypeX() === 'number') {
                beginLabelX = Number(('' + beginLabelX).replace(/,/g, ''));
                endLabelX = Number(('' + endLabelX).replace(/,/g, ''));
            }

            this.listener.subcomponentRequestsFilterOnDomain(beginLabelX, endLabelX);
            this.selectedDomain = null;
        }
    }

    /**
     * Selects an item using the given event and items.
     *
     * @arg {event} event
     * @arg {any[]} items
     * @arg {any} chart
     * @protected
     */
    protected selectItem(event, items: any[], chart) {
        if (!items.length) {
            return;
        }

        let labelGroup = chart.data.datasets[items[0]._datasetIndex].label;
        let labelValue = this.findItemInDataToSelect(items, chart);
        let doNotReplace = !!(event.ctrlKey || event.metaKey);
        this.selectedLabels = doNotReplace ? this.selectedLabels.concat(labelValue) : [labelValue];
        if (!doNotReplace) {
            this.dataDeselect(chart);
        }
        this.dataSelect(chart, items);
        this.listener.subcomponentRequestsFilter(labelGroup, labelValue, doNotReplace);
    }

    /**
     * Truncates and returns the given text (if needed) to fit inside a chart with the given width.
     *
     * @arg {number} openWidth
     * @arg {string} text
     * @arg {string} [suffix='']
     * @return {string}
     * @private
     */
    private truncateText(openWidth: number, text: string, suffix: string = ''): string {
        // Subtract three characters for the ellipsis.
        let truncated = ('' + text).substring(0, ('' + text).length - 3);
        let textWidth = this.computeTextWidth(text + suffix);

        if (!textWidth || textWidth < 0 || !openWidth || openWidth < 0 || textWidth < openWidth) {
            return (text || '') + suffix;
        }

        while (textWidth > openWidth) {
            // Truncate multiple characters of long text to increase speed performance.
            let chars = Math.ceil(truncated.length / 20.0);
            truncated = truncated.substring(0, truncated.length - chars);
            if (!truncated) {
                return '...' + suffix;
            }
            textWidth = this.computeTextWidth(truncated + '...' + suffix);
        }

        return truncated.trim() + '...' + suffix;
    }

    /**
     * Truncates and returns the given tooltip text (if needed) to fit inside the chart.
     *
     * @arg {string} text
     * @arg {string} suffix
     * @return {string}
     * @private
     */
    private truncateTooltipLabel(text: string, suffix: string): string {
        return this.truncateText((this.canvas.clientWidth - (2 * this.HORIZONTAL_MARGIN)), text, suffix);
    }
}
