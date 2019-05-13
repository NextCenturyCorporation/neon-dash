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
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { VisualizationContainerComponent } from './visualization-container.component';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { VisualizationContainerModule } from './visualization-container.module';

describe('Component: VisualizationContainer', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: VisualizationContainerComponent;
    let fixture: ComponentFixture<VisualizationContainerComponent>;

    initializeTestBed('Visualization Container', {
        providers: [
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            VisualizationContainerModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VisualizationContainerComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));
});
