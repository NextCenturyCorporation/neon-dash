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
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData, MediaTypes } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import * as neon from 'neon-framework';
import * as _ from 'lodash';

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
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('newsFeed') newsFeed: ElementRef;
    @ViewChild('filter') filter: ElementRef;

    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: string
    }[] = [];

    public gridArray: any[] = [];
    public queryArray: any[] = [];
    public pagingGrid: any[] = [];
    public lastPage: boolean = true;
    public page: number = 1;
    public neonFilters: any[] = [];
    public showGrid: boolean;

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef,
        private sanitizer: DomSanitizer
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );

        if (!this.options.sortField.columnName) {
            this.options.sortField = this.options.idField;
        }

        // Backwards compatibility (showOnlyFiltered deprecated due to its redundancy with hideUnfiltered).
        this.options.hideUnfiltered = this.injector.get('showOnlyFiltered', this.options.hideUnfiltered);
        // Backwards compatibility (ascending deprecated and replaced by sortDescending).
        this.options.sortDescending = !(this.injector.get('ascending', !this.options.sortDescending));

        this.showGrid = !this.options.hideUnfiltered;
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('contentField', 'Content Field', false),
            new WidgetFieldOption('dateField', 'Date Field', false),
            new WidgetFieldOption('filterField', 'Filter Field', false),
            new WidgetFieldOption('idField', 'ID Field', true),
            new WidgetFieldOption('linkField', 'Link Field', false),
            new WidgetFieldOption('primaryTitleField', 'Primary Title Field', false),
            new WidgetFieldOption('secondaryTitleField', 'Secondary Title Field', false),
            new WidgetFieldOption('sortField', 'Sort Field', true)
        ];
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

        let filter = {
            id: undefined,
            field: this.options.filterField.columnName,
            prettyField: this.options.filterField.prettyName,
            value: text
        };

        let clause = neon.query.where(filter.field, '=', filter.value);
        let runQuery = !this.options.ignoreSelf;

        if (!this.filters.length) {
            this.filters = [filter];
            this.addNeonFilter(runQuery, filter, clause);
        } else if (this.filters.length === 1) {
            if (!this.filterExists(filter.field, filter.value)) {
                filter.id = this.filters[0].id;
                this.filters = [filter];
                this.replaceNeonFilter(runQuery, filter, clause);
            }
        } else {
            this.removeAllFilters([].concat(this.filters), () => {
                this.filters = [filter];
                this.addNeonFilter(runQuery, filter, clause);
            });
        }
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.NoFalseYesTrue, this.optionsFilterable),
            new WidgetFreeTextOption('id', 'ID', ''),
            new WidgetSelectOption('sortDescending', 'Sort', false, OptionChoices.AscendingFalseDescendingTrue)
        ];
    }

    /**
     * Creates and returns the query for the thumbnail grid.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);

        let fields = [this.options.idField.columnName, this.options.sortField.columnName];

        if (this.options.primaryTitleField.columnName) {
            fields.push(this.options.primaryTitleField.columnName);
        }

        if (this.options.secondaryTitleField.columnName) {
            fields.push(this.options.secondaryTitleField.columnName);
        }

        if (this.options.filterField.columnName) {
            fields.push(this.options.filterField.columnName);
        }

        if (this.options.contentField.columnName) {
            fields.push(this.options.contentField.columnName);
        }

        if (this.options.dateField.columnName) {
            fields.push(this.options.dateField.columnName);
        }

        let whereClauses = [
            neon.query.where(this.options.idField.columnName, '!=', null),
            neon.query.where(this.options.idField.columnName, '!=', '')
        ];

        return query.withFields(fields).where(neon.query.and.apply(query, whereClauses))
            .sortBy(this.options.sortField.columnName, this.options.ascending ? neonVariables.ASCENDING : neonVariables.DESCENDING);
    }

    /**
     * Returns whether a visualization filter object with the given field and value strings exists in the list of visualization filters.
     *
     * @arg {string} field
     * @arg {string} value
     * @return {boolean}
     * @private
     */
    filterExists(field: string, value: string) {
        return this.filters.some((existingFilter) => {
            return field === existingFilter.field && value === existingFilter.value;
        });
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.gridArray.length) {
            return 'No Data';
        }

        if (this.options.hideUnfiltered && !this.neonFilters.length) {
            return 'No Filter Selected';
        }

        if (this.gridArray.length <= this.options.limit) {
            return 'Total Items ' + super.prettifyInteger(this.gridArray.length);
        }

        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1),
            end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.gridArray.length));

        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.gridArray.length);
    }

    /**
     * Increases the page and updates the bar chart data.
     */
    goToNextPage() {
        if (!this.lastPage) {
            this.page++;
            this.updatePageData();
        }
    }

    /**
     * Decreases the page and updates the bar chart data.
     */
    goToPreviousPage() {
        if (this.page !== 1) {
            this.page--;
            this.updatePageData();
        }
    }

    /**
     * Updates lastPage and the bar chart data using the page and limit.
     */
    updatePageData() {
        let offset = (this.page - 1) * this.options.limit;
        this.lastPage = (this.gridArray.length <= (offset + this.options.limit));
        this.pagingGrid = this.gridArray.slice(offset,
            Math.min(this.page * this.options.limit, this.gridArray.length));
        this.showGrid = true;
        this.refreshVisualization();
    }

    /**
     * Returns the list of filter objects for the visualization.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return this.filters;
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
            newsFeed: this.newsFeed,
            filter: this.filter
        };
    }

    /**
     * Returns the list filters for the visualization to ignore.
     *
     * @return {array|null}
     * @override
     */
    getFiltersToIgnore(): any[] {
        if (!this.options.ignoreSelf) {
            return null;
        }

        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            this.options.filterField.columnName ? [this.options.filterField.columnName] : undefined);

        let ignoredFilterIds = neonFilters.filter((neonFilter) => {
            return !neonFilter.filter.whereClause.whereClauses;
        }).map((neonFilter) => {
            return neonFilter.id;
        });

        return ignoredFilterIds.length ? ignoredFilterIds : null;
    }

    /**
     * Returns the text for the given filter object.
     *
     * @arg {object} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        return filter.prettyField + ' = ' + filter.value;
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
     * Returns whether the thumbnail grid query using the active data config is valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name &&
            this.options.idField && this.options.idField.columnName && this.options.sortField && this.options.sortField.columnName);
    }

    /**
     * Handles the thumbnail grid query results and show/hide event for selecting/filtering and unfiltering documents.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response) {
        this.gridArray = [];
        this.queryArray = [];
        this.errorMessage = '';
        this.lastPage = true;
        this.page = 1;

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.isLoading = true;
                response.data.forEach((d) => {
                    let item = {};
                    for (let field of this.options.fields) {
                        if (field.columnName === this.options.filterField.columnName) {
                            this.queryArray.push(neonUtilities.deepFind(d, this.options.filterField.columnName));
                        }
                        if (field.type || field.columnName === '_id') {
                            let value = neonUtilities.deepFind(d, field.columnName);
                            if (typeof value !== 'undefined') {
                                item[field.columnName] = value;
                            }
                        }
                    }
                    this.gridArray.push(item);
                    this.queryArray = this.queryArray.filter((value, index, array) => array.indexOf(value) === index);
                });

                this.neonFilters = this.filterService.getFiltersForFields(this.options.database.name,
                    this.options.table.name, [this.options.filterField.columnName]);

                if (this.options.hideUnfiltered && this.neonFilters.length || !this.options.hideUnfiltered) {
                    this.lastPage = (this.gridArray.length <= this.options.limit);
                    this.pagingGrid = this.gridArray.slice(0, this.options.limit);
                    this.refreshVisualization();
                    this.isLoading = false;
                    this.showGrid = true;
                } else {
                    this.pagingGrid = [];
                    this.showGrid = false;
                }

            } else {
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            console.error(this.options.title + ' Error: ' + e);
            this.errorMessage = 'Error';
            this.refreshVisualization();
        }
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
        return (!!this.options.filterField.columnName && this.filterExists(this.options.filterField.columnName,
            item[this.options.filterField.columnName]));
    }

    /**
     * Initializes the thumbnail grid by running its query.
     *
     * @override
     */
    postInit() {
        this.executeQueryChain();
    }

    /**
     * Publishes the component's option object and handle change callbacks to the gear component
     */
    publishOptions() {
        let handleChangeData: () => void;
        let handleChangeDatabase: () => void;
        let handleChangeFilterField: () => void;
        let handleChangeLimit: () => void;
        let handleChangeTable: () => void;
        handleChangeData = this.handleChangeData.bind(this);
        handleChangeDatabase = this.handleChangeDatabase.bind(this);
        handleChangeFilterField = this.handleChangeFilterField.bind(this);
        handleChangeLimit = this.subHandleChangeLimit.bind(this);
        handleChangeTable = this.handleChangeTable.bind(this);
        this.messenger.publish('options', {
            options: this.options,
            changeData: handleChangeData,
            changeDatabase: handleChangeDatabase,
            changeFilterFIeld: handleChangeFilterField,
            changeLimitCallback: handleChangeLimit,
            changeTable: handleChangeTable
        });
    }

    /**
     * Publishes the toggleGear so the app component can toggle the gear panel
     */
    publishToggleGear() {
        this.messenger.publish('toggleGear', {
            toggleGear: true
        });
    }

    /**
     * Publishes the toggleGear so the app component can toggle the gear panel
     */
    toggleGear() {
        this.publishOptions();
        this.publishToggleGear();
    }

    /**
     * Refreshes the thumbnail grid.
     *
     * @override
     */
    refreshVisualization() {
        this.changeDetection.detectChanges();
    }

    /**
     * Removes the given filter from this visualization.
     *
     * @arg {object} filter
     * @override
     */
    removeFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter: any) => {
            return existingFilter.id !== filter.id;
        });

        this.showGrid = false;
    }

    /**
     * Returns multiple values as an array
     *
     * @arg {any} value
     * @private
     */
    private getArrayValues(value) {
        return Array.isArray(value) ?
            value : value.toString().search(/,/g) > -1 ?
                value.toString().split(',') : [value];
    }

    /**
     * Selects the given grid item.
     *
     * @arg {object} item
     * @private
     */
    selectGridItem(item) {
        if (this.options.idField.columnName) {
            this.publishSelectId(item[this.options.idField.columnName]);
        }
        if (this.options.filterField.columnName) {
            this.createFilter(item[this.options.filterField.columnName]);
        }
    }

    /**
     * Sets filters for the visualization.
     *
     * @override
     */
    setupFilters() {
        let neonFilters = this.options.filterField.columnName ? this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, [this.options.filterField.columnName]) : [];
        this.filters = [];

        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.findField(this.options.fields, neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                let filter = {
                    id: neonFilter.id,
                    field: field.columnName,
                    prettyField: field.prettyName,
                    value: value
                };
                if (!this.filterExists(filter.field, filter.value)) {
                    this.filters.push(filter);
                }
            }
        }
    }

    /**
     * Destroys any thumbnail grid sub-components if needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // Do nothing.
    }

    /**
     * Initializes any thumbnail grid sub-components if needed.
     *
     * @override
     */
    subNgOnInit() {
        // Do nothing.
    }
}
