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

import { AbstractSearchService, FilterClause, QueryPayload, SortOrder } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterBehavior } from '../../services/filter.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { MediaTypes } from '../../models/types';
import { neonUtilities } from '../../models/neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNumberOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../models/widget-option';
import { MatDialog } from '@angular/material';
import { MediaMetaData, MediaGroupComponent } from '../media-group/media-group.component';

/**
 * A visualization that displays binary and text files triggered through a select_id event.
 * MASKS THROUGH THIS COMPONENT ARE DEPRECATED
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

    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;
    @ViewChild('mediaGroup') mediaGroup: MediaGroupComponent;

    public mediaTypes: any = MediaTypes;

    public tabsAndMedia: MediaMetaData[] = [];

    public noDataId: string = undefined;
    public queryItems: any[] = [];
    public selectedTabIndex: number = 0;

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        public sanitizer: DomSanitizer,
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

        this.updateOnSelectId = true;
    }

    /**
     * Adds the links for the given fields in the given metadata object to the component as a new tab with the given name next to the
     * existing queryItems.
     *
     * @arg {any[]} fields
     * @arg {any} metadata
     * @arg {string} name
     */
    addEventLinks(fields: any[], metadata: any, __name: string) {
        let tabIndex = this.tabsAndMedia.length;

        let links = [];
        let masks = [];
        let names = [];
        let types = [];

        fields.forEach((fieldsConfig) => {
            if (fieldsConfig.type === 'base' || fieldsConfig.type === 'link') {
                links = links.concat(this.transformToStringArray(metadata[fieldsConfig.columnName], this.options.delimiter));
            }
            // Masks currently not being used. (must add mask property to MediaMetaData)
            if (fieldsConfig.type === 'mask') {
                masks = masks.concat(this.transformToStringArray(metadata[fieldsConfig.columnName], this.options.delimiter));
            }
            if (fieldsConfig.type === 'name') {
                names = names.concat(this.transformToStringArray(metadata[fieldsConfig.columnName], this.options.delimiter));
            }
            if (fieldsConfig.type === 'type') {
                types = types.concat(this.transformToStringArray(metadata[fieldsConfig.columnName], this.options.delimiter));
            }
        });

        // Masks currently not being used. (must add mask property to MediaMetaData)
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

        let tabs: MediaMetaData[] = this.createTabs(links, masks, names, types);

        tabs.forEach((tab) => {
            if (tab.list.length) {
                // Check to see if the tab already exists before adding it again.
                let tabExists = false;
                this.tabsAndMedia.forEach((previousTab, index) => {
                    if (previousTab.name === tab.name) {
                        tabExists = true;
                        tabIndex = index;
                    }
                });
                if (!tabExists) {
                    this.tabsAndMedia.push(tab);
                }
            }
        });
        if (this.tabsAndMedia.length >= tabIndex) {
            this.selectedTabIndex = tabIndex;
        }

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
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        // This visualization does not filter.
        return [];
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    protected createOptions(): WidgetOption[] {
        return [
            new WidgetFieldOption('idField', 'ID Field', false),
            new WidgetFieldOption('linkField', 'Link Field', false, true), // DEPRECATED
            // Masks currently not being used. (must add mask property to MediaMetaData)
            new WidgetFieldOption('maskField', 'Mask Field', false),
            new WidgetFieldOption('nameField', 'Name Field', false),
            new WidgetFieldOption('sortField', 'Sort Field', false),
            new WidgetFieldOption('typeField', 'Type Field', false),
            new WidgetFieldArrayOption('linkFields', 'Link Field(s)', true),
            new WidgetSelectOption('autoplay', 'Autoplay', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('border', 'Border', ''),
            new WidgetSelectOption('clearMedia', 'Clear Media', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('id', 'ID', ''),
            new WidgetFreeTextOption('delimiter', 'Link Delimiter', ','),
            new WidgetFreeTextOption('linkPrefix', 'Link Prefix', ''),
            // Masks currently not being used. (must add mask property to MediaMetaData)
            new WidgetFreeTextOption('maskLinkPrefix', 'Mask Link Prefix', ''),
            new WidgetSelectOption('resize', 'Resize Media to Fit', true, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('oneTabPerArray', 'Tab Behavior with Link Arrays', false, [{
                prettyName: 'One Tab per Element',
                variable: false
            }, {
                prettyName: 'One Tab per Array',
                variable: true
            }]),
            new WidgetNumberOption('sliderValue', 'Slider Value', 0),
            new WidgetNonPrimitiveOption('typeMap', 'Type Map', {}),
            new WidgetFreeTextOption('url', 'URL', '')
        ];
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
        let filters: FilterClause[] = options.linkFields.map((linkField) =>
            this.searchService.buildFilterClause(linkField.columnName, '!=', null));

        if (options.idField.columnName) {
            filters = filters.concat(this.searchService.buildFilterClause(options.idField.columnName, '=', options.id));
        }

        if (options.sortField.columnName) {
            this.searchService.updateSort(query, options.sortField.columnName, SortOrder.ASCENDING);
        }

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filters)));

        return query;
    }

    /**
     * Adds the given links to the global list.
     *
     * @arg {any} tab
     * @arg {any[]} links
     * @arg {any[]} masks // Masks currently not being used. (must add mask property to MediaMetaData)
     * @arg {any[]} names
     * @arg {any[]} types
     * @arg {string} [oneTabName='']
     * @return {MediaMetaData[]}
     */
    createTabs(links: any, masks: any, names: any[], types: any[], oneTabName: string = ''): MediaMetaData[] {
        let oneTab: MediaMetaData = {
            selected: undefined,
            name: oneTabName,
            loaded: false,
            list: []
        };

        let tabs = this.options.oneTabPerArray ? [oneTab] : [];

        links.filter((link) => !!link).forEach((link, index) => {
            // Masks currently not being used. (must add mask property to MediaMetaData)
            let mask = this.appendPrefixIfNeeded(this.findElementAtIndex(masks, index), this.options.maskLinkPrefix ||
                this.options.linkPrefix);

            let name = this.findElementAtIndex(names, index, (link ? link.substring(link.lastIndexOf('/') + 1) : oneTabName));
            let type = this.findElementAtIndex(types, index, (this.getMediaType(link) || ''));

            // Masks currently not being used. (must add mask property to MediaMetaData)
            // If the type is "mask,img" then change the type to "mask" if the mask link exists else change the type to "img" (the backup).
            if (type === (this.mediaTypes.maskImage + ',' + this.mediaTypes.image)) {
                type = (mask ? this.mediaTypes.maskImage : this.mediaTypes.image);
            }

            // Masks currently not being used. (must add mask property to MediaMetaData)
            // Only add a tab if the link is non-empty; only add a tab for a mask-type if the mask is also non-empty.
            if (link && (type === this.mediaTypes.maskImage ? mask : true)) {
                let tab = oneTab;
                if (!this.options.oneTabPerArray) {
                    tab = {
                        selected: undefined,
                        name: (links.length > 1 ? ((index + 1) + ': ') : '') + name,
                        loaded: false,
                        list: []
                    };
                }

                tab.list.push({
                    // TODO Add a boolean borderField with border options like:  true = red, false = yellow
                    border: this.options.border,
                    link: this.appendPrefixIfNeeded(link, this.options.linkPrefix),
                    name: name,
                    type: type
                });

                tab.selected = tab.list[0];

                if (!this.options.oneTabPerArray) {
                    tabs.push(tab);
                }
            }
        });

        return tabs;
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
        if (!this.tabsAndMedia.length && !this.options.url) {
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

    /**
     * Returns the media type for the thumbnail
     * @arg {object} item
     * @return string
     */
    getMediaType(item) {
        let fileType = item.substring(item.lastIndexOf('.') + 1).toLowerCase();
        return this.options.typeField.columnName ? this.options.typeField.columnName : this.options.typeMap[fileType] ?
            this.options.typeMap[fileType] : '';
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
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): number {
        this.noDataId = options.id;
        this.tabsAndMedia = [];
        this.selectedTabIndex = 0;
        this.queryItems = [];

        if (options.clearMedia && !this.isFiltered()) {
            this.errorMessage = 'No Data';
            options.id = '_id';
            return 0;
        }

        results.forEach((result) => {
            let masks = [];
            let names = [];
            let types = [];

            if (options.maskField.columnName) {
                masks = neonUtilities.deepFind(result, options.maskField.columnName) || '';
                masks = this.transformToStringArray(masks, options.delimiter);
            }

            if (options.nameField.columnName) {
                names = neonUtilities.deepFind(result, options.nameField.columnName);
                names = typeof names === 'undefined' ? [] : names;
                names = this.transformToStringArray(names, options.delimiter);
            }

            if (options.typeField.columnName) {
                types = neonUtilities.deepFind(result, options.typeField.columnName) || '';
                types = this.transformToStringArray(types, options.delimiter);
            }

            options.linkFields.forEach((linkField) => {
                let links = neonUtilities.deepFind(result, linkField.columnName) || '';
                links = this.transformToStringArray(links, options.delimiter);
                let tabs: MediaMetaData[] = this.createTabs(links, masks, names, types, this.noDataId);
                tabs.forEach((tab) => {
                    if (tab.list.length) {
                        this.tabsAndMedia.push(tab);
                        // Use concat to copy the list.
                        this.queryItems = this.queryItems.concat(tab.list);
                        this.noDataId = undefined;
                    }
                });
            });
        });

        return this.tabsAndMedia.length;
    }

    /**
     * Changes the selected source image in the given tab to the element in the tab's list at the given index.
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
     * Ensures that the source image loads before the mask.
     *
     * @arg {any} tab
     * @arg {number} index
     */
    setTabLoaded(tab: any, index: number) {
        let base = this.visualization.nativeElement.querySelector('#medium' + index);
        let mask = this.visualization.nativeElement.querySelector('#mask' + index);
        if (base && mask) {
            mask.height = base.clientHeight;
            mask.width = base.clientWidth;
        }
        tab.loaded = true;
    }

    /**
     * Transforms the given string or string array into a string array and returns the array.
     *
     * @arg {string|string[]} input
     * @return {string[]}
     */
    transformToStringArray(input, delimiter: string) {
        if (Array.isArray(input)) {
            return input;
        }
        if (input !== '' && input !== null && typeof input !== 'undefined') {
            let inputValue = input.toString();
            if (inputValue.indexOf('[') === 0 && inputValue.lastIndexOf(']') === (inputValue.length - 1) &&
                typeof inputValue !== 'undefined') {
                inputValue = inputValue.substring(1, inputValue.length - 1);
            }
            return inputValue.indexOf(delimiter) > -1 ? inputValue.split(delimiter) : [inputValue];
        }
        return [];
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
