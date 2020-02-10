/**
 * Copyright 2019 Next Century Corporation
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
 */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import {
    AbstractFilterDesign,
    AbstractSearchService,
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOption,
    ConfigOptionSelect,
    CoreUtil,
    FieldKey,
    FilterClause,
    FilterCollection,
    OptionChoices,
    SearchObject
} from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { MatDialog } from '@angular/material';

export class WikiData {
    constructor(public name: string, public text: SafeHtml) { }
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
    static WIKI_LINK_PREFIX_TITLE: string = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=';
    static WIKI_LINK_PREFIX_ID: string = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&pageid=';
    static WIKI_LINK_PREFIX_URL_HTTPS: string = 'https://en.wikipedia.org/wiki/';
    static WIKI_LINK_PREFIX_URL: string = 'en.wikipedia.org/wiki/';
    static WIKI_LINK_PREFIX_WIKI: string = '/wiki/';
    static WIKI_LINK_PREFIX_WIKI_FULL: string = 'https://en.wikipedia.org/wiki/';
    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;

    public wikiViewerData: any[] = [];

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        ref: ChangeDetectorRef,
        protected http: HttpClient,
        protected sanitizer: DomSanitizer,
        dialog: MatDialog,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            ref,
            dialog
        );

        this.updateOnSelectId = true;
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {AbstractFilterDesign[]}
     * @override
     */
    protected designEachFilterWithNoValues(): AbstractFilterDesign[] {
        // This visualization does not filter.
        return [];
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('idField', 'ID Field', true),
            new ConfigOptionField('linkField', 'Link Field', true),
            new ConfigOptionFreeText('id', 'ID', false, ''),
            new ConfigOptionSelect('useWikipediaPageID', 'Use Wikipedia Page ID', false, false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {SearchObject} SearchObject
     * @arg {FilterClause[]} filters
     * @return {SearchObject}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: SearchObject, filters: FilterClause[]): SearchObject {
        this.searchService.withFilter(query, this.searchService.createCompoundFilterClause(filters.concat([
            this.searchService.createFilterClause({
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.idField.columnName
            } as FieldKey, '=', options.id),
            this.searchService.createFilterClause({
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.linkField.columnName
            } as FieldKey, '!=', null)
        ])));

        return query;
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
     * Handles any needed behavior whenever a select_id event is observed that is relevant for the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} id
     * @override
     */
    public onSelectId(options: any, id: any) {
        options.id = id;
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
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.id && options.idField.columnName && options.linkField.columnName);
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @arg {FilterCollection} filters
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(__options: any, __results: any[], __filters: FilterCollection): number {
        // Unused because we override handleTransformVisualizationQueryResults.
        return 0;
    }

    /**
     * Creates the transformed visualization data using the given options and results and then calls the given success callback function.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @arg {(elementCount: number) => void} successCallback
     * @arg {(err: Error) => void} successCallback
     * @override
     */
    protected handleTransformVisualizationQueryResults(
        options: any,
        results: any[],
        successCallback: (elementCount: number) => void,
        failureCallback: (err: Error) => void
    ): void {
        new Promise<number>((resolve, reject) => {
            try {
                let links = CoreUtil.deepFind(results[0], options.linkField.columnName) || [];
                links = (Array.isArray(links) ? links : [links]).map((link) => {
                    if (!this.options.useWikipediaPageID && link.includes(WikiViewerComponent.WIKI_LINK_PREFIX_URL_HTTPS)) {
                        return link.substring(WikiViewerComponent.WIKI_LINK_PREFIX_URL_HTTPS.length);
                    } else if (!this.options.useWikipediaPageID && link.includes(WikiViewerComponent.WIKI_LINK_PREFIX_URL)) {
                        return link.substring(WikiViewerComponent.WIKI_LINK_PREFIX_URL.length);
                    }
                    return link;
                });
                this.retrieveWikiPage(links, [], (data: WikiData[]) => {
                    this.wikiViewerData = data || [];
                    resolve(data ? data.length : 0);
                });
            } catch (err) {
                reject(err);
            }
        }).then(successCallback, failureCallback);
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        // Do nothing.
    }

    /**
     * Retrieves the wiki pages recursively using the given array of links.  Refreshes the visualization once finished.
     *
     * @arg {string[]} links
     * @arg {WikiData[]} data
     * @private
     */
    private retrieveWikiPage(links: string[], data: WikiData[], callback: (data: WikiData[]) => void): void {
        if (!links.length) {
            callback(data);
            return;
        }

        let handleErrorOrFailure = (errorMessage: string): void => {
            data.push(new WikiData(links[0], errorMessage));
            console.error('Wiki Viewer Error ' + links[0], errorMessage);
            this.retrieveWikiPage(links.slice(1), data, callback);
        };

        let link = (this.options.useWikipediaPageID ? WikiViewerComponent.WIKI_LINK_PREFIX_ID :
            WikiViewerComponent.WIKI_LINK_PREFIX_TITLE) + links[0];

        this.http.get(link).subscribe((wikiResponse: any) => {
            if (wikiResponse.error) {
                let errorMessage = [(wikiResponse.error.code || ''), (wikiResponse.error.info || '')].join(': ') || 'Error';
                return handleErrorOrFailure(errorMessage);
            }
            data.push(new WikiData(wikiResponse.parse.title, this.sanitizer.bypassSecurityTrustHtml(
                wikiResponse.parse.text['*'].split(
                    WikiViewerComponent.WIKI_LINK_PREFIX_WIKI
                ).join(
                    WikiViewerComponent.WIKI_LINK_PREFIX_WIKI_FULL
                )
            )));
            return this.retrieveWikiPage(links.slice(1), data, callback);
        }, (error: HttpErrorResponse) => handleErrorOrFailure(error.error));
    }

    sanitize(text) {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }
}
