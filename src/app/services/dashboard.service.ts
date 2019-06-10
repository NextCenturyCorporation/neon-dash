/*
 * Copyright 2017 Next Century Corporation
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
 *
 */
import { Injectable } from '@angular/core';
import { eventing } from 'neon-framework';

import {
    NeonConfig, NeonDashboardConfig, NeonDatastoreConfig,
    NeonDatabaseMetaData, NeonTableMetaData, NeonFieldMetaData
} from '../model/types';
import { neonEvents } from '../model/neon-namespaces';
import * as _ from 'lodash';
import { ConfigService } from './config.service';
import { ConnectionService, Connection } from './connection.service';
import { DashboardState } from '../model/dashboard-state';
import { DashboardUtil } from '../util/dashboard.util';
import { GridState } from '../model/grid-state';

@Injectable()
export class DashboardService {
    public readonly config = NeonConfig.get();

    public readonly state = new DashboardState();

    public readonly gridState = new GridState({ max_cols: 12, max_rows: 0 });

    // Use the Dataset Service to save settings for specific databases/tables and
    // publish messages to all visualizations if those settings change.
    private messenger: eventing.Messenger;

    constructor(private configService: ConfigService, private connectionService: ConnectionService) {
        this.messenger = new eventing.Messenger();
        this.configService.$source.subscribe((config: NeonConfig) => {
            this.setConfig(config);

            let loaded = 0;
            Object.values(this.config.datastores).forEach((datastore) => {
                DashboardUtil.validateDatabases(datastore);

                let callback = () => {
                    this.messenger.publish(neonEvents.DASHBOARD_READY, {});
                };

                let connection = this.connectionService.connect(datastore.type, datastore.host);
                if (connection) {
                    // Update the fields within each table to add any that weren't listed in the config file as well as field types.
                    this.mergeDatastoreRemoteState(datastore, connection).then(() => {
                        if (++loaded === Object.keys(this.config.datastores).length) {
                            callback();
                        }
                    });
                } else {
                    callback();
                }
            });
        });
    }

    setConfig(config: NeonConfig) {
        Object.assign(this.config, {
            dashboards: DashboardUtil.validateDashboards(
                config.dashboards ?
                    _.cloneDeep(config.dashboards) :
                    NeonDashboardConfig.get({ category: 'No Dashboards' })
            ),
            datastores: DashboardUtil.appendDatastoresFromConfig(config.datastores || {}, {}),
            layouts: _.cloneDeep(config.layouts || {})
        });
    }

    /**
     * Adds the given dataset to the list of datasets maintained by this service and returns the new list.
     * @return {Array}
     */
    public addDatastore(datastore: NeonDatastoreConfig) {
        DashboardUtil.validateDatabases(datastore);
        this.config.datastores[datastore.name] = datastore;
    }

    public setActiveDashboard(dashboard: NeonDashboardConfig) {
        this.state.dashboard = dashboard;
    }

    /**
     * Sets the active dataset to the given dataset.
     * @param {Object} The dataset containing {String} name, {String} layout, {String} datastore, {String} hostname,
     * and {Array} databases.  Each database is an Object containing {String} name and {Array} tables.
     * Each table is an Object containing {String} name, {Array} fields, and {Object} mappings.  Each
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
     * @param {Object} datastore
     * @param {Connection} connection
     * @param {Function} callback (optional)
     * @param {Number} index (optional)
     */
    public mergeDatastoreRemoteState(datastore: NeonDatastoreConfig, connection: Connection): any {
        let promiseArray = datastore['hasUpdatedFields'] ? [] : Object.values(datastore.databases).map((database) =>
            this.getTableNamesAndFieldNames(connection, database));

        return Promise.all(promiseArray).then((__response) => {
            datastore['hasUpdatedFields'] = true;
            return datastore;
        });
    }

    /**
     * Wraps connection.getTableNamesAndFieldNames() in a promise object. If a database not found error occurs,
     * associated dashboards are deleted. Any other error will return a rejected promise.
     * @param {Connection} connection
     * @param {NeonDatabaseMetaData} database
     * @return {Promise}
     * @private
     */
    private getTableNamesAndFieldNames(connection: Connection, database: NeonDatabaseMetaData): Promise<any> {
        let promiseFields = [];
        return new Promise<any>((resolve, reject) => {
            connection.getTableNamesAndFieldNames(database.name, (tableNamesAndFieldNames) => {
                Object.keys(tableNamesAndFieldNames).forEach((tableName: string) => {
                    let table = database.tables[tableName];

                    if (table) {
                        let hasField = new Set(table.fields.map((field) => field.columnName));

                        tableNamesAndFieldNames[tableName].forEach((fieldName: string) => {
                            if (!hasField.has(fieldName)) {
                                let newField: NeonFieldMetaData = NeonFieldMetaData.get({ columnName: fieldName, prettyName: fieldName });
                                table.fields.push(newField);
                            }
                        });

                        promiseFields.push(this.updateFieldTypes(connection, database, table));
                    }
                });

                Promise.all(promiseFields).then(resolve, reject);
            }, (error) => {
                if (error.status === 404) {
                    console.warn('Database ' + database.name + ' does not exist; deleting associated dashboards.');
                    let keys = this.config.dashboards && this.config.dashboards.choices ? Object.keys(this.config.dashboards.choices) : [];

                    Promise.all(
                        DashboardUtil.deleteInvalidDashboards(this.config.dashboards.choices, keys, database.name)
                    ).then(resolve, reject);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Wraps connection.getFieldTypes() in a promise object.
     */
    private updateFieldTypes(
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

    public exportAsConfig() {
        return {
            ..._.cloneDeep(this.config),
            dashboards: _.cloneDeep(this.state.dashboard)
        };
    }
}
