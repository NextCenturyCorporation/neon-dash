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
import { NeonRequest } from '../connection';

export enum AggregationType {
    AVG = 'avg',
    COUNT = 'count',
    MAX = 'max',
    MIN = 'min',
    SUM = 'sum'
}

export enum BoolFilterType {
    AND = 'and',
    OR = 'or'
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
export interface NeonFilterClause {}

export interface NeonQueryGroup {}

export interface NeonQueryPayload {}
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
     * Returns a new boolean filter clause using the given list of filter clauses.  If only one filter clause is given, just return that
     * filter clause.
     *
     * @arg {NeonFilterClause[]} filterClauses
     * @arg {BoolFilterType} [type]
     * @return {NeonFilterClause}
     * @abstract
     */
    public abstract buildBoolFilterClause(filterClauses: NeonFilterClause[], type?: BoolFilterType): NeonFilterClause;

    /**
     * Returns a new query group using the given group date field and time interval.
     *
     * @arg {string} groupField
     * @arg {TimeInterval} interval
     * @return {NeonQueryGroup}
     * @abstract
     */
    public abstract buildDateQueryGroup(groupField: string, interval: TimeInterval): NeonQueryGroup;

    /**
     * Returns a new filter clause using the given field, operator, and value.
     *
     * @arg {string} field
     * @arg {string} operator
     * @arg {string} value
     * @return {NeonFilterClause}
     * @abstract
     */
    public abstract buildFilterClause(field: string, operator: string, value: string): NeonFilterClause;

    /**
     * Returns a new query group using the given group field.
     *
     * @arg {string} groupField
     * @return {NeonQueryGroup}
     * @abstract
     */
    public abstract buildQueryGroup(groupField: string): NeonQueryGroup;

    /**
     * Returns a new search query payload using the given database, table, and field names.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string[]} [fieldNames]
     * @return {NeonQueryPayload}
     * @abstract
     */
    public abstract buildQueryPayload(databaseName: string, tableName: string, fieldNames?: string[]): NeonQueryPayload;

    /**
     * Returns whether the given datastore type and host can run a search.
     *
     * @arg {string} datastoreType
     * @arg {string} datastoreHost
     * @return {NeonRequest}
     * @abstract
     */
    public abstract canRunSearch(datastoreType: string, datastoreHost: string): boolean;

    /**
     * Runs the given search using the given datastore type and host.
     *
     * @arg {string} datastoreType
     * @arg {string} datastoreHost
     * @arg {NeonQueryPayload} queryPayload
     * @return {NeonRequest}
     * @abstract
     */
    public abstract runSearch(datastoreType: string, datastoreHost: string, queryPayload: NeonQueryPayload): NeonRequest;

    /**
     * Transforms the values in the filter clauses in the given search query payload using the given map of keys-to-values-to-labels.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {{ [key: string]: { [value: string]: label } }} keysToValuesToLabels
     * @return {NeonQueryPayload}
     * @abstract
     */
    public abstract transformFilterClauseValues(queryPayload: NeonQueryPayload, keysToValuesToLabels:
        { [key: string]: { [value: string]: string } }): NeonQueryPayload;

    /**
     * Transforms the given search query payload into an object to export.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @return {any}
     * @abstract
     */
    public abstract transformQueryPayloadToExport(queryPayload: NeonQueryPayload): any;

    /**
     * Sets the aggregation data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {AggregationType} type
     * @arg {string} name
     * @arg {string} field
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateAggregation(queryPayload: NeonQueryPayload, type: AggregationType, name: string,
        field: string): AbstractSearchService;

    /**
     * Sets the fields data in the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {string[]} fields
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateFields(queryPayload: NeonQueryPayload, fields: string[]): AbstractSearchService;

    /**
     * Sets the fields data in the given search query payload to match all fields.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateFieldsToMatchAll(queryPayload: NeonQueryPayload): AbstractSearchService;

    /**
     * Sets the filter clause data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {NeonFilterClause} filterClause
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateFilter(queryPayload: NeonQueryPayload, filterClause: NeonFilterClause): AbstractSearchService;

    /**
     * Sets the group data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {NeonQueryGroup[]} groups
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateGroups(queryPayload: NeonQueryPayload, groups: NeonQueryGroup[]): AbstractSearchService;

    /**
     * Sets the limit data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {number} limit
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateLimit(queryPayload: NeonQueryPayload, limit: number): AbstractSearchService;

    /**
     * Sets the offset data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {number} offset
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateOffset(queryPayload: NeonQueryPayload, offset: number): AbstractSearchService;

    /**
     * Sets the sort data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {string} field
     * @arg {SortOrder} [order]
     * @return {AbstractSearchService}
     * @abstract
     */
    public abstract updateSort(queryPayload: NeonQueryPayload, field: string, order?: SortOrder): AbstractSearchService;
}
