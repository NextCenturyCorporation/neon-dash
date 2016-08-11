'use strict';
/*
 * Copyright 2015 Next Century Corporation
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
charts.CustomGraph = function(rootElement, selector, options) {
    this.rootElement = rootElement;
    this.chartSelector = selector;
    this.oldData = {
        nodes: [],
        links: []
    };

    // Initialize the options first because they're needed to initialize the graph element.
    this.initializeGraphOptions(options || {});
    this.initializeGraphElement();
};

/**
 * Initializes the options for this graph using the given options.
 * @param {Object} options
 * @method initializeGraphOptions
 */
charts.CustomGraph.prototype.initializeGraphOptions = function(options) {
    this.getRenderWidth = function() {
        var defaultWidth = (this.element ? $(this.element[0]).width() : 0) || this.DEFAULT_WIDTH;
        return _.result(options, "getWidth", defaultWidth);
    };

    this.getRenderHeight = function() {
        var defaultHeight = (this.element ? $(this.element[0]).height() : 0) || this.DEFAULT_HEIGHT;
        return _.result(options, "getHeight", defaultHeight);
    };

    this.getNodeSize = function(nodeData) {
        if(options.getNodeSize && _.isFunction(options.getNodeSize)) {
            return options.getNodeSize(nodeData);
        }
        return _.result(options, "getNodeSize", this.DEFAULT_NODE_SIZE);
    };

    this.getNodeColor = function(nodeData) {
        if(options.getNodeColor && _.isFunction(options.getNodeColor)) {
            return options.getNodeColor(nodeData);
        }
        return _.result(options, "getNodeColor", this.DEFAULT_NODE_COLOR);
    };

    this.getNodeOpacity = function(nodeData) {
        if(options.getNodeOpacity && _.isFunction(options.getNodeOpacity)) {
            return options.getNodeOpacity(nodeData);
        }
        return _.result(options, "getNodeOpacity", this.DEFAULT_NODE_OPACITY);
    };

    this.getNodeStrokeColor = function(nodeData) {
        if(options.getNodeStrokeColor && _.isFunction(options.getNodeStrokeColor)) {
            return options.getNodeStrokeColor(nodeData);
        }
        return _.result(options, "getNodeStrokeColor", this.DEFAULT_NODE_STROKE_COLOR);
    };

    this.getNodeStrokeSize = function(nodeData) {
        if(options.getNodeStrokeSize && _.isFunction(options.getNodeStrokeSize)) {
            return options.getNodeStrokeSize(nodeData);
        }
        return _.result(options, "getNodeStrokeSize", this.DEFAULT_NODE_STROKE_SIZE);
    };

    this.getNodeText = function(nodeData) {
        if(options.getNodeText && _.isFunction(options.getNodeText)) {
            return options.getNodeText(nodeData);
        }
        return _.result(options, "getNodeText", "");
    };

    this.getNodeTooltip = function(nodeData) {
        if(options.getNodeTooltip && _.isFunction(options.getNodeTooltip)) {
            return options.getNodeTooltip(nodeData);
        }
        return _.result(options, "getNodeTooltip", (nodeData.name || nodeData.id || ""));
    };

    this.getLinkSize = function(linkData) {
        if(options.getLinkSize && _.isFunction(options.getLinkSize)) {
            return options.getLinkSize(linkData);
        }
        return _.result(options, "getLinkSize", this.DEFAULT_LINK_SIZE);
    };

    this.getLinkColor = function(linkData) {
        if(options.getLinkColor && _.isFunction(options.getLinkColor)) {
            return options.getLinkColor(linkData);
        }
        return _.result(options, "getLinkColor", this.DEFAULT_LINK_STROKE_COLOR);
    };

    this.getLinkOpacity = function(linkData) {
        if(options.getLinkOpacity && _.isFunction(options.getLinkOpacity)) {
            return options.getLinkOpacity(linkData);
        }
        return _.result(options, "getLinkOpacity", this.DEFAULT_LINK_STROKE_OPACITY);
    };

    // this.getLinkArrowhead = function(linkData) {
    //     var name = this.DEFAULT_LINK_ARROWHEAD;
    //     if(options.getLinkArrowhead) {
    //         if(_.isFunction(options.getLinkArrowhead)) {
    //             name = options.getLinkArrowhead(linkData);
    //         } else {
    //             name = options.getLinkArrowhead;
    //         }
    //     }
    //     return "url(#" + name + ")";
    // };

    this.getLinkTooltip = function(linkData) {
        if(options.getLinkTooltip && _.isFunction(options.getLinkTooltip)) {
            return options.getLinkTooltip(linkData);
        }
        return _.result(options, "getLinkTooltip", (linkData.name || linkData.id || ""));
    };

    this.getNodeKeyFunction = options.getNodeKey;
    this.getLinkKeyFunction = options.getLinkKey;

    this.NodeMousemoveHandler = function(nodeData) {
        if(options.nodeMousemoveHandler) {
            options.nodeMousemoveHandler(nodeData);
        }
    };

    this.nodeMouseoutHandler = function(nodeData) {
        if(options.nodeMouseoutHandler) {
            options.nodeMouseoutHandler(nodeData);
        }
    };

    this.nodeClickHandler = function(nodeData) { //xkcd
        if(d3.event.shiftKey && options.nodeShiftClickHandler) {
            options.nodeShiftClickHandler(nodeData);
        } else if(options.nodeClickHandler) {
            options.nodeClickHandler(nodeData);
        }
    };

    this.nodeDoubleClickHandler = function(nodeData) {
        if(options.nodeDoubleClickHandler) {
            options.nodeDoubleClickHandler(nodeData);
        }
    };

    this.linkMousemoveHandler = function(linkData) {
        if(options.linkMousemoveHandler) {
            options.linkMousemoveHandler(linkData);
        }
    };

    this.linkMouseoutHandler = function(linkData) {
        if(options.linkMouseoutHandler) {
            options.linkMouseoutHandler(linkData);
        }
    };

    this.linkClickHandler = function(linkData) { //xkcd
        if(d3.event.shiftKey && options.linkShiftClickHandler) {
            options.linkShiftClickHandler(linkData);
        } else if(options.linkClickHandler) {
            options.linkClickHandler(linkData);
        }
    };
};

