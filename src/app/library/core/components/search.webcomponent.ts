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

import {
    AbstractFilter,
    BoundsValues,
    CompoundFilterDesign,
    CompoundValues,
    DomainValues,
    FilterUtil,
    FilterValues,
    ListOfValues,
    OneValue,
    PairOfValues
} from '../models/filters';
import { AbstractSearchService, FilterClause, QueryGroup, QueryPayload } from '../services/abstract.search.service';
import { AggregationType, CompoundFilterType, SortOrder, TimeInterval } from '../models/widget-option';
import { CoreUtil } from '../core.util';
import { Dataset, DatasetUtil, FieldKey } from '../models/dataset';
import { FilterService } from '../services/filter.service';
import { NextCenturyElement } from './element.webcomponent';
import { RequestWrapper } from '../services/connection.service';

// We need to import the Neon Framework so we can call the setNeonServerUrl function.
import * as neon from 'neon-framework';

interface AggregationData {
    fieldKey: FieldKey;
    group: string;
    name: string;
    type: AggregationType;
}

interface GroupData {
    fieldKey: FieldKey;
    name: string;
    type: AggregationType;
}

export class NextCenturySearch extends NextCenturyElement {
    static DEFAULT_LIMIT = 10;

    private _dataset: Dataset;
    private _filterService: FilterService;
    private _idsToFilters: Map<string, AbstractFilter[]> = new Map<string, AbstractFilter[]>();
    private _idsToFilterDesigns: Map<string, CompoundFilterDesign[]> = new Map<string, CompoundFilterDesign[]>();
    private _runningQuery: RequestWrapper;
    private _searchService: AbstractSearchService;

    static get observedAttributes(): string[] {
        return [
            'enable-hide-if-unfiltered',
            'enable-ignore-self-filter',
            'id',
            'search-field-keys',
            'search-limit',
            'search-page',
            'server',
            'sort-aggregation',
            'sort-field-key',
            'sort-order',
            'vis-draw-function',
            'vis-element-id'
        ];
    }

    public attributeChangedCallback(name: string, oldValue: any, newValue: any): void {
        super.attributeChangedCallback(name, oldValue, newValue);

        if (!this._isReady()) {
            return;
        }

        switch (name) {
            case 'id':
                this._registerWithFilterService(oldValue, newValue);
                // Falls through
            case 'enable-hide-if-unfiltered':
            case 'enable-ignore-self-filter':
            case 'search-field-keys':
            case 'search-limit':
            case 'search-page':
            case 'sort-aggregation':
            case 'sort-field-key':
            case 'sort-order':
            case 'vis-draw-function':
            case 'vis-element-id':
                this._startQuery();
                break;
            case 'server':
                neon.setNeonServerUrl(newValue);
                break;
        }
    }

    public connectedCallback(): void {
        super.connectedCallback();
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();

        if (this.hasAttribute('id')) {
            this._registerWithFilterService(this.getAttribute('id'), null);
        }
    }

    /**
     * Initializes this search element with the given dataset and services and starts a new search query if possible.
     */
    public init(dataset: Dataset, filterService: FilterService, searchService: AbstractSearchService): void {
        this._dataset = dataset;
        this._filterService = filterService;
        this._searchService = searchService;

        if (this.hasAttribute('id')) {
            this._registerWithFilterService(null, this.getAttribute('id'));
            this._startQuery();
        } else {
            console.error('NextCenturySearch must have an id attribute!');
        }
    }

    /**
     * Updates the unshared filters of this search element with the given filters.
     */
    public updateFilters(id: string, filters: AbstractFilter[]): void {
        this._idsToFilters.set(id, filters);
        this._startQuery();
    }

    /**
     * Updates the filter designs of this search element (used to find shared filters) with the given filter designs.
     */
    public updateFilterDesigns(id: string, filterDesigns: CompoundFilterDesign[]): void {
        this._idsToFilterDesigns.set(id, filterDesigns);
        this._startQuery();
    }

