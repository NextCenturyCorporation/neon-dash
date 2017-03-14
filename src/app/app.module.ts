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

import 'hammerjs';

import { NgGridModule } from 'angular2-grid';

import { ActiveGridService } from './services/active-grid.service';
import { ConnectionService } from './services/connection.service';
import { DatasetService } from './services/dataset.service';
import { ErrorNotificationService } from './services/error-notification.service';
import { ExportService } from './services/export.service';
import { FilterService } from './services/filter.service';
import { ImportService } from './services/import.service';
import { ParameterService } from './services/parameter.service';
import { ThemesService } from './services/themes.service';
import { TranslationService } from './services/translation.service';
import { VisualizationService } from './services/visualization.service';
import { ColorSchemeService } from './services/color-scheme.service';

import { NeonGTDConfig } from './neon-gtd-config';

import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { AppComponent } from './app.component';
import { DashboardOptionsComponent } from './components/dashboard-options/dashboard-options.component';
import { DatasetSelectorComponent } from './components/dataset-selector/dataset-selector.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { TextCloudComponent } from './components/text-cloud/text-cloud.component';
import { VisualizationInjectorComponent } from './components/visualization-injector/visualization-injector.component';
import { FilterTrayComponent } from  './components/filter-tray/filter-tray.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { MapComponent } from './components/map/map.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { LegendComponent } from './components/legend/legend.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { ChartModule } from 'angular2-chartjs';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

export function createAppModule(config: NeonGTDConfig) {
    @NgModule({
        declarations: [
            AppComponent,
            VisualizationContainerComponent,
            DatasetSelectorComponent,
            AboutNeonComponent,
            DashboardOptionsComponent,
            AddVisualizationComponent,
            TextCloudComponent,
            BarChartComponent,
            LineChartComponent,
            VisualizationInjectorComponent,
            FilterTrayComponent,
            LegendComponent,
            MapComponent,
            TimelineComponent,
            DataTableComponent
        ],
        imports: [
            BrowserModule,
            CommonModule,
            FormsModule,
            HttpModule,
            MaterialModule.forRoot(),
            NgGridModule,
            ChartModule,
            NgxDatatableModule
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            DatasetService,
            ErrorNotificationService,
            ExportService,
            FilterService,
            ImportService,
            ParameterService,
            ThemesService,
            TranslationService,
            VisualizationService,
            ColorSchemeService,
            {
              provide: 'config',
              useValue: config
            }
        ],
        entryComponents: [AppComponent, AddVisualizationComponent, FilterTrayComponent],
        bootstrap: [AppComponent]
    })
    class AppModule {

    }

    return AppModule;
}
