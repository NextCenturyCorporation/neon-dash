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
import { Inject, Injectable } from '@angular/core';
import { eventing } from 'neon-framework';

import { AbstractSearchService, Connection } from './abstract.search.service';
import {
    Datastore, Dashboard, DashboardOptions, DatabaseMetaData,
    TableMetaData, TableMappings, FieldMetaData, SimpleFilter, SingleField
} from '../dataset';
import { Subscription, Observable } from 'rxjs';
import { neonEvents } from '../neon-namespaces';
import * as _ from 'lodash';
import { ConfigService } from './config.service';
import { NeonGTDConfig } from '../neon-gtd-config';

@Injectable()
export class DatasetService {

    private static DASHBOARD_CATEGORY_DEFAULT: string = 'Select an option...';

    protected datasets: Datastore[] = [];

    private config: NeonGTDConfig;

    // The active dataset.
    // TODO: THOR-1062: This will probably need to be an array/map of active datastores
    // since a dashboard can reference multiple datastores.
    protected dataset: Datastore = new Datastore();

    protected dashboards: Dashboard;

    protected layouts: { [key: string]: any };

    // The currently selected dashboard.
    protected currentDashboard: Dashboard;
    protected layout: string = '';

    // Use the Dataset Service to save settings for specific databases/tables and
    // publish messages to all visualizations if those settings change.
    private messenger: any;

    // The active update interval if required by the current active dataset.
    private updateInterval: Observable<number>;

    // The subscription that fires on the update interval.
    private updateSubscription: Subscription;

    // ---
    // STATIC METHODS
    // --

    static appendDatastoresFromConfig(configDatastores: { [key: string]: any }, existingDatastores: Datastore[]): Datastore[] {
        // Transform the datastores from config file structures to Datastore objects.
        Object.keys(configDatastores).forEach((datastoreKey) => {
            let configDatastore: any = configDatastores[datastoreKey] || {};
            let outputDatastore: Datastore = new Datastore(datastoreKey, configDatastore.host, configDatastore.type);

            // Keep whether the datastore's fields are already updated (important for loading a saved state).
            outputDatastore.hasUpdatedFields = !!configDatastore.hasUpdatedFields;

            let configDatabases: any = configDatastore.databases || {};
            outputDatastore.databases = Object.keys(configDatabases).map((databaseKey) => {
                let configDatabase: any = configDatabases[databaseKey] || {};
                let outputDatabase: DatabaseMetaData = new DatabaseMetaData(databaseKey, configDatabase.prettyName);

                let configTables: any = configDatabase.tables || {};
                outputDatabase.tables = Object.keys(configTables).map((tableKey) => {
                    let configTable = configTables[tableKey] || {};
                    let outputTable: TableMetaData = new TableMetaData(tableKey, configTable.prettyName);

                    outputTable.fields = (configTable.fields || []).map((configField) =>
                        new FieldMetaData(configField.columnName, configField.prettyName, !!configField.hide, configField.type));

                    // Create copies to maintain original config data.
                    outputTable.labelOptions = _.cloneDeep(configTable.labelOptions);
                    outputTable.mappings = _.cloneDeep(configTable.mappings);

                    return outputTable;
                });

                return outputDatabase;
            });

            // Ignore the datastore if another datastore with the same name already exists (each name should be unique).
            if (!existingDatastores.some((existingDatastore) => existingDatastore.name === outputDatastore.name)) {
                existingDatastores.push(outputDatastore);
            }
        });

        return existingDatastores;
    }

