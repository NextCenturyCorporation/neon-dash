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
///<reference path="../../node_modules/@types/jasmine/index.d.ts"/>
import { async, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

export const initializeTestBed = (name, config: Parameters<TestBed['configureTestingModule']>[0], all = true) => {
    config.providers = config.providers || [];
    config.imports = config.imports || [];
    config.imports.push(NoopAnimationsModule);

    // From https://github.com/angular/angular/issues/12409#issuecomment-314814671
    let resetTestingModule = TestBed.resetTestingModule;

    beforeAll(() => {
        /* tslint:disable-next-line:no-console */
        console.log('STARTING ' + name.toUpperCase() + ' TESTS...');
    });

    (all ? beforeAll : beforeEach)((done) => (async () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule(config);
        await TestBed.compileComponents();
        TestBed.resetTestingModule = () => TestBed;
    })().then(done).catch(done.fail));

    (all ? afterAll : afterEach)(() => {
        TestBed.resetTestingModule = resetTestingModule;
        TestBed.resetTestingModule();
    });
};
