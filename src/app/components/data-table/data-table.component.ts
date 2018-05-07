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

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { EMPTY_FIELD, FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';

/**
 * Manages configurable options for the specific visualization.
 */
export class DataTableOptions extends BaseNeonOptions {
    public allColumnStatus: string;
    public arrayFilterOperator: string;
    public exceptionsToStatus: string[];
    public fieldsConfig: any[];
    public filterable: boolean;
    public filterFields: FieldMetaData[];
    public idField: FieldMetaData;
    public skinny: boolean;
    public sortField: FieldMetaData;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.allColumnStatus = this.injector.get('allColumnStatus', 'show');
        this.arrayFilterOperator = this.injector.get('arrayFilterOperator', 'and');
        this.exceptionsToStatus = this.injector.get('exceptionsToStatus', []);
        this.fieldsConfig = this.injector.get('fieldsConfig', []);
        this.filterable = this.injector.get('filterable', false);
        this.skinny = this.injector.get('skinny', false);
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.idField = this.findFieldObject('idField');
        this.sortField = this.findFieldObject('sortField');
        this.filterFields = this.findFieldObjects('filterFields');
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
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('table') table: any;
    @ViewChild('dragView') dragView: ElementRef;

    private DEFAULT_COLUMN_WIDTH: number = 150;

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

    public activeHeaders: { prop: string, name: string, active: boolean, style: Object }[] = [];
    public headers: { prop: string, name: string, active: boolean, style: Object, width: number}[] = [];
    public headerWidths: Map<string, number> = new Map<string, number>();
    public page: number = 1;
    public selected: any[] = [];
    public showColumnSelector: string = 'hide';

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
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: !show && orderedHeaders.length < initialHeaderLimit,
                    style: {},
                    width: this.DEFAULT_COLUMN_WIDTH
                });
            } else {
                unorderedHeaders.push({
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: show && unorderedHeaders.length < initialHeaderLimit,
                    style: {},
                    width: this.DEFAULT_COLUMN_WIDTH
                });
            }
        }
        // Order fields in exceptions first.
        orderedHeaders = this.sortOrderedHeaders(orderedHeaders);
        this.headers = orderedHeaders.concat(unorderedHeaders);
    }

    initializeHeadersFromFieldsConfig() {
        let existingFields = [];
        for (let fieldConfig of this.options.fieldsConfig) {
            let fieldObject = this.options.findField(fieldConfig.name);
            if (fieldObject.columnName) {
                existingFields.push(fieldObject.columnName);
                this.headers.push({
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: !fieldConfig.hide,
                    style: {},
                    width: this.DEFAULT_COLUMN_WIDTH
                });
            }
        }
        for (let fieldObject of this.options.fields) {
            if (existingFields.indexOf(fieldObject.columnName) < 0) {
                this.headers.push({
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: (this.options.allColumnStatus === 'show'),
                    style: {},
                    width: this.DEFAULT_COLUMN_WIDTH
                });
            }
        }
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

    subGetBindings(bindings: any) {
        bindings.idField = this.options.idField.columnName;
        bindings.sortField = this.options.sortField.columnName;
        bindings.filterFields = this.options.filterFields;
        bindings.filterable = this.options.filterable;
        bindings.arrayFilterOperator = this.options.arrayFilterOperator;
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
        if (visualizationWidth < tableWidth) {
            // Start with the last column and work backward.
            for (let i = this.activeHeaders.length - 1; i >= 0; --i) {
                let header: any = this.activeHeaders[i];
                let oldHeaderWidth = this.headerWidths.get(header.prop) || 0;
                // Minimum header size is 100.
                let newHeaderWidth = Math.max(oldHeaderWidth - (tableWidth - visualizationWidth), 100);
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
        for (let header of this.headers) {
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

    getExportFields() {
        return this.headers
            .filter((header) => header.active)
            .map((header) => {
                return {
                    columnName: header.prop,
                    prettyName: header.name
                };
            });
    }

    closeColumnSelector() {
        this.showColumnSelector = 'hide';
        this.changeDetection.detectChanges();
    }

    deactivateAllHeaders() {
        this.activeHeaders = [];
        for (let header of this.headers) {
            header.active = false;
        }
        this.changeDetection.detectChanges();
    }

    activateAllHeaders() {
        this.activeHeaders = this.headers;
        for (let header of this.headers) {
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
            .sortBy(this.options.sortField.columnName, neonVariables.DESCENDING)
            .limit(this.options.limit)
            .offset((this.page - 1) * this.options.limit);
    }

    getFiltersToIgnore() {
        return null;
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
            this.docCount = response.data[0]._docCount;
        } else {
            let data = response.data.map((d) => {
                let row = {};
                for (let field of this.options.fields) {
                    if (field.type) {
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
        let countQuery = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name).where(this.createClause())
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
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
            let length = this.headers.length;
            if (this.drag.downIndex >= length || i >= length || this.drag.downIndex < 0 || i < 0) {
                // Do nothing
            } else {
                let h = this.headers;
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
            this.setStyle(i, 'border', 'gray dashed 1px');
        }
    }

    // enters a NEW drag and drop element
    onMouseEnter(i) {
        if (this.isDragging()) {
            this.drag.currentIndex = i;
            let style = 'thick solid gray';
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
        for (let header of this.headers) {
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
        if (selected && selected.length && this.options.idField.columnName && selected[0][this.options.idField.columnName]) {
            this.publishSelectId(selected[0][this.options.idField.columnName]);
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
            this.addLocalFilter(filter);
            this.addNeonFilter(true, filter, clause);
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
        this.headers[index].style[style] = value;
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

    getRowClassFunction() {
        let self = this;
        return function(row) {
            let active = self.options.filterFields.some((filterField: any) => {
                return self.filters.some((filter) => {
                    return filterField.columnName && filterField.columnName === filter.field && row[filterField.columnName] === filter.value;
                });
            });

            return {
                active: active
            };
        };
    }

    getTableHeaderHeight() {
        return this.options.skinny ? 20 : 30;
    }

    getTableRowHeight() {
        return this.options.skinny ? 20 : 25;
    }
}
