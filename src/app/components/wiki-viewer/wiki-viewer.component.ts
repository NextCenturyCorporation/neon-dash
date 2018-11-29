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
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import * as neon from 'neon-framework';

/**
 * Manages configurable options for the specific visualization.
 */
export class WikiViewerOptions extends BaseNeonOptions {
    public id: string;
    public idField: FieldMetaData;
    public linkField: FieldMetaData;

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        return bindings;
    }

    /**
     * Returns the list of field properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldProperties(): string[] {
        return [
            'idField',
            'linkField'
        ];
    }

    /**
     * Returns the list of field array properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldArrayProperties(): string[] {
        return [];
    }

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @override
     */
    initializeNonFieldBindings() {
        this.id = this.injector.get('id', '');
    }
}

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

    public options: WikiViewerOptions;

    public isLoadingWikiPage: boolean = false;
    public wikiName: string[] = [];
    public wikiText: SafeHtml[] = [];

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef,
        protected http: HttpClient,
        protected sanitizer: DomSanitizer
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );

        this.options = new WikiViewerOptions(this.injector, this.datasetService, 'Wiki Viewer', 10);

        this.subscribeToSelectId(this.getSelectIdCallback());
    }

    /**
     * Creates and returns the query for the wiki viewer.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query()
            .selectFrom(this.options.database.name, this.options.table.name)
            .withFields([this.options.linkField.columnName]);

        let whereClauses = [
            neon.query.where(this.options.idField.columnName, '=', this.options.id),
            neon.query.where(this.options.linkField.columnName, '!=', null)
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
        if (!this.wikiName.length) {
            return 'No Data';
        }
        return 'Total ' + super.prettifyInteger(this.wikiName.length);
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return [];
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
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
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
     * Creates and returns the callback function for a select_id event.
     *
     * @return {function}
     * @private
     */
    private getSelectIdCallback() {
        return (message) => {
            if (message.database === this.options.database.name && message.table === this.options.table.name) {
                this.options.id = Array.isArray(message.id) ? message.id[0] : message.id;
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
     * Returns whether the wiki viewer query using the options data config is valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name && this.options.id &&
            this.options.idField && this.options.idField.columnName && this.options.linkField && this.options.linkField.columnName);
    }

    /**
     * Handles the wiki viewer query results.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        this.wikiName = [];
        this.wikiText = [];

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.errorMessage = '';
                this.isLoadingWikiPage = true;
                let links = neonUtilities.deepFind(response.data[0], this.options.linkField.columnName);
                this.retrieveWikiPage(Array.isArray(links) ? links : [links]);
            } else {
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            this.isLoadingWikiPage = false;
            this.errorMessage = 'Error';
            console.error('Error in ' + this.options.title, e);
            this.refreshVisualization();
        }
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

        let handleErrorOrFailure = (errorMessage: string) => {
            this.wikiName.push(links[0]);
            this.wikiText.push(errorMessage);
            console.error('Error ' + links[0], errorMessage);
            this.retrieveWikiPage(links.slice(1));
        };

        this.http.get(WikiViewerComponent.WIKI_LINK_PREFIX + links[0]).subscribe((wikiResponse: any) => {
            if (wikiResponse.error) {
                let errorMessage = [(wikiResponse.error.code || ''), (wikiResponse.error.info || '')].join(': ') || 'Error';
                handleErrorOrFailure(errorMessage);
                return;
            }
            let responseObject = JSON.parse(wikiResponse.body);
            if (responseObject.error) {
                this.wikiName.push(links[0]);
                this.wikiText.push(this.sanitizer.bypassSecurityTrustHtml(responseObject.error.info));
            } else {
                this.wikiName.push(responseObject.parse.title);
                this.wikiText.push(this.sanitizer.bypassSecurityTrustHtml(responseObject.parse.text['*']));
            }
            this.retrieveWikiPage(links.slice(1));
        }, (error: HttpErrorResponse) => {
            handleErrorOrFailure(error.error);
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