// /**
//  * Creates an SVG marker definition in the graph for a link arrowhead with the given name, color, and opacity.
//  * @param {String} name
//  * @param {String} color
//  * @param {Number} opacity
//  * @method createArrowhead
//  */
// charts.CustomGraph.prototype.createArrowhead = function(name, color, opacity) {
//     // Create the definition for the arrowhead markers to be added to the end of each link.
//     // Please note that markerUnits=userSpaceOnUse stops the marker from using the stroke width of its line.
//     this.svg.select("defs").append("svg:marker")
//         .attr("id", name)
//         .attr("viewBox", "0 -5 10 10")
//         .attr("refX", 0)
//         .attr("refY", 0)
//         .attr("markerWidth", this.DEFAULT_LINK_ARROWHEAD_SIZE)
//         .attr("markerHeight", this.DEFAULT_LINK_ARROWHEAD_SIZE)
//         .attr("markerUnits", "userSpaceOnUse")
//         .attr("orient", "auto")
//         .style("fill", color)
//         .style("opacity", opacity)
//         .append("svg:path")
//         .attr("d", "M0,-5L10,0L0,5");
// };

/**
 * Initializes the element for this graph.
 * @method initializeGraphElement
 */
charts.CustomGraph.prototype.initializeGraphElement = function() { //xkcd
    var me = this;

    // Reset element here because it may not get set correctly in the constructor due to an odd race
    // condition issue with angularjs setting the graph's id using $scope.uniqueId.
    me.element = d3.select(me.rootElement).select(me.chartSelector);

    var height = me.getRenderHeight();
    var width = me.getRenderWidth();

    // Remove the SVG created by the previous instance of CustomGraph.
    var svg = me.element.select(".directed-graph-svg");
    if(svg) {
        svg.remove();
    }

    me.svg = me.element.append("svg")
        .attr("class", "directed-graph-svg")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("pointer-events", "all")
        .call(d3.behavior.zoom().on("zoom", me.handleZoom));

    me.svg.append("svg:defs");

    // me.createArrowhead(me.DEFAULT_LINK_ARROWHEAD, me.DEFAULT_LINK_STROKE_COLOR, me.DEFAULT_LINK_STROKE_OPACITY);

    me.vis = me.svg.append('svg:g');

    me.forceLayout = d3.layout.force()
        .charge(-500)
        .linkDistance(100)
        .size([width, height])
        .gravity(0.05);

    me.forceLayoutNodes = me.forceLayout.nodes();
    me.forceLayoutLinks = me.forceLayout.links();
};

