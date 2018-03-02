var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { enableProdMode, ReflectiveInjector } from '@angular/core';
import { BaseRequestOptions, BaseResponseOptions, BrowserXhr, CookieXSRFStrategy, Http, RequestOptions, ResponseOptions, XHRBackend, XSRFStrategy } from '@angular/http';
import { environment } from './environments/environment';
import { AppModule } from './app/app.module';
import * as yaml from 'js-yaml';
import * as neon from 'neon-framework';
import 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
var HTTP_PROVIDERS = [
    { provide: Http, useFactory: function (xhrBackend, requestOptions) {
            return new Http(xhrBackend, requestOptions);
        },
        deps: [XHRBackend, RequestOptions] },
    BrowserXhr,
    { provide: RequestOptions, useClass: BaseRequestOptions },
    { provide: ResponseOptions, useClass: BaseResponseOptions },
    XHRBackend,
    { provide: XSRFStrategy, useFactory: function () { return new CookieXSRFStrategy(); } }
];
var EMPTY_CONFIG = {
    dashboard: {},
    help: {},
    datasets: [],
    layouts: {
        default: []
    },
    customFilters: {}
};
var neonConfigErrors = [];
if (environment.production) {
    enableProdMode();
}
// Since angular isn't bootstrapped, the platform browser isn't setup properly for cookies.
// Since we're not using them, mock the cookie provider
var NoCheckCookieXSRFStrategy = /** @class */ (function (_super) {
    __extends(NoCheckCookieXSRFStrategy, _super);
    function NoCheckCookieXSRFStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NoCheckCookieXSRFStrategy.prototype.configureRequest = function () {
        // Do nothing.
    };
    return NoCheckCookieXSRFStrategy;
}(CookieXSRFStrategy));
var injector = ReflectiveInjector.resolveAndCreate([HTTP_PROVIDERS, {
        provide: XSRFStrategy,
        useValue: new NoCheckCookieXSRFStrategy()
    }]);
var http = injector.get(Http);
function handleConfigJsonError(error) {
    if (isErrorNotFound(error, 'json')) {
        console.error(error);
        console.error('missing json file.');
    }
    else {
        console.error(error);
        showError('Error reading config.json: ' + error.message);
    }
    showError('Cannot find valid config.yaml or config.json.');
    bootstrapWithData(EMPTY_CONFIG);
}
function loadConfigJson() {
    return http.get('./app/config/config.json')
        .map(function (response) { return response.json(); })
        .toPromise();
}
function isErrorNotFound(error, fileType) {
    // TODO could add other server errors
    return error.status === 404;
}
function handleConfigYamlError(error) {
    if (isErrorNotFound(error, 'yaml')) {
        console.error(error);
        console.error('missing yaml file. trying json config.');
    }
    else {
        console.error(error);
        showError('Error reading config.yaml: ' + error.message);
    }
}
function loadConfigFromPropertyService() {
    return http.get('../neon/services/propertyservice/config')
        .map(function (response) {
        var val = response.json().value;
        if (!val) {
            throw new Error('No config');
        }
        return JSON.parse(val);
    })
        .toPromise();
}
function handleConfigPropertyServiceError(error) {
    if (error.message === 'No config') {
        // Do nothing, this is the expected response
    }
    else if (isErrorNotFound(error, 'Property Service')) {
        console.error(error);
        console.error('missing config from Property Service. Trying yaml config.');
    }
    else {
        console.error(error);
        showError('Error reading Property Service config: ' + error.message);
    }
}
function loadConfigYaml() {
    return http.get('./app/config/config.yaml')
        .map(function (response) { return yaml.load(response.text()); })
        .toPromise();
}
function validateConfig(config) {
    if (config) {
        return config;
    }
    else {
        showError('Config from config.yaml or config.json is empty');
        console.error('Config appears to be empty');
        console.error(config);
        return EMPTY_CONFIG;
    }
}
function bootstrapWithData(configFromFile) {
    var configObject = validateConfig(configFromFile);
    var errors = neonConfigErrors;
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
neon.ready(function () {
    neon.setNeonServerUrl('../neon');
    var config;
    config = loadConfigYaml().then(bootstrapWithData, function (error) {
        handleConfigYamlError(error);
        loadConfigJson().then(bootstrapWithData, function (error2) {
            handleConfigJsonError(error2);
            loadConfigFromPropertyService().then(bootstrapWithData, handleConfigPropertyServiceError);
        });
    });
});
//# sourceMappingURL=main.js.map