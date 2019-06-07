/**
 * Copyright 2019 Next Century Corporation
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
 */
import { Injectable } from '@angular/core';
import { AbstractSearchService, CompoundFilterType, FilterClause } from './abstract.search.service';
import { DatabaseMetaData, FieldMetaData, SingleField, TableMetaData } from '../dataset';
import { DatasetService } from './dataset.service';
import { neonEvents } from '../neon-namespaces';

import * as uuidv4 from 'uuid/v4';
import { eventing } from 'neon-framework';

export interface FilterBehavior {
    filterDesign: FilterDesign;
    redrawCallback(filters: AbstractFilter[]): void;
}

export interface FilterDataSource {
    datastoreName: string;
    databaseName: string;
    tableName: string;
    fieldName: string;
    operator?: string;
}

export interface FilterDesign {
    id?: string;
    name?: string;
    // By default, each filter with the same FilterDataSource will be combined into a single compound AND filter (its "root" filter) so all
    // of the search results will match all of the filters.  Each filter with a different "root" (and with the same FilterDataSource) will
    // be combined into a single compound filter with that CompoundFilterType.  Thus if some filters have "root=CompoundFilterType.OR" then
    // they will be combined into a single compound OR filter (but not the filters with other "root" types) so all of the search results
    // will match at least one of the filters.  A single FilterDataSource may generate multiple compound filters (like one AND and one OR).
    root?: CompoundFilterType;
}

export interface SimpleFilterDesign extends FilterDesign {
    datastore: string;
    database: DatabaseMetaData;
    table: TableMetaData;
    field: FieldMetaData;
    operator: string;
    value?: any;
}

export interface CompoundFilterDesign extends FilterDesign {
    type: CompoundFilterType;
    filters: FilterDesign[];
}

export namespace FilterUtil {

    /**
     * Returns if the given FilterDataSource objects are equivalent.
     *
     * @arg {FilterDataSource} item1
     * @arg {FilterDataSource} item2
     * @arg {boolean} [ignoreOperator=false]
     * @return {boolean}
     */
    export function areFilterDataSourcesEquivalent(
        item1: FilterDataSource,
        item2: FilterDataSource,
        ignoreOperator: boolean = false
    ): boolean {
        return !!(item1.datastoreName === item2.datastoreName && item1.databaseName === item2.databaseName &&
            item1.tableName === item2.tableName && item1.fieldName === item2.fieldName &&
            (ignoreOperator ? true : item1.operator === item2.operator));
    }

    /**
     * Returns if the given FilterDataSource lists are equivalent.
     *
     * @arg {FilterDataSource[]} list1
     * @arg {FilterDataSource[]} list2
     * @return {boolean}
     */
    export function areFilterDataSourceListsEquivalent(list1: FilterDataSource[], list2: FilterDataSource[]): boolean {
        return list1.length === list2.length &&
            // Each FilterDataSource in list1 must be equivalent to a FilterDataSource in list2.
            list1.every((item1) => list2.some((item2) => areFilterDataSourcesEquivalent(item1, item2))) &&
            // Each FilterDataSource in list2 must be equivalent to a FilterDataSource in list1.
            list2.every((item2) => list2.some((item1) => areFilterDataSourcesEquivalent(item1, item2)));
    }

    /**
     * Creates and returns the pretty name for the given database, table, and field.
     *
     * @arg {DatabaseMetaData} database
     * @arg {TableMetaData} table
     * @arg {FieldMetaData} field
     * @return {string}
     */
    export function createFilterName(database: DatabaseMetaData, table: TableMetaData, field: FieldMetaData, operator: string): string {
        return database.prettyName + ' / ' + table.prettyName + ' / ' + field.prettyName + ' ' + operator.toUpperCase();
    }

    /**
     * Creates and returns the FilterDataSource list for the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @arg {boolean} [ignoreOperator=false]
     * @return {FilterDataSource[]}
     */
    export function createFilterDataSourceListFromDesign(
        filterDesign: FilterDesign,
        ignoreOperator: boolean = false
    ): FilterDataSource[] {
        if (isSimpleFilterDesign(filterDesign)) {
            let simpleFilterDesign = filterDesign;

            if (simpleFilterDesign.database && simpleFilterDesign.database.name && simpleFilterDesign.table &&
                simpleFilterDesign.table.name && simpleFilterDesign.field && simpleFilterDesign.field.columnName) {
                return [{
                    datastoreName: simpleFilterDesign.datastore,
                    databaseName: simpleFilterDesign.database.name,
                    tableName: simpleFilterDesign.table.name,
                    fieldName: simpleFilterDesign.field.columnName,
                    operator: ignoreOperator ? undefined : simpleFilterDesign.operator
                }] as FilterDataSource[];
            }
        }

        if (isCompoundFilterDesign(filterDesign)) {
            let compoundFilterDesign = filterDesign;

            let returnList: FilterDataSource[] = [];

            compoundFilterDesign.filters.forEach((nestedFilterDesign) => {
                let nestedDataSourceList: FilterDataSource[] = createFilterDataSourceListFromDesign(nestedFilterDesign,
                    ignoreOperator);

                nestedDataSourceList.forEach((nestedDataSource) => {
                    let exists = returnList.some((existingDataSource) => areFilterDataSourcesEquivalent(nestedDataSource,
                        existingDataSource, ignoreOperator));

                    if (!exists) {
                        returnList.push(nestedDataSource);
                    }
                });
            });

            return returnList;
        }

        return [];
    }

    /**
     * Creates and returns a filter design from the given JSON object.
     *
     * @arg {any} filterObject
     * @return {FilterDesign}
     */
    export function createFilterDesignFromJsonObject(filterObject: any, datasetService: DatasetService): FilterDesign {
        // TODO THOR-1078 Validate that datastore is non-empty.
        if (filterObject.database && filterObject.table && filterObject.field && filterObject.operator) {
            let database: DatabaseMetaData = datasetService.getDatabaseWithName(filterObject.database);
            let table: TableMetaData = datasetService.getTableWithName(filterObject.database, filterObject.table);
            let field: FieldMetaData = datasetService.getFieldWithName(filterObject.database, filterObject.table, filterObject.field);
            return {
                name: filterObject.name,
                root: filterObject.root,
                datastore: filterObject.datastore,
                database: database,
                table: table,
                field: field,
                operator: filterObject.operator,
                value: filterObject.value
            } as SimpleFilterDesign;
        }

        if (filterObject.filters && filterObject.type) {
            return {
                name: filterObject.name,
                root: filterObject.root,
                type: filterObject.type,
                filters: filterObject.filters.map((nestedObject) =>
                    createFilterDesignFromJsonObject(nestedObject, datasetService))
            } as CompoundFilterDesign;
        }

        return null;
    }