/**
 * Updates the data for this graph using the given data.
 * @param {Array} newData
 * @method updateGraphData
 */
charts.CustomGraph.prototype.updateGraphData = function(newData) { //xkcd
    var i;

    newData.nodes = newData.nodes || [];
    newData.links = newData.links || [];

    // The following code updates the nodes and links in the D3 graph.  The forceLayoutNodes and forceLayoutLinks arrays correspond to the SVG DOM elements so don't clear the
    // arrays and recreate all of the objects because doing so is very slow.  Instead, reassign the new data to the existing objects and create or remove objects as needed.

    // Update the data saved in the D3 force layout nodes.
    for(i = 0; i < Math.min(this.oldData.nodes.length, newData.nodes.length); ++i) {
        this.forceLayoutNodes[i] = newData.nodes[i];
    }

    // Add or remove D3 force layout nodes as necessary.
    if(this.oldData.nodes.length < newData.nodes.length) {
        for(i = this.oldData.nodes.length; i < newData.nodes.length; ++i) {
            this.forceLayoutNodes.push(newData.nodes[i]);
        }
    } else if(this.oldData.nodes.length > newData.nodes.length) {
        this.forceLayoutNodes.splice(newData.nodes.length, this.oldData.nodes.length);
    }

    // Update the data saved in the D3 force layout links.
    for(i = 0; i < Math.min(this.oldData.nodes.length, newData.links.length); ++i) {
        this.forceLayoutLinks[i] = newData.links[i];
    }

    // Add or remove D3 force layout links as necessary.
    if(this.oldData.links.length < newData.links.length) {
        for(i = this.oldData.links.length; i < newData.links.length; ++i) {
            this.forceLayoutLinks.push(newData.links[i]);
        }
    } else if(this.oldData.links.length > newData.links.length) {
        this.forceLayoutLinks.splice(newData.links.length, this.oldData.links.length);
    }
};

/**
 * Redraws the nodes and links in the graph.
 * @method redrawNodesAndLinks
 */
charts.CustomGraph.prototype.redrawNodesAndLinks = function() {
    var me = this;
    // console.log("redrawNodesAndLinks1: \n" + JSON.stringify(me.vis.selectAll(".node"), null, 4));
    // console.log("redrawNodesAndLinks2: \n" + JSON.stringify(me.vis.selectAll(".node").attr("r", me.getNodeSize), null, 2));

    me.vis.selectAll(".link")
//        .attr("marker-end", me.getLinkArrowhead)
        .style("stroke", me.getLinkColor)
        .style("stroke-opacity", me.getLinkOpacity)
        .style("stroke-width", me.getLinkSize);

    me.vis.selectAll(".node")
        .attr("r", me.getNodeSize)
        .style("fill", me.getNodeColor)
        .style("opacity", me.getNodeOpacity)
        .style("stroke", me.getNodeStrokeColor)
        .style("stroke-width", me.getNodeStrokeSize);

    me.vis.selectAll(".node-text")
        .attr("dy", "5px")
        .style("fill", me.DEFAULT_NODE_TEXT_COLOR)
        .style("text-anchor", "middle")
        .text(me.getNodeText);
};

