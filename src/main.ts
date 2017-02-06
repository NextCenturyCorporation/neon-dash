
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
import { environment } from './app/environments/environment';
import { createAppModule } from './app/app.module';
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
    console.log(error);
    console.log('missing json file.');
    document.write('Your Neon-GTD installation may be missing a configuration file.  Please notify your administrator.');
}

function loadConfigJson() {
    return http.get('./app/config/config.json')
        .map(response => response.json())
        .toPromise();
}

function handleConfigYamlError(error) {
    console.log(error);
    console.log('missing yaml file. trying json config.');
    return loadConfigJson().then(config => bootstrapWithData(config))
        .catch(handleConfigJsonError);
}

function loadConfigYaml() {
   return http.get('./app/config/config.yaml')
       .map(response => yaml.load(response.text()))
       .toPromise();
}

function bootstrapWithData(config) {
    return platformBrowserDynamic().bootstrapModule(createAppModule(config));
}

if (environment.production) {
    enableProdMode();
}

neon.ready(function() {
  neon.setNeonServerUrl('http://localhost:4200/neon');
  loadConfigYaml().then(config => bootstrapWithData(config))
    .catch(handleConfigYamlError);
});