    /**
     * Creates and returns a filter object from the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @arg {AbstractSearchService} searchService
     * @return {AbstractFilter}
     */
    export function createFilterFromDesign(filterDesign: FilterDesign, searchService: AbstractSearchService): AbstractFilter {
        let filter: AbstractFilter = null;
        let simpleFilterDesign: SimpleFilterDesign = isSimpleFilterDesign(filterDesign) ? (filterDesign) :
            null;
        let compoundFilterDesign: CompoundFilterDesign = isCompoundFilterDesign(filterDesign) ?
            (filterDesign) : null;

        // TODO THOR-1078 Validate that datastore is non-empty.
        if (simpleFilterDesign && simpleFilterDesign.database && simpleFilterDesign.database.name && simpleFilterDesign.table &&
            simpleFilterDesign.table.name && simpleFilterDesign.field && simpleFilterDesign.field.columnName &&
            simpleFilterDesign.operator && typeof simpleFilterDesign.value !== 'undefined') {
            // TODO THOR-1078 Add the datastore to the filter (ignore now because it causes errors).
            filter = new SimpleFilter('', simpleFilterDesign.database, simpleFilterDesign.table, simpleFilterDesign.field,
                simpleFilterDesign.operator, simpleFilterDesign.value, searchService);
        }

        if (compoundFilterDesign && compoundFilterDesign.type && compoundFilterDesign.filters) {
            filter = new CompoundFilter(compoundFilterDesign.type, compoundFilterDesign.filters.map((nestedDesign) =>
                createFilterFromDesign(nestedDesign, searchService)), searchService);
        }

        if (filter) {
            filter.id = filterDesign.id || filter.id;
            filter.name = filterDesign.name || filter.name;
            filter.root = filterDesign.root || CompoundFilterType.AND;
        }

        return filter;
    }

    /**
     * Creates and returns a JSON object from the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @return {any}
     */
    export function createFilterJsonObjectFromDesign(filter: FilterDesign): any {
        if (isSimpleFilterDesign(filter)) {
            return {
                name: filter.name,
                root: filter.root,
                datastore: filter.datastore,
                database: filter.database.name,
                table: filter.table.name,
                field: filter.field.columnName,
                operator: filter.operator,
                value: filter.value
            };
        }

        if (isCompoundFilterDesign(filter)) {
            return {
                name: filter.name,
                root: filter.root,
                type: filter.type,
                filters: filter.filters.map((nestedFilter) => createFilterJsonObjectFromDesign(nestedFilter))
            };
        }

        return null;
    }

    // https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types
    /**
     * Returns if the given filter design is a CompoundFilterDesign.
     *
     * @arg {FilterDesign} filterDesign
     * @return {filterDesign is CompoundFilterDesign}
     */
    export function isCompoundFilterDesign(filterDesign: FilterDesign): filterDesign is CompoundFilterDesign {
        return (filterDesign as CompoundFilterDesign).type !== undefined && (filterDesign as CompoundFilterDesign).filters !== undefined;
    }

    // https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types
    /**
     * Returns if the given filter design is a SimpleFilterDesign.
     *
     * @arg {FilterDesign} filterDesign
     * @return {filterDesign is SimpleFilterDesign}
     */
    export function isSimpleFilterDesign(filterDesign: FilterDesign): filterDesign is SimpleFilterDesign {
        return (filterDesign as SimpleFilterDesign).datastore !== undefined &&
            (filterDesign as SimpleFilterDesign).database !== undefined &&
            (filterDesign as SimpleFilterDesign).table !== undefined;
    }
}

export class FilterCollection {
    protected data: Map<FilterDataSource[], AbstractFilter[]> = new Map<FilterDataSource[], AbstractFilter[]>();

    /**
     * Returns the data source for the given filter design as either an existing matching data source within this collection or a new data
     * source (the new data source is also saved in this collection with an empty array).
     *
     * @arg {FilterDesign} filterDesign
     * @return {FilterDataSource[]}
     */
    public findFilterDataSources(filterDesign: FilterDesign): FilterDataSource[] {
        let filterDataSourceList: FilterDataSource[] = FilterUtil.createFilterDataSourceListFromDesign(filterDesign);

        // Return a matching existing FilterDataSource list if possible (should either be length 0 or 1 matches).
        let matchingDataSourceList: FilterDataSource[][] = this.getDataSources().filter((existingDataSourceList) =>
            FilterUtil.areFilterDataSourceListsEquivalent(filterDataSourceList, existingDataSourceList));

        if (matchingDataSourceList.length) {
            if (matchingDataSourceList.length > 1) {
                console.error('Multiple equivalent data source objects in filter collection; something is wrong!', this.data);
            }
            return matchingDataSourceList[0];
        }

        // Otherwise save the FilterDataSource in the internal data and return it.
        this.data.set(filterDataSourceList, []);

        return filterDataSourceList;
    }

    /**
     * Returns the data sources within this collection.
     *
     * @return {FilterDataSource[][]}
     */
    public getDataSources(): FilterDataSource[][] {
        return Array.from(this.data.keys());
    }

    /**
     * Returns the filters for the given data source (or an existing matching data source within this collection).
     *
     * @arg {FilterDataSource[]} filterDataSourceList
     * @return {AbstractFilter[]}
     */
    public getFilters(filterDataSourceList: FilterDataSource[]): AbstractFilter[] {
        if (this.data.has(filterDataSourceList)) {
            return this.data.get(filterDataSourceList) || [];
        }

        // Return a matching existing FilterDataSource list if possible (should either be length 0 or 1 matches).
        let matchingDataSourceList: FilterDataSource[][] = this.getDataSources().filter((existingDataSourceList) =>
            FilterUtil.areFilterDataSourceListsEquivalent(filterDataSourceList, existingDataSourceList));

        if (matchingDataSourceList.length) {
            if (matchingDataSourceList.length > 1) {
                console.error('Multiple equivalent data source objects in filter collection; something is wrong!', this.data);
            }
            return this.data.get(matchingDataSourceList[0]) || [];
        }

        // Otherwise save the FilterDataSource in the internal data and return the empty array.
        this.data.set(filterDataSourceList, []);

        return this.data.get(filterDataSourceList);
    }

