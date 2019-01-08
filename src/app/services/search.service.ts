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

import {
    AbstractSearchService,
    AggregationType,
    BoolFilterType,
    NeonFilterClause,
    NeonQueryGroup,
    NeonQueryPayload,
    SortOrder,
    TimeInterval
} from '../../app/services/abstract.search.service';
import { ConnectionService } from './connection.service';

import { NeonRequest } from '../connection';
import * as neon from 'neon-framework';

export class GroupWrapper implements NeonQueryGroup {
    constructor(public group: string | neon.query.GroupByFunctionClause) {}
}

export class QueryWrapper implements NeonQueryPayload {
    constructor(public query: neon.query.Query) {}
}

export class WhereWrapper implements NeonFilterClause {
    constructor(public where: neon.query.WherePredicate) {}
}

/**
 * A service to run searches.
 *
 * @class SearchService
 */
@Injectable()
export class SearchService extends AbstractSearchService {

    constructor(protected connectionService: ConnectionService) {
        super();
    }

    /**
     * Returns a new boolean filter clause using the given list of filter clauses.  If only one filter clause is given, just return that
     * filter clause.
     *
     * @arg {NeonFilterClause[]} filterClauses
     * @arg {BoolFilterType} [type=BoolFilterType.AND]
     * @return {NeonFilterClause}
     * @abstract
     */
    public buildBoolFilterClause(filterClauses: NeonFilterClause[], type: BoolFilterType = BoolFilterType.AND): NeonFilterClause {
        if (!filterClauses.length) {
            return null;
        }
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        let wheres = filterClauses.map((filterClause) => (filterClause as WhereWrapper).where);
        return new WhereWrapper(type === BoolFilterType.AND ? neon.query.and.apply(neon.query, wheres) :
            neon.query.or.apply(neon.query, wheres));
    }

    /**
     * Returns a new query group using the given group date field and time interval.
     *
     * @arg {string} groupField
     * @arg {TimeInterval} interval
     * @return {NeonQueryGroup}
     * @override
     */
    public buildDateQueryGroup(groupField: string, interval: TimeInterval): NeonQueryGroup {
        return new GroupWrapper(new neon.query.GroupByFunctionClause('' + interval, groupField, '_' + interval));
    }

    /**
     * Returns a new filter clause using the given field, operator, and value.
     *
     * @arg {string} field
     * @arg {string} operator
     * @arg {string} value
     * @return {NeonFilterClause}
     * @override
     */
    public buildFilterClause(field: string, operator: string, value: string): NeonFilterClause {
        return new WhereWrapper(neon.query.where(field, operator, value));
    }

    /**
     * Returns a new query group using the given group field.
     *
     * @arg {string} groupField
     * @return {NeonQueryGroup}
     * @override
     */
    public buildQueryGroup(groupField: string): NeonQueryGroup {
        return new GroupWrapper(groupField);
    }

    /**
     * Returns a new search query payload using the given database, table, and field names.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string[]} [fieldNames=[]]
     * @return {NeonQueryPayload}
     * @override
     */
    public buildQueryPayload(databaseName: string, tableName: string, fieldNames: string[] = []): NeonQueryPayload {
        let query: neon.query.Query = new neon.query.Query().selectFrom(databaseName, tableName);
        if (fieldNames.length) {
            query.withFields(fieldNames);
        }
        return new QueryWrapper(query);
    }

    /**
     * Returns whether the given datastore type and host can run a search.
     *
     * @arg {string} datastoreType
     * @arg {string} datastoreHost
     * @return {NeonRequest}
     * @override
     */
    public canRunSearch(datastoreType: string, datastoreHost: string): boolean {
        return !!(this.connectionService.createActiveConnection(datastoreType, datastoreHost));
    }

    /**
     * Runs the given search using the given datastore type and host.
     *
     * @arg {string} datastoreType
     * @arg {string} datastoreHost
     * @arg {NeonQueryPayload} queryPayload
     * @return {NeonRequest}
     * @override
     */
    public runSearch(datastoreType: string, datastoreHost: string, queryPayload: NeonQueryPayload): NeonRequest {
        let connection = this.connectionService.createActiveConnection(datastoreType, datastoreHost);
        return connection ? connection.executeQuery((queryPayload as QueryWrapper).query, null) : null;
    }

    private transformAggregationType(type: AggregationType): string {
        /* tslint:disable:no-string-literal */
        switch (type) {
            case AggregationType.AVG:
                return neon.query['AVG'];
            case AggregationType.COUNT:
                return neon.query['COUNT'];
            case AggregationType.MAX:
                return neon.query['MAX'];
            case AggregationType.MIN:
                return neon.query['MIN'];
            case AggregationType.SUM:
                return neon.query['SUM'];
        }
        /* tslint:enable:no-string-literal */
        return '';
    }

