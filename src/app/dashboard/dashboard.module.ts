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

import { NgGridModule } from 'angular2-grid';

import { VisualizationContainerModule } from '../components/visualization-container/visualization-container.module';

import { DashboardSelectorModule } from '../components/dashboard-selector/dashboard-selector.module';
import { FiltersModule } from '../components/filters/filters.module';
import { SimpleFilterModule } from '../components/simple-filter/simple-filter.module';
import { DashboardComponent } from './dashboard.component';
import { CommonWidgetModule } from '../common-widget.module';
import { MatMenuModule, MatSnackBarModule } from '@angular/material';
import { ReactiveComponentLoaderModule } from '@wishtack/reactive-component-loader';

@NgModule({
    declarations: [DashboardComponent],
    exports: [DashboardComponent],
    imports: [
        CommonWidgetModule,
        MatSnackBarModule,
        MatMenuModule,
        CommonModule,
        NgGridModule,

        ReactiveComponentLoaderModule,
        VisualizationContainerModule,
        DashboardSelectorModule,
        FiltersModule,
        SimpleFilterModule
    ]
})
export class DashboardModule { }
