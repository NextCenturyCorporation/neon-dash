/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ConnectionService } from './connection.service';

import * as neon from 'neon-framework';

describe('Service: ConnectionService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConnectionService]
        });
    });

    it('should ...', inject([ConnectionService], (service: ConnectionService) => {
      expect(service).toBeTruthy();
    }));

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
