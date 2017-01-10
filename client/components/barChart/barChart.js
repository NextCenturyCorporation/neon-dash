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

/**
 *
 * Creates a new bar chart component
 * @namespace charts
 * @class BarChart
 * @param {String} chartSelector The selector for the component in which the chart will be drawn
 * @param {Object} opts A collection of key/value pairs used for configuration parameters:
 * <ul>
 *     <li>data (required) - An array of data with the specified x-y data values (note the `y` is optional - see the
 *     description of the `y` parameter).</li>
 *     <li>x (required) - The name of the x-attribute or a function that takes 1 parameter (the current item)
 *     and returns the x value from the item. Note that all x-values must be of the same data type</li>
 *     <li>y (optional) - The name of the y-attribute. If not specified, each item will contribute 1 to the current count.</li>
 *     <li>xLabel (optional) - The label to show for the x-attribute (e.g. on tooltips). If not specified, this will
 *     default to using the name of the attribute specified in x (if x is a function, then the value "x" will be used).
 *     This is useful if the x-attribute name is not the same as how it should be displayed to users.</li>
 *     <li>yLabel (optional) - The label to show for the y-attribute (e.g. on tooltips). If not specified, this will
 *     default to using the name of the attribute specified in y (if no y value is specified, then the value "Count" will be used).
 *     This is useful if the y-attribute name is not the same as how it should be displayed to users.</li>
 *     <li>responsive (optional) - If true, the chart will size to the width and height of the parent html element containing the chart</li>
 *     <li>height (optional) - The height of the chart in pixels. If not specified, a preconfigured default value will be used.</li>
 *     <li>width (optional) - The width of the chart in pixels. This will be honored as closely as possible, while still allowing bar widths to be evenly drawn. If not specified, a preconfigured default value will be used.</li>
 *     <li>margin (optional) - An object with any of the elements `top`, `left`, `bottom` or `right`. These are pixel values to override the default margin. If not specified, a preconfigured default value will be used.</li>
 *     <li>style (optional) - a mapping of a bar state to the different attributes to style for that attribute. The available bar states
 *     are active (default bar state), inactive (a visual state to indicate to the user that the bar should be seen
 *     as inactive - the meaning of this is chart specified - see {{#crossLink "charts.BarChart/setInactive"}}{{/crossLink}}),
 *     and hover. The attributes that can be toggled correspond
 *     to the underlying svg type used to render the bar. For example, to modify the the active/inactive bar states,
 *     but not do anything on hover this attribute would be
 *     `{ "active" : { "fill" : "blue" }, "inactive" : { "fill" : "red" } }`. The values for the attributes can also be functions
 *     to compute the values. The function takes 2 parameters - the current data for the bar and its index.</li>
 *     <li>tickFormat (optional) - The format of the tick labels on the x-axis. Use the formatting specified by d3 at
 *     <a href="https://github.com/mbostock/d3/wiki/API-Reference">D3 API reference</a>. The actual d3 format object is
 *     required, not just the string to format it, such as `d3.format('04d')`. The type of formatting used
 *     will vary based on the axis values. If not specified, a preconfigured default value will be used.</li>
 *     <li>tickValues (optional) - A list of tick values to show on the chart. If not specified, all bars will be labeled</li>
 *     <li>categories (optional) - A list of values to use as the x-axis categories (bins). This can also be a function
 *     that takes 1 parameter (the data) and will compute the categories. If not specified, all unique values from the
 *     x-attribute will used as the category values</li>
 *     <li>init (optional) - An optional method for the bar chart to invoke before aggregating the data, but after setting
 *     up the x/y attributes. This allows callers to use the {{#crossLink "charts.BarChart/categoryForItem"}}{{/crossLink}})
 *     method to perform any preprocessing. This is useful because the bar chart will take the appropriate action to
 *     resolve the x attribute, which can be a string or a function.
 *     The init method is called with a single parameter containing the options passed into the bar chart.</li>

 * </ul>
 *
 * @constructor
 *
 * @example
 *    var data = [
 *    { "country": "US", "events": 9},
 *    { "country": "Japan", "events": 8},
 *    { "country": "China", "events": 2},
 *    { "country": "Japan", "events": 3},
 *    { "country": "US", "events": 1},
 *    { "country": "Canada", "events": 7}
 *    ];
 *    var opts = { "data": data, "x": "country", "y" : "events"};
 *    var barchart = new charts.BarChart('#chart', opts).draw();
 *
 */
charts.BarChart = function(rootElement, selector, opts) {
    opts = opts || {};
    this.chartSelector_ = selector;
    this.element = d3.select(rootElement).select(selector);

    this.setOptsConfiguration(opts);
};

