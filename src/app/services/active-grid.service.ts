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
import { Injectable } from '@angular/core';

import { NeonGridItem } from '../neon-grid-item';

import { NgGrid, NgGridConfig } from 'angular2-grid';
import * as _ from 'lodash';
import * as uuid from 'node-uuid';
import { BaseNeonComponent } from '../components/base-neon-component/base-neon.component';
import { BaseLayeredNeonComponent } from '../components/base-neon-component/base-layered-neon.component';

/*
 * This service manages the active grid on the current dashboard.  This service can be used to
 * move an item up/down, to expand/contract an item, or to add/remove an item.
 *
 * NOTE:  The current implementation assumes a bounded grid that has a maximum number of columns allowed.
 * Additionally, angular2-grid uses 1-based row/column indexing.  So the top left corner is at position row 1, col 1.
 * Row and column calculations should take this into account.
 */
@Injectable()
export class ActiveGridService {
    private static DEFAULT_SIZEX = 4;
    private static DEFAULT_SIZEY = 4;
    /** Denotes that either rows or columns are unbound. */
    private static UNBOUND: number = Number.MAX_SAFE_INTEGER.valueOf();

    private gridItems: NeonGridItem[] = [];
    private grid: NgGrid;
    private gridConfig: NgGridConfig;
    private visualizations: Map<string, BaseNeonComponent | BaseLayeredNeonComponent> = new Map();

    constructor() {
        // Do nothing.
    }

    clear() {
        // TODO - Wait, does this even work?
        // How does setting an array's length to 0 clear the array?
        this.gridItems.length = 0;
    }

    register(id: string, self: BaseNeonComponent | BaseLayeredNeonComponent) {
        if (this.visualizations.get(id) === undefined) {
            this.visualizations.set(id, self);
        }
    }

    unregister(id: string) {
        this.visualizations.delete(id);
    }

    getVisualizationById(id: string): BaseNeonComponent | BaseLayeredNeonComponent {
        return this.visualizations.get(id);
    }

    contractItem(item: NeonGridItem) {
        item.gridItemConfig.sizex = item.lastGridItemConfig.sizex;
        item.gridItemConfig.sizey = item.lastGridItemConfig.sizey;
        item.gridItemConfig.row = item.lastGridItemConfig.row;
        item.gridItemConfig.col = item.lastGridItemConfig.col;
    }

    expandItem(item: NeonGridItem) {
        let visibleRows = 0;
        let gridElement = this.getGridElement();
        if (this.grid && gridElement) {
            visibleRows = Math.floor(gridElement.nativeElement.offsetParent.clientHeight /
                this.grid.rowHeight);
        }

        item.lastGridItemConfig  = _.clone(item.gridItemConfig);
        item.gridItemConfig.sizex = (this.gridConfig) ? this.gridConfig.max_cols : this.getMaxColInUse();
        item.gridItemConfig.col = 1;
        // TODO:  Puzzle out why this exceeds the visible space by a couple rows.
        item.gridItemConfig.sizey = (visibleRows > 0) ? visibleRows : item.gridItemConfig.sizex;
    }

    /**
     * Returns the grid element.
     *
     * @return {object}
     * @private
     */
    private getGridElement() {
        /* tslint:disable:no-string-literal */
        return this.grid['_ngEl'];
        /* tslint:enable:no-string-literal */
    }

    getGridItems(): NeonGridItem[] {
        return this.gridItems;
    }

    /**
     * Returns the 1-based index of the last column occupied.  Thus, for a 10 column grid, 10 would be the
     * largest possble max column in use.  If no columns are filled (i.e., an empty grid), 0 is returned.
     */
    getMaxColInUse(): number {
        let maxCol = 0;

        for (let gridItem of this.gridItems) {
            maxCol = Math.max(maxCol, (gridItem.gridItemConfig.col + gridItem.gridItemConfig.sizex - 1));
        }
        return maxCol;
    }

    /**
     * Returns the 1-based index of the last row occupied.  Thus, for a 10 row grid, 10 would be the
     * largest possble max row in use.  If no rows are filled (i.e., an empty grid), 0 is returned.
     */
    getMaxRowInUse(): number {
        let maxRow = 0;

        for (let gridItem of this.gridItems) {
            maxRow = Math.max(maxRow, (gridItem.gridItemConfig.row + gridItem.gridItemConfig.sizey - 1));
        }
        return maxRow;
    }

