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
var FieldMetaData = /** @class */ (function () {
    function FieldMetaData(columnName, prettyName, hide, type) {
        this.columnName = '';
        this.prettyName = '';
        this.columnName = columnName || '';
        this.prettyName = prettyName || '';
        this.hide = hide || false;
        this.type = type || '';
    }
    return FieldMetaData;
}());
export { FieldMetaData };
var TableMetaData = /** @class */ (function () {
    function TableMetaData(name, prettyName, fields, mappings) {
        this.name = '';
        this.prettyName = '';
        this.name = name || '';
        this.prettyName = prettyName || '';
        this.fields = fields || [];
        this.mappings = mappings || {};
    }
    return TableMetaData;
}());
export { TableMetaData };
var DatabaseMetaData = /** @class */ (function () {
    function DatabaseMetaData(name, prettyName) {
        this.name = '';
        this.prettyName = '';
        this.name = name || '';
        this.prettyName = prettyName || '';
        this.tables = [];
    }
    return DatabaseMetaData;
}());
export { DatabaseMetaData };
var DatasetOptions = /** @class */ (function () {
    function DatasetOptions() {
    }
    return DatasetOptions;
}());
export { DatasetOptions };
var RelationTableMetaData = /** @class */ (function () {
    function RelationTableMetaData() {
    }
    return RelationTableMetaData;
}());
export { RelationTableMetaData };
var RelationMetaData = /** @class */ (function () {
    function RelationMetaData() {
    }
    return RelationMetaData;
}());
export { RelationMetaData };
var SimpleFilter = /** @class */ (function () {
    function SimpleFilter(databaseName, tableName, fieldName, placeHolder, icon) {
        this.databaseName = databaseName;
        this.tableName = tableName;
        this.fieldName = fieldName;
        this.placeHolder = placeHolder;
        this.icon = icon;
    }
    return SimpleFilter;
}());
export { SimpleFilter };
var Dataset = /** @class */ (function () {
    function Dataset(name, datastore, hostname) {
        this.name = '';
        this.datastore = '';
        this.hostname = '';
        this.connectOnLoad = false;
        this.databases = [];
        this.hasUpdatedFields = false;
        this.layout = '';
        this.options = new DatasetOptions();
        this.mapLayers = undefined;
        this.mapConfig = undefined;
        this.relations = [];
        this.linkyConfig = undefined;
        this.dateFilterKeys = undefined;
        this.lineCharts = undefined;
        this.name = name;
        this.datastore = datastore;
        this.hostname = hostname;
    }
    return Dataset;
}());
export { Dataset };
//# sourceMappingURL=dataset.js.map