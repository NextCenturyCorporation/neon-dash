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

import { ActiveGridService } from '../../services/active-grid.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { EMPTY_FIELD, FieldMetaData } from '../../dataset';
import { neonVariables } from '../../neon-namespaces';

import * as shape from 'd3-shape';
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
        public color?: string
    ) {}
}

interface ArrowProperties {
    to: boolean;
}
interface ArrowUpdate {
    id: string;
    arrows: ArrowProperties;
}

class Edge {
    // http://visjs.org/docs/network/edges.html
    constructor(
        public from: string,
        public to: string,
        public label?: string,
        public arrows?: ArrowProperties,
        public count?: number,
        public color?: Object,
        public value?: string, //used to identify that catagory of edge (to hide/show when legend option is clicked)
        public hidden?: boolean
    ) {}
}

/**
 * Manages configurable options for the specific visualization.
 */
export class NetworkGraphOptions extends BaseNeonOptions {
    public isDirected: boolean;
    public isReified: boolean;
    public linkColor: string;
    public nodeColor: string;
    public edgeColor: string;
    public linkField: FieldMetaData;
    public nodeField: FieldMetaData;
    public limit: number;
    public edgeColorField: FieldMetaData;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.isDirected = this.injector.get('isDirected', false);
        this.isReified = this.injector.get('isReified', false);
        this.linkColor = this.injector.get('linkColor', '#96c1fc');
        this.nodeColor = this.injector.get('nodeColor', '#96c1fc');
        this.edgeColor = this.injector.get('edgeColor', '#2b7ce9');
        this.limit = this.injector.get('limit', Infinity);
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.nodeField = this.findFieldObject('nodeField');
        this.linkField = this.findFieldObject('linkField');
        this.edgeColorField = this.findFieldObject('edgeColorField');
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

    public filters: {
        id: string,
        key: string,
        value: string
    }[];

    public options: NetworkGraphOptions;

    public activeData: any[] = [];

    public graphData = new GraphData();

    graphType = 'Network Graph';

    view: any[];
    width: number = 400;
    height: number = 400;
    fitContainer: boolean = true;
    autoZoom: boolean = false;
    // options
    showLegend = false;
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
    curve: any = shape.curveLinear;
    interpolationTypes = [
        'Bundle', 'Cardinal', 'Catmull Rom', 'Linear', 'Monotone X',
        'Monotone Y', 'Natural', 'Step', 'Step After', 'Step Before'
    ];

    colorSets: any;
    colorScheme: any;
    schemeType: string = 'ordinal';
    selectedColorScheme: string;
    public colorByFields: string[] = [];
    public disabledSet: [string[]] = [] as [string[]];

    private defaultActiveColor;

    queryTitle;

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

        this.options = new NetworkGraphOptions(this.injector, this.datasetService, 'Network Graph', 500000);

        this.graphData = new GraphData();

