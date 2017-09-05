import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector, ViewChild,
    ChangeDetectorRef
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {FieldMetaData} from '../../dataset';
import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
import {ChartComponent} from 'angular2-chartjs';
import {VisualizationService} from '../../services/visualization.service';

declare let Chart: any;

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarChartComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {
    @ViewChild('myChart') chartModule: ChartComponent;

    private filters: {
        key: string,
        value: string,
        prettyKey: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        aggregation: string,
        aggregationField: string,
        unsharedFilterField: any,
        unsharedFilterValue: string,
        limit: number;
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
        aggregation: string
    };

    public chart: {
        data: {
            labels: any[],
            datasets: any[]
        },
        type: string,
        options: any
    };

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, ref: ChangeDetectorRef,
                visualizationService: VisualizationService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            aggregation: this.injector.get('aggregation', null),
            aggregationField: this.injector.get('aggregationField', null),
            limit: this.injector.get('limit', -1),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.filters = [];
        this.active = {
            dataField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            andFilters: true,
            limit: this.optionsFromConfig.limit > 0 ? this.optionsFromConfig.limit : 100,
            filterable: true,
            layers: [],
            data: [],
            aggregation: 'count'
        };

        this.chartDefaults = {
            activeColor: 'rgba(57, 181, 74, 0.9)',
            inactiveColor: 'rgba(57, 181, 74, 0.3)'
        };

        this.onClick = this.onClick.bind(this);
        this.chart = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'dataset',
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                onClick: this.onClick,
                animation: {
                  duration: 0, // general animation time
                },
                hover: {
                    mode: 'point',
                    onHover: null

                },
                legend: Chart.defaults.global.legend,
                tooltips: Chart.defaults.global.tooltips
            }
        };
        this.chart.options['legend'] = {};
        this.chart.options['legend'].display = false;

        let tooltipTitleFunc = (tooltips) => {
            return this.active.dataField.prettyName + ': ' + tooltips[0].xLabel;
        };
        let tooltipDataFunc = (tooltips) => {
            return this.active.aggregation + ': ' + tooltips.yLabel;
        };
        this.chart.options['tooltips'] = { callbacks: {} };
        this.chart.options['tooltips'].callbacks.title = tooltipTitleFunc.bind(this);
        this.chart.options['tooltips'].callbacks.label = tooltipDataFunc.bind(this);
        this.queryTitle = 'Bar Chart';
    };

    subNgOnInit() {
        //Do nothing
    };

    postInit() {
        this.executeQueryChain();
    };

    subNgOnDestroy() {
        this.chartModule['chart'].destroy();
    };

    subGetBindings(bindings: any) {
        bindings.dataField = this.active.dataField.columnName;
        bindings.aggregation = this.active.aggregation;
        bindings.aggregationField = this.active.aggregationField.columnName;
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
        return this.optionsFromConfig[field];
    };

    onClick(_event, elements: any[]) {
        // console.log(event);
        //event.toString();
        for (let el of elements) {
            let value = el._model.label;
            let key = this.active.dataField.columnName;
            let prettyKey = this.active.dataField.prettyName;
            let filter = {
                key: key,
                value: value,
                prettyKey: prettyKey
            };
            this.addLocalFilter(filter);
            this.addNeonFilter(false, filter);
            this.refreshVisualization();
        }
    };

    onUpdateFields() {
        if (this.optionsFromConfig.aggregation) {
            this.active.aggregation = this.optionsFromConfig.aggregation;
        }
        this.active.aggregationField = this.findFieldObject('aggregationField', neonMappings.TAGS);
        this.active.dataField = this.findFieldObject('dataField', neonMappings.TAGS);
    };

    addLocalFilter(filter) {
        this.filters[0] = filter;
    };

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: string) {
        let filterClauses = this.filters.map(function(filter) {
            return neon.query.where(fieldName, '=', filter.value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.active.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    };

    getNeonFilterFields(): string[] {
        return [this.active.dataField.columnName];
    }
    getVisualizationName(): string {
        return 'Bar Chart';
    }

    getFilterText(filter) {
        return filter.value;
    }

    refreshVisualization() {
        let dsIndex = 0;
        if (this.filters[0] && this.filters[0].value) {
            let activeValue = this.filters[0].value;

            for (let i = 0; i < this.chart.data['datasets'][dsIndex].backgroundColor.length; i++) {
                if (this.chart.data['labels'][i] === activeValue) {
                    this.chart.data['datasets'][dsIndex].backgroundColor[i] = this.chartDefaults.activeColor;
                } else {
                    this.chart.data['datasets'][dsIndex].backgroundColor[i] = this.chartDefaults.inactiveColor;
                }
            }
        } else {
            for (let i = 0; i < this.chart.data['datasets'][dsIndex].backgroundColor.length; i++) {
                this.chart.data['datasets'][dsIndex].backgroundColor[i] = this.chartDefaults.activeColor;
            }
        }
        this.chartModule['chart'].update();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        valid = (this.active.aggregation && this.active.aggregation && valid);
        if (this.active.aggregation !== 'count') {
            valid = (this.active.aggregationField && this.active.aggregationField.columnName && valid);
        }
        // valid = (this.active.aggregation && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause: any = neon.query.where(this.active.dataField.columnName, '!=', null);
        let yAxisField = this.active.aggregationField.columnName;
        let dataField = this.active.dataField.columnName;

        if (this.hasUnsharedFilter()) {
            // Add the unshared filter
            whereClause = neon.query.and(whereClause,
                neon.query.where(this.meta.unsharedFilterField.columnName, '=',
                    this.meta.unsharedFilterValue));
        }

        switch (this.active.aggregation) {
            case 'count':
                return query.where(whereClause).groupBy(dataField).aggregate(neon.query['COUNT'], '*', 'value')
                    .sortBy('value', neon.query['DESCENDING']).limit(this.active.limit);
            case 'sum':
                return query.where(whereClause).groupBy(dataField).aggregate(neon.query['SUM'], yAxisField, 'value')
                    .sortBy('value', neon.query['DESCENDING']).limit(this.active.limit);
            case 'average':
                return query.where(whereClause).groupBy(dataField).aggregate(neon.query['AVG'], yAxisField, 'value')
                    .sortBy('value', neon.query['DESCENDING']).limit(this.active.limit);
        }

    };

    getFiltersToIgnore() {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = this.getNeonFilterFields();
        // get relevant neon filters and check for filters that should be ignored and add that to query
        let neonFilters = this.filterService.getFilters(database, table, fields);
        // console.log(neonFilters);
        if (neonFilters.length > 0) {
            let ignoredFilterIds = [];
            for (let filter of neonFilters) {
                ignoredFilterIds.push(filter.id);
            }
            return ignoredFilterIds;
        }
        return null;
    }

    onQuerySuccess(response): void {
        // console.log(response);
        let colName = this.active.dataField.columnName;
        // let prettyColName = this.active.dataField.prettyName;
        let d = {
            datasets: [],
            labels: []
        };
        let labels = [];
        let values = [];
        for (let row of response.data) {
            if (row[colName]) {
                labels.push(row[colName]);
                values.push(row.value);
            }
        }
        let dataset = {
            label: this.queryTitle,
            data: values,
            backgroundColor: []
        };

        for (let i = 0; i < dataset.data.length; i++) {
            dataset.backgroundColor[i] = this.chartDefaults.activeColor;
        }

        d.datasets = [];
        d.datasets.push(dataset);
        d.labels = labels;
        this.chart.data = d;
        this.refreshVisualization();
        let title;
        switch (this.active.aggregation) {
            case 'count':
                title = 'Count';
                break;
            case 'average':
                title = 'Average'; // + this.active.aggregationField.prettyName;
                break;
            case 'sum':
                title = 'Sum'; // + this.active.aggregationField.prettyName;
                break;
        }
        title += ' by ' + this.active.dataField.prettyName;
        this.queryTitle = title;
    }

    handleChangeAggregation() {
        this.active.aggregationFieldHidden = (this.active.aggregation === 'count');
        this.executeQueryChain();
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.dataField.columnName];
        let neonFilters = this.filterService.getFilters(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                let f = {
                    key: key,
                    value: value,
                    prettyKey: key
                };
                this.addLocalFilter(f);
            }
        } else {
            this.filters = [];
        }
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeDataField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    };

    handleChangeAggregationField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    };

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain(); // ('andFilters', this.active.andFilters, 'button');
        // this.updateNeonFilter();
    };

    unsharedFilterChanged() {
        // Update the data
        this.executeQueryChain();
    }

    unsharedFilterRemoved() {
        // Update the data
        this.executeQueryChain();
    }

    getButtonText() {
        let text = 'No Data';
        let data = this.chart.data['datasets'];
        if (!data || !data[0] || !data[0]['data'] || !data[0]['data'].length) {
            return text;
        } else {
            return 'Top ' + data[0]['data'].length;
        }
    };

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        return this.filters.map((filter) => {
            return filter.value;
        });
    };

    getFilterTitle(value: string) {
        return this.active.dataField.columnName + ' = ' + value;
    };

    getFilterCloseText(value: string) {
        return value;
    };

    getRemoveFilterTooltip(value: string) {
        return 'Delete Filter ' + this.getFilterTitle(value);
    };

    removeFilter(/*value: string*/) {
        this.filters = [];
    }
}
