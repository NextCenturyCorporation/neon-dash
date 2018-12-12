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

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption
} from '../../widget-option';
import * as neon from 'neon-framework';

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

        this.subscribeToSelectId(this.getSelectIdCallback());
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('idField', 'ID Field', true),
            new WidgetFieldOption('linkField', 'Link Field', true)
        ];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetFreeTextOption('id', 'ID', '')
        ];
    }

    /**
     * Creates and returns the visualization data query using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {neon.query.Query}
     * @override
     */
    createQuery(options: any): neon.query.Query {
        let query = new neon.query.Query()
            .selectFrom(options.database.name, options.table.name)
            .withFields([options.linkField.columnName]);

        let whereClauses = [
            neon.query.where(options.idField.columnName, '=', options.id),
            neon.query.where(options.linkField.columnName, '!=', null)
        ];

        return query.where(neon.query.and.apply(query, whereClauses));
    }

    /**
     * Returns the array of data items that are currently shown in the visualization, or undefined if it has not yet run its data query.
     *
     * @return {any[]}
     * @override
     */
    public getShownDataArray(): any[] {
        return this.wikiName;
    }

    /**
     * Returns the label for the data items that are currently shown in this visualization (Bars, Lines, Nodes, Points, Rows, Terms, ...).
     * Uses the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Page' + (count === 1 ? '' : 's');
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
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 10;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Wiki Viewer';
    }

    /**
     * Returns whether the visualization data query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    isValidQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.id && options.idField.columnName && options.linkField.columnName);
    }

    /**
     * Handles the given response data for a successful visualization data query created using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} response
     * @override
     */
    onQuerySuccess(options: any, response: any) {
        this.wikiName = [];
        this.wikiText = [];

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.errorMessage = '';
                this.loadingCount++;
                let links = neonUtilities.deepFind(response.data[0], options.linkField.columnName);
                this.retrieveWikiPage(Array.isArray(links) ? links : [links]);
            } else {
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            this.loadingCount--;
            this.errorMessage = 'Error';
            console.error('Error in ' + options.title, e);
            this.refreshVisualization();
        }
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
            this.loadingCount--;
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

    sanitize(text) {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }
}
