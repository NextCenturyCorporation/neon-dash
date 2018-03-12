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
import { FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';

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

    selected = [];

    private filters: {
        id: string,
        key: string,
        value: string,
        prettyKey: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        idField: string,
        sortField: string,
        limit: number,
        limitDisabled: boolean,
        unsharedFilterField: Object,
        unsharedFilterValue: string,
        allColumnStatus: string,
        exceptionsToStatus: string[]
    };

    public active: {
        idField: FieldMetaData,
        sortField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        page: number,
        docCount: number,
        filterable: boolean,
        layers: any[],
        data: Object[],
        headers: { prop: string, name: string, active: boolean, style: Object, width: number}[],
        headerWidths: Map<string, number>,
        activeHeaders: { prop: string, name: string, active: boolean, style: Object }[],
        showColumnSelector: string
    };

    private drag: {
        mousedown: boolean,
        downIndex: number,
        currentIndex: number,
        field: { prop: string, name: string, active: boolean },
        x: number,
        y: number
    };

    public changeDetection: ChangeDetectorRef;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            idField: this.injector.get('idField', null),
            sortField: this.injector.get('sortField', null),
            limit: this.injector.get('limit', 100),
            limitDisabled: this.injector.get('limitDisabled', true),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            allColumnStatus: this.injector.get('allColumnStatus', 'show'),
            exceptionsToStatus: this.injector.get('exceptionsToStatus', [])
        };
        this.filters = [];
        this.active = {
            idField: new FieldMetaData(),
            sortField: new FieldMetaData(),
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            page: 1,
            docCount: 0,
            filterable: true,
            layers: [],
            data: [],
            headers: [],
            headerWidths: new Map<string, number>(),
            activeHeaders: [],
            showColumnSelector: 'hide'
        };

        this.drag = {
            mousedown: false,
            downIndex: -1,
            currentIndex: -1,
            field: null,
            x: 0,
            y: 0
        };
        this.enableRedrawAfterResize(true);
    }

    subNgOnInit() {
        // Do nothing
    }

    postInit() {
        this.executeQueryChain();
    }

    subNgOnDestroy() {
        // Do nothing
    }

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    subGetBindings(bindings: any) {
        bindings.idField = this.active.idField.columnName;
        bindings.sortField = this.active.sortField.columnName;
        bindings.limit = this.active.limit;
    }

    onUpdateFields() {
        this.active.idField = this.findFieldObject('idField');
        this.active.sortField = this.findFieldObject('sortField');
        let initialHeaderLimit = 25;
        let numHeaders = 0;
        let defaultShowValue = this.optionsFromConfig.allColumnStatus !== 'hide';
        let orderedHeaders = [];
        let unorderedHeaders = [];
        if (defaultShowValue) {
            for (let f of this.meta.fields) {
                this.active.headers.push({ prop: f.columnName, name: f.prettyName, active: numHeaders < initialHeaderLimit,
                     style: {}, width: 150});
                numHeaders++;
            }
        } else {
            for (let f of this.meta.fields) {
                this.headerIsInExceptions(f) ?
                    orderedHeaders.push({ prop: f.columnName, name: f.prettyName, active: orderedHeaders.length < initialHeaderLimit,
                         style: {}, width: 150}) :
                    unorderedHeaders.push({ prop: f.columnName, name: f.prettyName, active: false, style: {}, width: 150});
            }
            orderedHeaders = this.sortOrderedHeaders(orderedHeaders);
            this.active.headers = orderedHeaders.concat(unorderedHeaders);
        }

        this.recalculateActiveHeaders();
    }

    headerIsInExceptions(header) {
        let colName = header.columnName;
        let pName = header.prettyName;
        for (let name of this.optionsFromConfig.exceptionsToStatus) {
            if (colName === name || pName === name) {
                return true;
            }
        }
        return false;
    }

    sortOrderedHeaders(unordered) {
        let sorted = [];
        for (let header of this.optionsFromConfig.exceptionsToStatus) {
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
        let tableWidth = this.active.activeHeaders.reduce((sum, header: any) => {
            return sum + (this.active.headerWidths.get(header.prop) || 0);
        }, 0);
        // Subtract 30 to adjust for the margins and the scrollbar.
        let visualizationWidth = refs.visualization.nativeElement.clientWidth - 30;
        if (visualizationWidth < tableWidth) {
            // Start with the last column and work backward.
            for (let i = this.active.activeHeaders.length - 1; i >= 0; --i) {
                let header: any = this.active.activeHeaders[i];
                let oldHeaderWidth = this.active.headerWidths.get(header.prop) || 0;
                // Minimum header size is 100.
                let newHeaderWidth = Math.max(oldHeaderWidth - (tableWidth - visualizationWidth), 100);
                this.active.headerWidths.set(header.prop, newHeaderWidth);
                tableWidth = tableWidth - oldHeaderWidth + newHeaderWidth;
                // Only shrink headers until the table fits inside the visualization.
                if (visualizationWidth >= tableWidth) {
                    break;
                }
            }
        }

        // Update the widths of the headers for the table object.
        this.active.activeHeaders = this.getActiveHeaders().map((header: any) => {
            // Must set both width and $$oldWidth here to update the widths of the headers and the table container.
            header.width = this.active.headerWidths.get(header.prop) || header.width;
            header.$$oldWidth = this.active.headerWidths.get(header.prop) || header.$$oldWidth;
            return header;
        });

        // Redraw.
        this.active = Object.assign({}, this.active);
        this.changeDetection.detectChanges();
    }

    getActiveHeaders() {
        let active = [];
        for (let header of this.active.headers) {
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
        return this.active.headers
            .filter((header) => header.active)
            .map((header) => {
                return {
                    columnName: header.prop,
                    prettyName: header.name
                };
            });
    }

    closeColumnSelector() {
        this.active.showColumnSelector = 'hide';
        this.active = Object.assign({}, this.active);
        this.changeDetection.detectChanges();
    }

    deactivateAllHeaders() {
        this.active.activeHeaders = [];
        for (let header of this.active.headers) {
            header.active = false;
        }
        this.changeDetection.detectChanges();
    }

    activateAllHeaders() {
        this.active.activeHeaders = this.active.headers;
        for (let header of this.active.headers) {
            header.active = true;
        }
        this.changeDetection.detectChanges();
    }

    addLocalFilter(filter) {
        this.filters[0] = filter;
    }

    createNeonFilterClauseEquals(database: string, table: string, fieldName: string) {
        let filterClauses = this.filters.map((filter) => {
            return neon.query.where(fieldName, '=', filter.value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.active.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    }

    getNeonFilterFields(): string[] {
        return [this.active.sortField.columnName];
    }

    getVisualizationName(): string {
        return 'Data Chart';
    }

    getFilterText() {
        return this.filters[0].value;
    }

    refreshVisualization() {
        this.active = Object.assign({}, this.active);
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
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.sortField && this.active.sortField.columnName && valid);
        // valid = (this.active.aggregation && valid);
        return valid;
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clause = neon.query.where(this.active.sortField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause, neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }

        return clause;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let limit = this.active.limit;
        let offset = ((this.active.page) - 1) * limit;
        let whereClause = this.createClause();
        return new neon.query.Query().selectFrom(databaseName, tableName)
            .where(whereClause)
            .sortBy(this.active.sortField.columnName, neonVariables.DESCENDING)
            .limit(this.active.limit)
            .offset(offset);
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
            this.active.docCount = response.data[0]._docCount;
        } else {
            let data = response.data.map((d) => {
                let row = {};
                for (let field of this.meta.fields) {
                    if (field.type) {
                        row[field.columnName] = this.toCellString(neonUtilities.deepFind(d, field.columnName), field.type);
                    }
                }
                return row;
            });
            this.active.data = data;
            this.getDocCount();
            this.refreshVisualization();
        }
    }

    getDocCount() {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let whereClause = this.createClause();
        let countQuery = new neon.query.Query()
            .selectFrom(databaseName, tableName)
            .where(whereClause)
            .aggregate(neonVariables.COUNT, '*', '_docCount');

        this.executeQuery(countQuery);
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let neonFilters = this.filterService.getFiltersForFields(this.meta.database.name, this.meta.table.name,
            [this.active.sortField.columnName]);
        this.filters = [];
        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                this.addLocalFilter({
                    id: neonFilter.id,
                    key: neonFilter.filter.whereClause.lhs,
                    value: neonFilter.filter.whereClause.rhs,
                    prettyKey: neonFilter.filter.whereClause.lhs
                });
            }
        }
    }

    handleFiltersChangedEvent() {
        this.active.page = 1;
        this.executeQueryChain();
    }

    isDragging(): boolean {
        return (this.drag.mousedown && this.drag.downIndex >= 0);
    }

    // mouse up in a drag and drop element
    onMouseUp(i) {
        if (this.isDragging && this.drag.downIndex !== this.drag.currentIndex) {
            let length = this.active.headers.length;
            if (this.drag.downIndex >= length || i >= length || this.drag.downIndex < 0 || i < 0) {
                // Do nothing
            } else {
                let h = this.active.headers;
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
        for (let header of this.active.headers) {
            header.style = {};
        }
    }

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        let closeableFilters = this.filters.map((filter) => {
            return filter.value;
        });
        return closeableFilters;
    }

    getFilterTitle(value: string) {
        return this.active.sortField.columnName + ' = ' + value;
    }

    getFilterCloseText(value: string) {
        return value;
    }

    getRemoveFilterTooltip(value: string) {
        return 'Delete Filter ' + this.getFilterTitle(value);
    }

    unsharedFilterChanged() {
        // Update the data
        this.executeQueryChain();
    }

    unsharedFilterRemoved() {
        // Update the data
        this.executeQueryChain();
    }

    removeFilter() {
        this.filters = [];
    }

    nextPage() {
        this.active.page += 1;
        this.executeQueryChain();
    }

    previousPage() {
        this.active.page -= 1;
        this.executeQueryChain();
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.active.docCount) {
            return 'No Data';
        }
        if (this.active.docCount <= this.active.limit) {
            return 'Total ' + super.prettifyInteger(this.active.docCount);
        }
        let begin = super.prettifyInteger((this.active.page - 1) * this.active.limit + 1);
        let end = super.prettifyInteger(Math.min(this.active.page * this.active.limit, this.active.docCount));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.active.docCount);
    }

    /**
     * Publishes a select_id event for the ID of the first item in the given list of selected items.
     *
     * @arg {array} selected.selected
     * @fires select_id
     * @private
     */
    onSelect({ selected }) {
        if (selected && selected.length && this.active.idField.columnName && selected[0][this.active.idField.columnName]) {
            this.publishSelectId(selected[0][this.active.idField.columnName]);
        }
        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);
    }

    onTableResize(event) {
        this.active.activeHeaders.forEach((header: any) => {
            if (!this.active.headerWidths.has(header.prop)) {
                this.active.headerWidths.set(header.prop, header.width);
            }
        });
        let lastColumn: any = this.active.activeHeaders[this.active.activeHeaders.length - 1];
        if (event.column.prop !== lastColumn.prop) {
            this.active.headerWidths.set(event.column.prop, event.newValue);
            // Adjust the width of the last column based on the added or subtracted width of the event's column.
            this.active.headerWidths.set(lastColumn.prop, lastColumn.width + event.column.width - event.newValue);
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
        this.active.headers[index].style[style] = value;
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
}
