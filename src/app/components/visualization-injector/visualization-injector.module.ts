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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizationInjectorComponent } from './visualization-injector.component';
import { AggregationModule } from '../aggregation/aggregation.module';
import { AnnotationViewerModule } from '../annotation-viewer/annotation-viewer.module';
import { DataTableModule } from '../data-table/data-table.module';
import { DocumentViewerModule } from '../document-viewer/document-viewer.module';
import { FilterBuilderModule } from '../filter-builder/filter-builder.module';
import { MapModule } from '../map/map.module';
import { MediaViewerModule } from '../media-viewer/media-viewer.module';
import { NetworkGraphModule } from '../network-graph/network-graph.module';
import { NewsFeedModule } from '../news-feed/news-feed.module';
import { QueryBarModule } from '../query-bar/query-bar.module';
import { TaxonomyViewerModule } from '../taxonomy-viewer/taxonomy-viewer.module';
import { TextCloudModule } from '../text-cloud/text-cloud.module';
import { ThumbnailGridModule } from '../thumbnail-grid/thumbnail-grid.module';
import { TimelineModule } from '../timeline/timeline.module';
import { WikiViewerModule } from '../wiki-viewer/wiki-viewer.module';

@NgModule({
  declarations: [VisualizationInjectorComponent],
  exports: [VisualizationInjectorComponent],
  imports: [
    AggregationModule,
    AnnotationViewerModule,
    DataTableModule,
    DocumentViewerModule,
    FilterBuilderModule,
    MapModule,
    MediaViewerModule,
    NetworkGraphModule,
    NewsFeedModule,
    QueryBarModule,
    TaxonomyViewerModule,
    TextCloudModule,
    ThumbnailGridModule,
    TimelineModule,
    WikiViewerModule,
    CommonModule
  ]
})
export class VisualizationInjectorModule { }
