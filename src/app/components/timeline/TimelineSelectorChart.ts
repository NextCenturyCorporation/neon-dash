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
import * as _ from 'lodash';
import { ElementRef } from '@angular/core';
import { TimelineComponent } from './timeline.component';
import { Bucketizer } from '../bucketizers/Bucketizer';
import * as d3 from 'd3';

const DEFAULT_MARGIN = 15;
const DEFAULT_HEIGHT = 150;
const DEFAULT_WIDTH = 1000;

const TOOLTIP_ID = '#tl-tooltip-container';

// Create a default data set when we have no records to display.  It defaults to a year from present day.
const DEFAULT_DATA = [
    {
        date: new Date(Date.now()),
        value: 0,
        filters: []
    }, {
        date: new Date(Date.now() + 31536000000),
        value: 0,
        filters: []
    }
];

/**
 * Class used for displaying data on the timeline
 */
export class TimelineItem {
    public date: Date;
    public value: number;
    public filters: string[];
}

/**
 * A series of data to show on the timeline
 */
export class TimelineSeries {
    public color: string = 'green';
    public data: TimelineItem[] = DEFAULT_DATA;
    public focusData: TimelineItem[] = [];
    public selectedData: TimelineItem[] = [];
    public name: string = 'Default';
    public type: string = 'bar';
    public options: Record<string, any> = {};
    public startDate: Date = DEFAULT_DATA[0].date;
    public endDate: Date = DEFAULT_DATA[1].date;
}

/**
 * All of the information needed to display the timeline
 */
export class TimelineData {
    public data: TimelineSeries[] = [];
    public primarySeries: TimelineSeries;
    public collapsed: boolean = true;
    public logarithmic: boolean = false;
    public bucketizer: Bucketizer = null;
    public extent: Date[] = [];
    public granularity: string = 'day';
    public focusGranularityDifferent: boolean = false;
}

const readDim = (val: string | number) => typeof val === 'number' && !Number.isNaN(val) ? val :
    parseFloat(`${val || '0'}`.replace(/px/, ''));

const getProp = (style: HTMLElement['style'], prop: keyof HTMLElement['style']) => readDim(style[prop]);

const computeOuterDims = (el: HTMLElement) => {
    const style = window.getComputedStyle(el, null);
    return {
        w: el.clientWidth +
            getProp(style, 'paddingTop') +
            getProp(style, 'paddingBottom') +
            getProp(style, 'borderTopWidth') +
            getProp(style, 'borderBottomWidth') +
            getProp(style, 'marginTop') +
            getProp(style, 'marginBottom'),
        h: el.clientHeight +
            getProp(style, 'paddingLeft') +
            getProp(style, 'paddingRight') +
            getProp(style, 'borderLeftWidth') +
            getProp(style, 'borderRightWidth') +
            getProp(style, 'marginLeft') +
            getProp(style, 'marginRight')
    };
};

export class TimelineSelectorChart {
    private element: ElementRef;

    private brushHandler: Function = undefined;
    // Private hoverListener = undefined;
    private data: TimelineData;
    private dateFormats = {
        year: '%Y',
        month: '%Y-%m',
        day: '%Y-%m-%d',
        hour: '%Y-%m-%dT%H:%MZ'
    };

    marginFocus: {
        bottom: number;
        top: number;
    };

    marginContext: {
        bottom: number;
        top: number;
    };

    private xDomain: Date[] = [];
    private xAxisFocus: d3.svg.Axis;
    private svg: d3.Selection<TimelineItem>;

    // The highlight bars for each date for both the context and focus timelines.
    private focusHighlight;
    private focusMultiHighlight;
    private contextHighlight;

    // The old extent of the brush saved on brushstart.
    private oldExtent = [];

    // The data index over which the user is currently hovering changed on mousemove and mouseout.
    private hoverIndex = -1;

    private brush: d3.svg.Brush<TimelineItem, number, number>;

    private width = DEFAULT_WIDTH - 2 * DEFAULT_MARGIN;
    private approximateBarWidth: number;
    private xFocus: d3.time.Scale<Date, any>;
    private yFocus: d3.time.Scale<Date, any>;
    private xContext: d3.time.Scale<Date, any>;
    private yContext: any;
    private heightFocus: number;

    private tlComponent: TimelineComponent;

    private tooltip: HTMLElement;
    private tooltipDimensions = { w: 0, h: 0 };

    constructor(tlComponent: TimelineComponent, element: ElementRef, data: TimelineData) {
        this.tlComponent = tlComponent;
        this.element = element;
        this.data = data;
        this.svg = d3.select(this.element.nativeElement);

        this.marginFocus = {
            top: 0,
            bottom: (this.data.collapsed ? this.determineHeight() : DEFAULT_HEIGHT)
        };
        this.marginContext = {
            top: DEFAULT_MARGIN,
            bottom: 0
        };

        this.redrawChart();
    }