charts.BarChart.prototype.setOptsConfiguration = function(opts) {
    this.isStacked = opts.stacked;

    if(!opts.responsive) {
        this.userSetWidth_ = opts.width;
        this.userSetHeight_ = opts.height;
    }

    this.xAttribute_ = opts.x;
    this.xLabel_ = opts.xLabel || this.determineXLabel_();
    this.xMinAttribute_ = opts.xMin;
    this.yMinAttribute_ = opts.yMin;
    this.yAttribute_ = opts.y;
    this.yLabel_ = opts.yLabel || this.determineYLabel_();

    this.margin = $.extend({}, (opts.useVertical? charts.BarChart.DEFAULT_MARGIN_: charts.BarChart.DEFAULT_HORIZ_MARGIN_), opts.margin || {});

    this.textMargin = 20; //only used in horizontal chart

    // this.viewboxXMin = 0;
    // this.viewboxYMin = 0;
    // this.viewboxXMax = 618;
    // this.viewboxYMax = 270;

    this.maxCategoryLength = 10;

    this.useVertical = opts.useVertical;

    this.colorSet = d3.scale.category20();

    if(opts.init) {
        opts.init.call(this, opts);
    }

    // tick formatting/values may be undefined in which case d3's default will be used
    this.tickFormat_ = opts.tickFormat;
    this.tickValues_ = this.computeTickValues_(opts.tickValues);
    this.categories = this.createCategories_(opts.categories ? opts.categories : this.createCategoriesFromUniqueValues_, opts.data);
    this.truncatedCategories = this.truncateCategories_(this.categories);

    this.data_ = this.aggregateData_(opts.data);

    this.preparePropertiesForDrawing_();
    this.style_ = $.extend({}, charts.BarChart.DEFAULT_STYLE_, opts.style);

    if(opts.responsive) {
        this.redrawOnResize_();
    }

    this.clickHandler = opts.clickHandler;

    this.selectedKey = opts.selectedKey;
};

charts.BarChart.DEFAULT_HEIGHT_ = 250;
charts.BarChart.DEFAULT_WIDTH_ = 600; 
charts.BarChart.DEFAULT_MARGIN_ = {
    top: 10,
    bottom: 45,
    left: 35,
    right: 0
};
charts.BarChart.DEFAULT_HORIZ_MARGIN_ = {
    top: 10,
    bottom: 30,
    left: 55,
    right: 30
};
charts.BarChart.DEFAULT_BAR_WIDTH_ = 15;
charts.BarChart.TOOLTIP_ID_ = 'tooltip';
charts.BarChart.SVG_ELEMENT_ = 'rect';
charts.BarChart.ACTIVE_STYLE_KEY_ = 'active';
charts.BarChart.INACTIVE_STYLE_KEY_ = 'inactive';
charts.BarChart.HOVER_STYLE_KEY_ = 'hover';

// the bar classes are not used for styling directly through the CSS but as
// selectors to indicate which style functions to apply. this is because the styles are
// applied by functions and not by straight CSS
charts.BarChart.BAR_CLASS_ = 'bar';

// the active/inactive/hover classes are additional classes appended to the bars but just use the same name
// as the bar class concatenated with the state, so an active bar would have the classes 'bar active-bar'
charts.BarChart.ACTIVE_BAR_CLASS_ = charts.BarChart.ACTIVE_STYLE_KEY_ + '-' + charts.BarChart.BAR_CLASS_;
charts.BarChart.INACTIVE_BAR_CLASS_ = charts.BarChart.INACTIVE_STYLE_KEY_ + '-' + charts.BarChart.BAR_CLASS_;
charts.BarChart.HOVER_BAR_CLASS_ = charts.BarChart.HOVER_STYLE_KEY_ + '-' + charts.BarChart.BAR_CLASS_;

charts.BarChart.DEFAULT_ACTIVE_BAR_FILL_COLOR_ = 'steelblue';
charts.BarChart.DEFAULT_INACTIVE_BAR_FILL_COLOR_ = 'lightgrey';
charts.BarChart.defaultActiveBarStyle_ = {
    fill: charts.BarChart.DEFAULT_ACTIVE_BAR_FILL_COLOR_
};
charts.BarChart.defaultInactiveBarStyle_ = {
    fill: charts.BarChart.DEFAULT_INACTIVE_BAR_FILL_COLOR_
};
charts.BarChart.defaultHoverBarStyle_ = {};

charts.BarChart.DEFAULT_STYLE_ = {};
charts.BarChart.DEFAULT_STYLE_[charts.BarChart.ACTIVE_STYLE_KEY_] = charts.BarChart.defaultActiveBarStyle_;
charts.BarChart.DEFAULT_STYLE_[charts.BarChart.INACTIVE_STYLE_KEY_] = charts.BarChart.defaultInactiveBarStyle_;
charts.BarChart.DEFAULT_STYLE_[charts.BarChart.HOVER_STYLE_KEY_] = charts.BarChart.defaultHoverBarStyle_;

// d3 maps keys as strings but this prevents us from tying it back to the original data, since the original data
// may have different types
charts.BarChart.NUMERIC_KEY_ = 'numeric';
charts.BarChart.DATE_KEY_ = 'date';
charts.BarChart.BOOLEAN_KEY_ = 'boolean';
charts.BarChart.STRING_KEY_ = 'string';

charts.BarChart.prototype.truncateFormat = function(item) {
    return item.toString().substring(0, this.maxCategoryLength);
};

/**
 * Gets the label for the category (bin on the x-axis) for this item.
 * @param {Object} item
 * @return {Object} The x-value for this item
 * @method categoryForItem
 * @protected
 */
charts.BarChart.prototype.categoryForItem = function(item) {
    var curAttribute_ = (this.useVertical? this.xAttribute_: this.yAttribute_);

    if(typeof curAttribute_ === 'function') {
        return curAttribute_.call(this, item);
    }
    return item[curAttribute_];
};

charts.BarChart.prototype.determineDomainLabel = function(attribute) {
    if(typeof attribute === 'string') {
        return attribute;
    }
    return 'y';
}

charts.BarChart.prototype.determineRangeLabel = function(attribute) {
    return attribute ? attribute : "Count";
}

charts.BarChart.prototype.determineXLabel_ = function() {        //xkcd
    return this.useVertical? this.determineDomainLabel(this.xAttribute_): this.determineRangeLabel(this.xAttribute_);
};

