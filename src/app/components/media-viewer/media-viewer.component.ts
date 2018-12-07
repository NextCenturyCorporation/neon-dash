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

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData, MediaTypes } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
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
    protected SLIDER_HEIGHT: number = 60;
    protected TAB_HEIGHT: number = 30;

    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public mediaTypes: any = MediaTypes;

    // TODO Add a way for the user to select other items from the list.
    public tabsAndMedia: {
        loaded: boolean,
        name: string,
        slider: number,
        selected: {
            border: string,
            link: string,
            mask: string,
            name: string,
            type: string
        },
        list: {
            border: string,
            link: string,
            mask: string,
            name: string,
            type: string
        }[]
    }[] = [];

    public noDataId: string = undefined;
    public previousId: string = '';
    public queryItems: any[] = [];
    public selectedTabIndex: number = 0;

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
     * Adds the links for the given fields in the given metadata object to the component as a new tab with the given name next to the
     * existing queryItems.
     *
     * @arg {any[]} fields
     * @arg {any} metadata
     * @arg {string} name
     */
    addEventLinks(fields: any[], metadata: any, name: string) {
        let tabIndex = this.tabsAndMedia.length;

        let links = [];
        let masks = [];
        let names = [];
        let types = [];

        fields.forEach((fieldsConfig) => {
            if (fieldsConfig.type === 'base' || fieldsConfig.type === 'link') {
                links = links.concat(this.transformToStringArray(metadata[fieldsConfig.columnName], this.options.delimiter));
            }
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

        let tabs = this.createTabs(links, masks, names, types);

        tabs.forEach((tab) => {
            if (tab.list.length) {
                // Check to see if the tab already exists before adding it again.
                let tabExists = false;
                this.tabsAndMedia.forEach((previousTab, index) => {
                    if (previousTab.name === tab.name) {
                        tabExists = true;
                        tabIndex = index;
                        return false;
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
     * Appends the global linkPrefix to the given link if it is not already there.
     *
     * @arg {string} link
     * @return {string}
     */
    appendLinkPrefixIfNeeded(link: string) {
        return ((!!link && link.indexOf(this.options.linkPrefix) !== 0) ? (this.options.linkPrefix + link) : link);
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
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('idField', 'ID Field', true),
            new WidgetFieldOption('linkField', 'Link Field', false, false), // DEPRECATED
            new WidgetFieldOption('maskField', 'Mask Field', false),
            new WidgetFieldOption('nameField', 'Name Field', false),
            new WidgetFieldOption('typeField', 'Type Field', false),
            new WidgetFieldArrayOption('linkFields', 'Link Field(s)', true)
        ];
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
            new WidgetSelectOption('clearMedia', 'Clear Media', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('id', 'ID', ''),
            new WidgetFreeTextOption('delimiter', 'Link Delimiter', ','),
            new WidgetFreeTextOption('linkPrefix', 'Link Prefix', ''),
            new WidgetSelectOption('resize', 'Resize Media to Fit', true, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('oneTabPerArray', 'Tab Behavior with Link Arrays', false, [{
                prettyName: 'One Tab per Element',
                variable: false
            }, {
                prettyName: 'One Tab per Array',
                variable: true
            }]),
            new WidgetFreeTextOption('sliderValue', 'Slider Value', '0'),
            new WidgetNonPrimitiveOption('typeMap', 'Type Map', {}),
            new WidgetFreeTextOption('url', 'URL', '')
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

        let fields = [options.idField.columnName].concat(options.linkFields.map((linkField) => {
            return linkField.columnName;
        }));

        if (options.nameField.columnName) {
            fields.push(options.nameField.columnName);
        }

        if (options.typeField.columnName) {
            fields.push(options.typeField.columnName);
        }

        if (options.maskField.columnName) {
            fields.push(options.maskField.columnName);
        }

        let idFilter = neon.query.where(options.idField.columnName, '=', options.id);
        let wherePredicates = [idFilter].concat(options.linkFields.map((linkField) => {
            return neon.query.where(linkField.columnName, '!=', null);
        }));

        return query.withFields(fields).where(neon.query.and.apply(query, wherePredicates));
    }

    /**
     * Adds the given links to the global list.
     *
     * @arg {any} tab
     * @arg {any[]} links
     * @arg {any[]} masks
     * @arg {any[]} names
     * @arg {any[]} types
     * @arg {string} [oneTabName='']
     * @return {any[]}
     */
    createTabs(links: any, masks: any, names: any[], types: any[], oneTabName: string = '') {
        let oneTab = {
            selected: undefined,
            slider: Number.parseInt(this.options.sliderValue),
            name: oneTabName,
            loaded: false,
            list: []
        };

        let tabs = this.options.oneTabPerArray ? [oneTab] : [];

        links.filter((link) => !!link).forEach((link, index) => {
            let mask = this.appendLinkPrefixIfNeeded(this.findElementAtIndex(masks, index));
            let name = this.findElementAtIndex(names, index, (link ? link.substring(link.lastIndexOf('/') + 1) : oneTabName));
            let type = this.findElementAtIndex(types, index, (this.getMediaType(link) || ''));

            // If the type is "mask,img" then change the type to "mask" if the mask link exists else change the type to "img" (the backup).
            if (type === (this.mediaTypes.maskImage + ',' + this.mediaTypes.image)) {
                type = (mask ? this.mediaTypes.maskImage : this.mediaTypes.image);
            }

            // Only add a tab if the link is non-empty; only add a tab for a mask-type if the mask is also non-empty.
            if (link && (type === this.mediaTypes.maskImage ? mask : true)) {
                let tab = oneTab;
                if (!this.options.oneTabPerArray) {
                    tab = {
                        selected: undefined,
                        slider: Number.parseInt(this.options.sliderValue),
                        name: (links.length > 1 ? ((index + 1) + ': ') : '') + name,
                        loaded: false,
                        list: []
                    };
                }

                tab.list.push({
                    // TODO Add a boolean borderField with border options like:  true = red, false = yellow
                    border: this.options.border,
                    link: this.appendLinkPrefixIfNeeded(link),
                    mask: mask,
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
        if (!this.getShownDataCount(this.getShownDataArray()) && !this.options.url) {
            return 'Please Select';
        }
        return super.getButtonText();
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
     * Returns the array of data items that are currently shown in the visualization, or undefined if it has not yet run its data query.
     *
     * @return {any[]}
     * @override
     */
    public getShownDataArray(): any[] {
        return this.tabsAndMedia;
    }

    /**
     * Returns the count of the given array of data items that are currently shown in the visualization.
     *
     * @arg {any[]} data
     * @return {number}
     * @override
     */
    public getShownDataCount(data: any[]): number {
        return data.reduce((sum, tab) => sum + tab.list.length, 0);
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
        return 'File' + (count === 1 ? '' : 's');
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
     * returns the media type for the thumbnail
     * @arg {object} item
     * @return string
     */
    getMediaType(item) {
        let fileType = item.substring(item.lastIndexOf('.') + 1).toLowerCase();
        return this.options.typeField.columnName ? this.options.typeField.columnName : this.options.typeMap[fileType] ?
            this.options.typeMap[fileType] : '';
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
                    this.tabsAndMedia = [];
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
     * Returns whether the visualization data query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    isValidQuery(options: any): boolean {
        let validLinkFields = options.linkFields.length ? options.linkFields.every((linkField) => {
            return !!linkField.columnName;
        }) : false;
        return !!(options.database.name && options.table.name && options.id && options.idField.columnName && validLinkFields);
    }

    /**
     * Handles the given response data for a successful visualization data query created using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} response
     * @override
     */
    onQuerySuccess(options: any, response: any) {
        this.noDataId = options.id;
        options.id = undefined;
        this.tabsAndMedia = [];
        this.selectedTabIndex = 0;
        this.queryItems = [];

        if (options.clearMedia) {
            let neonFilters = options.idField.columnName ? this.filterService.getFiltersForFields(options.database.name,
                options.table.name, [options.idField.columnName]) : [];

            if (!neonFilters[0] || (neonFilters[0] && !neonFilters[0].filter.whereClause.rhs)) {
                this.errorMessage = 'No Data';
                options.id = '_id';
                return;
            }
        }

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.errorMessage = '';
                this.isLoading++;

                response.data.forEach((responseItem) => {
                    let masks = [];
                    let names = [];
                    let types = [];

                    if (options.maskField.columnName) {
                        masks = neonUtilities.deepFind(responseItem, options.maskField.columnName) || '';
                        masks = this.transformToStringArray(masks, options.delimiter);
                    }

                    if (options.nameField.columnName) {
                        names = neonUtilities.deepFind(responseItem, options.nameField.columnName) || '';
                        names = this.transformToStringArray(names, options.delimiter);
                    }

                    if (options.typeField.columnName) {
                        types = neonUtilities.deepFind(responseItem, options.typeField.columnName) || '';
                        types = this.transformToStringArray(types, options.delimiter);
                    }

                    options.linkFields.forEach((linkField) => {
                        let links = neonUtilities.deepFind(responseItem, linkField.columnName) || '';
                        links = this.transformToStringArray(links, options.delimiter);
                        let tabs = this.createTabs(links, masks, names, types, this.noDataId);
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

                this.isLoading--;
            } else {
                this.errorMessage = 'No Data';
            }

            this.refreshVisualization();
        } catch (e) {
            console.error(e);
            this.isLoading--;
            this.errorMessage = 'Error';
            this.refreshVisualization();
        }
    }

    /**
     * Changes the selected source image in the given tab to the element in the tab's list at the given index.
     *
     * @arg {any} tab
     * @arg {number} percent
     */
    onSliderChange(tab: any, percent: number) {
        tab.slider = percent;
        this.refreshVisualization();
    }

    /**
     * Initializes the media viewer by running its query.
     *
     * @override
     */
    postInit() {
        // Backwards compatibility (linkField deprecated and replaced by linkFields).
        if (this.options.linkField.columnName && !this.options.linkFields.length) {
            this.options.linkFields.push(this.options.linkField);
        }

        this.subscribeToSelectId(this.getSelectIdCallback());

        this.options.customEventsToReceive.forEach((config) => {
            this.messenger.subscribe(config.id, (eventMessage) => {
                this.waitForQuery(config.fields || [], eventMessage.metadata, eventMessage.item);
            });
        });

        this.executeQueryChain();
    }

    /**
     * Refreshes the media viewer.
     *
     * @override
     */
    refreshVisualization() {
        /* tslint:disable:no-string-literal */
        if (!this.changeDetection['destroyed']) {
            this.changeDetection.detectChanges();
        }
        /* tslint:enable:no-string-literal */
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

    sanitize(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
     * Ensures that the source image loads before the mask.
     *
     * @arg {any} tab
     */
    setTabLoaded(tab: any) {
        tab.loaded = true;
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

    subOnResizeStop(event?: any) {
        if (!this.visualization) {
            return;
        }

        let frames = this.visualization.nativeElement.querySelectorAll('.frame');
        let images = this.visualization.nativeElement.querySelectorAll('.image');
        let videos = this.visualization.nativeElement.querySelectorAll('.video');
        let audios = this.visualization.nativeElement.querySelectorAll('.audio');

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
            audios.forEach((audio) => {
                audio.style.maxHeight = '';
                audio.style.maxWidth = '';
            });
            return;
        }

        let tabIndex = event ? event.index : this.selectedTabIndex;
        let sliderHeight = ((this.tabsAndMedia.length > tabIndex && this.tabsAndMedia[tabIndex].selected.type ===
            this.mediaTypes.maskImage) ?  this.SLIDER_HEIGHT : 0);

        frames.forEach((frame) => {
            frame.style.height = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            frame.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            frame.style.width = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
            frame.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });

        images.forEach((image) => {
            image.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            image.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });

        videos.forEach((video) => {
            video.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            video.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });

        audios.forEach((audio) => {
            audio.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            audio.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });
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
        if (this.isLoading) {
            setTimeout(() => {
                this.waitForQuery(fields, metadata, name);
            }, 500);
        } else {
            this.addEventLinks(fields, metadata, name);
        }
    }
}
