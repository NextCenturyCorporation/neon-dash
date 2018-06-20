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
import { AggregationOptions } from './aggregation.component';
import { AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { ChartJsBarSubcomponent, ChartJsBarDataset } from './subcomponent.chartjs.bar';
import { Color } from '../../services/color-scheme.service';

export class ChartJsHistogramSubcomponent extends ChartJsBarSubcomponent {
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
     * Finalizes and returns the given chart options.
     *
     * @arg {any} chartOptions
     * @arg {any} meta
     * @return {any}
     * @override
     */
    protected finalizeChartOptions(chartOptions: any, meta: any): any {
        let superclassOptions = super.finalizeChartOptions(chartOptions, meta);
        superclassOptions.scales.xAxes[0].barPercentage = 1.0;
        superclassOptions.scales.yAxes[0].barPercentage = 1.0;
        superclassOptions.scales.xAxes[0].categoryPercentage = 1.0;
        superclassOptions.scales.yAxes[0].categoryPercentage = 1.0;
        return chartOptions;
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
        // Do nothing.
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
