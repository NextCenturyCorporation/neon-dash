/*
 * Copyright 2017 Next Century Corporation
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
import { DebugElement, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APP_BASE_HREF, CommonModule } from '@angular/common';

import 'hammerjs';

import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { AppComponent } from './app.component';
import { AnnotationViewerComponent } from './components/annotation-viewer/annotation-viewer.component';
import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { AggregationComponent } from './components/aggregation/aggregation.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { DatasetSelectorComponent } from './components/dataset-selector/dataset-selector.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DocumentViewerComponent } from './components/document-viewer/document-viewer.component';
import { ExportControlComponent } from './components/export-control/export-control.component';
import { FilterBuilderComponent } from './components/filter-builder/filter-builder.component';
import { LegendComponent } from './components/legend/legend.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { MapComponent } from './components//map/map.component';
import { SampleComponent } from './components/sample/sample.component';
import { SaveStateComponent } from './components/save-state/save-state.component';
import { ScatterPlotComponent } from './components/scatter-plot/scatter-plot.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TextCloudComponent } from './components/text-cloud/text-cloud.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { UnsharedFilterComponent } from './components/unshared-filter/unshared-filter.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { VisualizationInjectorComponent } from './components/visualization-injector/visualization-injector.component';
import { WikiViewerComponent } from './components/wiki-viewer/wiki-viewer.component';

import { NeonGTDConfig } from './neon-gtd-config';

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

import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { AppMaterialModule } from './app.material.module';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleFilterComponent } from './components/simple-filter/simple-filter.component';
import { ChartComponent } from './components/chart/chart.component';
import { NetworkGraphComponent } from './components/network-graph/network-graph.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MediaViewerComponent } from './components/media-viewer/media-viewer.component';
import { ThumbnailGridComponent } from './components/thumbnail-grid/thumbnail-grid.component';
import { NewsFeedComponent } from './components/news-feed/news-feed.component';
import { MatAutocompleteModule } from '@angular/material';
import { QueryBarComponent } from './components/query-bar/query-bar.component';
import {
    ThumbnailDetailsContractedComponent,
    ThumbnailDetailsExpandedComponent
} from './components/thumbnail-grid/thumbnail-details.component';

describe('App: NeonGtd', () => {
    let fixture: ComponentFixture<AppComponent>;
    let debugElement: DebugElement;
    let component: AppComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChartComponent,
                AddVisualizationComponent,
                AppComponent,
                AboutNeonComponent,
                AggregationComponent,
                AnnotationViewerComponent,
                BarChartComponent,
                ChartComponent,
                DatasetSelectorComponent,
                DataTableComponent,
                DocumentViewerComponent,
                ExportControlComponent,
                FilterBuilderComponent,
                LegendComponent,
                LineChartComponent,
                MapComponent,
                MediaViewerComponent,
                NetworkGraphComponent,
                NewsFeedComponent,
                QueryBarComponent,
                SampleComponent,
                SaveStateComponent,
                ScatterPlotComponent,
                SettingsComponent,
                SimpleFilterComponent,
                TextCloudComponent,
                ThumbnailDetailsContractedComponent,
                ThumbnailDetailsExpandedComponent,
                ThumbnailGridComponent,
                TimelineComponent,
                UnsharedFilterComponent,
                VisualizationContainerComponent,
                VisualizationInjectorComponent,
                WikiViewerComponent
            ],
            imports: [
                FormsModule,
                AppMaterialModule,
                MatAutocompleteModule,
                NgxChartsModule,
                NgGridModule,
                NgxGraphModule,
                NgxDatatableModule,
                HttpModule,
                HttpClientModule,
                BrowserAnimationsModule,
                ReactiveFormsModule
            ],
            providers: [
                { provide: 'config', useValue: new NeonGTDConfig() },
                { provide: APP_BASE_HREF, useValue: '/' },
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
        debugElement = fixture.debugElement;
        component = fixture.componentInstance;
    });

    afterEach(() => {
        fixture.detectChanges();
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));

    it('should include top level layout components', async(() => {
        expect(debugElement.nativeElement.querySelectorAll('mat-sidenav-container')).toBeTruthy();
        expect(debugElement.nativeElement.querySelectorAll('app-dataset-selector')).toBeTruthy();
        // Since the about pane and options pane are rendered only after a user opens their sidenav area,
        // these should not exist upon initial render.
        expect(debugElement.nativeElement.querySelectorAll('app-right-panel').length === 0).toBeTruthy();
    }));

    it('addWidget does add the given widget with specified position to the grid', async(() => {
        // TODO
    }));

    it('addWidget does set the position of the given widget with unspecified position and add it to the end of the grid', async(() => {
        // TODO
    }));

    it('addWidget does set the position of the given widget with unspecified position and add it to the middle of the grid', async(() => {
        // TODO
    }));

    it('clearDashboard does delete all elements from the grid', async(() => {
        // TODO
    }));

    it('contractWidget does update the size and position of the given widget to its previous config', async(() => {
        // TODO
    }));

    it('deleteWidget does delete the widget from the grid', async(() => {
        // TODO
    }));

    it('expandWidget does update the size and position of the given widget and save its previous config', async(() => {
        // TODO
    }));

    it('getMaxColInUse does return expected number', async(() => {
        // TODO
    }));

    it('getMaxRowInUse does return expected number', async(() => {
        // TODO
    }));

    it('moveWidgetToBottom does update the row of the given widget', async(() => {
        // TODO
    }));

    it('moveWidgetToTop does update the row of the given widget', async(() => {
        // TODO
    }));

    it('refreshDashboard does resize the grid', async(() => {
        // TODO
    }));

    it('registerWidget does update the global collection of widgets', async(() => {
        // TODO
    }));

    it('unregisterWidget does update the global collection of widgets', async(() => {
        // TODO
    }));

    it('widgetFits does return expected boolean', async(() => {
        // TODO
    }));

    it('widgetOverlaps does return expected boolean', async(() => {
        // TODO
    }));
});