    /**
     * Sets the filters for the given data source (or an existing matching data source within this collection) to the given filters, then
     * returns the data source used for the collection key (either the given data source or the existing matching data source).
     *
     * @arg {FilterDataSource[]} filterDataSourceList
     * @arg {AbstractFilter[]} filterList
     * @return {FilterDataSource[]}
     */
    public setFilters(filterDataSourceList: FilterDataSource[], filterList: AbstractFilter[]): FilterDataSource[] {
        if (this.data.has(filterDataSourceList)) {
            this.data.set(filterDataSourceList, filterList);
            return filterDataSourceList;
        }

        // Return a matching existing FilterDataSource list if possible (should either be length 0 or 1 matches).
        let matchingDataSourceList: FilterDataSource[][] = this.getDataSources().filter((existingDataSourceList) =>
            FilterUtil.areFilterDataSourceListsEquivalent(filterDataSourceList, existingDataSourceList));

        if (matchingDataSourceList.length) {
            if (matchingDataSourceList.length > 1) {
                console.error('Multiple equivalent data source objects in filter collection; something is wrong!', this.data);
            }
            this.data.set(matchingDataSourceList[0], filterList);
            return matchingDataSourceList[0];
        }

        // Otherwise save the FilterDataSource in the internal data with the input array.
        this.data.set(filterDataSourceList, filterList);
        return filterDataSourceList;
    }
}

@Injectable()
export class FilterService {
    protected filterCollection: FilterCollection = new FilterCollection();
    protected messenger: eventing.Messenger = new eventing.Messenger();

    /**
     * Creates and returns the relation filter list for the given filter (but not including the given filter).  Also sets the relations
     * (list of IDs) on the given filter and all its relation filters.
     *
     * @arg {AbstractFilter} filter
     * @arg {SingleField[][][]} relationDataList
     * @arg {AbstractSearchService} searchService
     * @return {AbstractFilter[]}
     * @private
     */
    private createRelationFilterList(
        filter: AbstractFilter,
        relationDataList: SingleField[][][],
        searchService: AbstractSearchService
    ): AbstractFilter[] {
        let filterDataSourceList: FilterDataSource[] = FilterUtil.createFilterDataSourceListFromDesign(filter, true);

        return relationDataList.reduce((returnList, relationData) => {
            let relationFilterList: AbstractFilter[] = [];

            // Assume that each item within the relationData list is a nested list with the same length.
            // EX:  [[x1, y1], [x2, y2], [x3, y3]]
            if (relationData.length && relationData[0].length === filterDataSourceList.length) {
                let equivalentRelationList: SingleField[][] = relationData.filter((relationFilterFields) =>
                    // Each item within the relationFilterFields must be equivalent to a FilterDataSource.
                    relationFilterFields.every((relatedField) => filterDataSourceList.some((filterDataSource) =>
                        this.isRelationEquivalent(relatedField, filterDataSource))) &&
                    // Each FilterDataSource must be equivalent to an item within the relationFilterFields.
                    filterDataSourceList.every((filterDataSource) => relationFilterFields.some((relatedField) =>
                        this.isRelationEquivalent(relatedField, filterDataSource))));

                // The length of equivalentRelationList should be either 0 or 1.
                if (equivalentRelationList.length) {
                    // Create new relation filters.
                    relationData.forEach((relation) => {
                        // Do not create a relation that is the same as the original filter.
                        if (relation !== equivalentRelationList[0]) {
                            let relationFilter: AbstractFilter = filter.createRelationFilter(equivalentRelationList[0], relation,
                                searchService);
                            relationFilter.root = filter.root || CompoundFilterType.AND;
                            relationFilterList.push(relationFilter);
                        }
                    });

                    // Save sibling relation filter IDs in the new relation filters.
                    [filter].concat(relationFilterList).forEach((outerFilter) => {
                        [filter].concat(relationFilterList).forEach((innerFilter) => {
                            if (outerFilter.id !== innerFilter.id) {
                                outerFilter.relations.push(innerFilter.id);
                            }
                        });
                    });
                }
            }
            return returnList.concat(relationFilterList);
        }, [] as AbstractFilter[]);
    }

    /**
     * Deletes the filter with the given filter design.
     *
     * @arg {string} callerId
     * @arg {FilterDesign} filterDesign
     * @return {Map<FilterDataSource[], FilterDesign[]>}
     */
    public deleteFilter(
        callerId: string,
        filterDesign: FilterDesign
    ): Map<FilterDataSource[], FilterDesign[]> {
        let returnCollection: Map<FilterDataSource[], FilterDesign[]> = new Map<FilterDataSource[], FilterDesign[]>();

        let filterDataSourceListToDelete: FilterDataSource[] = this.filterCollection.findFilterDataSources(filterDesign);

        let deleteIdList: string[] = this.filterCollection.getFilters(filterDataSourceListToDelete).reduce((idList, filter) =>
            (filter.id === filterDesign.id ? idList.concat(filter.id).concat(filter.relations) : idList), []);

        if (deleteIdList.length) {
            // Loop over the data sources of the complete collection to delete the old relation filters in each data source.
            this.filterCollection.getDataSources().forEach((filterDataSource) => {
                let previousFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSource);

                let modifiedFilterList: AbstractFilter[] = previousFilterList.filter((filter) => deleteIdList.indexOf(filter.id) < 0);

                let actualDataSourceList: FilterDataSource[] = this.filterCollection.setFilters(filterDataSource, modifiedFilterList);

                returnCollection.set(actualDataSourceList, modifiedFilterList.map((filter) => filter.toDesign()));
            });

            this.messenger.publish(neonEvents.FILTERS_CHANGED, {
                change: returnCollection,
                caller: callerId
            });
        } else {
            this.filterCollection.getDataSources().forEach((filterDataSource) => {
                returnCollection.set(filterDataSource, this.filterCollection.getFilters(filterDataSource).map((filter) =>
                    filter.toDesign()));
            });
        }

