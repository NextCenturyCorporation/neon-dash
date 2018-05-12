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

import { DomSanitizer } from '@angular/platform-browser';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { FieldMetaData, MediaTypes } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';

/**
 * Manages configurable options for the specific visualization.
 */
export class ThumbnailGridOptions extends BaseNeonOptions {
    public ascending: boolean;
    public categoryField: FieldMetaData;
    public filterable: boolean;
    public id: string;
    public idField: FieldMetaData;
    public linkField: FieldMetaData;
    public objectIdField: FieldMetaData;
    public objectNameField: FieldMetaData;
    public percentField: FieldMetaData;
    public predictedNameField: FieldMetaData;
    public scaleThumbnails: boolean;
    public sortField: FieldMetaData;
    public typeField: FieldMetaData;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.ascending = this.injector.get('ascending', false);
        this.filterable = this.injector.get('filterable', false);
        this.id = this.injector.get('id', '');
        this.scaleThumbnails = this.injector.get('scaleThumbnails', false);
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.categoryField = this.findFieldObject('categoryField');
        this.idField = this.findFieldObject('idField');
        this.linkField = this.findFieldObject('linkField');
        this.objectIdField = this.findFieldObject('objectIdField');
        this.objectNameField = this.findFieldObject('objectNameField');
        this.percentField = this.findFieldObject('percentField');
        this.predictedNameField = this.findFieldObject('predictedNameField');
        this.sortField = this.findFieldObject('sortField');
        this.typeField = this.findFieldObject('typeField');
    }
}

/**
 * A visualization that displays binary and text files triggered through a select_id event.
 */
