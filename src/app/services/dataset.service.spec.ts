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
import { Dashboard, DashboardOptions, Datastore } from '../dataset';
import { DatasetService } from './dataset.service';
import { NeonGTDConfig } from '../neon-gtd-config';
import { initializeTestBed } from '../../testUtils/initializeTestBed';
import { DatasetServiceMock } from '../../testUtils/MockServices/DatasetServiceMock';

describe('Service: DatasetService', () => {
    let testConfig = new NeonGTDConfig();

    initializeTestBed({
        providers: [
            DatasetService,
            { provide: 'config', useValue: testConfig }
        ]
    });

    it('should have no active datastores at creation', inject([DatasetService], (service: DatasetService) => {
        expect(service.getDataset()).toEqual(new Datastore());
    }));

    it('should have no active dashboards at creation', inject([DatasetService], (service: DatasetService) => {
        expect(service.getCurrentDashboard()).not.toBeDefined();
    }));

    it('should return datastores by name',
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

    it('getCurrentDatabase does return expected object', inject([DatasetService], (service: DatasetService) => {
        expect(service.getCurrentDatabase()).not.toBeDefined();
    }));
});

describe('Service: mock DatasetService with mock data', () => {
    let testConfig = new NeonGTDConfig();

    initializeTestBed({
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: 'config', useValue: testConfig }
        ]
    });

    it('getCurrentDatabase does return expected object', inject([DatasetService], (service: DatasetService) => {
        expect(service.getCurrentDatabase()).toEqual(DatasetServiceMock.DATABASES[0]);
    }));
});
