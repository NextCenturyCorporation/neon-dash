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
import { TestBed, inject } from '@angular/core/testing';
import { Dataset } from '../dataset';
import { DatasetService } from './dataset.service';
import { ActiveGridService } from './active-grid.service';
import { NeonGTDConfig } from '../neon-gtd-config';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

describe('Service: DatasetService', () => {
    let testConfig = new NeonGTDConfig();

    initializeTestBed({
        providers: [
            ActiveGridService,
            DatasetService,
            { provide: 'config', useValue: testConfig }
        ]
    });

    it('should be injectable', inject([DatasetService], (service: DatasetService) => {
        expect(service).toBeTruthy();
    }));

    it('should have no active datasets at creation',
        inject([DatasetService], (service: DatasetService) => {
        expect(service.getDataset()).toEqual(new Dataset());
    }));

    it('should return datasets by name',
        inject([DatasetService], (service: DatasetService) => {
            service.addDataset({
            name: 'd1',
            databases: []
        });

        expect(service.getDatasetWithName('d1')).toEqual({
            name: 'd1',
            databases: []
        });
    }));
});
