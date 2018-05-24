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
import { ComponentFixture, async, TestBed } from '@angular/core/testing';

import { HttpModule } from '@angular/http';

import { AboutNeonComponent } from './about-neon.component';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { AppMaterialModule } from '../../app.material.module';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: AboutNeonComponent', () => {

    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let fixture: ComponentFixture<AboutNeonComponent>;
    let component: AboutNeonComponent;
    let neonStub: any = {
        util: {
            infoUtils: {
                getNeonVersion: (cb) => {
                    let result: any = {
                        name: 'neon-gtd',
                        version: 'test-version'
                    };
                    cb(result);
                }
            }
        }
    };

    initializeTestBed({
        declarations: [
            AboutNeonComponent
        ],
        imports: [
            HttpModule,
            AppMaterialModule
        ],
        providers: [
            { provide: 'config', useValue: testConfig },
            { provide: 'neon', useValue: neonStub }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AboutNeonComponent);
        component = fixture.componentInstance;
    });

    it('should create the AboutNeonComponent', async(() => {
        expect(component).toBeTruthy();
    }));
});
