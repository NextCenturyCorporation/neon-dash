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
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, APP_BASE_HREF, PlatformLocation } from '@angular/common';

import { AbstractColorThemeService } from 'component-library/dist/core/services/abstract.color-theme.service';
import { AbstractSearchService } from 'component-library/dist/core/services/abstract.search.service';
import { InjectableColorThemeService } from './services/injectable.color-theme.service';
import { DashboardService } from './services/dashboard.service';
import { InjectableFilterService } from './services/injectable.filter.service';
import { InjectableSearchService } from './services/injectable.search.service';

import { AppComponent } from './app.component';
import { RouteDashboardComponent } from './route-dashboard.component';
import { RouteRequestComponent } from './route-request.component';
import { CustomRequestsModule } from './components/custom-requests/custom-requests.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { ConfigService } from './services/config.service';
import { HttpClientModule } from '@angular/common/http';
import { AppLazyModule } from './app-lazy.module';
import { AppRoutingModule } from './app-routing.module';
import { DynamicDialogModule } from './components/dynamic-dialog/dynamic-dialog.module';
import { DynamicDialogComponent } from './components/dynamic-dialog/dynamic-dialog.component';
import { RouteNeontoolsComponent } from './route-neontools.component';
import { NeonToolsModule } from './components/neon-tools/neon-tools.module';

export function getBaseHref(platformLocation: PlatformLocation): string {
    return platformLocation.getBaseHrefFromDOM();
}

@NgModule({
    declarations: [AppComponent, RouteDashboardComponent, RouteRequestComponent, RouteNeontoolsComponent],
    entryComponents: [AppComponent, DynamicDialogComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        CommonModule,
        CustomRequestsModule,
        DashboardModule,
        NeonToolsModule,
        DynamicDialogModule,
        AppLazyModule,
        AppRoutingModule
    ],
    providers: [
        { provide: APP_BASE_HREF, useFactory: getBaseHref, deps: [PlatformLocation] },
        ConfigService,
        DashboardService,
        {
            provide: AbstractColorThemeService,
            useClass: InjectableColorThemeService
        },
        InjectableFilterService,
        {
            provide: AbstractSearchService,
            useClass: InjectableSearchService
        }
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [AppComponent]
})
export class AppModule { }
