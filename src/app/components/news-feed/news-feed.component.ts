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

import { AbstractSearchService, FilterClause, QueryPayload } from '../../library/core/services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { DateFormat, DateUtil } from '../../library/core/date.util';
import { FilterCollection, FilterConfig, SimpleFilterDesign } from '../../library/core/models/filters';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { CoreUtil } from '../../library/core/core.util';
import {
    OptionChoices,
    SortOrder,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption,
    WidgetNonPrimitiveOption
} from '../../library/core/models/widget-option';
import { MatDialog, MatAccordion } from '@angular/material';

import { MediaMetaData } from '../media-group/media-group.component';
import { MediaTypes } from '../../models/types';

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
    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;
    @ViewChild('filter', { static: false }) filter: ElementRef;
    @ViewChild(MatAccordion, { static: false }) accordion: MatAccordion;

    public newsFeedData: any[] = null;
    public noDataId: string = undefined;
    public queryItems: any[] = [];
    public selectedTabIndex: number = 0;

    public mediaTypes: any = MediaTypes;
    public url: string[] = [];
    public text: string[] = [];

    private _expandedIdList: any[] = [];

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
        return DateUtil.retrievePastTime(date, DateFormat.SHORT);
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

        if (this.options.toggleFiltered) {
            this.toggleFilters([this.createFilterConfigOnText(text)]);
        } else {
            this.exchangeFilters([this.createFilterConfigOnText(text)]);
        }
    }

    private createFilterConfigOnText(value?: any): SimpleFilterDesign {
        return new SimpleFilterDesign(this.options.datastore.name, this.options.database.name, this.options.table.name,
            this.options.filterField.columnName, '=', value);
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
            new WidgetFieldOption('dateField', 'Date Field', false),
            new WidgetFieldOption('filterField', 'Filter Field', false),
            new WidgetFieldOption('idField', 'ID Field', true),
            new WidgetFieldOption('linkField', 'Link Field', false),
            new WidgetFieldOption('secondaryContentField', 'Secondary Content Field', false),
            new WidgetFieldOption('sortField', 'Sort Field', false),
            new WidgetFieldOption('titleContentField', 'Title Content Field', false),
            new WidgetFieldOption('typeField', 'Type Field', false),
            new WidgetSelectOption('applyPreviousFilter', 'Apply the previous filter on remove filter action',
                false, false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('multiOpen', 'Allow for Multiple Open', false, true, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('contentLabel', 'Content Label', false, ''),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, false, OptionChoices.YesFalseNoTrue,
                this.optionsFilterable.bind(this)),
            new WidgetFreeTextOption('id', 'ID', false, null),
            new WidgetFreeTextOption('delimiter', 'Link Delimiter', false, ','),
            new WidgetFreeTextOption('linkPrefix', 'Link Prefix', false, ''),
            new WidgetFreeTextOption('secondaryContentLabel', 'Secondary Content Label', false, ''),
            new WidgetSelectOption('sortDescending', 'Sort', false, false, OptionChoices.AscendingFalseDescendingTrue),
            new WidgetSelectOption('toggleFiltered', 'Toggle Filtered Items', false, false, OptionChoices.NoFalseYesTrue),
            new WidgetNonPrimitiveOption('typeMap', 'Type Map', false, {})
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
        this._expandedIdList = [];

        this.newsFeedData = results.map((result) => {
            let item = {
                _filtered: !!(this.options.filterField.columnName && filters.isFiltered(this.createFilterConfigOnText(
                    result[this.options.filterField.columnName]
                ))),
                field: {},
                media: undefined
            };

            for (let field of options.fields) {
                if (field.type || field.columnName === '_id') {
                    let value = CoreUtil.deepFind(result, field.columnName);
                    if (typeof value !== 'undefined') {
                        item.field[field.columnName] = value;
                    }
                }
            }
            if (this.options.linkField.columnName && item.field[this.options.linkField.columnName]) {
                let links = CoreUtil.transformToStringArray(item.field[this.options.linkField.columnName], this.options.delimiter);
                let types = links.map((link) => link.substring(link.lastIndexOf('.') + 1).toLowerCase());
                if (this.options.typeField.columnName && item.field[this.options.typeField.columnName]) {
                    types = CoreUtil.transformToStringArray(item.field[this.options.typeField.columnName], this.options.delimiter);
                }
                types = types.map((type) => (this.options.typeMap || {})[type] || type);

                if (links.length) {
                    item.media = {
                        selected: undefined,
                        name: '',
                        loaded: false,
                        list: []
                    } as MediaMetaData;
                    links.forEach((link, index) => {
                        item.media.list.push({
                            // TODO Add a boolean borderField with border options like:  true = red, false = yellow
                            border: this.options.border,
                            link: this.appendPrefixIfNeeded(link, this.options.linkPrefix),
                            name: (index + 1) + ': ' + link.substring(link.lastIndexOf('/') + 1),
                            // Unsecure (non-https) or embedded ("/embed") youtube links should work properly with the video element.
                            type: types.length > index ? (link.indexOf('https://www.youtube.com/watch') < 0 ? types[index] :
                                this.mediaTypes.youtube) : ''
                        });
                    });
                    item.media.selected = item.media.list[0];
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
        if (!this.changeDetection['destroyed']) {
            this.changeDetection.detectChanges();
        }
        this.updateOnResize();
    }

    onResize() {
        if (this.accordion) {
            this['last_state'] = !this['last_state'];
            this.accordion._openCloseAllActions.next(this['last_state']);
        }
    }

    /**
     * Expands or collapses the item with the given ID.
     */
    expandOrCollapse(id: any) {
        const index = this._expandedIdList.indexOf(id);
        if (index < 0) {
            this._expandedIdList.push(id);
            this.publishSelectId(id);
        } else {
            this._expandedIdList.splice(index, 1);
        }
    }

    /**
     * Filters by the given item
     * @param item
     */
    filterItem(item) {
        if (this.options.filterField.columnName) {
            this.createFilter(item.field[this.options.filterField.columnName]);
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

    /**
     * Returns whether the item with the given ID is expanded.
     */
    isExpanded(id: any) {
        return (this._expandedIdList.indexOf(id) >= 0);
    }

    /**
     * Appends the given prefix to the given link if it is not already there.
     *
     * @arg {string} link
     * @arg {string} prefix
     * @return {string}
     */
    appendPrefixIfNeeded(link: string, prefix: string) {
        return ((!!link && link.indexOf(prefix) !== 0 && link.indexOf('http') !== 0) ? (prefix + link) : link);
    }
}
