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
    Component,
    ViewEncapsulation
} from '@angular/core';

import { CompoundFilterConfig, FilterConfig, SimpleFilterConfig } from '../../models/filter';
import { CompoundFilterType } from '../../models/widget-option';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { DashboardService } from '../../services/dashboard.service';

import { Dataset, NeonFieldMetaData, NeonTableMetaData, NeonDatabaseMetaData } from '../../models/dataset';
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
        filterClause.field = NeonFieldMetaData.get();
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
        filterClause.database = filterClause.changeDatabase;
        filterClause.updateTables(this._dataset);
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
        filterClause.updateFields();
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

        // Turn the filter clauses into filter configs.
        let filterConfigs: SimpleFilterConfig[] = this.filterClauses.map((filterClause) => {
            let value: any = filterClause.value;
            if (filterClause.operator.value !== 'contains' && filterClause.operator.value !== 'not contains') {
                value = parseFloat(filterClause.value);
                // The second check catches values larger than Number.MAX_SAFE_INT
                if (isNaN(value) || value.toString() !== filterClause.value) {
                    value = filterClause.value;
                }
            }
            return {
                datastore: filterClause.datastore.name,
                database: filterClause.database.name,
                table: filterClause.table.name,
                field: filterClause.field.columnName,
                operator: filterClause.operator.value,
                value: value
            } as SimpleFilterConfig;
        });

        // Create a compound filter from multiple filters if needed.
        let filterConfig: FilterConfig = !filterConfigs.length ? null : (filterConfigs.length === 1 ? filterConfigs[0] : {
            type: this.compoundTypeIsOr ? CompoundFilterType.OR : CompoundFilterType.AND,
            filters: filterConfigs
        } as CompoundFilterConfig);

        if (filterConfig) {
            this.filterService.toggleFilters('CustomFilter', [filterConfig], this._dataset);
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
    changeDatabase: NeonDatabaseMetaData;
    changeTable: NeonTableMetaData;
    changeField: NeonFieldMetaData;
    field: NeonFieldMetaData;
    operator: OperatorMetaData;
    value: string;
}
