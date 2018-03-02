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
/// <reference path="../../../../node_modules/@types/d3/index.d.ts" />
import * as _ from 'lodash';
var DEFAULT_MARGIN = 35;
var DEFAULT_HEIGHT = 150;
var DEFAULT_WIDTH = 1000;
var TOOLTIP_ID = '#tl-tooltip-container';
// Create a default data set when we have no records to display.  It defaults to a year from present day.
var DEFAULT_DATA = [
    {
        date: new Date(Date.now()),
        value: 0,
        groupField: null
    }, {
        date: new Date(Date.now() + 31536000000),
        value: 0,
        groupField: null
    }
];
/**
 * Class used for displaying data on the timeline
 */
var TimelineItem = /** @class */ (function () {
    function TimelineItem() {
    }
    return TimelineItem;
}());
export { TimelineItem };
/**
 * A series of data to show on the timeline
 */
var TimelineSeries = /** @class */ (function () {
    function TimelineSeries() {
        this.color = 'green';
        this.data = DEFAULT_DATA;
        this.focusData = [];
        this.name = 'Default';
        this.type = 'bar';
        this.options = {};
        this.startDate = DEFAULT_DATA[0].date;
        this.endDate = DEFAULT_DATA[1].date;
    }
    return TimelineSeries;
}());
export { TimelineSeries };
/**
 * All of the information needed to display the timeline
 */
