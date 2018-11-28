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

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { AbstractSubcomponent, SubcomponentListener } from './subcomponent.abstract';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonVariables } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import { SubcomponentImpl1 } from './subcomponent.impl1';
import { SubcomponentImpl2 } from './subcomponent.impl2';
import * as neon from 'neon-framework';

// TODO Name your visualization!
@Component({
    selector: 'app-sample',
    templateUrl: './sample.component.html',
    styleUrls: ['./sample.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SampleComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    // HTML element references used by the superclass for the resizing behavior.
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    // TODO Remove this property if you don't need a subcomponent.
    @ViewChild('subcomponent') subcomponentElementRef: ElementRef;

    // TODO Define properties as needed.  Made public so they can be used by unit tests.

    // The visualization filters.
    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: string
    }[] = [];

    // The data pagination properties.
    public lastPage: boolean = true;
    public page: number = 1;

    // The data shown in the visualization (limited).
    public activeData: any[] = [];

    // The data count used for the settings text and pagination.
    public docCount: number = 0;

    // The data returned by the visualization query response (not limited).
    public responseData: any[] = [];

    // TODO The subcomponent is here as a sample but it's not doing anything.  Use it or remove it!
    // The properties for the subcomponent.
    public subcomponentObject: AbstractSubcomponent;

    public subcomponentTypes: string[] = ['Impl1', 'Impl2'];

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );
    }

    // TODO Change arguments as needed.
    /**
     * Adds the given filter object to the visualization and removes any existing filter object with ID matching the given filter ID.
     *
     * @arg {object} filter
     */
    addVisualizationFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        }).concat(filter);
    }

    /**
     * Creates and returns an array of field options for the unique widget.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('sampleRequiredField', 'Sample Required Field', true),
            new WidgetFieldOption('sampleOptionalField', 'Sample Optional Field', false)
        ];
    }

    /**
     * Creates and returns an array of non-field options for the unique widget.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('subcomponentType', 'Subcomponent Type', 'Impl1', [{
                prettyName: 'Implementation 1',
                variable: 'Impl1'
            }, {
                prettyName: 'Implementation 2',
                variable: 'Impl2'
            }]),
            new WidgetSelectOption('sortDescending', 'Sort', false, OptionChoices.AscendingFalseDescendingTrue)
        ];
    }

    /**
     * Creates and returns the query for the visualization.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name).where(this.createWhere());

        // TODO Change this behavior as needed to create your visualization query.  Here is a sample of a count aggregation query.

        let aggregationFields = [this.options.sampleRequiredField.columnName];

        if (this.options.sampleOptionalField.columnName) {
            aggregationFields.push(this.options.sampleOptionalField.columnName);
        }

        return query.groupBy(aggregationFields).aggregate(neonVariables.COUNT, '*', 'count').sortBy('count', neonVariables.DESCENDING);
    }

    // TODO Change arguments as needed.
    /**
     * Creates and returns a filter object for the visualization.
     *
     * @arg {string} id
     * @arg {string} field
     * @arg {string} prettyField
     * @arg {string} value
     * @return {object}
     */
    createVisualizationFilter(id: string, field: string, prettyField: string, value: string): any {
        return {
            id: id,
            field: field,
            prettyField: prettyField,
            value: value
        };
    }

    /**
     * Creates and returns the where predicate for the visualization.
     *
     * @return {neon.query.WherePredicate}
     */
    createWhere(): neon.query.WherePredicate {
        // TODO Add or remove clauses as needed.
        let clauses: neon.query.WherePredicate[] = [neon.query.where(this.options.sampleRequiredField.columnName, '!=', null)];

        // Only add the optional field if it is defined.
        if (this.options.sampleOptionalField.columnName) {
            clauses.push(neon.query.where(this.options.sampleOptionalField.columnName, '!=', null));
        }

        if (this.options.filter) {
            clauses.push(neon.query.where(this.options.filter.lhs, this.options.filter.operator, this.options.filter.rhs));
        }

        if (this.hasUnsharedFilter()) {
            clauses.push(neon.query.where(this.options.unsharedFilterField.columnName, '=', this.options.unsharedFilterValue));
        }

        return clauses.length > 1 ? neon.query.and.apply(neon.query, clauses) : clauses[0];
    }

    // TODO Remove this sample function.
    /**
     * Adds a filter for the given text both in neon and for the visualization.  Abstract function from SubcomponentListener.
     * Called by the subcomponent.
     *
     * @arg {string} text
     * @override
     */
    filterFromSubcomponent(text: string) {
        this.filterOnItem({
            field: this.options.sampleRequiredField.columnName,
            prettyField: this.options.sampleRequiredField.prettyName,
            value: text
        });
    }

    // TODO Remove this sample function.
    /**
     * Adds a filter for the given item both in neon and for the visualization or replaces all the existing filters if replaceAll is true.
     *
     * @arg {object} item
     * @arg {boolean} [replaceAll=false]
     */
    filterOnItem(item: any, replaceAll = false) {
        let filter = this.createVisualizationFilter(undefined, item.field, item.prettyField, item.value);
        let neonFilter = neon.query.where(filter.field, '=', filter.value);

        if (replaceAll) {
            if (this.filters.length === 1) {
                // If we have a single existing filter, keep the ID and replace the old filter with the new filter.
                filter.id = this.filters[0].id;
                this.filters = [filter];
                this.replaceNeonFilter(true, filter, neonFilter);
            } else if (this.filters.length > 1) {
                // If we have multiple existing filters, remove all the old filters and add the new filter once done.
                // Use concat to copy the filter list.
                this.removeAllFilters([].concat(this.filters), () => {
                    this.filters = [filter];
                    this.addNeonFilter(true, filter, neonFilter);
                });
            } else {
                // If we don't have an existing filter, add the new filter.
                this.filters = [filter];
                this.addNeonFilter(true, filter, neonFilter);
            }
        } else {
            // If the new filter is unique, add the filter to the existing filters in both neon and the visualization.
            if (this.isVisualizationFilterUnique(item.field, item.value)) {
                this.addVisualizationFilter(filter);
                this.addNeonFilter(true, filter, neonFilter);
            }
        }
    }

    /**
     * Creates and returns the text for the settings button and menu.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        if (!this.responseData.length || !this.activeData.length) {
            return 'No Data';
        }
        if (this.activeData.length === this.responseData.length) {
            return 'Total ' + super.prettifyInteger(this.activeData.length);
        }
        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1);
        let end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.responseData.length));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.responseData.length);
    }

    /**
     * Returns the filter list for the visualization.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return this.filters;
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization needed for the resizing behavior.
     *
     * @return {object} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs(): any {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    }

    /**
     * Returns the list of filter IDs for the visualization to ignore.
     *
     * @return {array}
     * @override
     */
    getFiltersToIgnore(): string[] {
        // TODO Do you want the visualization to ignore its own filters?  If not, just return null.

        // TODO Change the list of filter fields here as needed.
        // Get all the neon filters relevant to this visualization.
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.sampleRequiredField.columnName]);

        let filterIdsToIgnore = [];
        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                filterIdsToIgnore.push(neonFilter.id);
            }
        }

        return filterIdsToIgnore.length ? filterIdsToIgnore : null;
    }

    /**
     * Returns the filter text for the given visualization filter object.
     *
     * @arg {any} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        // TODO Update as needed.  Do you want to use an equals sign?
        return filter.prettyField + ' = ' + filter.value;
    }

    /**
     * Returns the default limit for the unique widget.
     *
     * @return {string}
     * @override
     */
    getWidgetDefaultLimit(): number {
        return 10;
    }

    /**
     * Returns the name for the unique widget.
     *
     * @return {string}
     * @override
     */
    getWidgetName(): string {
        return 'Sample';
    }

    // TODO Remove this function if you don't need pagination.
    /**
     * Increases the page and updates the active data.
     */
    goToNextPage() {
        if (!this.lastPage) {
            this.page++;
            this.updateActiveData();
        }
    }

    // TODO Remove this function if you don't need pagination.
    /**
     * Decreases the page and updates the active data.
     */
    goToPreviousPage() {
        if (this.page !== 1) {
            this.page--;
            this.updateActiveData();
        }
    }

    // TODO If you don't need to do anything here (like update properties), just remove this function and use the superclass one!
    /**
     * Updates properties and/or sub-components whenever a config option is changed and reruns the visualization query.
     *
     * @override
     */
    handleChangeData() {
        super.handleChangeData();
    }

    // TODO Remove this function if you don't have a sub-component with multiple configurable types.
    /**
     * Updates the sub-component and reruns the visualization query.
     *
     * @arg {string} subcomponentType
     */
    handleChangeSubcomponentType(subcomponentType: string) {
        if (this.options.subcomponentType !== subcomponentType) {
            this.options.subcomponentType = subcomponentType;
            if (this.subcomponentObject) {
                this.subcomponentObject.destroyElements();
            }
            this.initializeSubcomponent();
            this.handleChangeData();
        }
    }

    // TODO Remove this function or change as needed.
    /**
     * Initializes the sub-component.
     */
    initializeSubcomponent() {
        switch (this.options.subcomponentType) {
            case 'Impl2':
                this.subcomponentObject = new SubcomponentImpl2(this.options, this);
                break;
            case 'Impl1':
            default:
                this.subcomponentObject = new SubcomponentImpl1(this.options, this);
        }

        this.subcomponentObject.buildElements(this.subcomponentElementRef);
    }

    /**
     * Returns whether the data and fields for the visualization are valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        // TODO Add or remove fields and properties as needed.
        return !!(this.options.database.name && this.options.table.name && this.options.sampleRequiredField.columnName);
    }

    // TODO Change arguments as needed.
    /**
     * Returns whether a visualization filter object in the filter list matching the given properties exists.
     *
     * @arg {string} field
     * @arg {string} value
     * @return {boolean}
     */
    isVisualizationFilterUnique(field: string, value: string): boolean {
        // TODO What filters do you need to de-duplicate?  Is it OK to have multiple filters with matching values?
        return !this.filters.some((existingFilter) => {
            return existingFilter.field === field && existingFilter.value === value;
        });
    }

    /**
     * Handles the query results for the visualization; updates and/or redraws any properties and/or sub-components as needed.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        // TODO Remove this part if you don't need a document count query.
        // Check for undefined because the count may be zero.
        if (response && response.data && response.data.length && response.data[0]._docCount !== undefined) {
            this.docCount = response.data[0]._docCount;
            return;
        }

        // TODO If you need to show an error message, set this.options.errorMessage as needed.

        // TODO Change this behavior as needed to handle your query results.

        // The aggregation query response data will have a count field and all visualization fields.
        this.responseData = response.data.map((item) => {
            let label = item[this.options.sampleRequiredField.columnName] + (this.options.sampleOptionalField.columnName ? ' - ' +
                item[this.options.sampleOptionalField.columnName] : '');

            return {
                count: item.count,
                field: this.options.sampleRequiredField.columnName,
                label: label,
                prettyField: this.options.sampleRequiredField.prettyName,
                value: item[this.options.sampleRequiredField.columnName]
            };
        });

        this.page = 1;
        this.updateActiveData();

        // TODO Remove this part if you don't need a document count query.
        if (this.responseData.length) {
            this.runDocCountQuery();
        } else {
            this.docCount = 0;
        }
    }

    /**
     * Handles any post-initialization behavior needed with properties or sub-components for the visualization.
     *
     * @override
     */
    postInit() {
        // Run the query to load the data.
        this.executeQueryChain();
    }

    /**
     * Updates any properties and/or sub-components as needed.
     *
     * @override
     */
    refreshVisualization() {
        // TODO Do you need to update and properties or redraw any sub-components?
        this.subcomponentObject.updateData(this.activeData);
    }

    /**
     * Removes the given visualization filter object from this visualization.
     *
     * @arg {object} filter
     * @override
     */
    removeFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        });
    }

    // TODO Remove this function if you don't need a document count query.
    /**
     * Creates and runs the document count query.
     */
    runDocCountQuery() {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name).where(this.createWhere());

        let ignoreFilters = this.getFiltersToIgnore();
        if (ignoreFilters && ignoreFilters.length) {
            query.ignoreFilters(ignoreFilters);
        }

        // The document count query is a count aggregation for all the documents.
        query.aggregate(neonVariables.COUNT, '*', '_docCount');

        this.executeQuery(query);
    }

    /**
     * Updates the filters for the visualization on initialization or whenever filters are changed externally.
     *
     * @override
     */
    setupFilters() {
        // First reset the existing visualization filters.
        this.filters = [];

        // TODO Change the list of filter fields here as needed.
        // Get all the neon filters relevant to this visualization.
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.sampleRequiredField.columnName]);

        for (let neonFilter of neonFilters) {
            // TODO Change as needed.  Do your filters have multiple clauses?  Do your filters have multiple keys (like begin/end dates)?

            // This will ignore a filter with multiple clauses.
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.findField(this.options.fields, neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                if (this.isVisualizationFilterUnique(field.columnName, value)) {
                    this.addVisualizationFilter(this.createVisualizationFilter(neonFilter.id, field.columnName, field.prettyName, value));
                }
            }
        }
    }

    // TODO Remove this function if you don't need a filter-container.
    /**
     * Returns whether any components are shown in the filter-container.
     *
     * @return {boolean}
     */
    showFilterContainer(): boolean {
        // TODO Check for any other components (like a legend).
        return !!this.getCloseableFilters().length;
    }

    // TODO Remove this function if you don't need a footer-container.
    /**
     * Returns whether any components are shown in the footer-container.
     *
     * @return {boolean}
     */
    showFooterContainer(): boolean {
        // TODO Check for any other components.
        return this.activeData.length < this.responseData.length;
    }

    // TODO If you don't need to do anything here (like update properties), just remove this function and use the superclass one!
    /**
     * Updates properties and/or sub-components whenever the limit is changed and reruns the visualization query.
     *
     * @override
     */
    subHandleChangeLimit() {
        super.subHandleChangeLimit();
    }

    /**
     * Deletes any properties and/or sub-components needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // TODO Do you need to remove any sub-components?
        if (this.subcomponentObject) {
            this.subcomponentObject.destroyElements();
        }
    }

    /**
     * Initializes any properties and/or sub-components needed once databases, tables, fields, and other options properties are set.
     *
     * @override
     */
    subNgOnInit() {
        // TODO Do you need to create any sub-components?
        this.initializeSubcomponent();
    }

    // TODO Remove this function if you don't need to update and/or redraw any sub-components on resize.
    /**
     * Resizes the sub-components.
     *
     * @override
     */
    subOnResizeStop() {
        this.subcomponentObject.redraw();
    }

    /**
     * Updates the pagination properties and the active data.
     */
    updateActiveData() {
        let offset = (this.page - 1) * this.options.limit;
        this.activeData = this.responseData.slice(offset, (offset + this.options.limit));
        this.lastPage = (this.responseData.length <= (offset + this.options.limit));
        this.refreshVisualization();
    }
}
