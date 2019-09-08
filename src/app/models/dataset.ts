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

import { Connection, ConnectionService } from '../services/connection.service';

// Needed to call setNeonServerUrl
import * as neon from 'neon-framework';

type Primitive = number | string | Date | boolean | undefined;

/**
 * This is a recursive mapped type (https://www.typescriptlang.org/docs/handbook/advanced-types.html#mapped-types)
 * that makes all fields optional but type checked (either it's missing or it's the correct type)
 */
export type DeepPartial<T> = {
    /* eslint-disable-next-line @typescript-eslint/generic-type-naming */
    [P in keyof T]?: T[P] |
    (T[P] extends (Primitive | Primitive[] | Record<string, Primitive>) ?
        (T[P] | undefined) :
        (T[P] extends any[] ?
            DeepPartial<T[P][0]>[] | undefined :
            (T[P] extends Record<string, any> ?
                (T[P][''] extends any[] ?
                    Record<string, DeepPartial<T[P][''][0]>[]> :
                    Record<string, DeepPartial<T[P]['']>>) :
                DeepPartial<T[P]>)));
} & {
    [key: string]: any;
};

export function translateValues<T>(
    obj: Record<string, Partial<T>>,
    transform: (input: Partial<T>) => T,
    applyNames = false
): Record<string, T> {
    for (const key of Object.keys(obj)) {
        obj[key] = transform(obj[key]);
        if (applyNames && !obj[key]['name']) {
            obj[key]['name'] = key;
        }
    }
    return obj as Record<string, T>;
}

function translate<T>(values: Partial<T>[], transform: (input: Partial<T>) => T): T[] {
    return values.map(transform);
}

export interface NeonFieldMetaData {
    columnName: string;
    prettyName: string;
    hide: boolean;
    type: string;
}

export class NeonFieldMetaData {
    static get(field: DeepPartial<NeonFieldMetaData> = {}) {
        return {
            columnName: '',
            prettyName: '',
            hide: false,
            type: '',
            ...field
        } as NeonFieldMetaData;
    }
}

export interface NeonTableMetaData {
    name: string;
    prettyName: string;
    fields: NeonFieldMetaData[];
    labelOptions: Record<string, any | Record<string, any>>;
}

export class NeonTableMetaData {
    static get(table: DeepPartial<NeonTableMetaData> = {}) {
        return {
            name: '',
            prettyName: '',
            mappings: {},
            labelOptions: {},
            ...table,
            fields: translate(table.fields || [], NeonFieldMetaData.get.bind(null))
        } as NeonTableMetaData;
    }
}

export interface NeonDatabaseMetaData {
    name: string;
    prettyName: string;
    tables: Record<string, NeonTableMetaData>;
}

export class NeonDatabaseMetaData {
    static get(db: DeepPartial<NeonDatabaseMetaData> = {}) {
        return {
            name: '',
            prettyName: '',
            ...db,
            tables: translateValues(db.tables || {}, NeonTableMetaData.get.bind(null), true)
        } as NeonDatabaseMetaData;
    }
}

export interface NeonDatastoreConfig {
    name: string;
    host: string;
    type: string;
    databases: Record<string, NeonDatabaseMetaData>;
}

export class NeonDatastoreConfig {
    static get(config: DeepPartial<NeonDatastoreConfig> = {}) {
        return {
            name: '',
            host: '',
            type: '',
            ...config,
            databases: translateValues(config.databases || {}, NeonDatabaseMetaData.get.bind(null), true)
        } as NeonDatastoreConfig;
    }
}

export interface FieldKey {
    datastore: string;
    database: string;
    table: string;
    field: string;
}

export class Dataset {
    private _relations: FieldKey[][][];

    constructor(
        private _datastores: Record<string, NeonDatastoreConfig>,
        private _connectionService: ConnectionService = null,
        private _dataServer: string = null,
        relations: (string|string[])[][] = [],
        public tableKeyCollection: Record<string, string> = {},
        public fieldKeyCollection: Record<string, string> = {}
    ) {
        this._updateDatastores(this._datastores);
        this._updateDataServer(this._dataServer);
        this._relations = this._validateRelations(relations);
    }

    get datastores(): Record<string, NeonDatastoreConfig> {
        return this._datastores;
    }

    set datastores(newDatastores: Record<string, NeonDatastoreConfig>) {
        this._updateDatastores(newDatastores);
        this._datastores = newDatastores;
    }

    get dataServer(): string {
        return this._dataServer;
    }

