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
    let service: ConnectionService;

    initializeTestBed('Connection Service', {
        providers: [ConnectionService]
    });

    beforeEach(inject([ConnectionService], (connectionService: ConnectionService) => {
        service = connectionService;
    }));

    it('should have no connections', () => {
        expect(Array.from((service as any).connections.keys())).toEqual([]);
    });

    it('createActiveConnection should return a new connection', () => {
        let connection = service.createActiveConnection('testType', 'testHost');
        expect(connection).toBeTruthy();
        expect(connection.databaseType_).toEqual('testType');
        expect(connection.host_).toEqual('testHost');
        expect(Array.from((service as any).connections.keys())).toEqual(['testType']);
        expect(Array.from((service as any).connections.get('testType').keys())).toEqual(['testHost']);
    });

    it('createActiveConnection does not override an existing connection', () => {
        let connection1 = service.createActiveConnection('testType', 'testHost');
        let connection2 = service.createActiveConnection('testType', 'testHost');
        expect(connection1).toEqual(connection2);
    });

    it('createActiveConnection does return null if type or host are undefined', () => {
        expect(service.createActiveConnection(undefined, undefined)).toEqual(null);
        expect(service.createActiveConnection('testType', undefined)).toEqual(null);
        expect(service.createActiveConnection(undefined, 'testHost')).toEqual(null);
    });
});