        return returnCollection;
    }

    /**
     * Deletes the given filters from the given data sources (or all the filters if no data sources are given).
     *
     * @arg {string} callerId
     * @arg {AbstractSearchService} searchService
     * @arg {FilterDesign[]} [filterDesignListToDelete=[]]
     * @return {Map<FilterDataSource[], FilterDesign[]>}
     */
    public deleteFilters(
        callerId: string,
        __searchService: AbstractSearchService,
        filterDesignListToDelete: FilterDesign[] = []
    ): Map<FilterDataSource[], FilterDesign[]> {
        // Find all filter collection keys matching the data source, if it is given; or find all filter collection keys otherwise.
        let filterCollectionKeys: FilterDataSource[][] = (filterDesignListToDelete.length ? filterDesignListToDelete.map((filterDesign) =>
            this.filterCollection.findFilterDataSources(filterDesign)) : this.filterCollection.getDataSources());

        let returnCollection: Map<FilterDataSource[], FilterDesign[]> = new Map<FilterDataSource[], FilterDesign[]>();

        let deleteIdList: string[] = filterCollectionKeys.reduce((outerList, filterDataSourceList) =>
            outerList.concat(this.filterCollection.getFilters(filterDataSourceList).reduce((innerList, filter) =>
                innerList.concat(filter.id).concat(filter.relations), [] as string[])), [] as string[]);

        if (deleteIdList.length) {
            // Loop over the data sources of the complete collection to delete the old relation filters in each data source.
            this.filterCollection.getDataSources().forEach((filterDataSourceList) => {
                let previousFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);

                let modifiedFilterList: AbstractFilter[] = previousFilterList.filter((filter) => deleteIdList.indexOf(filter.id) < 0);

                let actualDataSourceList: FilterDataSource[] = this.filterCollection.setFilters(filterDataSourceList, modifiedFilterList);

                returnCollection.set(actualDataSourceList, modifiedFilterList.map((filter) => filter.toDesign()));
            });

            this.messenger.publish(neonEvents.FILTERS_CHANGED, {
                change: returnCollection,
                caller: callerId
            });
        } else {
            this.filterCollection.getDataSources().forEach((filterDataSourceList) => {
                returnCollection.set(filterDataSourceList, this.filterCollection.getFilters(filterDataSourceList)
                    .map((filter) => filter.toDesign()));
            });
        }

        return returnCollection;
    }

    /**
     * Exchanges all the filters in the given data sources with the given filters.  If filterDesignListToDelete is given, also deletes the
     * filters of each data source with the given designs (useful if you want to both delete and exchange with one FILTERS_CHANGED event).
     *
     * @arg {string} callerId
     * @arg {FilterDesign[]} filterDesignList
     * @arg {SingleField[][][]} relationDataList
     * @arg {AbstractSearchService} searchService
     * @arg {FilterDesign[]} [filterDesignListToDelete=[]]
     * @return {Map<FilterDataSource[], FilterDesign[]>}
     */
    public exchangeFilters(
        callerId: string,
        filterDesignList: FilterDesign[],
        relationDataList: SingleField[][][],
        searchService: AbstractSearchService,
        filterDesignListToDelete: FilterDesign[] = []
    ): Map<FilterDataSource[], FilterDesign[]> {
        let updateCollection: FilterCollection = new FilterCollection();
        let returnCollection: Map<FilterDataSource[], FilterDesign[]> = new Map<FilterDataSource[], FilterDesign[]>();
        let deleteIdList: string[] = [];

        filterDesignList.forEach((filterDesign) => {
            // Create the new filters and new relation filters to add in the exchange.
            let exchangeFilter: AbstractFilter = FilterUtil.createFilterFromDesign(filterDesign, searchService);
            let relationFilterList: AbstractFilter[] = this.createRelationFilterList(exchangeFilter, relationDataList, searchService);

            // Save the new filters and new relation filters in an intermediary collection to separate filters by unique data source.
            [exchangeFilter].concat(relationFilterList).forEach((relationFilter) => {
                let filterDataSourceList: FilterDataSource[] = this.filterCollection.findFilterDataSources(relationFilter.toDesign());
                let filterList: AbstractFilter[] = updateCollection.getFilters(filterDataSourceList);
                updateCollection.setFilters(filterDataSourceList, filterList.concat(relationFilter));

                // Find the IDs of all the old filters and old relation filters to delete in the exchange.  Repeat IDs don't matter.
                let deleteFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);
                deleteIdList = deleteFilterList.reduce((idList, filter) => idList.concat(filter.id).concat(filter.relations), deleteIdList);
            });
        });

        // Delete the filters of each data source with the given designs.
        filterDesignListToDelete.forEach((filterDesign) => {
            let filterDataSourceList: FilterDataSource[] = this.filterCollection.findFilterDataSources(filterDesign);

            // Find the IDs of all the filters and relation filters to delete.  Repeat IDs don't matter.
            let deleteFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);
            deleteIdList = deleteFilterList.reduce((idList, filter) => idList.concat(filter.id).concat(filter.relations), deleteIdList);

            // Mark this data source in updateCollection so the next loop will remove all the filters with IDs in the deleteIdList.
            updateCollection.setFilters(filterDataSourceList, []);
        });

        // Delete the old filters (if any) from and add the new filters (if any) to the data source of each filter passed as an argument.
        // Loop over the data sources of the complete collection to delete the old relation filters in each data source with no exchanges.
        this.filterCollection.getDataSources().forEach((filterDataSourceList) => {
            let modifiedFilterList: AbstractFilter[] = updateCollection.getFilters(filterDataSourceList);

            // If this is a data source with no exchanges, keep the old filters but remove any old relation filters as needed.
            if (!modifiedFilterList.length) {
                let previousFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);
                modifiedFilterList = previousFilterList.filter((filter) => deleteIdList.indexOf(filter.id) < 0);
            }

            // Update the global filter collection and use its data source in the return data (in case the objects are different).
            let actualDataSourceList: FilterDataSource[] = this.filterCollection.setFilters(filterDataSourceList, modifiedFilterList);
            returnCollection.set(actualDataSourceList, modifiedFilterList.map((filter) => filter.toDesign()));
        });

        if (filterDesignList.length || filterDesignListToDelete.length) {
            this.messenger.publish(neonEvents.FILTERS_CHANGED, {
                change: returnCollection,
                caller: callerId
            });
        }

        return returnCollection;
    }

    /**
     * Returns the filters for the given data sources, or all filters if no data sources are given.
     *
     * @arg {FilterDataSource[]} [filterDataSourceList]
     * @return {FilterDesign[]}
     */
    public getFilters(filterDataSourceList?: FilterDataSource[]): FilterDesign[] {
        return this.getRawFilters(filterDataSourceList).map((filter) => filter.toDesign());
    }

    /**
     * Returns the raw filters for the given data sources, or all filters if no data sources are given.
     *
     * @arg {FilterDataSource[]} [filterDataSourceList]
     * @return {AbstractFilter[]}
     */
    public getRawFilters(filterDataSourceList?: FilterDataSource[]): AbstractFilter[] {
        if (filterDataSourceList) {
            return this.filterCollection.getFilters(filterDataSourceList);
        }
        return this.filterCollection.getDataSources().reduce((returnList, globalDataSource) => returnList.concat(
            this.filterCollection.getFilters(globalDataSource)
        ), [] as AbstractFilter[]);
    }

    /**
     * Returns the filters as JSON objects to save in a config file.
     *
     * @return {any[]}
     */
    public getFiltersToSaveInConfig(): any[] {
        return this.getFilters().map((filter) => FilterUtil.createFilterJsonObjectFromDesign(filter)).filter((filter) => !!filter);
    }

    /**
     * Returns all the filters to search on the given datastore/database/table (ignoring filters from the given data sources).
     *
     * @arg {string} datastoreName
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {FilterDesign[]} [filterDesignListToIgnore=[]]
     * @return {AbstractFilter[]}
     */
    public getFiltersToSearch(
        datastoreName: string,
        databaseName: string,
        tableName: string,
        searchService: AbstractSearchService,
        filterDesignListToIgnore: FilterDesign[] = []
    ): FilterClause[] {
        return this.filterCollection.getDataSources().reduce((returnList, filterDataSourceList) => {
            let ignore = filterDesignListToIgnore.some((filterDesignToIgnore) => {
                let filterDataSourceListToIgnore: FilterDataSource[] = this.filterCollection.findFilterDataSources(filterDesignToIgnore);
                return FilterUtil.areFilterDataSourceListsEquivalent(filterDataSourceList, filterDataSourceListToIgnore);
            });
            if (ignore) {
                return returnList;
            }
            let filterListToAND: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList).filter((filter) =>
                filter.root === CompoundFilterType.AND && filter.doesAffectSearch(datastoreName, databaseName, tableName));
            let filterListToOR: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList).filter((filter) =>
                filter.root === CompoundFilterType.OR && filter.doesAffectSearch(datastoreName, databaseName, tableName));
            let filterAND: AbstractFilter = filterListToAND.length ? new CompoundFilter(CompoundFilterType.AND, filterListToAND,
                searchService) : null;
            let filterOR: AbstractFilter = filterListToOR.length ? new CompoundFilter(CompoundFilterType.OR, filterListToOR,
                searchService) : null;
            return returnList.concat(filterAND || []).concat(filterOR || []);
        }, [] as AbstractFilter[]).map((filter) => filter.filterClause);
    }

    /**
     * Returns all the filters compatible with the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @return {[AbstractFilter[], AbstractFilter[]]}
     * @private
     */
    private getFiltersWithDesign(filterDesign: FilterDesign): AbstractFilter[] {
        let filterDataSourceList: FilterDataSource[] = this.filterCollection.findFilterDataSources(filterDesign);
        return this.filterCollection.getFilters(filterDataSourceList);
    }

    /**
     * Returns if the visualization is filtered by the given filter collection (optionally, filtered matching the given filter design).
     *
     * @arg {FilterCollection} filterCollection
     * @arg {FilterDesign} [filterDesign]
     * @return {boolean}
     */
    public isFiltered(filterCollection: FilterCollection, filterDesign?: FilterDesign): boolean {
        if (filterDesign) {
            let filterDataSourceList: FilterDataSource[] = filterCollection.findFilterDataSources(filterDesign);
            let filterList: AbstractFilter[] = filterCollection.getFilters(filterDataSourceList);

            // Return true if the given category has any filters compatible with the given filter design.
            return filterList.some((filter) => filter.isCompatibleWithDesign(filterDesign));
        }
        // Return true if any category has any filters.
        return !!(filterCollection.getDataSources().some((key) => !!filterCollection.getFilters(key).length));
    }

    /**
     * Returns if the given field is equivalent to the given data source.
     *
     * @arg {SingleField} inputField
     * @arg {FilterDataSource} filterDataSource
     * @return {boolean}
     * @private
     */
    private isRelationEquivalent(inputField: SingleField, filterDataSource: FilterDataSource): boolean {
        return !!(inputField.datastore === filterDataSource.datastoreName && inputField.database.name === filterDataSource.databaseName &&
            inputField.table.name === filterDataSource.tableName && inputField.field.columnName === filterDataSource.fieldName);
    }

    /**
     * Sets the filters in the FilterService to the given filter JSON objects from a config file.
     *
     * @arg {any[]} filtersFromConfig
     * @arg {DatasetService} datasetService
     * @arg {AbstractSearchService} searchService
     */
    public setFiltersFromConfig(filtersFromConfig: any[], datasetService: DatasetService, searchService: AbstractSearchService) {
        let collection: FilterCollection = new FilterCollection();
        filtersFromConfig.forEach((filterFromConfig) => {
            let filterDesign: FilterDesign = FilterUtil.createFilterDesignFromJsonObject(filterFromConfig, datasetService);
            if (filterDesign) {
                let filterDataSourceList: FilterDataSource[] = collection.findFilterDataSources(filterDesign);
                let filter: AbstractFilter = FilterUtil.createFilterFromDesign(filterDesign, searchService);
                collection.setFilters(filterDataSourceList, collection.getFilters(filterDataSourceList).concat(filter));
            }
        });
        this.filterCollection = collection;
    }

    /**
     * Toggles the given filters (adds input filters that are not in the global list and deletes input filters that are in the global list)
     * in the given data sources.
     *
     * @arg {string} callerId
     * @arg {FilterDesign[]} filterDesignList
     * @arg {SingleField[][][]} relationDataList
     * @arg {AbstractSearchService} searchService
     * @return {Map<FilterDataSource, FilterDesign[]>}
     */
    public toggleFilters(
        callerId: string,
        filterDesignList: FilterDesign[],
        relationDataList: SingleField[][][],
        searchService: AbstractSearchService
    ): Map<FilterDataSource[], FilterDesign[]> {
        let updateCollection: FilterCollection = new FilterCollection();
        let returnCollection: Map<FilterDataSource[], FilterDesign[]> = new Map<FilterDataSource[], FilterDesign[]>();

        filterDesignList.forEach((toggleFilterDesign) => {
            // Create the new filters and new relation filters to add (toggle ON).
            let toggleFilter: AbstractFilter = FilterUtil.createFilterFromDesign(toggleFilterDesign, searchService);
            let relationFilterList: AbstractFilter[] = this.createRelationFilterList(toggleFilter, relationDataList, searchService);

            // Save the new filters and new relation filters in an intermediary collection to separate filters by unique data source.
            [toggleFilter].concat(relationFilterList).forEach((relationFilter) => {
                let filterDataSourceList: FilterDataSource[] = this.filterCollection.findFilterDataSources(relationFilter.toDesign());
                let filterList: AbstractFilter[] = updateCollection.getFilters(filterDataSourceList);
                updateCollection.setFilters(filterDataSourceList, filterList.concat(relationFilter));
            });
        });

        // Find the IDs of all the old filters and old relation filters to delete (toggle OFF).  Repeat IDs don't matter.
        let deleteIdList: string[] = [];
        updateCollection.getDataSources().forEach((filterDataSourceList) => {
            let globalFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);
            let toggleFilterList: AbstractFilter[] = updateCollection.getFilters(filterDataSourceList);

            // Identify a filter to delete if an equivalent filter (with the same properties) already exists in the global filter list.
            let deleteFilterList: AbstractFilter[] = globalFilterList.filter((globalFilter) => toggleFilterList.some((toggleFilter) =>
                toggleFilter.isEquivalentToFilter(globalFilter)));
            deleteIdList = deleteFilterList.reduce((idList, filter) => idList.concat(filter.id).concat(filter.relations), deleteIdList);
        });

        // Toggle each filter passed as an argument and all its relation filters.
        // Loop over the data sources of the complete collection to delete the old relation filters in each data source with no toggles.
        this.filterCollection.getDataSources().forEach((filterDataSourceList) => {
            let globalFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);
            let toggleFilterList: AbstractFilter[] = updateCollection.getFilters(filterDataSourceList);

            // Drop the old filters and the old relation filters to delete (toggle ON) and keep the remaining filters.
            let retainFilterList: AbstractFilter[] = globalFilterList.filter((globalFilter) => deleteIdList.indexOf(globalFilter.id) < 0);

            // Find the new filters and the new relation filters to add (toggle ON).
            let appendFilterList: AbstractFilter[] = toggleFilterList.filter((toggleFilter) => !globalFilterList.some((globalFilter) =>
                globalFilter.isEquivalentToFilter(toggleFilter)));

            let modifiedFilterList: AbstractFilter[] = retainFilterList.concat(appendFilterList);

            // Update the global filter collection and use its data source in the return data (in case the objects are different).
            let actualDataSourceList: FilterDataSource[] = this.filterCollection.setFilters(filterDataSourceList, modifiedFilterList);
            returnCollection.set(actualDataSourceList, modifiedFilterList.map((filter) => filter.toDesign()));
        });

        if (filterDesignList.length) {
            this.messenger.publish(neonEvents.FILTERS_CHANGED, {
                change: returnCollection,
                caller: callerId
            });
        }

        return returnCollection;
    }

    /**
     * Swaps the existing filters in the given filter collection with all the compatible (matching) global filters.
     *
     * @arg {FilterBehavior[]} compatibleFilterBehaviorList
     * @arg {FilterCollection} filterCollection
     */
    public updateCollectionWithGlobalCompatibleFilters(
        compatibleFilterBehaviorList: FilterBehavior[],
        filterCollection: FilterCollection
    ): void {
        let compatibleCollection: FilterCollection = new FilterCollection();

        compatibleFilterBehaviorList.forEach((compatibleFilterBehavior) => {
            // Find the data source for the filter design.
            let filterDataSourceList: FilterDataSource[] = filterCollection.findFilterDataSources(compatibleFilterBehavior.filterDesign);

            // Find the global filter list that is compatible with the filter design.
            let filterList: AbstractFilter[] = this.getFiltersWithDesign(compatibleFilterBehavior.filterDesign);

            // Save the filter list and continue the loop.  We need an intermediary collection here because multiple filter designs from
            // compatibleFilterBehaviorList could have the same filterDataSourceList so saving filters directly into filterCollection would
            // overwrite compatible filter lists from previous filter designs.  Also, don't add the same filter to the list twice!
            let compatibleFilterList: AbstractFilter[] = filterList.reduce((list, filter) =>
                list.concat((list.indexOf(filter) < 0 ? filter : [])), compatibleCollection.getFilters(filterDataSourceList));
            compatibleCollection.setFilters(filterDataSourceList, compatibleFilterList);
        });

        compatibleCollection.getDataSources().forEach((filterDataSourceList) => {
            let filterList: AbstractFilter[] = compatibleCollection.getFilters(filterDataSourceList);
            let cachedFilterList: AbstractFilter[] = filterCollection.getFilters(filterDataSourceList);

            // If the new (compatible global) filter list is not equal to the old (cached) filter list, update the filter collection.
            let equals: boolean = filterList.length === cachedFilterList.length && filterList.every((filter, index) =>
                filter.isEquivalentToFilter(cachedFilterList[index]));

            if (!equals) {
                filterCollection.setFilters(filterDataSourceList, filterList);

                // Call the redrawCallback of each compatibleFilterBehaviorList object with an equivalent filterDataSourceList.
                compatibleFilterBehaviorList.forEach((compatibleFilterBehavior) => {
                    let callbackFilterDataSourceList: FilterDataSource[] = filterCollection.findFilterDataSources(
                        compatibleFilterBehavior.filterDesign
                    );

                    if (FilterUtil.areFilterDataSourceListsEquivalent(filterDataSourceList, callbackFilterDataSourceList)) {
                        compatibleFilterBehavior.redrawCallback(filterList);
                    }
                });
            }
        });
    }
}

