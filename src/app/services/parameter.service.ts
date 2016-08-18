// 'use strict';
// /*
//  * Copyright 2016 Next Century Corporation
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  *
//  */
// import { Inject, Injectable } from '@angular/core';
// import { Dataset, DatasetOptions, DatabaseMetaData, TableMetaData, TableMappings, FieldMetaData } from '../dataset';
// import { Subscription, Observable } from 'rxjs/Rx';
// import { NeonGTDConfig } from '../neon-gtd-config';
// import * as _ from 'lodash';

// @Injectable()
// export class DatasetService {

//     private datasets: Dataset[] = [];

//     // The active dataset.
//     private dataset: Dataset;

//     // Use the Dataset Service to save settings for specific databases/tables and publish messages to all visualizations if those settings change.
//     private messenger: any;

//     // The active update interval if required by the current active dataset.
//     private updateInterval: Observable<number>;

//     // The subscription that fires on the update interval.
//     private updateSubscription: Subscription;

//     // The Dataset Service may ask the visualizations to update their data.
//     static UPDATE_DATA_CHANNEL: string = "update_data";

//     constructor(@Inject('config') private config: NeonGTDConfig) {
//         this.datasets = config.datasets;
//         this.messenger = {}; //new neon.eventing.Messenger();
//         this.datasets.forEach(function(dataset) {
//             DatasetService.validateDatabases(dataset);
//         });
//     }

//     // ---
//     // PRIVATE METHODS
//     // ---

// }

// angular.module('neonDemo.services')
// .factory('ParameterService', ['$location', 'DatasetService', 'FilterService', 'ConnectionService', 'ErrorNotificationService',
// function($location, datasetService, filterService, connectionService, errorNotificationService) {
//     var service = {};

//     service.messenger = new neon.eventing.Messenger();

//     service.STATE_CHANGED_CHANNEL = "STATE_CHANGED";

//     service.FILTER_KEY_PREFIX = "dashboard";

//     var CUSTOM_NUMBER_MAPPING_PREFIX = "custom_number_";
//     var CUSTOM_STRING_MAPPING_PREFIX = "custom_string_";

//     // Keys for URL parameters.
//     var ACTIVE_DATASET = "dataset";
//     var DASHBOARD_FILTER_PREFIX = "dashboard.";
//     var DASHBOARD_FILTER_BOUNDS = DASHBOARD_FILTER_PREFIX + "bounds";
//     var DASHBOARD_FILTER_DATE = DASHBOARD_FILTER_PREFIX + "date";
//     var DASHBOARD_FILTER_TAG = DASHBOARD_FILTER_PREFIX + "tag";
//     var DASHBOARD_FILTER_URL = DASHBOARD_FILTER_PREFIX + "url";
//     var DASHBOARD_STATE_ID = "dashboard_state_id";
//     var FILTER_STATE_ID = "filter_state_id";

//     // Array index for the min/max lat/lon in the bounds.
//     var BOUNDS_MIN_LAT = 0;
//     var BOUNDS_MIN_LON = 1;
//     var BOUNDS_MAX_LAT = 2;
//     var BOUNDS_MAX_LON = 3;

//     /**
//      * Returns the name of the dataset specified in the URL parameters to set as the active dataset on initial load of the dashboard.
//      * @method findActiveDatasetInUrl
//      * @return {String}
//      */
//     service.findActiveDatasetInUrl = function() {
//         var parameters = $location.search();
//         return parameters[ACTIVE_DATASET];
//     };

//     /**
//      * Adds the filters specified in the URL parameters to the dashboard.
//      * @param {Boolean} ignoreDashboardState Whether to ignore any saved dashboard states given in the parameters
//      * @method addFiltersFromUrl
//      */
//     service.addFiltersFromUrl = function(ignoreDashboardState) {
//         if(!datasetService.hasDataset()) {
//             return;
//         }