charts.BarChart.prototype.determineYLabel_ = function() {        //xkcd
    return this.useVertical? this.determineRangeLabel(this.yAttribute_): this.determineDomainLabel(this.yAttribute_);
};

charts.BarChart.prototype.createCategories_ = function(categories, data) {
    if(typeof categories === 'function') {
        return categories.call(this, data);
    }
    return categories;
};

charts.BarChart.prototype.computeTickValues_ = function(tickValues) {
    if(typeof tickValues === 'function') {
        return tickValues.call(this);
    }
    return tickValues;
};

charts.BarChart.prototype.calculateMaxValue = function() {
    var maxValue = d3.max(this.data_, function(d) {
        return d.values;
    });

    // may be NaN if no data
    if(!maxValue) {
        maxValue = 0;
    }
    return maxValue;
};

charts.BarChart.prototype.determineViewboxString = function() {
    return this.viewboxXMin + " " + this.viewboxYMin + " " + this.viewboxXMax + " " + this.viewboxYMax;
};

charts.BarChart.prototype.createCategoriesFromUniqueValues_ = function(data) {
    var me = this;
    return _.chain(data)
        .map(function(item) {
            return me.categoryForItem(item);
        })
        .uniq()
        .filter(function(item) {
            return !_.isNull(item) && !_.isUndefined(item);
        })
        .sort(charts.BarChart.sortComparator_)  //this might be where the bars are sorted?
        .value();
};

charts.BarChart.prototype.truncateCategories_ = function(categories) {
    var me = this;
    var truncatedCategories = categories.map(function(item) {
        return item.toString().substring(0, me.maxCategoryLength);
    });
    return truncatedCategories;
};

charts.BarChart.sortComparator_ = function(a, b) {
    if(a instanceof Date && b instanceof Date) {
        return charts.BarChart.compareValues_(a.getTime(), b.getTime());
    }

    if(typeof(a) === 'string' && typeof(b) === 'string') {
        var numA = parseFloat(a);
        var numB = parseFloat(b);
        if(!isNaN(numA) && !isNaN(numB)) {
            return charts.BarChart.compareValues_(numA, numB);
        }
    }

    return charts.BarChart.compareValues_(a, b);
};

charts.BarChart.compareValues_ = function(a, b) {
    if(a < b) {
        return -1;
    }
    if(a > b) {
        return 1;
    }
    return 0;
};

charts.BarChart.prototype.createDomainScale_ = function(span) {
    return d3.scale.ordinal()
        .domain(this.categories)
        .rangeRoundBands(span);
}

charts.BarChart.prototype.createRangeScale_ = function(span) {
    
    var scale = d3.scale.linear()
        .domain([0, this.maxValue])
        .rangeRound(span);

    return scale;
}

charts.BarChart.prototype.createXScale_ = function() {
    return (this.useVertical ? 
                    this.createDomainScale_([0, this.width - this.hMargin_]): 
                    this.createRangeScale_([0, this.width - this.hMargin_]));
};

charts.BarChart.prototype.createYScale_ = function() {
    return (this.useVertical ? 
                    this.createRangeScale_([this.height - this.vMargin_, 0]): 
                    this.createDomainScale_([this.height - this.vMargin_,0]));
};

charts.BarChart.prototype.computePlotHeight_ = function() {
    if(this.categories.length > 0) {
        return this.y.rangeBand() * this.categories.length;
    }
    return this.height;
};

charts.BarChart.prototype.computePlotWidth_ = function() {
    if(this.categories.length > 0) {
        return this.x.rangeBand() * this.categories.length;
    }
    return this.width;
};

charts.BarChart.prototype.createXAxis_ = function() {       //xkcd
    var xAxis = d3.svg.axis()
        .scale(this.x)
        .orient('bottom');

    if (this.useVertical) {

        if(this.tickFormat_) {
            xAxis = xAxis.tickFormat(this.tickFormat_);
        } else {
            xAxis = xAxis.tickFormat(this.truncateFormat);
        }
        if(this.tickValues_) {
            xAxis = xAxis.tickValues(this.tickValues_);
        }
        return xAxis;
    }
    // This puts one tick every 40 pixels (only applicable when the graph is horizontal).
    var numTicks = this.x(this.maxValue) / 40;

    return xAxis.ticks(numTicks).tickFormat(charts.BarChart.createXAxisTickFormat_());
};

charts.BarChart.prototype.createYAxis_ = function() {       //xkcd
    var yAxis = d3.svg.axis()
        .scale(this.y)
        .orient('left');

    if (this.useVertical) {
        return yAxis.ticks(3)
                    .tickFormat(charts.BarChart.createYAxisTickFormat_())
                    .tickValues(this.y.domain());
    }

    if(this.tickFormat_) {
        yAxis = yAxis.tickFormat(this.tickFormat_);
    } else {
        yAxis = yAxis.tickFormat(this.truncateFormat);
    }
    if(this.tickValues_) {
        yAxis = yAxis.tickValues(this.tickValues_);
    }
    return yAxis;
};

charts.BarChart.createXAxisTickFormat_ = function() {       //xkcd
    return function(val) {
        return val === 0 ? val : d3.format('.2s')(val);
    };
};

charts.BarChart.createYAxisTickFormat_ = function() {
    return function(val) {
        return val === 0 ? val : d3.format('.2s')(val);
    };
};

/**
 * Draws the bar chart in the component specified in the constructor
 * @method draw
 * @return {charts.BarChart} This bar chart
 */