    redrawChart(): void {
        // Make the focus chart visible
        this.toggleFocus(this.data.extent.length > 0);

        if (this.data.data) {
            this.render();
            this.renderExtent();
        }
    }

    /**
     * Shows/Hides the focus graph
     * @param {boolean} showFocus Set to true to show the focus graph. False otherwise.
     */
    toggleFocus(showFocus: boolean): void {
        if (showFocus) {
            // Set the updated margins
            this.marginFocus = {
                top: DEFAULT_MARGIN,
                bottom: 99
            };

            this.marginContext = {
                top: (this.data.collapsed ? this.determineHeight() : DEFAULT_HEIGHT) - 65,
                bottom: 0
            };
        } else {
            this.marginFocus = {
                top: 0,
                bottom: (this.data.collapsed ? this.determineHeight() : DEFAULT_HEIGHT)
            };

            this.marginContext = {
                top: DEFAULT_MARGIN,
                bottom: 0
            };
        }
    }

    determineWidth(): number {
        let elemWidth = this.element.nativeElement.getBoundingClientRect().width;
        return elemWidth > 0 ? elemWidth : DEFAULT_WIDTH;
    }

    determineHeight(): number {
        let elemHeight = this.element.nativeElement.getBoundingClientRect().height - 45;
        return elemHeight > 0 ? elemHeight : DEFAULT_HEIGHT - 45;
    }

    determineTop(): number {
        let elemTop = this.element.nativeElement.getBoundingClientRect().top;
        return elemTop > 0 ? elemTop : 0;
    }

    determineLeft(): number {
        let elemLeft = this.element.nativeElement.getBoundingClientRect().left;
        return elemLeft > 0 ? elemLeft : 0;
    }

    addBrushHandler(handler?: Function): void {
        this.brush.on('brushend', () => {
            if (this.brush) {
                // If the user clicks on a date inside the brush without moving the brush, change the brush to contain only that date.
                if (this.hoverIndex >= 0 && this.oldExtent[0]) {
                    let extent = this.brush.extent();
                    if (this.datesEqual(this.oldExtent[0], extent[0]) && this.datesEqual(this.oldExtent[1], extent[1])) {
                        let startDate: Date = this.data.data[0].data[this.hoverIndex].date;
                        let endDate: Date = this.data.data[0].data.length === this.hoverIndex + 1 ? this.xDomain[1] :
                            this.data.data[0].data[this.hoverIndex + 1].date;
                        this.brush.extent([startDate.getTime(), endDate.getTime()]);
                    }
                }
                if (handler) {
                    handler(this.brush.extent());
                }
            }
        });
    }

    clearBrush(): void {
        this.data.extent = [];
        this.oldExtent = [];
        if (this.brush) {
            this.brush.clear();
            d3.select(this.element.nativeElement).select('.brush').call(this.brush);
            if (this.data.data.length && this.data.data[0].data) {
                this.render();
            }
        }
    }

    datesEqual(date1, date2): boolean {
        return date1.toUTCString() === date2.toUTCString();
    }

    renderExtent(): void {
        if (this.data.extent.length !== 2) {
            return;
        }
        let brushElement = this.svg.select('.brush');
        brushElement.call(this.brush.extent(this.data.extent as any));
        this.updateMask();
    }