@Component({
    selector: 'app-thumbnail-grid',
    templateUrl: './thumbnail-grid.component.html',
    styleUrls: ['./thumbnail-grid.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class ThumbnailGridComponent extends BaseNeonComponent implements OnInit, OnDestroy {

    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('thumbnailGrid') thumbnailGrid: ElementRef;

    public options: ThumbnailGridOptions;

    public gridArray: any[] = [];
    public pagingGrid: any[] = [];

    public lastPage: boolean = true;
    public page: number = 1;

    public isLoading: boolean = false;
    public mediaTypes: any = MediaTypes;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService, private sanitizer: DomSanitizer) {

        super(activeGridService, connectionService, datasetService,
            filterService, exportService, injector, themesService, ref, visualizationService);

        this.options = new ThumbnailGridOptions(this.injector, this.datasetService, 'Thumbnail Grid', 50);
        this.subscribeToSelectId(this.getSelectIdCallback());
    }

    /**
     * Creates and returns the query for the thumbnail grid.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let whereClauses = [];
        let query = new neon.query.Query()
            .selectFrom(this.options.database.name, this.options.table.name);

        whereClauses.push(neon.query.where(this.options.linkField.columnName, '!=', null));

        if (this.options.idField.columnName === this.options.id) {
           whereClauses.push(neon.query.where(this.options.idField.columnName, '=', this.options.id));
        }

        return query.where(neon.query.and.apply(query, whereClauses)).sortBy(this.options.sortField.columnName, neonVariables.DESCENDING);
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.gridArray.length) {
            return 'No Data';
        }

        if (this.gridArray.length <= this.options.limit) {
            return 'Total Items ' + super.prettifyInteger(this.gridArray.length);
        }

        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1),
            end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.gridArray.length));

        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.gridArray.length);
    }

    /**
     * Increases the page and updates the bar chart data.
     */
    nextPage() {
        if (!this.lastPage) {
            this.page++;
            this.updatePageData();
        }
    }

    /**
     * Decreases the page and updates the bar chart data.
     */
    previousPage() {
        if (this.page !== 1) {
            this.page--;
            this.updatePageData();
        }
    }

    /**
     * Updates lastPage and the bar chart data using the page and limit.
     */
    updatePageData() {
        let offset = (this.page - 1) * this.options.limit;
        this.lastPage = (this.gridArray.length <= (offset + this.options.limit));
        this.pagingGrid = this.gridArray.slice(offset,
            Math.min(this.page * this.options.limit, this.gridArray.length));
        this.refreshVisualization();
        this.createMediaThumbnail();
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
            infoText: this.infoText,
            thumbnailGrid: this.thumbnailGrid
        };
    }

    /**
     * Returns the thumbnail grid export fields.
     *
     * @return {array}
     * @override
     */
    getExportFields(): any[] {
        return [{
            columnName: this.options.categoryField.columnName,
            prettyName: this.options.categoryField.prettyName
        }, {
            columnName: this.options.idField.columnName,
            prettyName: this.options.idField.prettyName
        }, {
            columnName: this.options.linkField.columnName,
            prettyName: this.options.linkField.prettyName
        }, {
            columnName: this.options.objectIdField.columnName,
            prettyName: this.options.objectIdField.prettyName
        }, {
            columnName: this.options.objectNameField.columnName,
            prettyName: this.options.objectNameField.prettyName
        }, {
            columnName: this.options.percentField.columnName,
            prettyName: this.options.percentField.prettyName
        }, {
            columnName: this.options.predictedNameField.columnName,
            prettyName: this.options.predictedNameField.prettyName
        }, {
            columnName: this.options.sortField.columnName,
            prettyName: this.options.sortField.prettyName
        }, {
            columnName: this.options.typeField.columnName,
            prettyName: this.options.typeField.prettyName
        }];
    }

    /**
     * Returns the list filters for the thumbnail grid to ignore (null for no filters).
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
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
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
     * Returns the name for the thumbnail grid.
     *
     * @return {string}
     * @override
     */
    getVisualizationName(): string {
        return 'Thumbnail Grid';
    }

    getThumbnailTitle(truthTitle, predictionTitle, titlePercent): string {
        if (predictionTitle) {
            return 'Prediction : ' + predictionTitle + ', Actual : ' + truthTitle;
        } else {
            return (parseFloat(titlePercent) * 100).toFixed(1) + '%';
        }

    }

    /**
     * Returns whether the thumbnail grid query using the active data config is valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name && this.options.id &&
            this.options.idField && this.options.idField.columnName && this.options.linkField && this.options.linkField.columnName &&
            this.options.sortField && this.options.sortField.columnName);
    }

    /**
     * Handles the thumbnail grid query results and show/hide event for selecting/filtering and unfiltering documents.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response) {
        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.gridArray = [];
                this.errorMessage = '';
                this.isLoading = true;
                response.data.map((d) => {
                    let item = {},
                        links: any;
                    for (let field of this.options.fields) {
                        if (field.columnName === this.options.linkField.columnName) {
                            links = this.getArrayValues(neonUtilities.deepFind(d, this.options.linkField.columnName));
                        } else if (field.type) {
                            item[field.columnName] = neonUtilities.deepFind(d, field.columnName);
                        }
                    }

                    for (let link of links) {
                        this.retreiveMedia(item, link);
                    }
                });
                this.page = 1;
                this.lastPage = (this.gridArray.length <= this.options.limit);
                this.pagingGrid = this.gridArray.slice(0, this.options.limit);
                this.refreshVisualization();
                this.createMediaThumbnail();

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
     * Sorts grid array in ascending or descending order based on the predicted probability
     *
     * @private
     */
    handleSortOrder() {
        this.gridArray.sort((a, b) => {
            if (this.options.ascending) {
                return a[this.options.sortField.columnName] === b[this.options.sortField.columnName] ? 0
                    : +(a[this.options.sortField.columnName] > b[this.options.sortField.columnName]) || -1;
            } else {
                return a[this.options.sortField.columnName] === b[this.options.sortField.columnName] ? 0
                    : +(a[this.options.sortField.columnName] < b[this.options.sortField.columnName]) || -1;
            }
        });

        this.updatePageData();
    }

    /**
     * Initializes the thumbnail grid by running its query.
     *
     * @override
     */
    postInit() {
        this.executeQueryChain();
    }

    /**
     * Refreshes the thumbnail grid.
     *
     * @override
     */
    refreshVisualization() {
        this.changeDetection.detectChanges();
    }

    /**
     * Removes the given filter from the thumbnail grid (does nothing because the thumbnail grid does not filter).
     *
     * @arg {object} filter
     * @override
     */
    removeFilter() {
        // Do nothing.
    }

    /**
     * Retrieves the thumbnail grid using the given array of links.
     *
     * @arg {array} links
     * @private
     */
    private retreiveMedia(item, link) {
        let gridIndex = this.gridArray.length > 0 ? this.gridArray.length : 0;
        let grid = Object.create(item);
        grid[this.options.linkField.columnName] = link;
        this.gridArray[gridIndex] = grid;
    }

    /**
     * Returns multiple values as an array
     *
     * @arg {any} value
     * @private
     */
    private getArrayValues(value) {
        return Array.isArray(value) ?
            value : value.toString().search(/,/g) > -1 ?
            value.toString().split(',') : [value];
    }

    /**
     * Creates a media thumbnail for each item in the grid
     *
     * @private
     */
    private createMediaThumbnail() {
        //todo: when canvases lose focus the images disappear. May need to go back to div
        let canvases = this.thumbnailGrid.nativeElement.querySelectorAll('.thumbnail-view'),
            scale = .4,
            width = 300,
            height = 150;

        this.pagingGrid.map((grid, index) => {
            let link = grid[this.options.linkField.columnName],
                type = grid[this.options.typeField.columnName],
                objectId = grid[this.options.objectIdField.columnName],
                categoryId = grid[this.options.categoryField.columnName],
                thumbnail = canvases[index].getContext('2d');

            switch (type) {
                case this.mediaTypes.image : {
                    let image: HTMLImageElement = new Image(),
                        w = width,
                        h = height;
                    image.src = link;
                    image.onload = () => {
                        if (image.width && image.width > 0 && this.options.scaleThumbnails) {
                            w = image.width * scale;
                            h = image.height * scale;
                        }
                        thumbnail.drawImage(image, 0, 0, w, h);

                    };
                    break;
                }
                case this.mediaTypes.video : {
                    let video: HTMLVideoElement = document.createElement('video'),
                        w = width,
                        h = height;
                    video.src = link;
                    video.onloadeddata = () => {
                        if (video.width && video.width > 0 && this.options.scaleThumbnails) {
                            w = video.width * scale;
                            h = video.height * scale;
                        }
                        thumbnail.drawImage(video, 0, 0, w, h);
                    };
                    break;
                }
                default : {
                    // todo: get thumbnails of documents, pdf, and other similar types of media.
                }
            }

            if (objectId === categoryId) {
                thumbnail.canvas.setAttribute('class', thumbnail.canvas.getAttribute('class') + ' ' + 'blue-border');
            } else {
                thumbnail.canvas.setAttribute('class', thumbnail.canvas.getAttribute('class') + ' ' + 'red-border');
            }
        });

        this.refreshVisualization();
    }

    /**
     * Show link in native viewer
     *
     * @arg {array} links
     * @private
     */

    maximizeMedia(link) {
        window.open(link);
    }

    /**
     * Sets filters for the thumbnail grid (does nothing because the thumbnail grid does not filter).
     *
     * @override
     */
    setupFilters() {
        this.options.sortField.columnName = this.filterService.getFilters()[0].filter.whereClause.lhs;
        this.options.sortField.prettyName = this.filterService.getFilters()[0].filter.whereClause.lhs;
        this.handleSortOrder();
    }

    /**
     * Sets the given bindings for the thumbnail grid.
     *
     * @arg {any} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.categoryField = this.options.categoryField.columnName;
        bindings.idField = this.options.idField.columnName;
        bindings.linkField = this.options.linkField.columnName;
        bindings.objectIdField = this.options.objectIdField.columnName;
        bindings.objectNameField = this.options.objectNameField.columnName;
        bindings.percentField = this.options.percentField.columnName;
        bindings.predictedNameField = this.options.predictedNameField.columnName;
        bindings.sortField = this.options.sortField.columnName;
        bindings.typeField = this.options.typeField.columnName;

        bindings.ascending = this.options.ascending;
        bindings.filterable = this.options.filterable;
        bindings.id = this.options.id;
        bindings.scaleThumbnails = this.options.scaleThumbnails;
    }

    /**
     * Destroys any thumbnail grid sub-components if needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // Do nothing.
    }

    /**
     * Initializes any thumbnail grid sub-components if needed.
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
