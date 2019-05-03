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

export class GroupWrapper implements QueryGroup {
    constructor(public group: string | query.GroupByFunctionClause) {}
}

export class QueryWrapper implements QueryPayload {
    /* tslint:disable:no-shadowed-variable */
    constructor(public query: query.Query) {}
    /* tslint:enable:no-shadowed-variable */
}

export class WhereWrapper implements FilterClause {
    constructor(public where: query.WherePredicate) {}
}

interface ExportField {
    query: string;
    pretty: string;
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
     * @arg {WhereWrapper[]} filterClauses
     * @arg {CompoundFilterType} [type=CompoundFilterType.AND]
     * @return {WhereWrapper}
     * @abstract
     */
    public buildCompoundFilterClause(filterClauses: WhereWrapper[], type: CompoundFilterType = CompoundFilterType.AND): WhereWrapper {
        if (!filterClauses.length) {
            return null;
        }
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        let wheres = filterClauses.map((filterClause) => (filterClause as WhereWrapper).where);
        return new WhereWrapper(type === CompoundFilterType.AND ? query.and.apply(query, wheres) :
            query.or.apply(query, wheres));
    }

    /**
     * Returns a new query group using the given group date field and time interval.
     *
     * @arg {string} groupField
     * @arg {TimeInterval} interval
     * @return {GroupWrapper}
     * @override
     */
    public buildDateQueryGroup(groupField: string, interval: TimeInterval): GroupWrapper {
        return new GroupWrapper(new query.GroupByFunctionClause('' + interval, groupField, '_' + interval));
    }

    /**
     * Returns a new filter clause using the given field, operator, and value.
     *
     * @arg {string} field
     * @arg {string} operator
     * @arg {string} value
     * @return {WhereWrapper}
     * @override
     */
    public buildFilterClause(field: string, operator: string, value: string): WhereWrapper {
        return new WhereWrapper(query.where(field, operator, value));
    }

    /**
     * Returns a new query group using the given group field.
     *
     * @arg {string} groupField
     * @return {GroupWrapper}
     * @override
     */
    public buildQueryGroup(groupField: string): GroupWrapper {
        return new GroupWrapper(groupField);
    }

