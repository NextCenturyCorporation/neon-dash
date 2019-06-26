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
import { HttpClient } from '@angular/common/http';
import * as neon from 'neon-framework';
import * as yaml from 'js-yaml';

import { environment } from '../../environments/environment';

import { Subject, Observable, combineLatest, of, from, throwError } from 'rxjs';
import { map, catchError, switchMap, take, shareReplay, tap } from 'rxjs/operators';
import { NeonConfig, NeonDashboardLeafConfig } from '../models/types';
import { Injectable } from '@angular/core';
import { ConnectionService } from './connection.service';
import { ConfigUtil } from '../util/config.util';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private configErrors = [];
    private source = new Subject<NeonConfig>();

    private $default: Observable<NeonConfig>;

    // eslint-disable-next-line no-invalid-this
    $source = this.source.asObservable()
        .pipe(
            map((data) => JSON.parse(JSON.stringify(data))), // Clone and clean
            map((config) => NeonConfig.get(config)),
            shareReplay(1)
        );

    constructor(
        private http: HttpClient,
        private connectionService: ConnectionService
    ) {
        neon.setNeonServerUrl('../neon');
    }

    private openConnection() {
        return this.connectionService.connect('.', '.', true);
    }

    private handleConfigFileError(error, file?: any) {
        if (error.status === 404) {
            // Fail silently.
        } else {
            console.error(error);
            this.configErrors.push('Error reading config file ' + file);
            this.configErrors.push(error.message);
        }
        return of(undefined);
    }

    private loadFromFolder(path): Observable<NeonConfig | undefined> {
        return this.http.get(path, {
            responseType: 'text',
            params: {
                rnd: `${Math.random() * 1000000}.${Date.now()}`
            }
        })
            .pipe(map((response: any) => yaml.load(response) as NeonConfig))
            .pipe(catchError((error) => this.handleConfigFileError(error)));
    }

    private takeFirstLoadedOrFetchDefault(all: (NeonConfig | null)[]) {
        const next = all.find((el) => !!el);
        if (next) {
            return of(next);
        }
        return this.list()
            .pipe(map(({ results: [remoteFirst] }) => remoteFirst));
    }

    private finalizeConfig(configInput: NeonConfig, filters: string, dashboardPath: string) {
        let config = configInput;

        if (!config) {
            console.error('Config is empty', config);
            this.configErrors.push('Config is empty!');
            config = NeonConfig.get();
        }

        if (this.configErrors.length) {
            config.errors = this.configErrors;
            this.configErrors = [];
        }

        let dash: NeonDashboardLeafConfig;

        ConfigUtil.nameDashboards(config.dashboards, config.fileName || '');

        // If dashboard path is provided, find the dashboard to activate
        if (dashboardPath) {
            const parts = dashboardPath.split('.').filter((key) => !!key);
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
    setActiveByURL(url: string, base: string | RegExp) {
        const urlObj = new URL(url);
        const [, fullPath] = urlObj.pathname.split(base);
        const [path] = fullPath.split('/').filter(x => !!x);
        const params = decodeURIComponent(urlObj.hash.replace(/^#/g, ''));
        const dashboardPath = urlObj.searchParams.get('path');
        const cleanPath = path.replace(/^[/]+/g, '');

        setTimeout(() => {
            from(cleanPath ? this.load(cleanPath) : throwError(null)).pipe(
                catchError((err) => this.getDefault(environment.config).pipe(
                    tap((conf) => {
                        conf.errors = [err ? err.message as string : err];
                    })
                )),
                map((config) => this.finalizeConfig(config, params, dashboardPath)),
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
    save(config: NeonConfig): Observable<void> {
        return from(new Promise<void>((resolve, reject) => {
            config.projectTitle = ConfigUtil.validateName(config.projectTitle);
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
                if (!(config.dashboards && config.datastores && config.layouts)) {
                    throw new Error(`${name} not loaded:  bad format`);
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