charts.BarChart.prototype.draw = function() {
    var me = this;
    d3.selectAll(".barchart").style( "overflow-x", (me.useVertical? "auto": "hidden"));
    d3.selectAll(".barchart").style( "overflow-y", (me.useVertical? "hidden": "auto"));

    me.preparePropertiesForDrawing_();
    $(me.element[0]).empty();
    if(me.plotWidth === 0) {
        me.displayError();
    } else {
        var chart = me.drawChartSVG_();
        if (me.useVertical) {
            me.bindData_(chart);
            me.drawXAxis_(chart);
            me.drawYAxis_(chart);
        }
        else {
            me.drawXAxisAndGrid_(chart);    // in this order so the grid is on bottom
            me.bindData_(chart);            // followed by bars
            me.drawYAxis_(chart);           // with the y-axis (which overlaps the bars) on top
        }
    }

    // me.element.selectAll(charts.BarChart.SVG_ELEMENT_)   //Set different colors for each bar
        // .style('fill', function(d, i) { return me.colorSet(i) });
        // .style("fill","purple");

    // me.element.selectAll(charts.BarChart.SVG_ELEMENT_) //gives a black outline
    //     .style("stroke","black")
    //     .style("stroke-width", 1);

    if(me.selectedKey) {
        var rects = me.element.selectAll(charts.BarChart.SVG_ELEMENT_ + '.' + charts.BarChart.BAR_CLASS_)[0];

        var selectedEl;
        rects.forEach(function(rect) {
            if(rect && rect.__data__ && rect.__data__.key === me.selectedKey) {
                selectedEl = rect;
            }
        });

        me.setBarSelected(selectedEl, me.selectedKey, true);
    }

    return me;
};

charts.BarChart.prototype.preparePropertiesForDrawing_ = function() {       //xkcd
    this.width = this.determineWidth_(this.element);
    this.height = this.determineHeight_(this.element);
    this.setMargins_();

    this.maxValue = this.calculateMaxValue();

    this.x = this.createXScale_();
    this.y = this.createYScale_();

    // set the width/height to be as close to the user specified size (but not larger) so the bars divide evenly into
    // the plot area
    if (this.useVertical) {
        this.plotWidth = this.computePlotWidth_();
        this.x.rangeRoundBands([this.plotWidth, 0]);
        this.plotHeight = this.height;
    }
    else {
        this.plotHeight = this.computePlotHeight_();
        this.y.rangeRoundBands([0, this.plotHeight]);
        this.plotWidth = this.width;
    }
    this.xAxis_ = this.createXAxis_();
    this.yAxis_ = this.createYAxis_();
};

/**
 * Displays an error to the user describing why the chart could not be drawn.
 * @method displayError
 */
charts.BarChart.prototype.displayError = function() {
    $(this.element[0]).append("<div class='error-text'>" +
        "You've attempted to draw a chart with too many categories.<br/>" +
        "Reduce the number of categories or increase the width of the chart to " +
        this.categories.length + " pixels.</div>");
};

charts.BarChart.prototype.drawChartSVG_ = function() {       //xkcd, this might be wrong
    var chart = this.element
        .append('svg')
        // .attr("viewBox", this.determineViewboxString())
        .attr('id', 'plot')
        .attr("height", this.height-4)
        .attr("width", this.width-4)
        // .append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    return chart;
};

charts.BarChart.prototype.bindData_ = function(chart) {       //xkcd
    var me = this;

    var bars = chart.selectAll(charts.BarChart.SVG_ELEMENT_)
        .data(this.data_)
        .enter()
        .append(charts.BarChart.SVG_ELEMENT_)
        .attr('class', function(d) {
            var classString = charts.BarChart.BAR_CLASS_ + ' ' + charts.BarChart.ACTIVE_BAR_CLASS_;
            if(d.classString) {
                classString = classString + ' ' + d.classString;
            }
            return classString;
        })
        .attr('x', function(d) {
            return (me.useVertical? me.x(d.key): 0);
        })
        .attr('y', function(d) {
            return (me.useVertical? me.y(d.values): me.y(d.key) + me.y.rangeBand()/4); //the latter term to eliminate unnecessary space between bottom bar and x-axis
        })
        .attr('width', (this.useVertical ? 
                            this.x.rangeBand()
                            :
                            function(d) {
                                if(me.xMinAttribute_ && d[me.xMinAttribute_]) {
                                    return me.width - me.hMargin_ - me.x(d[me.xMinAttribute_]);
                                } else {
                                    return me.x(d.values);
                                }
                            })
        )
        .attr('height', (this.useVertical ? 
                            function(d) {
                                if(me.yMinAttribute_ && d[me.yMinAttribute_]) {
                                    return me.height - me.vMargin_ - me.y(d[me.yMinAttribute_]);
                                } else {
                                    return  me.height - me.vMargin_ - me.y(d.values);
                                }
                            }
                            :
                            this.y.rangeBand()*0.7)//FIXME could be any width
        )
        // using the same color for the border of the bars as the svg background gives separation for adjacent bars
        .attr('stroke', '#FFFFFF')
        .on('mousemove', function(d) {
            me.showTooltip_(d, d3.event);
        })
        .on('mouseover', function() {
            me.toggleHoverStyle_(d3.select(this), true);
        })
        .on('mouseout', function() {
            me.toggleHoverStyle_(d3.select(this), false);
            me.hideTooltip_();
        })
        .on('click', function(d) {
            me.setBarSelected(this, d.key);
        });

    // initially all bars active, so just apply the active style
    this.applyStyle_(bars, charts.BarChart.ACTIVE_STYLE_KEY_);

    if (this.useVertical) {
        return;
    }

    var barTextPadding = Math.floor(me.y.rangeBand()/10);

    // places text near the end of each bar.
    chart.selectAll(".bartext")
        .data(me.data_)
        .enter()
        .append('text')
        .attr("class", "bartext")
        // .style("dominant-baseline", "middle") //apparently this isn't supported in IE though. Will have to ask if it matters.
        // .attr("dy","-2.45em")
        .style("text-anchor", function(d)  {
                // So that the text will be inside the bar when it's long, and outside when it's short
                return (d.values > me.maxValue/3 ? "end": "start"); 
            })
        .attr({ 'x':function(d) {
                                    // So that the text will be inside the bar when it's long, and outside when it's short
                                    return me.x(d.values) + (d.values > me.maxValue/3 ? -2: 1) * barTextPadding; 
                                },
                'y':function(d){
                                    return me.y(d.key) + me.y.rangeBand()/4 + me.y.rangeBand()/2;   //one 1/4 for the spacing I put on each bar, and the other to 
                                }                                                                   // move the words to the center of the bar.
            })
        .text(function(d){ return d.values; }).style({'fill':'#333','font-size': 4 + Math.floor(me.y.rangeBand()/4) + 'px'});
;
};


