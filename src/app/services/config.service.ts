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
import { HttpClient } from '@angular/common/http';
import * as neon from 'neon-framework';
import * as yaml from 'js-yaml';

import { environment } from '../../environments/environment';

import { ReplaySubject, Observable, combineLatest, of, from } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { NeonConfig } from '../model/types';
import { Injectable } from '@angular/core';
import { ConnectionService } from './connection.service';

@Injectable()
export class ConfigService {
    private configErrors = [];
    private source = new ReplaySubject<NeonConfig>(1);

    $source: Observable<NeonConfig>;

    static as(config: NeonConfig) {
        return new ConfigService(null, null).setActive(config);
    }

    constructor(
        private http: HttpClient,
        private connectionService: ConnectionService
    ) { }

    private openConnection() {
        return this.connectionService.connect('', '');
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
            .pipe(map((remoteAll) => remoteAll[0]));
    }

    private finalizeConfig(configInput: NeonConfig) {
        let config = configInput;
        if (config && config.neonServerUrl) {
            neon.setNeonServerUrl(config.neonServerUrl);
        }

        if (!config) {
            console.error('Config is empty', config);
            this.configErrors.push('Config is empty!');
            config = NeonConfig.get();
        }

        if (this.configErrors.length) {
            config.errors = this.configErrors;
            this.configErrors = [];
        }

        return config;
    }

    private getDefault(configList: string[]) {
        return combineLatest(...configList.map((config) => this.loadFromFolder(config)))
            .pipe(
                switchMap((configs: NeonConfig[]) => this.takeFirstLoadedOrFetchDefault(configs)),
                map((config) => this.finalizeConfig(config))
            );
    }

    private initSource() {
        if (!this.$source) {
            this.$source = this.source.asObservable().pipe(map((data) => JSON.parse(JSON.stringify(data))));
            return true;
        }
        return false;
    }

    setActive(config: NeonConfig) {
        this.initSource();
        this.source.next(config);
        return this;
    }

    getActive() {
        if (this.initSource()) {
            neon.setNeonServerUrl('../neon');
            this.getDefault(environment.config)
                .subscribe((el) => this.source.next(el));
        }
        return this.$source;
    }

    /**
     * Saves config under name
     */
    save(config: NeonConfig): Observable<void> {
        return from(new Promise<void>((resolve, reject) => {
            this.openConnection().saveState(config, resolve, reject);
        })).pipe(take(1));
    }

    /**
     * Loads the dashboard state with the given name.
     */
    load(name: string): Observable<NeonConfig> {
        return from(new Promise<NeonConfig>((resolve, reject) => {
            this.openConnection().loadState(name, resolve, reject);
        })).pipe(take(1));
    }

    /*
     * Deletes the state by name
     */
    delete(name: string) {
        return from(new Promise<void>((resolve, reject) => {
            this.openConnection().deleteState(name, resolve, reject);
        })).pipe(take(1));
    }

    /**
     * Get's list of available dashboard states.
     */
    list(limit = 100, offset = 0) {
        return from(new Promise<{ total: number, results: NeonConfig[] }>((resolve, reject) => {
            this.openConnection().listStates(limit, offset, resolve, reject);
        })).pipe(take(1));
    }
}
