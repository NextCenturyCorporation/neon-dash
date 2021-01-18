/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
    ConfigOptionFieldArray,
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOptionNumber,
    ConfigOptionNonPrimitive,
    ConfigOption,
    ConfigOptionSelect,
    CoreUtil,
    FieldKey,
    FilterClause,
    FilterCollection,
    OptionChoices,
    SearchObject,
    SortOrder
} from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { MediaTypes } from '../../models/types';
import { MatDialog } from '@angular/material';
import { MediaMetaData } from '../media-group/media-group.component';

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
    protected MEDIA_PADDING: number = 10;
    protected SLIDER_HEIGHT: number = 30;
    protected TAB_HEIGHT: number = 30;
    protected CONTRIBUTION_FOOTER_HEIGHT: number = 20;

    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;

    public mediaTypes: any = MediaTypes;

    public media: MediaMetaData = {
        loaded: false,
        name: '',
        selected: {
            border: '',
            link: '',
            name: '',
            type: ''
        },
        list: []
    };

    public noDataId: string = undefined;
    public queryItems: any[] = [];
    public selectedTabIndex: number = 0;

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

        this.updateOnSelectId = true;
    }

    /**
     * Adds the links for the given fields in the given metadata object to the component as a new item with the given name next to the
     * existing queryItems.
     *
     * @arg {any[]} fields
     * @arg {any} metadata
     * @arg {string} name
     */
    addEventLinks(fields: any[], metadata: any, __name: string) {
        let links = [];
        let masks = [];
        let names = [];
        let types = [];

        fields.forEach((fieldsConfig) => {
            if (fieldsConfig.type === 'base' || fieldsConfig.type === 'link') {
                links = links.concat(CoreUtil.transformToStringArray(metadata[fieldsConfig.columnName], this.options.delimiter));
            }
            if (fieldsConfig.type === 'mask') {
                masks = masks.concat(CoreUtil.transformToStringArray(metadata[fieldsConfig.columnName], this.options.delimiter));
            }
            if (fieldsConfig.type === 'name') {
                names = names.concat(CoreUtil.transformToStringArray(metadata[fieldsConfig.columnName], this.options.delimiter));
            }
            if (fieldsConfig.type === 'type') {
                types = types.concat(CoreUtil.transformToStringArray(metadata[fieldsConfig.columnName], this.options.delimiter));
            }
        });

        // If the event has link or mask data, but is missing other data, use the query data as the defaults.
        if (this.queryItems.length && (links.length || masks.length)) {
            if (!links.length) {
                links = this.queryItems.map((item) => item.link);
            }
            if (links.length === 1 && masks.length > 1) {
                while (links.length < masks.length) {
                    links.push(links[0]);
                }
            }
            if (!masks.length) {
                masks = this.queryItems.map((item) => item.mask);
            }
            if (!names.length) {
                names = this.queryItems.map((item) => item.name);
            }
            if (!types.length) {
                types = this.queryItems.map((item) => item.type);
            }
        }

        this.media = this.createMediaMetaData(links, masks, names, types);

        this.refreshVisualization();
    }

    /**
     * Appends the given prefix to the given link if it is not already there.
     *
     * @arg {string} link
     * @arg {string} prefix
     * @return {string}
     */
    appendPrefixIfNeeded(link: string, prefix: string) {
        return ((!!link && link.indexOf(prefix) !== 0 && link.indexOf('http') !== 0) ? (prefix + link) : link);
    }

    /**
     * Returns the opacity for the given percent.
     *
     * @arg {number} percent
     * @return {number}
     */
    calculateOpacity(percent: number): number {
        return (100 - percent) / 100;
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {AbstractFilterDesign[]}
     * @override
     */
    protected designEachFilterWithNoValues(): AbstractFilterDesign[] {
        // This visualization does not filter.
        return [];
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('idField', 'ID Field', false),
            new ConfigOptionField('linkField', 'Link Field', false, true), // DEPRECATED
            new ConfigOptionField('maskField', 'Mask Field', false),
            new ConfigOptionField('nameField', 'Name Field', false),
            new ConfigOptionField('sortField', 'Sort Field', false),
            new ConfigOptionField('typeField', 'Type Field', false),
            new ConfigOptionFieldArray('linkFields', 'Link Field(s)', true),
            new ConfigOptionSelect('autoplay', 'Autoplay', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionFreeText('border', 'Border', false, ''),
            new ConfigOptionSelect('clearMedia', 'Clear Media', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionFreeText('id', 'ID', false, ''),
            new ConfigOptionFreeText('delimiter', 'Link Delimiter', false, ','),
            new ConfigOptionFreeText('linkPrefix', 'Link Prefix', false, ''),
            new ConfigOptionFreeText('maskLinkPrefix', 'Mask Link Prefix', false, ''),
            new ConfigOptionSelect('resize', 'Resize Media to Fit', false, true, OptionChoices.NoFalseYesTrue),
            new ConfigOptionNumber('sliderValue', 'Slider Value', false, 0),
            new ConfigOptionNonPrimitive('typeMap', 'Type Map', false, {}),
            new ConfigOptionFreeText('url', 'URL', false, '')
        ];
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
        let visualizationFilters: FilterClause[] = options.linkFields.map((linkField) =>
            this.searchService.createFilterClause({
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: linkField.columnName
            } as FieldKey, '!=', null));

        if (options.idField.columnName) {
            visualizationFilters = visualizationFilters.concat(this.searchService.createFilterClause({
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.idField.columnName
            } as FieldKey, '=', options.id));
        }

        if (options.sortField.columnName) {
            this.searchService.withOrder(query, {
                datastore: options.datastore.name,
                database: options.database.name,
                table: options.table.name,
                field: options.sortField.columnName
            } as FieldKey, SortOrder.ASCENDING);
        }

        this.searchService.withFilter(query, this.searchService.createCompoundFilterClause(filters.concat(visualizationFilters)));

        return query;
    }

    /**
     * Adds the given links to the global list.
     *
     * @arg {any[]} links
     * @arg {any[]} masks
     * @arg {any[]} names
     * @arg {any[]} types
     * @return {MediaMetaData}
     */
    createMediaMetaData(links: any, masks: any, names: any[], types: any[]): MediaMetaData {
        let mediaMetaData: MediaMetaData = {
            selected: undefined,
            name: '',
            loaded: false,
            list: []
        };

        links.filter((link) => !!link).forEach((link, index) => {
            let mask = this.appendPrefixIfNeeded(this.findElementAtIndex(masks, index), this.options.maskLinkPrefix ||
                this.options.linkPrefix);
            let name = this.findElementAtIndex(names, index, (link ? link.substring(link.lastIndexOf('/') + 1) : ''));
            let type = this.findElementAtIndex(types, index, (this._retrieveFileType(link) || ''));

            // If the type is "mask,img" then change the type to "mask" if the mask link exists else change the type to "img" (the backup).
            if (type === (this.mediaTypes.maskImage + ',' + this.mediaTypes.image)) {
                type = (mask ? this.mediaTypes.maskImage : this.mediaTypes.image);
            }

            // Only add a list item if the link is non-empty; only add a list item for a mask-type if the mask is also non-empty.
            if (link && (type === this.mediaTypes.maskImage ? mask : true)) {
                mediaMetaData.list.push({
                    // TODO Add a boolean borderField with border options like:  true = red, false = yellow
                    border: this.options.border,
                    link: this.appendPrefixIfNeeded(link, this.options.linkPrefix),
                    mask: mask,
                    name: name,
                    type: type
                });
            }
        });

        mediaMetaData.selected = mediaMetaData.list.length ? mediaMetaData.list[0] : undefined;
        return mediaMetaData;
    }

    /**
     * Returns the element in the given array at the given index if possible or the first element or the default value.
     *
     * @arg {any[]} array
     * @arg {number} index
     * @arg {any} defaultValue
     * @return {any}
     */
    findElementAtIndex(array: any[], index: number, defaultValue: any = ''): any {
        return (array.length > 1 ? (index < array.length ? array[index] : '') : array[0]) || defaultValue;
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    public getButtonText(): string {
        if (!this.media.list.length && !this.options.url) {
            return 'Please Select';
        }
        return super.getButtonText();
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

    _retrieveFileType(link) {
        let fileType = link.indexOf('.') >= 0 ? link.substring(link.lastIndexOf('.') + 1).toLowerCase() : '';
        return (this.options.typeMap || {})[fileType] || fileType;
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
        return 'Media Viewer';
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        let validLinkFields = options.linkFields.length ? options.linkFields.every((linkField) => !!linkField.columnName) : false;
        return !!(options.database.name && options.table.name && validLinkFields);
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
        this.noDataId = options.id;
        this.selectedTabIndex = 0;
        this.queryItems = [];

        if (options.clearMedia && !filters.getFilters().length) {
            this.errorMessage = 'No Data';
            options.id = '_id';
            return 0;
        }

        let mediaMetaDataList: MediaMetaData[] = [];

        results.forEach((result) => {
            let masks = [];
            let names = [];
            let types = [];

            if (options.maskField.columnName) {
                masks = CoreUtil.deepFind(result, options.maskField.columnName) || '';
                masks = CoreUtil.transformToStringArray(masks, options.delimiter);
            }

            if (options.nameField.columnName) {
                names = CoreUtil.deepFind(result, options.nameField.columnName);
                names = typeof names === 'undefined' ? [] : names;
                names = CoreUtil.transformToStringArray(names, options.delimiter);
            }

            if (options.typeField.columnName) {
                types = CoreUtil.deepFind(result, options.typeField.columnName) || '';
                types = CoreUtil.transformToStringArray(types, options.delimiter);
            }

            options.linkFields.forEach((linkField) => {
                let links = CoreUtil.deepFind(result, linkField.columnName) || '';
                links = CoreUtil.transformToStringArray(links, options.delimiter);
                mediaMetaDataList.push(this.createMediaMetaData(links, masks, names, types));
            });
        });

        let mediaList = mediaMetaDataList.reduce((items, media) => items.concat(media.list), []);

        // Save a copy of the list of media from the query results.
        this.queryItems = mediaList.map((item) => item);
        // If any media exist, reset noDataId.
        this.noDataId = this.queryItems.length ? undefined : this.noDataId;

        this.media = {
            loaded: false,
            name: '',
            selected: mediaList.length ? mediaList[0] : undefined,
            list: mediaList
        };

        return mediaList.length;
    }

    /**
     * Updates the slider value to the given percentage.
     *
     * @arg {number} percentage
     */
    onSliderChange(percentage: number) {
        this.options.sliderValue = percentage;
        this.refreshVisualization();
    }

    /**
     * Initializes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        this.options.sliderValue = Number.parseInt(this.options.sliderValue, 10);

        // Backwards compatibility (linkField deprecated and replaced by linkFields).
        if (this.options.linkField.columnName && !this.options.linkFields.length) {
            this.options.linkFields.push(this.options.linkField);
        }

        this.options.customEventsToReceive.forEach((config) => {
            this.messenger.subscribe(config.id, (eventMessage) => {
                this.waitForQuery(config.fields || [], eventMessage.metadata, eventMessage.item);
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
        this.updateOnResize();
    }

    sanitize(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    /**
     * Waits for the current query to end, if it is running, then calls addEventLinks with the given data.
     *
     * @arg {any[]} fields
     * @arg {any} metadata
     * @arg {string} name
     */
    waitForQuery(fields: any[], metadata: any, name: string) {
        if (this.loadingCount > 0) {
            setTimeout(() => {
                this.waitForQuery(fields, metadata, name);
            }, 500);
        } else {
            this.addEventLinks(fields, metadata, name);
        }
    }
}
