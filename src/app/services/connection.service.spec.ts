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
import { ConnectionService } from './connection.service';

import * as neon from 'neon-framework';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

describe('Service: ConnectionService', () => {
    initializeTestBed({
        providers: [ConnectionService]
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
