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
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, ElementRef,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { YearBucketizer } from '../bucketizers/YearBucketizer';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ChartComponent } from '../chart/chart.component';
import * as moment from 'moment-timezone';
import { VisualizationService } from '../../services/visualization.service';

class LocalFilter {
    constructor(public key: string, public startDate: Date, public endDate: Date, public id?: string) {}
}

@Component({
    selector: 'app-line-chart',
    templateUrl: './line-chart.component.html',
    styleUrls: ['./line-chart.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineChartComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {

    @ViewChild('myChart') chartModule: ChartComponent;
    @ViewChild('filterContainer') filterContainer: ElementRef;
    @ViewChild('chartContainer') chartContainer: ElementRef;

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dateField: string,
        groupField: string,
        aggregation: string,
        aggregationField: string,
        unsharedFilterField: Object,
        unsharedFilterValue: string,
        limit: number
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
        granularity: string,
        filter: LocalFilter
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
        options: any
    };
    private colorSchemeService: ColorSchemeService;
    private mouseEventValid: boolean;
    public colorByFields: string[] = [];
    public disabledList: string[] = [];
    public buttonText = '';

    private disabledDatasets: Map<string, any> = new Map<string, any>();

    public selectionOffset = {
        x: 0,
        y: 0
    };

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dateField: this.injector.get('dateField', null),
            groupField: this.injector.get('groupField', null),
            aggregation: this.injector.get('aggregation', null),
            aggregationField: this.injector.get('aggregationField', null),
            limit: this.injector.get('limit', 10000),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.colorSchemeService = colorSchemeSrv;

        this.active = {
            dateField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            groupField: new FieldMetaData(),
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            groupLimit: 10,
            filterable: true,
            layers: [],
            aggregation: 'count',
            dateBucketizer: null,
            granularity: 'day',
            filter: null
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

        this.mouseEventValid = false;
        this.onHover = this.onHover.bind(this);

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
            return this.chart.data.datasets[dsIndex].label + ' - ' + date.tz('GMT').format(format);
        };

        let tooltipDataFunc = (tooltips) => {
            return this.active.aggregation + ': ' + tooltips.yLabel;
        };

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
                  duration: 0 // general animation time
                },
                hover: {
                    mode: 'index',
                    intersect: false,
                    onHover: this.onHover

                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        position: 'bottom'
                    }]
                },
                tooltips: {
                    callbacks: {
                        title: tooltipTitleFunc.bind(this),
                        label: tooltipDataFunc.bind(this)
                    }
                }
            }
        };

        this.queryTitle = 'Line Chart';
    }

    /**
     * Returns the chart in the chart module.
     *
     * @return {object}
     * @private
     */
    private getChart() {
        /* tslint:disable:no-string-literal */
        return this.chartModule['chart'];
        /* tslint:enable:no-string-literal */
    }

    subNgOnInit() {
        this.chart.type = 'line';
    }

    postInit() {
        // Do nothing.  An on change unfortunately kicks off the initial query.
        this.logChangeAndStartQueryChain();

        this.selectionOffset.y = this.filterContainer.nativeElement.scrollHeight;
        this.selectionOffset.x = Number.parseInt(this.getComputedStyle(this.chartContainer.nativeElement).paddingLeft || '0');
    }

    subNgOnDestroy() {
        this.getChart().destroy();
        this.chart.data = {
            labels: [],
            datasets: []
        };
        this.chart.options = {};
    }

    getExportFields() {
        let valuePrettyName = this.active.aggregation +
            (this.active.aggregationFieldHidden ? '' : '-' + this.active.aggregationField.prettyName);
        valuePrettyName = valuePrettyName.charAt(0).toUpperCase() + valuePrettyName.slice(1);
        let fields = [{
                columnName: this.active.groupField.columnName,
                prettyName: this.active.groupField.prettyName
            }, {
                columnName: 'value',
                prettyName: valuePrettyName
        }];
        switch (this.active.granularity) {
            case 'hour':
                fields.push({
                    columnName: 'hour',
                    prettyName: 'Hour'
                });
                /* falls through */
            case 'day':
                fields.push({
                    columnName: 'day',
                    prettyName: 'Day'
                });
                /* falls through */
            case 'month':
                fields.push({
                    columnName: 'month',
                    prettyName: 'Month'
                });
                /* falls through */
            case 'year':
                fields.push({
                    columnName: 'year',
                    prettyName: 'Year'
                });
                /* falls through */
        }
        return fields;
    }

    subGetBindings(bindings: any) {
        bindings.dateField = this.active.dateField.columnName;
        bindings.groupField = this.active.groupField.columnName;
        bindings.aggregation = this.active.aggregation;
        bindings.aggregationField = this.active.aggregationField.columnName;
        bindings.limit = this.active.limit;
    }

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    onUpdateFields() {
        if (this.optionsFromConfig.aggregation) {
            this.active.aggregation = this.optionsFromConfig.aggregation;
        }
        this.active.aggregationField = this.findFieldObject('aggregationField', neonMappings.TAGS);
        this.active.dateField = this.findFieldObject('dateField', neonMappings.TAGS);
        this.active.groupField = this.findFieldObject('groupField', neonMappings.TAGS);
        this.active = Object.assign({}, this.active);
    }

    legendItemSelected(data: any): void {
        let key = data.value;

        // Chartjs only seem to update if the entire data object was changed
        // Create a copy of the data object to set at the end
        let chartData = {
            labels: this.chart.data.labels,
            datasets: this.chart.data.datasets
        };

        if (data.currentlyActive) {
            let updatedDatasets = [];
            // Search for the dataset and move it to the disabled map
            for (let dataset of chartData.datasets) {
                if (dataset.label === key) {
                    this.disabledDatasets.set(key, dataset);
                } else {
                    updatedDatasets.push(dataset);
                }
            }
            // Put something in the disabled dataset map, so the value will be marked as disabled
            if (!this.disabledDatasets.get(key)) {
                this.disabledDatasets.set(key, null);
            }
            chartData.datasets = updatedDatasets;
        } else {
            // Check the disabled map and move it back to the normal data
            let dataset = this.disabledDatasets.get(key);
            if (dataset) {
                chartData.datasets.push(dataset);
            }
            // Make sure to remove the key from the map
            this.disabledDatasets.delete(key);
        }

        // Update the display
        this.chart.data = chartData;
        this.refreshVisualization();
        this.disabledList = Array.from(this.disabledDatasets.keys());
    }

    /**
     * returns -1 if cannot be found
     */
    getPointXLocationByIndex(chart, index): number {
        let dsMeta = chart.controller.getDatasetMeta(0);
        if (dsMeta.data.length > index) {
            return dsMeta.data[index].getCenterPoint().x;
        }
        return -1;
    }

    mouseLeave(event) {
        this.mouseEventValid = false;
        this.selection.mouseDown = false;
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
    }

    mouseDown(event) {
        if (event.buttons > 0) {
            this.mouseEventValid = true;
        }
    }

    mouseUp() {
        // Do nothing.
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
            let endX = -1;
            let startX = -1;
            if (startIndex > endIndex) {
                let temp = startIndex;
                startIndex = endIndex;
                endIndex = temp;
            }
            // at this point, start Index is <= end index
            if (startIndex === 0) {
                // first element, so don't go off the chart
                startX = this.getPointXLocationByIndex(items[0]._chart, startIndex);
            } else {
                let a = this.getPointXLocationByIndex(items[0]._chart, startIndex - 1);
                let b = this.getPointXLocationByIndex(items[0]._chart, startIndex);
                startX = (b - a) / 2 + a;
            }

            if (endIndex >= this.chart.data.labels.length - 1) {
                // last element, so don't go off the chart
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
        }
        if (isMouseUp) {
            // The button was clicked, handle the selection.
            let start = this.active.dateBucketizer.getDateForBucket(this.selection.startIndex),
                end = this.active.dateBucketizer.getDateForBucket(this.selection.endIndex),
                invert = start > end;
            this.selection.startDate = invert ? end : start;
            this.selection.endDate = invert ? start : end;
            let key = this.active.dateField.columnName;
            let f = new LocalFilter(key, this.selection.startDate, this.selection.endDate);
            if (this.active.filter) {
                f.id = this.active.filter.id;
                this.replaceNeonFilter(true, f);
            } else {
                this.addNeonFilter(true, f);
            }
            redraw = true;
        }

        this.stopEventPropagation(event);
        if (redraw) {
            this.changeDetection.detectChanges();
        }
    }

    createNeonFilterClauseEquals(database: string, table: string, fieldName: string | string[]) {
        if (typeof fieldName === 'string') {
            let filterClauses = [];
            filterClauses[0] = neon.query.where(fieldName, '>=', this.selection.startDate);
            let endDatePlusOne = this.selection.endDate.getTime() + this.active.dateBucketizer.getMillisMultiplier();
            let endDatePlusOneDate = new Date(endDatePlusOne);
            filterClauses[1] = neon.query.where(fieldName, '<', endDatePlusOneDate);
            return neon.query.and.apply(neon.query, filterClauses);
        } else {
            return null;
        }
    }

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
        return [this.active.dateField.columnName];
    }

    getVisualizationName() {
        return 'Line Chart';
    }

    refreshVisualization() {
        this.getChart().update();
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
        query = query.aggregate(neonVariables.MIN, dateField, 'date');
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
        groupBys.push(groupField);
        query = query.groupBy(groupBys);
        // we assume sorted by date later to get min and max date!
        query = query.sortBy('date', neonVariables.ASCENDING);
        query = query.where(whereClause);
        query = query.limit(this.active.limit);
        switch (this.active.aggregation) {
            case 'count':
                return query.aggregate(neonVariables.COUNT, '*', 'value');
            case 'sum':
                return query.aggregate(neonVariables.SUM, yAxisField, 'value');
            case 'average':
                return query.aggregate(neonVariables.AVG, yAxisField, 'value');
            case 'min':
                return query.aggregate(neonVariables.MIN, yAxisField, 'value');
            case 'max':
                return query.aggregate(neonVariables.MAX, yAxisField, 'value');
        }

    }

    getColorFromScheme(name): string {
        return this.colorSchemeService.getColorFor(this.active.groupField.columnName, name).toRgb();
    }

    getFiltersToIgnore() {
        return null;
    }

    onQuerySuccess(response) {
        this.disabledDatasets.clear();
        this.disabledList = [];

        // need to reset chart when data potentially changes type (or number of datasets)
        let tmpLimit = this.active.groupLimit;
        let dataSetField = this.active.groupField.columnName;
        let myData = {};
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

        let datasets = [], // TODO type to chartjs
            labels = this.chart.data.labels || []; // maintain previous labels in case no data was returned

        if (response.data.length > 0) {
            delete this.buttonText;

            let bucketizer = this.active.dateBucketizer;
            bucketizer.setStartDate(new Date(response.data[0].date));
            bucketizer.setEndDate(new Date(response.data[response.data.length - 1].date));

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
                }
            }
            let datasetIndex = 0;

            for (let datasetName in myData) {
                if (myData.hasOwnProperty(datasetName)) {
                    let colorString = this.getColorFromScheme(datasetName);
                    let d = {
                        label: datasetName,
                        data: myData[datasetName],
                        borderColor: colorString,
                        pointBorderColor: colorString,
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
            labels = new Array(length);
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
            }
        } else {
            this.buttonText = 'No Data';
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
                title = 'Average';
                break;
            case 'sum':
                title = 'Sum';
                break;
            case 'min':
                title = 'Minimum';
                break;
            case 'max':
                title = 'Maximum';
                break;
        }
        if (this.active.groupField && this.active.groupField.prettyName) {
            title += ' by ' + this.active.groupField.prettyName;
        }
        this.queryTitle = title;
        this.updateLegend();

        // THOR-252: only way to know if filter was applied is to wait for querySuccess. See #onHover
        this.setupFilters();
    }

    updateLegend() {
        this.colorByFields = [this.active.groupField.columnName];
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

    setupFilters() {
        let localFilters = [],
            filters = this.filterService.getFiltersForFields(
                this.meta.database.name,
                this.meta.table.name,
                [this.active.dateField.columnName]
            );
        for (let filter of filters) {
            let whereClause = filter.filter.whereClause;
            if (whereClause && whereClause.whereClauses.length === 2) {
                localFilters.push(
                    new LocalFilter(
                        whereClause.whereClauses[0].lhs,
                        whereClause.whereClauses[0].rhs,
                        whereClause.whereClauses[1].rhs,
                        filter.id
                    )
                );
            }
        }
        this.active.filter = localFilters.length ? localFilters[0] : null;
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeDateField() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeGroupField() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeAggregationField() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain();
    }

    logChangeAndStartQueryChain() {
        if (!this.initializing) {
            this.executeQueryChain();
        }
    }

    getFilterTitle(filter: LocalFilter) {
        return filter.startDate + ' >= ' + this.active.dateField.columnName + ' < ' + filter.endDate;
    }

    getFilterCloseText(value: string) {
        return value;
    }

    getRemoveFilterTooltip(filter: LocalFilter) {
        return 'Delete Filter ' + this.getFilterTitle(filter);
    }

    removeFilter() {
        this.setupFilters();
    }
}
