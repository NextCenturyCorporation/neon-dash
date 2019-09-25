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
    ViewEncapsulation,
    HostListener
} from '@angular/core';

import { AbstractSearchService, FilterClause, QueryPayload } from '../../library/core/services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { AbstractFilterDesign, FilterCollection, ListFilterDesign } from '../../library/core/models/filters';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { DatasetUtil, FieldConfig } from '../../library/core/models/dataset';
import { CoreUtil } from '../../library/core/core.util';
import {
    CompoundFilterType,
    OptionChoices,
    SortOrder,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetNumberOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../library/core/models/widget-option';
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
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('table') table: any;
    @ViewChild('dragView') dragView: ElementRef;

    private DEFAULT_COLUMN_WIDTH: number = 150;
    private MINIMUM_COLUMN_WIDTH: number = 100;

    public activeHeaders: { prop: string, name: string, active: boolean, style: Record<string, any>, cellClass: any }[] = [];
    public headerWidths: Map<string, number> = new Map<string, number>();
    public headers: any[] = [];
    public selected: any[] = [];
    public styleRules: string[] = [];
    public styleSheet: any;
    public tableData: any[] = null;

    public drag: {
        mousedown: boolean;
        downIndex: number;
        currentIndex: number;
        field: { prop: string, name: string, active: boolean };
        x: number;
        y: number;
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

    // Save the values of the filters in the FilterService that are compatible with this visualization's filters.
    private _filterFieldsToFilteredValues: Map<string, any[]> = new Map<string, any[]>();

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
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

    private createFilterDesignOnValues(field: FieldConfig, values: any[] = [undefined]): ListFilterDesign {
        let compoundFilterType = this.options.arrayFilterOperator === 'and' ? CompoundFilterType.AND : CompoundFilterType.OR;
        return new ListFilterDesign(compoundFilterType, this.options.datastore.name + '.' + this.options.database.name + '.' +
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
            new WidgetFieldOption('colorField', 'Color Field', false),
            new WidgetFieldOption('heatmapField', 'Heatmap Field', false),
            new WidgetFieldOption('idField', 'ID Field', false),
            new WidgetFieldOption('sortField', 'Sort Field', false),
            new WidgetFieldArrayOption('filterFields', 'Filter Field(s)', false),
            new WidgetFieldArrayOption('showFields', 'Show Field(s)', true),
            new WidgetSelectOption('filterable', 'Filterable', false, false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('singleFilter', 'Filter Multiple', false, false, OptionChoices.YesFalseNoTrue,
                this.optionsFilterable.bind(this)),
            // TODO THOR-949 Rename option and change to boolean.
            new WidgetSelectOption('arrayFilterOperator', 'Filter Operator', false, 'and', [{
                prettyName: 'OR',
                variable: 'or'
            }, {
                prettyName: 'AND',
                variable: 'and'
            }], this.optionsFilterable.bind(this)),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, false, OptionChoices.YesFalseNoTrue,
                this.optionsFilterable.bind(this)),
            new WidgetNumberOption('heatmapDivisor', 'Heatmap Divisor', false, 0, this.optionsHeatmapTable.bind(this)),
            new WidgetSelectOption('reorderable', 'Make Columns Reorderable', false, true, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('sortDescending', 'Sort', false, true, OptionChoices.AscendingFalseDescendingTrue),
            new WidgetSelectOption('skinny', 'Table Style', false, false, [{
                prettyName: 'Normal',
                variable: false
            }, {
                prettyName: 'Skinny',
                variable: true
            }]),
            new WidgetNonPrimitiveOption('customColumnWidths', 'Custom Column Widths', false, [], true)
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
                designs.push(this.createFilterDesignOnValues(filterField));
            }
            return designs;
        }, [] as AbstractFilterDesign[]);
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

        for (let showField of this.options.showFields) {
            let fieldObject = this.options.findField(showField.name);
            if (fieldObject && fieldObject.columnName) {
                existingFieldNames.push(fieldObject.columnName);
                this.headers.push({
                    cellClass: this.getCellClassFunction(),
                    prop: fieldObject.columnName,
                    name: fieldObject.prettyName,
                    active: !showField.hide,
                    style: {},
                    width: this.getColumnWidth(showField.name)
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
                    // If showFields is populated, hide each field that is not in showFields (override allColumnStatus).
                    active: !this.options.showFields.length,
                    style: {},
                    width: this.getColumnWidth(fieldObject['name']) // TODO: Investigate
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
            let name = DatasetUtil.translateFieldKeyToFieldName(miniArray[0], this.dashboardState.dashboard.fields);
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
        if (this.options.showFields.length) {
            this.initializeHeadersFromFieldsConfig();
        }
        this.recalculateActiveHeaders();
    }

    recalculateActiveHeaders() {
        // Update the widths of the headers based on the width of the visualization itself.
        let refs = this.getElementRefs();
        let tableWidth = this.activeHeaders.reduce((sum, header: any) => sum + (this.headerWidths.get(header.prop) || 0), 0);

        // Subtract 30 to adjust for the margins and the scrollbar.
        let visualizationWidth = refs.visualization.nativeElement.clientWidth - 30;

        // If the table is bigger than the visualization and the minimum table width (based on the number of columns and the minimum column
        // width) is not bigger than the visualization, reduce the width of the columns to try to fit the table inside the visualization.
        if ((visualizationWidth < tableWidth) && (visualizationWidth > this.activeHeaders.length * this.MINIMUM_COLUMN_WIDTH)) {
            // Start with the last column and work backward.
            for (let index = this.activeHeaders.length - 1; index >= 0; --index) {
                let header: any = this.activeHeaders[index];
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
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        this._filterFieldsToFilteredValues = CoreUtil.updateValuesFromListFilters(this.options.filterFields, filters,
            this._filterFieldsToFilteredValues, this.createFilterDesignOnValues.bind(this));

        // Update the filtered status of each table row.
        this.tableData.forEach((item) => {
            item._filtered = CoreUtil.isItemFilteredInEveryField(item, this.options.filterFields, this._filterFieldsToFilteredValues);
        });
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
            if (this.table) {
                this.table.recalculate();
                // Must detectChanges on the ChangeDetectorRef object in the table itself.
                this.table.cd.detectChanges();
            }
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
        return !!(options.database.name && options.table.name);
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
        if (this.options.sortField.columnName) {
            filters = [
                ...filters,
                this.searchService.buildFilterClause(options.sortField.columnName, '!=', null)
            ];
        }

        // Override the default query fields because we want to find all fields.
        this.searchService.updateFieldsToMatchAll(query);

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(filters));

        if (options.sortField.columnName) {
            this.searchService.updateSort(query, options.sortField.columnName,
                options.sortDescending ? SortOrder.DESCENDING : SortOrder.ASCENDING);
        }

        return query;
    }

    arrayToString(arr) {
        let modArr = arr
            .filter((el) => el)
            .map((base) => {
                if ((typeof base === 'object')) {
                    return this.objectToString(base);
                } else if (Array.isArray(base)) {
                    return this.arrayToString(base);
                }
                return base;
            });
        return '[' + modArr + ']';
    }

    objectToString(__base) {
        return '';
    }

    toCellString(base, __type) {
        if (base === null) {
            return '';
        } else if (Array.isArray(base)) {
            return this.arrayToString(base);
        } else if (typeof base === 'object') {
            return this.objectToString(base);
        }
        return base;
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
        // Update the filtered values before transforming the data.
        this._filterFieldsToFilteredValues = CoreUtil.updateValuesFromListFilters(this.options.filterFields, filters,
            this._filterFieldsToFilteredValues, this.createFilterDesignOnValues.bind(this));

        this.tableData = results.map((result) => {
            let item: any = {};
            // TODO THOR-1335 Wrap all of the field properties in the data item to avoid any overlap with the _filtered property.
            for (let field of options.fields) {
                if (field.type || field.columnName === '_id') {
                    item[field.columnName] = this.toCellString(CoreUtil.deepFind(result, field.columnName), field.type);
                }
            }
            item._filtered = CoreUtil.isItemFilteredInEveryField(item, this.options.filterFields, this._filterFieldsToFilteredValues);
            return item;
        });
        return this.tableData.length;
    }

    isDragging(): boolean {
        return (this.drag.mousedown && this.drag.downIndex >= 0);
    }

    // Mouse up in a drag and drop element
    onMouseUp(index) {
        if (this.isDragging && this.drag.downIndex !== this.drag.currentIndex) {
            let length = this.headers.length;
            if (this.drag.downIndex >= length || index >= length || this.drag.downIndex < 0 || index < 0) {
                // Do nothing
            } else {
                let headers = this.headers;
                let si = this.drag.downIndex; // StartIndex
                let ei = index; // EndIndex
                let dir = (si > ei ? -1 : 1);
                let moved = headers[si];
                for (let ci = si; ci !== ei; ci += dir) {
                    headers[ci] = headers[ci + dir];
                }
                headers[ei] = moved;
                this.recalculateActiveHeaders();
            }
        }
        this.clearHeaderStyles();
        this.drag.downIndex = -1;
        this.drag.mousedown = false;
    }

    // Clicks on a drag and drop icon of an element
    onMouseDown(index) {
        if (index >= 0) {
            this.drag.downIndex = index;
            this.drag.mousedown = true;
            this.setStyle(index, 'backgroundColor', 'rgba(0, 0, 0, .2)');
            this.setStyle(index, 'border', 'grey dashed 1px');
        }
    }

    // Enters a NEW drag and drop element
    onMouseEnter(index) {
        if (this.isDragging()) {
            this.drag.currentIndex = index;
            let style = 'thick solid grey';
            if (index < this.drag.downIndex) {
                this.setStyle(index, 'borderTop', style);
            } else if (index > this.drag.downIndex) {
                this.setStyle(index, 'borderBottom', style);
            }
        }
    }

    onMouseLeaveItem(index) {
        if (this.isDragging()) {
            if (index !== this.drag.downIndex) {
                this.setStyle(index, 'borderBottom', null);
                this.setStyle(index, 'borderTop', null);
            }
        }
    }

    // Leaves drag and drop area
    onMouseLeaveArea() {
        this.drag.downIndex = -1;
        this.drag.mousedown = false;
        this.clearHeaderStyles();
    }

    // Moving in drag and drop area
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

            let filters: AbstractFilterDesign[] = [];
            let filtersToDelete: AbstractFilterDesign[] = [];

            this.options.filterFields.filter((field) => !!field.columnName).forEach((field) => {
                // Get all the values for the filter field from the data object.
                let rowValue = !this.options.idField.columnName ? selected[0][field.columnName] : dataObject[field.columnName];

                if (typeof rowValue === 'string' && rowValue.indexOf('[') === 0 && rowValue.indexOf(']') === (rowValue.length - 1)) {
                    rowValue = rowValue.substring(1, rowValue.length - 1).split(',');
                }

                // Change or toggle the filtered values for the filter field.
                const filteredValues: any[] = CoreUtil.changeOrToggleMultipleValues(Array.isArray(rowValue) ? rowValue : [rowValue],
                    this._filterFieldsToFilteredValues.get(field.columnName) || [], !this.options.singleFilter);

                this._filterFieldsToFilteredValues.set(field.columnName, filteredValues);

                if (filteredValues.length) {
                    // Create a single filter on the filtered values.
                    filters.push(this.createFilterDesignOnValues(field, filteredValues));
                } else {
                    // If we won't add any filters, create a FilterDesign without a value to delete all the old filters on the filter field.
                    filtersToDelete.push(this.createFilterDesignOnValues(field));
                }
            });

            this.exchangeFilters(filters, filtersToDelete);
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
        return ({ column, value }): any => {
            let cellClass: any = {};
            if (column && this.options.colorField.columnName === column.prop) {
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
                    if (this.styleRules.indexOf(colorClass) < 0) {
                        this.styleSheet.insertRule('.' + colorClass + ':before { background-color: ' + colorValue + '; }');
                        this.styleRules.push(colorClass);
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
        return (row): any => {
            let rowClass: any = {
                active: !!row._filtered
            };

            if (this.options.heatmapField.columnName && this.options.heatmapDivisor) {
                let heatmapClass = 'heat-0';
                let heatmapDivisor = Number.parseFloat(this.options.heatmapDivisor);
                let heatmapValue = row[this.options.heatmapField.columnName];

                // Ignore undefined, nulls, strings, or NaNs.
                if (typeof heatmapValue !== 'undefined' && this.isNumber(heatmapValue)) {
                    // If the divisor is a fraction, transform it and the value into whole numbers in order to avoid floating point errors.
                    if (heatmapDivisor % 1) {
                        // Find the number of digits following the decimal point in the divisor.
                        let digits = ('' + heatmapDivisor).substring(('' + heatmapDivisor).indexOf('.') + 1).length;
                        // Transform the divisor and the value into whole numbers using the number of digits.
                        heatmapDivisor *= Math.pow(10, digits);
                        heatmapValue *= Math.pow(10, digits);
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

    /**
     * Updates elements and properties whenever the widget config is changed.
     *
     * @override
     */
    onChangeData(databaseOrTableChange?: boolean) {
        // If database or table has been updated, need to update list of available headers/fields
        if (databaseOrTableChange) {
            let initialHeaderLimit = 25;
            let unorderedHeaders = [];
            let show = true; // Show all columns up to the limit, since now the user will need to decide what to show/not show

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
        } else {
            this.headers = [];
            this.selected = [];
            this.activeHeaders = [];
            this.initializeHeadersFromFieldsConfig();
            this.recalculateActiveHeaders();
        }
    }
}
