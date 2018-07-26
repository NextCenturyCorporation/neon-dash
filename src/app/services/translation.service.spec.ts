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
import { HttpModule } from '@angular/http';
import { TranslationService } from './translation.service';
import { ConnectionService } from './connection.service';
import { NeonGTDConfig } from '../neon-gtd-config';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

describe('Service: Translation', () => {

    let testConfig: NeonGTDConfig = new NeonGTDConfig();

    initializeTestBed({
        providers: [
            TranslationService,
            ConnectionService,
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            HttpModule
        ]
    });

    it('should ...', inject([TranslationService], (service: TranslationService) => {
        expect(service).toBeTruthy();
    }));
});
