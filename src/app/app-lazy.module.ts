/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
 */
import { NgModule } from '@angular/core';
import { ReactiveComponentLoaderModule } from '@wishtack/reactive-component-loader';

@NgModule({
    exports: [
        ReactiveComponentLoaderModule
    ],
    imports: [
        ReactiveComponentLoaderModule.forRoot(),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'aggregation',
            loadChildren: './components/aggregation/aggregation.module#AggregationModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'annotation',
            loadChildren: './components/annotation/annotation.module#AnnotationModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'annotation-viewer',
            loadChildren: './components/annotation-viewer/annotation-viewer.module#AnnotationViewerModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'data-table',
            loadChildren: './components/data-table/data-table.module#DataTableModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'document-viewer',
            loadChildren: './components/document-viewer/document-viewer.module#DocumentViewerModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'filter-builder',
            loadChildren: './components/filter-builder/filter-builder.module#FilterBuilderModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'map',
            loadChildren: './components/map/map.module#MapModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'media-viewer',
            loadChildren: './components/media-viewer/media-viewer.module#MediaViewerModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'network-graph',
            loadChildren: './components/network-graph/network-graph.module#NetworkGraphModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'news-feed',
            loadChildren: './components/news-feed/news-feed.module#NewsFeedModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'query-bar',
            loadChildren: './components/query-bar/query-bar.module#QueryBarModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'taxonomy-viewer',
            loadChildren: './components/taxonomy-viewer/taxonomy-viewer.module#TaxonomyViewerModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'text-cloud',
            loadChildren: './components/single-visualization-widget/single-visualization-widget.module#SingleVisualizationWidgetModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'thumbnail-grid',
            loadChildren: './components/thumbnail-grid/thumbnail-grid.module#ThumbnailGridModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'timeline',
            loadChildren: './components/timeline/timeline.module#TimelineModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'wiki-viewer',
            loadChildren: './components/wiki-viewer/wiki-viewer.module#WikiViewerModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'about-neon',
            loadChildren: './components/about-neon/about-neon.module#AboutNeonModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'custom-requests',
            loadChildren: './components/custom-requests/custom-requests.module#CustomRequestsModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'gear',
            loadChildren: './components/gear/gear.module#GearModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'save-state',
            loadChildren: './components/save-state/save-state.module#SaveStateModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'settings',
            loadChildren: './components/settings/settings.module#SettingsModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'add-visualization',
            loadChildren: './components/add-visualization/add-visualization.module#AddVisualizationModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'config-editor',
            loadChildren: './components/config-editor/config-editor.module#ConfigEditorModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'confirmation-dialog',
            loadChildren: './components/confirmation-dialog/confirmation-dialog.module#ConfirmationDialogModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'contribution-dialog',
            loadChildren: './components/contribution-dialog/contribution-dialog.module#ContributionDialogModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'custom-connection',
            loadChildren: './components/custom-connection/custom-connection.module#CustomConnectionModule'
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'import-data',
            loadChildren: './components/import-data/import-data.module#ImportDataModule'
        })
    ]
})
export class AppLazyModule { }
