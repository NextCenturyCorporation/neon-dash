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
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData, TableMetaData, DatabaseMetaData } from '../../dataset';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import * as neon from 'neon-framework';

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

    public clauses: FilterClauseMetaData[] = [];
    public databaseTableFieldKeysToFilterIds: Map<string, string> = new Map<string, string>();
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

    public counter: number = 0;

    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService
    ) {

        super(
            activeGridService,
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            ref,
            visualizationService
        );

        this.isExportable = false;

        // Backwards compatibility (initialFilters deprecated due to its redundancy with clauseConfig).
        this.options.clauseConfig = this.options.clauseConfig || this.injector.get('initialFilters', []);
    }

    /**
     * Adds a blank filter clause to the global list.
     */
    addBlankFilterClause() {
        let clause: FilterClauseMetaData = this.updateDatabasesInOptions(new FilterClauseMetaData());
        clause.database = this.options.database;
        clause.table = this.options.table;
        clause.field = this.createEmptyField();
        clause.operator = this.operators[0];
        clause.value = '';
        clause.active = false;
        clause.id = ++this.counter;
        clause.changeDatabase = clause.database;
        clause.changeTable = clause.table;
        clause.changeField = clause.field;
        if (clause.database && clause.table) {
            this.clauses.push(clause);
        }
    }

    /**
     * Adds the given filter to this visualization or replaces the existing filter in this visualization.
     */
    addOrReplaceFilter(executeQueryChainOnsuccess: boolean, filter: CustomFilter) {
        if (!filter.clauses || !filter.clauses.length) {
            return;
        }
        let onSuccess = (neonFilterId) => {
            this.databaseTableFieldKeysToFilterIds.set(filter.databaseTableFieldKey, neonFilterId);
        };
        let onError = (err) => {
            console.error(err);
        };
        let databaseName = filter.clauses[0].database.name;
        let tableName = filter.clauses[0].table.name;
        let fieldName = filter.clauses[0].field.columnName;

        if (filter.filterId) {
            this.filterService.replaceFilter(
                this.messenger,
                filter.filterId,
                this.id,
                databaseName,
                tableName,
                this.createNeonFilter(databaseName, tableName, fieldName),
                this.createFilterNameObject(),
                onSuccess.bind(this),
                onError.bind(this));
        } else {
            this.filterService.addFilter(
                this.messenger,
                this.id,
                databaseName,
                tableName,
                this.createNeonFilter(databaseName, tableName, fieldName),
                this.createFilterNameObject(),
                onSuccess.bind(this),
                onError.bind(this)
            );
        }
    }

    createClauseBindings(): any[] {
        return this.clauses.filter((clause) => {
            return clause.active;
        }).map((clause) => {
            let filterId = this.databaseTableFieldKeysToFilterIds.get(this.getDatabaseTableFieldKey(clause.database.name,
                clause.table.name, clause.field.columnName));
            return {
                database: clause.database.name,
                table: clause.table.name,
                field: clause.field.columnName,
                operator: clause.operator.value,
                value: clause.value,
                id: filterId
            };
        });
    }

    /**
     * Creates and returns an array of field options for the unique widget.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [];
    }

    /**
     * Creates and returns the filter name object for the visualization.
     *
     * @return {any}
     */
    createFilterNameObject(): any {
        return {
            visName: this.options.title,
            text: this.getFilterText(null)
        };
    }

    /**
     * Creates and returns a neon filter object for the given database, table, and field names.
     *
     * @arg {string} database
     * @arg {string} table
     * @arg {string} field
     * @return neon.query.WherePredicate
     */
    createNeonFilter(database: string, table: string, field: string): neon.query.WherePredicate {
        let databaseTableFieldKey = this.getDatabaseTableFieldKey(database, table, field);
        let activeMatchingClauses = this.clauses.filter((clause) => {
            let clauseDatabaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
                clause.field.columnName);
            return databaseTableFieldKey === clauseDatabaseTableFieldKey && this.validateClause(clause) && clause.active;
        });

        let filterClauses = activeMatchingClauses.map((clause) => {
            let operator = clause.operator.value;
            let value: any = clause.value;
            if (operator !== 'contains' && operator !== 'not contains') {
                value = parseFloat(clause.value);
                if (isNaN(value) || value.toString() !== clause.value) { // The second check catches values larger than Number.MAX_SAFE_INT
                    value = clause.value;
                }
            }
            return neon.query.where(clause.field.columnName, operator, value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.options.requireAll) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    }

    /**
     * Creates and returns an array of non-field options for the unique widget.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        let clauseConfigOption = new WidgetNonPrimitiveOption('clauseConfig', 'Clause Config', []);
        clauseConfigOption.getValueToSaveInBindings = this.createClauseBindings.bind(this);
        return [
            new WidgetSelectOption('requireAll', 'Filter Operator', false, OptionChoices.OrFalseAndTrue),
            clauseConfigOption
        ];
    }

    /**
     * Creates and returns the query for the visualization.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        return null;
    }

    /**
     * Returns the filter list for the visualization.
     *
     * @return {any[]}
     * @override
     */
    getCloseableFilters(): any[] {
        return [];
    }

    /**
     * Returns the key for the given database/table/field names.
     *
     * @arg {string} database
     * @arg {string} table
     * @arg {string} field
     * @return {string}
     */
    getDatabaseTableFieldKey(database, table, field): string {
        return database + '-' + table + '-' + field;
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} visualization
     * @override
     */
    getElementRefs(): any {
        return {
            visualization: this.visualization,
            headerText: this.headerText
        };
    }

    /**
     * Returns the list of filter IDs for the visualization to ignore (or null to ignore no filters).
     *
     * @return {string[]}
     * @override
     */
    getFiltersToIgnore(): string[] {
        return null;
    }

    /**
     * Returns the filter text for the visualization.
     *
     * @arg {any} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        let activeClauses = this.clauses.filter((clause) => {
            return this.validateClause(clause) && clause.active;
        });
        return activeClauses.length === 1 ? (activeClauses[0].field.prettyName + ' ' + activeClauses[0].operator.prettyName + ' ' +
            activeClauses[0].value) : (activeClauses.length + ' Filters');
    }

    /**
     * Returns the default limit for the unique widget.
     *
     * @return {string}
     * @override
     */
    getWidgetDefaultLimit(): number {
        return 0;
    }

    /**
     * Returns the name for the unique widget.
     *
     * @return {string}
     * @override
     */
    getWidgetName(): string {
        return 'Filter Builder';
    }

    /**
     * Updates the active status, tables, fields, and value in the given clause and the filters.
     *
     * @arg {FilterClauseMetaData} clause
     */
    handleChangeDatabaseOfClause(clause: FilterClauseMetaData) {
        let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
            clause.field.columnName);

        clause.active = false;
        clause.database = clause.changeDatabase;
        this.updateTablesInOptions(clause);
        clause.changeTable = clause.table;

        if (this.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey)) {
            this.updateFiltersOfKey(databaseTableFieldKey);
        }
    }

    /**
     * Updates the active status of the given clause.
     *
     * @arg {FilterClauseMetaData} clause
     */
    handleChangeDataOfClause(clause: FilterClauseMetaData) {
        if (clause.active) {
            clause.active = false;
            let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
                clause.field.columnName);
            this.updateFiltersOfKey(databaseTableFieldKey);
        }
    }

    /**
     * Updates the active status and value in the given clause and the filters.
     *
     * @arg {FilterClauseMetaData} clause
     */
    handleChangeFieldOfClause(clause: FilterClauseMetaData) {
        let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
            clause.field.columnName);

        clause.active = false;
        clause.field = clause.changeField;

        if (this.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey)) {
            this.updateFiltersOfKey(databaseTableFieldKey);
        }
    }

    /**
     * Updates the active status, fields, and value in the given clause and the filters.
     *
     * @arg {FilterClauseMetaData} clause
     */
    handleChangeTableOfClause(clause: FilterClauseMetaData) {
        let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
            clause.field.columnName);

        clause.active = false;
        clause.table = clause.changeTable;
        this.updateFieldsInOptions(clause);

        if (this.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey)) {
            this.updateFiltersOfKey(databaseTableFieldKey);
        }
    }

    /**
     * Handles behavior following a change in the filter state.
     *
     * @override
     */
    handleFiltersChangedEvent() {
        // Do nothing.  No query.
    }

    /**
     * Returns whether the query for the visualization is valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        return false;
    }

    /**
     * Handles the query results for the visualization.
     *
     * @arg {any} response
     * @override
     */
    onQuerySuccess(response: any) {
        // Do nothing.  No query.
    }

    /**
     * Handles any post-initialization behavior needed.
     *
     * @override
     */
    postInit() {
        this.options.databases.forEach((database) => {
            database.tables.forEach((table) => {
                table.fields.forEach((field) => {
                    let databaseTableFieldKey = this.getDatabaseTableFieldKey(database.name, table.name, field.columnName);
                    this.databaseTableFieldKeysToFilterIds.set(databaseTableFieldKey, '');
                });
            });
        });

        this.options.clauseConfig.forEach((clauseConfig) => {
            let clause: FilterClauseMetaData = this.updateDatabasesInOptions(new FilterClauseMetaData());
            clause.database = clause.databases.find((database) => {
                return database.name === clauseConfig.database;
            });
            this.updateTablesInOptions(clause);
            clause.table = clause.tables.find((table) => {
                return table.name === clauseConfig.table;
            });
            this.updateFieldsInOptions(clause);
            clause.field = clause.fields.find((field) => {
                return field.columnName === clauseConfig.field;
            });
            clause.operator = this.operators.find((operator) => {
                return operator.value === clauseConfig.operator;
            });
            clause.value = clauseConfig.value;
            clause.active = true;
            clause.id = ++this.counter;
            clause.changeDatabase = clause.database;
            clause.changeTable = clause.table;
            clause.changeField = clause.field;
            if (clause.database && clause.table) {
                let filterId = clauseConfig.id || this.filterService.createFilterId(clauseConfig.database, clauseConfig.table);
                this.clauses.push(clause);
                this.databaseTableFieldKeysToFilterIds.set(this.getDatabaseTableFieldKey(clause.database.name,
                    clause.table.name, clause.field.columnName), filterId);
            }
        });

        if (!this.clauses.length) {
            this.addBlankFilterClause();
        } else {
            this.updateFilters();
        }
    }

    /**
     * Redraws the visualization.
     *
     * @override
     */
    refreshVisualization() {
        // Do nothing.
    }

    /**
     * Removes the given filter clause from neon and this visualization.
     *
     * @arg {FilterClauseMetaData} clause
     */
    removeClause(clause: FilterClauseMetaData) {
        this.clauses = this.clauses.filter((clauseFromList) => {
            return clause.id !== clauseFromList.id;
        });

        let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
            clause.field.columnName);

        if (this.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey)) {
            let shouldReplace = this.clauses.some((clauseFromList) => {
                return databaseTableFieldKey === this.getDatabaseTableFieldKey(clauseFromList.database.name,
                    clauseFromList.table.name, clauseFromList.field.columnName);
            });

            if (shouldReplace) {
                this.filterService.replaceFilter(
                    this.messenger,
                    this.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey),
                    this.id,
                    clause.database.name,
                    clause.table.name,
                    this.createNeonFilter(clause.database.name, clause.table.name, clause.field.columnName),
                    this.createFilterNameObject()
                );
            } else {
                this.removeFilterById(databaseTableFieldKey);
            }
        }

        if (!this.clauses.length) {
            this.addBlankFilterClause();
        }
    }

    /**
     * Removes the given visualization filter object from this visualization.
     *
     * @override
     */
    removeFilter(filter: any) {
        // Do nothing.  Handle filters internally.
    }

    /**
     * Removes the filters with the given key.
     *
     * @arg {string} databaseTableFieldKey
     */
    removeFilterById(databaseTableFieldKey: string) {
        this.filterService.removeFilters(
            this.messenger,
            [this.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey)],
            () => {
                this.databaseTableFieldKeysToFilterIds.set(databaseTableFieldKey, '');
            }
        );
    }

    /**
     * Resets the filter builder by removing all filters.
     */
    resetFilterBuilder() {
        let callback = () => {
            this.clauses = [];
            this.addBlankFilterClause();
        };
        let filterIds = [];
        this.databaseTableFieldKeysToFilterIds.forEach((filterId, databaseTableFieldKey) => {
            if (filterId) {
                filterIds.push(filterId);
            }
        });
        this.filterService.removeFilters(this.messenger, filterIds, callback.bind(this));
    }

    /**
     * Updates the filters for the visualization on initialization or whenever filters are changed externally.
     *
     * @override
     */
    setupFilters() {
        // Do nothing.
    }

    /**
     * Deletes any properties and/or sub-components as needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // Do nothing.
    }

    /**
     * Initializes any properties and/or sub-components needed once databases, tables, fields, and other options properties are set.
     *
     * @override
     */
    subNgOnInit() {
        // Do nothing.
    }

    /**
     * Toggles the active status of the given filter clause.
     *
     * @arg {FilterClauseMetaData} clause
     */
    toggleClause(clause: FilterClauseMetaData) {
        if (clause.active) {
            clause.active = false;
            let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
                clause.field.columnName);
            this.updateFiltersOfKey(databaseTableFieldKey);
        } else if (this.validateClause(clause)) {
            clause.active = true;
            let databaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
                clause.field.columnName);
            this.updateFiltersOfKey(databaseTableFieldKey);
        }
    }

    /**
     * Updates all filters.
     */
    updateFilters() {
        this.databaseTableFieldKeysToFilterIds.forEach((filterId, databaseTableFieldKey) => {
            this.updateFiltersOfKey(databaseTableFieldKey);
        });
    }

    /**
     * Updates all filters with the given key, either adding/replacing them or removing them as needed.
     */
    updateFiltersOfKey(databaseTableFieldKey: string) {
        let filterId = this.databaseTableFieldKeysToFilterIds.get(databaseTableFieldKey);
        let activeMatchingClauses = this.clauses.filter((clause) => {
            let clauseDatabaseTableFieldKey = this.getDatabaseTableFieldKey(clause.database.name, clause.table.name,
                clause.field.columnName);
            return databaseTableFieldKey === clauseDatabaseTableFieldKey && this.validateClause(clause) && clause.active;
        });
        if (activeMatchingClauses.length) {
            this.addOrReplaceFilter(false, new CustomFilter(activeMatchingClauses, databaseTableFieldKey, filterId));
        } else {
            this.removeFilterById(databaseTableFieldKey);
        }
    }

    /**
     * Returns the validity of the given clause.
     *
     * @arg {FilterClauseMetaData} clause
     */
    validateClause(clause: FilterClauseMetaData) {
        return clause.database && clause.table && clause.field && clause.field.columnName;
    }
}

class OperatorMetaData {
    value: string;
    prettyName: string;
}

class FilterClauseMetaData {
    active: boolean;
    changeDatabase: DatabaseMetaData;
    changeTable: TableMetaData;
    changeField: FieldMetaData;
    database: DatabaseMetaData;
    databases: DatabaseMetaData[] = [];
    field: FieldMetaData;
    fields: FieldMetaData[] = [];
    id: number;
    operator: OperatorMetaData;
    table: TableMetaData;
    tables: TableMetaData[] = [];
    value: string;
}

class CustomFilter {
    clauses: FilterClauseMetaData[];
    databaseTableFieldKey: string;
    filterId: string;

    constructor(clauses: FilterClauseMetaData[], databaseTableFieldKey: string, filterId: string) {
        this.clauses = clauses;
        this.databaseTableFieldKey = databaseTableFieldKey;
        this.filterId = filterId;
    }
}
