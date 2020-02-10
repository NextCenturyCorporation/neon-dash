/**
 * Copyright 2019 Next Century Corporation
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
 */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';

import {
    AbstractFilter,
    AbstractFilterDesign,
    AbstractSearchService,
    AggregationType,
    CompoundFilterType,
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOption,
    ConfigOptionSelect,
    CoreUtil,
    DomainFilter,
    DomainFilterDesign,
    DomainValues,
    FieldConfig,
    FieldKey,
    FilterClause,
    FilterCollection,
    ListFilterDesign,
    OptionChoices,
    SearchObject,
    TimeInterval
} from '@caci-critical-insight-solutions/nucleus-core';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { TimelineSelectorChart, TimelineSeries, TimelineData, TimelineItem } from './TimelineSelectorChart';
import { YearBucketizer } from '../bucketizers/YearBucketizer';

import * as _ from 'lodash';
import { MatDialog } from '@angular/material';

import * as d3 from 'd3';

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;

    @ViewChild('svg', { static: true }) svg: ElementRef;

    protected selected: Date[] = null;

    private chartDefaults: {
        activeColor: string;
        inactiveColor: string;
    };

    public timelineChart: TimelineSelectorChart;

    public timelineData: TimelineData = new TimelineData();

    // TODO THOR-1137 Save in timelineData
    public timelineQueryResults: { value: number, date: Date }[] = null;

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        ref: ChangeDetectorRef,
        protected colorThemeService: InjectableColorThemeService,
        dialog: MatDialog,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            ref,
            dialog
        );

        // Console.warn('The timeline component is deprecated.  Please use the aggregation component with type=histogram.');
        this.redrawOnResize = true;
    }

    private createFilterDesignOnValues(field: FieldConfig, values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.OR, this.options.datastore.name + '.' + this.options.database.name + '.' +
            this.options.table.name + '.' + field.columnName, '=', values);
    }

    private createFilterDesignOnTimeline(begin?: Date, end?: Date): DomainFilterDesign {
        return new DomainFilterDesign(this.options.datastore.name + '.' + this.options.database.name + '.' + this.options.table.name +
            '.' + this.options.dateField.columnName, begin, end);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('dateField', 'Date Field', true),
            new ConfigOptionField('idField', 'Id Field', false),
            new ConfigOptionField('filterField', 'Filter Field', false),
            new ConfigOptionSelect('granularity', 'Date Granularity', true, TimeInterval.YEAR, OptionChoices.DateGranularity),
            new ConfigOptionFreeText('yLabel', 'Count', false, '')
        ];
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {AbstractFilterDesign[]}
     * @override
     */
    protected designEachFilterWithNoValues(): AbstractFilterDesign[] {
        let designs: AbstractFilterDesign[] = [];

        if (this.options.dateField.columnName) {
            // Match a compound AND filter with one ">=" date filter and one "<=" date filter.
            designs.push(this.createFilterDesignOnTimeline());
        }

        if (this.options.filterField.columnName) {
            designs.push(this.createFilterDesignOnValues(this.options.filterField));
        }

        return designs;
    }

    /**
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
        this.timelineData.focusGranularityDifferent = this.options.granularity === TimeInterval.MINUTE;
        this.timelineData.granularity = this.options.granularity === TimeInterval.DAY_OF_MONTH ? 'day' : this.options.granularity;
        this.timelineData.bucketizer = this.getBucketizer();

        this.timelineChart = new TimelineSelectorChart(this, this.svg, this.timelineData);
    }

    onTimelineSelection(beginDate: Date, endDate: Date, selectedData: TimelineItem[]): void {
        let filters: AbstractFilterDesign[] = [this.createFilterDesignOnTimeline(beginDate, endDate)];

        this.selected = [beginDate, endDate];

        if (this.options.filterField.columnName) {
            let filterValues: any[] = CoreUtil.flatten((selectedData || []).map((selectedItem) => selectedItem.filters)).filter(
                (value, index, array) => array.indexOf(value) === index
            );

            if (!filterValues.length) {
                // TODO NEON-36 The "filterField equals empty string" behavior may not work as expected with every dataset.
                filterValues = [''];
            }

            // Create a separate filter on each value because each value is a distinct item in the data (they've been aggregated together).
            filters = filters.concat(this.createFilterDesignOnValues(this.options.filterField, filterValues));
        }

        this.exchangeFilters(filters);

        this.filterAndRefreshData(this.timelineQueryResults);
    }

    /**
     * Initializes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Backwards compatibility (showOnlyFiltered deprecated due to its redundancy with hideUnfiltered).
        if (typeof this.options.showOnlyFiltered !== 'undefined') {
            this.options.hideUnfiltered = this.options.showOnlyFiltered;
        }
    }

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        // Add or remove the timeline chart brush depending on if the timeline is filtered.
        let timelineFilters: AbstractFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnTimeline());
        if (timelineFilters.length) {
            // TODO THOR-1105 How should we handle multiple filters?  Should we draw multiple brushes?
            for (const timelineFilter of timelineFilters) {
                let domain: DomainValues = (timelineFilter as DomainFilter).retrieveValues();
                this.selected = [domain.begin as Date, domain.end as Date];
                // TODO THOR-1106 Update the brush element in the timelineChart.
            }
        } else {
            this.selected = null;
            this.timelineChart.clearBrush();
        }
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
     * @arg {SearchObject} SearchObject
     * @arg {FilterClause[]} filters
     * @return {SearchObject}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: SearchObject, filters: FilterClause[]): SearchObject {
        let filter: FilterClause = this.searchService.createFilterClause({
            datastore: options.datastore.name,
            database: options.database.name,
            table: options.table.name,
            field: options.dateField.columnName
        } as FieldKey, '!=', null);

        if (options.filterField.columnName) {
            this.searchService.withGroup(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.filterField.columnName
            } as FieldKey);

            if (options.idField.columnName) {
                this.searchService.withGroup(query, {
                    datastore: options.datastore.name,
                    database: options.database.name,
                    table: options.table.name,
                    field: options.idField.columnName
                } as FieldKey);
            }
        }

        switch (options.granularity) {
            // Passthrough is intentional and expected!  falls through comments tell the linter that it is ok.
            case TimeInterval.SECOND:
                this.searchService.withGroupByDate(query, {
                    datastore: options.datastore.name,
                    database: options.database.name,
                    table: options.table.name,
                    field: options.dateField.columnName
                } as FieldKey, TimeInterval.SECOND, '_' + TimeInterval.SECOND);
            // Falls through
            case TimeInterval.MINUTE:
                this.searchService.withGroupByDate(query, {
                    datastore: options.datastore.name,
                    database: options.database.name,
                    table: options.table.name,
                    field: options.dateField.columnName
                } as FieldKey, TimeInterval.MINUTE, '_' + TimeInterval.MINUTE);
            // Falls through
            case TimeInterval.HOUR:
                this.searchService.withGroupByDate(query, {
                    datastore: options.datastore.name,
                    database: options.database.name,
                    table: options.table.name,
                    field: options.dateField.columnName
                } as FieldKey, TimeInterval.HOUR, '_' + TimeInterval.HOUR);
            // Falls through
            case TimeInterval.DAY_OF_MONTH:
                this.searchService.withGroupByDate(query, {
                    datastore: options.datastore.name,
                    database: options.database.name,
                    table: options.table.name,
                    field: options.dateField.columnName
                } as FieldKey, TimeInterval.DAY_OF_MONTH, '_' + TimeInterval.DAY_OF_MONTH);
            // Falls through
            case TimeInterval.MONTH:
                this.searchService.withGroupByDate(query, {
                    datastore: options.datastore.name,
                    database: options.database.name,
                    table: options.table.name,
                    field: options.dateField.columnName
                } as FieldKey, TimeInterval.MONTH, '_' + TimeInterval.MONTH);
            // Falls through
            case TimeInterval.YEAR:
                this.searchService.withGroupByDate(query, {
                    datastore: options.datastore.name,
                    database: options.database.name,
                    table: options.table.name,
                    field: options.dateField.columnName
                } as FieldKey, TimeInterval.YEAR, '_' + TimeInterval.YEAR);
            // Falls through
        }

        this.searchService.withFilter(query, this.searchService.createCompoundFilterClause(filters.concat(filter)))
            .withAggregation(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.dateField.columnName
            } as FieldKey, this.searchService.getAggregationLabel('date'), AggregationType.MIN)
            .withOrderByOperation(query, this.searchService.getAggregationLabel('date'))
            .withAggregationByGroupCount(query, '_' + options.granularity, this.searchService.getAggregationLabel());

        return query;
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @arg {FilterCollection} filters
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[], filters: FilterCollection): number {
        // Convert all the dates into new Date objects
        if (options.filterField.columnName) {
            this.timelineQueryResults = results.reduce((itemBucket, currentItem) => {
                let uniqueIdentifier = currentItem[options.idField.columnName || options.filterField.columnName];

                let previousItem = this.findDateInPreviousItem(itemBucket, currentItem);

                if (previousItem) {
                    if (previousItem.ids.indexOf(uniqueIdentifier) === -1) {
                        previousItem.ids.push(uniqueIdentifier);
                        previousItem.value++;
                    }

                    previousItem.filters = previousItem.filters.concat(currentItem[options.filterField.columnName])
                        .filter((value, index, array) => array.indexOf(value) === index);
                } else {
                    itemBucket.push({
                        value: 1,
                        ids: [uniqueIdentifier],
                        filters: [currentItem[options.filterField.columnName]],
                        origDate: currentItem[this.searchService.getAggregationLabel('date')],
                        date: new Date(currentItem[this.searchService.getAggregationLabel('date')])
                    });
                }

                return itemBucket;
            }, []);
        } else {
            this.timelineQueryResults = results.map((item) => ({
                value: item[this.searchService.getAggregationLabel()],
                date: new Date(item[this.searchService.getAggregationLabel('date')])
            }));
        }

        this.redrawFilters(filters);

        this.filterAndRefreshData(this.timelineQueryResults);

        return this.timelineQueryResults.reduce((sum, element) => sum + element.value, 0);
    }

    /**
     * Finds if the current date exists in the previous date items based on the granularity option
     *
     * @arg {any[]} previous
     * @arg {any} current
     * @return {previousItem}
     */
    findDateInPreviousItem(previousItems: any[], current: any) {
        if (previousItems.length) {
            let currentDate = new Date(current[this.searchService.getAggregationLabel('date')]);
            let currentMonth = currentDate.getUTCMonth();
            let currentYear = currentDate.getUTCFullYear();

            switch (this.options.granularity) {
                case TimeInterval.MINUTE:
                    return previousItems.find((item) => {
                        let minDate = new Date(new Date(item.origDate).setUTCSeconds(0));
                        let maxDate = new Date(new Date(item.origDate).setUTCSeconds(59));
                        return (minDate <= currentDate && currentDate <= maxDate) ? item : undefined;
                    });
                case TimeInterval.HOUR:
                    return previousItems.find((item) => {
                        let minDate = new Date(new Date(item.origDate).setUTCMinutes(0));
                        let maxDate = new Date(new Date(item.origDate).setUTCMinutes(59));
                        return (minDate <= currentDate && currentDate <= maxDate) ? item : undefined;
                    });
                case TimeInterval.DAY_OF_MONTH:
                    return previousItems.find((item) => {
                        let minDate = new Date(new Date(item.origDate).setUTCHours(0));
                        let maxDate = new Date(new Date(item.origDate).setUTCHours(23));
                        return (minDate <= currentDate && currentDate <= maxDate) ? item : undefined;
                    });
                case TimeInterval.MONTH:
                    return previousItems.find((item) => {
                        let prevMonth = new Date(item.origDate).getUTCMonth();
                        let prevYear = new Date(item.origDate).getUTCFullYear();
                        return (prevMonth === currentMonth && prevYear === currentYear) ? item : undefined;
                    });
                case TimeInterval.YEAR:
                    return previousItems.find((item) => {
                        let prevYear = new Date(item.origDate).getUTCFullYear();
                        return (prevYear === currentYear) ? item : undefined;
                    });
            }
        }

        return null;
    }

    /**
     * Filter the raw data and re-draw the chart
     */
    filterAndRefreshData(data: any[]) {
        let series: TimelineSeries = {
            color: this.colorThemeService.getThemeAccentColorHex(),
            name: 'Total',
            type: 'bar',
            options: {},
            data: [],
            focusData: [],
            selectedData: [],
            startDate: null,
            endDate: null
        };

        if (data && data.length) {
            // The query includes a sort, so it *should* be sorted.
            // Start date will be the first entry, and the end date will be the last
            series.startDate = data[0].date;
            let lastDate = data[data.length - 1].date;
            series.endDate = d3.time[this.options.granularity === TimeInterval.DAY_OF_MONTH ? 'day' : this.options.granularity]
                .utc.offset(lastDate, 1);

            // If we have a bucketizer, use it
            if (this.timelineData.bucketizer) {
                this.timelineData.bucketizer.setStartDate(series.startDate);
                this.timelineData.bucketizer.setEndDate(series.endDate);

                let numBuckets = this.timelineData.bucketizer.getNumBuckets();
                for (let index = 0; index < numBuckets; index++) {
                    let bucketDate = this.timelineData.bucketizer.getDateForBucket(index);
                    series.data[index] = {
                        date: bucketDate,
                        value: 0,
                        filters: []
                    };
                }

                for (let row of data) {
                    // Check if this should be in the focus data
                    // Focus data is not bucketized, just zeroed
                    if (this.selected) {
                        if (this.selected[0] <= row.date && this.selected[1] >= row.date) {
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
                    if (this.selected) {
                        if (this.selected[0] <= row.date && this.selected[1] >= row.date) {
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
            /* if (series.focusData && series.focusData.length > 0) {
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

    onChangeData() {
        this.timelineData.focusGranularityDifferent = this.options.granularity === TimeInterval.MINUTE;
        this.timelineData.bucketizer = this.getBucketizer();
        this.timelineData.granularity = this.options.granularity === TimeInterval.DAY_OF_MONTH ? 'day' : this.options.granularity;
    }

    getBucketizer() {
        let dayBucketizer = new DateBucketizer();
        switch (this.options.granularity) {
            case TimeInterval.MINUTE:
            case TimeInterval.HOUR:
                dayBucketizer.setGranularity(DateBucketizer.HOUR);
                return dayBucketizer;
            case TimeInterval.DAY_OF_MONTH:
                return dayBucketizer;
            case TimeInterval.MONTH:
                return new MonthBucketizer();
            case TimeInterval.YEAR:
                return new YearBucketizer();
            default:
                return null;
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
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 5000;
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

    /**
     * Returns whether this visualization should filter itself.
     *
     * @return {boolean}
     * @override
     */
    protected shouldFilterSelf(): boolean {
        // This timeline should never filter itself.
        return false;
    }
}
