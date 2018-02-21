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
import { VisualizationService } from '../../services/visualization.service';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseLayeredNeonComponent } from '../base-neon-component/base-layered-neon.component';
import * as _ from 'lodash';
import {
    AbstractGraph,
    GraphData,
    graphType,
    Link,
    Node,
    OptionsFromConfig
} from './ng.type.abstract';

export class NetworkGraphMediator {
    public graphData: GraphData;
    public optionsFromConfig: OptionsFromConfig;
    public node: Node;
    public link: Link;

    public active: {
        node: Node;
        link: Link;
        totalNodes: number;
        totalLinks: number;
        total: number;
        limit: number;
        graphData: GraphData;
    };

    /**
     * Creates, maintains, and updates a directed graph.
     * Takes query result data, creates the nodes and links for the graph, and handles graph styling callbacks.
     * @arg {object} root (required) The root HTML element for the directed graph.
     * @arg {string} selector (required) The HTML class selected for the directed graph.
     * @arg {object} callbacks (required)
     * {function} calculateGraphHeight (required) Returns graph height.
     * {function} calculateGraphWidth (required) Returns graph width.
     * {function} redrawGraph (required) Calls DirectedGraphMediator.redrawGraph within an angular digest.
     * {function} updateSelectedNodeIds (required) Updates the selected nodes in the Neon network graph controller (and related behavior).
     */
    DirectedGraphMediator(graphViewer) {
        //
    }

    /**
     * Creates and shows the graph using the given query result data and graph options.
     * @arg {array} data (required)
     * @arg {object} options (required)
     *          {string} nodeField (required) Field name with a unique ID.  For each ID, a node will be created.
     *          {string} nameField (optional) Field name with the pretty name for each unique node shown in the tooltips.
     *          {string} sizeField (optional) Field name with the numerical size for each unique node (the circle diameter).
     *          {string} dateField (optional) Field name with the date for each unique node.  Used with timeline animation.
     *          {string} flagField (optional) Field name with a boolean flag for each unique node.
     *          Flagged nodes are given a unique color.
     *          {string} linkedNodeField (optional) Field name with an array of unique IDs matching the content of nodeField.
     *          For each ID element in the array, a link will be created.
     *          {string} linkedNameField (optional) Field name with an array of pretty names for each link.
     *          {string} linkedSizeField (optional) Field name with an array of numerical sizes for each linked node,
     *          if that node doesn't exist in the node field.
     *          {string} flagMode (optional) Field name with how to apply the flag.  Either "result" (to the node itself),
     *          "linked" (to all its linked nodes), or "all" (the node and all its links).
     *          {boolean} hideSimpleNetworks (optional) If true, hide all node networks with either zero or one link.
     *          {boolean} useNodeClusters (optional) If true, replace each node network with a cluster node,
     *          and replace all unlinked nodes with a single cluster node.
     */
    evaluateDataAndUpdateGraph(data, options) {
        this.optionsFromConfig = options;

        if (!options.nodeField) {
            return;
        }

        let nodes = [];
        let links = [];

        //Maybe make this its own function?
        //Nah
        data.array.forEach((element) => {
            let nodeId = data[options.nodeField];
            let linkId = data[options.linkField];

            //creates a new node for each unique nodeId
            if (this.isUniqueNode(nodeId)) {
                this.node.id = nodeId;
                this.node.label = '';
                this.node.nodeType = options.nodeField;
                this.node.size = 1;
                this.graphData.nodes.push(this.node);
            } else {
                //TODO: if node is not unique, find the existing node, and increase the size by 1;
                //
            }

            //Creates a node for each unique linkfield
            if (this.isUniqueNode(linkId)) {
                this.node.id = linkId;
                this.node.label = '';
                this.node.nodeType = options.linkField;
                this.node.size = 1;
            } else {
                //TODO: If node is not unique, find the existing node, and increase the size by 1;
            }

            let linkfield = options.linkField.columnName;

            //Generating links
            //If the linkField is an array, it'll generate a link for each linkfield
            if (linkfield.isArray) {

                element[linkfield].forEach((linkArrayLink) => {
                    this.link.source = this.node.id;
                    this.link.target = linkfield;
                    this.link.label = '';
                    this.link.count = 1;
                    this.graphData.links.push(this.link);
                });
            } else {
                this.link.source = this.node.id;
                this.link.target = linkfield;
                this.link.label = '';
                this.link.count = 1;
                this.graphData.links.push(this.link);
            }
            /*
            for(linkfield of element) {

                this.link.source = this.node.id;
                this.link.target = linkfield;
                this.link.label = '';
                this.link.count = 1;
                this.graphData.links.push(this.link);
            }*/

        });

        //TODO Generate the graph
    }

