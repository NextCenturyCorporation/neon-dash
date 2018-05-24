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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import {} from 'jasmine-core';

import { LineChartComponent } from './line-chart.component';
import { LegendComponent } from '../legend/legend.component';
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
import { VisualizationService } from '../../services/visualization.service';
import { ChartComponent } from '../chart/chart.component';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: LineChart', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: LineChartComponent;
    let fixture: ComponentFixture<LineChartComponent>;

    initializeTestBed({
        declarations: [
            LineChartComponent,
            LegendComponent,
            ExportControlComponent,
            ChartComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            DatasetService,
            FilterService,
            ExportService,
            TranslationService,
            ErrorNotificationService,
            ThemesService,
            ColorSchemeService,
            VisualizationService,
            Injector,
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LineChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toBe('No Data');

        component.chart.data.labels = ['group1', 'group2'];
        expect(component.getButtonText()).toBe('Total 2');

        component.options.limit = 1;
        expect(component.getButtonText()).toBe('1 of 2');

        component.chart.data.labels = ['group1', 'group2', 'group3', 'group4'];
        expect(component.getButtonText()).toBe('1 of 4');

        component.options.limit = 2;
        expect(component.getButtonText()).toBe('2 of 4');

        component.options.limit = 4;
        expect(component.getButtonText()).toBe('Total 4');
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });
});
