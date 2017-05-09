/// <reference path="../../../../node_modules/@types/d3/index.d.ts" />
import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector, ElementRef, ViewChild, HostListener,
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
import {DateBucketizer} from '../bucketizers/DateBucketizer';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
import {MonthBucketizer} from '../bucketizers/MonthBucketizer';
import {Bucketizer} from '../bucketizers/Bucketizer';
import {TimelineSelectorChart, TimelineSeries} from './TimelineSelectorChart';
import {YearBucketizer} from '../bucketizers/YearBucketizer';

declare let d3;

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
    encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.Default
})
export class TimelineComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {
    //@ViewChild('filterChart') filterChartModule: ChartModule;
    //@ViewChild('overviewChart') overviewChartModule: ChartModule;
    @ViewChild('svg') svg: ElementRef;

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
        granularity: string,
        unsharedFilterField: Object,
        unsharedFilterValue: string
    };

    private active: {
        dateField: FieldMetaData,
        andFilters: boolean,
        filterable: boolean,
        layers: any[],
        data: Object[],
        bucketizer: Bucketizer,
        granularity: string,
    };

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    private selection: {
        mouseDown: boolean
        startX: number,
        width: number,
        x: number,
        visibleOverlay: boolean,
        startIndex: number,
        endIndex: number,
        startDate: Date,
        endDate: Date
    };

    protected filterChart: {
        data: TimelineSeries[],
        type: string,
        options: Object
    };

    protected overviewChart: {
        data: TimelineSeries[],
        type: string,
        options: Object
    };

    private colorSchemeService: ColorSchemeService;

    private timelineChart: TimelineSelectorChart;

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, colorSchemeSrv: ColorSchemeService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dateField: this.injector.get('dateField', null),
            granularity: this.injector.get('granularity', 'day'),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.colorSchemeService = colorSchemeSrv;
        this.filters = [];

        this.active = {
            dateField: new FieldMetaData(),
            andFilters: true,
            filterable: true,
            layers: [],
            data: [],
            bucketizer: new DateBucketizer(),
            granularity: 'day'
        };

        this.selection = {
            mouseDown: false,
            width: 20,
            x: 20,
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
        this.overviewChart = {
            data: [],
            type: 'TimeLine',
            options: {}
        };
        //this.overviewChart = this.getDefaultChartOptions();
        //this.filterChart = this.getDefaultChartOptions();
        //this.overviewChart.options['tooltips'].callbacks.title = tooltipTitleFunc.bind(this);
        //this.overviewChart.options['tooltips'].callbacks.label = tooltipDataFunc.bind(this);

    };

    /*getDefaultChartOptions(): any {
        let chart = {
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
                        type: 'category',
                        position: 'bottom'
                    }]
                }
            }
        };
        chart.options['legend'].display = false;

                let tooltipTitleFunc = (tooltips) => {
                    let monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                    ];
                    let index = tooltips[0].index;
                    let date = this.active.bucketizer.getDateForBucket(index);
                    let month = monthNames[date.getUTCMonth()];
                    let title = date.getUTCDate() + ' ' + month + ' ' + date.getUTCFullYear();
                    return title;
                };
                let tooltipDataFunc = (tooltips) => {
                    let label = 'FIXME' + ': ' + tooltips.yLabel;
                    return label;
                };

        return chart;
    }*/

    subNgOnInit() {
        this.timelineChart = new TimelineSelectorChart(this.svg);
    };

    postInit() {
        this.executeQueryChain();
    };

    subNgOnDestroy() {

    };

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    };

    onUpdateFields() {
        this.active.dateField = this.findFieldObject('dateField', neonMappings.DATE);
    };

    addLocalFilter(key, startDate, endDate) {
        this.filters.push({
            key: key,
            startDate: startDate,
            endDate: endDate
        });
    };

    /**
    * returns -1 if cannot be found
    */
    getPointXLocationByIndex(chart, index): number {
        let dsMeta = chart.controller.getDatasetMeta(0);
        if (dsMeta.data.length > index) {
            let pointMeta = dsMeta.data[index];
            return pointMeta.getCenterPoint().x;
        }
        return -1;
    }

    onHover(/*event, items*/) {
        /*if (items.length === 0) {
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
            this.selection.startDate = this.active.bucketizer.getDateForBucket(this.selection.startIndex);
            this.selection.endDate = this.active.bucketizer.getDateForBucket(this.selection.endIndex);
            let key = this.active.dateField.columnName;
            this.addLocalFilter(key, this.selection.startDate, this.selection.endDate);
            this.addNeonFilter(true);
        }

        this.stopEventPropagation(event);
        //console.log(event);
        //console.log(items);*/
    }

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: string) {
        let filterClauses = [];
        filterClauses[0] = neon.query.where(fieldName, '>=', this.selection.startDate);
        let endDatePlusOne = this.selection.endDate.getTime() + DateBucketizer.MILLIS_IN_DAY;
        let endDatePlusOneDate = new Date(endDatePlusOne);
        filterClauses[1] = neon.query.where(fieldName, '<', endDatePlusOneDate);
        return neon.query.and.apply(neon.query, filterClauses);
    };

    getFilterText() {
        // I.E. TIMELINE - EARTHQUAKES: 8 AUG 2015 TO 20 DEC 2015
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
        return [this.active.dateField.columnName];
    }

    getVisualizationName() {
        return 'Timeline';
    }

    refreshVisualization() {
        this.timelineChart.setData(this.overviewChart.data);
        //this.filterChartModule['chart'].update();
        //this.overviewChartModule['chart'].update();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dateField && this.active.dateField.columnName && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.dateField.columnName, '!=', null);
        let dateField = this.active.dateField.columnName;
        query = query.aggregate(neon.query['MIN'], dateField, 'date');
        let groupBys: any[] = [];
        switch (this.active.granularity) {
            //Passthrough is intentional and expected!  falls through comments tell the linter that it is ok.
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
        query = query.groupBy(groupBys);
        query = query.sortBy('date', neon.query['ASCENDING']);
        query = query.where(whereClause);
        return query.aggregate(neon.query['COUNT'], '*', 'value');
    };

    getColorFromScheme(index) {
        return this.colorSchemeService.getColorAsRgb(index);
    }

    getFiltersToIgnore() {
        return null;
    }

    onQuerySuccess(response) {
        let series: TimelineSeries = {
            color: this.chartDefaults.activeColor,
            name: 'Total',
            type: 'bar',
            options: {},
            data: [],
            startDate: null,
            endDate: null
        };

        // Convert all the dates into Date objects
        response.data.map((d) => {
            d.date = new Date(d.date);
        });

        // The query includes a sort, so it *should* be sorted.
        // Start date will be the first entry, and the end date will be the last
        series.startDate = response.data[0].date;
        let lastDate = response.data[response.data.length - 1].date;
        series.endDate = d3.time[this.active.granularity]
            .utc.offset(lastDate, 1);

        // If we have a bucketizer, use it
        if (this.active.bucketizer) {
            this.active.bucketizer.setStartDate(series.startDate);
            this.active.bucketizer.setEndDate(series.endDate);

            let numBuckets = this.active.bucketizer.getNumBuckets();
            for (let i = 0; i < numBuckets; i++) {
                let bucketDate = this.active.bucketizer.getDateForBucket(i);
                series.data[i] = {
                    date: bucketDate,
                    value: 0
                };
            }

            for (let row of response.data) {
                let curDate = new Date(row.date);
                let bucketIndex = this.active.bucketizer.getBucketIndex(curDate);

                if (series.data[bucketIndex]) {
                    series.data[bucketIndex].value += row.value;
                }
            }
        } else {
            // No bucketizer, just add the data
            for (let row of response.data) {
                series.data.push({
                    date: row.date,
                    value: row.value
                });
            }
        }

        this.overviewChart.data = [series];
        this.timelineChart.setData(this.overviewChart.data);
        this.timelineChart.redrawChart();

        this.refreshVisualization();
    };

    @HostListener('window:resize')
    onResize() {
        this.timelineChart.redrawChart();
    }

    dateToIsoYear(date: Date): string {
        // 2017
        return '' + date.getUTCFullYear();
    }

    dateToIsoMonth(date: Date): string {
        // 2017-03
        let tmp: number = date.getUTCMonth() + 1;
        let month: String = String(tmp);
        month = (tmp < 10 ? '0' + month : month);
        return date.getUTCFullYear() + '-' + month;
    }

    dateToIsoDay(date: Date): string {
        // 2017-03
        // TODO is there a better way to get date into ISO format so moment is happy?
        let tmp: number = date.getUTCMonth() + 1;
        let month: String = String(tmp);
        month = (tmp < 10 ? '0' + month : month);

        tmp = date.getUTCDate();
        let day: String = String(date.getUTCDate());
        day = (tmp < 10 ? '0' + day : day);
        return date.getUTCFullYear() + '-' + month + '-' + day;
    }

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

    handleChangeGranularity() {
        switch (this.active.granularity.toLowerCase()) {
            case 'day':
                this.active.bucketizer = new DateBucketizer();
                break;
            case 'month':
                this.active.bucketizer = new MonthBucketizer();
                break;
            case 'year':
                this.active.bucketizer = new YearBucketizer();
                break;
            default:
                this.active.bucketizer = null;
        }
        this.timelineChart.setGranularity(this.active.granularity);
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
                this.addLocalFilter(key, value, key);
            }
        } else {
            this.filters = [];
        }
        this.executeQueryChain();
    };

    handleChangeDateField() {
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

    getRemoveFilterTooltip(value: string) {
        return 'Delete Filter ' + this.getFilterTitle(value);
    };

    removeFilter(/*value: string*/) {
        this.filters = [];
    }
}
