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
import { DatasetServiceMock } from '../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../testUtils/MockServices/FilterServiceMock';
import * as neon from 'neon-framework';

describe('App: NeonGtd', () => {
    let fixture: ComponentFixture<AppComponent>,
        getService = (type: any) => fixture.debugElement.injector.get(type);
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
                { provide: DatasetService, useClass: DatasetServiceMock },
                { provide: FilterService, useClass: FilterServiceMock },
                ActiveGridService,
                ConnectionService,
                ErrorNotificationService,
                ExportService,
                ParameterService,
                ThemesService,
                VisualizationService,
                ColorSchemeService
            ]
        });

        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        debugElement = fixture.debugElement;
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

    it('should be showing the correct defaults', async(() => {
        expect(component.currentPanel).toEqual('dashboardLayouts');
        expect(component.rightPanelTitle).toEqual('Dashboard Layouts');

        expect(component.showCustomConnectionButton).toEqual(true);
        expect(component.showFilterBuilderIcon).toEqual(true);
        expect(component.showFilterTrayButton).toEqual(true);
        expect(component.showSimpleSearch).toEqual(true);
        expect(component.showVisShortcut).toEqual(true);

        expect(component.createFilterBuilder).toEqual(false);
    }));

    it('should be showing correct filter builder icons', async(() => {
        expect(component.filterBuilderIcon).toEqual('filter_builder');
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterField');
        fixture.detectChanges();
        expect(component.filterBuilderIcon).toEqual('filter_builder_active');
    }));

    it('should correctly toggle the panels', async(() => {
        component.setPanel('aboutNeon', 'About Neon');
        expect(component.currentPanel).toEqual('aboutNeon');
        expect(component.rightPanelTitle).toEqual('About Neon');

        component.setPanel('addVis', 'Visualization');
        expect(component.currentPanel).toEqual('addVis');
        expect(component.rightPanelTitle).toEqual('Visualization');

        component.setPanel('dashboardLayouts', 'Dashboard Layouts');
        expect(component.currentPanel).toEqual('dashboardLayouts');
        expect(component.rightPanelTitle).toEqual('Dashboard Layouts');

        component.setPanel('saveState', 'Save States');
        expect(component.currentPanel).toEqual('saveState');
        expect(component.rightPanelTitle).toEqual('Save States');

        component.setPanel('settings', 'Settings');
        expect(component.currentPanel).toEqual('settings');
        expect(component.rightPanelTitle).toEqual('Settings');

    }));

    it('toggle filter builder', async(() => {
        component.showFilterBuilderIcon = false;
        expect(debugElement.nativeElement.querySelectorAll('app-filter-builder').length === 0).toBeTruthy();
        component.showFilterBuilderIcon = true;
        component.createFilterBuilder = true;
        component.openFilterBuilderDialog();
        expect(debugElement.nativeElement.querySelectorAll('app-filter-builder')).toBeTruthy();
    }));

    it('check that the messagenger subscribes to the correct channels and that the callbacks update the correct booleans', async(() => {
        let spyOnMessengerSubscribe = spyOn(component.messenger, 'subscribe');
        let spyOnBindShowFilterBuilderIcon = spyOn(component, 'bindShowFilterBuilderIcon');
        let spyOnBingShowSimpleSearch = spyOn(component, 'bindShowSimpleSearch');
        let spyOnBingShowVisualShortcut = spyOn(component, 'bindShowVisShortcut');
        let message = {
            showFilterBuilderIcon: false,
            showSimpleSearch: false,
            showVisShortcut: false
        };

        component.ngOnInit();
        expect(spyOnMessengerSubscribe.calls.count()).toEqual(3);
        component.bindShowSimpleSearch(message);
        component.bindShowVisShortcut(message);
        component.bindShowFilterBuilderIcon(message);

        expect(spyOnBindShowFilterBuilderIcon.calls.count()).toEqual(1);
        expect(spyOnBingShowSimpleSearch.calls.count()).toEqual(1);
        expect(spyOnBingShowVisualShortcut.calls.count()).toEqual(1);
    }));
});
