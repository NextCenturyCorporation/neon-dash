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
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import {
    AbstractFilterDesign,
    AbstractSearchService,
    CompoundFilterType,
    ConfigOptionField,
    ConfigOptionFieldArray,
    ConfigOptionFreeText,
    ConfigOption,
    ConfigOptionSelect,
    ConfigOptionNonPrimitive,
    CoreUtil,
    DateFormat,
    DateUtil,
    FieldKey,
    FilterClause,
    FilterCollection,
    ListFilter,
    ListFilterDesign,
    OptionChoices,
    SearchObject,
    SortOrder
} from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
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

    // Save the values of the filters in the FilterService that are compatible with this visualization's filters.
    private _filteredText: any[] = [];

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        ref: ChangeDetectorRef,
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

        this.redrawOnResize = true;
        this.visualizationQueryPaginates = true;
    }

    relativeTime(date: Date) {
        return DateUtil.retrievePastTime(date, DateFormat.MINUTE);
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

        this._filteredText = CoreUtil.changeOrToggleValues(text, this._filteredText, this.options.toggleFiltered);
        if (this._filteredText.length) {
            this.exchangeFilters([this.createFilterDesignOnText(this._filteredText)]);
        } else {
            // If we won't set any filters, create a FilterDesign without a value to delete all the old filters on the filter field.
            this.exchangeFilters([], [this.createFilterDesignOnText()]);
        }
    }

    private createFilterDesignOnText(values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.OR, this.options.datastore.name + '.' + this.options.database.name + '.' +
            this.options.table.name + '.' + this.options.filterField.columnName, '=', values);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('contentField', 'Content Field', false),
            new ConfigOptionField('dateField', 'Date Field', false),
            new ConfigOptionField('filterField', 'Filter Field', false),
            new ConfigOptionField('idField', 'ID Field', true),
            new ConfigOptionField('linkField', 'Link Field', false),
            new ConfigOptionField('secondaryContentField', 'Secondary Content Field', false),
            new ConfigOptionField('sortField', 'Sort Field', false),
            new ConfigOptionField('titleContentField', 'Title Content Field', false),
            new ConfigOptionField('typeField', 'Type Field', false),
            new ConfigOptionSelect('applyPreviousFilter', 'Apply the previous filter on remove filter action',
                false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('multiOpen', 'Allow for Multiple Open', false, true, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('multiLineTitle', 'Allow Titles to be Multiple Lines', false, true, OptionChoices.NoFalseYesTrue),
            new ConfigOptionFreeText('contentLabel', 'Content Label', false, ''),
            new ConfigOptionSelect('ignoreSelf', 'Filter Self', false, false, OptionChoices.YesFalseNoTrue,
                this.optionsNotFilterable.bind(this)),
            new ConfigOptionFreeText('id', 'ID', false, null),
            new ConfigOptionFreeText('delimiter', 'Link Delimiter', false, ','),
            new ConfigOptionFreeText('linkPrefix', 'Link Prefix', false, ''),
            new ConfigOptionFreeText('secondaryContentLabel', 'Secondary Content Label', false, ''),
            new ConfigOptionSelect('sortDescending', 'Sort', false, false, OptionChoices.AscendingFalseDescendingTrue),
            new ConfigOptionSelect('toggleFiltered', 'Toggle Filtered Items', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionNonPrimitive('typeMap', 'Type Map', false, {}),
            new ConfigOptionFieldArray('contentFields', 'Content Fields', false),
            new ConfigOptionNonPrimitive('contentLabels', 'Content Labels', false, {})
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
        return this.options.filterField.columnName ? [this.createFilterDesignOnText()] : [];
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
        this.searchService.withFilter(query, this.searchService.createCompoundFilterClause(filters.concat(options.sortField.columnName ?
            this.searchService.createFilterClause({
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.sortField.columnName
            } as FieldKey, '!=', null) : [])));

        if (options.sortField.columnName) {
            this.searchService.withOrder(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.sortField.columnName
            } as FieldKey, options.sortDescending ? SortOrder.DESCENDING : SortOrder.ASCENDING);
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
            (options.contentField.columnName || (options.titleContentField.columnName && options.contentFields.length))
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

        let listFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnText()) as ListFilter[];
        this._filteredText = CoreUtil.retrieveValuesFromListFilters(listFilters);

        this.newsFeedData = results.map((result) => {
            let item: any = {
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

            item._filtered = !!this.options.filterField.columnName && !!item.field[this.options.filterField.columnName] &&
                (this._filteredText.indexOf(item.field[this.options.filterField.columnName]) >= 0);

            return item;
        });
        return this.newsFeedData.length;
    }

    /**
     * Returns whether the widget is not filterable.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsNotFilterable(options: any): boolean {
        return !options.filterable;
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

        // Backwards compatibility (ascending deprecated and replaced by sortDescending).
        if (typeof this.options.ascending !== 'undefined') {
            this.options.sortDescending = !this.options.ascending;
        }
    }

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        let listFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnText()) as ListFilter[];
        this._filteredText = CoreUtil.retrieveValuesFromListFilters(listFilters);

        this.newsFeedData.forEach((item) => {
            item._filtered = this.options.filterField.columnName && item.field[this.options.filterField.columnName] &&
                this._filteredText.indexOf(item.field[this.options.filterField.columnName]) >= 0;
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
