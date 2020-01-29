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

import { CompoundFilterType } from '@caci-critical-insight-solutions/nucleus-core';
import { FilterConfig, NeonConfig, NeonDashboardConfig, NeonDashboardLeafConfig, NeonDashboardChoiceConfig } from '../models/types';
import { DatasetUtil, FieldKey, DatastoreConfig } from '@caci-critical-insight-solutions/nucleus-core';

import * as _ from 'lodash';
import { ConfigService } from './config.service';
import { InjectableConnectionService } from './injectable.connection.service';
import { DashboardState } from '../models/dashboard-state';

import { GridState } from '../models/grid-state';
import { Observable, from, Subject } from 'rxjs';
import { map, shareReplay, mergeMap } from 'rxjs/operators';
import { ConfigUtil } from '../util/config.util';
import {
    AbstractFilter,
    BoundsFilter,
    CompoundFilter,
    DomainFilter,
    ListFilter,
    PairFilter
} from '@caci-critical-insight-solutions/nucleus-core';
import { InjectableFilterService } from './injectable.filter.service';

/**
 * Internal class with filter-specific dashboard util functions.
 */
class DashboardFilterUtil {
    /**
     * Creates and returns a new data list using the given Filter object.
     */
    public createDataListFromFilter(filter: AbstractFilter): any[] {
        if (filter instanceof ListFilter) {
            return this._createDataListFromListFilter(filter);
        }
        if (filter instanceof BoundsFilter) {
            return this._createDataListFromBoundsFilter(filter);
        }
        if (filter instanceof DomainFilter) {
            return this._createDataListFromDomainFilter(filter);
        }
        if (filter instanceof PairFilter) {
            return this._createDataListFromPairFilter(filter);
        }
        if (filter instanceof CompoundFilter) {
            return this._createDataListFromCompoundFilter(filter);
        }
        return [];
    }

    /**
     * Creates and returns a new Filter object using the given FilterConfig object.
     */
    public createFilterFromConfig(filterConfig: FilterConfig): AbstractFilter {
        if ('datastore' in filterConfig && 'database' in filterConfig && 'table' in filterConfig && 'field' in filterConfig &&
            'operator' in filterConfig && 'value' in filterConfig) {
            return new ListFilter(CompoundFilterType.OR, filterConfig.datastore + '.' + filterConfig.database + '.' + filterConfig.table +
                '.' + filterConfig.field, filterConfig.operator, [filterConfig.value], filterConfig.id, filterConfig.relations);
        }

        if ('fieldKey1' in filterConfig && 'fieldKey2' in filterConfig && 'begin1' in filterConfig && 'begin2' in filterConfig &&
            'end1' in filterConfig && 'end2' in filterConfig) {
            return new BoundsFilter(filterConfig.fieldKey1, filterConfig.fieldKey2, filterConfig.begin1, filterConfig.begin2,
                filterConfig.end1, filterConfig.end2, filterConfig.id, filterConfig.relations);
        }

        if ('fieldKey' in filterConfig && 'begin' in filterConfig && 'end' in filterConfig) {
            return new DomainFilter(filterConfig.fieldKey, filterConfig.begin, filterConfig.end, filterConfig.id,
                filterConfig.relations);
        }

        if ('fieldKey' in filterConfig && 'operator' in filterConfig && 'values' in filterConfig && 'type' in filterConfig) {
            return new ListFilter(filterConfig.type, filterConfig.fieldKey, filterConfig.operator, filterConfig.values,
                filterConfig.id, filterConfig.relations);
        }

        if ('fieldKey1' in filterConfig && 'fieldKey2' in filterConfig && 'operator1' in filterConfig && 'operator2' in filterConfig &&
            'value1' in filterConfig && 'value2' in filterConfig && 'type' in filterConfig) {
            return new PairFilter(filterConfig.type, filterConfig.fieldKey1, filterConfig.fieldKey2, filterConfig.operator1,
                filterConfig.operator2, filterConfig.value1, filterConfig.value2, filterConfig.id, filterConfig.relations);
        }

        if ('filters' in filterConfig && 'type' in filterConfig) {
            return new CompoundFilter(filterConfig.type, filterConfig.filters.map((nestedConfig) =>
                this.createFilterFromConfig(nestedConfig)), filterConfig.id, filterConfig.relations);
        }

        return null;
    }

