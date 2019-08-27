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
import { Dataset, FieldKey } from '../models/dataset';
import { FilterConfig, FilterDataSource } from '../models/filter';
import {
    AbstractFilter,
    CompoundFilter,
    FilterCollection,
    FilterUtil
} from '../util/filter.util';

export type FilterChangeListener = (callerId: string, changeCollection: Map<FilterDataSource[], FilterConfig[]>) => void;

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
     * @arg {Dataset} dataset
     * @return {AbstractFilter[]}
     * @private
     */
    private _createRelationFilterList(filter: AbstractFilter, dataset: Dataset): AbstractFilter[] {
        let filterDataSourceList: FilterDataSource[] = FilterUtil.createFilterDataSourceListFromConfig(filter.toConfig(), true);

        return dataset.relations.reduce((returnList, relationData) => {
            let relationFilterList: AbstractFilter[] = [];

            // Assume that each item within the relationData list is a nested list with the same length.
            // EX:  [[x1, y1], [x2, y2], [x3, y3]]
            if (relationData.length && relationData[0].length === filterDataSourceList.length) {
                let equivalentRelationList: FieldKey[][] = relationData.filter((relationFilterFields) =>
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
                            let relationFilter: AbstractFilter = filter.createRelationFilter(equivalentRelationList[0], relation, dataset);
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
     * Deletes the filter with the given filter config.
     *
     * @arg {string} callerId
     * @arg {FilterConfig} filterConfig
     * @return {Map<FilterDataSource[], FilterConfig[]>}
     */
    public deleteFilter(
        callerId: string,
        filterConfig: FilterConfig
    ): Map<FilterDataSource[], FilterConfig[]> {
        let returnCollection: Map<FilterDataSource[], FilterConfig[]> = new Map<FilterDataSource[], FilterConfig[]>();

        let filterDataSourceListToDelete: FilterDataSource[] = this.filterCollection.findFilterDataSources(filterConfig);

        let deleteIdList: string[] = this.filterCollection.getFilters(filterDataSourceListToDelete).reduce((idList, filter) =>
            (filter.id === filterConfig.id ? idList.concat(filter.id).concat(filter.relations) : idList), []);

        if (deleteIdList.length) {
            // Loop over the data sources of the complete collection to delete the old relation filters in each data source.
            this.filterCollection.getDataSources().forEach((filterDataSource) => {
                let previousFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSource);

                let modifiedFilterList: AbstractFilter[] = previousFilterList.filter((filter) => deleteIdList.indexOf(filter.id) < 0);

                let actualDataSourceList: FilterDataSource[] = this.filterCollection.setFilters(filterDataSource, modifiedFilterList);

                returnCollection.set(actualDataSourceList, modifiedFilterList.map((filter) => filter.toConfig()));
            });

            this._notifier(callerId, returnCollection);
        } else {
            this.filterCollection.getDataSources().forEach((filterDataSource) => {
                returnCollection.set(filterDataSource, this.filterCollection.getFilters(filterDataSource).map((filter) =>
                    filter.toConfig()));
            });
        }

        return returnCollection;
    }

    /**
     * Deletes the given filters from the given data sources (or all the filters if no data sources are given).
     *
     * @arg {string} callerId
     * @arg {FilterConfig[]} [filterConfigListToDelete=[]]
     * @return {Map<FilterDataSource[], FilterConfig[]>}
     */
    public deleteFilters(callerId: string, filterConfigListToDelete: FilterConfig[] = []): Map<FilterDataSource[], FilterConfig[]> {
        // Find all filter collection keys matching the data source, if it is given; or find all filter collection keys otherwise.
        let filterCollectionKeys: FilterDataSource[][] = (filterConfigListToDelete.length ? filterConfigListToDelete.map((filterConfig) =>
            this.filterCollection.findFilterDataSources(filterConfig)) : this.filterCollection.getDataSources());

        let returnCollection: Map<FilterDataSource[], FilterConfig[]> = new Map<FilterDataSource[], FilterConfig[]>();

        let deleteIdList: string[] = filterCollectionKeys.reduce((outerList, filterDataSourceList) =>
            outerList.concat(this.filterCollection.getFilters(filterDataSourceList).reduce((innerList, filter) =>
                innerList.concat(filter.id).concat(filter.relations), [] as string[])), [] as string[]);

        if (deleteIdList.length) {
            // Loop over the data sources of the complete collection to delete the old relation filters in each data source.
            this.filterCollection.getDataSources().forEach((filterDataSourceList) => {
                let previousFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);

                let modifiedFilterList: AbstractFilter[] = previousFilterList.filter((filter) => deleteIdList.indexOf(filter.id) < 0);

                let actualDataSourceList: FilterDataSource[] = this.filterCollection.setFilters(filterDataSourceList, modifiedFilterList);

                returnCollection.set(actualDataSourceList, modifiedFilterList.map((filter) => filter.toConfig()));
            });

            this._notifier(callerId, returnCollection);
        } else {
            this.filterCollection.getDataSources().forEach((filterDataSourceList) => {
                returnCollection.set(filterDataSourceList, this.filterCollection.getFilters(filterDataSourceList)
                    .map((filter) => filter.toConfig()));
            });
        }

        return returnCollection;
    }

    /**
     * Exchanges all the filters in the given data sources with the given filters.  If filterConfigListToDelete is given, also deletes the
     * filters of each data source with the given configs (useful if you want to both delete and exchange with one filter-change event).
     *
     * @arg {string} callerId
     * @arg {FilterConfig[]} filterConfigList
     * @arg {Dataset} dataset
     * @arg {FilterConfig[]} [filterConfigListToDelete=[]]
     * @return {Map<FilterDataSource[], FilterConfig[]>}
     */
    public exchangeFilters(
        callerId: string,
        filterConfigList: FilterConfig[],
        dataset: Dataset,
        filterConfigListToDelete: FilterConfig[] = []
    ): Map<FilterDataSource[], FilterConfig[]> {
        let updateCollection: FilterCollection = new FilterCollection();
        let returnCollection: Map<FilterDataSource[], FilterConfig[]> = new Map<FilterDataSource[], FilterConfig[]>();
        let deleteIdList: string[] = [];

        filterConfigList.forEach((filterConfig) => {
            // Create the new filters and new relation filters to add in the exchange.
            let exchangeFilter: AbstractFilter = FilterUtil.createFilterFromConfig(filterConfig, dataset);
            let relationFilterList: AbstractFilter[] = this._createRelationFilterList(exchangeFilter, dataset);

            // Save the new filters and new relation filters in an intermediary collection to separate filters by unique data source.
            [exchangeFilter].concat(relationFilterList).forEach((relationFilter) => {
                let filterDataSourceList: FilterDataSource[] = this.filterCollection.findFilterDataSources(relationFilter.toConfig());
                let filterList: AbstractFilter[] = updateCollection.getFilters(filterDataSourceList);
                updateCollection.setFilters(filterDataSourceList, filterList.concat(relationFilter));

                // Find the IDs of all the old filters and old relation filters to delete in the exchange.  Repeat IDs don't matter.
                let deleteFilterList: AbstractFilter[] = this.filterCollection.getFilters(filterDataSourceList);
                deleteIdList = deleteFilterList.reduce((idList, filter) => idList.concat(filter.id).concat(filter.relations), deleteIdList);
            });
        });

        // Delete the filters of each data source with the given configs.
        filterConfigListToDelete.forEach((filterConfig) => {
            let filterDataSourceList: FilterDataSource[] = this.filterCollection.findFilterDataSources(filterConfig);

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
            returnCollection.set(actualDataSourceList, modifiedFilterList.map((filter) => filter.toConfig()));
        });

        if (filterConfigList.length || filterConfigListToDelete.length) {
            this._notifier(callerId, returnCollection);
        }

        return returnCollection;
    }

    /**
     * Returns the filter configs for the given data sources, or all filter configs if no data sources are given.
     *
     * @arg {FilterDataSource[]} [filterDataSourceList]
     * @return {FilterConfig[]}
     */
    public getFilters(filterDataSourceList?: FilterDataSource[]): FilterConfig[] {
        return this.getRawFilters(filterDataSourceList).map((filter) => filter.toConfig());
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
     * Returns if the given field is equivalent to the given data source.
     *
     * @arg {FieldKey} inputField
     * @arg {FilterDataSource} filterDataSource
     * @return {boolean}
     * @private
     */
    private _isRelationEquivalent(inputField: FieldKey, filterDataSource: FilterDataSource): boolean {
        return !!(inputField.datastore === filterDataSource.datastore && inputField.database === filterDataSource.database &&
            inputField.table === filterDataSource.table && inputField.field === filterDataSource.field);
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
     * Toggles the given filters (adds input filters that are not in the global list and deletes input filters that are in the global list)
     * in the given data sources.
     *
     * @arg {string} callerId
     * @arg {FilterConfig[]} filterConfigList
     * @arg {Dataset} dataset
     * @return {Map<FilterDataSource, FilterConfig[]>}
     */
    public toggleFilters(
        callerId: string,
        filterConfigList: FilterConfig[],
        dataset: Dataset,
    ): Map<FilterDataSource[], FilterConfig[]> {
        let updateCollection: FilterCollection = new FilterCollection();
        let returnCollection: Map<FilterDataSource[], FilterConfig[]> = new Map<FilterDataSource[], FilterConfig[]>();

        filterConfigList.forEach((toggleFilterConfig) => {
            // Create the new filters and new relation filters to add (toggle ON).
            let toggleFilter: AbstractFilter = FilterUtil.createFilterFromConfig(toggleFilterConfig, dataset);
            let relationFilterList: AbstractFilter[] = this._createRelationFilterList(toggleFilter, dataset);

            // Save the new filters and new relation filters in an intermediary collection to separate filters by unique data source.
            [toggleFilter].concat(relationFilterList).forEach((relationFilter) => {
                let filterDataSourceList: FilterDataSource[] = this.filterCollection.findFilterDataSources(relationFilter.toConfig());
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
            returnCollection.set(actualDataSourceList, modifiedFilterList.map((filter) => filter.toConfig()));
        });

        if (filterConfigList.length) {
            this._notifier(callerId, returnCollection);
        }

        return returnCollection;
    }

    /**
     * Unregisters the given ID of a registered filter-change listener.
     */
    public unregisterFilterChangeListener(id: string): void {
        this._listeners.delete(id);
    }
}

