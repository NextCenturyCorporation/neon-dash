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
        databaseTableFieldKeysToFilterIds: Map<string, string>,
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
            databaseTableFieldKeysToFilterIds: new Map<string, string>(),
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
                table.fields.forEach((field) => {
                    let databaseTableFieldKey = this.getDatabaseTableFieldKey(database.name, table.name, field.columnName);
                    this.active.databaseTableFieldKeysToFilterIds.set(databaseTableFieldKey, '');
                });
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
            changeField: this.emptyField,
            databases: this.meta.databases,
            database: this.meta.database,
            tables: this.meta.tables,
            table: this.meta.table,
            fields: this.meta.fields,
            field: this.emptyField,
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

        let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name, clause.field.columnName);

        if (this.active.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey)) {
            let shouldReplace = this.active.clauses.some((clauseFromList) => {
                return databaseTableFieldKey === this.getDatabaseTableFieldKey(clauseFromList.database.name, clauseFromList.table.name,
                    clauseFromList.field.columnName);
            });

            if (shouldReplace) {
                this.filterService.replaceFilter(
                    this.messenger,
                    this.active.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey),
                    this.id,
                    clause.database.name,
                    clause.table.name,
                    this.createNeonFilterClauseEquals(clause.database.name, clause.table.name, clause.field.columnName),
                    {
                        visName: this.getVisualizationName(),
                        text: this.getFilterName(clause)
                    }
                );
            } else {
                this.removeFilterById(databaseTableFieldKey);
            }
        }

        if (!this.active.clauses.length) {
            this.addBlankWhereClause();
        }
    }

    activateClause(clause) {
        if (this.validateClause(clause)) {
            clause.active = true;
            let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name, clause.field.columnName);
            this.updateFiltersOfKey(databaseTableFieldKey);
        }
    }

    updateFiltersOfKey(databaseTableFieldKey: string) {
        let filterId = this.active.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey);
        let activeMatchingClauses = this.active.clauses.filter((clause) => {
            let clauseDatabaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
                clause.field.columnName);
            return databaseTableFieldKey === clauseDatabaseTableFieldKey && this.validateClause(clause) && clause.active;
        });
        if (activeMatchingClauses.length) {
            this.addNeonFilter(false, new CustomFilter(activeMatchingClauses, databaseTableFieldKey, filterId));
        } else {
            this.removeFilterById(databaseTableFieldKey);
        }
    }

    updateFilters() {
        this.active.databaseTableFieldKeysToFilterIds.forEach((filterId, databaseTableFieldKey) => {
            this.updateFiltersOfKey(databaseTableFieldKey);
        });
    }

    resetFilterBuilder() {
        let callback = () => {
            this.active.clauses = [];
            this.active.andor = 'and';
            this.addBlankWhereClause();
        };
        let filterIds = [];
        this.active.databaseTableFieldKeysToFilterIds.forEach((filterId, databaseTableFieldKey) => {
            if (filterId) {
                filterIds.push(filterId);
            }
        });
        this.filterService.removeFilters(this.messenger, filterIds, callback.bind(this));
    }

    getDatabaseTableFieldKey(database, table, field) {
        return database + '-' + table + '-' + field;
    }

    // TODO Why override addNeonFilter rather than making a new function?
    /*
    * Assumes all clauses passed in have the same database/table combination
    *
    * @override
    */
    addNeonFilter(executeQueryChainOnsuccess: boolean, filter: CustomFilter) {
        if (!filter.clauses || !filter.clauses.length) {
            return;
        }
        let onSuccess = (neonFilterId) => {
            this.active.databaseTableFieldKeysToFilterIds.set(filter.databaseTableFieldKey, neonFilterId);
        };
        let onError = () => {
            console.error('filter failed to set');
        };
        let sampleClause: WhereClauseMetaData = filter.clauses[0];

        if (filter.filterId) {
            this.filterService.replaceFilter(
                this.messenger,
                filter.filterId,
                this.id,
                sampleClause.database.name,
                sampleClause.table.name,
                this.createNeonFilterClauseEquals(sampleClause.database.name, sampleClause.table.name, sampleClause.field.columnName),
                {
                    visName: this.getVisualizationName(),
                    text: this.getFilterName(sampleClause)
                },
                onSuccess.bind(this),
                onError.bind(this));
        } else {
            this.filterService.addFilter(
                this.messenger,
                this.id,
                sampleClause.database.name,
                sampleClause.table.name,
                this.createNeonFilterClauseEquals(sampleClause.database.name, sampleClause.table.name, sampleClause.field.columnName),
                {
                    visName: this.getVisualizationName(),
                    text: this.getFilterName(sampleClause)
                },
                onSuccess.bind(this),
                onError.bind(this)
            );
        }

    }

    /**
     * Returns the name of the filter using the given clause.
     *
     * @arg {WhereClauseMetaData} clause
     * @return {string}
     */
    getFilterName(clause) {
        return clause.field.prettyName + ' ' + clause.operator.prettyName + ' ' + clause.value;
    }

    createNeonFilterClauseEquals(database: string, table: string, fieldName: string) {
        let databaseTableFieldKey = this.getDatabaseTableFieldKey(database, table, fieldName);
        let activeMatchingClauses = this.active.clauses.filter((clause) => {
            let clauseDatabaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
                clause.field.columnName);
            return databaseTableFieldKey === clauseDatabaseTableFieldKey && this.validateClause(clause) && clause.active;
        });
        let filterClauses = activeMatchingClauses.map((clause) => {
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

    /**
     * Removes a filter.  (Does nothing in this visualization.)
     *
     * @override
     */
    removeFilter(filter: any) {
        // Do nothing.
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

    getFilterText(filter): string {
        // Do nothing, no filters
        return '';
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
     * Updates the filters due to the change of the AND/OR toggle if needed.
     */
    handleChangeAndOr() {
        if (this.active.clauses.length > 1) {
            this.updateFilters();
        }
    }

    /**
     * Updates the active status, tables, fields, and value in the given clause and the filters.
     *
     * @arg {WhereClauseMetaData} clause
     */
    handleChangeDatabaseOfClause(clause: WhereClauseMetaData) {
        let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name, clause.field.columnName);

        clause.active = false;
        clause.database = clause.changeDatabase;
        super.initTables(clause);

        if (this.active.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey)) {
            this.updateFiltersOfKey(databaseTableFieldKey);
        }
    }

    /**
     * Updates the active status, fields, and value in the given clause and the filters.
     *
     * @arg {WhereClauseMetaData} clause
     */
    handleChangeTableOfClause(clause: WhereClauseMetaData) {
        let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name, clause.field.columnName);

        clause.active = false;
        clause.table = clause.changeTable;
        super.initFields(clause);

        if (this.active.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey)) {
            this.updateFiltersOfKey(databaseTableFieldKey);
        }
    }

    /**
     * Updates the active status and value in the given clause and the filters.
     *
     * @arg {WhereClauseMetaData} clause
     */
    handleChangeFieldOfClause(clause: WhereClauseMetaData) {
        let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name, clause.field.columnName);

        clause.active = false;
        clause.field = clause.changeField;

        if (this.active.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey)) {
            this.updateFiltersOfKey(databaseTableFieldKey);
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
     * @arg {string} databaseTableFieldKey
     */
    removeFilterById(databaseTableFieldKey: string) {
        this.filterService.removeFilter(
            this.messenger,
            this.active.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey),
            () => {
                this.active.databaseTableFieldKeysToFilterIds.set(databaseTableFieldKey, '');
            }
        );
    }

    /**
     * Returns the validity of the given clause.
     *
     * @arg {WhereClauseMetaData} clause
     */
    validateClause(clause: WhereClauseMetaData) {
        return clause.database && clause.table && clause.field && clause.field.columnName;
    }
}

class OperatorMetaData {
    value: string;
    prettyName: string;
}

class WhereClauseMetaData {
    changeDatabase: DatabaseMetaData;
    changeTable: TableMetaData;
    changeField: FieldMetaData;
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
    databaseTableFieldKey: string;
    filterId: string;

    constructor(clauses: WhereClauseMetaData[], databaseTableFieldKey: string, filterId: string) {
        this.clauses = clauses;
        this.databaseTableFieldKey = databaseTableFieldKey;
        this.filterId = filterId;
    }
}
