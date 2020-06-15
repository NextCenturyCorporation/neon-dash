/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { HttpClient } from '@angular/common/http';
import * as yaml from 'js-yaml';

import { environment } from '../../environments/environment';

import { Subject, Observable, combineLatest, of, from, throwError } from 'rxjs';
import { map, catchError, switchMap, take, shareReplay, tap } from 'rxjs/operators';
import { NeonConfig, NeonDashboardLeafConfig } from '../models/types';
import { Injectable } from '@angular/core';
import { InjectableConnectionService } from './injectable.connection.service';
import { ConfigUtil } from '../util/config.util';

import { eventing } from 'neon-framework';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private DATA_SERVER_HOST = '../neon';

    private source = new Subject<NeonConfig>();

    private $default: Observable<NeonConfig>;

    private _configFileLoadErrors: string[] = [];

    private messenger: eventing.Messenger;

    // eslint-disable-next-line no-invalid-this
    $source = this.source.asObservable()
        .pipe(
            map((data) => JSON.parse(JSON.stringify(data))), // Clone and clean
            map((config) => NeonConfig.get(config)),
            shareReplay(1)
        );

    constructor(
        private http: HttpClient,
        private connectionService: InjectableConnectionService
    ) {
        this.messenger = new eventing.Messenger();

        if (this.connectionService) {
            this.connectionService.setDataServerHost(this.DATA_SERVER_HOST);

            // Listen for new data notification updates.
            this.connectionService.listenOnDataUpdate((message) => {
                this.messenger.publish(eventing.channels.DATASET_UPDATED, { message });
            });
        }
    }

    private openConnection() {
        return this.connectionService.connect('.', '.');
    }

    private handleConfigFileError(error) {
        if (error.status === 404) {
            // Fail silently.
            return of(undefined);
        }
        console.error(error);
        this._configFileLoadErrors.push(error.message);
        return of(NeonConfig.get());
    }

    private loadFromFolder(path): Observable<NeonConfig | undefined> {
        return this.http.get(path, {
            responseType: 'text',
            params: {
                rnd: `${Math.random() * 1000000}.${Date.now()}`
            }
        }).pipe(
            map((response: any) => (yaml.load(response) as NeonConfig) || NeonConfig.get()),
            tap((config) => {
                config.fileName = ConfigUtil.DEFAULT_CONFIG_NAME;
            }),
            catchError((error) => this.handleConfigFileError(error))
        );
    }

    private takeFirstLoadedOrFetchDefault(all: (NeonConfig | null)[]) {
        const next = all.find((el) => !!el);
        if (next) {
            return of(next);
        }
        return this.list()
            .pipe(map(({ results: [remoteFirst] }) => remoteFirst));
    }

    private finalizeConfig(configInput: NeonConfig, filters: string, paths: string[]) {
        let config: NeonConfig = configInput;
        config.dashboards = config.dashboards || {};
        config.layouts = config.layouts || {};

        if (!Object.keys(config.dashboards).length) {
            config.dashboards = NeonDashboardLeafConfig.get({
                name: 'New Dashboard',
                layout: 'custom',
                options: {
                    connectOnLoad: true
                }
            });
            config.layouts.custom = config.layouts.custom || [];
        }

        if (!config || !config.datastores || !Object.keys(config.datastores).length) {
            console.error('Config does not have any datastores!');
            config.errors = (config.errors || []).concat('Config does not have any datastores!');
        }

        // If a config file failed to load but another one loaded successfully, don't bother showing any of the load errors.
        if (this._configFileLoadErrors.length && config.fileName !== ConfigUtil.DEFAULT_CONFIG_NAME) {
            config.errors = (config.errors || []).concat(this._configFileLoadErrors);
        }

        this._configFileLoadErrors = [];

        if (config.neonServerUrl && config.neonServerUrl !== this.DATA_SERVER_HOST) {
            this.connectionService.setDataServerHost(config.neonServerUrl);
            // Listen for new data notification updates using the data server host from the loaded config file.
            this.connectionService.listenOnDataUpdate((message) => {
                this.messenger.publish(eventing.channels.DATASET_UPDATED, { message });
            }, true);
        }

        let dash: NeonDashboardLeafConfig;

        ConfigUtil.nameDashboards(config.dashboards, config.fileName || '');

        // If dashboard path is provided, find the dashboard to activate
        if (paths.length) {
            const parts = paths.filter((key) => !!key);
            const active = ConfigUtil.findDashboardByKey(config.dashboards, parts) as NeonDashboardLeafConfig;

            // If found
            if (active) {
                ConfigUtil.setAutoShowDashboard(config.dashboards, active);
                if (filters) {
                    active.filters = filters;
                }
                dash = active;
            }
        }

        if (!dash && filters) {
            ConfigUtil.filterDashboards(config.dashboards, filters);
        }

        // If no dashboards are set to auto-show, then set all of them to auto-show, and Neon will load the first one in the config.
        if (!ConfigUtil.findAutoShowDashboard(config.dashboards)) {
            ConfigUtil.setAutoShowDashboard(config.dashboards);
        }

        return config;
    }

    /**
     * Default load process, generally represents empty URL loading
     */
    private getDefault(configList: string[]) {
        if (!this.$default) {
            this.$default = combineLatest(...configList.map((config) => this.loadFromFolder(config)))
                .pipe(
                    switchMap((configs: NeonConfig[]) => this.takeFirstLoadedOrFetchDefault(configs)),
                    take(1),
                    shareReplay(1)
                );
        }
        return this.$default;
    }

    /**
     * Loads config state by URL, given a base path
     */
    setActiveByURL(url: string | Location) {
        const { dashboard, filters, paths } = ConfigUtil.getUrlState(url);

        setTimeout(() => {
            // TODO THOR-1300 Handle when we get rid of default
            from((dashboard && dashboard !== ConfigUtil.DEFAULT_CONFIG_NAME) ? this.load(dashboard) : throwError(null)).pipe(
                catchError((error) => this.getDefault(environment.config).pipe(
                    tap((config) => {
                        // The Error object seems to disappear before it gets to the dashboard, so create a new object for the error.
                        config.errors = error ? [{
                            message: error.message,
                            stack: error.stack
                        }] : [];
                    })
                )),
                map((config) => this.finalizeConfig(config, filters, paths.slice(1))),
                tap((config) => this.setActive(config))
            ).subscribe();
        }, 1);

        return this.getActive();
    }

    setActive(config: NeonConfig) {
        this.source.next(config);
        return this.getActive();
    }

    getActive() {
        return this.$source;
    }

    /**
     * Saves config under name
     */
    save(config: NeonConfig, name: string): Observable<void> {
        return from(new Promise<void>((resolve, reject) => {
            config.projectTitle = ConfigUtil.validateName(name || config.projectTitle);
            config['stateName'] = config.projectTitle;
            this.openConnection().saveState(config, resolve, reject);
        })).pipe(take(1));
    }

    /**
     * Loads the dashboard state with the given name.
     */
    load(name: string): Observable<NeonConfig> {
        return from(new Promise<NeonConfig>((resolve, reject) => {
            const validName = ConfigUtil.validateName(name);
            this.openConnection().loadState(validName, resolve, reject);
        })).pipe(
            take(1),
            map((config) => {
                let list = [].concat(config.dashboards ? [] : ['dashboards']).concat(config.datastores ? [] : ['datastores'])
                    .concat(config.layouts ? [] : ['layouts']);
                if (list.length) {
                    throw new Error('Cannot open saved state "' + name + '" because config file does not have ' + list.join(', '));
                }
                return config;
            })
        );
    }

    /*
     * Deletes the state by name
     */
    delete(name: string) {
        return from(new Promise<void>((resolve, reject) => {
            const validName = ConfigUtil.validateName(name);
            this.openConnection().deleteState(validName, resolve, reject);
        })).pipe(take(1));
    }

    /**
     * Get list of available dashboard states.
     */
    list(limit = 100, offset = 0) {
        return from(new Promise<{ total: number, results: NeonConfig[] }>((resolve, reject) => {
            this.openConnection().listStates(limit, offset, resolve, reject);
        })).pipe(take(1));
    }
}
