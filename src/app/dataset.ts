export class FieldMetaData {
    columnName: string;
    prettyName: string;
}

export class TableMetaData {
    name: string;
    prettyName: string;
    fields: FieldMetaData[];
    mappings: TableMappings;
}

export class DatabaseMetaData {
    name: string;
    prettyName: string;
    tables: TableMetaData[];
}

export class DatasetOptions {
    colorMaps: Object;
    requeryInterval: number;
}

export interface TableMappings {
    [key: string]: string;
}

export class Dataset {
    name: string;
    datastore: string;
    hostname: string;
    databases: DatabaseMetaData[] = [];
    hasUpdatedFields: boolean;
    layout: string;
    options: DatasetOptions;
    mapLayers: Object[];
    mapConfig: Object;
    relations: Object[];
    linkyConfig: Object;
    dateFilterKeys: Object;
    lineCharts: Object[];
}
