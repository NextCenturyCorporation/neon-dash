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
import { AbstractSearchService, CompoundFilterType, FilterClause } from './abstract.search.service';
import { DatabaseMetaData, FieldMetaData, SingleField, TableMetaData } from '../dataset';
import { neonEvents } from '../neon-namespaces';

import * as uuidv4 from 'uuid/v4';
import * as _ from 'lodash';
import * as neon from 'neon-framework';

export interface FilterBehavior {
    filterDesign: FilterDesign;
    redrawCallback(filters: AbstractFilter[]): void;
}

export interface FilterDesign {
    id?: string;
    name?: string;
    // By default, each filter is required:  each search result must adhere to each filter.  In searches, each required filter with the
    // same FilterDataSource is combined into a single compound AND filter on that FilterDataSource.  However, each filter that is
    // "optional" is instead combined into a single compound OR filter.  This means that each search result must adhere to at least one
    // optional filter.  A FilterDataSource with both required and optional filters generates two compound filters:  one AND, one OR.
    optional?: boolean;
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
    // The "inflexible" property is used in comparing two compound filters.  A compound filter is "flexible" by default.  A flexible filter
    // is equivalent to another compound filter as long as that filter contains one or more nested filters with the same FilterDataSource
    // as flexible filter.  This is useful with visualizations that can set a variable number of EQUALS or NOT EQUALS filters on one field.
    // Comparitively, an inflexible filter is equivalent to another compound filter only if that filter contains the specific set of nested
    // filters (except they can be rearranged).  This is useful with visualizations that filter on a specific range, point, or box.
    // Regardless, both compound filters must have the same "type".
    inflexible?: boolean;
    filters: FilterDesign[];
}

export namespace FilterUtil {
    /**
     * Returns if the given FilterClauseDataSource objects are equivalent.
     *
     * @arg {FilterDataSource} item1
     * @arg {FilterDataSource} item2
     * @arg {boolean} [ignoreOperator=false]
     * @return {boolean}
     */
    export function areFilterClauseDataSourcesEquivalent(
        item1: FilterClauseDataSource,
        item2: FilterClauseDataSource,
        ignoreOperator: boolean = false
    ): boolean {
        return !!(item1.datastoreName === item2.datastoreName && item1.databaseName === item2.databaseName &&
            item1.tableName === item2.tableName && item1.fieldName === item2.fieldName &&
            (ignoreOperator ? true : item1.operator === item2.operator));
    }

    /**
     * Returns if the given FilterClauseDataSource lists are equivalent.
     *
     * @arg {FilterClauseDataSource[]} list1
     * @arg {FilterClauseDataSource[]} list2
     * @return {boolean}
     */
    export function areFilterClauseDataSourceListsEquivalent(list1: FilterClauseDataSource[], list2: FilterClauseDataSource[]): boolean {
        return list1.length === list2.length &&
            // Each FilterClauseDataSource in list1 must be equivalent to a FilterClauseDataSource in list2.
            list1.every((item1) => list2.some((item2) => FilterUtil.areFilterClauseDataSourcesEquivalent(item1, item2))) &&
            // Each FilterClauseDataSource in list2 must be equivalent to a FilterClauseDataSource in list1.
            list2.every((item2) => list2.some((item1) => FilterUtil.areFilterClauseDataSourcesEquivalent(item1, item2)));
    }

