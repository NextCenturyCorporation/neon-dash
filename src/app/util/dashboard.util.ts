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
import * as _ from 'lodash';

import {
    NeonDashboardConfig, NeonDatastoreConfig, NeonDatabaseMetaData,
    NeonTableMetaData, NeonFieldMetaData, NeonDashboardChoiceConfig
} from '../model/types';
import { DashboardState } from '../model/dashboard-state';

/**
 * Common Utility functions for dashboards, specifically
 *    - Validation
 */
export class DashboardUtil {
    static DASHBOARD_CATEGORY_DEFAULT: string = 'Select an option...';

    static validateFields(table: NeonTableMetaData): void {
        for (let idx = table.fields.length - 1; idx >= 0; idx--) {
            const field = table.fields[idx];
            if (!field.columnName) {
                table.fields.splice(idx, 1);
            } else {
                field.prettyName = field.prettyName || field.columnName;
            }
        }
    }

    static validateTables(database: NeonDatabaseMetaData): void {
        for (const key of Object.keys(database.tables)) {
            const table = database.tables[key];
            if (!table.name) {
                delete database.tables[key];
            } else {
                table.prettyName = table.prettyName || table.name;
                table.fields = table.fields || [];
                table.mappings = table.mappings || {};
                table.labelOptions = table.labelOptions || {};
                DashboardUtil.validateFields(table);
            }
        }
    }

    static validateDatabases(dataset: NeonDatastoreConfig): void {
        for (const key of Object.keys(dataset.databases)) {
            const database = dataset.databases[key];
            if (!(database.name || database.tables || database.tables.length)) {
                delete dataset.databases[key];
            } else {
                database.prettyName = database.prettyName || database.name;
                DashboardUtil.validateTables(database);
            }
        }
    }

    /**
     * Validate top level category of dashboards object in the config, then call
     * separate function to check the choices within recursively.
     */
    static validateDashboards(dashboard: NeonDashboardConfig): NeonDashboardConfig {
        let rootDashboard = dashboard;

        if ((!('choices' in dashboard) || !Object.keys(dashboard.choices).length) && dashboard.name) {
            rootDashboard = NeonDashboardChoiceConfig.get();
            rootDashboard.choices[dashboard.name] = dashboard;
        }

        if (!('category' in rootDashboard)) {
            rootDashboard['category'] = this.DASHBOARD_CATEGORY_DEFAULT;
        }

        let dashboardKeys = 'choices' in rootDashboard ? Object.keys(rootDashboard.choices) : [];

        this.validateDashboardChoices('choices' in rootDashboard ? rootDashboard['choices'] : {}, dashboardKeys);

        return rootDashboard;
    }

    /**
     * Validate the choices map within each level of dashboards object, and make appropriate
     * changes when expected values are missing. Also used to translate tableKey/fieldKey
     * values into databaseName, tableName, and fieldName.
     *
     * @param {string[]} keys for dashboardChoices map
     * @param {string} pathFromTop path to append to current dashboard object
     * @param {string} title title to append to current dashboard object
     */
    static validateDashboardChoices(dashboardChoices: Record<string, NeonDashboardConfig>, keys: string[],
        pathFromTop?: string[], title?: string): void {
        if (!keys.length) {
            return;
        }

        keys.forEach((choiceKey) => {
            const db = dashboardChoices[choiceKey];
            let fullTitle = (title ? (title + ' ') : '') + db.name;
            let fullPathFromTop = pathFromTop ? pathFromTop.concat(choiceKey) : [choiceKey];

            db.fullTitle = db.fullTitle || fullTitle;
            db.pathFromTop = fullPathFromTop;

            let nestedChoiceKeys = 'choices' in db ? Object.keys(db.choices) : [];

            if (!nestedChoiceKeys.length) {
                // If no choices are present, then this might be the last level of nested choices,
                // which should instead have table keys and a layout specified. If not, delete choice.
                if (!('layout' in db) || !('tables' in db)) {
                    delete dashboardChoices[choiceKey];
                }
            }

            if (db) {
                if (!db.name) {
                    db.name = choiceKey;
                }

                // If simpleFilter present in config, make sure to translate keys to database, table, and
                // field names.
                if ('options' in db &&
                    db.options.simpleFilter &&
                    db.options.simpleFilter.tableKey) {
                    let tableKey = db.options.simpleFilter.tableKey;

                    const { database, table } = DashboardState.deconstructDottedReference(db.tables[tableKey]);

                    db.options.simpleFilter.databaseName = database;
                    db.options.simpleFilter.tableName = table;

                    if (db.options.simpleFilter.fieldKey) {
                        let fieldKey = db.options.simpleFilter.fieldKey;
                        const { field: fieldName } = DashboardState.deconstructDottedReference(db.fields[fieldKey]);

                        db.options.simpleFilter.fieldName = fieldName;
                    } else {
                        db.options.simpleFilter.fieldName = '';
                    }
                } else if ('options' in db && db.options.simpleFilter) {
                    // Delete simpleFilter from config if no tableKey present
                    delete db.options.simpleFilter;
                }

                // Only auto fill category if this is not the last level of nesting
                if (!('category' in db) && !('tables' in db)) {
                    db.category = this.DASHBOARD_CATEGORY_DEFAULT;
                }

                this.validateDashboardChoices('choices' in db ? db.choices : {}, nestedChoiceKeys,
                    fullPathFromTop, db.fullTitle);
            }
        });
    }

