/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';

import {
    AbstractFilterDesign,
    AbstractSearchService,
    CompoundFilterType,
    ConfigOptionFieldArray,
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOptionNumber,
    ConfigOptionNonPrimitive,
    ConfigOption,
    ConfigOptionSelect,
    CoreUtil,
    FieldConfig,
    FieldKey,
    FilterClause,
    FilterCollection,
    ListFilterDesign,
    OptionChoices,
    OptionType,
    SearchObject,
    SortOrder
} from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { MediaTypes } from '../../models/types';
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

    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;
    @ViewChild('thumbnailGrid', { static: true }) thumbnailGrid: ElementRef;

    public gridArray: any[] = [];
    public annotatedClasses: Map<string, string> = new Map<string, string>();

    public mediaTypes: any = MediaTypes;
    public view: any = ViewType;
    public constructedLinkField: string = 'constructedUrl';

    // Save the values of the filters in the FilterService that are compatible with this visualization's filters.
    private _filterFieldsToFilteredValues: Map<string, any[]> = new Map<string, any[]>();

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        ref: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
        dialog: MatDialog,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
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
        let filters: AbstractFilterDesign[] = [];
        let filtersToDelete: AbstractFilterDesign[] = [];

        this.options.filterFields.filter((field) => !!field.columnName).forEach((field) => {
            // Get all the values for the filter field from the data item.
            const values: any[] = typeof item[field.columnName] === 'undefined' ? [] : (Array.isArray(item[field.columnName]) ?
                item[field.columnName] : [item[field.columnName]]);

            // Change or toggle the filtered values for the filter field.
            const filteredValues: any[] = CoreUtil.changeOrToggleMultipleValues(values,
                this._filterFieldsToFilteredValues.get(field.columnName) || [], this.options.toggleFiltered);

            this._filterFieldsToFilteredValues.set(field.columnName, filteredValues);

            if (filteredValues.length) {
                // Create a single filter on the filtered values.
                filters.push(this.createFilterDesignOnList(field, filteredValues));
            } else {
                // If we won't add any filters, create a FilterDesign without a value to delete all the old filters on the filter field.
                filtersToDelete.push(this.createFilterDesignOnList(field));
            }
        });

        this.exchangeFilters(filters, filtersToDelete);
    }

    private createFilterDesignOnList(field: FieldConfig, values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.OR, this.options.datastore.name + '.' + this.options.database.name + '.' +
            this.options.table.name + '.' + field.columnName, '=', values);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('annotationClassField', 'Annotation Class Field', false),
            new ConfigOptionField('annotationStateField', 'Annotation State Field', false),
            new ConfigOptionField('datastoreIdField', 'Annotation Datastore UUID Field', false),
            new ConfigOptionField('dateField', 'Date Field', false),
            new ConfigOptionField('flagLabel', 'Flag Field', false),
            new ConfigOptionField('flagSubLabel1', 'Flag Sub-Label Field 1', false),
            new ConfigOptionField('flagSubLabel2', 'Flag Sub-Label Field 2', false),
            new ConfigOptionField('flagSubLabel3', 'Flag Sub-Label Field 3', false),
            new ConfigOptionField('idField', 'ID Field', true),
            new ConfigOptionField('linkField', 'Link Field', false),
            new ConfigOptionField('nameField', 'Name Field', false),
            new ConfigOptionField('compareField', 'Predicted Label Comparison Field', false),
            new ConfigOptionField('percentField', 'Predicted Label Confidence Field', false),
            new ConfigOptionField('predictedClassField', 'Predicted Class Field', false),
            new ConfigOptionField('sortField', 'Sort Field', false),
            new ConfigOptionField('truthClassField', 'Truth Class Field', false),
            new ConfigOptionField('typeField', 'Type Field', false),
            new ConfigOptionFieldArray('filterFields', 'Filter Fields', false),

            new ConfigOptionField('categoryField', 'Category Field', false, true), // Deprecated
            new ConfigOptionField('filterField', 'Filter Field', false, true), // Deprecated
            new ConfigOptionField('objectIdField', 'Object ID Field', false, true), // Deprecated
            new ConfigOptionField('objectNameField', 'Actual Name Field', false, true), // Deprecated (please use truthClassField)
            new ConfigOptionField('predictedNameField', 'Predicted Name Field', false, true), // Deprecated (please use predictedClassField)

            // The additionalAnnotationFields can be names of existing fields, names of new fields, or FieldConfig objects.
            new ConfigOptionNonPrimitive('additionalAnnotationFields', 'Additional Annotation Fields ', false, [],
                this.optionsAnnotationsAreNotActive.bind(this)),
            new ConfigOptionSelect('autoplay', 'Autoplay', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionFreeText('border', 'Border', false, ''),
            new ConfigOptionFreeText('borderCompareValue', 'Border Comparison Field Equals', false, '',
                this.optionsBorderIsNotPercentCompareOrValueCompare.bind(this)),
            new ConfigOptionNumber('borderPercentThreshold', 'Border Probability Greater Than', false, 0.5,
                this.optionsBorderIsNotPercentCompareOrPercentField.bind(this)),
            new ConfigOptionSelect('cropAndScale', 'Crop or Scale', false, '', [{
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
            new ConfigOptionFreeText('defaultLabel', 'Default Thumbnail Label', false, ''),
            new ConfigOptionFreeText('defaultPercent', 'Default Thumbnail Percent', false, ''),
            new ConfigOptionSelect('detailedThumbnails', 'Detailed Thumbnails', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('ignoreSelf', 'Filter Self', false, false, OptionChoices.YesFalseNoTrue),
            new ConfigOptionNumber('canvasSize', 'Image Thumbnail Size', false, this.CANVAS_SIZE),
            new ConfigOptionFreeText('linkPrefix', 'Link Prefix', false, ''),
            new ConfigOptionSelect('openOnMouseClick', 'Open Media on Mouse Click', false, true, OptionChoices.YesFalseNoTrue),
            new ConfigOptionSelect('applyPreviousFilter', 'Revert to Previous Filter',
                false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionFreeText('id', 'Selected ID', false, ''),
            new ConfigOptionSelect('showLabelName', 'Show Thumbnail Label Names', false, false, OptionChoices.HideFalseShowTrue),
            new ConfigOptionSelect('sortDescending', 'Sort Direction', false, false, OptionChoices.AscendingFalseDescendingTrue),
            new ConfigOptionNonPrimitive('textMap', 'Text Map', false, {}),
            new ConfigOptionSelect('toggleFiltered', 'Toggle Filtered Thumbnails', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionNonPrimitive('truncateLabel', 'Truncate Labels', false, { value: false, length: 0 }),
            new ConfigOptionNonPrimitive('typeMap', 'Type Map', false, {}),
            new ConfigOptionSelect('viewType', 'View', false, ViewType.TITLE, [{
                prettyName: 'Title',
                variable: ViewType.TITLE
            }, {
                prettyName: 'Details',
                variable: ViewType.DETAILS
            }, {
                prettyName: 'Card',
                variable: ViewType.CARD
            }])
        ];
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {AbstractFilterDesign[]}
     * @override
     */
    protected designEachFilterWithNoValues(): AbstractFilterDesign[] {
        return this.options.filterFields.reduce((designs, filterField) => {
            if (filterField.columnName) {
                // Match a filter with one or more EQUALS filters on the specific filter field.
                designs.push(this.createFilterDesignOnList(filterField));
            }
            return designs;
        }, [] as AbstractFilterDesign[]);
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {SearchObject} SearchObject
     * @arg {FilterClause[]} filters
     * @return {SearchObject}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: SearchObject, filters: FilterClause[]): SearchObject {
        this.searchService.withFilter(query, this.searchService.createCompoundFilterClause(filters.concat(options.linkField.columnName ? [
            this.searchService.createFilterClause({
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.linkField.columnName
            } as FieldKey, '!=', null),
            this.searchService.createFilterClause({
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.linkField.columnName
            } as FieldKey, '!=', '')
        ] : [])));

        if (options.sortField.columnName) {
            this.searchService.withOrder(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.sortField.columnName
            } as FieldKey, options.sortDescending ? SortOrder.DESCENDING : SortOrder.ASCENDING);
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

    private _findPreviouslyAnnotatedClass(item: any): string {
        if (this.options.datastoreIdField.columnName && item[this.options.datastoreIdField.columnName] &&
            this.annotatedClasses.has(item[this.options.datastoreIdField.columnName])) {
            return this.annotatedClasses.get(item[this.options.datastoreIdField.columnName]);
        }
        return '';
    }

    getThumbnailLabel(item): string {
        if (this.options.annotationClassField.columnName) {
            return this._findPreviouslyAnnotatedClass(item) || item[this.options.annotationClassField.columnName] || '';
        }
        if (this.options.predictedClassField.columnName) {
            return item[this.options.predictedClassField.columnName] || '';
        }
        if (this.options.truthClassField.columnName) {
            return item[this.options.truthClassField.columnName] || '';
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
            let nameText = (this.options.textMap || {}).name || '';
            text.push((nameText ? nameText + ' : ' : '') + item[this.options.nameField.columnName]);
        }
        if (this.options.predictedClassField.columnName && item[this.options.predictedClassField.columnName]) {
            let prediction = (this.options.predictedClassField.columnName === this.options.annotationClassField.columnName ?
                this._findPreviouslyAnnotatedClass(item) : '') || item[this.options.predictedClassField.columnName];
            let predictionText = (this.options.textMap || {}).prediction || 'Prediction';
            text.push((predictionText ? predictionText + ' : ' : '') + prediction);
        }
        if (this.options.truthClassField.columnName && item[this.options.truthClassField.columnName]) {
            let actual = (this.options.truthClassField.columnName === this.options.annotationClassField.columnName ?
                this._findPreviouslyAnnotatedClass(item) : '') || item[this.options.truthClassField.columnName];
            let actualText = (this.options.textMap || {}).actual || 'Actual';
            text.push((actualText ? actualText + ' : ' : '') + actual);
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

        // Update the filtered values before transforming the data.
        this._filterFieldsToFilteredValues = CoreUtil.updateValuesFromListFilters(this.options.filterFields, filters,
            this._filterFieldsToFilteredValues, this.createFilterDesignOnList.bind(this));

        results.forEach((result) => {
            let item: any = {};

            // Copy the data from each configured field into the item.
            // TODO THOR-1335 Wrap all of the field properties in the data item to avoid any overlap with the _filtered property.
            options.list().forEach((option: ConfigOption) => {
                const fieldArray: FieldConfig[] = (option.optionType === OptionType.FIELD ? [option.valueCurrent] :
                    (option.optionType === OptionType.FIELD_ARRAY) ? option.valueCurrent : []);
                fieldArray.filter((fieldObject) => !!fieldObject.columnName).forEach((fieldObject) => {
                    item[fieldObject.columnName] = CoreUtil.deepFind(result, fieldObject.columnName);
                });
            });

            item._filtered = CoreUtil.isItemFilteredInEveryField(item, this.options.filterFields, this._filterFieldsToFilteredValues);

            let links = [];
            if (options.linkField && options.linkField.columnName) {
                links = this.getArrayValues(CoreUtil.deepFind(result, options.linkField.columnName) || '');
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

    optionsAnnotationsAreNotActive(options: any): boolean {
        return !options.datastoreIdField.columnName || !options.annotationClassField.columnName;
    }

    /**
     * Returns whether the border property in the given options is percentCompare or percentField.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsBorderIsNotPercentCompareOrPercentField(options: any): boolean {
        return options.border !== 'percentCompare' && options.border !== 'percentField';
    }

    /**
     * Returns whether the border property in the given options is percentCompare or valueCompare.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsBorderIsNotPercentCompareOrValueCompare(options: any): boolean {
        return options.border !== 'percentCompare' && options.border !== 'valueCompare';
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

        // Backwards compatibility
        if (!this.options.truthClassField.columnName) {
            this.options.truthClassField = this.options.objectNameField;
        }

        // Backwards compatibility
        if (!this.options.predictedClassField.columnName) {
            this.options.predictedClassField = this.options.predictedClassField;
        }

        // Backwards compatibility (showOnlyFiltered deprecated due to its redundancy with hideUnfiltered).
        if (typeof this.options.showOnlyFiltered !== 'undefined') {
            this.options.hideUnfiltered = '' + this.options.showOnlyFiltered;
        }

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
        this._filterFieldsToFilteredValues = CoreUtil.updateValuesFromListFilters(this.options.filterFields, filters,
            this._filterFieldsToFilteredValues, this.createFilterDesignOnList.bind(this));

        // Update the filtered status of each grid item.
        this.gridArray.forEach((item) => {
            item._filtered = CoreUtil.isItemFilteredInEveryField(item, this.options.filterFields, this._filterFieldsToFilteredValues);
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
        // TODO The following code is incorrectly splitting single links that have commas into multiple links.  Is it really needed?
        // return value ? (Array.isArray(value) ? value : value.toString().search(/,/g) > -1 ? value.toString().split(',') : [value]) : [];
        return value ? (Array.isArray(value) ? value : [value]) : [];
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
                let predictedClass = grid[this.options.predictedClassField.columnName];
                let truthClass = grid[this.options.truthClassField.columnName];
                let percentage = grid[this.options.percentField.columnName];
                let comparison = grid[this.options.compareField.columnName];
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
                                    img.src = './assets/icons/dashboard/youtube_logo.png';
                                    img.onload = () => {
                                        thumbnail.drawImage(img, 2, 40, img.width - 12, img.height);
                                    };
                                }
                            };

                            break;
                        }
                        case this.mediaTypes.audio: {
                            let image: HTMLImageElement = new Image();
                            image.src = '/assets/icons/dashboard/volume_up.svg';
                            image.onclick = (event) => this.displayMediaTab(event, grid);
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
                            if (typeof percentage !== 'undefined' && CoreUtil.isNumber(percentage)) {
                                let percentFloat = parseFloat(percentage);
                                borderColor = ((percentFloat > this.options.borderPercentThreshold) ? 'blue' : 'red');
                            } else {
                                borderColor = 'grey';
                            }
                            break;
                        }
                        case 'percentCompare': {
                            if (typeof percentage !== 'undefined' && CoreUtil.isNumber(percentage)) {
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
                } else if (truthClass && predictedClass) {
                    borderColor = ((truthClass === predictedClass) ? 'blue' : 'red');
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

        return (this.options.typeMap || {})[fileType] ? this.options.typeMap[fileType] : item[this.options.typeField.columnName];
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
    displayMediaTab(event, item) {
        event.stopPropagation();
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
