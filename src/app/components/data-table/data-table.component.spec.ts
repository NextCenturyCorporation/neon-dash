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
import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import {} from 'jasmine-core';

import { DataTableComponent } from './data-table.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { TranslationService } from '../../services/translation.service';
import { VisualizationService } from '../../services/visualization.service';

describe('Component: DataTable', () => {
    let component: DataTableComponent;
    let fixture: ComponentFixture<DataTableComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DataTableComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
                ConnectionService,
                DatasetService,
                FilterService,
                ExportService,
                TranslationService,
                ErrorNotificationService,
                VisualizationService,
                ThemesService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() }
            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                NgxDatatableModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(DataTableComponent);
        component = fixture.componentInstance;
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));
});
