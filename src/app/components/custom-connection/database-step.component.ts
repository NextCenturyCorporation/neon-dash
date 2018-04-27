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

import { CustomConnectionStep } from './custom-connection-step';
import { TableMetaData, DatabaseMetaData } from '../../dataset';

@Component({
    selector: 'app-custom-connection-database-step',
    templateUrl: 'database-step.component.html',
    styleUrls: ['custom-connection.component.scss']
})
export class CustomConnectionDatabaseStepComponent extends CustomConnectionStep {
    private selectedDatabase: {
        database: DatabaseMetaData,
        selectedTable: {
            selected: boolean,
            table: TableMetaData
        }
    };
    private customDatabases: {
        database: DatabaseMetaData,
        customTables: {
            selected: boolean,
            table: TableMetaData
        }[]
    }[];

    constructor() {
        super();
        this.selected = false;
        this.stepNumber = 2;
        this.title = 'Add Databases';

        this.resetSelectedDatabase();
        this.customDatabases = [];
    }

    /**
     * Checks whether the selected databases are valid such that the process
     * of connecting to a custom dataset can be continued.
     *
     * @returns {boolean} true if this step is valid, false otherwise.
     * @memberof DatabaseStepComponent
     */
    public isStepValid(): boolean {
        return this.customDatabases.length > 0 && this.customDatabases[0].customTables.length > 0;
    }

    /**
     *
     *
     * @memberof DatabaseStepComponent
     */
    public onComplete(): void {
        this.data.selectedDatabases = this.customDatabases.map((customDatabase) => {
            let database = new DatabaseMetaData(customDatabase.database.name, customDatabase.database.prettyName);
            database.tables = customDatabase.customTables.map((customTable) => customTable.table);
            return database;
        });
    }

    selectDatabase() {
        this.selectedDatabase.selectedTable = {
            selected: false,
            table: new TableMetaData()
        };
    }

    selectTable() {
        // Do nothing
    }

    addNewCustomDatabase() {
        let customDatabase = this.customDatabases.find((database) => database.database.name === this.selectedDatabase.database.name);
        if (customDatabase) {
            let customTable = customDatabase.customTables.find((table) =>
                table.table.name === this.selectedDatabase.selectedTable.table.name);
            if (!customTable) {
                customDatabase.customTables.push({
                    selected: false,
                    table: this.selectedDatabase.selectedTable.table
                });
            }
        } else {
            let customDB = {
                database: this.selectedDatabase.database,
                customTables: [{
                    selected: false,
                    table: this.selectedDatabase.selectedTable.table
                }]
            };
            this.customDatabases.push(customDB);
        }
        this.resetSelectedDatabase();
    }

    resetSelectedDatabase() {
        this.selectedDatabase = {
            database: new DatabaseMetaData(),
            selectedTable: {
                selected: false,
                table: new TableMetaData()
            }
        };
    }

    removeCustomDatabases() {
        for (let index = this.customDatabases.length - 1; index >= 0; index--) {
            let customTableList = this.customDatabases[index].customTables;
            for (let tableIndex = customTableList.length - 1; tableIndex >= 0; tableIndex--) {
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
        for (let dbIndex = this.customDatabases.length - 1; dbIndex >= 0; dbIndex--) {
            for (let tableIndex = this.customDatabases[dbIndex].customTables.length - 1; tableIndex >= 0; tableIndex--) {
                if (this.customDatabases[dbIndex].customTables[tableIndex].selected === true) {
                    return false;
                }
            }
        }
        return true;
    }
}