//         var customMappings = {};
//         datasetService.getDatabases().forEach(function(database) {
//             database.tables.forEach(function(table) {
//                 Object.keys(table.mappings).forEach(function(mapping) {
//                     if(mapping.indexOf(CUSTOM_NUMBER_MAPPING_PREFIX) === 0 || mapping.indexOf(CUSTOM_STRING_MAPPING_PREFIX) === 0) {
//                         customMappings[mapping] = true;
//                     }
//                 });
//             });
//         });

//         var parameters = $location.search();

//         var argsList = [{
//             mappings: [neonMappings.DATE],
//             parameterKey: DASHBOARD_FILTER_DATE,
//             cleanParameter: splitArray,
//             isParameterValid: areDatesValid,
//             filterName: "date",
//             createFilterClauseCallback: createDateFilterClauseCallback
//         }, {
//             mappings: [neonMappings.TAGS],
//             parameterKey: DASHBOARD_FILTER_TAG,
//             cleanParameter: cleanValue,
//             isParameterValid: doesParameterExist,
//             filterName: "tag",
//             operator: "contains",
//             createFilterClauseCallback: createSimpleFilterClauseCallback
//         }, {
//             mappings: [neonMappings.URLS],
//             parameterKey: DASHBOARD_FILTER_URL,
//             cleanParameter: cleanValue,
//             isParameterValid: doesParameterExist,
//             filterName: "url",
//             operator: "contains",
//             createFilterClauseCallback: createSimpleFilterClauseCallback
//         }, {
//             mappings: [neonMappings.LATITUDE, neonMappings.LONGITUDE],
//             parameterKey: DASHBOARD_FILTER_BOUNDS,
//             cleanParameter: splitArray,
//             isParameterValid: hasBounds,
//             filterName: "bounds",
//             createFilterClauseCallback: createBoundsFilterClauseCallback
//         }];

//         Object.keys(customMappings).forEach(function(mapping) {
//             var cleanMapping = "";
//             var operator = "=";
//             if(mapping.indexOf(CUSTOM_NUMBER_MAPPING_PREFIX) === 0) {
//                 cleanMapping = mapping.substring(CUSTOM_NUMBER_MAPPING_PREFIX.length, mapping.length);
//             }
//             if(mapping.indexOf(CUSTOM_STRING_MAPPING_PREFIX) === 0) {
//                 cleanMapping = mapping.substring(CUSTOM_STRING_MAPPING_PREFIX.length, mapping.length);
//                 operator = "contains";
//             }

//             if(cleanMapping) {
//                 argsList.push({
//                     mappings: [mapping],
//                     parameterKey: DASHBOARD_FILTER_PREFIX + mapping,
//                     cleanParameter: cleanValue,
//                     isParameterValid: doesParameterExist,
//                     filterName: "custom-" + cleanMapping,
//                     operator: operator,
//                     createFilterClauseCallback: createSimpleFilterClauseCallback
//                 });
//             }
//         });

//         var filterStateExists = readFilterState(parameters, ignoreDashboardState);
//         if(!filterStateExists) {
//             addFiltersForDashboardParameters(parameters, argsList, function() {
//                 var dashboardStateId = cleanValue(parameters[DASHBOARD_STATE_ID], "contains");

//                 if(doesParameterExist(dashboardStateId) && !ignoreDashboardState) {
//                     service.loadState(dashboardStateId, "");
//                 }
//             });
//         }
//     };

//     /**
//      * Loads the filter state for a filter state ID found in the given list of parameters. If ignoreDashboardState is false,
//      * the dashboard state will be loaded as well.
//      * @param {Object} parameters
//      * @param {Boolean} ignoreDashboardState
//      * @return {Boolean} True if a filter state ID was found in the given list of parameters, false otherwise.
//      * @method readFilterState
//      * @private
//      */
//     var readFilterState = function(parameters, ignoreDashboardState) {
//         var filterStateId = cleanValue(parameters[FILTER_STATE_ID], "contains");

