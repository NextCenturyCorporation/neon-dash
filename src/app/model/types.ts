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

// This is a recursive mapped type (https://www.typescriptlang.org/docs/handbook/advanced-types.html#mapped-types)
//  that makes all fields optional but type checked (either it's missing or it's the correct type)

type DeepPartial<T> = {
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

function translateValues<T>(obj: Record<string, Partial<T>>, transform: (input: Partial<T>) => T, applyNames = false): Record<string, T> {
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
    name?: string;
    prettyName: string;
    fields: NeonFieldMetaData[];
    mappings: Record<string, string>;
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

export interface NeonSimpleSearchFilter {
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
    simpleFilter?: NeonSimpleSearchFilter;
}

export interface NeonContributor {
    orgName: string;
    abbreviation: string;
    contactName: string;
    contactEmail: string;
    website: string;
    logo: string;
}

export interface SimpleFilterConfig {
    name: string;
    root: string;
    datastore: string;
    database: string;
    table: string;
    field: string;
    operator: string;
    value?: any;
}

export interface CompoundFilterConfig {
    name: string;
    root: string;
    type: 'and' | 'or';
    filters: (SimpleFilterConfig | CompoundFilterConfig)[];
}

export type FilterConfig = SimpleFilterConfig | CompoundFilterConfig;

export interface NeonDashboardBaseConfig {
    fullTitle?: string; // Added to dashboard in validateDashboards()
    pathFromTop?: string[]; // Added to dashboard in validateDashboards() - contains keys
    name?: string;
}

export interface NeonDashboardLeafConfig extends NeonDashboardBaseConfig {
    layout: string;
    tables: Record<string, string>;
    fields: Record<string, string>;
    filters: FilterConfig[];
    visualizationTitles: Record<string, string>;
    options: NeonDashboardOptions;
    relations: (string | string[])[][];
    contributors: Record<string, NeonContributor>;
}

export class NeonDashboardLeafConfig {
    static get(dash: DeepPartial<NeonDashboardLeafConfig> = {}): NeonDashboardLeafConfig {
        return {
            layout: '',
            filters: [],
            fields: {},
            tables: {},
            options: {},
            visualizationTitles: {},
            contributors: {},
            fullTitle: '',
            pathFromTop: [],
            ...dash
        } as NeonDashboardLeafConfig;
    }
}

export interface NeonDashboardChoiceConfig extends NeonDashboardBaseConfig {
    category?: string;
    choices?: Record<string, NeonDashboardLeafConfig | NeonDashboardChoiceConfig>;
}

export class NeonDashboardChoiceConfig {
    static get(dash: DeepPartial<NeonDashboardChoiceConfig> = {}): NeonDashboardChoiceConfig {
        return {
            fullTitle: '',
            pathFromTop: [],
            ...dash,
            choices: translateValues(dash.choices || {}, NeonDashboardUtil.get.bind(null), true)
        } as NeonDashboardChoiceConfig;
    }
}

export type NeonDashboardConfig = NeonDashboardLeafConfig | NeonDashboardChoiceConfig;

class NeonDashboardUtil {
    static get(dashboard: NeonDashboardConfig) {
        if (!dashboard) {
            return {};
        } else if ('choices' in dashboard) {
            return NeonDashboardChoiceConfig.get(dashboard);
        }
        return NeonDashboardLeafConfig.get(dashboard);
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

export interface NeonConfig {
    projectTitle?: string;
    projectIcon?: string;
    fileName?: string;
    lastModified?: number;
    modified?: boolean;

    datastores: Record<string, NeonDatastoreConfig>;
    dashboards: NeonDashboardConfig;
    layouts: Record<string, NeonLayoutConfig[]> | Record<string, Record<string, NeonLayoutConfig[]>>;
    errors?: string[];
    neonServerUrl?: string;
    version: string;
}

export class NeonConfig {
    static get(config: DeepPartial<NeonConfig> = {}): NeonConfig {
        return {
            errors: [],
            layouts: {},
            version: '',
            neonServerUrl: '',
            projectIcon: '',
            projectTitle: '',
            ...config,
            dashboards: NeonDashboardUtil.get(config.dashboards || {}),
            datastores: translateValues(config.datastores || {}, NeonDatastoreConfig.get.bind(null), true)
        } as NeonConfig;
    }
}

/*
TODO: THOR-825: This was turned into Datastore -- leaving old commented out
version here along with comments on updates made for reference until all
THOR-825 related tasks are complete.

export class Dataset {
    public connectOnLoad: boolean = false;
    public databases: NeonDatabase[] = [];
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
