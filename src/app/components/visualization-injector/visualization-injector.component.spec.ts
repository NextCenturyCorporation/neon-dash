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
import { TestBed, inject } from '@angular/core/testing';
import { ComponentFactoryResolver } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { AggregationComponent } from '../aggregation/aggregation.component';
import { AnnotationViewerComponent } from '../annotation-viewer/annotation-viewer.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LegendComponent } from '../legend/legend.component';
import { MapComponent } from '../map/map.component';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { NetworkGraphComponent } from '../network-graph/network-graph.component';
import { NewsFeedComponent } from '../news-feed/news-feed.component';
import { QueryBarComponent } from '../query-bar/query-bar.component';
import { SampleComponent } from '../sample/sample.component';
import { TaxonomyViewerComponent } from '../taxonomy-viewer/taxonomy-viewer.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { ThumbnailGridComponent } from '../thumbnail-grid/thumbnail-grid.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationInjectorComponent } from './visualization-injector.component';
import { WikiViewerComponent } from '../wiki-viewer/wiki-viewer.component';

import { DetailsThumbnailSubComponent } from '../thumbnail-grid/subcomponent.details-view';
import { TitleThumbnailSubComponent } from '../thumbnail-grid/subcomponent.title-view';
import { CardThumbnailSubComponent } from '../thumbnail-grid/subcomponent.card-view';

import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { MatAutocompleteModule } from '@angular/material';
import { TreeModule } from 'angular-tree-component';

describe('Component: VisualizationInjector', () => {

    initializeTestBed('Visualization Injector', {
        declarations: [
            AggregationComponent,
            AnnotationViewerComponent,
            CardThumbnailSubComponent,
            DataTableComponent,
            DetailsThumbnailSubComponent,
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
            TaxonomyViewerComponent,
            TextCloudComponent,
            ThumbnailGridComponent,
            TitleThumbnailSubComponent,
            TimelineComponent,
            UnsharedFilterComponent,
            VisualizationInjectorComponent,
            WikiViewerComponent
        ],
        providers: [ComponentFactoryResolver],
        imports: [
            AppMaterialModule,
            FormsModule,
            MatAutocompleteModule,
            NgxDatatableModule,
            NgxGraphModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            TreeModule.forRoot()
        ]
    });
});
