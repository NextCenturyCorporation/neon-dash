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

import {
    AbstractSearchService,
    AggregationType,
    NeonFilterClause,
    NeonQueryPayload,
    SortOrder
} from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { AbstractSubcomponent, SubcomponentListener } from './subcomponent.abstract';
import { BaseNeonComponent, TransformedVisualizationData } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
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

    // TODO The subcomponent is here as a sample but it's not doing anything.  Use it or remove it!
    // The properties for the subcomponent.
    public subcomponentObject: AbstractSubcomponent;

    public subcomponentTypes: string[] = ['Impl1', 'Impl2'];

    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef
    ) {
        super(
            datasetService,
            filterService,
            searchService,
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
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
        // TODO Do you need to create any sub-components?
        this.initializeSubcomponent();
    }

    /**
     * Creates and returns an array of field options for the visualization.
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
     * Creates and returns an array of non-field options for the visualization.
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
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {NeonQueryPayload} queryPayload
     * @arg {NeonFilterClause[]} sharedFilters
     * @return {NeonQueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: NeonQueryPayload, sharedFilters: NeonFilterClause[]): NeonQueryPayload {
        // TODO Change this behavior as needed to create your visualization query.  Here is a sample of a count aggregation query.

        // TODO Add or remove filters as needed.
        let filters: NeonFilterClause[] = [this.searchService.buildFilterClause(this.options.sampleRequiredField.columnName, '!=', null)];

        // Only add the optional field if it is defined.
        if (this.options.sampleOptionalField.columnName) {
            filters.push(this.searchService.buildFilterClause(this.options.sampleOptionalField.columnName, '!=', null));
        }

        let groups = [this.searchService.buildQueryGroup(options.sampleRequiredField.columnName)];

        if (options.sampleOptionalField.columnName) {
            groups.push(this.searchService.buildQueryGroup(options.sampleOptionalField.columnName));
        }

        this.searchService.updateFilter(query, this.searchService.buildBoolFilterClause(sharedFilters.concat(filters)))
            .updateGroups(query, groups).updateAggregation(query, AggregationType.COUNT, '_count', '*')
            .updateSort(query, '_count', SortOrder.DESCENDING);

        return query;
    }

    /**
     * Removes any visualization elements when the widget is deleted.
     *
     * @override
     */
    destroyVisualization() {
        // TODO Do you need to remove any sub-components?
        if (this.subcomponentObject) {
            this.subcomponentObject.destroyElements();
        }
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
                this.replaceNeonFilter(this.options, true, filter, neonFilter);
            } else if (this.filters.length > 1) {
                // If we have multiple existing filters, remove all the old filters and add the new filter once done.
                // Use concat to copy the filter list.
                this.removeAllFilters(this.options, [].concat(this.filters), false, false, () => {
                    this.filters = [filter];
                    this.addNeonFilter(this.options, true, filter, neonFilter);
                });
            } else {
                // If we don't have an existing filter, add the new filter.
                this.filters = [filter];
                this.addNeonFilter(this.options, true, filter, neonFilter);
            }
        } else {
            // If the new filter is unique, add the filter to the existing filters in both neon and the visualization.
            if (this.isVisualizationFilterUnique(item.field, item.value)) {
                this.addVisualizationFilter(filter);
                this.addNeonFilter(this.options, true, filter, neonFilter);
            }
        }
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
        return 'Sample';
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

    /**
     * Initilizes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // TODO Do you need to initialize any properties?
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
     * Transforms the given array of query results using the given options into the array of objects to be shown in the visualization
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {TransformedVisualizationData}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): TransformedVisualizationData {
        // TODO Change this behavior as needed to handle your query results:  update and/or redraw and properties and/or subcomponents.

        // The aggregation query response data will have a _count field and all visualization fields.
        let data = results.map((item) => {
            let label = item[options.sampleRequiredField.columnName] + (options.sampleOptionalField.columnName ? ' - ' +
                item[options.sampleOptionalField.columnName] : '');

            return {
                count: item._count,
                field: options.sampleRequiredField.columnName,
                label: label,
                prettyField: options.sampleRequiredField.prettyName,
                value: item[options.sampleRequiredField.columnName]
            };
        });

        return new TransformedVisualizationData(data);
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        // TODO Do you need to update and properties or redraw any sub-components?
        if (this.getActiveData(this.options)) {
            this.subcomponentObject.updateData(this.getActiveData(this.options).data);
        }
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

    // TODO Remove this function if you don't need to update and/or redraw any sub-components on resize.
    /**
     * Updates the visualization as needed whenever it is resized.
     *
     * @override
     */
    updateOnResize() {
        this.subcomponentObject.redraw();
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        // TODO Add or remove fields and properties as needed.
        return !!(options.database.name && options.table.name && options.sampleRequiredField.columnName);
    }
}
