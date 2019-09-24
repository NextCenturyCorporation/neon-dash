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

import { CompoundFilterType } from './widget-option';
import { Dataset, DatasetFieldKey, DatasetUtil, FieldKey } from './dataset';
import { DateFormat, DateUtil } from '../date.util';
import * as _ from 'lodash';

export interface FilterDataSource {
    datastore: string;
    database: string;
    table: string;
    field: string;
    operator?: string;
}

export interface SimpleFilterConfig {
    id?: string;
    relations?: string[];
    datastore: string;
    database: string;
    table: string;
    field: string;
    operator: string;
    value?: any;
}

export interface CompoundFilterConfig {
    id?: string;
    relations?: string[];
    type: CompoundFilterType;
    filters: (SimpleFilterConfig | CompoundFilterConfig)[];
}

export type FilterConfig = SimpleFilterConfig | CompoundFilterConfig;

export abstract class FilterValues { }

export class BoundsValues extends FilterValues {
    constructor(
        public begin1: boolean|number|string,
        public begin2: boolean|number|string,
        public field1: string,
        public field2: string,
        public end1: boolean|number|string,
        public end2: boolean|number|string
    ) {
        super();
    }
}

export class CompoundValues extends FilterValues {
    constructor(public type: CompoundFilterType, public nested: FilterValues[]) {
        super();
    }
}

export class DomainValues extends FilterValues {
    constructor(public begin: boolean|number|string|Date, public field: string, public end: boolean|number|string|Date) {
        super();
    }
}

export class ListOfValues extends FilterValues {
    constructor(
        public type: CompoundFilterType,
        public field: string,
        public operator: string,
        public values: (boolean|number|string)[]
    ) {
        super();
    }
}

export class PairOfValues extends FilterValues {
    constructor(
        public type: CompoundFilterType,
        public field1: string,
        public field2: string,
        public operator1: string,
        public operator2: string,
        public value1: boolean|number|string,
        public value2: boolean|number|string
    ) {
        super();
    }
}

export class FilterUtil {
    /**
     * Returns if the given FilterDataSource objects are equivalent.
     *
     * @arg {FilterDataSource} item1
     * @arg {FilterDataSource} item2
     * @arg {boolean} [ignoreOperator=false]
     * @return {boolean}
     */
    static areFilterDataSourcesEquivalent(
        item1: FilterDataSource,
        item2: FilterDataSource,
        ignoreOperator: boolean = false
    ): boolean {
        return !!(item1.datastore === item2.datastore && item1.database === item2.database && item1.table === item2.table &&
            item1.field === item2.field && (ignoreOperator ? true : item1.operator === item2.operator));
    }

    /**
     * Returns if the given FilterDataSource lists are equivalent.
     *
     * @arg {FilterDataSource[]} list1
     * @arg {FilterDataSource[]} list2
     * @return {boolean}
     */
    static areFilterDataSourceListsEquivalent(list1: FilterDataSource[], list2: FilterDataSource[]): boolean {
        return list1.length === list2.length &&
            // Each FilterDataSource in list1 must be equivalent to a FilterDataSource in list2.
            list1.every((item1) => list2.some((item2) => this.areFilterDataSourcesEquivalent(item1, item2))) &&
            // Each FilterDataSource in list2 must be equivalent to a FilterDataSource in list1.
            list2.every((item2) => list2.some((item1) => this.areFilterDataSourcesEquivalent(item1, item2)));
    }

