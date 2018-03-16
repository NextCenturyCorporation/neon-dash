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
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { VisualizationService } from '../../services/visualization.service';
import { neonMappings } from '../../neon-namespaces';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';

import * as shape from 'd3-shape';
import 'd3-transition';
import * as neon from 'neon-framework';
import * as vis from 'vis';

class GraphData {
    constructor(public nodes = new vis.DataSet(), public edges = new vis.DataSet()) {}
}

@Component({
    selector: 'app-network-graph',
    templateUrl: './network-graph.component.html',
    styleUrls: ['./network-graph.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkGraphComponent extends BaseNeonComponent implements OnInit,
    OnDestroy, AfterViewInit {

    @ViewChild('graphElement') graphElement: ElementRef;

    private filters: {
        id: string,
        key: string,
        value: string
    }[];

    public optionsFromConfig: {
        title: string;
        database: string;
        table: string;
        nodeField: FieldMetaData;
        linkField: FieldMetaData;
        limit: number,
        isReified: boolean
    };

    public active: {
        nodeField: FieldMetaData, //[FieldMetaData] TODO Future support for multiple node and link fields
        linkField: FieldMetaData, //[FieldMetaData]
        linkFieldArray: FieldMetaData[],
        aggregationField: FieldMetaData,
        aggregationFieldHidden: boolean,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        data: any[],
        aggregation: string
    };

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

    private colorSchemeService: ColorSchemeService;
    private defaultActiveColor;

    queryTitle;

    private graph: vis.Network;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            nodeField: this.injector.get('nodeField', null),
            linkField: this.injector.get('linkField', null),
            limit: this.injector.get('limit', 500000),
            isReified: this.injector.get('isReified', false)
        };

        this.active = {
            nodeField: new FieldMetaData(),
            linkField: new FieldMetaData(),
            linkFieldArray: new Array<FieldMetaData>(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            filterable: true,
            data: [],
            aggregation: 'count'
        };

        this.queryTitle = this.optionsFromConfig.title || 'Network Graph';

        this.setInterpolationType('Bundle');

    }

    subNgOnInit() {
        this.createQuery();
        //this.updateData();
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
        bindings.nodeField = this.active.nodeField.columnName;
        bindings.linkField = this.active.linkField.columnName;
        bindings.limit = this.active.limit;
    }

    ngAfterViewInit() {
        // note: options is REQUIRED. Fails to initialize physics properly without at least empty object
        let options: vis.Options = {layout: {randomSeed: 0}};
        this.graph = new vis.Network(this.graphElement.nativeElement, this.graphData, options);
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
        let valuePrettyName = this.active.aggregation +
            (this.active.aggregationFieldHidden ? '' : '-' + this.active.aggregationField.prettyName);
        valuePrettyName = valuePrettyName.charAt(0).toUpperCase() + valuePrettyName.slice(1);
        return [{
            columnName: this.active.nodeField.columnName,
            prettyName: this.active.nodeField.prettyName
        }, {
            columnName: 'value',
            prettyName: valuePrettyName
        }];
    }

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    addLocalFilter(filter) {
        //
    }

    getVisualizationName(): string {
        return 'Network Graph';
    }

    getFilterText(filter) {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let field = this.active.nodeField.columnName;
        let text = database + ' - ' + table + ' - ' + field + ' = ';
        return text;
    }

    refreshVisualization() {
        //
    }

    getGraphData() {
        return this.graphData;
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.nodeField && this.active.nodeField.columnName && valid);
        valid = (this.active.linkField && this.active.linkField.columnName && valid);

        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let nodeField = this.active.nodeField.columnName;
        let linkField = this.active.linkField.columnName;
        let whereClauses: neon.query.WherePredicate[] = [];
        //whereClauses.push(neon.query.where(this.active.nodeField.columnName, '!=', null));
        //whereClauses.push(neon.query.where(this.active.linkField.columnName, '!=', null));
        let groupBy: any[] = [this.active.nodeField.columnName];

        let fields = [nodeField, linkField];

        // query = query.withFields(fields);
        let whereClause = neon.query.and.apply(neon.query, whereClauses);

        query.where(whereClause);

        return query;
    }

    getFiltersToIgnore() {
        // TODO
        return null;
    }

    getNeonFilterFields(): string[] {
        return [this.active.nodeField.columnName];
    }

    removeFilter() {
        //
    }

    onQuerySuccess(response): void {
        if (this.optionsFromConfig.isReified) {
            this.addReifiedDataToGraph(response.data);
        } else {
            this.evaluateDataAndUpdateGraph(response.data);
        }

        this.graph.on('stabilized', (params) => this.graph.setOptions({physics: {enabled: false}}));

        let title;
        title = this.optionsFromConfig.title || 'Network Graph' + ' by ' + this.active.nodeField.columnName;
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

    onUpdateFields() {
        this.active.nodeField = this.findFieldObject('nodeField', neonMappings.GRAPH_NODE);
        this.active.linkField = this.findFieldObject('linkField', neonMappings.GRAPH_LINKED_NODE);
        this.updateData();
        //
    }

    addLocalFilters(filter) {
        //
    }

    createNeonFilterClauseEquals() {
        //
    }

    unsharedFilterChanged() {
        // Update the data
        this.executeQueryChain();
    }

    unsharedFilterRemoved() {
        // Update the data
        this.executeQueryChain();
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

    createTitle() {
        let title = '';
        if (!this.optionsFromConfig) {
            title = 'Network Graph';
        } else {
            title = this.optionsFromConfig.title;
        }
        return title;
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

    addReifiedDataToGraph(data) {
        this.graphData.nodes.clear();
        this.graphData.edges.clear();

        for (const entry of data) {
            const subject = entry.subject,
                predicate = entry.predicate,
                object = entry.object;
            this.addNodeToGraph(subject, subject, 'subject', 1);
            this.addNodeToGraph(object, object, 'object', 1);
            this.addLinkToGraph(subject, object, predicate, 1);
            //TODO: add hover with other properties
        }
    }

    private addNodeToGraph(id: string, label: string, nodeType: string, size: number) {
        this.graphData.nodes.update({
            id: id,
            label: label
            // nodeType: nodeType,
            // size: size
        });
    }

    private addLinkToGraph(source: string, target: string, label: string, count: number) {
        this.graphData.edges.update({
            from: source,
            to: target,
            label: label,
            arrows: 'to' // directed graph
            // count: count
        });
    }

    private addLinkFromField(linkField: any, source: string) {
        if (Array.isArray(linkField)) {
            for (const linkEntry of linkField) {
                this.addLinkToGraph(source, linkEntry, '', 1);
            }
        } else if (linkField) {
            this.addLinkToGraph(source, linkField, '', 1);
        }
    }

    evaluateDataAndUpdateGraph(data) {
        this.graphData.nodes.clear();
        this.graphData.edges.clear();

        let linkName = this.active.linkField.columnName,
            nodeName = this.active.nodeField.columnName;
        for (let entry of data) {

            //if the linkfield is an array, it'll iterate and create a node for each unique linkfield
            let linkField = entry[linkName];
            if (Array.isArray(linkField)) {
                for (const linkEntry of linkField) {
                    this.addNodeToGraph(linkEntry, linkEntry, linkName, 1);
                }
            } else if (linkField) {
                this.addNodeToGraph(linkField, linkField, linkName, 1);
            }

            //creates a new node for each unique nodeId
            //nodeField is an array
            let nodeField = entry[nodeName];
            if (Array.isArray(nodeField)) {
                for (const nodeEntry of nodeField) {
                    if (this.isUniqueNode(nodeEntry)) {
                        this.addNodeToGraph(nodeEntry, nodeEntry, nodeName, 1);
                        this.addLinkFromField(linkField, nodeEntry);
                    }
                }
            } else if (nodeField) {
                this.addNodeToGraph(nodeField, nodeField, nodeName, 1);
                this.addLinkFromField(linkField, nodeField);
            }
        }
    }

    isUniqueNode(nodeId) {
        if (this.graphData.nodes) {
            this.graphData.nodes.forEach((node, id) => {
                if (id === nodeId) {
                    return false;
                }
            });
        }

        return true;
    }

    getElementRefs() {
        return {
            //
        };
    }
}