    set dataServer(newDataServer: string) {
        this._updateDataServer(newDataServer);
        this._dataServer = newDataServer;
    }

    /**
     * Returns this dataset's relations.
     */
    public getRelations(): FieldKey[][][] {
        return this._relations;
    }

    /**
     * Returns the database with the given name from the given datastore in this dataset.
     */
    public retrieveDatabase(datastoreId: string, databaseName: string): NeonDatabaseMetaData {
        const datastore: NeonDatastoreConfig = this.retrieveDatastore(datastoreId);
        return datastore ? datastore.databases[databaseName] : null;
    }

    /**
     * Returns the dashboard dataset.
     */
    public retrieveDatastore(datastoreId: string): NeonDatastoreConfig {
        if (datastoreId) {
            return this._datastores[datastoreId];
        }
        // Backwards compatibility:  in old saved states, assume an empty datastore references the first datastore.
        const datastoreNames = Object.keys(this._datastores);
        return datastoreNames.length ? this._datastores[datastoreNames[0]] : null;
    }

    /**
     * Returns the field with the given name from the given datastore/database/table in this dataset.
     */
    public retrieveField(datastoreId: string, databaseName: string, tableName: string, fieldName: string): NeonFieldMetaData {
        const table: NeonTableMetaData = this.retrieveTable(datastoreId, databaseName, tableName);
        return table ? table.fields.filter((element) => element.columnName === fieldName)[0] : null;
    }

    /**
     * Returns the datastore, database, table, and field objects using the given field key object.
     */
    public retrieveMetaDataFromFieldKey(
        fieldKey: FieldKey,
    ): [NeonDatastoreConfig, NeonDatabaseMetaData, NeonTableMetaData, NeonFieldMetaData] {
        return [
            this.retrieveDatastore(fieldKey.datastore),
            this.retrieveDatabase(fieldKey.datastore, fieldKey.database),
            this.retrieveTable(fieldKey.datastore, fieldKey.database, fieldKey.table),
            this.retrieveField(fieldKey.datastore, fieldKey.database, fieldKey.table, fieldKey.field)
        ];
    }

    /**
     * Returns the table with the given name from the given datastore/database in this dataset.
     */
    public retrieveTable(datastoreId: string, databaseName: string, tableName: string): NeonTableMetaData {
        const database: NeonDatabaseMetaData = this.retrieveDatabase(datastoreId, databaseName);
        return database ? database.tables[tableName] : null;
    }

    /**
     * Sets this dataset's relations.
     */
    public setRelations(relations: (string|string[])[][]): void {
        this._relations = this._validateRelations(relations);
    }

    private _updateDatastores(datastores: Record<string, NeonDatastoreConfig>): void {
        if (this._connectionService) {
            Object.keys(datastores).forEach((datastoreId) => {
                const connection = this._connectionService.connect(datastores[datastoreId].type, datastores[datastoreId].host);
                if (connection) {
                    DatasetUtil.updateDatabasesFromDataServer(connection, datastores[datastoreId]);
                }
            });
        }
    }

    private _updateDataServer(dataServer: string): void {
        if (dataServer) {
            neon.setNeonServerUrl(dataServer);
        }
    }

    /**
     * Returns the list of relation data for the current datastore:  elements of the outer array are individual relations and elements of
     * the inner array are specific fields within the relations.
     */
    private _validateRelations(relations: (string|string[])[][]): FieldKey[][][] {
        // Either expect string list structure:  [[a1, a2, a3], [b1, b2]]
        // ....Or expect nested list structure:  [[[x1, y1], [x2, y2], [x3, y3]], [[z1], [z2]]]
        //
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
        return relations.map((configRelation) => configRelation.map((configRelationFields) => {
            // A relation is an array of arrays.  The elements in the outer array are the sets of fields-to-substitute and the elements in
            // the inner arrays are the filtered fields.  The inner arrays must be the same length (the same number of filtered fields).
            let relationFields: string[] = Array.isArray(configRelationFields) ? configRelationFields : [configRelationFields];
            return relationFields.map((item) => {
                const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKeySafely(item);
                const [datastore, database, table, field] = this.retrieveMetaDataFromFieldKey(fieldKey);
                // Verify that the datastore, database, table, and field are all objects that exist within the dataset.
                return (datastore && database && table && field) ? fieldKey : null;
            }).filter((item) => !!item);
        })).filter((relation) => {
            if (relation.length > 1) {
                // Ensure each inner array element has the same non-zero length because they must have the same number of filtered fields.
                let size = relation[0].length;
                return size && relation.every((relationFields) => relationFields.length === size);
            }
            return false;
        });
    }
}

