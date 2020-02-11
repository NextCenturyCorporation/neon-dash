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
import { Component, Input } from '@angular/core';
import { ThumbnailGridComponent } from './thumbnail-grid.component';

import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-subcomponent-title-thumbnail',
    templateUrl: './subcomponent.title-view.html',
    styleUrls: ['./subcomponent.scss']
})

export class TitleThumbnailSubComponent {
    @Input() item: any;
    @Input() options: any;

    thumbnailGrid: ThumbnailGridComponent;

    constructor(grid: ThumbnailGridComponent, private dialog: MatDialog) {
        this.thumbnailGrid = grid;
    }

    public openAnnotationDialog(event): void {
        event.stopPropagation();
        const id = this.item[this.options.datastoreIdField.columnName];
        this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'annotation',
                datastore: this.options.datastore,
                database: this.options.database,
                table: this.options.table,
                labelField: this.options.updateLabelField,
                idField: this.options.datastoreIdField,
                dataId: id,
                defaultLabel: this.thumbnailGrid.updatedLabels.has(id) ? this.thumbnailGrid.updatedLabels.get(id) :
                    this.item[this.options.updateLabelField.columnName]
            },
            height: 'auto',
            width: '500px',
            disableClose: false
        }).afterClosed().subscribe(result => {
            if (typeof result !== 'undefined') {
                this.thumbnailGrid.updatedLabels.set(this.item[this.options.datastoreIdField.columnName], result.data);
            }
        });
    }

    public shouldShowAnnotationButton(options): boolean {
        return !!(options.datastoreIdField.columnName && options.updateLabelField.columnName);
    }
}