    /**
     * Returns the search query with its fields, aggregations, groups, filters, and sort.
     */
    private _buildQuery(searchFilters: AbstractFilter[]): QueryPayload {
        const fieldKeys: FieldKey[] = this._retrieveFieldKeys().filter((fieldKey) =>
            !!fieldKey && !!fieldKey.field && fieldKey.field !== '*');

        const aggregations: AggregationData[] = this._findSearchAggregations();
        const groups: GroupData[] = this._findSearchGroups();

        const unsharedFilters: AbstractFilter[] = Array.from(this._idsToFilters.values()).reduce((completeFilterList, filterList) =>
            completeFilterList.concat(filterList), []);

        const fields: string[] = fieldKeys.map((fieldKey) => fieldKey.field)
            .concat(aggregations.filter((aggregation) => aggregation.fieldKey).map((aggregation) => aggregation.fieldKey.field))
            .concat(groups.filter((group) => group.fieldKey).map((group) => group.fieldKey.field))
            .concat(unsharedFilters.reduce((list, filter) => list.concat(FilterUtil.retrieveFields(filter)), []));

        const tableKey: FieldKey = this._retrieveTableKey();
        let queryPayload: QueryPayload = this._searchService.buildQueryPayload(tableKey.database, tableKey.table,
            fields.length ? fields : ['*']);

        const clauses: FilterClause[] = fieldKeys.map((fieldKey) => this._searchService.buildFilterClause(fieldKey.field, '!=', null))
            .concat(searchFilters.map((filter) => this._searchService.generateFilterClauseFromFilter(filter)))
            .concat(unsharedFilters.map((filter) => this._searchService.generateFilterClauseFromFilter(filter)));

        if (clauses.length) {
            this._searchService.updateFilter(queryPayload, clauses.length === 1 ? clauses[0] :
                this._searchService.buildCompoundFilterClause(clauses));
        }

        if (aggregations.length) {
            for (const aggregation of aggregations) {
                this._searchService.updateAggregation(queryPayload, aggregation.type, aggregation.name, aggregation.fieldKey ?
                    aggregation.fieldKey.field : aggregation.group);
            }
        }

        if (groups.length) {
            let searchGroups: QueryGroup[] = [];
            for (const group of groups) {
                switch (group.type) {
                    case (TimeInterval.MINUTE as string):
                        searchGroups.push(this._searchService.buildDateQueryGroup(group.fieldKey.field, TimeInterval.MINUTE, group.name));
                        // Falls through
                    case (TimeInterval.HOUR as string):
                        searchGroups.push(this._searchService.buildDateQueryGroup(group.fieldKey.field, TimeInterval.HOUR, group.name));
                        // Falls through
                    case (TimeInterval.DAY_OF_MONTH as string):
                        searchGroups.push(this._searchService.buildDateQueryGroup(group.fieldKey.field, TimeInterval.DAY_OF_MONTH,
                            group.name));
                        // Falls through
                    case (TimeInterval.MONTH as string):
                        searchGroups.push(this._searchService.buildDateQueryGroup(group.fieldKey.field, TimeInterval.MONTH, group.name));
                        // Falls through
                    case (TimeInterval.YEAR as string):
                        searchGroups.push(this._searchService.buildDateQueryGroup(group.fieldKey.field, TimeInterval.YEAR, group.name));
                        break;
                    default:
                        searchGroups.push(this._searchService.buildQueryGroup(group.fieldKey.field));
                }
            }
            this._searchService.updateGroups(queryPayload, searchGroups);
        }

        const sortAggregation = this.getAttribute('sort-aggregation');
        const sortFieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.getAttribute('sort-field-key'));

        if (sortAggregation || sortFieldKey) {
            const sortOrder: SortOrder = (this.getAttribute('sort-order') || SortOrder.DESCENDING) as SortOrder;
            this._searchService.updateSort(queryPayload, sortAggregation || sortFieldKey.field, sortOrder);
        }

