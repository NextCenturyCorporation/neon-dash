/**
 * Copyright 2019 Next Century Corporation
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
            loadChildren: () => import('./components/aggregation/aggregation.module').then(m => m.AggregationModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'annotation-viewer',
            loadChildren: () => import('./components/annotation-viewer/annotation-viewer.module').then(m => m.AnnotationViewerModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'data-table',
            loadChildren: () => import('./components/data-table/data-table.module').then(m => m.DataTableModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'document-viewer',
            loadChildren: () => import('./components/document-viewer/document-viewer.module').then(m => m.DocumentViewerModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'filter-builder',
            loadChildren: () => import('./components/filter-builder/filter-builder.module').then(m => m.FilterBuilderModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'map',
            loadChildren: () => import('./components/map/map.module').then(m => m.MapModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'media-viewer',
            loadChildren: () => import('./components/media-viewer/media-viewer.module').then(m => m.MediaViewerModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'network-graph',
            loadChildren: () => import('./components/network-graph/network-graph.module').then(m => m.NetworkGraphModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'news-feed',
            loadChildren: () => import('./components/news-feed/news-feed.module').then(m => m.NewsFeedModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'query-bar',
            loadChildren: () => import('./components/query-bar/query-bar.module').then(m => m.QueryBarModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'taxonomy-viewer',
            loadChildren: () => import('./components/taxonomy-viewer/taxonomy-viewer.module').then(m => m.TaxonomyViewerModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'text-cloud',
            loadChildren: () => import('./components/text-cloud/text-cloud.module').then(m => m.TextCloudModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'thumbnail-grid',
            loadChildren: () => import('./components/thumbnail-grid/thumbnail-grid.module').then(m => m.ThumbnailGridModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'timeline',
            loadChildren: () => import('./components/timeline/timeline.module').then(m => m.TimelineModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'wiki-viewer',
            loadChildren: () => import('./components/wiki-viewer/wiki-viewer.module').then(m => m.WikiViewerModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'about-neon',
            loadChildren: () => import('./components/about-neon/about-neon.module').then(m => m.AboutNeonModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'custom-requests',
            loadChildren: () => import('./components/custom-requests/custom-requests.module').then(m => m.CustomRequestsModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'gear',
            loadChildren: () => import('./components/gear/gear.module').then(m => m.GearModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'save-state',
            loadChildren: () => import('./components/save-state/save-state.module').then(m => m.SaveStateModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'settings',
            loadChildren: () => import('./components/settings/settings.module').then(m => m.SettingsModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'add-visualization',
            loadChildren: () => import('./components/add-visualization/add-visualization.module').then(m => m.AddVisualizationModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'config-editor',
            loadChildren: () => import('./components/config-editor/config-editor.module').then(m => m.ConfigEditorModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'confirmation-dialog',
            loadChildren: () => import('./components/confirmation-dialog/confirmation-dialog.module').then(m => m.ConfirmationDialogModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'contribution-dialog',
            loadChildren: () => import('./components/contribution-dialog/contribution-dialog.module').then(m => m.ContributionDialogModule)
        }),
        ReactiveComponentLoaderModule.withModule({
            moduleId: 'custom-connection',
            loadChildren: () => import('./components/custom-connection/custom-connection.module').then(m => m.CustomConnectionModule)
        })
    ]
})
export class AppLazyModule { }
