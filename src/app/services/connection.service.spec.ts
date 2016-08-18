/* tslint:disable:no-unused-variable */

import { addProviders, async, inject } from '@angular/core/testing';
import { ConnectionService } from './connection.service';

import * as neon from 'neon-framework/build/js/neon-nodeps.js';

describe('Service: ConnectionService', () => {
  beforeEach(() => {
    addProviders([ConnectionService]);
  });

  it('should create the service',
    inject([ConnectionService], (service: ConnectionService) => {
      expect(service).toBeTruthy();
    }));

  it('should have no active connections after creation',
    inject([ConnectionService], (service: ConnectionService) => {
      expect(service.getDataset()).toEqual(new Dataset() );
    }));

  it('should return an active connection when requested.',
    inject([ConnectionService], (service: ConnectionService) => {
      service.addDataset({
        name: "d1",
        databases: []
      });

      expect(service.getDatasetWithName("d1")).toEqual({
        name: "d1",
        databases: [],
        dateFilterKeys: {}
      });
    }));
});
