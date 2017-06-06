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
import * as _ from 'lodash';
import {DateBucketizer} from '../bucketizers/DateBucketizer';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
import {MonthBucketizer} from '../bucketizers/MonthBucketizer';
import {Bucketizer} from '../bucketizers/Bucketizer';
import {TimelineSelectorChart, TimelineSeries, TimelineData} from './TimelineSelectorChart';
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
    @ViewChild('svg') svg: ElementRef;

    private filters: {
        key: string,
        startDate: Date,
        endDate: Date,
        local: boolean
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dateField: string,
        granularity: string,
    };

    private active: {
        dateField: FieldMetaData,
        granularity: string,
    };

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    // Cache the data from the last query
    private queryData: {
        data: {
            value: number,
            date: Date
        }[],
        granularity: string
    };

    private colorSchemeService: ColorSchemeService;

    private timelineChart: TimelineSelectorChart;
    private timelineData: TimelineData;

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, colorSchemeSrv: ColorSchemeService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dateField: this.injector.get('dateField', null),
            granularity: this.injector.get('granularity', 'day'),
        };
        this.colorSchemeService = colorSchemeSrv;
        this.filters = [];

        this.active = {
            dateField: new FieldMetaData(),
            granularity: 'day'
        };

        this.chartDefaults = {
            activeColor: 'rgba(57, 181, 74, 0.9)',
            inactiveColor: 'rgba(57, 181, 74, 0.3)'
        };

        this.timelineData = new TimelineData();
        this.timelineData.bucketizer = new DateBucketizer();
    }

    subNgOnInit() {
        this.timelineChart = new TimelineSelectorChart(this, this.svg, this.timelineData);
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

    addLocalFilter(key: string, startDate: Date, endDate: Date, local?: boolean) {
        this.filters.push({
            key: key,
            startDate: startDate,
            endDate: endDate,
            local: local
        });
    };

    onTimelineSelection(startDate: Date, endDate: Date): void {
        let filter = {
            key: this.active.dateField.columnName,
            startDate: startDate,
            endDate: endDate,
            local: true
        };

        this.filters.push(filter);
        this.addNeonFilter(false, filter);

        // Update the charts
        this.filterAndRefreshData();
    }

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: string) {
        for (let filter of this.filters) {
            // Only apply filters that aren't local
            if (!filter.local) {
                let filterClauses = [];
                filterClauses[0] = neon.query.where(fieldName, '>=', filter.startDate);
                let endDatePlusOne = filter.endDate.getTime() + DateBucketizer.MILLIS_IN_DAY;
                let endDatePlusOneDate = new Date(endDatePlusOne);
                filterClauses[1] = neon.query.where(fieldName, '<', endDatePlusOneDate);
                return neon.query.and.apply(neon.query, filterClauses);
            }
        }
        return null;
    };

    getFilterText(filter) {
        // I.E. TIMELINE - EARTHQUAKES: 8 AUG 2015 TO 20 DEC 2015
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let field = this.active.dateField.columnName;
        let text = database + ' - ' + table + ' - ' + field + ' = ';
        let date = filter.startDate;
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        date = filter.endDate;
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
        this.timelineChart.redrawChart();
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
            case 'minute':
                groupBys.push(new neon.query.GroupByFunctionClause('minute', dateField, 'minute'));
            /* falls through */
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
        // Convert all the dates into Date objects
        response.data.map((d) => {
            d.date = new Date(d.date);
        });

        this.queryData = {
            data: response.data,
            granularity: this.active.granularity
        };

        this.filterAndRefreshData();
    }

    /**
     * Filter the raw data and re-draw the chart
     */
    filterAndRefreshData() {
        let series: TimelineSeries = {
            color: this.chartDefaults.activeColor,
            name: 'Total',
            type: 'bar',
            options: {},
            data: [],
            focusData: [],
            startDate: null,
            endDate: null
        };

        // The query includes a sort, so it *should* be sorted.
        // Start date will be the first entry, and the end date will be the last
        series.startDate = this.queryData.data[0].date;
        let lastDate = this.queryData.data[this.queryData.data.length - 1].date;
        series.endDate = d3.time[this.active.granularity]
            .utc.offset(lastDate, 1);

        let filter = null;
        for (let curFilter of this.filters) {
            if (curFilter.local) {
                filter = curFilter;
                break;
            }
        }

        // If we have a bucketizer, use it
        if (this.timelineData.bucketizer) {
            this.timelineData.bucketizer.setStartDate(series.startDate);
            this.timelineData.bucketizer.setEndDate(series.endDate);

            let numBuckets = this.timelineData.bucketizer.getNumBuckets();
            for (let i = 0; i < numBuckets; i++) {
                let bucketDate = this.timelineData.bucketizer.getDateForBucket(i);
                series.data[i] = {
                    date: bucketDate,
                    value: 0
                };
            }

            for (let row of this.queryData.data) {
                // Check if this should be in the focus data
                // Focus data is not bucketized, just zeroed
                if (filter) {
                    if (filter.startDate <= row.date && filter.endDate >= row.date) {
                        series.focusData.push({
                            date: this.zeroDate(row.date),
                            value: row.value
                        });
                    }
                }

                let bucketIndex = this.timelineData.bucketizer.getBucketIndex(row.date);

                if (series.data[bucketIndex]) {
                    series.data[bucketIndex].value += row.value;
                }
            }
        } else {
            // No bucketizer, just add the data
            for (let row of this.queryData.data) {
                // Check if this should be in the focus data
                if (filter) {
                    if (filter.startDate <= row.date && filter.endDate >= row.date) {
                        series.focusData.push({
                            date: row.date,
                            value: row.value
                        });
                    }
                }

                series.data.push({
                    date: row.date,
                    value: row.value
                });
            }
        }

        // Make sure to update both the data and primary series
        this.timelineData.data = [series];
        this.timelineData.primarySeries = series;

        this.refreshVisualization();
    }

    @HostListener('window:resize')
    onResize() {
        _.debounce(() => {
            this.timelineChart.redrawChart();
        }, 500)();
    }

    /**
     * Zero out a date, if needed
     */
    zeroDate(date: Date) {
        if (this.timelineData.bucketizer && this.timelineData.granularity !== 'minute') {
            return this.timelineData.bucketizer.zeroOutDate(date);
        }
        return date;
    }

    handleChangeGranularity() {
        this.timelineData.focusGranularityDifferent = false;
        switch (this.active.granularity.toLowerCase()) {
            case 'minute':
                this.timelineData.focusGranularityDifferent = true;
                /* falls through */
            case 'hour':
                this.timelineData.bucketizer = new DateBucketizer();
                this.timelineData.bucketizer.setGranularity(DateBucketizer.HOUR);
                break;
            case 'day':
                this.timelineData.bucketizer = new DateBucketizer();
                break;
            case 'month':
                this.timelineData.bucketizer = new MonthBucketizer();
                break;
            case 'year':
                this.timelineData.bucketizer = new YearBucketizer();
                break;
            default:
                this.timelineData.bucketizer = null;
        }
        this.timelineData.granularity = this.active.granularity;
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
                // The data we want is in the whereClause's subclauses
                let whereClause = filter.filter.whereClause;
                if (whereClause && whereClause.whereClauses.length === 2) {
                    let key = whereClause.whereClauses[0].lhs;
                    let startDate = whereClause.whereClauses[0].rhs;
                    let endDate = whereClause.whereClauses[1].rhs;
                    this.addLocalFilter(key, startDate, endDate);
                }

            }
        } else {
            this.removeFilter();
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
        this.timelineChart.clearBrush();
    }
}
