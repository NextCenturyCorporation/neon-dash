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
import { Component, ComponentFactoryResolver, Input, ReflectiveInjector, ViewChild, ViewContainerRef } from '@angular/core';

import { AggregationComponent } from '../aggregation/aggregation.component';
import { AnnotationViewerComponent } from '../annotation-viewer/annotation-viewer.component';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { MapComponent } from '../map/map.component';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { NetworkGraphComponent } from '../network-graph/network-graph.component';
import { SampleComponent } from '../sample/sample.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';
import { TaxonomyViewerComponent } from '../taxonomy-viewer/taxonomy-viewer.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { WikiViewerComponent } from '../wiki-viewer/wiki-viewer.component';

import { NeonGridItem } from '../../neon-grid-item';
import { VisualizationService } from '../../services/visualization.service';
import { ThumbnailGridComponent } from '../thumbnail-grid/thumbnail-grid.component';
import { NewsFeedComponent } from '../news-feed/news-feed.component';
import { QueryBarComponent } from '../query-bar/query-bar.component';

@Component({
    selector: 'app-visualization-injector',
    entryComponents: [
        AggregationComponent,
        AnnotationViewerComponent,
        BarChartComponent,
        DataTableComponent,
        DocumentViewerComponent,
        FilterBuilderComponent,
        LineChartComponent,
        MapComponent,
        MediaViewerComponent,
        NetworkGraphComponent,
        NewsFeedComponent,
        QueryBarComponent,
        SampleComponent,
        ScatterPlotComponent,
        TaxonomyViewerComponent,
        TextCloudComponent,
        ThumbnailGridComponent,
        TimelineComponent,
        WikiViewerComponent
    ],
    template: `
        <div #dynamicComponentContainer></div>`
})
export class VisualizationInjectorComponent {
    currentComponent = null;

    @ViewChild('dynamicComponentContainer', {read: ViewContainerRef}) dynamicComponentContainer: ViewContainerRef;

    // component: Class for the component you want to create
    // inputs: An object with key/value pairs mapped to input name/input value
    @Input() set componentData(data: NeonGridItem) {
        if (!data) {
            return;
        }

        // Destroy the previously created component
        if (this.currentComponent) {
            this.currentComponent.destroy();
        }

        let visualizationComponent = this.findVisualizationComponent(data.type);

        if (visualizationComponent) {
            // Inputs need to be in the following format to be resolved properly
            let inputProviders = Object.keys(data.bindings || {}).map((bindingKey) => {
                return {
                    provide: bindingKey,
                    useValue: data.bindings[bindingKey]
                };
            });
            let resolvedInputs = ReflectiveInjector.resolve(inputProviders);

            // We create an injector out of the data we want to pass down and this components injector
            let injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.dynamicComponentContainer.parentInjector);

            // We create a factory out of the component we want to create
            let factory = this.resolver.resolveComponentFactory(visualizationComponent);

            // We create the component using the factory and the injector
            this.currentComponent = factory.create(injector);

            // We insert the component into the dom container
            this.dynamicComponentContainer.insert(this.currentComponent.hostView);

            // Try and get the ID of the child component
            if (this.currentComponent._component && this.currentComponent._component.id) {
                this.visualizationService.registerGridData(this.currentComponent._component.id, data);
            }
        }
    }

    constructor(private resolver: ComponentFactoryResolver, private visualizationService: VisualizationService) {
    }

    findVisualizationComponent(type: string): any {
        switch (type) {
            case 'aggregation':
                return AggregationComponent;
            case 'annotationViewer':
                return AnnotationViewerComponent;
            case 'barChart':
                return BarChartComponent;
            case 'dataTable':
                return DataTableComponent;
            case 'documentViewer':
                return DocumentViewerComponent;
            case 'filterBuilder':
                return FilterBuilderComponent;
            case 'lineChart':
                return LineChartComponent;
            case 'map':
                return MapComponent;
            case 'mediaViewer':
                return MediaViewerComponent;
            case 'networkGraph' :
                return NetworkGraphComponent;
            case 'newsFeed' :
                return NewsFeedComponent;
            case 'queryBar' :
                return QueryBarComponent;
            case 'sample':
                return SampleComponent;
            case 'scatterPlot':
                return ScatterPlotComponent;
            case 'taxonomyViewer':
                return TaxonomyViewerComponent;
            case 'textCloud':
                return TextCloudComponent;
            case 'thumbnailGrid':
                return ThumbnailGridComponent;
            case 'timeline':
                return TimelineComponent;
            case 'wikiViewer':
                return WikiViewerComponent;

            default:
                return null;
        }
    }

    onResizeStart() {
        if (this.currentComponent) {
            this.currentComponent.instance.onResizeStart();
        }
    }

    onResizeStop() {
        if (this.currentComponent) {
            this.currentComponent.instance.onResizeStop();
        }
    }
}
