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

import { AboutNeonModule } from '../components/about-neon/about-neon.module';
import { AddVisualizationModule } from '../components/add-visualization/add-visualization.module';
import { DashboardSelectorModule } from '../components/dashboard-selector/dashboard-selector.module';
import { FiltersModule } from '../components/filters/filters.module';
import { SettingsModule } from '../components/settings/settings.module';
import { SaveStateModule } from '../components/save-state/save-state.module';
import { SimpleFilterModule } from '../components/simple-filter/simple-filter.module';
import { MatIconModule, MatMenuModule, MatToolbarModule, MatSidenavModule, MatButtonModule } from '@angular/material';
import { GearModule } from '../components/gear/gear.module';
import { OptionsListModule } from '../components/options-list/options-list.module';
import { DashboardComponent } from './dashboard.component';

@NgModule({
    declarations: [DashboardComponent],
    exports: [DashboardComponent],
    imports: [
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatToolbarModule,
        MatSidenavModule,

        CommonModule,
        NgGridModule,

        AboutNeonModule,
        AddVisualizationModule,
        VisualizationContainerModule,
        DashboardSelectorModule,
        FiltersModule,
        GearModule,
        OptionsListModule,
        SaveStateModule,
        SettingsModule,
        SimpleFilterModule
    ]
})
export class DashboardModule { }
