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
    Dashboard, DatabaseMetaData,
    TableMetaData, FieldMetaData
} from '../types';
import { neonEvents } from '../neon-namespaces';
import * as _ from 'lodash';
import { ConfigService } from './config.service';
import { NeonGTDConfig, NeonDashboardConfig, NeonDatastoreConfig } from '../neon-gtd-config';
import { ConnectionService, Connection } from './connection.service';
import { ActiveDashboard } from '../active-dashboard';

@Injectable()
export class DashboardService {
    private static DASHBOARD_CATEGORY_DEFAULT: string = 'Select an option...';

    protected datasets: Record<string, NeonDatastoreConfig> = {};

    public config: NeonGTDConfig<Dashboard>;

    public readonly activeDashboard = new ActiveDashboard();

    protected dashboards: Dashboard;

    protected layouts: { [key: string]: any };

    // The currently selected dashboard.
    protected layout: string = '';

    // Use the Dataset Service to save settings for specific databases/tables and
    // publish messages to all visualizations if those settings change.
    private messenger: any;


    // ---
    // STATIC METHODS
    // --

    static appendDatastoresFromConfig(configDatastores: Record<string, NeonDatastoreConfig>, existingDatastores: Record<string, NeonDatastoreConfig>): Record<string, NeonDatastoreConfig> {
        // Transform the datastores from config file structures to Datastore objects.
        Object.keys(configDatastores).forEach((datastoreKey) => {
            let configDatastore = configDatastores[datastoreKey] || { host: '', type: '', name: '', databases: {} };
            let outputDatastore: NeonDatastoreConfig = { name: datastoreKey, host: configDatastore.host, type: configDatastore.type, databases: {} };

            // Keep whether the datastore's fields are already updated (important for loading a saved state).
            outputDatastore['hasUpdatedFields'] = !!configDatastore['hasUpdatedFields'];

            let configDatabases: any = configDatastore.databases || {};
            outputDatastore.databases = Object.keys(configDatabases).reduce((dbs, databaseKey) => {
                let configDatabase: any = configDatabases[databaseKey] || {};
                let outputDatabase: DatabaseMetaData = new DatabaseMetaData(databaseKey, configDatabase.prettyName);

                let configTables: any = configDatabase.tables || {};
                outputDatabase.tables = Object.keys(configTables).reduce((acc, tableKey) => {
                    let configTable = configTables[tableKey] || {};
                    let outputTable: TableMetaData = new TableMetaData(tableKey, configTable.prettyName);

                    outputTable.fields = (configTable.fields || []).map((configField) =>
                        new FieldMetaData(configField.columnName, configField.prettyName, !!configField.hide, configField.type));

                    // Create copies to maintain original config data.
                    outputTable.labelOptions = _.cloneDeep(configTable.labelOptions);
                    outputTable.mappings = _.cloneDeep(configTable.mappings);

                    acc[outputTable.name] = outputTable;

                    return acc;
                }, {} as { [key: string]: TableMetaData });

                dbs[outputDatabase.name] = outputDatabase;
                return dbs;
            }, {} as { [key: string]: DatabaseMetaData });

            // Ignore the datastore if another datastore with the same name already exists (each name should be unique).
            if (!existingDatastores[outputDatastore.name]) {
                existingDatastores[outputDatastore.name] = outputDatastore;
            }
        });

        return existingDatastores;
    }

    static assignDashboardChoicesFromConfig(oldChoices: { [key: string]: Dashboard }, newChoices: { [key: string]: Dashboard }): void {
        Object.keys(newChoices).forEach((newChoiceId) => {
            let exists = Object.keys(oldChoices).some((oldChoiceId) => oldChoiceId === newChoiceId);

            if (exists) {
                oldChoices[newChoiceId].choices = oldChoices[newChoiceId].choices || {};
                DashboardService.assignDashboardChoicesFromConfig(oldChoices[newChoiceId].choices, newChoices[newChoiceId].choices || {});
            } else {
                oldChoices[newChoiceId] = newChoices[newChoiceId];
            }
        });
    }

