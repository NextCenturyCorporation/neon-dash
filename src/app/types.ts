/**
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
// TODO: THOR-825: rename classes/functions that still reference 'dataset' to say 'datastore' (THOR-1052)

export interface NeonFieldMetaData {
    columnName: string;
    prettyName: string;
    hide: boolean;
    type: string;
}

export class NeonFieldMetaData {
    static get(field: Partial<NeonFieldMetaData> = {}) {
        return {
            columnName: '',
            prettyName: '',
            hide: false,
            type: '',
            ...field
        };
    }
}

export interface NeonTableMetaData {
    name?: string;
    prettyName: string;
    fields: NeonFieldMetaData[];
    mappings: Record<string, string>;
    labelOptions: Record<string, any | Record<string, any>>;
}

export class NeonTableMetaData {
    static get(table: Partial<NeonTableMetaData> = {}) {
        return {
            name: '',
            prettyName: '',
            fields: [],
            mappings: {},
            labelOptions: {},
            ...table
        };
    }
}

export interface NeonDatabaseMetaData {
    name?: string;
    prettyName: string;
    tables: Record<string, NeonTableMetaData>;
}

export class NeonDatabaseMetaData {
    static get(db: Partial<NeonDatabaseMetaData> = {}) {
        return {
            name: '',
            prettyName: '',
            tables: {},
            ...db
        };
    }
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
    fullTitle?: string; // Added to dashboard in validateDashboards()
    pathFromTop?: string[]; // Added to dashboard in validateDashboards() - contains keys

    name?: string;
    layout?: string;
    tables?: Record<string, string>;
    fields?: Record<string, string>;
    filters?: any[];
    visualizationTitles?: Record<string, string>;
    options?: NeonDashboardOptions;
    relations?: (string | string[])[][];
    contributors?: Record<string, NeonContributor>;
}

export interface NeonDashboardParentConfig {
    name?: string;
    // Interior
    category?: string;
    choices?: Record<string, NeonDashboardConfig>;

}

export interface NeonDashboardConfig extends NeonDashboardLeafConfig, NeonDashboardParentConfig { }

export class NeonDashboardConfig {
    static get(dash: Partial<NeonDashboardConfig> = {}): NeonDashboardConfig {
        return {
            layout: '',
            filters: [],
            fields: {},
            tables: {},
            visualizationTitles: {},
            contributors: {},
            choices: {},
            fullTitle: '',
            pathFromTop: [],
            ...dash
        };
    }
}


export interface NeonLayoutGridConfig {
    col: number;
    row: number;
    sizex: number;
    sizey: number;
}

export interface NeonLayoutConfig extends NeonLayoutGridConfig {
    name?: string;
    type: string;
    bindings?: Record<string, any>;

}

export interface NeonDatastoreConfig {
    name?: string;
    host: string;
    type: string;
    databases: Record<string, NeonDatabaseMetaData>;
}

export class NeonDatastoreConfig {
    static get(config: Partial<NeonDatastoreConfig> = {}) {
        return {
            name: '',
            host: '',
            type: '',
            databases: {},
            ...config
        };
    }
}

export interface NeonConfig {
    projectTitle?: string;
    projectIcon?: string;
    fileName?: string;
    lastModified?: number;
    modified?: boolean;

    datastores: Record<string, NeonDatastoreConfig>;
    dashboards: NeonDashboardConfig;
    layouts: Record<string, NeonLayoutConfig[]>;
    errors?: string[];
    neonServerUrl?: string;
    version: string;
}

export class NeonConfig {
    static get(config: Partial<NeonConfig> = {}): NeonConfig {
        return {
            dashboards: {},
            datastores: {},
            errors: [],
            layouts: {},
            version: '',
            neonServerUrl: '',
            projectIcon: '',
            projectTitle: '',
            ...config
        };
    }
}


/*
TODO: THOR-825: This was turned into Datastore -- leaving old commented out
version here along with comments on updates made for reference until all
THOR-825 related tasks are complete.

export class Dataset {
    public connectOnLoad: boolean = false;
    public databases: NeonDatabase[] = [];
    public hasUpdatedFields: boolean = false;
    public layout: string = ''; // layouts are now specified in dashboards
    //public options: DatasetOptions = new DatasetOptions(); moved to DashboardOptions

    constructor(
        public name: string = '',
        public datastore: string = '', // this became 'type'
        public hostname: string = '', // this was updated to 'host'
        public title: string = '', // renamed projectTitle, moved to base level of config file and read in within app.component.ts
        public icon: string = '' // renamed projectIcon, moved to base level of config file and read in within app.component.ts
    ) {}
}*/

export const MediaTypes = {
    image: 'img',
    video: 'vid',
    html: 'htm',
    pdf: 'pdf',
    audio: 'aud',
    maskImage: 'mask'
};

export interface SingleField {
    datastore: string;
    database: NeonDatabaseMetaData;
    table: NeonTableMetaData;
    field: NeonFieldMetaData;
}
