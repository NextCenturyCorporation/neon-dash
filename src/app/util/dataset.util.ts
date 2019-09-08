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
import { Connection } from '../services/connection.service';
import { Dataset, FieldKey, NeonDatabaseMetaData, NeonDatastoreConfig, NeonFieldMetaData, NeonTableMetaData } from '../models/dataset';

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
     * Returns the datastore, database, table, and field objects using the given field key object.
     */
    static retrieveMetaDataFromFieldKey(
        fieldKey: FieldKey,
        dataset: Dataset
    ): [NeonDatastoreConfig, NeonDatabaseMetaData, NeonTableMetaData, NeonFieldMetaData] {
        let datastore: NeonDatastoreConfig = dataset ? dataset.datastores[fieldKey.datastore] : null;
        // Backwards compatibility:  in old saved states, assume an empty datastore references the first datastore.
        if (!datastore && !fieldKey.datastore) {
            const datastoreNames = Object.keys(dataset.datastores);
            if (datastoreNames.length) {
                datastore = dataset.datastores[datastoreNames[0]];
            }
        }
        const database: NeonDatabaseMetaData = datastore ? datastore.databases[fieldKey.database] : null;
        const table: NeonTableMetaData = database ? database.tables[fieldKey.table] : null;
        const field: NeonFieldMetaData = table ? table.fields.filter((element) => element.columnName === fieldKey.field)[0] : null;
        return [datastore, database, table, field];
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
