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
import {
    NeonDashboardConfig, NeonDatabaseMetaData,
    NeonTableMetaData, NeonFieldMetaData, SingleField
} from './types';
import * as _ from 'lodash';
import { NeonConfig, NeonDatastoreConfig } from './types';

export class DashboardState {
    /**
     * Returns dotted reference in constituent parts(datastore.database.table.field).
     * @param {String} name
     * @return {String}
     */
    static deconstructDottedReference(name: string) {
        const [datastore, database, table, ...field] = (name || '').split('.');
        return {
            datastore,
            database,
            table,
            field: field.join('.')
        };
    }

    constructor(
        public dashboard: NeonDashboardConfig = NeonDashboardConfig.get(),
        public datastore: NeonDatastoreConfig = NeonDatastoreConfig.get(),
        public config: NeonConfig = NeonConfig.get()
    ) { }

    /**
     * Returns database name from matching table key within the dashboard passed in.
     * @param {String} key
     * @return {String}
     */
    deconstructTableName(key: string) {
        return DashboardState.deconstructDottedReference(this.dashboard.tables[key]);
    }


    /**
     * Returns database name from matching table key within the dashboard passed in.
     * @param {String} key
     * @return {String}
     */
    deconstructFieldName(key: string) {
        return DashboardState.deconstructDottedReference(this.dashboard.fields[key]);
    }

    /**
     * Returns the current dashboard config title.
     * @return {string}
     */
    public getTitle(): string {
        return this.dashboard ? this.dashboard.fullTitle : null;
    }

    /**
     *
     * @param simpleField The new field for the simple search
     */
    public setSimpleFilterFieldName(simpleField: NeonFieldMetaData) {
        this.createSimpleFilter();
        this.dashboard.options.simpleFilter.fieldName = simpleField.columnName;
    }

    /**
     * Creates a simpleFilter if it doesn't exist
     */
    public createSimpleFilter() {
        if (!this.dashboard.options.simpleFilter) {
            let tableKey = Object.keys(this.dashboard.tables)[0];

            const { database, table } = this.deconstructTableName(tableKey);

            this.dashboard.options.simpleFilter = {
                databaseName: database,
                tableName: table,
                fieldName: ''
            };
        }
    }

    /**
     * Returns the simple search field
     * @return {string}
     */
    public getSimpleFilterFieldName(): string {
        this.createSimpleFilter();
        return this.dashboard.options.simpleFilter.fieldName;
    }

    /**
     * Returns the active table fields
     * @return {Object}
     */
    public getActiveFields() {
        return this.datastore.databases[0].tables[0].fields;
    }

    /**
     * Returns whether a datastore is active.
     * @return {Boolean}
     */
    public hasDatastore(): boolean {
        return (this.datastore.type && this.datastore.host && (Object.keys(this.datastore.databases).length > 0));
    }

    /**
     * Returns the name of the active datastore.
     * @return {String}
     */
    public getDatastoreName(): string {
        return this.datastore.name;
    }

    /**
     * Returns the layout name for the currently selected dashboard.
     * @return {String}
     */
    public getLayout(): string {
        return this.dashboard.layout;
    }

    /**
     * Returns the datastore type for the active datastore (elasticsearchrest, mongo, etc)
     * @return {String}
     */
    public getDatastoreType(): string {
        return this.datastore.type;
    }

    /**
     * Returns the hostname for the active datastore.
     * @return {String}
     */
    public getDatastoreHost(): string {
        return this.datastore.host;
    }

    /**
     * Returns the databases for the active datastore.
     * @return {Array}
     */
    public getDatabases(): NeonDatabaseMetaData[] {
        return Object.values(this.datastore.databases).sort((db1, db2) => db1.name.localeCompare(db2.name));
    }

    /**
     * Returns the database with the given name or an Object with an empty name if no such database exists in the datastore.
     * @param {String} The database name
     * @return {Object} The database containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     */
    public getDatabaseWithName(databaseName: string): NeonDatabaseMetaData {
        return this.datastore.databases[databaseName];
    }

