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
import { Observable } from 'rxjs';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';

import { AbstractSearchService, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { CompoundFilterConfig, FilterConfig, SimpleFilterConfig } from '../../models/filter';
import { FilterCollection } from '../../util/filter.util';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { neonUtilities } from '../../models/neon-namespaces';
import {
    CompoundFilterType,
    OptionChoices,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../models/widget-option';

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

    private extensionFiltersToDelete: FilterConfig[];
    private extensionFiltersCollection: Map<string, FilterConfig[]> = new Map<string, FilterConfig[]>();

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        protected colorThemeService: InjectableColorThemeService,
        ref: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
        );

        this.filterFormControl = new FormControl();
    }

    private createFilterConfigOnExtensionField(
        databaseName: string,
        tableName: string,
        fieldName: string,
        value?: any
    ): FilterConfig {
        return {
            datastore: this.dashboardState.datastore.name,
            database: databaseName,
            table: tableName,
            field: fieldName,
            operator: '=',
            value: value
        } as SimpleFilterConfig;
    }

    private createFilterConfigOnList(filters: FilterConfig[]): FilterConfig {
        return {
            type: CompoundFilterType.OR,
            filters: filters
        } as CompoundFilterConfig;
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
            new WidgetFieldOption('filterField', 'Filter Field', true),
            new WidgetFieldOption('idField', 'ID Field', true),
            new WidgetSelectOption('extendedFilter', 'Extended Filter', false, false, OptionChoices.NoFalseYesTrue),
            // TODO THOR-950 Rename extensionFields because it is not an array of NeonFieldMetaData objects!
            new WidgetNonPrimitiveOption('extensionFields', 'Extension Fields', false, []),
            new WidgetFreeTextOption('id', 'ID', false, ''),
            new WidgetFreeTextOption('placeHolder', 'Place Holder', false, 'Query')
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
        // Match a single EQUALS filter on the filter field.
        let designs: FilterConfig[] = this.options.filterField.columnName ? [this.createFilterConfigOnText()] : [];

        if (this.options.extendedFilter) {
            this.options.extensionFields.forEach((extensionField) => {
                // Match a single EQUALS filter on the extension database/table/field.
                designs.push(this.createFilterConfigOnExtensionField(extensionField.database, extensionField.table,
                    extensionField.idField));

                // Match a compound OR filter with one or more EQUALS filters on the extension database/table/field.
                designs.push(this.createFilterConfigOnList([this.createFilterConfigOnExtensionField(extensionField.database,
                    extensionField.table, extensionField.idField)]));
            });
        }

        return designs;
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
     * @arg {FilterCollection} filters
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[], filters: FilterCollection): number {
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

        this.redrawFilters(filters);

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
            this.extensionFiltersCollection.clear();
            this.extensionFiltersCollection.set('', [this.createFilterConfigOnText(text)]);
            this.extensionFiltersToDelete = [];

            // Gathers ids from the filtered query text in order to extend filtering to the other components
            if (this.options.extendedFilter) {
                this.options.extensionFields.forEach((extensionField) => {
                    if (extensionField.database !== this.options.database.name && extensionField.table !== this.options.table.name) {
                        this.extensionFilter(text, extensionField, values, extensionField.database + '.' + extensionField.table + '.' +
                            extensionField.idField);
                    } else {
                        let extendedFilter: FilterConfig = this.extensionAddFilter(text, extensionField, values);
                        if (extendedFilter) {
                            this.extensionFiltersCollection.set('', this.extensionFiltersCollection.get('').concat(extendedFilter));
                        } else {
                            this.extensionFiltersToDelete.push(this.createFilterConfigOnExtensionField(extensionField.database,
                                extensionField.table, extensionField.idField));
                        }
                    }
                });
            }

            this.updateFiltersIfDone();
        } else {
            this.removeFilters();
        }
    }

    /**
     * Extends filtering across databases/indices that do not have related fields. Executes a query if necessary.
     *
     * @arg {string} text
     * @arg {any} extensionField
     * @arg {any} array
     * @return {FilterConfig[]}
     *
     * @private
     */
    private extensionFilter(text: string, extensionField: any, values: any[], collectionId: string): void {
        this.extensionFiltersCollection.set(collectionId, null);
        let extensionQuery = new query.Query().selectFrom(extensionField.database, extensionField.table);
        let queryFields = [extensionField.idField, extensionField.filterField];
        let execute = this.searchService.runSearch(this.dashboardState.getDatastoreType(), this.dashboardState.getDatastoreHost(), {
            query: extensionQuery
        });
        let filterFieldValues = [];
        let queryClauses = [];
        for (const value of values) {
            queryClauses.push(query.where(extensionField.filterField, '=', value[this.options.idField.columnName]));
            filterFieldValues.push(value[this.options.idField.columnName]);
        }

        extensionQuery.withFields(queryFields).where(query.or.apply(extensionQuery, queryClauses));
        execute.done((response) => {
            let responseValues = [];
            if (response && response.data && response.data.length) {
                response.data.forEach((result) => {
                    let idResultValues = neonUtilities.deepFind(result, extensionField.idField);
                    let filterResultValues = neonUtilities.deepFind(result, extensionField.filterField);
                    if (filterResultValues.find((val) => filterFieldValues.includes(val))) {
                        if (typeof idResultValues !== 'undefined') {
                            if (idResultValues instanceof Array) {
                                for (const value of idResultValues) {
                                    responseValues.push(value);
                                }
                            } else {
                                responseValues.push(idResultValues);
                            }
                        }
                    }
                });
            }

            responseValues = responseValues.filter((value, index, items) => items.indexOf(value) === index);
            const filter: FilterConfig = this.extensionAddFilter(text, extensionField, responseValues);
            this.extensionFiltersCollection.set(collectionId, [filter]);
            this.updateFiltersIfDone();
        });
    }

    /**
     * Adds extension filters for the visualization
     *
     * @arg {string} text
     * @arg {any} extensionField
     * @arg {any} array
     * @return {FilterConfig}
     *
     * @private
     */
    private extensionAddFilter(__text: string, extensionField: any, array: any[]): FilterConfig {
        let filters: FilterConfig[] = array.map((element) => {
            let value: any = ((typeof element === 'object' && element.hasOwnProperty(extensionField.idField)) ?
                element[extensionField.idField] : element);
            return this.createFilterConfigOnExtensionField(extensionField.database, extensionField.table, extensionField.idField, value);
        }).filter((filterConfig) => !!filterConfig);

        return filters.length ? this.createFilterConfigOnList(filters) : null;
    }

    public removeFilters() {
        let removeFilterList: FilterConfig[] = [this.createFilterConfigOnText()];

        this.options.extensionFields.forEach((extensionField) => {
            removeFilterList.push(this.createFilterConfigOnExtensionField(extensionField.database, extensionField.table,
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

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(__filters: FilterCollection): void {
        // TODO AIDA-754 Update the query bar active text using the given filters.
    }

    private updateFiltersIfDone(): void {
        const filterLists: FilterConfig[][] = Array.from(this.extensionFiltersCollection.values());
        if (filterLists.some((filterList) => filterList === null)) {
            return;
        }
        this.exchangeFilters(filterLists.reduce((list, filterList) => list.concat(filterList), []), this.extensionFiltersToDelete);
    }
}