/**
 * Updates this graph using the given data.
 * @param {Array} newData
 * @method updateGraph
 */
charts.CustomGraph.prototype.updateGraph = function(newData) { //xkcd
    // console.log("updateGraph newData vs oldData: " + (newData.links == this.oldData.links && newData.nodes == this.oldData.nodes));
    if (newData.links == this.oldData.links && newData.nodes == this.oldData.nodes) {
        //fix this, it will probably break whenever you drag a node or maybe reload the graph or change anything.
        return
    }

    var me = this;
    // if (newData["nodes"])
    //     console.log("in updateGraph1:\n" + JSON.stringify(newData["nodes"][Math.floor(newData["nodes"].length/2)], null, 4));
    me.updateGraphData(newData);
    // if (newData["nodes"])
    //     console.log("in updateGraph2:\n" + JSON.stringify(newData["nodes"][Math.floor(newData["nodes"].length/2)], null, 4));



    var url = "http://lvh.me:5000/graphRequest";

    var client = new XMLHttpRequest();

    client.open("POST", url, false);

    client.setRequestHeader('Content-Type', 'application/json');

    var jsonData = JSON.stringify(newData, null, 4);

    client.send(jsonData);

    if (client.status == 201)
        console.log("The request succeeded!");//\n\nThe response representation was:\n\n" + client.responseText)
    else
        alert("The request did not succeed!\n\nThe response status was: " + client.status + " " + client.statusText + ".");
    // console.log("\nIn updateGraph rest response:\n" + client.responseText);
    // console.log("\nIn updateGraph links:\n" + jsonLinkData);

    var parsed = JSON.parse(client.responseText);

    // var nodeArr = [];

    // for(var x in parsed["nodes"]){
    //   nodeArr.push(parsed["nodes"][x]);
    // }
    // // console.log("xkcd1\n" + parsed);
    // // console.log("xkcd2\n" + JSON.stringify(parsed, null, 4));
    // // console.log("xkcd3\n" + JSON.stringify(parsed["nodes"], null, 4));
    // // console.log("xkcd4\n" + JSON.stringify(parsed["links"], null, 4));

    
    // if (parsed["nodes"] && parsed["links"]) {
    //     var index = parsed["links"].length/2;
    //     console.log("\nIn updateGraph example index:\n" + index);
    //     var link = parsed["links"][index];
    //     console.log("\nIn updateGraph example link:\n" + JSON.stringify(link, null, 4));
    //     if (link) {
    //         var n1 = parsed["nodes"][link["target"]];
    //         var n2 = parsed["nodes"][link["source"]];
    //         console.log("\nIn updateGraph example nodes:\n" + JSON.stringify(n1, null, 4) + "\n" + JSON.stringify(n2, null, 4));
    //     }
    // }
    // else
    //     console.log("\nIn updateGraph nodeArr and linkArr:\n NO DATA IN THIS REQUEST");

    for (var i = 0; i < newData["nodes"].length; i++) {
        newData["nodes"][i]["x"] = parsed["nodes"][i]["x"]
        newData["nodes"][i]["y"] = parsed["nodes"][i]["y"]
        newData["nodes"][i]["px"] = parsed["nodes"][i]["px"]
        newData["nodes"][i]["py"] = parsed["nodes"][i]["py"]
    }


    var lineElements;
    if(newData.links) {
        // Update the data saved in the D3 line elements.
        lineElements = me.vis.selectAll(".link").data(newData.links, me.getLinkKeyFunction);

        // Add new D3 line elements for new data as necessary.
        lineElements.enter().append("line").attr("class", "link")
            .on("click", me.linkClickHandler)
            .on("mousemove", me.createLinkMousemoveHandler(me))
            .on("mouseout", me.createLinkMouseoutHandler(me));

        // Remove old data saved in the D3 line elements.
        lineElements.exit().remove();
    }



    // Update the data saved in the D3 circle elements.
    var circleElements = me.vis.selectAll(".node").data(newData.nodes, me.getNodeKeyFunction);

    // Add new D3 circle elements for new data as necessary.
    circleElements.enter().append("circle").attr("class", "node").call(me.forceLayout.drag)
        .on("click", me.nodeClickHandler)
        .on('dblclick', me.nodeDoubleClickHandler)
        .on("mousemove", me.createNodeMousemoveHandler(me))
        .on("mouseout", me.createNodeMouseoutHandler(me));

    // Remove old data saved in the D3 circle elements.
    circleElements.exit().remove();


    // Update the data saved in the D3 text elements.
    var textElements = me.vis.selectAll(".node-text").data(newData.nodes, me.getNodeKeyFunction);

    // Add new D3 text elements for new data as necessary.
    textElements.enter().append("text").attr("class", "node-text").call(me.forceLayout.drag)
        .on("click", me.nodeClickHandler)
        .on('dblclick', me.nodeDoubleClickHandler)
        .on("mousemove", me.createNodeMousemoveHandler(me))
        .on("mouseout", me.createNodeMouseoutHandler(me));

    // Remove old data saved in the D3 text elements.
    textElements.exit().remove();

    // if (newData["nodes"])
    //     console.log("in updateGraph3:\n" + JSON.stringify(newData["nodes"][Math.floor(newData["nodes"].length/2)], null, 4));
    //     console.log("in updateGraph3:\n" + JSON.stringify(newData["links"][Math.floor(newData["links"].length/2)], null, 4));


    var minRadius = 10;
    var maxRadius = 40;
    var scale = d3.scale.linear().range([minRadius,maxRadius]);
    circleElements.append("circle")
        .attr("r", function(d) {
            console.log(JSON.stringify(d));
            console.log(JSON.stringify(parsed["sizes"][d["key"]]));
            return parsed["sizes"][n["key"]];
    });


    me.redrawNodesAndLinks();

    // if (newData["nodes"])
    //     console.log("in updateGraph4:\n" + JSON.stringify(newData["nodes"][Math.floor(newData["nodes"].length/2)], null, 4));
    //     console.log("in updateGraph4:\n" + JSON.stringify(newData["links"][Math.floor(newData["links"].length/2)], null, 4));

    circleElements.attr("transform", function(nodeData) {
        return "translate(" + (nodeData.x) + "," + (nodeData.y) + ")";
    });

    // if (newData["nodes"])
    //     console.log("in updateGraph5:\n" + JSON.stringify(newData["nodes"][Math.floor(newData["nodes"].length/2)], null, 4));
    //     console.log("in updateGraph5:\n" + JSON.stringify(newData["links"][Math.floor(newData["links"].length/2)], null, 4));

    // a much lower ending value, to limit the number of ticks that must be processed; just a couple, to make sure any necessary updates inside
    // console.log("tickNumber:" + parsed["ticks"]);
    // forceLayout.on("tick") happen, without the slowness of using the force-layout for everything. Maybe.
    var indexMax = parsed["ticks"];
    
    // The index of the force layout tick.
    var index = 1;

    // Whether the node data has been fixed.
    var fixed = false;

    // how does this work? one node at a time, or all at once? Where is that node defined?
    me.forceLayout.on("tick", function(event) {
        // Reset the index to 1 if the force layout alpha is its starting value (0.099); otherwise, increase the index by 1 for each tick.
        // The alpha can be reset to its starting value if the user moves a node before the graph is fixed.
        index = (event.alpha === 0.099 ? 1 : ++index);

        if(lineElements) {
            lineElements.attr("x1", me.getLinkStartXFunction(me))
                .attr("y1", me.getLinkStartYFunction(me))
                .attr("x2", me.getLinkEndXFunction(me))
                .attr("y2", me.getLinkEndYFunction(me));
        }

        circleElements.attr("transform", function(nodeData) {
            return "translate(" + (nodeData.x) + "," + (nodeData.y) + ")";
        });

        textElements.attr("transform", function(nodeData) {
            return "translate(" + (nodeData.x) + "," + (nodeData.y) + ")";
        });

        // Fix the node data once the force layout has passed a specified alpha threshold or after a specified number of ticks.
        if(!fixed && (event.alpha < 0.025 || index > indexMax)) {//250 )) {
            fixed = true;
            // Set the fixed property to true to stop the force layout from moving nodes automatically.  They will only be movable through user dragging.
            circleElements.each(function(nodeData) {
                nodeData.fixed = true;
            });
        }
    });

    // if (newData["nodes"])
    //     console.log("in updateGraph6:\n" + JSON.stringify(newData["nodes"][Math.floor(newData["nodes"].length/2)], null, 4));
    //     console.log("in updateGraph6:\n" + JSON.stringify(newData["links"][Math.floor(newData["links"].length/2)], null, 4));

    if(newData.nodes.length) {
        me.forceLayout.start();
    }

    // if (newData["nodes"])
    //     console.log("in updateGraph7:\n" + JSON.stringify(newData["nodes"][Math.floor(newData["nodes"].length/2)], null, 4));
    //     console.log("in updateGraph7:\n" + JSON.stringify(newData["links"][Math.floor(newData["links"].length/2)], null, 4));

    // Save the data for future redraws.
    me.oldData = {
        nodes: newData.nodes,
        links: newData.links
    };

    // if (newData["nodes"])
    //     console.log("in updateGraph8:\n" + JSON.stringify(newData["nodes"][Math.floor(newData["nodes"].length/2)], null, 4));
    
    // console.log("Nodes after calculation1:\n" + JSON.stringify(newData, null, 4));
    
    // console.log("Nodes after calculation2:\n" + JSON.stringify(newData["nodes"], null, 4) + "\n\n Links after calculation2: \n" + 
    //             JSON.stringify(newData["links"], null, 4));

    // console.log("Nodes after calculation3:\n" + JSON.stringify(newData.nodes, null, 4) + "\n\n Links after calculation3: \n" + 
    //             JSON.stringify(newData.links, null, 4));
};

