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

import {
    ColorMap,
    CompoundFilterType,
    DatastoreConfig,
    DeepPartial,
    translateValues
} from '@caci-critical-insight-solutions/nucleus-core';

export interface CommonFilterConfig {
    id?: string;
    relations?: string[];
}

export interface SimpleFilterConfig extends CommonFilterConfig {
    datastore: string;
    database: string;
    table: string;
    field: string;
    operator: string;
    value?: any;
}

export interface CompoundFilterConfig extends CommonFilterConfig {
    filters: FilterConfig[];
    type: CompoundFilterType;
}

export interface BoundsFilterConfig extends CommonFilterConfig {
    begin1: any;
    begin2: any;
    fieldKey1: string;
    fieldKey2: string;
    end1: any;
    end2: any;
}

export interface DomainFilterConfig extends CommonFilterConfig {
    begin: any;
    fieldKey: string;
    end: any;
}

export interface ListFilterConfig extends CommonFilterConfig {
    fieldKey: string;
    operator: string;
    type: CompoundFilterType;
    values: any[];
}

export interface PairFilterConfig extends CommonFilterConfig {
    fieldKey1: string;
    fieldKey2: string;
    operator1: string;
    operator2: string;
    type: CompoundFilterType;
    value1: any;
    value2: any;
}

export type FilterConfig = SimpleFilterConfig | CompoundFilterConfig | BoundsFilterConfig | DomainFilterConfig | ListFilterConfig |
PairFilterConfig;

export interface NeonSimpleSearchFilter {
    placeHolder?: string;
    fieldKey: string;

    // Used at runtime
    tableName?: string;
    databaseName?: string;
    fieldName?: string;
}

export interface NeonCustomRequests {
    // Adds the current timestamp to the body using the specified property name
    date?: string;
    // Endpoint link
    endpoint: string;
    // Adds a unique ID to the body using the specified property name
    id?: string;
    // Optional notes to user
    notes?: string[];
    // Pretty name to show to user
    pretty: string;
    // Body properties
    properties?: PropertyMetaData[];
    // Type like GET, POST, PUT, or DELETE (assumes POST if properties exist or GET otherwise)
    type?: string;
    // Response data (not in config file)
    response?: any;
    // Show the response JSON
    showResponse?: boolean;
    // Response status (not in config file)
    status?: any;
}

export interface PropertyMetaData {
    // List of dropdown choices (if not specified, shows a text input element)
    choices?: { pretty: string, value: string }[];
    // Property name to save in body
    name: string;
    // Pretty name to show to user
    pretty: string;
    // Input value from user (not in config file)
    value?: string;
}

export interface NeonDashboardOptions {
    connectOnLoad?: boolean;
    colorMaps?: ColorMap;
    customRequests?: NeonCustomRequests[];
    customRequestsDisplayLabel?: string;
    hideFilterValues?: boolean;
    simpleFilter?: NeonSimpleSearchFilter;
}

export interface NeonContributor {
    abbreviation: string;
    orgName?: string;
    contactName?: string;
    contactEmail?: string;
    website?: string;
    logo?: string;
    description?: string;
}

export interface NeonDashboardBaseConfig {
    fullTitle?: string[]; // The fullTitle is added to the dashboard object during runtime.
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
            fullTitle: [],
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
            fullTitle: [],
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
    datastores: Record<string, DatastoreConfig>;
    dashboards?: NeonDashboardConfig;
    layouts?: Record<string, NeonLayoutConfig[]> | Record<string, Record<string, NeonLayoutConfig[]>>;

    about?: any;
    dataLabels?: any[];
    errors?: any[];
    fileName?: string;
    hideImport?: boolean;
    lastModified?: number;
    modified?: boolean;
    neonServerUrl?: string;
    neonTools?: any;
    projectIcon?: string;
    projectTitle?: string;
    theme?: string;
    version?: string;
}

export class NeonConfig {
    static get(config: DeepPartial<NeonConfig> = {}): NeonConfig {
        return {
            about: '',
            dataLabels: [],
            errors: [],
            hideImport: false,
            layouts: {},
            neonServerUrl: '',
            neonTools: {},
            projectIcon: '',
            projectTitle: '',
            theme: '',
            version: '',
            ...config,
            dashboards: NeonDashboardUtil.get(config.dashboards || {}),
            datastores: translateValues(config.datastores || {}, DatastoreConfig.get.bind(null), true)
        } as NeonConfig;
    }
}

export const MediaTypes = {
    audio: 'aud',
    html: 'html',
    image: 'img',
    maskImage: 'mask',
    pdf: 'pdf',
    video: 'vid',
    youtube: 'youtube'
};
