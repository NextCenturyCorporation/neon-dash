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
import { FieldMetaData, MediaTypes } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import * as neon from 'neon-framework';

/**
 * Manages configurable options for the specific visualization.
 */
export class MediaViewerOptions extends BaseNeonOptions {
    public border: string;
    public delimiter: string;
    public id: string;
    public idField: FieldMetaData;
    public linkField: FieldMetaData;
    public linkFields: FieldMetaData[];
    public linkPrefix: string;
    public nameField: FieldMetaData;
    public resize: boolean;
    public typeField: FieldMetaData;
    public typeMap: any;
    public url: string;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.border = this.injector.get('border', '');
        this.delimiter = this.injector.get('delimiter', ',');
        this.id = this.injector.get('id', '');
        this.linkPrefix = this.injector.get('linkPrefix', '');
        this.resize = this.injector.get('resize', true);
        this.typeMap = this.injector.get('typeMap', {});
        this.url = this.injector.get('url', '');
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.idField = this.findFieldObject('idField');
        this.nameField = this.findFieldObject('nameField');
        this.typeField = this.findFieldObject('typeField');

        this.linkField = this.findFieldObject('linkField');
        this.linkFields = this.findFieldObjects('linkFields');
        if (this.linkField.columnName && !this.linkFields.length) {
            this.linkFields.push(this.linkField);
        }
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
    protected MEDIA_PADDING: number = 5;
    protected TAB_HEIGHT: number = 30;

    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public options: MediaViewerOptions;

    public documentArray: {
        border: string,
        link: string,
        name: string,
        type: string
    }[] = [];

    public isLoadingMedia: boolean = false;
    public previousId: string = '';
    public mediaTypes: any = MediaTypes;
    public selectedTabIndex: number = 0;

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

