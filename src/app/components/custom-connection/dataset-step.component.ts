/*
 * Copyright 2017 Next Century Corporation
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
import { Component } from '@angular/core';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';

import { CustomConnectionStep } from './custom-connection-step';
import { DatabaseMetaData, TableMetaData, FieldMetaData } from '../../dataset';

@Component({
    selector: 'app-custom-connection-dataset-step',
    templateUrl: 'dataset-step.component.html',
    styleUrls: ['custom-connection.component.scss']
})
export class CustomConnectionDatasetStepComponent extends CustomConnectionStep {
    private datasetName: string;
    private datasetNameIsValid: boolean;
    private datastoreType: string;
    private datastoreHost: string;
    private isLoading: boolean;
    private isConnected: boolean;
    private error: boolean;

    private databases: DatabaseMetaData[];

    constructor(private connectionService: ConnectionService, private datasetService: DatasetService) {
        super();
        this.selected = true;
        this.stepNumber = 1;
        this.title = 'Connect to Datastore';

        this.datasetName = '';
        this.datasetNameIsValid = false;
        this.datastoreType = 'mongo';
        this.datastoreHost = 'localhost';
        this.isLoading = false;
        this.isConnected = false;
        this.error = false;

        this.databases = [];
    }

    /**
     * Checks that the entered data for this step is valid such that the process of connecting
     * to a custom dataset can continue.
     *
     * @returns true if the entered data is valid, or false otherwise.
     * @memberof DatasetStepComponent
     */
    public isStepValid() {
        return this.datasetNameIsValid && this.isConnected;
    }

    /**
     * Applies the entered dataset name, datastore, hostname, and found databases and tables
     * to this step's Dataset object.
     *
     * @memberof DatasetStepComponent
     */
    onComplete(): void {
        this.data.datasetName = this.datasetName;
        this.data.datastoreType = this.datastoreType;
        this.data.datastoreHost = this.datastoreHost;
        this.data.allDatabases = this.databases;
    }

    validateDatasetName() {
        this.datasetNameIsValid = this.datasetName !== '';
        this.datasetService.getDatasets().forEach((dataset) => {
            if (dataset.name === this.datasetName) {
                this.datasetNameIsValid = false;
            }
        });
    }

    changeType() {
        this.isConnected = false;
    }

    changeHost() {
        this.isConnected = false;
    }

    connectToServer() {
        let connection = this.connectionService.createActiveConnection(this.datastoreType, this.datastoreHost);
        if (!connection) {
            return;
        }
        this.isLoading = true;
        let databases = [];

        connection.getDatabaseNames((databaseNames) => {
            databaseNames.forEach((databaseName) => {
                databases.push(new DatabaseMetaData(databaseName, databaseName, []));
            });
            this.updateDatabases(connection, databases);
        }, () => {
            this.isLoading = false;
            this.isConnected = false;
            this.error = true;
        });
    }

    updateDatabases(connection: neon.query.Connection, databases: DatabaseMetaData[], index?: number) {
        let databaseIndex = index ? index : 0;
        let database = databases[databaseIndex];
        connection.getTableNamesAndFieldNames(database.name,
            (tableNamesAndFieldNames) => {
                Object.keys(tableNamesAndFieldNames).forEach((tableName) => {
                    let table = new TableMetaData(tableName, tableName, []);
                    tableNamesAndFieldNames[tableName].forEach((fieldName) => {
                        table.fields.push(new FieldMetaData(fieldName, fieldName));
                    });
                    database.tables.push(table);
                });
                if (++databaseIndex < databases.length) {
                    this.updateDatabases(connection, databases, databaseIndex);
                } else {
                    this.databases = databases;
                    this.isLoading = false;
                    this.isConnected = true;
                    this.error = false;
                }
            },
            () => {
                this.isLoading = false;
                this.isConnected = false;
                this.error = true;
            });
    }
}
