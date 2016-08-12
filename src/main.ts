import { bootstrap } from '@angular/platform-browser-dynamic';
import { enableProdMode, provide, ReflectiveInjector } from '@angular/core';
import { CookieXSRFStrategy, HTTP_PROVIDERS, Http, Request, XSRFStrategy } from '@angular/http';
import { NeonGTDComponent, environment } from './app/';
import { disableDeprecatedForms, provideForms } from '@angular/forms';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';
import 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';

// Since angular isn't bootstrapped, the platform browser isn't setup properly for cookies.
// Since we're not using them, mock the cookie provider
class NoCheckCookieXSRFStrategy extends CookieXSRFStrategy {
  configureRequest(request: Request) {}
}

function handleConfigJsonError() {
    console.log("missing json file.");
    document.write("Your Neon-GTD installation is missing a config.yaml or config.json file.  Please notify your administrator.");
}

function loadConfigJson() {
    return http.get("./config/config.json")
        .map(response => response.json().data)
        .toPromise()
}

function handleConfigYamlError() {
    console.log("missing yaml file. trying json config.");
    loadConfigJson().then(config => bootstrapWithData(config))
        .catch(handleConfigJsonError)
}

function loadConfigYaml() {
   return http.get("./config/config.yaml")
       .map(response => yaml.load(response.json().data))
       .toPromise()
}

function bootstrapWithData(config) {
    bootstrap(NeonGTDComponent, [
        HTTP_PROVIDERS,
        disableDeprecatedForms(),
        provideForms(),
        provide('config', config)
    ]);
};

var injector = ReflectiveInjector.resolveAndCreate([HTTP_PROVIDERS, {
    provide: XSRFStrategy, 
    useValue: new NoCheckCookieXSRFStrategy()
}]);
var http = injector.get(Http);

if (environment.production) {
    enableProdMode();
}

loadConfigYaml().then(config => bootstrapWithData(config))
    .catch(handleConfigYamlError)
