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

import { AbstractSearchService, FilterClause, QueryPayload, SortOrder } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterBehavior, FilterDesign, SimpleFilterDesign } from '../../services/filter.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { neonUtilities } from '../../models/neon-namespaces';
import {
    OptionChoices,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption,
    WidgetNonPrimitiveOption
} from '../../models/widget-option';
import { MatDialog, MatAccordion } from '@angular/material';

import * as moment from 'moment';
import { MediaMetaData } from '../media-group/media-group.component';
import { MediaTypes } from '../../models/types';
import { DomSanitizer } from '@angular/platform-browser';

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
    public noDataId: string = undefined;
    public queryItems: any[] = [];
    public selectedTabIndex: number = 0;

    public mediaTypes: any = MediaTypes;

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        public sanitizer: DomSanitizer,
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

        this.toggleFilters([this.createFilterDesignOnText(text)]);
    }

    private createFilterDesignOnText(value?: any): FilterDesign {
        return {
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: this.options.filterField,
            operator: '=',
            value: value
        } as SimpleFilterDesign;
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
            new WidgetFieldOption('nameField', 'Name Field', false),
            new WidgetFieldOption('typeField', 'Type Field', false),
            new WidgetFieldOption('sortField', 'Sort Field', false),
            new WidgetFieldOption('linkField', 'Link Field', true),
            new WidgetSelectOption('resize', 'Resize Media to Fit', true, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('contentLabel', 'Content Label', '', true),
            new WidgetFreeTextOption('secondaryContentLabel', 'Secondary Content Label', '', true),
            new WidgetSelectOption('multiOpen', 'Allow for Multiple Open', false, OptionChoices.NoFalseYesTrue, true),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.YesFalseNoTrue, this.optionsFilterable.bind(this)),
            new WidgetFreeTextOption('id', 'ID', null),
            new WidgetSelectOption('sortDescending', 'Sort', false, OptionChoices.AscendingFalseDescendingTrue),
            new WidgetNonPrimitiveOption('typeMap', 'Type Map', {})
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

        if (this.options.filterField.columnName) {
            behaviors.push({
                filterDesign: this.createFilterDesignOnText(),
                // No redraw callback:  The filtered text will automatically be styled with isSelected as called by the HTML.
                redrawCallback: () => { /* Do nothing */ }
            });
        }

        return behaviors;
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
                this.searchService.buildFilterClause(options.idField.columnName, '!=', null),
                this.searchService.buildFilterClause(options.idField.columnName, '!=', '')
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
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): number {
        this.newsFeedData = results.map((result) => {
            let item = {};
            for (let field of options.fields) {
                if (field.type || field.columnName === '_id') {
                    let value = neonUtilities.deepFind(result, field.columnName);
                    if (typeof value !== 'undefined') {
                        item[field.columnName] = value;
                    }
                }
            }
            let tabsAndMedia: MediaMetaData[] = [];
            let index = 0;
            if (this.transformToStringArray(item['mediaEntities.mediaURLHttps'], ',').length > 0) {
                item['mediaEntities.mediaURLHttps'].forEach((url) => {
                    let tab: MediaMetaData = {
                        selected: undefined,
                        name: (item['mediaEntities.mediaURLHttps'].length > 1 ? ((index + 1) + ': ') : '') + url.substring(url.lastIndexOf('/') + 1),
                        loaded: false,
                        list: []
                    };
                    tab.list.push({
                        // TODO Add a boolean borderField with border options like:  true = red, false = yellow
                        border: this.options.border,
                        link: this.appendPrefixIfNeeded(url, this.options.linkPrefix),
                        name: '',
                        type: (this.getMediaType(url) || '')
                    });
                    tab.selected = tab.list[0];
                    tabsAndMedia.push(tab);
                    index++;
                });
            }
            item['mediaMetaDataList'] = tabsAndMedia;
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
        return (!!this.options.filterField.columnName && this.isFiltered(this.createFilterDesignOnText(
            item[this.options.filterField.columnName]
        )));
    }

    /**
     * Returns the media type for the thumbnail
     * @arg {object} item
     * @return string
     */
    getMediaType(item) {
        let fileType = item.substring(item.lastIndexOf('.') + 1).toLowerCase();
        return this.options.typeField.columnName ? this.options.typeField.columnName : this.options.typeMap[fileType] ?
            this.options.typeMap[fileType] : '';
    }

    /**
     * Transforms the given string or string array into a string array and returns the array.
     *
     * @arg {string|string[]} input
     * @return {string[]}
     */
    transformToStringArray(input, delimiter: string) {
        if (Array.isArray(input)) {
            return input;
        }
        if (input !== '' && input !== null && typeof input !== 'undefined') {
            let inputValue = input.toString();
            if (inputValue.indexOf('[') === 0 && inputValue.lastIndexOf(']') === (inputValue.length - 1) &&
                typeof inputValue !== 'undefined') {
                inputValue = inputValue.substring(1, inputValue.length - 1);
            }
            return inputValue.indexOf(delimiter) > -1 ? inputValue.split(delimiter) : [inputValue];
        }
        return [];
    }

    /**
     * Adds the given links to the global list.
     *
     * @arg {any} tab
     * @arg {any[]} links
     * @arg {any[]} masks
     * @arg {any[]} names
     * @arg {any[]} types
     * @arg {string} [oneTabName='']
     * @return {MediaMetaData[]}
     */
    createTabs(links: any, names: any[], types: any[], oneTabName: string = ''): MediaMetaData[] {
        let oneTab: MediaMetaData = {
            selected: undefined,
            name: oneTabName,
            loaded: false,
            list: []
        };

        let tabs = this.options.oneTabPerArray ? [oneTab] : [];

        links.filter((link) => !!link).forEach((link, index) => {
            // Let mask = this.appendPrefixIfNeeded(this.findElementAtIndex(masks, index), this.options.maskLinkPrefix ||
            //     this.options.linkPrefix);
            let name = this.findElementAtIndex(names, index, (link ? link.substring(link.lastIndexOf('/') + 1) : oneTabName));
            let type = this.findElementAtIndex(types, index, (this.getMediaType(link) || ''));

            // If the type is "mask,img" then change the type to "mask" if the mask link exists else change the type to "img" (the backup).
            // if (type === (this.mediaTypes.maskImage + ',' + this.mediaTypes.image)) {
            //     type = this.mediaTypes.image;
            // }

            // Only add a tab if the link is non-empty; only add a tab for a mask-type if the mask is also non-empty.
            if (link) {
                let tab = oneTab;
                if (!this.options.oneTabPerArray) {
                    tab = {
                        selected: undefined,
                        name: (links.length > 1 ? ((index + 1) + ': ') : '') + name,
                        loaded: false,
                        list: []
                    };
                }

                tab.list.push({
                    // TODO Add a boolean borderField with border options like:  true = red, false = yellow
                    border: this.options.border,
                    link: this.appendPrefixIfNeeded(link, this.options.linkPrefix),
                    name: name,
                    type: type
                });

                tab.selected = tab.list[0];

                // If (!this.options.oneTabPerArray) {
                //     tabs.push(tab);
                // }
            }
        });

        return tabs;
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

    /**
     * Returns the element in the given array at the given index if possible or the first element or the default value.
     *
     * @arg {any[]} array
     * @arg {number} index
     * @arg {any} defaultValue
     * @return {any}
     */
    findElementAtIndex(array: any[], index: number, defaultValue: any = ''): any {
        return (array.length > 1 ? (index < array.length ? array[index] : '') : array[0]) || defaultValue;
    }
}