var TimelineData = /** @class */ (function () {
    function TimelineData() {
        this.data = [];
        this.collapsed = true;
        this.logarithmic = false;
        this.bucketizer = null;
        this.extent = [];
        this.granularity = 'day';
        this.groupField = null;
        this.focusGranularityDifferent = false;
    }
    return TimelineData;
}());
export { TimelineData };
var StackedTimelineSelectorChart = /** @class */ (function () {
    function StackedTimelineSelectorChart(tlComponent, element, data) {
        this.brushHandler = undefined;
        this.dateFormats = {
            year: '%Y',
            month: '%b %Y',
            day: '%d %b %Y',
            hour: '%d %b %Y %H:%M'
        };
        this.xDomain = [];
        // The old extent of the brush saved on brushstart.
        this.oldExtent = [];
        // The data index over which the user is currently hovering changed on mousemove and mouseout.
        this.hoverIndex = -1;
        this.width = DEFAULT_WIDTH - 2 * DEFAULT_MARGIN;
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
        this.colorSet = d3.scale.category20();
    }
    StackedTimelineSelectorChart.prototype.redrawChart = function () {
        // Make the focus chart visible
        this.toggleFocus(this.data.extent.length > 0);
        if (this.data.data) {
            this.render();
            this.renderExtent();
        }
    };
    /**
     * Shows/Hides the focus graph
     * @param {boolean} showFocus Set to true to show the focus graph. False otherwise.
     */
    StackedTimelineSelectorChart.prototype.toggleFocus = function (showFocus) {
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
        }
        else {
            this.marginFocus = {
                top: 0,
                bottom: (this.data.collapsed ? this.determineHeight() : DEFAULT_HEIGHT)
            };
            this.marginContext = {
                top: DEFAULT_MARGIN,
                bottom: 0
            };
        }
    };
    StackedTimelineSelectorChart.prototype.determineWidth = function () {
        var elemWidth = this.element.nativeElement.getBoundingClientRect().width;
        return elemWidth > 0 ? elemWidth : DEFAULT_WIDTH;
    };
    StackedTimelineSelectorChart.prototype.determineHeight = function () {
        var elemHeight = this.element.nativeElement.getBoundingClientRect().height - 45;
        return elemHeight > 0 ? elemHeight : DEFAULT_HEIGHT - 45;
    };
    StackedTimelineSelectorChart.prototype.determineTop = function () {
        var elemTop = this.element.nativeElement.getBoundingClientRect().top;
        return elemTop > 0 ? elemTop : 0;
    };
    StackedTimelineSelectorChart.prototype.determineLeft = function () {
        var elemLeft = this.element.nativeElement.getBoundingClientRect().left;
        return elemLeft > 0 ? elemLeft : 0;
    };
    StackedTimelineSelectorChart.prototype.addBrushHandler = function (handler) {
        var _this = this;
        this.brush.on('brushend', function () {
            if (_this.brush) {
                // If the user clicks on a date inside the brush without moving the brush, change the brush to contain only that date.
                if (_this.hoverIndex >= 0 && _this.oldExtent[0]) {
                    var extent = _this.brush.extent();
                    if (_this.datesEqual(_this.oldExtent[0], extent[0]) && _this.datesEqual(_this.oldExtent[1], extent[1])) {
                        var startDate = _this.data.data[0].data[_this.hoverIndex].date;
                        var endDate = _this.data.data[0].data.length === _this.hoverIndex + 1 ? _this.xDomain[1] :
                            _this.data.data[0].data[_this.hoverIndex + 1].date;
                        _this.brush.extent([startDate.getTime(), endDate.getTime()]);
                    }
                }
                if (handler) {
                    handler(_this.brush.extent());
                }
            }
        });
    };
    StackedTimelineSelectorChart.prototype.clearBrush = function () {
        this.data.extent = [];
        this.oldExtent = [];
        this.brush.clear();
        d3.select(this.element.nativeElement).select('.brush').call(this.brush);
        if (this.data.data.length && this.data.data[0].data) {
            this.render();
        }
    };
    StackedTimelineSelectorChart.prototype.datesEqual = function (a, b) {
        return a.toUTCString() === b.toUTCString();
    };
    StackedTimelineSelectorChart.prototype.renderExtent = function () {
        if (this.data.extent.length !== 2) {
            return;
        }
        var brushElement = this.svg.select('.brush');
        brushElement.call(this.brush.extent(this.data.extent));
        this.updateMask();
    };
    StackedTimelineSelectorChart.prototype.render = function () {
        var _this = this;
        var i = 0;
        var MIN_VALUE = this.data.logarithmic ? 1 : 0;
        this.width = this.determineWidth() - 2 * DEFAULT_MARGIN;
        // Depending on the granularity, the bars are not all the same width (months are different
        // lengths). But this is accurate enough to place tick marks and make other calculations.
        this.approximateBarWidth = 0;
        var svgHeight;
        var heightContext;
        var fullDataSet = [];
        if (this.data.data && this.data.data.length > 0) {
            // Get list of all data to calculate min/max and domain
            for (i = 0; i < this.data.data.length; i++) {
                fullDataSet = fullDataSet.concat(this.data.data[i].data);
                if (this.data.data[i].data && !this.approximateBarWidth) {
                    this.approximateBarWidth = (this.width / this.data.data[i].data.length);
                }
            }
        }
        else {
            return;
        }
        if (this.data.collapsed) {
            svgHeight = this.determineHeight();
            $(this.element.nativeElement[0]).css('height', svgHeight);
            this.heightFocus = Math.max(0, svgHeight - this.marginFocus.top - this.marginFocus.bottom);
            heightContext = Math.max(0, svgHeight - this.marginContext.top - this.marginContext.bottom);
        }
        else {
            svgHeight = DEFAULT_HEIGHT * this.data.data.length;
            $(this.element.nativeElement[0]).css('height', svgHeight);
            this.heightFocus = Math.max(0, DEFAULT_HEIGHT - this.marginFocus.top - this.marginFocus.bottom);
            heightContext = Math.max(0, DEFAULT_HEIGHT - this.marginContext.top - this.marginContext.bottom);
        }
        // Setup the axes and their scales.
        this.xFocus = d3.time.scale.utc().range([0, this.width]);
        this.xContext = d3.time.scale.utc().range([0, this.width]);
        // Save the brush as an instance variable to allow interaction on it by client code.
        this.brush = d3.svg.brush().x(this.xContext).on('brush', function () {
            _this.updateMask();
        });
        if (this.brushHandler) {
            this.brush.on('brushstart', function () {
                _this.oldExtent = _this.brush.extent();
            });
            this.addBrushHandler(this.brushHandler);
        }
        function resizePath(d) {
            var e = +(d === 'e');
            var x = e ? 1 : -1;
            var y = heightContext / 3;
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
        var xMin = d3.min(fullDataSet.map(function (d) {
            return d ? d.date : -1;
        }));
        var xMax = d3.max(fullDataSet.map(function (d) {
            return d ? d3.time[_this.data.granularity].utc.offset(d.date, 1) : -1;
        }));
        this.xDomain = [xMin || new Date(), xMax || new Date()];
        var xFocusDomain = [];
        if (this.data.extent.length === 2) {
            xFocusDomain = [this.data.extent[0], this.data.extent[1]];
        }
        else {
            xFocusDomain = this.xDomain;
        }
        this.xFocus.domain(xFocusDomain);
        this.xContext.domain(this.xDomain);
        this.xAxisFocus = d3.svg.axis().scale(this.xFocus).orient('bottom');
        var xAxisContext = d3.svg.axis().scale(this.xContext).orient('bottom');
        // We don't want the ticks to be too close together, so calculate the most ticks that
        // comfortably fit on the timeline
        var maximumNumberOfTicks = Math.round(this.width / 100);
        // We don't want to have more ticks than buckets (e.g., monthly buckets with daily ticks
        // look funny)
        var minimumTickRange = d3.time[this.data.granularity].utc.range;
        // Get number of ticks for the focus chart
        if (this.xFocus.ticks(minimumTickRange).length < maximumNumberOfTicks) {
            // There's enough room to do one tick per bucket
            this.xAxisFocus.ticks(minimumTickRange);
        }
        else {
            // One tick per bucket at this granularity is too many; let D3 figure out tick spacing.
            // Note that D3 may give us a few more ticks than we specify if it feels like it.
            this.xAxisFocus.ticks(maximumNumberOfTicks);
        }
        // Number of ticks for main chart
        if (this.xContext.ticks(minimumTickRange).length < maximumNumberOfTicks) {
            // There's enough room to do one tick per bucket
            xAxisContext.ticks(minimumTickRange);
        }
        else {
            // One tick per bucket at this granularity is too many; let D3 figure out tick spacing.
            // Note that D3 may give us a few more ticks than we specify if it feels like it.
            xAxisContext.ticks(maximumNumberOfTicks);
        }
        // Clear the old contents by replacing innerhtml
        // Make sure that the tooltip container is present
        d3.select(this.element.nativeElement).html('<div id="tl-tooltip-container"></div>');
        var xCenterOffset = 0;
        // Append our chart graphics
        this.svg = d3.select(this.element.nativeElement)
            .attr('class', 'stacked-timeline-selector-chart')
            .append('svg')
            .attr('height', svgHeight + (2 * DEFAULT_MARGIN))
            .attr('width', this.width + (2 * DEFAULT_MARGIN));
        this.svg.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', this.width - (2 * DEFAULT_MARGIN))
            .attr('height', svgHeight);
        var context = this.svg.append('g')
            .attr('class', 'context')
            .attr('transform', 'translate(' + DEFAULT_MARGIN + ',' + this.marginContext.top + ')');
        context.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(' + xCenterOffset + ',' + heightContext + ')')
            .call(xAxisContext);
        var color = d3.scale.category20();
        var stack = d3.layout.stack()
            .values(function (d) { return d.values; })
            .x(function (d) { return d.date; })
            .y(function (d) { return d.value; });
        var layers = stack(this.data);
        var layer = this.svg.selectAll('.layer')
            .data(layers)
            .enter().append('g');
        context.selectAll('.major text')
            .attr('transform', 'translate(' + (this.approximateBarWidth / 2) + ',0)');
        context.selectAll('.major line')
            .attr('transform', 'translate(' + (this.approximateBarWidth / 2) + ',0)');
        // Render a series
        var seriesPos = 0;
        var charts = [];
        var createSeries = function (series) {
            var xOffset = _this.approximateBarWidth / 2;
            if (series.type === 'bar') {
                xOffset = 0;
            }
            var focus = _this.svg.append('g')
                .attr('class', 'focus-' + series.name)
                .attr('width', _this.width - (2 * DEFAULT_MARGIN))
                .attr('transform', 'translate(' + DEFAULT_MARGIN + ',' + _this.marginFocus.top + ')');
            // Prevents the x-axis from being shown
            if (_this.marginFocus.top === 0) {
                focus.attr('display', 'none');
            }
            focus.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(' + xCenterOffset + ',' + _this.heightFocus + ')')
                .call(_this.xAxisFocus);
            focus.selectAll('.major text')
                .attr('transform', 'translate(' + (_this.approximateBarWidth / 2) + ',0)');
            focus.selectAll('.major line')
                .attr('transform', 'translate(' + (_this.approximateBarWidth / 2) + ',0)');
            var focusContainer = focus.append('g')
                .attr('class', series.name)
                .attr('transform', 'translate(' + xOffset + ',' +
                ((_this.heightFocus + (_this.marginFocus.top * 2) + _this.marginFocus.bottom) * seriesPos) + ')')
                .on('mousemove', function () {
                var index = _this.findHoverIndexInData(series.focusData, _this.xFocus);
                if (index >= 0 && index < series.focusData.length) {
                    _this.onFocusHover(series.focusData[index]);
                }
            })
                .on('mouseout', function () {
                _this.onHoverEnd();
            })
                .on('mousedown', function () {
                var index = _this.findHoverIndexInData(series.focusData, _this.xFocus);
                if (index >= 0 && index < series.focusData.length) {
                    _this.onFocusHover(series.focusData[index]);
                }
            });
            // Calculate the max height based on the whole series
            var yFocus = _this.data.logarithmic ? d3.scale.log().clamp(true).range([_this.heightFocus, 0]) :
                d3.scale.linear().range([_this.heightFocus, 0]);
            // Use lowest value or 0 for Y-axis domain, whichever is less (e.g. if negative)
            var minY = d3.min(series.data.map(function (d) {
                return d.value;
            }));
            minY = _this.data.logarithmic ? 1 : (minY < 0 ? minY : 0);
            // Use highest value for Y-axis domain, or 0 if there is no data
            var maxY = d3.max(series.data.map(function (d) {
                return d.value;
            }));
            maxY = maxY ? maxY : MIN_VALUE;
            yFocus.domain([minY, maxY]);
            var yAxis = d3.svg.axis().scale(yFocus).orient('right').ticks(2);
            // Draw the focus chart
            _this.drawFocusChart(series);
            var yContext = _this.data.logarithmic ?
                d3.scale.log().clamp(true).range([heightContext, 0]) : d3.scale.linear().range([heightContext, 0]);
            yContext.domain(yFocus.domain());
            if (_this.data.primarySeries.name === series.name) {
                _this.yContext = yContext;
            }
            var contextContainer;
            // Only had context timeline on first chart (for when there are multiple charts)
            if (series.name === _this.data.primarySeries.name) {
                contextContainer = context.append('g')
                    .attr('class', series.name)
                    .attr('transform', 'translate(' + xOffset + ',' +
                    ((heightContext + _this.marginContext.top + _this.marginContext.bottom) * seriesPos) + ')');
                var style_1 = 'stroke:' + series.color + ';';
                var chartTypeContext = void 0;
                // If type is bar AND the data isn't too long, render a bar plot
                if (series.type === 'bar' && series.data.length < _this.width) {
                    var barheight_1 = 0;
                    if (series.data.length < 60) {
                        style_1 = 'stroke:#f1f1f1;';
                        barheight_1++;
                    }
                    style_1 += 'fill:' + series.color + ';';
                    contextContainer.selectAll('.bar')
                        .data(series.data)
                        .enter().append('rect')
                        .attr('class', function (d) {
                        return 'bar ' + d.date;
                    })
                        .attr('style', function () {
                        return style_1;
                    })
                        .attr('x', function (d) {
                        return _this.xContext(d.date);
                    })
                        .attr('width', function (d) {
                        return _this.xContext(d3.time[_this.data.granularity].utc.offset(d.date, 1)) - _this.xContext(d.date);
                    })
                        .attr('y', function (d) {
                        return yContext(Math.max(MIN_VALUE, d.value));
                    })
                        .attr('height', function (d) {
                        var height = isNaN(yContext(d.value) -
                            yContext(MIN_VALUE)) ? MIN_VALUE : yContext(d.value) - yContext(MIN_VALUE);
                        return Math.abs(height) + barheight_1;
                    });
                }
                else {
                    // If type is line, render a line plot
                    if (series.type === 'line') {
                        chartTypeContext = d3.svg.line()
                            .x(function (d) {
                            return _this.xContext(d.date);
                        })
                            .y(function (d) {
                            return yContext(d.value);
                        });
                    }
                    else {
                        // Otherwise, default to area, e.g. for bars whose data is too long
                        style_1 += 'fill:' + series.color + ';';
                        chartTypeContext = d3.svg.area()
                            .x(function (d) {
                            return _this.xContext(d.date);
                        })
                            .y0(function (d) {
                            return yContext(Math.min(MIN_VALUE, d.value));
                        })
                            .y1(function (d) {
                            return yContext(Math.max(MIN_VALUE, d.value));
                        });
                    }
                    contextContainer.append('path')
                        .datum(series.data)
                        .attr('class', series.type)
                        .attr('d', chartTypeContext)
                        .attr('style', style_1);
                    if (series.data.length < 80) {
                        contextContainer.selectAll('dot')
                            .data(series.data)
                            .enter().append('circle')
                            .attr('class', 'dot')
                            .attr('style', 'fill:' + series.color + ';')
                            .attr('r', 3)
                            .attr('cx', function (d) {
                            if (series.data.length === 1) {
                                return _this.width / 2;
                            }
                            return _this.xContext(d.date);
                        })
                            .attr('cy', function (d) {
                            return yContext(d.value);
                        });
                    }
                }
                // Append the highlight bars after the other bars so it is drawn on top.
                _this.contextHighlight = contextContainer.append('rect')
                    .attr('class', 'highlight')
                    .attr('x', 0).attr('width', 0)
                    .attr('y', -1).attr('height', heightContext + 2)
                    .style('visibility', 'hidden');
            }
            focusContainer.append('line')
                .attr({
                class: 'mini-axis',
                x1: 0,
                x2: _this.width - (xOffset * 2),
                y1: yFocus(MIN_VALUE),
                y2: yFocus(MIN_VALUE)
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
        if (this.data.primarySeries && this.data.primarySeries.data.length) {
            createSeries(this.data.primarySeries);
        }
        // Render all series
        for (i = 0; i < this.data.data.length; i++) {
            if (!this.data.data[i].data) {
                // No data, just stop now
                return;
            }
            else if (this.data.primarySeries && this.data.data[i].name === this.data.primarySeries.name) {
                // Just skip it
            }
            else if (this.data.data[i].data.length) {
                createSeries(this.data.data[i]);
            }
        }
        var gBrush = context.append('g')
            .attr('class', 'brush')
            .on('mousemove', function () {
            var index = _this.findHoverIndexInData(_this.data.primarySeries.data, _this.xContext);
            if (index >= 0 && index < _this.data.primarySeries.data.length) {
                _this.onHover(_this.data.primarySeries.data[index]);
            }
        })
            .on('mouseout', function () {
            _this.onHoverEnd();
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
        for (i = 0; i < charts.length; i++) {
            var focus_1 = this.svg.select('.focus-' + charts[i].name);
            focus_1.append('g')
                .attr('class', 'y axis series-y')
                .attr('transform', 'translate(0,' + ((this.heightFocus +
                (this.marginFocus.top * 2) + this.marginFocus.bottom) * charts[i].index) + ')')
                .call(charts[i].yAxis);
            focus_1.append('text')
                .attr('class', 'series-title')
                .attr('fill', charts[i].color)
                .attr('transform', 'translate(0,' + (((this.heightFocus +
                (this.marginFocus.top * 2) + this.marginFocus.bottom) * charts[i].index) - 5) + ')')
                .text(charts[i].name + ' - Filtered');
        }
        if (this.data.primarySeries) {
            context.append('text')
                .attr('class', 'series-title')
                .attr('fill', this.data.primarySeries.color)
                .attr('transform', 'translate(0, 5)')
                .text(this.data.primarySeries.name);
        }
    };
    StackedTimelineSelectorChart.prototype.drawFocusChart = function (series) {
        var _this = this;
        var MIN_VALUE = this.data.logarithmic ? 1 : 0;
        this.svg.select('.focus-' + series.name).select('.x.axis').call(this.xAxisFocus);
        var focus = this.svg.select('.focus-' + series.name + ' .' + series.name);
        var yFocus = this.data.logarithmic ? d3.scale.log().clamp(true).range([this.heightFocus, 0]) :
            d3.scale.linear().range([this.heightFocus, 0]);
        if (this.data.primarySeries.name === series.name) {
            this.yFocus = yFocus;
        }
        // Use lowest value or 0 for Y-axis domain, whichever is less (e.g. if negative)
        var minY = d3.min(series.focusData.map(function (d) {
            return d.value;
        }));
        minY = this.data.logarithmic ? 1 : (minY < 0 ? minY : 0);
        // Use highest value for Y-axis domain, or 0 if there is no data
        var maxY = d3.max(series.focusData.map(function (d) {
            return d.value;
        }));
        maxY = maxY ? maxY : MIN_VALUE;
        yFocus.domain([minY, maxY]);
        var yAxis = d3.svg.axis().scale(yFocus).orient('right').ticks(2);
        focus.select('.y.axis.series-y').call(yAxis);
        var style = 'stroke:' + series.color + ';';
        focus.selectAll('rect.bar').remove();
        focus.selectAll('path.' + series.type).remove();
        // If type is bar AND the data isn't too long, render a bar plot
        if (series.type === 'bar' && series.focusData.length < this.width) {
            var barheight_2 = 0;
            if (series.focusData.length < 60) {
                style = 'stroke:#f1f1f1;';
                barheight_2++;
            }
            style += 'fill:' + series.color + ';';
            // Start of stack
            var stack = d3.layout.stack()
                .values(function (d) { return d.values; })
                .x(function (d) { return d.date; })
                .y(function (d) { return d.value; });
            var layers = stack(this.data);
            var categories = this.svg.selectAll('.bar')
                .data(layers)
                .enter().append('g')
                .style('fill', function (d, i) { return this.colorSet(i); });
            var layer = this.svg.selectAll('.layer')
                .data(layers)
                .enter().append('g');
            focus.selectAll('rect.bar')
                .data(series.focusData)
                .enter().append('rect')
                .attr('class', function (d) {
                return 'bar ' + d.date;
            })
                .attr('style', function () {
                return style;
            })
                .attr('x', function (d) {
                return _this.xFocus(d.date);
            })
                .attr('width', function (d) {
                return _this.xFocus(d3.time[_this.data.granularity].utc.offset(d.date, 1)) - _this.xFocus(d.date);
            })
                .attr('y', function (d) {
                return yFocus(Math.max(MIN_VALUE, d.value));
            })
                .attr('height', function (d) {
                var height = isNaN(yFocus(d.value) - yFocus(MIN_VALUE)) ? MIN_VALUE :
                    yFocus(d.value) - yFocus(MIN_VALUE);
                return Math.abs(height) + (barheight_2);
            });
        }
        else {
            var chartType = void 0;
            // If type is line, render a line plot
            if (series.type === 'line') {
                chartType = d3.svg.line()
                    .x(function (d) {
                    return _this.xFocus(d.date);
                })
                    .y(function (d) {
                    return yFocus(d.value);
                });
            }
            else {
                // Otherwise, default to area, e.g. for bars whose data is too long
                style += 'fill:' + series.color + ';';
                chartType = d3.svg.area()
                    .x(function (d) {
                    return _this.xFocus(d.date);
                })
                    .y0(function (d) {
                    return yFocus(Math.min(MIN_VALUE, d.value));
                })
                    .y1(function (d) {
                    return yFocus(Math.max(MIN_VALUE, d.value));
                });
            }
            focus.append('path')
                .datum(series.focusData)
                .attr('class', series.type)
                .attr('d', chartType)
                .attr('style', style);
            if (series.focusData.length < 80) {
                var func = function (d) {
                    return _this.xFocus(d.date);
                };
                if (series.focusData.length === 1) {
                    func = function () {
                        return _this.width / 2;
                    };
                }
                focus.selectAll('circle.dot').remove();
                focus.selectAll('circle.dot')
                    .data(series.focusData)
                    .enter().append('circle')
                    .attr('class', 'dot')
                    .attr('style', 'fill:' + series.color + ';')
                    .attr('r', 3)
                    .attr('cx', func)
                    .attr('cy', function (d) {
                    return yFocus(d.value);
                });
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
    };
    StackedTimelineSelectorChart.prototype.updateMask = function () {
        var _this = this;
        // Snap brush
        if (d3.event) {
            var timeFunction = d3.time[this.data.granularity].utc;
            var extent0 = this.brush.extent();
            var extent1 = void 0;
            if (typeof extent0[0] === 'undefined' || typeof extent0[1] === 'undefined') {
                d3.select(this.element.nativeElement).call(function () {
                    _this.brush.clear();
                });
            }
            else {
                // if dragging, preserve the width of the extent
                if (d3.event.mode === 'move') {
                    var d0 = timeFunction.round(extent0[0]);
                    var range = timeFunction.range(extent0[0], extent0[1]);
                    var d1 = timeFunction.offset(d0, range.length);
                    extent1 = [d0, d1];
                }
                else {
                    extent1 = extent0.map(timeFunction.round);
                    extent1[0] = timeFunction.floor(extent0[0]);
                    extent1[1] = timeFunction.ceil(extent0[1]);
                }
                if (extent1[0] < extent1[1]) {
                    this.svg.select('.brush').call(this.brush.extent(extent1));
                }
            }
            this.data.extent = extent1;
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'mouseup') {
                _.debounce(function () {
                    // Update the chart
                    _this.redrawChart();
                    _this.tlComponent.onTimelineSelection(_this.data.extent[0], _this.data.extent[1]);
                }, 500)();
            }
        }
        // Update mask
        var brushElement = $(this.element.nativeElement);
        var xPos = brushElement.find('.extent').attr('x');
        var extentWidth = brushElement.find('.extent').attr('width');
        var width = parseInt(brushElement.find('.mask-west').attr('width').replace('px', ''), 10);
        if (parseFloat(xPos) + parseFloat(extentWidth) < 0 || parseFloat(xPos) > width) {
            xPos = '0';
            extentWidth = '0';
            width = 0;
        }
        if ((extentWidth === '0') &&
            (this.brush.extent() && this.brush.extent().length >= 2 &&
                (this.brush.extent()[1] - this.brush.extent()[0] > 0))) {
            // If brush extent exists, but the width is too small, draw masks with a bigger width
            brushElement.find('.mask-west').attr('x', parseFloat(xPos) - width);
            brushElement.find('.mask-east').attr('x', parseFloat(xPos) + 1);
        }
        else if (extentWidth === '0' || extentWidth === undefined) {
            // If brush extent has been cleared, reset mask positions
            brushElement.find('.mask-west').attr('x', (0 - (width + 50)));
            brushElement.find('.mask-east').attr('x', width + 50);
        }
        else {
            // Otherwise, update mask positions to new extent location
            brushElement.find('.mask-west').attr('x', parseFloat(xPos) - width);
            brushElement.find('.mask-east').attr('x', parseFloat(xPos) + parseFloat(extentWidth));
        }
    };
    /**
     * Returns the hover index in the given data using the given mouse event and xRange function (xContext or xFocus).
     */
    StackedTimelineSelectorChart.prototype.findHoverIndexInData = function (data, domain) {
        // To get the actual svg, you have to use [0][0]
        var mouseLocation = d3.mouse(this.svg[0][0]);
        // Subtract the margin, or else the cursor location may not match the highlighted bar
        var graph_x = domain.invert(mouseLocation[0] - DEFAULT_MARGIN);
        var bisect = d3.bisector(function (d) {
            return d.date;
        }).right;
        return data ? bisect(data, graph_x) - 1 : -1;
    };
    /**
     * Performs behavior for hovering over the given datum at the given context timeline index.
     */
    StackedTimelineSelectorChart.prototype.onHover = function (datum) {
        this.showTooltip(datum, d3.event);
        this.clearHighlights();
        // Show highlights
        this.showHighlight(datum, this.contextHighlight, this.xContext, this.yContext);
        // Check if there is focus data, and if the selection is within range
        var focusData = this.data.primarySeries.focusData;
        if (focusData.length > 0 && focusData[0].date <= datum.date &&
            datum.date <= focusData[focusData.length - 1].date) {
            if (this.data.focusGranularityDifferent) {
                var startDate = this.data.bucketizer.roundDownBucket(datum.date);
                var endDate = d3.time[this.data.bucketizer.getGranularity()]
                    .utc.offset(startDate, 1);
                this.showFocusMultiHighlight(startDate, endDate);
            }
            else {
                // Just draw it
                this.showHighlight(datum, this.focusHighlight, this.xFocus, this.yFocus);
            }
        }
    };
    /**
     * Hovering over focus means that we may need to get the bucket that the hovered data came from,
     * and highlight that in the main chart in case the focus has a different time interval
     * @param datum
     */
    StackedTimelineSelectorChart.prototype.onFocusHover = function (datum) {
        var bucketData = datum;
        if (this.data.focusGranularityDifferent && this.data.bucketizer) {
            var index = this.data.bucketizer.getBucketIndex(datum.date);
            bucketData = this.data.primarySeries.data[index];
        }
        this.showTooltip(datum, d3.event);
        this.clearHighlights();
        this.showHighlight(bucketData, this.contextHighlight, this.xContext, this.yContext);
        this.showHighlight(datum, this.focusHighlight, this.xFocus, this.yFocus);
    };
    /**
     * Performs behavior for hovering off of all data.
     * @method onHoverEnd
     */
    StackedTimelineSelectorChart.prototype.onHoverEnd = function () {
        this.clearHighlights();
        this.hideTooltip();
    };
    /**
     * Shows the given highlight at the given date with the given value using the given
     * xRange and yRange functions (xContext/yContext or xFocus/yFocus).
     */
    StackedTimelineSelectorChart.prototype.showFocusMultiHighlight = function (startDate, endDate) {
        // TODO Create x, width, y, and height functions to combine the calculations for both the highlight bar and the other bars.
        var x = this.xFocus(startDate);
        var MIN_VALUE = this.data.logarithmic ? 1 : 0;
        var width = this.xFocus(endDate) - x;
        var y = this.yFocus(Math.max(MIN_VALUE, 9999));
        var height = Math.abs(this.yFocus(9999) - this.yFocus(MIN_VALUE));
        this.focusMultiHighlight.attr('x', x - 1).attr('width', width + 2).attr('y', y - 1)
            .attr('height', ((isNaN(height) ? MIN_VALUE : height) + 2)).style('visibility', 'visible');
    };
    /**
     * Shows the given highlight at the given date with the given value using the given
     * xRange and yRange functions (xContext/yContext or xFocus/yFocus).
     */
    StackedTimelineSelectorChart.prototype.showHighlight = function (d, highlight, xRange, yRange) {
        // TODO Create x, width, y, and height functions to combine the calculations for both the highlight bar and the other bars.
        var x = xRange(d.date);
        var MIN_VALUE = this.data.logarithmic ? 1 : 0;
        var width = xRange(d3.time[this.data.granularity].utc.offset(d.date, 1)) - x;
        var y = yRange(Math.max(MIN_VALUE, d.value));
        var height = Math.abs(yRange(d.value) - yRange(MIN_VALUE));
        highlight.attr('x', x - 1).attr('width', width + 2).attr('y', y - 1)
            .attr('height', ((isNaN(height) ? MIN_VALUE : height) + 2)).style('visibility', 'visible');
    };
    StackedTimelineSelectorChart.prototype.clearHighlights = function () {
        this.focusHighlight.style('visibility', 'hidden');
        this.focusMultiHighlight.style('visibility', 'hidden');
        this.contextHighlight.style('visibility', 'hidden');
    };
    StackedTimelineSelectorChart.prototype.showTooltip = function (item, mouseEvent) {
        var count = d3.format('0,000.00')(item.value);
        // Only show the part of the date that makes sense for the selected granularity
        var dateFormat = this.dateFormats[this.data.granularity];
        if (!dateFormat) {
            dateFormat = this.dateFormats.hour;
        }
        var date = d3.time.format.utc(dateFormat)(item.date);
        // Create the contents of the tooltip (#tl-tooltip-container is reused among the various
        // visualizations)
        var html = '<div><strong>Date:</strong> ' + _.escape(date) + '</div>' +
            '<div><strong>Count:</strong> ' + count + '</div>';
        $(TOOLTIP_ID).html(html);
        $(TOOLTIP_ID).show();
        // Calculate the tooltip position
        var MIN_VALUE = this.data.logarithmic ? 1 : 0;
        this.positionTooltip(d3.select(TOOLTIP_ID), mouseEvent);
    };
    StackedTimelineSelectorChart.prototype.positionTooltip = function (tooltip, mouseEvent) {
        var tooltipElement = $(TOOLTIP_ID);
        var tooltipWidth = tooltipElement.outerWidth(true);
        var tooltipHeight = tooltipElement.outerHeight(true);
        var attributeLeft = mouseEvent.pageX - this.determineLeft() + 10;
        var attributeTop = mouseEvent.pageY - this.determineTop() + (tooltipHeight / 2) - 15 - 45;
        if ((attributeLeft + tooltipWidth) > this.determineWidth()) {
            tooltipElement.removeClass('east');
            tooltipElement.addClass('west');
            tooltip.style('top', (attributeTop + 'px'))
                .style('left', (attributeLeft - tooltipWidth - 30) + 'px');
        }
        else {
            tooltipElement.removeClass('west');
            tooltipElement.addClass('east');
            tooltip.style('top', (attributeTop + 'px'))
                .style('left', attributeLeft + 'px');
        }
    };
    StackedTimelineSelectorChart.prototype.hideTooltip = function () {
        $(TOOLTIP_ID).hide();
    };
    return StackedTimelineSelectorChart;
}());
export { StackedTimelineSelectorChart };
//# sourceMappingURL=stacked-timelineSelectorChart.js.map