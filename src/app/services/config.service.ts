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

import { ReplaySubject, Observable, combineLatest, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { NeonGTDConfig } from '../neon-gtd-config';
import { Injectable } from '@angular/core';

const EMPTY_CONFIG = {
    dashboard: {},
    help: {},
    datasets: [],
    layouts: {
        default: []
    },
    customFilters: {}
};

let configErrors = [];

@Injectable()
export class ConfigService {

    private source = new ReplaySubject<NeonGTDConfig>(1);

    $source: Observable<NeonGTDConfig>;

    static as(config: NeonGTDConfig) {
        return new ConfigService(null).set(config);
    }

    constructor(private http: HttpClient) {

    }

    handleConfigFileError(error, file?: any) {
        if (error.status === 404) {
            // Fail silently.
        } else {
            console.error(error);
            configErrors.push('Error reading config file ' + file);
            configErrors.push(error.message);
        }
        return of(undefined);
    }

    handleConfigPropertyServiceError(error) {
        if (error.message === 'No config') {
            // Do nothing, this is the expected response
        } else if (error.status === 404) {
            // Fail silently.
        } else {
            console.error(error);
            configErrors.push('Error reading Property Service config!');
            configErrors.push(error.message);
        }
        return of(undefined);
    }

    loadConfigFromLocal(path): Observable<NeonGTDConfig | undefined> {
        return this.http.get(path, { responseType: 'text' })
            .pipe(map((response: any) => yaml.load(response) as NeonGTDConfig))
            .pipe(catchError((e) => this.handleConfigFileError(e)));
    }

    loadConfigFromPropertyService(): Observable<NeonGTDConfig | undefined> {
        return this.http.get<NeonGTDConfig | void>('../neon/services/propertyservice/config')
            .pipe(catchError((e) => this.handleConfigPropertyServiceError(e)));
    }

    takeFirstLoadedOrFetchDefault(all: (NeonGTDConfig | null)[]) {
        const next = all.find((el) => !!el);
        if (next) {
            return of(next);
        } else {
            return this.loadConfigFromPropertyService();
        }
    }

    finalizeConfig(c: NeonGTDConfig) {
        let config = c;
        if (config && config.neonServerUrl) {
            neon.setNeonServerUrl(config.neonServerUrl);
        }

        if (!config) {
            console.error('Config is empty', config);
            configErrors.push('Config is empty!');
            config = EMPTY_CONFIG as any as NeonGTDConfig;
        }

        if (configErrors.length) {
            config.errors = configErrors;
            configErrors = [];
        }

        return config;
    }

    fetchConfig(configList: string[]) {
        return combineLatest(...configList.map((c) => this.loadConfigFromLocal(c)))
            .pipe(
                switchMap(this.takeFirstLoadedOrFetchDefault.bind(this)),
                map(this.finalizeConfig.bind(this))
            ) as Observable<NeonGTDConfig>;
    }

    initSource() {
        if (!this.$source) {
            this.$source = this.source.asObservable().pipe(map((x) => JSON.parse(JSON.stringify(x))));
            return true;
        }
        return false;
    }

    set(config: NeonGTDConfig) {
        this.initSource();
        this.source.next(config);
        return this;
    }

    get() {
        if (this.initSource()) {
            neon.setNeonServerUrl('../neon');
            this.fetchConfig(environment.config)
                .subscribe((el) => this.source.next(el));
        }
        return this.$source;
    }
}
