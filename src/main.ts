
import './polyfills.ts';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode, ReflectiveInjector } from '@angular/core';
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
import 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';

const HTTP_PROVIDERS = [
    {provide: Http, useFactory:
      (xhrBackend: XHRBackend, requestOptions: RequestOptions): Http =>
          new Http(xhrBackend, requestOptions),
          deps: [XHRBackend, RequestOptions]},
    BrowserXhr,
    {provide: RequestOptions, useClass: BaseRequestOptions},
    {provide: ResponseOptions, useClass: BaseResponseOptions},
    XHRBackend,
    {provide: XSRFStrategy, useFactory: () => new CookieXSRFStrategy()},
];

const EMPTY_CONFIG = {
  'dashboard': {},
  'help': {},
  'datasets': [],
  'layouts': {
      'default': []
  },
  'customFilters': {}
};

let neonConfigErrors = [];

if (environment.production) {
    enableProdMode();
}

// Since angular isn't bootstrapped, the platform browser isn't setup properly for cookies.
// Since we're not using them, mock the cookie provider
class NoCheckCookieXSRFStrategy extends CookieXSRFStrategy {
  configureRequest() {}
}

let injector = ReflectiveInjector.resolveAndCreate([HTTP_PROVIDERS, {
    provide: XSRFStrategy,
    useValue: new NoCheckCookieXSRFStrategy()
}]);
let http = injector.get(Http);

function handleConfigJsonError(error) {
    if (isErrorNotFound(error, 'json')) {
        console.log(error);
        console.log('missing json file.');
    } else {
        console.log(error);
        showError('Error reading config.json: ' + error.message);
        //document.write('Error in json file.  See browser console for more details');
    }
    showError('Cannot find valid config.yaml or config.json.');
    bootstrapWithData(EMPTY_CONFIG);
}

function loadConfigJson() {
    return http.get('./app/config/config.json')
        .map(response => response.json())
        .toPromise();
}

function isErrorNotFound(error, fileType) {
    //TODO could add other server errors
    return error.status === 404;
}

function handleConfigYamlError(error) {
    if (isErrorNotFound(error, 'yaml')) {
        console.log(error);
        console.log('missing yaml file. trying json config.');
    } else {
        console.log(error);
        showError('Error reading config.yaml: ' + error.message);
    }
}

function loadConfigFromPropertyService() {
    return http.get('../neon/services/propertyservice/config')
        .map((response) => {
            let val = response.json().value;
            if (!val) {
              throw new Error('No config');
            }
            return JSON.parse(val);
          })
        .toPromise();
}

function handleConfigPropertyServiceError(error) {
    if (error.message === 'No config') {
        //Do nothing, this is the expected response
    } else if (isErrorNotFound(error, 'Property Service')) {
        console.log(error);
        console.log('missing config from Property Service. Trying yaml config.');
    } else {
        console.log(error);
        showError('Error reading Property Service config: ' + error.message);
    }
}

function loadConfigYaml() {
   return http.get('./app/config/config.yaml')
       .map(response => yaml.load(response.text()))
       .toPromise();
}

function validateConfig(config) {
    if (config) {
        /*if (!config.datasets) {
            showError('Config is missing \'datasets\' property');
            console.log('Config is missing \'datasets\' property');
            console.log(config);
            config.datasets = [];
        }*/
        return config;
    } else {
        showError('Config from config.yaml or config.json is empty');
        console.log('Config appears to be empty');
        console.log(config);
        return EMPTY_CONFIG;
    }
}

function bootstrapWithData(config) {
  config = validateConfig(config);
  let errors = neonConfigErrors;
  neonConfigErrors = null;
  if (errors && errors.length > 0) {
      config.errors = errors;
  }
  window['appConfig'] = config;
  return platformBrowserDynamic().bootstrapModule(AppModule);
}

function showError(error) {
    if (!neonConfigErrors) {
        neonConfigErrors = [];
    }
    neonConfigErrors.push(error);
}

neon.ready(function() {
  neon.setNeonServerUrl('../neon');
  let config;
  config = loadConfigYaml().then(conf => bootstrapWithData(conf), function(error) {
    handleConfigYamlError(error);
    loadConfigJson().then(conf => bootstrapWithData(conf), function(error2) {
      handleConfigJsonError(error2);
      loadConfigFromPropertyService().then(conf => bootstrapWithData(conf), error3 => handleConfigPropertyServiceError);
    });
  });
});
