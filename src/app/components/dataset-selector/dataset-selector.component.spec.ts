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
import { DatasetSelectorComponent } from './dataset-selector.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { ParameterService } from '../../services/parameter.service';
import { FilterService } from '../../services/filter.service';
import { ErrorNotificationService } from '../../services/error-notification.service';

import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: DatasetSelector', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let fixture: ComponentFixture<DatasetSelectorComponent>;
    let component: DatasetSelectorComponent;

    initializeTestBed({
        declarations: [
            DatasetSelectorComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            DatasetService,
            ParameterService,
            ErrorNotificationService,
            FilterService,
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            FormsModule,
            AppMaterialModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DatasetSelectorComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));
});
