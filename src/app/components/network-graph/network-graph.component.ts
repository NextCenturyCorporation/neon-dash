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
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector, ElementRef, ViewChild, HostListener,
    ChangeDetectorRef
} from '@angular/core';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { VisualizationService } from '../../services/visualization.service';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';

import * as shape from 'd3-shape';
import { select } from 'd3-selection';
import 'd3-transition';
import * as dagre from 'dagre';
import { colorSets } from './color-sets';
import * as neon from 'neon-framework';
import { NgxGraphModule } from '@swimlane/ngx-graph';

import { animate, style, transition as ngTransition, trigger } from '@angular/animations';

import {
    BaseChartComponent, ChartComponent, calculateViewDimensions, ViewDimensions, ColorHelper
} from '@swimlane/ngx-charts';

class GraphData {
    nodes: [{
        id: string;
        label: string;
    }];

    links: [{
        source: string;
        target: string;
        label: string;
    }];
}

@Component({
    selector: 'app-network-graph',
    templateUrl: './network-graph.component.html',
    styleUrls: ['./network-graph.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class NetworkGraphComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {

    private filters: {
        id: string,
        key: string,
        value: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        chartType: string,
        limit: number
    };

    public active: {
        dataField: FieldMetaData,
        aggregationField: FieldMetaData,
        aggregationFieldHidden: boolean,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        layers: any[],
        data: any[],
        aggregation: string,
        chartType: string;
    };

    public graphData;

    theme = 'dark';
    chartType = 'directed-graph';
    chartGroups: any;
    chart: any;
    realTimeData: boolean = false;
    graph: { links: any[], nodes: any[] };
    hierarchialGraph: { nodes: any[], links: any[] };

    colors: ColorHelper;
    view: any[];
    width: number = 200;
    height: number = 100;
    fitContainer: boolean = true;
    autoZoom: boolean = false;
    // options
    showLegend = false;
    orientation: string = 'LR'; // LR, RL, TB, BT
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

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dateField', null),
            chartType: this.injector.get('chartType', null),
            limit: this.injector.get('limit', null)
        };

        this.active = {
            dataField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            filterable: true,
            layers: [],
            data: [],
            aggregation: 'count',
            chartType: this.optionsFromConfig.chartType || 'directed-graph'
        };
        this.hierarchialGraph = {
            nodes: [],
            links: []
        };

        this.graphData = new GraphData();

        //this.getGraphData();
        this.updateData();

        //this.setColorScheme('picnic');
        this.setInterpolationType('Catmull Rom');
    }

    ngOnInit() {
        this.selectChart(this.chartType);
        this.updateData();
        //setInterval(this.updateData.bind(this), 2000);

        if (!this.fitContainer) {
            this.applyDimensions();
        }

    }

    subNgOnInit() {
        //
    }

    postInit() {
        //
    }

    subNgOnDestroy() {
        //
    }

    subGetBindings() {
        //
    }

    getExportFields() {
        let valuePrettyName = this.active.aggregation +
            (this.active.aggregationFieldHidden ? '' : '-' + this.active.aggregationField.prettyName);
        valuePrettyName = valuePrettyName.charAt(0).toUpperCase() + valuePrettyName.slice(1);
        return [{
            columnName: this.active.dataField.columnName,
            prettyName: this.active.dataField.prettyName
        }, {
            columnName: 'value',
            prettyName: valuePrettyName
        }];
    }

    getOptionFromConfig(field) {
        //
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
        let field = this.active.dataField.columnName;
        let text = database + ' - ' + table + ' - ' + field + ' = ';
        return text;
    }

    refreshVisualization() {
        //
    }

    getGraphData() {
        //return {nodes, links};
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        valid = (this.active.aggregation && this.active.aggregation && valid); // what?
        if (this.active.aggregation !== 'count') {
            valid = (this.active.aggregationField !== undefined && this.active.aggregationField.columnName !== '' && valid);
            //This would mean though that if the data is just a number being represented by a string, it would simply fail.
            //As opposed to first trying to parse it.
            //This also makes it silently fail, without letting the user know that it failed or why. One could easily change the
            //aggregation type, not notice that the chart didn't change, and
            valid = ((this.active.aggregationField.type !== 'string') && valid);

        }
        // valid = (this.active.aggregation && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClauses: neon.query.WherePredicate[] = [];
        whereClauses.push(neon.query.where(this.active.dataField.columnName, '!=', null));
        let yAxisField = this.active.aggregationField.columnName;
        let groupBy: any[] = [this.active.dataField.columnName];

        if (this.hasColorField()) {
            whereClauses.push(neon.query.where(this.meta.colorField.columnName, '!=', null));
            groupBy.push(this.meta.colorField.columnName);
        }

        if (this.hasUnsharedFilter()) {
            // Add the unshared filter
            whereClauses.push(
                neon.query.where(this.meta.unsharedFilterField.columnName, '=',
                    this.meta.unsharedFilterValue));
        }

        query.where(neon.query.and.apply(query, whereClauses));
        switch (this.active.aggregation) {
            case 'count':
                return query.groupBy(groupBy).aggregate(neonVariables.COUNT, '*', 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'sum':
                return query.groupBy(groupBy).aggregate(neonVariables.SUM, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'average':
                return query.groupBy(groupBy).aggregate(neonVariables.AVG, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'min':
                return query.groupBy(groupBy).aggregate(neonVariables.MIN, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'max':
                return query.groupBy(groupBy).aggregate(neonVariables.MAX, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
        }
    }

    getFiltersToIgnore() {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = this.getNeonFilterFields();
        // get relevant neon filters and check for filters that should be ignored and add that to query
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        /*
        if (neonFilters.length > 0) {
            let ignoredFilterIds = [];
            for (let filter of neonFilters) {
                ignoredFilterIds.push(filter.id);
            }
            return ignoredFilterIds;
        }*/
        return null;
    }

    getNeonFilterFields(): string[] {
        return [this.active.dataField.columnName];
    }

    removeFilter() {
        //
    }

    onQuerySuccess(response): void {
        //
    }

    setupFilters() {
        //
    }

    getNodes() {
        return this.hierarchialGraph.nodes;
    }

    getLinks() {
        return this.hierarchialGraph.links;
    }
    /*
        setColors(): void {
            this.colors = new ColorHelper(this.colorScheme, 'ordinal', this.seriesDomain, this.customColors);
        }
    */
    setColorScheme(name) {
        this.selectedColorScheme = name;
        this.colorScheme = this.colorSets.find((s) => s.name === name);
    }
    /*
        getSeriesDomain(): any[] {
            return this.results.map((d) => d.name);
        }
    */
    updateData() {
        /*
              if (add) {
                // directed graph
                const hNode = {
                  id: id(),
                  label: country
                };

                this.hierarchialGraph.nodes.push(hNode);

                this.hierarchialGraph.links.push({
                  source: this.hierarchialGraph.nodes[Math.floor(Math.random() * (this.hierarchialGraph.nodes.length - 1))].id,
                  target: hNode.id,
                  label: 'on success'
                });

                this.hierarchialGraph.links = [...this.hierarchialGraph.links];
                this.hierarchialGraph.nodes = [...this.hierarchialGraph.nodes];
              }//*/
        //this.getGraphData();

        this.hierarchialGraph.nodes = [
            {
                id: 'Haiti',
                label: 'Haiti'
            }, {
                id: '1',
                label: 'Needs'
            }, {
                id: '2',
                label: 'Water'
            }, {
                id: '3',
                label: 'Food'
            }, {
                id: '4',
                label: 'Medical'
            }, {
                id: '5',
                label: 'Internet'
            }, {
                id: '6',
                label: 'Help Results'
            }, {
                id: '7',
                label: 'People'
            }, {
                id: '8',
                label: 'Location'
            }, {
                id: '9',
                label: 'Port-au-Prince'
            }, {
                id: '10',
                label: 'Putin'
            }, {
                id: 'US',
                label: 'US'
            }, {
                id: 'DC',
                label: 'Washington DC'
            }
        ];

        this.hierarchialGraph.links = [
            {
                source: 'Haiti',
                target: '1',
                label: 'links to'
            }, {
                source: 'Haiti',
                target: '7',
                label: 'links to'
            }, {
                source: 'Haiti',
                target: '8',
                label: 'links to'
            }, {
                source: '1',
                target: '2',
                label: 'related to'
            }, {
                source: '1',
                target: '3',
                label: 'related to'
            }, {
                source: '1',
                target: '4',
                label: 'links to'
            }, {
                source: '1',
                target: '4',
                label: 'links to'
            }, {
                source: '1',
                target: '4',
                label: 'links to'
            }, {
                source: '1',
                target: '5',
                label: 'links to'
            }, {
                source: '1',
                target: '6',
                label: 'links to'
            }, {
                source: '1',
                target: '5',
                label: 'links to'
            }, {
                source: '6',
                target: '5',
                label: 'links to'
            }, {
                source: '8',
                target: '9',
                label: 'links to'
            }, {
                source: '7',
                target: '10'
            }, {
                source: 'US',
                target: 'DC'
            }, {
                source: 'DC',
                target: 'US'
            }
        ];
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

    selectChart(chartSelector) {
        this.chartType = chartSelector;
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

    onLegendLabelClick(entry) {
        //console.log('Legend clicked', entry);
    }

    toggleExpand(node) {
        //console.log('toggle expand', node);
    }

    onUpdateFields() {
        this.updateData();
        //
    }

    addLocalFilters(filter) {
        //
    }

    createNeonFilterClauseEquals() {
        //
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeDataField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    }

    handleChangeAggregationField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    }

    handleChangeColorField() {
        this.logChangeAndStartQueryChain(); // ('colorField', this.active.colorField.columnName);
    }

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain(); // ('andFilters', this.active.andFilters, 'button');
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
        let data = this.hierarchialGraph; //this.graphData.nodes;
        if (!data || !data.nodes.length) {
            return text;
        } else {
            let total = data.nodes.length;
            return 'Total ' + this.formatingCallback(total);
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

    resetData() {
        this.graphData = [];
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
}