        this.options.customEventsToReceive.forEach((config) => {
            this.messenger.subscribe(config.id, (eventMessage) => {
                let tabIndex = this.documentArray.length;
                (config.fields || []).forEach((fieldsConfig) => {
                    this.addLinks(eventMessage.metadata[fieldsConfig.field], [], [], eventMessage.item + ' ' + fieldsConfig.label);
                });
                if (this.documentArray.length > tabIndex) {
                    this.selectedTabIndex = tabIndex;
                    this.refreshVisualization();
                }
            });
        });
    }

    /**
     * Adds the given links to the global list.
     *
     * @arg {any} links
     * @arg {any[]} names
     * @arg {any[]} types
     * @arg {string} prettyName
     */
    addLinks(links: any, names: any[], types: any[], prettyName: string) {
        let linksArray = this.transformToStringArray(links, this.options.delimiter);
        linksArray.forEach((link, index) => {
            let nameWithArrayIndex = prettyName + (linksArray.length > 1 ? ' ' + (index + 1) : '');
            let linkTypeFromConfig = this.options.typeMap[link.substring(link.lastIndexOf('.') + 1).toLowerCase()] || '';
            if (link) {
                this.documentArray.push({
                    // TODO Add a boolean borderField with border options like:  true = red, false = yellow
                    border: this.options.border,
                    link: this.options.linkPrefix + link,
                    name: (names.length > 1 ? (index < names.length ? names[index] : '') : names[0]) || nameWithArrayIndex,
                    type: (types.length > 1 ? (index < types.length ? types[index] : '') : types[0]) || linkTypeFromConfig
                });
            }
        });
    }

    /**
     * Creates and returns the query for the media viewer.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);

        let fields = [this.options.idField.columnName].concat(this.options.linkFields.map((linkField) => {
            return linkField.columnName;
        }));

        if (this.options.nameField.columnName) {
            fields.push(this.options.nameField.columnName);
        }

        if (this.options.typeField.columnName) {
            fields.push(this.options.typeField.columnName);
        }

        let idFilter = neon.query.where(this.options.idField.columnName, '=', this.options.id);
        let wherePredicates = [idFilter].concat(this.options.linkFields.map((linkField) => {
            return neon.query.where(linkField.columnName, '!=', null);
        }));

        return query.withFields(fields).where(neon.query.and.apply(query, wherePredicates));
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.documentArray.length && !this.options.url) {
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
        let fields = [{
            columnName: this.options.idField.columnName,
            prettyName: this.options.idField.prettyName
        }].concat(this.options.linkFields.map((linkField) => {
            return {
                columnName: linkField.columnName,
                prettyName: linkField.prettyName
            };
        }));

        if (this.options.nameField.columnName) {
            fields.push({
                columnName: this.options.nameField.columnName,
                prettyName: this.options.nameField.prettyName
            });
        }

        if (this.options.typeField.columnName) {
            fields.push({
                columnName: this.options.typeField.columnName,
                prettyName: this.options.typeField.prettyName
            });
        }

        return fields;
    }

    /**
     * Returns the list filters for the visualization to ignore.
     *
     * @return {array|null}
     * @override
     */
    getFiltersToIgnore(): any[] {
        // Ignore all the filters for the database and the table so it always shows the selected items.
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name);

        let ignoredFilterIds = neonFilters.filter((neonFilter) => {
            return !neonFilter.filter.whereClause.whereClauses;
        }).map((neonFilter) => {
            return neonFilter.id;
        });

        return ignoredFilterIds.length ? ignoredFilterIds : null;
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
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return [];
    }

    /**
     * Creates and returns the callback function for a select_id event.
     *
     * @return {function}
     * @private
     */
    private getSelectIdCallback() {
        return (eventMessage) => {
            if (eventMessage.database === this.options.database.name && eventMessage.table === this.options.table.name) {
                this.options.id = Array.isArray(eventMessage.id) ? eventMessage.id[0] : eventMessage.id;
                if (this.options.id !== this.previousId) {
                    this.documentArray = [];
                    this.previousId = this.options.id;
                    this.executeQueryChain();
                }
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
        let validLinkFields = this.options.linkFields.length ? this.options.linkFields.every((linkField) => {
            return !!linkField.columnName;
        }) : false;
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name && this.options.id &&
            this.options.idField && this.options.idField.columnName && validLinkFields);
    }

    /**
     * Handles the media viewer query results and show/hide event for selecting/filtering and unfiltering documents.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        this.documentArray = [];
        this.selectedTabIndex = 0;

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.errorMessage = '';
                this.isLoadingMedia = true;

                let names = [];
                let types = [];

                if (this.options.nameField.columnName) {
                    names = neonUtilities.deepFind(response.data[0], this.options.nameField.columnName) || '';
                    names = this.transformToStringArray(names, this.options.delimiter);
                }

                if (this.options.typeField.columnName) {
                    types = neonUtilities.deepFind(response.data[0], this.options.typeField.columnName) || '';
                    types = this.transformToStringArray(types, this.options.delimiter);
                }

                this.options.linkFields.forEach((linkField) => {
                    this.addLinks(neonUtilities.deepFind(response.data[0], linkField.columnName) || '', names, types, linkField.prettyName);
                });

                this.isLoadingMedia = false;
            } else {
                this.errorMessage = 'No Data';
            }

            this.refreshVisualization();
        } catch (e) {
            console.error(e);
            this.isLoadingMedia = false;
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
        this.subOnResizeStop();
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
        bindings.linkFields = this.options.linkFields.map((linkField) => {
            return linkField.columnName;
        });
        bindings.nameField = this.options.nameField.columnName;
        bindings.typeField = this.options.typeField.columnName;
        bindings.border = this.options.border;
        bindings.delimiter = this.options.delimiter;
        bindings.linkPrefix = this.options.linkPrefix;
        bindings.resize = this.options.resize;
        bindings.typeMap = this.options.typeMap;
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

    subOnResizeStop() {
        if (!this.visualization) {
            return;
        }

        let frames = this.visualization.nativeElement.querySelectorAll('.frame');
        let images = this.visualization.nativeElement.querySelectorAll('.image');
        let videos = this.visualization.nativeElement.querySelectorAll('.video');

        if (!this.options.resize) {
            frames.forEach((frame) => {
                frame.style.maxHeight = '';
                frame.style.maxWidth = '';
            });
            images.forEach((image) => {
                image.style.maxHeight = '';
                image.style.maxWidth = '';
            });
            videos.forEach((video) => {
                video.style.maxHeight = '';
                video.style.maxWidth = '';
            });
            return;
        }

        frames.forEach((frame) => {
            frame.style.height = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                this.MEDIA_PADDING) + 'px';
            frame.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                this.MEDIA_PADDING) + 'px';
            frame.style.width = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
            frame.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });

        images.forEach((image) => {
            image.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                this.MEDIA_PADDING) + 'px';
            image.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });

        videos.forEach((video) => {
            video.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                this.MEDIA_PADDING) + 'px';
            video.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });
    }

    sanitize(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    /**
     * Transforms the given string or string array into a string array and returns the array.
     *
     * @arg {string|string[]} input
     * @return {string[]}
     */
    transformToStringArray(input, delimiter: string) {
        return input ? (Array.isArray(input) ? input : (input.toString().indexOf(delimiter) > -1 ? input.toString().split(',') :
            [input])) : [];
    }
}
