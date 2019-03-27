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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';

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

import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { AnnotationViewerComponent } from './components/annotation-viewer/annotation-viewer.component';
import { AppComponent } from './app.component';
import { AggregationComponent } from './components/aggregation/aggregation.component';
import { ConfigEditorComponent } from './components/config-editor/config-editor.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { DashboardDropdownComponent } from './components/dashboard-dropdown/dashboard-dropdown.component';
import { DashboardSelectorComponent } from './components/dashboard-selector/dashboard-selector.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DocumentViewerComponent } from './components/document-viewer/document-viewer.component';
import { DocumentViewerSingleItemComponent } from './components/document-viewer-single-item/document-viewer-single-item.component';
import { ExportControlComponent } from './components/export-control/export-control.component';
import { FilterBuilderComponent } from './components/filter-builder/filter-builder.component';
import { FiltersComponent } from './components/filters/filters.component';
import { CurrentFiltersComponent } from './components/current-filters/current-filters.component';
import { LegendComponent } from './components/legend/legend.component';
import { MapComponent } from './components/map/map.component';
import { MediaViewerComponent } from './components/media-viewer/media-viewer.component';
import { OptionsListComponent } from './components/options-list/options-list.component';
import { SampleComponent } from './components/sample/sample.component';
import { SaveStateComponent } from './components/save-state/save-state.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SnackBarComponent } from './components/snack-bar/snack-bar.component';
import { TaxonomyViewerComponent } from './components/taxonomy-viewer/taxonomy-viewer.component';
import { TextCloudComponent } from './components/text-cloud/text-cloud.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { UnsharedFilterComponent } from './components/unshared-filter/unshared-filter.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';
import { VisualizationInjectorComponent } from './components/visualization-injector/visualization-injector.component';
import { WikiViewerComponent } from './components/wiki-viewer/wiki-viewer.component';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { AppMaterialModule } from './app.material.module';
import { SimpleFilterComponent } from './components/simple-filter/simple-filter.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NetworkGraphComponent } from './components/network-graph/network-graph.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TreeModule } from 'angular-tree-component';
import { ThumbnailGridComponent } from './components/thumbnail-grid/thumbnail-grid.component';
import { DetailsThumbnailSubComponent } from './components/thumbnail-grid/subcomponent.details-view';
import { TitleThumbnailSubComponent } from './components/thumbnail-grid/subcomponent.title-view';
import { CardThumbnailSubComponent } from './components/thumbnail-grid/subcomponent.card-view';
import { NewsFeedComponent } from './components/news-feed/news-feed.component';

import { CustomConnectionComponent } from './components/custom-connection/custom-connection.component';
import { CustomConnectionSimpleSetupStepComponent } from './components/custom-connection/simple-setup.component';
import { MatAutocompleteModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { QueryBarComponent } from './components/query-bar/query-bar.component';
import { GearComponent } from './components/gear/gear.component';
import { ContributionDialogComponent } from './components/contribution-dialog/contribution-dialog.component';

export function getAppConfig() {
    /* tslint:disable:no-string-literal */
    return window['appConfig'];
    /* tslint:enable:no-string-literal */
}

@NgModule({
    declarations: [
        AboutNeonComponent,
        AddVisualizationComponent,
        AnnotationViewerComponent,
        AppComponent,
        AggregationComponent,
        CardThumbnailSubComponent,
        ConfigEditorComponent,
        ConfirmationDialogComponent,
        ContributionDialogComponent,
        CustomConnectionComponent,
        CustomConnectionSimpleSetupStepComponent,
        DashboardDropdownComponent,
        DashboardSelectorComponent,
        DataTableComponent,
        DetailsThumbnailSubComponent,
        DocumentViewerComponent,
        DocumentViewerSingleItemComponent,
        ExportControlComponent,
        FilterBuilderComponent,
        FiltersComponent,
        CurrentFiltersComponent,
        GearComponent,
        LegendComponent,
        MapComponent,
        MediaViewerComponent,
        NetworkGraphComponent,
        NewsFeedComponent,
        OptionsListComponent,
        QueryBarComponent,
        SampleComponent,
        SaveStateComponent,
        SettingsComponent,
        SimpleFilterComponent,
        SnackBarComponent,
        TaxonomyViewerComponent,
        TextCloudComponent,
        ThumbnailGridComponent,
        TitleThumbnailSubComponent,
        TimelineComponent,
        UnsharedFilterComponent,
        VisualizationContainerComponent,
        VisualizationInjectorComponent,
        WikiViewerComponent
    ],
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        HttpModule,
        HttpClientModule,
        NgGridModule,
        NgxDatatableModule,
        BrowserAnimationsModule,
        AppMaterialModule,
        MatAutocompleteModule,
        NgxGraphModule,
        NgxChartsModule,
        ReactiveFormsModule,
        TreeModule.forRoot()
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
    entryComponents: [
        AppComponent,
        AddVisualizationComponent,
        ConfigEditorComponent,
        ConfirmationDialogComponent,
        ContributionDialogComponent,
        CustomConnectionComponent,
        DocumentViewerSingleItemComponent,
        CurrentFiltersComponent,
        GearComponent,
        SaveStateComponent,
        SettingsComponent,
        SnackBarComponent
    ],
    bootstrap: [AppComponent]
})

/* tslint:disable:no-unnecessary-class */
export class AppModule { }
