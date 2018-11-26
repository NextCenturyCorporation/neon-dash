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

export const ViewType = {
    CARD: 'card',
    DETAILS: 'details',
    TITLE: 'title'
};
/**
 * Manages configurable options for the specific visualization.
 */
export class ThumbnailGridOptions extends BaseNeonOptions {
    public ascending: boolean;
    public border: string;
    public borderCompareValue: string;
    public borderPercentThreshold: number;
    public categoryField: FieldMetaData;
    public compareField: FieldMetaData;
    public cropAndScale: string;
    public dateField: FieldMetaData;
    public defaultLabel: string;
    public defaultPercent: string;
    public viewType: string;
    public filterField: FieldMetaData;
    public id: string;
    public idField: FieldMetaData;
    public ignoreSelf: boolean;
    public linkField: FieldMetaData;
    public linkPrefix: string;
    public nameField: FieldMetaData;
    public objectIdField: FieldMetaData;
    public objectNameField: FieldMetaData;
    public openOnMouseClick: boolean;
    public percentField: FieldMetaData;
    public predictedNameField: FieldMetaData;
    public showOnlyFiltered: boolean;
    public sortField: FieldMetaData;
    public textMap: any;
    public typeField: FieldMetaData;
    public typeMap: any;
    public flagLabel: FieldMetaData;
    public flagSubLabel1: FieldMetaData;
    public flagSubLabel2: FieldMetaData;
    public flagSubLabel3: FieldMetaData;
    public showLabelName: boolean;
    public canvasSize: number;

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        bindings.ascending = this.ascending;
        bindings.border = this.border;
        bindings.borderCompareValue = this.borderCompareValue;
        bindings.borderPercentThreshold = this.borderPercentThreshold;
        bindings.cropAndScale = this.cropAndScale;
        bindings.defaultLabel = this.defaultLabel;
        bindings.defaultPercent = this.defaultPercent;
        bindings.viewType = this.viewType;
        bindings.ignoreSelf = this.ignoreSelf;
        bindings.linkPrefix = this.linkPrefix;
        bindings.openOnMouseClick = this.openOnMouseClick;
        bindings.showLabelName = this.showLabelName;
        bindings.textMap = this.textMap;
        bindings.typeMap = this.typeMap;
        bindings.canvasSize = this.canvasSize;

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
            'categoryField',
            'compareField',
            'dateField',
            'filterField',
            'flagLabel',
            'flagSubLabel1',
            'flagSubLabel2',
            'flagSubLabel3',
            'idField',
            'linkField',
            'nameField',
            'objectIdField',
            'objectNameField',
            'percentField',
            'predictedNameField',
            'sortField',
            'typeField'
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
        this.ascending = this.injector.get('ascending', false);
        this.border = this.injector.get('border', '');
        this.borderCompareValue = this.injector.get('borderCompareValue', '');
        this.borderPercentThreshold = this.injector.get('borderPercentThreshold', 0.5);
        this.cropAndScale = this.injector.get('cropAndScale', '') || '';
        this.defaultLabel = this.injector.get('defaultLabel', '');
        this.defaultPercent = this.injector.get('defaultPercent', '');
        this.id = this.injector.get('id', '');
        this.ignoreSelf = this.injector.get('ignoreSelf', false);
        this.linkPrefix = this.injector.get('linkPrefix', '');
        this.openOnMouseClick = this.injector.get('openOnMouseClick', true);
        this.showOnlyFiltered = this.injector.get('showOnlyFiltered', false);
        this.textMap = this.injector.get('textMap', {});
        this.typeMap = this.injector.get('typeMap', {});
        this.showLabelName = this.injector.get('showLabelName', false);
        this.viewType = this.injector.get('viewType', ViewType.TITLE);
        this.canvasSize = this.injector.get('canvasSize', 100.00);
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

    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: string
    }[] = [];

    public options: ThumbnailGridOptions;

    public gridArray: any[] = [];
    public pagingGrid: any[] = [];

    public lastPage: boolean = true;
    public page: number = 1;
    public neonFilters: any[] = [];
    public isLoading: boolean = false;
    public showGrid: boolean;
    public mediaTypes: any = MediaTypes;
    public view: any = ViewType;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService, private sanitizer: DomSanitizer) {

        super(activeGridService, connectionService, datasetService,
            filterService, exportService, injector, themesService, ref, visualizationService);

        this.options = new ThumbnailGridOptions(this.injector, this.datasetService, 'Thumbnail Grid', 30);

        if (!this.options.sortField.columnName) {
            this.options.sortField = this.options.percentField;
        }

        if (!this.options.flagLabel.columnName) {
            this.options.flagLabel = this.options.idField;
        }

        this.showGrid = !this.options.showOnlyFiltered;
    }

    /**
     * Creates Neon and visualization filter objects for the given text.
     *
     * @arg {string} text
     */
    createFilter(text: string) {
        if (!this.options.filterField.columnName) {
            return;
        }

        let filter = {
            id: undefined,
            field: this.options.filterField.columnName,
            prettyField: this.options.filterField.prettyName,
            value: text
        };

        let clause = neon.query.where(filter.field, '=', filter.value);
        let runQuery = !this.options.ignoreSelf;

        if (!this.filters.length) {
            this.filters = [filter];
            this.addNeonFilter(runQuery, filter, clause);
        } else if (this.filters.length === 1) {
            if (!this.filterExists(filter.field, filter.value)) {
                filter.id = this.filters[0].id;
                this.filters = [filter];
                this.replaceNeonFilter(runQuery, filter, clause);
            }
        } else {
            this.removeAllFilters([].concat(this.filters), () => {
                this.filters = [filter];
                this.addNeonFilter(runQuery, filter, clause);
            });
        }
    }

    /**
     * Creates and returns the query for the thumbnail grid.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);

        let fields = [this.options.linkField.columnName, this.options.sortField.columnName];

        if (this.options.categoryField.columnName) {
            fields.push(this.options.categoryField.columnName);
        }

        if (this.options.compareField.columnName) {
            fields.push(this.options.compareField.columnName);
        }

        if (this.options.filterField.columnName) {
            fields.push(this.options.filterField.columnName);
        }

        if (this.options.idField.columnName) {
            fields.push(this.options.idField.columnName);
        }

        if (this.options.nameField.columnName) {
            fields.push(this.options.nameField.columnName);
        }

        if (this.options.objectIdField.columnName) {
            fields.push(this.options.objectIdField.columnName);
        }

        if (this.options.objectNameField.columnName) {
            fields.push(this.options.objectNameField.columnName);
        }

        if (this.options.percentField.columnName) {
            fields.push(this.options.percentField.columnName);
        }

        if (this.options.predictedNameField.columnName) {
            fields.push(this.options.predictedNameField.columnName);
        }

        if (this.options.typeField.columnName) {
            fields.push(this.options.typeField.columnName);
        }

        if (this.options.dateField.columnName) {
            fields.push(this.options.dateField.columnName);
        }

        if (this.options.flagLabel.columnName) {
            fields.push(this.options.flagLabel.columnName);
        }

        if (this.options.flagSubLabel1.columnName) {
            fields.push(this.options.flagSubLabel1.columnName);
        }

        if (this.options.flagSubLabel2.columnName) {
            fields.push(this.options.flagSubLabel2.columnName);
        }

        if (this.options.flagSubLabel3.columnName) {
            fields.push(this.options.flagSubLabel3.columnName);
        }

        let wheres: neon.query.WherePredicate[] = [neon.query.where(this.options.linkField.columnName, '!=', null),
            neon.query.where(this.options.linkField.columnName, '!=', '')];

        if (this.options.filter) {
            wheres.push(neon.query.where(this.options.filter.lhs, this.options.filter.operator, this.options.filter.rhs));
        }

        if (this.hasUnsharedFilter()) {
            wheres.push(neon.query.where(this.options.unsharedFilterField.columnName, '=', this.options.unsharedFilterValue));
        }

        this.options.customEventsToPublish.forEach((config) => {
            (config.fields || []).forEach((fieldsConfig) => {
                if (fields.indexOf(fieldsConfig.columnName) < 0) {
                    fields.push(fieldsConfig.columnName);
                }
            });
        });

        return query.withFields(fields).where(wheres.length > 1 ? neon.query.and.apply(neon.query, wheres) : wheres[0])
            .sortBy(this.options.sortField.columnName, this.options.ascending ? neonVariables.ASCENDING : neonVariables.DESCENDING);

    }

    /**
     * Returns whether a visualization filter object with the given field and value strings exists in the list of visualization filters.
     *
     * @arg {string} field
     * @arg {string} value
     * @return {boolean}
     * @private
     */
    filterExists(field: string, value: string) {
        return this.filters.some((existingFilter) => {
            return field === existingFilter.field && value === existingFilter.value;
        });
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.gridArray.length) {
            if (this.options.hideUnfiltered) {
                return 'Please Filter';
            }
            return 'No Data';
        }

        if (this.options.showOnlyFiltered && !this.neonFilters.length) {
            return 'No Filter Selected';
        }

        if (this.gridArray.length <= this.options.limit) {
            return 'Total ' + super.prettifyInteger(this.gridArray.length);
        }

        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1),
            end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.gridArray.length));

        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.gridArray.length);
    }

    /**
     * Increases the page and updates the bar chart data.
     */
    goToNextPage() {
        if (!this.lastPage) {
            this.page++;
            this.updatePageData();
        }
    }

    /**
     * Decreases the page and updates the bar chart data.
     */
    goToPreviousPage() {
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
        this.showGrid = true;
        this.refreshVisualization();
        this.createMediaThumbnail();
        this.thumbnailGrid.nativeElement.scrollTop = 0;
    }

    /**
     * Returns the list of filter objects for the visualization.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return this.filters;
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
     * Returns the list filters for the visualization to ignore.
     *
     * @return {array|null}
     * @override
     */
    getFiltersToIgnore(): any[] {
        if (!this.options.ignoreSelf) {
            return null;
        }

        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            this.options.filterField.columnName ? [this.options.filterField.columnName] : undefined);

        let ignoredFilterIds = neonFilters.filter((neonFilter) => {
            return !neonFilter.filter.whereClause.whereClauses;
        }).map((neonFilter) => {
            return neonFilter.id;
        });

        return ignoredFilterIds.length ? ignoredFilterIds : null;
    }

    /**
     * Returns the text for the given filter object.
     *
     * @arg {object} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        return filter.prettyField + ' = ' + filter.value;
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

    getThumbnailLabel(item): string {
        if (this.options.predictedNameField.columnName) {
            return item[this.options.predictedNameField.columnName] || '';
        }
        if (this.options.objectNameField.columnName) {
            return item[this.options.objectNameField.columnName] || '';
        }
        return this.options.defaultLabel;
    }

    getThumbnailPercent(item): string {
        if (this.options.percentField.columnName && item[this.options.percentField.columnName] >= 0) {
            let percentage = parseFloat(item[this.options.percentField.columnName]) * 100;
            // Do not add '.0' if the percentage is an integer.
            return (percentage % 1 ? percentage.toFixed(1) : percentage.toFixed(0)) + '%';
        }
        return this.options.defaultPercent;
    }

    getThumbnailTitle(item): string {
        let text = [];
        if (this.options.nameField.columnName && item[this.options.nameField.columnName]) {
            let nameText = this.options.textMap.name || '';
            text.push((nameText ? nameText + ' : ' : '') + item[this.options.nameField.columnName]);
        }
        if (this.options.predictedNameField.columnName && item[this.options.predictedNameField.columnName]) {
            let predictionText = this.options.textMap.prediction || 'Prediction';
            text.push((predictionText ? predictionText + ' : ' : '') + item[this.options.predictedNameField.columnName]);
        }
        if (this.options.objectNameField.columnName && item[this.options.objectNameField.columnName]) {
            let actualText = this.options.textMap.actual || 'Actual';
            text.push((actualText ? actualText + ' : ' : '') + item[this.options.objectNameField.columnName]);
        }
        return text.join(', ');
    }

    /**
     * Returns whether the thumbnail grid query using the active data config is valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name &&
            this.options.linkField && this.options.linkField.columnName && this.options.sortField && this.options.sortField.columnName);
    }

    /**
     * Handles the thumbnail grid query results and show/hide event for selecting/filtering and unfiltering documents.
     *
     *  @arg {object} response
     *  @override
     */

    onQuerySuccess(response) {
        this.gridArray = [];
        this.errorMessage = '';
        this.lastPage = true;

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.isLoading = true;

                response.data.forEach((d) => {
                    let item = {},
                        links = [];

                    if (this.options.linkField.columnName) {
                        links = this.getArrayValues(neonUtilities.deepFind(d, this.options.linkField.columnName) || '');
                    }
                    if (this.options.categoryField.columnName) {
                        item[this.options.categoryField.columnName] = neonUtilities.deepFind(d, this.options.categoryField.columnName);
                    }
                    if (this.options.compareField.columnName) {
                        item[this.options.compareField.columnName] = neonUtilities.deepFind(d, this.options.compareField.columnName);
                    }
                    if (this.options.filterField.columnName) {
                        item[this.options.filterField.columnName] = neonUtilities.deepFind(d, this.options.filterField.columnName);
                    }
                    if (this.options.idField.columnName) {
                        item[this.options.idField.columnName] = neonUtilities.deepFind(d, this.options.idField.columnName);
                    }
                    if (this.options.nameField.columnName) {
                        item[this.options.nameField.columnName] = neonUtilities.deepFind(d, this.options.nameField.columnName);
                    }
                    if (this.options.objectIdField.columnName) {
                        item[this.options.objectIdField.columnName] = neonUtilities.deepFind(d, this.options.objectIdField.columnName);
                    }
                    if (this.options.objectNameField.columnName) {
                        item[this.options.objectNameField.columnName] = neonUtilities.deepFind(d, this.options.objectNameField.columnName);
                    }
                    if (this.options.percentField.columnName) {
                        item[this.options.percentField.columnName] = neonUtilities.deepFind(d, this.options.percentField.columnName);
                    }
                    if (this.options.predictedNameField.columnName) {
                        item[this.options.predictedNameField.columnName] = neonUtilities.deepFind(d,
                            this.options.predictedNameField.columnName);
                    }
                    if (this.options.sortField.columnName) {
                        item[this.options.sortField.columnName] = neonUtilities.deepFind(d, this.options.sortField.columnName);
                    }
                    if (this.options.typeField.columnName) {
                        item[this.options.typeField.columnName] = neonUtilities.deepFind(d, this.options.typeField.columnName);
                    }
                    if (this.options.dateField.columnName) {
                        item[this.options.dateField.columnName] = neonUtilities.deepFind(d, this.options.dateField.columnName);
                    }
                    if (this.options.flagLabel.columnName) {
                        item[this.options.flagLabel.columnName] = neonUtilities.deepFind(d, this.options.flagLabel.columnName);
                    }
                    if (this.options.flagSubLabel1.columnName) {
                        item[this.options.flagSubLabel1.columnName] = neonUtilities.deepFind(d, this.options.flagSubLabel1.columnName);
                    }
                    if (this.options.flagSubLabel2.columnName) {
                        item[this.options.flagSubLabel2.columnName] = neonUtilities.deepFind(d, this.options.flagSubLabel2.columnName);
                    }
                    if (this.options.flagSubLabel3.columnName) {
                        item[this.options.flagSubLabel3.columnName] = neonUtilities.deepFind(d, this.options.flagSubLabel3.columnName);
                    }

                    this.options.customEventsToPublish.forEach((config) => {
                        (config.fields || []).forEach((fieldsConfig) => {
                            item[fieldsConfig.columnName] = neonUtilities.deepFind(d, fieldsConfig.columnName);
                        });
                    });

                    for (let link of links) {
                        this.retreiveMedia(item, link);
                    }
                });

                this.neonFilters = this.filterService.getFiltersForFields(this.options.database.name,
                    this.options.table.name, [this.options.filterField.columnName]);

                if (this.options.showOnlyFiltered && this.neonFilters.length || !this.options.showOnlyFiltered) {
                    this.lastPage = (this.gridArray.length <= this.options.limit);
                    if (this.page > 1 && !this.lastPage) {
                        let offset = (this.page - 1) * this.options.limit;
                        this.pagingGrid = this.gridArray.slice(offset,
                            Math.min(this.page * this.options.limit, this.gridArray.length));
                    } else {
                        this.pagingGrid = this.gridArray.slice(0, this.options.limit);
                    }
                    this.showGrid = true;
                } else {
                    this.pagingGrid = [];
                    this.showGrid = false;
                }

                this.refreshVisualization();
                this.createMediaThumbnail();
                this.isLoading = false;

            } else {
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            console.error(this.options.title + ' Error:', e);
            this.errorMessage = 'Error';
            this.refreshVisualization();
        }
    }

    /**
     * Returns whether items are selectable (filterable).
     *
     * @return {boolean}
     */
    isSelectable() {
        return !!this.options.filterField.columnName || !!this.options.idField.columnName || this.options.openOnMouseClick;
    }

    /**
     * Returns whether the given item is selected (filtered).
     *
     * @arg {object} item
     * @return {boolean}
     */
    isSelected(item) {
        return (!!this.options.filterField.columnName &&
            this.filterExists(this.options.filterField.columnName, item[this.options.filterField.columnName]));
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
        /* tslint:disable:no-string-literal */
        if (!this.changeDetection['destroyed']) {
            this.changeDetection.detectChanges();
        }
        /* tslint:enable:no-string-literal */
    }

    /**
     * Removes the given filter from this visualization.
     *
     * @arg {object} filter
     * @override
     */
    removeFilter(filter: any) {
        this.filters = this.filters.filter((existingFilter: any) => {
            return existingFilter.id !== filter.id;
        });
    }

    /**
     * Retrieves the thumbnail grid using the given array of links.
     *
     * @arg {array} links
     * @private
     */
    private retreiveMedia(item, link) {
        let gridIndex = this.gridArray.length > 0 ? this.gridArray.length : 0;
        let grid = item;
        grid[this.options.linkField.columnName] = this.options.linkPrefix + link;
        this.gridArray[gridIndex] = grid;
    }

    /**
     * Returns multiple values as an array
     *
     * @arg {any} value
     * @private
     */
    private getArrayValues(value) {
        return value ? (Array.isArray(value) ?  value : value.toString().search(/,/g) > -1 ?  value.toString().split(',') : [value]) : [];
    }

    /**
     * Creates a media thumbnail for each item in the grid
     *
     * @private
     */
    private createMediaThumbnail() {
        //todo: when canvases lose focus the images disappear. May need to go back to div
        let canvases = this.thumbnailGrid.nativeElement.querySelectorAll('.thumbnail-view');

        this.pagingGrid.map((grid, index) => {
            let link = grid[this.options.linkField.columnName],
                fileType = link.substring(link.lastIndexOf('.') + 1).toLowerCase(),
                type = this.getMediaType(grid),
                objectId = grid[this.options.objectIdField.columnName],
                percentage = grid[this.options.percentField.columnName],
                comparison = grid[this.options.compareField.columnName],
                categoryId = grid[this.options.categoryField.columnName],
                thumbnail = canvases[index].getContext('2d');

            thumbnail.fillStyle = '#ffffff';
            thumbnail.fillRect(0, 0, this.options.canvasSize, this.options.canvasSize);

            switch (type) {
                case this.mediaTypes.image : {
                    let image: HTMLImageElement = new Image();
                    image.src = link;
                    image.onload = () => {
                        switch (this.options.cropAndScale) {
                            case 'both' : {
                                // Use the MIN to crop the scale
                                let size = Math.min(image.width, image.height);
                                let multiplier = this.options.canvasSize / size;
                                thumbnail.drawImage(image, 0, 0, image.width * multiplier, image.height * multiplier);
                                break;
                            }
                            case 'crop' : {
                                thumbnail.drawImage(image, 0, 0, image.width, image.height);
                                break;
                            }
                            case 'scale' : {
                                // Use the MAX to scale
                                let size = Math.max(image.width, image.height);
                                let multiplier = this.options.canvasSize / size;
                                thumbnail.drawImage(image, 0, 0, image.width * multiplier, image.height * multiplier);
                                break;
                            }
                            default : {
                                thumbnail.drawImage(image, 0, 0, this.options.canvasSize, this.options.canvasSize);
                            }
                        }
                    };
                    break;
                }
                case this.mediaTypes.video : {
                    let video: HTMLVideoElement = document.createElement('video');
                    video.src = link + '#t=1,1.1'; //1 second starting place for video screenshot

                    video.onloadeddata = () => {
                        switch (this.options.cropAndScale) {
                            case 'both' : {
                                // Use the MIN to crop the scale
                                let size = Math.min(video.width, video.height);
                                let multiplier = this.options.canvasSize / size;
                                thumbnail.drawImage(video, 0, 0, video.width * multiplier, video.height * multiplier);
                                break;
                            }
                            case 'crop' : {
                                thumbnail.drawImage(video, 0, 0, video.width, video.height);
                                break;
                            }
                            case 'scale' : {
                                // Use the MAX to scale
                                let size = Math.max(video.width, video.height);
                                let multiplier = this.options.canvasSize / size;
                                thumbnail.drawImage(video, 0, 0, video.width * multiplier, video.height * multiplier);
                                break;
                            }
                            default : {
                                thumbnail.drawImage(video, 0, 0, this.options.canvasSize, this.options.canvasSize);
                            }
                        }
                    };

                    video.onerror = () => {
                        if (link.includes('youtube')) {
                            let img: HTMLImageElement = new Image();
                            img.src = './assets/images/youtube_logo.png';
                            img.onload = () => {
                                thumbnail.drawImage(img, 2, 40, img.width - 12, img.height);
                            };
                        }
                    };

                    break;
                }
                case this.mediaTypes.audio : {
                    let image: HTMLImageElement = new Image();
                    image.src = '/assets/images/volume_up.svg';
                    image.onclick = () => this.displayMediaTab(grid);
                    image.onload = () => {
                        thumbnail.drawImage(image, 0, 0, this.options.canvasSize, this.options.canvasSize);
                    };

                    break;
                }
                default : {
                    // todo: get thumbnails of documents, pdf, and other similar types of media.
                    thumbnail.fillStyle = '#111111';
                    thumbnail.font = '20px Helvetica Neue';
                    thumbnail.fillText(fileType.toUpperCase(), 10, 30);
                }
            }

            // TODO Move this to a separate function and unit test all behavior.
            let borderColor = '';
            if (this.options.border) {
                switch (this.options.border) {
                    case 'percentField': {
                        if (typeof percentage !== 'undefined' && this.isNumber(percentage)) {
                            let percentFloat = parseFloat(percentage);
                            borderColor = ((percentFloat > this.options.borderPercentThreshold) ? 'blue' : 'red');
                        } else {
                            borderColor = 'grey';
                        }
                        break;
                    }
                    case 'percentCompare': {
                        if (typeof percentage !== 'undefined' && this.isNumber(percentage)) {
                            let percentFloat = parseFloat(percentage);
                            if ((percentFloat > this.options.borderPercentThreshold && comparison === this.options.borderCompareValue) ||
                                (percentFloat < this.options.borderPercentThreshold && comparison !== this.options.borderCompareValue)) {
                                borderColor = 'blue';
                            } else {
                                borderColor = 'red';
                            }
                        } else {
                            borderColor = 'grey';
                        }
                        break;
                    }
                    case 'valueCompare': {
                        borderColor = ((comparison === this.options.borderCompareValue) ? 'blue' : 'red');
                        break;
                    }
                    default: {
                        borderColor = 'grey';
                    }
                }
            } else if (objectId && categoryId) {
                borderColor = ((objectId === categoryId) ? 'blue' : 'red');
            }

            if (thumbnail.canvas.getAttribute('class').includes('border-mat-')) {
                thumbnail.canvas.setAttribute('class',
                    thumbnail.canvas.getAttribute('class').replace(thumbnail.canvas.getAttribute('class').split(' ').pop(), ''));
            }

            if (borderColor) {
                thumbnail.canvas.setAttribute('class', thumbnail.canvas.getAttribute('class') + ' ' + 'border-mat-' + borderColor);
            }
        });
    }

    /**
     * Selects the given grid item.
     *
     * @arg {object} item
     * @private
     */
    selectGridItem(item) {
        if (this.options.idField.columnName) {
            this.publishSelectId(item[this.options.idField.columnName]);
        }
        if (this.options.filterField.columnName) {
            this.createFilter(item[this.options.filterField.columnName]);
        }
        this.publishAnyCustomEvents(item, this.options.idField.columnName);
    }

    /**
     * returns the media type for the thumbnail
     * @arg {object} item
     * @return string
     */
    getMediaType(item) {
        let link = item[this.options.linkField.columnName];
        let fileType = link.substring(link.lastIndexOf('.') + 1).toLowerCase();
        return this.options.typeMap[fileType] ? this.options.typeMap[fileType] : item[this.options.typeField.columnName];
    }

    /**
     * checks to see if the media type is valid and a thumbnail image will be displayed
     * @arg {object} item
     * @return boolean
     */
    isValidMediaType(item) {
        if (this.getMediaType(item)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Opens media in browser tab
     *
     * @arg {object} item
     * @private
     */
    displayMediaTab(item) {
        if (this.options.openOnMouseClick) {
            window.open(item[this.options.linkField.columnName]);
        }
        this.publishAnyCustomEvents(item, this.options.idField.columnName);
    }

    /**
     * Sets filters for the visualization.
     *
     * @override
     */
    setupFilters() {
        let neonFilters = this.options.filterField.columnName ? this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, [this.options.filterField.columnName]) : [];
        this.filters = [];

        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.options.findField(neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                let filter = {
                    id: neonFilter.id,
                    field: field.columnName,
                    prettyField: field.prettyName,
                    value: value
                };
                if (!this.filterExists(filter.field, filter.value)) {
                    this.filters.push(filter);
                }
            }
        }
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