    /**
     * Creates and returns the FilterDataSource list for the given filter config.
     *
     * @arg {FilterConfig} filterConfig
     * @arg {boolean} [ignoreOperator=false]
     * @return {FilterDataSource[]}
     */
    static createFilterDataSourceListFromConfig(
        filterConfig: FilterConfig,
        ignoreOperator: boolean = false
    ): FilterDataSource[] {
        if (this.isSimpleFilterConfig(filterConfig)) {
            return [{
                datastore: filterConfig.datastore,
                database: filterConfig.database,
                table: filterConfig.table,
                field: filterConfig.field,
                operator: ignoreOperator ? undefined : filterConfig.operator
            }] as FilterDataSource[];
        }

        if (this.isCompoundFilterConfig(filterConfig)) {
            let returnList: FilterDataSource[] = [];

            filterConfig.filters.forEach((nestedConfig) => {
                let nestedDataSourceList: FilterDataSource[] = this.createFilterDataSourceListFromConfig(nestedConfig, ignoreOperator);

                nestedDataSourceList.forEach((nestedDataSource) => {
                    let exists = returnList.some((existingDataSource) => this.areFilterDataSourcesEquivalent(nestedDataSource,
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
     * Creates and returns a new filter object using the given filter config.
     *
     * @arg {FilterConfig} filterConfig
     * @return {AbstractFilter}
     */
    static createFilterFromConfig(filterConfig: FilterConfig): AbstractFilter {
        if (this.isSimpleFilterConfig(filterConfig) && typeof filterConfig.value !== 'undefined') {
            return new ListFilter(CompoundFilterType.OR, filterConfig.datastore + '.' + filterConfig.database + '.' + filterConfig.table +
                '.' + filterConfig.field, filterConfig.operator, [filterConfig.value], filterConfig.id, filterConfig.relations);
        } else if (this.isCompoundFilterConfig(filterConfig)) {
            if (filterConfig instanceof BoundsFilterDesign) {
                return new BoundsFilter(filterConfig.fieldKey1, filterConfig.fieldKey2, filterConfig.begin1, filterConfig.begin2,
                    filterConfig.end1, filterConfig.end2, filterConfig.id, filterConfig.relations);
            }

            if (filterConfig instanceof DomainFilterDesign) {
                return new DomainFilter(filterConfig.fieldKey, filterConfig.begin, filterConfig.end, filterConfig.id,
                    filterConfig.relations);
            }

            if (filterConfig instanceof ListFilterDesign) {
                return new ListFilter(filterConfig.type, filterConfig.fieldKey, filterConfig.operator, filterConfig.values,
                    filterConfig.id, filterConfig.relations);
            }

            if (filterConfig instanceof PairFilterDesign) {
                return new PairFilter(filterConfig.type, filterConfig.fieldKey1, filterConfig.fieldKey2, filterConfig.operator1,
                    filterConfig.operator2, filterConfig.value1, filterConfig.value2, filterConfig.id, filterConfig.relations);
            }

            return new CompoundFilter(filterConfig.type, filterConfig.filters.map((nestedConfig) =>
                this.createFilterFromConfig(nestedConfig)), filterConfig.id, filterConfig.relations);
        }

        return null;
    }

    /**
     * Creates and returns a new filter object using the given data list.
     */
    static createFilterFromDataList(dataList: any[]): AbstractFilter {
        const functions = [
            ListFilter.fromDataList.bind(ListFilter),
            BoundsFilter.fromDataList.bind(BoundsFilter),
            DomainFilter.fromDataList.bind(DomainFilter),
            PairFilter.fromDataList.bind(PairFilter),
            CompoundFilter.fromDataList.bind(CompoundFilter)
        ];
        for (const func of functions) {
            const filter = func(dataList);
            if (filter) {
                return filter;
            }
        }
        return null;
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     */
    static createLabelForField(fieldKeyString: string, dataset: Dataset, abridged: boolean = false): string {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
        const datasetFieldKey: DatasetFieldKey = dataset.retrieveDatasetFieldKey(fieldKey);
        return abridged ? datasetFieldKey.field.prettyName : (datasetFieldKey.database.prettyName + ' / ' +
            datasetFieldKey.table.prettyName + ' / ' + datasetFieldKey.field.prettyName);
    }

    static createLabelForTwoFields(one: string, two: string, type: CompoundFilterType): string {
        let oneNestedFields: string[] = one.split('.');
        let twoNestedFields: string[] = two.split('.');
        if (oneNestedFields.length === twoNestedFields.length && oneNestedFields.length > 1) {
            let oneFieldsPrefix = one.substring(0, one.lastIndexOf('.'));
            if (oneFieldsPrefix === two.substring(0, two.lastIndexOf('.'))) {
                return oneFieldsPrefix;
            }
        }
        return one + ' ' + type + ' ' + two;
    }

    /**
     * Returns the label for the filter's operator.
     */
    static createLabelForOperator(operator: string): string {
        return operator === '=' ? '' : operator;
    }

    /**
     * Returns the label for the filter's value(s).
     */
    static createLabelForValue(fieldKeyString: string, value: any, dataset: Dataset): string {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
        const datasetFieldKey: DatasetFieldKey = dataset.retrieveDatasetFieldKey(fieldKey);
        if (datasetFieldKey.field.type === 'date' || value instanceof Date) {
            // TODO THOR-1259 Let user switch from UTC to local time
            // TODO THOR-1329 If hour or minutes are not zero, add hour and minutes and seconds to output string format.
            return DateUtil.fromDateToString(value, DateFormat.SHORT);
        }
        if (typeof value === 'number') {
            return '' + (value % 1 === 0 ? value : parseFloat('' + value).toFixed(3));
        }
        return value === '' ? '<empty>' : value;
    }

    // https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types
    /**
     * Returns if the given filter config is a CompoundFilterConfig.
     *
     * @arg {FilterConfig} filterConfig
     * @return {filterConfig is CompoundFilterConfig}
     */
    static isCompoundFilterConfig(filterConfig: FilterConfig): filterConfig is CompoundFilterConfig {
        return 'filters' in filterConfig && 'type' in filterConfig;
    }

    // https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types
    /**
     * Returns if the given filter config is a SimpleFilterConfig.
     *
     * @arg {FilterConfig} filterConfig
     * @return {filterConfig is SimpleFilterConfig}
     */
    static isSimpleFilterConfig(filterConfig: FilterConfig): filterConfig is SimpleFilterConfig {
        return 'datastore' in filterConfig && 'database' in filterConfig && 'table' in filterConfig && 'field' in filterConfig &&
            'operator' in filterConfig;
    }
}

export class FilterCollection {
    protected data: Map<FilterDataSource[], AbstractFilter[]> = new Map<FilterDataSource[], AbstractFilter[]>();

    /**
     * Returns the data source for the given filter config as either an existing matching data source within this collection or a new data
     * source (the new data source is also saved in this collection with an empty array).
     *
     * @arg {FilterConfig} filterConfig
     * @return {FilterDataSource[]}
     */
    public findFilterDataSources(filterConfig: FilterConfig): FilterDataSource[] {
        let filterDataSourceList: FilterDataSource[] = FilterUtil.createFilterDataSourceListFromConfig(filterConfig);

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
     * Returns the list of filters in this filter collection that are compatible with the given filter config.
     */
    public getCompatibleFilters(filterConfig: FilterConfig): AbstractFilter[] {
        let filterDataSourceList: FilterDataSource[] = this.findFilterDataSources(filterConfig);
        let filterList: AbstractFilter[] = this.getFilters(filterDataSourceList);
        return filterList.filter((filter) => filter.isCompatibleWithConfig(filterConfig));
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
     * @arg {FilterDataSource[]} [filterDataSourceList]
     * @return {AbstractFilter[]}
     */
    public getFilters(filterDataSourceList?: FilterDataSource[]): AbstractFilter[] {
        if (!filterDataSourceList) {
            return this.getDataSources().reduce((filterList, dataSourceList) => filterList.concat(this.getFilters(dataSourceList)),
                [] as AbstractFilter[]);
        }

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

let filterIdCollection: Map<string, boolean> = new Map<string, boolean>();
let nextFilterId = 1;

export abstract class AbstractFilter {
    constructor(public id?: string, public relations: string[] = []) {
        if (!this.id) {
            do {
                this.id = 'id' + (nextFilterId++);
            } while (filterIdCollection.get(this.id));
        }
        filterIdCollection.set(this.id, true);
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @abstract
     */
    public abstract createRelationFilter(equivalentFieldKeyList: FieldKey[], substituteFieldKeyList: FieldKey[]): AbstractFilter;

    /**
     * Creates and returns the relation filter list for the filter.
     */
    public createRelationFilterList(dataset: Dataset): AbstractFilter[] {
        let filterDataSourceList: FilterDataSource[] = FilterUtil.createFilterDataSourceListFromConfig(this.toConfig(), true);

        return dataset.getRelations().reduce((returnList, relation) => {
            let relationFilterList: AbstractFilter[] = [];

            // Assume that each item within the relation list is a nested list with the same length.
            // EX:  [[x1, y1], [x2, y2], [x3, y3]]
            if (relation.length && relation[0].length === filterDataSourceList.length) {
                let equivalentRelationList: FieldKey[][] = relation.filter((relationFieldKeyList) =>
                    // Each item within the relationFieldKeyList must be equivalent to a FilterDataSource.
                    relationFieldKeyList.every((relationFieldKey) => filterDataSourceList.some((filterDataSource) =>
                        this._isRelationEquivalent(relationFieldKey, filterDataSource))) &&
                    // Each FilterDataSource must be equivalent to an item within the relationFieldKeyList.
                    filterDataSourceList.every((filterDataSource) => relationFieldKeyList.some((relationFieldKey) =>
                        this._isRelationEquivalent(relationFieldKey, filterDataSource))));

                // The length of equivalentRelationList should be either 0 or 1.
                if (equivalentRelationList.length) {
                    // Create new relation filters.
                    relation.forEach((relationFieldKeyList) => {
                        // Do not create a relation that is the same as the original filter.
                        if (relationFieldKeyList !== equivalentRelationList[0]) {
                            let relationFilter: AbstractFilter = this.createRelationFilter(equivalentRelationList[0],
                                relationFieldKeyList);
                            relationFilterList.push(relationFilter);
                        }
                    });

                    // Save sibling relation filter IDs in the new relation filters.
                    relationFilterList.concat(this).forEach((outerFilter) => {
                        relationFilterList.concat(this).forEach((innerFilter) => {
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
     * Returns if this filter affects a search in the given datastore/database/table.
     */
    public abstract doesAffectSearch(datastore: string, database: string, table: string): boolean;

    /**
     * Returns the label for the filter.
     */
    public getLabel(dataset: Dataset): string {
        return this.getLabelForField(dataset) + this.getLabelForValue(dataset);
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     *
     * @abstract
     */
    public abstract getLabelForField(dataset: Dataset, abridged?: boolean): string;

    /**
     * Returns the label for the filter's value(s).
     *
     * @abstract
     */
    public abstract getLabelForValue(dataset: Dataset, abridged?: boolean): string;

    /**
     * Returns if this filter is compatible with the given filter config.  Compatible filters must have the same FilterDataSource list.
     *
     * @arg {FilterConfig} filterConfig
     * @return {boolean}
     * @abstract
     */
    public abstract isCompatibleWithConfig(filterConfig: FilterConfig): boolean;

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @arg {AbstractFilter} filter
     * @return {boolean}
     * @abstract
     */
    public abstract isEquivalentToFilter(filter: AbstractFilter): boolean;

    /**
     * Returns if the given field is equivalent to the given data source.
     *
     * @arg {FieldKey} fieldKey
     * @arg {FilterDataSource} filterDataSource
     * @return {boolean}
     * @private
     */
    private _isRelationEquivalent(fieldKey: FieldKey, filterDataSource: FilterDataSource): boolean {
        return !!(fieldKey.datastore === filterDataSource.datastore && fieldKey.database === filterDataSource.database &&
            fieldKey.table === filterDataSource.table && fieldKey.field === filterDataSource.field);
    }

    /**
     * Returns the filtered values for the filter object.
     */
    public abstract retrieveValues(): FilterValues;

    /**
     * Returns the filter config for the filter object.
     *
     * @return {FilterConfig}
     * @abstract
     */
    public abstract toConfig(): FilterConfig;

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     */
    public abstract toDataList(): any[];
}

export class CompoundFilter extends AbstractFilter {
    /**
     * Creates and returns a compound filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[]): CompoundFilter {
        if (dataList.length && (dataList[0] === 'and' || dataList[0] === 'or')) {
            const [type, id, relations, ...filters] = dataList;
            return new CompoundFilter(type, filters.map((filter) => FilterUtil.createFilterFromDataList(filter)), id, relations);
        }
        return null;
    }

    constructor(
        public type: CompoundFilterType,
        public filters: AbstractFilter[],
        id?: string,
        relations?: string[]
    ) {
        super(id, relations);
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     */
    public createRelationFilter(equivalentFieldKeyList: FieldKey[], substituteFieldKeyList: FieldKey[]): AbstractFilter {
        if (equivalentFieldKeyList.length !== substituteFieldKeyList.length) {
            return null;
        }

        let nestedRelationExists = false;

        let relationFilter: CompoundFilter = new CompoundFilter(this.type, this.filters.map((filter) => {
            let nestedRelationFilter: AbstractFilter = filter.createRelationFilter(equivalentFieldKeyList, substituteFieldKeyList);
            nestedRelationExists = nestedRelationExists || !!nestedRelationFilter;
            // A compound filter can exchange one of its nested filters with a relation and keep the rest of the original nested filters.
            return nestedRelationFilter || filter;
        }));

        // Return null unless at least one nested relation filter exists.
        return nestedRelationExists ? relationFilter : null;
    }

    /**
     * Returns if this filter affects a search in the given datastore/database/table.
     *
     * @override
     */
    public doesAffectSearch(datastore: string, database: string, table: string): boolean {
        return this.filters.some((nested) => nested.doesAffectSearch(datastore, database, table));
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     *
     * @override
     */
    public getLabelForField(__dataset: Dataset, __abridged: boolean = false): string {
        return '';
    }

    /**
     * Returns the label for the filter's value(s).
     *
     * @override
     */
    public getLabelForValue(dataset: Dataset, abridged: boolean = false): string {
        // TODO THOR-1333 Improve label for custom compound filter

        // Group the filters by unique field.
        const filtersByField: Record<string, AbstractFilter[]> = this.filters.reduce((collection, filter) => {
            let field = filter.getLabelForField(dataset, abridged);
            collection[field] = collection[field] || [];
            collection[field].push(filter);
            return collection;
        }, {}) as Record<string, AbstractFilter[]>;

        return '(' + Object.keys(filtersByField).reduce((list, field) => {
            let labels: string[] = filtersByField[field].map((filter) => filter.getLabelForValue(dataset, abridged));
            // Do not show parentheses around only one operator.
            return list.concat(field + ' ' + (labels.length > 1 ? ('(' + labels.join(' ' + this.type + ' ') + ')') : labels[0]));
        }, []).join(') ' + this.type + ' (') + ')';
    }

    /**
     * Returns if this filter is compatible with the given filter config.  Compatible filters must have the same FilterDataSource list.
     *
     * @override
     */
    public isCompatibleWithConfig(filterConfig: FilterConfig): boolean {
        // TODO THOR-1396 Simplify this
        let compoundFilterConfig = (filterConfig as CompoundFilterConfig);

        let filterDataSourceList: FilterDataSource[] = FilterUtil.createFilterDataSourceListFromConfig(compoundFilterConfig);

        if (filterDataSourceList.length > 1) {
            // If the filter config contains more than one FilterDataSource, ensure that 1) each nested config is compatible with at least
            // one nested filter object, 2) each nested filter object is compatible with at least one nested filter config, and 3) both
            // lists are the same length.  This forces configs to have specific nested filters but allows them to have nested filters in an
            // unexpected order.  This is useful with visualizations that filter on a specific range, point, or box.
            return compoundFilterConfig.type === this.type &&
                compoundFilterConfig.filters &&
                compoundFilterConfig.filters.length === this.filters.length &&
                compoundFilterConfig.filters.every((nestedConfig) =>
                    this.filters.some((nestedFilter) =>
                        nestedFilter.isCompatibleWithConfig(nestedConfig))) &&
                this.filters.every((nestedFilter) =>
                    compoundFilterConfig.filters.some((nestedConfig) =>
                        nestedFilter.isCompatibleWithConfig(nestedConfig)));
        }

        // If the filter config contains only one FilterDataSource, ensure that each nested filter config is compatible with at least one
        // nested filter object.  This allows filters that expect one or more nested filters with the same config.  This is useful with
        // visualizations that can set a variable number of EQUALS or NOT EQUALS filters on one field.
        return compoundFilterConfig.type === this.type &&
            compoundFilterConfig.filters &&
            compoundFilterConfig.filters.every((nestedConfig) =>
                this.filters.some((nestedFilter) =>
                    nestedFilter.isCompatibleWithConfig(nestedConfig)));
    }

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @override
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof CompoundFilter && filter.type === this.type &&
            filter.filters.length === this.filters.length &&
            filter.filters.every((nestedFilter, index) => nestedFilter && nestedFilter.isEquivalentToFilter(this.filters[index]));
    }

    /**
     * Returns the filtered values for the filter object.
     *
     * @override
     */
    public retrieveValues(): FilterValues {
        return new CompoundValues(this.type, this.filters.reduce((list, filter) => list.concat(filter.retrieveValues()), []));
    }

    /**
     * Returns the filter config for the filter object.
     *
     * @override
     */
    public toConfig(): FilterConfig {
        return new CompoundFilterDesign(this.type, this.filters.map((filter) => filter.toConfig()), this.id, this.relations);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     *
     * @override
     */
    public toDataList(): any[] {
        return ([this.type, this.id, this.relations] as any[]).concat(this.filters.map((filter) => filter.toDataList()));
    }
}

export class BoundsFilter extends AbstractFilter {
    /**
     * Creates and returns a bounds filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[]): BoundsFilter {
        if (dataList.length === 9 && dataList[0] === 'bounds') {
            const id = dataList[1];
            const relations = dataList[2];
            const fieldKeyString1 = dataList[3];
            const begin1 = dataList[4];
            const end1 = dataList[5];
            const fieldKeyString2 = dataList[6];
            const begin2 = dataList[7];
            const end2 = dataList[8];

            const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString1);
            const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString2);
            if (fieldKey1 && fieldKey1.field && fieldKey2 && fieldKey2.field) {
                return new BoundsFilter(fieldKeyString1, fieldKeyString2, begin1, begin2, end1, end2, id, relations);
            }
        }
        return null;
    }

    constructor(
        public fieldKey1: string,
        public fieldKey2: string,
        public begin1: any,
        public begin2: any,
        public end1: any,
        public end2: any,
        id?: string,
        relations?: string[]
    ) {
        super(id, relations);
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @override
     */
    public createRelationFilter(equivalentFieldKeyList: FieldKey[], substituteFieldKeyList: FieldKey[]): AbstractFilter {
        if (equivalentFieldKeyList.length !== 2 || substituteFieldKeyList.length !== 2) {
            return null;
        }

        if (substituteFieldKeyList[0].database && substituteFieldKeyList[0].table && substituteFieldKeyList[0].field &&
            substituteFieldKeyList[1].database && substituteFieldKeyList[1].table && substituteFieldKeyList[1].field) {
            const internalFieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey1);
            const internalFieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey2);

            if (DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[0], internalFieldKey1) &&
                DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[1], internalFieldKey2)) {
                return new BoundsFilter(DatasetUtil.fieldKeyToString(substituteFieldKeyList[0]), DatasetUtil.fieldKeyToString(
                    substituteFieldKeyList[1]
                ), this.begin1, this.begin2, this.end1, this.end2);
            }

            if (DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[1], internalFieldKey1) &&
                DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[0], internalFieldKey2)) {
                return new BoundsFilter(DatasetUtil.fieldKeyToString(substituteFieldKeyList[1]), DatasetUtil.fieldKeyToString(
                    substituteFieldKeyList[0]
                ), this.begin1, this.begin2, this.end1, this.end2);
            }
        }

        return null;
    }

    /**
     * Returns if this filter affects a search in the given datastore/database/table.
     *
     * @override
     */
    public doesAffectSearch(datastore: string, database: string, table: string): boolean {
        const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey1);
        const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey2);
        return (fieldKey1.datastore === datastore && fieldKey1.database === database && fieldKey1.table === table) ||
            (fieldKey2.datastore === datastore && fieldKey2.database === database && fieldKey2.table === table);
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     *
     * @override
     */
    public getLabelForField(dataset: Dataset, abridged: boolean = false): string {
        return FilterUtil.createLabelForTwoFields(FilterUtil.createLabelForField(this.fieldKey1, dataset, abridged),
            FilterUtil.createLabelForField(this.fieldKey2, dataset, abridged), CompoundFilterType.AND);
    }

    /**
     * Returns the label for the filter's value(s).
     *
     * @override
     */
    public getLabelForValue(dataset: Dataset, __abridged: boolean = false): string {
        return 'from (' + FilterUtil.createLabelForValue(this.fieldKey1, this.begin1, dataset) + ', ' +
            FilterUtil.createLabelForValue(this.fieldKey2, this.begin2, dataset) + ') to (' +
            FilterUtil.createLabelForValue(this.fieldKey1, this.end1, dataset) + ', ' +
            FilterUtil.createLabelForValue(this.fieldKey2, this.end2, dataset) + ')';
    }

    /**
     * Returns if this filter is compatible with the given filter config.  Compatible filters must have the same FilterDataSource list.
     *
     * @override
     */
    public isCompatibleWithConfig(filterConfig: FilterConfig): boolean {
        return filterConfig instanceof BoundsFilterDesign && filterConfig.fieldKey1 === this.fieldKey1 &&
            filterConfig.fieldKey2 === this.fieldKey2 &&
            (typeof filterConfig.begin1 !== 'undefined' ? filterConfig.begin1 === this.begin1 : true) &&
            (typeof filterConfig.begin2 !== 'undefined' ? filterConfig.begin2 === this.begin2 : true) &&
            (typeof filterConfig.end1 !== 'undefined' ? filterConfig.end1 === this.end1 : true) &&
            (typeof filterConfig.end2 !== 'undefined' ? filterConfig.end2 === this.end2 : true);
    }

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @override
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof BoundsFilter && filter.fieldKey1 === this.fieldKey1 && filter.fieldKey2 === this.fieldKey2 &&
            filter.begin1 === this.begin1 && filter.begin2 === this.begin2 && filter.end1 === this.end1 && filter.end2 === this.end2;
    }

    /**
     * Returns the filtered values for the filter object.
     *
     * @override
     */
    public retrieveValues(): BoundsValues {
        return new BoundsValues(this.begin1, this.begin2, this.fieldKey1, this.fieldKey2, this.end1, this.end2);
    }

    /**
     * Returns the filter config for the filter object.
     *
     * @override
     */
    public toConfig(): FilterConfig {
        return new BoundsFilterDesign(this.fieldKey1, this.fieldKey2, this.begin1, this.begin2, this.end1, this.end2, this.id,
            this.relations);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     *
     * @override
     */
    public toDataList(): any[] {
        return ['bounds', this.id, this.relations, this.fieldKey1, this.begin1, this.end1, this.fieldKey2, this.begin2, this.end2];
    }
}

export class DomainFilter extends AbstractFilter {
    /**
     * Creates and returns a list filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[]): DomainFilter {
        if (dataList.length === 6 && dataList[0] === 'domain') {
            const id = dataList[1];
            const relations = dataList[2];
            const fieldKeyString = dataList[3];
            const begin = dataList[4];
            const end = dataList[5];

            const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
            if (fieldKey && fieldKey.field) {
                return new DomainFilter(fieldKeyString, begin, end, id, relations);
            }
        }
        return null;
    }

    constructor(
        public fieldKey: string,
        public begin: any,
        public end: any,
        id?: string,
        relations?: string[]
    ) {
        super(id, relations);
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @override
     */
    public createRelationFilter(equivalentFieldKeyList: FieldKey[], substituteFieldKeyList: FieldKey[]): AbstractFilter {
        if (equivalentFieldKeyList.length !== 1 || substituteFieldKeyList.length !== 1) {
            return null;
        }

        if (substituteFieldKeyList[0].database && substituteFieldKeyList[0].table && substituteFieldKeyList[0].field) {
            const internalFieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey);
            if (DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[0], internalFieldKey)) {
                return new DomainFilter(DatasetUtil.fieldKeyToString(substituteFieldKeyList[0]), this.begin, this.end);
            }
        }

        return null;
    }

    /**
     * Returns if this filter affects a search in the given datastore/database/table.
     *
     * @override
     */
    public doesAffectSearch(datastore: string, database: string, table: string): boolean {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey);
        return (fieldKey.datastore === datastore && fieldKey.database === database && fieldKey.table === table);
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     *
     * @override
     */
    public getLabelForField(dataset: Dataset, abridged: boolean = false): string {
        return FilterUtil.createLabelForField(this.fieldKey, dataset, abridged);
    }

    /**
     * Returns the label for the filter's value(s).
     *
     * @override
     */
    public getLabelForValue(dataset: Dataset, __abridged: boolean = false): string {
        return 'between ' + FilterUtil.createLabelForValue(this.fieldKey, this.begin, dataset) + ' and ' +
            FilterUtil.createLabelForValue(this.fieldKey, this.end, dataset);
    }

    /**
     * Returns if this filter is compatible with the given filter config.  Compatible filters must have the same FilterDataSource list.
     *
     * @override
     */
    public isCompatibleWithConfig(filterConfig: FilterConfig): boolean {
        return filterConfig instanceof DomainFilterDesign && filterConfig.fieldKey === this.fieldKey &&
            (typeof filterConfig.begin !== 'undefined' ? filterConfig.begin === this.begin : true) &&
            (typeof filterConfig.end !== 'undefined' ? filterConfig.end === this.end : true);
    }

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @override
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof DomainFilter && filter.fieldKey === this.fieldKey && filter.begin === this.begin &&
            filter.end === this.end;
    }

    /**
     * Returns the filtered values for the filter object.
     *
     * @override
     */
    public retrieveValues(): DomainValues {
        return new DomainValues(this.begin, this.fieldKey, this.end);
    }

    /**
     * Returns the filter config for the filter object.
     *
     * @override
     */
    public toConfig(): FilterConfig {
        return new DomainFilterDesign(this.fieldKey, this.begin, this.end, this.id, this.relations);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     *
     * @override
     */
    public toDataList(): any[] {
        return ['domain', this.id, this.relations, this.fieldKey, this.begin, this.end];
    }
}

export class ListFilter extends AbstractFilter {
    /**
     * Creates and returns a list filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[]): ListFilter {
        if (dataList.length >= 7 && dataList[0] === 'list') {
            const id = dataList[1];
            const relations = dataList[2];
            const type = dataList[3];
            const fieldKeyString = dataList[4];
            const operator = dataList[5];
            const values = dataList.slice(6);

            const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
            if (fieldKey && fieldKey.field) {
                return new ListFilter(type, fieldKeyString, operator, values, id, relations);
            }
        }
        // Backwards compatibility (simple filters)
        if (dataList.length === 5 && !(dataList[0] === 'and' || dataList[0] === 'or')) {
            const id = dataList[0];
            const relations = dataList[1];
            const fieldKeyString = dataList[2];
            const operator = dataList[3];
            const value = dataList[4];

            const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
            if (fieldKey && fieldKey.field) {
                return new ListFilter(CompoundFilterType.OR, fieldKeyString, operator, [value], id, relations);
            }
        }
        return null;
    }

    constructor(
        public type: CompoundFilterType,
        public fieldKey: string,
        public operator: string,
        public values: any[],
        id?: string,
        relations?: string[]
    ) {
        super(id, relations);
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @override
     */
    public createRelationFilter(equivalentFieldKeyList: FieldKey[], substituteFieldKeyList: FieldKey[]): AbstractFilter {
        if (equivalentFieldKeyList.length !== 1 || substituteFieldKeyList.length !== 1) {
            return null;
        }

        if (substituteFieldKeyList[0].database && substituteFieldKeyList[0].table && substituteFieldKeyList[0].field) {
            const internalFieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey);
            if (DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[0], internalFieldKey)) {
                return new ListFilter(this.type, DatasetUtil.fieldKeyToString(substituteFieldKeyList[0]), this.operator, this.values);
            }
        }

        return null;
    }

    /**
     * Returns if this filter affects a search in the given datastore/database/table.
     *
     * @override
     */
    public doesAffectSearch(datastore: string, database: string, table: string): boolean {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey);
        return (fieldKey.datastore === datastore && fieldKey.database === database && fieldKey.table === table);
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     *
     * @override
     */
    public getLabelForField(dataset: Dataset, abridged: boolean = false): string {
        return FilterUtil.createLabelForField(this.fieldKey, dataset, abridged);
    }

    /**
     * Returns the label for the filter's value(s).
     *
     * @override
     */
    public getLabelForValue(dataset: Dataset, __abridged: boolean = false): string {
        // Only show the first 3 values.  Add a suffix with the count of the hidden values.
        let labels: string[] = this.values.slice(0, 3).map((value) =>
            FilterUtil.createLabelForValue(this.fieldKey, value, dataset));
        let suffix = (this.values.length > 3 ? (' ' + this.type + ' ' + (this.values.length - 3) + ' more...') : '');
        let operator = FilterUtil.createLabelForOperator(this.operator);
        // Do not show the operator if it is empty.
        return (operator ? (operator + ' ' + (labels.length > 1 ? '(' : '')) : '') + labels.join(' ' + this.type + ' ') + suffix +
            ((operator && labels.length > 1) ? ')' : '');
    }

    /**
     * Returns if this filter is compatible with the given filter config.  Compatible filters must have the same FilterDataSource list.
     *
     * @override
     */
    public isCompatibleWithConfig(filterConfig: FilterConfig): boolean {
        if (FilterUtil.isSimpleFilterConfig(filterConfig)) {
            const fieldKey = filterConfig.datastore + '.' + filterConfig.database + '.' + filterConfig.table + '.' + filterConfig.field;
            return this.fieldKey === fieldKey && this.operator === filterConfig.operator && (typeof filterConfig.value === 'undefined' ||
                (this.values.length === 1 && (typeof this.values[0] === 'undefined' || this.values[0] === filterConfig.value)));
        }

        if (filterConfig instanceof ListFilterDesign && filterConfig.fieldKey === this.fieldKey &&
            filterConfig.operator === this.operator && filterConfig.type === this.type) {
            if (filterConfig.values.length === 1 && typeof filterConfig.values[0] === 'undefined') {
                return true;
            }

            if (!filterConfig.values.length && !this.values.length) {
                return true;
            }

            if (filterConfig.values.length !== this.values.length) {
                return false;
            }

            return filterConfig.values.every((value, index) => value === this.values[index]);
        }

        return false;
    }

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @override
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof ListFilter && filter.fieldKey === this.fieldKey && filter.operator === this.operator &&
            filter.type === this.type && _.isEqual(_.sortBy(filter.values), _.sortBy(this.values));
    }

    /**
     * Returns the filtered values for the filter object.
     *
     * @override
     */
    public retrieveValues(): ListOfValues {
        return new ListOfValues(this.type, this.fieldKey, this.operator, this.values);
    }

    /**
     * Returns the filter config for the filter object.
     *
     * @override
     */
    public toConfig(): FilterConfig {
        return new ListFilterDesign(this.type, this.fieldKey, this.operator, this.values, this.id, this.relations);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     *
     * @override
     */
    public toDataList(): any[] {
        return ['list', this.id, this.relations, this.type, this.fieldKey, this.operator].concat(this.values.map((value) => value));
    }
}

export class PairFilter extends AbstractFilter {
    /**
     * Creates and returns a pair filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[]): PairFilter {
        if (dataList.length === 10 && dataList[0] === 'pair') {
            const id = dataList[1];
            const relations = dataList[2];
            const type = dataList[3];
            const fieldKeyString1 = dataList[4];
            const operator1 = dataList[5];
            const value1 = dataList[6];
            const fieldKeyString2 = dataList[7];
            const operator2 = dataList[8];
            const value2 = dataList[9];

            const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString1);
            const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString2);
            if (fieldKey1 && fieldKey1.field && fieldKey2 && fieldKey2.field) {
                return new PairFilter(type, fieldKeyString1, fieldKeyString2, operator1, operator2, value1, value2, id, relations);
            }
        }
        return null;
    }

    constructor(
        public type: CompoundFilterType,
        public fieldKey1: string,
        public fieldKey2: string,
        public operator1: any,
        public operator2: any,
        public value1: any,
        public value2: any,
        id?: string,
        relations?: string[]
    ) {
        super(id, relations);
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @override
     */
    public createRelationFilter(equivalentFieldKeyList: FieldKey[], substituteFieldKeyList: FieldKey[]): AbstractFilter {
        if (equivalentFieldKeyList.length !== 2 || substituteFieldKeyList.length !== 2) {
            return null;
        }

        if (substituteFieldKeyList[0].database && substituteFieldKeyList[0].table && substituteFieldKeyList[0].field &&
            substituteFieldKeyList[1].database && substituteFieldKeyList[1].table && substituteFieldKeyList[1].field) {
            const internalFieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey1);
            const internalFieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey2);

            if (DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[0], internalFieldKey1) &&
                DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[1], internalFieldKey2)) {
                return new PairFilter(this.type, DatasetUtil.fieldKeyToString(substituteFieldKeyList[0]), DatasetUtil.fieldKeyToString(
                    substituteFieldKeyList[1]
                ), this.operator1, this.operator2, this.value1, this.value2);
            }

            if (DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[1], internalFieldKey1) &&
                DatasetUtil.areFieldKeysEqual(equivalentFieldKeyList[0], internalFieldKey2)) {
                return new PairFilter(this.type, DatasetUtil.fieldKeyToString(substituteFieldKeyList[1]), DatasetUtil.fieldKeyToString(
                    substituteFieldKeyList[0]
                ), this.operator1, this.operator2, this.value1, this.value2);
            }
        }

        return null;
    }

    /**
     * Returns if this filter affects a search in the given datastore/database/table.
     *
     * @override
     */
    public doesAffectSearch(datastore: string, database: string, table: string): boolean {
        const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey1);
        const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(this.fieldKey2);
        return (fieldKey1.datastore === datastore && fieldKey1.database === database && fieldKey1.table === table) ||
            (fieldKey2.datastore === datastore && fieldKey2.database === database && fieldKey2.table === table);
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     *
     * @override
     */
    public getLabelForField(dataset: Dataset, abridged: boolean = false): string {
        return FilterUtil.createLabelForTwoFields(FilterUtil.createLabelForField(this.fieldKey1, dataset, abridged),
            FilterUtil.createLabelForField(this.fieldKey2, dataset, abridged), this.type);
    }

    /**
     * Returns the label for the filter's value(s).
     *
     * @override
     */
    public getLabelForValue(dataset: Dataset, __abridged: boolean = false): string {
        let operator1 = FilterUtil.createLabelForOperator(this.operator1);
        let operator2 = FilterUtil.createLabelForOperator(this.operator2);
        // If the operator of each nested filter is the same, only show it once.  Do not show the operator if it is empty.
        if (operator1 === operator2) {
            return (operator1 ? (operator1 + ' ') : '') + '(' + FilterUtil.createLabelForValue(this.fieldKey1, this.value1, dataset) +
                ' ' + this.type + ' ' + FilterUtil.createLabelForValue(this.fieldKey2, this.value2, dataset) + ')';
        }
        // Do not show the operator if it is empty.
        return (operator1 ? (operator1 + ' ') : '') + FilterUtil.createLabelForValue(this.fieldKey1, this.value1, dataset) + ' ' +
            this.type + ' ' + (operator2 ? (operator2 + ' ') : '') + FilterUtil.createLabelForValue(this.fieldKey2, this.value2, dataset);
    }

    /**
     * Returns if this filter is compatible with the given filter config.  Compatible filters must have the same FilterDataSource list.
     *
     * @override
     */
    public isCompatibleWithConfig(filterConfig: FilterConfig): boolean {
        return filterConfig instanceof PairFilterDesign && filterConfig.fieldKey1 === this.fieldKey1 &&
            filterConfig.fieldKey2 === this.fieldKey2 && filterConfig.operator1 === this.operator1 &&
            filterConfig.operator2 === this.operator2 && filterConfig.type === this.type &&
            (typeof filterConfig.value1 !== 'undefined' ? filterConfig.value1 === this.value1 : true) &&
            (typeof filterConfig.value2 !== 'undefined' ? filterConfig.value2 === this.value2 : true);
    }

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @override
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof PairFilter && filter.fieldKey1 === this.fieldKey1 && filter.fieldKey2 === this.fieldKey2 &&
            filter.operator1 === this.operator1 && filter.operator2 === this.operator2 && filter.value1 === this.value1 &&
            filter.value2 === this.value2 && filter.type === this.type;
    }

    /**
     * Returns the filtered values for the filter object.
     *
     * @override
     */
    public retrieveValues(): PairOfValues {
        return new PairOfValues(this.type, this.fieldKey1, this.fieldKey2, this.operator1, this.operator2, this.value1, this.value2);
    }

    /**
     * Returns the filter config for the filter object.
     *
     * @override
     */
    public toConfig(): FilterConfig {
        return new PairFilterDesign(this.type, this.fieldKey1, this.fieldKey2, this.operator1, this.operator2, this.value1, this.value2,
            this.id, this.relations);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     *
     * @override
     */
    public toDataList(): any[] {
        return ['pair',
            this.id,
            this.relations,
            this.type,
            this.fieldKey1,
            this.operator1,
            this.value1,
            this.fieldKey2,
            this.operator2,
            this.value2];
    }
}

export abstract class AbstractFilterDesign {
    constructor(public id?: string, public relations: string[] = []) { }
}

export class CompoundFilterDesign extends AbstractFilterDesign implements CompoundFilterConfig {
    constructor(
        public type: CompoundFilterType,
        public filters: (SimpleFilterConfig | CompoundFilterConfig)[],
        id?: string,
        relations?: string[]
    ) {
        super(id, relations);
    }
}

export class BoundsFilterDesign extends AbstractFilterDesign implements CompoundFilterConfig {
    public type: CompoundFilterType = CompoundFilterType.AND;
    public filters: (SimpleFilterConfig | CompoundFilterConfig)[];

    static createFilterConfigs(
        fieldKeyString1: string,
        fieldKeyString2: string,
        begin1: any,
        begin2: any,
        end1: any,
        end2: any
    ): FilterConfig[] {
        const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString1);
        const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString2);

        return !(fieldKey1 && fieldKey2) ? [] : [{
            datastore: fieldKey1.datastore,
            database: fieldKey1.database,
            table: fieldKey1.table,
            field: fieldKey1.field,
            operator: '>=',
            value: begin1
        }, {
            datastore: fieldKey1.datastore,
            database: fieldKey1.database,
            table: fieldKey1.table,
            field: fieldKey1.field,
            operator: '<=',
            value: end1
        }, {
            datastore: fieldKey2.datastore,
            database: fieldKey2.database,
            table: fieldKey2.table,
            field: fieldKey2.field,
            operator: '>=',
            value: begin2
        }, {
            datastore: fieldKey2.datastore,
            database: fieldKey2.database,
            table: fieldKey2.table,
            field: fieldKey2.field,
            operator: '<=',
            value: end2
        }] as SimpleFilterConfig[];
    }

    constructor(
        public fieldKey1: string,
        public fieldKey2: string,
        public begin1: any,
        public begin2: any,
        public end1: any,
        public end2: any,
        id?: string,
        relations?: string[]
    ) {
        super(id, relations);
        this.filters = BoundsFilterDesign.createFilterConfigs(fieldKey1, fieldKey2, begin1, begin2, end1, end2);
    }
}

export class DomainFilterDesign extends AbstractFilterDesign implements CompoundFilterConfig {
    public type: CompoundFilterType = CompoundFilterType.AND;
    public filters: (SimpleFilterConfig | CompoundFilterConfig)[];

    static createFilterConfigs(fieldKeyString: string, begin: any, end: any): FilterConfig[] {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);

        return !fieldKey ? [] : [{
            datastore: fieldKey.datastore,
            database: fieldKey.database,
            table: fieldKey.table,
            field: fieldKey.field,
            operator: '>=',
            value: begin
        }, {
            datastore: fieldKey.datastore,
            database: fieldKey.database,
            table: fieldKey.table,
            field: fieldKey.field,
            operator: '<=',
            value: end
        }] as SimpleFilterConfig[];
    }

    constructor(public fieldKey: string, public begin: any, public end: any, id?: string, relations?: string[]) {
        super(id, relations);
        this.filters = DomainFilterDesign.createFilterConfigs(fieldKey, begin, end);
    }
}

export class ListFilterDesign extends AbstractFilterDesign implements CompoundFilterConfig {
    public filters: (SimpleFilterConfig | CompoundFilterConfig)[];

    static createFilterConfigs(fieldKeyString: string, operator: string, values: any[]): FilterConfig[] {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);

        return !fieldKey ? [] : values.map((value) => ({
            datastore: fieldKey.datastore,
            database: fieldKey.database,
            table: fieldKey.table,
            field: fieldKey.field,
            operator,
            value
        } as SimpleFilterConfig));
    }

    constructor(
        public type: CompoundFilterType,
        public fieldKey: string,
        public operator: string,
        public values: any[],
        id?: string,
        relations?: string[]
    ) {
        super(id, relations);
        this.filters = ListFilterDesign.createFilterConfigs(fieldKey, operator, values);
    }
}

export class PairFilterDesign extends AbstractFilterDesign implements CompoundFilterConfig {
    public filters: (SimpleFilterConfig | CompoundFilterConfig)[];

    static createFilterConfigs(
        fieldKeyString1: string,
        fieldKeyString2: string,
        operator1: any,
        operator2: any,
        value1: any,
        value2: any
    ): FilterConfig[] {
        const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString1);
        const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString2);

        return !(fieldKey1 && fieldKey2) ? [] : [{
            datastore: fieldKey1.datastore,
            database: fieldKey1.database,
            table: fieldKey1.table,
            field: fieldKey1.field,
            operator: operator1,
            value: value1
        }, {
            datastore: fieldKey2.datastore,
            database: fieldKey2.database,
            table: fieldKey2.table,
            field: fieldKey2.field,
            operator: operator2,
            value: value2
        }] as SimpleFilterConfig[];
    }

    constructor(
        public type: CompoundFilterType,
        public fieldKey1: string,
        public fieldKey2: string,
        public operator1: any,
        public operator2: any,
        public value1: any,
        public value2: any,
        id?: string,
        relations?: string[]
    ) {
        super(id, relations);
        this.filters = PairFilterDesign.createFilterConfigs(fieldKey1, fieldKey2, operator1, operator2, value1, value2);
    }
}