export abstract class AbstractFilter {
    public id: string;
    public name: string;
    public root: CompoundFilterType = CompoundFilterType.AND;
    public relations: string[] = [];

    constructor(public filterClause: FilterClause) {
        this.id = uuidv4();
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @arg {SingleField[]} equivalentRelationFilterFields
     * @arg {SingleField[]} substituteRelationFilterFields
     * @arg {AbstractSearchService} searchService
     * @return {AbstractFilter}
     * @abstract
     */
    public abstract createRelationFilter(
        equivalentRelationFilterFields: SingleField[],
        substituteRelationFilterFields: SingleField[],
        searchService: AbstractSearchService): AbstractFilter;

    /**
     * Returns if this filter affects a search in the given datastore/database/table.
     *
     * @arg {string} datastore
     * @arg {string} database
     * @arg {string} table
     * @return {boolean}
     * @abstract
     */
    public abstract doesAffectSearch(datastore: string, database: string, table: string): boolean;

    /**
     * Returns if this filter is compatible with the given filter design.  Compatible filters must have the same FilterDataSource list.
     *
     * @arg {FilterDesign} filterDesign
     * @return {boolean}
     * @abstract
     */
    public abstract isCompatibleWithDesign(filterDesign: FilterDesign): boolean;

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @arg {AbstractFilter} filter
     * @return {boolean}
     * @abstract
     */
    public abstract isEquivalentToFilter(filter: AbstractFilter): boolean;

    /**
     * Returns the filter design of this filter.
     *
     * @return {FilterDesign}
     * @abstract
     */
    public abstract toDesign(): FilterDesign;

    /**
     * Returns the string form of this filter.
     *
     * @return {string}
     * @protected
     * @abstract
     */
    protected abstract toStringHelper(): string;

    /**
     * Returns the string form of this filter.
     *
     * @return {string}
     */
    public toString(): string {
        return this.name || this.toStringHelper();
    }
}

export class SimpleFilter extends AbstractFilter {
    constructor(
        public datastore: string,
        public database: DatabaseMetaData,
        public table: TableMetaData,
        public field: FieldMetaData,
        public operator: string,
        public value: any,
        searchService: AbstractSearchService
    ) {
        super(searchService.buildFilterClause(field.columnName, operator, value));
        this.name = this.toString();
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @arg {SingleField[]} equivalentRelationFilterFields
     * @arg {SingleField[]} substituteRelationFilterFields
     * @arg {AbstractSearchService} searchService
     * @return {AbstractFilter}
     */
    public createRelationFilter(
        equivalentRelationFilterFields: SingleField[],
        substituteRelationFilterFields: SingleField[],
        searchService: AbstractSearchService
    ): AbstractFilter {
        if (equivalentRelationFilterFields.length !== substituteRelationFilterFields.length) {
            return null;
        }

        let relationFilter: SimpleFilter = null;

        equivalentRelationFilterFields.forEach((equivalent, index) => {
            if (equivalent.datastore === this.datastore && equivalent.database.name === this.database.name &&
                equivalent.table.name === this.table.name && equivalent.field.columnName === this.field.columnName) {
                let substitute: SingleField = substituteRelationFilterFields[index];

                if (substitute.database && substitute.database.name && substitute.table && substitute.table.name &&
                    substitute.field && substitute.field.columnName) {
                    relationFilter = new SimpleFilter(substitute.datastore, substitute.database, substitute.table,
                        substitute.field, this.operator, this.value, searchService);
                    relationFilter.root = this.root;
                }
            }
        });

        return relationFilter;
    }

    /**
     * Returns if this filter affects a search in the given datastore/database/table.
     *
     * @arg {string} datastore
     * @arg {string} database
     * @arg {string} table
     * @return {boolean}
     */
    public doesAffectSearch(datastore: string, database: string, table: string): boolean {
        return datastore === this.datastore && database === this.database.name && table === this.table.name;
    }

    /**
     * Returns if this filter is compatible with the given filter design.  Compatible filters must have the same FilterDataSource list.
     *
     * @arg {FilterDesign} filterDesign
     * @return {boolean}
     */
    public isCompatibleWithDesign(filterDesign: FilterDesign): boolean {
        let simpleFilterDesign = (filterDesign as SimpleFilterDesign);
        return (simpleFilterDesign.root || CompoundFilterType.AND) === this.root &&
            simpleFilterDesign.datastore === this.datastore &&
            simpleFilterDesign.database.name === this.database.name &&
            simpleFilterDesign.table.name === this.table.name &&
            simpleFilterDesign.field.columnName === this.field.columnName &&
            simpleFilterDesign.operator === this.operator &&
            (typeof simpleFilterDesign.value !== 'undefined' ? simpleFilterDesign.value === this.value : true);
    }

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @arg {AbstractFilter} filter
     * @return {boolean}
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof SimpleFilter && filter.root === this.root && filter.datastore === this.datastore &&
            filter.database.name === this.database.name && filter.table.name === this.table.name &&
            filter.field.columnName === this.field.columnName && filter.operator === this.operator && filter.value === this.value;
    }

