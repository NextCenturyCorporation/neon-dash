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
import { Component, Inject } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { NeonConfig } from '../../models/types';
import { FormGroup, FormBuilder } from '@angular/forms';
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
export class AnnotationComponent {
    public confirmDialogRef: any;
    public confirmMessage: string = '';
    public target: string;
    public title: string = 'Update';
    public confirmText: string = 'Update Label';
    public cancelText: string = 'Cancel';
    public labels: any[];

    private _datastore: DatastoreConfig;
    private _database: DatabaseConfig;
    private _table: TableConfig;
    private _labelField: FieldConfig;
    private _idField: FieldConfig;
    private _dataId: string|number;
    private _defaultLabel: string;
    private selectedLabel: string;
    private _messenger: eventing.Messenger;

    public onChangeName() {
        let fieldsWithValues = {};
        fieldsWithValues[this._labelField.columnName] = this.selectedLabel;

        let connection = this.connectionService.connect(this._datastore.type, this._datastore.host);

        connection.runMutate({
            datastoreHost: this._datastore.host,
            datastoreType: this._datastore.type,
            databaseName: this._database.name,
            tableName: this._table.name,
            idFieldName: this._idField.columnName,
            dataId: this._dataId,
            fieldsWithValues
        }, ((response: any) => {
            if (response.error) {
                this._onError(response.error);
            } else {
                this._onSuccess(response.success);
            }
        }), this._onError.bind(this));
    }

    private _closeDialog() {
        this.dialogRef.close({data:this.selectedLabel});
    }

    private _onError(error: any) {
        this._messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            error,
            message: 'Annotation operation failed on ' + this._datastore.name + '.' + this._database.name + '.' + this._table.name +
                '.' + this._labelField.columnName + ' = ' + this.selectedLabel
        });
        this._closeDialog();
    }

    private _onSuccess(message: string) {
        this._messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            message
        });
        this._closeDialog();
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<AnnotationComponent>,
        private configService: ConfigService,
        private connectionService: InjectableConnectionService,
        private fb: FormBuilder
    ) {
        this._messenger = new eventing.Messenger();
        this.target = data.target;
        this.title = data.title || this.title;
        this.confirmText = data.confirmText || this.confirmText;
        this.cancelText = data.cancelText || this.cancelText;
        this._datastore = data.datastore;
        this._database = data.database;
        this._table = data.table;
        this._labelField = data.labelField;
        this._idField = data.idField;
        this._dataId = data.dataId;
        this._defaultLabel = data.defaultLabel;
        //console.log(data.defaultLabel);
        this.selectedLabel = this._defaultLabel;
        // this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
        //     this.labels = neonConfig.dataLabels.sort(function (a, b) {
        //         if (a > b) {
        //             return 1;
        //         }
        //         if (b > a) {
        //             return -1;
        //         }
        //         return 0;
        //     });
        // });
        this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
            this.labels = neonConfig.dataLabels;
        });

        // this.labels = this.fb.group({
        //     defaultLabel: this._defaultLabel
        // });
    }

}
