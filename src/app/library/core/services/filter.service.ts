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
import { CompoundFilterType } from '../models/widget-option';
import { Dataset } from '../models/dataset';
import {
    AbstractFilter,
    CompoundFilter,
    FilterCollection,
    FilterConfig,
    FilterDataSource,
    FilterUtil
} from '../models/filters';

export type FilterChangeListener = (callerId: string, changeCollection: Map<FilterDataSource[], FilterConfig[]>) => void;

export class FilterService {
    protected filterCollection: FilterCollection = new FilterCollection();

    private _listeners: Map<string, FilterChangeListener> = new Map<string, FilterChangeListener>();

    private _notifier: FilterChangeListener;
    private _cachedFilters: Map<string, Map<FilterDataSource[], AbstractFilter[]>> =
    new Map<string, Map<FilterDataSource[], AbstractFilter[]>>();

    constructor() {
        this._notifier = this.notifyFilterChangeListeners.bind(this);
    }

    /**
     * Creates new filters and their relation filters using the given filter configs and adds them to the global filter collection.
     */
    public createFilters(callerId: string, filterConfigs: FilterConfig[], dataset: Dataset): Map<FilterDataSource[], FilterConfig[]> {
        let returnData: Map<FilterDataSource[], FilterConfig[]> = new Map<FilterDataSource[], FilterConfig[]>();

        let intermediaryCollection: FilterCollection = this._createFiltersAndRelations(filterConfigs, dataset);

        // Loop over the data sources of the complete filter collection to delete the old relation filters in each data source.
        this.filterCollection.getDataSources().forEach((filterDataSourceList) => {
            let previousFilters: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);
            let newFilters: AbstractFilter[] = intermediaryCollection.getFilters(filterDataSourceList);
            let modifiedFilters: AbstractFilter[] = previousFilters.concat(newFilters);
            this.filterCollection.setFilters(filterDataSourceList, modifiedFilters);

            // Add all the filters, both old and new, to the return variable.
            returnData.set(filterDataSourceList, modifiedFilters.map((filter) => filter.toConfig()));
        });

        if (filterConfigs.length) {
            this._notifier(callerId, returnData);
        }

