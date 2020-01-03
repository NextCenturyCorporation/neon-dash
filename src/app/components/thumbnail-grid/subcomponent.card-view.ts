
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

import { filter } from 'rxjs/operators';

import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material';

import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { ThumbnailGridComponent } from './thumbnail-grid.component';

export function Confirm(config: {
    title: string | ((arg: any) => string);
    confirmMessage: string | ((arg: any) => string);
    confirmText: string | ((arg: any) => string);
    cancelText?: string | ((arg: any) => string);
}) {
    return (__inst: any, __prop: string | symbol, descriptor) => {
        const fn = descriptor.value;
        // TODO Why doesn't this function have a return value?
        /* eslint-disable-next-line consistent-return */
        descriptor.value = function(this: CardThumbnailSubComponent, value: any, confirm = true) {
            if (!confirm) {
                return fn.call(this, value);
            }
            const out = {} as typeof config;
            for (const el of Object.keys(config)) {
                out[el] = typeof config[el] === 'string' ? config[el] : config[el](value);
            }
            this.openConfirmationDialog(out as any)
                .pipe(filter((result) => !!result))
                .subscribe(() => fn.call(this, value));
        };
    };
}

@Component({
    selector: 'app-subcomponent-card-thumbnail',
    templateUrl: './subcomponent.card-view.html',
    styleUrls: ['./subcomponent.scss']
})

export class CardThumbnailSubComponent {
    @Input() item: any;
    @Input() options: any;

    thumbnailGrid: ThumbnailGridComponent;

    constructor(grid: ThumbnailGridComponent, private dialog: MatDialog
        ) {
        this.thumbnailGrid = grid;
    }

    public openConfirmationDialog(config: { title: string, message: string, confirmText: string, cancelText?: string }) {
        return this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'annotation',
                cancelText: 'Cancel',
                ...config
            },
            height: 'auto',
            width: '500px',
            disableClose: false
        }).afterClosed();
    }

    /*
     * Deletes the state for the name chosen.
     */
    @Confirm({
        title: 'Delete Changes',
        confirmMessage: (name) => `Are you sure you want to delete '${name}' ?`,
        confirmText: 'Update Lbel'
    })
    public updateData(name: string, __confirm = true) {
    //     this.configService.delete(name)
    //         .subscribe(() => {
    //             this.listStates();
    //             this.openNotification(name, 'deleted');
    //         }, this.handleStateFailure.bind(this, name));
    }
}
