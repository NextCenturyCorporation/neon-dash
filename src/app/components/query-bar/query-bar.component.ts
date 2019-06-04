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
import { Observable } from 'rxjs';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';

import { AbstractSearchService, CompoundFilterType, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { CompoundFilterDesign, FilterBehavior, FilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../types';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';

import { query } from 'neon-framework';
import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-query-bar',
    templateUrl: './query-bar.component.html',
    styleUrls: ['./query-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueryBarComponent extends BaseNeonComponent {
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('queryBar') queryBar: ElementRef;

    autoComplete: boolean = true;
    queryValues: string[] = [];
    queryArray: any[] = [];

    public queryOptions: Observable<void | string[]>;

    private filterFormControl: FormControl;

    private previousText: string = '';

    constructor(
        datasetService: DashboardService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        protected widgetService: AbstractWidgetService,
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

        this.filterFormControl = new FormControl();
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('filterField', 'Filter Field', true),
            new WidgetFieldOption('idField', 'ID Field', true)
        ];
    }

    private createFilterDesignOnExtensionField(
        databaseName: string,
        tableName: string,
        fieldName: string,
        value?: any
    ): FilterDesign {
        let database: DatabaseMetaData = this.datasetService.getDatabaseWithName(databaseName);
        let table: TableMetaData = this.datasetService.getTableWithName(databaseName, tableName);
        let field: FieldMetaData = this.datasetService.getFieldWithName(databaseName, tableName, fieldName);
        return (database && database.name && table && table.name && field && field.columnName) ? {
            datastore: '',
            database: database,
            table: table,
            field: field,
            operator: '=',
            value: value
        } as SimpleFilterDesign : null;
    }

    private createFilterDesignOnList(filters: FilterDesign[]): FilterDesign {
        return {
            type: CompoundFilterType.OR,
            filters: filters
        } as CompoundFilterDesign;
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
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('extendedFilter', 'Extended Filter', false, OptionChoices.NoFalseYesTrue),
            // TODO THOR-950 Rename extensionFields because it is not an array of FieldMetaData objects!
            new WidgetNonPrimitiveOption('extensionFields', 'Extension Fields', []),
            new WidgetFreeTextOption('id', 'ID', ''),
            new WidgetFreeTextOption('placeHolder', 'Place Holder', 'Query')
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
                // Match a single EQUALS filter on the filter field.
                filterDesign: this.createFilterDesignOnText(),
                redrawCallback: this.updateQueryBarText.bind(this)
            });
        }

        if (this.options.extendedFilter) {
            this.options.extensionFields.forEach((extensionField) => {
                behaviors.push({
                    // Match a single EQUALS filter on the extension database/table/field.
                    filterDesign: this.createFilterDesignOnExtensionField(extensionField.database, extensionField.table,
                        extensionField.idField),
                    redrawCallback: () => { /* Do nothing */ }
                });

                behaviors.push({
                    // Match a compound OR filter with one or more EQUALS filters on the extension database/table/field.
                    filterDesign: this.createFilterDesignOnList([this.createFilterDesignOnExtensionField(extensionField.database,
                        extensionField.table, extensionField.idField)]),
                    redrawCallback: () => { /* Do nothing */ }
                });
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
    finalizeVisualizationQuery(options: any, queryPayload: QueryPayload, sharedFilters: FilterClause[]): QueryPayload {
        let filter: FilterClause = this.searchService.buildFilterClause(options.filterField.columnName, '!=', null);
        this.searchService.updateFilter(queryPayload, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filter)))
            .updateSort(queryPayload, options.filterField.columnName);
        return queryPayload;
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 10000;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Query Bar';
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.idField.columnName && options.filterField.columnName);
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
        this.queryArray = [];

        let setValues = true;
        if (this.queryValues && this.queryValues.length) {
            setValues = false;
        }

        results.forEach((result) => {
            let item = {};
            for (let field of options.fields) {
                if (field.columnName === options.filterField.columnName && setValues) {
                    this.queryValues.push(neonUtilities.deepFind(result, options.filterField.columnName));
                }
                if (field.type || field.columnName === '_id') {
                    let value = neonUtilities.deepFind(result, field.columnName);
                    if (typeof value !== 'undefined') {
                        item[field.columnName] = value;
                    }
                }
            }
            this.queryArray.push(item);
        });

        if (setValues) {
            this.queryValues = this.queryValues.filter((value, index, array) => array.indexOf(value) === index).sort();
        }

        this.queryBarSetup();

        return this.queryValues.length;
    }

    private queryBarSetup() {
        if (this.queryValues) {
            this.queryOptions = this.filterFormControl.valueChanges.pipe(
                startWith(''),
                map((value) => value && value.length > 0 ? this.filterAutoComplete(value) : [])
            );
        }
    }

    private filterAutoComplete(val: string) {
        return this.queryValues.filter((value) =>
            value.toLowerCase().indexOf(val.toLowerCase()) === 0);
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
            headerText: this.queryBar
        };
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        this.changeDetection.detectChanges();
    }

    /**
     * Creates a standard filter for the visualization.
     *
     * @arg {string} text
     */
    createFilter(text: string) {
        if (text === this.previousText) {
            return;
        }

        this.previousText = text;

        let values: any[] = !text ? [] : this.queryArray.filter((value) =>
            value[this.options.filterField.columnName].toLowerCase() === text.toLowerCase());

        if (values.length) {
            let filtersToAdd: FilterDesign[] = [this.createFilterDesignOnText(text)];
            let filtersToDelete: FilterDesign[] = [];

            // Gathers ids from the filtered query text in order to extend filtering to the other components
            if (this.options.extendedFilter) {
                this.options.extensionFields.forEach((extensionField) => {
                    let extendedFilter: FilterDesign = this.extensionFilter(text, extensionField, values);
                    if (extendedFilter) {
                        filtersToAdd = filtersToAdd.concat(extendedFilter);
                    } else {
                        filtersToDelete.push(this.createFilterDesignOnExtensionField(extensionField.database, extensionField.table,
                            extensionField.idField));
                    }
                });
            }

            this.exchangeFilters(filtersToAdd, filtersToDelete);
        } else {
            this.removeFilters();
        }
    }

    /**
     * Extends filtering across databases/indices that do not have related fields. Executes a query if necessary.
     *
     * @arg {string} text
     * @arg {any} fields
     * @arg {any} array
     * @return {FilterDesign[]}
     *
     * @private
     */
    private extensionFilter(text: string, fields: any, array: any[]): FilterDesign {
        if (fields.database !== this.options.database.name && fields.table !== this.options.table.name) {
            let extensionQuery = new query.Query().selectFrom(fields.database, fields.table);
            let queryFields = [fields.idField, fields.filterField];
            let execute = this.searchService.runSearch(this.datasetService.getDatastoreType(), this.datasetService.getDatastoreHost(), {
                query: extensionQuery
            });
            let tempArray = [];
            let queryClauses = [];
            for (let value of array) {
                queryClauses.push(query.where(fields.filterField, '=', value[this.options.idField.columnName]));
            }

            extensionQuery.withFields(queryFields).where(query.or.apply(extensionQuery, queryClauses));
            execute.done((response) => {
                if (response && response.data && response.data.length) {
                    response.data.forEach((result) => {
                        let value = neonUtilities.deepFind(result, fields.idField);
                        if (typeof value !== 'undefined') {
                            if (value instanceof Array) {
                                for (let values of value) {
                                    tempArray.push(values);
                                }
                            } else {
                                tempArray.push(value);
                            }
                        }
                    });
                }

                tempArray = tempArray.filter((value, index, items) => items.indexOf(value) === index);
                let filter: FilterDesign = this.extensionAddFilter(text, fields, tempArray);
                this.exchangeFilters([filter]);
            });

            // Don't return a filter because we're making an async ajax call.
            return null;
        }

        return this.extensionAddFilter(text, fields, array);
    }

    /**
     * Adds extension filters for the visualization
     *
     * @arg {string} text
     * @arg {any} fields
     * @arg {any} array
     * @return {FilterDesign}
     *
     * @private
     */
    private extensionAddFilter(__text: string, fields: any, array: any[]): FilterDesign {
        let filters: FilterDesign[] = array.map((element) => {
            let value: any = ((typeof element === 'object' && element.hasOwnProperty(fields.idField)) ? element[fields.idField] : element);
            return this.createFilterDesignOnExtensionField(fields.database, fields.table, fields.idField, value);
        }).filter((filterDesign) => !!filterDesign);

        return filters.length ? this.createFilterDesignOnList(filters) : null;
    }

    public removeFilters() {
        let removeFilterList: FilterDesign[] = [this.createFilterDesignOnText()];

        this.options.extensionFields.forEach((extensionField) => {
            removeFilterList.push(this.createFilterDesignOnExtensionField(extensionField.database, extensionField.table,
                extensionField.idField));
        });

        this.deleteFilters(removeFilterList);
    }

    /**
     * Returns whether this visualization should filter itself.
     *
     * @return {boolean}
     * @override
     */
    protected shouldFilterSelf(): boolean {
        return false;
    }

    private updateQueryBarText(__filters: FilterDesign[]) {
        // TODO AIDA-754
    }
}
