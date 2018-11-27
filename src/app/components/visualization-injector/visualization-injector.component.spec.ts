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
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LegendComponent } from '../legend/legend.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { MapComponent } from '../map/map.component';
import { NetworkGraphComponent } from '../network-graph/network-graph.component';
import { SampleComponent } from '../sample/sample.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';
import { TabsComponent } from '../tabs/tabs.component';
import { TaxonomyViewerComponent } from '../taxonomy-viewer/taxonomy-viewer.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationInjectorComponent } from './visualization-injector.component';
import { WikiViewerComponent } from '../wiki-viewer/wiki-viewer.component';

import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { VisualizationService } from '../../services/visualization.service';
import { ChartComponent } from '../chart/chart.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { ThumbnailGridComponent } from '../thumbnail-grid/thumbnail-grid.component';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { NewsFeedComponent } from '../news-feed/news-feed.component';
import { QueryBarComponent } from '../query-bar/query-bar.component';
import { TitleThumbnailSubComponent,
    DetailsThumbnailSubComponent,
    CardThumbnailSubComponent
} from '../thumbnail-grid/thumbnail-details.component';
import { MatAutocompleteModule } from '@angular/material';
import { TreeModule } from 'angular-tree-component';

describe('Component: VisualizationInjector', () => {

    initializeTestBed({
        declarations: [
            AggregationComponent,
            AnnotationViewerComponent,
            BarChartComponent,
            ChartComponent,
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
            ScatterPlotComponent,
            TabsComponent,
            TaxonomyViewerComponent,
            TextCloudComponent,
            CardThumbnailSubComponent,
            TitleThumbnailSubComponent,
            DetailsThumbnailSubComponent,
            ThumbnailGridComponent,
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

    it('should create an instance', inject([ComponentFactoryResolver],
        (resolver: ComponentFactoryResolver) => {
        let component = new VisualizationInjectorComponent(resolver, new VisualizationService());
        expect(component).toBeTruthy();
    }));
});
