var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
import { Inject, Injectable } from '@angular/core';
import * as neon from 'neon-framework';
import { Dataset, FieldMetaData } from '../dataset';
import { Observable } from 'rxjs/Rx';
import { NeonGTDConfig } from '../neon-gtd-config';
import * as _ from 'lodash';
var DatasetService = /** @class */ (function () {
    function DatasetService(config) {
        this.config = config;
        this.datasets = [];
        // The active dataset.
        this.dataset = new Dataset();
        this.datasets = (config.datasets ? config.datasets : []);
        this.messenger = new neon.eventing.Messenger();
        this.datasets.forEach(function (dataset) {
            DatasetService_1.validateDatabases(dataset);
        });
    }
    DatasetService_1 = DatasetService;
    // ---
    // STATIC METHODS
    // --
    DatasetService.removeFromArray = function (array, indexList) {
        indexList.forEach(function (index) {
            array.splice(index, 1);
        });
    };
    DatasetService.validateFields = function (table) {
        var indexListToRemove = [];
        table.fields.forEach(function (field, index) {
            if (!field.columnName) {
                indexListToRemove.push(index);
            }
            else {
                field.prettyName = field.prettyName || field.columnName;
            }
        });
        this.removeFromArray(table.fields, indexListToRemove);
    };
    DatasetService.validateTables = function (database) {
        var indexListToRemove = [];
        database.tables.forEach(function (table, index) {
            if (!table.name) {
                indexListToRemove.push(index);
            }
            else {
                table.prettyName = table.prettyName || table.name;
                table.fields = table.fields || [];
                table.mappings = table.mappings || {};
                DatasetService_1.validateFields(table);
            }
        });
        this.removeFromArray(database.tables, indexListToRemove);
    };
    DatasetService.validateDatabases = function (dataset) {
        var indexListToRemove = [];
        dataset.dateFilterKeys = {};
        dataset.databases.forEach(function (database, index) {
            if (!(database.name || database.tables || database.tables.length)) {
                indexListToRemove.push(index);
            }
            else {
                database.prettyName = database.prettyName || database.name;
                DatasetService_1.validateTables(database);
                // Initialize the date filter keys map for each database/table pair.
                dataset.dateFilterKeys[database.name] = {};
                database.tables.forEach(function (table) {
                    dataset.dateFilterKeys[database.name][table.name] = {};
                });
            }
        });
        this.removeFromArray(dataset.databases, indexListToRemove);
    };
    // ---
    // PRIVATE METHODS
    // ---
    /**
     * Publishes an update data message.
     * @private
     */
    DatasetService.prototype.publishUpdateData = function () {
        this.messenger.publish(DatasetService_1.UPDATE_DATA_CHANNEL, {});
    };
    /**
     * Updates the dataset that matches the active dataset.
     */
    DatasetService.prototype.updateDataset = function () {
        for (var i = 0; i < this.datasets.length; ++i) {
            if (this.datasets[i].name === this.dataset.name) {
                this.datasets[i] = _.cloneDeep(this.dataset);
            }
        }
    };
    /**
     * Returns the list of datasets maintained by this service
     * @return {Array}
     */
    DatasetService.prototype.getDatasets = function () {
        return this.datasets;
    };
    /**
     * Adds the given dataset to the list of datasets maintained by this service and returns the new list.
     * @return {Array}
     */
    DatasetService.prototype.addDataset = function (dataset) {
        DatasetService_1.validateDatabases(dataset);
        this.datasets.push(dataset);
        return this.datasets;
    };
    /**
     * Sets the active dataset to the given dataset.
     * @param {Object} The dataset containing {String} name, {String} layout, {String} datastore, {String} hostname,
     * and {Array} databases.  Each database is an Object containing {String} name, {Array} tables, and {Array}
     * relations.  Each table is an Object containing {String} name, {Array} fields, and {Object} mappings.  Each
     * field is an Object containing {String} columnName and {String} prettyName.  Each mapping key is a unique
     * identifier used by the visualizations and each value is a field name.  Each relation is an Object with table
     * names as keys and field names as values.
     */
    DatasetService.prototype.setActiveDataset = function (dataset) {
        this.dataset.name = dataset.name || 'Unknown Dataset';
        this.dataset.layout = dataset.layout || '';
        this.dataset.datastore = dataset.datastore || '';
        this.dataset.hostname = dataset.hostname || '';
        this.dataset.databases = dataset.databases || [];
        this.dataset.options = dataset.options || {};
        this.dataset.mapLayers = dataset.mapLayers || [];
        this.dataset.mapConfig = dataset.mapConfig || {};
        this.dataset.relations = dataset.relations || [];
        this.dataset.linkyConfig = dataset.linkyConfig || {};
        this.dataset.dateFilterKeys = dataset.dateFilterKeys;
        this.dataset.lineCharts = dataset.lineCharts || [];
        // Shutdown any previous update intervals.
        if (this.updateInterval) {
            this.updateSubscription.unsubscribe();
            delete this.updateSubscription;
            delete this.updateInterval;
        }
        if (this.dataset.options.requeryInterval) {
            var delay = Math.max(0.5, this.dataset.options.requeryInterval) * 60000;
            var me_1 = this;
            this.updateInterval = Observable.interval(delay);
            this.updateSubscription = this.updateInterval.subscribe(function () {
                me_1.publishUpdateData();
            });
        }
    };
    /**
     * Returns the active dataset object
     * @return {Object}
     */
    DatasetService.prototype.getDataset = function () {
        return this.getDatasetWithName(this.dataset.name) || this.dataset;
    };
    /**
     * Returns whether a dataset is active.
     * @return {Boolean}
     */
    DatasetService.prototype.hasDataset = function () {
        return (this.dataset.datastore && this.dataset.hostname && (this.dataset.databases.length > 0));
    };
    /**
     * Returns the name of the active dataset.
     * @return {String}
     */
    DatasetService.prototype.getName = function () {
        return this.dataset.name;
    };
    /**
     * Returns the layout name for the active dataset.
     * @return {String}
     */
    DatasetService.prototype.getLayout = function () {
        return this.dataset.layout;
    };
    /**
     * Returns all of the layouts.
     */
    DatasetService.prototype.getLayouts = function () {
        return this.config.layouts;
    };
    /**
     * Sets the layout name for the active dataset.
     * @param {String} layoutName
     */
    DatasetService.prototype.setLayout = function (layoutName) {
        this.dataset.layout = layoutName;
        this.updateDataset();
    };
    /**
     * Returns the datastore for the active dataset.
     * @return {String}
     */
    DatasetService.prototype.getDatastore = function () {
        return this.dataset.datastore;
    };
    /**
     * Returns the hostname for the active dataset.
     * @return {String}
     */
    DatasetService.prototype.getHostname = function () {
        return this.dataset.hostname;
    };
    /**
     * Returns the databases for the active dataset.
     * @return {Array}
     */
    DatasetService.prototype.getDatabases = function () {
        return this.dataset.databases;
    };
    /**
     * Returns the dataset with the given name or undefined if no such dataset exists.
     * @param {String} The dataset name
     * @return {Object} The dataset object if a match exists or undefined otherwise.
     */
    DatasetService.prototype.getDatasetWithName = function (datasetName) {
        for (var _i = 0, _a = this.datasets; _i < _a.length; _i++) {
            var dataset = _a[_i];
            if (dataset.name === datasetName) {
                return dataset;
            }
        }
        return undefined;
    };
    /**
     * Returns the database with the given name or an Object with an empty name if no such database exists in the dataset.
     * @param {String} The database name
     * @return {Object} The database containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     */
    DatasetService.prototype.getDatabaseWithName = function (databaseName) {
        for (var _i = 0, _a = this.dataset.databases; _i < _a.length; _i++) {
            var database = _a[_i];
            if (database.name === databaseName) {
                return database;
            }
        }
        return undefined;
    };
    /**
     * Returns the tables for the database with the given name in the active dataset.
     * @param {String} The database name
     * @return {Array} An array of table Objects containing {String} name, {Array} fields, and {Array} mappings.
     */
    DatasetService.prototype.getTables = function (databaseName) {
        var database = this.getDatabaseWithName(databaseName);
        return database ? database.tables : [];
    };
    /**
     * Returns the table with the given name or an Object with an empty name if no such table exists in the database with the given name.
     * @param {String} The database name
     * @param {String} The table name
     * @return {Object} The table containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     */
    DatasetService.prototype.getTableWithName = function (databaseName, tableName) {
        var tables = this.getTables(databaseName);
        for (var _i = 0, tables_1 = tables; _i < tables_1.length; _i++) {
            var table = tables_1[_i];
            if (table.name === tableName) {
                return table;
            }
        }
        return undefined;
    };
    /**
     * Returns a map of database names to an array of table names within that database.
     * @return {Object}
     */
    DatasetService.prototype.getDatabaseAndTableNames = function () {
        var databases = this.getDatabases();
        var names = {};
        for (var _i = 0, databases_1 = databases; _i < databases_1.length; _i++) {
            var database = databases_1[_i];
            names[database.name] = [];
            var tables = this.getTables(database.name);
            for (var _a = 0, tables_2 = tables; _a < tables_2.length; _a++) {
                var table = tables_2[_a];
                names[database.name].push(table.name);
            }
        }
        return names;
    };
    /**
     * Returns the the first table in the database with the given name containing all the given mappings.
     * @param {String} The database name
     * @param {Array} The array of mapping keys that the table must contain.
     * @return {String} The name of the table containing {String} name, {Array} fields, and {Object} mappings if a match exists
     * or undefined otherwise.
     */
    DatasetService.prototype.getFirstTableWithMappings = function (databaseName, keys) {
        var tables = this.getTables(databaseName);
        for (var _i = 0, tables_3 = tables; _i < tables_3.length; _i++) {
            var table = tables_3[_i];
            var success = true;
            for (var _a = 0, keys_1 = keys; _a < keys_1.length; _a++) {
                var key = keys_1[_a];
                if (!(table.mappings[key])) {
                    success = false;
                    break;
                }
            }
            if (success) {
                return table;
            }
        }
        return undefined;
    };
    /**
     * Returns an object containing the first database, table, and fields found in the active dataset with all the given mappings.
     * @param {Array} The array of mapping keys that the database and table must contain.
     * @return {Object} An object containing {String} database, {String} table,
     * and {Object} fields linking {String} mapping to {String} field.
     * If no match was found, an empty object is returned instead.
     */
    DatasetService.prototype.getFirstDatabaseAndTableWithMappings = function (keys) {
        for (var _i = 0, _a = this.dataset.databases; _i < _a.length; _i++) {
            var database = _a[_i];
            for (var _b = 0, _c = database.tables; _b < _c.length; _b++) {
                var table = _c[_b];
                var success = true;
                var fields = {};
                if (keys && keys.length > 0) {
                    for (var _d = 0, keys_2 = keys; _d < keys_2.length; _d++) {
                        var key = keys_2[_d];
                        if (table.mappings[key]) {
                            fields[key] = table.mappings[key];
                        }
                        else {
                            success = false;
                        }
                    }
                }
                if (success) {
                    return {
                        database: database.name,
                        table: table.name,
                        fields: fields
                    };
                }
            }
        }
        return {};
    };
    /**
     * Returns the field objects for the database and table with the given names.
     * @param {String} The database name
     * @param {String} The table name
     * @return {Array} The array of field objects if a match exists or an empty array otherwise.
     */
    DatasetService.prototype.getFields = function (databaseName, tableName) {
        var table = this.getTableWithName(databaseName, tableName);
        if (!table) {
            return [];
        }
        return table.fields;
    };
    /**
     * Returns a sorted copy of the array of field objects for the database and table with the given names,
     * ignoring hidden fields if specified.
     * @param {String} The database name
     * @param {String} The table name
     * @param {Boolean} Whether to ignore fields in the table marked as hidden (optional)
     * @return {Array} The sorted copy of the array of field objects if a match exists or an empty array otherwise.
     */
    DatasetService.prototype.getSortedFields = function (databaseName, tableName, ignoreHiddenFields) {
        var table = this.getTableWithName(databaseName, tableName);
        if (!table) {
            return [];
        }
        var fields = _.cloneDeep(table.fields).filter(function (field) {
            return ignoreHiddenFields ? !field.hide : true;
        });
        fields.sort(function (x, y) {
            if (!x.prettyName || !y.prettyName) {
                return 0;
            }
            // Compare field pretty names and ignore case.
            return (x.prettyName.toUpperCase() < y.prettyName.toUpperCase()) ?
                -1 : ((x.prettyName.toUpperCase() > y.prettyName.toUpperCase()) ? 1 : 0);
        });
        return fields;
    };
    /**
     * Returns the mappings for the table with the given name.
     * @param {String} The database name
     * @param {String} The table name
     * @return {Object} The mappings if a match exists or an empty object otherwise.
     */
    DatasetService.prototype.getMappings = function (databaseName, tableName) {
        var table = this.getTableWithName(databaseName, tableName);
        if (!table) {
            return {};
        }
        return table.mappings;
    };
    /**
     * Returns the mapping for the table with the given name and the given key.
     * @param {String} The database name
     * @param {String} The table name
     * @param {String} The mapping key
     * @return {String} The field name for the mapping at the given key if a match exists or an empty string
     * otherwise.
     */
    DatasetService.prototype.getMapping = function (databaseName, tableName, key) {
        var table = this.getTableWithName(databaseName, tableName);
        if (!table) {
            return '';
        }
        return table.mappings[key];
    };
    /**
     * Sets the mapping for the table with the given name at the given key to the given field name.
     * @param {String} The database name
     * @param {String} The table name
     * @param {String} The mapping key
     * @param {String} The field name for the given mapping key
     */
    DatasetService.prototype.setMapping = function (databaseName, tableName, key, fieldName) {
        var table = this.getTableWithName(databaseName, tableName);
        if (!table) {
            return;
        }
        table.mappings[key] = fieldName;
    };
    /**
     * Returns an array of relations for the given database, table, and fields.  The given table is related to another table if
     * the database contains relations mapping each given field name to the other table.
     * @param {String} The database name
     * @param {String} The table name
     * @param {Array} The array of field names
     * @return {Array} The array of relation objects which contain the table name ({String} table) and a mapping of
     * the given field names to the field names in the other tables ({Object} fields).  This array will also contain
     * the relation object for the table and fields given in the arguments
     */
    DatasetService.prototype.getRelations = function (databaseName, tableName, fieldNames) {
        var relations = this.dataset.relations;
        var initializeMapAsNeeded = function (map, key1, key2) {
            if (!(map[key1])) {
                map[key1] = {};
            }
            if (!(map[key1][key2])) {
                map[key1][key2] = [];
            }
            return map;
        };
        // First we create a mapping of a relation's database/table/field to its related fields.
        var relationToFields = {};
        // Iterate through each field to find its relations.
        fieldNames.forEach(function (fieldName) {
            // Iterate through each relation to compare with the current field.
            relations.forEach(function (relation) {
                var relationFieldNamesForInput = relation[databaseName] ? relation[databaseName][tableName] : [];
                relationFieldNamesForInput = _.isArray(relationFieldNamesForInput) ?
                    relationFieldNamesForInput : [relationFieldNamesForInput];
                // If the current relation contains a match for the input database/table/field,
                // iterate through the elements in the current relation.
                if (relationFieldNamesForInput.indexOf(fieldName) >= 0) {
                    var databaseNames = Object.keys(relation);
                    // Add each database/table/field in the current relation to the map.
                    // Note that this will include the input database/table/field.
                    databaseNames.forEach(function (relationDatabaseName) {
                        var tableNames = Object.keys(relation[relationDatabaseName]);
                        tableNames.forEach(function (relationTableName) {
                            var relationFieldNames = relation[relationDatabaseName][relationTableName];
                            relationFieldNames = _.isArray(relationFieldNames) ? relationFieldNames : [relationFieldNames];
                            relationToFields = initializeMapAsNeeded(relationToFields, relationDatabaseName, relationTableName);
                            var existingFieldIndex = relationToFields[relationDatabaseName][relationTableName].map(function (object) {
                                return object.initial;
                            }).indexOf(fieldName);
                            // If the database/table/field exists in the relation...
                            if (existingFieldIndex >= 0) {
                                relationFieldNames.forEach(function (relationFieldName) {
                                    // If the relation fields do not exist in the relation, add them to the mapping.
                                    if (relationToFields[relationDatabaseName][relationTableName][existingFieldIndex].related.indexOf(relationFieldName) < 0) {
                                        relationToFields[relationDatabaseName][relationTableName][existingFieldIndex].related.push(relationFieldName); /* tslint:disable:max-line-length */
                                    }
                                });
                            }
                            else {
                                // Else create a new object in the mapping for the database/table/field in the relation and
                                // add its related fields.
                                relationToFields[relationDatabaseName][relationTableName].push({
                                    initial: fieldName,
                                    related: [].concat(relationFieldNames)
                                });
                            }
                        });
                    });
                }
            });
        });
        var resultDatabaseNames = Object.keys(relationToFields);
        if (resultDatabaseNames.length) {
            var results_1 = [];
            // Iterate through the relations for each relation's database/table/field
            // and add a relation object for each database/table pair to the final list of results.
            resultDatabaseNames.forEach(function (resultDatabaseName) {
                var resultTableNames = Object.keys(relationToFields[resultDatabaseName]);
                resultTableNames.forEach(function (resultTableName) {
                    results_1.push({
                        database: resultDatabaseName,
                        table: resultTableName,
                        fields: relationToFields[resultDatabaseName][resultTableName]
                    });
                });
            });
            return results_1;
        }
        // If the input fields do not have any related fields in other tables,
        // return a list containing a relation object for the input database/table/fields.
        var result = {
            database: databaseName,
            table: tableName,
            fields: []
        };
        fieldNames.forEach(function (fieldName) {
            result.fields.push({
                initial: fieldName,
                related: [fieldName]
            });
        });
        return [result];
    };
    /**
     * Returns the initial configuration parameters for the map with the given name in the active dataset.
     * @param {String} name
     * @return {Object}
     */
    DatasetService.prototype.getMapConfig = function (name) {
        return this.dataset.mapConfig[name] || {};
    };
    /**
     * Sets the map layer configuration for the active dataset.
     * @param {object} config A set of layer configuration objects.
     */
    DatasetService.prototype.setMapLayers = function (config) {
        this.dataset.mapLayers = config;
        this.updateDataset();
    };
    /**
     * Adds a map layer configuration for the active dataset.
     * @param {String} name A name to map to the given layers.
     * @param {Array} layers A list of map layer configuration objects.
     */
    DatasetService.prototype.addMapLayer = function (name, layers) {
        this.dataset.mapLayers[name] = layers;
        this.updateDataset();
    };
    /**
     * Returns the map layer configuration for the map with the given name in the active dataset.
     * @return {Array}
     */
    DatasetService.prototype.getMapLayers = function (name) {
        return this.dataset.mapLayers[name] || [];
    };
    /**
     * Sets the line chart configuration for the active dataset.
     * @param {Array<Object>} config A set of line chart configuration objects.
     */
    DatasetService.prototype.setLineCharts = function (config) {
        this.dataset.lineCharts = config;
        this.updateDataset();
    };
    /**
     * Adds a line chart configuration for the active dataset.
     * @param {String} chartName A name to map to the given charts.
     * @param {Array} charts A list of line chart configuration objects.
     */
    DatasetService.prototype.addLineChart = function (chartName, charts) {
        this.dataset.lineCharts[chartName] = charts;
        this.updateDataset();
    };
    /**
     * Returns the line chart configuration for the the line chart with the given name in the active dataset.
     * @return {Array}
     */
    DatasetService.prototype.getLineCharts = function (name) {
        return this.dataset.lineCharts[name] || [];
    };
    /**
     * Returns the linky configuration for the active dataset.
     * @return {Object}
     */
    DatasetService.prototype.getLinkyConfig = function () {
        return this.dataset.linkyConfig;
    };
    /**
     * Sets the linky configuration for the active dataset.
     * @param {Object} config A linky configuration object
     * @param {Boolean} config.mentions If mentions should be linked
     * @param {Boolean} config.hashtags If hashtags should be linked
     * @param {Boolean} config.urls If URLs should be linked
     * @param {String} config.linkTo Location where mentions and hashtags
     * should be linked to. Options: "twitter", "instagram", "github"
     */
    DatasetService.prototype.setLinkyConfig = function (config) {
        this.dataset.linkyConfig = config;
    };
    /**
     * Updates the database at the given index (default 0) from the given dataset by adding undefined fields for each table.
     * @param {Object} dataset
     * @param {Object} connection
     * @param {Function} callback (optional)
     * @param {Number} index (optional)
     * @private
     */
    DatasetService.prototype.updateDatabases = function (dataset, connection, callback, index) {
        var databaseIndex = index ? index : 0;
        var database = dataset.databases[databaseIndex];
        var me = this;
        var pendingTypesRequests = 0;
        connection.getTableNamesAndFieldNames(database.name, function (tableNamesAndFieldNames) {
            Object.keys(tableNamesAndFieldNames).forEach(function (tableName) {
                var table = _.find(database.tables, function (item) {
                    return item.name === tableName;
                });
                if (table) {
                    var hasField_1 = {};
                    table.fields.forEach(function (field) {
                        hasField_1[field.columnName] = true;
                    });
                    tableNamesAndFieldNames[tableName].forEach(function (fieldName) {
                        if (!hasField_1[fieldName]) {
                            var newField = {
                                columnName: fieldName,
                                prettyName: fieldName,
                                hide: false
                            };
                            table.fields.push(newField);
                        }
                    });
                    pendingTypesRequests++;
                    connection.getFieldTypes(database.name, table.name, function (types) {
                        for (var _i = 0, _a = table.fields; _i < _a.length; _i++) {
                            var f = _a[_i];
                            if (types && types[f.columnName]) {
                                f.type = types[f.columnName];
                            }
                        }
                        pendingTypesRequests--;
                        if (dataset.hasUpdatedFields && pendingTypesRequests === 0) {
                            callback(dataset);
                        }
                    });
                }
            });
            if (++databaseIndex < dataset.databases.length) {
                me.updateDatabases(dataset, connection, callback, databaseIndex);
            }
            else if (callback) {
                dataset.hasUpdatedFields = true;
                if (pendingTypesRequests === 0) {
                    callback(dataset);
                }
            }
        });
    };
    /**
     * Returns the options for the active dataset.
     * @method getActiveDatasetOptions
     * @return {Object}
     */
    DatasetService.prototype.getActiveDatasetOptions = function () {
        return this.dataset.options;
    };
    /**
     * Returns the color maps option for the database, table, and field in the active dataset with the given names.
     * @param {String} databaseName
     * @param {String} tableName
     * @param {String} fieldName
     * @method getActiveDatasetColorMaps
     * @return {Object}
     */
    DatasetService.prototype.getActiveDatasetColorMaps = function (databaseName, tableName, fieldName) {
        var colorMaps = this.getActiveDatasetOptions().colorMaps || {};
        return colorMaps[databaseName] && colorMaps[databaseName][tableName] ? colorMaps[databaseName][tableName][fieldName] || {} : {};
    };
    /**
     * Creates and returns a new blank field object.
     * @method createBlankField
     * @return {Object}
     */
    DatasetService.prototype.createBlankField = function () {
        return new FieldMetaData();
    };
    /**
     * Returns whether the given field object is valid.
     * @param {Object} fieldObject
     * @return {Boolean}
     */
    DatasetService.prototype.isFieldValid = function (fieldObject) {
        return Boolean(fieldObject && fieldObject.columnName);
    };
    /**
     * Returns the pretty name for the given database name.
     * @param {String} databaseName
     * @return {String}
     */
    DatasetService.prototype.getPrettyNameForDatabase = function (databaseName) {
        var name = databaseName;
        this.dataset.databases.forEach(function (database) {
            if (database.name === databaseName) {
                name = database.prettyName;
            }
        });
        return name;
    };
    /**
     * Returns the pretty name for the given table name in the given database.
     * @param {String} databaseName
     * @param {String} tableName
     * @return {String}
     */
    DatasetService.prototype.getPrettyNameForTable = function (databaseName, tableName) {
        var name = tableName;
        this.getTables(databaseName).forEach(function (table) {
            if (table.name === tableName) {
                name = table.prettyName;
            }
        });
        return name;
    };
    // The Dataset Service may ask the visualizations to update their data.
    DatasetService.UPDATE_DATA_CHANNEL = 'update_data';
    DatasetService = DatasetService_1 = __decorate([
        Injectable(),
        __param(0, Inject('config')),
        __metadata("design:paramtypes", [NeonGTDConfig])
    ], DatasetService);
    return DatasetService;
    var DatasetService_1;
}());
export { DatasetService };
//# sourceMappingURL=dataset.service.js.map