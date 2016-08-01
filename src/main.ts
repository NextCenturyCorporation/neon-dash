import { bootstrap } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { HTTP_PROVIDERS } from '@angular/http';
import { NeonGTD, environment } from './app/';
import { disableDeprecatedForms, provideForms } from '@angular/forms'; 

if (environment.production) {
    enableProdMode();
}

bootstrap(NeonGTD, [
    HTTP_PROVIDERS,
    disableDeprecatedForms(),
    provideForms()
]);
