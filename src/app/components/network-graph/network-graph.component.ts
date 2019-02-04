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

import { AbstractSearchService, CompoundFilterType, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent, TransformedVisualizationData } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';

import * as d3shape from 'd3-shape';
import 'd3-transition';
import * as neon from 'neon-framework';
import * as vis from 'vis';

class GraphData {
    constructor(
        public nodes = new vis.DataSet(),
        public edges = new vis.DataSet()
    ) {}
}

class GraphProperties {
    constructor(
        public nodes: Node[] = [],
        public edges: Edge[] = []
    ) {}

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
    ) {}
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
    ) {}
}

export class TransformedGraphData extends TransformedVisualizationData {
    constructor(data: GraphData) {
        super(data);
    }

    /**
     * Returns the length of the data.
     *
     * @return {number}
     * @override
     */
    public count(): number {
        return this._data.nodes.getIds().length;
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
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: any,
        operator: any
    }[] = [];

    // TODO THOR-985
    public graphData: GraphData = new GraphData();
    public responseData: any[] = [];

    public displayGraph: boolean;
    public neonFilters: any[] = [];
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
    public disabledSet: [string[]] = [] as any;

    private defaultActiveColor;
    private graph: vis.Network;

    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        protected widgetService: AbstractWidgetService,
        ref: ChangeDetectorRef
    ) {

        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref
        );

        this.graphData = new GraphData();

        this.setInterpolationType('Bundle');
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
            new WidgetFieldOption('typeField', 'Type Field', false, this.optionsNotReified),
            new WidgetFieldOption('xPositionField', 'X Position Field', false, this.optionsNotReified),
            new WidgetFieldOption('yPositionField', 'Y Position Field', false, this.optionsNotReified),
            new WidgetFieldOption('xTargetPositionField', 'X Target Position Field', false, this.optionsNotReified),
            new WidgetFieldOption('yTargetPositionField', 'Y Target Position Field', false, this.optionsNotReified),
            new WidgetFieldArrayOption('filterFields', 'Filter Fields', false)
        ];
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
            new WidgetFreeTextOption('edgeColor', 'Edge Color', '#2b7ce9', this.optionsNotReified),
            new WidgetFreeTextOption('edgeWidth', 'Edge Width', '1'),
            new WidgetFreeTextOption('fontColor', 'Font Color', '#343434', this.optionsNotReified),
            new WidgetFreeTextOption('linkColor', 'Link Color', '#96c1fc', this.optionsNotReified),
            new WidgetFreeTextOption('nodeColor', 'Node Color', '#96c1fc', this.optionsNotReified),
            new WidgetFreeTextOption('nodeShape', 'Node Shape', 'box')
        ];
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

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.nodeField.columnName && options.linkField.columnName);
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
        let filter: FilterClause = this.searchService.buildCompoundFilterClause([
            this.searchService.buildFilterClause(options.nodeField.columnName, '!=', null),
            this.searchService.buildFilterClause(options.linkField.columnName, '!=', null)
        ], CompoundFilterType.OR);

        let sortFieldName: string = (options.nodeColorField.columnName || options.edgeColorField.columnName ||
            options.nodeField.columnName);

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filter)))
            .updateSort(query, sortFieldName);

        return query;
    }

    getFiltersToIgnore() {
        // TODO
        return null;
    }

    addFilter(myFilter, clause) {
        if (this.filterIsUnique(myFilter)) {
            this.addLocalFilter(myFilter);
            this.addNeonFilter(this.options, true, myFilter, clause);
        }
    }

    removeFilter(myFilter: any) {
        this.filters = this.filters.filter((element) => element.id !== myFilter.id);
        //EDIT: meaning that you also have to reset the legend
        this.disabledSet = [] as any;
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
            this.options.table.name, this.options.filterFields.map((fieldsObject) => fieldsObject.columnName));
        this.filters = [];
        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.findField(this.options.fields, neonFilter.filter.whereClause.lhs);
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

    /**
     * Transforms the given array of query results using the given options into the array of objects to be shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {TransformedVisualizationData}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): TransformedVisualizationData {
        this.neonFilters = this.filterService.getFiltersForFields(options.database.name, options.table.name,
            options.filterFields.map((fieldsObject) => fieldsObject.columnName));

        // TODO THOR-985
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

        this.existingNodeNames = [];
        this.resetGraphData();
        this.updateLegend();

        return new TransformedGraphData(this.graphData);
    }

    private resetGraphData() {
        this.loadingCount++;
        let graphProperties = this.options.isReified ? this.createReifiedGraphProperties() : this.createTabularGraphProperties();

        this.totalNodes = graphProperties.nodes.filter((value, index, array) =>
            array.findIndex((object) => object.id === value.id) === index).length;

        this.clearGraphData();
        if (this.options.hideUnfiltered && this.neonFilters.length || !this.options.hideUnfiltered) {
            this.graph.setOptions({physics: {enabled: this.options.physics}});
            this.displayGraph = true;
            this.graphData.nodes.update(graphProperties.nodes);
            this.graphData.edges.update(graphProperties.edges);
        } else {
            this.displayGraph = false;
        }
        this.loadingCount--;
    }

    private clearGraphData() {
        this.graphData.nodes.clear();
        this.graphData.edges.clear();
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
            nodeTextObject = {size: 14, face: 'Roboto, sans-serif', color: this.options.fontColor},
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
        let edgeTextObject = {size: 14, face: 'Roboto, sans-serif'};

        graph.addNode(new Node(subject, subject, '', null, nodeColor, false, nodeTextObject, nodeShape));
        graph.addNode(new Node(object, object, '', null, nodeColor, false, nodeTextObject, nodeShape));
        graph.addEdge(new Edge(subject, object, predicate, {to: this.options.isDirected}, null, null, null, edgeTextObject));
    }

    private addEdgesFromField(graph: GraphProperties, linkField: string | string[], source: string,
                              colorValue?: string, edgeColorField?: string) {
        let edgeColor = {color: colorValue, highlight: colorValue};
        let edgeTextObject = {size: 14, face: 'Roboto, sans-serif'};
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
            nodeTextObject = {size: 14, face: 'Roboto, sans-serif', color: this.options.fontColor},
            edgeTextObject = {size: 14, face: 'Roboto, sans-serif'},
            limit = this.options.limit,
            nodeShape = this.options.nodeShape,
            xPositionField = this.options.xPositionField.columnName,
            yPositionField = this.options.yPositionField.columnName,
            xTargetPositionField = this.options.xTargetPositionField.columnName,
            yTargetPositionField = this.options.yTargetPositionField.columnName,
            fFields = this.options.filterFields.map((fieldsObject) => fieldsObject.columnName);

        // assume nodes will take precedence over edges so create nodes first
        for (let entry of this.responseData) {
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
                nodeColor = this.widgetService.getColor(this.options.database.name, this.options.table.name, nodeColorField,
                    colorMapVal).getComputedCss(this.visualization);
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
                                nodeColor = this.widgetService.getColor(this.options.database.name, this.options.table.name, nodeColorField,
                                    colorMapVal).getComputedCss(this.visualization);
                                break;
                            }
                        }
                    }

                    graph.addNode(new Node(nodeEntry, nodeNames[j], nodeName, 1, nodeColor, false, nodeTextObject, nodeShape,
                        xPosition, yPosition, filterFields));
                }
            }
        }

        // create edges and destination nodes only if required
        for (let entry of this.responseData) {
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
                linkColor = this.widgetService.getColor(this.options.database.name, this.options.table.name, nodeColorField,
                    colorMapVal).getComputedCss(this.visualization);
            }

            // create a node if linkfield doesn't point to a node that already exists
            let links = this.getArray(linkField),
                targetNames = !targetNameField ? links : this.getArray(targetNameField);

            if (links) {
                for (let j = 0; j < links.length && graph.nodes.length < limit; j++) {
                    let linkEntry = links[j];
                    let linkNode = this.responseData.find((item) => item.kbid === linkEntry);
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
                                    linkColor = this.widgetService.getColor(this.options.database.name, this.options.table.name,
                                        nodeColorField, colorMapVal).getComputedCss(this.visualization);
                                    break;
                                }
                            }
                        }

                        graph.addNode(new Node(linkEntry, linkNodeName, linkName, 1, linkColor, true, nodeTextObject, nodeShape,
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
                        edgeColor = this.widgetService.getColor(this.options.database.name, this.options.table.name, edgeColorField,
                            colorMapVal).getComputedCss(this.visualization);
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
                                    edgeColor = this.widgetService.getColor(this.options.database.name, this.options.table.name,
                                        edgeColorField, colorMapVal).getComputedCss(this.visualization);
                                    edgeColorObject = {color: edgeColor, highlight: edgeColor};
                                    break;
                                }
                            }
                        }

                        graph.addEdge(new Edge(nodeEntry, links[i], linkNames[i], {to: this.options.isDirected}, 1,
                            edgeColorObject, edgeType, edgeTextObject));
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
                    this.removeLocalFilterFromLocalAndNeon(this.options, this.filters[i], true, true);
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
                this.addMultipleFilters(this.options, filterArray, () => {
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
