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
import { AggregationOptions } from './aggregation.component';
import { AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { Color } from '../../color';

import * as _ from 'lodash';

// http://www.chartjs.org/docs/latest/charts/doughnut.html#dataset-properties
export class ChartJsPieDataset extends AbstractChartJsDataset {
    public backgroundColor: string[] = [];
    public borderColor: string;
    public borderWidth: number = 3;
    public hoverBackgroundColor: string;
    public hoverBorderColor: string;
    public hoverBorderWidth: number = 3;
    public slices: any[] = [];

    constructor(color: Color, label: string, xList: any[], public xSelected: any[]) {
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
                this.slices.push(x);
                this.data.push(y);
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
     * @arg {AggregationOptions} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     * @arg {boolean} [cannotSelect=false]
     */
    constructor(options: AggregationOptions, listener: AggregationSubcomponentListener, elementRef: ElementRef,
        cannotSelect: boolean = false) {

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
        return new ChartJsPieDataset(color, label, xList, this.selectedLabels);
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
}