        return returnData;
    }

    /**
     * Deletes the filter from the global filter collection matching the given filter config and all its relation filters.
     */
    public deleteFilter(
        callerId: string,
        filterConfigToDelete: FilterConfig,
        savePreviousFilters: boolean = false
    ): Map<FilterDataSource[], FilterConfig[]> {
        let filterDataSourceList: FilterDataSource[] = this.filterCollection.findFilterDataSources(filterConfigToDelete);
        let filterIdsToDelete: string[] = filterConfigToDelete.id ? this._findFilterIdsAndRelationIdsWithId(filterDataSourceList,
            filterConfigToDelete) : this._findFilterIdsAndRelationIds(filterDataSourceList);
        return this._deleteFilterIds(callerId, filterIdsToDelete, savePreviousFilters);
    }

    /**
     * Deletes the filters from the global filter collection matching the given filter configs and all their relation filters (or all the
     * filters if no filter configs are given).
     */
    public deleteFilters(
        callerId: string,
        filterConfigsToDelete: FilterConfig[] = [],
        savePreviousFilters: boolean = false
    ): Map<FilterDataSource[], FilterConfig[]> {
        let filterIdsToDelete = filterConfigsToDelete.length ? this._findFilterIdsAndRelationIdsInConfigs(filterConfigsToDelete) :
            this._findFilterIdsAndRelationIdsInDataSources(this.filterCollection.getDataSources());
        return this._deleteFilterIds(callerId, filterIdsToDelete, savePreviousFilters);
    }

    /**
     * Exchanges all the filters in the global filter collection with data sources matching the given filter configs for new filters
     * created from the given filter configs. If filterConfigsToDelete is given, also deletes all the filters in the global filter
     * collection with data sources matching the filterConfigsToDelete (useful if you want to both delete and exchange with one event).
     */
    public exchangeFilters(
        callerId: string,
        filterConfigs: FilterConfig[],
        dataset: Dataset,
        filterConfigsToDelete: FilterConfig[] = [],
        keepSameFilters: boolean = false,
        applyPreviousFilter: boolean = false
    ): Map<FilterDataSource[], FilterConfig[]> {
        let returnData: Map<FilterDataSource[], FilterConfig[]> = new Map<FilterDataSource[], FilterConfig[]>();

        let intermediaryCollection: FilterCollection = this._createFiltersAndRelations(filterConfigs, dataset);

        // Find the IDs of all the filters and their relation filters to delete in the exchange.
        let filterIdsToDelete: string[] = this._findFilterIdsAndRelationIdsInDataSources(intermediaryCollection.getDataSources());

        if (filterConfigsToDelete.length) {
            // Append the IDs of all the additional filters and their relations filters to delete.  Repeat IDs don't matter.
            filterIdsToDelete = filterIdsToDelete.concat(this._findFilterIdsAndRelationIdsInConfigs(filterConfigsToDelete));
        }

        // Loop over the data sources of the complete filter collection to delete the old relation filters in each data source.
        this.filterCollection.getDataSources().forEach((filterDataSourceList) => {
            let previousFilters: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);
            let modifiedFilters: AbstractFilter[] = intermediaryCollection.getFilters(filterDataSourceList);

            // If this data source does not have exchanges, remove any old relation filters but keep the rest of the filters.
            if (!modifiedFilters.length) {
                modifiedFilters = previousFilters.filter((filter) => filterIdsToDelete.indexOf(filter.id) < 0);
            } else {
                // If each filter in the new ("modified") list is the same as each filter in the old ("previous") list, just remove them.
                if (!keepSameFilters && modifiedFilters.length === previousFilters.length &&
                    modifiedFilters.every((modifiedFilter, index) => modifiedFilter.isEquivalentToFilter(previousFilters[index]))) {
                    modifiedFilters = [];
                }

                if (applyPreviousFilter) {
                    modifiedFilters = this._saveOrRetrievePreviousFilters(callerId, filterDataSourceList, previousFilters, modifiedFilters);
                }
            }

            this.filterCollection.setFilters(filterDataSourceList, modifiedFilters);

            // Add all the filters that were not deleted to the return variable.
            returnData.set(filterDataSourceList, modifiedFilters.map((filter) => filter.toConfig()));
        });

        if (filterConfigs.length || filterConfigsToDelete.length) {
            this._notifier(callerId, returnData);
        }

        return returnData;
    }

    /**
     * Returns the filters for the given data sources, or all the filters if no data sources are given.
     */
    public getFilters(filterDataSourceList?: FilterDataSource[]): AbstractFilter[] {
        if (filterDataSourceList) {
            return this.filterCollection.getFilters(filterDataSourceList);
        }
        return this.filterCollection.getFilters();
    }

    /**
     * Returns all the filters to search on the given datastore/database/table (ignoring filters from the given data sources).
     *
     * @arg {string} datastoreName
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {FilterConfig[]} [filterConfigListToIgnore=[]]
     * @return {AbstractFilter[]}
     */
    public getFiltersToSearch(
        datastoreName: string,
        databaseName: string,
        tableName: string,
        filterConfigListToIgnore: FilterConfig[] = []
    ): AbstractFilter[] {
        return this.filterCollection.getDataSources().reduce((returnList, filterDataSourceList) => {
            let ignore = filterConfigListToIgnore.some((filterConfigToIgnore) => {
                let filterDataSourceListToIgnore: FilterDataSource[] = this.filterCollection.findFilterDataSources(filterConfigToIgnore);
                return FilterUtil.areFilterDataSourceListsEquivalent(filterDataSourceList, filterDataSourceListToIgnore);
            });
            if (ignore) {
                return returnList;
            }
            let filterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList).filter((filter) =>
                filter.doesAffectSearch(datastoreName, databaseName, tableName));
            // Assign a dummy ID because we won't need it here.
            let filter: AbstractFilter = filterList.length ? new CompoundFilter(CompoundFilterType.OR, filterList, '_') : null;
            return returnList.concat(filter || []);
        }, [] as AbstractFilter[]);
    }

    /**
     * Notifies all the filter-change listeners using the given caller ID and change collection.
     */
    public notifyFilterChangeListeners(callerId: string, changeCollection: Map<FilterDataSource[], FilterConfig[]>): void {
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
     * Returns the filters from the global filter collection that are compatible (matching) the given filter configs.
     */
    public retrieveCompatibleFilterCollection(filterConfigList: FilterConfig[]): FilterCollection {
        let compatibleCollection: FilterCollection = new FilterCollection();

        for (const filterConfig of filterConfigList) {
            // Find the data source for the filter config.
            let filterDataSourceList: FilterDataSource[] = compatibleCollection.findFilterDataSources(filterConfig);

            // Find the global filter list that is compatible with the filter config.
            let filterList: AbstractFilter[] = this.filterCollection.getFilters(this.filterCollection.findFilterDataSources(filterConfig));

            // Add the new filters to the existing list from the collection, but don't add the same filter twice.
            let compatibleFilterList: AbstractFilter[] = filterList.reduce((list, nextFilter) =>
                list.concat((list.indexOf(nextFilter) < 0 ? nextFilter : [])), compatibleCollection.getFilters(filterDataSourceList));

            compatibleCollection.setFilters(filterDataSourceList, compatibleFilterList);
        }

        return compatibleCollection;
    }

    /**
     * Sets the filters in the FilterService to the given filters.
     */
    public setFilters(filters: AbstractFilter[]) {
        let collection: FilterCollection = new FilterCollection();
        for (const filter of filters) {
            const filterDataSourceList = collection.findFilterDataSources(filter.toConfig());
            collection.setFilters(filterDataSourceList, collection.getFilters(filterDataSourceList).concat(filter));
        }
        this.filterCollection = collection;
    }

    /**
     * Unregisters the given ID of a registered filter-change listener.
     */
    public unregisterFilterChangeListener(id: string): void {
        this._listeners.delete(id);
    }

    private _createFiltersAndRelations(filterConfigs: FilterConfig[], dataset: Dataset): FilterCollection {
        let intermediaryCollection: FilterCollection = new FilterCollection();

        filterConfigs.forEach((filterConfig) => {
            // Create the new filters and new relation filters.
            let newFilter: AbstractFilter = FilterUtil.createFilterFromConfig(filterConfig, dataset);
            let newRelationFilters: AbstractFilter[] = newFilter.createRelationFilterList(dataset);

            // Save the new filters and new relation filters in a filter collection to separate the filters by unique data source.
            [newFilter].concat(newRelationFilters).forEach((filter) => {
                let filterDataSourceList: FilterDataSource[] = this.filterCollection.findFilterDataSources(filter.toConfig());
                let filters: AbstractFilter[] = intermediaryCollection.getFilters(filterDataSourceList);
                intermediaryCollection.setFilters(filterDataSourceList, filters.concat(filter));
            });
        });

        return intermediaryCollection;
    }

    private _deleteFilterIds(
        callerId: string,
        filterIdsToDelete: string[],
        savePreviousFilters: boolean
    ): Map<FilterDataSource[], FilterConfig[]> {
        let returnData: Map<FilterDataSource[], FilterConfig[]> = new Map<FilterDataSource[], FilterConfig[]>();

        // Loop over the data sources of the complete filter collection to delete the old relation filters in each data source.
        this.filterCollection.getDataSources().forEach((filterDataSourceList) => {
            let previousFilters: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);
            let modifiedFilters: AbstractFilter[] = previousFilters.filter((filter) => filterIdsToDelete.indexOf(filter.id) < 0);

            if (savePreviousFilters) {
                modifiedFilters = this._saveOrRetrievePreviousFilters(callerId, filterDataSourceList, previousFilters, modifiedFilters);
            }

            this.filterCollection.setFilters(filterDataSourceList, modifiedFilters);

            // Add all the filters that were not deleted to the return variable.
            returnData.set(filterDataSourceList, modifiedFilters.map((filter) => filter.toConfig()));
        });

        if (filterIdsToDelete.length) {
            this._notifier(callerId, returnData);
        }

        return returnData;
    }

    /**
     * Returns all the filter IDs and the relation filter IDs in the global filter collection with the given data source.
     */
    private _findFilterIdsAndRelationIds(filterDataSourceList: FilterDataSource[]): string[] {
        return this._findFilterIdsAndRelationIdsInFilters(this.filterCollection.getFilters(filterDataSourceList));
    }

    /**
     * Returns all the filter IDs and the relation filter IDs in the global filter collection with the data sources matching one of the
     * given filter configs.
     */
    private _findFilterIdsAndRelationIdsInConfigs(filterConfigs: FilterConfig[]): string[] {
        return this._findFilterIdsAndRelationIdsInDataSources(filterConfigs.map((filterConfig) =>
            this.filterCollection.findFilterDataSources(filterConfig)));
    }

    /**
     * Returns all the filter IDs and the relation filter IDs in the global filter collection with one of the given data sources.
     */
    private _findFilterIdsAndRelationIdsInDataSources(filterCollectionDataSources: FilterDataSource[][]): string[] {
        return filterCollectionDataSources.reduce((idList, filterDataSourceList) =>
            idList.concat(this._findFilterIdsAndRelationIds(filterDataSourceList)), [] as string[]);
    }

    /**
     * Returns all the filter IDs and the relation filter IDs in the given filters.
     */
    private _findFilterIdsAndRelationIdsInFilters(filters: AbstractFilter[]): string[] {
        return filters.reduce((idList, filter) => idList.concat(filter.id).concat(filter.relations), [] as string[]);
    }

    /**
     * Returns the filter ID from the given data source in the global filter collection matching the ID in the given filter config and all
     * its relation filter IDs.
     */
    private _findFilterIdsAndRelationIdsWithId(filterDataSourceList: FilterDataSource[], filterConfig: FilterConfig): string[] {
        return this._findFilterIdsAndRelationIdsInFilters(this.filterCollection.getFilters(filterDataSourceList)
            .filter((filter) => filter.id === filterConfig.id));
    }

    private _saveOrRetrievePreviousFilters(
        callerId: string,
        filterDataSourceList: FilterDataSource[],
        previousFilters: AbstractFilter[],
        modifiedFilters: AbstractFilter[]
    ): AbstractFilter[] {
        if (!this._cachedFilters.get(callerId)) {
            this._cachedFilters.set(callerId, new Map<FilterDataSource[], AbstractFilter[]>());
        }

        // If modifiedFilters is empty, add any cached filters with an equivalent data-source-list to modifiedFilters.
        if (!modifiedFilters.length) {
            let cachedFilters: AbstractFilter[] = [];
            let callerCachedFilters: Map<FilterDataSource[], AbstractFilter[]> = this._cachedFilters.get(callerId);
            callerCachedFilters.forEach((cachedFilter, cachedDataSourceList) => {
                if (FilterUtil.areFilterDataSourceListsEquivalent(cachedDataSourceList, filterDataSourceList)) {
                    cachedFilters = [...cachedFilters, ...cachedFilter];
                    // Remove the cached filters once they have been un-cached here.
                    callerCachedFilters.set(cachedDataSourceList, []);
                }
            });
            this._cachedFilters.set(callerId, callerCachedFilters);
            return cachedFilters;
        }

        this._cachedFilters.get(callerId).set(filterDataSourceList, previousFilters);
        return modifiedFilters;
    }
}