charts.BarChart.prototype.setBarSelected = function(selectedBar, selectedKey, preventClickHandler) {
    this.selectedKey = selectedKey;

    this.element.selectAll(charts.BarChart.SVG_ELEMENT_).classed('unselectedBar', true);

    d3.select(selectedBar).classed('unselectedBar', false);
    d3.select(selectedBar).classed('selectedBar', true);
    if(this.clickHandler && !preventClickHandler) {
        this.clickHandler(selectedKey);
    }
};

charts.BarChart.prototype.clearSelectedBar = function() {
    this.selectedKey = null;
    this.element.selectAll(charts.BarChart.SVG_ELEMENT_).classed('unselectedBar', false);
    this.element.selectAll(charts.BarChart.SVG_ELEMENT_).classed('selectedBar', false);
};

charts.BarChart.prototype.toggleHoverStyle_ = function(selection, hover) {
    selection.classed(charts.BarChart.HOVER_BAR_CLASS_, hover);

    // when hovering, apply the hover style, otherwise revert the style based on the current class
    var style;
    if(hover) {
        style = charts.BarChart.HOVER_STYLE_KEY_;
    } else {
        style = selection.classed(charts.BarChart.ACTIVE_BAR_CLASS_) ?
            charts.BarChart.ACTIVE_STYLE_KEY_ : charts.BarChart.INACTIVE_STYLE_KEY_;
    }

    this.applyStyle_(selection, style);
};

charts.BarChart.prototype.applyStyle_ = function(selection, styleKey) {
    var attrMap = this.style_[styleKey];
    Object.keys(attrMap).forEach(function(key) {
        var attrVal = attrMap[key];
        selection.attr(key, attrVal);
    });
};

/**
 * Sets all data to the inactive state that matches the specified predicate. All other data is marked as active.
 * @param {Function} predicate A function that takes an item as a parameter and returns `true` if it should be inactive,
 * `false` if it should be active
 * @method setInactive
 */
charts.BarChart.prototype.setInactive = function(predicate) {
    var allBars = d3.selectAll('.' + charts.BarChart.BAR_CLASS_);

    // remove existing active/inactive classes then toggle on the correct one. this allows us to keep any other
    // classes (rather than just replacing the class with inactive/active)
    allBars.classed(charts.BarChart.INACTIVE_BAR_CLASS_, false);
    allBars.classed(charts.BarChart.ACTIVE_BAR_CLASS_, false);

    // set any matching the predicate to inactive
    allBars.classed(charts.BarChart.INACTIVE_BAR_CLASS_, predicate);

    // those that are not inactive are set to active
    d3.selectAll('.' + charts.BarChart.BAR_CLASS_ + ':not(.' + charts.BarChart.INACTIVE_BAR_CLASS_ + ')')
        .classed(charts.BarChart.ACTIVE_BAR_CLASS_, true);

    // update the rendered bars
    this.applyStyle_(d3.selectAll('.' + charts.BarChart.ACTIVE_BAR_CLASS_), charts.BarChart.ACTIVE_STYLE_KEY_);
    this.applyStyle_(d3.selectAll('.' + charts.BarChart.INACTIVE_BAR_CLASS_), charts.BarChart.INACTIVE_STYLE_KEY_);
};


charts.BarChart.prototype.showTooltipXaxis_ = function(item, mouseEvent) {
    if (!this.useVertical) {
        return;
    }

    var yValue = 0;
    this.data_.forEach(function(d) {
        if(item === d.key) {
            yValue = d.values;
        }
    });

    var html = this.createTooltipBody_(this.xLabel_, this.yLabel_, item, yValue);

    $("#tooltip-container").html(html);
    $("#tooltip-container").show();

    this.positionTooltip_(d3.select('#tooltip-container'), mouseEvent);

    XDATA.userALE.log({
        activity: "show",
        action: "mouseover",
        elementId: "barchart",
        elementType: "tooltip",
        elementSub: "barchart",
        elementGroup: "chart_group",
        source: "user",
        tags: ["tooltip", "barchart"]
    });
};