export class DatasetUtil {
    /**
     * Returns an object containing the datastore/database/table/field in the given tablekey (datastore.database.table) or fieldkey
     * (datastore.database.table.field) or the given tablekey/fieldkey in the given collection.
     */
    static deconstructTableOrFieldKeySafely(key: string, keys: Record<string, string> = {}): FieldKey {
        const [datastore, database, table, ...field] = (keys[key] || key || '').split('.');
        return {
            datastore: datastore || '',
            database: database || '',
            table: table || '',
            field: field.join('.')
        };
    }

    /**
     * Returns an object containing the datastore/database/table/field in the given tablekey (datastore.database.table) or fieldkey
     * (datastore.database.table.field) or the given tablekey/fieldkey in the given collection, or null if the key is not viable.
     */
    static deconstructTableOrFieldKey(key: string, keys: Record<string, string> = {}): FieldKey {
        const fieldKeyObject: FieldKey = DatasetUtil.deconstructTableOrFieldKeySafely(key, keys);
        return (fieldKeyObject.database && fieldKeyObject.table) ? fieldKeyObject : null;
    }

    /**
     * Returns just the field name for the given field key.
     */
    static translateFieldKeyToFieldName(fieldKey: string, fieldKeys: Record<string, string>): string {
        return DatasetUtil.deconstructTableOrFieldKeySafely(fieldKey, fieldKeys).field || fieldKey;
    }

    /**
     * Retrieves the information for the databases in the given datastore from the data server and updates the database objects.
     */
    static updateDatabasesFromDataServer(
        connection: Connection,
        datastore: NeonDatastoreConfig,
        onFinish?: (failedDatabases: NeonDatabaseMetaData[]) => void
    ): Promise<void> {
        return Promise.all(Object.values(datastore.databases).map((database: NeonDatabaseMetaData) =>
            DatasetUtil.updateTablesFromDataServer(connection, database))).then((databases: NeonDatabaseMetaData[]) => {
            if (onFinish) {
                onFinish(databases.filter((database) => !!database));
            }
        });
    }

    /**
     * Retrieves the information for the tables in the given database from the data server and updates the table objects.
     */
    static updateTablesFromDataServer(connection: Connection, database: NeonDatabaseMetaData): Promise<NeonDatabaseMetaData> {
        return new Promise<NeonDatabaseMetaData>((resolve) => {
            connection.getTableNamesAndFieldNames(database.name, (tableNamesAndFieldNames: Record<string, string[]>) => {
                let promisesOnFields = [];

                Object.keys(tableNamesAndFieldNames).forEach((tableName: string) => {
                    let table = database.tables[tableName];

                    if (table) {
                        let existingFields = new Set(table.fields.map((field) => field.columnName));

                        tableNamesAndFieldNames[tableName].forEach((fieldName: string) => {
                            if (!existingFields.has(fieldName)) {
                                let newField: NeonFieldMetaData = NeonFieldMetaData.get({
                                    columnName: fieldName,
                                    prettyName: fieldName,
                                    // If a lot of existing fields were defined (> 25), but this field wasn't, then hide this field.
                                    hide: existingFields.size > 25,
                                    // Set the default type to text.
                                    type: 'text'
                                });
                                table.fields.push(newField);
                            }
                        });

                        promisesOnFields.push(DatasetUtil.updateFieldsFromDataServer(connection, database, table));
                    }
                });

                Promise.all(promisesOnFields).then((tables: NeonTableMetaData[]) => {
                    // Don't return this database if it and all its tables don't error.
                    resolve(tables.filter((table) => !!table).length ? database : null);
                });
            }, (__error) => {
                // Return this database if it errors.
                resolve(database);
            });
        });
    }

    /**
     * Wraps connection.getFieldTypes() in a promise object.
     */
    static updateFieldsFromDataServer(
        connection: Connection,
        database: NeonDatabaseMetaData,
        table: NeonTableMetaData
    ): Promise<NeonTableMetaData> {
        return new Promise<NeonTableMetaData>((resolve) =>
            connection.getFieldTypes(database.name, table.name, (fieldTypes: Record<string, string>) => {
                if (fieldTypes) {
                    table.fields.forEach((field: NeonFieldMetaData) => {
                        field.type = fieldTypes[field.columnName] || field.type;
                    });
                }
                // Don't return this table if it doesn't error.
                resolve(null);
            }, (__error) => {
                // Return this table if it errors.
                resolve(table);
            }));
    }
}
