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
import {
    AbstractChartJsDataset, AbstractChartJsSubcomponent, SelectMode,
    ChartData, ChartMetaData, ChartJsData
} from './subcomponent.chartjs.abstract';
import { AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { Color } from '../../models/color';

// http://www.chartjs.org/docs/latest/charts/doughnut.html#dataset-properties
export class ChartJsPieDataset extends AbstractChartJsDataset {
    public backgroundColor: string[] = [];
    public hoverBackgroundColor: string[] = [];
    public slices: any[] = [];

    constructor(elementRef: ElementRef, color: Color, label: string, xList: any[], public xSelected: any[]) {
        super(elementRef, color, label, xList);
    }

    public finalizeData() {
        Array.from(this.xToY.keys()).forEach((xValue, idx) => {
            let yList = this.xToY.get(xValue);

            (yList.length ? yList : [null]).forEach((yValue) => {
                this.hoverBackgroundColor.push(
                    (this.xSelected.length > 0 &&
                        this.xSelected.indexOf(xValue) < 0) ?
                        this.groupedColors[idx].getComputedCss(this.elementRef) :
                        this.groupedColors[idx].getComputedCssHoverColor(this.elementRef)
                );
                this.backgroundColor.push(
                    (this.xSelected.length > 0 &&
                        this.xSelected.indexOf(xValue) < 0) ?
                        this.groupedColors[idx].getComputedCssTransparencyHigh(this.elementRef) :
                        this.groupedColors[idx].getComputedCss(this.elementRef)
                );

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

    constructor(options: any, listener: AggregationSubcomponentListener, elementRef: ElementRef) {
        super(options, listener, elementRef, SelectMode.ITEM);
    }

    /**
     * Creates and returns the chart dataset object for the given color and label and array of X values.
     * @override
     */
    protected createChartDataset(color: Color, label: string, xList: any[]): AbstractChartJsDataset {
        return new ChartJsPieDataset(this.elementRef, color, label, xList, this.selectedLabels);
    }

    /**
     * Returns the type of the x-axis as date, number, or string.
     */
    protected findAxisTypeX(): string {
        return this.axisTypeX;
    }

    /**
     * Returns the type of the y-axis as date, number, or string.
     */
    protected findAxisTypeY(): string {
        return this.axisTypeY;
    }

    /**
     * Returns an item to select from the given items and chart.
     * @override
     */
    protected findItemInDataToSelect(items: any[], chart: Chart): any {
        return (chart.data.datasets[0] as ChartJsPieDataset)
            .slices[items[0]._index];
    }

    /**
     * Finalizes and returns the given chart options.
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
     * @override
     */
    protected getChartType(): string {
        return 'pie';
    }

    /**
     * Returns the label for a visualization element using the given count to determine plurality.
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Slice' + (count === 1 ? '' : 's');
    }

    protected createChartDataAndOptions(
        data: ChartData[],
        meta: ChartMetaData
    ): { data: ChartJsData, options: any } {
        data.forEach((el) => {
            el.group = 'pie';
        });
        return super.createChartDataAndOptions(data, meta);
    }
}
