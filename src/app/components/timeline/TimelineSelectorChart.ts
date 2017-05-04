/// <reference path="../../../../node_modules/@types/d3/index.d.ts" />
import * as _ from 'lodash';
import {ElementRef, HostListener, Injectable} from '@angular/core';

declare let d3;

const DEFAULT_MARGIN = 15;
const DEFAULT_HEIGHT = 150;
const DEFAULT_WIDTH = 1000;

/**
 * Configuration options for the timeline
 */
export class TimelineConfig {
    height: number;
    marginFocus: {
        bottom: number,
        left: number,
        right: number,
        top: number
    };
    marginContext: {
        bottom: number,
        left: number,
        right: number,
        top: number
    };
    width: number;
    granularity: string;
    logarithmic: boolean;
}

/**
 * Class used for displaying data on the timeline
 */
export class TimelineData {
    public date: Date;
    public value: number;
}

/**
 * A series of data to show on the timeline
 */
export class TimelineSeries {
    public color: string;
    public data: TimelineData[];
    public name: string;
    public type: string;
    public options: Object;
}

@Injectable()
export class TimelineSelectorChart {
    // Create a default data set when we have no records to display.  It defaults to a year from present day.
    private readonly DEFAULT_DATA = [
        {
            date: new Date(Date.now()),
            value: 0
        }, {
            date: new Date(Date.now() + 31536000000),
            value: 0
        }];

    private config: TimelineConfig;
    private element: ElementRef;

    private brushHandler: Function = undefined;
    private hoverListener = undefined;
    private data: TimelineSeries[] =  [{
        name: 'Default',
        data: this.DEFAULT_DATA,
        type: 'bar',
        color: 'green',
        options: {}
    }];
    private primarySeries: TimelineSeries = this.data[0];
    private dateFormats = {
        year: '%Y',
        month: '%b %Y',
        day: '%d %b %Y',
        hour: '%d %b %Y %H:%M'
    };

    private readonly TOOLTIP_ID = 'tooltip';
    private xDomain = [];
    private xAxisFocus: d3.svg.Axis;
    private svg: d3.Selection<TimelineData>;
    private collapsed = true;

    // The highlight bars for each date for both the context and focus timelines.
    private focusHighlights = [];
    private contextHighlights = [];

    // The mapping of date to data index used in hover/highlighting behavior for both the context and focus timelines.
    private focusDateToIndex = {};
    private contextDateToIndex = {};

    // The old extent of the brush saved on brushstart.
    private oldExtent = [];

    // The data index over which the user is currently hovering changed on mousemove and mouseout.
    private hoverIndex = -1;

    private brush: d3.svg.Brush<TimelineData>;


    private logarithmic: boolean = false;
    private width = DEFAULT_WIDTH;
    private approximateBarWidth: number;
    private xFocus: d3.time.Scale<Date, any>;
    private yFocus: any;
    private xContext: d3.time.Scale<Date, any>;
    private yContext: any;
    private heightFocus: number;

    constructor(element: ElementRef, configuration?: TimelineConfig) {
        this.element = element;
        if (configuration) {
            this.config = configuration;
        } else {
            this.config = new TimelineConfig();
            this.config.logarithmic = false;
            configuration = new TimelineConfig();
        }

        // debugger;
        this.svg = d3.select(this.element.nativeElement);

        this.config.marginFocus = configuration.marginFocus || {
                top: 0,
                right: DEFAULT_MARGIN,
                bottom: (this.collapsed ? this.determineHeight(this.element) : DEFAULT_HEIGHT),
                left: DEFAULT_MARGIN
            };
        this.config.marginContext = configuration.marginContext || {
                top: DEFAULT_MARGIN,
                right: DEFAULT_MARGIN,
                bottom: 0,
                left: DEFAULT_MARGIN
            };
        this.config.granularity = configuration.granularity || 'day';
        this.logarithmic = configuration.logarithmic || this.config.logarithmic;
        this.redrawChart();
    }

    setData(data: TimelineSeries[]) {
        if (data.length > 0) {
            console.log('Setting data');
            this.data = data;
            this.primarySeries = data[0];
        }
    }

    setGranularity(granularity: string) {
        this.config.granularity = granularity;
    }

    @HostListener('window:resize')
    redrawChart(): void {
        if (this.data) {
            this.render();
            // TODO render extent
        }
    }

    determineWidth(element: ElementRef): number {
        if (this.config.width) {
           return this.config.width;
        }
        let elemWidth = element.nativeElement.getBoundingClientRect().width;
        return elemWidth > 0 ? elemWidth : DEFAULT_WIDTH;
    }

