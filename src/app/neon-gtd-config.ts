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
    labelOptions: Record<string, any | Record<string, any>>;
}

export interface NeonDatabaseMetaData {
    name?: string;
    prettyName: string;
    tables: Record<string, NeonTableMetaData>;
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

export interface NeonDashboardLeafConfig {
    name?: string;
    layout?: string;
    datastores?: Record<string, NeonDatastoreConfig>;
    tables?: Record<string, string>;
    fields?: Record<string, string>;
    filters?: any[];
    visualizationTitles?: Record<string, string>;
    options?: NeonDashboardOptions;
    relations?: (string | string[])[][];
    contributors?: Record<string, NeonContributor>;
}

export interface NeonDashboardParentConfig<T extends NeonDashboardConfig<any> = NeonDashboardConfig> {
    name?: string;
    // Interior
    category?: string;
    choices?: Record<string, T>;

}

export type NeonDashboardConfig<T extends NeonDashboardConfig<any> = NeonDashboardConfig<any>> =
    NeonDashboardLeafConfig & NeonDashboardParentConfig<T>;

export interface NeonLayoutGridConfig {
    col: number;
    row: number;
    bindings?: Record<string, any>;
    sizex: number;
    sizey: number;
}

export interface NeonLayoutConfig extends NeonLayoutGridConfig {
    name: string;
    type: string;
}

export interface NeonDatastoreConfig {
    name?: string;
    host: string;
    type: string;
    databases: Record<string, NeonDatabaseMetaData>;
}

export interface NeonGTDConfig<T extends NeonDashboardConfig<any> = NeonDashboardConfig<any>> {
    projectTitle?: string;
    projectIcon?: string;
    fileName?: string;
    lastModified?: number;

    datastores: Record<string, NeonDatastoreConfig>;
    dashboards: NeonDashboardConfig<T>;
    layouts: Record<string, NeonLayoutConfig[]>;
    errors?: string[];
    neonServerUrl?: string;
    version: string;
}

export class NeonGTDConfig {
    static get(): NeonGTDConfig {
        return {
            dashboards: {},
            datastores: {},
            errors: [],
            layouts: {},
            version: '',
            neonServerUrl: '',
            projectIcon: '',
            projectTitle: ''
        };
    }
}
