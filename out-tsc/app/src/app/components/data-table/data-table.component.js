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
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';
var DataTableComponent = /** @class */ (function (_super) {
    __extends(DataTableComponent, _super);
    function DataTableComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) {
        var _this = _super.call(this, activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) || this;
        _this.selected = [];
        _this.optionsFromConfig = {
            title: _this.injector.get('title', null),
            database: _this.injector.get('database', null),
            table: _this.injector.get('table', null),
            idField: _this.injector.get('idField', null),
            sortField: _this.injector.get('sortField', null),
            limit: _this.injector.get('limit', 100),
            limitDisabled: _this.injector.get('limitDisabled', true),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            allColumnStatus: _this.injector.get('allColumnStatus', 'show'),
            exceptionsToStatus: _this.injector.get('exceptionsToStatus', [])
        };
        _this.filters = [];
        _this.active = {
            idField: new FieldMetaData(),
            sortField: new FieldMetaData(),
            andFilters: true,
            limit: _this.optionsFromConfig.limit,
            page: 1,
            docCount: 0,
            filterable: true,
            layers: [],
            data: [],
            headers: [],
            headerWidths: new Map(),
            activeHeaders: [],
            showColumnSelector: 'hide'
        };
        _this.drag = {
            mousedown: false,
            downIndex: -1,
            currentIndex: -1,
            field: null,
            x: 0,
            y: 0
        };
        _this.enableRedrawAfterResize(true);
        return _this;
    }
    DataTableComponent.prototype.subNgOnInit = function () {
        // Do nothing
    };
    DataTableComponent.prototype.postInit = function () {
        this.executeQueryChain();
    };
    DataTableComponent.prototype.subNgOnDestroy = function () {
        // Do nothing
    };
    DataTableComponent.prototype.getOptionFromConfig = function (field) {
        return this.optionsFromConfig[field];
    };
    DataTableComponent.prototype.subGetBindings = function (bindings) {
        bindings.idField = this.active.idField.columnName;
        bindings.sortField = this.active.sortField.columnName;
        bindings.limit = this.active.limit;
    };
    DataTableComponent.prototype.onUpdateFields = function () {
        this.active.idField = this.findFieldObject('idField', neonMappings.TAGS);
        this.active.sortField = this.findFieldObject('sortField', neonMappings.TAGS);
        var initialHeaderLimit = 25;
        var numHeaders = 0;
        var defaultShowValue = this.optionsFromConfig.allColumnStatus !== 'hide';
        for (var _i = 0, _a = this.meta.fields; _i < _a.length; _i++) {
            var f = _a[_i];
            var headerShowValue = numHeaders >= initialHeaderLimit ?
                false :
                this.headerIsInExceptions(f) ?
                    !defaultShowValue :
                    defaultShowValue;
            this.active.headers.push({ prop: f.columnName, name: f.prettyName, active: headerShowValue, style: {}, width: 150 });
            if (f.columnName == 'createdAt') {
                //this.active.headers[this.active.headers.length-1].width = 100;
            }
            if (f.columnName == 'originalText') {
                //this.active.headers[this.active.headers.length-1].width = 900;
            }
            if (headerShowValue) {
                numHeaders++;
            }
        }
        this.recalculateActiveHeaders();
    };
    DataTableComponent.prototype.headerIsInExceptions = function (header) {
        var colName = header.columnName;
        var pName = header.prettyName;
        for (var _i = 0, _a = this.optionsFromConfig.exceptionsToStatus; _i < _a.length; _i++) {
            var name_1 = _a[_i];
            if (colName === name_1 || pName === name_1) {
                return true;
            }
        }
        return false;
    };
    DataTableComponent.prototype.recalculateActiveHeaders = function () {
        var _this = this;
        this.active.activeHeaders = this.getActiveHeaders().map(function (header) {
            console.log('width' + header.width + ' saved ' + _this.active.headerWidths.get(header.prop));
            console.log('header', JSON.stringify(header));
            header.width = _this.active.headerWidths.get(header.prop) || header.width;
            header.$$oldWidth = _this.active.headerWidths.get(header.prop) || header.width;
            return header;
        });
        this.active = Object.assign({}, this.active);
        this.changeDetection.detectChanges();
    };
    DataTableComponent.prototype.getActiveHeaders = function () {
        var active = [];
        for (var _i = 0, _a = this.active.headers; _i < _a.length; _i++) {
            var header = _a[_i];
            if (header.active) {
                active.push(header);
            }
        }
        return active;
    };
    DataTableComponent.prototype.getExportFields = function () {
        return this.active.headers
            .filter(function (header) { return header.active; })
            .map(function (header) {
            return {
                columnName: header.prop,
                prettyName: header.name
            };
        });
    };
    DataTableComponent.prototype.closeColumnSelector = function () {
        this.active.showColumnSelector = 'hide';
        this.active = Object.assign({}, this.active);
        this.changeDetection.detectChanges();
    };
    DataTableComponent.prototype.deactivateAllHeaders = function () {
        this.active.activeHeaders = [];
        for (var _i = 0, _a = this.active.headers; _i < _a.length; _i++) {
            var header = _a[_i];
            header.active = false;
        }
        this.changeDetection.detectChanges();
    };
    DataTableComponent.prototype.activateAllHeaders = function () {
        this.active.activeHeaders = this.active.headers;
        for (var _i = 0, _a = this.active.headers; _i < _a.length; _i++) {
            var header = _a[_i];
            header.active = true;
        }
        this.changeDetection.detectChanges();
    };
    DataTableComponent.prototype.addLocalFilter = function (filter) {
        this.filters[0] = filter;
    };
    DataTableComponent.prototype.createNeonFilterClauseEquals = function (database, table, fieldName) {
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
    DataTableComponent.prototype.getNeonFilterFields = function () {
        return [this.active.sortField.columnName];
    };
    DataTableComponent.prototype.getVisualizationName = function () {
        return 'Data Chart';
    };
    DataTableComponent.prototype.getFilterText = function () {
        return this.filters[0].value;
    };
    DataTableComponent.prototype.refreshVisualization = function () {
        this.recalculateActiveHeaders();
        this.table.recalculate();
        this.active = Object.assign({}, this.active);
        this.changeDetection.detectChanges();
    };
    DataTableComponent.prototype.isValidQuery = function () {
        var valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.sortField && this.active.sortField.columnName && valid);
        // valid = (this.active.aggregation && valid);
        return valid;
    };
    DataTableComponent.prototype.createQuery = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var limit = this.active.limit;
        var offset = ((this.active.page) - 1) * limit;
        var query = new neon.query.Query().selectFrom(databaseName, tableName);
        var whereClause = neon.query.where(this.active.sortField.columnName, '!=', null);
        // Add unshared filter if needed
        if (this.hasUnsharedFilter()) {
            whereClause = neon.query.and(whereClause, neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }
        return query.where(whereClause)
            .sortBy(this.active.sortField.columnName, neonVariables.DESCENDING)
            .limit(this.active.limit)
            .offset(offset);
    };
    DataTableComponent.prototype.getFiltersToIgnore = function () {
        return null;
    };
    DataTableComponent.prototype.arrayToString = function (arr) {
        var modArr = arr
            .filter(function (el) {
            return el;
        })
            .map(function (base) {
            if ((typeof base === 'object')) {
                return this.objectToString(base);
            }
            else if (Array.isArray(base)) {
                return this.arrayToString(base);
            }
            else {
                return base;
            }
        });
        return '[' + modArr + ']';
    };
    DataTableComponent.prototype.objectToString = function (base) {
        return '';
    };
    DataTableComponent.prototype.toCellString = function (base, type) {
        if (base === null) {
            return '';
        }
        else if (Array.isArray(base)) {
            return this.arrayToString(base);
        }
        else if (typeof base === 'object') {
            return this.objectToString(base);
        }
        else {
            return base;
        }
    };
    DataTableComponent.prototype.onQuerySuccess = function (response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.active.docCount = response.data[0]._docCount;
        }
        else {
            var data = response.data.map(function (d) {
                var row = {};
                for (var _i = 0, _a = this.meta.fields; _i < _a.length; _i++) {
                    var field = _a[_i];
                    if (field.type) {
                        row[field.columnName] = this.toCellString(neonUtilities.deepFind(d, field.columnName), field.type);
                    }
                }
                return row;
            }.bind(this));
            this.active.data = data;
            this.getDocCount();
            this.refreshVisualization();
        }
    };
    DataTableComponent.prototype.getDocCount = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var countQuery = new neon.query.Query()
            .selectFrom(databaseName, tableName)
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
    };
    DataTableComponent.prototype.setupFilters = function () {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        this.active.page = 1;
        var database = this.meta.database.name;
        var table = this.meta.table.name;
        var fields = [this.active.sortField.columnName];
        var neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (var _i = 0, neonFilters_1 = neonFilters; _i < neonFilters_1.length; _i++) {
                var filter = neonFilters_1[_i];
                var key = filter.filter.whereClause.lhs;
                var value = filter.filter.whereClause.rhs;
                this.addLocalFilter({
                    id: filter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                });
            }
        }
        else {
            this.filters = [];
        }
    };
    DataTableComponent.prototype.handleFiltersChangedEvent = function () {
        this.executeQueryChain();
    };
    DataTableComponent.prototype.handleChangeField = function () {
        this.logChangeAndStartQueryChain();
    };
    DataTableComponent.prototype.handleChangeSortField = function () {
        this.logChangeAndStartQueryChain();
    };
    DataTableComponent.prototype.isDragging = function () {
        return (this.drag.mousedown && this.drag.downIndex >= 0);
    };
    // mouse up in a drag and drop element
    DataTableComponent.prototype.onMouseUp = function (i) {
        if (this.isDragging && this.drag.downIndex !== this.drag.currentIndex) {
            var length_1 = this.active.headers.length;
            if (this.drag.downIndex >= length_1 || i >= length_1 || this.drag.downIndex < 0 || i < 0) {
                // Do nothing
            }
            else {
                var h = this.active.headers;
                var si = this.drag.downIndex; // startIndex
                var ei = i; // endIndex
                var dir = (si > ei ? -1 : 1);
                var moved = h[si];
                for (var ci = si; ci !== ei; ci += dir) {
                    h[ci] = h[ci + dir];
                }
                h[ei] = moved;
                this.recalculateActiveHeaders();
            }
        }
        this.clearHeaderStyles();
        this.drag.downIndex = -1;
        this.drag.mousedown = false;
    };
    // clicks on a drag and drop icon of an element
    DataTableComponent.prototype.onMouseDown = function (i) {
        if (i >= 0) {
            this.drag.downIndex = i;
            this.drag.mousedown = true;
            this.setStyle(i, 'backgroundColor', 'rgba(0, 0, 0, .2)');
            this.setStyle(i, 'border', 'gray dashed 1px');
        }
    };
    // enters a NEW drag and drop element
    DataTableComponent.prototype.onMouseEnter = function (i) {
        if (this.isDragging()) {
            this.drag.currentIndex = i;
            var style = 'thick solid gray';
            if (i < this.drag.downIndex) {
                this.setStyle(i, 'borderTop', style);
            }
            else if (i > this.drag.downIndex) {
                this.setStyle(i, 'borderBottom', style);
            }
        }
    };
    DataTableComponent.prototype.onMouseLeaveItem = function (i) {
        if (this.isDragging()) {
            if (i !== this.drag.downIndex) {
                this.setStyle(i, 'borderBottom', null);
                this.setStyle(i, 'borderTop', null);
            }
        }
    };
    // leaves drag and drop area
    DataTableComponent.prototype.onMouseLeaveArea = function () {
        this.drag.downIndex = -1;
        this.drag.mousedown = false;
        this.clearHeaderStyles();
    };
    // moving in drag and drop area
    DataTableComponent.prototype.onMouseMove = function (event) {
        if (this.isDragging()) {
            this.drag.x = event.screenX;
            this.drag.y = event.screenY;
        }
    };
    DataTableComponent.prototype.clearHeaderStyles = function () {
        for (var _i = 0, _a = this.active.headers; _i < _a.length; _i++) {
            var header = _a[_i];
            header.style = {};
        }
    };
    // Get filters and format for each call in HTML
    DataTableComponent.prototype.getCloseableFilters = function () {
        var closeableFilters = this.filters.map(function (filter) {
            return filter.value;
        });
        return closeableFilters;
    };
    DataTableComponent.prototype.getFilterTitle = function (value) {
        return this.active.sortField.columnName + ' = ' + value;
    };
    DataTableComponent.prototype.getFilterCloseText = function (value) {
        return value;
    };
    DataTableComponent.prototype.getRemoveFilterTooltip = function (value) {
        return 'Delete Filter ' + this.getFilterTitle(value);
    };
    DataTableComponent.prototype.unsharedFilterChanged = function () {
        // Update the data
        this.executeQueryChain();
    };
    DataTableComponent.prototype.unsharedFilterRemoved = function () {
        // Update the data
        this.executeQueryChain();
    };
    DataTableComponent.prototype.removeFilter = function () {
        this.filters = [];
    };
    DataTableComponent.prototype.nextPage = function () {
        this.active.page += 1;
        this.executeQueryChain();
    };
    DataTableComponent.prototype.previousPage = function () {
        this.active.page -= 1;
        this.executeQueryChain();
    };
    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    DataTableComponent.prototype.getButtonText = function () {
        if (!this.active.docCount) {
            return 'No Data';
        }
        if (this.active.docCount <= this.active.limit) {
            return 'Total ' + _super.prototype.prettifyInteger.call(this, this.active.docCount);
        }
        var begin = _super.prototype.prettifyInteger.call(this, (this.active.page - 1) * this.active.limit + 1);
        var end = _super.prototype.prettifyInteger.call(this, Math.min(this.active.page * this.active.limit, this.active.docCount));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + _super.prototype.prettifyInteger.call(this, this.active.docCount);
    };
    /**
     * Publishes a select_id event for the ID of the first item in the given list of selected items.
     *
     * @arg {array} selected.selected
     * @fires select_id
     * @private
     */
    DataTableComponent.prototype.onSelect = function (_a) {
        var selected = _a.selected;
        if (selected && selected.length && this.active.idField.columnName && selected[0][this.active.idField.columnName]) {
            this.publishSelectId(selected[0][this.active.idField.columnName]);
        }
        this.selected.splice(0, this.selected.length);
        (_b = this.selected).push.apply(_b, selected);
        var _b;
    };
    DataTableComponent.prototype.onTableResize = function (event) {
        this.active.headerWidths.set(event.column.prop, event.newValue);
        //event.column.neonWidth = event.newValue;
        console.log('resize!', event);
    };
    /**
     * Sets the given style in the headers with the given index to the given value.
     *
     * @arg {number} index
     * @arg {string} style
     * @arg {string} value
     * @private
     */
    DataTableComponent.prototype.setStyle = function (index, style, value) {
        this.active.headers[index].style[style] = value;
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    DataTableComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], DataTableComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], DataTableComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], DataTableComponent.prototype, "infoText", void 0);
    __decorate([
        ViewChild('table'),
        __metadata("design:type", Object)
    ], DataTableComponent.prototype, "table", void 0);
    __decorate([
        ViewChild('dragView'),
        __metadata("design:type", ElementRef)
    ], DataTableComponent.prototype, "dragView", void 0);
    DataTableComponent = __decorate([
        Component({
            selector: 'app-data-table',
            templateUrl: './data-table.component.html',
            styleUrls: ['./data-table.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ChangeDetectorRef, VisualizationService])
    ], DataTableComponent);
    return DataTableComponent;
}(BaseNeonComponent));
export { DataTableComponent };
//# sourceMappingURL=data-table.component.js.map