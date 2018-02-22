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
import { Injector } from '@angular/core';

import {} from 'jasmine-core';

import { TimelineComponent } from './timeline.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationService } from '../../services/visualization.service';
import { ChartComponent } from '../chart/chart.component';

let d3 = require('../../../assets/d3.min.js');

describe('Component: Timeline', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: TimelineComponent;
    let fixture: ComponentFixture<TimelineComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChartComponent,
                TimelineComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                FilterService,
                ExportService,
                TranslationService,
                ErrorNotificationService,
                VisualizationService,
                ThemesService,
                ColorSchemeService,
                Injector,
                { provide: 'config', useValue: testConfig }
            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(TimelineComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toBe('No Data');

        component.active.data = [{
            date: new Date(),
            value: 0
        }];
        expect(component.getButtonText()).toBe('No Data');

        component.active.docCount = 2;
        component.active.data = [{
            date: new Date(),
            value: 1
        }, {
            date: new Date(),
            value: 1
        }];
        expect(component.getButtonText()).toBe('Total 2');

        component.active.docCount = 6;
        expect(component.getButtonText()).toBe('2 of 6');

        component.active.data = [{
            date: new Date(),
            value: 3
        }, {
            date: new Date(),
            value: 2
        }, {
            date: new Date(),
            value: 1
        }, {
            date: new Date(),
            value: 0
        }];
        expect(component.getButtonText()).toBe('Total 6');
    });
});