/**
 * Redraws the graph using its current data.
 * @method redraw
 */
charts.CustomGraph.prototype.redraw = function() {
    if(this.oldData) {
        this.updateGraph(this.oldData);
    }
};

/**
 * Handles zoom by transforming the graph element.
 * @method handleZoom
 */
charts.CustomGraph.prototype.handleZoom = function() { //xkcd
    $(this).children("g").attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
};

/**
 * Shows the graph tooltip containing the given text.
 * @method showTooltip
 */
charts.CustomGraph.prototype.showTooltip = function(text) {  //xkcd don't bother until later
    var html = '<table class="graph-tooltip">' + text + '</table>';
    $('#tooltip-container').html(html);
    $('#tooltip-container').show();

    var attributeLeft = d3.event.pageX + 15;
    var tooltipWidth = $("#tooltip-container").outerWidth(true);
    var tooltipHeight = $("#tooltip-container").outerHeight(true);

    if((attributeLeft + tooltipWidth) > $("body").width()) {
        $("#tooltip-container").removeClass("east");
        $("#tooltip-container").addClass("west");
        d3.select('#tooltip-container')
            .style('top', (d3.event.pageY - (tooltipHeight / 2)) + 'px')
            .style('left', (d3.event.pageX - tooltipWidth - 15) + 'px');
    } else {
        $("#tooltip-container").removeClass("west");
        $("#tooltip-container").addClass("east");
        d3.select('#tooltip-container')
            .style('top', (d3.event.pageY - (tooltipHeight / 2)) + 'px')
            .style('left', attributeLeft + 'px');
    }
};