        return queryPayload;
    }

    /**
     * Returns the aggregation data from the aggregation elements inside this search element.
     */
    private _findSearchAggregations(): AggregationData[] {
        let aggregations: AggregationData[] = [];
        for (const aggregationElement of this.getElementsByTagName('next-century-aggregation') as any) {
            const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(aggregationElement.getAttribute('field-key'));
            const group = aggregationElement.getAttribute('group');
            const name = aggregationElement.getAttribute('name');
            if ((fieldKey || group) && name) {
                aggregations.push({
                    fieldKey,
                    group: aggregationElement.getAttribute('group'),
                    name: aggregationElement.getAttribute('name'),
                    type: (aggregationElement.getAttribute('type') || AggregationType.COUNT) as AggregationType
                });
            }
        }
        return aggregations;
    }

    /**
     * Returns the group data from the group elements inside this search element.
     */
    private _findSearchGroups(): GroupData[] {
        let groups: GroupData[] = [];
        for (const groupElement of this.getElementsByTagName('next-century-group') as any) {
            const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(groupElement.getAttribute('field-key'));
            if (fieldKey) {
                groups.push({
                    fieldKey,
                    name: groupElement.getAttribute('name'),
                    type: groupElement.getAttribute('type')
                });
            }
        }
        return groups;
    }

    /**
     * Handles the behavior whenever any filters in the whole application are changed by starting a new search query if needed.
     */
    private _handleFilterChange(callerId: string): void {
        if (!this._isReady()) {
            return;
        }

        // Don't run the search query if the event was sent with this element's ID and if filter-self is false.
        if (callerId === this.getAttribute('id') && this.hasAttribute('enable-ignore-self-filter')) {
            return;
        }

        this._startQuery();
    }

    /**
     * Transforms the given search query results, draws them in the visualization element, and emits an event.
     */
    private _handleQuerySuccess(queryResults: { data: any[] }): void {
        const aggregations: AggregationData[] = this._findSearchAggregations();
        const filterValuesList: FilterValues[] = this._retrieveSharedFilters().reduce((list, filter) =>
            list.concat(filter.retrieveValues()), []);

        const data = queryResults.data.map((result) => {
            let item = {
                aggregations: aggregations.reduce((collection, aggregation) => {
                    collection[aggregation.name] = result[aggregation.name];
                    return collection;
                }, {}),
                fields: Object.keys(result).reduce((collection, key) => {
                    if (aggregations.every((aggregation) => aggregation.name !== key)) {
                        collection[key] = result[key];
                    }
                    return collection;
                }, {}),
                filtered: this._isFiltered(result, filterValuesList)
            };
            return item;
        });

        const visElement = document.getElementById(this.getAttribute('vis-element-id')) as any;
        const drawFunction = this.getAttribute('vis-draw-function');
        if (visElement && drawFunction) {
            visElement[drawFunction](data);
        }

        this.dispatchEvent(new CustomEvent('dataReceived', {
            bubbles: true,
            detail: {
                data
            }
        }));
    }

    /**
     * Returns if the given result is filtered in the given list of filter values.
     */
    private _isFiltered(result: any, filterValuesList: FilterValues[]): boolean {
        for (const filterValues of filterValuesList) {
            if (filterValues instanceof OneValue && this._isFilteredByOneValue(result, filterValues)) {
                return true;
            }
            if (filterValues instanceof ListOfValues && this._isFilteredByListOfValues(result, filterValues)) {
                return true;
            }
            if (filterValues instanceof BoundsValues && this._isFilteredByBoundsValues(result, filterValues)) {
                return true;
            }
            if (filterValues instanceof DomainValues && this._isFilteredByDomainValues(result, filterValues)) {
                return true;
            }
            if (filterValues instanceof PairOfValues && this._isFilteredByPairOfValues(result, filterValues)) {
                return true;
            }
            if (filterValues instanceof CompoundValues && this._isFilteredByCompoundValues(result, filterValues)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns if the given result is filtered in the given bounds values.
     */
    private _isFilteredByBoundsValues(result: any, boundsValues: BoundsValues): boolean {
        const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(boundsValues.field1);
        const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(boundsValues.field2);
        if (fieldKey1 && fieldKey2) {
            const value1 = CoreUtil.deepFind(result, fieldKey1.field);
            const value2 = CoreUtil.deepFind(result, fieldKey2.field);
            if (typeof value1 !== 'undefined' && typeof value2 !== 'undefined' &&
                this._isFilteredWithOperator(value1, '>=', boundsValues.begin1) &&
                this._isFilteredWithOperator(value1, '<=', boundsValues.end1) &&
                this._isFilteredWithOperator(value2, '>=', boundsValues.begin2) &&
                this._isFilteredWithOperator(value2, '<=', boundsValues.end2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns if the given result is filtered in the given compound values.
     */
    private _isFilteredByCompoundValues(result: any, compoundValues: CompoundValues): boolean {
        const isFilteredList: boolean[] = compoundValues.nested.map((nested) => this._isFiltered(result, [nested]));
        if (isFilteredList.length) {
            if (compoundValues.type === CompoundFilterType.AND && isFilteredList.every((isFiltered) => isFiltered)) {
                return true;
            }
            if (compoundValues.type === CompoundFilterType.OR && isFilteredList.some((isFiltered) => isFiltered)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns if the given result is filtered in the given domain values.
     */
    private _isFilteredByDomainValues(result: any, domainValues: DomainValues): boolean {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(domainValues.field);
        if (fieldKey) {
            const value = CoreUtil.deepFind(result, fieldKey.field);
            if (typeof value !== 'undefined' && this._isFilteredWithOperator(value, '>=', domainValues.begin) &&
                this._isFilteredWithOperator(value, '<=', domainValues.end)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns if the given result is filtered in the given list of values.
     */
    private _isFilteredByListOfValues(result: any, listOfValues: ListOfValues): boolean {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(listOfValues.field);
        if (fieldKey) {
            const value = CoreUtil.deepFind(result, fieldKey.field);
            if (typeof value !== 'undefined') {
                const isFilteredList: boolean[] = listOfValues.values.map((otherValue) =>
                    this._isFilteredWithOperator(value, listOfValues.operator, otherValue));
                if (listOfValues.type === CompoundFilterType.AND && isFilteredList.every((isFiltered) => isFiltered)) {
                    return true;
                }
                if (listOfValues.type === CompoundFilterType.OR && isFilteredList.some((isFiltered) => isFiltered)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Returns if the given result is filtered in the given value.
     */
    private _isFilteredByOneValue(result: any, oneValue: OneValue): boolean {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(oneValue.field);
        if (fieldKey) {
            const value = CoreUtil.deepFind(result, fieldKey.field);
            if (typeof value !== 'undefined' && this._isFilteredWithOperator(value, oneValue.operator, oneValue.value)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns if the given result is filtered in the given pair of values.
     */
    private _isFilteredByPairOfValues(result: any, pairOfValues: PairOfValues): boolean {
        const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(pairOfValues.field1);
        const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(pairOfValues.field2);
        if (fieldKey1 && fieldKey2) {
            const value1 = CoreUtil.deepFind(result, fieldKey1.field);
            const value2 = CoreUtil.deepFind(result, fieldKey2.field);
            if (typeof value1 !== 'undefined' && typeof value2 !== 'undefined') {
                const isFiltered1 = this._isFilteredWithOperator(value1, pairOfValues.operator1, pairOfValues.value1);
                const isFiltered2 = this._isFilteredWithOperator(value2, pairOfValues.operator2, pairOfValues.value2);
                if (pairOfValues.type === CompoundFilterType.AND && (isFiltered1 && isFiltered2)) {
                    return true;
                }
                if (pairOfValues.type === CompoundFilterType.OR && (isFiltered1 || isFiltered2)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Returns if the given values work with the given operator.
     */
    private _isFilteredWithOperator(value1: any, operator: string, value2: any): boolean {
        if (operator === '=') {
            return value1 === value2;
        }
        if (operator === '!=') {
            return value1 !== value2;
        }
        if (operator === 'contains') {
            return ('' + value1).indexOf('' + value2) >= 0;
        }
        if (operator === 'not contains') {
            return ('' + value1).indexOf('' + value2) < 0;
        }
        if (operator === '>=') {
            return value1 >= value2;
        }
        if (operator === '<=') {
            return value1 <= value2;
        }
        if (operator === '>') {
            return value1 > value2;
        }
        if (operator === '<') {
            return value1 < value2;
        }
        return false;
    }

    /**
     * Returns if the required properties have been initialized to run a search.
     */
    private _isReady(): boolean {
        return !!(this._filterService && this._searchService && this.hasAttribute('search-field-keys') && this.hasAttribute('id'));
    }

    /**
     * Unregisters the given old ID and registers the given new ID with the FilterService.
     */
    private _registerWithFilterService(oldId, newId): void {
        if (!this._filterService) {
            return;
        }
        if (oldId) {
            this._filterService.unregisterFilterChangeListener(oldId);
        }
        if (newId) {
            this._filterService.registerFilterChangeListener(newId, this._handleFilterChange.bind(this));
        }
    }

    /**
     * Returns all the search field keys.
     */
    private _retrieveFieldKeys(): FieldKey[] {
        const fieldKeyStrings: string[] = (this.getAttribute('search-field-keys') || '').split(',');
        return fieldKeyStrings.map((fieldKeyString) => DatasetUtil.deconstructTableOrFieldKey(fieldKeyString));
    }

    /**
     * Returns the all the filters in the datastore/database/table of the search-field-keys (except the filters matching
     * the _idsToFilterDesigns, unless filter-self is true).
     */
    private _retrieveSearchFilters(): AbstractFilter[] {
        if (!this._isReady()) {
            return [];
        }

        const sharedFilters: AbstractFilter[] = this.hasAttribute('enable-ignore-self-filter') ? this._retrieveSharedFilters() : [];

        const tableKey: FieldKey = this._retrieveTableKey();

        return !tableKey ? [] : this._filterService.getFiltersToSearch(tableKey.datastore, tableKey.database, tableKey.table,
            sharedFilters.map((filter) => filter.toConfig()));
    }

    /**
     * Returns the filters matching the _idsToFilterDesigns.
     */
    private _retrieveSharedFilters(): AbstractFilter[] {
        if (!this._isReady()) {
            return [];
        }

        const filterDesigns: CompoundFilterDesign[] = Array.from(this._idsToFilterDesigns.values())
            .reduce((completeFilterDesignList, filterDesignList) => completeFilterDesignList.concat(filterDesignList), []);

        return this._filterService.retrieveCompatibleFilterCollection(filterDesigns).getFilters();
    }

    /**
     * Returns the single search table key.
     *
     * TODO Don't assume that each fieldKey contains the same datastore, database, and table.
     */
    private _retrieveTableKey(): FieldKey {
        const fieldKeys: FieldKey[] = this._retrieveFieldKeys();
        return fieldKeys.length ? fieldKeys[0] : null;
    }

    /**
     * Runs the given search query using the current attributes, dataset, and services.
     */
    private _runQuery(queryPayload: QueryPayload, isFiltered: boolean): void {
        if (!this._isReady()) {
            return;
        }

        if (this._runningQuery) {
            this._runningQuery.abort();
        }

        const tableKey: FieldKey = this._retrieveTableKey();
        // Returns a list of [DatastoreConfig, DatabaseConfig, TableConfig, FieldConfig]
        const configData = tableKey ? this._dataset.retrieveConfigDataFromFieldKey(tableKey) : [null, null, null, null];
        const dataHost = configData[0] ? configData[0].host : null;
        const dataType = configData[0] ? configData[0].type : null;
        const labels = configData[2] ? configData[2].labelOptions : {};
        const hideIfUnfiltered = !!this.getAttribute('enable-hide-if-unfiltered');

        // Don't run a search query if it is not possible, or if enable-hide-if-unfiltered is true and the search query is not filtered.
        if (dataHost && dataType && !this._searchService.canRunSearch(dataType, dataHost) || (hideIfUnfiltered && !isFiltered)) {
            this._handleQuerySuccess({ data: [] });
            return;
        }

        this._searchService.transformFilterClauseValues(queryPayload, labels);

        this._runningQuery = this._searchService.runSearch(dataType, dataHost, queryPayload);

        this._runningQuery.always(() => {
            this._runningQuery = undefined;
        });

        this._runningQuery.done((response) => {
            this._handleQuerySuccess(this._searchService.transformQueryResultsValues(response, labels));
            this._runningQuery = undefined;
        });

        this._runningQuery.fail((response) => {
            if (response.statusText !== 'abort') {
                this.dispatchEvent(new CustomEvent('error', {
                    bubbles: true,
                    detail: {
                        error: response && !!response.responseJSON ? response.responseJSON.stackTrace : response.responseText,
                        message: 'FAILED ' + this.getAttribute('id')
                    }
                }));
            }
        });
    }

    /**
     * Starts a new search query using the current attributes and filters in the FilterService.
     */
    private _startQuery(): void {
        if (!this._isReady()) {
            return;
        }

        const filters: AbstractFilter[] = this._retrieveSearchFilters();
        let queryPayload: QueryPayload = this._buildQuery(filters);
        if (queryPayload) {
            const limit = Number(this.getAttribute('search-limit') || NextCenturySearch.DEFAULT_LIMIT);
            const page = Number(this.getAttribute('search-page') || 1);
            this._searchService.updateLimit(queryPayload, limit);
            this._searchService.updateOffset(queryPayload, (page - 1) * limit);
            this._runQuery(queryPayload, !!filters.length);
        }
    }
}

window.customElements.define('next-century-search', NextCenturySearch);