    /**
     * Returns the database with the given Dashboard name or an Object with an empty name if no such database exists in the datastore.
     * @param {String} The dashboard name
     * @return {Object} The database containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     * Dashboard name only includes part of the database pretty name
     */
    public getDatabase(): NeonDatabaseMetaData {
        if (!this.dashboard) {
            return undefined;
        }
        let tableKeys = this.dashboard.tables;

        let keyArray = Object.keys(tableKeys || {});

        if (keyArray.length) {
            const { database } = this.deconstructTableName(keyArray[0]);
            return this.getDatabaseWithName(database);
        }
        return undefined;
    }

    /**
     * Returns the tables for the database with the given name in the active datastore.
     * @param {String} The database name
     * @return {Array} An array of table Objects containing {String} name, {Array} fields, and {Array} mappings.
     */
    public getTables(databaseName: string): { [key: string]: NeonTableMetaData } {
        let database = this.getDatabaseWithName(databaseName);
        return database ? database.tables : {};
    }

    /**
     * Returns the table with the given name or an Object with an empty name if no such table exists in the database with the given name.
     * @param {String} The database name
     * @param {String} The table name
     * @return {Object} The table containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     */
    public getTableWithName(databaseName: string, tableName: string): NeonTableMetaData {
        let tables = this.getTables(databaseName);
        return tables[tableName];
    }

    /**
     * Returns the field with the given name or an Object with an empty name if no such field exists in the database and table with the
     * given names.
     *
     * @arg {string} databaseName The database name
     * @arg {string} tableName The table name
     * @arg {string} fieldName The field name
     * @return {NeonFieldMetaData} The field containing {String} columnName and {String} prettyName if a match exists or undefined otherwise.
     */
    public getFieldWithName(databaseName: string, tableName: string, fieldName: string): NeonFieldMetaData {
        let fields: NeonFieldMetaData[] = this.getFields(databaseName, tableName);
        for (let field of fields) {
            if (field.columnName === fieldName) {
                return field;
            }
        }

        return undefined;
    }

