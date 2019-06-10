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

import { DashboardSelectorComponent } from './dashboard-selector.component';
import { NeonConfig } from '../../model/types';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { DashboardSelectorModule } from './dashboard-selector.module';
import { ConfigService } from '../../services/config.service';

describe('Component: DashboardSelector', () => {
    let testConfig: NeonConfig = NeonConfig.get();
    let fixture: ComponentFixture<DashboardSelectorComponent>;
    let component: DashboardSelectorComponent;

    initializeTestBed('Dataset Selector', {
        providers: [
            { provide: ConfigService, useValue: ConfigService.as(testConfig) }

        ],
        imports: [
            DashboardSelectorModule
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
