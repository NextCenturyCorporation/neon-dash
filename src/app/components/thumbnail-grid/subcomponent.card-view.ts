
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
import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { MatDialog } from '@angular/material';
import { ThumbnailGridComponent } from './thumbnail-grid.component';

import { filter } from 'rxjs/operators';
import { isNullOrUndefined } from '@swimlane/ngx-datatable';

@Component({
    selector: 'app-subcomponent-card-thumbnail',
    templateUrl: './subcomponent.card-view.html',
    styleUrls: ['./subcomponent.scss']
})

export class CardThumbnailSubComponent {
    @Input() item: any;
    @Input() options: any;

    thumbnailGrid: ThumbnailGridComponent;


    constructor(grid: ThumbnailGridComponent, private dialog: MatDialog) {
        this.thumbnailGrid = grid;
    }

    public updateData() {
        let id = this.item[this.options.datastoreIdField.columnName];
        let heldLabel = this.thumbnailGrid.updatedLabels.get(id); 
        if(!heldLabel){
            // TODO Why config.config ?
            heldLabel = this.item[this.options.config.config.updateLabelField]
        }
        this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'annotation',
                datastore: this.options.datastore,
                database: this.options.database,
                table: this.options.table,
                labelField: this.options.updateLabelField,
                idField: this.options.datastoreIdField,
                dataId: id,
                defaultLabel: heldLabel
            },
            height: 'auto',
            width: '500px',
            disableClose: false
        }).afterClosed().subscribe(result => {
            if (typeof result !== 'undefined') {
                this.thumbnailGrid.getUpdatedLabelFromSubcomponent(this.item._id, result.data);
            }
        });
    }
}

