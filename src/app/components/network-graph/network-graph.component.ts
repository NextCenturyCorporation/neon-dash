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
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import {
    AbstractSearchService,
    CompoundFilterType,
    FilterClause,
    QueryPayload,
    SortOrder
} from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { CompoundFilterDesign, FilterBehavior, FilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption,
    WidgetColorOption
} from '../../widget-option';

import * as d3shape from 'd3-shape';
import 'd3-transition';
import * as vis from 'vis/dist/vis-network.min';
import { MatDialog } from '@angular/material';

let styleImport: any;

class GraphData {
    constructor(
        public nodes = new vis.DataSet(),
        public edges = new vis.DataSet()
    ) { }

    update(source: GraphProperties) {
        this.nodes.update(source.nodes);
        this.edges.update(source.edges);
    }

    clear() {
        this.nodes.clear();
        this.edges.clear();
    }
}

class GraphProperties {
    constructor(
        public nodes: Node[] = [],
        public edges: Edge[] = []
    ) { }

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
    ) { }
}

interface ArrowProperties {
    to: boolean;
}

interface ArrowUpdate {
    id: string;
    arrows: ArrowProperties;
    color?: Object;
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
        public type?: string, //used to identify that category of edge (to hide/show when legend option is clicked)
        /* TODO: width seem to breaking directed arrows, removing for now
        public width?: number*/
        public font?: Object
    ) { }
}

const LayerType = {
    Nodes: 'nodes',
    Edges: 'edges',
    Clusters: 'clusters',
    ClusterMemberships: 'clustermemberships'
};