    static removeFromArray(array, indexList): void {
        indexList.forEach((index) => {
            array.splice(index, 1);
        });
    }

    /**
     * Updates the datastores of each of the nested dashboards in the given dashboard with the given config file datastores.
     *
     * @arg {Dashboard} dashboard
     * @arg {Datastore[]} datastores
     */
    static updateDatastoresInDashboards(dashboard: Dashboard, datastores: Record<string, NeonDatastoreConfig>): void {
        if (dashboard.tables) {
            // Assume table keys have format:  datastore.database.table
            let datastoreNames: string[] = Object.keys(dashboard.tables).map((key) => dashboard.tables[key].split('.')[0]);
            dashboard.datastores = Object
                .values(datastores)
                .filter((datastore) =>
                    datastoreNames.some((name) => name === datastore.name))
                .reduce((acc, store) => {
                    acc[store.name] = store;
                    return acc;
                }, {} as Record<string, NeonDatastoreConfig>);
        }

        if (dashboard.choices) {
            Object.keys(dashboard.choices).forEach((key) =>
                DashboardService.updateDatastoresInDashboards(dashboard.choices[key], datastores));
        }
    }

    /**
     * Updates the layout of each of the nested dashboards in the given dashboard with the given config file layouts.
     *
     * @arg {Dashboard} dashboard
     * @arg {any} layouts
     */
    static updateLayoutInDashboards(dashboard: Dashboard, layouts: any): void {
        if (dashboard.layout) {
            dashboard.layoutObject = layouts[dashboard.layout] || [];
        }

        if (dashboard.choices) {
            Object.keys(dashboard.choices).forEach((key) => DashboardService.updateLayoutInDashboards(dashboard.choices[key], layouts));
        }
    }

    static validateFields(table: TableMetaData): void {
        let indexListToRemove = [];
        table.fields.forEach((field, index) => {
            if (!field.columnName) {
                indexListToRemove.push(index);
            } else {
                field.prettyName = field.prettyName || field.columnName;
            }
        });
        this.removeFromArray(table.fields, indexListToRemove);
    }

