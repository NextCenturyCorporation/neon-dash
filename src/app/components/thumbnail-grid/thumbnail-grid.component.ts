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

import { DomSanitizer } from '@angular/platform-browser';

import { AbstractSearchService, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterConfig } from '../../models/filter';
import { FilterCollection, ListFilterDesign, SimpleFilterDesign } from '../../util/filter.util';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldConfig } from '../../models/dataset';
import { MediaTypes } from '../../models/types';
import { CoreUtil } from '../../util/core.util';
import {
    CompoundFilterType,
    OptionChoices,
    SortOrder,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNumberOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../models/widget-option';
import { MatDialog } from '@angular/material';

export const ViewType = {
    CARD: 'card',
    DETAILS: 'details',
    TITLE: 'title'
};

@Component({
    selector: 'app-thumbnail-grid',
    templateUrl: './thumbnail-grid.component.html',
    styleUrls: ['./thumbnail-grid.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class ThumbnailGridComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    private CANVAS_SIZE: number = 100.0;

    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('thumbnailGrid') thumbnailGrid: ElementRef;

    public gridArray: any[] = [];

    public mediaTypes: any = MediaTypes;
    public view: any = ViewType;
    public constructedLinkField: string = 'constructedUrl';

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
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

        this.visualizationQueryPaginates = true;
    }

    /**
     * Creates Neon and visualization filter objects for the given text.
     *
     * @arg {string} text
     */
    createFilter(item: any) {
        let filters: FilterConfig[] = [];

        this.options.filterFields.filter((filterField) => !!filterField.columnName).forEach((filterField) => {
            let filterValues: any[] = typeof item[filterField.columnName] === 'undefined' ? [] :
                (Array.isArray(item[filterField.columnName]) ? item[filterField.columnName] : [item[filterField.columnName]]);
            if (filterValues.length) {
                filters.push(filterValues.length === 1 ? this.createFilterConfigOnItem(filterField, filterValues[0]) :
                    this.createFilterConfigOnList(filterField, filterValues));
            }
        });

        if (this.options.toggleFiltered) {
            this.toggleFilters(filters);
        } else {
            this.exchangeFilters(filters);
        }
    }

    private createFilterConfigOnItem(field: FieldConfig, value?: any): SimpleFilterDesign {
        return new SimpleFilterDesign(this.options.datastore.name, this.options.database.name, this.options.table.name, field.columnName,
            '=', value);
    }

    private createFilterConfigOnList(field: FieldConfig, values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.OR, this.options.datastore.name + '.' + this.options.database.name + '.' +
            this.options.table.name + '.' + field.columnName, '=', values);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    protected createOptions(): WidgetOption[] {
        return [
            new WidgetFieldOption('categoryField', 'Category Field', false),
            new WidgetFieldOption('compareField', 'Comparison Field', false),
            new WidgetFieldOption('dateField', 'Date Field', false),
            new WidgetFieldOption('filterField', 'Filter Field', false), // Deprecated
            new WidgetFieldOption('flagLabel', 'Flag Field', false),
            new WidgetFieldOption('flagSubLabel1', 'Flag Sub-Label Field 1', false),
            new WidgetFieldOption('flagSubLabel2', 'Flag Sub-Label Field 2', false),
            new WidgetFieldOption('flagSubLabel3', 'Flag Sub-Label Field 3', false),
            new WidgetFieldOption('idField', 'ID Field', true),
            new WidgetFieldOption('linkField', 'Link Field', false),
            new WidgetFieldOption('nameField', 'Name Field', false),
            new WidgetFieldOption('objectIdField', 'Object ID Field', false),
            new WidgetFieldOption('objectNameField', 'Actual Name Field', false),
            new WidgetFieldOption('percentField', 'Predicted Probability Field', false),
            new WidgetFieldOption('predictedNameField', 'Predicted Name Field', false),
            new WidgetFieldOption('sortField', 'Sort Field', false),
            new WidgetFieldOption('typeField', 'Type Field', false),
            new WidgetFieldArrayOption('filterFields', 'Filter Fields', false),
            new WidgetSelectOption('autoplay', 'Autoplay', false, false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('border', 'Border', false, ''),
            new WidgetFreeTextOption('borderCompareValue', 'Border Comparison Field Equals', false, '',
                this.optionsBorderIsPercentCompareOrValueCompare.bind(this)),
            new WidgetNumberOption('borderPercentThreshold', 'Border Probability Greater Than', false, 0.5,
                this.optionsBorderIsPercentCompareOrPercentField.bind(this)),
            new WidgetSelectOption('cropAndScale', 'Crop or Scale', false, '', [{
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
            new WidgetFreeTextOption('defaultLabel', 'Default Label', false, ''),
            new WidgetFreeTextOption('defaultPercent', 'Default Percent', false, ''),
            new WidgetSelectOption('detailedThumbnails', 'Detailed Thumbnails', false, false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, false, OptionChoices.YesFalseNoTrue),
            new WidgetFreeTextOption('id', 'ID', false, ''),
            new WidgetFreeTextOption('linkPrefix', 'Link Prefix', false, ''),
            new WidgetSelectOption('openOnMouseClick', 'Open Media on Mouse Click', false, true, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('showLabelName', 'Label Names', false, false, OptionChoices.HideFalseShowTrue),
            new WidgetSelectOption('sortDescending', 'Sort', false, false, OptionChoices.AscendingFalseDescendingTrue),
            new WidgetNonPrimitiveOption('textMap', 'Text Map', false, {}),
            new WidgetNonPrimitiveOption('typeMap', 'Type Map', false, {}),
            new WidgetSelectOption('viewType', 'View', false, ViewType.TITLE, [{
                prettyName: 'Title',
                variable: ViewType.TITLE
            }, {
                prettyName: 'Details',
                variable: ViewType.DETAILS
            }, {
                prettyName: 'Card',
                variable: ViewType.CARD
            }]),
            new WidgetNumberOption('canvasSize', 'Canvas Size', false, this.CANVAS_SIZE),
            new WidgetNonPrimitiveOption('truncateLabel', 'Truncate Label', false, { value: false, length: 0 }),
            new WidgetSelectOption('toggleFiltered', 'Toggle Filtered Items', false, false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('applyPreviousFilter', 'Apply the previous filter on remove filter action',
                false, false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {FilterConfig[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterConfig[] {
        return this.options.filterFields.reduce((designs, filterField) => {
            if (filterField.columnName) {
                // Match a single EQUALS filter on the specific filter field.
                designs.push(this.createFilterConfigOnItem(filterField));
                // Match a compound filter with one or more EQUALS filters on the specific filter field.
                designs.push(this.createFilterConfigOnList(filterField));
            }
            return designs;
        }, [] as FilterConfig[]);
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
        let filters = sharedFilters;

        if (this.options.linkField && this.options.linkField.columnName && this.options.sortField.columnName) {
            filters = [
                ...filters,
                this.searchService.buildFilterClause(options.linkField.columnName, '!=', null),
                this.searchService.buildFilterClause(options.linkField.columnName, '!=', '')
            ];
        }

        this.searchService.updateFieldsToMatchAll(query);

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(filters));

        if (options.sortField.columnName) {
            this.searchService.updateSort(query, options.sortField.columnName,
                options.sortDescending ? SortOrder.DESCENDING : SortOrder.ASCENDING);
        }

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
        return 'Item' + (count === 1 ? '' : 's');
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

    getTruncatedTitle(item): string {
        let title = item[this.options.flagLabel.columnName];
        if (title.length > this.options.truncateLabel.length) {
            title = title.substring(0, this.options.truncateLabel.length).concat('...');
        }

        return title;
    }

    /**
     * Appends the given type to the given link if it is not already there.
     *
     * @arg {string} link
     * @arg {string} prefix
     * @return {string}
     */
    appendType(link: string, type: string) {
        return ((!!type && link.indexOf(type) < 0 && link.indexOf('.') < 0) ? (link + '.' + type) : link);
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.idField.columnName);
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
    transformVisualizationQueryResults(options: any, results: any[], filters: FilterCollection): number {
        this.gridArray = [];

        results.forEach((result) => {
            let item = {
                _filtered: this.options.filterFields.length ? this.options.filterFields.every((filterField) => {
                    if (filterField.columnName) {
                        let filterConfig: FilterConfig = this.createFilterConfigOnItem(filterField, result[filterField.columnName]);
                        let listFilterConfig: FilterConfig = this.createFilterConfigOnList(filterField, [result[filterField.columnName]]);
                        return filters.isFiltered(filterConfig) || filters.isFiltered(listFilterConfig);
                    }
                    return false;
                }) : false
            };

            let links = [];
            if (options.linkField && options.linkField.columnName) {
                links = this.getArrayValues(CoreUtil.deepFind(result, options.linkField.columnName) || '');
            }

            // TODO THOR-1335 Wrap all of the field properties in the data item to avoid any overlap with the _filtered property.
            if (options.categoryField.columnName) {
                item[options.categoryField.columnName] = CoreUtil.deepFind(result, options.categoryField.columnName);
            }
            if (options.compareField.columnName) {
                item[options.compareField.columnName] = CoreUtil.deepFind(result, options.compareField.columnName);
            }
            options.filterFields.filter((filterField) => !!filterField.columnName).forEach((filterField) => {
                item[filterField.columnName] = CoreUtil.deepFind(result, filterField.columnName);
            });
            if (options.idField.columnName) {
                item[options.idField.columnName] = CoreUtil.deepFind(result, options.idField.columnName);
            }
            if (options.nameField.columnName) {
                item[options.nameField.columnName] = CoreUtil.deepFind(result, options.nameField.columnName);
            }
            if (options.objectIdField.columnName) {
                item[options.objectIdField.columnName] = CoreUtil.deepFind(result, options.objectIdField.columnName);
            }
            if (options.objectNameField.columnName) {
                item[options.objectNameField.columnName] = CoreUtil.deepFind(result, options.objectNameField.columnName);
            }
            if (options.percentField.columnName) {
                item[options.percentField.columnName] = CoreUtil.deepFind(result, options.percentField.columnName);
            }
            if (options.predictedNameField.columnName) {
                item[options.predictedNameField.columnName] = CoreUtil.deepFind(result, options.predictedNameField.columnName);
            }
            if (options.sortField.columnName) {
                item[options.sortField.columnName] = CoreUtil.deepFind(result, options.sortField.columnName);
            }
            if (options.typeField.columnName) {
                item[options.typeField.columnName] = CoreUtil.deepFind(result, options.typeField.columnName);
            }
            if (options.dateField.columnName) {
                item[options.dateField.columnName] = CoreUtil.deepFind(result, options.dateField.columnName);
            }
            if (options.flagLabel.columnName) {
                item[options.flagLabel.columnName] = CoreUtil.deepFind(result, options.flagLabel.columnName);
            }
            if (options.flagSubLabel1.columnName) {
                item[options.flagSubLabel1.columnName] = CoreUtil.deepFind(result, options.flagSubLabel1.columnName);
            }
            if (options.flagSubLabel2.columnName) {
                item[options.flagSubLabel2.columnName] = CoreUtil.deepFind(result, options.flagSubLabel2.columnName);
            }
            if (options.flagSubLabel3.columnName) {
                item[options.flagSubLabel3.columnName] = CoreUtil.deepFind(result, options.flagSubLabel3.columnName);
            }

            options.customEventsToPublish.forEach((config) => {
                (config.fields || []).forEach((fieldsConfig) => {
                    item[fieldsConfig.columnName] = CoreUtil.deepFind(result, fieldsConfig.columnName);
                });
            });

            if (links.length) {
                for (let link of links) {
                    this.retreiveMedia(item, link);
                }
            } else {
                this.gridArray.push(item);
            }

            this.showingZeroOrMultipleElementsPerResult = this.showingZeroOrMultipleElementsPerResult || (links.length > 1);
        });

        return this.gridArray.length;
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
    isSelectable(): boolean {
        return !!this.options.idField.columnName || this.options.openOnMouseClick;
    }

    /**
     * Returns whether the given item is selected (filtered).
     *
     * @arg {object} item
     * @return {boolean}
     */
    isSelected(item): boolean {
        return item ? !!item._filtered : false;
    }

    /**
     * Initializes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        if (!this.options.flagLabel.columnName) {
            this.options.flagLabel = this.options.idField;
        }

        // Backwards compatibility (showOnlyFiltered deprecated due to its redundancy with hideUnfiltered).
        this.options.hideUnfiltered = this.injector.get('showOnlyFiltered', this.options.hideUnfiltered);

        // Backwards compatibility (filterField deprecated due to its redundancy with filterFields).
        if (this.options.filterField.columnName && !this.options.filterFields.length) {
            this.options.filterFields = [this.options.filterField];
        }
    }

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        this.gridArray.forEach((item) => {
            item._filtered = this.options.filterFields.every((filterField) => {
                if (filterField.columnName) {
                    let filterConfig: FilterConfig = this.createFilterConfigOnItem(filterField, item[filterField.columnName]);
                    let listFilterConfig: FilterConfig = this.createFilterConfigOnList(filterField, [item[filterField.columnName]]);
                    return filters.isFiltered(filterConfig) || filters.isFiltered(listFilterConfig);
                }
                return false;
            });
        });
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        /* eslint-disable-next-line dot-notation */
        if (!this.changeDetection['destroyed']) {
            this.changeDetection.detectChanges();
        }
        this.createMediaThumbnail();
        this.thumbnailGrid.nativeElement.scrollTop = 0;
    }

    /**
     * Retrieves the thumbnail grid using the given array of links. Prepends a linkPrefix if it exists and
     * appends a type to the link if necessary
     * @arg {array} links
     * @private
     */
    private retreiveMedia(item, link) {
        let gridIndex = this.gridArray.length > 0 ? this.gridArray.length : 0;
        let grid = item;
        if (!link || link === 'n/a') {
            grid[this.constructedLinkField] = '';
        } else {
            grid[this.constructedLinkField] = this.options.linkPrefix + this.appendType(link, grid[this.options.typeField.columnName]);
        }

        this.gridArray[gridIndex] = grid;
    }

    /**
     * Returns multiple values as an array
     *
     * @arg {any} value
     * @private
     */
    private getArrayValues(value) {
        return value ? (Array.isArray(value) ? value : value.toString().search(/,/g) > -1 ? value.toString().split(',') : [value]) : [];
    }

    private defaultDocumentThumbnail(thumbnail) {
        let img: HTMLImageElement = new Image();
        img.src = './assets/icons/dashboard/document.svg';

        img.onload = () => {
            if (this.options.viewType === ViewType.CARD) {
                thumbnail.drawImage(img, this.options.canvasSize * 0.41, this.options.canvasSize * 0.25,
                    img.width + 2, img.height + 6);
            } else {
                thumbnail.drawImage(img, this.options.canvasSize * 0.37, this.options.canvasSize * 0.35,
                    img.width - 4, img.height);
            }
        };

        return thumbnail;
    }

    private invalidLinkThumbnail(thumbnail) {
        let img: HTMLImageElement = new Image();
        img.src = './assets/icons/dashboard/invalid_link.svg';

        img.onload = () => {
            if (this.options.viewType === ViewType.CARD) {
                thumbnail.drawImage(img, this.options.canvasSize * 0.41, this.options.canvasSize * 0.25,
                    img.width + 2, img.height + 6);
            } else {
                thumbnail.drawImage(img, this.options.canvasSize * 0.37, this.options.canvasSize * 0.35,
                    img.width - 4, img.height);
            }
        };

        return thumbnail;
    }

    /**
     * Creates a media thumbnail for each item in the grid
     *
     * @private
     */
    private createMediaThumbnail() {
        // Todo: when canvases lose focus the images disappear. May need to go back to div
        let canvases = this.thumbnailGrid.nativeElement.querySelectorAll('.thumbnail-view');

        if (canvases.length) {
            // TODO Move this code into separate functions
            /* eslint-disable-next-line complexity */
            this.gridArray.forEach((grid, index) => {
                let link = grid[this.constructedLinkField];
                let type = this.getMediaType(grid);
                let objectId = grid[this.options.objectIdField.columnName];
                let percentage = grid[this.options.percentField.columnName];
                let comparison = grid[this.options.compareField.columnName];
                let categoryId = grid[this.options.categoryField.columnName];
                let thumbnail = canvases[index].getContext('2d');

                thumbnail.fillStyle = '#ffffff';
                thumbnail.fillRect(0, 0, this.options.canvasSize, this.options.canvasSize);

                if (link) {
                    switch (type) {
                        case this.mediaTypes.image: {
                            let image: HTMLImageElement = new Image();
                            image.src = link;
                            image.onload = () => {
                                switch (this.options.cropAndScale) {
                                    case 'both': {
                                        // Use the MIN to crop the scale
                                        let size = Math.min(image.width, image.height);
                                        let multiplier = this.options.canvasSize / size;
                                        thumbnail.drawImage(image, 0, 0, image.width * multiplier, image.height * multiplier);
                                        break;
                                    }
                                    case 'crop': {
                                        thumbnail.drawImage(image, 0, 0, image.width, image.height);
                                        break;
                                    }
                                    case 'scale': {
                                        // Use the MAX to scale
                                        let size = Math.max(image.width, image.height);
                                        let multiplier = this.options.canvasSize / size;
                                        thumbnail.drawImage(image, 0, 0, image.width * multiplier, image.height * multiplier);
                                        break;
                                    }
                                    default: {
                                        thumbnail.drawImage(image, 0, 0, this.options.canvasSize, this.options.canvasSize);
                                    }
                                }
                            };
                            break;
                        }
                        case this.mediaTypes.video: {
                            let video: HTMLVideoElement = document.createElement('video');
                            video.src = link + '#t=1,1.1'; // 1 second starting place for video screenshot

                            video.onloadeddata = () => {
                                switch (this.options.cropAndScale) {
                                    case 'both': {
                                        // Use the MIN to crop the scale
                                        let size = Math.min(video.width, video.height);
                                        let multiplier = this.options.canvasSize / size;
                                        thumbnail.drawImage(video, 0, 0, video.width * multiplier, video.height * multiplier);
                                        break;
                                    }
                                    case 'crop': {
                                        thumbnail.drawImage(video, 0, 0, video.width, video.height);
                                        break;
                                    }
                                    case 'scale': {
                                        // Use the MAX to scale
                                        let size = Math.max(video.width, video.height);
                                        let multiplier = this.options.canvasSize / size;
                                        thumbnail.drawImage(video, 0, 0, video.width * multiplier, video.height * multiplier);
                                        break;
                                    }
                                    default: {
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
                        case this.mediaTypes.audio: {
                            let image: HTMLImageElement = new Image();
                            image.src = '/assets/images/volume_up.svg';
                            image.onclick = () => this.displayMediaTab(grid);
                            image.onload = () => {
                                thumbnail.drawImage(image, 0, 0, this.options.canvasSize, this.options.canvasSize);
                            };

                            break;
                        }
                        default: {
                            thumbnail = this.defaultDocumentThumbnail(thumbnail);
                        }
                    }
                } else {
                    thumbnail = this.invalidLinkThumbnail(thumbnail);
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
                                if ((percentFloat > this.options.borderPercentThreshold &&
                                    comparison === this.options.borderCompareValue) ||
                                    (percentFloat < this.options.borderPercentThreshold &&
                                    comparison !== this.options.borderCompareValue)) {
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
                    thumbnail.canvas.setAttribute('class', thumbnail.canvas.getAttribute('class') + ' border-mat-' + borderColor);
                }
            });
        }
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
        if (this.options.filterFields.length) {
            this.createFilter(item);
        }
        this.publishAnyCustomEvents(item, this.options.idField.columnName);
    }

    /**
     * Returns the media type for the thumbnail
     * @arg {object} item
     * @return string
     */
    getMediaType(item) {
        let link = item[this.constructedLinkField];
        let fileType = link ? link.substring(link.lastIndexOf('.') + 1).toLowerCase() : '';

        return this.options.typeMap[fileType] ? this.options.typeMap[fileType] : item[this.options.typeField.columnName];
    }

    /**
     * Checks to see if the media type is valid and a thumbnail image will be displayed
     * @arg {object} item
     * @return boolean
     */
    isValidMediaType(item) {
        if (this.getMediaType(item)) {
            return true;
        }
        return false;
    }

    /**
     * Opens media in browser tab
     *
     * @arg {object} item
     * @private
     */
    displayMediaTab(item) {
        if (item[this.constructedLinkField]) {
            if (this.options.openOnMouseClick) {
                window.open(item[this.constructedLinkField]);
            }
            this.publishAnyCustomEvents(item, this.constructedLinkField);
        }
    }

    sanitize(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
