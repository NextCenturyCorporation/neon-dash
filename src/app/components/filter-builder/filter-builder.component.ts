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

import { AbstractSearchService, CompoundFilterType } from '../../services/abstract.search.service';
import { CompoundFilterDesign, FilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { DashboardService } from '../../services/dashboard.service';

import { DashboardState } from '../../model/dashboard-state';
import { NeonFieldMetaData, NeonTableMetaData, NeonDatabaseMetaData } from '../../model/types';
import {
    WidgetOptionCollection
} from '../../model/widget-option';

import { eventing } from 'neon-framework';
import { neonEvents } from '../../model/neon-namespaces';

@Component({
    selector: 'app-filter-builder',
    templateUrl: './filter-builder.component.html',
    styleUrls: ['./filter-builder.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class FilterBuilderComponent {
    protected messenger: eventing.Messenger;
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

    readonly dashboardState: DashboardState;

    constructor(
        public dashboardService: DashboardService,
        public filterService: FilterService,
        public searchService: AbstractSearchService
    ) {
        this.messenger = new eventing.Messenger();
        this.messenger.subscribe(neonEvents.DASHBOARD_RESET, this.clearEveryFilterClause.bind(this));

        this.dashboardState = dashboardService.state;

        this.addBlankFilterClause();
    }

    /**
     * Adds a blank filter clause to the global list.
     */
    public addBlankFilterClause(): void {
        let filterClause: FilterClauseMetaData = new FilterClauseMetaData(() => []);
        filterClause.updateDatabases(this.dashboardState);
        filterClause.field = NeonFieldMetaData.get();
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

class FilterClauseMetaData extends WidgetOptionCollection {
    changeDatabase: NeonDatabaseMetaData;
    changeTable: NeonTableMetaData;
    changeField: NeonFieldMetaData;
    field: NeonFieldMetaData;
    operator: OperatorMetaData;
    value: string;
}