    /**
     * Returns the filter design of this filter.
     *
     * @return {FilterDesign}
     */
    public toDesign(): FilterDesign {
        return {
            id: this.id,
            name: this.name,
            root: this.root,
            datastore: this.datastore,
            database: this.database,
            table: this.table,
            field: this.field,
            operator: this.operator,
            value: this.value
        } as SimpleFilterDesign;
    }

    /**
     * Returns the string form of this filter.
     *
     * @return {string}
     * @protected
     */
    protected toStringHelper(): string {
        let prettyValue = this.value instanceof Date ? ((this.value.getUTCMonth() + 1) + '-' + this.value.getUTCDate() + '-' +
            this.value.getUTCFullYear()) : this.value;
        // EX:  database.table.field = value
        return FilterUtil.createFilterName(this.database, this.table, this.field, this.operator) + ' ' + prettyValue;
    }
}

export class CompoundFilter extends AbstractFilter {
    constructor(public type: CompoundFilterType, public filters: AbstractFilter[], searchService: AbstractSearchService) {
        super(searchService.buildCompoundFilterClause(filters.map((filter) => filter.filterClause), type));
        this.name = this.toString();
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @arg {SingleField[]} equivalentRelationFilterFields
     * @arg {SingleField[]} substituteRelationFilterFields
     * @arg {AbstractSearchService} searchService
     * @return {AbstractFilter}
     */
    public createRelationFilter(
        equivalentRelationFilterFields: SingleField[],
        substituteRelationFilterFields: SingleField[],
        searchService: AbstractSearchService
    ): AbstractFilter {
        if (equivalentRelationFilterFields.length !== substituteRelationFilterFields.length) {
            return null;
        }

        let nestedRelationExists = false;

        let relationFilter: CompoundFilter = new CompoundFilter(this.type, this.filters.map((filter) => {
            let nestedRelationFilter: AbstractFilter = filter.createRelationFilter(equivalentRelationFilterFields,
                substituteRelationFilterFields, searchService);
            nestedRelationExists = nestedRelationExists || !!nestedRelationFilter;
            // A compound filter can exchange one of its nested filters with a relation and keep the rest of the original nested filters.
            return nestedRelationFilter || filter;
        }), searchService);

        relationFilter.root = this.root;

        // Return null unless at least one nested relation filter exists.
        return nestedRelationExists ? relationFilter : null;
    }

    /**
     * Returns if this filter affects a search in the given datastore/database/table.
     *
     * @arg {string} datastore
     * @arg {string} database
     * @arg {string} table
     * @return {boolean}
     */
    public doesAffectSearch(datastore: string, database: string, table: string): boolean {
        return this.filters.some((nested) => nested.doesAffectSearch(datastore, database, table));
    }

    /**
     * Returns if this filter is compatible with the given filter design.  Compatible filters must have the same FilterDataSource list.
     *
     * @arg {FilterDesign} filterDesign
     * @return {boolean}
     */
    public isCompatibleWithDesign(filterDesign: FilterDesign): boolean {
        let compoundFilterDesign = (filterDesign as CompoundFilterDesign);

        let filterDataSourceList: FilterDataSource[] = FilterUtil.createFilterDataSourceListFromDesign(compoundFilterDesign);

        if (filterDataSourceList.length > 1) {
            // If the filter design contains more than one FilterDataSource, ensure that 1) each nested design is compatible with at least
            // one nested filter object, 2) each nested filter object is compatible with at least one nested filter design, and 3) both
            // lists are the same length.  This forces designs to have specific nested filters but allows them to have nested filters in an
            // unexpected order.  This is useful with visualizations that filter on a specific range, point, or box.
            return (compoundFilterDesign.root || CompoundFilterType.AND) === this.root &&
                compoundFilterDesign.type === this.type &&
                compoundFilterDesign.filters &&
                compoundFilterDesign.filters.length === this.filters.length &&
                compoundFilterDesign.filters.every((nestedDesign) =>
                    this.filters.some((nestedFilter) =>
                        nestedFilter.isCompatibleWithDesign(nestedDesign))) &&
                this.filters.every((nestedFilter) =>
                    compoundFilterDesign.filters.some((nestedDesign) =>
                        nestedFilter.isCompatibleWithDesign(nestedDesign)));
        }

        // If the filter design contains only one FilterDataSource, ensure that each nested filter design is compatible with at least one
        // nested filter object.  This allows filters that expect one or more nested filters with the same design.  This is useful with
        // visualizations that can set a variable number of EQUALS or NOT EQUALS filters on one field.
        return (compoundFilterDesign.root || CompoundFilterType.AND) === this.root &&
            compoundFilterDesign.type === this.type &&
            compoundFilterDesign.filters &&
            compoundFilterDesign.filters.every((nestedDesign) =>
                this.filters.some((nestedFilter) =>
                    nestedFilter.isCompatibleWithDesign(nestedDesign)));
    }

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @arg {AbstractFilter} filter
     * @return {boolean}
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof CompoundFilter && filter.root === this.root && filter.type === this.type &&
            filter.filters.length === this.filters.length &&
            filter.filters.every((nestedFilter, index) => nestedFilter.isEquivalentToFilter(this.filters[index]));
    }

