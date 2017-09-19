/* tslint:disable:no-unused-variable */
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
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';

import 'hammerjs';

import { AppComponent } from './app.component';
import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { DashboardOptionsComponent } from './components/dashboard-options/dashboard-options.component';
import { DatasetSelectorComponent } from './components/dataset-selector/dataset-selector.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DocumentViewerComponent } from './components/document-viewer/document-viewer.component';
import { ExportControlComponent } from './components/export-control/export-control.component';
import { FilterBuilderComponent } from './components/filter-builder/filter-builder.component';
import { LegendComponent } from './components/legend/legend.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { MapComponent } from './components//map/map.component';
import { ScatterPlotComponent } from './components/scatter-plot/scatter-plot.component';
import { StackedTimelineComponent } from './components/stacked-timeline/stacked-timeline.component';
import { TextCloudComponent } from './components/text-cloud/text-cloud.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { VisualizationInjectorComponent } from './components/visualization-injector/visualization-injector.component';

import { NeonGTDConfig } from './neon-gtd-config';

import { ActiveGridService } from './services/active-grid.service';
import { DatasetService } from './services/dataset.service';
import { ConnectionService } from './services/connection.service';
import { ErrorNotificationService } from './services/error-notification.service';
import { ExportService } from './services/export.service';
import { FilterService } from './services/filter.service';

import { ParameterService } from './services/parameter.service';
import { ThemesService } from './services/themes.service';
import { VisualizationService } from './services/visualization.service';
import { ColorSchemeService } from './services/color-scheme.service';

import { NgGridModule } from 'angular2-grid';

import { ChartModule } from 'angular2-chartjs';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {AppMaterialModule} from './app.material.module';
import {HttpModule} from '@angular/http';
import {UnsharedFilterComponent} from './components/unshared-filter/unshared-filter.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

describe('App: NeonGtd', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let fixture: ComponentFixture<AppComponent>;
    let de: DebugElement;
    let component: AppComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
                AboutNeonComponent,
                BarChartComponent,
                DashboardOptionsComponent,
                DatasetSelectorComponent,
                DataTableComponent,
                DocumentViewerComponent,
                ExportControlComponent,
                FilterBuilderComponent,
                LegendComponent,
                LineChartComponent,
                MapComponent,
                ScatterPlotComponent,
                StackedTimelineComponent,
                TextCloudComponent,
                TimelineComponent,
                VisualizationContainerComponent,
                VisualizationInjectorComponent
            ],
            imports: [
                FormsModule,
                AppMaterialModule,
                NgGridModule,
                ChartModule,
                NgxDatatableModule,
                HttpModule,
                BrowserAnimationsModule
            ],
            providers: [
                { provide: 'config', useValue: testConfig },
                ActiveGridService,
                DatasetService,
                ConnectionService,
                ErrorNotificationService,
                ExportService,
                FilterService,
                ParameterService,
                ThemesService,
                VisualizationService,
                ColorSchemeService
            ]
        });

        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        de = fixture.debugElement;
    });

    afterEach(() => {
        fixture.detectChanges();
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));

    it('should include top level layout components', async(() => {
        expect(de.nativeElement.querySelectorAll('md-sidenav-container')).toBeTruthy();
        expect(de.nativeElement.querySelectorAll('app-dataset-selector')).toBeTruthy();
        // Since the about pane and options pane are rendered only after a user opens their sidenav area,
        // these should not exist upon initial render.
        expect(de.nativeElement.querySelectorAll('app-about-neon').length === 0).toBeTruthy();
        expect(de.nativeElement.querySelectorAll('app-dashboard-options').length === 0).toBeTruthy();
    }));
});