/**
 * Hides the graph tooltip.
 * @method hideTooltip
 */
charts.CustomGraph.prototype.hideTooltip = function() {
    $('#tooltip-container').hide();
};

/**
 * Returns the link mousemove handler function.
 * @method createLinkMousemoveHandler
 * @return {Function}
 */
charts.CustomGraph.prototype.createLinkMousemoveHandler = function(me) {
    return function(linkData) {
        me.showTooltip(me.getLinkTooltip(linkData));
        me.linkMousemoveHandler(linkData);
    };
};

/**
 * Returns the link mouseout handler function.
 * @method createLinkMouseoutHandler
 * @return {Function}
 */
charts.CustomGraph.prototype.createLinkMouseoutHandler = function(me) {
    return function(linkData) {
        me.hideTooltip();
        me.linkMouseoutHandler(linkData);
    };
};

/**
 * Returns the node mousemove handler function.
 * @method createNodeMousemoveHandler
 * @return {Function}
 */
charts.CustomGraph.prototype.createNodeMousemoveHandler = function(me) {
    return function(nodeData) {
        me.showTooltip(me.getNodeTooltip(nodeData));
        me.NodeMousemoveHandler(nodeData);
    };
};

/**
 * Returns the node mouseout handler function.
 * @method createNodeMouseoutHandler
 * @return {Function}
 */
