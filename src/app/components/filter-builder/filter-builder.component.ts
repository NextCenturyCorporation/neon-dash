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
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ChangeDetectorRef
} from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData, TableMetaData, DatabaseMetaData } from '../../dataset';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';

class FilterBuilderDatabaseTableMetadata {
    filterId: string;
    clauses: WhereClauseMetaData[];
}

@Component({
    selector: 'app-filter-builder',
    templateUrl: './filter-builder.component.html',
    styleUrls: ['./filter-builder.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterBuilderComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string
    };

    public active: {
        operators: OperatorMetaData[],
        andor: string,
        whereClauses: Map<string, FilterBuilderDatabaseTableMetadata>,
        whereClausesAsList: WhereClauseMetaData[]
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
            operators: [],
            andor: 'and',
            whereClauses: new Map<string, FilterBuilderDatabaseTableMetadata>(),
            whereClausesAsList: []
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
        this.queryTitle = 'Filter Builder';
        this.isExportable = false;
    }

    subNgOnInit() {
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
        let field = (this.meta.fields.length >= 0 ? this.meta.fields[0] : null);
        let clause: WhereClauseMetaData = {
            database: this.meta.database,
            table: this.meta.table,
            field: field,
            operator: this.active.operators[0],
            value: '',
            active: false,
            id: ++this.counter
        };
        if (clause.database && clause.table) {
            let databaseTableKey = this.getDatabaseTableKey(clause.database.name, clause.table.name);
            if (!this.active.whereClauses.get(databaseTableKey)) {
                this.active.whereClauses.set(databaseTableKey, new FilterBuilderDatabaseTableMetadata());
                this.active.whereClauses.get(databaseTableKey).clauses = [];
            }
            this.active.whereClauses.get(databaseTableKey).clauses.push(clause);
            this.active.whereClausesAsList.push(clause);
        }
    }

    removeClause(where) {
        let databaseTableKey = this.getDatabaseTableKey(where.database.name, where.table.name);
        for (let i = this.active.whereClauses.get(databaseTableKey).clauses.length - 1; i >= 0; i--) {
            let clause = this.active.whereClauses.get(databaseTableKey).clauses[i];
            if (clause.id === where.id) {
                this.active.whereClauses.get(databaseTableKey).clauses.splice(i, 1);
                break;
            }
        }
        for (let i = this.active.whereClausesAsList.length - 1; i >= 0; i--) {
            if (this.active.whereClausesAsList[i].id === where.id) {
                this.active.whereClausesAsList.splice(i, 1);
                break;
            }
        }
        if (this.active.whereClauses.get(databaseTableKey).filterId) {
            this.filterService.removeFilter(
                this.messenger,
                this.active.whereClauses.get(databaseTableKey).filterId,
                () => null);
        }
        if (this.active.whereClauses.get(databaseTableKey).clauses.length === 0) {
            this.active.whereClauses.delete(databaseTableKey);
        }
        if (this.active.whereClauses.size === 0) {
            this.addBlankWhereClause();
        }
    }

    activateClause(where) {
        let databaseTableKey = this.getDatabaseTableKey(where.database.name, where.table.name);
        let whereClauses = this.active.whereClauses.get(databaseTableKey).clauses;
        for (let clause of whereClauses) {
            if (clause.id === where.id) {
                clause.active = true;
                break;
            }
        }
        this.updateFilters();
    }

    refreshClause(where) {
        this.updateFilters();
    }

    andOrChanged() {
        this.updateFilters();
    }

    updateFilters() {
        this.active.whereClauses.forEach((value, key) => {
            let hasActiveClause = false;
            for (let index = value.clauses.length - 1; !hasActiveClause && index >= 0; index--) {
                hasActiveClause = value.clauses[index].active;
            }
            if (hasActiveClause) {
                this.addNeonFilter(false, value);
            }
        });
    }

    resetFilterBuilder() {
        let callback = () => {
            this.active.whereClauses = new Map<string, FilterBuilderDatabaseTableMetadata>();
            this.active.whereClausesAsList = [];
            this.active.andor = 'and';
            this.addBlankWhereClause();
        };
        let filterIds = [];
        this.active.whereClauses.forEach((value, key) => {
            if (value.filterId) {
                filterIds.push(value.filterId);
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
    addNeonFilter(executeQueryChainOnsuccess: boolean, databaseTableMetadata: FilterBuilderDatabaseTableMetadata) {
        let clauses = databaseTableMetadata.clauses;
        if (!clauses || clauses.length === 0) {
            return;
        }
        let database = clauses[0].database.name;
        let table = clauses[0].table.name;
        let databaseTableKey = this.getDatabaseTableKey(database, table);
        let text = database + ' - ' + table + ' - filter';
        let visName = this.getVisualizationName();
        let onSuccess = (neonFilterId) => {
            databaseTableMetadata.filterId = neonFilterId;
        };
        let onError = () => {
            console.error('filter failed to set');
        };

        let filterId = databaseTableMetadata.filterId;

        if (filterId) {
            this.filterService.replaceFilter(
                this.messenger,
                filterId,
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
        let filterClauses = [];
        for (let whereClause of this.active.whereClauses.get(this.getDatabaseTableKey(database, table)).clauses) {
            if (whereClause.active) {
                let operator = whereClause.operator.value;
                let value: any = whereClause.value;
                if (operator !== 'contains' && operator !== 'not contains') {
                    value = parseFloat(whereClause.value);
                    if (isNaN(value)) {
                        value = whereClause.value;
                    }
                }
                filterClauses.push(neon.query.where(whereClause.field.columnName, operator, value));
            }
        }
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
        return 'Filter Builder';
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

    removeFilter(): void {
        // Do nothing, no filters
    }

    handleValueChange(_event, where) {
        for (let clause of this.active.whereClauses.get(this.getDatabaseTableKey(where.database.name, where.table.name)).clauses) {
            if (clause.id === where.id) {
                if (clause.value && clause.value !== '') {
                    // TODO
                } else {
                    clause.active = false;
                }
                return;
            }
        }
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeField() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeOperator() {
        this.logChangeAndStartQueryChain();
    }
}

export class OperatorMetaData {
    value: string;
    prettyName: string;
}

export class WhereClauseMetaData {
    database: DatabaseMetaData;
    table: TableMetaData;
    field: FieldMetaData;
    operator: OperatorMetaData;
    value: string;
    active: boolean;
    id: number;
}
