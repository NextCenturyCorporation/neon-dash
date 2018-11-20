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
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector, Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';

import * as d3shape from 'd3-shape';
import 'd3-transition';
import * as neon from 'neon-framework';
import * as vis from 'vis';

class GraphData {
    constructor(
        public nodes = new vis.DataSet(),
        public edges = new vis.DataSet()
    ) {
    }
}

class GraphProperties {
    constructor(
        public nodes: Node[] = [],
        public edges: Edge[] = []
    ) {
    }

    addNode(node: Node) {
        this.nodes.push(node);
    }

    addEdge(edge: Edge) {
        this.edges.push(edge);
    }
}

class Node {
    // http://visjs.org/docs/network/nodes.html
    constructor(
        public id: string,
        public label: string,
        public nodeType?: string,
        public size?: number,
        public color?: string,
        public isLink?: boolean,
        public font?: Object,
        public shape?: string,
        public x?: number,
        public y?: number,
        public filterFields?: any[]
    ) {
    }
}

interface ArrowProperties {
    to: boolean;
}

interface ArrowUpdate {
    id: string;
    arrows: ArrowProperties;
    color: Object;
}

interface EdgeColorProperties {
    color: string;
    highlight: string;
}

class Edge {
    // http://visjs.org/docs/network/edges.html
    constructor(
        public from: string,
        public to: string,
        public label?: string,
        public arrows?: ArrowProperties,
        public count?: number,
        public color?: EdgeColorProperties,
        public type?: string //used to identify that category of edge (to hide/show when legend option is clicked)
        /* TODO: width seem to breaking directed arrows, removing for now
        public width?: number*/
    ) {
    }
}

/**
 * Manages configurable options for the specific visualization.
 */
export class NetworkGraphOptions extends BaseNeonOptions {
    public isDirected: boolean;
    public isReified: boolean;
    public displayLegend: boolean;
    public nodeColor: string;
    public nodeShape: string;
    public linkColor: string;
    public edgeColor: string;
    public fontColor: string;
    public nodeColorField: FieldMetaData;
    public edgeColorField: FieldMetaData;
    public targetColorField: FieldMetaData;
    public linkField: FieldMetaData;
    public linkNameField: FieldMetaData;
    public nodeField: FieldMetaData;
    public nodeNameField: FieldMetaData;
    public targetNameField: FieldMetaData;
    public typeField: FieldMetaData;
    public edgeWidth: number;
    public limit: number;
    public andFilters: boolean;
    public showOnlyFiltered: boolean;
    public filterFields: string[];
    public xPositionField: FieldMetaData;
    public yPositionField: FieldMetaData;
    public xTargetPositionField: FieldMetaData;
    public yTargetPositionField: FieldMetaData;
    public physics: boolean;
    public filterable: boolean;
    public multiFilterOperator: string;
    public cleanLegendLabels: boolean;
    public legendFiltering: boolean;

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        bindings.andFilters = this.andFilters;

        return bindings;
    }

    /**
     * Returns the list of field properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldProperties(): string[] {
        return [
            'nodeField',
            'nodeNameField',
            'targetNameField',
            'linkField',
            'linkNameField',
            'nodeColorField',
            'edgeColorField',
            'targetColorField',
            'typeField',
            'xPositionField',
            'yPositionField',
            'xTargetPositionField',
            'yTargetPositionField'
        ];
    }

    /**
     * Returns the list of field array properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldArrayProperties(): string[] {
        return [];
    }

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @override
     */
    initializeNonFieldBindings() {
        this.isDirected = this.injector.get('isDirected', false);
        this.isReified = this.injector.get('isReified', false);
        this.displayLegend = this.injector.get('displayLegend', false);
        this.nodeShape = this.injector.get('nodeShape', 'box');
        this.nodeColor = this.injector.get('nodeColor', '#96c1fc');
        this.linkColor = this.injector.get('linkColor', '#96c1fc');
        this.edgeColor = this.injector.get('edgeColor', '#2b7ce9');
        this.fontColor = this.injector.get('fontColor', '#343434');
        this.edgeWidth = this.injector.get('edgeWidth', 1);
        this.limit = this.injector.get('limit', Infinity);
        this.andFilters = this.injector.get('andFilters', true);
        this.showOnlyFiltered = this.injector.get('showOnlyFiltered', false);
        this.filterFields = this.injector.get('filterFields', []);
        this.physics = this.injector.get('physics', true);
        this.filterable = this.injector.get('filterable', false);
        this.multiFilterOperator = this.injector.get('multiFilterOperator', 'or');
        this.cleanLegendLabels = this.injector.get('cleanLegendLabels', false);
        this.legendFiltering = this.injector.get('legendFiltering', true);
    }
}