    /**
     * Transforms the values in the filter clauses in the given search query payload using the given map of keys-to-values-to-labels.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {{ [key: string]: { [value: string]: string } }} keysToValuesToLabels
     * @return {NeonQueryPayload}
     * @override
     */
    public transformFilterClauseValues(queryPayload: NeonQueryPayload, keysToValuesToLabels: { [key: string]: { [value: string]: string } }
    ): NeonQueryPayload {

        /* tslint:disable:no-string-literal */
        let wherePredicate: neon.query.WherePredicate = (queryPayload as QueryWrapper).query['filter'].whereClause;
        /* tslint:enable:no-string-literal */

        this.transformWherePredicateValues(wherePredicate, keysToValuesToLabels);

        return queryPayload;
    }

    /**
     * Transforms the given search query payload into an object to export.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @return {any}
     * @override
     */
    public transformQueryPayloadToExport(queryPayload: NeonQueryPayload): any {
        return (queryPayload as QueryWrapper).query;
    }

    private transformWherePredicateValues(
        wherePredicate: neon.query.WherePredicate,
        keysToValuesToLabels: { [key: string]: { [value: string]: string } }
    ): void {

        switch (wherePredicate.type) {
            case 'and':
            case 'or':
                for (let nestedWherePredicate of (wherePredicate as neon.query.BooleanClause).whereClauses) {
                    this.transformWherePredicateValues(nestedWherePredicate, keysToValuesToLabels);
                }
                break;
            case 'where':
                let keys = Object.keys(keysToValuesToLabels);
                let key = (wherePredicate as neon.query.WhereClause).lhs;
                if (keys.includes(key)) {
                    let valuesToLabels = keysToValuesToLabels[key];
                    let values = Object.keys(valuesToLabels);
                    for (let value of values) {
                        if (valuesToLabels[value] === (wherePredicate as neon.query.WhereClause).rhs) {
                            (wherePredicate as neon.query.WhereClause).rhs = value;
                        }
                    }
                }
                break;
        }
    }

    /**
     * Sets the aggregation data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {AggregationType} type
     * @arg {string} name
     * @arg {string} field
     * @return {AbstractSearchService}
     * @override
     */
    public updateAggregation(queryPayload: NeonQueryPayload, type: AggregationType, name: string, field: string): AbstractSearchService {
        (queryPayload as QueryWrapper).query.aggregate(this.transformAggregationType(type), field, name);
        return this;
    }

    // TODO THOR-950 Temp function
    /**
     * Sets the fields data in the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {string[]} fields
     * @return {AbstractSearchService}
     * @override
     */
    public updateFields(queryPayload: NeonQueryPayload, fields: string[]): AbstractSearchService {
        let existingFields: string[] = ((queryPayload as QueryWrapper).query as any).fields;
        (queryPayload as QueryWrapper).query.withFields((existingFields.length === 1 && existingFields[0] === '*') ? fields :
            existingFields.concat(fields));
        return this;
    }

    /**
     * Sets the fields data in the given search query payload to match all fields.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @return {AbstractSearchService}
     * @override
     */
    public updateFieldsToMatchAll(queryPayload: NeonQueryPayload): AbstractSearchService {
        (queryPayload as QueryWrapper).query.withFields('*');
        return this;
    }

    /**
     * Sets the filter clause data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {NeonFilterClause} filterClause
     * @return {AbstractSearchService}
     * @override
     */
    public updateFilter(queryPayload: NeonQueryPayload, filterClause: NeonFilterClause): AbstractSearchService {
        (queryPayload as QueryWrapper).query.where((filterClause as WhereWrapper).where);
        return this;
    }

    /**
     * Sets the group data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {NeonQueryGroup[]} groups
     * @return {AbstractSearchService}
     * @override
     */
    public updateGroups(queryPayload: NeonQueryPayload, groups: NeonQueryGroup[]): AbstractSearchService {
        (queryPayload as QueryWrapper).query.groupBy(groups.map((group) => (group as GroupWrapper).group));
        return this;
    }

    /**
     * Sets the limit data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {number} limit
     * @return {AbstractSearchService}
     * @override
     */
    public updateLimit(queryPayload: NeonQueryPayload, limit: number): AbstractSearchService {
        (queryPayload as QueryWrapper).query.limit(limit);
        return this;
    }

    /**
     * Sets the offset data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {number} offset
     * @return {AbstractSearchService}
     * @override
     */
    public updateOffset(queryPayload: NeonQueryPayload, offset: number): AbstractSearchService {
        (queryPayload as QueryWrapper).query.offset(offset);
        return this;
    }

    /**
     * Sets the sort data on the given search query payload.
     *
     * @arg {NeonQueryPayload} queryPayload
     * @arg {string} field
     * @arg {SortOrder} [order=SortOrder.ASCENDING]
     * @return {AbstractSearchService}
     * @override
     */
    public updateSort(queryPayload: NeonQueryPayload, field: string, order: SortOrder = SortOrder.ASCENDING): AbstractSearchService {
        /* tslint:disable:no-string-literal */
        (queryPayload as QueryWrapper).query.sortBy(field, order === SortOrder.ASCENDING ? neon.query['ASCENDING'] :
            neon.query['DESCENDING']);
        /* tslint:enable:no-string-literal */
        return this;
    }
}
