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
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ViewChild,
    ElementRef,
    ChangeDetectorRef
} from '@angular/core';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonUtilities, neonVariables } from '../../neon-namespaces';
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
    @ViewChild('table') table: any;
    @ViewChild('dragView') dragView: ElementRef;

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
        unsharedFilterField: Object,
        unsharedFilterValue: string
    };

    public active: {
        idField: FieldMetaData,
        sortField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        layers: any[],
        data: Object[],
        headers: { prop: string, name: string, active: boolean, style: Object }[],
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

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, ref: ChangeDetectorRef,
                visualizationService: VisualizationService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            idField: this.injector.get('idField', null),
            sortField: this.injector.get('sortField', null),
            limit: this.injector.get('limit', 100),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.filters = [];
        this.active = {
            idField: new FieldMetaData(),
            sortField: new FieldMetaData(),
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            filterable: true,
            layers: [],
            data: [],
            headers: [],
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
        this.queryTitle = this.optionsFromConfig.title || 'Raw Data';
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
        this.active.idField = this.findFieldObject('idField', neonMappings.TAGS);
        this.active.sortField = this.findFieldObject('sortField', neonMappings.TAGS);
        let initialHeaderLimit = 25;
        let numHeaders = 0;
        for (let f of this.meta.fields) {
            this.active.headers.push({ prop: f.columnName, name: f.prettyName, active: numHeaders < initialHeaderLimit, style: {} });
            numHeaders++;
        }
        this.recalculateActiveHeaders();
    }

    recalculateActiveHeaders() {
        this.active.activeHeaders = this.getActiveHeaders();
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
        let filterClauses = this.filters.map(function(filter) {
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
        this.table.recalculate();
        this.active = Object.assign({}, this.active);
        this.changeDetection.detectChanges();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.sortField && this.active.sortField.columnName && valid);
        // valid = (this.active.aggregation && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause: any = neon.query.where(this.active.sortField.columnName, '!=', null);

        // Add unshared filter if needed
        if (this.hasUnsharedFilter()) {
            whereClause = neon.query.and(whereClause, neon.query.where(this.meta.unsharedFilterField.columnName, '=',
                this.meta.unsharedFilterValue));
        }

        return query.where(whereClause).sortBy(this.active.sortField.columnName, neonVariables.DESCENDING).limit(this.active.limit);
    }

    getFiltersToIgnore() {
        return null;
    }

    arrayToString(arr) {
        let modArr = arr
        .filter(function(el) {
            return el;
        })
            .map(function(base) {
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
        let data = response.data.map(function(d) {
            let row = {};
            for (let field of this.meta.fields)  {
                if (field.type) {
                    row[field.columnName] = this.toCellString(neonUtilities.deepFind(d, field.columnName), field.type);
                }
            }
            return row;
        }.bind(this));
        this.active.data = data;
        this.refreshVisualization();
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.sortField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                this.addLocalFilter({
                    id: filter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                });
            }
        } else {
            this.filters = [];
        }
    }

    handleFiltersChangedEvent() {
        this.executeQueryChain();
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    }

    handleChangeSortField() {
        this.logChangeAndStartQueryChain();
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

    /**
     * Publishes a select_id event for the ID of the first item in the given list of selected items.
     *
     * @arg {array} selected.selected
     * @fires select_id
     * @private
     */
    onSelect({selected}) {
        if (selected && selected.length && this.active.idField.columnName && selected[0][this.active.idField.columnName]) {
            this.publishSelectId(selected[0][this.active.idField.columnName]);
        }
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
}