        this.setInterpolationType('Bundle');
    }

    subNgOnInit() {
        this.updateData();
        this.createQuery();
        //setInterval(this.updateData.bind(this), 2000);

        if (!this.fitContainer) {
            this.applyDimensions();
        }
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

    subGetBindings(bindings: any) {
        bindings.nodeField = this.options.nodeField.columnName;
        bindings.linkField = this.options.linkField.columnName;
        bindings.edgeColorField = this.options.edgeColorField.columnName;
    }

    ngAfterViewInit() {
        // note: options is REQUIRED. Fails to initialize physics properly without at least empty object
        let options: vis.Options = {layout: {randomSeed: 0}};
        this.graph = new vis.Network(this.graphElement.nativeElement, this.graphData, options);
        this.graph.on('stabilized', (params) => this.graph.setOptions({physics: {enabled: false}}));
    }

    setInterpolationType(curveType) {
        this.curveType = curveType;
        if (curveType === 'Bundle') {
            this.curve = shape.curveBundle.beta(1);
        }
        if (curveType === 'Cardinal') {
            this.curve = shape.curveCardinal;
        }
        if (curveType === 'Catmull Rom') {
            this.curve = shape.curveCatmullRom;
        }
        if (curveType === 'Linear') {
            this.curve = shape.curveLinear;
        }
        if (curveType === 'Monotone X') {
            this.curve = shape.curveMonotoneX;
        }
        if (curveType === 'Monotone Y') {
            this.curve = shape.curveMonotoneY;
        }
        if (curveType === 'Natural') {
            this.curve = shape.curveNatural;
        }
        if (curveType === 'Step') {
            this.curve = shape.curveStep;
        }
        if (curveType === 'Step After') {
            this.curve = shape.curveStepAfter;
        }
        if (curveType === 'Step Before') {
            this.curve = shape.curveStepBefore;
        }
    }

    getExportFields() {
        return [{
            columnName: this.options.nodeField.columnName,
            prettyName: this.options.nodeField.prettyName
        }, {
            columnName: this.options.linkField.columnName,
            prettyName: this.options.linkField.prettyName
        }, {
            columnName: this.options.edgeColorField.columnName,
            prettyName: this.options.edgeColorField.prettyName
        }];
    }

    addLocalFilter(filter) {
        //
    }

    getFilterText(filter) {
        // TODO
        return '';
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
        let linkField = this.options.linkField.columnName;
        let edgeColorField = this.options.edgeColorField.columnName;
        let whereClauses: neon.query.WherePredicate[] = [];
        //whereClauses.push(neon.query.where(this.options.nodeField.columnName, '!=', null));
        //whereClauses.push(neon.query.where(this.options.linkField.columnName, '!=', null));
        let groupBy: any[] = [this.options.nodeField.columnName];

        let fields = [nodeField, linkField];
        if (edgeColorField) {
            fields.push(edgeColorField);
        }

         query = query.withFields(fields);
        let whereClause = neon.query.and.apply(neon.query, whereClauses);

        query.where(whereClause);

        return query;
    }

    getFiltersToIgnore() {
        // TODO
        return null;
    }

    removeFilter() {
        this.filter = undefined;
    }

    onQuerySuccess(response): void {
        this.activeData = response.data;
        this.resetGraphData();
        this.updateLegend();
        this.disabledSet = [] as [string[]];
    }

    private resetGraphData() {
        this.graphData.nodes.clear();
        this.graphData.edges.clear();

        let graphProperties = this.options.isReified ? this.createReifiedGraphProperties() : this.createTabularGraphProperties();

        this.graph.setOptions({physics: {enabled: true}});

        this.graphData.nodes.update(graphProperties.nodes);
        this.graphData.edges.update(graphProperties.edges);
    }

    setupFilters() {
        //
    }

    updateData() {
        //
    }

    selectGraph(graphSelector) {
        this.graphType = graphSelector;
        /*
      for (const group of this.chartGroups) {
        for (const chart of group.charts) {
          if (chart.selector === chartSelector) {
            this.chart = chart;
            return;
          }
        }
      }*/
    }

    select(data) {
        //console.log('Item clicked', data);
    }
    /*
        setColorScheme(name) {
            /*
          this.selectedColorScheme = name;
          this.colorScheme = this.colorSets.find(s => s.name === name);*/
    // }

    onLegendLabelClick(entry) {
        //console.log('Legend clicked', entry);
    }

    toggleExpand(node) {
        //console.log('toggle expand', node);
    }

    addLocalFilters(filter) {
        //
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
        let text = 'No Data';
        let data = this.graphData; //this.graphData.nodes;
        if (!data || !data.nodes.length) {
            return text;
        } else {
            let total = data.nodes.length;
            return 'Total Nodes: ' + this.formatingCallback(total);
        }
    }

    resetData() {
        this.graphData = new GraphData();
    }

    toNodes(datafield) {
        let nodes = [];
        /*
                datafield.array.forEach(element => {
                    if(nodes.indexOf(element.id) < 0) {
                        nodes.push(element.id, element.name)
                    }
                });*/
    }

    private createReifiedGraphProperties() {
        let graph = new GraphProperties();
        let limit = this.options.limit;

        for (const entry of this.activeData) {
            if (limit && graph.nodes.length <= limit) {
                const subject = entry.subject,
                    predicate = entry.predicate,
                    object = entry.object;

                graph.addNode(new Node(subject, subject));
                graph.addNode(new Node(object, object));
                graph.addEdge(new Edge(subject, object, predicate));
                    // , {to: this.options.isDirected}));

                //TODO: add hover with other properties
            }
        }
        return graph;
    }

    private addEdgesFromField(graph: GraphProperties, linkField: string | string[], source: string,
        colorValue?: string, edgeColorField?: string) {
        let edgeColor = { color: colorValue, highlight: colorValue};
        if (Array.isArray(linkField)) {
            for (const linkEntry of linkField) {
                graph.addEdge(new Edge(source, linkEntry, '', null, 1, edgeColor, edgeColorField, false));
            }
        } else if (linkField) {
                graph.addEdge(new Edge(source, linkField, '', null, 1, edgeColor, edgeColorField, false));
        }
    }

    private createTabularGraphProperties() {
        let graph = new GraphProperties(),
            linkName = this.options.linkField.columnName,
            nodeName = this.options.nodeField.columnName,
            edgeColorField = this.options.edgeColorField.columnName;

        let nodeColor = this.options.nodeColor,
            edgeColor = this.options.edgeColor,
            linkColor = this.options.linkColor;
        let limit = this.options.limit;

        for (let entry of this.activeData) {
            let linkField = entry[linkName],
                edgeValue = entry[edgeColorField];

            if (limit && graph.nodes.length < limit) {
                //if the linkfield is an array, it'll iterate and create a node for each unique linkfield
                if (Array.isArray(linkField)) {
                    for (const linkEntry of linkField) {
                        graph.addNode(new Node(linkEntry, linkEntry, linkName, 1, linkColor));
                    }
                } else if (linkField) {
                    graph.addNode(new Node(linkField, linkField, linkName, 1, linkColor));
                }

                // if there is a valid edgeColorField, override the edgeColor
                if (entry[edgeColorField]) {
                    let color = edgeColorField && edgeValue;
                    edgeColor = this.colorSchemeService.getColorFor(edgeColorField, color).toRgb();
                }

                //creates a new node for each unique nodeId
                //nodeField is an array
                let nodeField = entry[nodeName];
                if (Array.isArray(nodeField)) {
                    for (const nodeEntry of nodeField) {
                        if (this.isUniqueNode(nodeEntry, graph)) {
                            graph.addNode(new Node(nodeEntry, nodeEntry, nodeName, 1, nodeColor));
                            this.addEdgesFromField(graph, linkField, nodeEntry, edgeColor, edgeValue);
                        }
                    }
                } else if (nodeField) {
                    graph.addNode(new Node(nodeField, nodeField, nodeName, 1, nodeColor));
                    this.addEdgesFromField(graph, linkField, nodeField, edgeColor);
                }
            } else {
                break;
            }
        }
        return graph;
    }

    /**
     *  returns true if there
     */
    isUniqueNode(nodeId, graph) {
        let isOriginal = true;
        if (graph.nodes) {
            graph.nodes.forEach((node) => {
                if (node.id === nodeId) {
                    isOriginal = false;
                }
            });
        }
        return isOriginal;
    }

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
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return [];
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

    /**
     * Updates the network graph legend.
     */
    updateLegend() {
        let colorByFields: string[] = [];
        if (this.options.edgeColorField.columnName !== '') {
            colorByFields.push(this.options.edgeColorField.columnName);
        }
        this.colorByFields = colorByFields;
    }

    legendItemSelected(event: any) {
        let fieldName: string = event.fieldName;
        let value: string = event.value; //label on clicked legend option
        let currentlyActive: boolean = event.currentlyActive;

        let selectedEdges = this.graphData.edges.get({
            filter: function(item: Edge) {
                return (item.value === value);
            }
        });

        if (currentlyActive) {
            selectedEdges.forEach(function(edge: Edge) {
                edge.hidden = true;
            });
            this.disabledSet.push([fieldName, value]);
        } else {
            selectedEdges.forEach(function(edge: Edge) {
                edge.hidden = false;
            });
            this.disabledSet = this.disabledSet.filter((set) => {
                    return !(set[0] === fieldName && set[1] === value);
                }) as [string[]];
        }
        this.graphData.edges.update(selectedEdges);
    }
}