charts.CustomGraph.prototype.createNodeMouseoutHandler = function(me) {
    return function(nodeData) {
        me.hideTooltip();
        me.nodeMouseoutHandler(nodeData);
    };
};

/**
 * Returns the link start X calculation function.
 * @method getLinkStartXFunction
 * @return {Function}
 */
charts.CustomGraph.prototype.getLinkStartXFunction = function(me) {
    return function(linkData) {
        // Ensure the line starts at the radius of the source node so the line does not overlap the node.
        var sourceSize = me.getNodeSize(linkData.source);
        var length = Math.sqrt(Math.pow(linkData.source.y - linkData.target.y, 2) + Math.pow(linkData.source.x - linkData.target.x, 2));
        var scale = (length - sourceSize) / length;
        var offset = (linkData.source.x - linkData.target.x) - (linkData.source.x - linkData.target.x) * scale;
        return linkData.source.x - offset;
    };
};

/**
 * Returns the link end X calculation function.
 * @method getLinkEndXFunction
 * @return {Function}
 */
charts.CustomGraph.prototype.getLinkEndXFunction = function(me) {
    return function(linkData) {
        // Ensure the line ends at the arrowhead which ends at the radius of the target node so the line does not overlap the node.
        var targetSize = me.getNodeSize(linkData.target) + me.DEFAULT_LINK_ARROWHEAD_SIZE;
        var length = Math.sqrt(Math.pow(linkData.target.y - linkData.source.y, 2) + Math.pow(linkData.target.x - linkData.source.x, 2));
        var scale = (length - targetSize) / length;
        var offset = (linkData.target.x - linkData.source.x) - (linkData.target.x - linkData.source.x) * scale;
        return linkData.target.x - offset;
    };
};

/**
 * Returns the link start Y calculation function.
 * @method getLinkStartYFunction
 * @return {Function}
 */
charts.CustomGraph.prototype.getLinkStartYFunction = function(me) {
    return function(linkData) {
        // Ensure the line starts at the radius of the source node so the line does not overlap the node.
        var sourceSize = me.getNodeSize(linkData.source);
        var length = Math.sqrt(Math.pow(linkData.source.y - linkData.target.y, 2) + Math.pow(linkData.source.x - linkData.target.x, 2));
        var scale = (length - sourceSize) / length;
        var offset = (linkData.source.y - linkData.target.y) - (linkData.source.y - linkData.target.y) * scale;
        return linkData.source.y - offset;
    };
};

