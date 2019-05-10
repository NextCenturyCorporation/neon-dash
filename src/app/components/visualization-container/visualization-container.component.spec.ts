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
import { DataMessageComponent } from '../data-message/data-message.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LegendComponent } from '../legend/legend.component';
import { MapComponent } from '../map/map.component';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { NewsFeedComponent } from '../news-feed/news-feed.component';
import { NetworkGraphComponent } from '../network-graph/network-graph.component';
import { QueryBarComponent } from '../query-bar/query-bar.component';
import { SampleComponent } from '../sample/sample.component';
import { TaxonomyViewerComponent } from '../taxonomy-viewer/taxonomy-viewer.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { ThumbnailGridComponent } from '../thumbnail-grid/thumbnail-grid.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationContainerComponent } from './visualization-container.component';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';
import { WikiViewerComponent } from '../wiki-viewer/wiki-viewer.component';

import { DetailsThumbnailSubComponent } from '../thumbnail-grid/subcomponent.details-view';
import { TitleThumbnailSubComponent } from '../thumbnail-grid/subcomponent.title-view';
import { CardThumbnailSubComponent } from '../thumbnail-grid/subcomponent.card-view';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { MatAutocompleteModule } from '@angular/material';
import { TreeModule } from 'angular-tree-component';

describe('Component: VisualizationContainer', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: VisualizationContainerComponent;
    let fixture: ComponentFixture<VisualizationContainerComponent>;

    initializeTestBed('Visualization Container', {
        declarations: [
            AnnotationViewerComponent,
            AggregationComponent,
            CardThumbnailSubComponent,
            DataMessageComponent,
            DataTableComponent,
            DetailsThumbnailSubComponent,
            DocumentViewerComponent,
            FilterBuilderComponent,
            LegendComponent,
            MapComponent,
            MediaViewerComponent,
            NetworkGraphComponent,
            NewsFeedComponent,
            QueryBarComponent,
            SampleComponent,
            TaxonomyViewerComponent,
            TextCloudComponent,
            ThumbnailGridComponent,
            TimelineComponent,
            TitleThumbnailSubComponent,
            UnsharedFilterComponent,
            VisualizationContainerComponent,
            VisualizationInjectorComponent,
            WikiViewerComponent
        ],
        providers: [
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            MatAutocompleteModule,
            NgxDatatableModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            TreeModule.forRoot()
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
