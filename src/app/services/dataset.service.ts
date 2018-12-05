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
import * as neon from 'neon-framework';

import { DatabaseMetaData, TableMetaData, TableMappings, FieldMetaData,
    Datastore, Dashboard, DashboardOptions, SimpleFilter, Dataset } from '../dataset';
import { Subscription, Observable } from 'rxjs/Rx';
import { NeonGTDConfig } from '../neon-gtd-config';
import * as _ from 'lodash';

@Injectable()
export class DatasetService {

    // The Dataset Service may ask the visualizations to update their data.
    static UPDATE_DATA_CHANNEL: string = 'update_data';

    private static DASHBOARD_CATEGORY_DEFAULT: string = 'Select an option...';

    private datasets: Datastore[] = [];

    // The active dataset.
    // TODO: 825: This will probably need to be an array/map of active datastores
    // since a dashboard can reference multiple datastores.
    private dataset: Datastore = new Datastore();

    private dashboards: Dashboard;

    // The currently selected dashboard.
    private currentDashboardName: string;
    private currentDashboard: Dashboard;
    private layout: string = '';

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
    static removeFromArray(array, indexList): void {
        indexList.forEach((index) => {
            array.splice(index, 1);
        });
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
     * @param {any} dashboards config dashboards object
     */
    static validateDashboards(dashboards: any): void {
        let dashboardKeys = dashboards.choices ? Object.keys(dashboards.choices) : [];

        if (!dashboards.category) {
            dashboards.category = this.DASHBOARD_CATEGORY_DEFAULT;
        }

        this.validateDashboardChoices(dashboards.choices, dashboardKeys);
    }

    /**
     * Validate the choices map within each level of dashboards object, and make appropriate
     * changes when expected values are missing. Also used to translate tableKey/fieldKey
     * values into databaseName, tableName, and fieldName.
     *
     * @param {Map<string, Dashboard>} dashboardChoices
     * @param {string[]} keys for dashboardChoices map
     */
    static validateDashboardChoices(dashboardChoices: Map<string, Dashboard>, keys: string[]): void {
        if (!keys.length) {
            return;
        }

        keys.forEach((choiceKey) => {
            let nestedChoiceKeys = dashboardChoices[choiceKey].choices ? Object.keys(dashboardChoices[choiceKey].choices) : [];

            if (!nestedChoiceKeys.length) {
                // If no choices are present, then this might be the last level of nested choices,
                // which should instead have table keys and a layout specified. If not, delete choice.
                // TODO: 825: Add field keys later.
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

                this.validateDashboardChoices(dashboardChoices[choiceKey].choices, nestedChoiceKeys);
            }
        });
    }

    /**
     * Returns database name from matching table key within the dashboard passed in.
     * @param {Dashboard} dashboard
     * @param {String} key
     * @return {String}
     */
    static getDatabaseNameByKey(dashboard: Dashboard, key: string) {
        return dashboard.tables[key].split('.')[1];
    }

    /**
     * Returns table name from matching table key within the dashboard passed in.
     * @param {Dashboard} dashboard
     * @param {String} key
     * @return {String}
     */
    static getTableNameByKey(dashboard: Dashboard, key: string) {
        return dashboard.tables[key].split('.')[2];
    }

    /**
     * Returns field name from matching field key within the dashboard passed in.
     * @param {Dashboard} dashboard
     * @param {String} key
     * @return {String}
     */
    static getFieldNameByKey(dashboard: Dashboard, key: string) {
        return dashboard.fields[key].split('.')[3];
    }

    constructor(@Inject('config') private config: NeonGTDConfig) {
        this.datasets = [];
        let datastores = (config.datastores ? config.datastores : {});
        this.dashboards = (config.dashboards ? config.dashboards : {category: 'No Options', choices: new Map<string, Dashboard>()});

        DatasetService.validateDashboards(this.dashboards);

        // convert datastore key/value pairs into an array
        Object.keys(datastores).forEach((datastoreKey) => {
            let datastore = datastores[datastoreKey];
            datastore.name = datastoreKey;

            let databases = (datastore.databases ? datastore.databases : {});
            let newDatabasesArray: DatabaseMetaData[] = [];

            Object.keys(databases).forEach((databaseKey) => {
                let database = databases[databaseKey];
                database.name = databaseKey;

                let tables = (database.tables ? database.tables : {});
                let newTablesArray: TableMetaData[] = [];

                Object.keys(tables).forEach((tableKey) => {
                    let table = tables[tableKey];
                    table.name = tableKey;
                    newTablesArray.push(table);
                });

                database.tables = newTablesArray;
                newDatabasesArray.push(database);
            });

            datastore.databases = newDatabasesArray;

            // then push converted object onto datasets array
            this.datasets.push(datastore);
        });

        this.messenger = new neon.eventing.Messenger();

        this.datasets.forEach((dataset) => {
            DatasetService.validateDatabases(dataset);
        });
    }

    // ---
    // PRIVATE METHODS
    // ---

    /**
     * Publishes an update data message.
     * @private
     */
    private publishUpdateData(): void {
        this.messenger.publish(DatasetService.UPDATE_DATA_CHANNEL, {});
    }

    /**
     * Updates the dataset that matches the active dataset.
     */
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
     * and {Array} databases.  Each database is an Object containing {String} name, {Array} tables, and {Array}
     * relations.  Each table is an Object containing {String} name, {Array} fields, and {Object} mappings.  Each
     * field is an Object containing {String} columnName and {String} prettyName.  Each mapping key is a unique
     * identifier used by the visualizations and each value is a field name.  Each relation is an Object with table
     * names as keys and field names as values.
     */
    // TODO: 825: this will likely be more like "set active dashboard/config" to allow
    // to connect to multiple datasets
    public setActiveDataset(dataset): void {
        // TODO: 825: structure will likely change here
        this.dataset.name = dataset.name || 'Unknown Dataset';
        // this.dataset.layout = dataset.layout || '';
        this.dataset.type = dataset.type || '';
        this.dataset.host = dataset.host || '';
        this.dataset.databases = dataset.databases || [];
    }

    // TODO: 825: combine setCurrentDashboardName and setCurrentDashboard.
    /**
     * Sets the current dashboard config name.
     * @param {string} name
     */
    public setCurrentDashboardName(name: string) {
        this.currentDashboardName = name;
    }

    /**
     * Returns the current dashboard config name.
     * @return {string}
     */
    public getCurrentDashboardName(): string {
        return this.currentDashboardName;
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

        if (this.currentDashboard.options.requeryInterval) {
            let delay = Math.max(0.5, this.currentDashboard.options.requeryInterval) * 60000;
            this.updateInterval = Observable.interval(delay);
            this.updateSubscription = this.updateInterval.subscribe(() => {
                this.publishUpdateData();
            });
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
     * @return {Map<string, any>}
     */
    public getLayouts(): Map<string, any> {
        return this.config.layouts;
    }

    /**
     * Sets the layout name for the active dataset.
     * @param {String} layoutName
     */
    public setLayout(layoutName: string): void {
        // TODO: 825: may need to revisit later
        this.currentDashboard.layout = layoutName;
        this.updateDataset();
    }

    /**
     * Returns the datastore for the active dataset.
     * @return {String}
     */
    // TODO: 825: rename to type?
    public getDatastore(): string {
        return this.dataset.type;
    }

    /**
     * Returns the hostname for the active dataset.
     * @return {String}
     */
    public getHostname(): string {
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
     * Returns an array of relations for the given database, table, and fields.  The given table is related to another table if
     * the database contains relations mapping each given field name to the other table.
     * @param {String} The database name
     * @param {String} The table name
     * @param {Array} The array of field names
     * @return {Array} The array of relation objects which contain the table name ({String} table) and a mapping of
     * the given field names to the field names in the other tables ({Object} fields).  This array will also contain
     * the relation object for the table and fields given in the arguments
     */
    // TODO: 825: moving relations to options
    /*
    public getRelations(databaseName: string, tableName: string, fieldNames: string[]): any[] {
        let relations = this.dataset.relations;

        let initializeMapAsNeeded = (map, key1, key2) => {
            if (!(map[key1])) {
                map[key1] = {};
            }
            if (!(map[key1][key2])) {
                map[key1][key2] = [];
            }
            return map;
        };

        // First we create a mapping of a relation's database/table/field to its related fields.
        let relationToFields = {};

        // Iterate through each field to find its relations.
        fieldNames.forEach((fieldName) => {
            // Iterate through each relation to compare with the current field.
            relations.forEach((relation) => {
                let relationFieldNamesForInput = relation[databaseName] ? relation[databaseName][tableName] : [];
                relationFieldNamesForInput = _.isArray(relationFieldNamesForInput) ?
                    relationFieldNamesForInput : [relationFieldNamesForInput];
                // If the current relation contains a match for the input database/table/field,
                // iterate through the elements in the current relation.
                if (relationFieldNamesForInput.indexOf(fieldName) >= 0) {
                    let databaseNames = Object.keys(relation);
                    // Add each database/table/field in the current relation to the map.
                    // Note that this will include the input database/table/field.
                    databaseNames.forEach((relationDatabaseName) => {
                        let tableNames = Object.keys(relation[relationDatabaseName]);
                        tableNames.forEach((relationTableName) => {
                            let relationFieldNames = relation[relationDatabaseName][relationTableName];
                            relationFieldNames = _.isArray(relationFieldNames) ? relationFieldNames : [relationFieldNames];
                            relationToFields = initializeMapAsNeeded(relationToFields, relationDatabaseName, relationTableName);

                            let existingFieldIndex = relationToFields[relationDatabaseName][relationTableName].map((object) => {
                                return object.initial;
                            }).indexOf(fieldName);

                            // If the database/table/field exists in the relation...
                            if (existingFieldIndex >= 0) {
                                relationFieldNames.forEach((relationFieldName) => {
                                    // If the relation fields do not exist in the relation, add them to the mapping.
                                    if (relationToFields[relationDatabaseName][relationTableName][existingFieldIndex]
                                        .related.indexOf(relationFieldName) < 0) { /* tslint:disable:max-line-length
                                        relationToFields[relationDatabaseName][relationTableName][existingFieldIndex]
                                        .related.push(relationFieldName); /* tslint:disable:max-line-length
                                    }
                                });
                            } else {
                                // Else create a new object in the mapping for the database/table/field in the relation and
                                // add its related fields.
                                relationToFields[relationDatabaseName][relationTableName].push({
                                    initial: fieldName,
                                    related: [].concat(relationFieldNames)
                                });
                            }
                        });
                    });
                }
            });
        });

        let resultDatabaseNames = Object.keys(relationToFields);
        if (resultDatabaseNames.length) {
            let results = [];
            // Iterate through the relations for each relation's database/table/field
            // and add a relation object for each database/table pair to the final list of results.
            resultDatabaseNames.forEach((resultDatabaseName) => {
                let resultTableNames = Object.keys(relationToFields[resultDatabaseName]);
                resultTableNames.forEach((resultTableName) => {
                    results.push({
                        database: resultDatabaseName,
                        table: resultTableName,
                        fields: relationToFields[resultDatabaseName][resultTableName]
                    });
                });
            });
            return results;
        }

        // If the input fields do not have any related fields in other tables,
        // return a list containing a relation object for the input database/table/fields.
        let result = {
            database: databaseName,
            table: tableName,
            fields: []
        };

        fieldNames.forEach((fieldName) => {
            result.fields.push({
                initial: fieldName,
                related: [fieldName]
            });
        });

        return [result];
    }*/

    public findMentionedFields(filter: neon.query.Filter): { database: string, table: string, field: string }[] {
        let findMentionedFieldsHelper = (clause: neon.query.WherePredicate) => {
            switch (clause.type) {
                case 'where': {
                    return [(clause as neon.query.WhereClause).lhs];
                }
                case 'and':
                case 'or': {
                    let foundFields = [];
                    (clause as neon.query.BooleanClause).whereClauses.forEach((innerClause) => {
                        foundFields = foundFields.concat(findMentionedFieldsHelper(innerClause));
                    });
                    return foundFields;
                }
            }
        };
        let fields = findMentionedFieldsHelper(filter.whereClause);
        let uniques = [];
        for (let i = fields.length - 1; i >= 0; i--) {
            if (uniques.indexOf(fields[i]) < 0) {
                uniques.push(fields[i]);
            }
        }
        return uniques.map((item) => {
            return {
                database: filter.databaseName,
                table: filter.tableName,
                field: item
            };
        });
    }

    public getEquivalentFields(database: string,
        table: string,
        field: string,
        mapping: Map<string, Map<string, { database: string, table: string, field: string }[]>>):
        Map<string, Map<string, { database: string, table: string, field: string }[]>> {
        let relatedFields: any = mapping;

        let found = this.findValueInRelations(database, table, field);
        found.forEach((value) => {
            this.addRelatedFieldToMapping(relatedFields, field, value.database, value.table, value.field);
        });

        // Recursively check for equivalents to the fields we already have until we don't find anything new.
        let valueAdded: boolean;
        do {
            valueAdded = false;
            for (let kvPair of relatedFields) {
                for (let relatedField of kvPair[1].fields[field]) {
                    if (!relatedField.hasBeenChecked) {
                        let values = this.findValueInRelations(kvPair[1].database, kvPair[1].table, relatedField);
                        for (let newValue of values) {
                            valueAdded = valueAdded ||
                                this.addRelatedFieldToMapping(relatedFields, field, newValue.database, newValue.table, newValue.field);
                        }
                        relatedField.hasBeenChecked = true;
                    }
                }
            }
        } while (valueAdded);
        let initialFieldDbAndTableKey = this.makeDbAndTableKey(database, table);
        if (relatedFields.get(initialFieldDbAndTableKey) && relatedFields.get(initialFieldDbAndTableKey).get(field) !== undefined) {
            let fields = relatedFields.get(initialFieldDbAndTableKey).get(field);
            for (let index = fields.length - 1; index >= 0; index--) {
                if (fields[index].database === database && fields[index].table === table && fields[index].field === field) {
                    fields.splice(index, 1);
                }
            }
            if (fields.length === 0) {
                relatedFields.get(initialFieldDbAndTableKey).delete(field);
            }
            if (Array.from(relatedFields.get(initialFieldDbAndTableKey).entries()).length === 0) {
                relatedFields.delete(initialFieldDbAndTableKey);
            }
        }
        return relatedFields;
    }

    // Internal helper method to create a mapping key for a database and table.
    private makeDbAndTableKey(database: string, table: string): string {
        return database + '_' + table;
    }
    // Internal helper method to add a related field to the mapping of related fields, and returns true if it was added and false otherwise.
    private addRelatedFieldToMapping(mapping: Map<string, Map<string, { database: string, table: string, field: string }[]>>,
        baseField: string,
        database: string,
        table: string,
        field: string): boolean {
        let dbAndTableKey = this.makeDbAndTableKey(database, table);
        if (mapping.get(dbAndTableKey) === undefined) {
            let newMap = new Map<string, { database: string, table: string, field: string }[]>();
            newMap.set(baseField, [{
                database: database,
                table: table,
                field: field
            }]);
            mapping.set(dbAndTableKey, newMap);
            return true;
        } else if (mapping.get(dbAndTableKey).get(baseField) === undefined) {
            mapping.get(dbAndTableKey).set(baseField, [{
                database: database,
                table: table,
                field: field
            }]);
            return true;
        } else if (mapping.get(dbAndTableKey).get(baseField).find((elem) => elem.field === field) === undefined) {
            mapping.get(dbAndTableKey).get(baseField).push({
                database: database,
                table: table,
                field: field
            });
            return true;
        } else {
            return false;
        }
    }

    // Internal helper method to find a field in relations.
    // Returns every member of every relation that contains the given database/table/field combination.
    private findValueInRelations(db: string, t: string, f: string): { database: string, table: string, field: string }[] {
        let values = [];
        // TODO: 825: moving relations
        /*this.dataset.relations.forEach((relation) => {
            for (let x = relation.members.length - 1; x >= 0; x--) {
                if (relation.members[x].database === db && relation.members[x].table === t && relation.members[x].field === f) {
                    values = values.concat(relation.members);
                    return; // Return from this instance of forEach so we don't add the contents of this relation multiple times.
                }
            }
        });*/
        return values;
    }

    /**
     * Updates the database at the given index (default 0) from the given dataset by adding undefined fields for each table.
     * @param {Object} dataset
     * @param {Object} connection
     * @param {Function} callback (optional)
     * @param {Number} index (optional)
     */
    // TODO: 825: When dashboard config options layout is changed, do we want to change how/when this
    // validation occurs? (THOR-826)
    public updateDatabases(dataset: Datastore, connection: neon.query.Connection): any {
        let promiseArray = [];

        for (let database of dataset.databases) {
            promiseArray.push(this.getTableNamesAndFieldNames(connection, database));
        }

        return new Promise<any>((resolve) => {
            Promise.all(promiseArray).then((response) => {
                dataset.hasUpdatedFields = true;
                resolve(dataset);
            });
        });
    }

    /**
     * Wraps connection.getTableNamesAndFieldNames() in a promise object. If a database not found error occurs,
     * associated dashboards are deleted. Any other error will return a rejected promise.
     * @param {neon.query.Connection} connection
     * @param {DatabaseMetaData} database
     * @return {Promise}
     * @private
     */
    private getTableNamesAndFieldNames(connection: neon.query.Connection, database: DatabaseMetaData): Promise<any> {
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
            }).fail((error) => {
                if (error.status === 404) {
                    console.warn('Database ' + database.name + ' does not exist; deleting associated dashboards.');
                    let keys = this.dashboards && this.dashboards.choices ? Object.keys(this.dashboards.choices) : [];

                    Promise.all(this.deleteInvalidDashboards(this.dashboards.choices, keys, database.name)).then((response) => {
                        resolve(response);
                    });
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * Wraps connection.getFieldTypes() in a promise object.
     * @param {neon.query.Connection} connection
     * @param {DatabaseMetaData} database
     * @param {TableMetaData} table
     * @return {Promise<FieldMetaData[]>}
     * @private
     */
    private getFieldTypes(connection: neon.query.Connection, database: DatabaseMetaData,
        table: TableMetaData): Promise<FieldMetaData[]> {
        return new Promise<FieldMetaData[]>((resolve) => connection.getFieldTypes(database.name, table.name, (types) => {
            for (let f of table.fields) {
                if (types && types[f.columnName]) {
                    f.type = types[f.columnName];
                }
            }
            resolve(table.fields);
        }));
    }

    /**
     * If a database is not found in updateDatabases(), delete dashboards associated with that database so that
     * the user cannot select them.
     * @param {Map<String, Dashboard>} dashboardChoices
     * @param {String[]} keys
     * @param {String} invalidDatabaseName
     * @return {Promise}
     * @private
     */
    private deleteInvalidDashboards(dashboardChoices: Map<string, Dashboard>, keys: string[],
        invalidDatabaseName: string): any {
        if (!keys.length) {
            return Promise.resolve();
        }

        return Promise.resolve(keys.forEach((choiceKey) => {
            if (dashboardChoices[choiceKey].tables) {
                let tableKeys = Object.keys(dashboardChoices[choiceKey].tables);

                tableKeys.forEach((tableKey) => {
                    let databaseName = DatasetService.getDatabaseNameByKey(dashboardChoices[choiceKey], tableKey);

                    if (databaseName === invalidDatabaseName) {
                        delete dashboardChoices[choiceKey];
                    }
                });
            } else {
                let nestedChoiceKeys = dashboardChoices[choiceKey].choices ? Object.keys(dashboardChoices[choiceKey].choices) : [];
                this.deleteInvalidDashboards(dashboardChoices[choiceKey].choices, nestedChoiceKeys, invalidDatabaseName);
            }
        }));
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

    // TODO: 825: entire key may be more important later when
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
}
