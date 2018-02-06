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
import * as neon from 'neon-framework';

import { ErrorNotificationService } from './error-notification.service';
import { DatasetService } from './dataset.service';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';

class ServiceFilter {
    id: string;
    ownerId: string;
    database: string;
    table: string;
    filter: any; // This will be a neon.query.Filter object. It's only "any" to avoid the hassle of parsing JSON into a proper Filter.
    children: string[] = []; // Array of the ids of any filters that are children of this one (e.g. due to relations).

    constructor(id: string, ownerId: string, database: string, table: string, filter: any, children?: string[]) {
        this.id = id;
        this.ownerId = ownerId;
        this.database = database;
        this.table = table;
        this.filter = filter;
        this.children = children || [];
    }
}

@Injectable()
export class FilterService {

    private filters: ServiceFilter[];
    private messenger: neon.eventing.Messenger;

    constructor(private errorNotificationService: ErrorNotificationService, private datasetService: DatasetService) {
        this.messenger = new neon.eventing.Messenger();
        this.filters = [];
    }

    /**
     * Gets all the filters from the server.
     * @param {Function} [onSuccess] Optional success callback
     * @param {Function} [onError] Optional error callback
     * @method getFilterState
     */
    public getFilterState(onSuccess?: () => any, onError?: (resp: any) => any) {
        neon.query.Filter.getFilterState('*', '*', (filters) => {
            this.filters = filters;
            if (onSuccess) {
                onSuccess();
            }
        }, (response) => {
            if (onError) {
                onError(response);
            } else if (response.responseJSON) {
                this.errorNotificationService.showErrorMessage(null, response.responseJSON);
            }
        });
    }

    /**
     * Returns all filters matching the given comparitor object. The comparitor object can be as sparse
     * or as detailed as desired, and only filters matching every given field will be returned. If no parameter
     * is given, all filters are returned.
     * @param {Object} [comparitor] The object to use as a filter for returning filters.
     * @return {List} The list of all filters that match the given object.
     */
    public getFilters(comparitor?: any): ServiceFilter[] {
        let matches = [];
        // Check the obvious case first to avoid unnecessary comparisons.
        if (!comparitor) {
            return this.filters;
        }
        for (let filter of this.filters) {
            // if unable to find mismatched values, must be equal
            if (!Object.keys(comparitor).find((key) => !_.isEqual(comparitor[key], filter[key]))) {
                matches.push(filter);
            }
        }
        return matches;
    }

    /**
     * Convenience method to get a filter by its string ID.
     * @param {String} [filterId] The ID of the filter to return.
     * @return The filter with the given ID, or undefined if none exists.
     * @method getFilterById
     */
    public getFilterById(filterId: string): ServiceFilter {
        let matches = this.getFilters({ id: filterId });
        if (matches.length === 0) {
            return undefined;
        } else {
            return matches[0];
        }
    }

    /**
     * Convenience method to get all filters with the given owner.
     * @param {String} [ownerVisId] The ID of the visualization whose filters to get.
     * @return {List} The filters belonging to the give nvisualization.
     * @method getFiltersByOwner
     */
    public getFiltersByOwner(ownerVisId: string): ServiceFilter[] {
        return this.getFilters({ ownerId: ownerVisId });
    }

    public getFiltersForFields(database: string, table: string, fields: string[]) {
        let checkClauses = (clause) => {
            if (clause.type === 'where' && fields.indexOf(clause.lhs) >= 0) {
                return true;
            } else if (clause.type !== 'where') {
                for (let whereClause of clause.whereClauses) {
                    if (!checkClauses(whereClause)) {
                        return false;
                    }
                }
                return true;
            }
        };

        let matchingFilters = [];
        for (let filter of this.getFilters({database: database, table: table})) {
            if (checkClauses(filter.filter.whereClause)) {
                matchingFilters.push(filter);
            }
        }
        return matchingFilters;
    }

