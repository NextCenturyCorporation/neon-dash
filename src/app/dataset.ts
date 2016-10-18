/*
 * Copyright 2016 Next Century Corporation
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
export class FieldMetaData {
    columnName: string;
    prettyName: string;
    hide: boolean;
}

export class TableMetaData {
    name: string;
    prettyName: string;
    fields: FieldMetaData[];
    mappings: TableMappings;

    constructor(name?: string, prettyName?: string, fields?: FieldMetaData[], mappings?: TableMappings) {
        this.name = name;
        this.prettyName = name;
        this.fields = fields;
        this.mappings = mappings;
    }
}

export class DatabaseMetaData {
    name: string = '';
    prettyName: string = '';
    tables: TableMetaData[];

    constructor(name?: string, prettyName?: string) {
        this.name = name;
        this.prettyName = prettyName;
        this.tables = [];
    }
}

export class DatasetOptions {
    colorMaps?: Object;
    requeryInterval?: number;
}

export interface TableMappings {
    [key: string]: string;
}

export class RelationTableMetaData {
    table: TableMetaData;
    field: FieldMetaData;
}

export class RelationMetaData {
    database: DatabaseMetaData;
    customRelationTables: RelationTableMetaData[];
}

export class Dataset {
    name: string = '';
    datastore: string = '';
    hostname: string = '';
    connectOnLoad: boolean = false;
    databases: DatabaseMetaData[] = [];
    hasUpdatedFields: boolean = false;
    layout: string = '';
    options: DatasetOptions = new DatasetOptions();
    mapLayers: Object[] = undefined;
    mapConfig: Object = undefined;
    relations: Object[] = [];
    linkyConfig: Object = undefined;
    dateFilterKeys: Object = undefined;
    lineCharts: Object[] = undefined;

    constructor(name?: string, datastore?: string, hostname?: string) {
        this.name = name;
        this.datastore = datastore;
        this.hostname = hostname;
    }
}
