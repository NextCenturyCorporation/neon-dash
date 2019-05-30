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
    ) {}
}

export class TableMetaData {
    constructor(
        public name: string = '',
        public prettyName: string = '',
        public fields: FieldMetaData[] = [],
        public mappings: TableMappings = {},
        public labelOptions: any = {}
    ) {}
}

export class DatabaseMetaData {
    constructor(
        public name: string = '',
        public prettyName: string = '',
        public tables: TableMetaData[] = []
    ) {}
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

export class SimpleFilter {
    constructor(
        public databaseName: string,
        public tableName: string,
        public fieldName: string,
        public placeHolder?: string,
        public icon?: string,
        public tableKey?: string,
        public fieldKey?: string
    ) {}
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
 * Represents a single datastore from the datastores key/value pairs in the config file.
 */
export class Datastore {
    public databases: DatabaseMetaData[] = [];
    public hasUpdatedFields: boolean = false;

    constructor(
        public name: string = '',
        public host: string = '', // Formerly hostname
        public type: string = '' // Type of datastore (mongo, elasticsearch, etc.)
    ) {}
}

/**
 * Class to represent dashboards object from the config file.
 */
export class Dashboard {
    public fileName?: string;
    public lastModified?: number;
    public modified?: boolean;

    public name?: string = '';
    // Exist in Dashboards that are not terminal nodes.
    public category?: string = '';
    public choices?: { [key: string]: Dashboard } = {};
    // Exist in Dashboards that are terminal nodes.
    public layout?: string = '';
    public tables?: { [key: string]: string } = {};
    public fields?: { [key: string]: string } = {};
    public filters?: any[] = [];
    public visualizationTitles?: { [key: string]: string } = {};
    public options?: DashboardOptions = new DashboardOptions();
    public fullTitle?: string; // Added to dashboard in validateDashboards()
    public pathFromTop?: string[]; // Added to dashboard in validateDashboards() - contains keys
    // (sans choices object references) needed to traverse back up Dashboard object
    public relations?: (string | string[])[][];
    public contributors?: { [key: string]: Contributor } = {};
    // The datastores and layoutObject properties are assigned by the DatasetService.
    public datastores?: Datastore[] = [];
    public layoutObject?: (any[] | { [key: string]: any[] }) = [];
}

/**
 * Class to represent additional dashboard options specified in the last level of nesting.
 */
export class DashboardOptions {
    public connectOnLoad?: boolean = false;
    public colorMaps?: Record<string, any>;
    public simpleFilter?: SimpleFilter;
}

export class Contributor {
    public orgName: string;
    public abbreviation: string;
    public contactName: string;
    public contactEmail: string;
    public website: string;
    public logo: string;
}

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
