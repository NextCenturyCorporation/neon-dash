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
/// <reference path="../../../../node_modules/@types/d3/index.d.ts" />
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
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
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { Bucketizer } from '../bucketizers/Bucketizer';
import { StackedTimelineSelectorChart, TimelineSeries, TimelineData } from './stacked-timelineSelectorChart';
import { YearBucketizer } from '../bucketizers/YearBucketizer';
import { VisualizationService } from '../../services/visualization.service';

declare let d3;

@Component({
    selector: 'app-timeline',
    templateUrl: './stacked-timeline.component.html',
    styleUrls: ['./stacked-timeline.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackedTimelineComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('svg') svg: ElementRef;

    private filters: {
        id: string,
        field: string,
        prettyField: string,
        startDate: Date,
        endDate: Date,
        local: boolean
    }[];

    public active: {
        dateField: FieldMetaData,
        data: {
            value: number,
            date: Date,
            groupField: string
        }[],
        granularity: string,
        groupField: FieldMetaData,
        ylabel: string,
        docCount: number
    };

    private colorSchemeService: ColorSchemeService;
    private timelineChart: StackedTimelineSelectorChart;
    private timelineData: TimelineData;
    private defaultActiveColor;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);

        this.colorSchemeService = colorSchemeSrv;
        this.filters = [];

        this.active = {
            dateField: new FieldMetaData(),
            data: [],
            granularity: this.injector.get('granularity', 'day'),
            groupField: new FieldMetaData(),
            ylabel: 'Count',
            docCount: 0
        };

        this.timelineData = new TimelineData();
        this.timelineData.focusGranularityDifferent = this.active.granularity.toLowerCase() === 'minute';
        this.timelineData.granularity = this.active.granularity;
        this.timelineData.bucketizer = this.getBucketizer();
        this.enableRedrawAfterResize(true);
    }

    subNgOnInit() {
        this.timelineChart = new StackedTimelineSelectorChart(this, this.svg, this.timelineData);
    }

    postInit() {
        this.executeQueryChain();

        this.defaultActiveColor = this.getPrimaryThemeColor();
    }

    subNgOnDestroy() {
        // Do nothing.
    }

    getExportFields() {
        let fields = [{
            columnName: 'value',
            prettyName: 'Count'
        }];
        switch (this.active.granularity) {
            case 'minute':
                fields.push({
                    columnName: 'minute',
                    prettyName: 'Minute'
                });
                /* falls through */
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

    onUpdateFields() {
        this.active.dateField = this.findFieldObject('dateField', neonMappings.DATE);
        this.active.groupField = this.findFieldObject('groupField');
    }

    addLocalFilter(id: string, field: string, prettyField: string, startDate: Date, endDate: Date, local?: boolean) {
        this.filters[0] = {
            id: id,
            field: field,
            prettyField: prettyField,
            startDate: startDate,
            endDate: endDate,
            local: local
        };
    }

    onTimelineSelection(startDate: Date, endDate: Date): void {
        let filter = {
            id: undefined,
            field: this.active.dateField.columnName,
            prettyField: this.active.dateField.prettyName,
            startDate: startDate,
            endDate: endDate,
            local: true
        };
        if (this.filters.length > 0) {
            filter.id = this.filters[0].id;
        }
        this.filters[0] = filter;
        if (filter.id === undefined) {
            this.addNeonFilter(false, filter, this.createNeonFilter(filter));
        } else {
            this.replaceNeonFilter(false, filter, this.createNeonFilter(filter));
        }

        // Update the charts
        this.filterAndRefreshData();
    }

    /**
     * Creates and returns the neon filter object using the given timeline filter object.
     *
     * @arg {object} filter
     * @return {neon.query.WherePredicate}
     * @override
     */
    createNeonFilter(filter: any): neon.query.WherePredicate {
        let filterClauses = [
            neon.query.where(filter.field, '>=', filter.startDate),
            neon.query.where(filter.field, '<', filter.endDate)
        ];
        return neon.query.and.apply(neon.query, filterClauses);
    }

    getFilterText(filter) {
        let begin = (filter.startDate.getUTCMonth() + 1) + '/' + filter.startDate.getUTCDate() + '/' + filter.startDate.getUTCFullYear();
        let end = (filter.endDate.getUTCMonth() + 1) + '/' + filter.endDate.getUTCDate() + '/' + filter.endDate.getUTCFullYear();
        return filter.prettyField + ' from ' + begin + ' to ' + end;
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

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clause = neon.query.where(this.active.dateField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause, neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }

        return clause;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = this.createClause();
        let dateField = this.active.dateField.columnName;
        query = query.aggregate(neonVariables.MIN, dateField, 'date');
        let groupBys: any[] = [];
        switch (this.active.granularity) {
            // Passthrough is intentional and expected!  falls through comments tell the linter that it is ok.
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
        query = query.sortBy('date', neonVariables.ASCENDING);
        query = query.where(whereClause);
        // Add the unshared filter field, if it exists
        if (this.hasUnsharedFilter()) {
           query.where(neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }
        return query.aggregate(neonVariables.COUNT, '*', 'value');
    }

    getDocCount() {
        let countQuery = new neon.query.Query().selectFrom(this.meta.database.name, this.meta.table.name).where(this.createClause())
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
    }

    getFiltersToIgnore() {
        let ignoredFilterIds = [];
        let neonFilters = this.filterService.getFiltersForFields(this.meta.database.name, this.meta.table.name,
            [this.active.dateField.columnName]);

        if (neonFilters && neonFilters.length > 0) {
            for (let neonFilter of neonFilters) {
                // The data we want is in the whereClause's subclauses
                let whereClause = neonFilter.filter.whereClause;
                if (whereClause && whereClause.whereClauses.length === 2) {
                    ignoredFilterIds.push(neonFilter.id);
                }
            }
        }

        return (ignoredFilterIds.length > 0 ? ignoredFilterIds : null);
    }

    onQuerySuccess(response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.active.docCount = response.data[0]._docCount;
        } else {
            // Convert all the dates into Date objects
            response.data.map((d) => {
                d.date = new Date(d.date);
            });

            this.active.data = response.data;
            this.filterAndRefreshData();
            this.getDocCount();
        }
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        let shownCount = (this.active.data || []).reduce((sum, element) => {
            return sum + element.value;
        }, 0);
        if (!shownCount) {
            return 'No Data';
        }
        if (this.active.docCount <= shownCount) {
            return 'Total ' + super.prettifyInteger(shownCount);
        }
        return super.prettifyInteger(shownCount) + ' of ' + super.prettifyInteger(this.active.docCount);
    }

    /**
     * Filter the raw data and re-draw the chart
     */
    filterAndRefreshData() {
        let series: TimelineSeries = {
            color: this.defaultActiveColor,
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
        series.startDate = this.active.data[0].date;
        let lastDate = this.active.data[this.active.data.length - 1].date;
        series.endDate = d3.time[this.active.granularity]
            .utc.offset(lastDate, 1);

        let filter = null;
        if (this.filters.length > 0) {
            filter = this.filters[0];
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
                    value: 0,
                    groupField: this.active.groupField
                };
            }

            for (let row of this.active.data) {
                // Check if this should be in the focus data
                // Focus data is not bucketized, just zeroed
                if (filter) {
                    if (filter.startDate <= row.date && filter.endDate >= row.date) {
                        series.focusData.push({
                            date: this.zeroDate(row.date),
                            value: row.value,
                            groupField: this.active.groupField
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
            for (let row of this.active.data) {
                // Check if this should be in the focus data
                if (filter) {
                    if (filter.startDate <= row.date && filter.endDate >= row.date) {
                        series.focusData.push({
                            date: row.date,
                            value: row.value,
                            groupField: this.active.groupField
                        });
                    }
                }

                series.data.push({
                    date: row.date,
                    value: row.value,
                    groupField: this.active.groupField
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
        this.timelineData.focusGranularityDifferent = this.active.granularity.toLowerCase() === 'minute';
        this.timelineData.bucketizer = this.getBucketizer();
        this.timelineData.granularity = this.active.granularity;
        this.logChangeAndStartQueryChain();
    }

    getBucketizer() {
        switch (this.active.granularity.toLowerCase()) {
            case 'minute':
            case 'hour':
            let bucketizer = new DateBucketizer();
                bucketizer.setGranularity(DateBucketizer.HOUR);
                return bucketizer;
            case 'day':
                return new DateBucketizer();
            case 'month':
                return new MonthBucketizer();
            case 'year':
                return new YearBucketizer();
            default:
                return null;
        }
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let neonFilters = this.filterService.getFiltersForFields(this.meta.database.name, this.meta.table.name,
            [this.active.dateField.columnName]);

        for (let neonFilter of neonFilters) {
            // The data we want is in the whereClause's subclauses
            let whereClause = neonFilter.filter.whereClause;
            if (whereClause && whereClause.whereClauses.length === 2) {
                let field = this.findField(this.meta.fields, neonFilter.filter.whereClause[0].lhs);
                this.addLocalFilter(neonFilter.id, field.columnName, field.prettyName, whereClause.whereClauses[0].rhs,
                    whereClause.whereClauses[1].rhs);
            }

        }

        if (!neonFilters.length) {
            this.removeFilter();
        }
    }

    subGetBindings(bindings: any) {
        bindings.dateField = this.active.dateField.columnName;
        bindings.granularity = this.active.granularity;
        bindings.groupField = this.active.groupField.columnName;
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters() {
        return this.filters;
    }

    removeFilter() {
        this.filters = [];
        this.timelineChart.clearBrush();
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    }
}
