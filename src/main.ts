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
import './polyfills.ts';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode, ReflectiveInjector, Injectable } from '@angular/core';
import {
    BaseRequestOptions,
    BaseResponseOptions,
    BrowserXhr,
    CookieXSRFStrategy,
    Http,
    RequestOptions,
    ResponseOptions,
    XHRBackend,
    XSRFStrategy
} from '@angular/http';
import { environment } from './environments/environment';
import { AppModule } from './app/app.module';
import * as yaml from 'js-yaml';
import * as neon from 'neon-framework';
import { HttpClient, HttpHandler, HttpXhrBackend, HttpBackend, XhrFactory, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class HttpBasicHandler implements HttpHandler {
    private backend: HttpBackend;

    constructor() {
        this.backend = new HttpXhrBackend(new BrowserXhr());
    }

    handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
        return this.backend.handle(req);
    }
}

const HTTP_PROVIDERS: any[] = [
    HttpClient,
    {provide: HttpHandler, useClass: HttpBasicHandler},
    HttpBasicHandler,
    {provide: HttpHandler, useExisting: HttpXhrBackend},
    HttpXhrBackend,
    {provide: HttpBackend, useExisting: HttpXhrBackend},
    BrowserXhr,
    {provide: XhrFactory, useExisting: BrowserXhr},
    {provide: Http, useFactory:
        (xhrBackend: XHRBackend, requestOptions: RequestOptions): Http =>
        new Http(xhrBackend, requestOptions),
        deps: [XHRBackend, RequestOptions]},
    BrowserXhr,
    {provide: RequestOptions, useClass: BaseRequestOptions},
    {provide: ResponseOptions, useClass: BaseResponseOptions},
    XHRBackend,
    {provide: XSRFStrategy, useFactory: () => new CookieXSRFStrategy()},
    XSRFStrategy,
    {provide: XSRFStrategy, useFactory: () => new NoCheckCookieXSRFStrategy()}
];

const EMPTY_CONFIG = {
    dashboard: {},
    help: {},
    datasets: [],
    layouts: {
        default: []
    },
    customFilters: {}
};

let neonConfigErrors = [];

if (environment.production) {
    enableProdMode();
}

// Since angular isn't bootstrapped, the platform browser isn't setup properly for cookies.
// Since we're not using them, mock the cookie provider
class NoCheckCookieXSRFStrategy extends CookieXSRFStrategy {
    configureRequest() {
        // Do nothing.
    }
}

let injector = ReflectiveInjector.resolveAndCreate(HTTP_PROVIDERS);
let httpClient = injector.get(HttpClient);

function handleConfigFileError(error, file) {
    if (error.status === 404) {
        // Fail silently.
    } else {
        console.error(error);
        showError('Error reading config file ' + file);
        showError(error.message);
    }
    return throwError(error);
}

function handleConfigPropertyServiceError(error) {
    if (error.message === 'No config') {
        // Do nothing, this is the expected response
    } else if (error.status === 404) {
        // Fail silently.
    } else {
        console.error(error);
        showError('Error reading Property Service config!');
        showError(error.message);
    }
    return throwError(error);
}

function loadConfigFromPropertyService() {
    return httpClient.get('../neon/services/propertyservice/config')
        .pipe(catchError(handleConfigPropertyServiceError))
        .toPromise();
}

function loadConfigJson(path) {
    return httpClient.get(path)
        .pipe(catchError(handleConfigFileError))
        .toPromise();
}

function loadConfigYaml(path) {
    return httpClient.get(path, {responseType: 'text'})
        .pipe(map((response: any) => yaml.load(response)))
        .pipe(catchError(handleConfigFileError))
        .toPromise();
}

function validateConfig(config) {
    if (config) {
        return config;
    } else {
        console.error('Config is empty', config);
        showError('Config is empty!');
        return EMPTY_CONFIG;
    }
}

function bootstrapWithData(configFromFile) {
    let configObject = validateConfig(configFromFile);
    if (configObject && configObject.neonServerUrl) {
        neon.setNeonServerUrl(configObject.neonServerUrl);
    }
    let errors = neonConfigErrors;
    neonConfigErrors = null;
    if (errors && errors.length > 0) {
        configObject.errors = errors;
    }
    /* tslint:disable:no-string-literal */
    window['appConfig'] = configObject;
    /* tslint:enable:no-string-literal */
    return platformBrowserDynamic().bootstrapModule(AppModule);
}

function showError(error) {
    if (!neonConfigErrors) {
        neonConfigErrors = [];
    }
    neonConfigErrors.push(error);
}

function loadNextConfig(configList) {
    if (!configList.length) {
        loadConfigFromPropertyService().then(bootstrapWithData, function(propertyError) {
            handleConfigPropertyServiceError(propertyError);
            showError('Cannot find an acceptable config file!');
            bootstrapWithData(EMPTY_CONFIG);
        });
        return;
    }

    let loadFunction = configList[0].substring(configList[0].lastIndexOf('.') + 1) === 'yaml' ? loadConfigYaml : loadConfigJson;
    loadFunction(configList[0]).then(bootstrapWithData, function(fileError) {
        handleConfigFileError(fileError, configList[0]);
        loadNextConfig(configList.slice(1));
    });
}

neon.ready(function() {
    neon.setNeonServerUrl('../neon');
    loadNextConfig(environment.config);
});
