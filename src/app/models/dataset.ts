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

export interface SingleField {
    datastore: string;
    database: string;
    table: string;
    field: string;
}

export interface Dataset {
    datastores: Record<string, NeonDatastoreConfig>;
    tableKeys: Record<string, string>;
    fieldKeys: Record<string, string>;
    relations: SingleField[][][];
}

export class Dataset {
    static get(dataset: DeepPartial<Dataset> = {}) {
        return {
            tableKeys: {},
            fieldKeys: {},
            relations: [],
            ...dataset,
            datastores: translateValues(dataset.datastores || {}, Dataset.get.bind(null), true)
        } as Dataset;
    }
}
