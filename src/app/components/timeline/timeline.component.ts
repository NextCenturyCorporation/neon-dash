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
    CompoundFilterType,
    FilterClause,
    QueryPayload,
    TimeInterval
} from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import {
    CompoundFilterDesign,
    FilterBehavior,
    FilterDesign,
    FilterService,
    FilterUtil,
    SimpleFilterDesign
} from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { DateBucketizer } from '../bucketizers/DateBucketizer';
import { MonthBucketizer } from '../bucketizers/MonthBucketizer';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption,
    WidgetFieldArrayOption
} from '../../widget-option';
import { TimelineSelectorChart, TimelineSeries, TimelineData, TimelineItem } from './TimelineSelectorChart';
import { YearBucketizer } from '../bucketizers/YearBucketizer';
import { FieldMetaData } from '../../dataset';

import * as _ from 'lodash';
import { MatDialog } from '@angular/material';

import * as d3 from 'd3';

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('svg') svg: ElementRef;

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
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        protected widgetService: AbstractWidgetService,
        dialog: MatDialog,
        public visualization: ElementRef
    ) {
        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
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

    private createFilterDesignOnItem(field: FieldMetaData, value?: any): FilterDesign {
        return {
            root: CompoundFilterType.OR,
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: field,
            operator: '=',
            value: value
        } as SimpleFilterDesign;
    }

    private createFilterDesignOnTimeline(begin?: Date, end?: Date): FilterDesign {
        return {
            type: CompoundFilterType.AND,
            filters: [{
                datastore: '',
                database: this.options.database,
                table: this.options.table,
                field: this.options.dateField,
                operator: '>=',
                value: begin
            }, {
                datastore: '',
                database: this.options.database,
                table: this.options.table,
                field: this.options.dateField,
                operator: '<=',
                value: end
            }] as SimpleFilterDesign[]
        } as CompoundFilterDesign;
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
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        let behaviors: FilterBehavior[] = [];

        if (this.options.dateField.columnName) {
            behaviors.push({
                // Match a compound AND filter with one ">=" date filter and one "<=" date filter.
                filterDesign: this.createFilterDesignOnTimeline(),
                redrawCallback: this.redrawTimelineFilter.bind(this)
            });
        }

        if (this.options.filterField.columnName) {
            behaviors.push({
                // Match a single EQUALS filter on the specific filter field.
                filterDesign: this.createFilterDesignOnItem(this.options.filterField),
                redrawCallback: () => { /* Do nothing */ }
            } as FilterBehavior);
        }

        return behaviors;
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

    onTimelineSelection(beginDate: Date, endDate: Date, selectedData: TimelineItem[]): void {
        let filters: FilterDesign[] = [this.createFilterDesignOnTimeline(beginDate, endDate)];

        this.selected = [beginDate, endDate];

        if (this.options.filterField.columnName) {
            let filterValues: any[] = neonUtilities.flatten((selectedData || []).map((selectedItem) => selectedItem.filters)).filter(
                (value, index, array) => array.indexOf(value) === index
            );

            if (!filterValues.length) {
                // TODO NEON-36 The "filterField equals empty string" behavior may not work as expected with every dataset.
                filterValues = [''];
            }

            // Create a separate filter on each value because each value is a distinct item in the data (they've been aggregated together).
            filters = filters.concat(filterValues.map((value) => this.createFilterDesignOnItem(this.options.filterField, value)));
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
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause[]} sharedFilters
     * @return {QueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: QueryPayload, sharedFilters: FilterClause[]): QueryPayload {
        let filter: FilterClause = this.searchService.buildFilterClause(options.dateField.columnName, '!=', null);

        let groups = [];

        if (options.filterField.columnName) {
            groups.push(this.searchService.buildQueryGroup(options.filterField.columnName));

            if (options.idField.columnName) {
                groups.push(this.searchService.buildQueryGroup(options.idField.columnName));
            }
        }

        switch (options.granularity) {
            // Passthrough is intentional and expected!  falls through comments tell the linter that it is ok.
            case 'minute':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.MINUTE));
            // Falls through
            case 'hour':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.HOUR));
            // Falls through
            case 'day':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.DAY_OF_MONTH));
            // Falls through
            case 'month':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.MONTH));
            // Falls through
            case 'year':
                groups.push(this.searchService.buildDateQueryGroup(options.dateField.columnName, TimeInterval.YEAR));
            // Falls through
        }

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filter)))
            .updateGroups(query, groups).updateAggregation(query, AggregationType.MIN, '_date', options.dateField.columnName)
            .updateSort(query, '_date').updateAggregation(query, AggregationType.COUNT, '_aggregation', '_' + options.granularity);

        return query;
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): number {
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
                        origDate: currentItem._date,
                        date: new Date(currentItem._date)
                    });
                }

                return itemBucket;
            }, []);
        } else {
            this.timelineQueryResults = results.map((item) => ({
                value: item._aggregation,
                date: new Date(item._date)
            }));
        }

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
            let currentDate = new Date(current._date);
            let currentMonth = currentDate.getUTCMonth();
            let currentYear = currentDate.getUTCFullYear();

            switch (this.options.granularity) {
                case 'minute':
                    return previousItems.find((item) => {
                        let minDate = new Date(new Date(item.origDate).setUTCSeconds(0));
                        let maxDate = new Date(new Date(item.origDate).setUTCSeconds(59));
                        return (minDate <= currentDate && currentDate <= maxDate) ? item : undefined;
                    });
                case 'hour':
                    return previousItems.find((item) => {
                        let minDate = new Date(new Date(item.origDate).setUTCMinutes(0));
                        let maxDate = new Date(new Date(item.origDate).setUTCMinutes(59));
                        return (minDate <= currentDate && currentDate <= maxDate) ? item : undefined;
                    });
                case 'day':
                    return previousItems.find((item) => {
                        let minDate = new Date(new Date(item.origDate).setUTCHours(0));
                        let maxDate = new Date(new Date(item.origDate).setUTCHours(23));
                        return (minDate <= currentDate && currentDate <= maxDate) ? item : undefined;
                    });
                case 'month':
                    return previousItems.find((item) => {
                        let prevMonth = new Date(item.origDate).getUTCMonth();
                        let prevYear = new Date(item.origDate).getUTCFullYear();
                        return (prevMonth === currentMonth && prevYear === currentYear) ? item : undefined;
                    });
                case 'year':
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

        if (data && data.length) {
            // The query includes a sort, so it *should* be sorted.
            // Start date will be the first entry, and the end date will be the last
            series.startDate = data[0].date;
            let lastDate = data[data.length - 1].date;
            series.endDate = d3.time[this.options.granularity]
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
        this.timelineData.focusGranularityDifferent = this.options.granularity.toLowerCase() === 'minute';
        this.timelineData.bucketizer = this.getBucketizer();
        this.timelineData.granularity = this.options.granularity;
    }

    getBucketizer() {
        let dayBucketizer = new DateBucketizer();
        switch (this.options.granularity.toLowerCase()) {
            case 'minute':
            case 'hour':
                dayBucketizer.setGranularity(DateBucketizer.HOUR);
                return dayBucketizer;
            case 'day':
                return dayBucketizer;
            case 'month':
                return new MonthBucketizer();
            case 'year':
                return new YearBucketizer();
            default:
                return null;
        }
    }

    private redrawTimelineFilter(filters: FilterDesign[]): void {
        let removeFilter = true;

        // Find the begin date and end date inside the compound filter with an expected structure like createFilterDesignOnTimeline.
        // TODO THOR-1105 How should we handle multiple filters?  Should we draw multiple brushes?
        if (filters.length && FilterUtil.isCompoundFilterDesign(filters[0])) {
            let timeFilter: CompoundFilterDesign = (filters[0] as CompoundFilterDesign);

            if (timeFilter && timeFilter.filters.length === 2 && FilterUtil.isSimpleFilterDesign(timeFilter.filters[0]) &&
                FilterUtil.isSimpleFilterDesign(timeFilter.filters[1])) {
                let beginFilter: SimpleFilterDesign = (timeFilter.filters[0] as SimpleFilterDesign);
                let endFilter: SimpleFilterDesign = (timeFilter.filters[1] as SimpleFilterDesign);

                let beginDate;
                let endDate;

                if (beginFilter.operator === '>=' && endFilter.operator === '<=') {
                    beginDate = beginFilter.value;
                    endDate = endFilter.value;
                }

                // Switch the filters if needed.
                if (beginFilter.operator === '<=' && endFilter.operator === '>=') {
                    beginDate = endFilter.value;
                    endDate = beginFilter.value;
                }

                if (beginDate instanceof Date && endDate instanceof Date) {
                    this.selected = [beginDate, endDate];
                    removeFilter = false;
                    // TODO THOR-1106 Update the brush element in the timelineChart.
                }
            }
        }

        if (removeFilter && this.timelineChart) {
            this.selected = null;
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