@Component({
    selector: 'app-network-graph',
    templateUrl: './network-graph.component.html',
    styleUrls: ['./network-graph.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkGraphComponent extends BaseNeonComponent implements OnInit, OnDestroy, AfterViewInit {
    static FONT = 'Roboto, sans-serif';
    static EDGE_FONT_SIZE: number = 14;
    static NODE_FONT_SIZE: number = 14;

    @ViewChild('graphElement') graphElement: ElementRef;
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public graphData: GraphData = new GraphData();
    public responseData: any[] = [];

    public displayGraph: boolean;
    public totalNodes: number;
    public prettifiedNodeLabels: string[] = [];
    public prettifiedEdgeLabels: string[] = [];

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
    public colorKeys: string[] = [];
    public disabledSet: [string, string][] = [];

    private defaultActiveColor;
    private graph: vis.Network;

    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        protected widgetService: AbstractWidgetService,
        ref: ChangeDetectorRef,
        dialog: MatDialog
    ) {

        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
        );

        this.graphData = new GraphData();

        this.setInterpolationType('Bundle');

        if (!styleImport) {
            const link = styleImport = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/assets/vis/dist/vis-network.min.css';
            document.head.appendChild(link);
        }
    }

    /**
     * Initilizes any visualization properties and elements when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Backwards compatibility (showOnlyFiltered deprecated due to its redundancy with hideUnfiltered).
        this.options.hideUnfiltered = this.injector.get('showOnlyFiltered', this.options.hideUnfiltered);

        this.displayGraph = !this.options.hideUnfiltered;
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('nodeField', 'Node Field', true, this.optionsNotReified),
            new WidgetFieldOption('nodeNameField', 'Node Name Field', false, this.optionsNotReified),
            new WidgetFieldOption('targetNameField', 'Target Name Field', false, this.optionsNotReified),
            new WidgetFieldOption('linkField', 'Link Field', true, this.optionsNotReified),
            new WidgetFieldOption('linkNameField', 'Link Name Field', false, this.optionsNotReified),
            new WidgetFieldOption('nodeColorField', 'Node Color Field', false, this.optionsNotReified),
            new WidgetFieldOption('edgeColorField', 'Edge Color Field', false, this.optionsNotReified),
            new WidgetFieldOption('targetColorField', 'Target Color Field', false, this.optionsNotReified),
            new WidgetFieldOption('xPositionField', 'X Position Field', false, this.optionsNotReified),
            new WidgetFieldOption('yPositionField', 'Y Position Field', false, this.optionsNotReified),
            new WidgetFieldOption('xTargetPositionField', 'X Target Position Field', false, this.optionsNotReified),
            new WidgetFieldOption('yTargetPositionField', 'Y Target Position Field', false, this.optionsNotReified),
            new WidgetFieldArrayOption('filterFields', 'Filter Fields', false)
        ];
    }

    private createFilterDesignOnLegend(value?: any): FilterDesign {
        return {
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: this.options.edgeColorField,
            operator: '!=',
            value: value
        } as SimpleFilterDesign;
    }

    private createFilterDesignOnList(filterDesigns: FilterDesign[]): FilterDesign {
        return {
            type: this.options.multiFilterOperator === 'or' ? CompoundFilterType.OR : CompoundFilterType.AND,
            filters: filterDesigns
        } as CompoundFilterDesign;
    }

    private createFilterDesignOnNodeDataItem(field: FieldMetaData, value?: any): FilterDesign {
        return {
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: field,
            operator: '=',
            value: value
        } as SimpleFilterDesign;
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('cleanLegendLabels', 'Clean Legend Labels', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('isReified', 'Data Format', false, [{
                prettyName: 'Tabular',
                variable: false
            }, {
                prettyName: 'Reified',
                variable: true
            }]),
            new WidgetSelectOption('isDirected', 'Directed', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('filterable', 'Filterable', false, OptionChoices.NoFalseYesTrue),
            // TODO THOR-949 Rename option and change to boolean.
            new WidgetSelectOption('multiFilterOperator', 'Filter Operator', 'or', [{
                prettyName: 'OR',
                variable: 'or'
            }, {
                prettyName: 'AND',
                variable: 'and'
            }], this.optionsFilterable),
            new WidgetSelectOption('displayLegend', 'Legend', false, OptionChoices.HideFalseShowTrue, this.optionsDoesHaveColorField),
            new WidgetSelectOption('legendFiltering', 'Legend Filtering', true, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('physics', 'Physics', true, OptionChoices.NoFalseYesTrue),
            new WidgetColorOption('edgeColor', 'Edge Color', '#2b7ce9', this.optionsNotReified),
            new WidgetFreeTextOption('edgeWidth', 'Edge Width', '1'),
            new WidgetColorOption('fontColor', 'Font Color', '#343434', this.optionsNotReified),
            new WidgetColorOption('linkColor', 'Link Color', '#96c1fc', this.optionsNotReified),
            new WidgetColorOption('nodeColor', 'Node Color', '#96c1fc', this.optionsNotReified),
            new WidgetFreeTextOption('nodeShape', 'Node Shape', 'box')
        ];
    }

    /**
     * Creates and returns an array of field options for a layer for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createLayerFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('idField', 'Id Field', true, this.optionsNotReified),
            new WidgetFieldOption('nameField', 'Name Field', true, this.optionsNotReified),
            new WidgetFieldOption('colorField', 'Color Field', true, this.optionsNotReified),
            new WidgetFieldOption('param1Field', 'Parameter 1 Field', true, this.optionsNotReified),
            new WidgetFieldOption('param2Field', 'Parameter 2 Field', true, this.optionsNotReified),
            new WidgetFieldArrayOption('filterFields', 'Filter Fields', false)
        ];
    }

    /**
     * Creates and returns an array of non-field options for layers of visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    public createLayerNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetFreeTextOption('layerType', 'Layer Type', '', false)
        ];
    }

    /**
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        let behaviors: FilterBehavior[] = [];

        if (this.options.edgeColorField.columnName) {
            behaviors.push({
                filterDesign: this.createFilterDesignOnLegend(),
                redrawCallback: this.redrawLegend.bind(this)
            } as FilterBehavior);
        }

        let filterFields: FieldMetaData[] = [this.options.nodeField].concat(this.options.filterFields);
        if (this.options.layers.length) {
            this.options.layers.forEach((layer) => {
                if (layer.layerType === LayerType.Nodes) {
                    filterFields = [layer.nodeField].concat(layer.filterFields);
                }
            });
        }

        filterFields.forEach((filterField) => {
            if (filterField.columnName) {
                behaviors.push({
                    // Match a single EQUALS filter on the specified filter field.
                    filterDesign: this.createFilterDesignOnNodeDataItem(filterField),
                    redrawCallback: this.redrawFilteredNodes.bind(this)
                } as FilterBehavior);

                behaviors.push({
                    // Match a compound filter with one or more EQUALS filters on the specified filter field.
                    filterDesign: this.createFilterDesignOnList([this.createFilterDesignOnNodeDataItem(filterField)]),
                    redrawCallback: this.redrawFilteredNodes.bind(this)
                } as FilterBehavior);
            }
        });

        return behaviors;
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 500000;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Network Graph';
    }

    applyDimensions() {
        this.view = [this.width, this.height];
    }

    /**
     * Returns whether the widget has any color fields.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsDoesHaveColorField(options: any): boolean {
        return options.nodeColorField.columnName || options.edgeColorField.columnName || options.targetColorField.columnName;
    }

    /**
     * Returns whether the widget is filterable.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsFilterable(options: any): boolean {
        return options.filterable;
    }

    /**
     * Returns whether the widget is not reified.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsNotReified(options: any): boolean {
        return !options.isReified;
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

    /**
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
        // note: options is REQUIRED. Fails to initialize physics properly without at least empty object
        let options: vis.Options = {
            layout: {
                randomSeed: 0
            },
            physics: {
                forceAtlas2Based: {
                    gravitationalConstant: -86,
                    centralGravity: 0.005,
                    springLength: 230,
                    springConstant: 0.18
                },
                maxVelocity: 146,
                solver: 'forceAtlas2Based',
                timestep: 1,
                stabilization: { iterations: 50 }
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: 'continuous',
                    roundness: 0
                }
            },
            interaction: {
                hideEdgesOnDrag: true
            }
        };

        this.graph = new vis.Network(this.graphElement.nativeElement, this.graphData, options);
        if (this.options.filterable) {
            this.graph.on('doubleClick', this.onSelect);
        }

    }

    private restartPhysics(): void {

        // turn off physics when stabilized
        this.graph.on('stabilized', () => {
            this.graph.setOptions({ physics: { enabled: false } });
            this.graph.off('stabilized');
        });

        // turn on physics if enabled
        this.graph.setOptions({ physics: { enabled: this.options.physics } });
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

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name) &&
            (options.nodeField && options.nodeField.columnName && options.linkField && options.linkField.columnName ||
                this.isValidLayerOption(options));
    }

    private isValidLayerOption(options: any): boolean {
        // return whether all specified properties are NOT undefined
        let allPropertiesValid = (array: any[]) => !array.some((property) => options[property] === undefined);

        // always test nameField
        let required = ['nameField'];
        switch (options.layerType) {
            case LayerType.Clusters:
            case LayerType.Nodes:
                required.push('idField');
                return allPropertiesValid(required);
            case LayerType.Edges:
            case LayerType.ClusterMemberships:
                required.push('param1Field', 'param2Field');
                return allPropertiesValid(required);
            default:
                return false;
        }
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause[]} sharedFilters
     * @return {QueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: QueryPayload, sharedFilters: FilterClause[]): QueryPayload {
        let names: string[];
        let sortFieldName: string;
        let sortOrder: SortOrder = SortOrder.DESCENDING;

        switch (options.layerType) {
            case LayerType.Clusters:
            case LayerType.Nodes:
                names = [options.nameField.columnName, options.idField.columnName];
                sortFieldName = options.idField.columnName;
                break;
            case LayerType.Edges:
            case LayerType.ClusterMemberships:
                names = [options.nameField.columnName, options.param1Field.columnName, options.param2Field.columnName];
                sortFieldName = options.param1Field.columnName;
                break;
            default:
                names = [options.nodeField.columnName, options.linkField.columnName];
                sortFieldName = (options.nodeColorField.columnName || options.edgeColorField.columnName ||
                    options.nodeField.columnName);
                sortOrder = SortOrder.ASCENDING;
        }

        let filter: FilterClause = this.searchService.buildCompoundFilterClause(names.map((name) =>
            this.searchService.buildFilterClause(name, '!=', null)), CompoundFilterType.OR);

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filter)))
            .updateSort(query, sortFieldName, sortOrder);

        return query;
    }

    public beforeExecuteAllQueryChain(): void {
        this.responseData = [];
    }

    /**
     * Converts multi-dimensional arrays into a one-dimentional array
     *
     * @arg {any} array
     * @arg {string} value
     * @return {boolean}
     */
    flattenArray(array: string[], value: string) {
        return array.concat(value);
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

    private redrawFilteredNodes(filters: FilterDesign[]): void {
        // TODO AIDA-752
    }

    private redrawLegend(filters: FilterDesign[]): void {
        // TODO AIDA-751
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): number {
        this.disabledSet = [];

        if (this.options.layers.length) {
            //TODO: clean up node labels for layers
            this.responseData.push({ options: options, results: results });
        } else {
            this.responseData = results;

            this.responseData.forEach((d) => {
                for (let field of options.fields) {
                    if ([options.nodeColorField.columnName, options.targetColorField.columnName].includes(field.columnName)
                        && options.cleanLegendLabels && options.displayLegend) {
                        let types = neonUtilities.deepFind(d, field.columnName);
                        if (types instanceof Array) {
                            for (let value of types) {
                                this.prettifiedNodeLabels.push(this.labelCleanUp(value));
                            }
                        } else {
                            this.prettifiedNodeLabels.push(types);
                        }
                    }
                    if (field.columnName === options.edgeColorField.columnName && options.cleanLegendLabels
                        && options.displayLegend) {
                        let types = neonUtilities.deepFind(d, options.edgeColorField.columnName);
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
            this.prettifiedNodeLabels = this.prettifiedNodeLabels.reduce(this.flattenArray, [])
                .filter((value, index, array) => array.indexOf(value) === index).sort();
            this.prettifiedEdgeLabels = this.prettifiedEdgeLabels.reduce(this.flattenArray, [])
                .filter((value, index, array) => array.indexOf(value) === index).sort();
        }

        this.existingNodeNames = [];
        this.resetGraphData();
        this.updateLegend();

        return this.graphData.nodes.getIds().length;
    }

    private resetGraphData() {
        this.loadingCount++;

        let graphProperties = this.options.isReified ? this.createReifiedGraphProperties() :
            this.options.layers.length ? this.createMultiTableGraphProperties() :
                this.createTabularGraphProperties();

        if (graphProperties) {
            this.totalNodes = graphProperties.nodes.filter((value, index, array) =>
                array.findIndex((object) => object.id === value.id) === index).length;

            this.graphData.clear();
            if (this.options.hideUnfiltered && this.isFiltered() || !this.options.hideUnfiltered) {
                this.restartPhysics();
                this.displayGraph = true;
                this.graphData.update(graphProperties);
            } else {
                this.displayGraph = false;
            }
        }

        this.loadingCount--;
    }

    updateData() {
        //
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

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    public getButtonText(): string {
        let totalDataCount = this.totalNodes;
        let elementLabel = this.getVisualizationElementLabel(totalDataCount);

        if (this.options.isReified) {
            return super.prettifyInteger(totalDataCount) + (this.displayGraph ? '' : ' Hidden') +
                (elementLabel ? (' ' + elementLabel) : '');
        }

        return super.getButtonText();
    }

    /**
     * Returns the label for the data items that are currently shown in this visualization (Bars, Lines, Nodes, Points, Rows, Terms, ...).
     * Uses the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Node' + (count === 1 ? '' : 's');
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
            nodeTextObject = {
                size: NetworkGraphComponent.NODE_FONT_SIZE,
                face: NetworkGraphComponent.FONT,
                color: this.options.fontColor
            },
            nodeShape = this.options.nodeShape;

        for (const entry of this.responseData) {
            if (graph.nodes.length <= limit) {
                let subject = this.getArray(entry.subject),
                    predicate = entry.predicate,
                    object = this.getArray(entry.object);

                for (let sNode of subject) {
                    for (let oNode of object) {
                        this.addTriple(graph, sNode, predicate, oNode, nodeColor, nodeTextObject, nodeShape);
                    }
                }
            }

            //TODO: add hover with other properties
        }
        return graph;
    }

    private addTriple(graph: GraphProperties, subject: string, predicate: string, object: string, nodeColor?: string,
        nodeTextObject?: any, nodeShape?: string) {
        let edgeTextObject = {
            size: NetworkGraphComponent.EDGE_FONT_SIZE,
            face: NetworkGraphComponent.FONT
        };

        graph.addNode(new Node(subject, subject, '', null, nodeColor, false, nodeTextObject, nodeShape));
        graph.addNode(new Node(object, object, '', null, nodeColor, false, nodeTextObject, nodeShape));
        graph.addEdge(new Edge(subject, object, predicate, { to: this.options.isDirected }, null, null, null, edgeTextObject));
    }

    private addEdgesFromField(graph: GraphProperties, linkField: string | string[], source: string,
        colorValue?: string, edgeColorField?: string) {
        let edgeColor = { color: colorValue, highlight: colorValue };
        let edgeTextObject = {
            size: NetworkGraphComponent.EDGE_FONT_SIZE,
            face: NetworkGraphComponent.FONT
        };

        //TODO: edgeWidth being passed into Edge class is currently breaking directed arrows, removing for now
        // let edgeWidth = this.options.edgeWidth;
        if (Array.isArray(linkField)) {
            for (const linkEntry of linkField) {
                graph.addEdge(new Edge(source, linkEntry, '', null, 1, edgeColor, edgeColorField, edgeTextObject));
            }
        } else if (linkField) {
            graph.addEdge(new Edge(source, linkField, '', null, 1, edgeColor, edgeColorField, edgeTextObject));
        }
    }

    private getAllNodes(data: any[], idField: string, nameField: string, colorField: string, originalColor: string,
        xPositionField: string, yPositionField: string, filterFields: FieldMetaData[]) {
        let ret: Node[] = [];
        let color = originalColor;
        for (let entry of data) {
            let colorMapVal = entry[colorField],
                id = entry[idField],
                name = nameField && entry[nameField],
                xPosition = entry[xPositionField],
                yPosition = entry[yPositionField],
                filterFieldData: any[] = [];

            filterFields.forEach((filterField) => {
                filterFieldData.push({
                    field: filterField,
                    data: entry[filterField.columnName]
                });
            });

            // if there is a valid nodeColorField and no modifications to the legend labels, override the default nodeColor
            if (colorField && this.prettifiedNodeLabels.length === 0) {
                color = this.widgetService.getColor(this.options.database.name, this.options.table.name, colorField,
                    colorMapVal).getComputedCss(this.visualization);
            }

            // create a new node for each unique nodeId
            let nodes = this.getArray(id),
                nodeNames = !name ? nodes : this.getArray(name);
            for (let j = 0; j < nodes.length && ret.length < this.options.limit; j++) {
                let nodeEntry = nodes[j];
                if (this.isUniqueNode(nodeEntry)) {
                    //If legend labels have been modified, override the node color
                    if (this.prettifiedNodeLabels.length > 0 && this.options.displayLegend && colorMapVal && colorMapVal !== '') {
                        let shortName = this.labelCleanUp(colorMapVal);
                        for (const nodeLabel of this.prettifiedNodeLabels) {
                            if (nodeLabel === shortName) {
                                color = this.widgetService.getColor(this.options.database.name, this.options.table.name, colorField,
                                    nodeLabel).getComputedCss(this.visualization);
                                break;
                            }
                        }
                    }

                    ret.push(new Node(nodeEntry, nodeNames[j], colorMapVal, 1, color, false, { color: this.options.fontColor },
                        this.options.nodeShape, xPosition, yPosition, filterFieldData));
                }
            }
        }
        return ret;
    }

    // create edges between source and destinations specified by destinationField
    private getEdgesFromOneEntry(names: string[], colorField: string, originalColorMapVal: string, originalColor: string, source: string,
        destinations: string[]) {
        let ret: Edge[] = [];
        let colorMapVal = originalColorMapVal;
        let color = originalColor;
        let edgeTextObject = {
            size: NetworkGraphComponent.EDGE_FONT_SIZE,
            face: NetworkGraphComponent.FONT
        };

        // if there is a valid colorField and no modifications to the legend labels, override the default colorString
        if (colorField && this.prettifiedEdgeLabels.length === 0) {
            color = this.widgetService.getColor(this.options.database.name, this.options.table.name, colorField,
                colorMapVal).getComputedCss(this.visualization);
        }

        let colorObject = { color: color, highlight: color };
        //TODO: edgeWidth being passed into Edge class is currently breaking directed arrows, removing for now
        // let edgeWidth = this.options.edgeWidth;

        for (let i = 0; i < destinations.length; i++) {
            // if legend labels have been modified, override the edgeColor and edgeColorObject
            if (this.prettifiedEdgeLabels.length > 0 && this.options.displayLegend && names[i] && names[i] !== '') {
                let shortName = this.labelCleanUp(names[i]);
                for (const edgeLabel of this.prettifiedEdgeLabels) {
                    if (edgeLabel === shortName) {
                        colorMapVal = edgeLabel;
                        color = this.widgetService.getColor(this.options.database.name, this.options.table.name,
                            colorField, edgeLabel).getComputedCss(this.visualization);
                        colorObject = { color: color, highlight: color };
                        break;
                    }
                }
            }

            ret.push(new Edge(source, destinations[i], names[i], { to: this.options.isDirected }, 1, colorObject, colorMapVal,
                edgeTextObject));
        }
        return ret;
    }

    private createMultiTableGraphProperties() {
        let types = this.responseData.map((data) => data.options.layerType);
        if (types.includes(LayerType.Nodes) && types.includes(LayerType.Edges)) {
            let graphProperties = new GraphProperties();
            for (let data of this.responseData) {
                let options = data.options;
                switch (options.layerType) {
                    case LayerType.Nodes:
                        graphProperties.nodes = graphProperties.nodes.concat(this.getAllNodes(
                            data.results,
                            options.idField.columnName,
                            options.nameField.columnName,
                            options.colorField.columnName,
                            '',
                            options.param1Field.columnName,
                            options.param2Field.columnName,
                            options.filterFields
                        ));
                        break;
                    case LayerType.Edges:
                        let nameField = options.nameField.columnName,
                            colorField = options.colorField.columnName;
                        for (let entry of data.results) {
                            let destinations = this.getArray(entry[options.param2Field.columnName]);
                            let names = !nameField ? [].fill('', 0, destinations.length) : this.getArray(entry[nameField]);
                            let edges = this.getEdgesFromOneEntry(names, colorField, entry[colorField], '',
                                entry[options.param1Field.columnName], destinations);
                            graphProperties.edges = graphProperties.edges.concat(edges);
                        }
                        break;
                    case LayerType.ClusterMemberships:
                        break;
                    case LayerType.Clusters:
                        break;
                    default:
                }
            }
            return graphProperties;
        }
    }

    private createTabularGraphProperties() {
        let graph = new GraphProperties(),
            linkName = this.options.linkField.columnName,
            linkNameColumn = this.options.linkNameField.columnName,
            nodeName = this.options.nodeField.columnName,
            nodeNameColumn = this.options.nodeNameField.columnName,
            nodeColorField = this.options.nodeColorField.columnName,
            edgeColorField = this.options.edgeColorField.columnName,
            targetColorField = this.options.targetColorField.columnName,
            nodeColor = this.options.nodeColor,
            edgeColor = this.options.edgeColor,
            linkColor = this.options.linkColor,
            nodeTextObject = {
                size: NetworkGraphComponent.NODE_FONT_SIZE,
                face: NetworkGraphComponent.FONT,
                color: this.options.fontColor
            },
            limit = this.options.limit,
            nodeShape = this.options.nodeShape,
            xPositionField = this.options.xPositionField.columnName,
            yPositionField = this.options.yPositionField.columnName,
            xTargetPositionField = this.options.xTargetPositionField.columnName,
            yTargetPositionField = this.options.yTargetPositionField.columnName,
            fFields = this.options.filterFields;

        // assume nodes will take precedence over edges so create nodes first
        graph.nodes = this.getAllNodes(this.responseData, nodeName, nodeNameColumn, nodeColorField, nodeColor, xPositionField,
            yPositionField, this.options.filterFields);

        // create edges and destination nodes only if required
        for (let entry of this.responseData) {
            let linkField = entry[linkName],
                nodeType = entry[targetColorField] || entry[nodeColorField],
                edgeType = entry[edgeColorField],
                linkNameField = entry[linkNameColumn],
                nodeField = entry[nodeName];

            // if there is a valid nodeColorField and no modifications to the legend labels, override the default nodeColor
            if (nodeColorField && this.prettifiedNodeLabels.length === 0) {
                let colorMapVal = nodeColorField && nodeType;
                linkColor = this.widgetService.getColor(this.options.database.name, this.options.table.name, nodeColorField,
                    colorMapVal).getComputedCss(this.visualization);
            }

            // create a node if linkfield doesn't point to a node that already exists
            let links = this.getArray(linkField);

            // create edges between nodes and destinations specified by linkfield
            let linkNames = !linkNameField ? [].fill('', 0, links.length) : this.getArray(linkNameField),
                nodes = this.getArray(nodeField);

            if (nodes) {
                for (const nodeEntry of nodes) {
                    graph.edges = graph.edges.concat(this.getEdgesFromOneEntry(linkNames, edgeColorField, edgeType, edgeColor, nodeEntry,
                        links));
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
            return !this.graphData.nodes || !this.graphData.nodes.get(nodeId);
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
            (edge: ArrowUpdate) => ({ id: edge.id, arrows: { to: this.options.isDirected } }),
            { fields: ['id', 'arrows'] }
        );
        this.graphData.edges.update(arrowUpdates);
    }

    handleChangeReified() {
        this.resetGraphData();
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
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
        let colorKeys: string[] = [];
        if (this.options.nodeColorField.columnName !== '') {
            colorKeys.push(this.widgetService.getColorKey(this.options.database.name, this.options.table.name,
                this.options.nodeColorField.columnName));
        } else if (this.options.edgeColorField.columnName !== '') {
            colorKeys.push(this.widgetService.getColorKey(this.options.database.name, this.options.table.name,
                this.options.edgeColorField.columnName));
        }
        this.colorKeys = colorKeys;
    }

    /**
     * Filters data based on the clicked legend option
     * @param event
     */
    legendItemSelected(event: any) {
        if (event.value && this.options.edgeColorField.columnName) {
            if (event.currentlyActive) {
                this.disabledSet.push([this.options.edgeColorField.columnName, event.value]);
            } else {
                this.disabledSet = this.disabledSet.filter((disabledSet) => !(disabledSet[0] === this.options.edgeColorField.columnName &&
                    disabledSet[1] === event.value));
            }
            this.toggleFilters([this.createFilterDesignOnLegend(event.value)]);
        }
    }

    /**
     * Filters the data using the name of the selected node
     * @param properties
     */
    onSelect = (properties: { nodes: string[] }) => {
        if (properties.nodes.length === 1) {
            let selectedNode = this.graphData.nodes.get(properties.nodes[0]) as Node;

            let filters: FilterDesign[] = [];

            for (let filterField of selectedNode.filterFields) {
                if (filterField.field && filterField.field.columnName) {
                    let specificFilters: FilterDesign[] = (Array.isArray(filterField.data) ? filterField.data : [filterField.data])
                        .map((item) => this.createFilterDesignOnNodeDataItem(filterField.field, item));

                    if (specificFilters.length) {
                        filters = filters.concat(specificFilters.length === 1 ? specificFilters[0] :
                            this.createFilterDesignOnList(specificFilters));
                    }
                }
            }

            this.toggleFilters(filters);
        }
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
