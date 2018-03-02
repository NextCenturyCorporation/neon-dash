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
import { TextCloud, TextCloudOptions, SizeOptions, ColorOptions } from './text-cloud-namespace';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';
var TextCloudComponent = /** @class */ (function (_super) {
    __extends(TextCloudComponent, _super);
    function TextCloudComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) {
        var _this = _super.call(this, activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) || this;
        _this.sizeAggregationTypes = [
            { name: 'Average', value: 'AVG' },
            { name: 'Maximum', value: 'MAX' },
            { name: 'Minimum', value: 'MIN' },
            { name: 'Sum', value: 'SUM' }
        ];
        _this.optionsFromConfig = {
            title: _this.injector.get('title', null),
            database: _this.injector.get('database', null),
            table: _this.injector.get('table', null),
            dataField: _this.injector.get('dataField', null),
            configFilter: _this.injector.get('configFilter', null),
            unsharedFilterField: _this.injector.get('unsharedFilterField', null),
            unsharedFilterValue: _this.injector.get('unsharedFilterValue', null),
            sizeField: _this.injector.get('sizeField', null),
            sizeAggregation: _this.injector.get('sizeAggregation', 'AVG'),
            limit: _this.injector.get('limit', 40)
        };
        _this.sizeAggregation = _this.optionsFromConfig.sizeAggregation;
        _this.filters = [];
        _this.active = {
            dataField: new FieldMetaData(),
            sizeField: new FieldMetaData(),
            andFilters: true,
            limit: _this.optionsFromConfig.limit,
            newLimit: _this.optionsFromConfig.limit,
            textColor: '#111',
            allowsTranslations: true,
            filterable: true,
            data: [],
            count: 0
        };
        return _this;
    }
    TextCloudComponent.prototype.subNgOnInit = function () {
        // Do nothing
    };
    TextCloudComponent.prototype.postInit = function () {
        // This should happen before execute query as #refreshVisualization() depends on this.textCloud
        this.active.textColor = this.getPrimaryThemeColor().toHexString();
        this.updateTextCloudSettings();
        this.executeQueryChain();
    };
    TextCloudComponent.prototype.subNgOnDestroy = function () {
        // Do nothing
    };
    TextCloudComponent.prototype.subGetBindings = function (bindings) {
        bindings.dataField = this.active.dataField.columnName;
        bindings.sizeField = this.active.sizeField.columnName;
        bindings.sizeAggregation = this.sizeAggregation;
        bindings.limit = this.active.limit;
    };
    TextCloudComponent.prototype.getExportFields = function () {
        var countField = this.active.sizeField.prettyName === '' ? 'Count' :
            this.active.sizeField.prettyName;
        return [{
                columnName: this.active.dataField.columnName,
                prettyName: this.active.dataField.prettyName
            }, {
                columnName: 'value',
                prettyName: countField
            }];
    };
    TextCloudComponent.prototype.getOptionFromConfig = function (field) {
        return this.optionsFromConfig[field];
    };
    TextCloudComponent.prototype.updateTextCloudSettings = function () {
        var options = new TextCloudOptions(new SizeOptions(80, 140, '%'), new ColorOptions('#aaaaaa', this.active.textColor));
        this.textCloud = new TextCloud(options);
    };
    TextCloudComponent.prototype.updateObject = function (prev, field, value) {
        var obj = Object.assign({}, prev);
        obj[field] = value;
        return obj;
    };
    TextCloudComponent.prototype.onUpdateFields = function () {
        var dataField = this.findFieldObject('dataField', neonMappings.TAGS);
        var sizeField = this.findFieldObject('sizeField', neonMappings.TAGS);
        this.active = this.updateObject(this.active, 'dataField', dataField);
        this.active = this.updateObject(this.active, 'sizeField', sizeField);
        this.meta = Object.assign({}, this.meta); // trigger action
    };
    TextCloudComponent.prototype.addLocalFilter = function (filter) {
        // Make sure we're not adding a useless duplicate.
        for (var index = this.filters.length - 1; index >= 0; index--) {
            if (filter.id === this.filters[index].id) {
                return;
            }
        }
        this.filters = [].concat(this.filters).concat([filter]);
    };
    TextCloudComponent.prototype.createNeonFilterClauseEquals = function (database, table, fieldName) {
        var filterClauses = this.filters.map(function (filter) {
            return neon.query.where(fieldName, '=', filter.value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.active.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    };
    TextCloudComponent.prototype.getNeonFilterFields = function () {
        return [this.active.dataField.columnName];
    };
    TextCloudComponent.prototype.getVisualizationName = function () {
        return 'Text Cloud';
    };
    TextCloudComponent.prototype.refreshVisualization = function () {
        this.createTextCloud();
    };
    TextCloudComponent.prototype.getFilterText = function (filter) {
        return filter.value;
    };
    TextCloudComponent.prototype.isValidQuery = function () {
        var valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        return valid;
    };
    TextCloudComponent.prototype.createQuery = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var query = new neon.query.Query().selectFrom(databaseName, tableName);
        var whereClause;
        // Checks for an unshared filter in the config file.
        if (this.optionsFromConfig.configFilter) {
            whereClause = neon.query.where(this.optionsFromConfig.configFilter.lhs, this.optionsFromConfig.configFilter.operator, this.optionsFromConfig.configFilter.rhs);
        }
        else if (this.hasUnsharedFilter()) {
            whereClause = neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue);
        }
        else {
            whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        }
        var dataField = this.active.dataField.columnName;
        if (this.active.sizeField.columnName === '') {
            // Normal aggregation query
            return query.where(whereClause).groupBy(dataField).aggregate(neonVariables.COUNT, '*', 'value')
                .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
        }
        else {
            // Query for data with the size field and sort by it
            var sizeColumn = this.active.sizeField.columnName;
            return query.where(neon.query.and(whereClause, neon.query.where(sizeColumn, '!=', null)))
                .groupBy(dataField).aggregate(neon.query[this.sizeAggregation], sizeColumn, sizeColumn)
                .sortBy(sizeColumn, neonVariables.DESCENDING).limit(this.active.limit);
        }
    };
    TextCloudComponent.prototype.getFiltersToIgnore = function () {
        return null;
    };
    TextCloudComponent.prototype.getDocCount = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var whereClause = this.optionsFromConfig.configFilter !== null ?
            neon.query.where(this.optionsFromConfig.configFilter.lhs, this.optionsFromConfig.configFilter.operator, this.optionsFromConfig.configFilter.rhs) :
            neon.query.where(this.active.dataField.columnName, '!=', 'null');
        var countQuery = new neon.query.Query()
            .selectFrom(databaseName, tableName)
            .where(whereClause)
            .groupBy(this.active.dataField.columnName)
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
    };
    TextCloudComponent.prototype.onQuerySuccess = function (response) {
        var _this = this;
        try {
            if (response && response.data && response.data.length && response.data[0]._docCount !== undefined) {
                this.active.count = response.data.length;
            }
            else {
                var cloudData = response.data || [];
                var useSizeField_1 = this.active.sizeField.columnName !== '';
                var activeData = cloudData.map(function (item) {
                    item.key = item[_this.active.dataField.columnName];
                    item.keyTranslated = item.key;
                    // If we have a size field, asign the value to the value field
                    if (useSizeField_1) {
                        item.value = item[_this.active.sizeField.columnName];
                    }
                    return item;
                });
                this.active = this.updateObject(this.active, 'data', activeData);
                this.refreshVisualization();
                if (cloudData.length === 0) {
                    this.active.count = 0;
                }
                else {
                    this.getDocCount();
                }
            }
        }
        catch (e) {
            console.error(e.message);
        }
    };
    TextCloudComponent.prototype.setupFilters = function () {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        var database = this.meta.database.name;
        var table = this.meta.table.name;
        var fields = [this.active.dataField.columnName];
        var neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (var _i = 0, neonFilters_1 = neonFilters; _i < neonFilters_1.length; _i++) {
                var filter = neonFilters_1[_i];
                var key = filter.filter.whereClause.lhs;
                var value = filter.filter.whereClause.rhs;
                var f = {
                    id: filter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                };
                if (this.filterIsUnique(f)) {
                    this.addLocalFilter(f);
                }
            }
        }
        else {
            this.filters = [];
        }
    };
    TextCloudComponent.prototype.isFilterSet = function () {
        return this.filters.length > 0;
    };
    TextCloudComponent.prototype.onClick = function (item) {
        var value = item.key;
        var key = this.active.dataField.columnName;
        var prettyKey = this.active.dataField.prettyName;
        var filter = {
            id: undefined,
            key: key,
            value: value,
            prettyKey: prettyKey
        };
        if (this.filterIsUnique(filter)) {
            this.addLocalFilter(filter);
            var whereClause = neon.query.where(filter.key, '=', filter.value);
            this.addNeonFilter(true, filter, whereClause);
        }
    };
    TextCloudComponent.prototype.filterIsUnique = function (filter) {
        for (var _i = 0, _a = this.filters; _i < _a.length; _i++) {
            var f = _a[_i];
            if (f.value === filter.value && f.key === filter.key) {
                return false;
            }
        }
        return true;
    };
    TextCloudComponent.prototype.createTextCloud = function () {
        var data = this.textCloud.createTextCloud(this.active.data);
        this.active = this.updateObject(this.active, 'data', data);
    };
    TextCloudComponent.prototype.handleChangeDataField = function () {
        this.logChangeAndStartQueryChain();
    };
    /**
     * Updates the limit, resets the seen bars, and reruns the bar chart query.
     */
    TextCloudComponent.prototype.handleChangeLimit = function () {
        if (_super.prototype.isNumber.call(this, this.active.newLimit)) {
            var newLimit = parseFloat('' + this.active.newLimit);
            if (newLimit > 0) {
                this.active.limit = newLimit;
                this.logChangeAndStartQueryChain();
            }
            else {
                this.active.newLimit = this.active.limit;
            }
        }
        else {
            this.active.newLimit = this.active.limit;
        }
    };
    TextCloudComponent.prototype.handleChangeAndFilters = function () {
        this.logChangeAndStartQueryChain();
    };
    TextCloudComponent.prototype.handleChangeSizeField = function () {
        this.logChangeAndStartQueryChain();
    };
    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    TextCloudComponent.prototype.getButtonText = function () {
        if (!this.isFilterSet() && !this.active.data.length) {
            return 'No Data';
        }
        if (this.active.count <= this.active.data.length) {
            return 'Total ' + _super.prototype.prettifyInteger.call(this, this.active.count);
        }
        return _super.prototype.prettifyInteger.call(this, this.active.data.length) + ' of ' + _super.prototype.prettifyInteger.call(this, this.active.count);
    };
    TextCloudComponent.prototype.getFilterData = function () {
        return this.filters;
    };
    TextCloudComponent.prototype.createFilterDesc = function (value) {
        return this.active.dataField.columnName + ' = ' + value;
    };
    TextCloudComponent.prototype.createFilterText = function (value) {
        if (!this.active.allowsTranslations) {
            return value;
        }
        var text = '';
        this.filters.forEach(function (filter) {
            if (filter.value === value) {
                text = filter.translated || filter.value;
            }
        });
        return text;
    };
    TextCloudComponent.prototype.getRemoveDesc = function (value) {
        return 'Delete Filter ' + this.createFilterDesc(value);
    };
    // filter is a filter from the filter service that the filter to remove corresponds to.
    TextCloudComponent.prototype.removeFilter = function (filter) {
        // We do it this way instead of using splice() because we have to replace filter array
        // with a new object for Angular to recognize the change. It doesn't respond to mutation.
        var newFilters = [];
        for (var index = this.filters.length - 1; index >= 0; index--) {
            if (this.filters[index].id !== filter.id) {
                newFilters.push(this.filters[index]);
            }
        }
        this.filters = newFilters;
    };
    // These methods must be present for AoT compile
    TextCloudComponent.prototype.requestExport = function () {
        // Do nothing.
    };
    TextCloudComponent.prototype.unsharedFilterChanged = function () {
        // Update the data
        this.executeQueryChain();
    };
    TextCloudComponent.prototype.unsharedFilterRemoved = function () {
        // Update the data
        this.executeQueryChain();
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    TextCloudComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], TextCloudComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], TextCloudComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], TextCloudComponent.prototype, "infoText", void 0);
    TextCloudComponent = __decorate([
        Component({
            selector: 'app-text-cloud',
            templateUrl: './text-cloud.component.html',
            styleUrls: ['./text-cloud.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ChangeDetectorRef, VisualizationService])
    ], TextCloudComponent);
    return TextCloudComponent;
}(BaseNeonComponent));
export { TextCloudComponent };
//# sourceMappingURL=text-cloud.component.js.map