//         if(doesParameterExist(filterStateId)) {
//             var dashboardStateId = cleanValue(parameters[DASHBOARD_STATE_ID], "contains");

//             if(!doesParameterExist(dashboardStateId) || ignoreDashboardState) {
//                 dashboardStateId = "";
//             }

//             service.loadState(dashboardStateId, filterStateId);

//             return true;
//         }

//         return false;
//     };

//     /**
//      * Adds a filter to the dashboard for the first item in the given list of arguments using the given parameters.  Then calls itself for the next item in the list of arguments.
//      * @param {Object} parameters
//      * @param {Array} argsList
//      * @param {Function} endCallback
//      * @method addFiltersForDashboardParameters
//      * @private
//      */
//     var addFiltersForDashboardParameters = function(parameters, argsList, endCallback) {
//         var args = argsList.shift();
//         var parameterValue = args.cleanParameter(parameters[args.parameterKey], args.operator);
//         var dataWithMappings = datasetService.getFirstDatabaseAndTableWithMappings(args.mappings);
//         var callNextFunction = function() {
//             if(argsList.length) {
//                 addFiltersForDashboardParameters(parameters, argsList, endCallback);
//             } else if(endCallback && _.isFunction(endCallback)) {
//                 endCallback();
//             }
//         };

//         if(args.isParameterValid(parameterValue) && isDatasetValid(dataWithMappings, args.mappings)) {
//             var filterName = {
//                 text: (args.mappings.length > 1 ? args.filterName : dataWithMappings.fields[args.mappings[0]]) + " " + (args.operator || "=") + " " + parameterValue
//             };
//             filterService.addFilter(service.messenger, dataWithMappings.database, dataWithMappings.table, findFieldsForMappings(dataWithMappings, args.mappings),
//                 args.createFilterClauseCallback(args.operator, parameterValue), filterName, callNextFunction, callNextFunction);
//         } else {
//             callNextFunction();
//         }
//     };

//     /**
//      * Loads the dashboard and/or filter states for the given IDs and calls the given callback, if any, when finished.
//      * @param {String} dashboardStateId
//      * @param {String} filterStateId
//      * @method loadState
//      */
//     service.loadState = function(dashboardStateId, filterStateId) {
//         var connection = connectionService.getActiveConnection() || connectionService.createActiveConnection();
//         var params = {};
//         if(dashboardStateId) {
//             params.dashboardStateId = dashboardStateId;
//         }
//         if(filterStateId) {
//             params.filterStateId = filterStateId;
//         }
//         connection.loadState(params, function(dashboardState) {
//             service.loadStateSuccess(dashboardState, dashboardStateId);
//         }, function(response) {
//             errorNotificationService.showErrorMessage(null, response.responseJSON.error);
//         });
//     };

//     /**
//      * Handles changing any datasets and visualizations from the result of loading states.
//      * @param {Object} dashboardState
//      * @param {Array} dashboardState.dashboard
//      * @param {Object} dashboardState.dataset
//      * @param {String} dashboardStateId
//      * @method loadStateSuccess
//      */
//     service.loadStateSuccess = function(dashboardState, dashboardStateId) {
//         if(_.keys(dashboardState).length) {
//             if(dashboardStateId) {
//                 var matchingDataset = datasetService.getDatasetWithName(dashboardState.dataset.name);
//                 if(!matchingDataset) {
//                     datasetService.addDataset(dashboardState.dataset);
//                     matchingDataset = dashboardState.dataset;
//                 }

//                 var connection = connectionService.createActiveConnection(matchingDataset.datastore, matchingDataset.hostname);

//                 // Update dataset fields, then set as active and update the dashboard
//                 datasetService.updateDatabases(matchingDataset, connection, function(dataset) {
//                     filterService.getFilterState(function() {
//                         dataset.mapLayers = dashboardState.dataset.mapLayers;
//                         dataset.lineCharts = dashboardState.dataset.lineCharts;

