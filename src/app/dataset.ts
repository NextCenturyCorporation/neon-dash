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

// TODO: 825: this will change, or maybe not (databases and tables can probably remain,
// but how we'd get those properties from config might change???)
export class Dataset {
    public connectOnLoad: boolean = false;
    public databases: DatabaseMetaData[] = [];
    public hasUpdatedFields: boolean = false;
    public layout: string = ''; // TODO: 825: layout will be specified in options
    public options: DatasetOptions = new DatasetOptions(); // TODO: 825: might move this -- leave this alone for now
    public relations: Relation[] = []; // TODO: 825: this will move into options

    constructor(
        public name: string = '',
        public datastore: string = '', // TODO: 825: this will become 'type'
        public hostname: string = '', // TODO: 825: this will change to 'host'
        public title: string = '', // TODO: 825: move this into layout or options
        public icon: string = '' // TODO: 825: move this into layout or options
    ) {}
}

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

export class Dashboard {
    public prettyName: string = '';
    public choices: { [key: string]: DashboardChoice } = {};
}

export class DashboardChoice {
    public prettyName: string = '';
    public choices: { [key: string ]: DashboardDatastoreChoice } = {};
}

// TODO: 825: find better name??
// DashboardConfigChoice?

export class DashboardDatastoreChoice {
    public prettyName: string = '';
    // TODO: 825: temporary link for dashboards and datastores until UI is updated
    public datastore: string = ''; // TODO: 825: temporary until table/field keys are used and multiple connections are supported
    public layout: string = '';
    public tables: {[key: string]: string } = {};
    public fields: {[key: string]: string } = {};
    public options: {[key: string]: string } = {}; // TODO: 825
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
