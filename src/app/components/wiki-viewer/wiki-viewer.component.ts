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

import { BaseNeonComponent, TransformedVisualizationData } from '../base-neon-component/base-neon.component';
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

export class WikiData {
    constructor(public name: string, public text: SafeHtml) {}
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

        this.updateOnSelectId = true;
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
     * Finalizes the given visualization query by adding the where predicates, aggregations, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {neon.query.Query} query
     * @arg {neon.query.WherePredicate[]} wherePredicates
     * @return {neon.query.Query}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: neon.query.Query, wherePredicates: neon.query.WherePredicate[]): neon.query.Query {
        let wheres: neon.query.WherePredicate[] = wherePredicates.concat([
            neon.query.where(options.idField.columnName, '=', options.id),
            neon.query.where(options.linkField.columnName, '!=', null)
        ]);
        return query.where(neon.query.and.apply(query, wheres));
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
     * Transforms the given array of query results using the given options into the array of objects to be shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {TransformedVisualizationData}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): TransformedVisualizationData {
        // Unused because we override handleTransformVisualizationQueryResults.
        return null;
    }

    /**
     * Creates the transformed visualization data using the given options and results and then calls the given success callback function.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @arg {(data: TransformedVisualizationData) => void} successCallback
     * @arg {(err: Error) => void} successCallback
     * @override
     */
    public handleTransformVisualizationQueryResults(options: any, results: any[],
        successCallback: (data: TransformedVisualizationData) => void, failureCallback: (err: Error) => void): void {

        new Promise<TransformedVisualizationData>((resolve, reject) => {
            try {
                let links: string[] = neonUtilities.deepFind(results[0], options.linkField.columnName) || [];
                this.retrieveWikiPage((Array.isArray(links) ? links : [links]), [], (data: WikiData[]) => {
                    resolve(new TransformedVisualizationData(data));
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
        }, (error: HttpErrorResponse) => {
            return handleErrorOrFailure(error.error);
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
