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
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

import { AbstractSearchService } from './services/abstract.search.service';
import { InjectableColorThemeService } from './services/injectable.color-theme.service';
import { DashboardService } from './services/dashboard.service';
import { InjectableFilterService } from './services/injectable.filter.service';
import { InjectableSearchService } from './services/injectable.search.service';

import { AppComponent } from './app.component';

import { SnackBarModule } from './components/snack-bar/snack-bar.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ConfigService } from './services/config.service';
import { HttpClientModule } from '@angular/common/http';
import { AppLazyModule } from './app-lazy.module';
import { DynamicDialogModule } from './components/dynamic-dialog/dynamic-dialog.module';
import { DynamicDialogComponent } from './components/dynamic-dialog/dynamic-dialog.component';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        CommonModule,
        DashboardModule,
        DynamicDialogModule,
        SnackBarModule,
        AppLazyModule
    ],
    providers: [
        ConfigService,
        DashboardService,
        InjectableColorThemeService,
        InjectableFilterService,
        {
            provide: AbstractSearchService,
            useClass: InjectableSearchService
        }
    ],
    entryComponents: [AppComponent, DynamicDialogComponent],
    bootstrap: [AppComponent]
})
export class AppModule { }