    /**
     * Returns the field objects for the database and table with the given names.
     * @param {String} The database name
     * @param {String} The table name
     * @return {Array} The array of field objects if a match exists or an empty array otherwise.
     */
    public getFields(databaseName: string, tableName: string): NeonFieldMetaData[] {
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
    public getSortedFields(databaseName: string, tableName: string, ignoreHiddenFields?: boolean): NeonFieldMetaData[] {
        let table = this.getTableWithName(databaseName, tableName);

        if (!table) {
            return [];
        }

        let fields = _.cloneDeep(table.fields).filter((field) => (ignoreHiddenFields ? !field.hide : true));

        fields.sort((field1, field2) => {
            if (!field1.prettyName || !field2.prettyName) {
                return 0;
            }
            // Compare field pretty names and ignore case.
            return (field1.prettyName.toUpperCase() < field2.prettyName.toUpperCase()) ?
                -1 : ((field1.prettyName.toUpperCase() > field2.prettyName.toUpperCase()) ? 1 : 0);
        });

        return fields;
    }


    /**
    /**
     * Returns the the first table in the database with the given name containing all the given mappings.
     * @param {String} The database name
     * @param {Array} The array of mapping keys that the table must contain.
     * @return {String} The name of the table containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     */
    public getFirstTableWithMappings(databaseName: string, keys: string[]): NeonTableMetaData {
        let tables = this.getTables(databaseName);
        for (const table of Object.values(tables)) {
            for (let key of keys) {
                if (!(table.mappings[key])) {
                    return table;
                }
            }
        }

        return undefined;
    }

    /**
     * Returns an object containing the first database, table, and fields found in the active datastore with all the given mappings.
     * @param {Array} The array of mapping keys that the database and table must contain.
     * @return {Object} An object containing {String} database, {String} table,
     * and {Object} fields linking {String} mapping to {String} field.
     * If no match was found, an empty object is returned instead.
     */
    public getFirstDatabaseAndTableWithMappings(keys: string[]): any {
        for (let database of Object.values(this.datastore.databases)) {
            for (let table of Object.values(database.tables)) {
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
     * Returns the mappings for the table with the given name.
     * @param {String} The database name
     * @param {String} The table name
     * @return {Object} The mappings if a match exists or an empty object otherwise.
     */
    public getMappings(databaseName: string, tableName: string): NeonTableMetaData['mappings'] {
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
     * Returns the options for the current dashboard.
     * @method getCurrentDashboardOptions
     * @return {Object}
     *
     */
    public getOptions(): NeonDashboardConfig['options'] {
        return this.dashboard.options;
    }

    /**
     * Returns whether the given field object is valid.
     * @param {Object} fieldObject
     * @return {Boolean}
     */
    public isFieldValid(fieldObject: NeonFieldMetaData): boolean {
        return Boolean(fieldObject && fieldObject.columnName);
    }

    /**
     * Returns the pretty name for the given table name in the given database.
     * @param {String} databaseName
     * @param {String} tableName
     * @return {String}
     */
    public getPrettyNameForTable(databaseName: string, tableName: string): string {
        let name = tableName;
        const tbl = this.getTables(databaseName)[tableName];
        return tbl ? tbl.prettyName : name;
    }


    /**
     * Returns the pretty name for the given database name.
     * @param {String} databaseName
     * @return {String}
     */
    public getPrettyNameForDatabase(databaseName: string): string {
        const db = this.datastore.databases[databaseName];
        return db ? db.prettyName : databaseName;
    }

    /**
     * Returns the list of relation data for the current datastore:  elements of the outer array are individual relations and elements of
     * the inner array are specific fields within the relations.
     *
     * @return {SingleField[][][]}
     */
    public findRelationDataList(): SingleField[][][] {
        // Either expect string list structure:  [[a1, a2, a3], [b1, b2]]
        // ....Or expect nested list structure:  [[[x1, y1], [x2, y2], [x3, y3]], [[z1], [z2]]]
        let configRelationDataList: (string | string[])[][] = this.dashboard.relations || [];

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
        return configRelationDataList.map((configRelationData) => configRelationData.map((configRelationFilterFields) => {
            // A relation is an array of arrays.  The elements in the outer array are the fields-to-substitute and the elements in the
            // inner arrays are the filtered fields.  The inner arrays must be the same length (the same number of filtered fields).
            let relationFilterFields: string[] = Array.isArray(configRelationFilterFields) ? configRelationFilterFields :
                [configRelationFilterFields];

            return relationFilterFields.map((item) => {
                const { database, table, field } = this.deconstructTableName(item);

                return {
                    // TODO THOR-1062 THOR-1078 Set the datastore name too!
                    datastore: '',
                    database: this.getDatabaseWithName(database),
                    table: this.getTableWithName(database, table),
                    field: this.getFieldWithName(database, table, field)
                } as SingleField;
            }).filter((item) => item.database && item.table && item.field);
        })).filter((relationData) => {
            if (relationData.length > 1) {
                // Ensure each inner array element has the same non-zero length because they must have the same number of filtered fields.
                let size = relationData[0].length;
                return size && relationData.every((relationFilterFields) => relationFilterFields.length === size);
            }
            return false;
        });
    }

    // Used to link layouts with dashboards
    /**
     * Returns entire value of matching table key from current dashboard.
     * @param {String} key
     * @return {String}
     */
    public getTableByKey(key: string): string {
        return this.dashboard.tables[key];
    }

    /**
     * Returns entire value of matching field key from current dashboard.
     * @param {String} key
     * @return {String}
     */
    public getFieldByKey(key: string): string {
        return this.dashboard.fields[key];
    }

    /**
     * If field key is referenced in config file, find field value using current dashboard.
     *
     * @arg {string} fieldKey
     * @return {string}
     */
    public translateFieldKeyToValue(fieldKey: string): string {
        return this.deconstructFieldName(fieldKey).field || fieldKey;
    }

    public exportAsConfig() {
        return {
            ..._.cloneDeep(this.config),
            dashboards: _.cloneDeep(this.dashboard),
        };
    }
}
