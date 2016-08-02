export class FieldMetaData {
    name: string;
    prettyName: string;
}

export class TableMetaData {
    name: string;
    prettyName: string;
    fields: FieldMetaData[];
    mappings: string[];
}

export class DatabaseMetaData {
    name: string;
    prettyName: string;
    tables: TableMetaData[];
}

export class Dataset {
    name: string;
    datastore: string;
    hostname: string;
    databases: DatabaseMetaData[] = [];
    layout: Object;
    options: Object;
    mapLayers: Object[];
    mapConfig: Object;
    relations: Object[];
    linkyConfig: Object;
    dateFilterKeys: Object;
    lineCharts: Object[];
}
