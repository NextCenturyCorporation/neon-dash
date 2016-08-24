/* tslint:disable:no-unused-variable */

import { addProviders, async, inject } from '@angular/core/testing';
import { ConnectionService } from './connection.service';

import { neon } from 'neon-framework/neon-nodeps';

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
      expect(service.getActiveConnection()).toBeUndefined();
    }));

  it('should return an active connection after one has been created.',
    inject([ConnectionService], (service: ConnectionService) => {
      let connection = service.createActiveConnection(neon.query.Connection.MONGO, 'foo');
      expect(connection).toBeTruthy();
      expect(connection.databaseType_).toEqual(neon.query.Connection.MONGO);
      expect(connection.host_).toEqual('foo');
      expect(service.getActiveConnection()).toBeTruthy();
    }));
});
