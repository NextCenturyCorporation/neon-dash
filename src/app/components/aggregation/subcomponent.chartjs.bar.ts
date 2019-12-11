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
import { ElementRef } from '@angular/core';
import { AbstractChartJsDataset, AbstractChartJsSubcomponent, SelectMode } from './subcomponent.chartjs.abstract';
import { AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { Color } from 'nucleus/dist/core/models/color';

// http://www.chartjs.org/docs/latest/charts/bar.html#dataset-properties
export class ChartJsBarDataset extends AbstractChartJsDataset {
    public backgroundColor: string[] = [];
    public barPercentage: number = 0.9;
    public categoryPercentage: number = 0.9;
    public hoverBackgroundColor: string[] = [];

    constructor(elementRef: ElementRef, color: Color, label: string, xList: any[], public xSelected: any[],
        public horizontal: boolean = false) {
        super(elementRef, color, label, xList);
    }

    public finalizeData() {
        Array.from(this.xToY.keys()).forEach((xValue) => {
            let yList = this.xToY.get(xValue);
            (yList.length ? yList : [null]).forEach((yValue) => {
                this.backgroundColor.push(this.xSelected.length > 0 &&
                    this.xSelected.indexOf(xValue) < 0 ? this.getColorDeselected() : this.getColorSelected());

                this.hoverBackgroundColor.push(this.xSelected.length > 0 &&
                    this.xSelected.indexOf(xValue) < 0 ? this.getColorSelected() : this.getColorHover());

                this.data.push({
                    x: this.horizontal ? yValue : xValue,
                    y: this.horizontal ? xValue : yValue
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
     * @arg {string} [textColorHex]
     * @arg {boolean} [horizontal=false]
     * @arg {boolean} [selectMode=ITEM]
     */
    constructor(options: any, listener: AggregationSubcomponentListener, elementRef: ElementRef, textColorHex?: string,
        protected horizontal: boolean = false, selectMode: SelectMode = SelectMode.ITEM) {
        super(options, listener, elementRef, textColorHex, selectMode);
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
        return new ChartJsBarDataset(this.elementRef, color, label, xList, this.selectedLabels, this.horizontal);
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
     * Returns the label for a visualization element using the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Bar' + (count === 1 ? '' : 's');
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