@Component({
    selector: 'app-network-graph',
    templateUrl: './network-graph.component.html',
    styleUrls: ['./network-graph.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkGraphComponent extends BaseNeonComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('graphElement') graphElement: ElementRef;
    @Input() argOptions: any;

    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: any,
        operator: any
    }[] = [];

    public options: NetworkGraphOptions;
    public allData: any[] = [];
    public activeData: any[] = [];
    public graphData = new GraphData();
    public displayGraph: boolean;
    public neonFilters: any[] = [];
    public totalNodes: number;
    public prettifiedNodeLabels: string[] = [];
    public prettifiedEdgeLabels: string[] = [];

    graphType = 'Network Graph';

    existingNodeNames: String[];
    view: any[];
    width: number = 400;
    height: number = 400;
    fitContainer: boolean = true;
    autoZoom: boolean = false;
    // options
    orientation: string = 'TB'; // LR, RL, TB, BT
    orientations: any[] = [
        {
            label: 'Left to Right',
            value: 'LR'
        }, {
            label: 'Right to Left',
            value: 'RL'
        }, {
            label: 'Top to Bottom',
            value: 'TB'
        }, {
            label: 'Bottom to Top',
            value: 'BT'
        }
    ];

    // line interpolation
    curveType: string = 'Linear';
    curve: any = d3shape.curveLinear;
    interpolationTypes = [
        'Bundle', 'Cardinal', 'Catmull Rom', 'Linear', 'Monotone X',
        'Monotone Y', 'Natural', 'Step', 'Step After', 'Step Before'
    ];

    nodeShapes = ['box', 'diamond', 'dot', 'square', 'triangle', 'triangleDown', 'star'];

    colorSets: any;
    colorScheme: any;
    schemeType: string = 'ordinal';
    selectedColorScheme: string;
    public colorByFields: string[] = [];
    public disabledSet: [string[]] = [] as [string[]];

    private defaultActiveColor;
    private graph: vis.Network;

    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        protected colorSchemeService: ColorSchemeService,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService
    ) {

        super(
            activeGridService,
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            ref,
            visualizationService
        );

        this.options = new NetworkGraphOptions(this.injector, this.datasetService, this.graphType, 500000);
        this.graphData = new GraphData();
        this.displayGraph = !this.options.showOnlyFiltered;

        this.setInterpolationType('Bundle');
    }

    subNgOnInit() {
        this.updateData();
        this.createQuery();
        //setInterval(this.updateData.bind(this), 2000);
        if (!this.fitContainer) {
            this.applyDimensions();
        }
        this.removeAllFilters(this.filterService.getFilters());

    }

    applyDimensions() {
        this.view = [this.width, this.height];
    }

    toggleFitContainer(fitContainer: boolean, autoZoom: boolean): void {
        this.fitContainer = fitContainer;
        this.autoZoom = autoZoom;

        if (this.fitContainer) {
            this.view = undefined;
        } else {
            this.applyDimensions();
        }
    }

    postInit() {
        this.executeQueryChain();
    }

    subNgOnDestroy() {
        this.createQuery();
    }

    ngAfterViewInit() {
        // note: options is REQUIRED. Fails to initialize physics properly without at least empty object
        let options: vis.Options = {
            layout: {
                randomSeed: 0
            },
            physics: {
                forceAtlas2Based: {
                    gravitationalConstant: -26,
                    centralGravity: 0.005,
                    springLength: 230,
                    springConstant: 0.18
                },
                maxVelocity: 146,
                solver: 'forceAtlas2Based',
                timestep: 0.35,
                stabilization: {iterations: 150}
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: 'continuous',
                    roundness: 0
                }
            }
        };
        this.graph = new vis.Network(this.graphElement.nativeElement, this.graphData, options);
        this.graph.on('stabilized', () => this.graph.setOptions({physics: {enabled: false}}));
        if (this.options.filterable) {
            this.graph.on('doubleClick', this.onSelect);
        }
    }

    setInterpolationType(curveType) {
        this.curveType = curveType;
        if (curveType === 'Bundle') {
            this.curve = d3shape.curveBundle.beta(1);
        }
        if (curveType === 'Cardinal') {
            this.curve = d3shape.curveCardinal;
        }
        if (curveType === 'Catmull Rom') {
            this.curve = d3shape.curveCatmullRom;
        }
        if (curveType === 'Linear') {
            this.curve = d3shape.curveLinear;
        }
        if (curveType === 'Monotone X') {
            this.curve = d3shape.curveMonotoneX;
        }
        if (curveType === 'Monotone Y') {
            this.curve = d3shape.curveMonotoneY;
        }
        if (curveType === 'Natural') {
            this.curve = d3shape.curveNatural;
        }
        if (curveType === 'Step') {
            this.curve = d3shape.curveStep;
        }
        if (curveType === 'Step After') {
            this.curve = d3shape.curveStepAfter;
        }
        if (curveType === 'Step Before') {
            this.curve = d3shape.curveStepBefore;
        }
    }

    refreshVisualization() {
        //
    }

    getGraphData() {
        return this.graphData;
    }

    isValidQuery() {
        let valid = true;
        valid = (this.options.database && this.options.database.name && valid);
        valid = (this.options.table && this.options.table.name && valid);
        valid = (this.options.nodeField && this.options.nodeField.columnName && valid);
        valid = (this.options.linkField && this.options.linkField.columnName && valid);

        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.options.database.name;
        let tableName = this.options.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let nodeField = this.options.nodeField.columnName;
        let nodeNameField = this.options.nodeNameField.columnName;
        let targetNameField = this.options.targetNameField.columnName;
        let linkField = this.options.linkField.columnName;
        let linkNameField = this.options.linkNameField.columnName;
        let nodeColorField = this.options.nodeColorField.columnName;
        let edgeColorField = this.options.edgeColorField.columnName;
        let targetColorField = this.options.targetColorField.columnName;
        let typeField = this.options.typeField.columnName;
        let xPositionField = this.options.xPositionField.columnName;
        let yPositionField = this.options.yPositionField.columnName;
        let xTargetPositionField = this.options.xTargetPositionField.columnName;
        let yTargetPositionField = this.options.yTargetPositionField.columnName;
        let whereClauses: neon.query.WherePredicate[] = [];
        let groupBy: any[] = [nodeField];
        let sortField: any = nodeColorField ? nodeColorField : edgeColorField ? edgeColorField : nodeField;

        let fields = [nodeField, linkField];
        for (const field of [nodeColorField, edgeColorField, nodeNameField, linkNameField, typeField, xPositionField,
            yPositionField, xTargetPositionField, yTargetPositionField, targetNameField, targetColorField]
            .concat(this.options.filterFields)) {
            if (field) {
                fields.push(field);
            }
        }

        query = query.withFields(fields);
        let whereClause = neon.query.and.apply(neon.query, whereClauses);
        query.where(whereClause).sortBy(sortField, neonVariables.ASCENDING);

        return query;
    }

    getFiltersToIgnore() {
        // TODO
        return null;
    }

    addFilter(myFilter, clause) {
        if (this.filterIsUnique(myFilter)) {
            this.addLocalFilter(myFilter);
            this.addNeonFilter(true, myFilter, clause);
        }
    }

    removeFilter(myFilter: any) {
        this.filters = this.filters.filter((element) => element.id !== myFilter.id);
        //EDIT: meaning that you also have to reset the legend
        this.disabledSet = [] as [string[]];
        this.updateLegend();
    }

    filterIsUnique(myFilter) {
        for (let existingFilter of this.filters) {
            if (existingFilter.value === myFilter.value && existingFilter.field === myFilter.field) {
                return false;
            }
        }
        return true;
    }

    addLocalFilter(myFilter) {
        this.filters.push(myFilter);
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters() {
        let nodeFilters = [];
        this.filters.forEach((myFilter) => {
            if (myFilter.field !== this.options.edgeColorField.columnName) {
                nodeFilters.push(myFilter);
            }
        });
        return nodeFilters;
    }

    getFilterText(myFilter) {
        return myFilter.prettyField + ' = ' + myFilter.value;
    }

    setupFilters() {
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, this.options.filterFields);
        this.filters = [];
        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.options.findField(neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                let myFilter = {
                    id: neonFilter.id,
                    field: field.columnName,
                    prettyField: field.prettyName,
                    value: value
                };
                if (!this.filterExists(myFilter.field, myFilter.value)) {
                    this.addLocalFilter(myFilter);
                }
            }
        }
    }

    /**
     * Returns whether a visualization filter object with the given field and value strings exists in the list of visualization filters.
     *
     * @arg {string} field
     * @arg {string} value
     * @return {boolean}
     */
    filterExists(field: string, value: string) {
        return this.filters.some((existingFilter) => {
            return field === existingFilter.field && value === existingFilter.value;
        });
    }

    /**
     *  Whether label is an array, a string with commas, or a string with dot notation; the first value is taken
     *
     * @arg {any} label
     * @return {string}
     */
    labelCleanUp(label: any) {
        let cleanLabel = label instanceof Array ? label[0] : label;
        cleanLabel = cleanLabel.indexOf('.') > -1 ? cleanLabel.split('.')[0] : cleanLabel;
        cleanLabel = cleanLabel.indexOf(',') > -1 ? cleanLabel.split(',')[0] : cleanLabel;
        return cleanLabel;
    }

    onQuerySuccess(response): void {
        this.neonFilters = this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, this.options.filterFields);

        if (!this.allData.length) {
            this.allData = response.data;

            this.allData.forEach((d) => {
                for (let field of this.options.fields) {
                    if ([this.options.nodeColorField.columnName, this.options.targetColorField.columnName].includes(field.columnName)
                        && this.options.cleanLegendLabels && this.options.displayLegend) {
                        let types = neonUtilities.deepFind(d, field.columnName);
                        if (types instanceof Array) {
                            for (let value of types) {
                                this.prettifiedNodeLabels.push(this.labelCleanUp(value));
                            }
                        } else {
                            this.prettifiedNodeLabels.push(types);
                        }
                    }
                    if (field.columnName === this.options.edgeColorField.columnName && this.options.cleanLegendLabels
                        && this.options.displayLegend) {
                        let types = neonUtilities.deepFind(d, this.options.edgeColorField.columnName);
                        if (types instanceof Array) {
                            for (let value of types) {
                                this.prettifiedEdgeLabels.push(this.labelCleanUp(value));
                            }
                        } else {
                            this.prettifiedEdgeLabels.push(types);
                        }
                    }
                }
            });

            //Flattens multi-level arrays, removes duplicates, and sorts alphabetically
            this.prettifiedNodeLabels = neonUtilities.flatten(this.prettifiedNodeLabels)
                .filter((value, index, array) => array.indexOf(value) === index).sort();
            this.prettifiedEdgeLabels = neonUtilities.flatten(this.prettifiedEdgeLabels)
                .filter((value, index, array) => array.indexOf(value) === index).sort();
        }

        this.activeData = response.data;
        this.existingNodeNames = [];
        this.isLoading = true;
        this.resetGraphData();
        this.updateLegend();
    }

    private resetGraphData() {
        let graphProperties = this.options.isReified ? this.createReifiedGraphProperties() : this.createTabularGraphProperties();

        this.totalNodes = graphProperties.nodes.filter((value, index, array) =>
            array.findIndex((object) => object.id === value.id) === index).length;

        this.clearGraphData();
        if (this.options.showOnlyFiltered && this.neonFilters.length || !this.options.showOnlyFiltered) {
            this.graph.setOptions({physics: {enabled: this.options.physics}});
            this.displayGraph = true;
            this.graphData.nodes.update(graphProperties.nodes);
            this.graphData.edges.update(graphProperties.edges);
            this.isLoading = false;
        } else {
            this.displayGraph = false;
        }
    }

    private clearGraphData() {
        this.graphData.nodes.clear();
        this.graphData.edges.clear();
    }

    updateData() {
        //
    }

    selectGraph(graphSelector) {
        this.graphType = graphSelector;
    }

    select(data) {
        //console.log('Item clicked', data);
    }

    onLegendLabelClick(entry) {
        //console.log('Legend clicked', entry);
    }

    toggleExpand(node) {
        //console.log('toggle expand', node);
    }

    formatingCallback(value): string {
        if (!isNaN(parseFloat(value)) && !isNaN(value - 0)) {
            //round to at most 3 decimal places, so as to not display tiny floating-point errors
            return String(Math.round((parseFloat(value) + 0.00001) * 1000) / 1000);
        }
        // can't be converted to a number, so just use it as-is.
        return value;
    }

    getButtonText() {
        let data = this.graphData,
            visibleNodeCount = data.nodes.length;

        if (this.options.isReified) {
            let prefix = '';
            if (this.displayGraph) {
                prefix = 'Total Nodes: ';
            } else {
                prefix = 'Total Hidden Nodes: ';
            }
            return prefix + this.formatingCallback(this.totalNodes);
        } else {
            if (!data || !visibleNodeCount) {
                return 'No Data';
            } else if (visibleNodeCount === this.totalNodes) {
                return 'Total Nodes: ' + super.prettifyInteger(this.totalNodes);
            } else {
                return '1 - ' + super.prettifyInteger(visibleNodeCount) + ' of ' + super.prettifyInteger(this.totalNodes);
            }
        }
    }

    resetData() {
        this.graphData = new GraphData();
    }

    getArray(type: any) {
        return (type instanceof Array) ? type : [type];
    }

    private createReifiedGraphProperties() {
        let graph = new GraphProperties(),
            limit = this.options.limit,
            nodeColor = this.options.nodeColor,
            textColor = {color: this.options.fontColor},
            nodeShape = this.options.nodeShape;

        for (const entry of this.activeData) {
            if (graph.nodes.length <= limit) {
                let subject = this.getArray(entry.subject),
                    predicate = entry.predicate,
                    object = this.getArray(entry.object);

                for (let sNode of subject) {
                    for (let oNode of object) {
                        this.addTriple(graph, sNode, predicate, oNode, nodeColor, textColor, nodeShape);
                    }
                }
            }

            //TODO: add hover with other properties
        }
        return graph;
    }

    private addTriple(graph: GraphProperties, subject: string, predicate: string, object: string, nodeColor?: string,
                      textColor?: any, nodeShape?: string) {

        graph.addNode(new Node(subject, subject, '', null, nodeColor, false, textColor, nodeShape));
        graph.addNode(new Node(object, object, '', null, nodeColor, false, textColor, nodeShape));
        graph.addEdge(new Edge(subject, object, predicate, {to: this.options.isDirected}));
    }

    private addEdgesFromField(graph: GraphProperties, linkField: string | string[], source: string,
                              colorValue?: string, edgeColorField?: string) {
        let edgeColor = {color: colorValue, highlight: colorValue};
        //TODO: edgeWidth being passed into Edge class is currently breaking directed arrows, removing for now
        // let edgeWidth = this.options.edgeWidth;
        if (Array.isArray(linkField)) {
            for (const linkEntry of linkField) {
                graph.addEdge(new Edge(source, linkEntry, '', null, 1, edgeColor, edgeColorField));
            }
        } else if (linkField) {
            graph.addEdge(new Edge(source, linkField, '', null, 1, edgeColor, edgeColorField));
        }
    }

    private createTabularGraphProperties() {
        let graph = new GraphProperties(),
            linkName = this.options.linkField.columnName,
            linkNameColumn = this.options.linkNameField.columnName,
            nodeName = this.options.nodeField.columnName,
            nodeNameColumn = this.options.nodeNameField.columnName,
            targetNameColumn = this.options.targetNameField.columnName,
            nodeColorField = this.options.nodeColorField.columnName,
            edgeColorField = this.options.edgeColorField.columnName,
            targetColorField = this.options.targetColorField.columnName,
            nodeColor = this.options.nodeColor,
            edgeColor = this.options.edgeColor,
            linkColor = this.options.linkColor,
            textColor = {color: this.options.fontColor},
            limit = this.options.limit,
            nodeShape = this.options.nodeShape,
            xPositionField = this.options.xPositionField.columnName,
            yPositionField = this.options.yPositionField.columnName,
            xTargetPositionField = this.options.xTargetPositionField.columnName,
            yTargetPositionField = this.options.yTargetPositionField.columnName,
            fFields = this.options.filterFields;

        // assume nodes will take precedence over edges so create nodes first
        for (let entry of this.activeData) {
            let nodeType = entry[nodeColorField],
                nodeField = entry[nodeName],
                nodeNameField = nodeNameColumn && entry[nodeNameColumn],
                xPosition = entry[xPositionField],
                yPosition = entry[yPositionField],
                filterFields: any[] = [];

            for (let i of fFields) {
                filterFields.push({
                    field: i,
                    data: entry[i]
                });
            }

            // if there is a valid nodeColorField and no modifications to the legend labels, override the default nodeColor
            if (nodeColorField && this.prettifiedNodeLabels.length === 0) {
                let colorMapVal = nodeColorField && nodeType;
                nodeColor = this.colorSchemeService.getColorFor(nodeColorField, colorMapVal).toRgb();
            }

            // create a new node for each unique nodeId
            let nodes = this.getArray(nodeField),
                nodeNames = !nodeNameField ? nodes : this.getArray(nodeNameField);
            for (let j = 0; j < nodes.length && graph.nodes.length < limit; j++) {
                let nodeEntry = nodes[j];
                if (this.isUniqueNode(nodeEntry)) {
                    //If legend labels have been modified, override the node color
                    if (this.prettifiedNodeLabels.length > 0 && this.options.displayLegend && nodeType && nodeType !== '') {
                        let shortName = this.labelCleanUp(nodeType);
                        for (const nodeLabel of this.prettifiedNodeLabels) {
                            if (nodeLabel === shortName) {
                                let colorMapVal = nodeColorField && nodeLabel;
                                nodeColor = this.colorSchemeService.getColorFor(nodeColorField, colorMapVal).toRgb();
                                break;
                            }
                        }
                    }

                    graph.addNode(new Node(nodeEntry, nodeNames[j], nodeName, 1, nodeColor, false, textColor, nodeShape,
                        xPosition, yPosition, filterFields));
                }
            }
        }

        // create edges and destination nodes only if required
        for (let entry of this.activeData) {
            let linkField = entry[linkName],
                nodeType = entry[targetColorField] || entry[nodeColorField],
                edgeType = entry[edgeColorField],
                linkNodeName = '',
                linkNameField = entry[linkNameColumn],
                targetNameField = targetNameColumn && entry[targetNameColumn],
                nodeField = entry[nodeName],
                xPosition = entry[xPositionField] - 100,
                yPosition = entry[yPositionField] + 100,
                filterFields: any[] = [];

            // if there is a valid nodeColorField and no modifications to the legend labels, override the default nodeColor
            if (nodeColorField && this.prettifiedNodeLabels.length === 0) {
                let colorMapVal = nodeColorField && nodeType;
                linkColor = this.colorSchemeService.getColorFor(nodeColorField, colorMapVal).toRgb();
            }

            // create a node if linkfield doesn't point to a node that already exists
            let links = this.getArray(linkField),
                targetNames = !targetNameField ? links : this.getArray(targetNameField);

            if (links) {
                for (let j = 0; j < links.length && graph.nodes.length < limit; j++) {
                    let linkEntry = links[j];
                    let linkNode = this.allData.find((item) => item.kbid === linkEntry);
                    if (linkNode) {
                        //If edge node exists then get the existing position and name in order to avoid node duplication and relocation
                        nodeType = linkNode[nodeColorField];
                        linkNodeName = linkNode[nodeNameColumn];
                        xPosition = linkNode[xPositionField];
                        yPosition = linkNode[yPositionField];
                        filterFields.push({field: nodeName, data: linkNode[nodeName]});
                    } else {
                        linkNodeName = targetNames[j];
                        filterFields.push({field: nodeName, data: linkEntry});
                    }

                    if (linkEntry && this.isUniqueNode(linkEntry)) {
                        //If legend labels have been modified, override the link
                        if (this.prettifiedNodeLabels.length > 0 && this.options.displayLegend && nodeType && nodeType !== '') {
                            let shortName = this.labelCleanUp(nodeType);
                            for (const nodeLabel of this.prettifiedNodeLabels) {
                                if (nodeLabel === shortName) {
                                    let colorMapVal = nodeColorField && nodeLabel;
                                    linkColor = this.colorSchemeService.getColorFor(nodeColorField, colorMapVal).toRgb();
                                    break;
                                }
                            }
                        }

                        graph.addNode(new Node(linkEntry, linkNodeName, linkName, 1, linkColor, true, textColor, nodeShape,
                            xPosition, yPosition, filterFields));
                    }
                }
            }

            // create edges between nodes and destinations specified by linkfield
            let linkNames = !linkNameField ? [].fill('', 0, links.length) : this.getArray(linkNameField),
                nodes = this.getArray(nodeField);

            if (nodes) {
                for (const nodeEntry of nodes) {
                    // if there is a valid edgeColorField and no modifications to the legend labels, override the default edgeColor
                    if (edgeColorField && this.prettifiedEdgeLabels.length === 0) {
                        let colorMapVal = edgeColorField && edgeType;
                        edgeColor = this.colorSchemeService.getColorFor(edgeColorField, colorMapVal).toRgb();
                    }

                    let edgeColorObject = {color: edgeColor, highlight: edgeColor};
                    //TODO: edgeWidth being passed into Edge class is currently breaking directed arrows, removing for now
                    // let edgeWidth = this.options.edgeWidth;

                    for (let i = 0; i < links.length; i++) {
                        // if legend labels have been modified, override the edgeColor and edgeColorObject
                        if (this.prettifiedEdgeLabels.length > 0 && this.options.displayLegend && linkNames[i] && linkNames[i] !== '') {
                            let shortName = this.labelCleanUp(linkNames[i]);
                            for (const edgeLabel of this.prettifiedEdgeLabels) {
                                if (edgeLabel === shortName) {
                                    let colorMapVal = edgeColorField && edgeLabel;
                                    edgeType = edgeLabel;
                                    edgeColor = this.colorSchemeService.getColorFor(edgeColorField, colorMapVal).toRgb();
                                    edgeColorObject = {color: edgeColor, highlight: edgeColor};
                                    break;
                                }
                            }
                        }

                        graph.addEdge(new Edge(nodeEntry, links[i], linkNames[i], {to: this.options.isDirected}, 1,
                            edgeColorObject, edgeType));
                    }
                }
            }
        }
        return graph;
    }

    /**
     * Check if the nodeId exists already and adds it if it's unique
     * @param nodeId
     */
    isUniqueNode(nodeId) {
        if (this.options.isReified) {
            if (this.graphData.nodes) {
                this.graphData.nodes.forEach((node, id) => {
                    if (id === nodeId) {
                        return false;
                    }
                });
            }

            return true;
        } else {
            if (this.indexOfNodeName(nodeId) !== -1) {
                return false;
            } else {
                this.insertNodeName(nodeId);
                return true;
            }
        }
    }

    /**
     * Returns the index of the nodeName or -1 if it doesnt exist (binary search)
     * @param searchElement nodoName to look for in the array
     */
    indexOfNodeName(searchElement) {
        let minIndex = 0;
        let maxIndex = this.existingNodeNames.length - 1;
        let currentIndex;
        let currentElement;

        if (maxIndex === 0 || searchElement < this.existingNodeNames[minIndex] || searchElement > this.existingNodeNames[maxIndex]) {
            return -1;
        }

        while (minIndex <= maxIndex) {
            currentIndex = Math.floor((minIndex + maxIndex) / 2);
            currentElement = this.existingNodeNames[currentIndex];

            if (currentElement < searchElement) {
                minIndex = currentIndex + 1;
            } else if (currentElement > searchElement) {
                maxIndex = currentIndex - 1;
            } else {
                return currentIndex;
            }
        }
        return -1;
    }

    /**
     * Inserts a unique nodeName into the existingNodeNames array in order
     * @param element
     */
    insertNodeName(element) {
        let arraySize = this.existingNodeNames.length - 1;
        let list = this.existingNodeNames;

        let i: number;
        for (i = arraySize; i >= 0 && list[i] > element; i--) {
            list[i + 1] = list[i];
        }
        list[i + 1] = element;
    }

    /**
     * Inserts a unique nodeName into the existingNodeNames array in order
     * @param element
     */
    handleChangeDirected() {
        let arrowUpdates: ArrowUpdate[] = this.graphData.edges.map(
            (edge: ArrowUpdate) => ({id: edge.id, arrows: {to: this.options.isDirected}}),
            {fields: ['id', 'arrows']}
        );
        this.graphData.edges.update(arrowUpdates);
    }

    handleChangeReified() {
        this.resetGraphData();
    }

    getElementRefs() {
        return {
            //
        };
    }

    /**
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
    }

    legendIsNeeded() {
        let nodeColorField = this.options.nodeColorField.columnName;
        let edgeColorField = this.options.edgeColorField.columnName;
        return (this.displayGraph && this.options.displayLegend &&
            ((nodeColorField && nodeColorField !== '') || (edgeColorField && edgeColorField !== ''))
        );
    }

    /**
     * Updates the network graph legend.
     */
    updateLegend() {
        let colorByFields: string[] = [];
        if (this.options.nodeColorField.columnName !== '') {
            colorByFields.push(this.options.nodeColorField.columnName);
        } else if (this.options.edgeColorField.columnName !== '') {
            colorByFields.push(this.options.edgeColorField.columnName);
        }
        this.colorByFields = colorByFields;
    }

    /**
     * Filters data based on the clicked legend option
     * @param event
     */
    legendItemSelected(event: any) {
        let field: FieldMetaData = this.options.edgeColorField;
        let value: string = event.value;
        let currentlyActive: boolean = event.currentlyActive;

        if (currentlyActive) {
            //create filter
            let myFilter = this.createFilterObject(field.columnName, value, field.prettyName, '!=');
            let whereClause = neon.query.where(myFilter.field, myFilter.operator, myFilter.value);
            this.addFilter(myFilter, whereClause);
            this.disabledSet.push([field.columnName, value]);
        } else {
            //find the filter to remove and remove the item from the disabled set
            for (let i = 0; i < this.filters.length; i++) {
                let currentFilter = this.filters[i];
                let currentSet = this.disabledSet[i];

                if (field.columnName === currentFilter.field && value === currentFilter.value) {
                    this.removeLocalFilterFromLocalAndNeon(this.filters[i], true, true);
                }
                if (currentSet && field.columnName === currentSet[0] && value === currentSet[1]) {
                    this.disabledSet.splice(i, 1);
                }
            }
        }
    }

    /**
     * Filters the data using the name of the selected node
     * @param properties
     */
    onSelect = (properties: { nodes: string[] }) => {
        if (properties.nodes.length === 1) {
            //find the selected node
            let nodeName = properties.nodes[0];
            let selectedNode = <Node> this.graphData.nodes.get(nodeName);
            let clause: neon.query.WherePredicate;
            let singleFilter;

            //create filter
            for (let filterField of selectedNode.filterFields) {
                let filterArray: { singleFilter: any, clause: neon.query.WherePredicate }[] = [];
                if (this.options.multiFilterOperator === 'or') {
                    let clauses = filterField.data.map((element) =>
                        neon.query.where(filterField.field, '=', element));
                    singleFilter = this.createFilterObject(filterField.field, filterField.data.toString(), filterField.field);
                    clause = neon.query.or.apply(neon.query, clauses);
                    filterArray.push({singleFilter, clause});
                } else {
                    for (let data of filterField.data) {
                        singleFilter = this.createFilterObject(filterField.field, data, filterField.field, '=');
                        clause = neon.query.where(singleFilter.field, singleFilter.operator, singleFilter.value);
                        filterArray.push({singleFilter, clause});
                    }

                }
                // add neon filters and provide callback function that adds them as local filters
                this.addMultipleFilters(filterArray, () => {
                    for (let myFilter of filterArray) {
                        this.addLocalFilter(myFilter.singleFilter);
                    }
                });
            }
        }
    }

    /**
     * Helper function that creates and returns filter object
     * @param field
     * @param value
     * @param prettyField
     * @param operator
     */
    createFilterObject(field: string, value: string, prettyField: string, operator?: string): any {
        let myFilter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            field: field,
            value: value,
            prettyField: prettyField,
            operator: operator
        };
        return myFilter;
    }

    /*
    * Used when changing colors and other optional non-field values in the guere settings
    */
    reloadGraph() {
        this.totalNodes = 0;
        this.existingNodeNames = [];
        this.resetGraphData();
        this.updateLegend();
    }

    resetColors() {
        this.options.linkColor = this.injector.get('linkColor', '#96c1fc');
        this.options.nodeColor = this.injector.get('nodeColor', '#96c1fc');
        this.options.edgeColor = this.injector.get('edgeColor', '#2b7ce9');
        this.options.fontColor = this.injector.get('fontColor', '#343434');
        this.reloadGraph();
    }

}
