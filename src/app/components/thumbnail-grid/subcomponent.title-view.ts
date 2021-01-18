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
import { Component, Input } from '@angular/core';
import { FieldConfig } from '@caci-critical-insight-solutions/nucleus-core';
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

        let annotationFields = new Map<string, { field: FieldConfig, value: any }>();
        annotationFields.set(this.options.annotationClassField.columnName, {
            field: this.options.annotationClassField,
            value: this.thumbnailGrid.annotatedClasses.has(id) ? this.thumbnailGrid.annotatedClasses.get(id) :
                this.item[this.options.annotationClassField.columnName]
        });
        annotationFields.set(this.options.annotationStateField, {
            field: { columnName: this.options.annotationStateField } as FieldConfig,
            value: this.item[this.options.annotationStateField]
        });

        (this.options.additionalAnnotationFields || []).forEach((fieldNameOrObject) => {
            let field: FieldConfig = typeof fieldNameOrObject === 'string' ? this.options.findField(fieldNameOrObject) : {
                columnName: fieldNameOrObject.columnName,
                prettyName: fieldNameOrObject.prettyName,
                hide: fieldNameOrObject.hide,
                type: fieldNameOrObject.type
            } as FieldConfig;

            if (!field || !field.columnName) {
                field = typeof fieldNameOrObject === 'string' ? {
                    columnName: fieldNameOrObject,
                    prettyName: fieldNameOrObject,
                    hide: false,
                    type: 'text'
                } as FieldConfig : null;
            }

            if (field) {
                annotationFields.set(field.columnName, {
                    field,
                    // TODO Default value based on field type (bool, date, number, etc.)
                    value: ''
                });
            }
        });

        this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'annotation',
                datastore: this.options.datastore,
                database: this.options.database,
                table: this.options.table,
                idField: this.options.datastoreIdField,
                dataId: id,
                dataImageHeight: this.options.canvasSize,
                dataImageWidth: this.options.canvasSize,
                dataImageUrl: this.item.constructedUrl,
                annotationFields
            },
            height: 'auto',
            width: '600px',
            disableClose: false
        }).afterClosed().subscribe((result) => {
            if (typeof result !== 'undefined' && result[this.options.annotationClassField.columnName]) {
                this.thumbnailGrid.annotatedClasses.set(this.item[this.options.datastoreIdField.columnName],
                    result[this.options.annotationClassField.columnName]);
            }
        });
    }

    public selectGridItemIfAnnotationsAreOff(options: any, item: any): void {
        if (!this.shouldShowAnnotationButton(options)) {
            this.thumbnailGrid.selectGridItem(item);
        }
    }

    public selectGridItemIfAnnotationsAreOn(options: any, item: any): void {
        if (this.shouldShowAnnotationButton(options)) {
            this.thumbnailGrid.selectGridItem(item);
        }
    }

    public shouldFlagAnnotationButton(options: any, item: any): boolean {
        return options.annotationStateField && !!item[options.annotationStateField];
    }

    public shouldShowAnnotationButton(options: any): boolean {
        return !!(options.datastoreIdField.columnName && options.annotationClassField.columnName);
    }
}
