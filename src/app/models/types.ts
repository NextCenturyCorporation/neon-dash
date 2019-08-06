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

import { ColorMap } from './color';
import { DeepPartial, NeonDatastoreConfig, translateValues } from './dataset';

export interface NeonSimpleSearchFilter {
    placeHolder?: string;
    tableKey: string;
    fieldKey: string;

    // Used at runtime
    tableName?: string;
    databaseName?: string;
    fieldName?: string;
}

export interface NeonCustomRequests {
    // Endpoint link
    endpoint: string;
    // Pretty name
    pretty: string;
    // Body properties
    properties?: PropertyMetaData[];
    // Type like GET, POST, PUT, or DELETE
    type?: string;
    // Response status (not in config file)
    status?: any;
    // Response data (not in config file)
    response?: any;
}

export interface PropertyMetaData {
    // Property name
    name: string;
    // Pretty name
    pretty: string;
    // Input value
    value?: string;
}

export interface NeonDashboardOptions {
    connectOnLoad?: boolean;
    colorMaps?: ColorMap;
    customRequests?: NeonCustomRequests[];
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
    root: string;
    datastore: string;
    database: string;
    table: string;
    field: string;
    operator: string;
    value?: any;
}

export interface CompoundFilterConfig {
    root: string;
    type: 'and' | 'or';
    filters: (SimpleFilterConfig | CompoundFilterConfig)[];
}

export type FilterConfig = SimpleFilterConfig | CompoundFilterConfig;

export interface NeonDashboardBaseConfig {
    fullTitle?: string; // Added to dashboard in validateDashboards()
    name?: string;
}

export interface NeonDashboardLeafConfig extends NeonDashboardBaseConfig {
    layout: string;
    tables: Record<string, string>;
    fields: Record<string, string>;
    filters: FilterConfig[] | string;
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
