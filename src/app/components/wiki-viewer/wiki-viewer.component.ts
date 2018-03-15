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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
@Component({
    selector: 'app-wiki-viewer',
    templateUrl: './wiki-viewer.component.html',
    styleUrls: ['./wiki-viewer.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WikiViewerComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    static WIKI_LINK_PREFIX: string = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=';

    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public active: {
        allowsTranslations: boolean,
        id: string,
        idField: FieldMetaData,
        linkField: FieldMetaData,
        textColor: string,
        wikiName: string[],
        wikiText: SafeHtml[]
    };

    private optionsFromConfig: {
        database: string,
        id: string,
        idField: string,
        linkField: string,
        table: string,
        title: string
    };

    isLoadingWikiPage: boolean;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService, private http: Http, private sanitizer: DomSanitizer) {

        super(activeGridService, connectionService, datasetService,
            filterService, exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            database: this.injector.get('database', null),
            id: this.injector.get('id', null),
            idField: this.injector.get('idField', null),
            linkField: this.injector.get('linkField', null),
            table: this.injector.get('table', null),
            title: this.injector.get('title', null)
        };
        this.active = {
            allowsTranslations: true,
            id: this.optionsFromConfig.id || '',
            idField: new FieldMetaData(),
            linkField: new FieldMetaData(),
            textColor: '#111',
            wikiName: [],
            wikiText: []
        };
        this.isLoadingWikiPage = false;
        this.subscribeToSelectId(this.getSelectIdCallback());
    }

    /**
     * Creates and returns the filter for the wiki viewer (null because the wiki viewer does not filter).
     *
     * @return {null}
     * @override
     */
    createNeonFilterClauseEquals(database: string, table: string, fieldName: string | string[]) {
        return null;
    }

    /**
     * Creates and returns the query for the wiki viewer.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query()
            .selectFrom(this.meta.database.name, this.meta.table.name)
            .withFields([this.active.linkField.columnName]);

        let whereClauses = [
            neon.query.where(this.active.idField.columnName, '=', this.active.id),
            neon.query.where(this.active.linkField.columnName, '!=', null)
        ];

        return query.where(neon.query.and.apply(query, whereClauses));
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.active.wikiName.length) {
            return 'No Data';
        }
        return 'Total ' + super.prettifyInteger(this.active.wikiName.length);
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    }

    /**
     * Returns the wiki viewer export fields.
     *
     * @return {array}
     * @override
     */
    getExportFields(): any[] {
        return [{
            columnName: this.active.idField.columnName,
            prettyName: this.active.idField.prettyName
        }, {
            columnName: this.active.linkField.columnName,
            prettyName: this.active.linkField.prettyName
        }];
    }

    /**
     * Returns the list filters for the wiki viewer to ignore (null for no filters).
     *
     * @return {null}
     * @override
     */
    getFiltersToIgnore(): any[] {
        return null;
    }

    /**
     * Returns the text for the given filter.
     *
     * @arg {object} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        return '';
    }

    /**
     * Returns the list of filter fields for the wiki viewer (an empty array because the wiki viewer does not filter).
     *
     * @return {array}
     * @override
     */
    getNeonFilterFields(): string[] {
        return [];
    }

    /**
     * Returns the option for the given property from the wiki viewer config.
     *
     * @arg {string} option
     * @return {object}
     * @override
     */
    getOptionFromConfig(option: string): any {
        return this.optionsFromConfig[option];
    }

    /**
     * Creates and returns the callback function for a select_id event.
     *
     * @return {function}
     * @private
     */
    private getSelectIdCallback() {
        return (message) => {
            if (message.database === this.meta.database.name && message.table === this.meta.table.name) {
                this.active.id = Array.isArray(message.id) ? message.id[0] : message.id;
                this.executeQueryChain();
            }
        };
    }

    /**
     * Returns the label for the tab using the given array of names and the given index.
     *
     * @arg {array} names
     * @arg {number} index
     * @return {string}
     * @private
     */
    private getTabLabel(names, index) {
        return names && names.length > index ? names[index] : '';
    }

    /**
     * Returns the name for the wiki viewer.
     *
     * @return {string}
     * @override
     */
    getVisualizationName(): string {
        return 'Wiki Viewer';
    }

    /**
     * Returns whether the wiki viewer query using the active data config is valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        return !!(this.meta.database && this.meta.database.name && this.meta.table && this.meta.table.name && this.active.id &&
            this.active.idField && this.active.idField.columnName && this.active.linkField && this.active.linkField.columnName);
    }

    /**
     * Handles the wiki viewer query results.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        this.active.wikiName = [];
        this.active.wikiText = [];

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.meta.errorMessage = '';
                this.isLoadingWikiPage = true;
                let links = neonUtilities.deepFind(response.data[0], this.active.linkField.columnName);
                this.retrieveWikiPage(Array.isArray(links) ? links : [links]);
            } else {
                this.meta.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            this.meta.errorMessage = 'Error';
            this.refreshVisualization();
        }
    }

    /**
     * Updates the fields for the wiki viewer.
     *
     * @override
     */
    onUpdateFields() {
        this.active.idField = this.findFieldObject('idField');
        this.active.linkField = this.findFieldObject('linkField');
    }

    /**
     * Initializes the wiki viewer by running its query.
     *
     * @override
     */
    postInit() {
        this.executeQueryChain();
    }

    /**
     * Refreshes the wiki viewer.
     *
     * @override
     */
    refreshVisualization() {
        this.changeDetection.detectChanges();
    }

    /**
     * Removes the given filter from the wiki viewer (does nothing because the wiki viewer does not filter).
     *
     * @arg {object} filter
     * @override
     */
    removeFilter() {
        // Do nothing.
    }

    /**
     * Retrieves the wiki pages recursively using the given array of links.  Refreshes the visualization once finished.
     *
     * @arg {array} links
     * @private
     */
    private retrieveWikiPage(links) {
        if (!links.length) {
            this.isLoadingWikiPage = false;
            this.refreshVisualization();
            return;
        }

        this.http.get (WikiViewerComponent.WIKI_LINK_PREFIX + links[0]).toPromise().then((wikiResponse) => {
            let responseObject = JSON.parse(wikiResponse.text());
            if (responseObject.error) {
                this.active.wikiName.push(links[0]);
                this.active.wikiText.push(this.sanitizer.bypassSecurityTrustHtml(responseObject.error.info));
            } else {
                this.active.wikiName.push(responseObject.parse.title);
                this.active.wikiText.push(this.sanitizer.bypassSecurityTrustHtml(responseObject.parse.text['*']));
            }
            this.retrieveWikiPage(links.slice(1));
        }).catch((error) => {
            this.active.wikiName.push(links[0]);
            this.active.wikiText.push(this.sanitizer.bypassSecurityTrustHtml(error));
            this.retrieveWikiPage(links.slice(1));
        });
    }

    /**
     * Sets filters for the wiki viewer (does nothing because the wiki viewer does not filter).
     *
     * @override
     */
    setupFilters() {
        // Do nothing.
    }

    /**
     * Sets the given bindings for the wiki viewer.
     *
     * @arg {any} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.idField = this.active.idField.columnName;
        bindings.linkField = this.active.linkField.columnName;
    }

    /**
     * Destroys any wiki viewer sub-components if needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // Do nothing.
    }

    /**
     * Initializes any wiki viewer sub-components if needed.
     *
     * @override
     */
    subNgOnInit() {
        // Do nothing.
    }

    sanitize(text) {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }
}
