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
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { AggregationComponent } from '../aggregation/aggregation.component';
import { AnnotationViewerComponent } from '../annotation-viewer/annotation-viewer.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LegendComponent } from '../legend/legend.component';
import { MapComponent } from '../map/map.component';
import { NetworkGraphComponent } from '../network-graph/network-graph.component';
import { SampleComponent } from '../sample/sample.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationContainerComponent } from './visualization-container.component';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';
import { WikiViewerComponent } from '../wiki-viewer/wiki-viewer.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { VisualizationService } from '../../services/visualization.service';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { ThumbnailGridComponent } from '../thumbnail-grid/thumbnail-grid.component';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { NewsFeedComponent } from '../news-feed/news-feed.component';
import { QueryBarComponent } from '../query-bar/query-bar.component';
import { ThumbnailDetailsContractedComponent, ThumbnailDetailsExpandedComponent } from '../thumbnail-grid/thumbnail-details.component';
import { MatAutocompleteModule } from '@angular/material';

describe('Component: VisualizationContainer', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: VisualizationContainerComponent;
    let fixture: ComponentFixture<VisualizationContainerComponent>;

    initializeTestBed({
        declarations: [
            AnnotationViewerComponent,
            AggregationComponent,
            DataTableComponent,
            DocumentViewerComponent,
            ExportControlComponent,
            FilterBuilderComponent,
            LegendComponent,
            MapComponent,
            MediaViewerComponent,
            NetworkGraphComponent,
            NewsFeedComponent,
            QueryBarComponent,
            SampleComponent,
            TextCloudComponent,
            ThumbnailDetailsContractedComponent,
            ThumbnailDetailsExpandedComponent,
            ThumbnailGridComponent,
            ThumbnailDetailsContractedComponent,
            ThumbnailDetailsExpandedComponent,
            UnsharedFilterComponent,
            VisualizationContainerComponent,
            VisualizationInjectorComponent,
            WikiViewerComponent
        ],
        providers: [
            ActiveGridService,
            VisualizationService,
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            MatAutocompleteModule,
            NgxDatatableModule,
            NgxGraphModule,
            BrowserAnimationsModule,
            ReactiveFormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VisualizationContainerComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));
});