charts.BarChart.prototype.showTooltipYaxis_ = function(item, mouseEvent) {      //xkcd
    if (this.useVertical) {
        return;
    }
    var xValue = 0;
    this.data_.forEach(function(d) {
        if(item === d.key) {
            xValue = d.values;
        }
    });

    var html = this.createTooltipBody_(this.yLabel_, this.xLabel_, xValue, item);

    $("#tooltip-container").html(html);
    $("#tooltip-container").show();

    this.positionTooltip_(d3.select('#tooltip-container'), mouseEvent);

    XDATA.userALE.log({
        activity: "show",
        action: "mouseover",
        elementId: "barchart",
        elementType: "tooltip",
        elementSub: "barchart",
        elementGroup: "chart_group",
        source: "user",
        tags: ["tooltip", "barchart"]
    });
};

charts.BarChart.prototype.showTooltip_ = function(item, mouseEvent) {      //xkcd
    var xValue = this.isStacked ? (item.values - item[this.xMinAttribute_]) : item.values;
    xValue = d3.format("0,000.00")(xValue);
    var yValue = this.tickFormat_ ? this.tickFormat_(item.key) : item.key;
    
    var html = this.createTooltipBody_(this.yLabel_, this.xLabel_, yValue, xValue);

    $("#tooltip-container").html(html);
    $("#tooltip-container").show();
    this.positionTooltip_(d3.select('#tooltip-container'), mouseEvent);

    XDATA.userALE.log({
        activity: "show",
        action: "mouseover",
        elementId: "barchart",
        elementType: "tooltip",
        elementSub: "barchart",
        elementGroup: "chart_group",
        source: "user",
        tags: ["tooltip", "barchart"]
    });
};

charts.BarChart.prototype.createTooltipBody_ = function(xLabel, yLabel, xValue, yValue) {
    return '<div><strong>' + _.escape(xLabel) + ':</strong> ' + _.escape(xValue) + '</div>' +
                '<div><strong>' + _.escape(yLabel) + ':</strong> ' + _.escape(yValue) + '</div>';
};

charts.BarChart.prototype.positionTooltip_ = function(tooltip, mouseEvent) {
    var attributeLeft = mouseEvent.pageX + 15;
    var tooltipWidth = $("#tooltip-container").outerWidth(true);
    var tooltipHeight = $("#tooltip-container").outerHeight(true);

    if((attributeLeft + tooltipWidth) > $("body").width()) {
        $("#tooltip-container").removeClass("east");
        $("#tooltip-container").addClass("west");
        tooltip.style('top', (mouseEvent.pageY - (tooltipHeight / 2)) + 'px')
            .style('left', (attributeLeft - tooltipWidth - 30) + 'px');
    } else {
        $("#tooltip-container").removeClass("west");
        $("#tooltip-container").addClass("east");
        tooltip.style('top', (mouseEvent.pageY - (tooltipHeight / 2)) + 'px')
            .style('left', attributeLeft + 'px');
    }
};

charts.BarChart.prototype.hideTooltip_ = function() {
    $("#tooltip-container").hide();
    XDATA.userALE.log({
        activity: "hide",
        action: "mouseout",
        elementId: "barchart",
        elementType: "tooltip",
        elementSub: "barchart",
        elementGroup: "chart_group",
        source: "user",
        tags: ["tooltip", "barchart"]
    });
};

charts.BarChart.prototype.drawXAxis_ = function(chart) {
    // this is for the vertical bar chart
    var me = this;

    var axis = chart.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (this.height - this.vMargin_) + ')')
        .call(this.xAxis_);

    axis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function() {
            return "rotate(-60)";
        })
        .text(function(d) {
            if(_.isArray(d)) {
                return "[" + (d[0] || "") + (d.length > 1 ? ",..." : "") + "]";
            }
            return d.length > 6 ? d.substring(0, 6) + "..." : d;
        })
        .on('mouseover', function(d) {
            me.showTooltipXaxis_(d, d3.event);
        })
        .on('mouseout', function() {
            me.hideTooltip_();
        });

    // this.viewboxYMax = this.viewboxYMax + $(this.element[0]).find('g.x')[0].getBoundingClientRect().height;
    // TODO This resizing conflicts with the resizing done by the barchart directive.  Determine whether to remove resizing and the height
    // constructor option from this chart or have this chart measure the dynamically-sized header in the barchart directive.
    //$(this.element[0]).height(this.height - this.margin.bottom + $(this.element[0]).find('g.x')[0].getBoundingClientRect().height);
    // this.viewboxYMax = me.margin.top + me.plotHeight;

    return axis;
};

charts.BarChart.prototype.drawXAxisAndGrid_ = function(chart) {     //xkcd
    // this is for the horizontal bar chart
    var me = this;
    var axis = chart.append('g')
        .attr('class', 'x axis')
        .attr("transform", "translate(0," + (this.margin.top + this.computePlotHeight_()) + ")")
        .call(this.xAxis_);

    // flip the locations of the tick and label, so the label is on bottom and the tick on top.
    // axis.selectAll("line")
    //     .attr("transform", "translate(0," + (this.textMargin/2) + ")");
    
    // axis.selectAll("text")
    //     .attr("transform", "translate(0," + 3*this.textMargin/2 + ")")
        // .attr("transform", "translate(0," + (this.height - this.margin.bottom) + ")")

    // var plotHeight = me.computePlotHeight_();

    var ticks = [];
    // var me = this;
    axis.selectAll(".tick").each(function(data) {
        // collect all the tick values
        ticks.push(data);
    });

    // adds a grid line for each tick mark, aligned with said tick mark
    var grids = chart.append('g')
        .attr('id','grid')
        // .attr('transform',"translate(" + me.margin.left + "," + me.margin.top + ")")
        .selectAll('line')
        .data(ticks)
        .enter()
        .append('line')
        .style("anchor", "end")
        .attr({'x1':function(d,i){ return me.x(d); },
            'y1':function(d){ return 0; },
            'x2':function(d,i){ return me.x(d); },
            'y2':function(d){ return me.margin.top + me.plotHeight; },
        })
        .style({'stroke':'#adadad','stroke-width':'1px'});

    var line = chart.append('g').append('line');
    line.attr({
            'x1':0,
            'y1':me.margin.top + me.plotHeight,//me.height - me.margin.bottom - me.textMargin,//me.height - me.vMargin_,
            'x2':me.width - me.hMargin_,
            'y2':me.margin.top + me.plotHeight,//me.height - me.margin.bottom - me.textMargin,//me.height - me.vMargin_,
            })
        .style({'stroke':'#444','stroke-width':'1px'});

    // this.viewboxYMax = me.margin.top + me.plotHeight;// this.viewboxYMax + $(this.element[0]).find('g.x')[0].getBoundingClientRect().height;
};


