// import { environment } from './environments/environment';
import { NgModule, ApplicationRef } from '@angular/core';
// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode, provide } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule, HTTP_PROVIDERS } from '@angular/http';

import { MdButtonModule } from '@angular2-material/button';
import { MdCoreModule } from '@angular2-material/core';
import { MdCardModule } from '@angular2-material/card';
import { MdCheckboxModule } from '@angular2-material/checkbox';
import { MdIconModule } from '@angular2-material/icon';
import { MdInputModule } from '@angular2-material/input';
import { MdListModule } from '@angular2-material/list';
import { MdMenuModule } from '@angular2-material/menu';
import { MdProgressCircleModule } from '@angular2-material/progress-circle';
import { MdRadioModule } from '@angular2-material/radio';
import { MdSidenavModule } from '@angular2-material/sidenav';
import { MdTabsModule } from '@angular2-material/tabs';
import { MdToolbarModule } from '@angular2-material/toolbar';

import { DatasetService } from './services/dataset.service';
import { NeonGTDConfig } from './neon-gtd-config';

import { AppComponent } from './app.component';

export function createAppModule(config) {
@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        HttpModule,
        MdButtonModule,
        MdCoreModule,
        MdCardModule,
        MdCheckboxModule,
        MdIconModule,
        MdInputModule,
        MdListModule,
        MdMenuModule,
        MdProgressCircleModule,
        MdRadioModule,
        MdSidenavModule,
        MdTabsModule,
        MdToolbarModule
    ],
    providers: [
        HTTP_PROVIDERS, 
        DatasetService,
        {
          provide: 'config',
          useValue: config
        }
    ],
    entryComponents: [AppComponent],
    bootstrap: [AppComponent]
})
class AppModule {

}

return AppModule;
}