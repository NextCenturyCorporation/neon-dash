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
export interface NeonFieldMetaData {
    columnName: string;
    prettyName: string;
    hide: boolean;
    type: string;
}

export interface NeonTableMetaData {
    name?: string;
    prettyName: string;
    fields: NeonFieldMetaData[];
    mappings: Record<string, string>;
    labelOptions: Record<string, Record<string, any>>;
}

export interface NeonDatabaseMetaData {
    name?: string;
    prettyName: string;
    tables: Record<string, NeonTableMetaData>;
}

export interface NeonRelationTableMetaData {
    table: NeonTableMetaData;
    field: NeonFieldMetaData;
}

export interface NeonRelationMetaData {
    database: NeonDatabaseMetaData;
    customRelationTables: NeonRelationTableMetaData[];
}

export interface NeonSimpleFilter {
    databaseName: string;
    tableName: string;
    fieldName: string;
    placeHolder?: string;
    icon?: string;
    tableKey?: string;
    fieldKey?: string;
}

export interface NeonDashboardOptions {
    connectOnLoad?: boolean;
    colorMaps?: Record<string, any>;
    simpleFilter?: NeonSimpleFilter;
}

export interface NeonContributor {
    orgName: string;
    abbreviation: string;
    contactName: string;
    contactEmail: string;
    website: string;
    logo: string;
}

export interface NeonDashboardConfig {
    fileName?: string;
    lastModified?: number;
    modified?: boolean;

    name?: string;
    // Exist in Dashboards that are not terminal nodes.
    category?: string;
    choices?: Record<string, NeonDashboardConfig>;
    // Exist in Dashboards that are terminal nodes.
    layout?: string;
    tables?: Record<string, string>;
    fields?: Record<string, string>;
    filters?: any[];
    visualizationTitles?: Record<string, string>;
    options?: NeonDashboardOptions;
    relations?: (string | string[])[][];
    contributors?: Record<string, NeonContributor>;
}

export interface NeonLayoutConfig {
    name: string;
    type: string;
    col: number;
    row: number;
    bindings: Record<string, any>;
    sizex: number;
    sizey: number;
    minPixelx?: number;
    minPixely?: number;
    minSizex?: number;
    minSizey?: number;
}

export interface NeonDatastoreConfig {
    host: string;
    type: string;
    databases: Record<string, NeonDatabaseMetaData>;
}

export interface NeonGTDConfig {
    projectTitle: string;
    projectIcon: string;
    datastores: Record<string, NeonDatastoreConfig>;
    dashboards: NeonDashboardConfig;
    layouts: Record<string, NeonLayoutConfig>;
    errors: string[];
    neonServerUrl: string;
    version: string;
}
