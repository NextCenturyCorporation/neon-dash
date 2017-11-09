/*
 * Copyright 2016 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { Injectable } from '@angular/core';
import * as neon from 'neon-framework';

import { TableMetaData } from '../dataset';
import { ErrorNotificationService } from './error-notification.service';
import { DatasetService } from './dataset.service';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';

@Injectable()
export class FilterService {

    private filters: {
        id: string,
        ownerId: string,
        database: string,
        table: string,
        filter: any // This will be a neon.query.Filter object. It's only "any" to avoid the hassle of parsing JSON into a proper Filter.
    }[];
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
    getFilterState(onSuccess?: () => any, onError?: (resp: any) => any) {
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
    getFilters(comparitor?: any): any[] {
        let matches = [];
        // Check the obvious case first to avoid unnecessary comparisons.
        if (!comparitor) {
            return this.filters;
        }
        this.filters.forEach((filter) => {
            for (let key of Object.keys(comparitor)) {
                if (_.isEqual(comparitor[key], filter[key])) {
                    matches.push(filter);
                }
            }
        });
        return matches;
    }

    /**
     * Convenience method to get a filter by its string ID.
     * @param {String} [filterId] The ID of the filter to return.
     * @return The filter with the given ID, or undefined if none exists.
     * @method getFilterById
     */
    getFilterById(filterId: string): any {
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
    getFiltersByOwner(ownerVisId: string): any[] {
        return this.getFilters({ ownerId: ownerVisId });
    }

    getFiltersForFields(database: string, table: string, fields: string[]) {
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

    addFilter(messenger: neon.eventing.Messenger,
        ownerId: string,
        database: string,
        table: string,
        whereClause: any,
        filterName: string | {visName: string, text: string},
        onSuccess: (resp: any) => any,
        onError: (resp: any) => any) {

        let filter = this.createNeonFilter(database, table, whereClause, this.getFilterNameString(database, table, filterName));
        let id = database + '-' + table + '-' + uuid.v4();
        messenger.addFilter(id,
            filter,
            () => {
                this.filters.push({
                    id: id,
                    ownerId: ownerId,
                    database: database,
                    table: table,
                    filter: filter
            });
            onSuccess(id); // Return the ID of the created filter.
        },
        onError);
    }

    replaceFilter(messenger: neon.eventing.Messenger,
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
                this.filters[index] = {
                    id: id,
                    ownerId: ownerId,
                    database: database,
                    table: table,
                    filter: filter
            };
            onSuccess(id); // Return the ID of the replaced filter.
        },
        onError);
    }

    removeFilter(messenger: neon.eventing.Messenger,
        id: string,
        onSuccess?: (resp: any) => any,
        onError?: (resp: any) => any) {

        messenger.removeFilter(id,
            () => {
                let index = _.findIndex(this.filters, { id: id });
                this.filters.splice(index, 1);
                if (onSuccess) {
                    onSuccess(id); // Return the ID of the removed filter.
                }
            },
            onError);
    }

    removeFilters(messenger: neon.eventing.Messenger,
        ids: string[],
        onSuccess?: (resp: any) => any,
        onError?: (resp: any) => any) {

        for (let id of ids) {
            this.removeFilter(messenger, id, onSuccess, onError);
        }
    }

    private getFilterNameString(database: string, table: string, filterName: string | {visName: string, text: string}) {
        if (typeof filterName === 'object') {
            let nameString = filterName['visName'] ? filterName['visName'] + ' - ' : '';
            nameString += this.datasetService.getTableWithName(database, table).prettyName;
            nameString += filterName['text'] ? ': ' + filterName['text'] : '';
            return nameString;
        } else {
            return filterName;
        }
    }

    private createNeonFilter(database: string, table: string, whereClause: any, filterName: string) {
        let filter = new neon.query.Filter().selectFrom(database, table);
        filter.whereClause = whereClause;
        if (filterName) {
            filter = filter.name(filterName);
        }
        return filter;
    }

    /*modifyFilterForNewDataset(filter: any,
        oldDataset: {database: string, table: string, fields: string[]},
        newDataset: {database: string, table: string, fields: string[]}) {
        // TODO Essentially recurse through the filter and replace all instances of oldDataset's values with newDataset's values.
        // This isn't necessary for right now, but would be a way to re-implement relations. Also maybe move this to dataset service.
    }*/
}
