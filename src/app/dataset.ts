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
export class FieldMetaData {
    constructor(
        public columnName: string = '',
        public prettyName: string = '',
        public hide: boolean = false,
        public type: string = ''
    ) {}
}

export const EMPTY_FIELD = new FieldMetaData();

export class TableMetaData {
    constructor(
        public name: string = '',
        public prettyName: string = '',
        public fields: FieldMetaData[] = [],
        public mappings: TableMappings = {},
        public labelOptions: TableMappings = {}
    ) {}
}

export class DatabaseMetaData {
    constructor(
        public name: string = '',
        public prettyName: string = '',
        public tables: TableMetaData[] = []
    ) {}
}

export class DatasetOptions {
    colorMaps?: Object;
    requeryInterval?: number;
    simpleFilter?: SimpleFilter;
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
        public icon?: string
    ) {}
}

// TODO: 825: turning this into Datastore
export class Dataset {
    public connectOnLoad: boolean = false;
    public databases: DatabaseMetaData[] = [];
    public hasUpdatedFields: boolean = false;
    public layout: string = ''; // TODO: 825: layout will be specified in dashboards
    public options: DatasetOptions = new DatasetOptions(); // TODO: 825: might move this -- leave this alone for now
    public relations: Relation[] = []; // TODO: 825: this will move into dashboards

    constructor(
        public name: string = '',
        public datastore: string = '', // TODO: 825: this will become 'type'
        public hostname: string = '', // TODO: 825: this will change to 'host'
        public title: string = '', // TODO: 825: move this into layout or dashboards
        public icon: string = '' // TODO: 825: move this into layout or dashboards
    ) {}
}

/**
 * Represents a single datastore from the datastores key/value pairs in the config file.
 */
export class Datastore {
    public connectOnLoad: boolean = false;
    public databases: DatabaseMetaData[] = [];
    public hasUpdatedFields: boolean = false;
    public options: DatasetOptions = new DatasetOptions(); // TODO: 825: might move this -- leave this alone for now

    constructor(
        public name: string = '',
        public host: string = '',
        public type: string = ''
    ) {}
}

/**
 * Represents the entire dashboards object from the config file.
 */
export class DashboardWrapper {
    public category: string = '';
    public choices: Map<string, Dashboard> = new Map<string, Dashboard>();
}

/**
 * Represents a single dashboard within the first nested instance of choices in the config file.
 */
export class Dashboard {
    public category: string = '';
    public name: string = '';
    public choices: Map<string, DashboardChoice> = new Map<string, DashboardChoice>();
}

/**
 * Represents a single choice within the second nested instance of choices in the config file.
 */
export class DashboardChoice {
    public category: string = '';
    public name: string = '';
    public choices: Map<string, DashboardConfigChoice> = new Map<string, DashboardConfigChoice>();
}

/**
 * Represents a single choice within the final nested instance of choices in the config file,
 * which includes the table keys and field keys that the associated layout will use.
 */
export class DashboardConfigChoice {
    public name: string = '';
    // TODO: 825: temporary link for dashboards and datastores until UI is updated
    public datastore: string = ''; // TODO: 825: temporary until table/field keys are used and multiple connections are supported
    public layout: string = '';
    public tables: Map<string, string> = new Map<string, string>();
    public fields: Map<string, string> = new Map<string, string>();
    public options: Map<string, string> = new Map<string, string>(); // TODO: 825: Placeholder if additional options needed here later
}

export class Relation {
    members: {
        database: string,
        table: string,
        field: string
    }[];
}

export const MediaTypes = {
    image: 'img',
    video: 'vid',
    html: 'htm',
    pdf: 'pdf',
    audio: 'aud'
};