    determineHeight(element: ElementRef): number {
        if (this.config.height) {
            return this.config.height;
        }
        let elemHeight = element.nativeElement.getBoundingClientRect().height;
        return elemHeight > 0 ? elemHeight : DEFAULT_HEIGHT;
    }

    addBrushHandler(handler?: Function): void {
        this.brush.on('brushend', (d, i) => {
            if (this.brush) {
                // If the user clicks on a date inside the brush without moving the brush, change the brush to contain only that date.
                if (this.hoverIndex >= 0 && this.oldExtent[0]) {
                    let extent = this.brush.extent();
                    if (this.datesEqual(this.oldExtent[0], extent[0]) && this.datesEqual(this.oldExtent[1], extent[1])) {
                        let startDate: Date = this.data[0].data[this.hoverIndex].date;
                        let endDate: Date = this.data[0].data.length === this.hoverIndex + 1 ? this.xDomain[1] :
                            this.data[0].data[this.hoverIndex + 1].date;
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
        this.brush.clear();
        d3.select(this.element.nativeElement).select('.brush').call(this.brush);
        if (this.data.length && this.data[0].data) {
            this.render();
        }
    }

    datesEqual(a, b): boolean {
        return a.toUTCString() === b.toUTCString();
    };

    render(): void {
        console.log('Rendering timeline');
        console.log('data:');
        console.log(this.data);
        let me = this;

        let i = 0;
        let MIN_VALUE = this.logarithmic ? 1 : 0;

        this.width = this.determineWidth(this.element) -
            (this.config.marginFocus.left + this.config.marginFocus.right);
        // Depending on the granularity, the bars are not all the same width (months are different
        // lengths). But this is accurate enough to place tick marks and make other calculations.
        this.approximateBarWidth = 0;

        let svgHeight;
        let heightContext;

        let fullDataSet = [];
        if (this.data && this.data.length > 0) {
            // Get list of all data to calculate min/max and domain
            for (i = 0; i < this.data.length; i++) {
                fullDataSet = fullDataSet.concat(this.data[i].data);
                if (this.data[i].data && !this.approximateBarWidth) {
                    this.approximateBarWidth = (this.width / this.data[i].data.length);
                }
            }
        } else {
            return;
        }

        if (this.collapsed) {
            svgHeight = this.determineHeight(this.element);
            $(this.element.nativeElement[0]).css('height', svgHeight);
            this.heightFocus = Math.max(0, svgHeight - this.config.marginFocus.top - this.config.marginFocus.bottom);
            heightContext = Math.max(0, svgHeight - this.config.marginContext.top - this.config.marginContext.bottom);
        } else {
            svgHeight = DEFAULT_HEIGHT * this.data.length;
            $(this.element.nativeElement[0]).css('height', svgHeight);
            this.heightFocus = Math.max(0, DEFAULT_HEIGHT - this.config.marginFocus.top - this.config.marginFocus.bottom);
            heightContext = Math.max(0, DEFAULT_HEIGHT - this.config.marginContext.top - this.config.marginContext.bottom);
        }

        // Setup the axes and their scales.
        this.xFocus = d3.time.scale.utc().range([0, this.width]);
        this.xContext = d3.time.scale.utc().range([0, this.width]);

        // Save the brush as an instance variable to allow interaction on it by client code.
        this.brush = d3.svg.brush().x(this.xContext).on('brush', () => {
            this.updateMask();
        });

        if (this.brushHandler) {
            this.brush.on('brushstart', function() {
                this.oldExtent = this.brush.extent();
            });
            this.addBrushHandler(this.brushHandler);
        }

        function resizePath(d) {
            let e = +(d === 'e');
            let x = e ? 1 : -1;
            let y = heightContext / 3;
            return 'M' + (0.5 * x) + ',' + y +
                'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6) +
                'V' + (2 * y - 6) +
                'A6,6 0 0 ' + e + ' ' + (0.5 * x) + ',' + (2 * y) +
                'Z' +
                'M' + (2.5 * x) + ',' + (y + 8) +
                'V' + (2 * y - 8) +
                'M' + (4.5 * x) + ',' + (y + 8) +
                'V' + (2 * y - 8);
        }

        let xMin = d3.min(fullDataSet.map((d) => {
            return d ? d.date : -1;
        }));
        let xMax = d3.max(fullDataSet.map((d) => {
            return d ? d3.time[this.config.granularity].utc.offset(d.date, 1) : -1;
        }));

        this.xDomain = [xMin || new Date(), xMax || new Date()];
        this.xFocus.domain(this.xDomain);
        this.xContext.domain(this.xDomain);

        this.xAxisFocus = d3.svg.axis().scale(this.xFocus).orient('bottom');
        let xAxisContext = d3.svg.axis().scale(this.xContext).orient('bottom');

        // We don't want the ticks to be too close together, so calculate the most ticks that
        // comfortably fit on the timeline
        let maximumNumberOfTicks = Math.round(this.width / 100);
        // We don't want to have more ticks than buckets (e.g., monthly buckets with daily ticks
        // look funny)
        let minimumTickRange = d3.time[this.config.granularity].utc.range;
        if (this.xFocus.ticks(minimumTickRange).length < maximumNumberOfTicks) {
            // There's enough room to do one tick per bucket
            this.xAxisFocus.ticks(minimumTickRange);
            xAxisContext.ticks(minimumTickRange);
        } else {
            // One tick per bucket at this granularity is too many; let D3 figure out tick spacing.
            // Note that D3 may give us a few more ticks than we specify if it feels like it.
            this.xAxisFocus.ticks(maximumNumberOfTicks);
            xAxisContext.ticks(maximumNumberOfTicks);
        }

        // Clear the old contents by replacing innerhtml.
        d3.select(this.element.nativeElement).html('');

        // let xCenterOffset = (this.width + this.config.marginFocus.left + this.config.marginFocus.right) / 2;
        let xCenterOffset = 0;

        // Append our chart graphics
        this.svg = d3.select(this.element.nativeElement).attr('class', 'timeline-selector-chart')
            .append('svg')
            .attr('height', svgHeight + this.config.marginFocus.left + this.config.marginFocus.right)
            .attr('width', this.width + this.config.marginFocus.left + this.config.marginFocus.right);

        this.svg.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', this.width - this.config.marginFocus.left - this.config.marginFocus.right)
            .attr('height', svgHeight);

        let context = this.svg.append('g')
            .attr('class', 'context')
            .attr('transform', 'translate(' + this.config.marginContext.left + ',' + this.config.marginContext.top + ')');

        context.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(-' + xCenterOffset + ',' + heightContext + ')')
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
                .attr('transform', 'translate(' + this.config.marginFocus.left + ',' + this.config.marginFocus.top + ')');

            // Prevents the x-axis from being shown
            if (this.config.marginFocus.top === 0) {
                focus.attr('display', 'none');
            }

            focus.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(-' + xCenterOffset + ',' + this.heightFocus + ')')
                .call(this.xAxisFocus);

            focus.selectAll('.major text')
                .attr('transform', 'translate(' + (this.approximateBarWidth / 2) + ',0)');

            focus.selectAll('.major line')
                .attr('transform', 'translate(' + (this.approximateBarWidth / 2) + ',0)');

            let focusContainer = focus.append('g')
                .attr('class', series.name)
                .attr('transform', 'translate(' + xOffset + ',' +
                    ((this.heightFocus + (this.config.marginFocus.top * 2) + this.config.marginFocus.bottom) * seriesPos) + ')')
                .on('mousemove', function() {
                    console.log('Mousemove event');
                    console.log(this);
                    let index = this.findHoverIndexInData(this, series);
                    console.log('Got index ' + index);
                    if (index >= 0 && index < series.data.length) {
                        let contextIndex = me.contextDateToIndex[series.data[index].date.toUTCString()];
                        me.onHover(series.data[index], contextIndex);
                    }
                })
                .on('mouseover', function() {
                    console.log('Mouseover');
                    this.onHoverStart();
                })
                .on('mouseout', function() {
                    console.log('Mousend');
                    this.onHoverEnd();
                })
                .on('mousedown', function() {
                    // Note that 'this' refers to the SVG, and 'me' is the class instance
                    let index = me.findHoverIndexInData(this, series);
                    if (index >= 0 && index < series.data.length) {
                        let contextIndex = me.contextDateToIndex[series.data[index].date.toUTCString()];
                        me.onHover(series.data[index], contextIndex);
                    }
                });

            let axis = this.drawFocusChart(series);
            let y = axis.y;
            let yAxis = axis.yAxis;
            let yContext = this.logarithmic ?
                d3.scale.log().clamp(true).range([heightContext, 0]) : d3.scale.linear().range([heightContext, 0]);
            yContext.domain(y.domain());

            if (this.primarySeries.name === series.name) {
                this.yContext = yContext;
            }

            let contextContainer;

            // Only had context timeline on first chart (for when there are multiple charts)
            if (series.name === this.primarySeries.name) {
                contextContainer = context.append('g')
                    .attr('class', series.name)
                    .attr('transform', 'translate(' + xOffset + ',' +
                        ((heightContext + this.config.marginContext.top + this.config.marginContext.bottom) * seriesPos) + ')');

                let style = 'stroke:' + series.color + ';';
                let chartTypeContext;

                // For now, all anomalies are shown as red, but this could be changed to be a
                // configurable parameter that is passed in with the series, like series.color.
                let anomalyColor = 'red';

                // If type is bar AND the data isn't too long, render a bar plot
                if (series.type === 'bar' && series.data.length < this.width) {
                    let barheight = 0;

                    if (series.data.length < 60) {
                        style = 'stroke:#f1f1f1;';
                        barheight++;
                    }

                    let anomalyStyle = style + 'fill: ' + anomalyColor + '; stroke: ' + anomalyColor + ';';
                    style += 'fill:' + series.color + ';';

                    contextContainer.selectAll('.bar')
                        .data(series.data)
                        .enter().append('rect')
                        .attr('class', (d) => {
                            return 'bar ' + d.date;
                        })
                        .attr('style', (d) => {
                            return d.anomaly ? anomalyStyle : style;
                        })
                        .attr('x', (d) => {
                            return this.xContext(d.date);
                        })
                        .attr('width', (d) => {
                            return this.xContext(d3.time[this.config.granularity].utc.offset(d.date, 1)) - this.xContext(d.date);
                        })
                        .attr('y', (d) => {
                            return yContext(Math.max(MIN_VALUE, d.value));
                        })
                        .attr('height', (d) => {
                            let height = isNaN(yContext(d.value) -
                                yContext(MIN_VALUE)) ? MIN_VALUE : yContext(d.value) - yContext(MIN_VALUE);
                            let offset = height / height || 0;
                            let calculatedHeight = Math.abs(height) + (offset * barheight);
                            return calculatedHeight;
                        });
                } else {
                    // If type is line, render a line plot
                    if (series.type === 'line') {
                        chartTypeContext = d3.svg.line()
                            .x((d: any) => {
                                return this.xContext(d.date);
                            })
                            .y((d: any) => {
                                return yContext(d.value);
                            });
                    } else {
                        // Otherwise, default to area, e.g. for bars whose data is too long
                        style += 'fill:' + series.color + ';';
                        chartTypeContext = d3.svg.area()
                            .x((d: any) => {
                                return this.xContext(d.date);
                            })
                            .y0((d: any) => {
                                return yContext(Math.min(MIN_VALUE, d.value));
                            })
                            .y1((d: any) => {
                                return yContext(Math.max(MIN_VALUE, d.value));
                            });
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
                            .attr('cx', (d: any) => {
                                if (series.data.length === 1) {
                                    return this.width / 2;
                                }
                                return this.xContext(d.date);
                            })
                            .attr('cy', (d: any) => {
                                return yContext(d.value);
                            });
                    } else {
                        // If a line graph was used and there are anomalies, put a circle on the
                        // anomalous points
                        let anomalies = series.data.filter(function(it) {
                            return false; // it.anomaly === true;
                        });

                        contextContainer.selectAll('dot')
                            .data(anomalies)
                            .enter().append('circle')
                            .attr('class', 'dot')
                            .attr('style', 'fill:' + anomalyColor + ';')
                            .attr('r', 3)
                            .attr('cx', (d: any) => {
                                return this.xContext(d.date);
                            })
                            .attr('cy', (d: any) => {
                                return yContext(d.value);
                            });
                    }
                }

                this.contextDateToIndex = {};
                series.data.forEach((datum: any, index: number) => {
                    this.contextDateToIndex[datum.date.toUTCString()] = index;
                });

                // Append the highlight bars after the other bars so it is drawn on top.
                this.contextHighlights = [];
                series.data.forEach(() => {
                    let highlight = contextContainer.append('rect')
                        .attr('class', 'highlight')
                        .attr('x', 0).attr('width', 0)
                        .attr('y', -1).attr('height', heightContext + 2)
                        .style('visibility', 'hidden');
                    this.contextHighlights.push(highlight);
                });
            }

            focusContainer.append('line')
                .attr({
                    class: 'mini-axis',
                    x1: 0,
                    x2: this.width - (xOffset * 2),
                    y1: y(MIN_VALUE),
                    y2: y(MIN_VALUE)
                });

            charts.push({
                name: series.name,
                color: series.color,
                yAxis: yAxis,
                index: seriesPos
            });

            seriesPos++;
        };

        // If set, render primary series first
        if (this.primarySeries && this.primarySeries.data.length) {
            createSeries(this.primarySeries);
        }
        // Render all series
        for (i = 0; i < this.data.length; i++) {
            if (!this.data[i].data) {
                // No data, just stop now
                return;
            } else if (this.primarySeries && this.data[i].name === this.primarySeries.name) {
                continue;
            } else if (this.data[i].data.length) {
                createSeries(this.data[i]);
            }
        }

        let gBrush = context.append('g')
            .attr('class', 'brush')
            .on('mousemove', function() {
                // Note that 'this' refers to the SVG, and 'me' is the class instance
                let series = _.find(me.data, {
                    name: me.primarySeries.name
                });
                let index = me.findHoverIndexInData(this, series);
                if (index >= 0 && index < series.data.length) {
                    me.onHover(series.data[index], index);
                }
            })
            .on('mouseover', () => {
                this.onHoverStart();
            })
            .on('mouseout', () => {
                this.onHoverEnd();
            });

        gBrush.append('rect')
            .attr('x', this.width + this.config.marginContext.right)
            .attr('y', -6)
            .attr('width', this.width)
            .attr('height', heightContext + 7)
            .attr('class', 'mask mask-east');

        gBrush.append('rect')
            .attr('x', (0 - (this.width + this.config.marginContext.left)))
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

        for (i = 0; i < charts.length; i++) {
            let focus = this.svg.select('.focus-' + charts[i].name);

            focus.append('g')
                .attr('class', 'y axis series-y')
                .attr('transform', 'translate(0,' + ((this.heightFocus +
                    (this.config.marginFocus.top * 2) + this.config.marginFocus.bottom) * charts[i].index) + ')')
                .call(charts[i].yAxis);

            focus.append('text')
                .attr('class', 'series-title')
                .attr('fill', charts[i].color)
                .attr('transform', 'translate(0,' + (((this.heightFocus +
                    (this.config.marginFocus.top * 2) + this.config.marginFocus.bottom) * charts[i].index) - 5) + ')')
                .text(charts[i].name + ' - Filtered');
        }

        if (this.primarySeries) {
            context.append('text')
                .attr('class', 'series-title')
                .attr('fill', this.primarySeries.color)
                .attr('transform', 'translate(0, 5)')
                .text(this.primarySeries.name);
        }
    }

    drawFocusChart(series: any): any {
        // debugger;
        let MIN_VALUE = this.logarithmic ? 1 : 0;

        this.svg.select('.focus-' + series.name).select('.x.axis').call(this.xAxisFocus);

        let focus = this.svg.select('.focus-' + series.name + ' .' + series.name);

        let yFocus = this.logarithmic ? d3.scale.log().clamp(true).range([this.heightFocus, 0]) :
            d3.scale.linear().range([this.heightFocus, 0]);

        if (this.primarySeries.name === series.name) {
            this.yFocus = yFocus;
        }

        // Get only the data in the brushed area
        let dataShown = _.filter(series.data, (obj: any) => {
            if (this.config.granularity !== 'hour') {
                return (this.xFocus.domain()[0] <= obj.date && obj.date < this.xFocus.domain()[1]);
            }
            return (this.xFocus.domain()[0] <= obj.date && obj.date < this.xFocus.domain()[1]);
        });

        // Use lowest value or 0 for Y-axis domain, whichever is less (e.g. if negative)
        let minY = d3.min(dataShown.map((d: any) => {
            return d.value;
        }));
        minY = this.logarithmic ? 1 : (minY < 0 ? minY : 0);

        // Use highest value for Y-axis domain, or 0 if there is no data
        let maxY = d3.max(dataShown.map((d: any) => {
            return d.value;
        }));
        maxY = maxY ? maxY : MIN_VALUE;

        yFocus.domain([minY, maxY]);

        let yAxis = d3.svg.axis().scale(yFocus).orient('right').ticks(2);

        focus.select('.y.axis.series-y').call(yAxis);

        let style = 'stroke:' + series.color + ';';

        // For now, all anomalies are shown as red, but this could be changed to be a
        // configurable parameter that is passed in with the series, like series.color.
        let anomalyColor = 'red';

        focus.selectAll('rect.bar').remove();
        focus.selectAll('path.' + series.type).remove();

        // If type is bar AND the data isn't too long, render a bar plot
        if (series.type === 'bar' && dataShown.length < this.width) {
            let barheight = 0;

            if (dataShown.length < 60) {
                style = 'stroke:#f1f1f1;';
                barheight++;
            }

            let anomalyStyle = style + 'fill: ' + anomalyColor + '; stroke: ' + anomalyColor + ';';
            style += 'fill:' + series.color + ';';

            focus.selectAll('rect.bar')
                .data(dataShown)
                .enter().append('rect')
                .attr('class', (d: any) => {
                    return 'bar ' + d.date;
                })
                .attr('style', (d: any) => {
                    return d.anomaly ? anomalyStyle : style;
                })
                .attr('x', (d: any) => {
                    return this.xFocus(d.date);
                })
                .attr('width', (d: any) => {
                    return this.xFocus(d3.time[this.config.granularity].utc.offset(d.date, 1)) - this.xFocus(d.date);
                })
                .attr('y', (d: any) => {
                    return yFocus(Math.max(MIN_VALUE, d.value));
                })
                .attr('height', (d: any) => {
                    let height = isNaN(yFocus(d.value) - yFocus(MIN_VALUE)) ? MIN_VALUE : yFocus(d.value) - yFocus(MIN_VALUE);
                    let offset = height / height || 0;
                    let calculatedHeight = Math.abs(height) + (offset * barheight);
                    return calculatedHeight;
                });
        } else {
            let chartType;

            // If type is line, render a line plot
            if (series.type === 'line') {
                chartType = d3.svg.line()
                    .x((d: any) => {
                        return this.xFocus(d.date);
                    })
                    .y((d: any) => {
                        return yFocus(d.value);
                    });
            } else {
                // Otherwise, default to area, e.g. for bars whose data is too long
                style += 'fill:' + series.color + ';';
                chartType = d3.svg.area()
                    .x((d: any) => {
                        return this.xFocus(d.date);
                    })
                    .y0((d: any) => {
                        return yFocus(Math.min(MIN_VALUE, d.value));
                    })
                    .y1((d: any) => {
                        return yFocus(Math.max(MIN_VALUE, d.value));
                    });
            }

            focus.append('path')
                .datum(dataShown)
                .attr('class', series.type)
                .attr('d', chartType)
                .attr('style', style);

            if (dataShown.length < 80) {
                let func = (d) => {
                    return this.xFocus(d.date);
                };
                if (dataShown.length === 1) {
                    func = () => {
                        return this.width / 2;
                    };
                }

                focus.selectAll('circle.dot').remove();

                focus.selectAll('circle.dot')
                    .data(dataShown)
                    .enter().append('circle')
                    .attr('class', 'dot')
                    .attr('style', 'fill:' + series.color + ';')
                    .attr('r', 3)
                    .attr('cx', func)
                    .attr('cy', (d: any) => {
                        return yFocus(d.value);
                    });
            } else {
                // If a line graph was used and there are anomalies, put a circle on the
                // anomalous points
                let anomalies = dataShown.filter(function(it: any) {
                    return it.anomaly === true;
                });

                focus.selectAll('circle.dot').remove();

                focus.selectAll('circle.dot')
                    .data(anomalies)
                    .enter().append('circle')
                    .attr('class', 'dot')
                    .attr('style', 'fill:' + anomalyColor + ';')
                    .attr('r', 3)
                    .attr('cx', (d) => {
                        return this.xFocus(d.date);
                    })
                    .attr('cy', (d) => {
                        return yFocus(d.value);
                    });
            }
        }

        this.focusDateToIndex = {};
        dataShown.forEach((datum: any, index) => {
            this.focusDateToIndex[datum.date.toUTCString()] = index;
        });

        if (this.primarySeries.name === series.name) {
            // Append the highlight bars after the other bars so it is drawn on top.
            this.focusHighlights = [];
            dataShown.forEach(() => {
                let highlight = focus.append('rect')
                    .attr('class', 'highlight')
                    .attr('x', 0).attr('width', 0)
                    .attr('y', -1).attr('height', this.heightFocus + 2)
                    .style('visibility', 'hidden');
                this.focusHighlights.push(highlight);
            });
        }

        return {
            y: yFocus,
            yAxis: yAxis
        };
    }

    updateFocusChart() {
        if (this.data.length && !this.data[0].data) {
            return;
        }

        if (this.brush.extent() && this.brush.extent().length >= 2 &&
            !_.isUndefined(this.brush.extent()[0]) && !_.isUndefined(this.brush.extent()[1])) {
            this.xFocus.domain(this.brush.extent() as any);
        } else {
            this.xFocus.domain(this.xContext.domain());
        }

        this.xDomain = [this.xFocus.domain()[0], this.xFocus.domain()[1]];

        for (let i = 0; i < this.data.length; i++) {
            let series = this.data[i];

            let axis = this.drawFocusChart(series);
            let y = axis.y;

            let xOffset = this.approximateBarWidth / 2;
            if (series.type === 'bar') {
                xOffset = 0;
            }

            this.svg.selectAll('g.' + series.name + ' .mini-axis')
                .attr({
                    x1: 0,
                    x2: this.width - (xOffset * 2),
                    y1: y(this.logarithmic ? 1 : 0),
                    y2: y(this.logarithmic ? 1 : 0)
                });

            this.svg.selectAll('.focus-' + series.name + ' g.y.axis.series-y')
                .call(axis.yAxis);
        }
    }


    updateMask(): void {
        // Snap brush
        if (d3.event) {
            let timeFunction = d3.time[this.config.granularity].utc;

            let extent0: [number, number] = this.brush.extent() as [number, number];
            let extent1;

            if (typeof extent0[0] === 'undefined' || typeof extent0[1] === 'undefined') {
                d3.select(this.element.nativeElement).call(() => {
                    this.brush.clear();
                });
            } else {
                // if dragging, preserve the width of the extent
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
        }

        // Update mask
        let brushElement = $(this.element.nativeElement);
        let xPos = brushElement.find('.extent').attr('x');
        let extentWidth = brushElement.find('.extent').attr('width');
        let width = parseInt(brushElement.find('.mask-west').attr('width').replace('px', ''), 10);

        if (parseFloat(xPos) + parseFloat(extentWidth) < 0 || parseFloat(xPos) > width) {
            xPos = '0';
            extentWidth = '0';
            width = 0;
        }

        if ((extentWidth === '0') &&
            (this.brush.extent() && this.brush.extent().length >= 2 &&
            ((this.brush.extent()[1] as number) - (this.brush.extent()[0] as number) > 0))) {
            // If brush extent exists, but the width is too small, draw masks with a bigger width
            brushElement.find('.mask-west').attr('x', parseFloat(xPos) - width);
            brushElement.find('.mask-east').attr('x', parseFloat(xPos) + 1);
        } else if (extentWidth === '0' || extentWidth === undefined) {
            // If brush extent has been cleared, reset mask positions
            brushElement.find('.mask-west').attr('x', (0 - (width + 50)));
            brushElement.find('.mask-east').attr('x', width + 50);
        } else {
            // Otherwise, update mask positions to new extent location
            brushElement.find('.mask-west').attr('x', parseFloat(xPos) - width);
            brushElement.find('.mask-east').attr('x', parseFloat(xPos) + parseFloat(extentWidth));
        }

        this.updateFocusChart();
    }

    /**
     * Returns the hover index in the given data using the given mouse event and xRange function (xContext or xFocus).
     * @param {Object} mouseEvent
     * @param {TimelineSeries} series
     * @method findHoverIndexInData
     * @return {Number}
     */
    findHoverIndexInData(mouseEvent: any, series: TimelineSeries): number {
        let mouseLocation = d3.mouse(mouseEvent);
        let graph_x = this.xContext.invert(mouseLocation[0]);
        let bisect = d3.bisector((d: any) => {
            return d.date;
        }).right;
        return series ? bisect(series.data, graph_x) - 1 : -1;
    }

    /**
     * Performs behavior for hovering over the given datum at the given context timeline index.
     * @param {Object} datum
     * @param {Number} contextIndex
     * @method onHover
     */
    onHover(datum, contextIndex): void {
        this.hoverIndex = contextIndex;
        this.selectIndexedDates(contextIndex, contextIndex + 1);
        //showTooltip(datum, d3.event);

        if (this.hoverListener) {
            let date = datum.date;
            let start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
            let end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, date.getHours());

            if (this.config.granularity === 'hour') {
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1);
            }
            // The years/months/hours start at index 0 and days start at index 1 but due to the timezone
            // we want the last day of the previous month which is index 0.
            // Add an additional 1 to the dates for month/year granularity because they will start
            // in the previous month/year due to the timezone.
            // Include hours to ensure the new start/end dates are in the same timezone as the original date.
            if (this.config.granularity === 'month') {
                start = new Date(date.getFullYear(), date.getMonth() + 1, 0, date.getHours());
                end = new Date(date.getFullYear(), date.getMonth() + 2, 0, date.getHours());
            }
            if (this.config.granularity === 'year') {
                start = new Date(date.getFullYear() + 1, 0, 0, date.getHours());
                end = new Date(date.getFullYear() + 2, 0, 0, date.getHours());
            }

            this.hoverListener(start, end);
        }
    }

    /**
     * Performs behavior for hovering onto all data.
     * @method onHoverStart
     */
    onHoverStart(): void {
        // Nothing
    }

    /**
     * Performs behavior for hovering off of all data.
     * @method onHoverEnd
     */
    onHoverEnd(): void {
        this.hoverIndex = -1;
        this.deselectDate();
        this.hideTooltip();

        if (this.hoverListener) {
            this.hoverListener();
        }
    }

    selectIndexedDates(startIndex, endIndex) {
        this.clearHighlights();
        let primaryData = _.find(this.data, {
            name: this.primarySeries.name
        });

        for (let i = startIndex; i < endIndex; ++i) {
            this.showHighlight(primaryData.data[i].date, primaryData.data[i].value,
                this.contextHighlights[i], this.xContext, this.yContext);

            let focusIndex = this.focusDateToIndex[primaryData.data[i].date.toUTCString()];
            if (focusIndex >= 0) {
                this.showHighlight(primaryData.data[i].date, primaryData.data[i].value,
                    this.focusHighlights[focusIndex], this.xFocus, this.yFocus);
            }
        }
    }

    /**
     * Deselects the date by removing the highlighting in the chart.
     * @method deselectDate
     */
    deselectDate() {
        this.clearHighlights();
    }

    /**
     * Shows the given highlight at the given date with the given value using the given
     * xRange and yRange functions (xContext/yContext or xFocus/yFocus).
     * @param {Date} date
     * @param {Object} highlight
     * @param {Function} xRange
     * @param {Fucntion} yRange
     * @method showHighlight
     */
    showHighlight(date, value, highlight, xRange, yRange) {
        // TODO Create x, width, y, and height functions to combine the calculations for both the highlight bar and the other bars.
        let x = xRange(date);
        let MIN_VALUE = this.logarithmic ? 1 : 0;
        let width = xRange(d3.time[this.config.granularity].utc.offset(date, 1)) - x;
        let y = yRange(Math.max(MIN_VALUE, value));
        let height = Math.abs(yRange(value) - yRange(MIN_VALUE));
        highlight.attr('x', x - 1).attr('width', width + 2).attr('y', y - 1)
            .attr('height', ((isNaN(height) ? MIN_VALUE : height) + 2)).style('visibility', 'visible');
    }

    clearHighlights(): void {
        this.focusHighlights.forEach(function(highlight) {
            highlight.style('visibility', 'hidden');
        });
        this.contextHighlights.forEach(function(highlight) {
            highlight.style('visibility', 'hidden');
        });
    }

    showTooltip(item, mouseEvent): void {
        let count = d3.format('0,000.00')(item.value);
        // Only show the part of the date that makes sense for the selected granularity
        let dateFormat = this.dateFormats[this.config.granularity];
        if (!dateFormat) {
            dateFormat = this.dateFormats.hour;
        }
        let date = d3.time.format.utc(dateFormat)(item.date);

        // Create the contents of the tooltip (#tl-tooltip-container is reused among the various
        // visualizations)
        let html = '<div><strong>Date:</strong> ' + _.escape(date) + '</div>' +
            '<div><strong>Count:</strong> ' + count + '</div>';
        $('#tl-tooltip-container').html(html);
        $('#tl-tooltip-container').show();

        this.positionTooltip(d3.select('#tl-tooltip-container'), mouseEvent);
    }

    positionTooltip(tooltip, mouseEvent): void {
        let attributeLeft = mouseEvent.pageX + 15;
        let tooltipWidth = $('#tl-tooltip-container').outerWidth(true);
        let tooltipHeight = $('#tl-tooltip-container').outerHeight(true);

        if ((attributeLeft + tooltipWidth) > $('body').width()) {
            $('#tl-tooltip-container').removeClass('east');
            $('#tl-tooltip-container').addClass('west');
            tooltip.style('top', (mouseEvent.pageY - (tooltipHeight / 2)) + 'px')
                .style('left', (attributeLeft - tooltipWidth - 30) + 'px');
        } else {
            $('#tl-tooltip-container').removeClass('west');
            $('#tl-tooltip-container').addClass('east');
            tooltip.style('top', (mouseEvent.pageY - (tooltipHeight / 2)) + 'px')
                .style('left', attributeLeft + 'px');
        }
    }

    hideTooltip(): void {
        $('#tl-tooltip-container').hide();
    }
}
