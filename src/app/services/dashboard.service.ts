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
import { Injectable } from '@angular/core';
import { eventing } from 'neon-framework';

import {
    NeonConfig, NeonDashboardConfig, NeonDatastoreConfig,
    NeonDatabaseMetaData, NeonTableMetaData, NeonFieldMetaData
} from '../types';
import { neonEvents } from '../neon-namespaces';
import * as _ from 'lodash';
import { ConfigService } from './config.service';
import { ConnectionService, Connection } from './connection.service';
import { DashboardState } from '../dashboard-state';

@Injectable()
export class DashboardService {
    private static DASHBOARD_CATEGORY_DEFAULT: string = 'Select an option...';

    private readonly config = NeonConfig.get();

    public readonly state = new DashboardState();

    // Use the Dataset Service to save settings for specific databases/tables and
    // publish messages to all visualizations if those settings change.
    private messenger: eventing.Messenger;

    public get dashboards() {
        return this.config.dashboards;
    }

    public get layouts() {
        return this.config.layouts;
    }

    public get datastores() {
        return this.config.datastores;
    }

    // ---
    // STATIC METHODS
    // --

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
            if (!!configDatastore['hasUpdatedFields']) {
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
                DashboardService.validateFields(table);
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
                DashboardService.validateTables(database);
            }
        }
    }

    /**
     * Validate top level category of dashboards object in the config, then call
     * separate function to check the choices within recursively.
     */
    static validateDashboards(dashboard: NeonDashboardConfig): NeonDashboardConfig {
        let rootDashboard = dashboard;

        if ((!dashboard.choices || !Object.keys(dashboard.choices).length) && dashboard.name) {
            rootDashboard = NeonDashboardConfig.get();
            rootDashboard.choices[dashboard.name] = dashboard;
        }

        if (!rootDashboard.category) {
            rootDashboard.category = this.DASHBOARD_CATEGORY_DEFAULT;
        }

        let dashboardKeys = rootDashboard.choices ? Object.keys(rootDashboard.choices) : [];

        this.validateDashboardChoices(rootDashboard.choices, dashboardKeys);

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

            let nestedChoiceKeys = db.choices ? Object.keys(db.choices) : [];

            if (!nestedChoiceKeys.length) {
                // If no choices are present, then this might be the last level of nested choices,
                // which should instead have table keys and a layout specified. If not, delete choice.
                if (!db.layout || !db.tables) {
                    delete dashboardChoices[choiceKey];
                }
            }

            if (db) {
                if (!db.name) {
                    db.name = choiceKey;
                }

                // If simpleFilter present in config, make sure to translate keys to database, table, and
                // field names.
                if (db.options &&
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
                } else if (db.options && db.options.simpleFilter) {
                    // Delete simpleFilter from config if no tableKey present
                    delete db.options.simpleFilter;
                }

                // Only auto fill category if this is not the last level of nesting
                if (!db.category && !db.tables) {
                    db.category = this.DASHBOARD_CATEGORY_DEFAULT;
                }

                this.validateDashboardChoices(db.choices, nestedChoiceKeys,
                    fullPathFromTop, db.fullTitle);
            }
        });
    }

    constructor(private configService: ConfigService, private connectionService: ConnectionService) {
        this.messenger = new eventing.Messenger();
        this.configService.$source.subscribe((config: NeonConfig) => {
            this.setConfig(config);

            let loaded = 0;
            Object.values(this.config.datastores).forEach((datastore) => {
                DashboardService.validateDatabases(datastore);

                let callback = () => {
                    this.messenger.publish(neonEvents.DASHBOARD_READY, {});
                };

                let connection = this.connectionService.connect(datastore.type, datastore.host);
                if (connection) {
                    // Update the fields within each table to add any that weren't listed in the config file as well as field types.
                    this.mergeDatastoreRemoteState(datastore, connection).then(() => {
                        if (++loaded === Object.keys(this.config.datastores).length) {
                            callback();
                        }
                    });
                } else {
                    callback();
                }
            });
        });
    }

    setConfig(config: NeonConfig) {
        Object.assign(this.config, {
            dashboards: DashboardService.validateDashboards(
                config.dashboards ?
                    _.cloneDeep(config.dashboards) :
                    NeonDashboardConfig.get({ category: 'No Dashboards' })
            ),
            datastores: DashboardService.appendDatastoresFromConfig(config.datastores || {}, {}),
            layouts: _.cloneDeep(config.layouts || {})
        });
        this.state.config = this.config;
    }

    // ---
    // PRIVATE METHODS
    // ---

    /**
     * Updates the dataset that matches the active dataset.
     */
    // TODO: THOR-1062: may need to change to account for multiple datastores later
    private cloneDatastores(): void {
        for (const name of Object.keys(this.config.datastores)) {
            this.config.datastores[name] = _.cloneDeep(this.config.datastores[name]);
        }
    }

    /**
     * Adds the given dataset to the list of datasets maintained by this service and returns the new list.
     * @return {Array}
     */
    public addDatastore(datastore: NeonDatastoreConfig) {
        DashboardService.validateDatabases(datastore);
        this.config.datastores[datastore.name] = datastore;
    }

    public setActiveDashboard(dashboard: NeonDashboardConfig) {
        this.state.dashboard = dashboard;
    }

    /**
     * Sets the active dataset to the given dataset.
     * @param {Object} The dataset containing {String} name, {String} layout, {String} datastore, {String} hostname,
     * and {Array} databases.  Each database is an Object containing {String} name and {Array} tables.
     * Each table is an Object containing {String} name, {Array} fields, and {Object} mappings.  Each
     * field is an Object containing {String} columnName and {String} prettyName.  Each mapping key is a unique
     * identifier used by the visualizations and each value is a field name.
     */
    // TODO: THOR-1062: this will likely be more like "set active dashboard/config" to allow
    // to connect to multiple datasets
    public setActiveDatastore(datastore: NeonDatastoreConfig): void {
        datastore = NeonDatastoreConfig.get({
            name: 'Unknown Dataset',
            ...datastore
        });
        this.addDatastore(datastore);
        this.state.datastore = datastore;
    }

    /**
     * Updates the database at the given index (default 0) from the given dataset by adding undefined fields for each table.
     * @param {Object} datastore
     * @param {Connection} connection
     * @param {Function} callback (optional)
     * @param {Number} index (optional)
     */
    public mergeDatastoreRemoteState(datastore: NeonDatastoreConfig, connection: Connection): any {
        let promiseArray = datastore['hasUpdatedFields'] ? [] : Object.values(datastore.databases).map((database) =>
            this.getTableNamesAndFieldNames(connection, database));

        return Promise.all(promiseArray).then((__response) => {
            datastore['hasUpdatedFields'] = true;
            return datastore;
        });
    }

    /**
     * Wraps connection.getTableNamesAndFieldNames() in a promise object. If a database not found error occurs,
     * associated dashboards are deleted. Any other error will return a rejected promise.
     * @param {Connection} connection
     * @param {NeonDatabaseMetaData} database
     * @return {Promise}
     * @private
     */
    private getTableNamesAndFieldNames(connection: Connection, database: NeonDatabaseMetaData): Promise<any> {
        let promiseFields = [];
        return new Promise<any>((resolve, reject) => {
            connection.getTableNamesAndFieldNames(database.name, (tableNamesAndFieldNames) => {
                Object.keys(tableNamesAndFieldNames).forEach((tableName: string) => {
                    let table = database.tables[tableName];

                    if (table) {
                        let hasField = new Set(table.fields.map((field) => field.columnName));

                        tableNamesAndFieldNames[tableName].forEach((fieldName: string) => {
                            if (!hasField.has(fieldName)) {
                                let newField: NeonFieldMetaData = NeonFieldMetaData.get({ columnName: fieldName, prettyName: fieldName });
                                table.fields.push(newField);
                            }
                        });

                        promiseFields.push(this.updateFieldTypes(connection, database, table));
                    }
                });

                Promise.all(promiseFields).then(resolve, reject);
            }, async (error) => {
                if (error.status === 404) {
                    console.warn('Database ' + database.name + ' does not exist; deleting associated dashboards.');
                    let keys = this.dashboards && this.dashboards.choices ? Object.keys(this.dashboards.choices) : [];

                    Promise.all(this.deleteInvalidDashboards(this.dashboards.choices, keys, database.name)).then(resolve, reject);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Wraps connection.getFieldTypes() in a promise object.
     * @param {Connection} connection
     * @param {NeonDatabaseMetaData} database
     * @param {NeonTableMetaData} table
     * @return {Promise<NeonFieldMetaData[]>}
     * @private
     */
    private updateFieldTypes(connection: Connection, database: NeonDatabaseMetaData, table: NeonTableMetaData): Promise<NeonFieldMetaData[]> {
        return new Promise<NeonFieldMetaData[]>((resolve) => connection.getFieldTypes(database.name, table.name, (types) => {
            for (let field of table.fields) {
                if (types && types[field.columnName]) {
                    field.type = types[field.columnName];
                }
            }
            resolve(table.fields);
        }, (__error) => {
            resolve([]);
        }));
    }

    /**
     * If a database is not found in updateDatabases(), delete dashboards associated with that database so that
     * the user cannot select them.
     * @param {String[]} keys
     * @param {String} invalidDatabaseName
     * @return {Promise}
     * @private
     */
    private deleteInvalidDashboards(dashboardChoices: Record<string, NeonDashboardConfig>, keys: string[],
        invalidDatabaseName: string): any {
        if (!keys.length) {
            return Promise.resolve();
        }

        for (const choiceKey of keys) {
            if (dashboardChoices[choiceKey].tables) {
                let tableKeys = Object.keys(dashboardChoices[choiceKey].tables);

                for (const tableKey of tableKeys) {
                    const { database } = DashboardState.deconstructDottedReference(dashboardChoices[choiceKey].tables[tableKey]);

                    if (database === invalidDatabaseName) {
                        delete dashboardChoices[choiceKey];
                    }
                }
            } else {
                let nestedChoiceKeys = dashboardChoices[choiceKey].choices ? Object.keys(dashboardChoices[choiceKey].choices) : [];
                this.deleteInvalidDashboards(dashboardChoices[choiceKey].choices, nestedChoiceKeys, invalidDatabaseName);
            }
        }

        return null;
    }
}
