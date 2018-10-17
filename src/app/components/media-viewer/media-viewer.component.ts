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
    public clearMedia: boolean;
    public delimiter: string;
    public id: string;
    public idField: FieldMetaData;
    public maskField: FieldMetaData;
    public linkField: FieldMetaData;
    public linkFields: FieldMetaData[];
    public linkPrefix: string;
    public nameField: FieldMetaData;
    public oneTabPerArray: boolean;
    public resize: boolean;
    public sliderValue: number;
    public typeField: FieldMetaData;
    public typeMap: any;
    public url: string;
    public autoplay: boolean;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.border = this.injector.get('border', '');
        this.clearMedia = this.injector.get('clearMedia', false);
        this.delimiter = this.injector.get('delimiter', ',');
        this.id = this.injector.get('id', '');
        this.linkPrefix = this.injector.get('linkPrefix', '');
        this.oneTabPerArray = this.injector.get('oneTabPerArray', false);
        this.resize = this.injector.get('resize', true);
        this.sliderValue = this.injector.get('sliderValue', 0);
        this.typeMap = this.injector.get('typeMap', {});
        this.url = this.injector.get('url', '');
        this.autoplay = this.injector.get('autoplay', false);
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.idField = this.findFieldObject('idField');
        this.nameField = this.findFieldObject('nameField');
        this.typeField = this.findFieldObject('typeField');
        this.maskField = this.findFieldObject('maskField');
        this.linkField = this.findFieldObject('linkField');
        this.linkFields = this.findFieldObjects('linkFields');
        if (this.linkField.columnName && !this.linkFields.length) {
            this.linkFields.push(this.linkField);
        }
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
    protected MEDIA_PADDING: number = 10;
    protected SLIDER_HEIGHT: number = 66;
    protected TAB_HEIGHT: number = 30;

    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public options: MediaViewerOptions;

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

    public isLoadingMedia: boolean = false;
    public noDataId: string = undefined;
    public previousId: string = '';
    public queryItems: any[] = [];
    public selectedTabIndex: number = 0;

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

        this.options.customEventsToReceive.forEach((config) => {
            this.messenger.subscribe(config.id, (eventMessage) => {
                this.waitForQuery(config.fields || [], eventMessage.metadata, eventMessage.item);
            });
        });
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
     * Creates and returns the query for the media viewer.
     *
     * @return {neon.query.Query}
     * @override
     */
    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);

        let fields = [this.options.idField.columnName].concat(this.options.linkFields.map((linkField) => {
            return linkField.columnName;
        }));

        if (this.options.nameField.columnName) {
            fields.push(this.options.nameField.columnName);
        }

        if (this.options.typeField.columnName) {
            fields.push(this.options.typeField.columnName);
        }

        if (this.options.maskField.columnName) {
            fields.push(this.options.maskField.columnName);
        }

        let idFilter = neon.query.where(this.options.idField.columnName, '=', this.options.id);
        let wherePredicates = [idFilter].concat(this.options.linkFields.map((linkField) => {
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
            slider: this.options.sliderValue,
            name: oneTabName,
            loaded: false,
            list: []
        };

        let tabs = this.options.oneTabPerArray ? [oneTab] : [];

        links.filter((link) => !!link).forEach((link, index) => {
            let prettyName = link.substring(link.lastIndexOf('/') + 1);
            let linkTypeFromConfig = this.getMediaType(link) || '';

            let tab = oneTab;
            if (!this.options.oneTabPerArray) {
                tab = {
                    selected: undefined,
                    slider: this.options.sliderValue,
                    name: prettyName,
                    loaded: false,
                    list: []
                };
            }

            tab.list.push({
                // TODO Add a boolean borderField with border options like:  true = red, false = yellow
                border: this.options.border,
                link: this.appendLinkPrefixIfNeeded(link),
                mask: this.appendLinkPrefixIfNeeded(this.findElementAtIndex(masks, index)),
                name: this.findElementAtIndex(names, index, prettyName),
                type: this.findElementAtIndex(types, index, linkTypeFromConfig)
            });

            tab.selected = tab.list[0];

            if (!this.options.oneTabPerArray) {
                if (tab.list[0].name) {
                    tab.name = tab.list[0].name + ((links.length > 1 && names.length === 1) ? (' ' + (index + 1)) : '');
                }
                tabs.push(tab);
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
    getButtonText() {
        if (!this.tabsAndMedia.length && !this.options.url) {
            return 'Please Select';
        }
        if (!this.tabsAndMedia.length && this.options.url) {
            if (this.options.hideUnfiltered) {
                return 'Please Filter';
            }
            return 'No Data';
        }
        return 'Total Files ' + super.prettifyInteger(this.tabsAndMedia.reduce((sum, tab) => {
            return sum + tab.list.length;
        }, 0));
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
            infoText: this.infoText
        };
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
        }].concat(this.options.linkFields.map((linkField) => {
            return {
                columnName: linkField.columnName,
                prettyName: linkField.prettyName
            };
        }));

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

        if (this.options.maskField.columnName) {
            fields.push({
                columnName: this.options.maskField.columnName,
                prettyName: this.options.maskField.prettyName
            });
        }

        return fields;
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
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
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
        let validLinkFields = this.options.linkFields.length ? this.options.linkFields.every((linkField) => {
            return !!linkField.columnName;
        }) : false;
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name && this.options.id &&
            this.options.idField && this.options.idField.columnName && validLinkFields);
    }

    /**
     * Handles the media viewer query results and show/hide event for selecting/filtering and unfiltering documents.
     *
     * @arg {object} response
     * @override
     */
    onQuerySuccess(response: any) {
        this.noDataId = this.options.id;
        this.options.id = undefined;
        this.tabsAndMedia = [];
        this.selectedTabIndex = 0;
        this.queryItems = [];

        if (this.options.clearMedia) {
            let neonFilters = this.options.idField.columnName ? this.filterService.getFiltersForFields(this.options.database.name,
                this.options.table.name, [this.options.idField.columnName]) : [];

            if (!neonFilters[0] || (neonFilters[0] && !neonFilters[0].filter.whereClause.rhs)) {
                this.errorMessage = 'No Data';
                this.options.id = '_id';
                return;
            }
        }

        try {
            if (response && response.data && response.data.length && response.data[0]) {
                this.errorMessage = '';
                this.isLoadingMedia = true;

                response.data.forEach((responseItem) => {
                    let masks = [];
                    let names = [];
                    let types = [];

                    if (this.options.maskField.columnName) {
                        masks = neonUtilities.deepFind(responseItem, this.options.maskField.columnName) || '';
                        masks = this.transformToStringArray(masks, this.options.delimiter);
                    }

                    if (this.options.nameField.columnName) {
                        names = neonUtilities.deepFind(responseItem, this.options.nameField.columnName) || '';
                        names = this.transformToStringArray(names, this.options.delimiter);
                    }

                    if (this.options.typeField.columnName) {
                        types = neonUtilities.deepFind(responseItem, this.options.typeField.columnName) || '';
                        types = this.transformToStringArray(types, this.options.delimiter);
                    }

                    this.options.linkFields.forEach((linkField) => {
                        let links = neonUtilities.deepFind(responseItem, linkField.columnName) || '';
                        links = this.transformToStringArray(links, this.options.delimiter);
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

                this.isLoadingMedia = false;
            } else {
                this.errorMessage = 'No Data';
            }

            this.refreshVisualization();
        } catch (e) {
            console.error(e);
            this.isLoadingMedia = false;
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
     * Sets the given bindings for the media viewer.
     *
     * @arg {any} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.idField = this.options.idField.columnName;
        bindings.linkField = this.options.linkField.columnName;
        bindings.linkFields = this.options.linkFields.map((linkField) => {
            return linkField.columnName;
        });
        bindings.maskField = this.options.maskField.columnName;
        bindings.nameField = this.options.nameField.columnName;
        bindings.typeField = this.options.typeField.columnName;
        bindings.border = this.options.border;
        bindings.clearMedia = this.options.clearMedia;
        bindings.delimiter = this.options.delimiter;
        bindings.linkPrefix = this.options.linkPrefix;
        bindings.oneTabPerArray = this.options.oneTabPerArray;
        bindings.resize = this.options.resize;
        bindings.sliderValue = this.options.sliderValue;
        bindings.typeMap = this.options.typeMap;
        bindings.autoplay = this.options.autoplay;
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

        // TODO FIXME
        // let sliderHeight = this.tabsAndMedia.length && this.tabsAndMedia[0].list.length > 1 ? this.SLIDER_HEIGHT : 0;
        let sliderHeight = this.SLIDER_HEIGHT;

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
