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
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { AppMaterialModule } from '../../app.material.module';
import { DashboardDropdownComponent } from '../dashboard-dropdown/dashboard-dropdown.component';
import { DashboardSelectorComponent } from './dashboard-selector.component';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ParameterService } from '../../services/parameter.service';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

describe('Component: DashboardSelector', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let fixture: ComponentFixture<DashboardSelectorComponent>;
    let component: DashboardSelectorComponent;

    initializeTestBed('Dataset Selector', {
        declarations: [
            DashboardDropdownComponent,
            DashboardSelectorComponent
        ],
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            ConnectionService,
            DatasetService,
            FilterService,
            ParameterService,
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            FormsModule,
            AppMaterialModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardSelectorComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));
});
