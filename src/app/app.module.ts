import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule, HTTP_PROVIDERS } from '@angular/http';

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

import { NgGrid, NgGridItem } from 'angular2-grid/dist/main.js';
import * as log4javascript from 'log4javascript';

import { DatasetService } from './services/dataset.service';
import { NeonGTDConfig } from './neon-gtd-config';

import { AppComponent } from './app.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { DatasetSelectorComponent } from './components/dataset-selector/dataset-selector.component';

export function createAppModule(config: NeonGTDConfig) {
@NgModule({
    declarations: [
        AppComponent,
        NgGrid,
        NgGridItem,
        VisualizationContainerComponent,
        DatasetSelectorComponent
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
