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

    // The beginning of the filter builder filter name to ignore when searching for filters
    static FILTER_BUILDER_PREFIX: string = 'Filter Builder';

    private filters: any[];
    private messenger: neon.eventing.Messenger;

    constructor(private errorNotificationService: ErrorNotificationService, private datasetService: DatasetService) {
        this.messenger = new neon.eventing.Messenger();
        this.filters = [];
    };

    /*
     * Gets all the filters from the server.
     * @param {Function} [successCallback] Optional success callback
     * @param {Function} [errorCallback] Optional error callback
     * @method getFilterState
     */
    getFilterState(successCallback?: () => any, errorCallback?: (resp: any) => any) {
        neon.query.Filter.getFilterState('*', '*', (filters) => {
            this.filters = filters;
            if (successCallback) {
                successCallback();
            }
        }, (response) => {
            if (errorCallback) {
                errorCallback(response);
            } else if (response.responseJSON) {
                this.errorNotificationService.showErrorMessage(null, response.responseJSON.error);
            }
        });
    };

    /*
     * Adds a filter with the given database, table, and attributes. If exists, the filter gets replaced.
     * @param {neon.eventing.Messenger} messenger The messenger object used to add the filters
     * @param {String} database The name of the database to create a filter on
     * @param {String} table The name of the table to create a filter on
     * @param {Array} fields A list of field names to create a filter on
     * @param {Function} createFilterClauseFunction The function used to create the filter clause for each field, with arguments:
     *  <ul>
     *      <li> {Object} An object containing {String} database (the database name) and {String} table (the table name) </li>
     *      <li> {String} or {Array} The field name(s) </li>
     *  </ul>
     * @param {String} or {Object} filterName The name of the visualization or an object containing {String} visName and {String} text
     * @param {Function} [successCallback] Optional function called once all the filters have been added
     * @param {Function} [errorCallback] Optional function called if an error is returned for any of the filter calls
     * @method addFilter
     */
    addFilter(messenger: neon.eventing.Messenger, database: string, table: string, fields: string[],
        createFilterClauseFunction: (dbAndTableName: {}, fieldNames: any) => any, filterName: any,
        successCallback?: (resp: any) => any, errorCallback?: (resp: any) => any) {

        let filters = this.getFilters(database, table, fields);
        let relations = this.datasetService.getRelations(database, table, fields);

        if (filters.length) {
            this.replaceFilter(messenger, relations, createFilterClauseFunction,
                this.getFilterNameString(filterName, relations), successCallback, errorCallback);
        } else {
            this.addNewFilter(messenger, relations, createFilterClauseFunction,
                this.getFilterNameString(filterName, relations), successCallback, errorCallback);
        }
    };

    /*
     * Removes a filter with the given database, table, and attributes.
     * @param {String} database The name of the database
     * @param {String} table The name of the table
     * @param {Array} fields A list of field names
     * @param {Function} [successCallback] Optional function called once all the filters have been removed
     * @param {Function} [errorCallback] Optional function called if an error is returned for any of the filter calls
     * @param {Object} [messenger] Optional messenger object used to remove the filters
     * @method removeFilter
     */
    removeFilter(database: string, table: string, fields: string[], successCallback?: (resp: any) => any,
        errorCallback?: (resp: any) => any, messenger?: neon.eventing.Messenger) {

        let relations = this.datasetService.getRelations(database, table, fields);
        let filterKeys = this.getRelationsFilterKeys(relations);

        if (filterKeys.length) {
            if (messenger) {
                this.removeFilters(messenger, filterKeys, successCallback, errorCallback);
            } else {
                this.removeFilters(this.messenger, filterKeys, successCallback, errorCallback);
            }
        } else if (successCallback) {
            successCallback(null);
        }
    };

    /*
     * Replaces a filter with the given filter key.
     * @param {neon.eventing.Messenger} messenger The messenger object used to replace the filter
     * @param {String} filterKey A filter key of the filter to replace
     * @param {Object} filter The filter clause
     * @param {Function} [successCallback] Optional function called once the filter has been replaced
     * @param {Function} [errorCallback] Optional function called if an error is returned for any of the filter calls
     * @method replaceFilterForKey
     */
    replaceFilterForKey(messenger: neon.eventing.Messenger, filterKey: string, filter: any,
        successCallback?: () => any, errorCallback?: (resp: any) => any) {

        // TODO: Use this.messenger or messenger ??
        messenger.replaceFilter(filterKey, filter, () => {
            let index = _.findIndex(this.filters, {
                id: filterKey
            });

            if (index === -1) {
                this.filters.push({
                    id: filterKey,
                    dataSet: {
                        databaseName: filter.databaseName,
                        tableName: filter.tableName
                    },
                    filter: filter
                });
            } else {
                this.filters[index] = {
                    id: filterKey,
                    dataSet: {
                        databaseName: filter.databaseName,
                        tableName: filter.tableName
                    },
                    filter: filter
                };
            }

            if (successCallback) {
                successCallback();
            }
        }, errorCallback);
    };

    /*
     * Removes the filters with the given filter keys.
     * @param {Array} filterKeys A list of filter keys of the filters to remove
     * @param {Function} [successCallback] Optional function called once all the filters have been removed
     * @param {Function} [errorCallback] Optional function called if an error is returned for any of the filter calls
     * @method removeFiltersForKeys
     */
    removeFiltersForKeys(filterKeys: string[], successCallback?: (resp: any) => any, errorCallback?: (resp: any) => any) {
        if (filterKeys.length) {
            this.removeFilters(this.messenger, filterKeys, successCallback, errorCallback);
        } else if (successCallback) {
            successCallback(null);
        }
    };

    /*
     * Finds the filter key that matches the given database, table, and filter clause.
     * @param {String} databaseName The name of the database
     * @param {String} tableName The name of the table
     * @param {Object} filterClause The filter clause
     * @param {Boolean} [includeAllFilters] If false, ignores any filters whose name starts with the
     * FILTER_BUILDER_PREFIX variable. Otherwise it searches all filters.
     * @method getFilterKey
     * @return The filter key matching the given filter, or undefined if no filter was found.
     */
    getFilterKey(databaseName: string, tableName: string, filterClause: any, includeAllFilters?: boolean): string {
        for (let i = 0; i < this.filters.length; i++) {
            if (databaseName === this.filters[i].filter.databaseName &&
                tableName === this.filters[i].filter.tableName &&
                (includeAllFilters || this.filters[i].filter.filterName.indexOf(FilterService.FILTER_BUILDER_PREFIX) !== 0) &&
                this.areClausesEqual(this.filters[i].filter.whereClause, filterClause)) {
                return this.filters[i].id;
            }
        }
        return undefined;
    };

    /*
     * Returns the list of filters.
     * @method getAllFilters
     * @return {Array}
     */
    getAllFilters(): any[] {
        return this.filters;
    }

    /*
     * Returns the filters that match the given database, table, and fields.
     * @param {String} database The database name
     * @param {String} table The table name
     * @param {Array} fields The list of field names
     * @param {Boolean} [includeAllFilters] If false, ignores any filters whose name starts with the
     * FILTER_BUILDER_PREFIX variable. Otherwise it searches all filters.
     * @method getFilters
     * @return {Array}
     */
    getFilters(database: string, table: string, fields: string[], includeAllFilters?: boolean): any[] {
        let checkClauses = (clause) => {
            if (clause.type === 'where' && fields.indexOf(clause.lhs) >= 0) {
                return true;
            } else if (clause.type !== 'where') {
                for (let i = 0; i < clause.whereClauses.length; i++) {
                    if (!checkClauses(clause.whereClauses[i])) {
                        return false;
                    }
                }
                return true;
            }
        };

        let filters = [];
        this.filters.forEach(filter => {
            if ((includeAllFilters || filter.filter.filterName.indexOf(FilterService.FILTER_BUILDER_PREFIX) !== 0) &&
                filter.dataSet.databaseName === database && filter.dataSet.tableName === table &&
                checkClauses(filter.filter.whereClause)) {
                filters.push(filter);
            }
        });

        return filters;
    };

    /*
     * Checks if the two filter clauses are equal.
     * @param {Object} firstClause
     * @param {Object} secondClause
     * @method areClausesEqual
     * @return {Boolean}
     */
    areClausesEqual(firstClause: any, secondClause: any): boolean {
        let clausesEqual = (first, second) => {
            if (first.lhs === second.lhs && first.operator === second.operator && first.rhs === second.rhs) {
                return true;
            } else if ((_.isDate(firstClause.rhs) || _.isDate(secondClause.rhs)) &&
                new Date(first.rhs).valueOf() === new Date(second.rhs).valueOf()) {
                return true;
            }
            return false;
        };

        if (firstClause.type === secondClause.type) {
            if (firstClause.type === 'where') {
                return clausesEqual(firstClause, secondClause);
            } else if (firstClause.type !== 'where' && firstClause.whereClauses.length === secondClause.whereClauses.length) {
                for (let i = 0; i < firstClause.whereClauses.length; i++) {
                    if (!this.areClausesEqual(firstClause.whereClauses[i], secondClause.whereClauses[i])) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    };

    /*
     * Returns whether the given filter has a single where clause.
     * @param {Object} filter The filter clause
     * @method hasSingleClause
     * @return {Boolean}
     */
    hasSingleClause(filter: any): boolean {
        return filter.filter.whereClause.type === 'where';
    };

    /*
     * Returns whether the given filter has a multiple where clauses.
     * @param {Object} filter The filter clause
     * @method hasMultipleClauses
     * @return {Boolean}
     */
    hasMultipleClauses(filter: any): boolean {
        return filter.filter.whereClause.type === 'and' || filter.filter.whereClauses.type === 'or';
    };

    /*
     * If the given filter has multiple clauses, it returns the number of clauses it has. Otherwise, returns 0.
     * @param {Object} filter The filter clause
     * @method getMultipleClausesLength
     * @return {Number}
     */
    getMultipleClausesLength(filter: any): number {
        return this.hasMultipleClauses(filter) ? filter.filter.whereClause.whereClauses.length : 0;
    };

    /*
     * Replaces the filter for the relations.
     * @param {Object} messenger The messenger object used to replace the filters
     * @param {Array} relations The array of relations containing a database name, a table name, and a map of fields
     * @param {Function} createFilterClauseFunction The function used to create the filter clause for each field, with arguments:
     *  <ul>
     *      <li> {Object} An object containing {String} database (the database name) and {String} table (the table name) </li>
     *      <li> {String} or {Array} The field name(s) </li>
     *  </ul>
     * @param {String} or {Object} filterName The name of the visualization or an object containing {String} visName and {String} text
     * @param {Function} successFunction The function called once all the filters have been replaced (optional)
     * @param {Function} errorFunction The function called if an error is returned for any of the filter calls (optional)
     * @method replaceFilter
     * @private
     */
    private replaceFilter(messenger: neon.eventing.Messenger, relations: any[],
        createFilterClauseFunction: (dbAndTableName: {}, fieldNames: any) => any,
        filterName: any, successCallback?: (resp: any) => any, errorCallback?: (resp: any) => any) {

        let replaceNextFilter = () => {
            if (relations.length) {
                this.replaceFilter(messenger, relations, createFilterClauseFunction, filterName, successCallback, errorCallback);
            } else if (successCallback) {
                successCallback(null);
            }
        };

        let relation = relations.shift();
        let filter = this.createFilter(relation, createFilterClauseFunction, filterName);
        if (!filter) {
            replaceNextFilter();
            return;
        }

        let id = this.getRelationsFilterKeys([relation])[0];
        messenger.replaceFilter(id, filter, () => {
            let index = _.findIndex(this.filters, {
                id: id
            });
            this.filters[index] = {
                id: id,
                dataSet: {
                    databaseName: filter.databaseName,
                    tableName: filter.tableName
                },
                filter: filter
            };
            replaceNextFilter();
        }, errorCallback);
    };

    /**
     * Adds filters for the given relations.
     * @param {Object} messenger The messenger object used to add the filters
     * @param {Array} relations The array of relations containing a database name, a table name, and a map of fields
     * @param {Function} createFilterClauseFunction The function used to create the filter clause for each field, with arguments:
     *  <ul>
     *      <li> {Object} An object containing {String} database (the database name) and {String} table (the table name) </li>
     *      <li> {String} or {Array} The field name(s) </li>
     *  </ul>
     * @param {String} or {Object} filterName The name of the visualization or an object containing {String} visName and {String} text
     * @param {Function} successCallback The function called once all the filters have been added (optional)
     * @param {Function} errorCallback The function called if an error is returned for any of the filter calls (optional)
     * @method addNewFilter
     * @private
     */
    private addNewFilter(messenger: neon.eventing.Messenger, relations: any[],
        createFilterClauseFunction: (dbAndTableName: {}, fieldNames: any) => any,
        filterName: any, successCallback?: (resp) => any, errorCallback?: (resp: any) => any) {

        let addNextFilter = () => {
            if (relations.length) {
                this.addNewFilter(messenger, relations, createFilterClauseFunction, filterName, successCallback, errorCallback);
            } else if (successCallback) {
                successCallback(null);
            }
        };

        let relation = relations.shift();
        let filter = this.createFilter(relation, createFilterClauseFunction, filterName);
        if (!filter) {
            addNextFilter();
            return;
        }

        let id = relation.database + '-' + relation.table + '-' + uuid.v4();
        messenger.addFilter(id, filter, () => {
            this.filters.push({
                id: id,
                dataSet: {
                    databaseName: filter.databaseName,
                    tableName: filter.tableName
                },
                filter: filter
            });
            addNextFilter();
        }, errorCallback);
    };

    /**
     * Removes filters for all the given filter keys.
     * @param {Object} messenger The messenger object used to remove the filters
     * @param {Array} or {Object} filterKeys The array of filter keys or the map of database and table names to
     * filter keys used by the messenger
     * @param {Function} successCallback The function called once all the filters have been removed (optional)
     * @param {Function} errorCallback The function called if an error is returned for any of the filter calls (optional)
     * @method removeFilters
     * @private
     */
    private removeFilters(messenger: neon.eventing.Messenger, filterKeys: any,
        successCallback?: (resp: any) => any, errorCallback?: (resp: any) => any) {

        let filterKey = filterKeys.shift();
        messenger.removeFilter(filterKey, () => {
            let index = _.findIndex(this.filters, {
                id: filterKey
            });
            this.filters.splice(index, 1);
            if (filterKeys.length) {
                this.removeFilters(messenger, filterKeys, successCallback, errorCallback);
            } else if (successCallback) {
                successCallback(null);
            }
        }, errorCallback);
    };

    /**
     * Creates and returns a filter on the given table and field(s) using the given callback.
     * @param {Object} relation A relation object containing:
     * <ul>
     *      <li> {String} database The database name </li>
     *      <li> {Stirng} table The table name </li>
     *      <li> {Object} fields The map of field names to arrays of related field names </li>
     * </ul>
     * @param {Function} createFilterClauseFunction The function used to create the filter clause for each field, with arguments:
     *  <ul>
     *      <li> {Object} An object containing {String} database (the database name) and {String} table (the table name) </li>
     *      <li> {String} or {Array} The field name(s) </li>
     *  </ul>
     * @param {String} or {Object} filterName The name of the visualization or an object containing {String} visName and {String} text
     * @method createFilter
     * @return {Object} A neon.query.Filter object or undefined if no filter clause could be created
     * @private
     */
    private createFilter(relation: any, createFilterClauseFunction: (dbAndTableName: {}, fieldNames: any) => any, filterName: any): any {
        // Creates a list of arguments for the filter clause creation function. Each element is either
        // a {String} or an {Array} depending on the number of field keys in 'relation.fields'.
        let argumentFieldsList = this.getArgumentFieldsList(relation);
        let relationDatabaseAndTableName = {
            database: relation.database,
            table: relation.table
        };

        let filterClause;
        if (argumentFieldsList.length === 1) {
            filterClause = createFilterClauseFunction(relationDatabaseAndTableName, argumentFieldsList[0]);
        } else {
            let filterClauses = [];
            for (let i = 0; i < argumentFieldsList.length; i++) {
                let result = createFilterClauseFunction(relationDatabaseAndTableName, argumentFieldsList[i]);
                if (result) {
                    filterClauses.push(result);
                }
            }
            if (filterClauses.length) {
                filterClause = neon.query.or.apply(neon.query, filterClauses);
            }
        }

        if (filterClause) {
            let query = new neon.query.Filter().selectFrom(relation.database, relation.table);
            query.whereClause = filterClause;
            if (filterName) {
                query = query.name(filterName);
            }
            return query;
        }

        return undefined;
    };

    /**
     * Returns the list of field names or arrays based on the data contained within the array of fields in the given
     * relation to be used by a filter clause creation function.
     * @param {Object} relation A relation object containing a map of field names to arrays of related field names
     * @method getArgumentFieldsList
     * @return {Array} A list of {String} related field names if the map of field names in the given relation object only
     * contains one field name key;
     * otherwise, a list of {Array} lists of {String} related field names representing each combination of the different
     * field name keys.  Either way, the
     * elements of this list will be used to call the filter clause creation functions in filterService.createFilter() below.
     * @private
     */
    private getArgumentFieldsList(relation: any): any[] {
        // The relation contains an object with the name of each initial field and the array of related fields for each initial field.
        // Keep the same order of the fields array. This order may be used in the filter clause creation function.
        let fieldNames = relation.fields.map(field => field.intial);

        // If only one field is used by the filter clause creation function, just return the list of related fields for that field.
        if (fieldNames.length === 1) {
            return relation.fields[0].related;
        }

        // Else we need to create a list of all combinations of rht related fields.
        // First, create a list containing all the list of related fields.
        let relationFieldsList = [];
        for (let i = 0; i < fieldNames.length; i++) {
            relationFieldsList.push(relation.fields[i].related);
        }

        // Create a list of arguments representing the fields using all the combinations of the related fields.
        let getArgumentFieldsListHelper = (unfinishedArgumentFields, unusedRelationFields) => {
            let argumentFieldsList = [];
            // Iterate over each element (list) in the first unused relation field.
            for (let i = 0; i < unusedRelationFields[0].length; ++i) {
                // Clone the unfinished arguments array and append the current unused relation field element.
                let fields = unfinishedArgumentFields.slice(0);
                fields.push(unusedRelationFields[0][i]);

                if (unusedRelationFields.length === 1) {
                    // If there are no more unused relation fields, we have finished creating this arguments array.
                    argumentFieldsList.push(fields);
                } else {
                    // Else, get the next element for the arguments array from the next unused relation fields.
                    argumentFieldsList = argumentFieldsList.concat(getArgumentFieldsListHelper(fields, unusedRelationFields.slice(1)));
                }
            }
            return argumentFieldsList;
        };

        return getArgumentFieldsListHelper([], relationFieldsList);
    };

    /*
     * Returns a filter name based on the given name and relations.
     * @param {String} or {Object} name The name of the visualization or an object containing {String} visName and {String} text
     * @param {Object} relations
     * @method getFilterNameString
     * @return {String}
     * @private
     */
    private getFilterNameString(filterName: any, relations: any[]): string {
        if (typeof filterName === 'object') {
            let string = '';
            if (filterName['visName']) {
                string += filterName['visName'] + ' - ';
            }
            let tableString: string;
            let table: TableMetaData;
            if (relations.length > 0) {
                table = this.datasetService.getTableWithName(relations[0].database, relations[0].table);
                tableString = table.prettyName;
            }
            for (let i = 1; i < relations.length; i++) {
                table = this.datasetService.getTableWithName(relations[i].database, relations[i].table);
                tableString += ('/' + table.prettyName);
            }

            return string + tableString + (filterName['text'] ? ': ' + filterName['text'] : '');
        } else {
            return filterName;
        }
    };

    /*
     * Returns a list of filter keys that belong to the given relations.
     * @param {Object} relations
     * @method getRelationsFilterKeys
     * @return {Array}
     * @private
     */
    private getRelationsFilterKeys(relations: {}): any[] {
        let keys = [];
        _.each(relations, (relation) => {
            let attrs = [];

            _.each(relation['fields'], field =>
                attrs.push(field.related[0])
            );

            keys = keys.concat(this.getFilters(relation['database'], relation['table'], attrs).map(filter => filter.id));
        });
        return keys;
    };
}