    /**
     * Returns the filter design of this filter.
     *
     * @return {FilterDesign}
     */
    public toDesign(): FilterDesign {
        return {
            id: this.id,
            name: this.name,
            root: this.root,
            type: this.type,
            filters: this.filters.map((filter) => filter.toDesign())
        } as CompoundFilterDesign;
    }

    /**
     * Returns the string form of this filter.
     *
     * @return {string}
     * @protected
     */
    protected toStringHelper(): string {
        // With too many nested filters (arbitrarily more than 5), the name gets too long, so abbreviate it.
        // EX:  (fieldA : 5 Filters) AND (fieldB : 1 Filter)
        if (this.filters.length > 5) {
            let filterNameCollection: Map<string, number> = new Map<string, number>();
            this.filters.forEach((filter) => {
                let filterName = filter instanceof SimpleFilter ? FilterUtil.createFilterName(filter.database, filter.table, filter.field,
                    filter.operator) : filter.toString();
                let priorCount = filterNameCollection.get(filterName) || 0;
                filterNameCollection.set(filterName, priorCount + 1);
            });
            return '(' + Array.from(filterNameCollection.keys()).map((filterName) => {
                let typeString = this.type === CompoundFilterType.AND ? 'ALL OF ' : 'ONE OF ';
                let totalCount = filterNameCollection.get(filterName);
                return filterName + ' ' + typeString + totalCount + ' FILTER' + (totalCount > 1 ? 'S' : '');
            }).join(') ' + this.type + ' (') + ')';
        }
        // EX:  (fieldA != value1) AND ((fieldB = value2) OR (fieldB = value3))
        return '(' + this.filters.map((filter) => filter.toString()).join(') ' + this.type + ' (') + ')';
    }
}
