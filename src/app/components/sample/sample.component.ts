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
    FilterClause,
    QueryPayload,
    SortOrder
} from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterBehavior, FilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';

import { AbstractSubcomponent } from './subcomponent.abstract';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../types';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import { SubcomponentImpl1 } from './subcomponent.impl1';
import { SubcomponentImpl2 } from './subcomponent.impl2';
import { MatDialog } from '@angular/material';

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

    // TODO The subcomponent is here as a sample but it's not doing anything.  Use it or remove it!
    // The properties for the subcomponent.
    public subcomponentObject: AbstractSubcomponent;

    public subcomponentTypes: string[] = ['Impl1', 'Impl2'];

    public visualizationData: any[] = null;

    /* eslint-disable @typescript-eslint/no-useless-constructor */
    constructor(
        datasetService: DashboardService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
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

        // TODO
    }
    /* eslint-enable @typescript-eslint/no-useless-constructor */

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

    private createFilterDesign(field: FieldMetaData, value?: any): FilterDesign {
        return {
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: field,
            operator: '=',
            value: value
        } as SimpleFilterDesign;
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

    /**
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        let behaviors: FilterBehavior[] = [];

        // Add a filter design callback on each specific filter field.
        if (this.options.sampleRequiredField.columnName) {
            behaviors.push({
                filterDesign: this.createFilterDesign(this.options.sampleRequiredField),
                // No redraw callback:  The filtered text does not have its own HTML styles.
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
        // TODO Change this behavior as needed to create your visualization query.  Here is a sample of a count aggregation query.

        // TODO Add or remove filters as needed.
        let filters: FilterClause[] = [this.searchService.buildFilterClause(this.options.sampleRequiredField.columnName, '!=', null)];

        // Only add the optional field if it is defined.
        if (this.options.sampleOptionalField.columnName) {
            filters.push(this.searchService.buildFilterClause(this.options.sampleOptionalField.columnName, '!=', null));
        }

        let groups = [this.searchService.buildQueryGroup(options.sampleRequiredField.columnName)];
        let countField = options.sampleRequiredField.columnName;

        if (options.sampleOptionalField.columnName) {
            groups.push(this.searchService.buildQueryGroup(options.sampleOptionalField.columnName));
            countField = options.sampleOptionalField.columnName;
        }

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filters)))
            .updateGroups(query, groups).updateAggregation(query, AggregationType.COUNT, '_count', countField)
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
            field: this.options.sampleRequiredField,
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
        if (replaceAll) {
            this.exchangeFilters([this.createFilterDesign(item.field, item.value)]);
        } else {
            this.toggleFilters([this.createFilterDesign(item.field, item.value)]);
        }
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
        // TODO Change this behavior as needed to handle your query results:  update and/or redraw and properties and/or subcomponents.

        // The aggregation query response data will have a _count field and all visualization fields.
        this.visualizationData = results.map((item) => {
            let label = item[options.sampleRequiredField.columnName] + (options.sampleOptionalField.columnName ? ' - ' +
                item[options.sampleOptionalField.columnName] : '');

            return {
                count: item._count,
                field: options.sampleRequiredField,
                label: label,
                value: item[options.sampleRequiredField.columnName]
            };
        });

        return this.visualizationData.length;
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        // TODO Do you need to update and properties or redraw any sub-components?
        if (this.visualizationData) {
            this.subcomponentObject.updateData(this.visualizationData);
        }
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