    render(): void {
        let index = 0;
        let MIN_VALUE = this.data.logarithmic ? 1 : 0;

        this.width = this.determineWidth() - 2 * DEFAULT_MARGIN;
        // Depending on the granularity, the bars are not all the same width (months are different
        // lengths). But this is accurate enough to place tick marks and make other calculations.
        this.approximateBarWidth = 0;

        let svgHeight;
        let heightContext;

        let fullDataSet = [];
        if (this.data.data && this.data.data.length > 0) {
            // Get list of all data to calculate min/max and domain
            for (index = 0; index < this.data.data.length; index++) {
                fullDataSet = fullDataSet.concat(this.data.data[index].data);
                if (this.data.data[index].data && !this.approximateBarWidth) {
                    this.approximateBarWidth = (this.width / this.data.data[index].data.length);
                }
            }
        } else {
            return;
        }

        if (this.data.collapsed) {
            svgHeight = this.determineHeight();
            this.element.nativeElement.style.height = svgHeight;
            this.heightFocus = Math.max(0, svgHeight - this.marginFocus.top - this.marginFocus.bottom);
            heightContext = Math.max(0, svgHeight - this.marginContext.top - this.marginContext.bottom);
        } else {
            svgHeight = DEFAULT_HEIGHT * this.data.data.length;
            this.element.nativeElement.style.height = svgHeight;
            this.heightFocus = Math.max(0, DEFAULT_HEIGHT - this.marginFocus.top - this.marginFocus.bottom);
            heightContext = Math.max(0, DEFAULT_HEIGHT - this.marginContext.top - this.marginContext.bottom);
        }

        // Setup the axes and their scales.
        this.xFocus = d3.time.scale.utc().range([0, this.width]) as any; // Something funky
        this.xContext = d3.time.scale.utc().range([0, this.width]) as any; // Something funky

        // Save the brush as an instance variable to allow interaction on it by client code.
        this.brush = d3.svg.brush().x(this.xContext).on('brush', () => {
            this.updateMask();
        });

        if (this.brushHandler) {
            this.brush.on('brushstart', () => {
                this.oldExtent = this.brush.extent();
            });
            this.addBrushHandler(this.brushHandler);
        }

        function resizePath(dataItem) {
            let eValue = +(dataItem === 'e');
            let xValue = eValue ? 1 : -1;
            let yValue = heightContext / 3;
            return 'M' + (0.5 * xValue) + ',' + yValue +
                'A6,6 0 0 ' + eValue + ' ' + (6.5 * xValue) + ',' + (yValue + 6) +
                'V' + (2 * yValue - 6) +
                'A6,6 0 0 ' + eValue + ' ' + (0.5 * xValue) + ',' + (2 * yValue) +
                'Z' +
                'M' + (2.5 * xValue) + ',' + (yValue + 8) +
                'V' + (2 * yValue - 8) +
                'M' + (4.5 * xValue) + ',' + (yValue + 8) +
                'V' + (2 * yValue - 8);
        }

        let xMin = d3.min(fullDataSet.map((dataItem) => dataItem ? dataItem.date : -1));
        let xMax = d3.max(fullDataSet.map((dataItem) => dataItem ? d3.time[this.data.granularity].utc.offset(dataItem.date, 1) : -1));

        this.xDomain = [xMin || new Date(), xMax || new Date()];
        let xFocusDomain = [];
        if (this.data.extent.length === 2) {
            xFocusDomain = [this.data.extent[0], this.data.extent[1]];
        } else {
            xFocusDomain = this.xDomain;
        }
        this.xFocus.domain(xFocusDomain);
        this.xContext.domain(this.xDomain);

        this.xAxisFocus = d3.svg.axis().scale(this.xFocus).orient('bottom');
        let xAxisContext = d3.svg.axis().scale(this.xContext).orient('bottom');

        // We don't want the ticks to be too close together, so calculate the most ticks that
        // comfortably fit on the timeline
        let maximumNumberOfTicks = Math.round(this.width / 100);
        // We don't want to have more ticks than buckets (e.g., monthly buckets with daily ticks
        // look funny)
        let minimumTickRange = d3.time[this.data.granularity].utc.range;
        // Get number of ticks for the focus chart
        if (this.xFocus.ticks(minimumTickRange).length < maximumNumberOfTicks) {
            // There's enough room to do one tick per bucket
            this.xAxisFocus.ticks(minimumTickRange);
        } else {
            // One tick per bucket at this granularity is too many; let D3 figure out tick spacing.
            // Note that D3 may give us a few more ticks than we specify if it feels like it.
            this.xAxisFocus.ticks(maximumNumberOfTicks);
        }
        // Number of ticks for main chart
        if (this.xContext.ticks(minimumTickRange).length < maximumNumberOfTicks) {
            // There's enough room to do one tick per bucket
            xAxisContext.ticks(minimumTickRange);
        } else {
            // One tick per bucket at this granularity is too many; let D3 figure out tick spacing.
            // Note that D3 may give us a few more ticks than we specify if it feels like it.
            xAxisContext.ticks(maximumNumberOfTicks);
        }

        // Clear the old contents by replacing innerhtml
        // Make sure that the tooltip container is present
        d3.select(this.element.nativeElement).html('<div id="tl-tooltip-container"></div>');

        // Let xCenterOffset = (this.width + this.marginFocus.left + this.marginFocus.right) / 2;
        let xCenterOffset = 0;

        // Append our chart graphics
        this.svg = d3.select(this.element.nativeElement).attr('class', 'timeline-selector-chart')
            .append('svg')
            .attr('height', svgHeight + (2 * DEFAULT_MARGIN))
            .attr('width', this.width + (2 * DEFAULT_MARGIN));

        this.svg.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', this.width - (2 * DEFAULT_MARGIN))
            .attr('height', svgHeight);

        let context = this.svg.append('g')
            .attr('class', 'context')
            .attr('transform', 'translate(' + DEFAULT_MARGIN + ',' + this.marginContext.top + ')');

        context.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(' + xCenterOffset + ',' + heightContext + ')')
            .call(xAxisContext);

        context.selectAll('.major text')
            .attr('transform', 'translate(' + (this.approximateBarWidth / 2) + ',0)');

        context.selectAll('.major line')
            .attr('transform', 'translate(' + (this.approximateBarWidth / 2) + ',0)');

        // Render a series
        let seriesPos = 0;
        let charts = [];

        let createSeries = (series: TimelineSeries) => {
            let xOffset = this.approximateBarWidth / 2;
            if (series.type === 'bar') {
                xOffset = 0;
            }

            let focus = this.svg.append('g')
                .attr('class', 'focus-' + series.name)
                .attr('width', this.width - (2 * DEFAULT_MARGIN))
                .attr('transform', 'translate(' + DEFAULT_MARGIN + ',' + this.marginFocus.top + ')');

            // Prevents the x-axis from being shown
            if (this.marginFocus.top === 0) {
                focus.attr('display', 'none');
            }

            focus.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(' + xCenterOffset + ',' + this.heightFocus + ')')
                .call(this.xAxisFocus);

            focus.selectAll('.major text')
                .attr('transform', 'translate(' + (this.approximateBarWidth / 2) + ',0)');

            focus.selectAll('.major line')
                .attr('transform', 'translate(' + (this.approximateBarWidth / 2) + ',0)');

            let focusContainer = focus.append('g')
                .attr('class', series.name)
                .attr('transform', 'translate(' + xOffset + ',' +
                    ((this.heightFocus + (this.marginFocus.top * 2) + this.marginFocus.bottom) * seriesPos) + ')')
                .on('mousemove', () => {
                    let hoverIndex = this.findHoverIndexInData(series.focusData, this.xFocus);
                    if (hoverIndex >= 0 && hoverIndex < series.focusData.length) {
                        this.onFocusHover(series.focusData[hoverIndex]);
                    }
                })
                .on('mouseout', () => {
                    this.onHoverEnd();
                })
                .on('mousedown', () => {
                    if ((d3.event as MouseEvent).buttons === 2) {
                        (d3.event as MouseEvent).stopImmediatePropagation();
                        return;
                    }
                    let hoverIndex = this.findHoverIndexInData(series.focusData, this.xFocus);
                    if (hoverIndex >= 0 && hoverIndex < series.focusData.length) {
                        this.onFocusHover(series.focusData[hoverIndex]);
                    }
                });

            // Calculate the max height based on the whole series
            let yFocus = this.data.logarithmic ? d3.scale.log().clamp(true).range([this.heightFocus, 0]) :
                d3.scale.linear().range([this.heightFocus, 0]);

            // Use lowest value or 0 for Y-axis domain, whichever is less (e.g. if negative)
            let minY = d3.min(series.data.map((dataItem: any) => dataItem.value));
            minY = this.data.logarithmic ? 1 : (minY < 0 ? minY : 0);

            // Use highest value for Y-axis domain, or 0 if there is no data
            let maxY = d3.max(series.data.map((dataItem: any) => dataItem.value));
            maxY = maxY ? maxY : MIN_VALUE;

            yFocus.domain([minY, maxY]);

            d3.svg.axis().scale(yFocus).orient('right').ticks(2);

            // Draw the focus chart
            let focusChart = this.drawFocusChart(series);

            let yContext = this.data.logarithmic ?
                d3.scale.log().clamp(true).range([heightContext, 0]) : d3.scale.linear().range([heightContext, 0]);
            yContext.domain(yFocus.domain());
            if (this.data.primarySeries.name === series.name) {
                this.yContext = yContext;
            }

            let contextContainer;

            // Only had context timeline on first chart (for when there are multiple charts)
            if (series.name === this.data.primarySeries.name) {
                contextContainer = context.append('g')
                    .attr('class', series.name)
                    .attr('transform', 'translate(' + xOffset + ',' +
                        ((heightContext + this.marginContext.top + this.marginContext.bottom) * seriesPos) + ')');

                let style = 'stroke:' + series.color + ';';
                let chartTypeContext;

                // If type is bar AND the data isn't too long, render a bar plot
                if (series.type === 'bar' && series.data.length < this.width) {
                    let barheight = 0;

                    if (series.data.length < 60) {
                        style = 'stroke:#f1f1f1;';
                        barheight++;
                    }
                    style += 'fill:' + series.color + ';';

                    contextContainer.selectAll('.bar')
                        .data(series.data)
                        .enter().append('rect')
                        .attr('class', (dataItem) => 'bar ' + dataItem.date)
                        .attr('style', () => style)
                        .attr('x', (dataItem) => this.xContext(dataItem.date))
                        .attr('width', (dataItem) => this.xContext(d3.time[this.data.granularity].utc.offset(dataItem.date, 1)) -
                            this.xContext(dataItem.date))
                        .attr('y', (dataItem) => yContext(Math.max(MIN_VALUE, dataItem.value)))
                        .attr('height', (dataItem) => {
                            let height = isNaN(yContext(dataItem.value) -
                                yContext(MIN_VALUE)) ? MIN_VALUE : yContext(dataItem.value) - yContext(MIN_VALUE);
                            return Math.abs(height) + barheight;
                        });
                } else {
                    // If type is line, render a line plot
                    if (series.type === 'line') {
                        chartTypeContext = d3.svg.line()
                            .x((dataItem: any) => this.xContext(dataItem.date))
                            .y((dataItem: any) => yContext(dataItem.value));
                    } else {
                        // Otherwise, default to area, e.g. for bars whose data is too long
                        style += 'fill:' + series.color + ';';
                        chartTypeContext = d3.svg.area()
                            .x((dataItem: any) => this.xContext(dataItem.date))
                            .y0((dataItem: any) => yContext(Math.min(MIN_VALUE, dataItem.value)))
                            .y1((dataItem: any) => yContext(Math.max(MIN_VALUE, dataItem.value)));
                    }

                    contextContainer.append('path')
                        .datum(series.data)
                        .attr('class', series.type)
                        .attr('d', chartTypeContext)
                        .attr('style', style);

                    if (series.data.length < 80) {
                        contextContainer.selectAll('dot')
                            .data(series.data)
                            .enter().append('circle')
                            .attr('class', 'dot')
                            .attr('style', 'fill:' + series.color + ';')
                            .attr('r', 3)
                            .attr('cx', (dataItem: any) => {
                                if (series.data.length === 1) {
                                    return this.width / 2;
                                }
                                return this.xContext(dataItem.date);
                            })
                            .attr('cy', (dataItem: any) => yContext(dataItem.value));
                    }
                }

                // Append the highlight bars after the other bars so it is drawn on top.
                this.contextHighlight = contextContainer.append('rect')
                    .attr('class', 'highlight')
                    .attr('x', 0).attr('width', 0)
                    .attr('y', -1).attr('height', heightContext + 2)
                    .style('visibility', 'hidden');
            }

            focusContainer.append('line')
                .attr({
                    class: 'mini-axis',
                    x1: 0,
                    x2: this.width - (xOffset * 2),
                    y1: yFocus(MIN_VALUE),
                    y2: yFocus(MIN_VALUE)
                });

            charts.push({
                name: series.name,
                color: series.color,
                yAxis: focusChart.yAxis,
                index: seriesPos
            });

            seriesPos++;
        };

        // If set, render primary series first
        if (this.data.primarySeries && this.data.primarySeries.data.length) {
            createSeries(this.data.primarySeries);
        }
        // Render all series
        for (index = 0; index < this.data.data.length; index++) {
            if (!this.data.data[index].data) {
                // No data, just stop now
                return;
            } else if (this.data.primarySeries && this.data.data[index].name === this.data.primarySeries.name) {
                // Just skip it
            } else if (this.data.data[index].data.length) {
                createSeries(this.data.data[index]);
            }
        }

        let gBrush = context.append('g')
            .attr('class', 'brush')
            .on('mousedown', () => {
                if ((d3.event as MouseEvent).buttons === 2) {
                    (d3.event as MouseEvent).stopImmediatePropagation();
                }
            })
            .on('mousemove', () => {
                let hoverIndex = this.findHoverIndexInData(this.data.primarySeries.data, this.xContext);
                if (hoverIndex >= 0 && hoverIndex < this.data.primarySeries.data.length) {
                    this.onHover(this.data.primarySeries.data[hoverIndex]);
                }
            })
            .on('mouseout', () => {
                this.onHoverEnd();
            });

        gBrush.append('rect')
            .attr('x', this.width + DEFAULT_MARGIN)
            .attr('y', -6)
            .attr('width', this.width)
            .attr('height', heightContext + 7)
            .attr('class', 'mask mask-east');

        gBrush.append('rect')
            .attr('x', (0 - (this.width + DEFAULT_MARGIN)))
            .attr('y', -6)
            .attr('width', this.width)
            .attr('height', heightContext + 7)
            .attr('class', 'mask mask-west');

        gBrush.call(this.brush);

        gBrush.selectAll('rect')
            .attr('y', -6)
            .attr('height', heightContext + 7);

        gBrush.selectAll('.e')
            .append('rect')
            .attr('y', -6)
            .attr('width', 1)
            .attr('height', heightContext + 6)
            .attr('class', 'resize-divider');

        gBrush.selectAll('.w')
            .append('rect')
            .attr('x', -1)
            .attr('y', -6)
            .attr('width', 1)
            .attr('height', heightContext + 6)
            .attr('class', 'resize-divider');

        gBrush.selectAll('.resize')
            .append('path')
            .attr('d', resizePath);

        for (index = 0; index < charts.length; index++) {
            let focus = this.svg.select('.focus-' + charts[index].name);

            // Set the ticks to x-position 0 by subtracting the margin and their default x-position (9).
            focus.append('g')
                .attr('class', 'y axis series-y')
                .attr('transform', 'translate(-' + (DEFAULT_MARGIN + 9) + ',' + ((this.heightFocus +
                    (this.marginFocus.top * 2) + this.marginFocus.bottom) * charts[index].index) + ')')
                .call(charts[index].yAxis);

            focus.append('text')
                .attr('class', 'series-title')
                .attr('fill', charts[index].color)
                .attr('transform', 'translate(0,' + (((this.heightFocus +
                    (this.marginFocus.top * 2) + this.marginFocus.bottom) * charts[index].index) - 5) + ')')
                .text(charts[index].name + ' - Filtered');
        }

        if (this.data.primarySeries) {
            context.append('text')
                .attr('class', 'series-title')
                .attr('fill', this.data.primarySeries.color)
                .attr('transform', 'translate(0, 5)')
                .text(this.data.primarySeries.name);
        }

        this.tooltip = document.querySelector(TOOLTIP_ID);
    }

