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
import { AbstractChartJsDataset, SelectMode } from './subcomponent.chartjs.abstract';
import { AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { ChartJsBarSubcomponent } from './subcomponent.chartjs.bar';
import { Color } from 'component-library/dist/core/models/color';

export class ChartJsHistogramSubcomponent extends ChartJsBarSubcomponent {
    /**
     * @constructor
     * @arg {any} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     * @arg {string} [textColorHex]
     * @arg {boolean} [horizontal=false]
     */
    constructor(options: any, listener: AggregationSubcomponentListener, elementRef: ElementRef, textColorHex?: string,
        protected horizontal: boolean = false) {
        super(options, listener, elementRef, textColorHex, horizontal, SelectMode.DOMAIN);
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
        let dataset = super.createChartDataset(color, label, xList);
        (dataset as any).barPercentage = 0.98;
        (dataset as any).categoryPercentage = 0.98;
        return dataset;
    }

    /**
     * Returns the width of the given chart element.
     *
     * @arg {any} item
     * @return {number}
     */
    protected findChartElementWidth(item: any): number {
        return item._model.width || super.findChartElementWidth(item);
    }

    /**
     * Returns the label for a visualization element using the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Bin' + (count === 1 ? '' : 's');
    }
}
