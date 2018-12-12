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
import { AbstractChartJsDataset } from './subcomponent.chartjs.abstract';
import { AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { ChartJsLineSubcomponent, ChartJsLineDataset } from './subcomponent.chartjs.line';
import { Color } from '../../color';

// http://www.chartjs.org/docs/latest/charts/line.html#dataset-properties
class ChartJsScatterDataset extends ChartJsLineDataset {
    constructor(elementRef: ElementRef, color: Color, label: string, xList: any[]) {
        super(elementRef, color, label, xList);
        this.fill = false;
        this.showLine = false;
    }
}

export class ChartJsScatterSubcomponent extends ChartJsLineSubcomponent {
    /**
     * @constructor
     * @arg {any} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     * @arg {boolean} [cannotSelect=false]
     * @arg {boolean} [domainOnly=false]
     */
    constructor(options: any, listener: AggregationSubcomponentListener, elementRef: ElementRef, cannotSelect: boolean = false,
        private domainOnly: boolean = false) {

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
        return new ChartJsScatterDataset(this.elementRef, color, label, xList);
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
        let superclassOptions = super.finalizeChartOptions(chartOptions, meta);
        superclassOptions.hover.mode = 'point';
        superclassOptions.tooltips.mode = 'point';
        return superclassOptions;
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
        if (this.isSelectable(items)) {
            this.selectBounds(event, items, chart, this.domainOnly);
        }
    }

    /**
     * Returns whether the location of the chart with the given items is selectable.
     *
     * @arg {any[]} items
     * @return {boolean}
     * @override
     */
    protected isSelectable(items: any[]): boolean {
        // Ignore whether any items exist at the location of the hover event.
        return !this.cannotSelect;
    }
}
