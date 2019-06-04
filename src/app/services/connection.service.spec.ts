import { query } from 'neon-framework';

import { ConnectionService, NeonConnection } from './connection.service';
import { inject } from '@angular/core/testing';

import { initializeTestBed } from '../../testUtils/initializeTestBed';

describe('ConnectionService', () => {
    let service: ConnectionService;

    initializeTestBed('Connection Service', {
        providers: [
            ConnectionService
        ]
    });

    beforeEach(inject([ConnectionService], (svc) => {
        service = svc;
    }));

    it('createConnection does return a new connection', () => {
        let connection = new query.Connection();
        spyOn(service, 'neonConnection').and.returnValue(connection);
        let spy = spyOn(connection, 'connect');

        let output = service.connect('elasticsearchrest', 'localhost');

        expect(output.connection).toEqual(connection);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['elasticsearchrest', 'localhost']);
    });

    it('createConnection does return an existing connection', () => {
        let existingNeonConnection = new NeonConnection(new query.Connection());
        service['connections'].set('elasticsearchrest', new Map<string, any>());
        service['connections'].get('elasticsearchrest').set('localhost', existingNeonConnection);

        let connection = new query.Connection();
        spyOn(service, 'neonConnection').and.returnValue(connection);
        let spy = spyOn(connection, 'connect');

        let output = service.connect('elasticsearchrest', 'localhost');

        expect(output).toEqual(existingNeonConnection);
        expect(spy.calls.count()).toEqual(0);
    });
});