    /**
     * Creates and returns a new Filter object using the given data list.
     */
    public createFilterFromDataList(dataList: any[]): AbstractFilter {
        const functions = [
            // Bind functions to "this" for any recursive calls.
            this._createListFilterFromDataList.bind(this),
            this._createBoundsFilterFromDataList.bind(this),
            this._createDomainFilterFromDataList.bind(this),
            this._createPairFilterFromDataList.bind(this),
            this._createCompoundFilterFromDataList.bind(this)
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
     * Creates and returns a new BoundsFilter object using the given data list (or null if it is not the correct type of data list).
     */
    private _createBoundsFilterFromDataList(dataList: any[]): BoundsFilter {
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

    /**
     * Creates and returns a new CompoundFilter object using the given data list (or null if it is not the correct type of data list).
     */
    private _createCompoundFilterFromDataList(dataList: any[]): CompoundFilter {
        if (dataList.length && (dataList[0] === 'and' || dataList[0] === 'or')) {
            const [type, id, relations, ...filters] = dataList;
            return new CompoundFilter(type, filters.map((filter) => this.createFilterFromDataList(filter)), id, relations);
        }
        return null;
    }

    /**
     * Creates and returns a new data list using the given BoundsFilter object.
     */
    private _createDataListFromBoundsFilter(filter: BoundsFilter): any[] {
        return [
            'bounds',
            filter.id,
            filter.relations,
            filter.fieldKey1,
            filter.begin1,
            filter.end1,
            filter.fieldKey2,
            filter.begin2,
            filter.end2
        ];
    }

    /**
     * Creates and returns a new data list using the given CompoundFilter object.
     */
    private _createDataListFromCompoundFilter(filter: CompoundFilter): any[] {
        return ([filter.type, filter.id, filter.relations] as any[]).concat(filter.filters.map((nestedFilter) =>
            this.createDataListFromFilter(nestedFilter)));
    }

    /**
     * Creates and returns a new data list using the given DomainFilter object.
     */
    private _createDataListFromDomainFilter(filter: DomainFilter): any[] {
        return ['domain', filter.id, filter.relations, filter.fieldKey, filter.begin, filter.end];
    }

    /**
     * Creates and returns a new data list using the given ListFilter object.
     */
    private _createDataListFromListFilter(filter: ListFilter): any[] {
        return ['list', filter.id, filter.relations, filter.type, filter.fieldKey, filter.operator]
            .concat(filter.values.map((value) => value));
    }

    /**
     * Creates and returns a new data list using the given PairFilter object.
     */
    private _createDataListFromPairFilter(filter: PairFilter): any[] {
        return [
            'pair',
            filter.id,
            filter.relations,
            filter.type,
            filter.fieldKey1,
            filter.operator1,
            filter.value1,
            filter.fieldKey2,
            filter.operator2,
            filter.value2
        ];
    }

    /**
     * Creates and returns a new DomainFilter object using the given data list (or null if it is not the correct type of data list).
     */
    private _createDomainFilterFromDataList(dataList: any[]): DomainFilter {
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

    /**
     * Creates and returns a new ListFilter object using the given data list (or null if it is not the correct type of data list).
     */
    private _createListFilterFromDataList(dataList: any[]): ListFilter {
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
        // Backwards compatibility (simple filter data list)
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

    /**
     * Creates and returns a new PairFilter object using the given data list (or null if it is not the correct type of data list).
     */
    private _createPairFilterFromDataList(dataList: any[]): PairFilter {
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
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    static DASHBOARD_CATEGORY_DEFAULT: string = 'Select an option...';
    static DASHBOARD_FILTER_UTIL = new DashboardFilterUtil();

    public readonly config = NeonConfig.get();
    public readonly state = new DashboardState();
    public readonly gridState = new GridState({ max_cols: 12, max_rows: 0 });

    public readonly configSource: Observable<NeonConfig>;
    private readonly stateSubject = new Subject<DashboardState>();
    public readonly stateSource: Observable<DashboardState>;

    // A collection that maps datastore name to database name to table names.
    private _finishedUpdates: Record<string, Record<string, string[]>> = {};

    constructor(
        private configService: ConfigService,
        private connectionService: InjectableConnectionService,
        private filterService: InjectableFilterService
    ) {
        this.configSource = this.configService
            .getActive()
            .pipe(
                mergeMap((config) => this.onConfigChange(config)),
                shareReplay(1)
            );
        this.stateSource = this.stateSubject
            .pipe(shareReplay(1));
    }

    onConfigChange(config: NeonConfig): Observable<NeonConfig> {
        const datastores: DatastoreConfig[] = Object.values(config.datastores || {})
            .map((datastore) => DatasetUtil.validateDatastore(datastore)).filter((datastore) => !!datastore);

        const promises = datastores.map((datastore: DatastoreConfig) => {
            const connection = this.connectionService.connect(datastore.type, datastore.host);
            if (connection) {
                return DatasetUtil.updateDatastoreFromDataServer(connection, datastore, this._finishedUpdates[datastore.name] || {},
                    (failedTableKeys: string[]) => {
                        failedTableKeys.forEach((failedTableKey) => {
                            this._deleteInvalidTable(config.datastores, failedTableKey);
                            this._deleteInvalidDashboards(config.dashboards, failedTableKey);
                        });
                    });
            }
            return undefined;
        }).filter((promise) => !!promise);

        datastores.forEach((datastore) => {
            this._finishedUpdates[datastore.name] = {};
            Object.values(datastore.databases).forEach((database) => {
                this._finishedUpdates[datastore.name][database.name] = Object.keys(database.tables);
            });
        });

        return from(promises.length ? Promise.all(promises) : Promise.resolve(null))
            .pipe(
                map(() => this.applyConfig(config))
            );
    }

    private applyConfig(config: NeonConfig) {
        return Object.assign(this.config, {
            errors: config.errors,
            dashboards: this._validateDashboards(config.dashboards ? _.cloneDeep(config.dashboards) :
                NeonDashboardChoiceConfig.get({ category: 'No Dashboards' })),
            datastores: Object.values(config.datastores || {}).reduce((datastores, datastore) => {
                // If the datastore doesn't already exist, add it.
                if (!datastores[datastore.name]) {
                    datastores[datastore.name] = datastore;
                } else if (datastores[datastore.name].host === datastore.host && datastores[datastore.name].type === datastore.type) {
                    Object.keys(datastore.databases).forEach((databaseName) => {
                        // If the database doesn't already exist, add it.
                        if (!datastores[datastore.name].databases[databaseName]) {
                            datastores[datastore.name].databases[databaseName] = datastore.databases[databaseName];
                        } else {
                            Object.keys(datastore.databases[databaseName].tables).forEach((tableName) => {
                                // If the table doesn't already exist, add it.
                                if (!datastores[datastore.name].databases[databaseName].tables[tableName]) {
                                    datastores[datastore.name].databases[databaseName].tables[tableName] =
                                        datastore.databases[databaseName].tables[tableName];
                                }
                            });
                        }
                    });
                }
                return datastores;
            }, this.config.datastores || {}),
            hideImport: config.hideImport,
            layouts: _.cloneDeep(config.layouts || {}),
            lastModified: config.lastModified,
            projectTitle: config.projectTitle,
            projectIcon: config.projectIcon,
            theme: config.theme,
            fileName: config.fileName
        });
    }

    public setActiveDashboard(dashboard: NeonDashboardLeafConfig) {
        this.state.dashboard = dashboard;

        this.setActiveDatastores(Object.keys(this.config.datastores).map((id) => this.config.datastores[id]));

        this.filterService.setFilters(this._translateFilters(dashboard.filters) || []);
        this.stateSubject.next(this.state);
    }

    /**
     * Sets the datastores for the dashboard.
     */
    public setActiveDatastores(datastores: DatastoreConfig[]): void {
        this.state.datastores = datastores.map((datastore) => {
            const validated: DatastoreConfig = DatasetUtil.validateDatastore(datastore);
            if (validated) {
                this.config.datastores[validated.name] = validated;
                return validated;
            }
            return null;
        }).filter((datastore) => !!datastore);
    }

    /**
     * Exports current dashboard state to neon config, with optional filters if desired
     */
    exportToConfig(name: string): NeonConfig {
        const out = NeonConfig.get({
            ...this.config,
            layouts: {
                [name]: this.gridState.activeWidgetList.map(
                    (item) => ({
                        bindings: item.bindings,
                        col: item.col,
                        row: item.row,
                        name: item.name,
                        sizex: item.sizex,
                        sizey: item.sizey,
                        type: item.type
                    })
                )
            },
            dashboards: _.cloneDeep({
                ...this.state.dashboard,
                name,
                filters: this.filterService.getFilters().map((filter) => filter.toDesign()),
                layout: name
            }),
            projectTitle: name
        });
        delete out.errors;

        if ('options' in out.dashboards) {
            out.dashboards.options.connectOnLoad = true;
        }
        return out;
    }

    /**
     * Creates and returns a new config object with the existing datastores and an empty dashboard object.
     */
    public createEmptyDashboardConfig(name: string): NeonConfig {
        return NeonConfig.get({
            dashboards: NeonDashboardLeafConfig.get({
                name,
                layout: 'custom',
                options: {
                    connectOnLoad: true
                }
            }),
            datastores: this.config.datastores,
            layouts: {
                custom: []
            }
        });
    }

    /**
     * Returns the filters as string for use in URL
     */
    public getFiltersToSaveInURL(): string {
        let filters: AbstractFilter[] = this.filterService.getFilters();
        return ConfigUtil.translate(JSON.stringify(filters.map((filter) =>
            DashboardService.DASHBOARD_FILTER_UTIL.createDataListFromFilter(filter))), ConfigUtil.encodeFiltersMap);
    }

    private _translateFilters(filterConfigs: FilterConfig[] | string): AbstractFilter[] {
        if (typeof filterConfigs === 'string') {
            const stringFilters = ConfigUtil.translate(filterConfigs, ConfigUtil.decodeFiltersMap);
            return (JSON.parse(stringFilters) as any[]).map((dataList) =>
                DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromDataList(dataList));
        }
        return filterConfigs.map((filterConfig) => DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromConfig(filterConfig));
    }

    /**
     * Validate top level category of dashboards object in the config, then call
     * separate function to check the choices within recursively.
     */
    private _validateDashboards(dashboard: NeonDashboardConfig): NeonDashboardConfig {
        ConfigUtil.visitDashboards(dashboard, {
            leaf: (leaf, path) => {
                let parent = path[path.length - 2];

                // If no choices are present, then this might be the last level of nested choices,
                // which should instead have a name and a layout specified. If not, delete choice.
                if (!leaf['layout'] || !leaf['name']) {
                    Object.keys(parent ? parent.choices : {}).forEach((choiceId) => {
                        if (parent.choices[choiceId].name === leaf.name) {
                            delete parent.choices[choiceId];
                        }
                    });
                    return;
                }

                if (leaf.options.simpleFilter) {
                    const filter = leaf.options.simpleFilter;
                    if (filter.fieldKey) {
                        const fieldKeyObject: FieldKey = DatasetUtil.deconstructTableOrFieldKey(leaf.fields[filter.fieldKey]);
                        filter.databaseName = fieldKeyObject.database;
                        filter.tableName = fieldKeyObject.table;
                        filter.fieldName = '';
                        filter.fieldName = fieldKeyObject ? fieldKeyObject.field : '';
                    } else {
                        delete leaf.options.simpleFilter;
                    }
                }
            },
            choice: (choice) => {
                choice.category = DashboardService.DASHBOARD_CATEGORY_DEFAULT;
            }
        });
        return dashboard;
    }

    /**
     * Deletes all dashboards containing the given table key so users cannot select them.
     */
    private _deleteInvalidDashboards(dashboard: NeonDashboardConfig, failedTableKey: string): void {
        ConfigUtil.visitDashboards(dashboard, {
            leaf: (leaf, path) => {
                const parent = path[path.length - 2];
                for (const tableKey of Object.values(leaf.tables || {})) {
                    if (tableKey === failedTableKey) {
                        Object.keys(parent ? parent.choices : {}).forEach((choiceId) => {
                            if (parent.choices[choiceId].name === leaf.name) {
                                console.warn('Deleting dashboard "' + leaf.fullTitle.slice(1).join(' / ') +
                                    '" because of deleting table "' + failedTableKey + '"');
                                delete parent.choices[choiceId];
                            }
                        });
                        return;
                    }
                }
            }
        });
    }

    /**
     * Deletes the table with the given table key so users cannot select it.
     */
    private _deleteInvalidTable(datastores: Record<string, DatastoreConfig>, failedTableKey: string): void {
        const tableKeyObject: FieldKey = DatasetUtil.deconstructTableOrFieldKey(failedTableKey);
        if (tableKeyObject.datastore && datastores[tableKeyObject.datastore]) {
            if (tableKeyObject.database && datastores[tableKeyObject.datastore].databases[tableKeyObject.database]) {
                if (tableKeyObject.table &&
                    datastores[tableKeyObject.datastore].databases[tableKeyObject.database].tables[tableKeyObject.table]) {
                    console.warn('Deleting table "' + failedTableKey + '" because its update failed (maybe it doesn\'t exist?)');
                    delete datastores[tableKeyObject.datastore].databases[tableKeyObject.database].tables[tableKeyObject.table];
                }
            }
        }
    }
}

