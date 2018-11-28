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

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { Bucketizer } from '../bucketizers/Bucketizer';
import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { FieldMetaData } from '../../dataset';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import { TimelineSelectorChart, TimelineSeries, TimelineData } from './TimelineSelectorChart';
import { YearBucketizer } from '../bucketizers/YearBucketizer';

import * as neon from 'neon-framework';
import * as _ from 'lodash';

declare let d3;

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('svg') svg: ElementRef;

    public filters: {
        id: string,
        field: string,
        prettyField: string,
        startDate: Date,
        endDate: Date,
        local: boolean
    }[] = [];

    public activeData: {
        value: number,
        date: Date
    }[] = [];
    public docCount: number = 0;

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    public defaultActiveColor;
    public timelineChart: TimelineSelectorChart;
    public timelineData: TimelineData = new TimelineData();

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );

        console.warn('The timeline component is deprecated.  Please use the aggregation component with type=histogram.');

        this.timelineData.focusGranularityDifferent = this.options.granularity.toLowerCase() === 'minute';
        this.timelineData.granularity = this.options.granularity;
        this.timelineData.bucketizer = this.getBucketizer();
        this.enableRedrawAfterResize(true);
    }

    /**
     * Creates and returns an array of field options for the unique widget.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('dateField', 'Date Field', true)
        ];
    }

    /**
     * Creates and returns an array of non-field options for the unique widget.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('granularity', 'Date Granularity', 'year', OptionChoices.DateGranularity),
            new WidgetFreeTextOption('yLabel', 'Count', '')
        ];
    }

    subNgOnInit() {
        this.timelineChart = new TimelineSelectorChart(this, this.svg, this.timelineData);
    }

    postInit() {
        this.executeQueryChain();

        this.defaultActiveColor = this.getPrimaryThemeColor();
    }

    subNgOnDestroy() {
        // Do nothing.
    }

    addLocalFilter(id: string, field: string, prettyField: string, startDate: Date, endDate: Date, local?: boolean) {
        try {
            this.filters[0] = {
                id: id,
                field: field,
                prettyField: prettyField,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                local: local
            };
        } catch (e) {
            // Ignore potential date format errors
        }
    }

    onTimelineSelection(startDate: Date, endDate: Date): void {
        let filter = {
            id: undefined,
            field: this.options.dateField.columnName,
            prettyField: this.options.dateField.prettyName,
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

    refreshVisualization() {
        this.timelineChart.redrawChart();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.options.database && this.options.database.name && valid);
        valid = (this.options.table && this.options.table.name && valid);
        valid = (this.options.dateField && this.options.dateField.columnName && valid);
        return valid;
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clause = neon.query.where(this.options.dateField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause, neon.query.where(this.options.unsharedFilterField.columnName, '=',
                this.options.unsharedFilterValue));
        }

        return clause;
    }

    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);
        let whereClause = this.createClause();
        let dateField = this.options.dateField.columnName;
        query = query.aggregate(neonVariables.MIN, dateField, 'date');
        let groupBys: any[] = [];
        switch (this.options.granularity) {
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
        return query.aggregate(neonVariables.COUNT, '*', 'value');
    }

    getDocCount() {
        if (!this.cannotExecuteQuery()) {
            let countQuery = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name)
                .where(this.createClause()).aggregate(neonVariables.COUNT, '*', '_docCount');
            this.executeQuery(countQuery);
        }
    }

    getFiltersToIgnore() {
        let ignoredFilterIds = [];
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.dateField.columnName]);

        for (let neonFilter of neonFilters) {
            // The data we want is in the whereClause's subclauses
            let whereClause = neonFilter.filter.whereClause;
            if (whereClause && whereClause.whereClauses.length === 2) {
                ignoredFilterIds.push(neonFilter.id);
            }
        }

        return (ignoredFilterIds.length > 0 ? ignoredFilterIds : null);
    }

    onQuerySuccess(response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.docCount = response.data[0]._docCount;
        } else {
            // Convert all the dates into Date objects
            this.activeData = response.data.map((item) => {
                item.date = new Date(item.date);
                return item;
            });

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
        let shownCount = (this.activeData || []).reduce((sum, element) => {
            return sum + element.value;
        }, 0);
        if (!shownCount) {
            return 'No Data';
        }
        if (this.docCount <= shownCount) {
            return 'Total ' + super.prettifyInteger(shownCount);
        }
        return super.prettifyInteger(shownCount) + ' of ' + super.prettifyInteger(this.docCount);
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

        if (this.activeData.length > 0) {
            // The query includes a sort, so it *should* be sorted.
            // Start date will be the first entry, and the end date will be the last
            series.startDate = this.activeData[0].date;
            let lastDate = this.activeData[this.activeData.length - 1].date;
            series.endDate = d3.time[this.options.granularity]
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
                        value: 0
                    };
                }

                for (let row of this.activeData) {
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
                for (let row of this.activeData) {
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

            // Commenting this out fixes the issue of focus selections being truncated by one.
            /*if (series.focusData && series.focusData.length > 0) {
                let extentStart = series.focusData[0].date;
                let extentEnd = series.focusData[series.focusData.length].date;
                this.timelineData.extent = [extentStart, extentEnd];
            }*/
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
        this.timelineData.focusGranularityDifferent = this.options.granularity.toLowerCase() === 'minute';
        this.timelineData.bucketizer = this.getBucketizer();
        this.timelineData.granularity = this.options.granularity;
        this.logChangeAndStartQueryChain();
    }

    getBucketizer() {
        switch (this.options.granularity.toLowerCase()) {
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
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.dateField.columnName]);

        for (let neonFilter of neonFilters) {
            // The data we want is in the whereClause's subclauses
            let whereClause = neonFilter.filter.whereClause;
            if (whereClause && whereClause.whereClauses.length === 2) {
                let field = this.options.findField(neonFilter.filter.whereClause[0].lhs);
                this.addLocalFilter(neonFilter.id, field.columnName, field.prettyName, whereClause.whereClauses[0].rhs,
                    whereClause.whereClauses[1].rhs);
            }

        }

        if (!neonFilters.length) {
            this.removeFilter();
        }
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
        if (this.timelineChart) {
            this.timelineChart.clearBrush();
        }
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

    /**
     * Returns the list of fields to export.
     *
     * @return {{ columnName: string, prettyName: string }[]}
     * @override
     */
    getExportFields() {
        let exportFields = [{
            columnName: 'value',
            prettyName: 'Count'
        }];
        switch (this.options.granularity) {
            case 'minute':
                exportFields.push({
                    columnName: 'minute',
                    prettyName: 'Minute'
                });
                /* falls through */
            case 'hour':
                exportFields.push({
                    columnName: 'hour',
                    prettyName: 'Hour'
                });
                /* falls through */
            case 'day':
                exportFields.push({
                    columnName: 'day',
                    prettyName: 'Day'
                });
                /* falls through */
            case 'month':
                exportFields.push({
                    columnName: 'month',
                    prettyName: 'Month'
                });
                /* falls through */
            case 'year':
                exportFields.push({
                    columnName: 'year',
                    prettyName: 'Year'
                });
                /* falls through */
        }
        return exportFields;
    }

    /**
     * Returns the default limit for the unique widget.
     *
     * @return {string}
     * @override
     */
    getWidgetDefaultLimit(): number {
        return 10;
    }

    /**
     * Returns the name for the unique widget.
     *
     * @return {string}
     * @override
     */
    getWidgetName(): string {
        return 'Timeline';
    }
}
