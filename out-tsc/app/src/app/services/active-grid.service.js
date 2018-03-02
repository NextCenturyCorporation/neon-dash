var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
import * as _ from 'lodash';
import * as uuid from 'node-uuid';
/*
 * This service manages the active grid on the current dashboard.  This service can be used to
 * move an item up/down, to expand/contract an item, or to add/remove an item.
 *
 * NOTE:  The current implementation assumes a bounded grid that has a maximum number of columns allowed.
 * Additionally, angular2-grid uses 1-based row/column indexing.  So the top left corner is at position row 1, col 1.
 * Row and column calculations should take this into account.
 */
var ActiveGridService = /** @class */ (function () {
    function ActiveGridService() {
        this.gridItems = [];
        this.visualizations = new Map();
        // Do nothing.
    }
    ActiveGridService_1 = ActiveGridService;
    ActiveGridService.prototype.clear = function () {
        // TODO - Wait, does this even work?
        // How does setting an array's length to 0 clear the array?
        this.gridItems.length = 0;
    };
    ActiveGridService.prototype.register = function (id, self) {
        if (this.visualizations.get(id) === undefined) {
            this.visualizations.set(id, self);
        }
    };
    ActiveGridService.prototype.unregister = function (id) {
        this.visualizations.delete(id);
    };
    ActiveGridService.prototype.getVisualizationById = function (id) {
        return this.visualizations.get(id);
    };
    ActiveGridService.prototype.contractItem = function (item) {
        item.gridItemConfig.sizex = item.lastGridItemConfig.sizex;
        item.gridItemConfig.sizey = item.lastGridItemConfig.sizey;
        item.gridItemConfig.row = item.lastGridItemConfig.row;
        item.gridItemConfig.col = item.lastGridItemConfig.col;
    };
    ActiveGridService.prototype.expandItem = function (item) {
        var visibleRows = 0;
        var gridElement = this.getGridElement();
        if (this.grid && gridElement) {
            visibleRows = Math.floor(gridElement.nativeElement.offsetParent.clientHeight /
                this.grid.rowHeight);
        }
        item.lastGridItemConfig = _.clone(item.gridItemConfig);
        item.gridItemConfig.sizex = (this.gridConfig) ? this.gridConfig.max_cols : this.getMaxColInUse();
        item.gridItemConfig.col = 1;
        // TODO:  Puzzle out why this exceeds the visible space by a couple rows.
        item.gridItemConfig.sizey = (visibleRows > 0) ? visibleRows : item.gridItemConfig.sizex;
    };
    /**
     * Returns the grid element.
     *
     * @return {object}
     * @private
     */
    ActiveGridService.prototype.getGridElement = function () {
        /* tslint:disable:no-string-literal */
        return this.grid['_ngEl'];
        /* tslint:enable:no-string-literal */
    };
    ActiveGridService.prototype.getGridItems = function () {
        return this.gridItems;
    };
    /**
     * Returns the 1-based index of the last column occupied.  Thus, for a 10 column grid, 10 would be the
     * largest possble max column in use.  If no columns are filled (i.e., an empty grid), 0 is returned.
     */
    ActiveGridService.prototype.getMaxColInUse = function () {
        var maxCol = 0;
        for (var _i = 0, _a = this.gridItems; _i < _a.length; _i++) {
            var gridItem = _a[_i];
            maxCol = Math.max(maxCol, (gridItem.gridItemConfig.col + gridItem.gridItemConfig.sizex - 1));
        }
        return maxCol;
    };
    /**
     * Returns the 1-based index of the last row occupied.  Thus, for a 10 row grid, 10 would be the
     * largest possble max row in use.  If no rows are filled (i.e., an empty grid), 0 is returned.
     */
    ActiveGridService.prototype.getMaxRowInUse = function () {
        var maxRow = 0;
        for (var _i = 0, _a = this.gridItems; _i < _a.length; _i++) {
            var gridItem = _a[_i];
            maxRow = Math.max(maxRow, (gridItem.gridItemConfig.row + gridItem.gridItemConfig.sizey - 1));
        }
        return maxRow;
    };
    ActiveGridService.prototype.moveItemToTop = function (item) {
        item.gridItemConfig.row = 0;
    };
    ActiveGridService.prototype.moveItemToBottom = function (item) {
        item.gridItemConfig.row = this.getMaxRowInUse() + 1;
    };
    ActiveGridService.prototype.setGridConfig = function (config) {
        this.gridConfig = config;
    };
    ActiveGridService.prototype.setGridItems = function (items) {
        this.clear();
        if (items) {
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                this.gridItems.push(item);
            }
        }
    };
    ActiveGridService.prototype.setGrid = function (grid) {
        this.grid = grid;
    };
    ActiveGridService.prototype.closeItem = function (id) {
        for (var i = 0; i < this.gridItems.length; i++) {
            if (this.gridItems[i].id === id) {
                this.gridItems.splice(i, 1);
            }
        }
    };
    ActiveGridService.prototype.addItem = function (item) {
        this.gridItems.push(item);
    };
    /**
     * Adds the given item in the first open space that can accomodate the item.  This could be an empty
     * spot anywhere in the grid layout.
     * @param item  The item to add.
     */
    ActiveGridService.prototype.addItemInFirstFit = function (item) {
        var maxCol = this.gridConfig.max_cols;
        var maxRow = this.gridConfig.max_rows;
        var newItem = _.cloneDeep(item);
        newItem.id = uuid.v4();
        newItem.gridItemConfig = {
            col: 1,
            row: 1,
            sizex: (item.sizex) ? item.sizex : ActiveGridService_1.DEFAULT_SIZEX,
            sizey: (item.sizey) ? item.sizey : ActiveGridService_1.DEFAULT_SIZEY,
            dragHandle: '.drag-handle'
        };
        // Check for unbound columns/rows.
        if (maxRow <= 1) {
            maxRow = ActiveGridService_1.UNBOUND;
        }
        if (maxCol <= 1) {
            maxCol = ActiveGridService_1.UNBOUND;
        }
        // Adjust the contraints to account for the visualization size.
        maxCol = maxCol - newItem.gridItemConfig.sizex + 1;
        maxRow = maxRow - newItem.gridItemConfig.sizey + 1;
        // Find the first spot in which the visualization fits.
        var x = 1;
        var y = 1;
        var found = false;
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
    };
    /**
     * This function uses a simple Axis-Aligned Bounding Box (AABB)
     * calculation to check for overlap of two items.  This function assumes the given items have valid sizes.
     * @param item1 the first item
     * @param item2 the second item
     */
    ActiveGridService.prototype.itemsOverlap = function (item1, item2) {
        if (item1.gridItemConfig.col > (item2.gridItemConfig.col + item2.gridItemConfig.sizex - 1) ||
            item2.gridItemConfig.col > (item1.gridItemConfig.col + item1.gridItemConfig.sizex - 1)) {
            return false;
        }
        if (item1.gridItemConfig.row > (item2.gridItemConfig.row + item2.gridItemConfig.sizey - 1) ||
            item2.gridItemConfig.row > (item1.gridItemConfig.row + item1.gridItemConfig.sizey - 1)) {
            return false;
        }
        return true;
    };
    /**
     * This function determines if a visualizations will overlap any existing grid items if placed
     * at the given row and column.  This function assumes the given item has valid sizes.
     * @param item The item to place
     * @param col the column in which to place the item's top-left corner
     * @param row the row in which to place the item's top-left corner
     */
    ActiveGridService.prototype.itemFits = function (item) {
        for (var _i = 0, _a = this.gridItems; _i < _a.length; _i++) {
            var gridItem = _a[_i];
            if (this.itemsOverlap(item, gridItem)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Tell the grid to trigger a resize event
     */
    ActiveGridService.prototype.triggerResize = function () {
        this.grid.triggerResize();
    };
    ActiveGridService.DEFAULT_SIZEX = 4;
    ActiveGridService.DEFAULT_SIZEY = 4;
    /** Denotes that either rows or columns are unbound. */
    ActiveGridService.UNBOUND = Number.MAX_SAFE_INTEGER.valueOf();
    ActiveGridService = ActiveGridService_1 = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [])
    ], ActiveGridService);
    return ActiveGridService;
    var ActiveGridService_1;
}());
export { ActiveGridService };
//# sourceMappingURL=active-grid.service.js.map