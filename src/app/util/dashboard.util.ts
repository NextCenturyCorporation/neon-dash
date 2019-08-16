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

import { NeonDashboardConfig } from '../models/types';
import { NeonDatastoreConfig, NeonDatabaseMetaData, NeonTableMetaData, NeonFieldMetaData } from '../models/dataset';
import { ConfigUtil } from './config.util';
import { DatasetUtil } from './dataset.util';

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
        ConfigUtil.visitDashboards(dashboard, {
            leaf: (leaf, path) => {
                let parent = path[path.length - 1];
                parent.choices = parent.choices || {};

                // If no choices are present, then this might be the last level of nested choices,
                // which should instead have table keys and a layout specified. If not, delete choice.
                if (!leaf['layout'] || !leaf['tables']) {
                    delete parent.choices[leaf.name];
                }

                if (leaf.options.simpleFilter) {
                    const filter = leaf.options.simpleFilter;
                    if (filter.tableKey) {
                        let tableKey = filter.tableKey;

                        const tableReference = DatasetUtil.deconstructDottedReference(leaf.tables[tableKey]);

                        filter.databaseName = tableReference.database;
                        filter.tableName = tableReference.table;

                        if (filter.fieldKey) {
                            let fieldKey = filter.fieldKey;
                            const fieldReference = DatasetUtil.deconstructDottedReference(leaf.fields[fieldKey]);

                            filter.fieldName = fieldReference.field;
                        } else {
                            filter.fieldName = '';
                        }
                    } else {
                        delete leaf.options.simpleFilter;
                    }
                }
            },
            choice: (choice) => {
                choice.category = this.DASHBOARD_CATEGORY_DEFAULT;
            }
        });
        return dashboard;
    }

    /**
     * If a database is not found in updateDatabases(), delete dashboards associated with that database so that
     * the user cannot select them.
     * @param {String} invalidDatabaseName
     * @return {Promise}
     * @private
     */
    static deleteInvalidDashboards(dashboard: NeonDashboardConfig, invalidDatabaseName: string): any {
        ConfigUtil.visitDashboards(dashboard, {
            leaf: (leaf, path) => {
                let tableKeys = Object.keys(leaf.tables);
                const parent = path[path.length - 1];

                for (const tableKey of tableKeys) {
                    const databaseReference = DatasetUtil.deconstructDottedReference(leaf.tables[tableKey]);

                    if (databaseReference.database === invalidDatabaseName) {
                        delete parent.choices[leaf.name];
                        return;
                    }
                }
            }
        });

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
