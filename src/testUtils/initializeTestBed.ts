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
import { async, inject, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatIconRegistry } from '@angular/material';
import { IconService } from '../app/services/icon.service';

export const initializeTestBed = (config) => {
    config.providers = config.providers || [];
    config.providers.push(IconService);
    config.providers.push(MatIconRegistry);
    config.imports = config.imports || [];
    config.imports.push(HttpClientModule);

    // From https://github.com/angular/angular/issues/12409#issuecomment-314814671
    let resetTestingModule = TestBed.resetTestingModule;

    beforeAll((done) => (async() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule(config);
        await TestBed.compileComponents();
        TestBed.resetTestingModule = () => TestBed;
    })().then(done).catch(done.fail));

    beforeAll(inject([IconService], (iconService) => {
        iconService.registerIcons();
    }));

    afterAll(() => {
        TestBed.resetTestingModule = resetTestingModule;
        TestBed.resetTestingModule();
    });
};
