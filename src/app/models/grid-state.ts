/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import * as uuidv4 from 'uuid/v4';

import { NeonGridTab, NeonGridItem } from './neon-grid-item';
import { NeonLayoutConfig } from './types';

/**
 * Represents the layout state of the grid in it's current configuration
 */
export class GridState {
    static readonly DEFAULT_SIZEX = 4;
    static readonly DEFAULT_SIZEY = 4;

    /**
       * This function uses a simple Axis-Aligned Bounding Box (AABB)
       * calculation to check for overlap of two items.  This function assumes the given items have valid sizes.
       * @arg one the first widget
       * @arg two the second widget
       */
    static widgetOverlaps(one: NeonGridItem, two: NeonGridItem) {
        if (one.col > (two.col + two.sizex - 1) || two.col > (one.col + one.sizex - 1)) {
            return false;
        }
        if (one.row > (two.row + two.sizey - 1) || two.row > (one.row + one.sizey - 1)) {
            return false;
        }
        return true;
    }

    /**
     * This function determines if a widget will overlap any existing grid items if placed
     * at the given row and column.  This function assumes the given widget has valid sizes.
     * @arg widgetGridItem The widget to place
     */
    static widgetFits(widgetGridItem: NeonGridItem, allItems: NeonGridItem[]) {
        for (let existingWidgetGridItem of allItems) {
            if (this.widgetOverlaps(widgetGridItem, existingWidgetGridItem)) {
                return false;
            }
        }
        return true;
    }

    static computeWidgetPosition(item: NeonGridItem, current: NeonGridItem[], maxRows?: number, maxCols?: number) {
        // Zero max rows or columns denotes unlimited.  Adjust the rows and columns for the widget size.
        const maxCol: number = (maxCols || Number.MAX_SAFE_INTEGER) - (item.sizex || 0) + 1;
        const maxRow: number = (maxRows || Number.MAX_SAFE_INTEGER) - (item.sizey || 0) + 1;

        // Find the first empty space for the widget.
        let xValue = 1;
        let yValue = 1;
        while (yValue <= maxRow) {
            xValue = 1;
            while (xValue <= maxCol) {
                const temp = {
                    ...item,
                    row: yValue,
                    col: xValue
                };

                if (this.widgetFits(temp, current)) {
                    return temp;
                }
                xValue++;
            }
            yValue++;
        }

        return { col: maxCol + 1, row: maxRow + 1 };
    }

    /**
     * Compute index of grid in tabs list by name of grid
     */
    static getGridIndexFromName(gridName: string, grids: NeonGridTab[]) {
        let index = grids.findIndex((grid) => grid.name === gridName);

        if (index < 0) {
            // Rename the default tab if it is empty.
            if (!grids[0].name && !grids[0].list.length) {
                grids[0].name = gridName;
                index = 0;
            } else {
                grids.push({
                    list: [],
                    name: gridName
                });
                index = grids.length - 1;
            }
        }

        return index;
    }

    static getAllGridItems(layout: NeonLayoutConfig[] | Record<string, NeonLayoutConfig[]>) {
        const out: { gridName: string, widgetGridItem: NeonGridItem }[] = [];

        // Should map the grid name to the layout list
        let gridNameToLayout = !Array.isArray(layout) ? layout : { '': layout };
        if (!gridNameToLayout) {
            return [];
        }

        for (const layoutName of Object.keys(gridNameToLayout)) {
            const layoutConf = gridNameToLayout[layoutName];
            if (Array.isArray(layoutConf)) {
                for (const item of layoutConf as NeonGridItem[]) {
                    out.push({ gridName: layoutName, widgetGridItem: item });
                }
            } else {
                for (const tab of Object.keys(layoutConf)) {
                    for (const item of layoutConf[tab] as NeonGridItem[]) {
                        out.push({ gridName: tab, widgetGridItem: item });
                    }
                }
            }
        }
        return out.filter((el) => !el.widgetGridItem.hide);
    }

