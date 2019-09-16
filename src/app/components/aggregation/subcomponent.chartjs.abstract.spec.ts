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

'use strict';

import { AbstractChartJsDataset, AbstractChartJsSubcomponent } from './subcomponent.chartjs.abstract';
import { AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { Color } from '../../library/core/models/color';
import { ElementRef } from '@angular/core';

class TestAggregationSubcomponentListener implements AggregationSubcomponentListener {
    getHiddenCanvas(): ElementRef {
        return null;
    }

    subcomponentRequestsDeselect() {
        // Do nothing.
    }

    subcomponentRequestsFilter(__group: string, __value: any, __doNotReplace?: boolean) {
        // Do nothing.
    }

    subcomponentRequestsFilterOnBounds(__beginX: any, __beginY: any, __endX: any, __endY: any, __doNotReplace?: boolean) {
        // Do nothing.
    }

    subcomponentRequestsFilterOnDomain(__beginX: any, __endX: any, __doNotReplace?: boolean) {
        // Do nothing.
    }

    subcomponentRequestsRedraw(__event?) {
        // Do nothing.
    }

    subcomponentRequestsSelect(__x: number, __y: number, __width: number, __height: number) {
        // Do nothing.
    }
}

class TestChartJsDataset extends AbstractChartJsDataset {
    public finalizeData() {
        Array.from(this.xToY.keys()).forEach((xValue) => {
            let yList = this.xToY.get(xValue);
            (yList.length ? yList : [null]).forEach((yValue) => {
                this.data.push({
                    x: xValue,
                    y: yValue
                });
            });
        });
    }
}

class TestChartJsSubcomponent extends AbstractChartJsSubcomponent {
    public axisTypeX: string = 'string';
    public axisTypeY: string = 'string';
    public horizontal: boolean = false;

    protected createChartDataset(color: Color, label: string, xList: any[]): AbstractChartJsDataset {
        return new TestChartJsDataset(this.elementRef, color, label, xList);
    }

    protected findAxisTypeX(): string {
        return this.axisTypeX;
    }

    protected findAxisTypeY(): string {
        return this.axisTypeY;
    }

    protected finalizeChartOptions(chartOptions: any, __meta: any): any {
        chartOptions.test = true;
        return chartOptions;
    }

    protected getChartType(): string {
        return 'testType';
    }

    public getChartDataAndOptions(data: any[], meta: any) {
        return this.createChartDataAndOptions(data, meta);
    }

    public getVisualizationElementLabel(count: number): string {
        return 'Foobar' + (count === 1 ? '' : 's');
    }

    public getSelectedLabels() {
        return this.selectedLabels;
    }

    public isHorizontal(): boolean {
        return this.horizontal;
    }
}

describe('ChartJsSubcomponent', () => {
    let listener;
    let subcomponent;

    beforeEach(() => {
        listener = new TestAggregationSubcomponentListener();
        subcomponent = new TestChartJsSubcomponent({}, listener, null);
    });

    it('createChartDataAndOptions does return expected object', () => {
        let dataAndOptions = subcomponent.getChartDataAndOptions([{
            color: Color.fromRgb(1, 2, 3),
            group: 'a',
            x: 1,
            y: 2
        }, {
            color: Color.fromRgb(1, 2, 3),
            group: 'a',
            x: 3,
            y: 4
        }, {
            color: Color.fromRgb(4, 5, 6),
            group: 'b',
            x: 5,
            y: 6
        }, {
            color: Color.fromRgb(4, 5, 6),
            group: 'b',
            x: 7,
            y: 8
        }], {
            xAxis: 'number',
            xList: [1, 3, 5, 7],
            yAxis: 'number',
            yList: [2, 4, 6, 8]
        });

        expect(dataAndOptions.options.animation.duration).toEqual(0);
        expect(dataAndOptions.options.events).toEqual(['click',
            'mousemove',
            'mouseover',
            'mouseout',
            'touchend',
            'touchmove',
            'touchstart']);
        expect(dataAndOptions.options.hover.intersect).toEqual(false);
        expect(dataAndOptions.options.hover.mode).toEqual('index');
        expect(dataAndOptions.options.hover.onHover).toBeDefined();
        expect(dataAndOptions.options.legend.display).toEqual(false);
        expect(dataAndOptions.options.maintainAspectRatio).toEqual(false);
        expect(dataAndOptions.options.onClick).toBeDefined();
        expect(dataAndOptions.options.scales.xAxes[0].afterTickToLabelConversion).toBeDefined();
        expect(dataAndOptions.options.scales.xAxes[0].afterFit).toBeDefined();
        expect(dataAndOptions.options.scales.xAxes[0].gridLines.display).toEqual(true);
        expect(dataAndOptions.options.scales.xAxes[0].labels).toEqual([1, 3, 5, 7]);
        expect(dataAndOptions.options.scales.xAxes[0].position).toEqual('bottom');
        expect(dataAndOptions.options.scales.xAxes[0].ticks.display).toEqual(true);
        expect(dataAndOptions.options.scales.xAxes[0].ticks.maxRotation).toEqual(0);
        expect(dataAndOptions.options.scales.xAxes[0].ticks.minRotation).toEqual(0);
        expect(dataAndOptions.options.scales.xAxes[0].ticks.callback).toBeDefined();
        expect(dataAndOptions.options.scales.xAxes[0].type).toEqual('category');
        expect(dataAndOptions.options.scales.yAxes[0].afterTickToLabelConversion).toBeDefined();
        expect(dataAndOptions.options.scales.yAxes[0].afterFit).toBeDefined();
        expect(dataAndOptions.options.scales.yAxes[0].gridLines.display).toEqual(true);
        expect(dataAndOptions.options.scales.yAxes[0].labels).toEqual([2, 4, 6, 8]);
        expect(dataAndOptions.options.scales.yAxes[0].position).toEqual('left');
        expect(dataAndOptions.options.scales.yAxes[0].ticks.display).toEqual(true);
        expect(dataAndOptions.options.scales.yAxes[0].ticks.maxRotation).toEqual(0);
        expect(dataAndOptions.options.scales.yAxes[0].ticks.minRotation).toEqual(0);
        expect(dataAndOptions.options.scales.yAxes[0].ticks.callback).toBeDefined();
        expect(dataAndOptions.options.scales.yAxes[0].type).toEqual('category');
        expect(dataAndOptions.options.test).toEqual(true);
        expect(dataAndOptions.options.tooltips.intersect).toEqual(false);
        expect(dataAndOptions.options.tooltips.mode).toEqual('index');
        expect(dataAndOptions.options.tooltips.position).toEqual('nearest');
        expect(dataAndOptions.options.tooltips.callbacks.label).toBeDefined();
        expect(dataAndOptions.options.tooltips.callbacks.title).toBeDefined();

        expect(dataAndOptions.data.datasets[0].color).toEqual(Color.fromRgb(1, 2, 3));
        expect(dataAndOptions.data.datasets[0].label).toEqual('a');
        expect(dataAndOptions.data.datasets[0].data).toEqual([{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }, {
            x: 5,
            y: null
        }, {
            x: 7,
            y: null
        }]);

        expect(dataAndOptions.data.datasets[1].color).toEqual(Color.fromRgb(4, 5, 6));
        expect(dataAndOptions.data.datasets[1].label).toEqual('b');
        expect(dataAndOptions.data.datasets[1].data).toEqual([{
            x: 1,
            y: null
        }, {
            x: 3,
            y: null
        }, {
            x: 5,
            y: 6
        }, {
            x: 7,
            y: 8
        }]);

        expect(dataAndOptions.data.labels).toEqual([1, 3, 5, 7]);
    });

    it('createChartDataAndOptions with config does return expected object', () => {
        subcomponent.options.hideGridLines = true;
        subcomponent.options.hideGridTicks = true;
        subcomponent.options.scaleMaxX = 4;
        subcomponent.options.scaleMaxY = 3;
        subcomponent.options.scaleMinX = 2;
        subcomponent.options.scaleMinY = 1;
        subcomponent.horizontal = true;

        let dataAndOptions = subcomponent.getChartDataAndOptions([{
            color: Color.fromRgb(1, 2, 3),
            group: 'a',
            x: 1,
            y: 2
        }, {
            color: Color.fromRgb(1, 2, 3),
            group: 'a',
            x: 3,
            y: 4
        }, {
            color: Color.fromRgb(4, 5, 6),
            group: 'b',
            x: 5,
            y: 6
        }, {
            color: Color.fromRgb(4, 5, 6),
            group: 'b',
            x: 7,
            y: 8
        }], {
            xAxis: 'number',
            xList: [1, 3, 5, 7],
            yAxis: 'number',
            yList: [2, 4, 6, 8]
        });

        expect(dataAndOptions.options.animation.duration).toEqual(0);
        expect(dataAndOptions.options.events).toEqual(['click',
            'mousemove',
            'mouseover',
            'mouseout',
            'touchend',
            'touchmove',
            'touchstart']);
        expect(dataAndOptions.options.hover.intersect).toEqual(false);
        expect(dataAndOptions.options.hover.mode).toEqual('index');
        expect(dataAndOptions.options.hover.onHover).toBeDefined();
        expect(dataAndOptions.options.legend.display).toEqual(false);
        expect(dataAndOptions.options.maintainAspectRatio).toEqual(false);
        expect(dataAndOptions.options.onClick).toBeDefined();
        expect(dataAndOptions.options.scales.xAxes[0].afterTickToLabelConversion).toBeDefined();
        expect(dataAndOptions.options.scales.xAxes[0].afterFit).toBeDefined();
        expect(dataAndOptions.options.scales.xAxes[0].gridLines.display).toEqual(false);
        expect(dataAndOptions.options.scales.xAxes[0].labels).toEqual([2, 4, 6, 8]);
        expect(dataAndOptions.options.scales.xAxes[0].position).toEqual('bottom');
        expect(dataAndOptions.options.scales.xAxes[0].ticks.display).toEqual(false);
        expect(dataAndOptions.options.scales.xAxes[0].ticks.maxRotation).toEqual(0);
        expect(dataAndOptions.options.scales.xAxes[0].ticks.max).toEqual(4);
        expect(dataAndOptions.options.scales.xAxes[0].ticks.minRotation).toEqual(0);
        expect(dataAndOptions.options.scales.xAxes[0].ticks.min).toEqual(2);
        expect(dataAndOptions.options.scales.xAxes[0].ticks.callback).toBeDefined();
        expect(dataAndOptions.options.scales.xAxes[0].type).toEqual('category');
        expect(dataAndOptions.options.scales.yAxes[0].afterTickToLabelConversion).toBeDefined();
        expect(dataAndOptions.options.scales.yAxes[0].afterFit).toBeDefined();
        expect(dataAndOptions.options.scales.yAxes[0].gridLines.display).toEqual(false);
        expect(dataAndOptions.options.scales.yAxes[0].labels).toEqual([1, 3, 5, 7]);
        expect(dataAndOptions.options.scales.yAxes[0].position).toEqual('left');
        expect(dataAndOptions.options.scales.yAxes[0].ticks.display).toEqual(false);
        expect(dataAndOptions.options.scales.yAxes[0].ticks.maxRotation).toEqual(0);
        expect(dataAndOptions.options.scales.yAxes[0].ticks.max).toEqual(3);
        expect(dataAndOptions.options.scales.yAxes[0].ticks.minRotation).toEqual(0);
        expect(dataAndOptions.options.scales.yAxes[0].ticks.min).toEqual(1);
        expect(dataAndOptions.options.scales.yAxes[0].ticks.callback).toBeDefined();
        expect(dataAndOptions.options.scales.yAxes[0].type).toEqual('category');
        expect(dataAndOptions.options.test).toEqual(true);
        expect(dataAndOptions.options.tooltips.intersect).toEqual(false);
        expect(dataAndOptions.options.tooltips.mode).toEqual('index');
        expect(dataAndOptions.options.tooltips.position).toEqual('nearest');
        expect(dataAndOptions.options.tooltips.callbacks.label).toBeDefined();
        expect(dataAndOptions.options.tooltips.callbacks.title).toBeDefined();

        expect(dataAndOptions.data.labels).toEqual([2, 4, 6, 8]);
    });

    it('selectBounds with button down does select area', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnBounds');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 300,
                left: 5,
                right: 300
            }
        };

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20
        }, [], chart);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([10, 20, 0, 0]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
        expect(spy4.calls.count()).toEqual(1);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('multiple calls to selectBounds with button down does select bigger area', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnBounds');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 300,
                left: 5,
                right: 300
            }
        };

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 100,
            offsetY: 200
        }, [], chart);

        expect(spy1.calls.count()).toEqual(3);
        expect(spy1.calls.argsFor(2)).toEqual([10, 20, 90, 180]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
        expect(spy4.calls.count()).toEqual(3);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('selectBounds with button down does create expected filter', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnBounds');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 300,
                left: 5,
                right: 300
            },
            data: {
                datasets: [{
                    data: [{
                        x: 'A',
                        y: 'E'
                    }, {
                        x: 'B',
                        y: 'F'
                    }, {
                        x: 'C',
                        y: 'G'
                    }, {
                        x: 'D',
                        y: 'H'
                    }]
                }]
            },
            scales: {
                'x-axis-0': {
                    getValueForPixel: (pixel) => pixel === 10 ? 1 : 2
                },
                'y-axis-0': {
                    getValueForPixel: (pixel) => pixel === 20 ? 1 : 2
                }
            }
        };

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 100,
            offsetY: 200
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 0
        }, [], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0)).toEqual(['B', 'F', 'C', 'G']);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('selectBounds with reversed movement does create expected filter', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnBounds');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 300,
                left: 5,
                right: 300
            },
            data: {
                datasets: [{
                    data: [{
                        x: 'A',
                        y: 'E'
                    }, {
                        x: 'B',
                        y: 'F'
                    }, {
                        x: 'C',
                        y: 'G'
                    }, {
                        x: 'D',
                        y: 'H'
                    }]
                }]
            },
            scales: {
                'x-axis-0': {
                    getValueForPixel: (pixel) => pixel === 10 ? 1 : 2
                },
                'y-axis-0': {
                    getValueForPixel: (pixel) => pixel === 20 ? 1 : 2
                }
            }
        };

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 100,
            offsetY: 200
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 0
        }, [], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0).sort()).toEqual(['B', 'C', 'F', 'G']);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('selectBounds with time axis does create expected filter', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnBounds');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        subcomponent.axisTypeX = 'date';

        let chart = {
            chartArea: {
                top: 5,
                bottom: 300,
                left: 5,
                right: 300
            },
            data: {
                datasets: [{
                    data: [{
                        y: 'E'
                    }, {
                        y: 'F'
                    }, {
                        y: 'G'
                    }, {
                        y: 'H'
                    }]
                }]
            },
            scales: {
                'x-axis-0': {
                    getValueForPixel: (pixel) => pixel === 10 ? new Date('2018-01-02T00:00:00.000Z').getTime() :
                        new Date('2018-01-03T00:00:00.000Z').getTime()
                },
                'y-axis-0': {
                    getValueForPixel: (pixel) => pixel === 20 ? 1 : 2
                }
            }
        };

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 100,
            offsetY: 200
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 0
        }, [], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0)).toEqual([new Date('2018-01-02T00:00:00.000Z'), 'F', new Date('2018-01-03T00:00:00.000Z'), 'G']);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('selectBounds with number axes does create expected filter', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnBounds');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        subcomponent.axisTypeX = 'number';
        subcomponent.axisTypeY = 'number';

        let chart = {
            chartArea: {
                top: 5,
                bottom: 300,
                left: 5,
                right: 300
            },
            scales: {
                'x-axis-0': {
                    getValueForPixel: (pixel) => pixel === 10 ? 1234 : 5678
                },
                'y-axis-0': {
                    getValueForPixel: (pixel) => pixel === 20 ? 4321 : 8765
                }
            }
        };

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 100,
            offsetY: 200
        }, [], chart);

        (subcomponent).selectBounds({
            buttons: 0
        }, [], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0)).toEqual([1234, 4321, 5678, 8765]);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('selectBounds with items does update selectedLabels', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnBounds');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 300,
                left: 5,
                right: 300
            }
        };

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20
        }, [{
            _model: {
                label: 'B'
            }
        }], chart);

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 100,
            offsetY: 200
        }, [{
            _model: {
                label: 'C'
            }
        }], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual(['B', 'C']);
    });

    it('selectBounds with domainOnly=true does create expected filter', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnDomain');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');
        let spy5 = spyOn(listener, 'subcomponentRequestsFilterOnBounds');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 300,
                left: 5,
                right: 300
            },
            data: {
                datasets: [{
                    data: [{
                        x: 'A',
                        y: 'E'
                    }, {
                        x: 'B',
                        y: 'F'
                    }, {
                        x: 'C',
                        y: 'G'
                    }, {
                        x: 'D',
                        y: 'H'
                    }]
                }]
            },
            scales: {
                'x-axis-0': {
                    getValueForPixel: (pixel) => pixel === 10 ? 1 : 2
                },
                'y-axis-0': {
                    getValueForPixel: (pixel) => pixel === 20 ? 1 : 2
                }
            }
        };

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20
        }, [], chart, true);

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 100,
            offsetY: 200
        }, [], chart, true);

        (subcomponent).selectBounds({
            buttons: 0
        }, [], chart, true);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0)).toEqual(['B', 'C']);
        expect(spy4.calls.count()).toEqual(2);
        expect(spy5.calls.count()).toEqual(0);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('selectBounds with mouseover event and button down does ignore', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnBounds');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 300,
                left: 5,
                right: 300
            }
        };

        (subcomponent).selectBounds({
            buttons: 1,
            offsetX: 10,
            offsetY: 20,
            type: 'mouseover'
        }, [], chart);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
        expect(spy4.calls.count()).toEqual(0);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('selectDomain with button down does select area', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnDomain');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 50
            }
        };

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 1,
            _model: {
                label: 'B',
                x: 10
            }
        }], chart);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([5, 5, 10, 45]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
        expect(spy4.calls.count()).toEqual(1);
        expect(subcomponent.getSelectedLabels()).toEqual(['B']);
    });

    it('multiple calls to selectDomain with button down does select bigger area', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnDomain');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 50
            }
        };

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 1,
            _model: {
                label: 'B',
                x: 10
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 1,
            _model: {
                label: 'B',
                x: 15
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 2,
            _model: {
                label: 'C',
                x: 20
            }
        }], chart);

        expect(spy1.calls.count()).toEqual(3);
        expect(spy1.calls.argsFor(2)).toEqual([5, 5, 20, 45]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
        expect(spy4.calls.count()).toEqual(3);
        expect(subcomponent.getSelectedLabels()).toEqual(['B', 'C']);
    });

    it('selectDomain with button down does create expected filter', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnDomain');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 50
            },
            data: {
                datasets: [{
                    data: [{
                        x: 'A'
                    }, {
                        x: 'B'
                    }, {
                        x: 'C'
                    }, {
                        x: 'D'
                    }]
                }]
            }
        };

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 1,
            _model: {
                label: 'B',
                x: 10
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 2,
            _model: {
                label: 'C',
                x: 20
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 0
        }, [], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0)).toEqual(['B', 'C']);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual(['B', 'C']);
    });

    it('selectDomain with reversed movement does create expected filter', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnDomain');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 50
            },
            data: {
                datasets: [{
                    data: [{
                        x: 'A'
                    }, {
                        x: 'B'
                    }, {
                        x: 'C'
                    }, {
                        x: 'D'
                    }]
                }]
            }
        };

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 2,
            _model: {
                label: 'C',
                x: 20
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 1,
            _model: {
                label: 'B',
                x: 10
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 0
        }, [], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0)).toEqual(['B', 'C']);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual(['C', 'B']);
    });

    it('selectDomain with time axis does create expected filter', () => {
        subcomponent.options.granularity = 'day';
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnDomain');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        subcomponent.axisTypeX = 'date';

        let chart = {
            chartArea: {
                top: 5,
                bottom: 50
            },
            data: {
                datasets: [{
                    data: [{
                        x: '2018-01-01T00:00:00.000Z'
                    }, {
                        x: '2018-01-02T00:00:00.000Z'
                    }, {
                        x: '2018-01-03T00:00:00.000Z'
                    }, {
                        x: '2018-01-04T00:00:00.000Z'
                    }]
                }]
            }
        };

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 1,
            _model: {
                label: '2018-01-02T00:00:00.000Z',
                x: 10
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 2,
            _model: {
                label: '2018-01-03T00:00:00.000Z',
                x: 20
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 0
        }, [], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0)).toEqual([new Date('2018-01-02T00:00:00.000Z'), new Date('2018-01-03T23:59:59.000Z')]);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual(['2018-01-02T00:00:00.000Z', '2018-01-03T00:00:00.000Z']);
    });

    it('selectDomain with number axis does create expected filter', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnDomain');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        subcomponent.axisTypeX = 'number';

        let chart = {
            chartArea: {
                top: 5,
                bottom: 50
            },
            // GetLabelForIndex: (index) => {
            data: {
                datasets: [{
                    data: [{
                        x: '0'
                    }, {
                        x: '1,234'
                    }, {
                        x: '5,678,901'
                    }, {
                        x: '100,000,000'
                    }]
                }]
            }
        };

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 1,
            _model: {
                label: '1,234',
                x: 10
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 2,
            _model: {
                label: '5,678,901',
                x: 20
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 0
        }, [], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0)).toEqual([1234, 5678901]);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual(['1,234', '5,678,901']);
    });

    it('selectDomain with cancel button down does deselect', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnDomain');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 50
            }
        };

        (subcomponent).selectDomain({
            buttons: 1
        }, [{
            _index: 1,
            _model: {
                label: 'B',
                x: 10
            }
        }], chart);

        (subcomponent).selectDomain({
            buttons: 2
        }, [{
            _index: 2,
            _model: {
                label: 'C',
                x: 20
            }
        }], chart);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy3.calls.count()).toEqual(0);
        expect(spy4.calls.count()).toEqual(2);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('selectDomain with mouseover event and button down does ignore', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsSelect');
        let spy2 = spyOn(listener, 'subcomponentRequestsDeselect');
        let spy3 = spyOn(listener, 'subcomponentRequestsFilterOnDomain');
        let spy4 = spyOn(listener, 'subcomponentRequestsRedraw');

        let chart = {
            chartArea: {
                top: 5,
                bottom: 50
            }
        };

        (subcomponent).selectDomain({
            buttons: 1,
            type: 'mouseover'
        }, [{
            _index: 1,
            _model: {
                label: 'B',
                x: 10
            }
        }], chart);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
        expect(spy4.calls.count()).toEqual(0);
        expect(subcomponent.getSelectedLabels()).toEqual([]);
    });

    it('selectItem does select item', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsFilter');

        let chart = {
            data: {
                datasets: [{
                    label: 'a',
                    data: [{
                        x: 1,
                        y: 2
                    }]
                }]
            }
        };

        let item1 = {
            _datasetIndex: 0,
            _index: 0
        };

        (subcomponent).selectItem({}, [item1], chart);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual(['a', 1, false]);
        expect(subcomponent.getSelectedLabels()).toEqual([1]);
    });

    it('selectItem does replace existing selectedLabels', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsFilter');

        let chart = {
            data: {
                datasets: [{
                    label: 'a',
                    data: [{
                        x: 1,
                        y: 2
                    }, {
                        x: 3,
                        y: 4
                    }]
                }, {
                    label: 'b',
                    data: [{
                        x: 5,
                        y: 6
                    }, {
                        x: 7,
                        y: 8
                    }]
                }]
            }
        };

        let item1 = {
            _datasetIndex: 0,
            _index: 0
        };

        let item2 = {
            _datasetIndex: 0,
            _index: 1
        };

        let item3 = {
            _datasetIndex: 1,
            _index: 0
        };

        let item4 = {
            _datasetIndex: 1,
            _index: 1
        };

        (subcomponent).selectItem({}, [item1], chart);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual(['a', 1, false]);
        expect(subcomponent.getSelectedLabels()).toEqual([1]);

        (subcomponent).selectItem({}, [item2], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual(['a', 3, false]);
        expect(subcomponent.getSelectedLabels()).toEqual([3]);

        (subcomponent).selectItem({}, [item3], chart);

        expect(spy1.calls.count()).toEqual(3);
        expect(spy1.calls.argsFor(2)).toEqual(['b', 5, false]);
        expect(subcomponent.getSelectedLabels()).toEqual([5]);

        (subcomponent).selectItem({}, [item4], chart);

        expect(spy1.calls.count()).toEqual(4);
        expect(spy1.calls.argsFor(3)).toEqual(['b', 7, false]);
        expect(subcomponent.getSelectedLabels()).toEqual([7]);
    });

    it('selectItem with ctrlKey or metaKey does add to existing selectedLabels', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsFilter');

        let chart = {
            data: {
                datasets: [{
                    label: 'a',
                    data: [{
                        x: 1,
                        y: 2
                    }, {
                        x: 3,
                        y: 4
                    }]
                }, {
                    label: 'b',
                    data: [{
                        x: 5,
                        y: 6
                    }, {
                        x: 7,
                        y: 8
                    }]
                }]
            }
        };

        let item1 = {
            _datasetIndex: 0,
            _index: 0
        };

        let item2 = {
            _datasetIndex: 0,
            _index: 1
        };

        let item3 = {
            _datasetIndex: 1,
            _index: 0
        };

        let item4 = {
            _datasetIndex: 1,
            _index: 1
        };

        (subcomponent).selectItem({
            ctrlKey: true
        }, [item1], chart);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual(['a', 1, true]);
        expect(subcomponent.getSelectedLabels()).toEqual([1]);

        (subcomponent).selectItem({
            ctrlKey: true
        }, [item2], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual(['a', 3, true]);
        expect(subcomponent.getSelectedLabels()).toEqual([1, 3]);

        (subcomponent).selectItem({
            metaKey: true
        }, [item3], chart);

        expect(spy1.calls.count()).toEqual(3);
        expect(spy1.calls.argsFor(2)).toEqual(['b', 5, true]);
        expect(subcomponent.getSelectedLabels()).toEqual([1, 3, 5]);

        (subcomponent).selectItem({
            metaKey: true
        }, [item4], chart);

        expect(spy1.calls.count()).toEqual(4);
        expect(spy1.calls.argsFor(3)).toEqual(['b', 7, true]);
        expect(subcomponent.getSelectedLabels()).toEqual([1, 3, 5, 7]);
    });

    it('selectItem does select expected items if horizontal', () => {
        let spy1 = spyOn(listener, 'subcomponentRequestsFilter');

        subcomponent.horizontal = true;

        let chart = {
            data: {
                datasets: [{
                    label: 'a',
                    data: [{
                        x: 1,
                        y: 2
                    }, {
                        x: 3,
                        y: 4
                    }]
                }, {
                    label: 'b',
                    data: [{
                        x: 5,
                        y: 6
                    }, {
                        x: 7,
                        y: 8
                    }]
                }]
            }
        };

        let item1 = {
            _datasetIndex: 0,
            _index: 0
        };

        let item2 = {
            _datasetIndex: 0,
            _index: 1
        };

        let item3 = {
            _datasetIndex: 1,
            _index: 0
        };

        let item4 = {
            _datasetIndex: 1,
            _index: 1
        };

        (subcomponent).selectItem({}, [item1], chart);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual(['a', 2, false]);
        expect(subcomponent.getSelectedLabels()).toEqual([2]);

        (subcomponent).selectItem({}, [item2], chart);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual(['a', 4, false]);
        expect(subcomponent.getSelectedLabels()).toEqual([4]);

        (subcomponent).selectItem({}, [item3], chart);

        expect(spy1.calls.count()).toEqual(3);
        expect(spy1.calls.argsFor(2)).toEqual(['b', 6, false]);
        expect(subcomponent.getSelectedLabels()).toEqual([6]);

        (subcomponent).selectItem({}, [item4], chart);

        expect(spy1.calls.count()).toEqual(4);
        expect(spy1.calls.argsFor(3)).toEqual(['b', 8, false]);
        expect(subcomponent.getSelectedLabels()).toEqual([8]);
    });
});