    moveItemToTop(item: NeonGridItem) {
        item.gridItemConfig.row = 0;
    }

    moveItemToBottom(item: NeonGridItem) {
        item.gridItemConfig.row = this.getMaxRowInUse() + 1;
    }

    setGridConfig(config: NgGridConfig) {
        this.gridConfig = config;
    }

    setGridItems(items: NeonGridItem[]) {
        this.clear();
        if (items) {
            for (let item of items) {
                this.gridItems.push(item);
            }
        }
    }

    setGrid(grid: NgGrid) {
        this.grid = grid;
    }

    closeItem(id: string) {
        for (let i = 0; i < this.gridItems.length; i++) {
            if (this.gridItems[i].id === id) {
                this.gridItems.splice(i, 1);
            }
        }
    }

    addItem(item: NeonGridItem) {
        this.gridItems.push(item);
    }

    /**
     * Adds the given item in the first open space that can accomodate the item.  This could be an empty
     * spot anywhere in the grid layout.
     * @param item  The item to add.
     */
    addItemInFirstFit(item: NeonGridItem) {
        let maxCol: number = this.gridConfig.max_cols;
        let maxRow: number = this.gridConfig.max_rows;

        let newItem = _.cloneDeep(item);
        newItem.id = uuid.v4();
        newItem.gridItemConfig = {
            col: 1,
            row: 1,
            sizex: (item.sizex) ? item.sizex : ActiveGridService.DEFAULT_SIZEX,
            sizey: (item.sizey) ? item.sizey : ActiveGridService.DEFAULT_SIZEY,
            dragHandle: '.drag-handle'
        };

        // Check for unbound columns/rows.
        if (maxRow <= 1) {
            maxRow = ActiveGridService.UNBOUND;
        }

        if (maxCol <= 1) {
            maxCol = ActiveGridService.UNBOUND;
        }

        // Adjust the contraints to account for the visualization size.
        maxCol = maxCol - newItem.gridItemConfig.sizex + 1;
        maxRow = maxRow - newItem.gridItemConfig.sizey + 1;

        // Find the first spot in which the visualization fits.
        let x = 1;
        let y = 1;
        let found = false;
        while (y <= maxRow && !found) {
            x = 1;
            while (x <= maxCol && !found) {
                newItem.gridItemConfig.col = x;
                newItem.gridItemConfig.row = y;
                found = this.itemFits(newItem); // (newItem, x, y);
                x++;
            }
            y++;
        }

        this.gridItems.push(newItem);
    }

    /**
     * This function uses a simple Axis-Aligned Bounding Box (AABB)
     * calculation to check for overlap of two items.  This function assumes the given items have valid sizes.
     * @param item1 the first item
     * @param item2 the second item
     */
    itemsOverlap(item1: NeonGridItem, item2: NeonGridItem) {
        if (item1.gridItemConfig.col > (item2.gridItemConfig.col + item2.gridItemConfig.sizex - 1) ||
            item2.gridItemConfig.col > (item1.gridItemConfig.col + item1.gridItemConfig.sizex - 1)) {
            return false;
        }
        if (item1.gridItemConfig.row > (item2.gridItemConfig.row + item2.gridItemConfig.sizey - 1) ||
            item2.gridItemConfig.row > (item1.gridItemConfig.row + item1.gridItemConfig.sizey - 1)) {
            return false;
        }

        return true;
    }

    /**
     * This function determines if a visualizations will overlap any existing grid items if placed
     * at the given row and column.  This function assumes the given item has valid sizes.
     * @param item The item to place
     * @param col the column in which to place the item's top-left corner
     * @param row the row in which to place the item's top-left corner
     */
    itemFits(item: NeonGridItem) { // (item: NeonGridItem, col: number, row: number) {
        for (let gridItem of this.gridItems) {
            if (this.itemsOverlap(item, gridItem)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Tell the grid to trigger a resize event
     */
    triggerResize() {
        this.grid.triggerResize();
    }
}
