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

import { CompoundFilterType } from '../services/abstract.search.service';
import { FilterConfig, SimpleFilterConfig, CompoundFilterConfig } from '../models/types';
import { NeonDatabaseMetaData, NeonFieldMetaData, SingleField, NeonTableMetaData } from '../models/dataset';

import * as uuidv4 from 'uuid/v4';
import { DashboardState } from '../models/dashboard-state';
import { ConfigUtil } from './config.util';
import { DatasetUtil } from './dataset.util';

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
    database: NeonDatabaseMetaData;
    table: NeonTableMetaData;
    field: NeonFieldMetaData;
    operator: string;
    value?: any;
}

export interface CompoundFilterDesign extends FilterDesign {
    type: CompoundFilterType;
    filters: FilterDesign[];
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
    static areFilterDataSourceListsEquivalent(list1: FilterDataSource[], list2: FilterDataSource[]): boolean {
        return list1.length === list2.length &&
            // Each FilterDataSource in list1 must be equivalent to a FilterDataSource in list2.
            list1.every((item1) => list2.some((item2) => this.areFilterDataSourcesEquivalent(item1, item2))) &&
            // Each FilterDataSource in list2 must be equivalent to a FilterDataSource in list1.
            list2.every((item2) => list2.some((item1) => this.areFilterDataSourcesEquivalent(item1, item2)));
    }

    /**
     * Creates and returns the pretty name for the given database, table, and field.
     *
     * @arg {NeonDatabaseMetaData} database
     * @arg {NeonTableMetaData} table
     * @arg {NeonFieldMetaData} field
     * @return {string}
     */
    static createFilterName(database: NeonDatabaseMetaData, table: NeonTableMetaData, field: NeonFieldMetaData, operator: string): string {
        return database.prettyName + ' / ' + table.prettyName + ' / ' + field.prettyName + ' ' + operator.toUpperCase();
    }

