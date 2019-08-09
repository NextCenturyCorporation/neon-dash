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
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { AbstractSearchService, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterCollection } from '../../util/filter.util';
import { FilterConfig, SimpleFilterConfig } from '../../models/filter';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { neonUtilities } from '../../models/neon-namespaces';
import {
    OptionChoices,
    SortOrder,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption
} from '../../models/widget-option';
import { MatDialog, MatAccordion } from '@angular/material';

import * as moment from 'moment';

/**
 * A visualization that displays binary and text files triggered through a select_id event.
 */
@Component({
    selector: 'app-news-feed',
    templateUrl: './news-feed.component.html',
    styleUrls: ['./news-feed.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class NewsFeedComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('filter') filter: ElementRef;
    @ViewChild(MatAccordion) accordion: MatAccordion;

    public newsFeedData: any[] = null;
    public selectedItem: object = undefined;
    public url: string = '';

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        dialog: MatDialog,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
        );

        this.redrawOnResize = true;
        this.visualizationQueryPaginates = true;
    }

    relativeTime(date: Date) {
        if (moment(date).diff(Date.now(), 'd', true) < -3) {
            return moment(date).format('YYYY/MM/DD');
        }
        return moment(date).fromNow();
    }

    /**
     * Creates Neon and visualization filter objects for the given text.
     *
     * @arg {string} text
     */
    createFilter(text: string) {
        if (!this.options.filterField.columnName) {
            return;
        }

        this.toggleFilters([this.createFilterConfigOnText(text)]);
    }

    private createFilterConfigOnText(value?: any): FilterConfig {
        return {
            datastore: this.options.datastore.name,
            database: this.options.database.name,
            table: this.options.table.name,
            field: this.options.filterField.columnName,
            operator: '=',
            value: value
        } as SimpleFilterConfig;
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    protected createOptions(): WidgetOption[] {
        return [
            new WidgetFieldOption('contentField', 'Content Field', false),
            new WidgetFieldOption('secondaryContentField', 'Secondary Content Field', false),
            new WidgetFieldOption('titleContentField', 'Title Content Field', false),
            new WidgetFieldOption('dateField', 'Date Field', false),
            new WidgetFieldOption('filterField', 'Filter Field', false),
            new WidgetFieldOption('idField', 'ID Field', true),
            new WidgetFieldOption('sortField', 'Sort Field', false),
            new WidgetFreeTextOption('contentLabel', 'Content Label', '', true),
            new WidgetFreeTextOption('secondaryContentLabel', 'Secondary Content Label', '', true),
            new WidgetSelectOption('multiOpen', 'Allow for Multiple Open', false, OptionChoices.NoFalseYesTrue, true),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.YesFalseNoTrue, this.optionsFilterable.bind(this)),
            new WidgetFreeTextOption('id', 'ID', null),
            new WidgetSelectOption('sortDescending', 'Sort', false, OptionChoices.AscendingFalseDescendingTrue)
        ];
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {FilterConfig[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterConfig[] {
        return this.options.filterField.columnName ? [this.createFilterConfigOnText()] : [];
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
        let filters = sharedFilters;

        if (this.options.sortField.columnName) {
            filters = [
                ...filters,
                this.searchService.buildFilterClause(options.idField.columnName, '!=', null)
            ];
        }

        this.searchService.updateFieldsToMatchAll(query);

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(filters));

        if (this.options.sortField.columnName) {
            this.searchService.updateSort(query, options.sortField.columnName,
                !options.ascending ? SortOrder.DESCENDING : SortOrder.ASCENDING);
        }

        return query;
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
            infoText: this.infoText,
            filter: this.filter
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
        return 'News Feed';
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(
            options.database.name &&
            options.table.name &&
            options.idField.columnName &&
            options.dateField.columnName &&
            options.contentField.columnName
        );
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
        this.newsFeedData = results.map((result) => {
            let item = {
                _filtered: !!(this.options.filterField.columnName && filters.isFiltered(this.createFilterConfigOnText(
                    result[this.options.filterField.columnName]
                )))
            };

            // TODO THOR-1335 Wrap all of the field properties in the data item to avoid any overlap with the _filtered property.
            for (let field of options.fields) {
                if (field.type || field.columnName === '_id') {
                    let value = neonUtilities.deepFind(result, field.columnName);
                    if (typeof value !== 'undefined') {
                        item[field.columnName] = value;
                    }
                }
            }
            return item;
        });
        return this.newsFeedData.length;
    }

    /**
     * Returns whether the widget is filterable.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsFilterable(options: any): boolean {
        return options.filterable;
    }

    /**
     * Initializes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Backwards compatibility (showOnlyFiltered deprecated due to its redundancy with hideUnfiltered).
        this.options.hideUnfiltered = this.injector.get('showOnlyFiltered', this.options.hideUnfiltered);
        // Backwards compatibility (ascending deprecated and replaced by sortDescending).
        this.options.sortDescending = !(this.injector.get('ascending', !this.options.sortDescending));
    }

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        this.newsFeedData.forEach((item) => {
            item._filtered = this.options.filterField.columnName && filters.isFiltered(this.createFilterConfigOnText(
                item[this.options.filterField.columnName]
            ));
        });
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        // Do nothing.
    }

    onResize() {
        if (this.accordion) {
            this['last_state'] = !this['last_state'];
            this.accordion._openCloseAllActions.next(this['last_state']);
        }
    }

    /**
     * Selects the given item item.
     *
     * @arg {object} item
     * @private
     */
    selectItem(item) {
        this.selectedItem = item;
        if (this.options.idField.columnName) {
            this.publishSelectId(item[this.options.idField.columnName]);
        }
    }

    /**
     * Filters by the given item
     * @param item
     */
    filterItem(item) {
        if (this.options.filterField.columnName) {
            this.createFilter(item[this.options.filterField.columnName]);
        }
    }

    /**
     * Returns whether items are selectable (filterable).
     *
     * @return {boolean}
     */
    isSelectable() {
        return !!this.options.filterField.columnName || !!this.options.idField.columnName;
    }

    /**
     * Returns whether the given item is selected (filtered).
     *
     * @arg {object} item
     * @return {boolean}
     */
    isSelected(item) {
        return item._filtered;
    }

    isExpanded(item) {
        return this.selectedItem === item;
    }

    checkStringForUrl(text: string) {
        return neonUtilities.checkStringForUrl(text);
    }

    removeUrl(text: string) {
        return neonUtilities.removeUrl(text);
    }

    hasUrl(text: string) {
        let urlPattern = /(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}\-\x{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?/ig;
        this.url = neonUtilities.checkStringForUrl(text);
        return urlPattern.test(text);
    }
}
