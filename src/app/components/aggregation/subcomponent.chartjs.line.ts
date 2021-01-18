/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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

// http://www.chartjs.org/docs/latest/charts/line.html#dataset-properties
export class ChartJsLineDataset extends AbstractChartJsDataset {
    public backgroundColor: string;
    public borderColor: string;
    public borderWidth: number = 3;
    public fill: boolean = false;
    public lineTension: number = 0.3;
    public pointBackgroundColor: string;
    public pointBorderColor: string;
    public pointBorderWidth: number = 0;
    public pointHoverBackgroundColor: string;
    public pointHoverBorderColor: string;
    public pointHoverBorderWidth: number = 0;
    public pointStyle: string = 'circle';
    public showLine: boolean = true;

    public pointHoverRadius: number[] = [];
    public pointRadius: number[] = [];

    constructor(elementRef: ElementRef, color: Color, label: string, xList: any[]) {
        super(elementRef, color, label, xList);
        this.backgroundColor = this.getColorBackground();
        this.borderColor = this.getColorBackground();
        this.pointBackgroundColor = this.getColorBackground();
        this.pointBorderColor = this.getColorBackground();
        this.pointHoverBackgroundColor = this.getColorBackground();
        this.pointHoverBorderColor = this.getColorBackground();
    }

    public finalizeData() {
        Array.from(this.xToYToSize.keys()).forEach((xValue) => {
            let yList = Array.from(this.xToYToSize.get(xValue).keys());
            (yList.length ? yList : [null]).forEach((yValue) => {
                let pointAggregation = this.xToYToSize.get(xValue).get(yValue);
                // Add the corresponding aggregation to the point data.
                this.data.push({
                    aggregation: pointAggregation,
                    x: xValue,
                    y: yValue
                });
                // Adjust the point radius based on its aggregation and the maximum aggregation.
                let pointRadius = 2 + (!this.maximumAggregation ? 2 :
                    ((Math.log(pointAggregation) / Math.log(this.maximumAggregation)) * 18.0));
                this.pointRadius.push(pointRadius);
                this.pointHoverRadius.push(pointRadius * 1.5);
            });
        });
        // Remove all the points with null Y values so the line connects the points.
        this.data = this.data.filter((item) => item.y !== null);
    }
}

export class ChartJsLineSubcomponent extends AbstractChartJsSubcomponent {
    /**
     * @constructor
     * @arg {any} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     * @arg {string} [textColorHex]
     * @arg {boolean} [selectMode=DOMAIN]
     */
    constructor(options: any, listener: AggregationSubcomponentListener, elementRef: ElementRef,
        textColorHex?: string, selectMode: SelectMode = SelectMode.DOMAIN) {
        super(options, listener, elementRef, textColorHex, selectMode, true);
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
        let dataset = new ChartJsLineDataset(this.elementRef, color, label, xList);
        dataset.fill = this.options.lineFillArea || dataset.fill;
        dataset.lineTension = this.options.lineCurveTension === 0 ? 0 : (this.options.lineCurveTension || dataset.lineTension);
        return dataset;
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
        // ChartJs does not support a time y-axis (only the x-axis).
        chartOptions.scales.xAxes[0].type = (meta.xAxis === 'number' ? (this.options.logScaleX && meta.dataLength > 10 ? 'logarithmic' :
            'linear') : (meta.xAxis === 'date' ? 'time' : 'category'));
        chartOptions.scales.yAxes[0].type = (meta.yAxis === 'number' ? (this.options.logScaleY && meta.dataLength > 10 ? 'logarithmic' :
            'linear') : 'category');
        return chartOptions;
    }

    /**
     * Returns the ChartJs chart type.
     *
     * @return {string}
     * @override
     */
    protected getChartType(): string {
        return 'line';
    }

    /**
     * Returns the label for a visualization element using the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Line' + (count === 1 ? '' : 's');
    }
}
