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
import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { MatDialogRef, MatSelect, MAT_DIALOG_DATA } from '@angular/material';
import { NeonConfig } from '../../models/types';
import {
    BoundsFilterDesign,
    DatabaseConfig,
    DatastoreConfig,
    FieldConfig,
    TableConfig
} from '@caci-critical-insight-solutions/nucleus-core';

import { eventing } from 'neon-framework';
import { neonEvents } from '../../models/neon-namespaces';

@Component({
    selector: 'app-annotation',
    templateUrl: 'annotation.component.html',
    styleUrls: ['annotation.component.scss']
})
export class AnnotationComponent implements AfterViewInit {
    @ViewChild('annotationDropdown', { static: true }) annotationDropdown: MatSelect;

    public labels: any[];
    public datastore: DatastoreConfig;
    public database: DatabaseConfig;
    public table: TableConfig;
    public labelField: FieldConfig;
    public idField: FieldConfig;
    public dataId: string|number;
    public defaultLabel: string;
    public selectedLabel: string;

    private _messenger: eventing.Messenger;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<AnnotationComponent>,
        private configService: ConfigService,
        private connectionService: InjectableConnectionService
    ) {
        this._messenger = new eventing.Messenger();
        this.title = data.title || this.title;
        this.confirmText = data.confirmText || this.confirmText;
        this.cancelText = data.cancelText || this.cancelText;
        this.datastore = data.datastore;
        this.database = data.database;
        this.table = data.table;
        this.labelField = data.labelField;
        this.idField = data.idField;
        this.dataId = data.dataId;
        this.defaultLabel = data.defaultLabel;
        this.selectedLabel = this.defaultLabel;

        this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
            this.labels = neonConfig.dataLabels;
        });
    }

    public ngAfterViewInit(): void {
        // This is a hack so the dropdown will auto-scroll to the selected item because we've reduced the option height in our custom CSS.
        // https://github.com/angular/components/issues/3419#issuecomment-391007003
        this.annotationDropdown['_getItemHeight'] = () => 30;
    }

    public saveAnnotation(): void {
        let fieldsWithValues = {};
        fieldsWithValues[this.labelField.columnName] = this.selectedLabel;

        let connection = this.connectionService.connect(this.datastore.type, this.datastore.host);

        connection.runMutate({
            datastoreHost: this.datastore.host,
            datastoreType: this.datastore.type,
            databaseName: this.database.name,
            tableName: this.table.name,
            idFieldName: this.idField.columnName,
            dataId: this.dataId,
            fieldsWithValues
        }, ((response: any) => {
            if (response.error) {
                this._onError(response.error);
            } else {
                this._onSuccess();
            }
        }), this._onError.bind(this));
    }

    private _closeDialog(): void {
        this.dialogRef.close({
            data:this.selectedLabel
        });
    }

    private _onError(error: any): void {
        this._messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            error,
            message: 'Annotation operation failed on ' + this.datastore.name + '.' + this.database.name + '.' + this.table.name +
                '.' + this.labelField.columnName + ' = ' + this.selectedLabel
        });
        this._closeDialog();
    }

    private _onSuccess(): void {
        this._messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            message: 'Annotation successful!'
        });
        this._closeDialog();
    }
}
