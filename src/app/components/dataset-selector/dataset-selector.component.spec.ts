/* tslint:disable:no-unused-variable */
/*
 * Copyright 2016 Next Century Corporation
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
import { async, inject, TestBed } from '@angular/core/testing';
import { DatasetSelectorComponent } from './dataset-selector.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { ParameterService } from '../../services/parameter.service';

import { MdList, MdListItem, MdToolbar, MdToolbarRow } from '@angular/material';

describe('Component: DatasetSelector', () => {

    let testConfig: NeonGTDConfig = new NeonGTDConfig();

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DatasetSelectorComponent,
                MdList,
                MdListItem,
                MdToolbar,
                MdToolbarRow
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                ParameterService,
                { provide: 'config', useValue: testConfig }
            ]
        });
    });

    it('should create an instance', inject([ ActiveGridService, ConnectionService,
                DatasetService, ParameterService ], (ags: ActiveGridService, cs: ConnectionService, ds: DatasetService, ps: ParameterService) => {
        let component = new DatasetSelectorComponent(cs, ds, ps, ags);
        expect(component).toBeTruthy();
    }));
});