    /**
     * Adds the given widget to the grid in its specified column and row or in the first open space if no column and row are specified.
     */
    static addWidgetToGridTab(
        tabs: NeonGridTab[], selectedIndex: number,
        item: NeonGridItem, gridName: string,
        maxRows: number, maxCols: number
    ) {
        Object.assign(item, { // Preserve reference
            // Set default grid item config properties for the Neon dashboard.
            borderSize: 10,
            dragHandle: '.drag-handle',
            id: uuidv4(),
            sizex: GridState.DEFAULT_SIZEX,
            sizey: GridState.DEFAULT_SIZEY,
            ...item
        });

        const index = gridName ?
            GridState.getGridIndexFromName(gridName, tabs) :
            selectedIndex;

        // If both col and row not are set, compute
        if (!item.col || !item.row) {
            const position = GridState.computeWidgetPosition(
                item,
                tabs[selectedIndex].list,
                maxRows,
                maxCols
            );
            Object.assign(item, position);
        }

        tabs[index].list.push(item);
    }

    constructor(
        public gridConfig: { max_rows: number, max_cols: number },
        public tabIndex = 0,
        public tabs: NeonGridTab[] = [{
            list: [],
            name: ''
        }]
    ) {

    }

    add(item: NeonGridItem, gridName?: string) {
        GridState.addWidgetToGridTab(
            this.tabs, this.tabIndex,
            item, gridName,
            this.gridConfig.max_rows, this.gridConfig.max_cols
        );
    }

    get activeWidgetList() {
        return this.tabs[this.tabIndex].list;
    }

    /**
     * Clears the grid.
     */
    clear() {
        this.tabIndex = 0;
        this.tabs = [{
            list: [],
            name: ''
        }];
    }

    /**
     * Contracts the given widget to its previous size.
     */
    contract(item: NeonGridItem) {
        Object.assign(item, item.previousConfig);
    }

    /**
     * Expands the given widget to fill the width of the grid.
     */
    expand(item: NeonGridItem, visibleRowCount: number) {
        const sizex = this.gridConfig ? this.gridConfig.max_cols : this.getMaxColInUse();

        Object.assign(item, {
            previousConfig: { ...item },
            sizex: sizex,
            // TODO:  Puzzle out why this exceeds the visible space by a couple rows.
            sizey: (visibleRowCount > 0) ? visibleRowCount : sizex,
            col: 1
        });
    }

    /**
     * Deletes the widget with the given ID from the grid.
     */
    delete(id: string) {
        const idx = this.activeWidgetList.findIndex((conf) => conf.id === id);
        if (idx >= 0) {
            this.activeWidgetList[idx].hide = true;
            this.activeWidgetList.splice(idx, 1);
        }
    }

    /**
     * Returns the 1-based index of the last column occupied.  Thus, for a 10 column grid, 10 would be the
     * largest possble max column in use.  If no columns are filled (i.e., an empty grid), 0 is returned.
     */
    getMaxColInUse(): number {
        let maxCol = 0;

        for (let widgetGridItem of this.activeWidgetList) {
            maxCol = Math.max(maxCol, (widgetGridItem.col + widgetGridItem.sizex - 1));
        }
        return maxCol;
    }

    /**
     * Returns the 1-based index of the last row occupied.  Thus, for a 10 row grid, 10 would be the
     * largest possble max row in use.  If no rows are filled (i.e., an empty grid), 0 is returned.
     */
    getMaxRowInUse(): number {
        let maxRow = 0;

        for (let widgetGridItem of this.activeWidgetList) {
            maxRow = Math.max(maxRow, (widgetGridItem.row + widgetGridItem.sizey - 1));
        }
        return maxRow;
    }

    /**
     * Moves the given widget to the bottom of the grid.
     */
    moveToBottom(item: NeonGridItem) {
        item.row = this.getMaxRowInUse() + 1;
    }

    /**
     * Moves the given widget to the top of the grid.
     */
    moveToTop(item: NeonGridItem) {
        item.row = 1;
    }
}

