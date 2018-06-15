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

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { FieldMetaData, MediaTypes } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';

/**
 * Manages configurable options for the specific visualization.
 */
export class NewsFeedOptions extends BaseNeonOptions {
    public filterField: FieldMetaData;
    public id: string;
    public idField: FieldMetaData;
    public linkField: FieldMetaData;
    public ignoreSelf: boolean;
    public dateField: FieldMetaData;
    public primaryTitleField: FieldMetaData;
    public secondaryTitleField: FieldMetaData;
    public contentField: FieldMetaData;
    public sortField: FieldMetaData;
    public multiFilter: boolean;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.id = this.injector.get('id', '');
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.filterField = this.findFieldObject('filterField');
        this.unsharedFilterField = this.findFieldObject('unsharedFilterField');
        this.idField = this.findFieldObject('idField');
        this.linkField = this.findFieldObject('linkField');
        this.dateField = this.findFieldObject('dateField');
        this.primaryTitleField = this.findFieldObject('primaryTitleField');
        this.secondaryTitleField = this.findFieldObject('secondaryTitleField');
        this.contentField = this.findFieldObject('contentField');
        this.sortField = this.findFieldObject('sortField');
        this.ignoreSelf = this.injector.get('ignoreSelf', false);
        this.multiFilter = this.injector.get('multiFilter', false);

        if (!this.sortField.columnName) {
            this.sortField = this.findFieldObject('idField');
        }
    }
}

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
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
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

    public options: NewsFeedOptions;

    public gridArray: any[] = [];
    public queryArray: any[] = [];
    public pagingGrid: any[] = [];

    public lastPage: boolean = true;
    public page: number = 1;

    public showGrid: boolean = true;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
                filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
                ref: ChangeDetectorRef, visualizationService: VisualizationService, private sanitizer: DomSanitizer) {

        super(activeGridService, connectionService, datasetService,
            filterService, exportService, injector, themesService, ref, visualizationService);

        this.options = new NewsFeedOptions(this.injector, this.datasetService, 'News Feed', 10);
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
            .sortBy(this.options.sortField.columnName, neonVariables.DESCENDING);
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
     * Returns the thumbnail grid export fields.
     *
     * @return {array}
     * @override
     */
    getExportFields(): any[] {
        return [{
            columnName: this.options.filterField.columnName,
            prettyName: this.options.filterField.prettyName
        }, {
            columnName: this.options.idField.columnName,
            prettyName: this.options.idField.prettyName
        }, {
            columnName: this.options.linkField.columnName,
            prettyName: this.options.linkField.prettyName
        }, {
            columnName: this.options.dateField.columnName,
            prettyName: this.options.dateField.prettyName
        }, {
            columnName: this.options.primaryTitleField.columnName,
            prettyName: this.options.primaryTitleField.prettyName
        }, {
            columnName: this.options.secondaryTitleField.columnName,
            prettyName: this.options.secondaryTitleField.prettyName
        }, {
            columnName: this.options.contentField.columnName,
            prettyName: this.options.contentField.prettyName
        }, {
            columnName: this.options.sortField.columnName,
            prettyName: this.options.sortField.prettyName
        }];
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
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
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
        this.showGrid = false;

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.isLoading = true;
                this.showGrid = true;
                response.data.forEach((d) => {
                    let item = {};
                    for (let field of this.options.fields) {
                        if (field.columnName === this.options.filterField.columnName) {
                            this.queryArray.push(neonUtilities.deepFind(d, this.options.filterField.columnName));
                        } else if (field.type || field.columnName === '_id') {
                            let value = neonUtilities.deepFind(d, field.columnName);
                            if (typeof value !== 'undefined') {
                                item[field.columnName] = value;
                            }
                        }
                    }
                    this.gridArray.push(item);
                    this.queryArray = this.queryArray.filter((value, index, array) => array.indexOf(value) === index);
                });

                /*console.log(this.gridArray)*/
/*                console.log(this.queryArray);*/
                this.lastPage = (this.gridArray.length <= this.options.limit);
                this.pagingGrid = this.gridArray.slice(0, this.options.limit);
                this.refreshVisualization();
                this.isLoading = false;

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
                let field = this.options.findField(neonFilter.filter.whereClause.lhs);
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
     * Sets the given bindings for the thumbnail grid.
     *
     * @arg {any} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.idField = this.options.idField.columnName;
        bindings.ignoreSelf = this.options.ignoreSelf;
        bindings.multiFilter = this.options.multiFilter;
        bindings.linkField = this.options.linkField.columnName;
        bindings.dateField = this.options.dateField.columnName;
        bindings.primaryTitleField = this.options.primaryTitleField.columnName;
        bindings.secondaryTitleField = this.options.secondaryTitleField.columnName;
        bindings.contentField = this.options.contentField.columnName;
        bindings.filterField = this.options.filterField.columnName;
        bindings.sortField = this.options.sortField.columnName;
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
