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
import { Dashboard, Datastore } from '../dataset';

export enum AggregationType {
    AVG = 'avg',
    COUNT = 'count',
    MAX = 'max',
    MIN = 'min',
    SUM = 'sum'
}

export enum CompoundFilterType {
    AND = 'and',
    OR = 'or'
}

export interface Connection {
    /**
     * Deletes the saved dashboard state with the given name.
     *
     * @arg {string} stateName
     * @arg {(response: any) => void} onSuccess
     * @arg {(response: any) => void} [onError]
     * @return {RequestWrapper}
     * @abstract
     */
    deleteState(stateName: string, onSuccess: (response: any) => void, onError?: (response: any) => void): RequestWrapper;

    /**
     * Returns the accessible database names.
     *
     * @arg {(response: any) => void} onSuccess
     * @arg {(response: any) => void} [onError]
     * @return {RequestWrapper}
     * @abstract
     */
    getDatabaseNames(onSuccess: (response: any) => void, onError?: (response: any) => void): RequestWrapper;

    /**
     * Returns the types of the fields in the given database/table.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {(response: any) => void} onSuccess
     * @arg {(response: any) => void} [onError]
     * @return {RequestWrapper}
     * @abstract
     */
    getFieldTypes(databaseName: string, tableName: string, onSuccess: (response: any) => void,
        onError?: (response: any) => void): RequestWrapper;

    /**
     * Returns the saved dashboard state names.
     *
     * @arg {(response: any) => void} onSuccess
     * @arg {(response: any) => void} [onError]
     * @return {RequestWrapper}
     * @abstract
     */
    getStateNames(onSuccess: (response: any) => void, onError?: (response: any) => void): RequestWrapper;

    /**
     * Returns the table and field names in the given database.
     *
     * @arg {string} databaseName
     * @arg {(response: any) => void} onSuccess
     * @arg {(response: any) => void} [onError]
     * @return {RequestWrapper}
     * @abstract
     */
    getTableNamesAndFieldNames(databaseName: string, onSuccess: (response: any) => void, onError?: (response: any) => void):
        RequestWrapper;

    /**
     * Loads the saved state with the given name.
     *
     * @arg {string} stateName
     * @arg {(response: any) => void} onSuccess
     * @arg {(response: any) => void} [onError]
     * @return {RequestWrapper}
     * @abstract
     */
    loadState(stateName: string, onSuccess: (response: any) => void, onError?: (response: any) => void): RequestWrapper;

    /**
     * Runs an export query with the given data and format.
     *
     * @arg {any} exportData
     * @arg {any} exportFormat
     * @arg {(response: any) => void} onSuccess
     * @arg {(response: any) => void} [onError]
     * @return {RequestWrapper}
     * @abstract
     */
    runExportQuery(exportData: any, exportFormat: any, onSuccess: (response: any) => void, onError?: (response: any) => void):
        RequestWrapper;

    /**
     * Runs a search query with the given payload.
     *
     * @arg {QueryPayload} queryPayload
     * @arg {(response: any) => void} onSuccess
     * @arg {(response: any) => void} [onError]
     * @return {RequestWrapper}
     * @abstract
     */
    runSearchQuery(queryPayload: QueryPayload, onSuccess: (response: any) => void, onError?: (response: any) => void):
        RequestWrapper;

    /**
     * Saves (or overwrites) a state with the given data.
     *
     * @arg {{dashboards:Dashboard,datastores:Datastore[],layouts:any,stateName:string}} stateData
     * @arg {(response: any) => void} onSuccess
     * @arg {(response: any) => void} [onError]
     * @return {RequestWrapper}
     * @abstract
     */
    saveState(stateData: { dashboards: Dashboard, datastores: Datastore[], layouts: any, stateName: string },
        onSuccess: (response: any) => void, onError?: (response: any) => void): RequestWrapper;
}

export interface RequestWrapper {
    abort(): void;
    always(callback: Function): void;
    done(callback: Function): void;
    fail(callback: Function): void;
}

export enum SortOrder {
    ASCENDING = 'ascending',
    DESCENDING = 'descending'
}

export enum TimeInterval {
    MINUTE = 'minute',
    HOUR = 'hour',
    DAY_OF_MONTH = 'dayOfMonth',
    MONTH = 'month',
    YEAR = 'year'
}

/* tslint:disable:no-empty-interface */
export interface FilterClause {}

export interface QueryGroup {}

export interface QueryPayload {}
/* tslint:enable:no-empty-interface */

/**
 * A service to run searches.
 *
 * @class AbstractSearchService
 * @abstract
 */
@Injectable()
export abstract class AbstractSearchService {

