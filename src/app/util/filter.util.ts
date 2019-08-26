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
import {
    BoundsValues,
    CompoundFilterConfig,
    DomainValues,
    FilterConfig,
    FilterDataSource,
    FilterValues,
    OneValue,
    PairOfValues,
    SimpleFilterConfig
} from '../models/filter';
import { Dataset, FieldKey, NeonDatastoreConfig, NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData } from '../models/dataset';
import { DatasetUtil } from './dataset.util';

import * as _ from 'lodash';
import * as moment from 'moment';
import * as uuidv4 from 'uuid/v4';

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
    static createFilterFromConfig(filterConfig: FilterConfig, dataset: Dataset): AbstractFilter {
        let filter: AbstractFilter = null;

        if (this.isSimpleFilterConfig(filterConfig)) {
            const [datastore, database, table, field] = DatasetUtil.retrieveMetaDataFromFieldKey({
                datastore: filterConfig.datastore,
                database: filterConfig.database,
                table: filterConfig.table,
                field: filterConfig.field
            } as FieldKey, dataset);

            if (datastore && datastore.name && database && database.name && table && table.name && field && field.columnName &&
                typeof filterConfig.value !== 'undefined') {
                filter = new SimpleFilter(datastore.name, database, table, field, filterConfig.operator, filterConfig.value);
            }
        } else if (this.isCompoundFilterConfig(filterConfig)) {
            const nestedFilters: AbstractFilter[] = filterConfig.filters.map((nestedConfig) =>
                this.createFilterFromConfig(nestedConfig, dataset));

            if (filterConfig instanceof BoundsFilterDesign) {
                filter = BoundsFilter.fromFilters(nestedFilters);
            } else if (filterConfig instanceof DomainFilterDesign) {
                filter = DomainFilter.fromFilters(nestedFilters);
            } else if (filterConfig instanceof ListFilterDesign) {
                filter = ListFilter.fromFilters(nestedFilters, filterConfig.type);
            } else if (filterConfig instanceof PairFilterDesign) {
                filter = PairFilter.fromFilters(nestedFilters, filterConfig.type);
            } else {
                filter = new CompoundFilter(filterConfig.type, nestedFilters);
            }
        }

        if (filter) {
            filter.id = filterConfig.id || filter.id;
        }

        return filter;
    }

    /**
     * Creates and returns a new filter object using the given data list.
     */
    static createFilterFromDataList(dataList: any[], dataset: Dataset): AbstractFilter {
        const functions = [
            SimpleFilter.fromDataList.bind(SimpleFilter),
            ListFilter.fromDataList.bind(ListFilter),
            BoundsFilter.fromDataList.bind(BoundsFilter),
            DomainFilter.fromDataList.bind(DomainFilter),
            PairFilter.fromDataList.bind(PairFilter),
            CompoundFilter.fromDataList.bind(CompoundFilter)
        ];
        for (const func of functions) {
            const filter = func(dataList, dataset);
            if (filter) {
                return filter;
            }
        }
        return null;
    }

    /**
     * Finds and returns the filter in the given list with the given field key (database.table.field) and operator.
     */
    static findFilterWithFieldKey(filters: SimpleFilter[], fieldKey: string, operator?: string): SimpleFilter {
        return filters.find((filter) =>
            (filter.datastore + '.' + filter.database.name + '.' + filter.table.name + '.' + filter.field.columnName) === fieldKey &&
            (operator ? filter.operator === operator : true));
    }

    /**
     * Returns the names of all the fields in the given filter object.
     */
    static retrieveFields(filter: AbstractFilter): string[] {
        return filter instanceof SimpleFilter ? [filter.field] : (filter instanceof CompoundFilter ?
            filter.filters.reduce((list, nestedFilter) => list.concat(this.retrieveFields(nestedFilter)), []) : []);
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
     * Returns if this filter collection contains any filters (optionally, matching the given filter config).
     */
    public isFiltered(filterConfig?: FilterConfig): boolean {
        return filterConfig ? !!this.getCompatibleFilters(filterConfig).length : !!this.getFilters().length;
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

export abstract class AbstractFilter {
    public id: string;
    public relations: string[] = [];

    constructor() {
        this.id = uuidv4();
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @arg {FieldKey[]} equivalentRelationFilterFields
     * @arg {FieldKey[]} substituteRelationFilterFields
     * @arg {Dataset} dataset
     * @return {AbstractFilter}
     * @abstract
     */
    public abstract createRelationFilter(
        equivalentRelationFilterFields: FieldKey[],
        substituteRelationFilterFields: FieldKey[],
        dataset: Dataset
    ): AbstractFilter;

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
     * Returns the label for the filter.
     */
    public getLabel(): string {
        let operator = this.getLabelForOperator();
        return this.getLabelForField() + ' ' + (operator ? (operator + ' ') : '') + this.getLabelForValue();
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     *
     * @abstract
     */
    public abstract getLabelForField(abridged?: boolean): string;

    /**
     * Returns the label for the filter's operator.
     *
     * @abstract
     */
    public abstract getLabelForOperator(): string;

    /**
     * Returns the label for the filter's value(s).
     *
     * @abstract
     */
    public abstract getLabelForValue(abridged?: boolean): string;

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
     * Returns the filtered values for the filter object.
     */
    public abstract retrieveValues(): FilterValues[];

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

export class SimpleFilter extends AbstractFilter {
    /**
     * Creates and returns a simple filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[], dataset: Dataset): SimpleFilter {
        if (dataList.length === 3) {
            const fieldKeyString = dataList[0];
            const operator = dataList[1];
            const value = dataList[2];
            const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
            if (fieldKey) {
                const [datastore, database, table, field] = DatasetUtil.retrieveMetaDataFromFieldKey(fieldKey, dataset);
                return new SimpleFilter(datastore.name, database, table, field, operator, value);
            }
        }
        return null;
    }

    constructor(
        public datastore: string,
        public database: NeonDatabaseMetaData,
        public table: NeonTableMetaData,
        public field: NeonFieldMetaData,
        public operator: string,
        public value: any
    ) {
        super();
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @arg {FieldKey[]} equivalentRelationFilterFields
     * @arg {FieldKey[]} substituteRelationFilterFields
     * @arg {Dataset} dataset
     * @return {AbstractFilter}
     * @override
     */
    public createRelationFilter(
        equivalentRelationFilterFields: FieldKey[],
        substituteRelationFilterFields: FieldKey[],
        dataset: Dataset
    ): AbstractFilter {
        if (equivalentRelationFilterFields.length !== substituteRelationFilterFields.length) {
            return null;
        }

        let relationFilter: SimpleFilter = null;

        equivalentRelationFilterFields.forEach((equivalent, index) => {
            if (equivalent.datastore === this.datastore && equivalent.database === this.database.name &&
                equivalent.table === this.table.name && equivalent.field === this.field.columnName) {
                let substitute: FieldKey = substituteRelationFilterFields[index];

                if (substitute.database && substitute.table && substitute.field) {
                    let datastore: NeonDatastoreConfig = dataset ? dataset.datastores[substitute.datastore] : null;
                    let database: NeonDatabaseMetaData = datastore ? datastore.databases[substitute.database] : null;
                    let table: NeonTableMetaData = database ? database.tables[substitute.table] : null;
                    let field: NeonFieldMetaData = table ? table.fields.filter((element) => element.columnName === substitute.field)[0] :
                        null;

                    if (datastore && datastore.name && database && database.name && table && table.name && field && field.columnName) {
                        relationFilter = new SimpleFilter(datastore.name, database, table, field, this.operator, this.value);
                    }
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
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     *
     * @override
     */
    public getLabelForField(abridged: boolean = false): string {
        return abridged ? this.field.prettyName : (this.database.prettyName + ' / ' + this.table.prettyName + ' / ' +
            this.field.prettyName);
    }

    /**
     * Returns the label for the filter's operator.
     *
     * @abstract
     */
    public getLabelForOperator(): string {
        if (this.field.type === 'date') {
            if (this.operator === '<' || this.operator === '<=') {
                return 'before';
            }
            if (this.operator === '>' || this.operator === '>=') {
                return 'after';
            }
        }
        return this.operator === '=' ? '' : this.operator;
    }

    /**
     * Returns the label for the filter's value(s).
     *
     * @abstract
     */
    public getLabelForValue(__abridged: boolean = false): string {
        if (this.field.type === 'date' || this.value instanceof Date) {
            // TODO THOR-1259 Let user switch from UTC to local time
            // TODO THOR-1329 If hour or minutes are not zero, add hour and minutes and seconds to output string format.
            return moment.utc(this.value).format('YYYY-MM-DD');
        }
        if (typeof this.value === 'number') {
            return '' + (this.value % 1 === 0 ? this.value : parseFloat('' + this.value).toFixed(3));
        }
        return this.value === '' ? '<empty>' : this.value;
    }

    /**
     * Returns if this filter is compatible with the given filter config.  Compatible filters must have the same FilterDataSource list.
     *
     * @arg {FilterConfig} filterConfig
     * @return {boolean}
     */
    public isCompatibleWithConfig(filterConfig: FilterConfig): boolean {
        let simpleFilterConfig = (filterConfig as SimpleFilterConfig);
        return simpleFilterConfig.datastore === this.datastore &&
            simpleFilterConfig.database === this.database.name &&
            simpleFilterConfig.table === this.table.name &&
            simpleFilterConfig.field === this.field.columnName &&
            simpleFilterConfig.operator === this.operator &&
            (typeof simpleFilterConfig.value !== 'undefined' ? simpleFilterConfig.value === this.value : true);
    }

    /**
     * Returns if this filter is equivalent to the given filter.
     *
     * @arg {AbstractFilter} filter
     * @return {boolean}
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof SimpleFilter && filter.datastore === this.datastore &&
            filter.database.name === this.database.name && filter.table.name === this.table.name &&
            filter.field.columnName === this.field.columnName && filter.operator === this.operator && filter.value === this.value;
    }

    /**
     * Returns the filtered values for the filter object.
     */
    public retrieveValues(): FilterValues[] {
        return [{
            field: this.field.columnName,
            operator: this.operator,
            value: this.value
        } as OneValue];
    }

    /**
     * Returns the filter config for the filter object.
     *
     * @return {FilterConfig}
     */
    public toConfig(): FilterConfig {
        return new SimpleFilterDesign(this.datastore, this.database.name, this.table.name, this.field.columnName, this.operator,
            this.value, this.id);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     */
    public toDataList(): any[] {
        const value = (typeof this.value === 'number' && (/[<>]=?/).test(this.operator) && (/[.]\d{4,100}/).test(`${this.value}`)) ?
            parseFloat(this.value.toFixed(3)) : this.value;
        return [`${this.datastore}.${this.database.name}.${this.table.name}.${this.field.columnName}`, this.operator, value];
    }
}

export class CompoundFilter extends AbstractFilter {
    /**
     * Creates and returns a compound filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[], dataset: Dataset): CompoundFilter {
        if (dataList.length && (dataList[0] === 'and' || dataList[0] === 'or')) {
            const [type, ...filters] = dataList;
            return new CompoundFilter(type, filters.map((filter) => FilterUtil.createFilterFromDataList(filter, dataset)));
        }
        return null;
    }

    constructor(
        public type: CompoundFilterType,
        public filters: AbstractFilter[]
    ) {
        super();
    }

    public asBoundsFilter(): { lowerA: SimpleFilter, lowerB: SimpleFilter, upperA: SimpleFilter, upperB: SimpleFilter } {
        // TODO THOR-1396 Delete this
        if (this.type === CompoundFilterType.AND && this.filters.length === 4 &&
            this.filters.every((filter) => filter instanceof SimpleFilter)) {
            let uniqueFieldKeys = _.uniq(this.filters.map((filter) => {
                let simple = filter as SimpleFilter;
                return simple.database.name + '.' + simple.table.name + '.' + simple.field.columnName;
            }));

            if (uniqueFieldKeys.length === 2) {
                let boundsFilter = {
                    lowerA: FilterUtil.findFilterWithFieldKey(this.filters as SimpleFilter[], uniqueFieldKeys[0], '>='),
                    lowerB: FilterUtil.findFilterWithFieldKey(this.filters as SimpleFilter[], uniqueFieldKeys[1], '>='),
                    upperA: FilterUtil.findFilterWithFieldKey(this.filters as SimpleFilter[], uniqueFieldKeys[0], '<='),
                    upperB: FilterUtil.findFilterWithFieldKey(this.filters as SimpleFilter[], uniqueFieldKeys[1], '<=')
                };
                return (boundsFilter.lowerA && boundsFilter.lowerB && boundsFilter.upperA && boundsFilter.upperB) ? boundsFilter : null;
            }
        }
        return null;
    }

    public asDomainFilter(): { lower: SimpleFilter, upper: SimpleFilter } {
        // TODO THOR-1396 Delete this
        if (this.type === CompoundFilterType.AND && this.filters.length === 2 &&
            this.filters.every((filter) => filter instanceof SimpleFilter)) {
            let uniqueFieldKeys = _.uniq(this.filters.map((filter) => {
                let simple = filter as SimpleFilter;
                return simple.database.name + '.' + simple.table.name + '.' + simple.field.columnName;
            }));

            if (uniqueFieldKeys.length === 1) {
                let domainFilter = {
                    lower: FilterUtil.findFilterWithFieldKey(this.filters as SimpleFilter[], uniqueFieldKeys[0], '>='),
                    upper: FilterUtil.findFilterWithFieldKey(this.filters as SimpleFilter[], uniqueFieldKeys[0], '<=')
                };
                return (domainFilter.lower && domainFilter.upper) ? domainFilter : null;
            }
        }
        return null;
    }

    public asListFilter(): SimpleFilter[] {
        // TODO THOR-1396 Delete this
        if (this.filters.length && this.filters.every((filter) => filter instanceof SimpleFilter)) {
            let sample = this.filters[0] as SimpleFilter;
            let fieldKey = sample.database.name + '.' + sample.table.name + '.' + sample.field.columnName;
            let operator = sample.operator;

            return this.filters.every((filter) => {
                let simple = filter as SimpleFilter;
                return (simple.database.name + '.' + simple.table.name + '.' + simple.field.columnName) === fieldKey &&
                    simple.operator === operator;
            }) ? this.filters as SimpleFilter[] : null;
        }
        return null;
    }

    public asPairFilter(): SimpleFilter[] {
        // TODO THOR-1396 Delete this
        if (this.filters.length === 2 && this.filters.every((filter) => filter instanceof SimpleFilter)) {
            let uniqueFieldKeys = _.uniq(this.filters.map((filter) => {
                let simple = filter as SimpleFilter;
                return simple.database.name + '.' + simple.table.name + '.' + simple.field.columnName;
            }));
            return uniqueFieldKeys.length === 2 ? this.filters as SimpleFilter[] : null;
        }
        return null;
    }

    protected createCompoundFilter(filterTransformation: (filters) => AbstractFilter): CompoundFilter {
        return new CompoundFilter(this.type, this.filters.map(filterTransformation));
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @arg {FieldKey[]} equivalentRelationFilterFields
     * @arg {FieldKey[]} substituteRelationFilterFields
     * @arg {Dataset} dataset
     * @return {AbstractFilter}
     * @override
     */
    public createRelationFilter(
        equivalentRelationFilterFields: FieldKey[],
        substituteRelationFilterFields: FieldKey[],
        dataset: Dataset
    ): AbstractFilter {
        if (equivalentRelationFilterFields.length !== substituteRelationFilterFields.length) {
            return null;
        }

        let nestedRelationExists = false;

        let relationFilter: CompoundFilter = this.createCompoundFilter((filter) => {
            let nestedRelationFilter: AbstractFilter = filter.createRelationFilter(equivalentRelationFilterFields,
                substituteRelationFilterFields, dataset);
            nestedRelationExists = nestedRelationExists || !!nestedRelationFilter;
            // A compound filter can exchange one of its nested filters with a relation and keep the rest of the original nested filters.
            return nestedRelationFilter || filter;
        });

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

    private _getFiltersByField(abridged: boolean = false): Record<string, AbstractFilter[]> {
        return this.filters.reduce((collection, filter) => {
            let field = filter.getLabelForField(abridged);
            collection[field] = collection[field] || [];
            collection[field].push(filter);
            return collection;
        }, {}) as Record<string, AbstractFilter[]>;
    }

    protected getLabelForDualFields(one: string, two: string): string {
        let oneNestedFields: string[] = one.split('.');
        let twoNestedFields: string[] = two.split('.');
        if (oneNestedFields.length === twoNestedFields.length && oneNestedFields.length > 1) {
            let oneFieldsPrefix = one.substring(0, one.lastIndexOf('.'));
            if (oneFieldsPrefix === two.substring(0, two.lastIndexOf('.'))) {
                return oneFieldsPrefix;
            }
        }
        return one + ' ' + this.type + ' ' + two;
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     *
     * @override
     */
    public getLabelForField(abridged: boolean = false): string {
        // TODO THOR-1396 Delete most of this
        let boundsFilter = this.asBoundsFilter();
        if (boundsFilter) {
            return this.getLabelForDualFields(boundsFilter.lowerA.getLabelForField(abridged),
                boundsFilter.lowerB.getLabelForField(abridged));
        }

        let domainFilter = this.asDomainFilter();
        if (domainFilter) {
            return domainFilter.lower.getLabelForField(abridged);
        }

        let listFilter = this.asListFilter();
        if (listFilter) {
            return listFilter[0].getLabelForField(abridged);
        }

        let pairFilter = this.asPairFilter();
        if (pairFilter) {
            return this.getLabelForDualFields(pairFilter[0].getLabelForField(abridged), pairFilter[1].getLabelForField(abridged));
        }

        return '';
    }

    /**
     * Returns the label for the filter's operator.
     *
     * @abstract
     */
    public getLabelForOperator(): string {
        return '';
    }

    /**
     * Returns the label for the filter's value(s).
     *
     * @abstract
     */
    public getLabelForValue(abridged: boolean = false): string {
        // TODO THOR-1396 Delete most of this
        let boundsFilter = this.asBoundsFilter();
        if (boundsFilter) {
            return 'from (' + boundsFilter.lowerA.getLabelForValue(abridged) + ', ' + boundsFilter.lowerB.getLabelForValue(abridged) +
                ') to (' + boundsFilter.upperA.getLabelForValue(abridged) + ', ' + boundsFilter.upperB.getLabelForValue(abridged) + ')';
        }

        let domainFilter = this.asDomainFilter();
        if (domainFilter) {
            return 'between ' + domainFilter.lower.getLabelForValue(abridged) + ' and ' + domainFilter.upper.getLabelForValue(abridged);
        }

        let listFilter = this.asListFilter();
        if (listFilter) {
            // Only show the first 5 filters.  Add a suffix with the count of the hidden values.
            let values: any[] = listFilter.slice(0, 5).map((filter) => filter.getLabelForValue(abridged));
            let suffix = (listFilter.length > 5 ? (' ' + this.type + ' ' + (listFilter.length - 5) + ' more...') : '');
            let operator = listFilter[0].getLabelForOperator();
            // Do not show the operator if it is empty.
            return (operator ? (operator + ' ') : '') + values.join(' ' + this.type + ' ') + suffix;
        }

        let pairFilter = this.asPairFilter();
        if (pairFilter) {
            let operatorOne = pairFilter[0].getLabelForOperator();
            let operatorTwo = pairFilter[1].getLabelForOperator();
            // If the operator of each nested filter is the same, only show it once.  Do not show the operator if it is empty.
            if (operatorOne === operatorTwo) {
                return (operatorOne ? (operatorOne + ' ') : '') + pairFilter[0].getLabelForValue(abridged) + ' ' + this.type + ' ' +
                    pairFilter[1].getLabelForValue(abridged);
            }
            // Do not show the operator if it is empty.
            return (operatorOne ? (operatorOne + ' ') : '') + pairFilter[0].getLabelForValue(abridged) + ' ' + this.type + ' ' +
                (operatorTwo ? (operatorTwo + ' ') : '') + pairFilter[1].getLabelForValue(abridged);
        }

        // TODO THOR-1333 Improve label for custom compound filter

        // Group the filters by unique field.
        const filtersByField: Record<string, AbstractFilter[]> = this._getFiltersByField(abridged);
        return '(' + Object.keys(filtersByField).reduce((list, field) => {
            let valuesByOperator: Record<string, any[]> = {};
            // Group the values by unique operator.
            filtersByField[field].forEach((filter) => {
                let operator = filter.getLabelForOperator();
                valuesByOperator[operator] = valuesByOperator[operator] || [];
                valuesByOperator[operator].push(filter.getLabelForValue(abridged));
            });
            let labels: string[] = Object.keys(valuesByOperator).map((operator) => {
                // Only show the first 5 filters.  Add a suffix with the count of the hidden values.
                let values: any[] = valuesByOperator[operator].slice(0, 5);
                let suffix = (valuesByOperator[operator].length > 5 ? (' ' + this.type + ' ' + (valuesByOperator[operator].length - 5) +
                    ' more...') : '');
                // Do not show the operator if each operator is the same or if it is empty.  Do not show parentheses around only one value.
                return (operator ? (operator + ' ') : '') + (values.length > 1 ?
                    ('(' + values.join(', ') + suffix + ')') : (values[0] + suffix));
            });
            // Do not show parentheses around only one operator.
            return list.concat(field + ' ' + (labels.length > 1 ? ('(' + labels.join(' ' + this.type + ' ') + ')') : labels[0]));
        }, []).join(') ' + this.type + ' (') + ')';
    }

    /**
     * Returns if this filter is compatible with the given filter config.  Compatible filters must have the same FilterDataSource list.
     *
     * @arg {FilterConfig} filterConfig
     * @return {boolean}
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
     * @arg {AbstractFilter} filter
     * @return {boolean}
     */
    public isEquivalentToFilter(filter: AbstractFilter): boolean {
        return filter instanceof CompoundFilter && filter.type === this.type &&
            filter.filters.length === this.filters.length &&
            filter.filters.every((nestedFilter, index) => nestedFilter && nestedFilter.isEquivalentToFilter(this.filters[index]));
    }

    /**
     * Returns the filtered values for the filter object.
     */
    public retrieveValues(): FilterValues[] {
        return this.filters.reduce((list, filter) => list.concat(filter.retrieveValues()), []);
    }

    /**
     * Returns the filter config for the filter object.
     *
     * @return {FilterConfig}
     */
    public toConfig(): FilterConfig {
        return new CompoundFilterDesign(this.type, this.filters.map((filter) => filter.toConfig()), this.id);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     */
    public toDataList(): any[] {
        return ([this.type] as any[]).concat(this.filters.map((filter) => filter.toDataList()));
    }
}

export class BoundsFilter extends CompoundFilter {
    /**
     * Creates and returns a bounds filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[], dataset: Dataset): BoundsFilter {
        if (dataList.length === 7 && dataList[0] === 'bounds') {
            const fieldKeyString1 = dataList[1];
            const begin1 = dataList[2];
            const end1 = dataList[3];
            const fieldKeyString2 = dataList[4];
            const begin2 = dataList[5];
            const end2 = dataList[6];

            const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString1);
            const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString2);
            if (fieldKey1 && fieldKey2) {
                const [datastore1, database1, table1, field1] = DatasetUtil.retrieveMetaDataFromFieldKey(fieldKey1, dataset);
                const [datastore2, database2, table2, field2] = DatasetUtil.retrieveMetaDataFromFieldKey(fieldKey2, dataset);
                return new BoundsFilter(fieldKeyString1, fieldKeyString2, begin1, begin2, end1, end2, [
                    new SimpleFilter(datastore1.name, database1, table1, field1, '>=', begin1),
                    new SimpleFilter(datastore1.name, database1, table1, field1, '<=', end1),
                    new SimpleFilter(datastore2.name, database2, table2, field2, '>=', begin2),
                    new SimpleFilter(datastore2.name, database2, table2, field2, '<=', end2)
                ]);
            }
        }
        return null;
    }

    /**
     * Creates and returns a bounds filter object using the given array of four simple filter objects.
     */
    static fromFilters(filters: AbstractFilter[]): BoundsFilter {
        if (filters.length === 4 && filters.every((filter) => filter instanceof SimpleFilter)) {
            let fieldKeys = _.uniq(filters.map((filter) => {
                let simple = filter as SimpleFilter;
                return simple.datastore + '.' + simple.database.name + '.' + simple.table.name + '.' + simple.field.columnName;
            }));

            if (fieldKeys.length === 2) {
                const filter1: SimpleFilter = FilterUtil.findFilterWithFieldKey(filters as SimpleFilter[], fieldKeys[0], '>=');
                const filter2: SimpleFilter = FilterUtil.findFilterWithFieldKey(filters as SimpleFilter[], fieldKeys[0], '<=');
                const filter3: SimpleFilter = FilterUtil.findFilterWithFieldKey(filters as SimpleFilter[], fieldKeys[1], '>=');
                const filter4: SimpleFilter = FilterUtil.findFilterWithFieldKey(filters as SimpleFilter[], fieldKeys[1], '<=');

                if (filter1 && filter2 && filter3 && filter4) {
                    return new BoundsFilter(fieldKeys[0], fieldKeys[1], filter1.value, filter3.value, filter2.value, filter4.value,
                        [filter1, filter2, filter3, filter4]);
                }
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
        public filters: AbstractFilter[]
    ) {
        super(CompoundFilterType.AND, filters);
    }

    protected createCompoundFilter(filterTransformation: (filters) => AbstractFilter): CompoundFilter {
        return BoundsFilter.fromFilters(this.filters.map(filterTransformation));
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     */
    public getLabelForField(abridged: boolean = false): string {
        return this.getLabelForDualFields(this.filters[0].getLabelForField(abridged), this.filters[2].getLabelForField(abridged));
    }

    /**
     * Returns the label for the filter's value(s).
     */
    public getLabelForValue(abridged: boolean = false): string {
        return 'from (' + this.filters[0].getLabelForValue(abridged) + ', ' + this.filters[2].getLabelForValue(abridged) +
            ') to (' + this.filters[1].getLabelForValue(abridged) + ', ' + this.filters[3].getLabelForValue(abridged) + ')';
    }

    /**
     * Returns the filtered values for the filter object.
     */
    public retrieveValues(): BoundsValues[] {
        return [{
            begin1: this.begin1,
            begin2: this.begin2,
            field1: this.fieldKey1,
            field2: this.fieldKey2,
            end1: this.end1,
            end2: this.end2
        } as BoundsValues];
    }

    /**
     * Returns the filter config for the filter object.
     */
    public toConfig(): FilterConfig {
        return new BoundsFilterDesign(this.fieldKey1, this.fieldKey2, this.begin1, this.begin2, this.end1, this.end2, this.id);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     */
    public toDataList(): any[] {
        return ['bounds', this.fieldKey1, this.begin1, this.end1, this.fieldKey2, this.begin2, this.end2];
    }
}

export class DomainFilter extends CompoundFilter {
    /**
     * Creates and returns a list filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[], dataset: Dataset): DomainFilter {
        if (dataList.length === 4 && dataList[0] === 'domain') {
            const fieldKeyString = dataList[1];
            const begin = dataList[2];
            const end = dataList[3];

            const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
            if (fieldKey) {
                const [datastore, database, table, field] = DatasetUtil.retrieveMetaDataFromFieldKey(fieldKey, dataset);
                return new DomainFilter(fieldKeyString, begin, end, [
                    new SimpleFilter(datastore.name, database, table, field, '>=', begin),
                    new SimpleFilter(datastore.name, database, table, field, '<=', end)
                ]);
            }
        }
        return null;
    }

    /**
     * Creates and returns a domain filter object using the given array of two simple filter objects.
     */
    static fromFilters(filters: AbstractFilter[]): DomainFilter {
        if (filters.length === 2 && filters.every((filter) => filter instanceof SimpleFilter)) {
            let fieldKeys = _.uniq(filters.map((filter) => {
                let simple = filter as SimpleFilter;
                return simple.datastore + '.' + simple.database.name + '.' + simple.table.name + '.' + simple.field.columnName;
            }));

            if (fieldKeys.length === 1) {
                const filter1: SimpleFilter = FilterUtil.findFilterWithFieldKey(filters as SimpleFilter[], fieldKeys[0], '>=');
                const filter2: SimpleFilter = FilterUtil.findFilterWithFieldKey(filters as SimpleFilter[], fieldKeys[0], '<=');

                if (filter1 && filter2) {
                    return new DomainFilter(fieldKeys[0], filter1.value, filter2.value, [filter1, filter2]);
                }
            }
        }
        return null;
    }

    constructor(public fieldKey: string, public begin: any, public end: any, filters: AbstractFilter[]) {
        super(CompoundFilterType.AND, filters);
    }

    protected createCompoundFilter(filterTransformation: (filters) => AbstractFilter): CompoundFilter {
        return DomainFilter.fromFilters(this.filters.map(filterTransformation));
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     */
    public getLabelForField(abridged: boolean = false): string {
        return this.filters[0].getLabelForField(abridged);
    }

    /**
     * Returns the label for the filter's value(s).
     */
    public getLabelForValue(abridged: boolean = false): string {
        return 'between ' + this.filters[0].getLabelForValue(abridged) + ' and ' + this.filters[1].getLabelForValue(abridged);
    }

    /**
     * Returns the filtered values for the filter object.
     */
    public retrieveValues(): DomainValues[] {
        return [{
            begin: this.begin,
            field: this.fieldKey,
            end: this.end
        } as DomainValues];
    }

    /**
     * Returns the filter config for the filter object.
     */
    public toConfig(): FilterConfig {
        return new DomainFilterDesign(this.fieldKey, this.begin, this.end, this.id);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     */
    public toDataList(): any[] {
        return ['domain', this.fieldKey, this.begin, this.end];
    }
}

export class ListFilter extends CompoundFilter {
    /**
     * Creates and returns a list filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[], dataset: Dataset): ListFilter {
        if (dataList.length >= 5 && dataList[0] === 'list') {
            const type = dataList[1];
            const fieldKeyString = dataList[2];
            const operator = dataList[3];
            const values = dataList.slice(4);

            const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
            if (fieldKey) {
                const [datastore, database, table, field] = DatasetUtil.retrieveMetaDataFromFieldKey(fieldKey, dataset);
                return new ListFilter(type, fieldKeyString, operator, values, values.map((value) =>
                    new SimpleFilter(datastore.name, database, table, field, operator, value)));
            }
        }
        return null;
    }

    /**
     * Creates and returns a list filter object using the given array of one or more simple filter objects and the filter type.
     */
    static fromFilters(filters: AbstractFilter[], type: CompoundFilterType): ListFilter {
        if (filters.length && filters.every((filter) => filter instanceof SimpleFilter)) {
            let sample = filters[0] as SimpleFilter;
            let fieldKey = sample.datastore + '.' + sample.database.name + '.' + sample.table.name + '.' + sample.field.columnName;
            let operator = sample.operator;

            if (filters.every((filter) => {
                let simple = filter as SimpleFilter;
                return simple.operator === operator && (simple.datastore + '.' + simple.database.name + '.' + simple.table.name + '.' +
                    simple.field.columnName) === fieldKey;
            })) {
                return new ListFilter(type, fieldKey, operator, filters.map((filter) => (filter as SimpleFilter).value), filters);
            }
        }
        return null;
    }

    constructor(
        public type: CompoundFilterType,
        public fieldKey: string,
        public operator: string,
        public values: any[],
        public filters: AbstractFilter[]
    ) {
        super(type, filters);
    }

    protected createCompoundFilter(filterTransformation: (filters) => AbstractFilter): CompoundFilter {
        return ListFilter.fromFilters(this.filters.map(filterTransformation), this.type);
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     */
    public getLabelForField(abridged: boolean = false): string {
        return this.filters[0].getLabelForField(abridged);
    }

    /**
     * Returns the label for the filter's value(s).
     */
    public getLabelForValue(abridged: boolean = false): string {
        // Only show the first 5 filters.  Add a suffix with the count of the hidden values.
        let values: any[] = this.filters.slice(0, 5).map((filter) => filter.getLabelForValue(abridged));
        let suffix = (this.filters.length > 5 ? (' ' + this.type + ' ' + (this.filters.length - 5) + ' more...') : '');
        let operator = this.filters[0].getLabelForOperator();
        // Do not show the operator if it is empty.
        return (operator ? (operator + ' ') : '') + values.join(' ' + this.type + ' ') + suffix;
    }

    /**
     * Returns the filtered values for the filter object.
     */
    public retrieveValues(): OneValue[] {
        return this.values.map((value) => ({
            field: this.fieldKey,
            operator: this.operator,
            value
        } as OneValue));
    }

    /**
     * Returns the filter config for the filter object.
     */
    public toConfig(): FilterConfig {
        return new ListFilterDesign(this.type, this.fieldKey, this.operator, this.values, this.id);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     */
    public toDataList(): any[] {
        return ['list', this.type, this.fieldKey, this.operator].concat(this.values.map((value) => value));
    }
}

export class PairFilter extends CompoundFilter {
    /**
     * Creates and returns a pair filter object using the given data list (or null if it is not the correct type of data list).
     */
    static fromDataList(dataList: any[], dataset: Dataset): PairFilter {
        if (dataList.length === 8 && dataList[0] === 'pair') {
            const type = dataList[1];
            const fieldKeyString1 = dataList[2];
            const operator1 = dataList[3];
            const value1 = dataList[4];
            const fieldKeyString2 = dataList[5];
            const operator2 = dataList[6];
            const value2 = dataList[7];

            const fieldKey1: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString1);
            const fieldKey2: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString2);
            if (fieldKey1 && fieldKey2) {
                const [datastore1, database1, table1, field1] = DatasetUtil.retrieveMetaDataFromFieldKey(fieldKey1, dataset);
                const [datastore2, database2, table2, field2] = DatasetUtil.retrieveMetaDataFromFieldKey(fieldKey2, dataset);
                return new PairFilter(type, fieldKeyString1, fieldKeyString2, operator1, operator2, value1, value2, [
                    new SimpleFilter(datastore1.name, database1, table1, field1, operator1, value1),
                    new SimpleFilter(datastore2.name, database2, table2, field2, operator2, value2)
                ]);
            }
        }
        return null;
    }

    /**
     * Creates and returns a pair filter object using the given array of two simple filter objects and the filter type.
     */
    static fromFilters(filters: AbstractFilter[], type: CompoundFilterType): PairFilter {
        if (filters.length === 2 && filters.every((filter) => filter instanceof SimpleFilter)) {
            let fieldKeys = _.uniq(filters.map((filter) => {
                let simple = filter as SimpleFilter;
                return simple.datastore + '.' + simple.database.name + '.' + simple.table.name + '.' + simple.field.columnName;
            }));

            if (fieldKeys.length === 2) {
                const filter1: SimpleFilter = FilterUtil.findFilterWithFieldKey(filters as SimpleFilter[], fieldKeys[0]);
                const filter2: SimpleFilter = FilterUtil.findFilterWithFieldKey(filters as SimpleFilter[], fieldKeys[1]);

                if (filter1 && filter2) {
                    return new PairFilter(type, fieldKeys[0], fieldKeys[1], filter1.operator, filter2.operator, filter1.value,
                        filter2.value, [filter1, filter2]);
                }
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
        public filters: AbstractFilter[]
    ) {
        super(type, filters);
    }

    protected createCompoundFilter(filterTransformation: (filters) => AbstractFilter): CompoundFilter {
        return PairFilter.fromFilters(this.filters.map(filterTransformation), this.type);
    }

    /**
     * Returns the label for the filter's field(s).  Also returns the database and table if abridged is false.
     */
    public getLabelForField(abridged: boolean = false): string {
        return this.getLabelForDualFields(this.filters[0].getLabelForField(abridged), this.filters[1].getLabelForField(abridged));
    }

    /**
     * Returns the label for the filter's value(s).
     */
    public getLabelForValue(abridged: boolean = false): string {
        // If the operator of each nested filter is the same, only show it once.  Do not show the operator if it is empty.
        if (this.operator1 === this.operator2) {
            return (this.operator1 ? (this.operator1 + ' ') : '') + this.filters[0].getLabelForValue(abridged) + ' ' + this.type + ' ' +
                this.filters[1].getLabelForValue(abridged);
        }
        // Do not show the operator if it is empty.
        return (this.operator1 ? (this.operator1 + ' ') : '') + this.filters[0].getLabelForValue(abridged) + ' ' + this.type + ' ' +
            (this.operator2 ? (this.operator2 + ' ') : '') + this.filters[1].getLabelForValue(abridged);
    }

    /**
     * Returns the filtered values for the filter object.
     */
    public retrieveValues(): PairOfValues[] {
        return [{
            field1: this.fieldKey1,
            field2: this.fieldKey2,
            operator1: this.operator1,
            operator2: this.operator2,
            value1: this.value1,
            value2: this.value2
        } as PairOfValues];
    }

    /**
     * Returns the filter config for the filter object.
     */
    public toConfig(): FilterConfig {
        return new PairFilterDesign(this.type, this.fieldKey1, this.fieldKey2, this.operator1, this.operator2, this.value1, this.value2,
            this.id);
    }

    /**
     * Returns the filter as a data list to save as a string in a text file or URL.
     */
    public toDataList(): any[] {
        return ['pair', this.type, this.fieldKey1, this.operator1, this.value1, this.fieldKey2, this.operator2, this.value2];
    }
}

export abstract class AbstractFilterDesign {
}

export class SimpleFilterDesign extends AbstractFilterDesign implements SimpleFilterConfig {
    static fromConfig(filterConfig: SimpleFilterConfig): SimpleFilterDesign {
        return new SimpleFilterDesign(filterConfig.datastore, filterConfig.database, filterConfig.table, filterConfig.field,
            filterConfig.operator, filterConfig.value, filterConfig.id);
    }

    constructor(
        public datastore: string,
        public database: string,
        public table: string,
        public field: string,
        public operator: string,
        public value?: any,
        public id?: string
    ) {
        super();
    }
}

export class CompoundFilterDesign extends AbstractFilterDesign implements CompoundFilterConfig {
    public designs: AbstractFilterDesign[];

    static fromConfig(filterConfig: CompoundFilterConfig): CompoundFilterDesign {
        return new CompoundFilterDesign(filterConfig.type, filterConfig.filters);
    }

    constructor(
        public type: CompoundFilterType,
        public filters: (SimpleFilterConfig | CompoundFilterConfig)[],
        public id?: string
    ) {
        super();
        this.designs = this.filters.map((filter) => filter instanceof AbstractFilterDesign ? filter :
            (FilterUtil.isSimpleFilterConfig(filter) ? SimpleFilterDesign.fromConfig(filter) : CompoundFilterDesign.fromConfig(filter)));
    }
}

export class BoundsFilterDesign extends CompoundFilterDesign {
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
        public id?: string
    ) {
        super(CompoundFilterType.AND, BoundsFilterDesign.createFilterConfigs(fieldKey1, fieldKey2, begin1, begin2, end1, end2), id);
    }
}

export class DomainFilterDesign extends CompoundFilterDesign {
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

    constructor(public fieldKey: string, public begin: any, public end: any, public id?: string) {
        super(CompoundFilterType.AND, DomainFilterDesign.createFilterConfigs(fieldKey, begin, end), id);
    }
}

export class ListFilterDesign extends CompoundFilterDesign {
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
        public id?: string
    ) {
        super(type, ListFilterDesign.createFilterConfigs(fieldKey, operator, values), id);
    }
}

export class PairFilterDesign extends CompoundFilterDesign {
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
        public id?: string
    ) {
        super(type, PairFilterDesign.createFilterConfigs(fieldKey1, fieldKey2, operator1, operator2, value1, value2), id);
    }
}

