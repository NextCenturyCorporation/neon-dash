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
import { TimelineSelectorChart, TimelineSeries, TimelineData } from './TimelineSelectorChart';
import { YearBucketizer } from '../bucketizers/YearBucketizer';

import * as _ from 'lodash';
import { MatDialog } from '@angular/material';

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

    protected selected: Date[] = null;

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
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
        dialog: MatDialog
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
            new WidgetFieldOption('dateField', 'Date Field', true)
        ];
    }

    private createFilterDesignOnTimeline(begin?: Date, end?: Date): FilterDesign {
        return {
            type: CompoundFilterType.AND,
            inflexible: true,
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

    onTimelineSelection(beginDate: Date, endDate: Date): void {
        let filterDesign: FilterDesign = this.createFilterDesignOnTimeline(beginDate, endDate);

        this.selected = [beginDate, endDate];

        this.exchangeFilters([filterDesign]);

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
        let filter: FilterClause = this.searchService.buildFilterClause(this.options.dateField.columnName, '!=', null);

        let groups = [];
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
        // Convert all the dates into Date objects
        this.timelineQueryResults = results.map((item) => {
            return {
                value: item._aggregation,
                date: new Date(item._date)
            };
        });

        this.filterAndRefreshData(this.timelineQueryResults);

        return this.timelineQueryResults.reduce((sum, element) => sum + element.value, 0);
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

                for (let row of data) {
                    // Check if this should be in the focus data
                    // Focus data is not bucketized, just zeroed
                    if (this.selected) {
                        if (this.selected[0] <= row.date && this.selected[1] >= row.date) {
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
                for (let row of data) {
                    // Check if this should be in the focus data
                    if (this.selected) {
                        if (this.selected[0] <= row.date && this.selected[1] >= row.date) {
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
        return 10;
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
