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

@Injectable()
export class ActiveGridService {

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
}
