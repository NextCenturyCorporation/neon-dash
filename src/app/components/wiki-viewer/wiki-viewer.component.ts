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
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { AbstractSearchService, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterCollection } from '../../util/filter.util';
import { FilterConfig } from '../../models/filter';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { CoreUtil } from '../../util/core.util';
import {
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetOption
} from '../../models/widget-option';
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
    static WIKI_LINK_PREFIX: string = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=';

    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public wikiViewerData: any[] = [];

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        injector: Injector,
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
            injector,
            ref,
            dialog
        );

        this.updateOnSelectId = true;
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {FilterConfig[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterConfig[] {
        // This visualization does not filter.
        return [];
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    protected createOptions(): WidgetOption[] {
        return [
            new WidgetFieldOption('idField', 'ID Field', true),
            new WidgetFieldOption('linkField', 'Link Field', true),
            new WidgetFreeTextOption('id', 'ID', false, '')
        ];
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause[]} sharedFilters
     * @return {QueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: QueryPayload, sharedFilters: FilterClause[]): QueryPayload {
        let filters: FilterClause[] = [
            this.searchService.buildFilterClause(options.idField.columnName, '=', options.id),
            this.searchService.buildFilterClause(options.linkField.columnName, '!=', null)
        ];

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filters)));

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
                let links: string[] = CoreUtil.deepFind(results[0], options.linkField.columnName) || [];
                this.retrieveWikiPage((Array.isArray(links) ? links : [links]), [], (data: WikiData[]) => {
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

        this.http.get(WikiViewerComponent.WIKI_LINK_PREFIX + links[0]).subscribe((wikiResponse: any) => {
            if (wikiResponse.error) {
                let errorMessage = [(wikiResponse.error.code || ''), (wikiResponse.error.info || '')].join(': ') || 'Error';
                return handleErrorOrFailure(errorMessage);
            }
            let responseBody = JSON.parse(wikiResponse.body);
            if (responseBody.error) {
                data.push(new WikiData(links[0], this.sanitizer.bypassSecurityTrustHtml(responseBody.error.info)));
            } else {
                data.push(new WikiData(responseBody.parse.title, this.sanitizer.bypassSecurityTrustHtml(responseBody.parse.text['*'])));
            }
            return this.retrieveWikiPage(links.slice(1), data, callback);
        }, (error: HttpErrorResponse) => handleErrorOrFailure(error.error));
    }

    sanitize(text) {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }
}
