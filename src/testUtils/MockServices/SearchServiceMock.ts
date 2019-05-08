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
import {
    AbstractSearchService,
    AggregationType,
    CompoundFilterType,
    Connection,
    FilterClause,
    QueryGroup,
    QueryPayload,
    RequestWrapper,
    SortOrder,
    TimeInterval
} from '../../app/services/abstract.search.service';

/**
 * Saves filter clauses and query payloads as JSON objects.
 */
export class SearchServiceMock extends AbstractSearchService {

    public buildCompoundFilterClause(filterClauses: FilterClause[], type: CompoundFilterType = CompoundFilterType.AND): FilterClause {
        return filterClauses.length === 1 ? filterClauses[0] : {
            filters: filterClauses,
            type: '' + type
        };
    }

    public buildDateQueryGroup(groupField: string, interval: TimeInterval): QueryGroup {
        return {
            field: groupField,
            type: '' + interval
        };
    }

    public buildFilterClause(field: string, operator: string, value: string): FilterClause {
        return {
            field: field,
            operator: operator,
            value: value
        };
    }

    public buildQueryGroup(groupField: string): QueryGroup {
        return groupField;
    }

    public buildQueryPayload(databaseName: string, tableName: string, fieldNames: string[] = ['*']): QueryPayload {
        return {
            database: databaseName,
            table: tableName,
            fields: fieldNames.length ? fieldNames : ['*']
        };
    }

    public canRunSearch(datastoreType: string, datastoreHost: string): boolean {
        return !!(datastoreType && datastoreHost);
    }

    public createConnection(datastoreType: string, datastoreHost: string): Connection {
        return null;
    }

    public runSearch(datastoreType: string, datastoreHost: string, queryPayload: QueryPayload): RequestWrapper {
        return {
            always: () => {
                // Do nothing.
            },
            abort: () => {
                // Do nothing.
            },
            done: () => {
                // Do nothing.
            },
            fail: () => {
                // Do nothing.
            }
        };
    }

    public transformQueryPayloadToExport(queryPayload: QueryPayload): any {
        return queryPayload;
    }

    public transformFilterClauseValues(queryPayload: QueryPayload, keysToValuesToLabels:
        { [key: string]: { [value: string]: string } }): QueryPayload {

        this.transformFilterClauseValuesHelper((queryPayload as any).filter, keysToValuesToLabels);
        return queryPayload;
    }

    private transformFilterClauseValuesHelper(filter: any, keysToValuesToLabels: { [key: string]: { [value: string]: string } }): void {
        if (!filter.type) {
            let keys = Object.keys(keysToValuesToLabels);
            let key = filter.lhs;
            if (keys.includes(key)) {
                let valuesToLabels = keysToValuesToLabels[key];
                let values = Object.keys(valuesToLabels);
                for (let value of values) {
                    if (valuesToLabels[value] === filter.rhs) {
                        filter.rhs = value;
                    }
                }
            }
            return;
        }

        for (let nestedFilterClause of (filter.filters || [])) {
            this.transformFilterClauseValuesHelper(nestedFilterClause, keysToValuesToLabels);
        }
    }

    public updateAggregation(queryPayload: QueryPayload, type: AggregationType, name: string, field: string): AbstractSearchService {
        (queryPayload as any).aggregation = (queryPayload as any).aggregation || [];
        (queryPayload as any).aggregation.push({
            type: '' + type,
            name: name,
            field: field
        });
        return this;
    }

    public updateFields(queryPayload: QueryPayload, fields: string[]): AbstractSearchService {
        if (fields.length) {
            let existingFields = (queryPayload as any).fields || [];
            (queryPayload as any).fields = (existingFields.length === 1 && existingFields[0] === '*') ? fields :
                existingFields.concat(fields);
        }
        return this;
    }

    public updateFieldsToMatchAll(queryPayload: QueryPayload): AbstractSearchService {
        (queryPayload as any).fields = ['*'];
        return this;
    }

    public updateFilter(queryPayload: QueryPayload, filterClause: FilterClause): AbstractSearchService {
        (queryPayload as any).filter = filterClause;
        return this;
    }

    public updateGroups(queryPayload: QueryPayload, groups: QueryGroup[]): AbstractSearchService {
        (queryPayload as any).groups = groups;
        return this;
    }

    public updateLimit(queryPayload: QueryPayload, limit: number): AbstractSearchService {
        (queryPayload as any).limit = limit;
        return this;
    }

    public updateOffset(queryPayload: QueryPayload, offset: number): AbstractSearchService {
        (queryPayload as any).offset = offset;
        return this;
    }

    public updateSort(queryPayload: QueryPayload, field: string, order: SortOrder = SortOrder.ASCENDING): AbstractSearchService {
        (queryPayload as any).sort = {
            field: field,
            order: order === SortOrder.ASCENDING ? 1 : -1
        };
        return this;
    }
}
