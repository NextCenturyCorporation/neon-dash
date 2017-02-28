import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ViewChild,
    Input
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
import {DateBucketizer} from './DateBucketizer';
import {ChartModule} from 'angular2-chartjs';
// import * as Chartjs from 'chart.js';
declare var Chart: any;

@Component({
    selector: 'app-line-chart',
    templateUrl: './line-chart.component.html',
    styleUrls: ['./line-chart.component.scss'],
    encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
})
export class LineChartComponent implements OnInit,
    OnDestroy {
    @ViewChild('myChart') chartModule: ChartModule;
    @Input() chartType: string;
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
        dateField: string,
        groupField: string,
        aggregation: string,
        aggregationField: string,
        unsharedFilterField: Object,
        unsharedFilterValue: string
    };
    private active: {
        dateField: FieldMetaData,
        aggregationField: FieldMetaData,
        aggregationFieldHidden: boolean,
        groupField: FieldMetaData,
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
            dateField: this.injector.get('dateField', null),
            groupField: this.injector.get('groupField', null),
            aggregation: this.injector.get('aggregation', null),
            aggregationField: this.injector.get('aggregationField', null),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.themesService = themesService;
        this.messenger = new neon.eventing.Messenger();
        this.filters = [];
        this.active = {
            dateField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            groupField: new FieldMetaData(),
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
                let key = this.active.dateField.columnName;
                let prettyKey = this.active.dateField.prettyName;
                this.addLocalFilter(key, value, prettyKey);
                this.addOrReplaceFiltersToNeon();
                this.refreshChart();
            }
        };

        this.onClick = this.onClick.bind(this);
        this.chart = {
            type: null,
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
            let title = this.active.dateField.prettyName + ': ' + tooltips[0].xLabel;
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
        this.chart.type = 'line';
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
        this.active.dateField = this.findFieldObject('dateField', neonMappings.TAGS);
        this.active.groupField = this.findFieldObject('groupField', neonMappings.TAGS);
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
        let fields = [this.active.dateField.columnName];
        this.filterService.addFilter(this.messenger, database, table, fields,
            this.createNeonFilterClauseEquals.bind(this),
            {
                visName: 'Line chart',
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

    refreshChart() {
        /*let dsIndex = 0;
        if (this.filters[0] && this.filters[0].value) {
            let activeValue = this.filters[0].value;

            for (let i = 0; i < this.chart.data['datasets'][dsIndex].backgroundColor.length; i++) {
                if (this.chart.data['labels'][i] == activeValue) {
                    this.chart.data['datasets'][dsIndex].backgroundColor[i] = this.chartDefaults.activeColor;
                } else {
                    this.chart.data['datasets'][dsIndex].backgroundColor[i] = this.chartDefaults.inactiveColor;
                }
            }
        } else {
            for (let i = 0; i < this.chart.data['datasets'][dsIndex].backgroundColor.length; i++) {
                this.chart.data['datasets'][dsIndex].backgroundColor[i] = this.chartDefaults.activeColor;
            }
        }*/
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
        let isValidQuery = this.isValidQuery();
        if (!isValidQuery) {
            return;
        }
        this.queryTitle = this.createTitle(true);
        let query = this.createQuery();
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.dateField.columnName];
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

    isValidQuery() {
        let valid = true;
        valid = (this.active.database && valid);
        valid = (this.active.table && valid);
        valid = (this.active.dateField && valid);
        valid = (this.active.aggregationField && valid);
        valid = (this.active.aggregation && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let hourGranularity = false;

        let databaseName = this.active.database.name;
        let tableName = this.active.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.dateField.columnName, '!=', null);
        let yAxisField = this.active.aggregationField.columnName;
        let dateField = this.active.dateField.columnName;
        let groupField = this.active.groupField.columnName;
        query = query.aggregate(neon.query['MIN'], dateField, 'date');
        let groupBys: any[] = [];
        groupBys.push(new neon.query.GroupByFunctionClause('year', dateField, 'year'));
        groupBys.push(new neon.query.GroupByFunctionClause('month', dateField, 'month'));
        groupBys.push(new neon.query.GroupByFunctionClause('dayOfMonth', dateField, 'day'));
        if (hourGranularity) {
            groupBys.push(new neon.query.GroupByFunctionClause('hour', dateField, 'hour'));
        }
        groupBys.push(groupField);
        query = query.groupBy(groupBys);
        query = query.sortBy('date', neon.query['ASCENDING']);
        query = query.where(whereClause);
        query = query.limit(this.active.limit);
        switch (this.active.aggregation) {
            case 'count':
                return query.aggregate(neon.query['COUNT'], '*', 'value');
            case 'sum':
                return query.aggregate(neon.query['SUM'], yAxisField, 'value');
            case 'average':
                return query.aggregate(neon.query['AVG'], yAxisField, 'value');
        }

    };

    executeQuery = function(query: neon.query.Query) {
        let me = this;
        let database = this.active.database.name;
        let table = this.active.table.name;
        let connection = this.connectionService.getActiveConnection();

        if (!connection || !this.datasetService.isFieldValid(this.active.dateField)) {
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
        let dataSetField = this.active.groupField.columnName;
        // let prettyColName = this.active.dateField.prettyName;
        let myData = {};
        let startDate = response.data[0].date;
        let endDate = response.data[response.data.length - 1].date;
        let bucketizer = new DateBucketizer();
        bucketizer.setStartDate(new Date(startDate));
        bucketizer.setEndDate(new Date(endDate));
        let length = bucketizer.getNumBuckets();

        for (let row of response.data) {
            if (row[dataSetField]) {
                let dataSet = row[dataSetField];
                let idx = bucketizer.getBucketIndex(new Date(row.date));
                let ds = myData[dataSet];
                if (!ds) {
                    myData[dataSet] = new Array(length).fill(0);
                }
                myData[dataSet][idx] = row.value;
            }
        }
        let datasets = []; // TODO type to chartjs
        for (let datasetName in myData) {
            if (myData.hasOwnProperty(datasetName)) {
                let d = {
                    label: datasetName,
                    data: myData[datasetName]
                };
                datasets.push(d);
            }
        }
        let labels = new Array(length).fill('1');
        this.chart.data = {
            labels: labels,
            datasets: datasets
        };
        this.refreshChart();
    }

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
        let fields = [this.active.dateField.columnName];
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

    handleChangeDateField() {
        this.logChangeAndStartQueryChain(); // ('dateField', this.active.dateField.columnName);
    };

    handleChangeGroupField() {
        this.logChangeAndStartQueryChain(); // ('dateField', this.active.dateField.columnName);
    };

    handleChangeAggregationField() {
        this.logChangeAndStartQueryChain(); // ('dateField', this.active.dateField.columnName);
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
        return this.active.dateField.columnName + ' = ' + value;
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
        let fields = [this.active.dateField.columnName];
        this.filterService.removeFilter(database, table, fields,
            () => {
                me.filters = [];
                me.refreshChart();
                console.log('remove filter' + value);
            },
            () => {
                console.error('error removing filter');
            }, this.messenger);

    };
}