    drawFocusChart(series: TimelineSeries): any {
        let MIN_VALUE = this.data.logarithmic ? 1 : 0;

        this.svg.select('.focus-' + series.name).select('.x.axis').call(this.xAxisFocus);

        let focus = this.svg.select('.focus-' + series.name + ' .' + series.name);

        let yFocus = this.data.logarithmic ? d3.scale.log().clamp(true).range([this.heightFocus, 0]) :
            d3.scale.linear().range([this.heightFocus, 0]);

        if (this.data.primarySeries.name === series.name) {
            this.yFocus = yFocus as any; // Something funky is happening here
        }

        // Use lowest value or 0 for Y-axis domain, whichever is less (e.g. if negative)
        let minY = d3.min(series.focusData.map((dataItem: any) => dataItem.value));
        minY = this.data.logarithmic ? 1 : (minY < 0 ? minY : 0);

        // Use highest value for Y-axis domain, or 0 if there is no data
        let maxY = d3.max(series.focusData.map((dataItem: any) => dataItem.value));
        maxY = maxY ? maxY : MIN_VALUE;

        yFocus.domain([minY, maxY]);

        let yAxis = d3.svg.axis().scale(yFocus).orient('right').ticks(2);

        focus.select('.y.axis.series-y').call(yAxis);

        let style = 'stroke:' + series.color + ';';

        focus.selectAll('rect.bar').remove();
        focus.selectAll('path.' + series.type).remove();

        // If type is bar AND the data isn't too long, render a bar plot
        if (series.type === 'bar' && series.focusData.length < this.width) {
            let barheight = 0;

            if (series.focusData.length < 60) {
                style = 'stroke:#f1f1f1;';
                barheight++;
            }
            style += 'fill:' + series.color + ';';

            focus.selectAll('rect.bar')
                .data(series.focusData)
                .enter().append('rect')
                .attr('class', (dataItem) => 'bar ' + dataItem.date)
                .attr('style', () => style)
                .attr('x', (dataItem) => this.xFocus(dataItem.date))
                .attr('width', (dataItem) => this.xFocus(d3.time[this.data.granularity].utc.offset(dataItem.date, 1)) -
                    this.xFocus(dataItem.date))
                .attr('y', (dataItem) => yFocus(Math.max(MIN_VALUE, dataItem.value)))
                .attr('height', (dataItem) => {
                    let height = isNaN(yFocus(dataItem.value) - yFocus(MIN_VALUE)) ? MIN_VALUE :
                        yFocus(dataItem.value) - yFocus(MIN_VALUE);
                    return Math.abs(height) + (barheight);
                });
        } else {
            let chartType;

            // If type is line, render a line plot
            if (series.type === 'line') {
                chartType = d3.svg.line()
                    .x((dataItem: any) => this.xFocus(dataItem.date))
                    .y((dataItem: any) => yFocus(dataItem.value));
            } else {
                // Otherwise, default to area, e.g. for bars whose data is too long
                style += 'fill:' + series.color + ';';
                chartType = d3.svg.area()
                    .x((dataItem: any) => this.xFocus(dataItem.date))
                    .y0((dataItem: any) => yFocus(Math.min(MIN_VALUE, dataItem.value)))
                    .y1((dataItem: any) => yFocus(Math.max(MIN_VALUE, dataItem.value)));
            }

            focus.append('path')
                .datum(series.focusData)
                .attr('class', series.type)
                .attr('d', chartType)
                .attr('style', style);

            if (series.focusData.length < 80) {
                let func = (dataItem) => this.xFocus(dataItem.date);
                if (series.focusData.length === 1) {
                    func = () => this.width / 2;
                }

                focus.selectAll('circle.dot').remove();

                focus.selectAll('circle.dot')
                    .data(series.focusData)
                    .enter().append('circle')
                    .attr('class', 'dot')
                    .attr('style', 'fill:' + series.color + ';')
                    .attr('r', 3)
                    .attr('cx', func)
                    .attr('cy', (dataItem: any) => yFocus(dataItem.value));
            }
        }

        if (this.data.primarySeries.name === series.name) {
            // Append the highlight bars after the other bars so it is drawn on top.
            this.focusHighlight = focus.append('rect')
                .attr('class', 'highlight')
                .attr('x', 0).attr('width', 0)
                .attr('y', -1).attr('height', this.heightFocus + 2)
                .style('visibility', 'hidden');

            // Multi-highlight bar
            this.focusMultiHighlight = focus.append('rect')
                .attr('class', 'multi-highlight')
                .attr('x', 0).attr('width', 0)
                .attr('y', -1).attr('height', this.heightFocus + 2)
                .style('visibility', 'hidden');
        }

        return {
            y: yFocus,
            yAxis: yAxis
        };
    }

