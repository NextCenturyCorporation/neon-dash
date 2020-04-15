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
import { AfterViewInit, Component, Inject, QueryList, ViewChildren } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { InjectableSearchService } from '../../services/injectable.search.service';
import { MatDialogRef, MatSelect, MAT_DIALOG_DATA } from '@angular/material';
import { NeonConfig } from '../../models/types';
import {
    AggregationType,
    CoreUtil,
    DatabaseConfig,
    DatastoreConfig,
    FieldConfig,
    FieldKey,
    TableConfig
} from '@caci-critical-insight-solutions/nucleus-core';

import { eventing } from 'neon-framework';
import { neonEvents } from '../../models/neon-namespaces';

export interface AnnotationDialogInput {
    datastore: DatastoreConfig;
    database: DatabaseConfig;
    table: TableConfig;
    idField: FieldConfig;
    dataId: string|number;
    dataImageHeight: number;
    dataImageWidth: number;
    dataImageUrl: string;
    dataName: string;
    annotationFields: Map<string, { field: FieldConfig, value: any }>;
}

export interface AnnotationUserInput {
    field: FieldConfig;
    currentValue: any;
    newValue: any;
    oneLineInput: boolean|string;
    multiLineInput: boolean|string;
    dropdown: boolean|string[];
    hidden: boolean;
}

@Component({
    selector: 'app-annotation',
    templateUrl: 'annotation.component.html',
    styleUrls: ['annotation.component.scss']
})
export class AnnotationComponent implements AfterViewInit {
    @ViewChildren(MatSelect) dropdowns: QueryList<MatSelect>;

    public datastore: DatastoreConfig;
    public database: DatabaseConfig;
    public table: TableConfig;
    public idField: FieldConfig;
    public dataId: string|number;
    public dataImageHeight: number;
    public dataImageWidth: number;
    public dataImageUrl: string;
    public dataName: string;
    public inputs: AnnotationUserInput[] = [];

    private _messenger: eventing.Messenger;

    constructor(@Inject(MAT_DIALOG_DATA) data: AnnotationDialogInput,
        public dialogRef: MatDialogRef<AnnotationComponent>,
        private configService: ConfigService,
        private connectionService: InjectableConnectionService,
        private searchService: InjectableSearchService) {
        this._messenger = new eventing.Messenger();

        this.datastore = data.datastore;
        this.database = data.database;
        this.table = data.table;
        this.idField = data.idField;
        this.dataId = data.dataId;
        this.dataImageHeight = data.dataImageHeight;
        this.dataImageWidth = data.dataImageWidth;
        this.dataImageUrl = data.dataImageUrl;
        this.dataName = data.dataName;

        this.inputs = Array.from(data.annotationFields.keys()).map((fieldName) => {
            const fieldData: { field: FieldConfig, value: any } = data.annotationFields.get(fieldName);
            return {
                field: fieldData.field,
                currentValue: fieldData.value,
                newValue: fieldData.value,
                oneLineInput: false,
                multiLineInput: false,
                dropdown: false,
                hidden: true
            } as AnnotationUserInput;
        });

        this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
            if (neonConfig.annotations[this.datastore.name] && neonConfig.annotations[this.datastore.name][this.database.name] &&
                neonConfig.annotations[this.datastore.name][this.database.name][this.table.name] &&
                neonConfig.annotations[this.datastore.name][this.database.name][this.table.name].fields) {
                this.inputs.forEach((input) => {
                    const annotationConfig = neonConfig.annotations[this.datastore.name][this.database.name][this.table.name]
                        .fields[input.field.columnName];

                    if (annotationConfig) {
                        input.newValue = (typeof annotationConfig.setValue !== 'undefined' ? annotationConfig.setValue : input.newValue);
                        input.dropdown = annotationConfig.dropdown || false;
                        input.multiLineInput = annotationConfig.multiLineInput || false;
                        input.oneLineInput = annotationConfig.oneLineInput || false;
                        input.hidden = !(input.dropdown || input.multiLineInput || input.oneLineInput);
                    }

                    if (input.dropdown) {
                        // TODO Should this be optional?
                        this._retrieveAdditionalDropdownData(input);
                    }
                });
            }
        });
    }

    public ngAfterViewInit(): void {
        // This is a hack so the dropdown will auto-scroll to the selected item because we've reduced the option height in our custom CSS.
        this.dropdowns.forEach((dropdown) => {
            // https://github.com/angular/components/issues/3419#issuecomment-391007003
            dropdown['_getItemHeight'] = () => 30;
        });
    }

    public isSaveDisabled(inputs: AnnotationUserInput[]): boolean {
        // TODO Validate input by type of field (bool, date, number, etc.)
        return !inputs.some((input) => !input.hidden && input.currentValue !== input.newValue);
    }

    public saveAnnotation(): void {
        let fieldsWithValues = this.inputs.reduce((output, input) => {
            output[input.field.columnName] = input.newValue;
            return output;
        }, {});

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

    private _onError(error: any): void {
        this._messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            error,
            message: 'Annotation operation failed on ' + this.datastore.name + '.' + this.database.name + '.' + this.table.name +
                '.' + this.idField.columnName + ' = ' + this.dataId
        });
        this.dialogRef.close();
    }

    private _onSuccess(): void {
        this._messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            message: 'Annotation successful!'
        });
        this.dialogRef.close(this.inputs.reduce((output, input) => {
            output[input.field.columnName] = input.newValue;
            return output;
        }, {}));
    }

    private _retrieveAdditionalDropdownData(input: AnnotationUserInput): void {
        let searchObject = this.searchService.createSearch(this.database.name, this.table.name);

        this.searchService.withAggregation(searchObject, {
            datastore: this.datastore.name,
            database: this.database.name,
            table: this.table.name,
            field: input.field.columnName
        } as FieldKey, this.searchService.getAggregationLabel(), AggregationType.COUNT).withGroup(searchObject, {
            datastore: this.datastore.name,
            database: this.database.name,
            table: this.table.name,
            field: input.field.columnName
        } as FieldKey);

        const search = this.searchService.runSearch(this.datastore.type, this.datastore.host, searchObject);

        search.done((response) => {
            if (response.data && response.data.length) {
                let dropdownData = response.data.map((item) => CoreUtil.deepFind(item, input.field.columnName))
                    .filter((item) => typeof item !== 'undefined' && item !== null);
                // TODO Should we make the sort optional?
                input.dropdown = dropdownData.concat((Array.isArray(input.dropdown) ? input.dropdown : []).filter((item) =>
                    dropdownData.indexOf(item) < 0)).sort();
            }
        });

        search.fail((response) => {
            if (response.statusText !== 'abort') {
                this._messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                    error: response,
                    message: 'Failed annotation component dropdown data query on ' + input.field.prettyName
                });
            }
        });
    }
}