    static validateTables(database: DatabaseMetaData): void {
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
     *
     * @arg {Dashboard} dashboard
     * @return {Dashboard}
     */
    static validateDashboards<T extends NeonDashboardConfig<T>>(dashboard: T): Dashboard {
        let rootDashboard: T = dashboard;

        if ((!dashboard.choices || !Object.keys(dashboard.choices).length) && dashboard.name) {
            rootDashboard = Dashboard.get() as any as T;
            rootDashboard.choices[dashboard.name] = dashboard;
        }

        if (!rootDashboard.category) {
            rootDashboard.category = this.DASHBOARD_CATEGORY_DEFAULT;
        }

        let dashboardKeys = rootDashboard.choices ? Object.keys(rootDashboard.choices) : [];

        this.validateDashboardChoices(rootDashboard.choices, dashboardKeys);

        return rootDashboard as any as Dashboard;
    }

    /**
     * Validate the choices map within each level of dashboards object, and make appropriate
     * changes when expected values are missing. Also used to translate tableKey/fieldKey
     * values into databaseName, tableName, and fieldName.
     *
     * @param {[key: string]: Dashboard} dashboardChoices
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
            const db = dashboardChoices[choiceKey] as Dashboard;
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

                    const { database, table } = ActiveDashboard.deconstructFieldName(db.tables[tableKey]);

                    db.options.simpleFilter.databaseName = database;
                    db.options.simpleFilter.tableName = table;

                    if (db.options.simpleFilter.fieldKey) {
                        let fieldKey = db.options.simpleFilter.fieldKey;
                        const { field: fieldName } = ActiveDashboard.deconstructFieldName(db.fields[fieldKey]);

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
        this.datasets = {};
        this.messenger = new eventing.Messenger();
        this.configService.$source.subscribe((config: NeonGTDConfig<Dashboard>) => {
            this.config = config;
            this.activeDashboard.config = config;

            this.dashboards = DashboardService.validateDashboards(config.dashboards ? _.cloneDeep(config.dashboards) :
                { category: 'No Dashboards', choices: {}, options: {} } as NeonDashboardConfig);

            this.datasets = DashboardService.appendDatastoresFromConfig(config.datastores || {}, {});

            this.layouts = _.cloneDeep(config.layouts || {});

            DashboardService.updateDatastoresInDashboards(this.dashboards, this.datasets);
            DashboardService.updateLayoutInDashboards(this.dashboards, this.layouts);

            let loaded = 0;
            Object.values(this.datasets).forEach((dataset) => {
                DashboardService.validateDatabases(dataset);

                let callback = () => {
                    this.messenger.publish(neonEvents.DASHBOARD_READY, {});
                };

                let connection = this.connectionService.connect(dataset.type, dataset.host);
                if (connection) {
                    // Update the fields within each table to add any that weren't listed in the config file as well as field types.
                    this.updateDatabases(dataset, connection).then(() => {
                        if (++loaded === Object.keys(this.datasets).length) {
                            callback();
                        }
                    });
                } else {
                    callback();
                }
            });
        });
    }

    public appendDatasets(dashboard: Dashboard, datastores: { [key: string]: any }, layouts: { [key: string]: any }): Dashboard {
        let validatedDashboard: Dashboard = DashboardService.validateDashboards(dashboard);

        DashboardService.assignDashboardChoicesFromConfig(this.dashboards.choices || {}, validatedDashboard.choices || {});

        DashboardService.appendDatastoresFromConfig(datastores, this.datasets);

        Object.keys(layouts).forEach((layout) => {
            this.layouts[layout] = layouts[layout];
        });

        DashboardService.updateDatastoresInDashboards(this.dashboards, this.datasets);

        DashboardService.updateLayoutInDashboards(this.dashboards, this.layouts);

        return this.dashboards;
    }

    // ---
    // PRIVATE METHODS
    // ---

    /**
     * Updates the dataset that matches the active dataset.
     */
    // TODO: THOR-1062: may need to change to account for multiple datastores later
    private updateDataset(): void {
        for (const name of Object.keys(this.datasets)) {
            this.datasets[name] = _.cloneDeep(this.datasets[name]);
        }
    }

    /**
     * Returns the list of datasets maintained by this service
     */
    public getDatasets(): Record<string, NeonDatastoreConfig> {
        return this.datasets;
    }

    /**
     * Adds the given dataset to the list of datasets maintained by this service and returns the new list.
     * @return {Array}
     */
    public addDataset(dataset: NeonDatastoreConfig): Record<string, NeonDatastoreConfig> {
        DashboardService.validateDatabases(dataset);
        this.datasets[dataset.name] = dataset;
        return this.datasets;
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
    public setActiveDataset(dataset: NeonDatastoreConfig): void {
        this.activeDashboard.datastore = {
            name: 'Unknown Dataset',
            type: '',
            host: '',
            ...dataset
        };
    }

    /**
     * Returns all of the dashboards.
     * @return {Dashboard}
     */
    public getDashboards(): Dashboard {
        return this.dashboards;
    }

    /**
     * Returns all of the layouts.
     * @return {[key: string]: any}
     */
    public getLayouts(): { [key: string]: any } {
        return this.layouts;
    }

    /**
     * Sets the layout name for the active dataset.
     * @param {String} layoutName
     */
    public setLayout(layoutName: string): void {
        this.activeDashboard.dashboard.layout = layoutName; // TODO: Cleanup
        this.updateDataset();
    }

    /**
     * Updates the database at the given index (default 0) from the given dataset by adding undefined fields for each table.
     * @param {Object} dataset
     * @param {Connection} connection
     * @param {Function} callback (optional)
     * @param {Number} index (optional)
     */
    public updateDatabases(dataset: NeonDatastoreConfig, connection: Connection): any {
        let promiseArray = dataset['hasUpdatedFields'] ? [] : Object.values(dataset.databases).map((database) =>
            this.getTableNamesAndFieldNames(connection, database));

        return Promise.all(promiseArray).then((__response) => {
            dataset['hasUpdatedFields'] = true;
            return dataset;
        });
    }

    /**
     * Wraps connection.getTableNamesAndFieldNames() in a promise object. If a database not found error occurs,
     * associated dashboards are deleted. Any other error will return a rejected promise.
     * @param {Connection} connection
     * @param {DatabaseMetaData} database
     * @return {Promise}
     * @private
     */
    private getTableNamesAndFieldNames(connection: Connection, database: DatabaseMetaData): Promise<any> {
        let promiseFields = [];
        return new Promise<any>((resolve, __reject) => {
            connection.getTableNamesAndFieldNames(database.name, (tableNamesAndFieldNames) => {
                Object.keys(tableNamesAndFieldNames).forEach((tableName: string) => {
                    let table = _.find(database.tables, (item: TableMetaData) => item.name === tableName);

                    if (table) {
                        let hasField = {};
                        table.fields.forEach((field: FieldMetaData) => {
                            hasField[field.columnName] = true;
                        });
                        tableNamesAndFieldNames[tableName].forEach((fieldName: string) => {
                            if (!hasField[fieldName]) {
                                let newField: FieldMetaData = new FieldMetaData(fieldName, fieldName, false);
                                table.fields.push(newField);
                            }
                        });

                        promiseFields.push(this.getFieldTypes(connection, database, table));
                    }
                });

                Promise.all(promiseFields).then((response) => {
                    resolve(response);
                });
            }, (error) => {
                if (error.status === 404) {
                    console.warn('Database ' + database.name + ' does not exist; deleting associated dashboards.');
                    let keys = this.dashboards && this.dashboards.choices ? Object.keys(this.dashboards.choices) : [];

                    Promise.all(this.deleteInvalidDashboards(this.dashboards.choices, keys, database.name)).then((response) => {
                        resolve(response);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Wraps connection.getFieldTypes() in a promise object.
     * @param {Connection} connection
     * @param {DatabaseMetaData} database
     * @param {TableMetaData} table
     * @return {Promise<FieldMetaData[]>}
     * @private
     */
    private getFieldTypes(connection: Connection, database: DatabaseMetaData, table: TableMetaData): Promise<FieldMetaData[]> {
        return new Promise<FieldMetaData[]>((resolve) => connection.getFieldTypes(database.name, table.name, (types) => {
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
     * @param {[key: string]: Dashboard} dashboardChoices
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
                    const { database } = ActiveDashboard.deconstructFieldName(dashboardChoices[choiceKey].tables[tableKey]);

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

    /**
     * Returns whether the given field object is valid.
     * @param {Object} fieldObject
     * @return {Boolean}
     */
    public isFieldValid(fieldObject: FieldMetaData): boolean {
        return Boolean(fieldObject && fieldObject.columnName);
    }

    /**
     * Returns the datastores in the format of the config file.
     *
     * @return {{[key:string]:any}}
     */
    public getDatastoresInConfigFormat(): { [key: string]: any } {
        return Object.values(this.datasets).reduce((datastores, datastore) => {
            datastores[datastore.name] = {
                hasUpdatedFields: datastore['hasUpdatedFields'],
                host: datastore.host,
                type: datastore.type,
                databases: Object.values(datastore.databases).reduce((databases, database) => {
                    databases[database.name] = {
                        prettyName: database.prettyName,
                        tables: Object.values(database.tables).reduce((tables, table) => {
                            tables[table.name] = {
                                prettyName: table.prettyName,
                                fields: table.fields.map((field) => ({
                                    columnName: field.columnName,
                                    prettyName: field.prettyName,
                                    hide: field.hide,
                                    type: field.type
                                })),
                                labelOptions: table.labelOptions,
                                mappings: table.mappings
                            };
                            return tables;
                        }, {})
                    };
                    return databases;
                }, {})
            };
            return datastores;
        }, {});
    }
}