//                         for(var i = 0; i < dataset.databases.length; i++) {
//                             for(var j = 0; j < dataset.databases[i].tables.length; j++) {
//                                 dataset.databases[i].tables[j].mappings = dashboardState.dataset.databases[i].tables[j].mappings;
//                             }
//                         }

//                         service.messenger.publish(service.STATE_CHANGED_CHANNEL, {
//                             dashboard: dashboardState.dashboard,
//                             dataset: dataset,
//                             dashboardStateId: dashboardStateId
//                         });
//                     }, function(response) {
//                         if(response.responseJSON) {
//                             errorNotificationService.showErrorMessage(null, response.responseJSON.error);
//                         }
//                     });
//                 });
//             } else {
//                 service.messenger.publish(service.STATE_CHANGED_CHANNEL, null);
//             }
//         } else {
//             errorNotificationService.showErrorMessage(null, "State not found for given IDs.");
//         }
//     };

//     /**
//      * Cleans the given value and returns it as a number or string based on its type and the given operator.
//      * @param {String} value
//      * @param {String} operator
//      * @method cleanValue
//      * @private
//      * @return {Number} or {String}
//      */
//     var cleanValue = function(value, operator) {
//         if($.isNumeric(value) && operator !== "contains") {
//             value = parseFloat(value);
//         } else if(value && ((value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') || (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'"))) {
//             value = value.substring(1, value.length - 1);
//         }
//         return value;
//     };

//     /**
//      * Splits the given array string and returns the result.
//      * @param {String} array
//      * @method splitArray
//      * @private
//      * @return {Array}
//      */
//     var splitArray = function(array) {
//         return array ? array.split(",") : [];
//     };

//     /**
//      * Returns whether date strings in the given array create valid date objects.
//      * @param {Array} array
//      * @method areDatesValid
//      * @private
//      * @return {Boolean}
//      */
//     var areDatesValid = function(array) {
//         var notValid = false;
//         array.forEach(function(dateString) {
//             var dateObject = new Date(dateString);
//             if(!dateObject.getTime()) {
//                 notValid = true;
//             }
//         });
//         return !notValid && array.length;
//     };

//     /**
//      * Returns whether the given parameter exists.
//      * @param {Object} parameter
//      * @method doesParameterExist
//      * @private
//      * @return {Object}
//      */
//     var doesParameterExist = function(parameter) {
//         return parameter;
//     };

//     /**
//      * Returns whether the given array is big enough to contain geographic bounds.
//      * @param {Array} array
//      * @method hasBounds
//      * @private
//      * @return {Boolean}
//      */
//     var hasBounds = function(array) {
//         return array.length === 4;
//     };

//     /**
//      * Returns whether the given dataset is valid and contains all of the given mappings.
//      * @param {Object} dataset
//      * @param {Array} mappings
//      * @method isDatasetValid
//      * @private
//      * @return {Boolean}
//      */
//     var isDatasetValid = function(dataset, mappings) {
//         return dataset.database && dataset.table && dataset.fields && mappings.every(function(mapping) {
//             return dataset.fields[mapping];
//         });
//     };

//     /**
//      * Returns the array of fields in the given dataset for the given mappings.
//      * @param {Object} dataset
//      * @param {Array} mappings
//      * @method findFieldsForMappings
//      * @private
//      * @return {Array}
//      */
//     var findFieldsForMappings = function(dataset, mappings) {
//         var fields = [];
//         mappings.forEach(function(mapping) {
//             fields.push(dataset.fields[mapping]);
//         });
//         return fields;
//     };

//     /**
//      * Returns a function to create a filter clause using the given operator and value.
//      * @param {String} operator
//      * @param {Number} or {String} value
//      * @method createSimpleFilterClauseCallback
//      * @private
//      * @return {Function}
//      */
//     var createSimpleFilterClauseCallback = function(operator, value) {
//         return function(databaseAndTableName, fieldName) {
//             return neon.query.where(fieldName, operator, value);
//         };
//     };

