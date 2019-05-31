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

import { eventing } from 'neon-framework';

import { AbstractSearchService, Connection } from './abstract.search.service';
import { Datastore } from '../dataset';
import { DatasetService } from './dataset.service';
import { FilterService } from './filter.service';
import { neonEvents } from '../neon-namespaces';
import * as _ from 'lodash';

@Injectable()
export class ParameterService {
    // The Dataset Service may ask the visualizations to update their data.
    public static FILTER_KEY_PREFIX: string = 'dashboard';

    static CUSTOM_NUMBER_MAPPING_PREFIX: string = 'custom_number_';
    static CUSTOM_STRING_MAPPING_PREFIX: string = 'custom_string_';

    // Keys for URL parameters.
    static ACTIVE_DATASET: string = 'dataset';
    static DASHBOARD_FILTER_PREFIX: string = 'dashboard.';
    static DASHBOARD_FILTER_BOUNDS: string = ParameterService.DASHBOARD_FILTER_PREFIX + 'bounds';
    static DASHBOARD_FILTER_DATE: string = ParameterService.DASHBOARD_FILTER_PREFIX + 'date';
    static DASHBOARD_FILTER_URL: string = ParameterService.DASHBOARD_FILTER_PREFIX + 'url';
    static DASHBOARD_STATE_ID: string = 'dashboard_state_id';
    static FILTER_STATE_ID: string = 'filter_state_id';

    // Array index for the min/max lat/lon in the bounds.
    private static BOUNDS_MIN_LAT = 0;
    private static BOUNDS_MIN_LON = 1;
    private static BOUNDS_MAX_LAT = 2;
    private static BOUNDS_MAX_LON = 3;

    private messenger: eventing.Messenger;
    public parameters: any = {};

    constructor(
        private datasetService: DatasetService,
        private filterService: FilterService,
        private searchService: AbstractSearchService
    ) {
        this.messenger = new eventing.Messenger();
        this.parameters = this.findParameters(document.location.search);
    }

    /**
     * Returns the active dataset from the URL parameters, if any.
     *
     * @return {string}
     */
    findActiveDatasetInUrl(): string {
        return this.parameters[ParameterService.ACTIVE_DATASET];
    }

    /**
     * Returns the dashboard state ID from the URL parameters, if any.
     *
     * @return {string}
     */
    findDashboardStateIdInUrl(): string {
        return this.parameters[ParameterService.DASHBOARD_STATE_ID];
    }

    /**
     * Returns the filter state ID from the URL parameters, if any.
     *
     * @return {string}
     */
    findFilterStateIdInUrl(): string {
        return this.parameters[ParameterService.FILTER_STATE_ID];
    }

    /**
     * Returns the map of parameters in the given query string.
     *
     * @arg {string} queryString
     * @return {any}
     */
    findParameters(queryString: string): any {
        return (queryString || '?').slice(1).split('&').reduce((parameters, parameter) => {
            let pair = parameter.split('=');
            if (pair.length === 2) {
                parameters[pair[0]] = decodeURIComponent(pair[1]);
            }
            return parameters;
        }, {});
    }

    /**
     * Removes the state parameters from the browser URL and the parameter map.
     */
    removeStateParameters() {
        delete this.parameters[ParameterService.DASHBOARD_STATE_ID];
        delete this.parameters[ParameterService.FILTER_STATE_ID];
        // TODO THOR-1023 Update the browser URL.
    }

    /**
     * Updates the state parameters to the given values in the browser URL and the parameter map.
     *
     * @arg {string} dashboardStateId
     * @arg {string} filterStateId
     */
    updateStateParameters(dashboardStateId: string, filterStateId: string) {
        this.parameters[ParameterService.DASHBOARD_STATE_ID] = dashboardStateId;
        this.parameters[ParameterService.FILTER_STATE_ID] = filterStateId;
        // TODO THOR-1023 Update the browser URL.
    }

