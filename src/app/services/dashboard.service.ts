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

import { NeonConfig, NeonDashboardConfig, NeonDashboardLeafConfig, NeonDashboardChoiceConfig } from '../models/types';
import { DatasetUtil, FieldKey, DatastoreConfig, DatabaseConfig } from '../models/dataset';

import * as _ from 'lodash';
import { ConfigService } from './config.service';
import { InjectableConnectionService } from './injectable.connection.service';
import { DashboardState } from '../models/dashboard-state';

import { GridState } from '../models/grid-state';
import { Observable, from, Subject } from 'rxjs';
import { map, shareReplay, mergeMap } from 'rxjs/operators';
import { ConfigUtil } from '../util/config.util';
import { FilterConfig } from '../models/filter';
import { AbstractFilter, FilterUtil } from '../util/filter.util';
import { InjectableFilterService } from './injectable.filter.service';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    static DASHBOARD_CATEGORY_DEFAULT: string = 'Select an option...';

    public readonly config = NeonConfig.get();
    public readonly state = new DashboardState();
    public readonly gridState = new GridState({ max_cols: 12, max_rows: 0 });

    public readonly configSource: Observable<NeonConfig>;
    private readonly stateSubject = new Subject<DashboardState>();
    public readonly stateSource: Observable<DashboardState>;

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
                return DatasetUtil.updateDatastoreFromDataServer(connection, datastore, (failedDatabases: DatabaseConfig[]) => {
                    failedDatabases.forEach((database) => {
                        console.warn('Database failed on ' + database.name + ' ... deleting all associated dashboards.');
                        this._deleteInvalidDashboards(config.dashboards, database.name);
                    });
                });
            }
            return undefined;
        }).filter((promise) => !!promise);

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
                // Ignore the datastore if another datastore with the same name already exists.  Assume that each name is unique.
                if (!datastores[datastore.name]) {
                    datastores[datastore.name] = datastore;
                }
                return datastores;
            }, this.config.datastores || {}),
            layouts: _.cloneDeep(config.layouts || {}),
            lastModified: config.lastModified,
            projectTitle: config.projectTitle,
            projectIcon: config.projectIcon,
            fileName: config.fileName
        });
    }

    public setActiveDashboard(dashboard: NeonDashboardLeafConfig) {
        this.state.dashboard = dashboard;

        // Assign first datastore
        const firstName = Object.keys(this.config.datastores || {}).sort((ds1, ds2) => ds1.localeCompare(ds2))[0];
        this.setActiveDatastore(this.config.datastores[firstName]);

        // Load filters
        this.filterService.setFilters(this._translateFilters(dashboard.filters) || []);
        this.stateSubject.next(this.state);
    }

    /**
     * Sets the active dataset to the given dataset.
     * @param {Object} The dataset containing {String} name, {String} layout, {String} datastore, {String} hostname,
     * and {Array} databases.  Each database is an Object containing {String} name and {Array} tables.
     * Each table is an Object containing {String} name, {Array} fields, and {Object} labelOptions.  Each
     * field is an Object containing {String} columnName and {String} prettyName.  Each mapping key is a unique
     * identifier used by the visualizations and each value is a field name.
     */
    // TODO: THOR-1062: this will likely be more like "set active dashboard/config" to allow
    // to connect to multiple datasets
    public setActiveDatastore(datastore: DatastoreConfig): void {
        const validated: DatastoreConfig = DatasetUtil.validateDatastore(datastore);
        if (validated) {
            this.config.datastores[validated.name] = validated;
            this.state.datastore = validated;
        }
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
                filters: this.filterService.getFilters(),
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
     * Returns the filters as string for use in URL
     */
    public getFiltersToSaveInURL(): string {
        let filters: AbstractFilter[] = this.filterService.getRawFilters();
        return ConfigUtil.translate(JSON.stringify(filters.map((filter) => filter.toDataList())), ConfigUtil.encodeFiltersMap);
    }

    private _translateFilters(filterConfigs: FilterConfig[] | string): AbstractFilter[] {
        if (typeof filterConfigs === 'string') {
            const stringFilters = ConfigUtil.translate(filterConfigs, ConfigUtil.decodeFiltersMap);
            return (JSON.parse(stringFilters) as any[]).map((dataList) => FilterUtil.createFilterFromDataList(dataList,
                this.state.asDataset()));
        }
        return filterConfigs.map((filterConfig) => FilterUtil.createFilterFromConfig(filterConfig, this.state.asDataset()));
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
                // which should instead have table keys and a layout specified. If not, delete choice.
                if (!leaf['layout'] || !leaf['tables']) {
                    Object.keys(parent.choices).forEach((choiceId) => {
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
     * Delete dashboards associated with the given database so users cannot select them.
     */
    private _deleteInvalidDashboards(dashboard: NeonDashboardConfig, invalidDatabaseName: string): any {
        ConfigUtil.visitDashboards(dashboard, {
            leaf: (leaf, path) => {
                let tableKeys = Object.keys(leaf.tables);
                const parent = path[path.length - 2];

                for (const tableKey of tableKeys) {
                    const databaseKeyObject: FieldKey = DatasetUtil.deconstructTableOrFieldKey(leaf.tables[tableKey]);

                    if (!databaseKeyObject || databaseKeyObject.database === invalidDatabaseName) {
                        Object.keys(parent.choices).forEach((choiceId) => {
                            if (parent.choices[choiceId].name === leaf.name) {
                                delete parent.choices[choiceId];
                            }
                        });
                        return;
                    }
                }
            }
        });

        return null;
    }
}
