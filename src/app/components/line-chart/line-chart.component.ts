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
import {LegendItem} from '../legend/legend.component';
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
        startDate: string,
        endDate: string
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
        aggregation: string,
        dateBucketizer: DateBucketizer
    };

    // private chart: Chartjs.ChartConfiguration;
    private chart: {
        data: {
            labels: any[],
            datasets: any[]
        },
        type: string,
        options: Object
    };

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    private selection: {
        mouseDown: boolean
        startX: number,
        height: number,
        width: number,
        x: number,
        y: number,
        visibleOverlay: boolean,
        startIndex: number,
        endIndex: number,
        startDate: Date,
        endDate: Date
    };

    private colorScheme: string[];

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

        this.colorScheme = ['rgba(255,0,0,1)', 'rgba(0,255,0,1)', 'rgba(0,0,255,1)',
            'rgba(75,192,192,1)', 'rgba(75,192,192,1)', 'rgba(75,192,192,1)',
            'rgba(75,192,192,1)', 'rgba(75,192,192,1)', 'rgba(75,192,192,1)',
            'rgba(75,192,192,1)', 'rgba(75,192,192,1)', 'rgba(75,192,192,1)',
        ];

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
            aggregation: 'count',
            dateBucketizer: null
        };

        this.selection = {
            mouseDown: false,
            height: 20,
            width: 20,
            x: 20,
            y: 200,
            startX: 0,
            visibleOverlay: false,
            startIndex: -1,
            endIndex: -1,
            startDate: null,
            endDate: null
        };

        this.chartDefaults = {
            activeColor: 'rgba(57, 181, 74, 0.9)',
            inactiveColor: 'rgba(57, 181, 74, 0.3)'
        };

        this.onHover = this.onHover.bind(this);
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
                onClick: null,
                hover: {
                    mode: 'index',
                    intersect: false,
                    onHover: this.onHover

                },
                legend: Chart.defaults.global.legend,
                tooltips: Chart.defaults.global.tooltips,
                scales: {
                    xAxes: [{
                        type: 'time',
                        position: 'bottom'
                    }]
                }
            }
        };
        this.chart.options['legend'].display = false;

        let tooltipTitleFunc = (tooltips) => {
            let monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            let index = tooltips[0].index;
            let date = this.active.dateBucketizer.getDateForBucket(index);
            let month = monthNames[date.getUTCMonth()];
            let title = date.getUTCDate() + ' ' + month + ' ' + date.getUTCFullYear();
            return title;
        };
        let tooltipDataFunc = (tooltips) => {
            let label = this.active.aggregation + ': ' + tooltips.yLabel;
            return label;
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

    addLocalFilter(key, startDate, endDate) {
        this.filters[0] = {
            key: key,
            startDate: startDate,
            endDate: endDate
        };
    };

    /**
    * returns -1 if cannot be found
    */
    getPointXLocationByIndex(chart, index): number {
        let dsMeta = chart.controller.getDatasetMeta(0);
        if (dsMeta.data.length > index) {
            let pointMeta = dsMeta.data[index];
            let x = pointMeta.getCenterPoint().x;
            return x;
        }
        return -1;
    }

    onHover(event, items) {
        if (items.length === 0) {
            return;
        }
        let isMouseUp = false;
        if (!this.selection.mouseDown && event.buttons > 0) {
            // mouse down event
            this.selection.mouseDown = true;
            this.selection.startX = items[0].getCenterPoint().x;
            this.selection.startIndex = items[0]._index;
        }

        if (this.selection.mouseDown && event.buttons === 0) {
            // mouse up event
            this.selection.mouseDown = false;
            this.selection.endIndex = items[0]._index;
            isMouseUp = true;
        }
        if (items && items.length > 0 && this.selection.mouseDown) {
            // drag event near items
            let chartArea = items[0]._chart.controller.chartArea;
            let chartBottom = chartArea.bottom;
            let chartTop = chartArea.top;
            let startIndex: number = this.selection.startIndex;
            let endIndex: number = items[0]._index;
            //let endX = items[0].getCenterPoint().x;
            //let startX = this.selection.startX
            let endX: number = -1;
            let startX: number = -1;
            if (startIndex > endIndex) {
                let temp = startIndex;
                startIndex = endIndex;
                endIndex = temp;
            }
            // at this point, start Index is <= end index
            if (startIndex === 0) {
                //first element, so don't go off the chart
                startX = this.getPointXLocationByIndex(items[0]._chart, startIndex);
            } else {
                let a = this.getPointXLocationByIndex(items[0]._chart, startIndex - 1);
                let b = this.getPointXLocationByIndex(items[0]._chart, startIndex);
                startX = (b - a) / 2 + a;
            }

            if (endIndex >= this.chart.data.labels.length - 1) {
                //last element, so don't go off the chart
                endX = this.getPointXLocationByIndex(items[0]._chart, endIndex);
            } else {
                let a = this.getPointXLocationByIndex(items[0]._chart, endIndex);
                let b = this.getPointXLocationByIndex(items[0]._chart, endIndex + 1);
                endX = (b - a) / 2 + a;
            }
            this.selection.width = Math.abs(startX - endX);
            this.selection.x = Math.min(startX, endX);
            this.selection.height = chartBottom - chartTop;
            this.selection.y = chartTop;

            //this.selection.visibleOverlay=!this.selection.visibleOverlay;
        }
        if (isMouseUp) {
            //The button was clicked, handle the selection.
            this.selection.startDate = this.active.dateBucketizer.getDateForBucket(this.selection.startIndex);
            this.selection.endDate = this.active.dateBucketizer.getDateForBucket(this.selection.endIndex);
            let key = this.active.dateField.columnName;
            this.addLocalFilter(key, this.selection.startDate, this.selection.endDate);
            this.addNeonFilter(true);
        }

        this.stopEventPropagation(event);
        //console.log(event);
        //console.log(items);
    }

    stopEventPropagation(event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.returnValue = false;
        }
    }

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: string) {
        let filterClauses = [];
        filterClauses[0] = neon.query.where(fieldName, '>=', this.selection.startDate);
        let endDatePlusOne = this.selection.endDate.getTime() + this.active.dateBucketizer.getMillisMultiplier();
        let endDatePlusOneDate = new Date(endDatePlusOne);
        filterClauses[1] = neon.query.where(fieldName, '<', endDatePlusOneDate);
        return neon.query.and.apply(neon.query, filterClauses);
    };

    getFilterText() {
        // I.E. test - earthquakes - time = 10/11/2015 to 5/1/2016"
        let database = this.active.database.name;
        let table = this.active.table.name;
        let field = this.active.dateField.columnName;
        let text = database + ' - ' + table + ' - ' + field + ' = ';
        let date = this.selection.startDate;
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        date = this.selection.endDate;
        text += ' to ';
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        return text;
    }

    addNeonFilter(executeQueryChainOnSuccess) {
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.dateField.columnName];
        let text = this.getFilterText();

        let onSuccess = () => {
            console.log('filter set successfully');
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain();
            }
        };
        this.filterService.addFilter(this.messenger, database, table, fields,
            this.createNeonFilterClauseEquals.bind(this),
            {
                visName: 'Line chart',
                text: text
            }
            , onSuccess.bind(this),
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
        // TODO evaluate what filters to ignore

        //let database = this.active.database.name;
        //let table = this.active.table.name;
        //let fields = [this.active.dateField.columnName];
        // get relevant neon filters and check for filters that should be ignored and add that to query

        //let neonFilters = this.filterService.getFilters(database, table, fields);
        //console.log(neonFilters);
        //if (neonFilters.length > 0) {
        //let ignoredFilterIds = [];
        //for (let filter of neonFilters) {
        //    ignoredFilterIds.push(filter.id);
        //}
        //query.ignoreFilters(ignoredFilterIds);
        //}

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
        //console.log(response);
        // TODO get better color scheme


        // need to reset chart when data potentially changes type (or number of datasets)
        let ctx = this.chartModule['chart'].chart.ctx;
        this.chartModule['chart'].destroy();
        this.chartModule['chart'] = new Chart(ctx, this.chart);
        //this.chartModule['chart'].reset();

        let dataSetField = this.active.groupField.columnName;
        // let prettyColName = this.active.dateField.prettyName;
        let myData = {};
        let startDate = response.data[0].date;
        let endDate = response.data[response.data.length - 1].date;
        this.active.dateBucketizer = new DateBucketizer();
        let bucketizer = this.active.dateBucketizer;
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
        let datasetIndex = 0;
        for (let datasetName in myData) {
            if (myData.hasOwnProperty(datasetName)) {
                let d = {
                    label: datasetName,
                    data: myData[datasetName],
                    borderColor: this.colorScheme[datasetIndex],
                    pointBorderColor: this.colorScheme[datasetIndex],
                    backgroundColor: 'rgba(0,0,0,0)',
                    pointBackgroundColor: 'rgba(0,0,0,0)'
                };
                datasets.push(d);
                datasetIndex++;
            }
        }
        let labels = new Array(length);
        for (let i = 0; i < length; i++) {
            let date = bucketizer.getDateForBucket(i);

            // TODO is there a better way to get date into ISO format so moment is happy?
            let tmp: number = date.getUTCMonth() + 1;
            let month: String = String(tmp);
            month = (tmp < 10 ? '0' + month : month);

            tmp = date.getUTCDate();
            let day: String = String(date.getUTCDate());
            day = (tmp < 10 ? '0' + day : day);

            labels[i] = date.getUTCFullYear() + '-' + month + '-' + day;
            //   labels[i] = date.toUTCString();
        }
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

    getLegendData(): LegendItem[] {
        let legendData: LegendItem[] = [];
        let datasets = this.chart.data.datasets;
        for (let i = 0; i < datasets.length; i++) {
            let item: LegendItem = {
                prettyName: datasets[i].label,
                accessName: datasets[i].label,
                activeColor: datasets[i].pointBorderColor,
                inactiveColor: 'rgba(50,50,50,1)',
                active: true
            };
            legendData[i] = item;
        }
        return legendData;
    }


    // Get filters and format for each call in HTML
    getCloseableFilters() {
        // let closeableFilters = this.filters.map((filter) => {
        //    return filter.key + " Filter";
        //});
        //return closeableFilters;
        if (this.filters.length > 0) {
            return ['Date Filter'];
        } else {
            return [];
        }
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
                me.executeQueryChain();
                console.log('remove filter' + value);
            },
            () => {
                console.error('error removing filter');
            }, this.messenger);

    };
}
