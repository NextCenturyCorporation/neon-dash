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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
// import * as moment from 'moment';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { DocumentViewerSingleItemComponent } from '../document-viewer-single-item/document-viewer-single-item.component';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';
import { MatDialog, MatDialogConfig } from '@angular/material';
var DocumentViewerComponent = /** @class */ (function (_super) {
    __extends(DocumentViewerComponent, _super);
    function DocumentViewerComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, viewContainerRef, ref, visualizationService, dialog) {
        var _this = _super.call(this, activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) || this;
        _this.viewContainerRef = viewContainerRef;
        _this.dialog = dialog;
        _this.optionsFromConfig = {
            title: _this.injector.get('title', null),
            database: _this.injector.get('database', null),
            table: _this.injector.get('table', null),
            dataField: _this.injector.get('dataField', null),
            dateField: _this.injector.get('dateField', null),
            idField: _this.injector.get('idField', null),
            metadataFields: _this.injector.get('metadataFields', null),
            popoutFields: _this.injector.get('popoutFields', null),
            limit: _this.injector.get('limit', null),
            limitDisabled: _this.injector.get('limitDisabled', true),
            showText: _this.injector.get('showText', false),
            showSelect: _this.injector.get('showSelect', true)
        };
        _this.active = {
            data: [],
            dataField: new FieldMetaData(),
            dateField: new FieldMetaData(),
            docCount: 0,
            idField: new FieldMetaData(),
            limit: _this.optionsFromConfig.limit || 50,
            page: 1,
            metadataFields: []
        };
        return _this;
    }
    DocumentViewerComponent.prototype.subNgOnInit = function () {
        this.executeQueryChain();
    };
    DocumentViewerComponent.prototype.postInit = function () {
        // Do nothing.
    };
    DocumentViewerComponent.prototype.subNgOnDestroy = function () {
        // Do nothing.
    };
    DocumentViewerComponent.prototype.subGetBindings = function (bindings) {
        // TODO
    };
    DocumentViewerComponent.prototype.getExportFields = function () {
        return [{
                columnName: this.active.dataField.columnName,
                prettyName: this.active.dataField.prettyName
            },
            {
                columnName: this.active.dateField.columnName,
                prettyName: this.active.dateField.prettyName
            },
            {
                columnName: this.active.idField.columnName,
                prettyName: this.active.idField.prettyName
            }];
    };
    DocumentViewerComponent.prototype.getOptionFromConfig = function (field) {
        return this.optionsFromConfig[field];
    };
    DocumentViewerComponent.prototype.onUpdateFields = function () {
        this.active.dataField = this.findFieldObject('dataField', neonMappings.NEWSFEED_TEXT);
        this.active.dateField = this.findFieldObject('dateField'); // If not set in the config, ignore it altogether.
        this.active.idField = this.findFieldObject('idField');
        this.active.metadataFields = neonUtilities.flatten(this.optionsFromConfig.metadataFields);
    };
    DocumentViewerComponent.prototype.getFilterText = function (filter) {
        return '';
    };
    DocumentViewerComponent.prototype.createNeonFilterClauseEquals = function (database, table, fieldName) {
        return null; // This visualization doesn't filter.
    };
    DocumentViewerComponent.prototype.getNeonFilterFields = function () {
        return []; // This visualization doesn't filter.
    };
    DocumentViewerComponent.prototype.getVisualizationName = function () {
        return 'Document Viewer';
    };
    DocumentViewerComponent.prototype.getFiltersToIgnore = function () {
        return null;
    };
    DocumentViewerComponent.prototype.isValidQuery = function () {
        var valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        // We intentionally don't include dateField or idField in the validity check, because we're allowed to leave it null.
        return !!(valid);
    };
    DocumentViewerComponent.prototype.createQuery = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var limit = this.active.limit;
        var offset = ((this.active.page) - 1) * limit;
        var query = new neon.query.Query().selectFrom(databaseName, tableName);
        var whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        var fields = neonUtilities.flatten(this.optionsFromConfig.metadataFields).map(function (x) {
            return x.field;
        }).concat(this.active.dataField.columnName);
        if (this.active.dateField.columnName) {
            fields = fields.concat(this.active.dateField.columnName);
            query = query.sortBy(this.active.dateField.columnName, neonVariables.DESCENDING);
        }
        if (this.active.idField.columnName) {
            fields = fields.concat(this.active.idField.columnName);
        }
        return query.where(whereClause).withFields(fields).limit(limit).offset(offset);
    };
    DocumentViewerComponent.prototype.onQuerySuccess = function (response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.active.docCount = response.data[0]._docCount;
        }
        else {
            var fields_1 = neonUtilities.flatten(this.optionsFromConfig.metadataFields).map(function (x) {
                return x.field;
            }).concat(this.active.dataField.columnName);
            if (this.active.dateField.columnName) {
                fields_1 = fields_1.concat(this.active.dateField.columnName);
            }
            if (this.active.idField.columnName) {
                fields_1 = fields_1.concat(this.active.idField.columnName);
            }
            var data = response.data.map(function (element) {
                var elem = {};
                for (var _i = 0, fields_2 = fields_1; _i < fields_2.length; _i++) {
                    var field = fields_2[_i];
                    elem[field] = neonUtilities.deepFind(element, field);
                }
                return elem;
            }.bind(this));
            this.active.data = data;
            this.getDocCount();
        }
    };
    DocumentViewerComponent.prototype.getDocCount = function () {
        var databaseName = this.meta.database.name;
        var tableName = this.meta.table.name;
        var whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        var countQuery = new neon.query.Query()
            .selectFrom(databaseName, tableName)
            .where(whereClause)
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
    };
    DocumentViewerComponent.prototype.refreshVisualization = function () {
        // TODO STUB
    };
    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    DocumentViewerComponent.prototype.getButtonText = function () {
        if (!this.active.data.length) {
            return 'No Data';
        }
        if (this.active.docCount <= this.active.data.length) {
            return 'Total ' + _super.prototype.prettifyInteger.call(this, this.active.data.length);
        }
        var begin = _super.prototype.prettifyInteger.call(this, (this.active.page - 1) * this.active.limit + 1);
        var end = _super.prototype.prettifyInteger.call(this, Math.min(this.active.page * this.active.limit, this.active.docCount));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + _super.prototype.prettifyInteger.call(this, this.active.docCount);
    };
    DocumentViewerComponent.prototype.setupFilters = function () {
        this.active.page = 1;
        this.executeQueryChain();
    };
    DocumentViewerComponent.prototype.removeFilter = function () {
        // Do nothing.
    };
    /**
     * Responds to changes in a field by starting a new query cycle.
     */
    DocumentViewerComponent.prototype.handleChangeField = function () {
        this.logChangeAndStartQueryChain();
    };
    DocumentViewerComponent.prototype.formatMetadataEntry = function (record, metadataEntry) {
        var field = record[metadataEntry.field];
        if (typeof field === 'string') {
            return field || 'None';
        }
        else if (field instanceof Array) {
            var matches = [];
            for (var _i = 0, field_1 = field; _i < field_1.length; _i++) {
                var obj = field_1[_i];
                if (!metadataEntry.arrayFilter) {
                    matches.push(obj);
                }
                else if (this.checkIfRecordMatchesFilter(obj, metadataEntry.arrayFilter)) {
                    if (!metadataEntry.arrayFilter.show || metadataEntry.arrayFilter.show === '*') {
                        matches.push(obj);
                    }
                    else {
                        matches.push(obj[metadataEntry.arrayFilter.show]);
                    }
                }
            }
            return matches.join(', ') || 'None';
        }
        else {
            return 'None';
        }
    };
    DocumentViewerComponent.prototype.checkIfRecordMatchesFilter = function (object, filter) {
        if (!filter) {
            return true;
        }
        else if (filter.filterType === '=') {
            for (var _i = 0, _a = filter.filterFor; _i < _a.length; _i++) {
                var item = _a[_i];
                var fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? object : object[filter.filterOn];
                if (fieldToFilter === item) {
                    return true;
                }
            }
            return false;
        }
        else if (filter.filterType === '!=') {
            var matches = true;
            for (var _b = 0, _c = filter.filterFor; _b < _c.length; _b++) {
                var item = _c[_b];
                var fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? object : object[filter.filterOn];
                if (fieldToFilter === item) {
                    return false;
                }
            }
            return true;
        }
    };
    DocumentViewerComponent.prototype.openSingleRecord = function (item) {
        var _this = this;
        var config = new MatDialogConfig();
        // config.viewContainerRef = this.viewContainerRef;
        var metadata = this.active.metadataFields;
        if (this.optionsFromConfig.popoutFields) {
            metadata = metadata.concat(neonUtilities.flatten(this.optionsFromConfig.popoutFields));
        }
        config.data = {
            item: item,
            textField: this.active.dataField.columnName,
            metadataFields: metadata
        };
        this.singleItemRef = this.dialog.open(DocumentViewerSingleItemComponent, config);
        this.singleItemRef.afterClosed().subscribe(function () {
            _this.singleItemRef = null;
        });
    };
    /**
     * Publishes a select_id event for the ID of the given selected item.
     *
     * @arg {object} item
     * @fires select_id
     * @private
     */
    DocumentViewerComponent.prototype.selectSingleRecord = function (item) {
        if (this.active.idField.columnName && item[this.active.idField.columnName]) {
            this.publishSelectId(item[this.active.idField.columnName]);
        }
    };
    DocumentViewerComponent.prototype.nextPage = function () {
        this.active.page += 1;
        this.executeQueryChain();
    };
    DocumentViewerComponent.prototype.previousPage = function () {
        this.active.page -= 1;
        this.executeQueryChain();
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    DocumentViewerComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], DocumentViewerComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], DocumentViewerComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], DocumentViewerComponent.prototype, "infoText", void 0);
    DocumentViewerComponent = __decorate([
        Component({
            selector: 'app-document-viewer',
            templateUrl: './document-viewer.component.html',
            styleUrls: ['./document-viewer.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ViewContainerRef, ChangeDetectorRef, VisualizationService,
            MatDialog])
    ], DocumentViewerComponent);
    return DocumentViewerComponent;
}(BaseNeonComponent));
export { DocumentViewerComponent };
//# sourceMappingURL=document-viewer.component.js.map