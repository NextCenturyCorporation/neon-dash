/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { Component } from '@angular/core';

import { DashboardService } from '../../services/dashboard.service';

import { CustomConnectionStep } from './custom-connection-step';
import { Connection, DatabaseConfig, TableConfig, FieldConfig } from '@caci-critical-insight-solutions/nucleus-core';
import { InjectableConnectionService } from '../../services/injectable.connection.service';

// TODO It's likely worth removing the extends here. I don't do it now just in case we do want to add steps as we iterate.

@Component({
    selector: 'app-custom-connection-simple-setup-step',
    templateUrl: 'simple-setup.component.html',
    styleUrls: ['simple-setup.component.scss']
})
export class CustomConnectionSimpleSetupStepComponent extends CustomConnectionStep {
    // This.data is inherited from the superclass

    // Variables associated with connecting to a datastore.
    public datasetNameIsValid: boolean = false;
    public isLoading: boolean = false;
    public isConnected: boolean = false;
    public error: boolean = false;
    public tooltip: string = '';

    // Variables associated with selecting databases and tables.
    public selectedDatabase: {
        database: DatabaseConfig;
        selectedTable: {
            selected: boolean;
            table: TableConfig;
        };
    };

    public customDatabases: {
        database: DatabaseConfig;
        customTables: {
            selected: boolean;
            table: TableConfig;
        }[];
    }[];

    constructor(private datasetService: DashboardService, private connectionService: InjectableConnectionService) {
        super();
        this.selected = true;
        this.stepNumber = 1;
        this.title = 'Connect to Database';

        this.resetSelectedDatabase();
        this.customDatabases = [];
    }

    isStepValid(): boolean {
        return (
            this.datasetNameIsValid &&
            this.isConnected &&
            this.customDatabases.length > 0 &&
            this.customDatabases[0].customTables.length > 0
        );
    }

    onComplete(): void {
        this.data.selectedDatabases = this.customDatabases.map(
            (customDatabase) => {
                let database = DatabaseConfig.get({
                    name: customDatabase.database.name,
                    prettyName: customDatabase.database.prettyName
                });
                database.tables = customDatabase.customTables.map(
                    (customTable) => customTable.table
                ).reduce((acc, table) => {
                    acc[table.name] = table;
                    return acc;
                }, {} as { [key: string]: TableConfig });
                return database;
            }
        );
    }

    validateDatasetName(): void {
        this.datasetNameIsValid = this.data.datasetName !== '';
        Object.values(this.datasetService.config.datastores).forEach((dataset) => {
            this.datasetNameIsValid =
                this.datasetNameIsValid &&
                dataset.name !== this.data.datasetName;
        });
    }

    changeType(): void {
        this.isConnected = false;
    }

    changeHost(): void {
        this.isConnected = false;
    }

    connectToServer(): void {
        let connection = this.connectionService.connect(this.data.datastoreType, this.data.datastoreHost);
        if (!connection) {
            return;
        }
        this.isLoading = true;
        this.data.allDatabases = [];

        connection.getDatabaseNames(
            (databaseNames) => {
                databaseNames.forEach((databaseName) => {
                    this.data.allDatabases.push(
                        DatabaseConfig.get({ name: databaseName, prettyName: databaseName })
                    );
                });
                this.updateDatabases(connection);
            },
            () => {
                this.isLoading = false;
                this.isConnected = false;
                this.error = true;
            }
        );
    }

    updateDatabases(connection: Connection, index: number = 0): void {
        let database = this.data.allDatabases[index];
        connection.getTableNamesAndFieldNames(
            database.name,
            (tableNamesAndFieldNames) => {
                let tableNames = Object.keys(tableNamesAndFieldNames);
                let tablesDone = 0;
                if (
                    !tableNames.length ||
                    (tableNames.length === 1 && tableNames[0] === null)
                ) {
                    this.tableDone(tablesDone, tableNames, connection, index);
                }
                tableNames.forEach((tableName) => {
                    let table = TableConfig.get({ name: tableName, prettyName: tableName });
                    tableNamesAndFieldNames[tableName].forEach((fieldName) => {
                        table.fields.push(
                            FieldConfig.get({ columnName: fieldName, prettyName: fieldName })
                        );
                    });
                    database.tables[table.name] = table;

                    connection.getFieldTypes(
                        database.name,
                        table.name,
                        (types) => {
                            for (let field of table.fields) {
                                if (types && types[field.columnName]) {
                                    field.type = types[field.columnName];
                                }
                            }
                            tablesDone++;
                            this.tableDone(
                                tablesDone,
                                tableNames,
                                connection,
                                index
                            );
                        }
                    );
                });
            },
            () => {
                this.isLoading = false;
                this.isConnected = false;
                this.error = true;
            }
        );
    }

    tableDone(tablesDone, tableNames, connection, index) {
        if (tablesDone === tableNames.length) {
            if (this.data.allDatabases.length > index + 1) {
                this.updateDatabases(connection, index + 1);
            } else {
                this.isLoading = false;
                this.isConnected = true;
                this.error = false;
            }
        }
    }

    selectDatabase(): void {
        this.selectedDatabase.selectedTable = {
            selected: false,
            table: TableConfig.get()
        };
    }

    selectTable(): void {
        // Do nothing.
    }

    addNewCustomDatabase() {
        let customDatabase = this.customDatabases.find(
            (database) =>
                database.database.name === this.selectedDatabase.database.name
        );
        if (customDatabase) {
            let customTable = customDatabase.customTables.find(
                (table) =>
                    table.table.name ===
                    this.selectedDatabase.selectedTable.table.name
            );
            if (!customTable) {
                customDatabase.customTables.push({
                    selected: false,
                    table: this.selectedDatabase.selectedTable.table
                });
            }
        } else {
            let customDB = {
                database: this.selectedDatabase.database,
                customTables: [
                    {
                        selected: false,
                        table: this.selectedDatabase.selectedTable.table
                    }
                ]
            };
            this.customDatabases.push(customDB);
        }
        this.resetSelectedDatabase();
    }

    resetSelectedDatabase(): void {
        this.selectedDatabase = {
            database: DatabaseConfig.get(),
            selectedTable: {
                selected: false,
                table: TableConfig.get()
            }
        };
    }

    removeCustomDatabases() {
        for (let index = this.customDatabases.length - 1; index >= 0; index--) {
            let customTableList = this.customDatabases[index].customTables;
            for (
                let tableIndex = customTableList.length - 1;
                tableIndex >= 0;
                tableIndex--
            ) {
                if (customTableList[tableIndex].selected === true) {
                    customTableList.splice(tableIndex, 1);
                }
            }
            if (this.customDatabases[index].customTables.length === 0) {
                this.customDatabases.splice(index, 1);
            }
        }
    }

    removeButtonDisabled() {
        for (
            let dbIndex = this.customDatabases.length - 1;
            dbIndex >= 0;
            dbIndex--
        ) {
            for (
                let tableIndex =
                    this.customDatabases[dbIndex].customTables.length - 1;
                tableIndex >= 0;
                tableIndex--
            ) {
                if (
                    this.customDatabases[dbIndex].customTables[tableIndex]
                        .selected === true
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    isTableDisabled(): boolean {
        return !this.selectedDatabase.database.name || !Object.values(this.selectedDatabase.database.tables).length;
    }
}
