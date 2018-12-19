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
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { BaseLayeredNeonComponent } from '../base-neon-component/base-layered-neon.component';
import { CurrentFiltersComponent } from './current-filters.component';
import { FilterService } from '../../services/filter.service';
import { DatasetService } from '../../services/dataset.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: CurrentFiltersComponent', () => {
    let fixture: ComponentFixture<CurrentFiltersComponent>;
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: CurrentFiltersComponent;

    initializeTestBed({
        declarations: [
            CurrentFiltersComponent
        ],
        providers: [
            FilterService,
            DatasetService,
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            BrowserAnimationsModule
        ]
    });

    it('should create an instance', (() => {
        fixture = TestBed.createComponent(CurrentFiltersComponent);
        component = fixture.componentInstance;
        expect(component).toBeTruthy();
    }));
});
