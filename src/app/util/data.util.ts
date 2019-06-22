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

export class DataUtil {
    /**
     * Returns dotted reference in constituent parts(datastore.database.table.field).
     */
    static deconstructDottedReference(name: string): { datastore: string, database: string, table: string, field: string } {
        const [datastore, database, table, ...field] = (name || '').split('.');
        return {
            datastore: datastore || '',
            database: database || '',
            table: table || '',
            field: field.join('.')
        };
    }

    /**
     * Returns the datastore/database/table for the given table key.
     */
    static deconstructTableName(
        tableKeys: Record<string, string>,
        tableKey: string
    ): { datastore: string, database: string, table: string, field: string } {
        return DataUtil.deconstructDottedReference(tableKeys[tableKey] || tableKey);
    }

    /**
     * Returns the datastore/database/table/field for the given field key.
     */
    static deconstructFieldName(
        fieldKeys: Record<string, string>,
        fieldKey: string
    ): { datastore: string, database: string, table: string, field: string } {
        return DataUtil.deconstructDottedReference(fieldKeys[fieldKey] || fieldKey);
    }

    /**
     * Returns the field for the given field key.
     */
    static translateFieldKeyToValue(fieldKeys: Record<string, string>, fieldKey: string): string {
        return DataUtil.deconstructFieldName(fieldKeys, fieldKey).field || fieldKey;
    }
}
