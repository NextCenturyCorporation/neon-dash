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

import { Dataset, DatasetOptions, DatabaseMetaData, TableMetaData, TableMappings, FieldMetaData, Relation } from '../dataset';
import { Subscription, Observable } from 'rxjs/Rx';
import { NeonGTDConfig } from '../neon-gtd-config';
import * as _ from 'lodash';

@Injectable()
export class DatasetService {

    // The Dataset Service may ask the visualizations to update their data.
    static UPDATE_DATA_CHANNEL: string = 'update_data';

    private datasets: Dataset[] = [];

    // The active dataset.
    private dataset: Dataset = new Dataset();

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

    constructor(@Inject('config') private config: NeonGTDConfig) {
        this.datasets = (config.datasets ? config.datasets : []);
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
    public getDatasets(): Dataset[] {
        return this.datasets;
    }

    /**
     * Adds the given dataset to the list of datasets maintained by this service and returns the new list.
     * @return {Array}
     */
    public addDataset(dataset): Dataset[] {
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
    public setActiveDataset(dataset): void {
        this.dataset.name = dataset.name || 'Unknown Dataset';
        this.dataset.layout = dataset.layout || '';
        this.dataset.datastore = dataset.datastore || '';
        this.dataset.hostname = dataset.hostname || '';
        this.dataset.title = dataset.title || '';
        this.dataset.icon = dataset.icon || '';
        this.dataset.databases = dataset.databases || [];
        this.dataset.options = dataset.options || {};
        this.dataset.relations = dataset.relations || [];

        // Shutdown any previous update intervals.
        if (this.updateInterval) {
            this.updateSubscription.unsubscribe();
            delete this.updateSubscription;
            delete this.updateInterval;
        }
        if (this.dataset.options.requeryInterval) {
            let delay = Math.max(0.5, this.dataset.options.requeryInterval) * 60000;
            this.updateInterval = Observable.interval(delay);
            this.updateSubscription = this.updateInterval.subscribe(() => {
                this.publishUpdateData();
            });
        }
    }

    /**
     * Returns the active dataset object
     * @return {Object}
     */
    public getDataset(): Dataset {
        return this.getDatasetWithName(this.dataset.name) || this.dataset;
    }

    /**
     * Returns whether a dataset is active.
     * @return {Boolean}
     */
    public hasDataset(): boolean {
        return (this.dataset.datastore && this.dataset.hostname && (this.dataset.databases.length > 0));
    }

    /**
     * Returns the name of the active dataset.
     * @return {String}
     */
    public getName(): string {
        return this.dataset.name;
    }

    /**
     * Returns the layout name for the active dataset.
     * @return {String}
     */
    public getLayout(): string {
        return this.dataset.layout;
    }

    /**
     * Returns all of the layouts.
     */
    public getLayouts(): { [key: string]: any } {
        return this.config.layouts;
    }

    /**
     * Sets the layout name for the active dataset.
     * @param {String} layoutName
     */
    public setLayout(layoutName: string): void {
        this.dataset.layout = layoutName;
        this.updateDataset();
    }

    /**
     * Returns the datastore for the active dataset.
     * @return {String}
     */
    public getDatastore(): string {
        return this.dataset.datastore;
    }

    /**
     * Returns the hostname for the active dataset.
     * @return {String}
     */
    public getHostname(): string {
        return this.dataset.hostname;
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
    public getDatasetWithName(datasetName: string): Dataset {
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
                                    if (relationToFields[relationDatabaseName][relationTableName][existingFieldIndex].related.indexOf(relationFieldName) < 0) { /* tslint:disable:max-line-length */
                                        relationToFields[relationDatabaseName][relationTableName][existingFieldIndex].related.push(relationFieldName); /* tslint:disable:max-line-length */
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
    }

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
                            valueAdded = valueAdded || this.addRelatedFieldToMapping(relatedFields, field, newValue.database, newValue.table, newValue.field);
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
        this.dataset.relations.forEach((relation) => {
            for (let x = relation.members.length - 1; x >= 0; x--) {
                if (relation.members[x].database === db && relation.members[x].table === t && relation.members[x].field === f) {
                    values = values.concat(relation.members);
                    return; // Return from this instance of forEach so we don't add the contents of this relation multiple times.
                }
            }
        });
        return values;
    }

    /**
     * Updates the database at the given index (default 0) from the given dataset by adding undefined fields for each table.
     * @param {Object} dataset
     * @param {Object} connection
     * @param {Function} callback (optional)
     * @param {Number} index (optional)
     * @private
     */
    public updateDatabases(dataset: Dataset, connection: neon.query.Connection, callback?: Function, index?: number): void {
        let databaseIndex = index ? index : 0;
        let database = dataset.databases[databaseIndex];
        let pendingTypesRequests = 0;
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
                    pendingTypesRequests++;
                    connection.getFieldTypes(database.name, table.name, (types) => {
                        for (let f of table.fields) {
                            if (types && types[f.columnName]) {
                                f.type = types[f.columnName];
                            }
                        }
                        pendingTypesRequests--;
                        if (dataset.hasUpdatedFields && pendingTypesRequests === 0) {
                            callback(dataset);
                        }
                    });
                }
            });
            if (++databaseIndex < dataset.databases.length) {
                this.updateDatabases(dataset, connection, callback, databaseIndex);
            } else if (callback) {
                dataset.hasUpdatedFields = true;
                if (pendingTypesRequests === 0) {
                    callback(dataset);
                }
            }
        });
    }

    /**
     * Returns the options for the active dataset.
     * @method getActiveDatasetOptions
     * @return {Object}
     */
    public getActiveDatasetOptions(): DatasetOptions {
        return this.dataset.options;
    }

    /**
     * Returns the color maps option for the database, table, and field in the active dataset with the given names.
     * @param {String} databaseName
     * @param {String} tableName
     * @param {String} fieldName
     * @method getActiveDatasetColorMaps
     * @return {Object}
     */
    public getActiveDatasetColorMaps(databaseName: string, tableName: string, fieldName: string): Object {
        let colorMaps = this.getActiveDatasetOptions().colorMaps || {};
        return colorMaps[databaseName] && colorMaps[databaseName][tableName] ? colorMaps[databaseName][tableName][fieldName] || {} : {};
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
}