charts.BarChart.prototype.drawYAxis_ = function(chart) {        //xkcd
    var me = this;

    var axis = chart.append('g')
        .attr('class', 'y axis')
        .call(me.yAxis_);

    if (me.useVertical) {
        return;
    }


    axis
        .attr("transform", "translate(0," + me.y.rangeBand()/4 + ")") //to align with the bars which were also translated down slightly.
        .selectAll("text")
        .style("text-anchor", "end")
        // .attr("dx", "-1.8em")
        .attr("dy", "-0.28em")
        .text(function(d) {
            if(_.isArray(d)) {
                return "[" + (d[0] || "") + (d.length > 1 ? ",..." : "") + "]";
            }
            return d.length > 8 ? d.substring(0, 6) + "..." : d;
        })
        .on('mouseover', function(d) {
            me.showTooltipYaxis_(d, d3.event);
        })
        .on('mouseout', function() {
            me.hideTooltip_();
        });

    axis.selectAll("line")
        .attr("transform", "translate(0," + (0 - me.y.rangeBand()/4) + ")"); //somehow the ticks aren't aligned with the text or bars.

    console.log("translate(0," + (0 - me.y.rangeBand()/2) + ")");

    if (me.categories.length > 0){

        var line = chart.append('g').append('line');
        line.attr({
                'x1':0,
                'y1':0,
                'x2':0,
                'y2':me.margin.top + me.plotHeight,//me.height - me.margin.bottom - me.textMargin,
                })
            .style({'stroke':'#444','stroke-width':'1px'});
    }
    //It doesn't appear that this is needed?
    // this.viewboxXMax = me.margin.left + me.plotWidth;
    // this.viewboxXMax = this.viewboxXMax + $(this.element[0]).find('g.y')[0].getBoundingClientRect().width;

    // TODO This resizing conflicts with the resizing done by the barchart directive.  Determine whether to remove resizing and the height
    // constructor option from this chart or have this chart measure the dynamically-sized header in the barchart directive.
    //$(this.element[0]).height(this.height - this.margin.bottom + $(this.element[0]).find('g.x')[0].getBoundingClientRect().height);

    return axis;
};

/**
 * Aggregates the data by category
 * @method aggregateData_
 * @param {Array} data The raw data to aggregate
 * @private
 * @return {Object} An array of objects whose keys are `key` and `values`, whose values are the x-category
 * and the number of items in that category period respectively
 */
charts.BarChart.prototype.aggregateData_ = function(data) {
    var aggregated = this.rollupDataByCategory_(data);
    return this.removeDataWithNoMatchingCategory_(aggregated);
};

/**
 * Takes the raw data and aggregates it by category. This is one step in the data aggregation process.
 * @param data
 * @method rollupDataByCategory_
 * @private
 */
charts.BarChart.prototype.rollupDataByCategory_ = function(data) {        //xkcd
    var me = this;

    // if the attributes are non-strings, they must be converted because d3 rolls them up as strings, so
    // check for those cases
    var keyTypes;

    if(me.isStacked) {
        for(var i = 0; i < data.length; i++) {
            var category = me.categoryForItem(data[i]);
            if(keyTypes !== charts.BarChart.STRING_KEY_) {
                var keyType = charts.BarChart.keyType_(category);
                // the first time we see a value, set that as the key type
                if(!keyTypes) {
                    keyTypes = keyType;
                } else if(keyType !== keyTypes) { // if the key type has changed across values, just treat everything as strings
                    keyTypes = charts.BarChart.STRING_KEY_;
                }
                // d3 will convert the date to a string, which loses any milliseconds. so convert it to a time. it will get
                // converted back after the rollup is done
                if(category instanceof Date) {
                    category = category.getTime();
                }
            }

            data[i].key = category;
            data[i].values = data[i][( me.useVertical? me.yAttribute_ :me.xAttribute_)];       //xkcd
        }

        data = data.sort(function(a, b) {
            return b.values - a.values;
        });

        return charts.BarChart.transformByKeyTypes_(data, keyTypes);
    } else {
        var aggregated = d3.nest().key(function(d) {
                var category = me.categoryForItem(d);
                if(keyTypes !== charts.BarChart.STRING_KEY_) {
                    var keyType = charts.BarChart.keyType_(category);
                    // the first time we see a value, set that as the key type
                    if(!keyTypes) {
                        keyTypes = keyType;
                    } else if(keyType !== keyTypes) { // if the key type has changed across values, just treat everything as strings
                        keyTypes = charts.BarChart.STRING_KEY_;
                    }
                    // d3 will convert the date to a string, which loses any milliseconds. so convert it to a time. it will get
                    // converted back after the rollup is done
                    if(category instanceof Date) {
                        category = category.getTime();
                    }
                }
                return category;
            }).rollup(function(d) {
                return d3.sum(d, function(el) {
                    var attrib = ( me.useVertical? me.yAttribute_: me.xAttribute_);
                    return attrib ? el[attrib] : 1;        //xkcd?       this gives the right values to be put into data
                });
            }).entries(data);

        return charts.BarChart.transformByKeyTypes_(aggregated, keyTypes);
    }
};

