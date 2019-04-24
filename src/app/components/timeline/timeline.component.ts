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

import {
    AbstractSearchService,
    AggregationType,
    NeonFilterClause,
    NeonQueryPayload,
    TimeInterval
} from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent, TransformedVisualizationData } from '../base-neon-component/base-neon.component';
import { Bucketizer } from '../bucketizers/Bucketizer';
import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { FieldMetaData } from '../../dataset';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { neonMappings } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import { TimelineSelectorChart, TimelineSeries, TimelineData, TimelineItem } from './TimelineSelectorChart';
import { YearBucketizer } from '../bucketizers/YearBucketizer';

import * as neon from 'neon-framework';
import * as _ from 'lodash';

declare let d3;

export class TransformedTimelineAggregationData extends TransformedVisualizationData {
    constructor(data: any[]) {
        super(data);
    }

    /**
     * Returns the sum of the value of each element in the data.
     *
     * @return {number}
     * @override
     */
    public count(): number {
        return this._data.reduce((sum, element) => sum + element.value, 0);
    }
}

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

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    public timelineChart: TimelineSelectorChart;

    // TODO THOR-985
    public timelineData: TimelineData = new TimelineData();

    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        protected widgetService: AbstractWidgetService
    ) {

        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref
        );

        console.warn('The timeline component is deprecated.  Please use the aggregation component with type=histogram.');
        this.redrawOnResize = true;
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('dateField', 'Date Field', true),
            new WidgetFieldOption('idField', 'Id Field', false),
            new WidgetFieldOption('filterField', 'Filter Field', false)
        ];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
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

    /**
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
        this.timelineData.focusGranularityDifferent = this.options.granularity.toLowerCase() === 'minute';
        this.timelineData.granularity = this.options.granularity;
        this.timelineData.bucketizer = this.getBucketizer();

        this.timelineChart = new TimelineSelectorChart(this, this.svg, this.timelineData);
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

    onTimelineSelection(startDate: Date, endDate: Date, selectedData: TimelineItem[]): void {
        let neonFilters = this.filterService.getFiltersByOwner(this.id);

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
            this.addNeonFilter(this.options, false, filter, this.createNeonFilter(filter));
        } else {
            this.replaceNeonFilter(this.options, false, filter, this.createNeonFilter(filter));
        }

        // Update the charts
        let activeData = this.getActiveData(this.options);
        this.filterAndRefreshData(activeData ? activeData.data : []);

        //Add additional filters
        if (this.options.filterField.columnName && selectedData && selectedData.length) {
            let selectedFilters: any[] = [];
            for (let data of selectedData) {
                selectedFilters = selectedFilters.concat(data.filters);
            }

            selectedFilters = selectedFilters.filter((value, index, array) => array.indexOf(value) === index);
                let setFilter = {
                    id: undefined,
                    field: this.options.filterField.columnName,
                    prettyField: this.options.filterField.prettyName,
                    value: selectedFilters
                };

                this.manageFieldFilters(setFilter, neonFilters, false);
        }
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

    /**
     * Creates and returns the neon filter clause object using the given arguments
     *
     * @arg {string} idField
     * @arg {array} idValues
     * @return {neon.query.WherePredicate}
     */
    createNeonFieldFilter(filterField: string, filterValues: string[]): neon.query.WherePredicate {
        let clauses = [];

        if (!filterValues.length) {
            clauses.push(neon.query.where(filterField, '=', ''));
        } else {
            for (let value of filterValues) {
                clauses.push(neon.query.where(filterField, '=', value));
            }
        }

        return neon.query.or.apply(neon.query, clauses);
    }

    /**
     * Creates or replaces neon filter with the given fields and values.
     *
     * @arg {object} filter
     * @arg {array} neonFilters
     * @arg {boolean} runQuery
     */
    manageFieldFilters(filter, neonFilters, runQuery) {
        let filterClause = this.createNeonFieldFilter(filter.field, filter.value);
        if (neonFilters && neonFilters.length) {
            let fieldFilter = neonFilters.find((f) => {
                let clauses = f.filter.whereClause.whereClauses ?
                    f.filter.whereClause.whereClauses[0] :
                    f.filter.whereClause;

                if (clauses && clauses.lhs === filter.field) {
                    return f;
                }
            });

            filter.id = fieldFilter.id;
            this.replaceNeonFilter(this.options, runQuery, filter, filterClause);
        } else {
            this.addNeonFilter(this.options, runQuery, filter, filterClause);
        }
    }

    getFilterText(filter) {

        if (filter.startDate) {
            let begin = (filter.startDate.getUTCMonth() + 1) + '/' + filter.startDate.getUTCDate() + '/' +
                filter.startDate.getUTCFullYear();
            let end = (filter.endDate.getUTCMonth() + 1) + '/' + filter.endDate.getUTCDate() + '/' + filter.endDate.getUTCFullYear();
            return filter.prettyField + ' from ' + begin + ' to ' + end;
        } else {
            return filter.prettyField + ' = ' + filter.value;
        }

    }

    /**
     * Initializes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Backwards compatibility (showOnlyFiltered deprecated due to its redundancy with hideUnfiltered).
        this.options.hideUnfiltered = this.injector.get('showOnlyFiltered', this.options.hideUnfiltered);
    }

    refreshVisualization() {
        this.timelineChart.redrawChart();
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.dateField.columnName);
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {NeonQueryPayload} queryPayload
     * @arg {NeonFilterClause[]} sharedFilters
     * @return {NeonQueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: NeonQueryPayload, sharedFilters: NeonFilterClause[]): NeonQueryPayload {
        let filter: NeonFilterClause = this.searchService.buildFilterClause(options.dateField.columnName, '!=', null);

        let groups = [];

        if (options.filterField.columnName) {
            groups.push(this.searchService.buildQueryGroup(options.filterField.columnName));
        }
        if (options.idField.columnName) {
            groups.push(this.searchService.buildQueryGroup(options.idField.columnName));
        }

        switch (options.granularity) {
            // Passthrough is intentional and expected!  falls through comments tell the linter that it is ok.
            case 'minute':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.MINUTE));
            /* falls through */
            case 'hour':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.HOUR));
            /* falls through */
            case 'day':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.DAY_OF_MONTH));
            /* falls through */
            case 'month':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.MONTH));
            /* falls through */
            case 'year':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.YEAR));
            /* falls through */
        }

        this.searchService.updateFilter(query, this.searchService.buildBoolFilterClause(sharedFilters.concat(filter)))
            .updateGroups(query, groups).updateAggregation(query, AggregationType.MIN, '_date', options.dateField.columnName)
            .updateSort(query, '_date').updateAggregation(query, AggregationType.COUNT, '_aggregation', '*');

        return query;
    }

    getFiltersToIgnore() {
        let ignoredFilterIds = [];
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.dateField.columnName]);

        for (let neonFilter of neonFilters) {
            // The data we want is in the whereClause's subclauses
            let whereClause = neonFilter.filter.whereClause;
            if (whereClause && whereClause.whereClauses && whereClause.whereClauses.length === 2) {
                ignoredFilterIds.push(neonFilter.id);
            }
        }

        return (ignoredFilterIds && ignoredFilterIds.length > 0 ? ignoredFilterIds : null);
    }

    /**
     * Transforms the given array of query results using the given options into the array of objects to be shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {TransformedVisualizationData}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): TransformedVisualizationData {
        // Convert all the dates into new Date objects

        let data: any[];

        if (options.idField.columnName && options.filterField.columnName) {
            data = results.reduce((itemBucket, currentItem) => {
                let previousItem = this.findDateInPreviousItem(itemBucket, currentItem);
                if (previousItem) {
                    if (previousItem.ids.indexOf(currentItem[options.idField.columnName]) === -1) {
                        previousItem.ids.push(currentItem[options.idField.columnName]);
                        previousItem.value++;
                    }

                    previousItem.filters = previousItem.filters.concat(currentItem[options.filterField.columnName])
                        .filter((value, index, array) => array.indexOf(value) === index);

                } else {
                    itemBucket.push({
                        value: 1,
                        ids: [currentItem[options.idField.columnName]],
                        filters: [currentItem[options.filterField.columnName]],
                        origDate: currentItem._date,
                        date: new Date(currentItem._date)
                    });
                }
                return itemBucket;

            }, []);
        } else {
            data = results.map((item) => {
                return {
                    value: item._aggregation,
                    date: new Date(item._date)
                };
            });
        }

        this.filterAndRefreshData(data);
        return new TransformedTimelineAggregationData(data);
    }

    /**
     * Finds if the current date exists in the previous date items based on the granularity option
     *
     * @arg {any[]} previous
     * @arg {any} current
     * @return {previousItem}
     */
    findDateInPreviousItem(previousItems: any[], current: any) {
        let prevItem: any = null;

        if (previousItems.length) {
            let currentDate = new Date(current._date),
                currentMonth = currentDate.getUTCMonth(),
                currentYear = currentDate.getUTCFullYear();

            switch (this.options.granularity) {
                case 'minute':
                    prevItem = previousItems.find((o) => {
                        let minDate = new Date(new Date(o.origDate).setUTCSeconds(0)),
                            maxDate = new Date(new Date(o.origDate).setUTCSeconds(59));
                        if (minDate <= currentDate && currentDate <= maxDate) {
                            return o;
                        }
                    });
                    break;
                case 'hour':
                    prevItem = previousItems.find((o) => {
                        let minDate = new Date(new Date(o.origDate).setUTCMinutes(0)),
                            maxDate = new Date(new Date(o.origDate).setUTCMinutes(59));
                        if (minDate <= currentDate && currentDate <= maxDate) {
                            return o;
                        }
                    });
                    break;
                case 'day':
                    prevItem = previousItems.find((o) => {
                        let minDate = new Date(new Date(o.origDate).setUTCHours(0)),
                            maxDate = new Date(new Date(o.origDate).setUTCHours(23));
                        if (minDate <= currentDate && currentDate <= maxDate) {
                            return o;
                        }
                    });
                    break;
                case 'month':
                    prevItem = previousItems.find((o) => {

                        let prevMonth = new Date(o.origDate).getUTCMonth(),
                            prevYear = new Date(o.origDate).getUTCFullYear();
                        if (prevMonth === currentMonth && prevYear === currentYear) {
                            return o;
                        }
                    });
                    break;
                case 'year':
                    prevItem = previousItems.find((o) => {
                        let prevYear = new Date(o.origDate).getUTCFullYear();
                        if (prevYear === currentYear) {
                            return o;
                        }
                    });
                    break;
            }
        }

        return prevItem;
    }

    /**
     * Filter the raw data and re-draw the chart
     */
    filterAndRefreshData(data: any[]) {
        let series: TimelineSeries = {
            color: this.widgetService.getThemeMainColorHex(),
            name: 'Total',
            type: 'bar',
            options: {},
            data: [],
            focusData: [],
            selectedData: [],
            startDate: null,
            endDate: null
        };

        if (data.length > 0) {
            // The query includes a sort, so it *should* be sorted.
            // Start date will be the first entry, and the end date will be the last
            series.startDate = data[0].date;
            let lastDate = data[data.length - 1].date;
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
                        value: 0,
                        filters: []
                    };
                }

                for (let row of data) {
                    // Check if this should be in the focus data
                    // Focus data is not bucketized, just zeroed
                    if (filter) {
                        if (filter.startDate <= row.date && filter.endDate >= row.date) {
                            series.focusData.push({
                                date: this.zeroDate(row.date),
                                value: row.value,
                                filters: this.options.filterField.columnName && row ? row.filters : []
                            });

                        }
                    }

                    let bucketIndex = this.timelineData.bucketizer.getBucketIndex(row.date);

                    if (series.data[bucketIndex]) {
                        series.data[bucketIndex].value = row.value;
                        series.data[bucketIndex].filters = row.filters;
                    }
                }
            } else {
                // No bucketizer, just add the data
                for (let row of data) {
                    // Check if this should be in the focus data
                    if (filter) {
                        if (filter.startDate <= row.date && filter.endDate >= row.date) {
                            series.focusData.push({
                                date: row.date,
                                value: row.value,
                                filters: this.options.filterField.columnName && row ? row.filters : []
                            });

                        }
                    }

                    series.data.push({
                        date: row.date,
                        value: row.value,
                        filters: this.options.filterField.columnName && row ? row.filters : []
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
        this.handleChangeData();
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
            if (whereClause && whereClause.length > 0 && whereClause.whereClauses.length === 2) {
                let field = this.options.findField(this.options.dateField, whereClause[0].lhs);
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
        let neonFilters = this.filterService.getFiltersByOwner(this.id);

        if (neonFilters.length) {
            for (let neonFilter of neonFilters) {
                this.removeLocalFilterFromLocalAndNeon(this.options, neonFilter, true, false);
            }
        }

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
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 3000;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Timeline';
    }

    protected clearVisualizationData(options: any): void {
        // TODO THOR-985 Temporary function.
        this.transformVisualizationQueryResults(options, []);
    }
}
