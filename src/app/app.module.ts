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
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

import 'hammerjs';

import { NgGridModule } from 'angular2-grid';

import { AbstractSearchService } from './services/abstract.search.service';
import { AbstractWidgetService } from './services/abstract.widget.service';
import { ConnectionService } from './services/connection.service';
import { DatasetService } from './services/dataset.service';
import { FilterService } from './services/filter.service';
import { ParameterService } from './services/parameter.service';
import { PropertyService } from './services/property.service';
import { SearchService } from './services/search.service';
import { WidgetService } from './services/widget.service';

import { AppComponent } from './app.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { VisualizationInjectorComponent } from './components/visualization-injector/visualization-injector.component';

import { AboutNeonModule } from './components/about-neon/about-neon.module';
import { AddVisualizationModule } from './components/add-visualization/add-visualization.module';
import { AnnotationViewerModule } from './components/annotation-viewer/annotation-viewer.module';
import { AggregationModule } from './components/aggregation/aggregation.module';
import { ConfigEditorModule } from './components/config-editor/config-editor.module';
import { ConfirmationDialogModule } from './components/confirmation-dialog/confirmation-dialog.module';
import { ContributionDialogModule } from './components/contribution-dialog/contribution-dialog.module';
import { CustomConnectionModule } from './components/custom-connection/custom-connection.module';
import { LegendModule } from './components/legend/legend.module';
import { DataMessageModule } from './components/data-message/data-message.module';
import { DashboardDropdownModule } from './components/dashboard-dropdown/dashboard-dropdown.module';
import { DashboardSelectorModule } from './components/dashboard-selector/dashboard-selector.module';
import { DataTableModule } from './components/data-table/data-table.module';
import { DocumentViewerModule } from './components/document-viewer/document-viewer.module';
import { ExportControlModule } from './components/export-control/export-control.module';
import { FilterBuilderModule } from './components/filter-builder/filter-builder.module';
import { FiltersModule } from './components/filters/filters.module';
import { CurrentFiltersModule } from './components/current-filters/current-filters.module';
import { MapModule } from './components/map/map.module';
import { MediaViewerModule } from './components/media-viewer/media-viewer.module';
import { NetworkGraphModule } from './components/network-graph/network-graph.module';
import { NewsFeedModule } from './components/news-feed/news-feed.module';
import { QueryBarModule } from './components/query-bar/query-bar.module';
import { SettingsModule } from './components/settings/settings.module';
import { SaveStateModule } from './components/save-state/save-state.module';
import { SimpleFilterModule } from './components/simple-filter/simple-filter.module';
import { SnackBarModule } from './components/snack-bar/snack-bar.module';
import { TaxonomyViewerModule } from './components/taxonomy-viewer/taxonomy-viewer.module';
import { TextCloudModule } from './components/text-cloud/text-cloud.module';
import { ThumbnailGridModule } from './components/thumbnail-grid/thumbnail-grid.module';
import { TimelineModule } from './components/timeline/timeline.module';
import { UnsharedFilterModule } from './components/unshared-filter/unshared-filter.module';
import { WikiViewerModule } from './components/wiki-viewer/wiki-viewer.module';
import { MatIconModule, MatMenuModule, MatToolbarModule, MatSidenavModule } from '@angular/material';
import { GearModule } from './components/gear/gear.module';
import { OptionsListModule } from './components/options-list/options-list.module';

export function getAppConfig() {
    /* tslint:disable:no-string-literal */
    return window['appConfig'];
    /* tslint:enable:no-string-literal */
}

@NgModule({
    declarations: [
        AppComponent,
        VisualizationContainerComponent,
        VisualizationInjectorComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatIconModule,
        MatMenuModule,
        MatToolbarModule,
        MatSidenavModule,

        CommonModule,
        NgGridModule,

        AboutNeonModule,
        AddVisualizationModule,
        AggregationModule,
        AnnotationViewerModule,
        ConfigEditorModule,
        ConfirmationDialogModule,
        ContributionDialogModule,
        CurrentFiltersModule,
        CustomConnectionModule,

        DashboardDropdownModule,
        DashboardSelectorModule,
        DataTableModule,
        DocumentViewerModule,
        ExportControlModule,
        FilterBuilderModule,
        FiltersModule,

        DataMessageModule,
        LegendModule,

        GearModule,
        OptionsListModule,

        MapModule,
        MediaViewerModule,
        NetworkGraphModule,
        NewsFeedModule,
        QueryBarModule,
        SaveStateModule,
        SettingsModule,

        SimpleFilterModule,
        SnackBarModule,
        TaxonomyViewerModule,
        TextCloudModule,
        ThumbnailGridModule,
        TimelineModule,
        UnsharedFilterModule,
        WikiViewerModule
    ],
    providers: [
        ConnectionService,
        DatasetService,
        FilterService,
        ParameterService,
        PropertyService,
        {
            provide: AbstractSearchService,
            useClass: SearchService
        },
        {
            provide: AbstractWidgetService,
            useClass: WidgetService
        },
        {
            provide: 'config',
            useFactory: getAppConfig
        }
    ],
    entryComponents: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule { }
