import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ChangeDetectorRef
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {FieldMetaData, TableMetaData, DatabaseMetaData} from '../../dataset';
//import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
//import * as _ from 'lodash';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';


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
        table: string,
    };

    public active: {
        operators: OperatorMetaData[],
        andor: string,
        whereClauses: WhereClauseMetaData[],
        filterIds: string[],
    };

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, ref: ChangeDetectorRef) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
        };

        this.active = {
            operators: [],
            andor: 'and',
            whereClauses: [],
            filterIds: [],
        };

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
    };

    subNgOnInit() {
        this.addBlankWhereClause();
    };

    postInit() {
        //Do nothing
    };

    subNgOnDestroy() {
        //Do nothing
    };

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    };

    onUpdateFields() {
        //TODO pull in filters from previous filter builder??  maybe?
    };

    addBlankWhereClause() {
        let field = (this.meta.fields.length >= 0 ? this.meta.fields[0] : null);
        let clause: WhereClauseMetaData = {
            database: this.meta.database,
            table: this.meta.table,
            field: field,
            operator: this.active.operators[0],
            value: '',
            active: false
        };
        this.active.whereClauses.push(clause);
    };

    removeClause(i) {
        this.active.whereClauses.splice(i, 1);
        if (this.active.whereClauses.length === 0) {
            this.addBlankWhereClause();
        }

        //this.updateFilters();
    }

    activateClause(i) {
        this.active.whereClauses[i].active = true;
        this.updateFilters();
    }

    refreshClause(_i) {
        this.updateFilters();
    }

    andOrChanged() {
        this.updateFilters();
    }

    updateFilters() {
        //This process seems unnecessarily inefficient.  I sort the clauses just so i know how many times I need to call add neon filter.
        //Later, I need to sort them again.
        let cls = {};
        //organize clauses by database/field combinations
        for (let clause of this.active.whereClauses) {
            if (clause.active) {
                let dt = this.getDatabaseTableKey(clause.database.name, clause.table.name);
                let set = cls[dt];
                if (!set) {
                    set = [];
                    cls[dt] = set;
                }
                set.push(clause);
            }
        }

        //Remove any filters that we've saved but no longer have the database/table combo
        //figure out what filters to remove
        let removeFilters = [];
        for (let key in this.active.filterIds) {
            if (this.active.filterIds.hasOwnProperty(key)) {
                if (!cls[key]) {
                    removeFilters.push(this.active.filterIds[key]);
                }
            }
        }

        //remove the filters
        if (removeFilters.length > 0) {
            this.filterService.removeFiltersForKeys(removeFilters, () => {
                //on success, clear out the filters
                let temp = [];
                for (let id of this.active.filterIds) {
                    if (removeFilters.indexOf(id) === -1) {
                        temp.push(id);
                    }
                }
                this.active.filterIds = temp;
            });
        }
        //add the existing filters
        for (let key in cls) {
            if (cls.hasOwnProperty(key)) {
                let clauses = cls[key];
                if (clauses && clauses.length > 0) {
                    this.addNeonFilter(clauses);
                }
            }
        }
    }

    resetFilterBuilder() {
        let callback = () => {
            this.active.filterIds = [];
            this.active.whereClauses = [];
            this.active.andor = 'and';
            this.addBlankWhereClause();
        };
        this.filterService.removeFiltersForKeys(this.active.filterIds, callback.bind(this));
    }

    getDatabaseTableKey(database, table) {
        return database + '-' + table;
    }

    /*
    * Assumes all clauses passed in have the same database/table combination
    */
    addNeonFilter(clauses: WhereClauseMetaData[]) {
        if (!clauses || clauses.length === 0) {
            return;
        }
        let database = clauses[0].database.name;
        let table = clauses[0].table.name;
        let fields: string[] = clauses.map((clause) => {
            return clause.field.columnName;
        });
        let databaseTableKey = this.getDatabaseTableKey(database, table);
        let text = database + ' - ' + table + ' - filter';
        let visName = this.getVisualizationName();
        let onSuccess = () => {
            let filters = this.filterService.getFilters(database, table, fields, true);
            for (let filter of filters) {
                let name = filter.filter.filterName;
                if (name.indexOf(FilterService.FILTER_BUILDER_PREFIX) === 0) {
                    this.active.filterIds[databaseTableKey] = filter.id;
                }
            }
        };
        let onFailure = () => {
            console.log('filter failed to set');
        };

        let filterId = this.active.filterIds[databaseTableKey];

        if (filterId) {
            this.filterService.replaceFilterById(this.messenger, database, table, fields, this.createNeonFilterClauseEquals.bind(this),
                {
                    visName: visName,
                    text: text
                }, filterId, onSuccess.bind(this),
                onFailure.bind(this));
        } else {
            this.filterService.addFilter(this.messenger, database, table, fields,
                this.createNeonFilterClauseEquals.bind(this),
                {
                    visName: visName,
                    text: text
                }
                , onSuccess.bind(this),
                onFailure.bind(this)
            );
        }

    };

    createNeonFilterClauseEquals(databaseAndTableName: { table: string, database: string }, _fieldName: string) {
        let table = databaseAndTableName.table;
        let database = databaseAndTableName.database;
        let filterClauses = [];
        for (let whereClause of this.active.whereClauses) {
            if (whereClause.database.name === database && whereClause.table.name === table && whereClause.active) {
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
    };

    getNeonFilterFields(): string[] {
        //TODO
        return [''];
        //return [this.active.sortField.columnName];
    }

    getVisualizationName(): string {
        return 'Filter Builder';
    }

    refreshVisualization() {
        //constantly refreshed due to bindings.  Do nothing
    }

    isValidQuery() {
        //Don't query
        return false;
    }

    createQuery(): neon.query.Query {
        //Don't query
        return null;
    };

    getFiltersToIgnore() {
        //Don't query
        return null;
    }

    onQuerySuccess(): void {
        //Don't query
        return null;
    }

    handleFiltersChangedEvent() {
        //Do nothing
    };

    getFilterText(_filter): string {
        //Do nothing, no filters
        return '';
    };

    removeFilter(_value: string): void {
        //Do nothing, no filters
    };

    handleValueChange(_event, i) {
        if (this.active.whereClauses[i].value && this.active.whereClauses[i].value !== '') {
            //this.active.whereClauses[i].active = true;
        } else {
            this.active.whereClauses[i].active = false;
        }
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    };

    handleChangeOperator() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    };
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
}