/**
 * Returns the link end Y calculation function.
 * @method getLinkEndYFunction
 * @return {Function}
 */
charts.CustomGraph.prototype.getLinkEndYFunction = function(me) {
    return function(linkData) {
        // Ensure the line ends at the arrowhead which ends at the radius of the target node so the line does not overlap the node.
        var targetSize = me.getNodeSize(linkData.target) + me.DEFAULT_LINK_ARROWHEAD_SIZE;
        var length = Math.sqrt(Math.pow(linkData.target.y - linkData.source.y, 2) + Math.pow(linkData.target.x - linkData.source.x, 2));
        var scale = (length - targetSize) / length;
        var offset = (linkData.target.y - linkData.source.y) - (linkData.target.y - linkData.source.y) * scale;
        return linkData.target.y - offset;
    };
};

/**
 * Returns the node collision detection function.
 * @method getCollisionFunction
 * @return {Function}
 */
charts.CustomGraph.prototype.getCollisionFunction = function() { //xkcd
    return false;
    // var me = this;
    // var quadtree = d3.geom.quadtree(this.forceLayoutNodes);
    // return function(d) {
    //     var r = 2 * me.getNodeSize(d) + 1;
    //     var nx1 = d.x - r;
    //     var nx2 = d.x + r;
    //     var ny1 = d.y - r;
    //     var ny2 = d.y + r;
    //     quadtree.visit(function(quad, x1, y1, x2, y2) {
    //         if(quad.point && (quad.point !== d)) {
    //             var x = d.x - quad.point.x;
    //             var y = d.y - quad.point.y;
    //             var l = Math.sqrt(x * x + y * y);
    //             if(l < r) {
    //                 l = (l - r) / l * 0.5;
    //                 d.x -= x *= l;
    //                 d.y -= y *= l;
    //                 quad.point.x += x;
    //                 quad.point.y += y;
    //             }
    //         }
    //         return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    //     });
    // };
};

/**
 * Pulses the nodes (circle elements) in the graph which pass the given filter function.
 * @param {Function} filterFunction
 * @method pulseNodes
 */
charts.CustomGraph.prototype.pulseNodes = function(filterFunction) {
    var me = this;

    me.vis.selectAll(".node").filter(filterFunction).call(function(nodeData) {
        nodeData.transition().duration(me.TRANSITION_DURATION).attr("r", function(nodeData) {
            return me.getNodeSize(nodeData) * 5;
        }).transition().duration(me.TRANSITION_DURATION).attr("r", me.getNodeSize).ease("sine");
    });
};

charts.CustomGraph.prototype.DEFAULT_WIDTH = 600;
charts.CustomGraph.prototype.DEFAULT_HEIGHT = 350;

charts.CustomGraph.prototype.DEFAULT_NODE_COLOR = "black";
charts.CustomGraph.prototype.DEFAULT_NODE_OPACITY = 1;
charts.CustomGraph.prototype.DEFAULT_NODE_SIZE = 10;
charts.CustomGraph.prototype.DEFAULT_NODE_STROKE_COLOR = "black";
charts.CustomGraph.prototype.DEFAULT_NODE_STROKE_SIZE = 0;
charts.CustomGraph.prototype.DEFAULT_NODE_TEXT_COLOR = "black";

charts.CustomGraph.prototype.DEFAULT_LINK_ARROWHEAD = "default";
charts.CustomGraph.prototype.DEFAULT_LINK_ARROWHEAD_SIZE = 20;
charts.CustomGraph.prototype.DEFAULT_LINK_SIZE = 2;
charts.CustomGraph.prototype.DEFAULT_LINK_STROKE_COLOR = "#999999";
charts.CustomGraph.prototype.DEFAULT_LINK_STROKE_OPACITY = 0.5;

charts.CustomGraph.prototype.TRANSITION_DURATION = 500;