    /**
     * Adds the filters specified in the URL parameters to the dashboard.
     * @param {Boolean} [ignoreDashboardState] Whether to ignore any saved dashboard states given in the parameters
     * @method addFiltersFromUrl
     */
    addFiltersFromUrl(ignoreDashboardState?: boolean) {

        /* TODO THOR-1076
        if (!this.datasetService.hasDataset()) {
            return;
        }

        let customMappings: any = {};
        this.datasetService.getDatabases().forEach((database: DatabaseMetaData) => {
            database.tables.forEach((table: TableMetaData) => {
                Object.keys(table.mappings).forEach((mapping) => {
                    if (mapping.indexOf(ParameterService.CUSTOM_NUMBER_MAPPING_PREFIX) === 0 ||
                        mapping.indexOf(ParameterService.CUSTOM_STRING_MAPPING_PREFIX) === 0) {
                        customMappings[mapping] = true;
                    }
                });
            });
        });

        let argsList = [{
            mappings: [neonMappings.DATE],
            parameterKey: ParameterService.DASHBOARD_FILTER_DATE,
            cleanParameter: this.splitArray,
            isParameterValid: this.areDatesValid,
            filterName: 'date',
            createFilterClauseCallback: this.createDateFilterClauseCallback
        }, {
            mappings: [neonMappings.URL],
            parameterKey: ParameterService.DASHBOARD_FILTER_URL,
            cleanParameter: this.cleanValue,
            isParameterValid: this.doesParameterExist,
            filterName: 'url',
            operator: 'contains',
            createFilterClauseCallback: this.createSimpleFilterClauseCallback
        }, {
            mappings: [neonMappings.LATITUDE, neonMappings.LONGITUDE],
            parameterKey: ParameterService.DASHBOARD_FILTER_BOUNDS,
            cleanParameter: this.splitArray,
            isParameterValid: this.hasBounds,
            filterName: 'bounds',
            createFilterClauseCallback: this.createBoundsFilterClauseCallback
        }];

        Object.keys(customMappings).forEach((mapping) => {
            let cleanMapping = '';
            let operator = '=';
            if (mapping.indexOf(ParameterService.CUSTOM_NUMBER_MAPPING_PREFIX) === 0) {
                cleanMapping = mapping.substring(ParameterService.CUSTOM_NUMBER_MAPPING_PREFIX.length, mapping.length);
            }
            if (mapping.indexOf(ParameterService.CUSTOM_STRING_MAPPING_PREFIX) === 0) {
                cleanMapping = mapping.substring(ParameterService.CUSTOM_STRING_MAPPING_PREFIX.length, mapping.length);
                operator = 'contains';
            }

            if (cleanMapping) {
                argsList.push({
                    mappings: [mapping],
                    parameterKey: ParameterService.DASHBOARD_FILTER_PREFIX + mapping,
                    cleanParameter: this.cleanValue,
                    isParameterValid: this.doesParameterExist,
                    filterName: 'custom-' + cleanMapping,
                    operator: operator,
                    createFilterClauseCallback: this.createSimpleFilterClauseCallback
                });
            }
        });

        let filterStateExists: boolean = this.readFilterState(this.parameters, ignoreDashboardState);
        if (!filterStateExists) {
            let callback: () => any = () => {
                let dashboardStateId: string | number = this.cleanValue(this.parameters[ParameterService.DASHBOARD_STATE_ID], 'contains');

                if (this.doesParameterExist(dashboardStateId) && !ignoreDashboardState) {
                    this.loadState(dashboardStateId, '');
                }
            };
            this.addFiltersForDashboardParameters(this.parameters, argsList, callback);
        }
        */
    }

