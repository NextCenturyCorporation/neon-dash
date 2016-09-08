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
}

export class DatabaseMetaData {
    name: string;
    prettyName: string;
    tables: TableMetaData[];
}

export class DatasetOptions {
    colorMaps: Object;
    requeryInterval: number;
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
    name: string;
    datastore: string;
    hostname: string;
    connectOnLoad: boolean;
    databases: DatabaseMetaData[] = [];
    hasUpdatedFields: boolean;
    layout: string;
    options: DatasetOptions;
    mapLayers: Object[];
    mapConfig: Object;
    relations: Object[];
    linkyConfig: Object;
    dateFilterKeys: Object;
    lineCharts: Object[];
}
