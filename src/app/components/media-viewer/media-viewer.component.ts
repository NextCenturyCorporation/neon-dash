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

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import * as neon from 'neon-framework';

/**
 * Manages configurable options for the specific visualization.
 */
export class MediaViewerOptions extends BaseNeonOptions {
    public id: string;
    public idField: FieldMetaData;
    public linkField: FieldMetaData;
    public typeField: FieldMetaData;
    public url: string;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.id = this.injector.get('id', '');
        this.url = this.injector.get('url', '');
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.idField = this.findFieldObject('idField');
        this.linkField = this.findFieldObject('linkField');
        this.typeField = this.findFieldObject('typeField');
    }
}

/**
 * A visualization that displays binary and text files triggered through a select_id event.
 */
@Component({
    selector: 'app-media-viewer',
    templateUrl: './media-viewer.component.html',
    styleUrls: ['./media-viewer.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaViewerComponent extends BaseNeonComponent implements OnInit, OnDestroy {

    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public options: MediaViewerOptions;

    public documentArray: string[] = [];
    public documentType: string = '';

    public isLoadingMedia: boolean = false;
    public showMedia: boolean = false;
    public previousId: string;

    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService,
        private sanitizer: DomSanitizer
    ) {

        super(
            activeGridService,
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            ref,
            visualizationService
        );

        this.options = new MediaViewerOptions(this.injector, this.datasetService, 'Media Viewer', 10);

        this.subscribeToSelectId(this.getSelectIdCallback());
    }

    /**
     * Creates and returns the query for the media viewer.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query()
            .selectFrom(this.options.database.name, this.options.table.name)
            .withFields([this.options.linkField.columnName, this.options.typeField.columnName, this.options.idField.columnName]);

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
        if ((!this.documentArray.length && !this.options.url) || !this.showMedia) {
            return 'No Data';
        } else if (this.options.url) {
            return '';
        }
        return 'Total Files ' + super.prettifyInteger(this.documentArray.length);
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
     * Returns the media viewer export fields.
     *
     * @return {array}
     * @override
     */
    getExportFields(): any[] {
        return [{
            columnName: this.options.idField.columnName,
            prettyName: this.options.idField.prettyName
        }, {
            columnName: this.options.linkField.columnName,
            prettyName: this.options.linkField.prettyName
        }];
    }

    /**
     * Returns the list filters for the media viewer to ignore (null for no filters).
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
     * Returns the list of filter objects (null for no filters).
     *
     * @return {null}
     * @override
     */
    getCloseableFilters(): any[] {
        return null;
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
                this.showMedia = true;
                this.previousId = '';
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
    getTabLabel(names, index) {
        return names && names.length > index ? names[index] : '';
    }

    /**
     * Returns whether the media viewer query using the options data config is valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name && this.options.id &&
            this.options.idField && this.options.idField.columnName && this.options.linkField && this.options.linkField.columnName &&
            this.options.typeField && this.options.typeField.columnName);
    }

    /**
     * Handles the media viewer query results and show/hide event for selecting/filtering and unfiltering documents.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        this.documentArray = [];

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.errorMessage = '';
                this.documentType = neonUtilities.deepFind(response.data[0], this.options.typeField.columnName);
                this.isLoadingMedia = true;
                let links = neonUtilities.deepFind(response.data[0], this.options.linkField.columnName);
                this.retreiveMedia(Array.isArray(links) ?
                    links : links.toString().search(/,/g) > -1 ?
                    links.toString().split(',') : [links]);

                if (this.previousId !== this.options.id) {
                    this.previousId = this.options.id;
                } else {
                    this.showMedia = false;
                }

            } else {
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            this.errorMessage = 'Error';
            this.refreshVisualization();
        }
    }

    /**
     * Initializes the media viewer by running its query.
     *
     * @override
     */
    postInit() {
        this.executeQueryChain();
    }

    /**
     * Refreshes the media viewer.
     *
     * @override
     */
    refreshVisualization() {
        this.changeDetection.detectChanges();
    }

    /**
     * Removes the given filter from the media viewer (does nothing because the media viewer does not filter).
     *
     * @arg {object} filter
     * @override
     */
    removeFilter() {
        // Do nothing.
    }

    /**
     * Retrieves the media pages recursively using the given array of links.  Refreshes the visualization once finished.
     *
     * @arg {array} links
     * @private
     */
    private retreiveMedia(links) {
        if (!links.length) {
            this.isLoadingMedia = false;
            this.refreshVisualization();
            return;
        }

        this.documentArray.push(links[0]);
        this.retreiveMedia(links.slice(1));
    }

    /**
     * Sets filters for the media viewer (does nothing because the media viewer does not filter).
     *
     * @override
     */
    setupFilters() {
        // Do nothing.
    }

    /**
     * Sets the given bindings for the media viewer.
     *
     * @arg {any} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.idField = this.options.idField.columnName;
        bindings.linkField = this.options.linkField.columnName;
    }

    /**
     * Destroys any media viewer sub-components if needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // Do nothing.
    }

    /**
     * Initializes any media viewer sub-components if needed.
     *
     * @override
     */
    subNgOnInit() {
        // Do nothing.
    }

    sanitize(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