    /**
     * Loads the filter state for a filter state ID found in the given list of parameters. If ignoreDashboardState is false,
     * the dashboard state will be loaded as well.
     * @param {Object} parameters
     * @param {Boolean} [ignoreDashboardState]
     * @return {Boolean} True if a filter state ID was found in the given list of parameters, false otherwise.
     * @private
     */
    readFilterState(parameters: any, ignoreDashboardState?: boolean): boolean {
        let filterStateId = this.cleanValue(parameters[ParameterService.FILTER_STATE_ID], 'contains');

        if (this.doesParameterExist(filterStateId)) {
            let dashboardStateId: string | number = this.cleanValue(parameters[ParameterService.DASHBOARD_STATE_ID], 'contains');

            if (!this.doesParameterExist(dashboardStateId) || ignoreDashboardState) {
                dashboardStateId = '';
            }

            this.loadState(dashboardStateId, filterStateId);

            return true;
        }

        return false;
    }

    /**
     * Adds a filter to the dashboard for the first item in the given list of arguments using the given parameters.
     * Then calls itself for the next item in the list of arguments.
     * @param {Object} parameters
     * @param {Array} argsList
     * @param {Function} endCallback
     * @private
     */
    addFiltersForDashboardParameters(parameters: any, argsList: any[], endCallback: () => any) {
        let args = argsList.shift();
        let parameterValue = args.cleanParameter(parameters[args.parameterKey], args.operator);
        let dataWithMappings = this.datasetService.getFirstDatabaseAndTableWithMappings(args.mappings);
        let callNextFunction = () => {
            if (argsList.length) {
                this.addFiltersForDashboardParameters(parameters, argsList, endCallback);
            } else if (endCallback && _.isFunction(endCallback)) {
                endCallback();
            }
        };

        if (args.isParameterValid(parameterValue) && this.isDatasetValid(dataWithMappings, args.mappings)) {

            /* TODO FIXME THOR-1076
            let filterName = (args.mappings.length > 1 ? args.filterName : dataWithMappings.fields[args.mappings[0]]) +
                ' ' + (args.operator || '=') + ' ' + parameterValue;
            this.filterService.addFilter(
                this.messenger,
                '',
                dataWithMappings.database,
                dataWithMappings.table,
                args.createFilterClauseCallback(args.operator, parameterValue),
                filterName,
                callNextFunction,
                callNextFunction);
             */
        } else {
            callNextFunction();
        }
    }

    /**
     * Loads the dashboard and/or filter states for the given IDs and calls the given callback, if any, when finished.
     * @param {String} dashboardStateId
     * @param {String} filterStateId
     */
    loadState(dashboardStateId: string | number, filterStateId: string | number) {

        /* TODO THOR-1131
        let connection: Connection = this.searchService.createConnection(this.datasetService.getDatastoreType(),
            this.datasetService.getDatastoreHost());
        let params: any = {};
        if (dashboardStateId) {
            params.dashboardStateId = dashboardStateId;
        }
        if (filterStateId) {
            params.filterStateId = filterStateId;
        }
        connection.loadState(params, (dashboardState) => {
            this.loadStateSuccess(dashboardState, dashboardStateId);
        }, (response) => {
            this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                error: null,
                message: response.responseJSON.error
            });
        });
         */
    }

