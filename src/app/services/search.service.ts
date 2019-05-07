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
    CompoundFilterType,
    FilterClause,
    QueryGroup,
    QueryPayload,
    SortOrder,
    TimeInterval
} from '../../app/services/abstract.search.service';
import { ConnectionService } from './connection.service';
import { RequestWrapper } from '../connection';
import { query } from 'neon-framework';

export class NeonGroupWrapper implements QueryGroup {
    constructor(public group: string | query.GroupByFunctionClause) {}
}

export class NeonQueryWrapper implements QueryPayload {
    /* tslint:disable:no-shadowed-variable */
    constructor(public query: query.Query) {}
    /* tslint:enable:no-shadowed-variable */
}

export class NeonWhereWrapper implements FilterClause {
    constructor(public where: query.WherePredicate) {}
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
     * Returns a new compound filter clause using the given list of filter clauses.  If only one filter clause is given, just return that
     * filter clause.
     *
     * @arg {NeonWhereWrapper[]} filterClauses
     * @arg {CompoundFilterType} [type=CompoundFilterType.AND]
     * @return {NeonWhereWrapper}
     * @abstract
     */
    public buildCompoundFilterClause(
        filterClauses: NeonWhereWrapper[],
        type: CompoundFilterType = CompoundFilterType.AND
    ): NeonWhereWrapper {
        if (!filterClauses.length) {
            return null;
        }
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        let wheres = filterClauses.map((filterClause) => (filterClause as NeonWhereWrapper).where);
        return new NeonWhereWrapper(type === CompoundFilterType.AND ? query.and.apply(query, wheres) :
            query.or.apply(query, wheres));
    }

    /**
     * Returns a new query group using the given group date field and time interval.
     *
     * @arg {string} groupField
     * @arg {TimeInterval} interval
     * @return {NeonGroupWrapper}
     * @override
     */
    public buildDateQueryGroup(groupField: string, interval: TimeInterval): NeonGroupWrapper {
        return new NeonGroupWrapper(new query.GroupByFunctionClause('' + interval, groupField, '_' + interval));
    }

    /**
     * Returns a new filter clause using the given field, operator, and value.
     *
     * @arg {string} field
     * @arg {string} operator
     * @arg {string} value
     * @return {NeonWhereWrapper}
     * @override
     */
    public buildFilterClause(field: string, operator: string, value: string): NeonWhereWrapper {
        return new NeonWhereWrapper(query.where(field, operator, value));
    }

    /**
     * Returns a new query group using the given group field.
     *
     * @arg {string} groupField
     * @return {NeonGroupWrapper}
     * @override
     */
    public buildQueryGroup(groupField: string): NeonGroupWrapper {
        return new NeonGroupWrapper(groupField);
    }

    /**
     * Returns a new search query payload using the given database, table, and field names.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string[]} [fieldNames=[]]
     * @return {NeonQueryWrapper}
     * @override
     */
    public buildQueryPayload(databaseName: string, tableName: string, fieldNames: string[] = []): NeonQueryWrapper {
        let queryObject: query.Query = new query.Query().selectFrom(databaseName, tableName);
        if (fieldNames.length) {
            queryObject.withFields(fieldNames);
        }
        return new NeonQueryWrapper(queryObject);
    }

    /**
     * Returns whether the given datastore type and host can run a search.
     *
     * @arg {string} datastoreType
     * @arg {string} datastoreHost
     * @return {RequestWrapper}
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
     * @arg {NeonQueryWrapper} queryPayload
     * @return {RequestWrapper}
     * @override
     */
    public runSearch(datastoreType: string, datastoreHost: string, queryPayload: NeonQueryWrapper): RequestWrapper {
        let connection = this.connectionService.createActiveConnection(datastoreType, datastoreHost);
        return connection ? connection.executeQuery((queryPayload as NeonQueryWrapper).query, null) : null;
    }

    private transformAggregationType(type: AggregationType): string {
        /* tslint:disable:no-string-literal */
        switch (type) {
            case AggregationType.AVG:
                return query['AVG'];
            case AggregationType.COUNT:
                return query['COUNT'];
            case AggregationType.MAX:
                return query['MAX'];
            case AggregationType.MIN:
                return query['MIN'];
            case AggregationType.SUM:
                return query['SUM'];
        }
        /* tslint:enable:no-string-literal */
        return '';
    }

    /**
     * Transforms the values in the filter clauses in the given search query payload using the given map of keys-to-values-to-labels.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @arg {{ [key: string]: { [value: string]: string } }} keysToValuesToLabels
     * @return {NeonQueryWrapper}
     * @override
     */
    public transformFilterClauseValues(queryPayload: NeonQueryWrapper, keysToValuesToLabels: { [key: string]: { [value: string]: string } }
    ): NeonQueryWrapper {

        /* tslint:disable:no-string-literal */
        let wherePredicate: query.WherePredicate = (queryPayload as NeonQueryWrapper).query['filter'].whereClause;
        /* tslint:enable:no-string-literal */

        this.transformWherePredicateValues(wherePredicate, keysToValuesToLabels);

        return queryPayload;
    }