    /**
     * Returns a new search query payload using the given database, table, and field names.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string[]} [fieldNames=[]]
     * @return {QueryWrapper}
     * @override
     */
    public buildQueryPayload(databaseName: string, tableName: string, fieldNames: string[] = []): QueryWrapper {
        let queryObject: query.Query = new query.Query().selectFrom(databaseName, tableName);
        if (fieldNames.length) {
            queryObject.withFields(fieldNames);
        }
        return new QueryWrapper(queryObject);
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
     * Finds and returns the export fields from the fields, groupByClauses, and aggregates in the given export query object.
     * Assumes activeFields does not have duplicates.
     *
     * @arg {query.Query} exportQuery
     * @arg {{columnName:string,prettyName:string}[]} activeFields
     * @return {ExportField[]}
     * @private
     */
    private findExportFields(exportQuery: any, activeFields: { columnName: string, prettyName: string }[]): ExportField[] {
        // Use all activeFields if the exportQuery fields are a wildcard.
        let isWildcard: boolean = (exportQuery.fields.length === 1 && exportQuery.fields[0] === '*');

        // Save each activeField that is a field from the exportQuery in the export fields.
        let queryFields: ExportField[] = (isWildcard ? activeFields : activeFields.filter((activeField) =>
            exportQuery.fields.some((exportFieldName) => exportFieldName === activeField.columnName))).map((activeField) => ({
                query: activeField.columnName,
                pretty: activeField.prettyName
            } as ExportField));

        // Save each group function from the exportQuery in the export fields.
        let groupFields: ExportField[] = exportQuery.groupByClauses.filter((group) => group.type === 'function').map((group) => {
            // Remove the field of each group function from the queryFields.
            queryFields = queryFields.filter((field) => field.query !== group.field);
            return {
                query: group.name,
                pretty: this.transformDateGroupOperatorToPrettyName(group.operation, group.field, activeFields)
            } as ExportField;
        });

        // Save each aggregation field from the exportQuery in the export fields.
        let aggregationFields: ExportField[] = exportQuery.aggregates.map((aggregate) => {
            // Remove the field of each non-COUNT aggregation from the queryFields.
            /* tslint:disable:no-string-literal */
            if (aggregate.operation !== query['COUNT']) {
                queryFields = queryFields.filter((field) => field.query !== aggregate.field);
            }
            /* tslint:enable:no-string-literal */
            return {
                query: aggregate.name,
                pretty: this.transformAggregationOperatorToPrettyName(aggregate.operation, aggregate.field, activeFields)
            } as ExportField;
        });

        return queryFields.concat(groupFields).concat(aggregationFields);
    }

    /**
     * Runs the given search using the given datastore type and host.
     *
     * @arg {string} datastoreType
     * @arg {string} datastoreHost
     * @arg {QueryWrapper} queryPayload
     * @return {RequestWrapper}
     * @override
     */
    public runSearch(datastoreType: string, datastoreHost: string, queryPayload: QueryWrapper): RequestWrapper {
        let connection = this.connectionService.createActiveConnection(datastoreType, datastoreHost);
        return connection ? connection.executeQuery(queryPayload.query, null) : null;
    }

    private transformAggregationOperatorToPrettyName(
        aggregationOperator: string,
        aggregationField: string,
        fields: { columnName: string, prettyName: string }[]
    ): string {
        let prettyName = (fields.filter((field) => field.columnName === aggregationField)[0] || {} as any).prettyName;
        /* tslint:disable:no-string-literal */
        switch (aggregationOperator) {
            case query['AVG']:
                return 'Average' + (prettyName ? (' ' + prettyName) : '');
            case query['COUNT']:
                return 'Count' + (prettyName ? (' ' + prettyName) : '');
            case query['MAX']:
                return 'Maximum' + (prettyName ? (' ' + prettyName) : '');
            case query['MIN']:
                return 'Minimum' + (prettyName ? (' ' + prettyName) : '');
            case query['SUM']:
                return 'Sum' + (prettyName ? (' ' + prettyName) : '');
        }
        /* tslint:enable:no-string-literal */
        return '';
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

    private transformDateGroupOperatorToPrettyName(
        groupOperator: string,
        groupField: string,
        fields: { columnName: string, prettyName: string }[]
    ): string {
        let prettyName = (fields.filter((field) => field.columnName === groupField)[0] || {} as any).prettyName;
        switch (groupOperator) {
            case 'minute':
                return 'Minute' + (prettyName ? (' ' + prettyName) : '');
            case 'hour':
                return 'Hour' + (prettyName ? (' ' + prettyName) : '');
            case 'dayOfMonth':
                return 'Day' + (prettyName ? (' ' + prettyName) : '');
            case 'month':
                return 'Month' + (prettyName ? (' ' + prettyName) : '');
            case 'year':
                return 'Year' + (prettyName ? (' ' + prettyName) : '');
        }
        return '';
    }

    /**
     * Transforms the values in the filter clauses in the given search query payload using the given map of keys-to-values-to-labels.
     *
     * @arg {QueryWrapper} queryPayload
     * @arg {{ [key: string]: { [value: string]: string } }} keysToValuesToLabels
     * @return {QueryWrapper}
     * @override
     */
    public transformFilterClauseValues(queryPayload: QueryWrapper, keysToValuesToLabels: { [key: string]: { [value: string]: string } }
    ): QueryWrapper {

        /* tslint:disable:no-string-literal */
        let wherePredicate: query.WherePredicate = queryPayload.query['filter'].whereClause;
        /* tslint:enable:no-string-literal */

        this.transformWherePredicateValues(wherePredicate, keysToValuesToLabels);

        return queryPayload;
    }

    /**
     * Transforms the given search query payload into an object to export.
     *
     * @arg {{columnName:string,prettyName:string}[]} fields
     * @arg {QueryWrapper} queryPayload
     * @arg {string} uniqueName
     * @return {any}
     * @override
     */
    public transformQueryPayloadToExport(
        fields: { columnName: string, prettyName: string }[],
        queryPayload: QueryWrapper,
        uniqueName: string
    ): any {
        return {
            data: {
                fields: this.findExportFields(queryPayload.query, fields),
                ignoreFilters: undefined,
                ignoredFilterIds: [],
                name: uniqueName,
                query: queryPayload.query,
                selectionOnly: undefined,
                type: 'query'
            }
        };
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
     * @arg {QueryWrapper} queryPayload
     * @arg {AggregationType} type
     * @arg {string} name
     * @arg {string} field
     * @return {AbstractSearchService}
     * @override
     */
    public updateAggregation(queryPayload: QueryWrapper, type: AggregationType, name: string, field: string): AbstractSearchService {
        queryPayload.query.aggregate(this.transformAggregationType(type), field, name);
        return this;
    }

    // TODO THOR-950 Temp function
    /**
     * Sets the fields data in the given search query payload.
     *
     * @arg {QueryWrapper} queryPayload
     * @arg {string[]} fields
     * @return {AbstractSearchService}
     * @override
     */
    public updateFields(queryPayload: QueryWrapper, fields: string[]): AbstractSearchService {
        let existingFields: string[] = (queryPayload.query as any).fields;
        queryPayload.query.withFields((existingFields.length === 1 && existingFields[0] === '*') ? fields : existingFields.concat(fields));
        return this;
    }

    /**
     * Sets the fields data in the given search query payload to match all fields.
     *
     * @arg {QueryWrapper} queryPayload
     * @return {AbstractSearchService}
     * @override
     */
    public updateFieldsToMatchAll(queryPayload: QueryWrapper): AbstractSearchService {
        queryPayload.query.withFields('*');
        return this;
    }

    /**
     * Sets the filter clause data on the given search query payload.
     *
     * @arg {QueryWrapper} queryPayload
     * @arg {WhereWrapper} filterClause
     * @return {AbstractSearchService}
     * @override
     */
    public updateFilter(queryPayload: QueryWrapper, filterClause: WhereWrapper): AbstractSearchService {
        queryPayload.query.where((filterClause as WhereWrapper).where);
        return this;
    }

    /**
     * Sets the group data on the given search query payload.
     *
     * @arg {QueryWrapper} queryPayload
     * @arg {GroupWrapper[]} groups
     * @return {AbstractSearchService}
     * @override
     */
    public updateGroups(queryPayload: QueryWrapper, groups: GroupWrapper[]): AbstractSearchService {
        queryPayload.query.groupBy(groups.map((group) => (group as GroupWrapper).group));
        return this;
    }

    /**
     * Sets the limit data on the given search query payload.
     *
     * @arg {QueryWrapper} queryPayload
     * @arg {number} limit
     * @return {AbstractSearchService}
     * @override
     */
    public updateLimit(queryPayload: QueryWrapper, limit: number): AbstractSearchService {
        queryPayload.query.limit(limit);
        return this;
    }

    /**
     * Sets the offset data on the given search query payload.
     *
     * @arg {QueryWrapper} queryPayload
     * @arg {number} offset
     * @return {AbstractSearchService}
     * @override
     */
    public updateOffset(queryPayload: QueryWrapper, offset: number): AbstractSearchService {
        queryPayload.query.offset(offset);
        return this;
    }

    /**
     * Sets the sort data on the given search query payload.
     *
     * @arg {QueryWrapper} queryPayload
     * @arg {string} field
     * @arg {SortOrder} [order=SortOrder.ASCENDING]
     * @return {AbstractSearchService}
     * @override
     */
    public updateSort(queryPayload: QueryWrapper, field: string, order: SortOrder = SortOrder.ASCENDING): AbstractSearchService {
        /* tslint:disable:no-string-literal */
        queryPayload.query.sortBy(field, order === SortOrder.ASCENDING ? query['ASCENDING'] : query['DESCENDING']);
        /* tslint:enable:no-string-literal */
        return this;
    }
}