    /**
     * Creates and returns the FilterClauseDataSource list for the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @arg {boolean} [ignoreOperator=false]
     * @return {FilterClauseDataSource[]}
     */
    export function createFilterClauseDataSourceList(
        filterDesign: FilterDesign,
        ignoreOperator: boolean = false
    ): FilterClauseDataSource[] {
        if (FilterUtil.isSimpleFilterDesign(filterDesign)) {
            let simpleFilterDesign = filterDesign as SimpleFilterDesign;

            if (simpleFilterDesign.database && simpleFilterDesign.database.name && simpleFilterDesign.table &&
                simpleFilterDesign.table.name && simpleFilterDesign.field && simpleFilterDesign.field.columnName) {

                return [{
                    datastoreName: simpleFilterDesign.datastore,
                    databaseName: simpleFilterDesign.database.name,
                    tableName: simpleFilterDesign.table.name,
                    fieldName: simpleFilterDesign.field.columnName,
                    operator: ignoreOperator ? undefined : simpleFilterDesign.operator
                }] as FilterClauseDataSource[];
            }
        }

        if (FilterUtil.isCompoundFilterDesign(filterDesign)) {
            let compoundFilterDesign = filterDesign as CompoundFilterDesign;

            let returnList: FilterClauseDataSource[] = [];

            compoundFilterDesign.filters.forEach((nestedFilterDesign) => {
                let nestedClauseDataSourceList: FilterClauseDataSource[] = FilterUtil.createFilterClauseDataSourceList(nestedFilterDesign,
                    ignoreOperator);

                nestedClauseDataSourceList.forEach((nestedDataSource) => {
                    let exists = returnList.some((existingDataSource) => FilterUtil.areFilterClauseDataSourcesEquivalent(nestedDataSource,
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
     * Creates and returns a filter object from the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @arg {AbstractSearchService} searchService
     * @return {AbstractFilter}
     */
    export function createFilterFromDesign(filterDesign: FilterDesign, searchService: AbstractSearchService): AbstractFilter {
        let filter: AbstractFilter = null;
        let simpleFilterDesign: SimpleFilterDesign = FilterUtil.isSimpleFilterDesign(filterDesign) ? (filterDesign as SimpleFilterDesign) :
            null;
        let compoundFilterDesign: CompoundFilterDesign = FilterUtil.isCompoundFilterDesign(filterDesign) ?
            (filterDesign as CompoundFilterDesign) : null;

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
                FilterUtil.createFilterFromDesign(nestedDesign, searchService)), searchService);
        }

        if (filter) {
            filter.id = filterDesign.id || filter.id;
            filter.name = filterDesign.name || filter.name;
            filter.optional = !!filterDesign.optional;
        }

        return filter;
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

export abstract class AbstractFilterCollection {
    protected data: Map<FilterDataSource, AbstractFilter[]> = new Map<FilterDataSource, AbstractFilter[]>();

    /**
     * Creates and returns an empty array to save in the data.
     *
     * @return {AbstractFilter[]}
     * @abstract
     */
    protected abstract createEmptyDataArray(): AbstractFilter[];

    /**
     * Returns the data source for the given filter design as either an existing matching data source within this collection or a new data
     * source (the new data source is also saved in this collection with an empty array).
     *
     * @arg {FilterDesign} filterDesign
     * @return {FilterDataSource}
     */
    public findFilterDataSource(filterDesign: FilterDesign): FilterDataSource {
        let clauseDataSourceList: FilterClauseDataSource[] = FilterUtil.createFilterClauseDataSourceList(filterDesign);

        // Return a matching existing FilterDataSource if possible (the list should either be length 0 or 1).
        let matchingDataSourceList: FilterDataSource[] = this.getDataSources().filter((existingDataSource) =>
            FilterUtil.areFilterClauseDataSourceListsEquivalent(clauseDataSourceList, existingDataSource.list));

        if (matchingDataSourceList.length) {
            if (matchingDataSourceList.length > 1) {
                console.error('Multiple equivalent data source objects in filter collection; something is wrong!', this.data);
            }
            return matchingDataSourceList[0];
        }

        // Otherwise create a new FilterDataSource, save it in the internal data, and return it.
        let filterDataSource: FilterDataSource = {
            list: clauseDataSourceList
        } as FilterDataSource;

        this.data.set(filterDataSource, this.createEmptyDataArray());

        return filterDataSource;
    }

    /**
     * Returns the data sources within this collection.
     *
     * @return {FilterDataSource[]}
     */
    public getDataSources(): FilterDataSource[] {
        return Array.from(this.data.keys());
    }

    /**
     * Returns the filters for the given data source (or an existing matching data source within this collection).
     *
     * @arg {FilterDataSource} filterDataSource
     * @return {AbstractFilter[]}
     */
    protected getFiltersHelper(filterDataSource: FilterDataSource): AbstractFilter[] {
        if (this.data.has(filterDataSource)) {
            return this.data.get(filterDataSource) || this.createEmptyDataArray();
        }

        // Return a matching existing FilterDataSource if possible (the list should either be length 0 or 1).
        let matchingDataSourceList: FilterDataSource[] = this.getDataSources().filter((existingDataSource) =>
            FilterUtil.areFilterClauseDataSourceListsEquivalent(filterDataSource.list, existingDataSource.list));

        if (matchingDataSourceList.length) {
            if (matchingDataSourceList.length > 1) {
                console.error('Multiple equivalent data source objects in filter collection; something is wrong!', this.data);
            }
            return this.data.get(matchingDataSourceList[0]) || this.createEmptyDataArray();
        }

        // Otherwise save the FilterDataSource in the internal data and return the empty array.
        this.data.set(filterDataSource, this.createEmptyDataArray());

        return this.data.get(filterDataSource);
    }

    /**
     * Sets the filters for the given data source (or an existing matching data source within this collection) to the given filters, then
     * returns the data source used for the collection key (either the given data source or the existing matching data source).
     *
     * @arg {FilterDataSource} filterDataSource
     * @arg {AbstractFilter[]} filterList
     * @arg {AbstractSearchService} searchService
     * @return {FilterDataSource}
     */
    protected setFiltersHelper(
        filterDataSource: FilterDataSource,
        filterList: AbstractFilter[],
        searchService: AbstractSearchService
    ): FilterDataSource {
        if (this.data.has(filterDataSource)) {
            this.data.set(filterDataSource, filterList);
            return filterDataSource;
        }

        // Return a matching existing FilterDataSource if possible (the list should either be length 0 or 1).
        let matchingDataSourceList: FilterDataSource[] = this.getDataSources().filter((existingDataSource) =>
            FilterUtil.areFilterClauseDataSourceListsEquivalent(filterDataSource.list, existingDataSource.list));

        if (matchingDataSourceList.length) {
            if (matchingDataSourceList.length > 1) {
                console.error('Multiple equivalent data source objects in filter collection; something is wrong!', this.data);
            }
            this.data.set(matchingDataSourceList[0], filterList);
            return matchingDataSourceList[0];
        }

        // Otherwise save the FilterDataSource in the internal data with the input array.
        this.data.set(filterDataSource, filterList);
        return filterDataSource;
    }
}

export class SingleListFilterCollection extends AbstractFilterCollection {
    /**
     * Creates and returns an empty array to save in the data.
     *
     * @return {AbstractFilter[]}
     * @override
     */
    protected createEmptyDataArray(): AbstractFilter[] {
        return [];
    }

    /**
     * Returns the filters for the given data source (or an existing matching data source within this collection).
     *
     * @arg {FilterDataSource} filterDataSource
     * @return {AbstractFilter[]}
     */
    public getFilters(filterDataSource: FilterDataSource): AbstractFilter[] {
        return this.getFiltersHelper(filterDataSource);
    }

    /**
     * Sets the filters for the given data source (or an existing matching data source within this collection) to the given filters, then
     * returns the data source used for the collection key (either the given data source or the existing matching data source).
     *
     * @arg {FilterDataSource} filterDataSource
     * @arg {AbstractFilter[]} filterList
     * @arg {AbstractSearchService} searchService
     * @return {FilterDataSource}
     */
    public setFilters(
        filterDataSource: FilterDataSource,
        filterList: AbstractFilter[],
        searchService: AbstractSearchService
    ): FilterDataSource {
        return this.setFiltersHelper(filterDataSource, filterList, searchService);
    }
}

export class DualListFilterCollection extends AbstractFilterCollection {
    /**
     * Creates and returns an empty array to save in the data.
     *
     * @return {AbstractFilter[]}
     * @override
     */
    protected createEmptyDataArray(): AbstractFilter[] {
        return [null, null];
    }

    /**
     * Returns the nested optional filters for the given data source (or an existing matching data source within this collection).
     *
     * @arg {FilterDataSource} filterDataSource
     * @return {AbstractFilter[]}
     */
    public getFiltersFromOptionalList(filterDataSource: FilterDataSource): AbstractFilter[] {
        let filters = this.getFiltersHelper(filterDataSource);
        if (filters.length !== 2) {
            console.error('DualListFilterCollection has bad data!', this.data);
            return [];
        }
        return filters[1] ? (filters[1] as CompoundFilter).filters : [];
    }

    /**
     * Returns the nested required filters for the given data source (or an existing matching data source within this collection).
     *
     * @arg {FilterDataSource} filterDataSource
     * @return {AbstractFilter[]}
     */
    public getFiltersFromRequiredList(filterDataSource: FilterDataSource): AbstractFilter[] {
        let filters = this.getFiltersHelper(filterDataSource);
        if (filters.length !== 2) {
            console.error('DualListFilterCollection has bad data!', this.data);
            return [];
        }
        return filters[0] ? (filters[0] as CompoundFilter).filters : [];
    }

    /**
     * Returns the nested required and optional filters for the given data source (or an existing matching data source within this
     * collection) as a single filter list.
     *
     * @arg {FilterDataSource} filterDataSource
     * @return {AbstractFilter[]}
     */
    public getFiltersInSingleList(filterDataSource: FilterDataSource): AbstractFilter[] {
        return this.getFiltersFromRequiredList(filterDataSource).concat(this.getFiltersFromOptionalList(filterDataSource));
    }

    /**
     * Returns the required and optional filters for the given data source (or an existing matching data source within this collection) as
     * either single compound filters or single nested filters if only one nested filter exists within the required or optional compound
     * filter.  Returns a list of between 0 and 2 filters.
     *
     * @arg {FilterDataSource} filterDataSource
     * @return {AbstractFilter[]}
     */
    public getFiltersToSearch(filterDataSource: FilterDataSource): AbstractFilter[] {
        let filterList: AbstractFilter[] = this.getFiltersHelper(filterDataSource);
        return filterList.map((filter) => {
            if (filter && (filter as CompoundFilter).filters.length === 1) {
                return (filter as CompoundFilter).filters[0];
            }
            return filter;
        }).filter((filter) => !!filter);
    }

    /**
     * Creates two compound filters for the given required and optional filters (regardless of how many filters exist in the given lists),
     * sets the filters for the given data source (or an existing matching data source within this collection) to the given filters, then
     * returns the data source used for the collection key (either the given data source or the existing matching data source).
     *
     * @arg {FilterDataSource} filterDataSource
     * @arg {AbstractFilter[]} requiredFilters
     * @arg {AbstractFilter[]} optionalFilters
     * @arg {AbstractSearchService} searchService
     * @return {FilterDataSource}
     */
    public setFiltersInDualLists(
        filterDataSource: FilterDataSource,
        requiredFilters: AbstractFilter[],
        optionalFilters: AbstractFilter[],
        searchService: AbstractSearchService
    ): FilterDataSource {
        // Always use either a CompoundFilter or null.
        let requiredFilter: AbstractFilter = requiredFilters.length ? new CompoundFilter(CompoundFilterType.AND, requiredFilters,
            searchService) : null;
        let optionalFilter: AbstractFilter = optionalFilters.length ? new CompoundFilter(CompoundFilterType.OR, optionalFilters,
            searchService) : null;
        return this.setFiltersHelper(filterDataSource, [requiredFilter, optionalFilter], searchService);
    }
}

@Injectable()
export class FilterService {
    protected filterCollection: DualListFilterCollection = new DualListFilterCollection();
    protected messenger: neon.eventing.Messenger = new neon.eventing.Messenger();

    constructor() { /* Do nothing */ }

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
        let clauseDataSourceList: FilterClauseDataSource[] = FilterUtil.createFilterClauseDataSourceList(filter, true);

        return relationDataList.reduce((returnList, relationData) => {
            let relationFilterList: AbstractFilter[] = [];

            // Assume that each item within the relationData list is a nested list with the same length.
            // EX:  [[x1, y1], [x2, y2], [x3, y3]]
            if (relationData.length && relationData[0].length === clauseDataSourceList.length) {
                let equivalentRelationList: SingleField[][] = relationData.filter((relationFilterFields) => {
                    // Each item within the relationFilterFields must be equivalent to a FilterClauseDataSource.
                    return relationFilterFields.every((relatedField) => clauseDataSourceList.some((clauseDataSource) =>
                        this.isRelationEquivalent(relatedField, clauseDataSource))) &&
                            // Each FilterClauseDataSource must be equivalent to an item within the relationFilterFields.
                            clauseDataSourceList.every((clauseDataSource) => relationFilterFields.some((relatedField) =>
                                this.isRelationEquivalent(relatedField, clauseDataSource)));
                });

                // The length of equivalentRelationList should be either 0 or 1.
                if (equivalentRelationList.length) {
                    // Create new relation filters.
                    relationData.forEach((relation) => {
                        // Do not create a relation that is the same as the original filter.
                        if (relation !== equivalentRelationList[0]) {
                            let relationFilter: AbstractFilter = filter.createRelationFilter(equivalentRelationList[0], relation,
                                searchService);
                            relationFilter.optional = !!filter.optional;
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
     * @arg {AbstractSearchService} searchService
     * @return {Map<FilterDataSource, FilterDesign[]>}
     */
    public deleteFilter(
        callerId: string,
        filterDesign: FilterDesign,
        searchService: AbstractSearchService
    ): Map<FilterDataSource, FilterDesign[]> {
        let returnCollection: Map<FilterDataSource, FilterDesign[]> = new Map<FilterDataSource, FilterDesign[]>();

        let filterDataSourceToDelete: FilterDataSource = this.filterCollection.findFilterDataSource(filterDesign);

        let deleteIdList: string[] = this.filterCollection.getFiltersInSingleList(filterDataSourceToDelete).reduce((idList, filter) =>
            (filter.id === filterDesign.id ? idList.concat(filter.id).concat(filter.relations) : idList), []);

        if (deleteIdList.length) {
            // Loop over the data sources of the complete collection to delete the old relation filters in each data source.
            this.filterCollection.getDataSources().forEach((filterDataSource) => {
                let previousRequiredFilterList: AbstractFilter[] = this.filterCollection.getFiltersFromRequiredList(filterDataSource);
                let previousOptionalFilterList: AbstractFilter[] = this.filterCollection.getFiltersFromOptionalList(filterDataSource);

                let requiredFilterList: AbstractFilter[] = previousRequiredFilterList.filter((filter) =>
                    deleteIdList.indexOf(filter.id) < 0);
                let optionalFilterList: AbstractFilter[] = previousOptionalFilterList.filter((filter) =>
                    deleteIdList.indexOf(filter.id) < 0);

                let actualDataSource: FilterDataSource = this.filterCollection.setFiltersInDualLists(filterDataSource, requiredFilterList,
                    optionalFilterList, searchService);

                returnCollection.set(actualDataSource, requiredFilterList.concat(optionalFilterList).map((filter) => filter.toDesign()));
            });

            this.messenger.publish(neonEvents.FILTERS_CHANGED, {
                change: returnCollection,
                caller: callerId
            });
        } else {
            this.filterCollection.getDataSources().forEach((filterDataSource) => {
                returnCollection.set(filterDataSource, this.filterCollection.getFiltersInSingleList(filterDataSource).map((filter) =>
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
     * @return {Map<FilterDataSource, FilterDesign[]>}
     */
    public deleteFilters(
        callerId: string,
        searchService: AbstractSearchService,
        filterDesignListToDelete: FilterDesign[] = []
    ): Map<FilterDataSource, FilterDesign[]> {
        // Find all filter collection keys matching the data source, if it is given; or find all filter collection keys otherwise.
        let filterCollectionKeys: FilterDataSource[] = (filterDesignListToDelete.length ? filterDesignListToDelete.map((filterDesign) =>
            this.filterCollection.findFilterDataSource(filterDesign)) : this.filterCollection.getDataSources());

        let returnCollection: Map<FilterDataSource, FilterDesign[]> = new Map<FilterDataSource, FilterDesign[]>();

        let deleteIdList: string[] = filterCollectionKeys.reduce((outerList, filterDataSource) =>
            outerList.concat(this.filterCollection.getFiltersInSingleList(filterDataSource).reduce((innerList, filter) =>
                innerList.concat(filter.id).concat(filter.relations), [])), []);

        if (deleteIdList.length) {
            // Loop over the data sources of the complete collection to delete the old relation filters in each data source.
            this.filterCollection.getDataSources().forEach((filterDataSource) => {
                let previousRequiredFilterList: AbstractFilter[] = this.filterCollection.getFiltersFromRequiredList(filterDataSource);
                let previousOptionalFilterList: AbstractFilter[] = this.filterCollection.getFiltersFromOptionalList(filterDataSource);

                let requiredFilterList: AbstractFilter[] = previousRequiredFilterList.filter((filter) =>
                    deleteIdList.indexOf(filter.id) < 0);
                let optionalFilterList: AbstractFilter[] = previousOptionalFilterList.filter((filter) =>
                    deleteIdList.indexOf(filter.id) < 0);

                let actualDataSource: FilterDataSource = this.filterCollection.setFiltersInDualLists(filterDataSource, requiredFilterList,
                    optionalFilterList, searchService);

                returnCollection.set(actualDataSource, requiredFilterList.concat(optionalFilterList).map((filter) => filter.toDesign()));
            });

            this.messenger.publish(neonEvents.FILTERS_CHANGED, {
                change: returnCollection,
                caller: callerId
            });
        } else {
            this.filterCollection.getDataSources().forEach((filterDataSource) => {
                returnCollection.set(filterDataSource, this.filterCollection.getFiltersInSingleList(filterDataSource).map((filter) =>
                    filter.toDesign()));
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
     * @return {Map<FilterDataSource, FilterDesign[]>}
     */
    public exchangeFilters(
        callerId: string,
        filterDesignList: FilterDesign[],
        relationDataList: SingleField[][][],
        searchService: AbstractSearchService,
        filterDesignListToDelete: FilterDesign[] = []
    ): Map<FilterDataSource, FilterDesign[]> {
        let updateCollection: SingleListFilterCollection = new SingleListFilterCollection();
        let returnCollection: Map<FilterDataSource, FilterDesign[]> = new Map<FilterDataSource, FilterDesign[]>();
        let deleteIdList: string[] = [];

        filterDesignList.forEach((filterDesign) => {
            // Create the new filters and new relation filters to add in the exchange.
            let exchangeFilter: AbstractFilter = FilterUtil.createFilterFromDesign(filterDesign, searchService);
            let relationFilterList: AbstractFilter[] = this.createRelationFilterList(exchangeFilter, relationDataList, searchService);

            // Save the new filters and new relation filters in an intermediary collection to separate filters by unique data source.
            [exchangeFilter].concat(relationFilterList).forEach((relationFilter) => {
                let filterDataSource: FilterDataSource = this.filterCollection.findFilterDataSource(relationFilter.toDesign());
                let filterList: AbstractFilter[] = updateCollection.getFilters(filterDataSource);
                updateCollection.setFilters(filterDataSource, filterList.concat(relationFilter), searchService);

                // Find the IDs of all the old filters and old relation filters to delete in the exchange.  Repeat IDs don't matter.
                let deleteFilterList: AbstractFilter[] = this.filterCollection.getFiltersInSingleList(filterDataSource);
                deleteIdList = deleteFilterList.reduce((idList, filter) => idList.concat(filter.id).concat(filter.relations), deleteIdList);
            });
        });

        // Delete the filters of each data source with the given designs.
        filterDesignListToDelete.forEach((filterDesign) => {
            let filterDataSource: FilterDataSource = this.filterCollection.findFilterDataSource(filterDesign);

            // Find the IDs of all the filters and relation filters to delete.  Repeat IDs don't matter.
            let deleteFilterList: AbstractFilter[] = this.filterCollection.getFiltersInSingleList(filterDataSource);
            deleteIdList = deleteFilterList.reduce((idList, filter) => idList.concat(filter.id).concat(filter.relations), deleteIdList);

            // Mark this data source in updateCollection so the next loop will remove all the filters with IDs in the deleteIdList.
            updateCollection.setFilters(filterDataSource, [], searchService);
        });

        // Delete the old filters (if any) from and add the new filters (if any) to the data source of each filter passed as an argument.
        // Loop over the data sources of the complete collection to delete the old relation filters in each data source with no exchanges.
        this.filterCollection.getDataSources().forEach((filterDataSource) => {
            let completeFilterList: AbstractFilter[] = updateCollection.getFilters(filterDataSource);
            let requiredFilterList: AbstractFilter[] = completeFilterList.filter((filter) => !filter.optional);
            let optionalFilterList: AbstractFilter[] = completeFilterList.filter((filter) => !!filter.optional);

            // If this is a data source with no exchanges, keep the old filters but remove any old relation filters as needed.
            if (!completeFilterList.length) {
                let previousRequiredFilterList: AbstractFilter[] = this.filterCollection.getFiltersFromRequiredList(filterDataSource);
                let previousOptionalFilterList: AbstractFilter[] = this.filterCollection.getFiltersFromOptionalList(filterDataSource);
                requiredFilterList = previousRequiredFilterList.filter((filter) => deleteIdList.indexOf(filter.id) < 0);
                optionalFilterList = previousOptionalFilterList.filter((filter) => deleteIdList.indexOf(filter.id) < 0);
            }

            // Update the global filter collection and use its data source in the return data (in case the objects are different).
            let actualDataSource: FilterDataSource = this.filterCollection.setFiltersInDualLists(filterDataSource, requiredFilterList,
                optionalFilterList, searchService);
            returnCollection.set(actualDataSource, requiredFilterList.concat(optionalFilterList).map((filter) => filter.toDesign()));
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
     * @arg {FilterDataSource} [filterDataSource]
     * @return {FilterDesign[]}
     */
    public getFilters(filterDataSource?: FilterDataSource): FilterDesign[] {
        if (filterDataSource) {
            return this.filterCollection.getFiltersInSingleList(filterDataSource).map((filter) => filter.toDesign());
        }
        return this.filterCollection.getDataSources().reduce((returnList, globalDataSource) => returnList.concat(
            this.filterCollection.getFiltersInSingleList(globalDataSource)), [] as AbstractFilter[]).map((filter) => filter.toDesign());
    }

    /**
     * Returns all the filters to search on the given datastore/database/table (ignoring filters from the given data sources).
     *
     * @arg {string} datastoreName
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {FilterDataSource[]} [filterDesignListToIgnore=[]]
     * @return {AbstractFilter[]}
     */
    public getFiltersToSearch(
        datastoreName: string,
        databaseName: string,
        tableName: string,
        filterDesignListToIgnore: FilterDesign[] = []
    ): FilterClause[] {
        return this.filterCollection.getDataSources().reduce((returnList, filterDataSource) => {
            let ignore = filterDesignListToIgnore.some((filterDesignToIgnore) => {
                let filterDataSourceToIgnore: FilterDataSource = this.filterCollection.findFilterDataSource(filterDesignToIgnore);
                return FilterUtil.areFilterClauseDataSourceListsEquivalent(filterDataSource.list, filterDataSourceToIgnore.list);
            });
            if (ignore) {
                return returnList;
            }
            let filterList = this.filterCollection.getFiltersToSearch(filterDataSource);
            return returnList.concat(filterList.filter((filter) => filter.doesAffectSearch(datastoreName, databaseName, tableName)));
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
        let filterDataSource: FilterDataSource = this.filterCollection.findFilterDataSource(filterDesign);
        return this.filterCollection.getFiltersInSingleList(filterDataSource);
    }

    /**
     * Returns if the visualization is filtered by the given filter collection (optionally, filtered matching the given filter design).
     *
     * @arg {SingleListFilterCollection} filterCollection
     * @arg {FilterDesign} [filterDesign]
     * @return {boolean}
     */
    public isFiltered(filterCollection: SingleListFilterCollection, filterDesign?: FilterDesign): boolean {
        if (filterDesign) {
            let filterDataSource: FilterDataSource = filterCollection.findFilterDataSource(filterDesign);
            let filterList: AbstractFilter[] = filterCollection.getFilters(filterDataSource);

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
     * @arg {FilterClauseDataSource} clauseDataSource
     * @return {boolean}
     * @private
     */
    private isRelationEquivalent(inputField: SingleField, clauseDataSource: FilterClauseDataSource): boolean {
        return !!(inputField.datastore === clauseDataSource.datastoreName && inputField.database.name === clauseDataSource.databaseName &&
            inputField.table.name === clauseDataSource.tableName && inputField.field.columnName === clauseDataSource.fieldName);
    }

    /**
     * Sets the filters to the given filters.
     *
     * @arg {FilterDesign[]} filterDesigns
     * @arg {AbstractSearchService} searchService
     */
    public setFilters(filterDesigns: FilterDesign[], searchService: AbstractSearchService) {
        let collection: DualListFilterCollection = new DualListFilterCollection();
        filterDesigns.forEach((filterDesign) => {
            let filterDataSource: FilterDataSource = collection.findFilterDataSource(filterDesign);
            let filter: AbstractFilter = FilterUtil.createFilterFromDesign(filterDesign, searchService);
            collection.setFiltersInDualLists(filterDataSource,
                collection.getFiltersFromRequiredList(filterDataSource).concat(!!filter.optional ? [] : filter),
                collection.getFiltersFromOptionalList(filterDataSource).concat(!filter.optional ? [] : filter),
                searchService);
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
    ): Map<FilterDataSource, FilterDesign[]> {
        let updateCollection: SingleListFilterCollection = new SingleListFilterCollection();
        let returnCollection: Map<FilterDataSource, FilterDesign[]> = new Map<FilterDataSource, FilterDesign[]>();

        filterDesignList.forEach((toggleFilterDesign) => {
            // Create the new filters and new relation filters to add (toggle ON).
            let toggleFilter: AbstractFilter = FilterUtil.createFilterFromDesign(toggleFilterDesign, searchService);
            let relationFilterList: AbstractFilter[] = this.createRelationFilterList(toggleFilter, relationDataList, searchService);

            // Save the new filters and new relation filters in an intermediary collection to separate filters by unique data source.
            [toggleFilter].concat(relationFilterList).forEach((relationFilter) => {
                let filterDataSource: FilterDataSource = this.filterCollection.findFilterDataSource(relationFilter.toDesign());
                let filterList: AbstractFilter[] = updateCollection.getFilters(filterDataSource);
                updateCollection.setFilters(filterDataSource, filterList.concat(relationFilter), searchService);
            });
        });

        // Find the IDs of all the old filters and old relation filters to delete (toggle OFF).  Repeat IDs don't matter.
        let deleteIdList: string[] = [];
        updateCollection.getDataSources().forEach((filterDataSource) => {
            let globalFilterList: AbstractFilter[] = this.filterCollection.getFiltersInSingleList(filterDataSource);
            let toggleFilterList: AbstractFilter[] = updateCollection.getFilters(filterDataSource);

            // Identify a filter to delete if an equivalent filter (with the same properties) already exists in the global filter list.
            let deleteFilterList: AbstractFilter[] = globalFilterList.filter((globalFilter) => toggleFilterList.some((toggleFilter) =>
                toggleFilter.isEquivalentToFilter(globalFilter)));
            deleteIdList = deleteFilterList.reduce((idList, filter) => idList.concat(filter.id).concat(filter.relations), deleteIdList);
        });

        // Toggle each filter passed as an argument and all its relation filters.
        // Loop over the data sources of the complete collection to delete the old relation filters in each data source with no toggles.
        this.filterCollection.getDataSources().forEach((filterDataSource) => {
            let globalFilterList: AbstractFilter[] = this.filterCollection.getFiltersInSingleList(filterDataSource);
            let toggleFilterList: AbstractFilter[] = updateCollection.getFilters(filterDataSource);

            // Drop the old filters and the old relation filters to delete (toggle ON) and keep the remaining filters.
            let retainFilterList: AbstractFilter[] = globalFilterList.filter((globalFilter) => deleteIdList.indexOf(globalFilter.id) < 0);

            // Find the new filters and the new relation filters to add (toggle ON).
            let appendFilterList: AbstractFilter[] = toggleFilterList.filter((toggleFilter) => !globalFilterList.some((globalFilter) =>
                globalFilter.isEquivalentToFilter(toggleFilter)));

            let completeFilterList: AbstractFilter[] = retainFilterList.concat(appendFilterList);
            let requiredFilterList: AbstractFilter[] = completeFilterList.filter((filter) => !filter.optional);
            let optionalFilterList: AbstractFilter[] = completeFilterList.filter((filter) => !!filter.optional);

            // Update the global filter collection and use its data source in the return data (in case the objects are different).
            let actualDataSource: FilterDataSource = this.filterCollection.setFiltersInDualLists(filterDataSource, requiredFilterList,
                optionalFilterList, searchService);
            returnCollection.set(actualDataSource, requiredFilterList.concat(optionalFilterList).map((filter) => filter.toDesign()));
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
     * @arg {SingleListFilterCollection} filterCollection
     * @arg {AbstractSearchService} searchService
     */
    public updateCollectionWithGlobalCompatibleFilters(
        compatibleFilterBehaviorList: FilterBehavior[],
        filterCollection: SingleListFilterCollection,
        searchService: AbstractSearchService
    ): void {
        let compatibleCollection: SingleListFilterCollection = new SingleListFilterCollection();

        compatibleFilterBehaviorList.forEach((compatibleFilterBehavior) => {
            // Find the data source for the filter design.
            let filterDataSource: FilterDataSource = filterCollection.findFilterDataSource(compatibleFilterBehavior.filterDesign);

            // Find the global filter list that is compatible with the filter design.
            let filterList: AbstractFilter[] = this.getFiltersWithDesign(compatibleFilterBehavior.filterDesign);

            // Save the filter list and continue the loop.  We need an intermediary collection here because multiple filter designs from
            // compatibleFilterBehaviorList could have the same filterDataSource so saving filters directly into filterCollection would
            // overwrite compatible filter lists from previous filter designs.  Also, don't add the same filter to the list twice!
            let compatibleFilterList: AbstractFilter[] = filterList.reduce((list, filter) =>
                list.concat((list.indexOf(filter) < 0 ? filter : [])), compatibleCollection.getFilters(filterDataSource));
            compatibleCollection.setFilters(filterDataSource, compatibleFilterList, searchService);
        });

        compatibleCollection.getDataSources().forEach((filterDataSource) => {
            let filterList: AbstractFilter[] = compatibleCollection.getFilters(filterDataSource);
            let cachedFilterList: AbstractFilter[] = filterCollection.getFilters(filterDataSource);

            // If the new (compatible global) filter list is not equal to the old (cached) filter list, update the filter collection.
            let equals: boolean = filterList.length === cachedFilterList.length && filterList.every((filter, index) =>
                filter.isEquivalentToFilter(cachedFilterList[index]));

            if (!equals) {
                filterCollection.setFilters(filterDataSource, filterList, searchService);

                // Call the redrawCallback of each compatibleFilterBehaviorList object with an equivalent filterDataSource.
                compatibleFilterBehaviorList.forEach((compatibleFilterBehavior) => {
                    let callbackFilterDataSource: FilterDataSource = filterCollection.findFilterDataSource(
                        compatibleFilterBehavior.filterDesign);

                    if (FilterUtil.areFilterClauseDataSourceListsEquivalent(filterDataSource.list, callbackFilterDataSource.list)) {
                        compatibleFilterBehavior.redrawCallback(filterList);
                    }
                });
            }
        });
    }
}

export interface FilterClauseDataSource {
    datastoreName: string;
    databaseName: string;
    tableName: string;
    fieldName: string;
    operator?: string;
}

export interface FilterDataSource {
    list: FilterClauseDataSource[];
}

abstract class AbstractFilter {
    public id: string;
    public name: string;
    public optional: boolean = false;
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
     * Returns if this filter is compatible with the given filter design.
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

class SimpleFilter extends AbstractFilter {
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
                    relationFilter.optional = this.optional;
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
     * Returns if this filter is compatible with the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @return {boolean}
     */
    public isCompatibleWithDesign(filterDesign: FilterDesign): boolean {
        let simpleFilterDesign = (filterDesign as SimpleFilterDesign);
        return !!simpleFilterDesign.optional === !!this.optional &&
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
        return filter instanceof SimpleFilter && !!filter.optional === !!this.optional && filter.datastore === this.datastore &&
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
            optional: this.optional,
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
        return this.database.prettyName + ' / ' + this.table.prettyName + ' / ' + this.field.prettyName + ' ' + this.operator + ' ' +
            prettyValue;
    }
}

class CompoundFilter extends AbstractFilter {
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

        relationFilter.optional = this.optional;

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
     * Returns if this filter is compatible with the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @return {boolean}
     */
    public isCompatibleWithDesign(filterDesign: FilterDesign): boolean {
        let compoundFilterDesign = (filterDesign as CompoundFilterDesign);
        if (compoundFilterDesign.inflexible) {
            // If the filter design is inflexible, ensure that 1) each nested design is compatible with at least one nested filter object,
            // 2) each nested filter object is compatible with at least one nested filter design, and 3) the lists are the same length.
            // This forces designs to have specific nested filters but allows them to have nested filters in an unexpected order.
            return !!compoundFilterDesign.optional === !!this.optional && compoundFilterDesign.type === this.type &&
                compoundFilterDesign.filters && compoundFilterDesign.filters.length === this.filters.length &&
                compoundFilterDesign.filters.every((nestedDesign) => this.filters.some((nestedFilter) =>
                    nestedFilter.isCompatibleWithDesign(nestedDesign))) && this.filters.every((nestedFilter) =>
                        compoundFilterDesign.filters.some((nestedDesign) => nestedFilter.isCompatibleWithDesign(nestedDesign)));
        }
        // If the filter design is flexible, ensure that each nested filter design is compatible with at least one nested filter object.
        // This allows filters that expect one or more nested filters with the same design.
        return !!compoundFilterDesign.optional === !!this.optional && compoundFilterDesign.type === this.type &&
            compoundFilterDesign.filters && compoundFilterDesign.filters.every((nestedDesign) => this.filters.some((nestedFilter) =>
                nestedFilter.isCompatibleWithDesign(nestedDesign)));
    }

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @arg {AbstractFilter} filter
     * @return {boolean}
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof CompoundFilter && !!filter.optional === !!this.optional && filter.type === this.type &&
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
            optional: this.optional,
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
        // EX:  (fieldA != value1) AND ((fieldB = value2) OR (fieldB = value3))
        return '(' + this.filters.map((filter) => filter.toString()).join(') ' + this.type + ' (') + ')';
    }
}
