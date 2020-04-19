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
    public borderColor: string[] = [];
    public borderWidth: number[] = [];
    public hoverBackgroundColor: string[] = [];
    public hoverBorderColor: string[] = [];
    public hoverBorderWidth: number[] = [];

    public aggregations: any[] = [];
    public slices: any[] = [];

    private themeContrastColor: string;
    private themeOppositeColor: string;

    constructor(elementRef: ElementRef, color: Color, label: string, xList: any[], public xSelected: any[]) {
        super(elementRef, color, label, xList);
        this.themeContrastColor = getComputedStyle(this.elementRef.nativeElement).getPropertyValue('--color-background-contrast');
        this.themeOppositeColor = getComputedStyle(this.elementRef.nativeElement).getPropertyValue('--color-text');
    }

    public finalizeData() {
        Array.from(this.xToYToSize.keys()).forEach((xValue, xIndex) => {
            let yList = Array.from(this.xToYToSize.get(xValue).keys());
            (yList.length ? yList : [null]).forEach((yValue) => {
                const sliceAggregation = this.xToYToSize.get(xValue).get(yValue);

                this.slices.push(yValue);
                this.data.push(sliceAggregation); // TODO Can we use a different value to avoid showing small pie slices?
                this.aggregations.push(sliceAggregation);

                this.hoverBackgroundColor.push((this.xSelected.length > 0 && this.xSelected.indexOf(yValue) < 0) ?
                    this.getColorSelected(xIndex) : this.getColorHover(xIndex));
                this.backgroundColor.push((this.xSelected.length > 0 && this.xSelected.indexOf(yValue) < 0) ?
                    this.getColorDeselected(xIndex) : this.getColorSelected(xIndex));

                this.borderColor.push(this.themeContrastColor);
                this.borderWidth.push(3);
                this.hoverBorderColor.push(this.themeOppositeColor);
                this.hoverBorderWidth.push(3);
            });
        });
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
     * Draws all the subcomponent elements with the given data and metadata.
     *
     * @arg {array} data
     * @arg {any} meta
     * @override
     */
    public draw(data: any[], meta: any) {
        meta.xList = [];
        const pieChartData = data.map((item) => {
            const pieSlice = {
                aggregation: item.y,
                color: item.color,
                group: '',
                x: item.x + ' (' + item.group + ')',
                y: item.x
            };
            if (meta.xList.indexOf(pieSlice.x) < 0) {
                meta.xList.push(pieSlice.x);
            }
            return pieSlice;
        });
        super.draw(pieChartData, meta);
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
    protected findItemInDataToSelect(items: any[], chart: Chart): any {
        return (chart.data.datasets[0] as ChartJsPieDataset).slices[items[0]._index];
    }

    /**
     * Finalizes and returns the given chart options.
     *
     * @arg {any} chartOptions
     * @arg {any} meta
     * @return {any}
     * @override
     */
    protected finalizeChartOptions(chartOptions: Chart.ChartOptions, meta: any): Chart.ChartOptions {
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

    /**
     * Returns the value to show in the tooltip from the given dataset with the given index.
     *
     * @arg {any} dataset
     * @arg {number} index
     * @return {any}
     * @override
     */
    protected retrieveTooltipValue(dataset: any, index: number): any {
        return dataset.aggregations[index];
    }
}
