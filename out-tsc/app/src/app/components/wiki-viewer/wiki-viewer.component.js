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
import { DomSanitizer } from '@angular/platform-browser';
import { Http } from '@angular/http';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';
import { FieldMetaData } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
/**
 * A visualization that shows the content of a wikipedia page triggered through a select_id event.
 */
var WikiViewerComponent = /** @class */ (function (_super) {
    __extends(WikiViewerComponent, _super);
    function WikiViewerComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService, http, sanitizer) {
        var _this = _super.call(this, activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) || this;
        _this.http = http;
        _this.sanitizer = sanitizer;
        _this.optionsFromConfig = {
            database: _this.injector.get('database', null),
            id: _this.injector.get('id', null),
            idField: _this.injector.get('idField', null),
            linkField: _this.injector.get('linkField', null),
            table: _this.injector.get('table', null),
            title: _this.injector.get('title', null)
        };
        _this.active = {
            allowsTranslations: true,
            errorMessage: '',
            id: _this.optionsFromConfig.id || '',
            idField: new FieldMetaData(),
            linkField: new FieldMetaData(),
            textColor: '#111',
            wikiName: [],
            wikiText: []
        };
        _this.isLoadingWikiPage = false;
        _this.subscribeToSelectId(_this.getSelectIdCallback());
        return _this;
    }
    WikiViewerComponent_1 = WikiViewerComponent;
    /**
     * Creates and returns the filter for the wiki viewer (null because the wiki viewer does not filter).
     *
     * @return {null}
     * @override
     */
    WikiViewerComponent.prototype.createNeonFilterClauseEquals = function (database, table, fieldName) {
        return null;
    };
    /**
     * Creates and returns the query for the wiki viewer.
     *
     * @return {neon.query.Query}
     * @override
     */
    WikiViewerComponent.prototype.createQuery = function () {
        var query = new neon.query.Query()
            .selectFrom(this.meta.database.name, this.meta.table.name)
            .withFields([this.active.linkField.columnName]);
        var whereClauses = [
            neon.query.where(this.active.idField.columnName, '=', this.active.id),
            neon.query.where(this.active.linkField.columnName, '!=', null)
        ];
        return query.where(neon.query.and.apply(query, whereClauses));
    };
    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    WikiViewerComponent.prototype.getButtonText = function () {
        if (!this.active.wikiName.length) {
            return 'No Data';
        }
        return 'Total ' + _super.prototype.prettifyInteger.call(this, this.active.wikiName.length);
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    WikiViewerComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    /**
     * Returns the wiki viewer export fields.
     *
     * @return {array}
     * @override
     */
    WikiViewerComponent.prototype.getExportFields = function () {
        return [{
                columnName: this.active.idField.columnName,
                prettyName: this.active.idField.prettyName
            }, {
                columnName: this.active.linkField.columnName,
                prettyName: this.active.linkField.prettyName
            }];
    };
    /**
     * Returns the list filters for the wiki viewer to ignore (null for no filters).
     *
     * @return {null}
     * @override
     */
    WikiViewerComponent.prototype.getFiltersToIgnore = function () {
        return null;
    };
    /**
     * Returns the text for the given filter.
     *
     * @arg {object} filter
     * @return {string}
     * @override
     */
    WikiViewerComponent.prototype.getFilterText = function (filter) {
        return '';
    };
    /**
     * Returns the list of filter fields for the wiki viewer (an empty array because the wiki viewer does not filter).
     *
     * @return {array}
     * @override
     */
    WikiViewerComponent.prototype.getNeonFilterFields = function () {
        return [];
    };
    /**
     * Returns the option for the given property from the wiki viewer config.
     *
     * @arg {string} option
     * @return {object}
     * @override
     */
    WikiViewerComponent.prototype.getOptionFromConfig = function (option) {
        return this.optionsFromConfig[option];
    };
    /**
     * Creates and returns the callback function for a select_id event.
     *
     * @return {function}
     * @private
     */
    WikiViewerComponent.prototype.getSelectIdCallback = function () {
        var _this = this;
        return function (message) {
            if (message.database === _this.meta.database.name && message.table === _this.meta.table.name) {
                _this.active.id = Array.isArray(message.id) ? message.id[0] : message.id;
                _this.executeQueryChain();
            }
        };
    };
    /**
     * Returns the label for the tab using the given array of names and the given index.
     *
     * @arg {array} names
     * @arg {number} index
     * @return {string}
     * @private
     */
    WikiViewerComponent.prototype.getTabLabel = function (names, index) {
        return names && names.length > index ? names[index] : '';
    };
    /**
     * Returns the name for the wiki viewer.
     *
     * @return {string}
     * @override
     */
    WikiViewerComponent.prototype.getVisualizationName = function () {
        return 'Wiki Viewer';
    };
    /**
     * Handles a change to a field by running a new query.
     *
     * @private
     */
    WikiViewerComponent.prototype.handleChangeField = function () {
        this.logChangeAndStartQueryChain();
    };
    /**
     * Returns whether the wiki viewer query using the active data config is valid.
     *
     * @return {boolean}
     * @override
     */
    WikiViewerComponent.prototype.isValidQuery = function () {
        return !!(this.meta.database && this.meta.database.name && this.meta.table && this.meta.table.name && this.active.id &&
            this.active.idField && this.active.idField.columnName && this.active.linkField && this.active.linkField.columnName);
    };
    /**
     * Handles the wiki viewer query results.
     *
     * @arg {object} response
     * @override
     */
    WikiViewerComponent.prototype.onQuerySuccess = function (response) {
        this.active.wikiName = [];
        this.active.wikiText = [];
        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.active.errorMessage = '';
                this.isLoadingWikiPage = true;
                var links = neonUtilities.deepFind(response.data[0], this.active.linkField.columnName);
                this.retrieveWikiPage(Array.isArray(links) ? links : [links]);
            }
            else {
                this.active.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        }
        catch (e) {
            this.active.errorMessage = 'Error';
            this.refreshVisualization();
        }
    };
    /**
     * Updates the fields for the wiki viewer.
     *
     * @override
     */
    WikiViewerComponent.prototype.onUpdateFields = function () {
        this.active.idField = this.findFieldObject('idField');
        this.active.linkField = this.findFieldObject('linkField');
    };
    /**
     * Initializes the wiki viewer by running its query.
     *
     * @override
     */
    WikiViewerComponent.prototype.postInit = function () {
        this.executeQueryChain();
    };
    /**
     * Refreshes the wiki viewer.
     *
     * @override
     */
    WikiViewerComponent.prototype.refreshVisualization = function () {
        this.changeDetection.detectChanges();
    };
    /**
     * Removes the given filter from the wiki viewer (does nothing because the wiki viewer does not filter).
     *
     * @arg {object} filter
     * @override
     */
    WikiViewerComponent.prototype.removeFilter = function () {
        // Do nothing.
    };
    /**
     * Retrieves the wiki pages recursively using the given array of links.  Refreshes the visualization once finished.
     *
     * @arg {array} links
     * @private
     */
    WikiViewerComponent.prototype.retrieveWikiPage = function (links) {
        if (!links.length) {
            this.isLoadingWikiPage = false;
            this.refreshVisualization();
            return;
        }
        var self = this;
        this.http.get(WikiViewerComponent_1.WIKI_LINK_PREFIX + links[0]).toPromise().then(function (wikiResponse) {
            var responseObject = JSON.parse(wikiResponse.text());
            if (responseObject.error) {
                self.active.wikiName.push(links[0]);
                self.active.wikiText.push(self.sanitizer.bypassSecurityTrustHtml(responseObject.error.info));
            }
            else {
                self.active.wikiName.push(responseObject.parse.title);
                self.active.wikiText.push(self.sanitizer.bypassSecurityTrustHtml(responseObject.parse.text['*']));
            }
            self.retrieveWikiPage(links.slice(1));
        }).catch(function (error) {
            self.active.wikiName.push(links[0]);
            self.active.wikiText.push(self.sanitizer.bypassSecurityTrustHtml(error));
            self.retrieveWikiPage(links.slice(1));
        });
    };
    /**
     * Sets filters for the wiki viewer (does nothing because the wiki viewer does not filter).
     *
     * @override
     */
    WikiViewerComponent.prototype.setupFilters = function () {
        // Do nothing.
    };
    /**
     * Sets the given bindings for the wiki viewer.
     *
     * @arg {any} bindings
     * @override
     */
    WikiViewerComponent.prototype.subGetBindings = function (bindings) {
        bindings.idField = this.active.idField.columnName;
        bindings.linkField = this.active.linkField.columnName;
    };
    /**
     * Destroys any wiki viewer sub-components if needed.
     *
     * @override
     */
    WikiViewerComponent.prototype.subNgOnDestroy = function () {
        // Do nothing.
    };
    /**
     * Initializes any wiki viewer sub-components if needed.
     *
     * @override
     */
    WikiViewerComponent.prototype.subNgOnInit = function () {
        // Do nothing.
    };
    WikiViewerComponent.prototype.sanitize = function (text) {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    };
    WikiViewerComponent.WIKI_LINK_PREFIX = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=';
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], WikiViewerComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], WikiViewerComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], WikiViewerComponent.prototype, "infoText", void 0);
    WikiViewerComponent = WikiViewerComponent_1 = __decorate([
        Component({
            selector: 'app-wiki-viewer',
            templateUrl: './wiki-viewer.component.html',
            styleUrls: ['./wiki-viewer.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ChangeDetectorRef, VisualizationService, Http, DomSanitizer])
    ], WikiViewerComponent);
    return WikiViewerComponent;
    var WikiViewerComponent_1;
}(BaseNeonComponent));
export { WikiViewerComponent };
//# sourceMappingURL=wiki-viewer.component.js.map