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
import { FieldMetaData, MediaTypes } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';

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

    public active: {
        allowsTranslations: boolean,
        id: string,
        page: number,
        lastPage: boolean,
        sortField: FieldMetaData,
        filterFields: FieldMetaData[],
        filterable: boolean,
        ascending: boolean,
        idField: FieldMetaData,
        linkField: FieldMetaData,
        objectNameField: FieldMetaData,
        objectIdField: FieldMetaData,
        classField: FieldMetaData,
        typeField: FieldMetaData,
        categoryField: FieldMetaData,
        predictedNameField: FieldMetaData,
        percentField: FieldMetaData,
        gridArray: any[],
        pagingGrid: any[]
    };

    isLoading: boolean;
    scaleThumbnails: boolean;
    mediaTypes: any = MediaTypes;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService, private sanitizer: DomSanitizer) {

        super(activeGridService, connectionService, datasetService,
            filterService, exportService, injector, themesService, ref, visualizationService);

        this.active = {
            allowsTranslations: true,
            id: this.injector.get('id', ''),
            page: 1,
            lastPage: true,
            sortField: new FieldMetaData(),
            filterFields: [],
            filterable: this.injector.get('filterable', false),
            ascending: false,
            idField: new FieldMetaData(),
            linkField: new FieldMetaData(),
            objectNameField: new FieldMetaData(),
            objectIdField: new FieldMetaData(),
            classField: new FieldMetaData(),
            typeField: new FieldMetaData(),
            categoryField: new FieldMetaData(),
            predictedNameField: new FieldMetaData(),
            percentField: new FieldMetaData(),
            gridArray: [],
            pagingGrid: []
        };

        this.isLoading = false;
        this.scaleThumbnails = false;
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
            .selectFrom(this.meta.database.name, this.meta.table.name);

       whereClauses.push(neon.query.where(this.active.linkField.columnName, '!=', null));

        if (this.active.idField.columnName === this.active.id) {
           whereClauses.push(neon.query.where(this.active.idField.columnName, '=', this.active.id));
        }

        return query.where(neon.query.and.apply(query, whereClauses)).sortBy(this.active.sortField.columnName, neonVariables.DESCENDING);
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.active.gridArray.length) {
            return 'No Data';
        }

        if (this.active.gridArray.length <= this.meta.limit) {
            return 'Total Items ' + super.prettifyInteger(this.active.gridArray.length);
        }

        let begin = super.prettifyInteger((this.active.page - 1) * this.meta.limit + 1),
            end = super.prettifyInteger(Math.min(this.active.page * this.meta.limit, this.active.gridArray.length));

        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.active.gridArray.length);
    }

    /**
     * Increases the page and updates the bar chart data.
     */
    nextPage() {
        if (!this.active.lastPage) {
            this.active.page++;
            this.updatePageData();
        }
    }

    /**
     * Decreases the page and updates the bar chart data.
     */
    previousPage() {
        if (this.active.page !== 1) {
            this.active.page--;
            this.updatePageData();
        }
    }

    /**
     * Updates lastPage and the bar chart data using the page and limit.
     */
    updatePageData() {
        let offset = (this.active.page - 1) * this.meta.limit;
        this.active.lastPage = (this.active.gridArray.length <= (offset + this.meta.limit));
        this.active.pagingGrid = this.active.gridArray.slice(offset,
            Math.min(this.active.page * this.meta.limit, this.active.gridArray.length));
        this.refreshVisualization();
        this.createMediaThumbnail();
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
            columnName: this.active.idField.columnName,
            prettyName: this.active.idField.prettyName
        }, {
            columnName: this.active.linkField.columnName,
            prettyName: this.active.linkField.prettyName
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
     *
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
            if (message.database === this.meta.database.name && message.table === this.meta.table.name) {
                this.active.id = Array.isArray(message.id) ? message.id[0] : message.id;
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
            return 'Prediction : ' + predictionTitle + ' ' + (parseFloat(titlePercent) * 100).toFixed(1) + '%, Actual : ' + truthTitle;
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
        return !!(this.meta.database && this.meta.database.name && this.meta.table && this.meta.table.name && this.active.id &&
            this.active.idField && this.active.idField.columnName && this.active.linkField && this.active.linkField.columnName &&
            this.active.sortField && this.active.sortField.columnName);
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
                this.active.gridArray = [];
                this.meta.errorMessage = '';
                this.isLoading = true;
                response.data.map((d) => {
                    let item = {},
                        links: any;
                    for (let field of this.meta.fields) {
                        if (field.columnName === this.active.linkField.columnName) {
                            links = this.getArrayValues(neonUtilities.deepFind(d, this.active.linkField.columnName));
                        } else if (field.type) {
                            item[field.columnName] = neonUtilities.deepFind(d, field.columnName);
                        }
                    }

                    for (let link of links) {
                        this.retreiveMedia(item, link);
                    }
                });
                this.active.page = 1;
                this.active.lastPage = (this.active.gridArray.length <= this.meta.limit);
                this.active.pagingGrid = this.active.gridArray.slice(0, this.meta.limit);
                this.refreshVisualization();
                this.createMediaThumbnail();

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
     * Updates the fields for the thumbnail grid.
     *
     * @override
     */
    onUpdateFields() {
        this.active.idField = this.findFieldObject('idField');
        this.active.linkField = this.findFieldObject('linkField');
        this.active.objectNameField = this.findFieldObject('objectNameField');
        this.active.objectIdField = this.findFieldObject('objectIdField');
        this.active.classField = this.findFieldObject('classField');
        this.active.typeField = this.findFieldObject('typeField');
        this.active.categoryField = this.findFieldObject('categoryField');
        this.active.percentField = this.findFieldObject('percentField');
        this.active.predictedNameField = this.findFieldObject('predictedNameField');
        this.active.sortField = this.findFieldObject('sortField');
        this.active.filterFields = this.findFieldObjects('filterFields');
    }

    /**
     * Sorts grid array in ascending or descending order based on the predicted probability
     *
     * @private
     */
    handleSortOrder() {
        this.active.gridArray.sort((a, b) => {
            if (this.active.ascending) {
                return a[this.active.percentField.columnName] === b[this.active.percentField.columnName] ? 0
                    : +(a[this.active.percentField.columnName] > b[this.active.percentField.columnName]) || -1;
            } else {
                return a[this.active.percentField.columnName] === b[this.active.percentField.columnName] ? 0
                    : +(a[this.active.percentField.columnName] < b[this.active.percentField.columnName]) || -1;
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
        let gridIndex = this.active.gridArray.length > 0 ? this.active.gridArray.length : 0;
        let grid = Object.create(item);
        grid[this.active.linkField.columnName] = link;
        this.active.gridArray[gridIndex] = grid;
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
            height = 185;

        this.active.pagingGrid.map((grid, index) => {
            let link = grid[this.active.linkField.columnName],
                type = grid[this.active.typeField.columnName],
                objectId = grid[this.active.objectIdField.columnName],
                categoryId = grid[this.active.categoryField.columnName],
                thumbnail = canvases[index].getContext('2d');

            switch (type) {
                case this.mediaTypes.image : {
                    let image: HTMLImageElement = new Image(),
                        w = width,
                        h = height;
                    image.src = link;
                    image.onload = () => {
                        if (image.width && image.width > 0 && this.scaleThumbnails) {
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
                        if (video.width && video.width > 0 && this.scaleThumbnails) {
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
        // Do nothing.
    }

    /**
     * Sets the given bindings for the thumbnail grid.
     *
     * @arg {any} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.idField = this.active.idField.columnName;
        bindings.linkField = this.active.linkField.columnName;
        bindings.sortField = this.active.sortField.columnName;
        bindings.filterFields = this.active.filterFields;
        bindings.filterable = this.active.filterable;
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

    /**
     * Returns the default limit for the visualization.
     *
     * @return {number}
     */
    getDefaultLimit(): number {
        return 42;
    }

    sanitize(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
