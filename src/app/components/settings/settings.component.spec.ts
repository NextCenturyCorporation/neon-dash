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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDividerModule, MatRadioModule, MatSelectModule, MatFormFieldModule } from '@angular/material';
import { } from 'jasmine-core';

import { SettingsComponent } from './settings.component';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { NeonConfig } from '../../models/types';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { SettingsModule } from './settings.module';
import { ExportControlModule } from '../export-control/export-control.module';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../services/config.service';

describe('Component: Settings', () => {
    let fixture: ComponentFixture<SettingsComponent>;
    // TODO let component: SettingsComponent;

    initializeTestBed('Settings', {
        declarations: [
            SettingsComponent
        ],
        providers: [
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) },
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractWidgetService, useClass: WidgetService }
        ],
        imports: [
            MatDividerModule,
            MatRadioModule,
            MatSelectModule,
            MatFormFieldModule,
            ExportControlModule,
            FormsModule,
            SettingsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SettingsComponent);
        // TODO component = fixture.componentInstance;
        fixture.detectChanges();
    });
});
