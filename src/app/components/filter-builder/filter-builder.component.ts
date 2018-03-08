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
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService, ServiceFilter } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData, TableMetaData, DatabaseMetaData } from '../../dataset';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';

@Component({
    selector: 'app-filter-builder',
    templateUrl: './filter-builder.component.html',
    styleUrls: ['./filter-builder.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterBuilderComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string
    };

    public active: {
        andor: string,
        clauses: WhereClauseMetaData[],
        databaseTableKeysToFilterIds: Map<string, string>,
        operators: OperatorMetaData[]
    };

    private counter: number;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService) {

        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);

        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null)
        };

        this.active = {
            andor: 'and',
            clauses: [],
            databaseTableKeysToFilterIds: new Map<string, string>(),
            operators: []
        };

        this.counter = -1;

        this.active.operators.push({ value: '=', prettyName: '=' });
        this.active.operators.push({ value: '!=', prettyName: '!=' });
        this.active.operators.push({ value: '>', prettyName: '>' });
        this.active.operators.push({ value: '<', prettyName: '<' });
        this.active.operators.push({ value: '>=', prettyName: '>=' });
        this.active.operators.push({ value: '<=', prettyName: '<=' });
        this.active.operators.push({ value: 'contains', prettyName: 'contains' });
        this.active.operators.push({ value: 'not contains', prettyName: 'not contains' });
        this.isExportable = false;
    }

    subNgOnInit() {
        this.meta.databases.forEach((database) => {
            database.tables.forEach((table) => {
                let databaseTableKey = this.getDatabaseTableKey(database.name, table.name);
                this.active.databaseTableKeysToFilterIds.set(databaseTableKey, '');
            });
        });
        this.addBlankWhereClause();
    }

    postInit() {
        // Do nothing
    }

    subNgOnDestroy() {
        // Do nothing
    }

    getExportFields() {
        // Do nothing.  Doesn't export nor does this visualization register to export
        // therefore, this function can be ignored.
        return null;
    }

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    onUpdateFields() {
        // TODO pull in filters from previous filter builder?  maybe?
    }

    subGetBindings(bindings: any) {
        // TODO
    }

    addBlankWhereClause() {
        let clause: WhereClauseMetaData = {
            changeDatabase: this.meta.database,
            changeTable: this.meta.table,
            databases: this.meta.databases,
            database: this.meta.database,
            tables: this.meta.tables,
            table: this.meta.table,
            fields: this.meta.fields,
            field: null,
            operator: this.active.operators[0],
            value: '',
            active: false,
            id: ++this.counter
        };
        if (clause.database && clause.table) {
            this.active.clauses.push(clause);
        }
    }

    removeClause(clause) {
        this.active.clauses = this.active.clauses.filter((clauseFromList) => {
            return clause.id !== clauseFromList.id;
        });

        let databaseTableKey = this.getDatabaseTableKey(clause.database.name, clause.table.name);
        if (this.active.databaseTableKeysToFilterIds.get(databaseTableKey)) {
            this.removeFilterById(databaseTableKey);
        }

        if (!this.active.clauses.length) {
            this.addBlankWhereClause();
        }
    }

    activateClause(clause) {
        if (this.validateClause(clause)) {
            clause.active = true;
            this.updateFilters();
        }
    }

    updateFilters() {
        this.active.databaseTableKeysToFilterIds.forEach((filterId, databaseTableKey) => {
            let activeClauses = this.active.clauses.filter((clause) => {
                let clauseDatabaseTableKey = this.getDatabaseTableKey(clause.database.name, clause.table.name);
                return databaseTableKey === clauseDatabaseTableKey && this.validateClause(clause) && clause.active;
            });
            if (activeClauses.length) {
                this.addNeonFilter(false, new CustomFilter(activeClauses, databaseTableKey, filterId));
            } else if (filterId) {
                this.removeFilterById(databaseTableKey);
            }
        });
    }

    resetFilterBuilder() {
        let callback = () => {
            this.active.clauses = [];
            this.active.andor = 'and';
            this.addBlankWhereClause();
        };
        let filterIds = [];
        this.active.databaseTableKeysToFilterIds.forEach((filterId, databaseTableKey) => {
            if (filterId) {
                filterIds.push(filterId);
            }
        });
        this.filterService.removeFilters(this.messenger, filterIds, callback.bind(this));
    }

    getDatabaseTableKey(database, table) {
        return database + '-' + table;
    }

    /*
    * Assumes all clauses passed in have the same database/table combination
    */
    addNeonFilter(executeQueryChainOnsuccess: boolean, filter: CustomFilter) {
        if (!filter.clauses || filter.clauses.length === 0) {
            return;
        }
        let database = filter.clauses[0].database.name;
        let table = filter.clauses[0].table.name;
        let text = database + ' - ' + table + ' - filter';
        let visName = this.getVisualizationName();
        let onSuccess = (neonFilterId) => {
            this.active.databaseTableKeysToFilterIds.set(filter.databaseTableKey, neonFilterId);
        };
        let onError = () => {
            console.error('filter failed to set');
        };

        if (filter.filterId) {
            this.filterService.replaceFilter(
                this.messenger,
                filter.filterId,
                this.id,
                database,
                table,
                this.createNeonFilterClauseEquals(database, table, ''),
                {
                    visName: visName,
                    text: text
                },
                onSuccess.bind(this),
                onError.bind(this));
        } else {
            this.filterService.addFilter(
                this.messenger,
                this.id,
                database,
                table,
                this.createNeonFilterClauseEquals(database, table, ''),
                {
                    visName: visName,
                    text: text
                },
                onSuccess.bind(this),
                onError.bind(this)
            );
        }

    }

    createNeonFilterClauseEquals(database: string, table: string, fieldName: string) {
        let activeClauses = this.active.clauses.filter((clause) => {
            return clause.database.name === database && clause.table.name === table && this.validateClause(clause) && clause.active;
        });
        let filterClauses = activeClauses.map((clause) => {
            let operator = clause.operator.value;
            let value: any = clause.value;
            if (operator !== 'contains' && operator !== 'not contains') {
                value = parseFloat(clause.value);
                if (isNaN(value)) {
                    value = clause.value;
                }
            }
            return neon.query.where(clause.field.columnName, operator, value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.active.andor === 'and') {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    }

    getNeonFilterFields(): string[] {
        // TODO
        return [''];
    }

    getVisualizationName(): string {
        return 'Custom Filters';
    }

    refreshVisualization() {
        // constantly refreshed due to bindings.  Do nothing
    }

    isValidQuery() {
        // Don't query
        return false;
    }

    createQuery(): neon.query.Query {
        // Don't query
        return null;
    }

    getFiltersToIgnore() {
        // Don't query
        return null;
    }

    onQuerySuccess(): void {
        // Don't query
        return null;
    }

    setupFilters() {
        // Do nothing
    }

    handleFiltersChangedEvent() {
        // Do nothing
    }

    getFilterText(_filter): string {
        // Do nothing, no filters
        return '';
    }

    removeFilter(removedFilter: ServiceFilter): void {
        // This should only be called when a Filter Builder filter is removed using the filter tray.
        let databaseTableKey = '';
        this.active.databaseTableKeysToFilterIds.forEach((value, key) => {
            if (!databaseTableKey && value === removedFilter.id) {
                databaseTableKey = key;
            }
        });
        this.active.databaseTableKeysToFilterIds.set(databaseTableKey, '');
        for (let index = this.active.clauses.length - 1; index >= 0; index --) {
            if (databaseTableKey === this.getDatabaseTableKey(this.active.clauses[index].database, this.active.clauses[index].table)) {
                this.active.clauses[index].active = false;
            }
        }
        this.active.clauses = this.active.clauses.slice(0);
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.headerText
        };
    }

    /**
     * Updates the active status, tables, fields, and value in the given clause and the filters.
     *
     * @arg {WhereClauseMetaData} clause
     */
    handleChangeDatabaseOfClause(clause: WhereClauseMetaData) {
        let databaseTableKey = this.getDatabaseTableKey(clause.database.name, clause.table.name);

        clause.active = false;
        clause.database = clause.changeDatabase;
        clause.value = '';
        super.initTables(clause);

        if (this.active.databaseTableKeysToFilterIds.get(databaseTableKey)) {
            this.updateFilters();
        }
    }

    /**
     * Updates the active status, fields, and value in the given clause and the filters.
     *
     * @arg {WhereClauseMetaData} clause
     */
    handleChangeTableOfClause(clause: WhereClauseMetaData) {
        let databaseTableKey = this.getDatabaseTableKey(clause.database.name, clause.table.name);

        clause.active = false;
        clause.table = clause.changeTable;
        clause.value = '';
        super.initFields(clause);

        if (this.active.databaseTableKeysToFilterIds.get(databaseTableKey)) {
            this.updateFilters();
        }
    }

    /**
     * Updates the active status of the given clause.
     *
     * @arg {WhereClauseMetaData} clause
     */
    handleChangeDataOfClause(clause: WhereClauseMetaData) {
        clause.active = false;
    }

    /**
     * Removes the filters with the given database-table key.
     *
     * @arg {string} databaseTableKey
     */
    removeFilterById(databaseTableKey: string) {
        this.filterService.removeFilter(this.messenger, this.active.databaseTableKeysToFilterIds.get(databaseTableKey), () => {
            this.active.databaseTableKeysToFilterIds.set(databaseTableKey, '');
        });
    }

    /**
     * Returns the validity of the given clause.
     *
     * @arg {WhereClauseMetaData} clause
     */
    validateClause(clause: WhereClauseMetaData) {
        return clause.database && clause.table && clause.field;
    }
}

class OperatorMetaData {
    value: string;
    prettyName: string;
}

class WhereClauseMetaData {
    changeDatabase: DatabaseMetaData;
    changeTable: TableMetaData;
    databases: DatabaseMetaData[];
    database: DatabaseMetaData;
    tables: TableMetaData[];
    table: TableMetaData;
    fields: FieldMetaData[];
    field: FieldMetaData;
    operator: OperatorMetaData;
    value: string;
    active: boolean;
    id: number;
}

class CustomFilter {
    clauses: WhereClauseMetaData[];
    databaseTableKey: string;
    filterId: string;

    constructor(clauses: WhereClauseMetaData[], databaseTableKey: string, filterId: string) {
        this.clauses = clauses;
        this.databaseTableKey = databaseTableKey;
        this.filterId = filterId;
    }
}
