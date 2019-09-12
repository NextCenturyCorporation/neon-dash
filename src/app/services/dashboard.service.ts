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

import { NeonConfig, NeonDashboardLeafConfig, NeonDashboardChoiceConfig } from '../models/types';
import { NeonDatastoreConfig, NeonDatabaseMetaData, NeonTableMetaData, NeonFieldMetaData } from '../models/dataset';

import * as _ from 'lodash';
import { ConfigService } from './config.service';
import { Connection } from './connection.service';
import { InjectableConnectionService } from './injectable.connection.service';
import { DashboardState } from '../models/dashboard-state';
import { DashboardUtil } from '../util/dashboard.util';

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
        const dataStoreMerges = Object
            .values(config.datastores)
            .map((datastore) => {
                DashboardUtil.validateDatabases(datastore);

                const connection = this.connectionService.connect(datastore.type, datastore.host);
                if (connection) {
                    return this.mergeDatastoreRemoteState(datastore, connection);
                }
                return undefined;
            })
            .filter((val) => !!val);

        return from(dataStoreMerges.length ? Promise.all(dataStoreMerges) : Promise.resolve(null))
            .pipe(
                map(() => this.applyConfig(config))
            );
    }

    private applyConfig(config: NeonConfig) {
        return Object.assign(this.config, {
            errors: config.errors,
            dashboards: DashboardUtil.validateDashboards(
                config.dashboards ?
                    _.cloneDeep(config.dashboards) :
                    NeonDashboardChoiceConfig.get({ category: 'No Dashboards' })
            ),
            datastores: DashboardUtil.appendDatastoresFromConfig(config.datastores || {}, {}),
            layouts: _.cloneDeep(config.layouts || {}),
            lastModified: config.lastModified,
            projectTitle: config.projectTitle,
            projectIcon: config.projectIcon,
            fileName: config.fileName
        });
    }

    /**
     * Adds the given dataset to the list of datasets maintained by this service and returns the new list.
     */
    public addDatastore(datastore: NeonDatastoreConfig) {
        DashboardUtil.validateDatabases(datastore);
        this.config.datastores[datastore.name] = datastore;
    }

    public setActiveDashboard(dashboard: NeonDashboardLeafConfig) {
        this.state.dashboard = dashboard;

        // Assign first datastore
        const firstName = Object.keys(this.config.datastores).sort((ds1, ds2) => ds1.localeCompare(ds2))[0];
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
    public setActiveDatastore(datastore: NeonDatastoreConfig): void {
        const out = NeonDatastoreConfig.get({
            name: 'Unknown Dataset',
            ...datastore
        });
        this.addDatastore(out);
        this.state.datastore = out;
    }

    /**
     * Updates the database at the given index (default 0) from the given dataset by adding undefined fields for each table.
     */
    private mergeDatastoreRemoteState(datastore: NeonDatastoreConfig, connection: Connection): any {
        let promiseArray = datastore['hasUpdatedFields'] ? [] : Object.values(datastore.databases).map((database) =>
            this.mergeTableNamesAndFieldNames(connection, database));

        return Promise.all(promiseArray).then((__response) => {
            datastore['hasUpdatedFields'] = true;
            return datastore;
        });
    }

    /**
     * Wraps connection.getTableNamesAndFieldNames() in a promise object. If a database not found error occurs,
     * associated dashboards are deleted. Any other error will return a rejected promise.
     */
    private mergeTableNamesAndFieldNames(connection: Connection, database: NeonDatabaseMetaData): Promise<any> {
        let promiseFields = [];
        return new Promise<any>((resolve, reject) => {
            connection.getTableNamesAndFieldNames(database.name, (tableNamesAndFieldNames) => {
                Object.keys(tableNamesAndFieldNames).forEach((tableName: string) => {
                    let table = database.tables[tableName];

                    if (table) {
                        let existingFields = new Set(table.fields.map((field) => field.columnName));

                        tableNamesAndFieldNames[tableName].forEach((fieldName: string) => {
                            if (!existingFields.has(fieldName)) {
                                let newField: NeonFieldMetaData = NeonFieldMetaData.get({
                                    columnName: fieldName,
                                    prettyName: fieldName,
                                    // If a lot of existing fields were defined (> 25), but this field wasn't, then hide this field.
                                    hide: existingFields.size > 25,
                                    // Set the default type to text.
                                    type: 'text'
                                });
                                table.fields.push(newField);
                            }
                        });

                        promiseFields.push(this.mergeFieldTypes(connection, database, table));
                    }
                });

                Promise.all(promiseFields).then(resolve, reject);
            }, (error) => {
                if (error.status === 404) {
                    console.warn('Database ' + database.name + ' does not exist; deleting associated dashboards.');
                    DashboardUtil.deleteInvalidDashboards(
                        'choices' in this.config.dashboards ? this.config.dashboards.choices : {}, database.name
                    );
                }
                resolve();
            });
        });
    }

    /**
     * Wraps connection.getFieldTypes() in a promise object.
     */
    private mergeFieldTypes(
        connection: Connection,
        database: NeonDatabaseMetaData,
        table: NeonTableMetaData
    ): Promise<NeonFieldMetaData[]> {
        return new Promise<NeonFieldMetaData[]>((resolve) => connection.getFieldTypes(database.name, table.name, (types) => {
            for (let field of table.fields) {
                if (types && types[field.columnName]) {
                    field.type = types[field.columnName];
                }
            }
            resolve(table.fields);
        }, (__error) => {
            resolve([]);
        }));
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
}
