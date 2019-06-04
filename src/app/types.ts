import { NeonDashboardConfig } from './neon-gtd-config';

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
// TODO: THOR-825: rename classes/functions that still reference 'dataset' to say 'datastore' (THOR-1052)

export class FieldMetaData {
    constructor(
        public columnName: string = '',
        public prettyName: string = '',
        public hide: boolean = false,
        public type: string = ''
    ) { }
}

export class TableMetaData {
    constructor(
        public name: string = '',
        public prettyName: string = '',
        public fields: FieldMetaData[] = [],
        public mappings: Record<string, string> = {},
        public labelOptions: any = {}
    ) { }
}

export class DatabaseMetaData {
    constructor(
        public name: string = '',
        public prettyName: string = '',
        public tables: Record<string, TableMetaData> = {}
    ) { }
}

/*
TODO: THOR-825: This was turned into Datastore -- leaving old commented out
version here along with comments on updates made for reference until all
THOR-825 related tasks are complete.

export class Dataset {
    public connectOnLoad: boolean = false;
    public databases: DatabaseMetaData[] = [];
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

/**
 * Class to represent dashboards object from the config file.
 */
export class Dashboard {
    public layout?: string = '';
    public filters?: any[] = [];
    public visualizationTitles?: { [key: string]: string } = {};

    public fullTitle?: string; // Added to dashboard in validateDashboards()
    public pathFromTop?: string[]; // Added to dashboard in validateDashboards() - contains keys
    // The datastores and layoutObject properties are assigned by the DashboardService.
    public layoutObject?: (any[] | { [key: string]: any[] });
}

export interface Dashboard extends NeonDashboardConfig { }

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
    database: DatabaseMetaData;
    table: TableMetaData;
    field: FieldMetaData;
}
