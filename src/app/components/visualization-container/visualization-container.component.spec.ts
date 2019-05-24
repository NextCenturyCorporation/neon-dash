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
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { VisualizationContainerComponent } from './visualization-container.component';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { ConfigService } from '../../services/config.service';
import { RouterTestingModule } from '@angular/router/testing';
import { NgModuleFactoryLoader } from '@angular/core';
import { AboutNeonModule } from '../about-neon/about-neon.module';
import { VisualizationContainerModule } from './visualization-container.module';
import { AppLazyModule } from '../../app-lazy.module';
import { AboutNeonComponent } from '../about-neon/about-neon.component';

describe('Component: VisualizationContainer', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: VisualizationContainerComponent;
    let fixture: ComponentFixture<VisualizationContainerComponent>;

    initializeTestBed('Visualization Container', {
        providers: [
            { provide: ConfigService, useValue: ConfigService.as(testConfig) }

        ],
        imports: [
            AppLazyModule,
            VisualizationContainerModule,
            RouterTestingModule
        ]
    });

    beforeEach(() => {
        const spyNgModuleFactoryLoader = TestBed.get(NgModuleFactoryLoader);
        spyNgModuleFactoryLoader.stubbedModules = {
            './components/about-neon/about-neon.module#AboutNeonModule': AboutNeonModule
        };

        fixture = TestBed.createComponent(VisualizationContainerComponent);
        component = fixture.componentInstance;
        component.visualization = { type: 'about-neon', config: {} } as any;
    });

    it('should create an instance', fakeAsync(() => {
        expect(component).toBeTruthy();
        fixture.detectChanges();
        tick(100);
        expect(component.injector).toBeTruthy();
        expect(component.injector.currentComponent).toBeTruthy();
        expect(component.injector.currentComponent.instance.constructor).toEqual(AboutNeonComponent);

    }));
});