    updateMask(): void {
        // Snap brush
        if (d3.event) {
            let timeFunction = d3.time[this.data.granularity].utc;

            let extent0: [number, number] = this.brush.extent() as [number, number];
            let extent1;

            if (typeof extent0[0] === 'undefined' || typeof extent0[1] === 'undefined') {
                d3.select(this.element.nativeElement).call(() => {
                    this.brush.clear();
                });
            } else {
                // If dragging, preserve the width of the extent
                if ((d3.event as any).mode === 'move') {
                    let d0 = timeFunction.round(extent0[0]);
                    let range = timeFunction.range(extent0[0], extent0[1]);
                    let d1 = timeFunction.offset(d0, range.length);
                    extent1 = [d0, d1];
                } else {
                    extent1 = extent0.map(timeFunction.round);
                    extent1[0] = timeFunction.floor(extent0[0]);
                    extent1[1] = timeFunction.ceil(extent0[1]);
                }

                if (extent1[0] < extent1[1]) {
                    this.svg.select('.brush').call(this.brush.extent(extent1));
                }
            }
            this.data.extent = extent1;

            if ('sourceEvent' in d3.event && d3.event.sourceEvent.type === 'mouseup') {
                _.debounce(() => {
                    // Update the chart
                    this.redrawChart();
                    for (let data of this.data.data[0].data) {
                        if (data.date >= this.data.extent[0] && data.date < this.data.extent[1]) {
                            this.data.primarySeries.selectedData.push(data);
                        }
                    }

                    this.tlComponent.onTimelineSelection(this.data.extent[0], this.data.extent[1], this.data.primarySeries.selectedData);
                }, 500)();
            }
        }

        // Update mask
        let brushElement = this.element.nativeElement;
        let xPos = readDim(brushElement.querySelector('.extent').getAttribute('x'));
        let extentWidth = readDim(brushElement.querySelector('.extent').getAttribute('width'));
        let width = readDim(brushElement.querySelector('.mask-west').getAttribute('width'));

        if (xPos + extentWidth < 0 || xPos > width) {
            xPos = 0;
            extentWidth = 0;
            width = 0;
        }

        const east = brushElement.querySelector('.mask-east') as SVGElement;
        const west = brushElement.querySelector('.mask-west') as SVGElement;

        if ((extentWidth === 0) &&
            (this.brush.extent() && this.brush.extent().length >= 2 &&
                ((this.brush.extent()[1] as number) - (this.brush.extent()[0] as number) > 0))) {
            // If brush extent exists, but the width is too small, draw masks with a bigger width
            west.setAttribute('x', `${xPos - width}`);
            east.setAttribute('x', `${xPos + 1}`);
        } else if (extentWidth === 0 || extentWidth === undefined) {
            // If brush extent has been cleared, reset mask positions
            west.setAttribute('x', `${(0 - (width + 50))}`);
            east.setAttribute('x', `${width + 50}`);
        } else {
            // Otherwise, update mask positions to new extent location
            west.setAttribute('x', `${xPos - width}`);
            east.setAttribute('x', `${xPos + extentWidth}`);
        }
    }

