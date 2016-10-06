import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { MaterialModule } from '@angular/material';

import { NgGrid, NgGridItem } from 'angular2-grid';
import * as log4javascript from 'log4javascript';

import { ConnectionService } from './services/connection.service';
import { DatasetService } from './services/dataset.service';
import { ErrorNotificationService } from './services/error-notification.service';
import { FilterService } from './services/filter.service';
import { NeonGTDConfig } from './neon-gtd-config';
import { ParameterService } from './services/parameter.service';

import { AppComponent } from './app.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { DatasetSelectorComponent } from './components/dataset-selector/dataset-selector.component';
import { AboutNeonComponent } from './components/about-neon/about-neon.component';

export function createAppModule(config: NeonGTDConfig) {
@NgModule({
    declarations: [
        AppComponent,
        NgGrid,
        NgGridItem,
        VisualizationContainerComponent,
        DatasetSelectorComponent,
        AboutNeonComponent
    ],
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        HttpModule,
        MaterialModule.forRoot()
    ],
    providers: [
        ConnectionService,
        DatasetService,
        ErrorNotificationService,
        FilterService,
        ParameterService,
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
