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
import { DateUtil, DateFormat } from '../../library/core/date.util';
import {
    CompoundFilterType,
    OptionChoices,
    SortOrder,
    ConfigOptionFieldArray,
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOptionNumber,
    ConfigOptionNonPrimitive,
    ConfigOption,
    ConfigOptionSelect
} from '../../library/core/models/config-option';
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
    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;

    @ViewChild('table', { static: false }) table: any;
    @ViewChild('dragView', { static: false }) dragView: ElementRef;

    private MINIMUM_COLUMN_WIDTH: number = 100;

    public activeHeaders: { prop: string, name: string, active: boolean, style: Record<string, any>, cellClass: any }[] = [];
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
        ref: ChangeDetectorRef,
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
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('colorField', 'Color Field', false),
            new ConfigOptionField('heatmapField', 'Heatmap Field', false),
            new ConfigOptionField('idField', 'ID Field', false),
            new ConfigOptionField('sortField', 'Sort Field', false),
            new ConfigOptionFieldArray('filterFields', 'Filter Field(s)', false),
            new ConfigOptionFieldArray('linkFields', 'Link Field(s)', false),
            new ConfigOptionFieldArray('showFields', 'Show Field(s)', true),
            new ConfigOptionSelect('filterable', 'Filterable', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('singleFilter', 'Filter Multiple', false, false, OptionChoices.YesFalseNoTrue,
                this.optionsFilterable.bind(this)),
            // TODO THOR-949 Rename option and change to boolean.
            new ConfigOptionSelect('arrayFilterOperator', 'Filter Operator', false, 'and', [{
                prettyName: 'OR',
                variable: 'or'
            }, {
                prettyName: 'AND',
                variable: 'and'
            }], this.optionsFilterable.bind(this)),
            new ConfigOptionSelect('ignoreSelf', 'Filter Self', false, false, OptionChoices.YesFalseNoTrue,
                this.optionsFilterable.bind(this)),
            new ConfigOptionNumber('heatmapDivisor', 'Heatmap Divisor', false, 0, this.optionsHeatmapTable.bind(this)),
            new ConfigOptionFreeText('linkPrefix', 'Link Prefix', false, ''),
            new ConfigOptionSelect('reorderable', 'Make Columns Reorderable', false, true, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('sortDescending', 'Sort', false, true, OptionChoices.AscendingFalseDescendingTrue),
            new ConfigOptionNonPrimitive('customColumnWidths', 'Custom Column Widths', false, [], true)
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

    protected initializeProperties() {
        const showFieldNames: string[] = (this.options.showFields || []).filter((fieldObject) => !!fieldObject.columnName)
            .map((fieldObject) => fieldObject.columnName);

        this.headers = this.options.fields.map((fieldObject) => ({
            cellClass: this.getCellClassFunction(),
            prop: fieldObject.columnName,
            name: fieldObject.prettyName,
            // If showFields is populated, hide each field that is not in showFields.  If showFields is not populated, show each field.
            active: !showFieldNames.length || (showFieldNames.indexOf(fieldObject.columnName) >= 0),
            style: {},
            widthAuto: this.retrieveConfiguredColumnWidth(fieldObject.columnName) || this.MINIMUM_COLUMN_WIDTH,
            widthUser: null
        }));

        this.recalculateActiveHeaders();
    }

    /**
     * Returns the custom width for a column (or default if not specified in the config)
     * @returns width for a specific column
     */
    retrieveConfiguredColumnWidth(fieldConfig): number {
        for (let customColumnWidthArray of this.options.customColumnWidths) {
            let name = DatasetUtil.translateFieldKeyToFieldName(customColumnWidthArray[0], this.dashboardState.dashboard.fields);
            if (fieldConfig === name) {
                return customColumnWidthArray[1];
            }
        }
        return null;
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
        return options.heatmapField && options.heatmapField.columnName;
    }

    getVisualizationWidth(): number {
        const refs = this.getElementRefs();
        // Subtract 15 from the width to adjust for the scrollbar.
        return refs.visualization.nativeElement.clientWidth - 15;
    }

    recalculateActiveHeaders() {
        this.activeHeaders = this.headers.filter((header: any) => header.active);

        // Update the widths of the headers based on the width of the visualization itself.
        const tableWidth = this.activeHeaders.reduce((sum, header: any) => sum + (header.widthUser || header.widthAuto), 0);
        const visualizationWidth = this.getVisualizationWidth();
        const numberOfAutoWidthColumns = this.activeHeaders.filter((header: any) => !header.widthUser).length;

        // If the visualization is bigger than the table, increase the width of the columns to fit the table inside the visualization.
        if (visualizationWidth > tableWidth) {
            const widthToAddToEachColumn = Math.trunc((visualizationWidth - tableWidth) / numberOfAutoWidthColumns);
            this.activeHeaders.forEach((header: any) => {
                if (!header.widthUser) {
                    header.widthAuto += widthToAddToEachColumn;
                }
            });
        }

        // If the table is bigger than the visualization, decrease the width of the columns to fit the table inside the visualization.
        if (visualizationWidth < tableWidth) {
            const widthToRemoveFromEachColumn = Math.trunc((tableWidth - visualizationWidth) / numberOfAutoWidthColumns);
            this.activeHeaders.forEach((header: any) => {
                if (!header.widthUser) {
                    header.widthAuto = Math.max(header.widthAuto - widthToRemoveFromEachColumn, this.MINIMUM_COLUMN_WIDTH);
                }
            });
        }

        // Redraw.
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
                    if (field.type === 'date') {
                        item[field.columnName] = DateUtil.retrievePastTime(item[field.columnName], DateFormat.MINUTE);
                    }
                }
            }
            item._filtered = CoreUtil.isItemFilteredInEveryField(item, this.options.filterFields, this._filterFieldsToFilteredValues);
            return item;
        });
        return this.tableData.length;
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
    public onSelect({ selected }): void {
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

    public onTableResize(event: any): void {
        this.headers.forEach((header) => {
            if (header.prop === event.column.prop) {
                header.widthUser = event.newValue;
            }
        });
        this.refreshVisualization();
    }

    /**
     * Returns the cellClass property of an ngx-datatable column object that, given a cell, returns an object with the style classes for
     * the cell as keys and booleans as values.
     *
     * @arg {object} column
     * @arg {string} value
     * @return {function}
     */
    public getCellClassFunction(): any {
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
    public getElementRefs() {
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
    public getRowClassFunction(): any {
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

    /**
     * Updates elements and properties whenever the widget config is changed.
     *
     * @override
     */
    onChangeData(databaseOrTableChange?: boolean): void {
        if (databaseOrTableChange) {
            // If the database or table was updated, update the headers.
            this.initializeProperties();
        } else {
            this.selected = [];

            const showFieldNames: string[] = this.options.showFields.filter((fieldObject) => !!fieldObject.columnName).map((fieldObject) =>
                fieldObject.columnName);

            this.headers.forEach((header: any) => {
                header.active = !showFieldNames.length || (showFieldNames.indexOf(header.prop) >= 0);
            });

            this.recalculateActiveHeaders();
        }
    }

    public generateLink(link: string): string {
        return ((!!link && link.indexOf(this.options.linkPrefix) !== 0 && link.indexOf('http') !== 0) ? (this.options.linkPrefix + link) :
            link);
    }

    public isLinkColumn(columnName: string): boolean {
        return !!this.options.linkFields.length && this.options.linkFields.some((linkField) => linkField.columnName === columnName);
    }
}