    /**
     * Returns the hover index in the given data using the given mouse event and xRange function (xContext or xFocus).
     */
    findHoverIndexInData(data: TimelineItem[], domain: d3.time.Scale<Date, any>): number {
        // To get the actual svg, you have to use [0][0]
        let mouseLocation = d3.mouse(this.svg[0][0]);
        // Subtract the margin, or else the cursor location may not match the highlighted bar
        let graphX = domain.invert(mouseLocation[0] - DEFAULT_MARGIN);
        let bisect = d3.bisector<{ date: Date }, Date>((dataItem) => dataItem.date).right;
        return data ? bisect(data, graphX) - 1 : -1;
    }

    /**
     * Performs behavior for hovering over the given datum at the given context timeline index.
     */
    onHover(datum: TimelineItem): void {
        this.showTooltip(datum, d3.event);
        this.clearHighlights();

        // Show highlights
        this.showHighlight(datum,
            this.contextHighlight, this.xContext, this.yContext);

        // Check if there is focus data, and if the selection is within range
        let focusData = this.data.primarySeries.focusData;
        if (focusData.length > 0 && focusData[0].date <= datum.date &&
            datum.date <= focusData[focusData.length - 1].date) {
            if (this.data.focusGranularityDifferent) {
                let startDate = this.data.bucketizer.roundDownBucket(datum.date);
                let endDate = d3.time[this.data.bucketizer.getGranularity()]
                    .utc.offset(startDate, 1);
                this.showFocusMultiHighlight(startDate, endDate);
            } else {
                // Just draw it
                this.showHighlight(datum,
                    this.focusHighlight, this.xFocus, this.yFocus);
            }
        }
    }