    /**
     * Returns a new compound filter clause using the given list of filter clauses.  If only one filter clause is given, just return that
     * filter clause.
     *
     * @arg {FilterClause[]} filterClauses
     * @arg {CompoundFilterType} [type]
     * @return {FilterClause}
     * @abstract
     */
    public abstract buildCompoundFilterClause(filterClauses: FilterClause[], type?: CompoundFilterType): FilterClause;

    /**
     * Returns a new query group using the given group date field and time interval.
     *
     * @arg {string} groupField
     * @arg {TimeInterval} interval
     * @return {QueryGroup}
     * @abstract
     */
    public abstract buildDateQueryGroup(groupField: string, interval: TimeInterval): QueryGroup;

    /**
     * Returns a new filter clause using the given field, operator, and value.
     *
     * @arg {string} field
     * @arg {string} operator
     * @arg {string} value
     * @return {FilterClause}
     * @abstract
     */
    public abstract buildFilterClause(field: string, operator: string, value: string): FilterClause;

    /**
     * Returns a new query group using the given group field.
     *
     * @arg {string} groupField
     * @return {QueryGroup}
     * @abstract
     */
    public abstract buildQueryGroup(groupField: string): QueryGroup;

    /**
     * Returns a new search query payload using the given database, table, and field names.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string[]} [fieldNames]
     * @return {QueryPayload}
     * @abstract
     */
    public abstract buildQueryPayload(databaseName: string, tableName: string, fieldNames?: string[]): QueryPayload;

    /**
     * Returns whether the given datastore type and host can run a search.
     *
     * @arg {string} datastoreType
     * @arg {string} datastoreHost
     * @return {RequestWrapper}
     * @abstract
     */
    public abstract canRunSearch(datastoreType: string, datastoreHost: string): boolean;

    /**
     * Returns a connection to the REST server.
     *
     * @arg {string} type
     * @arg {string} host
     * @return {Connection}
     */
    public abstract createConnection(type: string, host: string): Connection;

    /**
     * Runs the given search using the given datastore type and host.
     *
     * @arg {string} datastoreType
     * @arg {string} datastoreHost
     * @arg {QueryPayload} queryPayload
     * @return {RequestWrapper}
     * @abstract
     */
    public abstract runSearch(datastoreType: string, datastoreHost: string, queryPayload: QueryPayload): RequestWrapper;

    /**
     * Transforms the values in the filter clauses in the given search query payload using the given map of keys-to-values-to-labels.
     *
     * @arg {QueryPayload} queryPayload
     * @arg {{ [key: string]: { [value: string]: label } }} keysToValuesToLabels
     * @return {QueryPayload}
     * @abstract
     */
    public abstract transformFilterClauseValues(queryPayload: QueryPayload, keysToValuesToLabels:
        { [key: string]: { [value: string]: string } }): QueryPayload;

    /**
     * Transforms the given search query payload into an object to export.
     *
     * @arg {QueryPayload} queryPayload
     * @return {any}
     * @abstract
     */
    public abstract transformQueryPayloadToExport(queryPayload: QueryPayload): any;

    /**
     * Sets the aggregation data on the given search query payload.
     *
     * @arg {QueryPayload} queryPayload
     * @arg {AggregationType} type
     * @arg {string} name
     * @arg {string} field
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateAggregation(queryPayload: QueryPayload, type: AggregationType, name: string,
        field: string): AbstractSearchService;

    /**
     * Sets the fields data in the given search query payload.
     *
     * @arg {QueryPayload} queryPayload
     * @arg {string[]} fields
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateFields(queryPayload: QueryPayload, fields: string[]): AbstractSearchService;

    /**
     * Sets the fields data in the given search query payload to match all fields.
     *
     * @arg {QueryPayload} queryPayload
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateFieldsToMatchAll(queryPayload: QueryPayload): AbstractSearchService;

    /**
     * Sets the filter clause data on the given search query payload.
     *
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause} filterClause
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateFilter(queryPayload: QueryPayload, filterClause: FilterClause): AbstractSearchService;

    /**
     * Sets the group data on the given search query payload.
     *
     * @arg {QueryPayload} queryPayload
     * @arg {QueryGroup[]} groups
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateGroups(queryPayload: QueryPayload, groups: QueryGroup[]): AbstractSearchService;

    /**
     * Sets the limit data on the given search query payload.
     *
     * @arg {QueryPayload} queryPayload
     * @arg {number} limit
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateLimit(queryPayload: QueryPayload, limit: number): AbstractSearchService;

    /**
     * Sets the offset data on the given search query payload.
     *
     * @arg {QueryPayload} queryPayload
     * @arg {number} offset
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateOffset(queryPayload: QueryPayload, offset: number): AbstractSearchService;

    /**
     * Sets the sort data on the given search query payload.
     *
     * @arg {QueryPayload} queryPayload
     * @arg {string} field
     * @arg {SortOrder} [order]
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateSort(queryPayload: QueryPayload, field: string, order?: SortOrder): AbstractSearchService;
}
