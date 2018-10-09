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

export class ServiceFilter {
    id: string;
    ownerId: string;
    database: string;
    table: string;
    filter: any; // This will be a neon.query.Filter object. It's only "any" to avoid the hassle of parsing JSON into a proper Filter.
    siblings: string[] = []; // Array of the ids of any filters that are children of this one (e.g. due to relations).

    constructor(id: string, ownerId: string, database: string, table: string, filter: any, siblings?: string[]) {
        this.id = id;
        this.ownerId = ownerId;
        this.database = database;
        this.table = table;
        this.filter = filter;
        this.siblings = siblings || [];
    }
}

@Injectable()
export class FilterService {
    protected filters: ServiceFilter[] = [];
    protected messenger: neon.eventing.Messenger = new neon.eventing.Messenger();

    constructor(
        protected errorNotificationService: ErrorNotificationService,
        protected datasetService: DatasetService
    ) {}

    protected getDatabaseFilterState(onSuccess: (filterList: any[]) => any, onError: (response: any) => any) {
        neon.query.Filter.getFilterState('*', '*', onSuccess, onError);
    }

    /**
     * Gets all the filters from the server.
     * @param {Function} [onSuccess] Optional success callback
     * @param {Function} [onError] Optional error callback
     * @method getFilterState
     */
    public getFilterState(onSuccess?: () => any, onError?: (resp: any) => any) {
        this.getDatabaseFilterState((filters) => {
            this.filters = filters.map((filter) => {
                return new ServiceFilter(filter.id, undefined, filter.dataSet.databaseName, filter.dataSet.tableName, filter.filter);
            });
            for (let filter of this.filters) {
                this.replaceFilter(
                    this.messenger,
                    filter.id,
                    filter.filter.ownerId,
                    filter.filter.databaseName,
                    filter.filter.tableName,
                    filter.filter.whereClause,
                    filter.filter.filterName
                );
            }
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
     * Returns all filters matching the given comparator object. The comparator object can be as sparse
     * or as detailed as desired, and only filters matching every given field will be returned. If no parameter
     * is given, all filters are returned.
     * @param {Object} [comparator] The object to use as a filter for returning filters.
     * @return {List} The list of all filters that match the given object.
     */
    public getFilters(comparator?: any): ServiceFilter[] {
        let matches = [];
        // Check the obvious case first to avoid unnecessary comparisons.
        if (!comparator) {
            return this.filters;
        }
        for (let filter of this.filters) {
            // if unable to find mismatched values, must be equal
            if (!Object.keys(comparator).find((key) => !_.isEqual(comparator[key], filter[key]))) {
                matches.push(filter);
            }
        }
        return matches;
    }

    /**
     * Convenience method to get a filter by its string ID.
     * @param {String} filterId The ID of the filter to return.
     * @return The filter with the given ID, or undefined if none exists.
     * @method getFilterById
     */
    public getFilterById(filterId: string): ServiceFilter {
        let matches = this.getFilters({ id: filterId });
        return matches.length ? matches[0] : undefined;
    }

    /**
     * Convenience method to get all filters with the given owner.
     * @param {String} ownerVisId The ID of the visualization whose filters to get.
     * @return {List} The filters belonging to the give nvisualization.
     * @method getFiltersByOwner
     */
    public getFiltersByOwner(ownerVisId: string): ServiceFilter[] {
        return this.getFilters({ ownerId: ownerVisId });
    }

    /**
     * Returns the list of Neon filter objects for the given database, table, and (optional) list of fields.
     *
     * @arg {string} database
     * @arg {string} table
     * @arg {array} [fields=[]]
     * @return {array}
     */
    public getFiltersForFields(database: string, table: string, fields: string[] = []) {
        let checkClauses = (clause) => {
            if (clause.type === 'where' && (!fields.length || fields.indexOf(clause.lhs) >= 0)) {
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
        for (let filter of this.getFilters({ database: database, table: table })) {
            if (checkClauses(filter.filter.whereClause)) {
                matchingFilters.push(filter);
            }
        }
        return matchingFilters;
    }

    public addFilter(
        messenger: neon.eventing.Messenger,
        ownerId: string,
        database: string,
        table: string,
        whereClause: any,
        filterName: string | { visName: string, text: string },
        onSuccess?: (resp: any) => any,
        onError?: (resp: any) => any
    ) {

        let filter = this.createNeonFilter(database, table, whereClause, this.createFilterName(database, table, filterName));
        let id = this.createFilterId(database, table);
        let serviceFilters = [new ServiceFilter(id, ownerId, database, table, filter)];
        this.createChildrenFromRelations(filter, filterName).forEach((sibling) => {
            let sibId = this.createFilterId(sibling.databaseName, sibling.tableName);
            serviceFilters.push(new ServiceFilter(sibId, undefined, sibling.databaseName, sibling.tableName, sibling));
        });

        for (let sib = serviceFilters.length - 1; sib >= 0; sib--) {
            for (let i = serviceFilters.length - 1; i >= 0; i--) {
                if (sib !== i) {
                    serviceFilters[sib].siblings.push(serviceFilters[i].id);
                }
            }
        }

        messenger.addFilters(
            serviceFilters.map((sFilter) => {
                let fId = sFilter.id;
                let fFilter = _.cloneDeep(sFilter.filter);
                this.datifyWherePredicates(fFilter.whereClause, fFilter.databaseName, fFilter.tableName);
                return [sFilter.id, fFilter];
            }),
            () => {
                for (let i = serviceFilters.length - 1; i >= 0; i--) {
                    this.filters.push(serviceFilters[i]);
                }
                if (onSuccess) {
                    onSuccess(id); // Return the ID of the primary created filter.
                }
            },
            onError);
    }

    public replaceFilter(
        messenger: neon.eventing.Messenger,
        id: string,
        ownerId: string,
        database: string,
        table: string,
        whereClause: any,
        filterName: string | { visName: string, text: string },
        onSuccess?: (resp: any) => any,
        onError?: (resp: any) => any) {
        let filter = this.createNeonFilter(database, table, whereClause, this.createFilterName(database, table, filterName));
        let originalIndex = this.filters.findIndex((f) => f.id === id);
        if (originalIndex === -1) { // If for some reason the filter we're trying to replacew doesn't exist, add it.
            return this.addFilter(messenger, ownerId, database, table, whereClause, filterName, onSuccess, onError);
        }
        let siblingIds = this.filters[originalIndex].siblings;
        let newFilters = this.createChildrenFromRelations(filter, filterName);
        let newSiblings = [];
        let idAndFilterList = [[id, filter]];

        // For each sibling, find a new filter with the same database and table (the particular field is irrelevant),
        // and make a replacement for that sibling with the new filter so that on success we can easily replace it.
        // Also add that sibling's id and the new filter to idAndFilterList.
        for (let i = siblingIds.length - 1; i >= 0; i--) {
            let oldSib = this.filters.find((fil) => fil.id === siblingIds[i]);
            for (let j = newFilters.length - 1; j >= 0; j--) {
                if (newFilters[j].databaseName === oldSib.database && newFilters[j].tableName === oldSib.table) {
                    let newNeonFilter = newFilters.splice(j, 1)[0];
                    idAndFilterList.push([oldSib.id, newNeonFilter]);
                    newSiblings.push(new ServiceFilter(
                        oldSib.id,
                        oldSib.ownerId,
                        oldSib.database,
                        oldSib.table,
                        newNeonFilter,
                        oldSib.siblings
                    ));
                    continue;
                }
            }
        }

        messenger.replaceFilters(
            idAndFilterList.map((idAndSFilterArray) => {
                let fId = idAndSFilterArray[0];
                let sFilter = idAndSFilterArray[1];
                let fFilter = _.cloneDeep(sFilter) as neon.query.Filter;
                this.datifyWherePredicates(fFilter.whereClause, fFilter.databaseName, fFilter.tableName);
                return [fId, fFilter];
            }),
            () => {
                let index = _.findIndex(this.filters, { id: id });
                this.filters[index] = new ServiceFilter(id, ownerId, database, table, filter, this.filters[index].siblings);
                for (let i = newSiblings.length - 1; i >= 0; i--) {
                    index = _.findIndex(this.filters, { id: newSiblings[i].id });
                    this.filters[index] = newSiblings[i];
                }
                if (onSuccess) {
                    onSuccess(id); // Return the ID of the replaced filter.
                }
            },
            onError);
    }

    protected removeFilter(
        messenger: neon.eventing.Messenger,
        id: string,
        onSuccess?: (resp: any) => any,
        onError?: (resp: any) => any
    ) {

        let baseFilter = this.filters.find((filter) => filter.id === id);
        let siblings = baseFilter ? baseFilter.siblings.concat(id) : [];

        if (!siblings.length) {
            return;
        }

        messenger.removeFilters(siblings,
            () => { // TODO - Actually care about what's returned here: a list of successfully removed filters.
                // Filters not included weren't successfully removed.
                siblings.forEach((sibling) => {
                    for (let index = this.filters.length - 1; index >= 0; index--) {
                        if (this.filters[index].id === sibling) {
                            this.filters.splice(index, 1);
                        }
                    }
                });
                if (onSuccess) {
                    onSuccess(baseFilter); // Return the removed filter.
                }
            },
            onError);
    }

    public removeFilters(
        messenger: neon.eventing.Messenger,
        ids: string[],
        onSuccess?: (resp: any) => any,
        onError?: (resp: any) => any
    ) {

        // TODO Use messenger.removeFilters now to remove all filters simultaneously.
        for (let id of ids) {
            this.removeFilter(messenger, id, onSuccess, onError);
        }
    }

    protected createFilterName(database: string, table: string, filterName: string | { visName: string, text: string }): string {
        if (typeof filterName === 'object') {
            return (filterName.visName ? filterName.visName + ' - ' : '') + this.datasetService.getDatabaseWithName(database).prettyName +
                ' - ' + this.datasetService.getTableWithName(database, table).prettyName + (filterName.text ? ': ' + filterName.text : '');
        }
        return filterName;
    }

    protected createNeonFilter(database: string, table: string, whereClause: any, filterName: string): neon.query.Filter {
        let filter = new neon.query.Filter().selectFrom(database, table);
        filter.whereClause = whereClause;
        if (filterName) {
            filter = filter.name(filterName);
        }
        return filter;
    }

    public createFilterId(database: string, table: string) {
        return database + '-' + table + '-' + uuid.v4();
    }

    protected createChildrenFromRelations(filter: neon.query.Filter,
        filterName: string | { visName: string, text: string}): neon.query.Filter[] {

        let mentionedFields = this.datasetService.findMentionedFields(filter);
        let relatedFieldMapping: any = new Map<string, any>();
        mentionedFields.forEach((field) => {
            this.datasetService.getEquivalentFields(field.database, field.table, field.field, relatedFieldMapping);
        });

        let childFilters = [];
        relatedFieldMapping.forEach((value, dbAndTableKey) => {
            let numFieldsInFilter = mentionedFields.length;
            let numFieldsWithRelatedValuesInDBPair = Array.from(value.keys()).length;
            if (numFieldsWithRelatedValuesInDBPair < numFieldsInFilter) {
                return;
            } else if (numFieldsWithRelatedValuesInDBPair > numFieldsInFilter) {
                throw new Error('More fields with related values than there are fields. How did this even happen?');
            } else {
                let permutations = this.getPermutations(filter.databaseName, filter.tableName, value);
                permutations.forEach((permutation) => {
                    let childFilter = this.adaptNeonFilterForNewDataset(filter, permutation);
                    childFilter.filterName = this.createFilterName(childFilter.databaseName, childFilter.tableName, filterName);
                    childFilters.push(childFilter);
                });
            }
        });
        return childFilters;
    }

    protected getPermutations(originalDb: string,
        originalTable: string,
        relatedFieldMapping: Map<string, { database: string, table: string, field: string }[]>):
        Map<{ database: string, table: string, field: string }, { database: string, table: string, field: string }>[] {

        let getPermutationHelper = (fields: any[], permutationToDate: Map<any, any>) => {
            let currentPermutation = permutationToDate || new Map<any, any>();
            if (fields.length > 0) {
                let currentField = fields[0];
                for (let option of currentField[1]) {
                    let current = _.cloneDeep(currentPermutation);
                    current.set({
                        database: originalDb,
                        table: originalTable,
                        field: currentField[0]
                    }, {
                            database: option.database,
                            table: option.table,
                            field: option.field
                        });
                    getPermutationHelper(fields.slice(1), current);
                }
            } else {
                permutations.push(permutationToDate);
            }
        };
        let permutations = []; // List of maps from original field to new field.
        let fieldList = Array.from(relatedFieldMapping.entries());
        getPermutationHelper(fieldList, undefined);
        return permutations;
    }

    protected adaptNeonFilterForNewDataset(filter: any,
        changeMap: Map<{ database: string, table: string, field: string }, { database: string, table: string, field: string }>): any {

        let replaceValues = (object, oldDb, oldTable, oldField, newDb, newTable, newField) => {
            if (typeof object === 'string' || typeof object === 'number' || object === undefined || object === null) {
                return; // We can't do anything with these. Just return to the parent method.
            } else if (object instanceof Array) {
                for (let i = object.length - 1; i >= 0; i--) {
                    replaceValues(object[i], oldDb, oldTable, oldField, newDb, newTable, newField);
                }
            } else {
                Object.keys(object).forEach((key) => {
                    if (typeof object[key] === 'string') {
                        object[key] = object[key].replace(oldDb, newDb).replace(oldTable, newTable).replace(oldField, newField);
                    } else if (object[key] instanceof Array) {
                        for (let i = object[key].length - 1; i >= 0; i--) {
                            replaceValues(object[key][i], oldDb, oldTable, oldField, newDb, newTable, newField);
                        }
                    } else {
                        replaceValues(object[key], oldDb, oldTable, oldField, newDb, newTable, newField);
                    }
                });
            }
        };
        let newFilter = _.cloneDeep(filter);
        for (let kv of Array.from(changeMap.entries())) {
            replaceValues(newFilter, kv[0].database, kv[0].table, kv[0].field, kv[1].database, kv[1].table, kv[1].field);
        }
        return newFilter;
    }

    /**
     * Converts data elements that are specified to have a pretty name back to their original data label so that the database can
     * correctly query. When it comes back in onQuerySuccess, the response will be converted back to their "pretty" form
     * Will probably skew the data if the config specifies a data label to have a pretty name that is the same as another data label
     */
    private datifyWherePredicates(whereClause, databaseName, tableName) {
        let labelOptions = this.datasetService.getTableWithName(databaseName, tableName).labelOptions;
        switch (whereClause.type) {
            case 'or':
            case 'and':
                let newFilters = [];
                for (let clause of whereClause.whereClauses) {
                    //recursively edit where clauses that contain multiple whereClauses
                    newFilters.push(this.datifyWherePredicates(clause, databaseName, tableName));
                }
                return newFilters;
            case 'where':
                return this.datifyWherePredicate(whereClause, labelOptions);
        }
    }

    //Base case of datifyWherePredicates() when there is a single where clause
    private datifyWherePredicate(predicate, labelOptions) {
        let labelKeys = Object.keys(labelOptions);

        let key = predicate.lhs;
        if (labelKeys.includes(key)) {
            let prettyLabels = labelOptions[key];
            let labels = Object.keys(prettyLabels);
            for (let label of labels) {
                let possiblePrettyLabel = predicate.rhs;
                if (prettyLabels[label] === possiblePrettyLabel) {
                    predicate.rhs = label;
                }
            }
        }
    }

    public clearFilters() {
        this.filters = [];
    }
}