    /**
     * Transforms the given search query payload into an object to export.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @return {any}
     * @override
     */
    public transformQueryPayloadToExport(queryPayload: NeonQueryWrapper): any {
        return (queryPayload as NeonQueryWrapper).query;
    }

    /**
     * Transforms the values in the given WherePredicate using the given map of keys-to-values-to-labels.
     *
     * @arg {query.WherePredicate} wherePredicate
     * @arg {{ [key: string]: { [value: string]: string } }} keysToValuesToLabels
     */
    private transformWherePredicateValues(
        wherePredicate: query.WherePredicate,
        keysToValuesToLabels: { [key: string]: { [value: string]: string } }
    ): void {

        switch (wherePredicate.type) {
            case 'and':
            case 'or':
                for (let nestedWherePredicate of (wherePredicate as query.BooleanClause).whereClauses) {
                    this.transformWherePredicateValues(nestedWherePredicate, keysToValuesToLabels);
                }
                break;
            case 'where':
                let keys = Object.keys(keysToValuesToLabels);
                let key = (wherePredicate as query.WhereClause).lhs;
                if (keys.includes(key)) {
                    let valuesToLabels = keysToValuesToLabels[key];
                    let values = Object.keys(valuesToLabels);
                    for (let value of values) {
                        if (valuesToLabels[value] === (wherePredicate as query.WhereClause).rhs) {
                            (wherePredicate as query.WhereClause).rhs = value;
                        }
                    }
                }
                break;
        }
    }

    /**
     * Sets the aggregation data on the given search query payload.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @arg {AggregationType} type
     * @arg {string} name
     * @arg {string} field
     * @return {AbstractSearchService}
     * @override
     */
    public updateAggregation(queryPayload: NeonQueryWrapper, type: AggregationType, name: string, field: string): AbstractSearchService {
        (queryPayload as NeonQueryWrapper).query.aggregate(this.transformAggregationType(type), field, name);
        return this;
    }

    // TODO THOR-950 Temp function
    /**
     * Sets the fields data in the given search query payload.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @arg {string[]} fields
     * @return {AbstractSearchService}
     * @override
     */
    public updateFields(queryPayload: NeonQueryWrapper, fields: string[]): AbstractSearchService {
        let existingFields: string[] = ((queryPayload as NeonQueryWrapper).query as any).fields;
        (queryPayload as NeonQueryWrapper).query.withFields((existingFields.length === 1 && existingFields[0] === '*') ? fields :
            existingFields.concat(fields));
        return this;
    }

    /**
     * Sets the fields data in the given search query payload to match all fields.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @return {AbstractSearchService}
     * @override
     */
    public updateFieldsToMatchAll(queryPayload: NeonQueryWrapper): AbstractSearchService {
        (queryPayload as NeonQueryWrapper).query.withFields('*');
        return this;
    }

    /**
     * Sets the filter clause data on the given search query payload.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @arg {NeonWhereWrapper} filterClause
     * @return {AbstractSearchService}
     * @override
     */
    public updateFilter(queryPayload: NeonQueryWrapper, filterClause: NeonWhereWrapper): AbstractSearchService {
        (queryPayload as NeonQueryWrapper).query.where((filterClause as NeonWhereWrapper).where);
        return this;
    }

    /**
     * Sets the group data on the given search query payload.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @arg {NeonGroupWrapper[]} groups
     * @return {AbstractSearchService}
     * @override
     */
    public updateGroups(queryPayload: NeonQueryWrapper, groups: NeonGroupWrapper[]): AbstractSearchService {
        (queryPayload as NeonQueryWrapper).query.groupBy(groups.map((group) => (group as NeonGroupWrapper).group));
        return this;
    }

    /**
     * Sets the limit data on the given search query payload.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @arg {number} limit
     * @return {AbstractSearchService}
     * @override
     */
    public updateLimit(queryPayload: NeonQueryWrapper, limit: number): AbstractSearchService {
        (queryPayload as NeonQueryWrapper).query.limit(limit);
        return this;
    }

    /**
     * Sets the offset data on the given search query payload.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @arg {number} offset
     * @return {AbstractSearchService}
     * @override
     */
    public updateOffset(queryPayload: NeonQueryWrapper, offset: number): AbstractSearchService {
        (queryPayload as NeonQueryWrapper).query.offset(offset);
        return this;
    }

    /**
     * Sets the sort data on the given search query payload.
     *
     * @arg {NeonQueryWrapper} queryPayload
     * @arg {string} field
     * @arg {SortOrder} [order=SortOrder.ASCENDING]
     * @return {AbstractSearchService}
     * @override
     */
    public updateSort(queryPayload: NeonQueryWrapper, field: string, order: SortOrder = SortOrder.ASCENDING): AbstractSearchService {
        /* tslint:disable:no-string-literal */
        (queryPayload as NeonQueryWrapper).query.sortBy(field, order === SortOrder.ASCENDING ? query['ASCENDING'] :
            query['DESCENDING']);
        /* tslint:enable:no-string-literal */
        return this;
    }
}
