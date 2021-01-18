/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { CommonModule, LocationStrategy, PathLocationStrategy, Location } from '@angular/common';

import { NgGridModule } from 'angular2-grid';
import { ContextMenuModule } from 'ngx-contextmenu';

import { VisualizationContainerModule } from '../components/visualization-container/visualization-container.module';

import { DashboardSelectorModule } from '../components/dashboard-selector/dashboard-selector.module';
import { FiltersModule } from '../components/filters/filters.module';
import { SimpleSearchFilterModule } from '../components/simple-search-filter/simple-search-filter.module';
import { DashboardComponent } from './dashboard.component';
import { CommonWidgetModule } from '../common-widget.module';
import { MatBadgeModule, MatMenuModule, MatSnackBarModule, MatTabsModule } from '@angular/material';
import { ReactiveComponentLoaderModule } from '@wishtack/reactive-component-loader';
import { CurrentFiltersModule } from '../components/current-filters/current-filters.module';
import { CustomConnectionModule } from '../components/custom-connection/custom-connection.module';
import { AbbreviatePipe } from './abbreviate.pipe';

@NgModule({
    declarations: [DashboardComponent, AbbreviatePipe],
    exports: [DashboardComponent],
    providers: [
        Location,
        { provide: LocationStrategy, useClass: PathLocationStrategy }
    ],
    imports: [
        CommonWidgetModule,
        ContextMenuModule.forRoot(),
        MatBadgeModule,
        MatSnackBarModule,
        MatMenuModule,
        MatTabsModule,
        CommonModule,
        NgGridModule,
        ReactiveComponentLoaderModule,
        VisualizationContainerModule,
        DashboardSelectorModule,
        FiltersModule,
        CurrentFiltersModule,
        CustomConnectionModule,
        SimpleSearchFilterModule
    ]
})
export class DashboardModule { }