    /**
     * If a database is not found in updateDatabases(), delete dashboards associated with that database so that
     * the user cannot select them.
     * @param {String[]} keys
     * @param {String} invalidDatabaseName
     * @return {Promise}
     * @private
     */
    static deleteInvalidDashboards(dashboardChoices: Record<string, NeonDashboardConfig>, keys: string[],
        invalidDatabaseName: string): any {
        if (!keys.length) {
            return Promise.resolve();
        }

        for (const choiceKey of keys) {
            const dash = dashboardChoices[choiceKey];
            if ('tables' in dash) {
                let tableKeys = Object.keys(dash.tables);

                for (const tableKey of tableKeys) {
                    const { database } = DashboardState.deconstructDottedReference(dash.tables[tableKey]);

                    if (database === invalidDatabaseName) {
                        delete dashboardChoices[choiceKey];
                    }
                }
            } else {
                let nestedChoiceKeys = dash.choices ? Object.keys(dash.choices) : [];
                this.deleteInvalidDashboards(dash.choices, nestedChoiceKeys, invalidDatabaseName);
            }
        }

        return null;
    }

    static appendDatastoresFromConfig(
        configDatastores: Record<string, NeonDatastoreConfig>, existingDatastores: Record<string, NeonDatastoreConfig>
    ): Record<string, NeonDatastoreConfig> {
        // Transform the datastores from config file structures to Datastore objects.
        Object.keys(configDatastores).forEach((datastoreKey) => {
            let configDatastore = configDatastores[datastoreKey] || NeonDatastoreConfig.get();
            let outputDatastore = NeonDatastoreConfig.get({
                name: datastoreKey,
                host: configDatastore.host,
                type: configDatastore.type
            });

            // Keep whether the datastore's fields are already updated (important for loading a saved state).
            if (configDatastore['hasUpdatedFields']) {
                outputDatastore['hasUpdatedFields'] = true;
            } else {
                delete outputDatastore['hasUpdatedFields'];
            }

            let configDatabases = configDatastore.databases || NeonDatabaseMetaData.get();
            outputDatastore.databases = Object.keys(configDatabases).reduce((dbs, databaseKey) => {
                let configDatabase = configDatabases[databaseKey] || NeonDatabaseMetaData.get();
                let outputDatabase = NeonDatabaseMetaData.get({ name: databaseKey, prettyName: configDatabase.prettyName });

                let configTables = configDatabase.tables || NeonTableMetaData.get();
                outputDatabase.tables = Object.keys(configTables).reduce((acc, tableKey) => {
                    let configTable = configTables[tableKey] || NeonTableMetaData.get();
                    let outputTable = NeonTableMetaData.get({ name: tableKey, prettyName: configTable.prettyName });

                    outputTable.fields = (configTable.fields || []).map((configField) =>
                        NeonFieldMetaData.get(configField));

                    // Create copies to maintain original config data.
                    outputTable.labelOptions = _.cloneDeep(configTable.labelOptions);
                    outputTable.mappings = _.cloneDeep(configTable.mappings);

                    acc[outputTable.name] = outputTable;

                    return acc;
                }, {} as { [key: string]: NeonTableMetaData });

                dbs[outputDatabase.name] = outputDatabase;
                return dbs;
            }, {} as { [key: string]: NeonDatabaseMetaData });

            // Ignore the datastore if another datastore with the same name already exists (each name should be unique).
            if (!existingDatastores[outputDatastore.name]) {
                existingDatastores[outputDatastore.name] = outputDatastore;
            }
        });

        return existingDatastores;
    }
}