    /**
     * Handles changing any datasets and visualizations from the result of loading states.
     * @param {Object} dashboardState
     * @param {Array} dashboardState.dashboard
     * @param {Object} dashboardState.dataset
     * @param {String} dashboardStateId
     */
    loadStateSuccess(dashboardState: any, dashboardStateId: number | string) {
        if (_.keys(dashboardState).length) {
            if (dashboardStateId) {
                // TODO: THOR-1065: This should open a Dashboard (not a single Datastore). Then it should
                // create Connections to each Datastore in the Dashboard and call updateDatabases of each Datastore.
                let matchingDataset: Datastore = this.datasetService.getDatasetWithName(dashboardState.dataset.name);
                if (!matchingDataset) {
                    this.datasetService.addDataset(dashboardState.dataset);
                    matchingDataset = dashboardState.dataset;
                }

                let connection: Connection = this.searchService.createConnection(matchingDataset.type, matchingDataset.host);

                // Update dataset fields, then set as active and update the dashboard
                this.datasetService.updateDatabases(matchingDataset, connection).then((dataset) => {
                    // TODO THOR-1024 Do not expect filters within the dataset.
                    this.filterService.setFiltersFromConfig((dataset).filters || [], this.datasetService, this.searchService);

                    for (let databaseIndex = 0; databaseIndex < dataset.databases.length; databaseIndex++) {
                        for (let tableIndex = 0; tableIndex < dataset.databases[databaseIndex].tables.length; tableIndex++) {
                            dataset.databases[databaseIndex].tables[tableIndex].mappings =
                                dashboardState.dataset.databases[databaseIndex].tables[tableIndex].mappings;
                        }
                    }

                    this.messenger.publish(neonEvents.DASHBOARD_STATE, {
                        dashboard: dashboardState.dashboard,
                        dataset: dataset,
                        dashboardStateId: dashboardStateId
                    });
                });
            } else {
                this.messenger.publish(neonEvents.DASHBOARD_STATE, null);
            }
        } else {
            this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                error: null,
                message: 'State not found for given IDs.'
            });
        }
    }

    /**
     * Cleans the given value and returns it as a number or string based on its type and the given operator.
     * @param {String} value
     * @param {String} operator
     * @private
     * @return {Number} or {String}
     */
    private cleanValue(value: string, operator: string): number | string {
        let retVal: number | string = value;

        if ((/^-?\d+(.\d+)?$/).test(`${value}`) && operator !== 'contains') {
            retVal = parseFloat(value);
        } else if (value && ((value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
            (value.charAt(0) === '\'' && value.charAt(value.length - 1) === '\''))) {
            retVal = value.substring(1, value.length - 1);
        }
        return retVal;
    }

    /**
     * Splits the given array string and returns the result.
     * @param {String} array
     * @private
     * @return {Array}
     */
    private splitArray(array: string): string[] {
        return array ? array.split(',') : [];
    }

    /**
     * Returns whether date strings in the given array create valid date objects.
     * @param {Array} array
     * @method areDatesValid
     * @private
     * @return {Boolean}
     */
    private areDatesValid(array: string[]): boolean {
        let notValid = false;

        array.forEach((dateString: string) => {
            let dateObject = new Date(dateString);
            if (!dateObject.getTime()) {
                notValid = true;
            }
        });
        return (!notValid && array.length > 0);
    }

    /**
     * Returns whether the given parameter exists.
     * @param {Object} parameter
     * @private
     * @return {Object}
     */
    private doesParameterExist(parameter: any): any {
        return parameter;
    }

    /**
     * Returns whether the given array is big enough to contain geographic bounds.
     * @param {Array} array
     * @private
     * @return {Boolean}
     */
    private hasBounds(array: any[]): boolean {
        return array.length === 4;
    }

    /**
     * Returns whether the given dataset is valid and contains all of the given mappings.
     * @param {Object} dataset A convenience object with fields for a database, table, and field mappings.
     * @param {Array} mappings
     * @private
     * @return {Boolean}
     */
    private isDatasetValid(dataset: any, mappings: string[]): boolean {
        return dataset.database && dataset.table && dataset.fields && mappings.every((mapping) => (dataset.fields[mapping] !== undefined));
    }

    /**
     * Returns the array of fields in the given dataset for the given mappings.
     * @param {Object} dataset
     * @param {Array} mappings
     * @private
     * @return {Array}
     */
    private findFieldsForMappings(dataset: any, mappings: string[]): any[] {
        let fields: any[] = [];
        mappings.forEach((mapping: any) => {
            fields.push(dataset.fields[mapping]);
        });
        return fields;
    }

    /**
     * Returns a function to create a filter clause using the given operator and value.
     * @param {String} operator
     * @param {Number} or {String} value
     * @private
     * @return {Function}
     */
    /* TODO THOR-1076
    private createSimpleFilterClauseCallback(operator: string, value: any): Function {
        return (fieldName: string) => {
            return query.where(fieldName, operator, value);
        };
    }
    */

    /**
     * Returns a function to create a date filter clause using the given list of dates.
     * @param {Array} dateList An array containing two or more {Date} objects:  dateList[0] is the inclusive
     * start date and date[1] is the exclusive end date;
     * @private
     * @return {Function}
     */
    /* TODO THOR-1076
    private createDateFilterClauseCallback(dateList: Date[]): Function {
        let startDate: Date = dateList[0];
        let endDate: Date = dateList.length > 1 ? dateList[1] : null;

        return (fieldName: string) => {
            let startFilterClause = query.where(fieldName, '>=', startDate);
            if (!endDate) {
                return startFilterClause;
            }
            let endFilterClause = query.where(fieldName, '<', endDate);
            return query.and.apply(query, [startFilterClause, endFilterClause]);
        };
    }
    */

    /**
     * Returns a function to create a geographic bounds filter clause using the given list of geographic bounds.
     * @param {Array} boundsList
     * @param {Array} boundsList An array containing four or more numbers:  the minimum and maximum latitude and longitude at
     * indices BOUNDS_MIN_LAT, BOUNDS_MAX_LAT, BOUNDS_MIN_LON, and BOUNDS_MAX_LON; all other indices are ignored.
     * @private
     * @return {Function}
     */
    /* TODO THOR-1076
    private createBoundsFilterClauseCallback(boundsList: number[]) {
        let minimumLatitude: number = Number(boundsList[ParameterService.BOUNDS_MIN_LAT]);
        let maximumLatitude: number = Number(boundsList[ParameterService.BOUNDS_MAX_LAT]);
        let minimumLongitude: number = Number(boundsList[ParameterService.BOUNDS_MIN_LON]);
        let maximumLongitude: number = Number(boundsList[ParameterService.BOUNDS_MAX_LON]);

        return (fieldNames: string[]): query.BooleanClause => {
            // Copied from map.js
            let latitudeFieldName: string = fieldNames[0];
            let longitudeFieldName: string = fieldNames[1];
            let rightDateLine: any = {};
            let leftDateLine: any = {};
            let datelineClause: any = {};

            let leftClause: query.WherePredicate = query.where(longitudeFieldName, '>=', minimumLongitude);
            let rightClause: query.WherePredicate = query.where(longitudeFieldName, '<=', maximumLongitude);
            let bottomClause: query.WherePredicate = query.where(latitudeFieldName, '>=', minimumLatitude);
            let topClause: query.WherePredicate = query.where(latitudeFieldName, '<=', maximumLatitude);

            if (minimumLongitude < -180 && maximumLongitude > 180) {
                return query.and(topClause, bottomClause);
            }

            if (minimumLongitude < -180) {
                leftClause = query.where(longitudeFieldName, '>=', minimumLongitude + 360);
                leftDateLine = query.where(longitudeFieldName, '<=', 180);
                rightDateLine = query.where(longitudeFieldName, '>=', -180);
                datelineClause = query.or(query.and(leftClause, leftDateLine), query.and(rightClause, rightDateLine));
                return query.and(topClause, bottomClause, datelineClause);
            }

            if (maximumLongitude > 180) {
                rightClause = query.where(longitudeFieldName, '<=', maximumLongitude - 360);
                rightDateLine = query.where(longitudeFieldName, '>=', -180);
                leftDateLine = query.where(longitudeFieldName, '<=', 180);
                datelineClause = query.or(query.and(leftClause, leftDateLine), query.and(rightClause, rightDateLine));
                return query.and(topClause, bottomClause, datelineClause);
            }

            return query.and(leftClause, rightClause, bottomClause, topClause);
        };
    }
    */
}
