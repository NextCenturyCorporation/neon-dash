'use strict';
/*
 * Copyright 2013 Next Century Corporation
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

charts.scatterplot = function(rootElement, selector, opts) {
    opts = opts || {};
    this.chartSelector = selector;
    this.element = d3.select(rootElement).select(selector);

    this.xAttribute = opts.x;
    this.yAttribute = opts.y;
    this.margin = $.extend({}, charts.scatterplot.DEFAULT_MARGIN, opts.margin || {});

    this.highlight = undefined;

    this.tooltip = d3.select(rootElement)
        .append("div")
        .attr("class", "graph-tooltip")
        .style("opacity", 0);

    this.hoverIndex = -1;
    this.hoverCircles = {};
    this.hoverListener = opts.hoverListener;

    this.x = [];
    this.y = [];
    this.xDomain = [];

    this.hiddenSeries = [];

    if(opts.clickHandler) {
        this.clickHandler = opts.clickHandler;
    }

    this.colors = [];
    this.colorRange = [
        '#39b54a',
        '#37B551',
        '#36B657',
        "#34B65E",
        "#32B765",
        "#30B76B",
        "#2FB872",
        "#2DB879",
        "#2BB97F",
        "#2AB986",
        "#28BA8C",
        "#26BA93",
        "#25BA9A",
        "#23BBA0",
        "#21BBA7",
        "#20BCAE",
        "#1EBCB4",
        "#1CBDBB",
        "#1ABDC2",
        "#19BEC8"
    ];
    this.colorScale = d3.scale.ordinal().range(this.colorRange);

    this.categories = [];

    if(opts.responsive) {
        this.redrawOnResize();
    }

    return this;
};

charts.scatterplot.DEFAULT_HEIGHT = 300;
charts.scatterplot.DEFAULT_WIDTH = 300;
charts.scatterplot.DEFAULT_MARGIN = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
};
charts.scatterplot.DEFAULT_STYLE = {};
charts.scatterplot.DEFAULT_HIGHLIGHT_WIDTH = 4;

charts.scatterplot.prototype.determineWidth = function(element) {
    if(this.userSetWidth) {
        return this.userSetWidth;
    } else if($(element[0]).width() !== 0) {
        return $(element[0]).width();
    }
    return charts.scatterplot.DEFAULT_WIDTH;
};

charts.scatterplot.prototype.determineHeight = function(element) {
    if(this.userSetHeight) {
        return this.userSetHeight;
    } else if($(element[0]).height() !== 0) {
        return $(element[0]).height();
    }
    return charts.scatterplot.DEFAULT_HEIGHT;
};

charts.scatterplot.prototype.drawChart = function() {
    var me = this;

    $(this.element[0]).empty();

    me.height = me.determineHeight(me.element);
    me.width = me.determineWidth(me.element);

    me.svg = me.element.append("svg")
        .attr("width", me.width)
        .attr("height", me.height)
    .append("g")
        .attr("transform", "translate(" + me.margin.left + "," + me.margin.top + ")");
};

charts.scatterplot.prototype.calculateColor = function(seriesObject) {
    var color = this.colorScale(seriesObject.series);
    var hidden = this.hiddenSeries.indexOf(seriesObject.series) >= 0 ? true : false;
    var index = -1;

    for(var i = this.colors.length - 1; i > -1; i--) {
        if(this.colors[i].series === seriesObject.series) {
            index = i;
        }
    }

    var colorObject = {
        color: color,
        series: seriesObject.series,
        total: seriesObject.total,
        min: seriesObject.min,
        max: seriesObject.max,
        data: seriesObject.data,
        hidden: hidden
    };

    // store the color in the registry so we know the color/series mappings
    if(index >= 0) {
        this.colors[index] = colorObject;
    } else {
        this.colors.push(colorObject);
    }

    return color;
};

charts.scatterplot.prototype.getColorMappings = function() {
    var me = this;

    // convert to an array that is in alphabetical order for consistent iteration order
    // var sortedColors = [];
    // for (key in this.colors) {
    //     var color = me.colors[key];
    //     sortedColors.push({ 'color': color, 'series': key});
    // }

    return me.colors;
};

charts.scatterplot.prototype.drawScatter = function(opts) {
    /* jshint loopfunc:true */

    var me = this;
    var i = 0;
    var id;
    var posX;
    var posY;

    if(!($.isArray(opts))) {
        opts = [opts];
    }

    me.data = opts;

    var fullDataSet = [];
    //get list of all data
    for(i = 0; i < opts.length; i++) {
        this.calculateColor(opts[i]);
        if(this.hiddenSeries.indexOf(opts[i].series) === -1) {
            fullDataSet = fullDataSet.concat(opts[i].data);
        }
    }

    me.x = d3.scale.sqrt().range([0, (me.width - me.margin.right)]);

    var xAxis = d3.svg.axis()
        .scale(me.x)
        .orient("bottom")
        .ticks(Math.round(me.width / 100));

    me.y = d3.scale.sqrt().range([(me.height - (me.margin.top + me.margin.bottom)), 0]);

    var yAxis = d3.svg.axis()
        .scale(me.y)
        .orient("left")
        .ticks(Math.round(me.height / 100));

    var color = d3.scale.category10();

    me.x.domain([0,9]).nice();
    me.y.domain([0,8]).nice();
    me.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + ((me.height - (me.margin.top + me.margin.bottom)) / 2) + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", 0)
      .attr("y", 0)
      .style("text-anchor", "end")
      .text("Unpleasant");

    me.svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + ((me.width - me.margin.right)/2) + ",0)")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Active");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + ((me.width - me.margin.right)/2) + "," + (me.height - (me.margin.top + me.margin.bottom)) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Passive");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (me.width - me.margin.right) + "," + ((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Pleasant");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (1.95)*((me.width - me.margin.right)/2) + "," + (0.69)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Happy");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (1.81)*((me.width - me.margin.right)/2) + "," + (0.41)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Elated");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (1.59)*((me.width - me.margin.right)/2) + "," + (0.19)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Excited");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (1.31)*((me.width - me.margin.right)/2) + "," + (0.05)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Alert");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (1.95)*((me.width - me.margin.right)/2) + "," + (1.31)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Contented");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (1.81)*((me.width - me.margin.right)/2) + "," + (1.59)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Serene");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (1.59)*((me.width - me.margin.right)/2) + "," + (1.81)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Relaxed");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (1.31)*((me.width - me.margin.right)/2) + "," + (1.95)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Calm");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (0.05)*((me.width - me.margin.right)/2) + "," + (1.31)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Sad");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (0.19)*((me.width - me.margin.right)/2) + "," + (1.59)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Unhappy");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (0.41)*((me.width - me.margin.right)/2) + "," + (1.81)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Depressed");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (0.69)*((me.width - me.margin.right)/2) + "," + (1.95)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Bored");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (0.05)*((me.width - me.margin.right)/2) + "," + (0.69)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Upset");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (0.19)*((me.width - me.margin.right)/2) + "," + (0.41)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Stressed");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (0.41)*((me.width - me.margin.right)/2) + "," + (0.19)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Nervous");

  me.svg.append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + (0.69)*((me.width - me.margin.right)/2) + "," + (0.05)*((me.height - (me.margin.top + me.margin.bottom))/2) + ")")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Tense");

  me.svg.selectAll(".dot")
      .data(me.data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return me.x(d[1]); })
      .attr("cy", function(d) { return me.y(d[2]); })
      .style("fill", function(d) { return me.colorScale(d[5])})
      .on("mouseover", function(d) {
        me.tooltip.transition()
            .duration(200)
            .style("opacity", 1.0);

        me.tooltip.html("<Strong> Screen Name: </Strong>" + d[4] + "<br><Strong>Text: </Strong>" + d[3])
            .style("left", (d3.select(this).attr("cx") - 100) + "px")
            .style("top", (d3.select(this).attr("cy") - 50) + "px");
    }).on("mouseout", function() {
        me.tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    }).on("click", function(d) {
        if(me.clickHandler) {
            me.clickHandler(d);
        };
    });
  me.legend = me.svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  me.legend.append("rect")
      .attr("x", me.width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  me.legend.append("text")
      .attr("x", me.width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
};

charts.scatterplot.prototype.toggleSeries = function(series) {
    var index = this.hiddenSeries.indexOf(series);
    var activity = '';
    if(index >= 0) {
        this.hiddenSeries.splice(index, 1);
        activity = 'show';
    } else {
        this.hiddenSeries.push(series);
        activity = 'hide';
    }

    if(this.data && this.hiddenSeries.length >= this.data.length) {
        this.hiddenSeries.splice(0);
    }

    this.draw();

    return activity;
};

/**
 * Draws this line chart.  Sets its data to the new data if given.
 * @param {Array} data (Optional)
 * @method draw
 */

charts.scatterplot.prototype.draw = function(data) {
    this.drawChart();
    if(data) {
        this.data = data;
    }
    if(this.data && this.data.length && this.data[0].length) {
        this.drawScatter(this.data);
    }
};

charts.scatterplot.prototype.redrawOnResize = function() {
    var me = this;

    function drawChart() {
        me.draw();
    }

    // Debounce is needed because browser resizes fire this resize even multiple times.
    // Cache the handler so we can remove it from the window on destroy.
    me.resizeHandler = _.debounce(drawChart, 10);
    $(window).resize(me.resizeHandler);
};

charts.scatterplot.prototype.destroy = function() {
    $(window).off('resize', this.resizeHandler);
    $(this.element[0]).empty();
};