    /**
     * Hovering over focus means that we may need to get the bucket that the hovered data came from,
     * and highlight that in the main chart in case the focus has a different time interval
     * @param datum
     */
    onFocusHover(datum: TimelineItem): void {
        let bucketData = datum;
        if (this.data.focusGranularityDifferent && this.data.bucketizer) {
            let index = this.data.bucketizer.getBucketIndex(datum.date);
            bucketData = this.data.primarySeries.data[index];
        }

        this.showTooltip(datum, d3.event);
        this.clearHighlights();

        this.showHighlight(bucketData,
            this.contextHighlight, this.xContext, this.yContext);

        this.showHighlight(datum,
            this.focusHighlight, this.xFocus, this.yFocus);
    }

    /**
     * Performs behavior for hovering off of all data.
     * @method onHoverEnd
     */
    onHoverEnd(): void {
        this.clearHighlights();
        this.hideTooltip();
    }

    /**
     * Shows the given highlight at the given date with the given value using the given
     * xRange and yRange functions (xContext/yContext or xFocus/yFocus).
     */
    showFocusMultiHighlight(startDate: Date, endDate: Date) {
        // TODO Create x, width, y, and height functions to combine the calculations for both the highlight bar and the other bars.
        let xValue = this.xFocus(startDate);
        let MIN_VALUE = this.data.logarithmic ? 1 : 0;
        let width = this.xFocus(endDate) - xValue;
        let yValue = this.yFocus(Math.max(MIN_VALUE, 9999) as any);
        let height = Math.abs(this.yFocus(9999 as any) - this.yFocus(MIN_VALUE as any));
        this.focusMultiHighlight.attr('x', xValue - 1).attr('width', width + 2).attr('y', yValue - 1)
            .attr('height', ((isNaN(height) ? MIN_VALUE : height) + 2)).style('visibility', 'visible');
    }

