/*
 * Copyright 2016 Next Century Corporation
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

/*
 * This service manages the active grid on the current dashboard.  This service can be used to
 * move an item up/down, to expand/contract an item, or to add/remove an item.
 *
 * NOTE:  The current implementation assumes a bounded grid that has a maximum number of columns allowed.
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

    constructor() { }

    clear() {
        this.gridItems.length = 0;
    }

    contractItem(item: NeonGridItem) {
        item.gridConfig.sizex = item.lastGridConfig.sizex;
        item.gridConfig.sizey = item.lastGridConfig.sizey;
        item.gridConfig.row = item.lastGridConfig.row;
        item.gridConfig.col = item.lastGridConfig.col;
    }

    expandItem(item: NeonGridItem) {
        console.log(this.grid['_elNg']);
        let visibleRows = 0;
        if (this.grid && this.grid['_ngEl']) {
            visibleRows = Math.floor(this.grid['_ngEl'].nativeElement.offsetParent.clientHeight / this.grid.rowHeight);
        }

        item.lastGridConfig  = _.clone(item.gridConfig);
        item.gridConfig.sizex = (this.gridConfig) ? this.gridConfig.max_cols : this.getMaxColInUse();
        item.gridConfig.col = 0;
        // TODO:  Puzzle out why this exceeds the visible space by a couple rows.
        item.gridConfig.sizey = (visibleRows > 0) ? visibleRows : item.gridConfig.sizex;
    }

    getGridItems(): NeonGridItem[] {
        return this.gridItems;
    }

    getMaxColInUse(): number {
        let maxCol = 0;

        for (let i = 0; i < this.gridItems.length; i++) {
            maxCol = Math.max(maxCol, (this.gridItems[i].gridConfig.col + this.gridItems[i].gridConfig.sizex - 1));
        }
        return maxCol;
    }

    getMaxRowInUse(): number {
        let maxRow = 0;

        for (let i = 0; i < this.gridItems.length; i++) {
            maxRow = Math.max(maxRow, (this.gridItems[i].gridConfig.row + this.gridItems[i].gridConfig.sizey - 1));
        }
        return maxRow;
    }

    moveItemToTop(item: NeonGridItem) {
        item.gridConfig.row = 0;
    }

    moveItemToBottom(item: NeonGridItem) {
        item.gridConfig.row = this.getMaxRowInUse() + 1;
    }

    setGridConfig(config: NgGridConfig) {
        this.gridConfig = config;
    }

    setGridItems(items: NeonGridItem[]) {
        this.clear();
        if (items) {
            for (let i = 0; i < items.length; i++) {
                this.gridItems.push(items[i]);
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
        newItem.gridConfig = {
            col: 0,
            row: 0,
            sizex: (item.sizex) ? item.sizex : ActiveGridService.DEFAULT_SIZEX,
            sizey: (item.sizey) ? item.sizey : ActiveGridService.DEFAULT_SIZEY
        };

        // Check for unbound columns/rows.
        if (maxRow <= 0) {
            maxRow = ActiveGridService.UNBOUND;
        }

        if (maxCol <= 0) {
            maxCol = ActiveGridService.UNBOUND;
        }

        // Adjust the contraints to account for the visualization size.
        maxCol = maxCol - newItem.gridConfig.sizex;
        maxRow = maxRow - newItem.gridConfig.sizey;

        // Find the first spot in which the visualization fits.
        let x = 0;
        let y = 0;
        let found = false;
        while (y < maxRow && !found) {
            x = 0;
            while (x < maxCol && !found) {
                newItem.gridConfig.col = x;
                newItem.gridConfig.row = y;
                found = this.itemFits(newItem, x, y);
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
        if (item1.gridConfig.col > (item2.gridConfig.col + item2.gridConfig.sizex - 1) ||
            item2.gridConfig.col > (item1.gridConfig.col + item1.gridConfig.sizex - 1)) {
            return false;
        }
        if ( item1.gridConfig.row > (item2.gridConfig.row + item2.gridConfig.sizey - 1) ||
             item2.gridConfig.row > (item1.gridConfig.row + item1.gridConfig.sizey - 1)) {
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
    itemFits(item: NeonGridItem, col: number, row: number) {
        for (let i = 0; i < this.gridItems.length; i++) {
            if (this.itemsOverlap(item, this.gridItems[i])) {
                return false;
            }
        }

        return true;
    }
}
