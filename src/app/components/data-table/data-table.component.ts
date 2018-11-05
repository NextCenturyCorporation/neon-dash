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
    ViewEncapsulation,
    HostListener
} from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';

/**
 * Manages configurable options for the specific visualization.
 */
export class DataTableOptions extends BaseNeonOptions {
    public allColumnStatus: string;
    public arrayFilterOperator: string;
    public colorField: FieldMetaData;
    public exceptionsToStatus: string[];
    public customColumnWidths: [[string, number]];
    public fieldsConfig: any[];
    public filterable: boolean;
    public filterFields: FieldMetaData[];
    public headers: { prop: string, name: string, active: boolean, style: Object, cellClass: any, width: number }[] = [];
    public heatmapDivisor: number;
    public heatmapField: FieldMetaData;
    public idField: FieldMetaData;
    public ignoreSelf: boolean;
    public reorderable: boolean;
    public singleFilter: boolean;
    public skinny: boolean;
    public sortField: FieldMetaData;
    public sortDescending: boolean;

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        bindings.arrayFilterOperator = this.arrayFilterOperator;
        bindings.exceptionsToStatus = this.exceptionsToStatus;
        bindings.filterable = this.filterable;
        bindings.heatmapDivisor = this.heatmapDivisor;
        bindings.ignoreSelf = this.ignoreSelf;
        bindings.reorderable = this.reorderable;
        bindings.singleFilter = this.singleFilter;
        bindings.skinny = this.skinny;
        bindings.sortDescending = this.sortDescending;

        bindings.fieldsConfig = this.headers.map((header) => {
            return {
                name: header.name,
                hide: !header.active
            };
        });

        return bindings;
    }

    /**
     * Returns the list of fields to export.
     *
     * @return {{ columnName: string, prettyName: string }[]}
     * @override
     */
    getExportFields() {
        return this.headers.filter((header) => header.active).map((header) => {
            return {
                columnName: header.prop,
                prettyName: header.name
            };
        });
    }

    /**
     * Returns the list of field properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldProperties(): string[] {
        return [
            'colorField',
            'heatmapField',
            'idField',
            'sortField'
        ];
    }

    /**
     * Returns the list of field array properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldArrayProperties(): string[] {
        return ['filterFields'];
    }

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @override
     */
    initializeNonFieldBindings() {
        this.allColumnStatus = this.injector.get('allColumnStatus', 'show');
        this.arrayFilterOperator = this.injector.get('arrayFilterOperator', 'and');
        this.exceptionsToStatus = this.injector.get('exceptionsToStatus', []);
        this.customColumnWidths = this.injector.get('customColumnWidths', {});
        this.fieldsConfig = this.injector.get('fieldsConfig', []);
        this.filterable = this.injector.get('filterable', false);
        this.heatmapDivisor = this.injector.get('heatmapDivisor', 0);
        this.ignoreSelf = this.injector.get('ignoreSelf', false);
        this.reorderable = this.injector.get('reorderable', true);
        this.singleFilter = this.injector.get('singleFilter', false);
        this.skinny = this.injector.get('skinny', false);
        this.sortDescending = this.injector.get('sortDescending', true);
    }
}

