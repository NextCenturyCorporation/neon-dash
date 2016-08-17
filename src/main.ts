///<reference path="../typings/globals/hammerjs/index.d.ts"/>
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode, provide, ReflectiveInjector } from '@angular/core';
import { CookieXSRFStrategy, HTTP_PROVIDERS, HttpModule, Http, Request, XSRFStrategy } from '@angular/http';
import { environment } from './app/environments/environment';
//import { FormsModule } from '@angular/forms';
import { AppModule } from './app/app.module';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';
import 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';

// Since angular isn't bootstrapped, the platform browser isn't setup properly for cookies.
// Since we're not using them, mock the cookie provider
class NoCheckCookieXSRFStrategy extends CookieXSRFStrategy {
  configureRequest(request: Request) {}
}

var injector = ReflectiveInjector.resolveAndCreate([HTTP_PROVIDERS, {
    provide: XSRFStrategy, 
    useValue: new NoCheckCookieXSRFStrategy()
}]);
var http = injector.get(Http);

function handleConfigJsonError(error) {
    console.log(error);
    console.log("missing json file.");
    document.write("Your Neon-GTD installation is missing a config.yaml or config.json file.  Please notify your administrator.");
}

function loadConfigJson() {
    return http.get("app/config/config.json")
        .map(response => response.json())
        .toPromise()
}

function handleConfigYamlError(error) {
    console.log(error);
    console.log("missing yaml file. trying json config.");
    return loadConfigJson().then(config => bootstrapWithData(config))
        .catch(handleConfigJsonError)
}

function loadConfigYaml() {
   return http.get("app/config/config.yaml")
       .map(response => yaml.load(response.text()))
       .toPromise()
}

function bootstrapWithData(config) {
    // var appMod = createAppModule(config);
    // console.log("appmodule = " + appMod);
    // return platformBrowserDynamic().bootstrapModule(appMod)
    return platformBrowserDynamic().bootstrapModule(AppModule, {
      providers: [provide('config', config)]
    });
}

if (environment.production) {
    enableProdMode();
}

loadConfigYaml().then(config => bootstrapWithData(config))
    .catch(handleConfigYamlError)