    /**
     * Shows the given highlight at the given date with the given value using the given
     * xRange and yRange functions (xContext/yContext or xFocus/yFocus).
     */
    showHighlight(dataItem: TimelineItem, highlight, xRange, yRange) {
        // TODO Create x, width, y, and height functions to combine the calculations for both the highlight bar and the other bars.
        let xValue = xRange(dataItem.date);
        let MIN_VALUE = this.data.logarithmic ? 1 : 0;
        let width = xRange(d3.time[this.data.granularity].utc.offset(dataItem.date, 1)) - xValue;
        let yValue = yRange(Math.max(MIN_VALUE, dataItem.value));
        let height = Math.abs(yRange(dataItem.value) - yRange(MIN_VALUE));
        highlight.attr('x', xValue - 1).attr('width', width + 2).attr('y', yValue - 1)
            .attr('height', ((isNaN(height) ? MIN_VALUE : height) + 2)).style('visibility', 'visible');
    }

    clearHighlights(): void {
        this.focusHighlight.style('visibility', 'hidden');
        this.focusMultiHighlight.style('visibility', 'hidden');
        this.contextHighlight.style('visibility', 'hidden');
    }

    showTooltip(item: TimelineItem, mouseEvent): void {
        let count = d3.format('0,000.00')(item.value);
        // Only show the part of the date that makes sense for the selected granularity
        let dateFormat = this.dateFormats[this.data.granularity];
        if (!dateFormat) {
            dateFormat = this.dateFormats.hour;
        }
        let date = d3.time.format.utc(dateFormat)(item.date);

        // Create the contents of the tooltip (#tl-tooltip-container is reused among the various
        // visualizations)
        let html = '<div><strong>Date:</strong> ' + _.escape(date) + '</div>' +
            '<div><strong>Count:</strong> ' + count + '</div>';
        this.tooltip.innerHTML = html;
        this.tooltip.style.display = 'block';

        // Calculate the tooltip position
        this.tooltipDimensions = computeOuterDims(this.tooltip);

        this.positionTooltip(d3.select(TOOLTIP_ID), mouseEvent);
    }

    positionTooltip(tooltip, mouseEvent): void {
        let { w: tooltipWidth, h: tooltipHeight } = this.tooltipDimensions;
        let attributeLeft = mouseEvent.pageX - this.determineLeft() + 10;
        let attributeTop = mouseEvent.pageY - this.determineTop() + (tooltipHeight / 2) - 15 - 45;

        if ((attributeLeft + tooltipWidth) > this.determineWidth()) {
            this.tooltip.classList.remove('east');
            this.tooltip.classList.add('west');
            tooltip.style('top', (attributeTop + 'px'))
                .style('left', (attributeLeft - tooltipWidth - 30) + 'px');
        } else {
            this.tooltip.classList.remove('west');
            this.tooltip.classList.add('east');
            tooltip.style('top', (attributeTop + 'px'))
                .style('left', attributeLeft + 'px');
        }
    }

    hideTooltip(): void {
        this.tooltip.style.display = 'none';
    }
}
