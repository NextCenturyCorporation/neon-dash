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

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData, MediaTypes } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import * as neon from 'neon-framework';
import * as _ from 'lodash';

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
    private CANVAS_SIZE: number = 100.0;

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

    public gridArray: any[] = [];
    public pagingGrid: any[] = [];

    public lastPage: boolean = true;
    public page: number = 1;
    public neonFilters: any[] = [];
    public showGrid: boolean;
    public mediaTypes: any = MediaTypes;

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef,
        private sanitizer: DomSanitizer
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('categoryField', 'Category Field', false),
            new WidgetFieldOption('compareField', 'Comparison Field', false),
            new WidgetFieldOption('dateField', 'Date Field', false),
            new WidgetFieldOption('filterField', 'Filter Field', false),
            new WidgetFieldOption('flagLabel', 'Flag Field', false),
            new WidgetFieldOption('flagSubLabel1', 'Flag Sub-Label Field 1', false),
            new WidgetFieldOption('flagSubLabel2', 'Flag Sub-Label Field 2', false),
            new WidgetFieldOption('flagSubLabel3', 'Flag Sub-Label Field 3', false),
            new WidgetFieldOption('idField', 'ID Field', false),
            new WidgetFieldOption('linkField', 'Link Field', true),
            new WidgetFieldOption('nameField', 'Name Field', false),
            new WidgetFieldOption('objectIdField', 'Object ID Field', false),
            new WidgetFieldOption('objectNameField', 'Actual Name Field', false),
            new WidgetFieldOption('percentField', 'Predicted Probability Field', false),
            new WidgetFieldOption('predictedNameField', 'Predicted Name Field', false),
            new WidgetFieldOption('sortField', 'Sort Field', true),
            new WidgetFieldOption('typeField', 'Type Field', false)
        ];
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
            this.addNeonFilter(this.options, runQuery, filter, clause);
        } else if (this.filters.length === 1) {
            if (!this.filterExists(filter.field, filter.value)) {
                filter.id = this.filters[0].id;
                this.filters = [filter];
                this.replaceNeonFilter(this.options, runQuery, filter, clause);
            }
        } else {
            this.removeAllFilters(this.options, [].concat(this.filters), () => {
                this.filters = [filter];
                this.addNeonFilter(this.options, runQuery, filter, clause);
            });
        }
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('autoplay', 'Autoplay', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('border', 'Border', ''),
            new WidgetFreeTextOption('borderCompareValue', 'Border Comparison Field Equals', '',
                this.optionsBorderIsPercentCompareOrValueCompare),
            new WidgetFreeTextOption('borderPercentThreshold', 'Border Probability Greater Than', 0.5,
                this.optionsBorderIsPercentCompareOrPercentField),
            new WidgetSelectOption('cropAndScale', 'Crop or Scale', '', [{
                prettyName: 'None',
                variable: ''
            }, {
                prettyName: 'Scale',
                variable: 'scale'
            }, {
                prettyName: 'Crop',
                variable: 'crop'
            }, {
                prettyName: 'Both',
                variable: 'both'
            }]),
            new WidgetFreeTextOption('defaultLabel', 'Default Label', ''),
            new WidgetFreeTextOption('defaultPercent', 'Default Percent', ''),
            new WidgetSelectOption('detailedThumbnails', 'Detailed Thumbnails', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.YesFalseNoTrue),
            new WidgetFreeTextOption('id', 'ID', ''),
            new WidgetFreeTextOption('linkPrefix', 'Link Prefix', ''),
            new WidgetSelectOption('openOnMouseClick', 'Open Media on Mouse Click', true, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('showLabelName', 'Label Names', false, OptionChoices.HideFalseShowTrue),
            new WidgetSelectOption('sortDescending', 'Sort', false, OptionChoices.AscendingFalseDescendingTrue),
            new WidgetNonPrimitiveOption('textMap', 'Text Map', {}),
            new WidgetNonPrimitiveOption('typeMap', 'Type Map', {})
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
        let query = new neon.query.Query().selectFrom(options.database.name, options.table.name);

        let fields = [options.linkField.columnName, options.sortField.columnName];

        if (options.categoryField.columnName) {
            fields.push(options.categoryField.columnName);
        }

        if (options.compareField.columnName) {
            fields.push(options.compareField.columnName);
        }

        if (options.filterField.columnName) {
            fields.push(options.filterField.columnName);
        }

        if (options.idField.columnName) {
            fields.push(options.idField.columnName);
        }

        if (options.nameField.columnName) {
            fields.push(options.nameField.columnName);
        }

        if (options.objectIdField.columnName) {
            fields.push(options.objectIdField.columnName);
        }

        if (options.objectNameField.columnName) {
            fields.push(options.objectNameField.columnName);
        }

        if (options.percentField.columnName) {
            fields.push(options.percentField.columnName);
        }

        if (options.predictedNameField.columnName) {
            fields.push(options.predictedNameField.columnName);
        }

        if (options.typeField.columnName) {
            fields.push(options.typeField.columnName);
        }

        if (options.dateField.columnName) {
            fields.push(options.dateField.columnName);
        }

        if (options.flagLabel.columnName) {
            fields.push(options.flagLabel.columnName);
        }

        if (options.flagSubLabel1.columnName) {
            fields.push(options.flagSubLabel1.columnName);
        }

        if (options.flagSubLabel2.columnName) {
            fields.push(options.flagSubLabel2.columnName);
        }

        if (options.flagSubLabel3.columnName) {
            fields.push(options.flagSubLabel3.columnName);
        }

        let wheres: neon.query.WherePredicate[] = [neon.query.where(options.linkField.columnName, '!=', null),
            neon.query.where(options.linkField.columnName, '!=', '')];

        if (options.filter) {
            wheres.push(neon.query.where(options.filter.lhs, options.filter.operator, options.filter.rhs));
        }

        if (this.hasUnsharedFilter()) {
            wheres.push(neon.query.where(options.unsharedFilterField.columnName, '=', options.unsharedFilterValue));
        }

        options.customEventsToPublish.forEach((config) => {
            (config.fields || []).forEach((fieldsConfig) => {
                if (fields.indexOf(fieldsConfig.columnName) < 0) {
                    fields.push(fieldsConfig.columnName);
                }
            });
        });

        return query.withFields(fields).where(wheres.length > 1 ? neon.query.and.apply(neon.query, wheres) : wheres[0])
            .sortBy(options.sortField.columnName, options.sortDescending ? neonVariables.DESCENDING : neonVariables.ASCENDING);
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

        if (this.options.hideUnfiltered && !this.neonFilters.length) {
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
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 30;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Thumbnail Grid';
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
     * Returns whether the visualization data query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    isValidQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.linkField.columnName && options.sortField.columnName);
    }

    /**
     * Handles the given response data for a successful visualization data query created using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} response
     * @override
     */
    onQuerySuccess(options: any, response: any) {
        this.gridArray = [];
        this.errorMessage = '';
        this.lastPage = true;

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.isLoading++;
                response.data.forEach((d) => {
                    let item = {},
                         links = [];

                    if (options.linkField.columnName) {
                        links = this.getArrayValues(neonUtilities.deepFind(d, options.linkField.columnName) || '');
                    }
                    if (options.categoryField.columnName) {
                        item[options.categoryField.columnName] = neonUtilities.deepFind(d, options.categoryField.columnName);
                    }
                    if (options.compareField.columnName) {
                        item[options.compareField.columnName] = neonUtilities.deepFind(d, options.compareField.columnName);
                    }
                    if (options.filterField.columnName) {
                        item[options.filterField.columnName] = neonUtilities.deepFind(d, options.filterField.columnName);
                    }
                    if (options.idField.columnName) {
                        item[options.idField.columnName] = neonUtilities.deepFind(d, options.idField.columnName);
                    }
                    if (options.nameField.columnName) {
                        item[options.nameField.columnName] = neonUtilities.deepFind(d, options.nameField.columnName);
                    }
                    if (options.objectIdField.columnName) {
                        item[options.objectIdField.columnName] = neonUtilities.deepFind(d, options.objectIdField.columnName);
                    }
                    if (options.objectNameField.columnName) {
                        item[options.objectNameField.columnName] = neonUtilities.deepFind(d, options.objectNameField.columnName);
                    }
                    if (options.percentField.columnName) {
                        item[options.percentField.columnName] = neonUtilities.deepFind(d, options.percentField.columnName);
                    }
                    if (options.predictedNameField.columnName) {
                        item[options.predictedNameField.columnName] = neonUtilities.deepFind(d, options.predictedNameField.columnName);
                    }
                    if (options.sortField.columnName) {
                        item[options.sortField.columnName] = neonUtilities.deepFind(d, options.sortField.columnName);
                    }
                    if (options.typeField.columnName) {
                        item[options.typeField.columnName] = neonUtilities.deepFind(d, options.typeField.columnName);
                    }
                    if (options.dateField.columnName) {
                        item[options.dateField.columnName] = neonUtilities.deepFind(d, options.dateField.columnName);
                    }
                    if (options.flagLabel.columnName) {
                        item[options.flagLabel.columnName] = neonUtilities.deepFind(d, options.flagLabel.columnName);
                    }
                    if (options.flagSubLabel1.columnName) {
                        item[options.flagSubLabel1.columnName] = neonUtilities.deepFind(d, options.flagSubLabel1.columnName);
                    }
                    if (options.flagSubLabel2.columnName) {
                        item[options.flagSubLabel2.columnName] = neonUtilities.deepFind(d, options.flagSubLabel2.columnName);
                    }
                    if (options.flagSubLabel3.columnName) {
                        item[options.flagSubLabel3.columnName] = neonUtilities.deepFind(d, options.flagSubLabel3.columnName);
                    }

                    options.customEventsToPublish.forEach((config) => {
                        (config.fields || []).forEach((fieldsConfig) => {
                            item[fieldsConfig.columnName] = neonUtilities.deepFind(d, fieldsConfig.columnName);
                        });
                    });

                    for (let link of links) {
                        this.retreiveMedia(item, link);
                    }
                });

                this.neonFilters = this.filterService.getFiltersForFields(options.database.name, options.table.name,
                    [options.filterField.columnName]);

                if (options.hideUnfiltered && this.neonFilters.length || !options.hideUnfiltered) {
                    this.page = (this.gridArray.length < (((this.page - 1) * options.limit) + 1)) ? 1 : this.page;
                    this.updatePageData();
                } else {
                    this.pagingGrid = [];
                    this.showGrid = false;
                    this.refreshVisualization();
                    this.createMediaThumbnail();
                }

                this.isLoading--;

            } else {
                this.pagingGrid = [];
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            console.error(options.title + ' Error:', e);
            this.errorMessage = 'Error';
            this.refreshVisualization();
        }
    }

    /**
     * Returns whether the border property in the given options is percentCompare or percentField.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsBorderIsPercentCompareOrPercentField(options: any): boolean {
        return options.border === 'percentCompare' || options.border === 'percentField';
    }

    /**
     * Returns whether the border property in the given options is percentCompare or valueCompare.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsBorderIsPercentCompareOrValueCompare(options: any): boolean {
        return options.border === 'percentCompare' || options.border === 'valueCompare';
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
        return (!!this.options.filterField.columnName && this.filterExists(this.options.filterField.columnName,
            item[this.options.filterField.columnName]));
    }

    /**
     * Initializes the thumbnail grid by running its query.
     *
     * @override
     */
    postInit() {
        if (!this.options.sortField.columnName) {
            this.options.sortField = this.options.percentField;
        }

        if (!this.options.flagLabel.columnName) {
            this.options.flagLabel = this.options.idField;
        }

        // Backwards compatibility (showOnlyFiltered deprecated due to its redundancy with hideUnfiltered).
        this.options.hideUnfiltered = this.injector.get('showOnlyFiltered', this.options.hideUnfiltered);
        // Backwards compatibility (ascending deprecated and replaced by sortDescending).
        this.options.sortDescending = !(this.injector.get('ascending', !this.options.sortDescending));

        this.showGrid = !this.options.hideUnfiltered;

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
            thumbnail.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

            switch (type) {
                case this.mediaTypes.image : {
                    let image: HTMLImageElement = new Image();
                    image.src = link;
                    image.onload = () => {
                        switch (this.options.cropAndScale) {
                            case 'both' : {
                                // Use the MIN to crop the scale
                                let size = Math.min(image.width, image.height);
                                let multiplier = this.CANVAS_SIZE / size;
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
                                let multiplier = this.CANVAS_SIZE / size;
                                thumbnail.drawImage(image, 0, 0, image.width * multiplier, image.height * multiplier);
                                break;
                            }
                            default : {
                                thumbnail.drawImage(image, 0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
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
                                let multiplier = this.CANVAS_SIZE / size;
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
                                let multiplier = this.CANVAS_SIZE / size;
                                thumbnail.drawImage(video, 0, 0, video.width * multiplier, video.height * multiplier);
                                break;
                            }
                            default : {
                                thumbnail.drawImage(video, 0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
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
                        thumbnail.drawImage(image, 0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
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
        if (this.options.openOnMouseClick) {
            window.open(item[this.options.linkField.columnName]);
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
                let field = this.findField(this.options.fields, neonFilter.filter.whereClause.lhs);
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