charts.BarChart.keyType_ = function(value) {
    if(_.isNumber(value)) {
        return charts.BarChart.NUMERIC_KEY_;
    }

    if(_.isDate(value)) {
        return charts.BarChart.DATE_KEY_;
    }

    if(_.isBoolean(value)) {
        return charts.BarChart.BOOLEAN_KEY_;
    }

    // treat everything else as strings. if the user passes an object, results will be unpredictable
    return charts.BarChart.STRING_KEY_;
};

/**
 * d3 stores all keys as strings in the aggregated data. this converts them to the original data type
 * @param aggregatedData
 * @param keyTypes
 * @return {Object} The original data with the keys transformed
 * @private
 * @method transformByKeyTypes_
 */
charts.BarChart.transformByKeyTypes_ = function(aggregatedData, keyTypes) {
    if(keyTypes === charts.BarChart.DATE_KEY_) {
        return charts.BarChart.mapKeysToDates_(aggregatedData);
    }

    if(keyTypes === charts.BarChart.NUMERIC_KEY_) {
        return charts.BarChart.mapKeysToNumbers_(aggregatedData);
    }

    if(keyTypes === charts.BarChart.BOOLEAN_KEY_) {
        return charts.BarChart.mapKeysToBooleans_(aggregatedData);
    }

    return aggregatedData;
};

charts.BarChart.mapKeysToDates_ = function(aggregatedData) {
    return aggregatedData.map(function(d) {
        d.key = new Date(+d.key);
        return d;
    });
};

charts.BarChart.mapKeysToNumbers_ = function(aggregatedData) {
    return aggregatedData.map(function(d) {
        d.key = +d.key;
        return d;
    });
};

charts.BarChart.mapKeysToBooleans_ = function(aggregatedData) {
    return aggregatedData.map(function(d) {
        d.key = (d.key.toLowerCase() === 'true');
        return d;
    });
};

charts.BarChart.prototype.setMargins_ = function() {
    this.hMargin_ = this.margin.left + this.margin.right;
    this.vMargin_ = this.margin.top + this.margin.bottom;
};

/**
 * Removes any data from the aggregate for which there is a key that has no corresponding category. This can
 * happen if the categories are set explicitly rather than pulling them from the data values
 * @param aggregatedData
 * @private
 * @method removeDataWithNoMatchingCategory_
 */
charts.BarChart.prototype.removeDataWithNoMatchingCategory_ = function(aggregatedData) {
    var me = this;
    return _.reject(aggregatedData, function(item) {
        var key = item.key;

        return _.isUndefined(_.find(me.categories, function(category) {
            if(_.isArray(category)) {
                return category.join(",") === key;
            }
            return category === key;
        }));
    });
};

charts.BarChart.prototype.determineLengthDomainSide_ = function(userSetLength, elementLength, defaultLength, margin) {
    
    if(userSetLength) {
        defaultLength = userSetLength;
    } else if(elementLength !== 0) {
        defaultLength = elementLength;
    }

    var calculatedChartLength = (this.categories.length * charts.BarChart.DEFAULT_BAR_WIDTH_) + margin;

    if(calculatedChartLength > defaultLength) {
        return calculatedChartLength;
    }
    return defaultLength;

};

charts.BarChart.prototype.determineLengthRangeSide_ = function(userSetLength, elementLength, defaultLength, margin) {
    if(userSetLength) {
        return userSetLength;
    } else if(elementLength !== 0) {
        return elementLength;
    }
    return defaultLength + margin;
};

charts.BarChart.prototype.determineWidth_ = function(element) {        //xkcd
    if (this.useVertical) {
        return this.determineLengthDomainSide_(this.userSetWidth_, $(element[0]).width(), charts.BarChart.DEFAULT_WIDTH_, this.hMargin_);
    }
    else {
        return this.determineLengthRangeSide_(this.userSetWidth_, $(element[0]).width(), charts.BarChart.DEFAULT_WIDTH_, this.hMargin_);
    }
};

charts.BarChart.prototype.determineHeight_ = function(element) {        //xkcd
    if (this.useVertical) {
        return this.determineLengthRangeSide_(this.userSetHeight_, $(element[0]).height(), charts.BarChart.DEFAULT_HEIGHT_, this.vMargin_);
    }
    else {
        return this.determineLengthDomainSide_(this.userSetHeight_, $(element[0]).height(), charts.BarChart.DEFAULT_HEIGHT_, this.vMargin_);
    }
};

charts.BarChart.prototype.redrawOnResize_ = function() {
    var me = this;

    function drawChart() {
        me.draw();
    }

    // Debounce is needed because browser resizes fire this resize even multiple times.
    // Cache the handler so we can remove it from the window on destroy.
    me.resizeHandler_ = _.debounce(drawChart, 10);
    $(window).resize(me.resizeHandler_);
};

charts.BarChart.prototype.destroy = function() {
    $(window).off('resize', this.resizeHandler_);
    $(this.element[0]).empty();
};
