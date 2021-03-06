/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';

import {
    AbstractFilterDesign,
    AbstractSearchService,
    CompoundFilterType,
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOptionNonPrimitive,
    ConfigOption,
    ConfigOptionSelect,
    CoreUtil,
    FieldKey,
    FilterClause,
    FilterCollection,
    ListFilterDesign,
    OptionChoices,
    SearchObject
} from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';

import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-query-bar',
    templateUrl: './query-bar.component.html',
    styleUrls: ['./query-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueryBarComponent extends BaseNeonComponent {
    @ViewChild('visualization', { read: ElementRef, static: false }) visualization: ElementRef;
    @ViewChild('queryBar', { static: false }) queryBar: ElementRef;

    autoComplete: boolean = true;
    queryValues: string[] = [];
    queryArray: any[] = [];

    public queryOptions: Observable<void | string[]>;

    private filterFormControl: FormControl;

    private previousText: string = '';

    private extensionFiltersToDelete: AbstractFilterDesign[];
    private extensionFiltersCollection: Map<string, AbstractFilterDesign[]> = new Map<string, AbstractFilterDesign[]>();
    private filtersRemoved: boolean = false;

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        protected colorThemeService: InjectableColorThemeService,
        ref: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            ref,
            dialog
        );

        this.filterFormControl = new FormControl();
    }

    private createFilterDesignOnList(
        databaseName: string,
        tableName: string,
        fieldName: string,
        values: any[] = [undefined]
    ): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.OR, this.options.datastore.name + '.' + databaseName + '.' + tableName +
            '.' + fieldName, '=', values);
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
            new ConfigOptionField('filterField', 'Filter Field', true),
            new ConfigOptionField('idField', 'ID Field', true),
            new ConfigOptionSelect('extendedFilter', 'Extended Filter', false, false, OptionChoices.NoFalseYesTrue),
            // TODO THOR-950 Rename extensionFields because it is not an array of FieldConfig objects!
            new ConfigOptionNonPrimitive('extensionFields', 'Extension Fields', false, []),
            new ConfigOptionFreeText('id', 'ID', false, ''),
            new ConfigOptionFreeText('placeHolder', 'Place Holder', false, 'Query')
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
        // Match a single EQUALS filter on the filter field.
        let designs: AbstractFilterDesign[] = this.options.filterField.columnName ? [this.createFilterDesignOnText()] : [];

        if (this.options.extendedFilter) {
            this.options.extensionFields.forEach((extensionField) => {
                // Match a compound OR filter with one or more EQUALS filters on the extension database/table/field.
                designs.push(this.createFilterDesignOnList(extensionField.database, extensionField.table, extensionField.idField));
            });
        }

        return designs;
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {query} SearchObject
     * @arg {FilterClause[]} filters
     * @return {SearchObject}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: SearchObject, filters: FilterClause[]): SearchObject {
        let filter: FilterClause = this.searchService.createFilterClause({
            datastore: options.datastore.name,
            database: options.database.name,
            table: options.table.name,
            field: options.filterField.columnName
        } as FieldKey, '!=', null);
        this.searchService.withFilter(query, this.searchService.createCompoundFilterClause(filters.concat(filter)))
            .withOrder(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.filterField.columnName
            } as FieldKey);
        return query;
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
                    this.queryValues.push(CoreUtil.deepFind(result, options.filterField.columnName));
                }
                if (field.type || field.columnName === '_id') {
                    let value = CoreUtil.deepFind(result, field.columnName);
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

        let filters = this.filterService.getFilters();
        if (!filters.length && this.filtersRemoved) {
            this.filtersRemoved = false;
            this.clearQueryText();
        }
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
            this.extensionFiltersCollection.set('', [this.createFilterDesignOnText([text])]);
            this.extensionFiltersToDelete = [];

            // Gathers ids from the filtered query text in order to extend filtering to the other components
            if (this.options.extendedFilter) {
                this.options.extensionFields.forEach((extensionField) => {
                    if (extensionField.database !== this.options.database.name && extensionField.table !== this.options.table.name) {
                        this.extensionFilter(text, extensionField, values, extensionField.database + '.' + extensionField.table + '.' +
                            extensionField.idField);
                    } else {
                        let extendedFilter: AbstractFilterDesign = this.extensionAddFilter(text, extensionField, values);
                        if (extendedFilter) {
                            this.extensionFiltersCollection.set('', this.extensionFiltersCollection.get('').concat(extendedFilter));
                        } else {
                            this.extensionFiltersToDelete.push(this.createFilterDesignOnList(extensionField.database, extensionField.table,
                                extensionField.idField));
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
     */
    private extensionFilter(text: string, extensionField: any, values: any[], collectionId: string): void {
        this.extensionFiltersCollection.set(collectionId, null);
        let extensionQuery = this.searchService.createSearch(extensionField.database, extensionField.table, [extensionField.idField,
            extensionField.filterField]);

        let filterFieldValues = [];
        let queryClauses = [];
        for (const value of values) {
            queryClauses.push(this.searchService.createFilterClause({
                datastore: this.options.datastore.name,
                database: extensionField.database,
                table: extensionField.table,
                field: extensionField.filterField
            } as FieldKey, '=', value[this.options.idField.columnName]));
            filterFieldValues.push(value[this.options.idField.columnName]);
        }

        const filterClause = this.searchService.createCompoundFilterClause(queryClauses, CompoundFilterType.OR);
        this.searchService.withFilter(extensionQuery, filterClause);

        this.searchService.runSearch(this.options.datastore.type, this.options.datastore.host, extensionQuery, (response) => {
            let responseValues = [];
            if (response && response.data && response.data.length) {
                response.data.forEach((result) => {
                    let idResultValues = CoreUtil.deepFind(result, extensionField.idField);
                    let filterResultValues = CoreUtil.deepFind(result, extensionField.filterField);
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
            const filter: AbstractFilterDesign = this.extensionAddFilter(text, extensionField, responseValues);
            this.extensionFiltersCollection.set(collectionId, [filter]);
            this.updateFiltersIfDone();
        });
    }

    /**
     * Adds extension filters for the visualization
     */
    private extensionAddFilter(__text: string, extensionField: any, values: any[]): AbstractFilterDesign {
        let filterValues: any[] = values.map((value) => ((typeof value === 'object' && value.hasOwnProperty(extensionField.idField)) ?
            value[extensionField.idField] : value));

        return filterValues.length ? this.createFilterDesignOnList(extensionField.database, extensionField.table, extensionField.idField,
            filterValues) : null;
    }

    public removeFilters() {
        let removeFilterList: AbstractFilterDesign[] = [this.createFilterDesignOnText()];

        this.options.extensionFields.forEach((extensionField) => {
            removeFilterList.push(this.createFilterDesignOnList(extensionField.database, extensionField.table, extensionField.idField));
        });

        this.deleteFilters(removeFilterList);
        this.filtersRemoved = true;
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
        // TODO AIDA-1041 Update the query bar active text using the given filters.
    }

    private updateFiltersIfDone(): void {
        const filterLists: AbstractFilterDesign[][] = Array.from(this.extensionFiltersCollection.values());
        if (filterLists.some((filterList) => filterList === null)) {
            return;
        }
        this.exchangeFilters(filterLists.reduce((list, filterList) => list.concat(filterList), []), this.extensionFiltersToDelete);
    }

    public clearQueryText(): void{
        this.queryBar.nativeElement.value = '';
    }
}
