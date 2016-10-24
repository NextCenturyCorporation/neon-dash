
/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { Dataset } from '../dataset';
import { DatasetService } from './dataset.service';
import { ActiveGridService } from './active-grid.service';
import { NeonGTDConfig } from '../neon-gtd-config';

describe('Service: DatasetService', () => {
    let testConfig = new NeonGTDConfig();

    beforeEach(() => {

        TestBed.configureTestingModule({
            providers: [
                ActiveGridService,
                DatasetService,
                { provide: 'config', useValue: testConfig }
            ]
        });
    });

    it('should be injectable', inject([DatasetService], (service: DatasetService) => {
        expect(service).toBeTruthy();
    }));

    it('should have no active datasets at creation',
        inject([DatasetService], (service: DatasetService) => {
        expect(service.getDataset()).toEqual(new Dataset() );
    }));

    it('should return datasets by name',
        inject([DatasetService], (service: DatasetService) => {
            service.addDataset({
            name: 'd1',
            databases: []
        });

        expect(service.getDatasetWithName('d1')).toEqual({
            name: 'd1',
            databases: [],
            dateFilterKeys: {}
        });
    }));
});