    public addFilter(messenger: neon.eventing.Messenger,
        ownerId: string,
        database: string,
        table: string,
        whereClause: any,
        filterName: string | {visName: string, text: string},
        onSuccess: (resp: any) => any,
        onError: (resp: any) => any) {

        let filter = this.createNeonFilter(database, table, whereClause, this.getFilterNameString(database, table, filterName));
        let id = database + '-' + table + '-' + uuid.v4();
        // How do I know if a neon filter would require changing? Recursively go through where clauses and get a list of fields?
        let fields = this.datasetService.findMentionedFields(filter);
        // Looks like "yes" to that. Then use this.datasetService.getEquivalentFields(database, table, [each of fields]).
        // Then make new filters for each of the returned equivalent fields and call them children of the first filter.
        // Do this recursively? Seems like it would be possible for recursion to be a thing here.

        messenger.addFilter(id,
            filter,
            () => {
                this.filters.push(new ServiceFilter(id, ownerId, database, table, filter));
            onSuccess(id); // Return the ID of the created filter.
        },
        onError);
    }

    public replaceFilter(messenger: neon.eventing.Messenger,
        id: string,
        ownerId: string,
        database: string,
        table: string,
        whereClause: any,
        filterName: string | {visName: string, text: string},
        onSuccess: (resp: any) => any,
        onError: (resp: any) => any) {

        let filter = this.createNeonFilter(database, table, whereClause, this.getFilterNameString(database, table, filterName));
        messenger.replaceFilter(id,
            filter,
            () => {
                let index = _.findIndex(this.filters, { id: id });
                this.filters[index] = new ServiceFilter(id, ownerId, database, table, filter);
                onSuccess(id); // Return the ID of the replaced filter.
            },
            onError);
    }

    public removeFilter(messenger: neon.eventing.Messenger,
        id: string,
        onSuccess?: (resp: any) => any,
        onError?: (resp: any) => any) {

        messenger.removeFilter(id,
            () => {
                let index = _.findIndex(this.filters, { id: id });
                let removedFilter = this.filters.splice(index, 1)[0];
                if (onSuccess) {
                    onSuccess(removedFilter); // Return the removed filter.
                }
            },
            onError);
    }

    public removeFilters(messenger: neon.eventing.Messenger,
        ids: string[],
        onSuccess?: (resp: any) => any,
        onError?: (resp: any) => any) {

        for (let id of ids) {
            this.removeFilter(messenger, id, onSuccess, onError);
        }
    }

    private getFilterNameString(database: string, table: string, filterName: string | {visName: string, text: string}): string {
        if (typeof filterName === 'object') {
            let nameString = filterName.visName ? filterName.visName + ' - ' : '';
            nameString += this.datasetService.getTableWithName(database, table).prettyName;
            nameString += filterName.text ? ': ' + filterName.text : '';
            return nameString;
        } else {
            return filterName;
        }
    }

    private createNeonFilter(database: string, table: string, whereClause: any, filterName: string): neon.query.Filter {
        let filter = new neon.query.Filter().selectFrom(database, table);
        filter.whereClause = whereClause;
        if (filterName) {
            filter = filter.name(filterName);
        }
        return filter;
    }

    private createFilterId(database: string, table: string) {
        return database + '-' + table + '-' + uuid.v4();
    }

    private adaptNeonFilterForNewDataset(oldFilter: any,
        oldDB: string,
        oldTable: string,
        oldField: string,
        newDB: string,
        newTable: string,
        newField: string): any {

        let replaceValues = (object) => {
            if (object instanceof Array) {
                for (let i = object.length - 1; i >= 0; i--) {
                    replaceValues(object[i]);
                }
            }
            Object.keys(object).forEach((key) => {
                if (object[key] === oldDB) {
                    object[key] = newDB;
                } else if (object[key] === oldTable) {
                    object[key] = newTable;
                } else if (object[key] === oldField) {
                    object[key] = newField;
                } else if (object[key] instanceof Array) {
                    for (let i = object.length - 1; i >= 0; i--) {
                        replaceValues(object[i]);
                    }
                } else {
                    replaceValues(object[key]);
                }
            });
        };
        let newFilter = _.cloneDeep(oldFilter);
        replaceValues(newFilter);
        return newFilter;
    }
}
