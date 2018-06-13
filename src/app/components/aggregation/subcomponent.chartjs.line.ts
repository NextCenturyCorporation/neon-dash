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
import { AbstractChartJsSubcomponent, ChartJsData, ChartJsDataset } from './subcomponent.chartjs.abstract';
import { Color } from '../../services/color-scheme.service';

// http://www.chartjs.org/docs/latest/charts/line.html#dataset-properties
export class ChartJsLineDataset extends ChartJsDataset {
    public backgroundColor: string;
    public borderColor: string;
    public borderWidth: number = 3;
    public fill: boolean = false;
    public lineTension: number = 0.3;
    public pointBackgroundColor: string;
    public pointBorderColor: string;
    public pointBorderWidth: number = 0;
    public pointHitRadius: number = 3;
    public pointHoverBackgroundColor: string;
    public pointHoverBorderColor: string;
    public pointHoverBorderWidth: number = 0;
    public pointHoverRadius: number = 6;
    public pointRadius: number = 3;
    public pointStyle: string = 'circle';
    public showLine: boolean = true;

    constructor(color: Color, label: string, xList: any[]) {
        super(color, label, xList);
        this.backgroundColor = this.getColorBackground();
        this.borderColor = this.getColorSelected();
        this.pointBackgroundColor = this.getColorSelected();
        this.pointBorderColor = this.getColorSelected();
        this.pointHoverBackgroundColor = this.getColorSelected();
        this.pointHoverBorderColor = this.getColorSelected();
    }

    public finalizeData() {
        Array.from(this.xToY.keys()).forEach((x) => {
            let yList = this.xToY.get(x);
            (yList.length ? yList : [null]).forEach((y) => {
                this.data.push({
                    x: x,
                    y: y
                });
            });
        });
    }
}

export class ChartJsLineSubcomponent extends AbstractChartJsSubcomponent {
    /**
     * Creates and returns the chart dataset object for the given color and label and array of X values.
     *
     * @arg {Color} color
     * @arg {string} label
     * @arg {any[]} xList
     * @return {ChartJsDataset}
     * @override
     */
    protected createChartDataset(color: Color, label: string, xList: any[]): ChartJsDataset {
        let dataset = new ChartJsLineDataset(color, label, xList);
        dataset.fill = this.options.lineFillArea || dataset.fill;
        dataset.lineTension = this.options.lineCurveTension || dataset.lineTension;
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
    protected finalizeChartOptions(chartOptions: any, meta: any): any {
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
     * Handles the given hover event as needed by this subcomponent.
     *
     * @arg {event} event
     * @arg {any[]} items
     * @arg {any} chart
     * @override
     */
    protected handleHoverEvent(event, items: any[], chart: any) {
        this.selectDomain(event, items, chart);
    }
}
