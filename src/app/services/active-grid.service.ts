import { Injectable } from '@angular/core';

import { NeonGridItem } from '../neon-grid-item';
@Injectable()
export class ActiveGridService {

    private gridItems: NeonGridItem[] = [];

    constructor() { }

    setGridItems(items: NeonGridItem[]) {
        this.clear();
        if (items) {
            for (let i = 0; i < items.length; i++) {
                this.gridItems.push(items[i]);
            }
        }
    }

    clear() {
        this.gridItems.length = 0;
    }

    getGridItems(): NeonGridItem[] {
        return this.gridItems;
    }

    getMaxRowInUse(): number {
        let maxRow: number = 0;

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