    static assignDashboardChoicesFromConfig(oldChoices: { [key: string]: Dashboard }, newChoices: { [key: string]: Dashboard }): void {
        Object.keys(newChoices).forEach((newChoiceId) => {
            let exists = Object.keys(oldChoices).some((oldChoiceId) => oldChoiceId === newChoiceId);

            if (exists) {
                oldChoices[newChoiceId].choices = oldChoices[newChoiceId].choices || {};
                DatasetService.assignDashboardChoicesFromConfig(oldChoices[newChoiceId].choices, newChoices[newChoiceId].choices || {});
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
    static updateDatastoresInDashboards(dashboard: Dashboard, datastores: Datastore[]): void {
        if (dashboard.tables) {
            // Assume table keys have format:  datastore.database.table
            let datastoreNames: string[] = Object.keys(dashboard.tables).map((key) => dashboard.tables[key].split('.')[0]);
            dashboard.datastores = datastores.filter((datastore) => datastoreNames.some((name) => name === datastore.name));
        }

        if (dashboard.choices) {
            Object.keys(dashboard.choices).forEach((key) =>
                DatasetService.updateDatastoresInDashboards(dashboard.choices[key], datastores));
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
            Object.keys(dashboard.choices).forEach((key) => DatasetService.updateLayoutInDashboards(dashboard.choices[key], layouts));
        }
    }

    static validateFields(table): void {
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

    static validateTables(database): void {
        let indexListToRemove = [];
        database.tables.forEach((table, index) => {
            if (!table.name) {
                indexListToRemove.push(index);
            } else {
                table.prettyName = table.prettyName || table.name;
                table.fields = table.fields || [];
                table.mappings = table.mappings || {};
                table.labelOptions = table.labelOptions || {};
                DatasetService.validateFields(table);
            }
        });
        this.removeFromArray(database.tables, indexListToRemove);
    }

    static validateDatabases(dataset): void {
        let indexListToRemove = [];
        dataset.databases.forEach((database, index) => {
            if (!(database.name || database.tables || database.tables.length)) {
                indexListToRemove.push(index);
            } else {
                database.prettyName = database.prettyName || database.name;
                DatasetService.validateTables(database);
            }
        });
        this.removeFromArray(dataset.databases, indexListToRemove);
    }

    /**
     * Validate top level category of dashboards object in the config, then call
     * separate function to check the choices within recursively.
     *
     * @arg {Dashboard} dashboard
     * @return {Dashboard}
     */
    static validateDashboards(dashboard: Dashboard): Dashboard {
        let rootDashboard: Dashboard = dashboard;

        if ((!dashboard.choices || !Object.keys(dashboard.choices).length) && dashboard.name) {
            rootDashboard = new Dashboard();
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
     * @param {[key: string]: Dashboard} dashboardChoices
     * @param {string[]} keys for dashboardChoices map
     * @param {string} pathFromTop path to append to current dashboard object
     * @param {string} title title to append to current dashboard object
     */
    static validateDashboardChoices(dashboardChoices: { [key: string]: Dashboard }, keys: string[],
        pathFromTop?: string[], title?: string): void {
        if (!keys.length) {
            return;
        }

        keys.forEach((choiceKey) => {
            let fullTitle = (title ? (title + ' ') : '') + dashboardChoices[choiceKey].name;
            let fullPathFromTop = pathFromTop ? pathFromTop.concat(choiceKey) : [choiceKey];

            dashboardChoices[choiceKey].fullTitle = dashboardChoices[choiceKey].fullTitle || fullTitle;
            dashboardChoices[choiceKey].pathFromTop = fullPathFromTop;

            let nestedChoiceKeys = dashboardChoices[choiceKey].choices ? Object.keys(dashboardChoices[choiceKey].choices) : [];

            if (!nestedChoiceKeys.length) {
                // If no choices are present, then this might be the last level of nested choices,
                // which should instead have table keys and a layout specified. If not, delete choice.
                if (!dashboardChoices[choiceKey].layout || !dashboardChoices[choiceKey].tables) {
                    delete dashboardChoices[choiceKey];
                }
            }

            if (dashboardChoices[choiceKey]) {
                if (!dashboardChoices[choiceKey].name) {
                    dashboardChoices[choiceKey].name = choiceKey;
                }

                // If simpleFilter present in config, make sure to translate keys to database, table, and
                // field names.
                if (dashboardChoices[choiceKey].options
                    && dashboardChoices[choiceKey].options.simpleFilter
                    && dashboardChoices[choiceKey].options.simpleFilter.tableKey) {

                    let tableKey = dashboardChoices[choiceKey].options.simpleFilter.tableKey;

                    let databaseName = this.getDatabaseNameByKey(dashboardChoices[choiceKey], tableKey);
                    let tableName = this.getTableNameByKey(dashboardChoices[choiceKey], tableKey);

                    dashboardChoices[choiceKey].options.simpleFilter.databaseName = databaseName;
                    dashboardChoices[choiceKey].options.simpleFilter.tableName = tableName;

                    if (dashboardChoices[choiceKey].options.simpleFilter.fieldKey) {
                        let fieldKey = dashboardChoices[choiceKey].options.simpleFilter.fieldKey;
                        let fieldName = this.getFieldNameByKey(dashboardChoices[choiceKey], fieldKey);

                        dashboardChoices[choiceKey].options.simpleFilter.fieldName = fieldName;
                    } else {
                        dashboardChoices[choiceKey].options.simpleFilter.fieldName = '';
                    }
                } else if (dashboardChoices[choiceKey].options && dashboardChoices[choiceKey].options.simpleFilter) {
                    // delete simpleFilter from config if no tableKey present
                    delete dashboardChoices[choiceKey].options.simpleFilter;
                }

                // Only auto fill category if this is not the last level of nesting
                if (!dashboardChoices[choiceKey].category && !dashboardChoices[choiceKey].tables) {
                    dashboardChoices[choiceKey].category = this.DASHBOARD_CATEGORY_DEFAULT;
                }

                this.validateDashboardChoices(dashboardChoices[choiceKey].choices, nestedChoiceKeys,
                    fullPathFromTop, dashboardChoices[choiceKey].fullTitle);
            }
        });
    }

    /**
     * Returns database name from complete field name (datastore.database.table.field).
     * @param {String} name
     * @return {String}
     */
    static getDatabaseNameFromCompleteFieldName(name: string) {
        return name.split('.')[1];
    }

    /**
     * Returns table name from complete field name (datastore.database.table.field).
     * @param {String} name
     * @return {String}
     */
    static getTableNameFromCompleteFieldName(name: string) {
        return name.split('.')[2];
    }

    /**
     * Returns field name from complete field name (datastore.database.table.field).
     * @param {String} name
     * @return {String}
     */
    static getFieldNameFromCompleteFieldName(name: string) {
        return name.split('.').slice(3).join('.');
    }

    /**
     * Returns database name from matching table key within the dashboard passed in.
     * @param {Dashboard} dashboard
     * @param {String} key
     * @return {String}
     */
    static getDatabaseNameByKey(dashboard: Dashboard, key: string) {
        return this.getDatabaseNameFromCompleteFieldName(dashboard.tables[key]);
    }

    /**
     * Returns table name from matching table key within the dashboard passed in.
     * @param {Dashboard} dashboard
     * @param {String} key
     * @return {String}
     */
    static getTableNameByKey(dashboard: Dashboard, key: string) {
        return this.getTableNameFromCompleteFieldName(dashboard.tables[key]);
    }

    /**
     * Returns field name from matching field key within the dashboard passed in.
     * @param {Dashboard} dashboard
     * @param {String} key
     * @return {String}
     */
    static getFieldNameByKey(dashboard: Dashboard, key: string) {
        return this.getFieldNameFromCompleteFieldName(dashboard.fields[key]);
    }

    constructor(private configService: ConfigService, private searchService: AbstractSearchService) {
        this.datasets = [];
        this.messenger = new eventing.Messenger();
        this.configService.$source.subscribe((config) => {
            this.config = config;

            this.dashboards = DatasetService.validateDashboards(config.dashboards ? _.cloneDeep(config.dashboards) :
                { category: 'No Dashboards', choices: {} });

            this.datasets = DatasetService.appendDatastoresFromConfig(config.datastores || {}, []);

            this.layouts = _.cloneDeep(config.layouts || {});

            DatasetService.updateDatastoresInDashboards(this.dashboards, this.datasets);
            DatasetService.updateLayoutInDashboards(this.dashboards, this.layouts);

            let loaded = 0;
            this.datasets.forEach((dataset) => {
                DatasetService.validateDatabases(dataset);

                let callback = () => {
                    this.messenger.publish(neonEvents.DASHBOARD_READY, {});
                };

                let connection: Connection = this.searchService.createConnection(dataset.type, dataset.host);
                if (connection) {
                    // Update the fields within each table to add any that weren't listed in the config file as well as field types.
                    this.updateDatabases(dataset, connection).then(() => {
                        if (++loaded === this.datasets.length) {
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
        let validatedDashboard: Dashboard = DatasetService.validateDashboards(dashboard);

        DatasetService.assignDashboardChoicesFromConfig(this.dashboards.choices || {}, validatedDashboard.choices || {});

        DatasetService.appendDatastoresFromConfig(datastores, this.datasets);

        Object.keys(layouts).forEach((layout) => this.layouts[layout] = layouts[layout]);

        DatasetService.updateDatastoresInDashboards(this.dashboards, this.datasets);

        DatasetService.updateLayoutInDashboards(this.dashboards, this.layouts);

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
        for (let i = 0; i < this.datasets.length; ++i) {
            if (this.datasets[i].name === this.dataset.name) {
                this.datasets[i] = _.cloneDeep(this.dataset);
            }
        }
    }

    /**
     * Returns the list of datasets maintained by this service
     * @return {Array}
     */
    public getDatasets(): Datastore[] {
        return this.datasets;
    }

    /**
     * Adds the given dataset to the list of datasets maintained by this service and returns the new list.
     * @return {Array}
     */
    public addDataset(dataset): Datastore[] {
        DatasetService.validateDatabases(dataset);
        this.datasets.push(dataset);
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
    public setActiveDataset(dataset): void {
        this.dataset.name = dataset.name || 'Unknown Dataset';
        this.dataset.type = dataset.type || '';
        this.dataset.host = dataset.host || '';
        this.dataset.databases = dataset.databases || [];
    }

    /**
     * Returns the current dashboard config title.
     * @return {string}
     */
    public getCurrentDashboardTitle(): string {
        if (this.currentDashboard) {
            return this.currentDashboard.fullTitle;
        }
    }

    /**
     * Sets the current dashboard config.
     * @param {Dashboard} config
     */
    public setCurrentDashboard(config: Dashboard) {
        this.currentDashboard = config;

        // Shutdown any previous update intervals.
        if (this.updateInterval) {
            this.updateSubscription.unsubscribe();
            delete this.updateSubscription;
            delete this.updateInterval;
        }
    }

    /**
     * Returns the current dashboard config.
     * @return {Dashboard}
     */
    public getCurrentDashboard(): Dashboard {
        return this.currentDashboard;
    }

    /**
     * Returns all of the dashboards.
     * @return {Dashboard}
     */
    public getDashboards(): Dashboard {
        return this.dashboards;
    }

    /**
     *
     * @param simpleField The new field for the simple search
     */
    public setCurrentDashboardSimpleFilterFieldName(simpleField: FieldMetaData) {
        this.createSimpleFilter();
        this.currentDashboard.options.simpleFilter.fieldName = simpleField.columnName;
    }

    /**
     * Creates a simpleFilter if it doesn't exist
     */
    public createSimpleFilter() {
        if (!this.currentDashboard.options.simpleFilter) {

            let tableKey = Object.keys(this.currentDashboard.tables)[0];

            this.currentDashboard.options.simpleFilter = new SimpleFilter(
                this.getDatabaseNameFromCurrentDashboardByKey(tableKey),
                this.getTableNameFromCurrentDashboardByKey(tableKey),
                ''
            );
        }
    }

    /**
     * returns the simple search field
     * @return {string}
     */
    public getCurrentDashboardSimpleFilterFieldName(): string {
        this.createSimpleFilter();
        return this.currentDashboard.options.simpleFilter.fieldName;
    }

    /**
     * returns the active table fields
     * @return {Object}
     */
    public getActiveFields() {
        return this.dataset.databases[0].tables[0].fields;
    }

    /**
     * Returns the active dataset object
     * @return {Object}
     */
    public getDataset(): Datastore {
        return this.getDatasetWithName(this.dataset.name) || this.dataset;
    }

    /**
     * Returns whether a dataset is active.
     * @return {Boolean}
     */
    public hasDataset(): boolean {
        return (this.dataset.type && this.dataset.host && (this.dataset.databases.length > 0));
    }

    /**
     * Returns the name of the active dataset.
     * @return {String}
     */
    public getName(): string {
        return this.dataset.name;
    }

    /**
     * Returns the layout name for the currently selected dashboard.
     * @return {String}
     */
    public getLayout(): string {
        return this.currentDashboard.layout;
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
        this.currentDashboard.layout = layoutName;
        this.updateDataset();
    }

    /**
     * Returns the datastore type for the active datastore (elasticsearchrest, mongo, etc)
     * @return {String}
     */
    public getDatastoreType(): string {
        return this.dataset.type;
    }

    /**
     * Returns the hostname for the active datastore.
     * @return {String}
     */
    public getDatastoreHost(): string {
        return this.dataset.host;
    }

    /**
     * Returns the databases for the active dataset.
     * @return {Array}
     */
    public getDatabases(): DatabaseMetaData[] {
        return this.dataset.databases;
    }

    /**
     * Returns the dataset with the given name or undefined if no such dataset exists.
     * @param {String} The dataset name
     * @return {Object} The dataset object if a match exists or undefined otherwise.
     */
    public getDatasetWithName(datasetName: string): Datastore {
        for (let dataset of this.datasets) {
            if (dataset.name === datasetName) {
                return dataset;
            }
        }

        return undefined;
    }

    /**
     * Returns the database with the given name or an Object with an empty name if no such database exists in the dataset.
     * @param {String} The database name
     * @return {Object} The database containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     */
    public getDatabaseWithName(databaseName: string): DatabaseMetaData {
        for (let database of this.dataset.databases) {
            if (database.name === databaseName) {
                return database;
            }
        }

        return undefined;
    }

    /**
     * Returns the database with the given Dashboard name or an Object with an empty name if no such database exists in the dataset.
     * @param {String} The dashboard name
     * @return {Object} The database containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     * Dashboard name only includes part of the database pretty name
     */
    public getCurrentDatabase(): DatabaseMetaData {
        if (!this.getCurrentDashboard()) {
            return undefined;
        }
        let tableKeys = this.getCurrentDashboard().tables;

        let keyArray = Object.keys(tableKeys);

        if (keyArray.length) {
            let databaseName = this.getDatabaseNameFromCurrentDashboardByKey(keyArray[0]);
            return this.getDatabaseWithName(databaseName);
        }
        return undefined;
    }

    /**
     * Returns the tables for the database with the given name in the active dataset.
     * @param {String} The database name
     * @return {Array} An array of table Objects containing {String} name, {Array} fields, and {Array} mappings.
     */
    public getTables(databaseName: string): TableMetaData[] {
        let database = this.getDatabaseWithName(databaseName);
        return database ? database.tables : [];
    }

    /**
     * Returns the table with the given name or an Object with an empty name if no such table exists in the database with the given name.
     * @param {String} The database name
     * @param {String} The table name
     * @return {Object} The table containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     */
    public getTableWithName(databaseName: string, tableName: string): TableMetaData {
        let tables = this.getTables(databaseName);
        for (let table of tables) {
            if (table.name === tableName) {
                return table;
            }
        }

        return undefined;
    }

    /**
     * Returns the field with the given name or an Object with an empty name if no such field exists in the database and table with the
     * given names.
     *
     * @arg {string} databaseName The database name
     * @arg {string} tableName The table name
     * @arg {string} fieldName The field name
     * @return {FieldMetaData} The field containing {String} columnName and {String} prettyName if a match exists or undefined otherwise.
     */
    public getFieldWithName(databaseName: string, tableName: string, fieldName: string): FieldMetaData {
        let fields: FieldMetaData[] = this.getFields(databaseName, tableName);
        for (let field of fields) {
            if (field.columnName === fieldName) {
                return field;
            }
        }

        return undefined;
    }

    /**
     * Returns a map of database names to an array of table names within that database.
     * @return {Object}
     */
    public getDatabaseAndTableNames(): Object {
        let databases = this.getDatabases();
        let names = {};
        for (let database of databases) {
            names[database.name] = [];
            let tables = this.getTables(database.name);
            for (let table of tables) {
                names[database.name].push(table.name);
            }
        }
        return names;
    }

    /**
     * Returns the the first table in the database with the given name containing all the given mappings.
     * @param {String} The database name
     * @param {Array} The array of mapping keys that the table must contain.
     * @return {String} The name of the table containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     */
    public getFirstTableWithMappings(databaseName: string, keys: string[]): TableMetaData {
        let tables = this.getTables(databaseName);
        for (let table of tables) {
            let success = true;
            for (let key of keys) {
                if (!(table.mappings[key])) {
                    success = false;
                    break;
                }
            }
            if (success) {
                return table;
            }
        }

        return undefined;
    }

    /**
     * Returns an object containing the first database, table, and fields found in the active dataset with all the given mappings.
     * @param {Array} The array of mapping keys that the database and table must contain.
     * @return {Object} An object containing {String} database, {String} table,
     * and {Object} fields linking {String} mapping to {String} field.
     * If no match was found, an empty object is returned instead.
     */
    public getFirstDatabaseAndTableWithMappings(keys: string[]): any {
        for (let database of this.dataset.databases) {
            for (let table of database.tables) {
                let success = true;
                let fields = {};
                if (keys && keys.length > 0) {
                    for (let key of keys) {
                        if (table.mappings[key]) {
                            fields[key] = table.mappings[key];
                        } else {
                            success = false;
                        }
                    }
                }

                if (success) {
                    return {
                        database: database.name,
                        table: table.name,
                        fields: fields
                    };
                }
            }
        }

        return {};
    }

    /**
     * Returns the field objects for the database and table with the given names.
     * @param {String} The database name
     * @param {String} The table name
     * @return {Array} The array of field objects if a match exists or an empty array otherwise.
     */
    public getFields(databaseName: string, tableName: string): FieldMetaData[] {
        let table = this.getTableWithName(databaseName, tableName);

        if (!table) {
            return [];
        }

        return table.fields;
    }

    /**
     * Returns a sorted copy of the array of field objects for the database and table with the given names,
     * ignoring hidden fields if specified.
     * @param {String} The database name
     * @param {String} The table name
     * @param {Boolean} Whether to ignore fields in the table marked as hidden (optional)
     * @return {Array} The sorted copy of the array of field objects if a match exists or an empty array otherwise.
     */
    public getSortedFields(databaseName: string, tableName: string, ignoreHiddenFields?: boolean): FieldMetaData[] {
        let table = this.getTableWithName(databaseName, tableName);

        if (!table) {
            return [];
        }

        let fields = _.cloneDeep(table.fields).filter((field) => {
            return ignoreHiddenFields ? !field.hide : true;
        });

        fields.sort((x, y) => {
            if (!x.prettyName || !y.prettyName) {
                return 0;
            }
            // Compare field pretty names and ignore case.
            return (x.prettyName.toUpperCase() < y.prettyName.toUpperCase()) ?
                -1 : ((x.prettyName.toUpperCase() > y.prettyName.toUpperCase()) ? 1 : 0);
        });

        return fields;
    }

    /**
     * Returns the mappings for the table with the given name.
     * @param {String} The database name
     * @param {String} The table name
     * @return {Object} The mappings if a match exists or an empty object otherwise.
     */
    public getMappings(databaseName: string, tableName: string): TableMappings {
        let table = this.getTableWithName(databaseName, tableName);

        if (!table) {
            return {};
        }

        return table.mappings;
    }

    /**
     * Returns the mapping for the table with the given name and the given key.
     * @param {String} The database name
     * @param {String} The table name
     * @param {String} The mapping key
     * @return {String} The field name for the mapping at the given key if a match exists or an empty string
     * otherwise.
     */
    public getMapping(databaseName: string, tableName: string, key: string): string {
        let table = this.getTableWithName(databaseName, tableName);

        if (!table) {
            return '';
        }

        return table.mappings[key];
    }

    /**
     * Sets the mapping for the table with the given name at the given key to the given field name.
     * @param {String} The database name
     * @param {String} The table name
     * @param {String} The mapping key
     * @param {String} The field name for the given mapping key
     */
    public setMapping(databaseName: string, tableName: string, key: string, fieldName: string): void {
        let table = this.getTableWithName(databaseName, tableName);

        if (!table) {
            return;
        }

        table.mappings[key] = fieldName;
    }

    /**
     * Updates the database at the given index (default 0) from the given dataset by adding undefined fields for each table.
     * @param {Object} dataset
     * @param {Connection} connection
     * @param {Function} callback (optional)
     * @param {Number} index (optional)
     */
    public updateDatabases(dataset: Datastore, connection: Connection): any {
        let promiseArray = dataset.hasUpdatedFields ? [] : dataset.databases.map((database) =>
            this.getTableNamesAndFieldNames(connection, database));

        return Promise.all(promiseArray).then((response) => {
            dataset.hasUpdatedFields = true;
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
        return new Promise<any>((resolve, reject) => {
            connection.getTableNamesAndFieldNames(database.name, (tableNamesAndFieldNames) => {
                Object.keys(tableNamesAndFieldNames).forEach((tableName: string) => {
                    let table = _.find(database.tables, (item: TableMetaData) => {
                        return item.name === tableName;
                    });

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
            for (let f of table.fields) {
                if (types && types[f.columnName]) {
                    f.type = types[f.columnName];
                }
            }
            resolve(table.fields);
        }, (error) => {
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
    private deleteInvalidDashboards(dashboardChoices: { [key: string]: Dashboard }, keys: string[],
        invalidDatabaseName: string): any {
        if (!keys.length) {
            return Promise.resolve();
        }

        for (const choiceKey of keys) {
            if (dashboardChoices[choiceKey].tables) {
                let tableKeys = Object.keys(dashboardChoices[choiceKey].tables);

                for (const tableKey of tableKeys) {
                    let databaseName = DatasetService.getDatabaseNameByKey(dashboardChoices[choiceKey], tableKey);

                    if (databaseName === invalidDatabaseName) {
                        delete dashboardChoices[choiceKey];
                    }
                }
            } else {
                let nestedChoiceKeys = dashboardChoices[choiceKey].choices ? Object.keys(dashboardChoices[choiceKey].choices) : [];
                this.deleteInvalidDashboards(dashboardChoices[choiceKey].choices, nestedChoiceKeys, invalidDatabaseName);
            }
        }
    }

    /**
     * Returns the options for the current dashboard.
     * @method getCurrentDashboardOptions
     * @return {Object}
     *
     */
    public getCurrentDashboardOptions(): DashboardOptions {
        if (this.currentDashboard) {
            return this.currentDashboard.options;
        }
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
     * Returns the pretty name for the given database name.
     * @param {String} databaseName
     * @return {String}
     */
    public getPrettyNameForDatabase(databaseName: string): string {
        let name = databaseName;
        this.dataset.databases.forEach((database) => {
            if (database.name === databaseName) {
                name = database.prettyName;
            }
        });
        return name;
    }

    /**
     * Returns the pretty name for the given table name in the given database.
     * @param {String} databaseName
     * @param {String} tableName
     * @return {String}
     */
    public getPrettyNameForTable(databaseName: string, tableName: string): string {
        let name = tableName;
        this.getTables(databaseName).forEach((table) => {
            if (table.name === tableName) {
                name = table.prettyName;
            }
        });
        return name;
    }

    /**
     * Returns the list of relation data for the current dataset:  elements of the outer array are individual relations and elements of
     * the inner array are specific fields within the relations.
     *
     * @return {SingleField[][][]}
     */
    public findRelationDataList(): SingleField[][][] {
        // Either expect string list structure:  [[a1, a2, a3], [b1, b2]]
        // ....Or expect nested list structure:  [[[x1, y1], [x2, y2], [x3, y3]], [[z1], [z2]]]
        let configRelationDataList: (string | string[])[][] = this.getCurrentDashboard().relations || [];

        // Each element in the 1st (outermost) list is a separate relation.
        // Each element in the 2nd list is a relation field.
        // Each element in the 3rd (innermost) list is an ordered set of relation fields.  A filter must have each relation field within
        // the ordered set for the relation to be applied.
        //
        // EX: [ // relation list
        //       [ // single relation
        //         [ // relation fields
        //           'datastore1.database1.table1.fieldA',
        //           'datastore1.database1.table1.fieldB'
        //         ],
        //         [ // relation fields
        //           'datastore2.database2.table2.fieldX',
        //           'datastore2.database2.table2.fieldY'
        //         ]
        //       ]
        //     ]
        // Whenever a filter contains both fieldA and fieldB, create a relation filter by replacing fieldA with fieldX and fieldB with
        // fieldY.  Do the reverse whenever a filter contains both fieldX and fieldY.  Do not create a relation filter if a filter contains
        // just fieldA, or just fieldB, or just fieldX, or just fieldY, or more than fieldA and fieldB, or more than fieldX and fieldY.
        return configRelationDataList.map((configRelationData) => {
            return configRelationData.map((configRelationFilterFields) => {
                // A relation is an array of arrays.  The elements in the outer array are the fields-to-substitute and the elements in the
                // inner arrays are the filtered fields.  The inner arrays must be the same length (the same number of filtered fields).
                let relationFilterFields: string[] = Array.isArray(configRelationFilterFields) ? configRelationFilterFields :
                    [configRelationFilterFields];

                return relationFilterFields.map((item) => {
                    let databaseName = DatasetService.getDatabaseNameFromCompleteFieldName(item);
                    let tableName = DatasetService.getTableNameFromCompleteFieldName(item);
                    let fieldName = DatasetService.getFieldNameFromCompleteFieldName(item);
                    return {
                        // TODO THOR-1062 THOR-1078 Set the datastore name too!
                        datastore: '',
                        database: this.getDatabaseWithName(databaseName),
                        table: this.getTableWithName(databaseName, tableName),
                        field: this.getFieldWithName(databaseName, tableName, fieldName)
                    } as SingleField;
                }).filter((item) => item.database && item.table && item.field);
            });
        }).filter((relationData) => {
            if (relationData.length > 1) {
                // Ensure each inner array element has the same non-zero length because they must have the same number of filtered fields.
                let size = relationData[0].length;
                return size && relationData.every((relationFilterFields) => relationFilterFields.length === size);
            }
            return false;
        });
    }

    // used to link layouts with dashboards
    /**
     * Returns entire value of matching table key from current dashboard.
     * @param {String} key
     * @return {String}
     */
    public getTableFromCurrentDashboardByKey(key: string): string {
        let currentConfig = this.getCurrentDashboard();
        if (currentConfig) {
            return currentConfig.tables[key];
        }
    }

    /**
     * Returns entire value of matching field key from current dashboard.
     * @param {String} key
     * @return {String}
     */
    public getFieldFromCurrentDashboardByKey(key: string): string {
        let currentConfig = this.getCurrentDashboard();
        if (currentConfig) {
            return currentConfig.fields[key];
        }
    }

    // TODO: THOR-1062: entire key may be more important later when
    // connecting to multiple databases -- for now we can just
    // use a partial key
    /**
     * Returns database name from matching table key from current dashboard.
     * @param {String} key
     * @return {String}
     */
    public getDatabaseNameFromCurrentDashboardByKey(key: string): string {
        let currentConfig = this.getCurrentDashboard();
        if (currentConfig) {
            return DatasetService.getDatabaseNameByKey(currentConfig, key);
        }
    }

    /**
     * Returns table name from matching table key from current dashboard.
     * @param {String} key
     * @return {String}
     */
    public getTableNameFromCurrentDashboardByKey(key: string): string {
        let currentConfig = this.getCurrentDashboard();
        if (currentConfig) {
            return DatasetService.getTableNameByKey(currentConfig, key);
        }
    }

    /**
     * Returns field name from matching field key from current dashboard.
     * @param {String} key
     * @return {String}
     */
    public getFieldNameFromCurrentDashboardByKey(key: string): string {
        let currentConfig = this.getCurrentDashboard();
        if (currentConfig) {
            return DatasetService.getFieldNameByKey(currentConfig, key);
        }
    }

    /**
     * If field key is referenced in config file, find field value using current dashboard.
     *
     * @arg {string} fieldKey
     * @return {string}
     */
    public translateFieldKeyToValue(fieldKey: string): string {
        let currentDashboard = this.getCurrentDashboard();

        // If the field key does exist in the dashboard...
        if (fieldKey && currentDashboard && currentDashboard.fields && currentDashboard.fields[fieldKey]) {
            return this.getFieldNameFromCurrentDashboardByKey(fieldKey);
        }

        // If the field key is just a field name or does not exist in the dashboard...
        return fieldKey;
    }

    /**
     * Returns the datastores in the format of the config file.
     *
     * @return {{[key:string]:any}}
     */
    public getDatastoresInConfigFormat(): { [key: string]: any } {
        return this.datasets.reduce((datastores, datastore) => {
            datastores[datastore.name] = {
                hasUpdatedFields: datastore.hasUpdatedFields,
                host: datastore.host,
                type: datastore.type,
                databases: datastore.databases.reduce((databases, database) => {
                    databases[database.name] = {
                        prettyName: database.prettyName,
                        tables: database.tables.reduce((tables, table) => {
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
