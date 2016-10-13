/*
 * Copyright 2016 Next Century Corporation
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
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { MaterialModule } from '@angular/material';

import { NgGridModule } from 'angular2-grid';
import * as log4javascript from 'log4javascript';

import { ActiveGridService } from './services/active-grid.service';
import { ConnectionService } from './services/connection.service';
import { DatasetService } from './services/dataset.service';
import { ErrorNotificationService } from './services/error-notification.service';
import { ExportService } from './services/export.service';
import { FilterService } from './services/filter.service';
import { NeonGTDConfig } from './neon-gtd-config';
import { ParameterService } from './services/parameter.service';
import { ThemesService } from './services/themes.service';

import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { AppComponent } from './app.component';
import { DashboardOptionsComponent } from './components/dashboard-options/dashboard-options.component';
import { DatasetSelectorComponent } from './components/dataset-selector/dataset-selector.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';

export function createAppModule(config: NeonGTDConfig) {
@NgModule({
    declarations: [
        AppComponent,
        VisualizationContainerComponent,
        DatasetSelectorComponent,
        AboutNeonComponent,
        DashboardOptionsComponent
    ],
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        HttpModule,
        MaterialModule.forRoot(),
        NgGridModule
    ],
    providers: [
        ActiveGridService,
        ConnectionService,
        DatasetService,
        ErrorNotificationService,
        ExportService,
        FilterService,
        ParameterService,
        ThemesService,
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
