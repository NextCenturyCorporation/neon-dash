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
    public id: string;
    public idField: FieldMetaData;
    public linkField: FieldMetaData;
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
        this.linkField = this.findFieldObject('linkField');
        this.nameField = this.findFieldObject('nameField');
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
    protected MEDIA_PADDING: number = 5;
    protected TAB_HEIGHT: number = 30;

    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    // Must have a ViewChild with a set function because the element is in an ngIf/ngFor.
    private frame: ElementRef;
    private image: ElementRef;
    private video: ElementRef;

    @ViewChild('frame') set frameViewChild(frame: ElementRef) {
        this.frame = frame;
        this.subOnResizeStop();
    }
    @ViewChild('image') set imageViewChild(image: ElementRef) {
        this.image = image;
        this.subOnResizeStop();
    }
    @ViewChild('video') set videoViewChild(video: ElementRef) {
        this.video = video;
        this.subOnResizeStop();
    }

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
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);

        let fields = [this.options.idField.columnName, this.options.linkField.columnName];

        if (this.options.nameField.columnName) {
            fields.push(this.options.nameField.columnName);
        }

        if (this.options.typeField.columnName) {
            fields.push(this.options.typeField.columnName);
        }

        let whereClauses = [
            neon.query.where(this.options.idField.columnName, '=', this.options.id),
            neon.query.where(this.options.linkField.columnName, '!=', null),
            neon.query.where(this.options.linkField.columnName, '!=', '')
        ];

        return query.withFields(fields).where(neon.query.and.apply(query, whereClauses));
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
        }, {
            columnName: this.options.linkField.columnName,
            prettyName: this.options.linkField.prettyName
        }];

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
        return (message) => {
            if (message.database === this.options.database.name && message.table === this.options.table.name) {
                this.options.id = Array.isArray(message.id) ? message.id[0] : message.id;
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
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name && this.options.id &&
            this.options.idField && this.options.idField.columnName && this.options.linkField && this.options.linkField.columnName);
    }

    /**
     * Handles the media viewer query results and show/hide event for selecting/filtering and unfiltering documents.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        this.documentArray = [];

        let neonFilters = this.options.idField.columnName ? this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, [this.options.idField.columnName]) : [];

        if (!neonFilters[0] || (neonFilters[0] && !neonFilters[0].filter.whereClause.rhs)) {
            this.errorMessage = 'No Data';
            this.options.id = '_id';
            this.refreshVisualization();
            return;
        }

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.errorMessage = '';
                this.isLoadingMedia = true;

                let links = neonUtilities.deepFind(response.data[0], this.options.linkField.columnName) || '';
                let names = this.options.nameField.columnName ? neonUtilities.deepFind(response.data[0],
                    this.options.nameField.columnName) || '' : '';
                let types = this.options.typeField.columnName ? neonUtilities.deepFind(response.data[0],
                    this.options.typeField.columnName) || '' : '';

                this.retreiveMedia(
                    Array.isArray(links) ? links : (links.toString().search(/,/g) > -1 ? links.toString().split(',') : [links]),
                    Array.isArray(names) ? names : (names.toString().search(/,/g) > -1 ? names.toString().split(',') : names),
                    Array.isArray(types) ? types : (types.toString().search(/,/g) > -1 ? types.toString().split(',') : types)
                );
            } else {
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
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
     * @arg {array|string} names
     * @arg {array|string} types
     * @private
     */
    private retreiveMedia(links, names, types) {
        if (!links.length) {
            this.isLoadingMedia = false;
            this.refreshVisualization();
            return;
        }

        if (links[0]) {
            let typeFromConfig = this.options.typeMap[links[0].substring(links[0].lastIndexOf('.') + 1).toLowerCase()];
            // TODO Add a boolean borderField with border options like:  true = red, false = yellow
            this.documentArray.push({
                border: this.options.border,
                link: this.options.linkPrefix + links[0],
                name: (Array.isArray(names) ? names[0] : names) || links[0],
                type: (Array.isArray(types) ? types[0] : types) || typeFromConfig || ''
            });
        }

        this.retreiveMedia(links.slice(1), Array.isArray(names) ? names.slice(1) : names, Array.isArray(types) ? types.slice(1) : types);
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
        bindings.nameField = this.options.nameField.columnName;
        bindings.typeField = this.options.typeField.columnName;
        bindings.border = this.options.border;
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
        let refs = this.getElementRefs();

        if (!this.options.resize) {
            if (this.frame) {
                this.frame.nativeElement.style.maxHeight = '';
                this.frame.nativeElement.style.maxWidth = '';
            }
            if (this.image) {
                this.image.nativeElement.style.maxHeight = '';
                this.image.nativeElement.style.maxWidth = '';
            }
            if (this.video) {
                this.video.nativeElement.style.maxHeight = '';
                this.video.nativeElement.style.maxWidth = '';
            }
            return;
        }

        if (!refs.visualization) {
            return;
        }

        if (this.frame) {
            this.frame.nativeElement.style.height = (refs.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT
                - this.TAB_HEIGHT - this.MEDIA_PADDING) + 'px';
            this.frame.nativeElement.style.maxHeight = (refs.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT
                - this.TAB_HEIGHT - this.MEDIA_PADDING) + 'px';
            this.frame.nativeElement.style.width = (refs.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
            this.frame.nativeElement.style.maxWidth = (refs.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        }

        if (this.image) {
            this.image.nativeElement.style.maxHeight = (refs.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT
                - this.TAB_HEIGHT - this.MEDIA_PADDING) + 'px';
            this.image.nativeElement.style.maxWidth = (refs.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        }

        if (this.video) {
            this.video.nativeElement.style.maxHeight = (refs.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT
                - this.TAB_HEIGHT - this.MEDIA_PADDING) + 'px';
            this.video.nativeElement.style.maxWidth = (refs.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        }
    }

    setResize() {
        let size = {
            'height':  this.frame ? this.frame.nativeElement.style.height : '',
            'max-height':  this.video  ? this.video.nativeElement.style.maxHeight : this.image ? this.image.nativeElement.style.maxHeight
                : this.frame ? this.frame.nativeElement.style.maxHeight : '',
            'width':   this.frame  ? this.frame.nativeElement.style.width : '',
            'max-width':   this.video  ? this.video.nativeElement.style.maxWidth : this.image ? this.image.nativeElement.style.maxWidth
                : this.frame ? this.frame.nativeElement.style.maxWidth : ''
        };
        return size;
    }

    sanitize(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