    isUniqueNode(nodeId) {
        let isUnique = true;
        if (this.graphData.nodes.includes(nodeId)) {
            isUnique = false;
        }

        return isUnique;
    }
    /*
        addNodeIfUnique() {

        }
    */
    /**
     * Saves the given nodes and links and updates the network graph using the data.
     * @arg {array} nodes (required) List of node objects with properties:
     *          {string|number} id (required) Unique ID.
     *          {array} dates (required) List of date objects.
     *          {string|number} name (required) Pretty name.
     *          {number} network (required) The ID of the network containing this node.
     *          {number} size (required) Node size to calculate circle diameter.
     *          {string} type (required) Either "node" or "cluster".
     *          {string} key (required) <type>.<id>
     * @arg {array} links (required) List of link objects with properties:
     *          {number} sourceId (required) The source node id.
     *          {number} targetId (required) The target node id.
     *          {array} dates (required) List of date objects in the source and target nodes.
     *          {number} network (required) The ID of the network containing this link.
     *          {string} key (required) <sourceNode.key>-<targetNode.key>
     */
    saveDataAndUpdateGraph(nodes, links) {
        //
    }

    deselectAllNodesAndNetwork() {
        //
    }
    /**
     * Deselects all selected nodes and the selected node network in the graph.
     */

    /**
     * Selects the node in the graph with the given ID and its network.
     * @arg {string|number} selectedNodeId (required)
     */
    selectNodeAndNetworkFromNodeId(selectedNodeId) {
        //
    }

    /**
     * Selects the given date in the graph.
     * @arg {date} date (required)
     */
    selectDate(date) {
        //
    }

    /**
     * Redraws the nodes and links in the graph, updating their styling.
     */
    redrawGraph() {
        //
    }

    /**
     * Sets the bucketizer to the given bucketizer and updates the date buckets using the new bucketizer.
     * @arg {object} bucketizer (required)
     */
    setBucketizer(bucketizer) {
        //
    }

    /**
     * Sets the selected graph node IDs to the given graph node IDs.
     * @arg {array} graphNodeIds (required) List of node IDs.
     */
    setSelectedNodeIds(graphNodeIds) {
        //
    }

    /**
     * Sets the tooltip to a new object using fields from the given tooltip.
     * @arg {object} tooltip (required)
     *          {string} idLabel (optional) EX: User ID
     *          {string} dataLabel (optional) EX: Twitter Users
     *          {string} nameLabel (optional) EX: Username
     *          {string} sizeLabel (optional) EX: Number of Tweets
     *          {string} flagLabel (optional) EX: Celebrity
     *          {string} sourceNameLabel (optional) EX: Followed By
     *          {string} targetNameLabel (optional) EX: Following
     *          {string} sourceSizeLabel (optional) EX: Number Followed By
     *          {string} targetSizeLabel (optional) EX: Number Following
     */
    setTooltip(tooltip) {
        //
    }

    /**
     * Returns the selected graph node IDs.
     */
    getSelectedNodeIds() {
        //
    }

    /**
     * Returns the full list of graph node IDs in the selected network (both the selected and unselected nodes).
     */
    getNodeIdsInSelectedNetwork() {
        //
    }

    /**
     * Returns the selected date bucket.
     */
    getSelectedDateBucket() {
        //
    }

    /**
     * Creates nad returns a list of legend items using the given options.
     * @arg {boolean} useNodeCluster (required)
     * @arg {boolean} useFlag (required)
     * @arg {string} flagLabel (optional)
     */
    createLegend(useNodeClusters, useFlag, flagLabel) {
        //
    }

    createLink(sourceId, targetId) {
        let link: Link;

        link.source = sourceId;
        link.target = targetId;
        return link;
    }

    getNodeTotal() {
        this.active.totalNodes = this.active.graphData.nodes.length;
        return this.active.totalNodes;
    }

    getLinkTotal() {
        this.active.totalLinks = this.active.graphData.links.length;
        return this.active.totalLinks;
    }

    getTotal() {
        this.active.total = this.getNodeTotal() + this.getLinkTotal();
        return this.active.total;
    }

}
