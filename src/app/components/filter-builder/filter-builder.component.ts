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
    Injector,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';

import { AbstractSearchService, CompoundFilterType, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { CompoundFilterDesign, FilterBehavior, FilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { NeonFieldMetaData, NeonTableMetaData, NeonDatabaseMetaData } from '../../model/types';
import {
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetOption,
    WidgetOptionCollection
} from '../../model/widget-option';

import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-filter-builder',
    templateUrl: './filter-builder.component.html',
    styleUrls: ['./filter-builder.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterBuilderComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    public filterClauses: FilterClauseMetaData[] = [];
    public operators: OperatorMetaData[] = [
        { value: 'contains', prettyName: 'contains' },
        { value: 'not contains', prettyName: 'not contains' },
        { value: '=', prettyName: '=' },
        { value: '!=', prettyName: '!=' },
        { value: '>', prettyName: '>' },
        { value: '<', prettyName: '<' },
        { value: '>=', prettyName: '>=' },
        { value: '<=', prettyName: '<=' }
    ];

    public compoundTypeIsOr: boolean = false;
    public parentFilterIsOr: boolean = false;

    constructor(
        dashboardService: DashboardService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
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

        this.dashboardService.dashboardSource.subscribe(() => {
            this.clearEveryFilterClause();
        });

        this.addBlankFilterClause();
    }

    /**
     * Adds a blank filter clause to the global list.
     */
    public addBlankFilterClause(): void {
        let filterClause: FilterClauseMetaData = new FilterClauseMetaData(() => []);
        filterClause.updateDatabases(this.dashboardState);
        filterClause.field = this.createEmptyField();
        filterClause.operator = this.operators[0];
        filterClause.value = '';

        // Set the default database, table, and field based on an existing filter clause in the component, if any.
        let existingFilterClause: FilterClauseMetaData = this.filterClauses.length ? this.filterClauses[0] : null;
        filterClause.databases = existingFilterClause ? existingFilterClause.databases : filterClause.databases;
        filterClause.tables = existingFilterClause ? existingFilterClause.tables : filterClause.tables;
        filterClause.fields = existingFilterClause ? existingFilterClause.fields : filterClause.fields;
        filterClause.changeDatabase = existingFilterClause ? existingFilterClause.changeDatabase : filterClause.database;
        filterClause.changeTable = existingFilterClause ? existingFilterClause.changeTable : filterClause.table;
        filterClause.changeField = existingFilterClause ? existingFilterClause.changeField : filterClause.field;

        if (filterClause.database && filterClause.table) {
            this.filterClauses.push(filterClause);
        }
    }

    /**
     * Clears every filter clause from the global list.
     */
    public clearEveryFilterClause(): void {
        this.filterClauses = [];
        this.addBlankFilterClause();
    }

    /**
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        // TODO THOR-994 The Filter Builder is no longer a Widget.
        // TODO THOR-996 The Filter Builder does not update with filters that are set externally, but should it (combined w/ Filter Tray)?
        return [] as FilterBehavior[];
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        // TODO THOR-994 The Filter Builder is no longer a Widget.
        return [];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        // TODO THOR-994 The Filter Builder is no longer a Widget.
        return [];
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
    finalizeVisualizationQuery(__options: any, __query: QueryPayload, __sharedFilters: FilterClause[]): QueryPayload {
        // TODO THOR-994 The Filter Builder does not run a visualization query.
        return null;
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} visualization
     * @override
     */
    getElementRefs(): any {
        // TODO THOR-994 The Filter Builder is no longer a Widget.
        return {};
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        // TODO THOR-994 The Filter Builder is no longer a Widget.
        return 0;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        // TODO THOR-994 The Filter Builder is no longer a Widget.
        return 'Filter Builder';
    }

    /**
     * Updates the database, tables, and fields in the given clause.
     *
     * @arg {FilterClauseMetaData} filterClause
     */
    public handleChangeDatabaseOfClause(filterClause: FilterClauseMetaData): void {
        filterClause.database = filterClause.changeDatabase;
        filterClause.updateTables(this.dashboardState);
        filterClause.changeTable = filterClause.table;
    }

    /**
     * Updates the given clause.
     *
     * @arg {FilterClauseMetaData} filterClause
     */
    public handleChangeDataOfClause(__filterClause: FilterClauseMetaData): void {
        // Do nothing.
    }

    /**
     * Updates the field in the given clause.
     *
     * @arg {FilterClauseMetaData} filterClause
     */
    public handleChangeFieldOfClause(filterClause: FilterClauseMetaData): void {
        filterClause.field = filterClause.changeField;
    }

    /**
     * Updates the table and fields in the given clause.
     *
     * @arg {FilterClauseMetaData} filterClause
     */
    public handleChangeTableOfClause(filterClause: FilterClauseMetaData): void {
        filterClause.table = filterClause.changeTable;
        filterClause.updateFields(this.dashboardState);
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        // TODO THOR-994 The Filter Builder is no longer a Widget.
        // Do nothing.
    }

    /**
     * Removes the given filter clause from neon and this visualization.
     *
     * @arg {FilterClauseMetaData} filterClause
     */
    public removeClause(filterClause: FilterClauseMetaData): void {
        this.filterClauses = this.filterClauses.filter((filterClauseFromGlobalList) => filterClause._id !== filterClauseFromGlobalList._id);

        if (!this.filterClauses.length) {
            this.addBlankFilterClause();
        }
    }

    /**
     * Saves a new custom filter using every filter clause in the global list.
     */
    public saveFilter(): void {
        if (!this.filterClauses.length || !this.validateFilters(this.filterClauses)) {
            return;
        }

        // Turn the filter clauses into filter designs.
        let filterDesigns: SimpleFilterDesign[] = this.filterClauses.map((filterClause) => {
            let value: any = filterClause.value;
            if (filterClause.operator.value !== 'contains' && filterClause.operator.value !== 'not contains') {
                value = parseFloat(filterClause.value);
                // The second check catches values larger than Number.MAX_SAFE_INT
                if (isNaN(value) || value.toString() !== filterClause.value) {
                    value = filterClause.value;
                }
            }
            return {
                root: this.parentFilterIsOr ? CompoundFilterType.OR : CompoundFilterType.AND,
                datastore: '',
                database: filterClause.database,
                table: filterClause.table,
                field: filterClause.field,
                operator: filterClause.operator.value,
                value: value
            } as SimpleFilterDesign;
        });

        // Create a compound filter from multiple filters if needed.
        let filterDesign: FilterDesign = !filterDesigns.length ? null : (filterDesigns.length === 1 ? filterDesigns[0] : {
            type: this.compoundTypeIsOr ? CompoundFilterType.OR : CompoundFilterType.AND,
            root: this.parentFilterIsOr ? CompoundFilterType.OR : CompoundFilterType.AND,
            filters: filterDesigns
        } as CompoundFilterDesign);

        if (filterDesign) {
            this.filterService.toggleFilters('CustomFilter', [filterDesign], this.dashboardState.findRelationDataList(),
                this.searchService);

            this.clearEveryFilterClause();
        }
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
    transformVisualizationQueryResults(__options: any, __results: any[]): number {
        // TODO THOR-994 The Filter Builder does not run a visualization query.
        return 0;
    }

    /**
     * Returns whether the given filter clauses is valid.
     *
     * @arg {FilterClauseMetaData} filterClause
     * @return {boolean}
     * @private
     */
    private validateFilter(filterClause: FilterClauseMetaData): boolean {
        return !!(filterClause.database && filterClause.database.name && filterClause.table && filterClause.table.name &&
            filterClause.field && filterClause.field.columnName);
    }

    /**
     * Returns whether all of the given filter clauses are valid.
     *
     * @arg {FilterClauseMetaData[]} filterClauses
     * @return {boolean}
     */
    public validateFilters(filterClauses: FilterClauseMetaData[]): boolean {
        return filterClauses.every((filterClause) => this.validateFilter(filterClause));
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(__options: any): boolean {
        // TODO THOR-994 The Filter Builder does not run a visualization query.
        return false;
    }
}

class OperatorMetaData {
    value: string;
    prettyName: string;
}

class FilterClauseMetaData extends WidgetOptionCollection {
    changeDatabase: NeonDatabaseMetaData;
    changeTable: NeonTableMetaData;
    changeField: NeonFieldMetaData;
    field: NeonFieldMetaData;
    operator: OperatorMetaData;
    value: string;
}
