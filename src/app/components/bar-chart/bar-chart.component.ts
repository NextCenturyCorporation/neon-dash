import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector, ViewChild
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {FieldMetaData, TableMetaData, DatabaseMetaData} from '../../dataset';
import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import {ChartModule} from 'angular2-chartjs';
// import * as Chartjs from '@types/chart.js';
declare var Chart: any;

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
    encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
})
export class BarChartComponent implements OnInit,
    OnDestroy {
    @ViewChild('myChart') chartModule: ChartModule;
    private queryTitle: string;
    private messenger: neon.eventing.Messenger;
    private outstandingDataQuery: Object;
    private filters: {
        key: string,
        value: string,
        prettyKey: string
    }[];
    // private errorMessage: string;
    private initializing: boolean;
    // private exportId: number;

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        aggregation: string,
        aggregationField: string,
        unsharedFilterField: Object,
        unsharedFilterValue: string
    };
    private active: {
        dataField: FieldMetaData,
        aggregationField: FieldMetaData,
        aggregationFieldHidden: boolean,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        layers: any[],
        databases: DatabaseMetaData[],
        database: DatabaseMetaData,
        tables: TableMetaData[],
        table: TableMetaData,
        unsharedFilterField: Object,
        unsharedFilterValue: string,
        fields: FieldMetaData[],
        data: Object[],
        aggregation: string
    };

    // private chart: Chartjs.ChartConfiguration;
    private chart: {
        data: Object,
        type: string,
        options: Object
    };

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    private onClick;



    constructor(private connectionService: ConnectionService, private datasetService: DatasetService, private filterService: FilterService,
        private exportService: ExportService, private injector: Injector, private themesService: ThemesService) {
        console.log(this.exportService);
        console.log(this.filterService);
        console.log(this.connectionService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            aggregation: this.injector.get('aggregation', null),
            aggregationField: this.injector.get('aggregationField', null),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.themesService = themesService;
        this.messenger = new neon.eventing.Messenger();
        this.filters = [];
        this.active = {
            dataField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            andFilters: true,
            limit: 100,
            filterable: true,
            layers: [],
            databases: [],
            database: new DatabaseMetaData(),
            tables: [],
            table: new TableMetaData(),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            data: [],
            aggregation: 'count'
        };

        this.chartDefaults = {
            activeColor: 'rgba(57, 181, 74, 0.9)',
            inactiveColor: 'rgba(57, 181, 74, 0.3)'
        };

        this.onClick = (event, elements: any[]) => {
            console.log(event);
            for (let el of elements) {
                let value = el._model.label;
                let key = this.active.dataField.columnName;
                let prettyKey = this.active.dataField.prettyName;
                this.addLocalFilter(key, value, prettyKey);
                this.addOrReplaceFiltersToNeon();
                this.refreshChartColor();
            }

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
                hover: {
                    mode: 'point',
                    onHover: null

                },
                legend: Chart.defaults.global.legend,
                tooltips: Chart.defaults.global.tooltips
            }
        };
        this.chart.options['legend'].display = false;

        let tooltipTitleFunc = (tooltips) => {
            let title = this.active.dataField.prettyName + ': ' + tooltips[0].xLabel;
            return title;
        };
        let tooltipDataFunc = (tooltips) => {
            let data = this.active.aggregation + ': ' + tooltips.yLabel;
            return data;
        };
        this.chart.options['tooltips'].callbacks.title = tooltipTitleFunc.bind(this);
        this.chart.options['tooltips'].callbacks.label = tooltipDataFunc.bind(this);

    };

    ngOnInit() {
        this.initializing = true;
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });

        // this.exportId = this.exportService.register(this.getExportData);
        // TODO: Resize??
        /*
            $scope.element.resize(resize);
            $scope.element.find('.headers-container').resize(resizeDisplay);
            $scope.element.find('.options-menu-button').resize(resizeTitle);
            resize();
        */

        // prefill outstanding data query object so it has all databases
        this.outstandingDataQuery = {};
        for (let database of this.datasetService.getDatabases()) {
            this.outstandingDataQuery[database.name] = {};
        }
        this.initData();

        this.initializing = false;
        this.executeQueryChain();
    };

    ngOnDestroy() {
        /* $scope.element.off('resize', resize);
        $scope.element.find('.headers-container').off('resize', resizeDisplay);
        $scope.element.find('.options-menu-button').off('resize', resizeTitle);
        $scope.messenger.unsubscribeAll();

        if($scope.functions.isFilterSet()) {
            $scope.functions.removeNeonFilter({
                fromSystem: true
            });
        }

        exportService.unregister($scope.exportId);
        linksPopupService.deleteLinks($scope.visualizationId);
        $scope.getDataLayers().forEach(function(layer) {
            linksPopupService.deleteLinks(createLayerLinksSource(layer));
        });
        themeService.unregisterListener($scope.visualizationId);
        visualizationService.unregister($scope.stateId);

        resizeListeners.forEach(function(element) {
            $scope.element.find(element).off('resize', resize);
        }); */
    };

    initData() {
        this.initDatabases();
    };

    initDatabases() {
        this.active.databases = this.datasetService.getDatabases();
        this.active.database = this.active.databases[0];

        if (this.active.databases.length > 0) {
            if (this.optionsFromConfig.database) {
                for (let database of this.active.databases) {
                    if (this.optionsFromConfig.database === database.name) {
                        this.active.database = database;
                        break;
                    }
                }
            }

            this.initTables();
        }
    };

    initTables() {
        this.active.tables = this.datasetService.getTables(this.active.database['name']);
        this.active.table = this.active.tables[0];

        if (this.active.tables.length > 0) {
            if (this.optionsFromConfig.table) {
                for (let table of this.active.tables) {
                    if (this.optionsFromConfig.table === table.name) {
                        this.active.table = table;
                        break;
                    }
                }
            }
            this.initFields();
        }
    };

    initFields() {
        // Sort the fields that are displayed in the dropdowns in the options menus
        // alphabetically.
        this.active.fields = this.datasetService
            .getSortedFields(this.active.database['name'], this.active.table['name']);

        this.active.unsharedFilterField = this.findFieldObject('unsharedFilterField');
        this.active.unsharedFilterValue = this.optionsFromConfig.unsharedFilterValue || '';

        this.onUpdateFields();
    };

    onUpdateFields() {
        if (this.optionsFromConfig.aggregation) {
            this.active.aggregation = this.optionsFromConfig.aggregation;
        }
        this.active.aggregationField = this.findFieldObject('aggregationField', neonMappings.TAGS);
        this.active.dataField = this.findFieldObject('dataField', neonMappings.TAGS);
    };

    addLocalFilter(key, value, prettyKey) {
        this.filters[0] = {
            key: key,
            value: value,
            prettyKey: prettyKey
        };
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

    addOrReplaceFiltersToNeon() {
        // This widget will always replace which add already handles, I think...
        this.addNeonFilter();
    }

    addNeonFilter() {
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.dataField.columnName];
        this.filterService.addFilter(this.messenger, database, table, fields,
            this.createNeonFilterClauseEquals.bind(this),
            {
                visName: 'Bar chart',
                text: this.filters[0].value
            }
            ,
            () => {
                console.log('filter set successfully');
            },
            () => {
                console.log('filter failed to set');
            });
    }

    refreshChartColor() {
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

    createTitle(resetQueryTitle?: boolean): string {
        if (resetQueryTitle) {
            this.queryTitle = '';
        }
        if (this.queryTitle) {
            return this.queryTitle;
        }
        if (this.optionsFromConfig.title) {
            return this.optionsFromConfig.title;
        }
        let title = this.active.unsharedFilterValue
            ? this.active.unsharedFilterValue + ' '
            : '';
        if (_.keys(this.active).length) {
            return title + (this.active.table && this.active.table.name
                ? this.active.table.prettyName
                : '');
        }
        return title;
    };

    /**
    This is expected to get called whenever a query is expected to be run.
    This could be startup, user action to change field, relevant filter change
    from another visualization
     */
    executeQueryChain() {
        this.queryTitle = this.createTitle(true);
        let query = this.createQuery();
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.dataField.columnName];
        // get relevant neon filters and check for filters that should be ignored and add that to query
        let neonFilters = this.filterService.getFilters(database, table, fields);
        console.log(neonFilters);
        if (neonFilters.length > 0) {
            let ignoredFilterIds = [];
            for (let filter of neonFilters) {
                ignoredFilterIds.push(filter.id);
            }
            query.ignoreFilters(ignoredFilterIds);
        }

        this.executeQuery(query);
    }

    createQuery(): neon.query.Query {
        let databaseName = this.active.database.name;
        let tableName = this.active.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        let yAxisField = this.active.aggregationField.columnName;
        let dataField = this.active.dataField.columnName;
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

    executeQuery = function(query: neon.query.Query) {
        let me = this;
        let database = this.active.database.name;
        let table = this.active.table.name;
        let connection = this.connectionService.getActiveConnection();

        if (!connection || !this.datasetService.isFieldValid(this.active.dataField)) {
            return;
        }
        // Cancel any previous data query currently running.
        if (this.outstandingDataQuery[database] && this.outstandingDataQuery[database][table]) {
            this.outstandingDataQuery[database][table].abort();
        }

        // Execute the data query, calling the function defined in 'done' or 'fail' as
        // needed.
        this.outstandingDataQuery[database][table] = connection.executeQuery(query, null);

        // Visualizations that do not execute data queries will not return a query
        // object.
        if (!this.outstandingDataQuery[database][table]) {
            // TODO do something
            console.log('execute query did not return an object');
        }

        this.outstandingDataQuery[database][table].always(function() {
            me.outstandingDataQuery[database][table] = undefined;
        });

        this.outstandingDataQuery[database][table].done(this.onQuerySuccess.bind(this));

        this.outstandingDataQuery[database][table].fail(function(response) {
            console.error(response);
            if (response.status === 0) {
                // TODO handle error
            } else {
                // TODO handle error
            }
        });
    };

    onQuerySuccess = (response) => {
        console.log(response);
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
        this.refreshChartColor();
    };

    /**
    * Get field object from the key into the config options
    */
    findFieldObject(bindingKey: string, mappingKey?: string): FieldMetaData {
        let me = this;
        let find = function(name) {
            return _.find(me.active.fields, function(field) {
                return field['columnName'] === name;
            });
        };

        let field;
        if (bindingKey) {
            field = find(this.optionsFromConfig[bindingKey]);
        }

        if (!field && mappingKey) {
            field = find(this.getMapping(mappingKey));
        }

        return field || this.datasetService.createBlankField();
    };

    getMapping = function(key: string): string {
        return this.datasetService.getMapping(this.active.database.name, this.active.table.name, key);
    };

    handleChangeAggregation() {
        this.active.aggregationFieldHidden = (this.active.aggregation === 'count');
        this.executeQueryChain();
    }

    handleFiltersChangedEvent() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.dataField.columnName];
        let neonFilters = this.filterService.getFilters(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                this.addLocalFilter(key, value, key);
            }
        } else {
            this.filters = [];
        }
        this.executeQueryChain();
    };

    onUpdateDataChannelEvent(event) {
        console.log('update data channel event');
        console.log(event);
    }

    getExportData() { };

    handleChangeDatabase() {
        this.initTables();
        this.logChangeAndStartQueryChain(); // ('database', this.active.database.name);
    };

    handleChangeTable() {
        this.initFields();
        this.logChangeAndStartQueryChain(); // ('table', this.active.table.name);
    };

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

    logChangeAndStartQueryChain() { // (option: string, value: any, type?: string) {
        // this.logChange(option, value, type);
        if (!this.initializing) {
            this.executeQueryChain();
        }
    };

    getButtonText() {
        // TODO Fix this.  It gets called a lot
        // return !this.isFilterSet() && !this.active.data.length
        //    ? 'No Data'
        //    : 'Top ' + this.active.data.length;
        // console.log('TODO - see getButtonText()')
    };

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        let closeableFilters = this.filters.map((filter) => {
            return filter.value;
        });
        return closeableFilters;
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

    removeLocalFilterFromLocalAndNeon(value: string) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        let me = this;
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.dataField.columnName];
        this.filterService.removeFilter(database, table, fields,
            () => {
                me.filters = [];
                me.refreshChartColor();
                console.log('remove filter' + value);
            },
            () => {
                console.error('error removing filter');
            }, this.messenger);

    };
}