@Component({
    selector: 'app-data-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('table') table: any;
    @ViewChild('dragView') dragView: ElementRef;

    private DEFAULT_COLUMN_WIDTH: number = 150;
    private MINIMUM_COLUMN_WIDTH: number = 100;

    public filters: {
        id: string,
        field: string,
        value: string,
        prettyField: string
    }[] = [];

    public options: DataTableOptions;

    public activeData: any[] = [];
    public docCount: number = 0;
    public responseData: any[] = [];

    public activeHeaders: { prop: string, name: string, active: boolean, style: Object, cellClass: any }[] = [];
    public headerWidths: Map<string, number> = new Map<string, number>();
    public page: number = 1;
    public selected: any[] = [];
    public showColumnSelector: string = 'hide';
    public styleRules: string[] = [];
    public styleSheet: any;

    public drag: {
        mousedown: boolean,
        downIndex: number,
        currentIndex: number,
        field: { prop: string, name: string, active: boolean },
        x: number,
        y: number
    } = {
            mousedown: false,
            downIndex: -1,
            currentIndex: -1,
            field: null,
            x: 0,
            y: 0
        };

    public duplicateNumber = 0;
    public seenValues = [];

    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService
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

        this.options = new DataTableOptions(this.injector, this.datasetService, 'Data Table', 100);
        this.enableRedrawAfterResize(true);

        let style = document.createElement('style');
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        this.styleSheet = style.sheet;
    }

    @HostListener('window:resize')
    onResize() {
        this.refreshVisualization();
    }

    initializeHeadersFromExceptionsToStatus() {
        let initialHeaderLimit = 25;
        let numHeaders = 0;
        let orderedHeaders = [];
        let unorderedHeaders = [];
        let show = (this.options.allColumnStatus === 'show');

        for (let fieldObject of this.options.fields) {
            // If field is an exception, set active to oppositve of show status.
            if (this.headerIsInExceptions(fieldObject)) {
                orderedHeaders.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: !show && orderedHeaders.length < initialHeaderLimit,
                    style: {},
                    width: this.getColumnWidth(fieldObject)
                });
            } else {
                unorderedHeaders.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: show && unorderedHeaders.length < initialHeaderLimit,
                    style: {},
                    width: this.getColumnWidth(fieldObject)
                });
            }
        }
        // Order fields in exceptions first.
        orderedHeaders = this.sortOrderedHeaders(orderedHeaders);
        this.options.headers = orderedHeaders.concat(unorderedHeaders);
    }

    initializeHeadersFromFieldsConfig() {
        let existingFields = [];
        for (let fieldConfig of this.options.fieldsConfig) {
            let fieldObject = this.options.findField(fieldConfig.name);
            if (fieldObject && fieldObject.columnName) {
                existingFields.push(fieldObject.columnName);
                this.options.headers.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: !fieldConfig.hide,
                    style: {},
                    width: this.getColumnWidth(fieldConfig)
                });
            }
        }
        for (let fieldObject of this.options.fields) {
            if (existingFields.indexOf(fieldObject.columnName) < 0) {
                this.options.headers.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: (this.options.allColumnStatus === 'show'),
                    style: {},
                    width: this.getColumnWidth(fieldObject)
                });
            }
        }
    }

    /**
     * Returns the custom width for a column (or default if not specified in the config)
     * @returns width for a specific column
     */
    getColumnWidth(fieldConfig) {
        for (let miniArray of this.options.customColumnWidths) {
            if (fieldConfig.columnName === miniArray[0]) {
                return miniArray[1];
            }
        }
        return this.DEFAULT_COLUMN_WIDTH;
    }

    subNgOnInit() {
        if (this.options.fieldsConfig.length) {
            this.initializeHeadersFromFieldsConfig();
        } else {
            this.initializeHeadersFromExceptionsToStatus();
        }

        this.recalculateActiveHeaders();
    }

    postInit() {
        this.executeQueryChain();
    }

    subNgOnDestroy() {
        // Do nothing
    }

    headerIsInExceptions(header) {
        let colName = header.columnName;
        let pName = header.prettyName;
        for (let name of this.options.exceptionsToStatus) {
            if (colName === name || pName === name) {
                return true;
            }
        }
        return false;
    }

    sortOrderedHeaders(unordered) {
        let sorted = [];
        for (let header of this.options.exceptionsToStatus) {
            let headerToPush = this.getHeaderByName(header, unordered);
            if (headerToPush !== null) {
                sorted.push(headerToPush);
            }
        }
        return sorted;
    }

    recalculateActiveHeaders() {
        // Update the widths of the headers based on the width of the visualization itself.
        let refs = this.getElementRefs();
        let tableWidth = this.activeHeaders.reduce((sum, header: any) => {
            return sum + (this.headerWidths.get(header.prop) || 0);
        }, 0);

        // Subtract 30 to adjust for the margins and the scrollbar.
        let visualizationWidth = refs.visualization.nativeElement.clientWidth - 30;

        // If the table is bigger than the visualization and the minimum table width (based on the number of columns and the minimum column
        // width) is not bigger than the visualization, reduce the width of the columns to try to fit the table inside the visualization.
        if ((visualizationWidth < tableWidth) && (visualizationWidth > this.activeHeaders.length * this.MINIMUM_COLUMN_WIDTH)) {
            // Start with the last column and work backward.
            for (let i = this.activeHeaders.length - 1; i >= 0; --i) {
                let header: any = this.activeHeaders[i];
                let oldHeaderWidth = this.headerWidths.get(header.prop) || 0;
                let newHeaderWidth = Math.max(oldHeaderWidth - (tableWidth - visualizationWidth), this.MINIMUM_COLUMN_WIDTH);
                this.headerWidths.set(header.prop, newHeaderWidth);
                tableWidth = tableWidth - oldHeaderWidth + newHeaderWidth;
                // Only shrink headers until the table fits inside the visualization.
                if (visualizationWidth >= tableWidth) {
                    break;
                }
            }
        }

        // Update the widths of the headers for the table object.
        this.activeHeaders = this.getActiveHeaders().map((header: any) => {
            // Must set both width and $$oldWidth here to update the widths of the headers and the table container.
            header.width = this.headerWidths.get(header.prop) || header.width;
            header.$$oldWidth = this.headerWidths.get(header.prop) || header.$$oldWidth;
            return header;
        });

        // Redraw.
        this.changeDetection.detectChanges();
    }

    getActiveHeaders() {
        let active = [];
        for (let header of this.options.headers) {
            if (header.active) {
                active.push(header);
            }
        }
        return active;
    }

    getHeaderByName(headerName, list) {
        for (let header of list) {
            if (headerName === header.prop || headerName === header.name) {
                return header;
            }
        }
        return null;
    }

    closeColumnSelector() {
        this.showColumnSelector = 'hide';
        this.changeDetection.detectChanges();
    }

    deactivateAllHeaders() {
        this.activeHeaders = [];
        for (let header of this.options.headers) {
            header.active = false;
        }
        this.changeDetection.detectChanges();
    }

    activateAllHeaders() {
        this.activeHeaders = this.options.headers;
        for (let header of this.options.headers) {
            header.active = true;
        }
        this.changeDetection.detectChanges();
    }

    addLocalFilter(filter) {
        this.filters = this.filters.concat(filter);
    }

    filterIsUnique(filter) {
        for (let existingFilter of this.filters) {
            if (existingFilter.value === filter.value && existingFilter.field === filter.field) {
                return false;
            }
        }
        return true;
    }

    getFilterText(filter) {
        return filter.prettyField + ' = ' + filter.value;
    }

    refreshVisualization() {
        // Must recalculate headers/table and detectChanges within setTimeout so angular templates (like ngIf) are updated first.
        setTimeout(() => {
            // Must recalculateActiveHeaders before table.recalculate to update the header widths.
            this.recalculateActiveHeaders();
            this.table.recalculate();
            // Must detectChanges on the ChangeDetectorRef object in the table itself.
            this.table.cd.detectChanges();
            // Must recalculateActiveHeaders a second time to remove unneeded scrollbars from within the table.
            this.recalculateActiveHeaders();
        }, 300);
    }

    isValidQuery() {
        let valid = true;
        valid = (this.options.database && this.options.database.name && valid);
        valid = (this.options.table && this.options.table.name && valid);
        valid = (this.options.sortField && this.options.sortField.columnName && valid);
        return valid;
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clause = neon.query.where(this.options.sortField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause, neon.query.where(this.options.unsharedFilterField.columnName, '=',
                this.options.unsharedFilterValue));
        }

        return clause;
    }

    createQuery(): neon.query.Query {
        let whereClause = this.createClause();
        return new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name)
            .where(whereClause)
            .sortBy(this.options.sortField.columnName, this.options.sortDescending ? neonVariables.DESCENDING : neonVariables.ASCENDING)
            .limit(this.options.limit)
            .offset((this.page - 1) * this.options.limit);
    }

    /**
     * Returns the list of filters for the visualization to ignore.
     *
     * @return {any[]}
     * @override
     */
    getFiltersToIgnore() {
        if (!this.options.ignoreSelf) {
            return null;
        }

        let ignoredFilterIds = this.options.filterFields.reduce((filterIds, filterField: any) => {
            let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
                [filterField.columnName]);

            let fieldFilterIds = neonFilters.filter((neonFilter) => {
                return !neonFilter.filter.whereClause.whereClauses;
            }).map((neonFilter) => {
                return neonFilter.id;
            });

            return filterIds.concat(fieldFilterIds);
        }, []);

        return ignoredFilterIds.length ? ignoredFilterIds : null;
    }

    arrayToString(arr) {
        let modArr = arr
            .filter((el) => {
                return el;
            })
            .map((base) => {
                if ((typeof base === 'object')) {
                    return this.objectToString(base);
                } else if (Array.isArray(base)) {
                    return this.arrayToString(base);
                } else {
                    return base;
                }
            });
        return '[' + modArr + ']';
    }

    objectToString(base) {
        return '';
    }

    toCellString(base, type) {
        if (base === null) {
            return '';
        } else if (Array.isArray(base)) {
            return this.arrayToString(base);
        } else if (typeof base === 'object') {
            return this.objectToString(base);
        } else {
            return base;
        }
    }

    onQuerySuccess(response): void {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.docCount = response.data[0]._docCount - this.duplicateNumber;
        } else {
            let responses = response.data;
            let data = responses.map((d) => {
                let row = {};
                for (let field of this.options.fields) {
                    if (field.type || field.columnName === '_id') {
                        row[field.columnName] = this.toCellString(neonUtilities.deepFind(d, field.columnName), field.type);
                    }
                }
                return row;
            });
            this.activeData = data;
            // The query response is being stringified and stored in activeData
            // Store the response in responseData to preserve the data in its raw form for querying and filtering purposes
            this.responseData = response.data;
            this.getDocCount();
            this.refreshVisualization();
        }
    }

    getDocCount() {
        if (!this.cannotExecuteQuery()) {
            let countQuery = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name)
                .where(this.createClause()).aggregate(neonVariables.COUNT, '*', '_docCount');

            let ignoreFilters = this.getFiltersToIgnore();
            if (ignoreFilters && ignoreFilters.length) {
                countQuery.ignoreFilters(ignoreFilters);
            }

            this.executeQuery(countQuery);
        }
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.sortField.columnName]);
        this.filters = [];
        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.options.findField(neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                this.addLocalFilter({
                    id: neonFilter.id,
                    field: field.columnName,
                    value: value,
                    prettyField: field.prettyName
                });
            }
        }
    }

    handleFiltersChangedEvent() {
        this.page = 1;
        this.executeQueryChain();
    }

    isDragging(): boolean {
        return (this.drag.mousedown && this.drag.downIndex >= 0);
    }

    // mouse up in a drag and drop element
    onMouseUp(i) {
        if (this.isDragging && this.drag.downIndex !== this.drag.currentIndex) {
            let length = this.options.headers.length;
            if (this.drag.downIndex >= length || i >= length || this.drag.downIndex < 0 || i < 0) {
                // Do nothing
            } else {
                let h = this.options.headers;
                let si = this.drag.downIndex; // startIndex
                let ei = i; // endIndex
                let dir = (si > ei ? -1 : 1);
                let moved = h[si];
                for (let ci = si; ci !== ei; ci += dir) {
                    h[ci] = h[ci + dir];
                }
                h[ei] = moved;
                this.recalculateActiveHeaders();
            }
        }
        this.clearHeaderStyles();
        this.drag.downIndex = -1;
        this.drag.mousedown = false;
    }

    // clicks on a drag and drop icon of an element
    onMouseDown(i) {
        if (i >= 0) {
            this.drag.downIndex = i;
            this.drag.mousedown = true;
            this.setStyle(i, 'backgroundColor', 'rgba(0, 0, 0, .2)');
            this.setStyle(i, 'border', 'grey dashed 1px');
        }
    }

    // enters a NEW drag and drop element
    onMouseEnter(i) {
        if (this.isDragging()) {
            this.drag.currentIndex = i;
            let style = 'thick solid grey';
            if (i < this.drag.downIndex) {
                this.setStyle(i, 'borderTop', style);
            } else if (i > this.drag.downIndex) {
                this.setStyle(i, 'borderBottom', style);
            }
        }
    }

    onMouseLeaveItem(i) {
        if (this.isDragging()) {
            if (i !== this.drag.downIndex) {
                this.setStyle(i, 'borderBottom', null);
                this.setStyle(i, 'borderTop', null);
            }
        }
    }

    // leaves drag and drop area
    onMouseLeaveArea() {
        this.drag.downIndex = -1;
        this.drag.mousedown = false;
        this.clearHeaderStyles();
    }

    // moving in drag and drop area
    onMouseMove(event) {
        if (this.isDragging()) {
            this.drag.x = event.screenX;
            this.drag.y = event.screenY;
        }
    }

    clearHeaderStyles() {
        for (let header of this.options.headers) {
            header.style = {};
        }
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters() {
        return this.filters;
    }

    removeFilter(filter: any) {
        this.filters = this.filters.filter((element) => element.id !== filter.id);
    }

    nextPage() {
        this.page += 1;
        this.executeQueryChain();
    }

    previousPage() {
        this.page -= 1;
        this.executeQueryChain();
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.docCount) {
            if (this.options.hideUnfiltered) {
                return 'Please Filter';
            }
            return 'No Data';
        }
        if (this.docCount <= this.options.limit) {
            return 'Total ' + super.prettifyInteger(this.docCount);
        }
        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1);
        let end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.docCount));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.docCount);
    }

    /**
     * Publishes a select_id event for the ID of the first item in the given list of selected items.
     *
     * @arg {array} selected.selected
     * @fires select_id
     * @private
     */
    onSelect({ selected }) {
        let selectedItem = selected && selected.length ? selected[0] : null;
        if (this.options.idField.columnName && selectedItem[this.options.idField.columnName]) {
            this.publishSelectId(selectedItem[this.options.idField.columnName]);
        }
        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);

        if (this.options.filterable) {
            let dataObject = this.responseData.filter((obj) =>
                obj[this.options.idField.columnName] === selected[0][this.options.idField.columnName])[0];

            this.options.filterFields.forEach((filterField: any) => {
                let filterFieldObject = this.options.findField(filterField.columnName);
                let value = (this.options.idField.columnName.length === 0) ? selected[0][filterFieldObject.columnName] :
                    dataObject[filterFieldObject.columnName];
                let filter = this.createFilterObject(filterFieldObject.columnName, value, filterFieldObject.prettyName);

                if (value instanceof Array) {
                    if (this.options.arrayFilterOperator === 'and') {
                        value.forEach((element) => {
                            let arrayFilter = this.createFilterObject(filterFieldObject.columnName, element, filterFieldObject.prettyName);
                            let whereClause = neon.query.where(arrayFilter.filterFieldObject.columnName, '=', arrayFilter.value);
                            this.addFilter(arrayFilter, whereClause);
                        });
                    } else {
                        let clauses = value.map((element) => neon.query.where(filter.field, '=', element));
                        let clause = neon.query.or.apply(neon.query, clauses);
                        this.addFilter(filter, clause);
                    }
                } else {
                    let clause = neon.query.where(filter.field, '=', filter.value);
                    this.addFilter(filter, clause);
                }
            });
        }

        this.publishAnyCustomEvents(selectedItem, this.options.idField.columnName);
    }

    createFilterObject(field: string, value: string, prettyField: string): any {
        let filter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            field: field,
            value: value,
            prettyField: prettyField
        };
        return filter;
    }

    addFilter(filter, clause) {
        if (this.filterIsUnique(filter)) {
            if (this.filters.length && this.options.singleFilter) {
                filter.id = this.filters[0].id;
                this.filters = [filter];
                this.replaceNeonFilter(true, filter, clause);
            } else {
                this.addLocalFilter(filter);
                this.addNeonFilter(true, filter, clause);
            }
        }
    }

    onTableResize(event) {
        this.activeHeaders.forEach((header: any) => {
            if (!this.headerWidths.has(header.prop)) {
                this.headerWidths.set(header.prop, header.width);
            }
        });
        let lastColumn: any = this.activeHeaders[this.activeHeaders.length - 1];
        if (event.column.prop !== lastColumn.prop) {
            this.headerWidths.set(event.column.prop, event.newValue);
            // Adjust the width of the last column based on the added or subtracted width of the event's column.
            this.headerWidths.set(lastColumn.prop, lastColumn.width + event.column.width - event.newValue);
        }
        this.refreshVisualization();
    }

    /**
     * Sets the given style in the headers with the given index to the given value.
     *
     * @arg {number} index
     * @arg {string} style
     * @arg {string} value
     * @private
     */
    private setStyle(index: number, style: string, value: string) {
        this.options.headers[index].style[style] = value;
    }

    /**
     * Returns the cellClass property of an ngx-datatable column object that, given a cell, returns an object with the style classes for
     * the cell as keys and booleans as values.
     *
     * @arg {object} column
     * @arg {string} value
     * @return {function}
     */
    getCellClassFunction(): any {
        let self = this;
        return function({ column, value }): any {
            let cellClass: any = {};
            if (column && self.options.colorField.columnName === column.prop) {
                let colorClass = value;
                let colorValue = value;
                if (colorClass.indexOf('#') === 0) {
                    colorClass = 'hex_' + colorClass.substring(1);
                } else {
                    let regexMatch = value.match(/.*?(\d{1,3})[,\s]*(\d{1,3})[,\s]*(\d{1,3}).*?/);
                    if (regexMatch) {
                        colorClass = 'rgb_' + regexMatch[1] + '_' + regexMatch[2] + '_' + regexMatch[3];
                        colorValue = 'rgb(' + regexMatch[1] + ',' + regexMatch[2] + ',' + regexMatch[3] + ')';
                    }
                }
                if (self.styleRules.indexOf(colorClass) < 0) {
                    self.styleSheet.insertRule('.' + colorClass + ':before { background-color: ' + colorValue + '; }');
                    self.styleRules.push(colorClass);
                }
                cellClass['color-field'] = true;
                cellClass[colorClass] = true;
            }
            return cellClass;
        };
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
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
    }

    /**
     * Returns a function for the rowClass property of the ngx-datatable that, given a row, returns an object with the style classes for
     * the row as keys and booleans as values.
     *
     * @return {function}
     */
    getRowClassFunction(): any {
        let self = this;
        return function(row): any {
            let rowClass: any = {};
            rowClass.active = self.options.filterFields.some((filterField: any) => {
                return self.filters.some((filter) => {
                    return filterField.columnName && filterField.columnName === filter.field &&
                        row[filterField.columnName] === filter.value;
                });
            });

            if (self.options.heatmapField.columnName && self.options.heatmapDivisor) {
                let heatmapClass = 'heat-0';
                let heatmapDivisor = self.options.heatmapDivisor;
                let heatmapValue = row[self.options.heatmapField.columnName];

                // Ignore undefined, nulls, strings, or NaNs.
                if (typeof heatmapValue !== 'undefined' && self.isNumber(heatmapValue)) {
                    // If the divisor is a fraction, transform it and the value into whole numbers in order to avoid floating point errors.
                    if (heatmapDivisor % 1) {
                        // Find the number of digits following the decimal point in the divisor.
                        let digits = ('' + heatmapDivisor).substring(('' + heatmapDivisor).indexOf('.') + 1).length;
                        // Transform the divisor and the value into whole numbers using the number of digits.
                        heatmapDivisor = heatmapDivisor * Math.pow(10, digits);
                        heatmapValue = heatmapValue * Math.pow(10, digits);
                    }
                    heatmapClass = 'heat-' + Math.min(Math.max(Math.floor(parseFloat(heatmapValue) / heatmapDivisor), 1), 5);
                    heatmapClass = 'heat-' + Math.min(Math.max(Math.floor(parseFloat(heatmapValue) / heatmapDivisor), 1), 5);
                }
                rowClass[heatmapClass] = true;
            }

            return rowClass;
        };
    }

    getTableHeaderHeight() {
        return this.options.skinny ? 20 : 30;
    }

    getTableRowHeight() {
        return this.options.skinny ? 20 : 25;
    }
}