    /**
     * Creates and returns the FilterDataSource list for the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @arg {boolean} [ignoreOperator=false]
     * @return {FilterDataSource[]}
     */
    static createFilterDataSourceListFromDesign(
        filterDesign: FilterDesign,
        ignoreOperator: boolean = false
    ): FilterDataSource[] {
        if (this.isSimpleFilterDesign(filterDesign)) {
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

        if (this.isCompoundFilterDesign(filterDesign)) {
            let compoundFilterDesign = filterDesign;

            let returnList: FilterDataSource[] = [];

            compoundFilterDesign.filters.forEach((nestedFilterDesign) => {
                let nestedDataSourceList: FilterDataSource[] = this.createFilterDataSourceListFromDesign(nestedFilterDesign,
                    ignoreOperator);

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
     * Creates and returns a filter design from the given JSON object.
     *
     * @arg {any} filterObject
     * @return {FilterDesign}
     */
    static createFilterDesignFromJsonObject(filterObject: FilterConfig, dashboardState: DashboardState): FilterDesign {
        // TODO THOR-1078 Validate that datastore is non-empty.
        if ('database' in filterObject && 'table' in filterObject && 'field' in filterObject && 'operator' in filterObject) {
            let database: NeonDatabaseMetaData = dashboardState.getDatabaseWithName(filterObject.database);
            let table: NeonTableMetaData = dashboardState.getTableWithName(filterObject.database, filterObject.table);
            let field: NeonFieldMetaData = dashboardState.getFieldWithName(filterObject.database, filterObject.table, filterObject.field);
            return {
                name: filterObject.name || '',
                root: filterObject.root || '',
                datastore: filterObject.datastore || '',
                database,
                table,
                field,
                operator: filterObject.operator,
                value: filterObject.value
            } as SimpleFilterDesign;
        }

        if ('filters' in filterObject && 'type' in filterObject) {
            return {
                name: filterObject.name || '',
                root: filterObject.root || '',
                type: filterObject.type,
                filters: filterObject.filters.map((nestedObject) =>
                    this.createFilterDesignFromJsonObject(nestedObject, dashboardState))
            } as CompoundFilterDesign;
        }

        return null;
    }

    /**
     * Creates and returns a filter object from the given filter design.
     *
     * @arg {FilterDesign} filterDesign
     * @return {AbstractFilter}
     */
    static createFilterFromDesign(filterDesign: FilterDesign): AbstractFilter {
        let filter: AbstractFilter = null;
        // TODO THOR-1078 Validate that datastore is non-empty.

        if (this.isSimpleFilterDesign(filterDesign)) {
            if (filterDesign.database.name &&
                filterDesign.table.name &&
                filterDesign.field && filterDesign.field.columnName &&
                filterDesign.operator && typeof filterDesign.value !== 'undefined') {
                // TODO THOR-1078 Add the datastore to the filter (ignore now because it causes errors).
                filter = new SimpleFilter('', filterDesign.database, filterDesign.table, filterDesign.field,
                    filterDesign.operator, filterDesign.value);
            }
        } else if (this.isCompoundFilterDesign(filterDesign)) {
            filter = new CompoundFilter(filterDesign.type, filterDesign.filters.map((nestedDesign) =>
                this.createFilterFromDesign(nestedDesign)));
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
    static createFilterJsonObjectFromDesign(filter: FilterDesign): FilterConfig {
        if (this.isSimpleFilterDesign(filter)) {
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

        if (this.isCompoundFilterDesign(filter)) {
            return {
                name: filter.name,
                root: filter.root,
                type: filter.type,
                filters: filter.filters
                    .map((nestedFilter) => this.createFilterJsonObjectFromDesign(nestedFilter))
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
    static isCompoundFilterDesign(filterDesign: FilterDesign): filterDesign is CompoundFilterDesign {
        return (filterDesign as CompoundFilterDesign).type !== undefined &&
            (filterDesign as CompoundFilterDesign).filters !== undefined;
    }

    // https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types
    /**
     * Returns if the given filter design is a SimpleFilterDesign.
     *
     * @arg {FilterDesign} filterDesign
     * @return {filterDesign is SimpleFilterDesign}
     */
    static isSimpleFilterDesign(filterDesign: FilterDesign): filterDesign is SimpleFilterDesign {
        return (filterDesign as SimpleFilterDesign).datastore !== undefined &&
            (filterDesign as SimpleFilterDesign).database !== undefined &&
            (filterDesign as SimpleFilterDesign).table !== undefined;
    }

    static toPlainFilterJSON(filters: FilterDesign[]): any[] {
        let out: any[] = [];
        for (const filter of filters) {
            if (this.isCompoundFilterDesign(filter)) {
                out.push([filter.type, filter.root, ...this.toPlainFilterJSON(filter.filters)]);
            } else if (this.isSimpleFilterDesign(filter)) {
                let val = filter.value;
                if (typeof val === 'number' && (/[<>]=?/).test(filter.operator) && (/[.]\d{4,100}/).test(`${val}`)) {
                    val = parseFloat(val.toFixed(3));
                }
                out.push([
                    `${filter.datastore}.${filter.database.name}.${filter.table.name}.${filter.field.columnName}`,
                    filter.operator,
                    val,
                    filter.root
                ]);
            }
        }
        return out;
    }

    static fromPlainFilterJSON(simple: any[]): FilterConfig {
        if (simple[0] === 'and' || simple[0] === 'or') { // Complex filter
            const [operator, root, ...filters] = simple;
            return {
                name: operator,
                type: operator,
                root: root || 'or',
                filters: filters.map((val) => this.fromPlainFilterJSON(val))
            } as CompoundFilterConfig;
        } // Simple filter
        const [field, operator, value, root] = simple as string[];
        return {
            ...DatasetUtil.deconstructDottedReference(field),
            operator,
            value,
            root: root || 'or'
        } as SimpleFilterConfig;
    }

    static toSimpleFilterQueryString(filters: FilterDesign[]): string {
        return ConfigUtil.translate(JSON.stringify(this.toPlainFilterJSON(filters)), ConfigUtil.encodeFiltersMap);
    }

    static fromSimpleFilterQueryString(query: string): FilterConfig[] {
        const text = ConfigUtil.translate(query, ConfigUtil.decodeFiltersMap);
        const arr = JSON.parse(text) as any[];
        const res = arr.map((val) => this.fromPlainFilterJSON(val));
        return res;
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

export abstract class AbstractFilter {
    public id: string;
    public name: string;
    public root: CompoundFilterType = CompoundFilterType.AND;
    public relations: string[] = [];

    constructor() {
        this.id = uuidv4();
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @arg {SingleField[]} equivalentRelationFilterFields
     * @arg {SingleField[]} substituteRelationFilterFields
     * @return {AbstractFilter}
     * @abstract
     */
    public abstract createRelationFilter(
        equivalentRelationFilterFields: SingleField[],
        substituteRelationFilterFields: SingleField[]
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
        public database: NeonDatabaseMetaData,
        public table: NeonTableMetaData,
        public field: NeonFieldMetaData,
        public operator: string,
        public value: any
    ) {
        super();
        this.name = this.toString();
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @arg {SingleField[]} equivalentRelationFilterFields
     * @arg {SingleField[]} substituteRelationFilterFields
     * @return {AbstractFilter}
     */
    public createRelationFilter(
        equivalentRelationFilterFields: SingleField[],
        substituteRelationFilterFields: SingleField[],
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
                        substitute.field, this.operator, this.value);
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
    constructor(public type: CompoundFilterType, public filters: AbstractFilter[]) {
        super();
        this.name = this.toString();
    }

    /**
     * Creates and returns a relation filter of this filter by exchanging the given equivalent fields with the given substitute fields.
     *
     * @arg {SingleField[]} equivalentRelationFilterFields
     * @arg {SingleField[]} substituteRelationFilterFields
     * @return {AbstractFilter}
     */
    public createRelationFilter(
        equivalentRelationFilterFields: SingleField[],
        substituteRelationFilterFields: SingleField[]
    ): AbstractFilter {
        if (equivalentRelationFilterFields.length !== substituteRelationFilterFields.length) {
            return null;
        }

        let nestedRelationExists = false;

        let relationFilter: CompoundFilter = new CompoundFilter(this.type, this.filters.map((filter) => {
            let nestedRelationFilter: AbstractFilter = filter.createRelationFilter(equivalentRelationFilterFields,
                substituteRelationFilterFields);
            nestedRelationExists = nestedRelationExists || !!nestedRelationFilter;
            // A compound filter can exchange one of its nested filters with a relation and keep the rest of the original nested filters.
            return nestedRelationFilter || filter;
        }));

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
