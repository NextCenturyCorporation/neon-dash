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
}
