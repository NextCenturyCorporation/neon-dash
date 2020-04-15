/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { Color } from '@caci-critical-insight-solutions/nucleus-core';

// http://www.chartjs.org/docs/latest/charts/doughnut.html#dataset-properties
export class ChartJsPieDataset extends AbstractChartJsDataset {
    public backgroundColor: string[] = [];
    public hoverBackgroundColor: string[] = [];
    public slices: any[] = [];

    constructor(elementRef: ElementRef, color: Color, label: string, xList: any[], public xSelected: any[]) {
        super(elementRef, color, label, xList);
    }

    public finalizeData() {
        Array.from(this.xToYToSize.keys()).forEach((xValue) => {
            let yList = Array.from(this.xToYToSize.get(xValue).keys());
            (yList.length ? yList : [null]).forEach((yValue) => {
                this.hoverBackgroundColor.push(this.xSelected.length > 0 &&
                    this.xSelected.indexOf(xValue) < 0 ? this.getColorSelected() : this.getColorHover());
                this.backgroundColor.push(this.xSelected.length > 0 &&
                    this.xSelected.indexOf(xValue) < 0 ? this.getColorDeselected() : this.getColorSelected());
                this.slices.push(xValue);
                this.data.push(yValue);
            });
        });
    }

    public getLabels(): any[] {
        return this.slices;
    }
}

export class ChartJsPieSubcomponent extends AbstractChartJsSubcomponent {
    protected axisTypeX: string;
    protected axisTypeY: string;

    /**
     * @constructor
     * @arg {any} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     * @arg {string} [textColorHex]
     */
    constructor(options: any, listener: AggregationSubcomponentListener, elementRef: ElementRef, textColorHex?: string) {
        super(options, listener, elementRef, textColorHex, SelectMode.ITEM);
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
        return new ChartJsPieDataset(this.elementRef, color, label, xList, this.selectedLabels);
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
     * Returns an item to select from the given items and chart.
     *
     * @arg {any[]} items
     * @arg {any} chart
     * @return {any}
     * @override
     */
    protected findItemInDataToSelect(items: any[], chart: any): any {
        return chart.data.datasets[items[0]._datasetIndex].slices[items[0]._index];
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
        // Use a category axis for date data, but save the true type.
        this.axisTypeX = meta.xAxis;
        this.axisTypeY = meta.yAxis;

        chartOptions.scales = undefined;
        chartOptions.hover.mode = 'point';
        chartOptions.tooltips.mode = 'point';
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
        return 'pie';
    }

    /**
     * Returns the label for a visualization element using the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Slice' + (count === 1 ? '' : 's');
    }
}
