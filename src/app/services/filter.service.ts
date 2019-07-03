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
import { AbstractSearchService, CompoundFilterType, FilterClause } from './abstract.search.service';
import { FilterConfig } from '../models/types';
import { SingleField } from '../models/dataset';
import {
    AbstractFilter,
    CompoundFilter,
    FilterBehavior,
    FilterCollection,
    FilterDataSource,
    FilterDesign,
    FilterUtil
} from '../util/filter.util';

import { DashboardState } from '../models/dashboard-state';

export type FilterChangeListener = (callerId: string, changeCollection: Map<FilterDataSource[], FilterDesign[]>) => void;

export class FilterService {
    protected filterCollection: FilterCollection = new FilterCollection();

    private _listeners: Map<string, FilterChangeListener> = new Map<string, FilterChangeListener>();

    private _notifier: FilterChangeListener;

    constructor() {
        this._notifier = this.notifyFilterChangeListeners.bind(this);
    }

    /**
     * Creates and returns the relation filter list for the given filter (but not including the given filter).  Also sets the relations
     * (list of IDs) on the given filter and all its relation filters.
     *
     * @arg {AbstractFilter} filter
     * @arg {SingleField[][][]} relationDataList
     * @return {AbstractFilter[]}
     * @private
     */
    private _createRelationFilterList(filter: AbstractFilter, relationDataList: SingleField[][][]): AbstractFilter[] {
        let filterDataSourceList: FilterDataSource[] = FilterUtil.createFilterDataSourceListFromDesign(filter, true);

        return relationDataList.reduce((returnList, relationData) => {
            let relationFilterList: AbstractFilter[] = [];

            // Assume that each item within the relationData list is a nested list with the same length.
            // EX:  [[x1, y1], [x2, y2], [x3, y3]]
            if (relationData.length && relationData[0].length === filterDataSourceList.length) {
                let equivalentRelationList: SingleField[][] = relationData.filter((relationFilterFields) =>
                    // Each item within the relationFilterFields must be equivalent to a FilterDataSource.
                    relationFilterFields.every((relatedField) => filterDataSourceList.some((filterDataSource) =>
                        this._isRelationEquivalent(relatedField, filterDataSource))) &&
                    // Each FilterDataSource must be equivalent to an item within the relationFilterFields.
                    filterDataSourceList.every((filterDataSource) => relationFilterFields.some((relatedField) =>
                        this._isRelationEquivalent(relatedField, filterDataSource))));

                // The length of equivalentRelationList should be either 0 or 1.
                if (equivalentRelationList.length) {
                    // Create new relation filters.
                    relationData.forEach((relation) => {
                        // Do not create a relation that is the same as the original filter.
                        if (relation !== equivalentRelationList[0]) {
                            let relationFilter: AbstractFilter = filter.createRelationFilter(equivalentRelationList[0], relation);
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

            this._notifier(callerId, returnCollection);
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
     * @arg {FilterDesign[]} [filterDesignListToDelete=[]]
     * @return {Map<FilterDataSource[], FilterDesign[]>}
     */
    public deleteFilters(callerId: string, filterDesignListToDelete: FilterDesign[] = []): Map<FilterDataSource[], FilterDesign[]> {
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

            this._notifier(callerId, returnCollection);
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
     * filters of each data source with the given designs (useful if you want to both delete and exchange with one filter-change event).
     *
     * @arg {string} callerId
     * @arg {FilterDesign[]} filterDesignList
     * @arg {SingleField[][][]} relationDataList
     * @arg {FilterDesign[]} [filterDesignListToDelete=[]]
     * @return {Map<FilterDataSource[], FilterDesign[]>}
     */
    public exchangeFilters(
        callerId: string,
        filterDesignList: FilterDesign[],
        relationDataList: SingleField[][][],
        filterDesignListToDelete: FilterDesign[] = []
    ): Map<FilterDataSource[], FilterDesign[]> {
        let updateCollection: FilterCollection = new FilterCollection();
        let returnCollection: Map<FilterDataSource[], FilterDesign[]> = new Map<FilterDataSource[], FilterDesign[]>();
        let deleteIdList: string[] = [];

        filterDesignList.forEach((filterDesign) => {
            // Create the new filters and new relation filters to add in the exchange.
            let exchangeFilter: AbstractFilter = FilterUtil.createFilterFromDesign(filterDesign);
            let relationFilterList: AbstractFilter[] = this._createRelationFilterList(exchangeFilter, relationDataList);

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
            this._notifier(callerId, returnCollection);
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
     */
    public getFiltersToSaveInConfig(): FilterConfig[] {
        return this.getFilters().map((filter) => FilterUtil.createFilterJsonObjectFromDesign(filter)).filter((filter) => !!filter);
    }

    /**
     * Returns the filters as string for use in URL
     */
    public getFiltersToSaveInURL(): string {
        return FilterUtil.toSimpleFilterQueryString(this.getFilters());
    }

    /**
     * Returns all the filters to search on the given datastore/database/table (ignoring filters from the given data sources).
     *
     * @arg {string} datastoreName
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {AbstractSearchService} searchService
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
            let filterAND: AbstractFilter = filterListToAND.length ? new CompoundFilter(CompoundFilterType.AND, filterListToAND) : null;
            let filterOR: AbstractFilter = filterListToOR.length ? new CompoundFilter(CompoundFilterType.OR, filterListToOR) : null;
            return returnList.concat(filterAND || []).concat(filterOR || []);
        }, [] as AbstractFilter[]).map((filter) => searchService.generateFilterClauseFromFilter(filter));
    }

    /**
     * Returns all the filters compatible with the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @return {[AbstractFilter[], AbstractFilter[]]}
     * @private
     */
    private _getFiltersWithDesign(filterDesign: FilterDesign): AbstractFilter[] {
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
    private _isRelationEquivalent(inputField: SingleField, filterDataSource: FilterDataSource): boolean {
        return !!(inputField.datastore === filterDataSource.datastoreName && inputField.database.name === filterDataSource.databaseName &&
            inputField.table.name === filterDataSource.tableName && inputField.field.columnName === filterDataSource.fieldName);
    }

    /**
     * Notifies all the filter-change listeners using the given caller ID and change collection.
     */
    public notifyFilterChangeListeners(callerId: string, changeCollection: Map<FilterDataSource[], FilterDesign[]>): void {
        for (const listener of Array.from(this._listeners.values())) {
            listener(callerId, changeCollection);
        }
    }

    /**
     * Overrides the notifier of filter-change listeners with the given callback function.
     */
    public overrideFilterChangeNotifier(notifier: FilterChangeListener): void {
        if (notifier) {
            this._notifier = notifier;
        }
    }

    /**
     * Registers the given ID with the given filter-change listener callback function.
     */
    public registerFilterChangeListener(id: string, listener: FilterChangeListener): void {
        this._listeners.set(id, listener);
    }

    /**
     * Sets the filters in the FilterService to the given filter JSON objects from a config file.
     */
    public setFiltersFromConfig(filtersFromConfig: FilterConfig[], dashboardState: DashboardState) {
        let collection: FilterCollection = new FilterCollection();
        for (const filterFromConfig of filtersFromConfig) {
            const filterDesign: FilterDesign = FilterUtil.createFilterDesignFromJsonObject(filterFromConfig, dashboardState);
            if (filterDesign) {
                const filterDataSourceList = collection.findFilterDataSources(filterDesign);
                const filter = FilterUtil.createFilterFromDesign(filterDesign);
                collection.setFilters(filterDataSourceList, collection.getFilters(filterDataSourceList).concat(filter));
            }
        }
        this.filterCollection = collection;
    }

    /**
     * Toggles the given filters (adds input filters that are not in the global list and deletes input filters that are in the global list)
     * in the given data sources.
     *
     * @arg {string} callerId
     * @arg {FilterDesign[]} filterDesignList
     * @arg {SingleField[][][]} relationDataList
     * @return {Map<FilterDataSource, FilterDesign[]>}
     */
    public toggleFilters(
        callerId: string,
        filterDesignList: FilterDesign[],
        relationDataList: SingleField[][][]
    ): Map<FilterDataSource[], FilterDesign[]> {
        let updateCollection: FilterCollection = new FilterCollection();
        let returnCollection: Map<FilterDataSource[], FilterDesign[]> = new Map<FilterDataSource[], FilterDesign[]>();

        filterDesignList.forEach((toggleFilterDesign) => {
            // Create the new filters and new relation filters to add (toggle ON).
            let toggleFilter: AbstractFilter = FilterUtil.createFilterFromDesign(toggleFilterDesign);
            let relationFilterList: AbstractFilter[] = this._createRelationFilterList(toggleFilter, relationDataList);

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
            this._notifier(callerId, returnCollection);
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

        for (const filter of compatibleFilterBehaviorList) {
            // Find the data source for the filter design.
            let filterDataSourceList: FilterDataSource[] = filterCollection.findFilterDataSources(filter.filterDesign);

            // Find the global filter list that is compatible with the filter design.
            let filterList: AbstractFilter[] = this._getFiltersWithDesign(filter.filterDesign);

            // Save the filter list and continue the loop.  We need an intermediary collection here because multiple filter designs from
            // compatibleFilterBehaviorList could have the same filterDataSourceList so saving filters directly into filterCollection would
            // overwrite compatible filter lists from previous filter designs.  Also, don't add the same filter to the list twice!
            let compatibleFilterList: AbstractFilter[] = filterList.reduce((list, subFilter) =>
                list.concat((list.indexOf(subFilter) < 0 ? subFilter : [])), compatibleCollection.getFilters(filterDataSourceList));
            compatibleCollection.setFilters(filterDataSourceList, compatibleFilterList);
        }

        for (const datasourceList of compatibleCollection.getDataSources()) {
            let filterList: AbstractFilter[] = compatibleCollection.getFilters(datasourceList);
            let cachedFilterList: AbstractFilter[] = filterCollection.getFilters(datasourceList);

            // If the new (compatible global) filter list is not equal to the old (cached) filter list, update the filter collection.
            let equals: boolean = filterList.length === cachedFilterList.length && filterList.every((filterItem, index) =>
                filterItem.isEquivalentToFilter(cachedFilterList[index]));

            if (!equals) {
                filterCollection.setFilters(datasourceList, filterList);

                // Call the redrawCallback of each compatibleFilterBehaviorList object with an equivalent filterDataSourceList.
                for (const behavior of compatibleFilterBehaviorList) {
                    let callbackFilterDataSourceList: FilterDataSource[] = filterCollection.findFilterDataSources(
                        behavior.filterDesign
                    );

                    if (FilterUtil.areFilterDataSourceListsEquivalent(datasourceList, callbackFilterDataSourceList)) {
                        behavior.redrawCallback(filterList);
                    }
                }
            }
        }
    }

    /**
     * Unregisters the given ID of a registered filter-change listener.
     */
    public unregisterFilterChangeListener(id: string): void {
        this._listeners.delete(id);
    }
}

