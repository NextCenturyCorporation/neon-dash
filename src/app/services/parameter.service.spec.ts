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
import { inject } from '@angular/core/testing';
import { ConnectionService } from './connection.service';
import { DatasetService } from './dataset.service';
import { ErrorNotificationService } from './error-notification.service';
import { FilterService } from './filter.service';
import { NeonGTDConfig } from '../neon-gtd-config';
import { ParameterService } from './parameter.service';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

describe('Service: Parameter', () => {
    let service;

    initializeTestBed({
        providers: [
            ParameterService,
            ConnectionService,
            DatasetService,
            ErrorNotificationService,
            FilterService,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ]
    });

    beforeEach(inject([ParameterService], (parameterService) => {
        service = parameterService;
        service.parameters = {};
    }));

    it('findActiveDatasetInUrl does return expected value', () => {
        expect(service.findActiveDatasetInUrl()).toBeUndefined();
        service.parameters = {
            dataset: 'dataset1'
        };
        expect(service.findActiveDatasetInUrl()).toEqual('dataset1');
    });

    it('findDashboardStateIdInUrl does return expected value', () => {
        expect(service.findDashboardStateIdInUrl()).toBeUndefined();
        service.parameters = {
            dashboard_state_id: 'state1'
        };
        expect(service.findDashboardStateIdInUrl()).toEqual('state1');
    });

    it('findFilterStateIdInUrl does return expected value', () => {
        expect(service.findFilterStateIdInUrl()).toBeUndefined();
        service.parameters = {
            filter_state_id: 'state2'
        };
        expect(service.findFilterStateIdInUrl()).toEqual('state2');
    });

    it('findParameters does return expected object', () => {
        expect(service.findParameters('')).toEqual({});
        expect(service.findParameters('?')).toEqual({});
        expect(service.findParameters('?key1=value1')).toEqual({
            key1: 'value1'
        });
        expect(service.findParameters('?key1=value1&key2=value2&key3=value3')).toEqual({
            key1: 'value1',
            key2: 'value2',
            key3: 'value3'
        });
    });

    it('removeStateParameters does work as expected', () => {
        service.removeStateParameters();
        expect(service.parameters).toEqual({});

        service.parameters = {
            dashboard_state_id: 'state1',
            filter_state_id: 'state2',
            other_key: 'other_value'
        };
        service.removeStateParameters();
        expect(service.parameters).toEqual({
            other_key: 'other_value'
        });
    });

    it('updateStateParameters does work as expected', () => {
        service.updateStateParameters('state1', 'state2');
        expect(service.parameters).toEqual({
            dashboard_state_id: 'state1',
            filter_state_id: 'state2'
        });

        service.parameters.other_key = 'other_value';
        service.updateStateParameters('state3', 'state4');
        expect(service.parameters).toEqual({
            dashboard_state_id: 'state3',
            filter_state_id: 'state4',
            other_key: 'other_value'
        });
    });
});
