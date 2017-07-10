import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {ColorSchemeService} from '../../services/color-scheme.service';
import {FieldMetaData } from '../../dataset';
import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
//import * as _ from 'lodash';
import {DateBucketizer} from '../bucketizers/DateBucketizer';
import {MonthBucketizer} from '../bucketizers/MonthBucketizer';
import {YearBucketizer} from '../bucketizers/YearBucketizer';
import {LegendItem} from '../legend/legend.component';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
import {ChartModule} from 'angular2-chartjs';
import * as momentOrig from 'moment';
import * as moment from 'moment-timezone';
declare var Chart: any;

@Component({
    selector: 'app-line-chart',
    templateUrl: './line-chart.component.html',
    styleUrls: ['./line-chart.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineChartComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {
    @ViewChild('myChart') chartModule: ChartModule;

    private filters: {
        key: string,
        startDate: string,
        endDate: string
    }[];

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
    public active: {
        dateField: FieldMetaData,
        aggregationField: FieldMetaData,
        aggregationFieldHidden: boolean,
        groupField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        groupLimit: number,
        filterable: boolean,
        layers: any[],
        aggregation: string,
        dateBucketizer: any,
        granularity: string
    };

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    public selection: {
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

    public chart: {
        data: {
            labels: any[],
            datasets: any[]
        },
        type: string,
        options: Object,
    };
    private colorSchemeService: ColorSchemeService;
    private mouseEventValid: boolean;

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref);
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
        this.colorSchemeService = colorSchemeSrv;
        this.filters = [];

        this.active = {
            dateField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            groupField: new FieldMetaData(),
            andFilters: true,
            limit: 10000,
            groupLimit: 10,
            filterable: true,
            layers: [],
            aggregation: 'count',
            dateBucketizer: null,
            granularity: 'day'
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
        this.mouseEventValid = false;
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
                animation: {
                  duration: 0, // general animation time
                },
                hover: {
                    mode: 'index',
                    intersect: false,
                    onHover: this.onHover

                },
                //legend: Chart.defaults.global.legend,
                //  tooltips: Chart.defaults.global.tooltips,
                scales: {
                    xAxes: [{
                        type: 'time',
                        position: 'bottom'
                    }]
                }
            }
        };
        this.chart.options['legend'] = {};
        this.chart.options['legend'].display = false;

        let tooltipTitleFunc = (tooltips) => {
            let index = tooltips[0].index;
            let dsIndex = tooltips[0].datasetIndex;
            // Chart.js uses moment to format the date axis, so use moment for the tooltips as well
            let date = moment(this.active.dateBucketizer.getDateForBucket(index));
            // 'll' is the locale-specific format for displaying month, day, and year in an
            // abbreviated format. See "Localized formats" in http://momentjs.com/docs/#/displaying/format/
            let format = 'll';
            switch (this.active.granularity) {
                case 'hour':
                    format = 'lll';
                    break;
                case 'day':
                    format = 'll';
                    break;
                case 'month':
                    format = 'MMM YYYY';
                    break;
                case 'year':
                    format = 'YYYY';
                    break;
            }
            let title = this.chart.data.datasets[dsIndex].label + ' - ' + date.tz('GMT').format(format);
            return title;
        };
        let tooltipDataFunc = (tooltips) => {
            let label = this.active.aggregation + ': ' + tooltips.yLabel;
            return label;
        };
        this.chart.options['tooltips'] = { callbacks: {} };
        this.chart.options['tooltips'].callbacks.title = tooltipTitleFunc.bind(this);
        this.chart.options['tooltips'].callbacks.label = tooltipDataFunc.bind(this);
        this.queryTitle = 'Line Chart';
    };

    subNgOnInit() {
        this.chart.type = 'line';
    };

    postInit() {
        //Do nothing.  An on change unfortunately kicks off the initial query.
    };

    subNgOnDestroy() {
        this.chartModule['chart'].destroy();
        this.chart.data = {
            labels: [],
            datasets: []
        };
        this.chart.options = {};
    };

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    };

    onUpdateFields() {
        if (this.optionsFromConfig.aggregation) {
            this.active.aggregation = this.optionsFromConfig.aggregation;
        }
        this.active.aggregationField = this.findFieldObject('aggregationField', neonMappings.TAGS);
        this.active.dateField = this.findFieldObject('dateField', neonMappings.TAGS);
        this.active.groupField = this.findFieldObject('groupField', neonMappings.TAGS);
        this.active = Object.assign({}, this.active);
    };

    createFilter(key, startDate, endDate) {
        return {
            key: key,
            startDate: startDate,
            endDate: endDate
        };
    }

    addLocalFilter(f) {
        this.filters[0] = f;
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

    mouseLeave(event) {
        //console.log('leave');
        //console.log(event);
        this.mouseEventValid = false;
        this.selection.mouseDown = false;
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
    }

    mouseDown(event) {
        //console.log('down');
        //console.log(event);
        if (event.buttons > 0) {
            this.mouseEventValid = true;
        }
    }

    mouseUp(/*event*/) {

    }

    onHover(event, items) {
        if (items.length === 0) {
            return;
        }
        let isMouseUp = false;
        let redraw = false;
        if (!this.selection.mouseDown && event.buttons > 0 && this.mouseEventValid) {
            // mouse down event
            this.selection.mouseDown = true;
            this.selection.startX = items[0].getCenterPoint().x;
            this.selection.startIndex = items[0]._index;
            redraw = true;
        }

        if (this.selection.mouseDown && event.buttons === 0 && this.mouseEventValid) {
            // mouse up event
            this.selection.mouseDown = false;
            this.selection.endIndex = items[0]._index;
            isMouseUp = true;
            redraw = true;
        }
        if (items && items.length > 0 && this.selection.mouseDown && this.mouseEventValid) {
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
            redraw = true;
            //this.selection.visibleOverlay=!this.selection.visibleOverlay;
        }
        if (isMouseUp) {
            //The button was clicked, handle the selection.
            this.selection.startDate = this.active.dateBucketizer.getDateForBucket(this.selection.startIndex);
            this.selection.endDate = this.active.dateBucketizer.getDateForBucket(this.selection.endIndex);
            let key = this.active.dateField.columnName;
            let f = this.createFilter(key, this.selection.startDate, this.selection.endDate);
            this.addLocalFilter(f);
            this.addNeonFilter(true, f);
            redraw = true;
        }

        this.stopEventPropagation(event);
        if (redraw) {
            this.changeDetection.detectChanges();
        }
        //console.log(event);
        //console.log(items);
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
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let field = this.active.dateField.columnName;
        let text = database + ' - ' + table + ' - ' + field + ' = ';
        let date = this.selection.startDate;
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        date = this.selection.endDate;
        text += ' to ';
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        return text;
    }

    getNeonFilterFields() {

        let fields = [this.active.dateField.columnName];
        return fields;
    }
    getVisualizationName() {
        return 'Line Chart';
    }


    refreshVisualization() {
        this.chartModule['chart'].update();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dateField && this.active.dateField.columnName && valid);
        valid = (this.active.aggregation && valid);
        if (valid && this.active.aggregation !== 'count') {
            let aggCol = this.active.aggregationField.columnName;
            valid = aggCol && valid && aggCol !== '';
        }
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.dateField.columnName, '!=', null);
        let yAxisField = this.active.aggregationField.columnName;
        let dateField = this.active.dateField.columnName;
        let groupField = this.active.groupField.columnName;
        query = query.aggregate(neon.query['MIN'], dateField, 'date');
        let groupBys: any[] = [];
        switch (this.active.granularity) {
            case 'hour':
                groupBys.push(new neon.query.GroupByFunctionClause('hour', dateField, 'hour'));
                /* falls through */
            case 'day':
                groupBys.push(new neon.query.GroupByFunctionClause('dayOfMonth', dateField, 'day'));
                /* falls through */
            case 'month':
                groupBys.push(new neon.query.GroupByFunctionClause('month', dateField, 'month'));
                /* falls through */
            case 'year':
                groupBys.push(new neon.query.GroupByFunctionClause('year', dateField, 'year'));
                /* falls through */
        }
        //groupBys.push(new neon.query.GroupByFunctionClause('year', dateField, 'year'));
        //groupBys.push(new neon.query.GroupByFunctionClause('month', dateField, 'month'));
        //groupBys.push(new neon.query.GroupByFunctionClause('dayOfMonth', dateField, 'day'));
        //if (this.active.granularity === 'hour') {
        //    groupBys.push(new neon.query.GroupByFunctionClause('hour', dateField, 'hour'));
        //}
        groupBys.push(groupField);
        query = query.groupBy(groupBys);
        //query = query.sortBy('value', neon.query['DESCENDING']);
        //we assume sorted by date later to get min and max date!
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
            case 'min':
                return query.aggregate(neon.query['MIN'], yAxisField, 'value');
            case 'max':
                return query.aggregate(neon.query['MAX'], yAxisField, 'value');
        }

    };

    getColorFromScheme(index) {
        let color = this.colorSchemeService.getColorAsRgb(index);
        return color;
    }

    getFiltersToIgnore() {
        return null;
    }

    onQuerySuccess(response) {
        // need to reset chart when data potentially changes type (or number of datasets)
        let ctx = this.chartModule['chart'].chart.ctx;
        //this.chartModule['chart'].destroy();
        //this.chartModule['chart'] = new Chart(ctx, this.chart);
        //this.chartModule['chart'].reset();
        let tmpLimit = this.active.groupLimit;
        if (response.data.length === 0) {
            return;
        }
        let dataSetField = this.active.groupField.columnName;
        // let prettyColName = this.active.dateField.prettyName;
        let myData = {};
        let startDate = response.data[0].date;
        let endDate = response.data[response.data.length - 1].date;
        switch (this.active.granularity) {
            case 'hour':
                this.active.dateBucketizer = new DateBucketizer();
                this.active.dateBucketizer.setGranularity(DateBucketizer.HOUR);
                break;
            case 'day':
                this.active.dateBucketizer = new DateBucketizer();
                this.active.dateBucketizer.setGranularity(DateBucketizer.DAY);
                break;
            case 'month':
                this.active.dateBucketizer = new MonthBucketizer();
                break;
            case 'year':
                this.active.dateBucketizer = new YearBucketizer();
                break;
        }
        //this.active.dateBucketizer = new DateBucketizer();
        let bucketizer = this.active.dateBucketizer;
        bucketizer.setStartDate(new Date(startDate));
        bucketizer.setEndDate(new Date(endDate));
        let length = bucketizer.getNumBuckets();
        let fillValue = (this.active.aggregation === 'count' ? 0 : null);
        let numDatasets = 0;
        let totals = {};
        for (let row of response.data) {
            if (row[dataSetField]) {
                let dataSet = row[dataSetField];
                let idx = bucketizer.getBucketIndex(new Date(row.date));
                let ds = myData[dataSet];
                if (!ds) {
                    myData[dataSet] = new Array(length).fill(fillValue);
                    totals[dataSet] = 0;
                    numDatasets++;
                }
                myData[dataSet][idx] = row.value;
                totals[dataSet] += row.value;
                //if (numDatasets > tmpLimit){
                //  break;
                //}
            }
        }
        let datasets = []; // TODO type to chartjs
        let datasetIndex = 0;

        for (let datasetName in myData) {
            if (myData.hasOwnProperty(datasetName)) {
                let d = {
                    label: datasetName,
                    data: myData[datasetName],
                    borderColor: this.getColorFromScheme(datasetIndex),
                    pointBorderColor: this.getColorFromScheme(datasetIndex),
                    backgroundColor: 'rgba(0,0,0,0)',
                    pointBackgroundColor: 'rgba(0,0,0,0)',
                    total: totals[datasetName]
                };
                datasets.push(d);
                datasetIndex++;
            }
        }
        datasets = datasets.sort((a, b) => {
            return b.total - a.total;
        });
        if (datasets.length > tmpLimit) {
            datasets = datasets.slice(0, tmpLimit);
        }
        let labels = new Array(length);
        for (let i = 0; i < length; i++) {
            let date = bucketizer.getDateForBucket(i);
            let dateString = null;
            switch (this.active.granularity) {
                case 'hour':
                    dateString = this.dateToIsoDayHour(date);
                    break;
                case 'day':
                    dateString = this.dateToIsoDay(date);
                    break;
                case 'month':
                    dateString = this.dateToIsoMonth(date);
                    break;
                case 'year':
                    dateString = this.dateToIsoYear(date);
                    break;
            }
            labels[i] = dateString;
            //   labels[i] = date.toUTCString();
        }
        this.chart.data = {
            labels: labels,
            datasets: datasets
        };

        this.refreshVisualization();
        let title = '';
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
            case 'min':
                title = 'Minimum'; // + this.active.aggregationField.prettyName;
                break;
            case 'max':
                title = 'Maximum'; // + this.active.aggregationField.prettyName;
                break;
        }
        if (this.active.groupField && this.active.groupField.prettyName) {
            title += ' by ' + this.active.groupField.prettyName;
        }
        this.queryTitle = title;
    };

    dateToIsoDayHour(date: Date): string {
        // 2017-03-09T15:21:01Z
        let ret: string = this.dateToIsoDay(date);

        let tmp: number = date.getUTCHours();
        let hours: String = String(tmp);
        hours = (tmp < 10 ? '0' + hours : hours);

        tmp = date.getUTCMinutes();
        let mins: String = String(tmp);
        mins = (tmp < 10 ? '0' + mins : mins);

        tmp = date.getUTCSeconds();
        let secs: String = String(tmp);
        secs = (tmp < 10 ? '0' + secs : secs);
        ret += 'T' + hours + ':' + mins + ':' + secs + 'Z';
        return ret;
    }

    dateToIsoDay(date: Date): string {
        // 2017-03-09
        // TODO is there a better way to get date into ISO format so moment is happy?
        let tmp: number = date.getUTCMonth() + 1;
        let month: String = String(tmp);
        month = (tmp < 10 ? '0' + month : month);

        tmp = date.getUTCDate();
        let day: String = String(date.getUTCDate());
        day = (tmp < 10 ? '0' + day : day);
        return date.getUTCFullYear() + '-' + month + '-' + day;
    }

    dateToIsoMonth(date: Date): string {
        let tmp: number = date.getUTCMonth() + 1;
        let month: String = String(tmp);
        month = (tmp < 10 ? '0' + month : month);
        return date.getUTCFullYear() + '-' + month;
    }

    dateToIsoYear(date: Date): string {
        return '' + date.getUTCFullYear();
    }

    handleChangeAggregation() {
        this.active.aggregationFieldHidden = (this.active.aggregation === 'count');
        this.logChangeAndStartQueryChain();
    }

    handleChangeGranularity() {
        this.logChangeAndStartQueryChain();
    }

    handleFiltersChangedEvent() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.dateField.columnName];
        let neonFilters = this.filterService.getFilters(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                let f = this.createFilter(key, value, key);
                this.addLocalFilter(f);
            }
        } else {
            this.filters = [];
        }
        this.executeQueryChain();
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

    removeFilter(/*value: string*/) {
        this.filters = [];
    }
}
