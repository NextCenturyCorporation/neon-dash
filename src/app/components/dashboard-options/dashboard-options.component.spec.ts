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
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsModule } from '@angular/forms';
import { ViewContainerRef } from '@angular/core';

import { DashboardOptionsComponent } from './dashboard-options.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ParameterService } from '../../services/parameter.service';
import { ThemesService } from '../../services/themes.service';
import { FilterService } from '../../services/filter.service';

import { MatSnackBar } from '@angular/material';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { VisualizationService } from '../../services/visualization.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: DashboardOptionsComponent', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let fixture: ComponentFixture<DashboardOptionsComponent>;
    let component: DashboardOptionsComponent;

    initializeTestBed({
        declarations: [
            DashboardOptionsComponent,
            ExportControlComponent
        ],
        imports: [
            FormsModule,
            AppMaterialModule,
            BrowserAnimationsModule
        ],
        providers: [
            ConnectionService,
            DatasetService,
            ErrorNotificationService,
            VisualizationService,
            ExportService,
            MatSnackBar,
            ParameterService,
            ThemesService,
            ViewContainerRef,
            FilterService,
            { provide: 'config', useValue: testConfig }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardOptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });
});
