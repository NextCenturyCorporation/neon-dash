var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
import { Injectable } from '@angular/core';
import { URLSearchParams } from '@angular/http';
import * as neon from 'neon-framework';
import * as $ from 'jquery';
import { ConnectionService } from './connection.service';
import { DatasetService } from './dataset.service';
import { ErrorNotificationService } from './error-notification.service';
import { FilterService } from './filter.service';
import { neonMappings } from '../neon-namespaces';
import * as _ from 'lodash';
var ParameterService = /** @class */ (function () {
    function ParameterService(datasetService, connectionService, errorNotificationService, filterService) {
        this.datasetService = datasetService;
        this.connectionService = connectionService;
        this.errorNotificationService = errorNotificationService;
        this.filterService = filterService;
        this.messenger = new neon.eventing.Messenger();
    }
    ParameterService_1 = ParameterService;
    /**
     * Returns the name of the dataset specified in the URL parameters to set as the active dataset on initial load of the dashboard.
     * @method findActiveDatasetInUrl
     * @return {String}
     */
    ParameterService.prototype.findActiveDatasetInUrl = function () {
        var parameters = new URLSearchParams();
        return parameters.get(ParameterService_1.ACTIVE_DATASET);
    };
    /**
     * Adds the filters specified in the URL parameters to the dashboard.
     * @param {Boolean} [ignoreDashboardState] Whether to ignore any saved dashboard states given in the parameters
     * @method addFiltersFromUrl
     */
    ParameterService.prototype.addFiltersFromUrl = function (ignoreDashboardState) {
        var _this = this;
        if (!this.datasetService.hasDataset()) {
            return;
        }
        var customMappings = {};
        this.datasetService.getDatabases().forEach(function (database) {
            database.tables.forEach(function (table) {
                Object.keys(table.mappings).forEach(function (mapping) {
                    if (mapping.indexOf(ParameterService_1.CUSTOM_NUMBER_MAPPING_PREFIX) === 0 ||
                        mapping.indexOf(ParameterService_1.CUSTOM_STRING_MAPPING_PREFIX) === 0) {
                        customMappings[mapping] = true;
                    }
                });
            });
        });
        var parameters = new URLSearchParams();
        var argsList = [{
                mappings: [neonMappings.DATE],
                parameterKey: ParameterService_1.DASHBOARD_FILTER_DATE,
                cleanParameter: this.splitArray,
                isParameterValid: this.areDatesValid,
                filterName: 'date',
                createFilterClauseCallback: this.createDateFilterClauseCallback
            }, {
                mappings: [neonMappings.TAGS],
                parameterKey: ParameterService_1.DASHBOARD_FILTER_TAG,
                cleanParameter: this.cleanValue,
                isParameterValid: this.doesParameterExist,
                filterName: 'tag',
                operator: 'contains',
                createFilterClauseCallback: this.createSimpleFilterClauseCallback
            }, {
                mappings: [neonMappings.URLS],
                parameterKey: ParameterService_1.DASHBOARD_FILTER_URL,
                cleanParameter: this.cleanValue,
                isParameterValid: this.doesParameterExist,
                filterName: 'url',
                operator: 'contains',
                createFilterClauseCallback: this.createSimpleFilterClauseCallback
            }, {
                mappings: [neonMappings.LATITUDE, neonMappings.LONGITUDE],
                parameterKey: ParameterService_1.DASHBOARD_FILTER_BOUNDS,
                cleanParameter: this.splitArray,
                isParameterValid: this.hasBounds,
                filterName: 'bounds',
                createFilterClauseCallback: this.createBoundsFilterClauseCallback
            }];
        Object.keys(customMappings).forEach(function (mapping) {
            var cleanMapping = '';
            var operator = '=';
            if (mapping.indexOf(ParameterService_1.CUSTOM_NUMBER_MAPPING_PREFIX) === 0) {
                cleanMapping = mapping.substring(ParameterService_1.CUSTOM_NUMBER_MAPPING_PREFIX.length, mapping.length);
            }
            if (mapping.indexOf(ParameterService_1.CUSTOM_STRING_MAPPING_PREFIX) === 0) {
                cleanMapping = mapping.substring(ParameterService_1.CUSTOM_STRING_MAPPING_PREFIX.length, mapping.length);
                operator = 'contains';
            }
            if (cleanMapping) {
                argsList.push({
                    mappings: [mapping],
                    parameterKey: ParameterService_1.DASHBOARD_FILTER_PREFIX + mapping,
                    cleanParameter: _this.cleanValue,
                    isParameterValid: _this.doesParameterExist,
                    filterName: 'custom-' + cleanMapping,
                    operator: operator,
                    createFilterClauseCallback: _this.createSimpleFilterClauseCallback
                });
            }
        });
        var filterStateExists = this.readFilterState(parameters, ignoreDashboardState);
        if (!filterStateExists) {
            var callback = function () {
                var dashboardStateId = _this.cleanValue(parameters[ParameterService_1.DASHBOARD_STATE_ID], 'contains');
                if (_this.doesParameterExist(dashboardStateId) && !ignoreDashboardState) {
                    _this.loadState(dashboardStateId, '');
                }
            };
            this.addFiltersForDashboardParameters(parameters, argsList, callback);
        }
    };
    /**
     * Loads the filter state for a filter state ID found in the given list of parameters. If ignoreDashboardState is false,
     * the dashboard state will be loaded as well.
     * @param {Object} parameters
     * @param {Boolean} [ignoreDashboardState]
     * @return {Boolean} True if a filter state ID was found in the given list of parameters, false otherwise.
     * @private
     */
    ParameterService.prototype.readFilterState = function (parameters, ignoreDashboardState) {
        var filterStateId = this.cleanValue(parameters[ParameterService_1.FILTER_STATE_ID], 'contains');
        if (this.doesParameterExist(filterStateId)) {
            var dashboardStateId = this.cleanValue(parameters[ParameterService_1.DASHBOARD_STATE_ID], 'contains');
            if (!this.doesParameterExist(dashboardStateId) || ignoreDashboardState) {
                dashboardStateId = '';
            }
            this.loadState(dashboardStateId, filterStateId);
            return true;
        }
        return false;
    };
    /**
     * Adds a filter to the dashboard for the first item in the given list of arguments using the given parameters.
     * Then calls itself for the next item in the list of arguments.
     * @param {Object} parameters
     * @param {Array} argsList
     * @param {Function} endCallback
     * @private
     */
    ParameterService.prototype.addFiltersForDashboardParameters = function (parameters, argsList, endCallback) {
        var _this = this;
        var args = argsList.shift();
        var parameterValue = args.cleanParameter(parameters[args.parameterKey], args.operator);
        var dataWithMappings = this.datasetService.getFirstDatabaseAndTableWithMappings(args.mappings);
        var callNextFunction = function () {
            if (argsList.length) {
                _this.addFiltersForDashboardParameters(parameters, argsList, endCallback);
            }
            else if (endCallback && _.isFunction(endCallback)) {
                endCallback();
            }
        };
        if (args.isParameterValid(parameterValue) && this.isDatasetValid(dataWithMappings, args.mappings)) {
            var filterName = (args.mappings.length > 1 ? args.filterName : dataWithMappings.fields[args.mappings[0]]) +
                ' ' + (args.operator || '=') + ' ' + parameterValue;
            this.filterService.addFilter(this.messenger, '', dataWithMappings.database, dataWithMappings.table, args.createFilterClauseCallback(args.operator, parameterValue), filterName, callNextFunction, callNextFunction);
        }
        else {
            callNextFunction();
        }
    };
    /**
     * Loads the dashboard and/or filter states for the given IDs and calls the given callback, if any, when finished.
     * @param {String} dashboardStateId
     * @param {String} filterStateId
     */
    ParameterService.prototype.loadState = function (dashboardStateId, filterStateId) {
        var _this = this;
        var connection = this.connectionService.getActiveConnection() ||
            this.connectionService.createActiveConnection();
        var params = {};
        if (dashboardStateId) {
            params.dashboardStateId = dashboardStateId;
        }
        if (filterStateId) {
            params.filterStateId = filterStateId;
        }
        connection.loadState(params, function (dashboardState) {
            _this.loadStateSuccess(dashboardState, dashboardStateId);
        }, function (response) {
            _this.errorNotificationService.showErrorMessage(null, response.responseJSON.error);
        });
    };
    /**
     * Handles changing any datasets and visualizations from the result of loading states.
     * @param {Object} dashboardState
     * @param {Array} dashboardState.dashboard
     * @param {Object} dashboardState.dataset
     * @param {String} dashboardStateId
     */
    ParameterService.prototype.loadStateSuccess = function (dashboardState, dashboardStateId) {
        var _this = this;
        if (_.keys(dashboardState).length) {
            if (dashboardStateId) {
                var matchingDataset = this.datasetService.getDatasetWithName(dashboardState.dataset.name);
                if (!matchingDataset) {
                    this.datasetService.addDataset(dashboardState.dataset);
                    matchingDataset = dashboardState.dataset;
                }
                var connection = this.connectionService.createActiveConnection(matchingDataset.datastore, matchingDataset.hostname);
                // Update dataset fields, then set as active and update the dashboard
                this.datasetService.updateDatabases(matchingDataset, connection, function (dataset) {
                    _this.filterService.getFilterState(function () {
                        dataset.mapLayers = dashboardState.dataset.mapLayers;
                        dataset.lineCharts = dashboardState.dataset.lineCharts;
                        for (var i = 0; i < dataset.databases.length; i++) {
                            for (var j = 0; j < dataset.databases[i].tables.length; j++) {
                                dataset.databases[i].tables[j].mappings = dashboardState.dataset.databases[i].tables[j].mappings;
                            }
                        }
                        _this.messenger.publish(ParameterService_1.STATE_CHANGED_CHANNEL, {
                            dashboard: dashboardState.dashboard,
                            dataset: dataset,
                            dashboardStateId: dashboardStateId
                        });
                    }, function (response) {
                        if (response.responseJSON) {
                            _this.errorNotificationService.showErrorMessage(null, response.responseJSON.error);
                        }
                    });
                });
            }
            else {
                this.messenger.publish(ParameterService_1.STATE_CHANGED_CHANNEL, null);
            }
        }
        else {
            this.errorNotificationService.showErrorMessage(null, 'State not found for given IDs.');
        }
    };
    /**
     * Cleans the given value and returns it as a number or string based on its type and the given operator.
     * @param {String} value
     * @param {String} operator
     * @private
     * @return {Number} or {String}
     */
    ParameterService.prototype.cleanValue = function (value, operator) {
        var retVal = value;
        if ($.isNumeric(value) && operator !== 'contains') {
            retVal = parseFloat(value);
        }
        else if (value && ((value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
            (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'"))) {
            retVal = value.substring(1, value.length - 1);
        }
        return retVal;
    };
    /**
     * Splits the given array string and returns the result.
     * @param {String} array
     * @private
     * @return {Array}
     */
    ParameterService.prototype.splitArray = function (array) {
        return array ? array.split(',') : [];
    };
    /**
     * Returns whether date strings in the given array create valid date objects.
     * @param {Array} array
     * @method areDatesValid
     * @private
     * @return {Boolean}
     */
    ParameterService.prototype.areDatesValid = function (array) {
        var notValid = false;
        array.forEach(function (dateString) {
            var dateObject = new Date(dateString);
            if (!dateObject.getTime()) {
                notValid = true;
            }
        });
        return (!notValid && array.length > 0);
    };
    /**
     * Returns whether the given parameter exists.
     * @param {Object} parameter
     * @private
     * @return {Object}
     */
    ParameterService.prototype.doesParameterExist = function (parameter) {
        return parameter;
    };
    /**
     * Returns whether the given array is big enough to contain geographic bounds.
     * @param {Array} array
     * @private
     * @return {Boolean}
     */
    ParameterService.prototype.hasBounds = function (array) {
        return array.length === 4;
    };
    /**
     * Returns whether the given dataset is valid and contains all of the given mappings.
     * @param {Object} dataset A convenience object with fields for a database, table, and field mappings.
     * @param {Array} mappings
     * @private
     * @return {Boolean}
     */
    ParameterService.prototype.isDatasetValid = function (dataset, mappings) {
        return dataset.database && dataset.table && dataset.fields && mappings.every(function (mapping) {
            return (dataset.fields[mapping] !== undefined);
        });
    };
    /**
     * Returns the array of fields in the given dataset for the given mappings.
     * @param {Object} dataset
     * @param {Array} mappings
     * @private
     * @return {Array}
     */
    ParameterService.prototype.findFieldsForMappings = function (dataset, mappings) {
        var fields = [];
        mappings.forEach(function (mapping) {
            fields.push(dataset.fields[mapping]);
        });
        return fields;
    };
    /**
     * Returns a function to create a filter clause using the given operator and value.
     * @param {String} operator
     * @param {Number} or {String} value
     * @private
     * @return {Function}
     */
    ParameterService.prototype.createSimpleFilterClauseCallback = function (operator, value) {
        return function (fieldName) {
            return neon.query.where(fieldName, operator, value);
        };
    };
    /**
     * Returns a function to create a date filter clause using the given list of dates.
     * @param {Array} dateList An array containing two or more {Date} objects:  dateList[0] is the inclusive
     * start date and date[1] is the exclusive end date;
     * @private
     * @return {Function}
     */
    ParameterService.prototype.createDateFilterClauseCallback = function (dateList) {
        var startDate = dateList[0];
        var endDate = dateList.length > 1 ? dateList[1] : null;
        return function (fieldName) {
            var startFilterClause = neon.query.where(fieldName, '>=', startDate);
            if (!endDate) {
                return startFilterClause;
            }
            var endFilterClause = neon.query.where(fieldName, '<', endDate);
            return neon.query.and.apply(neon.query, [startFilterClause, endFilterClause]);
        };
    };
    /**
     * Returns a function to create a geographic bounds filter clause using the given list of geographic bounds.
     * @param {Array} boundsList
     * @param {Array} boundsList An array containing four or more numbers:  the minimum and maximum latitude and longitude at
     * indices BOUNDS_MIN_LAT, BOUNDS_MAX_LAT, BOUNDS_MIN_LON, and BOUNDS_MAX_LON; all other indices are ignored.
     * @private
     * @return {Function}
     */
    ParameterService.prototype.createBoundsFilterClauseCallback = function (boundsList) {
        var minimumLatitude = Number(boundsList[ParameterService_1.BOUNDS_MIN_LAT]);
        var maximumLatitude = Number(boundsList[ParameterService_1.BOUNDS_MAX_LAT]);
        var minimumLongitude = Number(boundsList[ParameterService_1.BOUNDS_MIN_LON]);
        var maximumLongitude = Number(boundsList[ParameterService_1.BOUNDS_MAX_LON]);
        return function (fieldNames) {
            // Copied from map.js
            var latitudeFieldName = fieldNames[0];
            var longitudeFieldName = fieldNames[1];
            var rightDateLine = {};
            var leftDateLine = {};
            var datelineClause = {};
            var leftClause = neon.query.where(longitudeFieldName, '>=', minimumLongitude);
            var rightClause = neon.query.where(longitudeFieldName, '<=', maximumLongitude);
            var bottomClause = neon.query.where(latitudeFieldName, '>=', minimumLatitude);
            var topClause = neon.query.where(latitudeFieldName, '<=', maximumLatitude);
            if (minimumLongitude < -180 && maximumLongitude > 180) {
                return neon.query.and(topClause, bottomClause);
            }
            if (minimumLongitude < -180) {
                leftClause = neon.query.where(longitudeFieldName, '>=', minimumLongitude + 360);
                leftDateLine = neon.query.where(longitudeFieldName, '<=', 180);
                rightDateLine = neon.query.where(longitudeFieldName, '>=', -180);
                datelineClause = neon.query.or(neon.query.and(leftClause, leftDateLine), neon.query.and(rightClause, rightDateLine));
                return neon.query.and(topClause, bottomClause, datelineClause);
            }
            if (maximumLongitude > 180) {
                rightClause = neon.query.where(longitudeFieldName, '<=', maximumLongitude - 360);
                rightDateLine = neon.query.where(longitudeFieldName, '>=', -180);
                leftDateLine = neon.query.where(longitudeFieldName, '<=', 180);
                datelineClause = neon.query.or(neon.query.and(leftClause, leftDateLine), neon.query.and(rightClause, rightDateLine));
                return neon.query.and(topClause, bottomClause, datelineClause);
            }
            return neon.query.and(leftClause, rightClause, bottomClause, topClause);
        };
    };
    // The Dataset Service may ask the visualizations to update their data.
    ParameterService.STATE_CHANGED_CHANNEL = 'STATE_CHANGED';
    ParameterService.FILTER_KEY_PREFIX = 'dashboard';
    ParameterService.CUSTOM_NUMBER_MAPPING_PREFIX = 'custom_number_';
    ParameterService.CUSTOM_STRING_MAPPING_PREFIX = 'custom_string_';
    // Keys for URL parameters.
    ParameterService.ACTIVE_DATASET = 'dataset';
    ParameterService.DASHBOARD_FILTER_PREFIX = 'dashboard.';
    ParameterService.DASHBOARD_FILTER_BOUNDS = ParameterService_1.DASHBOARD_FILTER_PREFIX + 'bounds';
    ParameterService.DASHBOARD_FILTER_DATE = ParameterService_1.DASHBOARD_FILTER_PREFIX + 'date';
    ParameterService.DASHBOARD_FILTER_TAG = ParameterService_1.DASHBOARD_FILTER_PREFIX + 'tag';
    ParameterService.DASHBOARD_FILTER_URL = ParameterService_1.DASHBOARD_FILTER_PREFIX + 'url';
    ParameterService.DASHBOARD_STATE_ID = 'dashboard_state_id';
    ParameterService.FILTER_STATE_ID = 'filter_state_id';
    // Array index for the min/max lat/lon in the bounds.
    ParameterService.BOUNDS_MIN_LAT = 0;
    ParameterService.BOUNDS_MIN_LON = 1;
    ParameterService.BOUNDS_MAX_LAT = 2;
    ParameterService.BOUNDS_MAX_LON = 3;
    ParameterService = ParameterService_1 = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [DatasetService, ConnectionService,
            ErrorNotificationService, FilterService])
    ], ParameterService);
    return ParameterService;
    var ParameterService_1;
}());
export { ParameterService };
//# sourceMappingURL=parameter.service.js.map