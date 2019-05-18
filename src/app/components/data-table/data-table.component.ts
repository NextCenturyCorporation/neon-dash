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

import { AbstractSearchService, CompoundFilterType, FilterClause, QueryPayload, SortOrder } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { CompoundFilterDesign, FilterBehavior, FilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetOptionCollection,
    WidgetSelectOption
} from '../../widget-option';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material';

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

    public activeHeaders: { prop: string, name: string, active: boolean, style: Object, cellClass: any }[] = [];
    public headerWidths: Map<string, number> = new Map<string, number>();
    public headers: any[] = [];
    public selected: any[] = [];
    public styleRules: string[] = [];
    public styleSheet: any;
    public tableData: any[] = null;

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
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
        );

        this.redrawOnResize = true;
        this.visualizationQueryPaginates = true;

        let style = document.createElement('style');
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        this.styleSheet = style.sheet;
    }

    @HostListener('window:resize')
    onResize() {
        this.refreshVisualization();
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('colorField', 'Color Field', false),
            new WidgetFieldOption('heatmapField', 'Heatmap Field', false),
            new WidgetFieldOption('idField', 'ID Field', false),
            new WidgetFieldOption('sortField', 'Sort Field', true),
            new WidgetFieldArrayOption('filterFields', 'Filter Field(s)', false),
            new WidgetFieldArrayOption('showFields', 'Show Field(s)', false)
        ];
    }

    private createFilterDesignOnArrayValue(filters: FilterDesign[]): FilterDesign {
        let compoundFilterType = this.options.arrayFilterOperator === 'and' ? CompoundFilterType.AND : CompoundFilterType.OR;
        return {
            type: compoundFilterType,
            // TODO THOR-1101 Add a new config property to set root if singleFilter is false (don't reuse arrayFilterOperator!)
            root: (this.options.singleFilter || this.options.arrayFilterOperator === 'and') ? CompoundFilterType.AND :
                CompoundFilterType.OR,
            filters: filters
        } as CompoundFilterDesign;
    }

    private createFilterDesignOnOneValue(field: FieldMetaData, value?: any): FilterDesign {
        return {
            // TODO THOR-1101 Add a new config property to set root if singleFilter is false (don't reuse arrayFilterOperator!)
            root: (this.options.singleFilter || this.options.arrayFilterOperator === 'and') ? CompoundFilterType.AND :
                CompoundFilterType.OR,
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: field,
            operator: '=',
            value: value
        } as SimpleFilterDesign;
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('filterable', 'Filterable', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('singleFilter', 'Filter Multiple', false, OptionChoices.YesFalseNoTrue, this.optionsFilterable),
            // TODO THOR-949 Rename option and change to boolean.
            new WidgetSelectOption('arrayFilterOperator', 'Filter Operator', 'and', [{
                prettyName: 'OR',
                variable: 'or'
            }, {
                prettyName: 'AND',
                variable: 'and'
            }], this.optionsFilterable),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.YesFalseNoTrue, this.optionsFilterable),
            new WidgetFreeTextOption('heatmapDivisor', 'Heatmap Divisor', '0', this.optionsHeatmapTable),
            new WidgetSelectOption('reorderable', 'Make Columns Reorderable', true, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('showColumnSelector', 'Show Column Selector', 'hide', [{
                prettyName: 'Yes',
                variable: 'show'
            }, {
                prettyName: 'No',
                variable: 'hide'
            }]),
            // TODO THOR-1135 (Delete this) The allColumnStatus option is deprecated.  Please use showFields now.
            new WidgetSelectOption('allColumnStatus', 'Show Columns on Reload', 'show', [{
                prettyName: 'Show All',
                variable: 'show'
            }, {
                prettyName: 'Hide all',
                variable: 'hide'
            }]),
            new WidgetSelectOption('sortDescending', 'Sort', true, OptionChoices.AscendingFalseDescendingTrue),
            new WidgetSelectOption('skinny', 'Table Style', false, [{
                prettyName: 'Normal',
                variable: false
            }, {
                prettyName: 'Skinny',
                variable: true
            }]),
            new WidgetNonPrimitiveOption('customColumnWidths', 'Custom Column Widths', [], false),
            // TODO THOR-1135 (Delete this) The exceptionsToStatus option is deprecated.  Please use showFields now.
            new WidgetNonPrimitiveOption('exceptionsToStatus', 'Exceptions to Status', [], false),
            // TODO THOR-1135 (Delete this) The fieldsConfig option is deprecated.  Please use showFields now.
            new WidgetNonPrimitiveOption('fieldsConfig', 'Fields Config', {})
        ];
    }

    /**
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        let behaviors: FilterBehavior[] = [];

        this.options.filterFields.forEach((filterField) => {
            behaviors.push({
                // Match a single EQUALS filter on the specific filter field.
                filterDesign: this.createFilterDesignOnOneValue(filterField),
                // No redraw callback:  The filtered rows will be automatically styled with getRowClassFunction as called by the HTML.
                redrawCallback: () => { /* Do nothing */ }
            } as FilterBehavior);

            behaviors.push({
                // Match a compound filter with one or more EQUALS filters on the specific filter field.
                filterDesign: this.createFilterDesignOnArrayValue([this.createFilterDesignOnOneValue(filterField)]),
                // No redraw callback:  The filtered rows will be automatically styled with getRowClassFunction as called by the HTML.
                redrawCallback: () => { /* Do nothing */ }
            } as FilterBehavior);
        });

        return behaviors;
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 40;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Data Table';
    }

    // TODO THOR-1135 (Delete this)
    initializeHeadersFromExceptionsToStatus() {
        let initialHeaderLimit = 25;
        let numHeaders = 0;
        let orderedHeaders = [];
        let unorderedHeaders = [];

        // TODO THOR-1135 The allColumnStatus option is deprecated.  Please use showFields now.
        // If showFields is populated, hide each field that is not in showFields (override allColumnStatus).
        let show = this.options.showFields.length ? false : (this.options.allColumnStatus === 'show');

        for (let fieldObject of this.options.fields) {
            // If field is an exception, set active to oppositve of show status.
            if (this.headerIsInExceptions(fieldObject)) {
                orderedHeaders.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: !show && orderedHeaders.length < initialHeaderLimit,
                    style: {},
                    width: this.getColumnWidth(fieldObject.columnName)
                });
            } else {
                unorderedHeaders.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: show && unorderedHeaders.length < initialHeaderLimit,
                    style: {},
                    width: this.getColumnWidth(fieldObject.columnName)
                });
            }
        }
        // Order fields in exceptions first.
        orderedHeaders = this.sortOrderedHeaders(orderedHeaders);
        this.headers = orderedHeaders.concat(unorderedHeaders);
    }

    initializeHeadersFromFieldsConfig() {
        let existingFieldNames: string[] = this.options.showFields.filter((fieldObject) => !!fieldObject.columnName).map((fieldObject) => {
            this.headers.push({
                cellClass: this.getCellClassFunction(),
                prop: fieldObject.columnName,
                name: fieldObject.prettyName,
                active: true,
                style: {},
                width: this.getColumnWidth(fieldObject.columnName)
            });
            return fieldObject.columnName;
        });

        // TODO THOR-1135 (Delete this) The fieldsConfig option is deprecated.  Please use showFields now.
        for (let fieldConfig of this.options.fieldsConfig) {
            let fieldObject = this.options.findField(fieldConfig.name);
            if (fieldObject && fieldObject.columnName) {
                existingFieldNames.push(fieldObject.columnName);
                this.headers.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: !fieldConfig.hide,
                    style: {},
                    width: this.getColumnWidth(fieldConfig.name)
                });
            }
        }

        // Create a header object for each field that was not in showFields.
        for (let fieldObject of this.options.fields) {
            if (existingFieldNames.indexOf(fieldObject.columnName) < 0) {
                this.headers.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    // TODO THOR-1135 The allColumnStatus option is deprecated.  Please use showFields now.
                    // If showFields is populated, hide each field that is not in showFields (override allColumnStatus).
                    active: this.options.showFields.length ? false : (this.options.allColumnStatus === 'show'),
                    style: {},
                    width: this.getColumnWidth(fieldObject.name)
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
            let name = this.datasetService.translateFieldKeyToValue(miniArray[0]);
            if (fieldConfig === name) {
                return miniArray[1];
            }
        }
        return this.DEFAULT_COLUMN_WIDTH;
    }

    /**
     * Returns whether the widget is filterable.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsFilterable(options: any): boolean {
        return options.filterable;
    }

    /**
     * Returns whether the widget is a heatmap table.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsHeatmapTable(options: any): boolean {
        return options.heatmapField.columnName;
    }

    /**
     * Initilizes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // TODO THOR-1135 The fieldsConfig option is deprecated.  Please use showFields now.
        if (this.options.fieldsConfig.length || this.options.showFields.length) {
            this.initializeHeadersFromFieldsConfig();
        } else {
            // TODO THOR-1135 (Delete this)
            this.initializeHeadersFromExceptionsToStatus();
        }
        this.recalculateActiveHeaders();
    }

    // TODO THOR-1135 (Delete this)
    headerIsInExceptions(header) {
        let colName = header.columnName;
        let pName = header.prettyName;
        // TODO THOR-1135 The exceptionsToStatus option is deprecated.  Please use showFields now.
        for (let exception of this.options.exceptionsToStatus) {
            let name = this.datasetService.translateFieldKeyToValue(exception);
            if (colName === name || pName === name) {
                return true;
            }
        }
        return false;
    }

    // TODO THOR-1135 (Delete this)
    sortOrderedHeaders(unordered) {
        let sorted = [];
        // TODO THOR-1135 The exceptionsToStatus option is deprecated.  Please use showFields now.
        for (let exception of this.options.exceptionsToStatus) {
            let header = this.datasetService.translateFieldKeyToValue(exception);
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

    closeColumnSelector() {
        this.options.showColumnSelector = 'hide';
        this.refreshVisualization();
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

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
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

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.sortField.columnName);
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
        let filter: FilterClause = this.searchService.buildFilterClause(options.sortField.columnName, '!=', null);

        // Override the default query fields because we want to find all fields.
        this.searchService.updateFieldsToMatchAll(query)
            .updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filter)))
            .updateSort(query, options.sortField.columnName, options.sortDescending ? SortOrder.DESCENDING : SortOrder.ASCENDING);

        return query;
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
        this.tableData = results.map((d) => {
            let row = {};
            for (let field of options.fields) {
                if (field.type || field.columnName === '_id') {
                    row[field.columnName] = this.toCellString(neonUtilities.deepFind(d, field.columnName), field.type);
                }
            }
            return row;
        });
        return this.tableData.length;
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
        for (let header of this.headers) {
            header.style = {};
        }
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
        return 'Row' + (count === 1 ? '' : 's');
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
            let dataObject = (this.tableData || []).filter((obj) => _.isEqual(obj[this.options.idField.columnName],
                selected[0][this.options.idField.columnName]))[0];

            this.options.filterFields.forEach((filterField) => {
                if (filterField && filterField.columnName) {
                    let rowValue = !this.options.idField.columnName ? selected[0][filterField.columnName] :
                        dataObject[filterField.columnName];

                    if (typeof rowValue === 'string' && rowValue.indexOf('[') === 0 && rowValue.indexOf(']') === (rowValue.length - 1)) {
                        rowValue = rowValue.substring(1, rowValue.length - 1).split(',');
                    }

                    let filterDesigns: FilterDesign[] = (Array.isArray(rowValue) ? rowValue : [rowValue]).map((value) =>
                        this.createFilterDesignOnOneValue(filterField, value));

                    let singleFilterDesign: FilterDesign = filterDesigns.length ? (filterDesigns.length === 1 ? filterDesigns[0] :
                        this.createFilterDesignOnArrayValue(filterDesigns)) : null;

                    if (singleFilterDesign) {
                        if (this.options.singleFilter) {
                            this.exchangeFilters([singleFilterDesign]);
                        } else {
                            this.toggleFilters([singleFilterDesign]);
                        }
                    }
                }
            });
        }

        this.publishAnyCustomEvents(selectedItem, this.options.idField.columnName);
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
                if (colorClass && colorValue) {
                    if (self.styleRules.indexOf(colorClass) < 0) {
                        self.styleSheet.insertRule('.' + colorClass + ':before { background-color: ' + colorValue + '; }');
                        self.styleRules.push(colorClass);
                    }
                    cellClass['color-field'] = true;
                    cellClass[colorClass] = true;
                }
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
     * Returns a function for the rowClass property of the ngx-datatable that, given a row, returns an object with the style classes for
     * the row as keys and booleans as values.
     *
     * @return {function}
     */
    getRowClassFunction(): any {
        let self = this;
        return function(row): any {
            let rowClass: any = {};
            rowClass.active = !self.options.filterFields.length ? false : self.options.filterFields.every((filterField: any) => {
                if (filterField.columnName) {
                    let dataFilterDesign: FilterDesign = self.createFilterDesignOnOneValue(filterField, row[filterField.columnName]);
                    return self.isFiltered(dataFilterDesign) || self.isFiltered(self.createFilterDesignOnArrayValue([dataFilterDesign]));
                }
                return false;
            });

            if (self.options.heatmapField.columnName && self.options.heatmapDivisor) {
                let heatmapClass = 'heat-0';
                let heatmapDivisor = Number.parseFloat(self.options.heatmapDivisor);
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

    getShowColumnSelector(): boolean {
        return this.options.showColumnSelector === 'show';
    }

    /**
     * Updates elements and properties whenever the widget config is changed.
     *
     * @override
     */
    onChangeData(databaseOrTableChange?: boolean) {
        // if database or table has been updated, need to update list of available headers/fields
        if (databaseOrTableChange) {
            let initialHeaderLimit = 25;
            let unorderedHeaders = [];
            let show = true; // show all columns up to the limit, since now the user will need to decide what to show/not show

            for (let fieldObject of this.options.fields) {
                unorderedHeaders.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: show && unorderedHeaders.length < initialHeaderLimit,
                    style: {},
                    width: this.getColumnWidth(fieldObject.columnName)
                });
            }
            this.headers = unorderedHeaders;
        }

        // TODO THOR-1135 Must update this.headers if this.options.showFields changed.
    }
}
