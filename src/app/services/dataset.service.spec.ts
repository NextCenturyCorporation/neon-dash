/* tslint:disable:no-unused-variable */

import { addProviders, async, inject } from '@angular/core/testing';
import { Dataset } from '../dataset';
import { DatasetService } from './dataset.service';

describe('Service: DatasetService', () => {
    beforeEach(() => {
      addProviders([DatasetService]);
    });

    it('should create the service',
        inject([DatasetService], (service: DatasetService) => {
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
