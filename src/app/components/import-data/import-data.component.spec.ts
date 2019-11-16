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
import { Injector } from '@angular/core';

import { } from 'jasmine-core';

import { ImportDataComponent } from './import-data.component';

import { DashboardService } from '../../services/dashboard.service';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { ImportDataModule } from './import-data.module';

describe('Component: Import-Data', () => {
    let component: ImportDataComponent;
    let fixture: ComponentFixture<ImportDataComponent>;

    let mockCsvParser = {
        parse: (file: File, settings: any) => {

        }
    };

    initializeTestBed('ImportData', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: Object, useValue: mockCsvParser },
            Injector
        ],
        imports: [
            ImportDataModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ImportDataComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('initialized', (() => {
        expect(component).toBeTruthy();
    }));
});