//     /**
//      * Returns a function to create a date filter clause using the given operator and list of dates.
//      * @param {String} operator
//      * @param {Array} dateList An array containing two or more {Date} objects:  dateList[0] is the inclusive start date and date[1] is the exclusive end date;
//      * all other indices are ignored.
//      * @method createDateFilterClauseCallback
//      * @private
//      * @return {Function}
//      */
//     var createDateFilterClauseCallback = function(operator, dateList) {
//         var startDate = dateList[0];
//         var endDate = dateList.length > 1 ? dateList[1] : null;

//         return function(databaseAndTableName, fieldName) {
//             var startFilterClause = neon.query.where(fieldName, ">=", startDate);
//             if(!endDate) {
//                 return startFilterClause;
//             }
//             var endFilterClause = neon.query.where(fieldName, "<", endDate);
//             return neon.query.and.apply(neon.query, [startFilterClause, endFilterClause]);
//         };
//     };

//     /**
//      * Returns a function to create a geographic bounds filter clause using the given operator and list of geographic bounds.
//      * @param {String} operator
//      * @param {Array} boundsList
//      * @param {Array} boundsList An array containing four or more numbers:  the minimum and maximum latitude and longitude at indices BOUNDS_MIN_LAT,
//      * BOUNDS_MAX_LAT, BOUNDS_MIN_LON, and BOUNDS_MAX_LON; all other indices are ignored.
//      * @method createBoundsFilterClauseCallback
//      * @private
//      * @return {Function}
//      */
//     var createBoundsFilterClauseCallback = function(operator, boundsList) {
//         var minimumLatitude = Number(boundsList[BOUNDS_MIN_LAT]);
//         var maximumLatitude = Number(boundsList[BOUNDS_MAX_LAT]);
//         var minimumLongitude = Number(boundsList[BOUNDS_MIN_LON]);
//         var maximumLongitude = Number(boundsList[BOUNDS_MAX_LON]);

//         return function(databaseAndTableName, fieldNames) {
//             // Copied from map.js
//             var latitudeFieldName = fieldNames[0];
//             var longitudeFieldName = fieldNames[1];
//             var rightDateLine = {};
//             var leftDateLine = {};
//             var datelineClause = {};

//             var leftClause = neon.query.where(longitudeFieldName, ">=", minimumLongitude);
//             var rightClause = neon.query.where(longitudeFieldName, "<=", maximumLongitude);
//             var bottomClause = neon.query.where(latitudeFieldName, ">=", minimumLatitude);
//             var topClause = neon.query.where(latitudeFieldName, "<=", maximumLatitude);

//             if(minimumLongitude < -180 && maximumLongitude > 180) {
//                 return neon.query.and(topClause, bottomClause);
//             }

//             if(minimumLongitude < -180) {
//                 leftClause = neon.query.where(longitudeFieldName, ">=", minimumLongitude + 360);
//                 leftDateLine = neon.query.where(longitudeFieldName, "<=", 180);
//                 rightDateLine = neon.query.where(longitudeFieldName, ">=", -180);
//                 datelineClause = neon.query.or(neon.query.and(leftClause, leftDateLine), neon.query.and(rightClause, rightDateLine));
//                 return neon.query.and(topClause, bottomClause, datelineClause);
//             }

//             if(maximumLongitude > 180) {
//                 rightClause = neon.query.where(longitudeFieldName, "<=", maximumLongitude - 360);
//                 rightDateLine = neon.query.where(longitudeFieldName, ">=", -180);
//                 leftDateLine = neon.query.where(longitudeFieldName, "<=", 180);
//                 datelineClause = neon.query.or(neon.query.and(leftClause, leftDateLine), neon.query.and(rightClause, rightDateLine));
//                 return neon.query.and(topClause, bottomClause, datelineClause);
//             }

//             return neon.query.and(leftClause, rightClause, bottomClause, topClause);
//         };
//     };

//     return service;
// }]);
