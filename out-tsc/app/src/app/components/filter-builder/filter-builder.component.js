var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';
var FilterBuilderDatabaseTableMetadata = /** @class */ (function () {
    function FilterBuilderDatabaseTableMetadata() {
    }
    return FilterBuilderDatabaseTableMetadata;
}());
var FilterBuilderComponent = /** @class */ (function (_super) {
    __extends(FilterBuilderComponent, _super);
    function FilterBuilderComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) {
        var _this = _super.call(this, activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) || this;
        _this.optionsFromConfig = {
            title: _this.injector.get('title', null),
            database: _this.injector.get('database', null),
            table: _this.injector.get('table', null)
        };
        _this.active = {
            operators: [],
            andor: 'and',
            whereClauses: new Map(),
            whereClausesAsList: []
        };
        _this.counter = -1;
        _this.active.operators.push({ value: '=', prettyName: '=' });
        _this.active.operators.push({ value: '!=', prettyName: '!=' });
        _this.active.operators.push({ value: '>', prettyName: '>' });
        _this.active.operators.push({ value: '<', prettyName: '<' });
        _this.active.operators.push({ value: '>=', prettyName: '>=' });
        _this.active.operators.push({ value: '<=', prettyName: '<=' });
        _this.active.operators.push({ value: 'contains', prettyName: 'contains' });
        _this.active.operators.push({ value: 'not contains', prettyName: 'not contains' });
        _this.isExportable = false;
        return _this;
    }
    FilterBuilderComponent.prototype.subNgOnInit = function () {
        this.addBlankWhereClause();
    };
    FilterBuilderComponent.prototype.postInit = function () {
        // Do nothing
    };
    FilterBuilderComponent.prototype.subNgOnDestroy = function () {
        // Do nothing
    };
    FilterBuilderComponent.prototype.getExportFields = function () {
        // Do nothing.  Doesn't export nor does this visualization register to export
        // therefore, this function can be ignored.
        return null;
    };
    FilterBuilderComponent.prototype.getOptionFromConfig = function (field) {
        return this.optionsFromConfig[field];
    };
    FilterBuilderComponent.prototype.onUpdateFields = function () {
        // TODO pull in filters from previous filter builder?  maybe?
    };
    FilterBuilderComponent.prototype.subGetBindings = function (bindings) {
        // TODO
    };
    FilterBuilderComponent.prototype.addBlankWhereClause = function () {
        var field = (this.meta.fields.length >= 0 ? this.meta.fields[0] : null);
        var clause = {
            database: this.meta.database,
            table: this.meta.table,
            field: field,
            operator: this.active.operators[0],
            value: '',
            active: false,
            id: ++this.counter
        };
        if (clause.database && clause.table) {
            var databaseTableKey = this.getDatabaseTableKey(clause.database.name, clause.table.name);
            if (!this.active.whereClauses.get(databaseTableKey)) {
                this.active.whereClauses.set(databaseTableKey, new FilterBuilderDatabaseTableMetadata());
                this.active.whereClauses.get(databaseTableKey).clauses = [];
            }
            this.active.whereClauses.get(databaseTableKey).clauses.push(clause);
            this.active.whereClausesAsList.push(clause);
        }
    };
    FilterBuilderComponent.prototype.removeClause = function (where) {
        var databaseTableKey = this.getDatabaseTableKey(where.database.name, where.table.name);
        for (var i = this.active.whereClauses.get(databaseTableKey).clauses.length - 1; i >= 0; i--) {
            var clause = this.active.whereClauses.get(databaseTableKey).clauses[i];
            if (clause.id === where.id) {
                this.active.whereClauses.get(databaseTableKey).clauses.splice(i, 1);
                break;
            }
        }
        for (var i = this.active.whereClausesAsList.length - 1; i >= 0; i--) {
            if (this.active.whereClausesAsList[i].id === where.id) {
                this.active.whereClausesAsList.splice(i, 1);
                break;
            }
        }
        if (this.active.whereClauses.get(databaseTableKey).filterId) {
            this.filterService.removeFilter(this.messenger, this.active.whereClauses.get(databaseTableKey).filterId, function () { return null; });
        }
        if (this.active.whereClauses.get(databaseTableKey).clauses.length === 0) {
            this.active.whereClauses.delete(databaseTableKey);
        }
        if (this.active.whereClauses.size === 0) {
            this.addBlankWhereClause();
        }
    };
    FilterBuilderComponent.prototype.activateClause = function (where) {
        var databaseTableKey = this.getDatabaseTableKey(where.database.name, where.table.name);
        var whereClauses = this.active.whereClauses.get(databaseTableKey).clauses;
        for (var _i = 0, whereClauses_1 = whereClauses; _i < whereClauses_1.length; _i++) {
            var clause = whereClauses_1[_i];
            if (clause.id === where.id) {
                clause.active = true;
                break;
            }
        }
        this.updateFilters();
    };
    FilterBuilderComponent.prototype.refreshClause = function (where) {
        this.updateFilters();
    };
    FilterBuilderComponent.prototype.andOrChanged = function () {
        this.updateFilters();
    };
    FilterBuilderComponent.prototype.updateFilters = function () {
        var _this = this;
        this.active.whereClauses.forEach(function (value, key) {
            var hasActiveClause = false;
            for (var index = value.clauses.length - 1; !hasActiveClause && index >= 0; index--) {
                hasActiveClause = value.clauses[index].active;
            }
            if (hasActiveClause) {
                _this.addNeonFilter(false, value);
            }
        });
    };
    FilterBuilderComponent.prototype.resetFilterBuilder = function () {
        var _this = this;
        var callback = function () {
            _this.active.whereClauses = new Map();
            _this.active.whereClausesAsList = [];
            _this.active.andor = 'and';
            _this.addBlankWhereClause();
        };
        var filterIds = [];
        this.active.whereClauses.forEach(function (value, key) {
            if (value.filterId) {
                filterIds.push(value.filterId);
            }
        });
        this.filterService.removeFilters(this.messenger, filterIds, callback.bind(this));
    };
    FilterBuilderComponent.prototype.getDatabaseTableKey = function (database, table) {
        return database + '-' + table;
    };
    /*
    * Assumes all clauses passed in have the same database/table combination
    */
    FilterBuilderComponent.prototype.addNeonFilter = function (executeQueryChainOnsuccess, databaseTableMetadata) {
        var clauses = databaseTableMetadata.clauses;
        if (!clauses || clauses.length === 0) {
            return;
        }
        var database = clauses[0].database.name;
        var table = clauses[0].table.name;
        var databaseTableKey = this.getDatabaseTableKey(database, table);
        var text = database + ' - ' + table + ' - filter';
        var visName = this.getVisualizationName();
        var onSuccess = function (neonFilterId) {
            databaseTableMetadata.filterId = neonFilterId;
        };
        var onError = function () {
            console.error('filter failed to set');
        };
        var filterId = databaseTableMetadata.filterId;
        if (filterId) {
            this.filterService.replaceFilter(this.messenger, filterId, this.id, database, table, this.createNeonFilterClauseEquals(database, table, ''), {
                visName: visName,
                text: text
            }, onSuccess.bind(this), onError.bind(this));
        }
        else {
            this.filterService.addFilter(this.messenger, this.id, database, table, this.createNeonFilterClauseEquals(database, table, ''), {
                visName: visName,
                text: text
            }, onSuccess.bind(this), onError.bind(this));
        }
    };
    FilterBuilderComponent.prototype.createNeonFilterClauseEquals = function (database, table, fieldName) {
        var filterClauses = [];
        for (var _i = 0, _a = this.active.whereClauses.get(this.getDatabaseTableKey(database, table)).clauses; _i < _a.length; _i++) {
            var whereClause = _a[_i];
            if (whereClause.active) {
                var operator = whereClause.operator.value;
                var value = whereClause.value;
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
    FilterBuilderComponent.prototype.getNeonFilterFields = function () {
        // TODO
        return [''];
    };
    FilterBuilderComponent.prototype.getVisualizationName = function () {
        return 'Custom Filters';
    };
    FilterBuilderComponent.prototype.refreshVisualization = function () {
        // constantly refreshed due to bindings.  Do nothing
    };
    FilterBuilderComponent.prototype.isValidQuery = function () {
        // Don't query
        return false;
    };
    FilterBuilderComponent.prototype.createQuery = function () {
        // Don't query
        return null;
    };
    FilterBuilderComponent.prototype.getFiltersToIgnore = function () {
        // Don't query
        return null;
    };
    FilterBuilderComponent.prototype.onQuerySuccess = function () {
        // Don't query
        return null;
    };
    FilterBuilderComponent.prototype.setupFilters = function () {
        // Do nothing
    };
    FilterBuilderComponent.prototype.handleFiltersChangedEvent = function () {
        // Do nothing
    };
    FilterBuilderComponent.prototype.getFilterText = function (_filter) {
        // Do nothing, no filters
        return '';
    };
    FilterBuilderComponent.prototype.removeFilter = function () {
        // Do nothing, no filters
    };
    FilterBuilderComponent.prototype.handleValueChange = function (_event, where) {
        for (var _i = 0, _a = this.active.whereClauses.get(this.getDatabaseTableKey(where.database.name, where.table.name)).clauses; _i < _a.length; _i++) {
            var clause = _a[_i];
            if (clause.id === where.id) {
                if (clause.value && clause.value !== '') {
                    // TODO
                }
                else {
                    clause.active = false;
                }
                return;
            }
        }
    };
    FilterBuilderComponent.prototype.handleChangeField = function () {
        this.logChangeAndStartQueryChain();
    };
    FilterBuilderComponent.prototype.handleChangeOperator = function () {
        this.logChangeAndStartQueryChain();
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    FilterBuilderComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], FilterBuilderComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], FilterBuilderComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], FilterBuilderComponent.prototype, "infoText", void 0);
    FilterBuilderComponent = __decorate([
        Component({
            selector: 'app-filter-builder',
            templateUrl: './filter-builder.component.html',
            styleUrls: ['./filter-builder.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ChangeDetectorRef, VisualizationService])
    ], FilterBuilderComponent);
    return FilterBuilderComponent;
}(BaseNeonComponent));
export { FilterBuilderComponent };
var OperatorMetaData = /** @class */ (function () {
    function OperatorMetaData() {
    }
    return OperatorMetaData;
}());
export { OperatorMetaData };
var WhereClauseMetaData = /** @class */ (function () {
    function WhereClauseMetaData() {
    }
    return WhereClauseMetaData;
}());
export { WhereClauseMetaData };
//# sourceMappingURL=filter-builder.component.js.map