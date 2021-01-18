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
import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation
} from '@angular/core';

import {
    AbstractFilterDesign,
    CompoundFilterDesign,
    CompoundFilterType,
    DatabaseConfig,
    Dataset,
    FieldConfig,
    ListFilterDesign,
    TableConfig
} from '@caci-critical-insight-solutions/nucleus-core';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { DashboardService } from '../../services/dashboard.service';

import { OptionCollection } from '../../models/widget-option-collection';

@Component({
    selector: 'app-filter-builder',
    templateUrl: './filter-builder.component.html',
    styleUrls: ['./filter-builder.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class FilterBuilderComponent {
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

    private _dataset: Dataset;

    constructor(
        public dashboardService: DashboardService,
        public filterService: InjectableFilterService
    ) {
        this._dataset = dashboardService.state.asDataset();

        this.dashboardService.stateSource.subscribe(() => {
            this._dataset = this.dashboardService.state.asDataset();
            this.clearEveryFilterClause();
        });

        if (!this.filterClauses.length) {
            this.addBlankFilterClause();
        }
    }

    /**
     * Adds a blank filter clause to the global list.
     */
    public addBlankFilterClause(): void {
        let filterClause: FilterClauseMetaData = new FilterClauseMetaData();
        filterClause.updateDatastores(this._dataset);
        filterClause.field = FieldConfig.get();
        filterClause.operator = this.operators[0];
        filterClause.value = '';

        // Set the default database, table, and field based on an existing filter clause in the component, if any.
        let existingFilterClause: FilterClauseMetaData = this.filterClauses.length ? this.filterClauses[0] : null;
        filterClause.databases = existingFilterClause ? existingFilterClause.databases : filterClause.databases;
        filterClause.tables = existingFilterClause ? existingFilterClause.tables : filterClause.tables;
        filterClause.fields = existingFilterClause ? existingFilterClause.fields : filterClause.fields;
        filterClause.changeDatabase = existingFilterClause ? existingFilterClause.changeDatabase : filterClause.database;
        this.handleChangeDatabaseOfClause(filterClause);
        filterClause.changeTable = existingFilterClause ? existingFilterClause.changeTable : filterClause.table;
        this.handleChangeTableOfClause(filterClause);
        filterClause.changeField = existingFilterClause ? existingFilterClause.changeField : filterClause.field;
        this.handleChangeFieldOfClause(filterClause);

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
     * Updates the database, tables, and fields in the given clause.
     *
     * @arg {FilterClauseMetaData} filterClause
     */
    public handleChangeDatabaseOfClause(filterClause: FilterClauseMetaData): void {
        if (filterClause.changeDatabase && filterClause.changeDatabase.name) {
            filterClause.database = filterClause.changeDatabase;
            filterClause.updateTables(this._dataset);
            filterClause.changeTable = filterClause.table;
        }
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
        if (filterClause.changeField && filterClause.changeField.columnName) {
            filterClause.field = filterClause.changeField;
        }
    }

    /**
     * Updates the table and fields in the given clause.
     *
     * @arg {FilterClauseMetaData} filterClause
     */
    public handleChangeTableOfClause(filterClause: FilterClauseMetaData): void {
        if (filterClause.changeTable && filterClause.changeTable.name) {
            filterClause.table = filterClause.changeTable;
            filterClause.updateFields();
        }
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

        // Gather the filter clauses by unique filter source (datastore + database + table + field + operator).
        const filterSources: string[] = this.filterClauses.reduce((list, filterClause) => {
            const source = filterClause.operator.value + '.' + filterClause.datastore.name + '.' + filterClause.database.name + '.' +
                filterClause.table.name + '.' + filterClause.field.columnName;
            if (list.indexOf(source) < 0) {
                list.push(source);
            }
            return list;
        }, []);

        const type = this.compoundTypeIsOr ? CompoundFilterType.OR : CompoundFilterType.AND;

        // Turn the filter clauses into list filter designs on the values of each unique filter source.
        let filterDesigns: ListFilterDesign[] = filterSources.map((source) => {
            const [operator, datastore, database, table, ...fieldArray] = source.split('.');
            const field = fieldArray.join('.');
            const filterClauses = this.filterClauses.filter((filterClause) => filterClause.datastore.name === datastore &&
                filterClause.database.name === database && filterClause.table.name === table && filterClause.field.columnName === field &&
                filterClause.operator.value === operator);
            const values = filterClauses.map((filterClause) => {
                if (filterClause.operator.value !== 'contains' && filterClause.operator.value !== 'not contains') {
                    let floatValue = parseFloat(filterClause.value);
                    // The second check catches values larger than Number.MAX_SAFE_INT
                    if (isNaN(floatValue) || floatValue.toString() !== filterClause.value) {
                        return filterClause.value;
                    }
                    return floatValue;
                }
                return filterClause.value;
            });

            return new ListFilterDesign(type, datastore + '.' + database + '.' + table + '.' + field, operator, values);
        });

        // Create a compound filter design from multiple list filters designs if needed.
        let filterDesign: AbstractFilterDesign = !filterDesigns.length ? null : (filterDesigns.length === 1 ? filterDesigns[0] :
            new CompoundFilterDesign(type, filterDesigns));

        if (filterDesign) {
            this.filterService.createFilters('CustomFilter', [filterDesign], this._dataset);
            this.clearEveryFilterClause();
        }
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
}

class OperatorMetaData {
    value: string;
    prettyName: string;
}

class FilterClauseMetaData extends OptionCollection {
    changeDatabase: DatabaseConfig;
    changeTable: TableConfig;
    changeField: FieldConfig;
    field: FieldConfig;
    operator: OperatorMetaData;
    value: string;
}
