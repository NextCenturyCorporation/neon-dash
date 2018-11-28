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
import { AbstractChartJsDataset, AbstractChartJsSubcomponent, ChartJsData } from './subcomponent.chartjs.abstract';
import { AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { Color } from '../../color';

import * as _ from 'lodash';

// http://www.chartjs.org/docs/latest/charts/bar.html#dataset-properties
export class ChartJsBarDataset extends AbstractChartJsDataset {
    public backgroundColor: string[] = [];
    public borderColor: string;
    public borderWidth: number = 3;
    public hoverBackgroundColor: string;
    public hoverBorderColor: string;
    public hoverBorderWidth: number = 3;

    constructor(color: Color, label: string, xList: any[], public xSelected: any[], public horizontal: boolean = false) {
        super(color, label, xList);
        this.borderColor = this.getColorSelected();
        this.hoverBackgroundColor = this.getColorSelected();
        this.hoverBorderColor = this.getColorSelected();
    }

    public finalizeData() {
        Array.from(this.xToY.keys()).forEach((x) => {
            let yList = this.xToY.get(x);
            (yList.length ? yList : [null]).forEach((y) => {
                this.backgroundColor.push(this.xSelected.indexOf(x) < 0 ? this.getColorDeselected() : this.getColorSelected());
                this.data.push({
                    x: this.horizontal ? y : x,
                    y: this.horizontal ? x : y
                });
            });
        });
    }
}

export class ChartJsBarSubcomponent extends AbstractChartJsSubcomponent {
    protected axisTypeX: string;
    protected axisTypeY: string;

    /**
     * @constructor
     * @arg {any} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     * @arg {boolean} [cannotSelect=false]
     * @arg {boolean} [horizontal=false]
     */
    constructor(options: any, listener: AggregationSubcomponentListener, elementRef: ElementRef,
        cannotSelect: boolean = false, protected horizontal: boolean = false) {

        super(options, listener, elementRef, cannotSelect);
    }

    /**
     * Creates and returns the chart dataset object for the given color and label and array of X values.
     *
     * @arg {Color} color
     * @arg {string} label
     * @arg {any[]} xList
     * @return {AbstractChartJsDataset}
     * @override
     */
    protected createChartDataset(color: Color, label: string, xList: any[]): AbstractChartJsDataset {
        return new ChartJsBarDataset(color, label, xList, this.selectedLabels, this.horizontal);
    }

    /**
     * Deselects the given items (or all items) in the given chart.
     *
     * @arg {any} chart
     * @arg {any[]} [items]
     */
    protected dataDeselect(chart: any, items?: any[]) {
        chart.data.datasets.forEach((dataset) => {
            dataset.backgroundColor = dataset.backgroundColor.map((color, index) => {
                if (items) {
                    return items.indexOf(dataset.data[index]) < 0 ? color : dataset.getColorDeselected();
                }
                return dataset.getColorDeselected();
            });
        });
    }

    /**
     * Selects the given items in the given chart.
     *
     * @arg {any} chart
     * @arg {any[]} items
     */
    protected dataSelect(chart: any, items: any[]) {
        items.forEach((item) => {
            let dataset = chart.data.datasets[item._datasetIndex];
            dataset.backgroundColor[item._index] = dataset.getColorSelected();
        });
    }

    /**
     * Returns the type of the x-axis as date, number, or string.
     *
     * @return {string}
     */
    protected findAxisTypeX(): string {
        return this.axisTypeX;
    }

    /**
     * Returns the type of the y-axis as date, number, or string.
     *
     * @return {string}
     */
    protected findAxisTypeY(): string {
        return this.axisTypeY;
    }

    /**
     * Finalizes and returns the given chart options.
     *
     * @arg {any} chartOptions
     * @arg {any} meta
     * @return {any}
     * @override
     */
    protected finalizeChartOptions(chartOptions: any, meta: any): any {
        // Use a category axis for number and date data, but save the true type.
        this.axisTypeX = this.horizontal ? meta.yAxis : meta.xAxis;
        this.axisTypeY = this.horizontal ? meta.xAxis : meta.yAxis;

        // Force the x-axis (or y-axis in horizontal charts) to be category.
        chartOptions.scales.xAxes[0].type = !this.horizontal ? 'category' : (this.axisTypeX === 'number' ?
            (this.options.logScaleX && meta.dataLength > 10 ? 'logarithmic' : 'linear') : 'category');
        chartOptions.scales.yAxes[0].type = this.horizontal ? 'category' : (this.axisTypeY === 'number' ?
            (this.options.logScaleY && meta.dataLength > 10 ? 'logarithmic' : 'linear') : 'category');
        chartOptions.scales.xAxes[0].barPercentage = 0.9;
        chartOptions.scales.yAxes[0].barPercentage = 0.9;
        chartOptions.scales.xAxes[0].categoryPercentage = 0.9;
        chartOptions.scales.yAxes[0].categoryPercentage = 0.9;
        chartOptions.scales.xAxes[0].stacked = true;
        chartOptions.scales.yAxes[0].stacked = true;
        chartOptions.tooltips.position = 'average';
        return chartOptions;
    }

    /**
     * Returns the ChartJs chart type.
     *
     * @return {string}
     * @override
     */
    protected getChartType(): string {
        return this.horizontal ? 'horizontalBar' : 'bar';
    }

    /**
     * Returns the minimum number of X ticks.
     *
     * @arg {string} axisType
     * @arg {number} tickLength
     * @return {number}
     * @protected
     * @override
     */
    protected getMinimumTickCountX(axisType: string, tickLength: number): number {
        return this.isHorizontal() ? super.getMinimumTickCountX(axisType, tickLength) : tickLength;
    }

    /**
     * Returns the minimum number of Y ticks.
     *
     * @arg {string} axisType
     * @arg {number} tickLength
     * @return {number}
     * @protected
     * @override
     */
    protected getMinimumTickCountY(axisType: string, tickLength: number): number {
        return this.isHorizontal() ? tickLength : super.getMinimumTickCountY(axisType, tickLength);
    }

    /**
     * Returns the minimum tick width.
     *
     * @arg {string} axisType
     * @return {number}
     * @protected
     * @override
     */
    protected getMinimumTickWidth(axisType: string): number {
        return axisType === 'string' ? super.getMinimumTickWidth(axisType) : 10;
    }

    /**
     * Handles the given click event as needed by this subcomponent.
     *
     * @arg {event} event
     * @arg {any[]} items
     * @arg {any} chart
     * @override
     */
    protected handleClickEvent(event, items: any[], chart: any) {
        if (this.isSelectable(items)) {
            this.selectItem(event, items, chart);
        }
    }

    /**
     * Returns whether the chart is horizontal.
     *
     * @return {boolean}
     */
    public isHorizontal() {
        return this.horizontal;
    }
}
