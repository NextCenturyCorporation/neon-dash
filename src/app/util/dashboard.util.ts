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

import { NeonDashboardConfig } from '../models/types';
import { DatasetUtil, FieldKey, NeonDatastoreConfig } from '../models/dataset';
import { ConfigUtil } from './config.util';

/**
 * Common Utility functions for dashboards, specifically
 *    - Validation
 */
export class DashboardUtil {
    static DASHBOARD_CATEGORY_DEFAULT: string = 'Select an option...';

    /**
     * Validate top level category of dashboards object in the config, then call
     * separate function to check the choices within recursively.
     */
    static validateDashboards(dashboard: NeonDashboardConfig): NeonDashboardConfig {
        ConfigUtil.visitDashboards(dashboard, {
            leaf: (leaf, path) => {
                let parent = path[path.length - 2];

                // If no choices are present, then this might be the last level of nested choices,
                // which should instead have table keys and a layout specified. If not, delete choice.
                if (!leaf['layout'] || !leaf['tables']) {
                    Object.keys(parent.choices).forEach((choiceId) => {
                        if (parent.choices[choiceId].name === leaf.name) {
                            delete parent.choices[choiceId];
                        }
                    });
                    return;
                }

                if (leaf.options.simpleFilter) {
                    const filter = leaf.options.simpleFilter;
                    if (filter.fieldKey) {
                        const fieldKeyObject: FieldKey = DatasetUtil.deconstructTableOrFieldKey(leaf.fields[filter.fieldKey]);
                        filter.databaseName = fieldKeyObject.database;
                        filter.tableName = fieldKeyObject.table;
                        filter.fieldName = '';
                        filter.fieldName = fieldKeyObject ? fieldKeyObject.field : '';
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
                const parent = path[path.length - 2];

                for (const tableKey of tableKeys) {
                    const databaseKeyObject: FieldKey = DatasetUtil.deconstructTableOrFieldKey(leaf.tables[tableKey]);

                    if (!databaseKeyObject || databaseKeyObject.database === invalidDatabaseName) {
                        Object.keys(parent.choices).forEach((choiceId) => {
                            if (parent.choices[choiceId].name === leaf.name) {
                                delete parent.choices[choiceId];
                            }
                        });
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
        Object.values(configDatastores).forEach((datastore) => {
            // Ignore the datastore if another datastore with the same name already exists (each name should be unique).
            if (!existingDatastores[datastore.name]) {
                existingDatastores[datastore.name] = datastore;
            }
        });
        return existingDatastores;
    }
}
