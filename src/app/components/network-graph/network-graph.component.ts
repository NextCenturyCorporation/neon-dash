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
import * as neon from 'neon-framework';
import { NgxGraphModule } from '@swimlane/ngx-graph';

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

    public graphData: {
        NgxGraphModule
    }

    theme = 'dark';
    chartType = 'directed-graph';
    chartGroups: any;
    chart: any;
    realTimeData: boolean = false;
    countries: any[];
    graph: { links: any[], nodes: any[] };
    hierarchialGraph: { links: any[], nodes: any[] };

    nodes;
    links;

    view: any[];
    width: number = 500;
    height: number = 300;
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

        this.updateData();

      this.setColorScheme('picnic');
      this.setInterpolationType('Bundle');
    }

    ngOnInit() {
      this.selectChart(this.chartType);

      setInterval(this.updateData.bind(this), 1000);

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
        return filter.value;
    }

    refreshVisualization() {
        //
    }

    getGraphData() {
        this.hierarchialGraph.nodes = [
            {
              id: 'start',
              label: 'start'
            }, {
              id: '1',
              label: 'Query ThreatConnect'
            }, {
              id: '2',
              label: 'Query XForce'
            }, {
              id: '3',
              label: 'Format Results'
            }, {
              id: '4',
              label: 'Search Splunk'
            }, {
              id: '5',
              label: 'Block LDAP'
            }, {
              id: '6',
              label: 'Email Results'
            }
          ];

          this.hierarchialGraph.links = [
            {
              source: 'start',
              target: '1',
              label: 'links to'
            }, {
              source: 'start',
              target: '2'
            }, {
              source: '1',
              target: '3',
              label: 'related to'
            }, {
              source: '2',
              target: '4'
            }, {
              source: '2',
              target: '6'
            }, {
              source: '3',
              target: '5'
            }
          ];

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
        return this.nodes;
    }

    getLinks() {
        return this.links;
    }

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

    setColorScheme(name) {
        /*
      this.selectedColorScheme = name;
      this.colorScheme = this.colorSets.find(s => s.name === name);*/
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

    onLegendLabelClick(entry) {
      //console.log('Legend clicked', entry);
    }

    toggleExpand(node) {
      //console.log('toggle expand', node);
    }

    onUpdateFields() {
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
}
