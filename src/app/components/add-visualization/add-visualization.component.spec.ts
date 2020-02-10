/**
 * Copyright 2019 Next Century Corporation
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
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatGridListModule, MatDividerModule } from '@angular/material';
import { } from 'jasmine-core';

import { AddVisualizationComponent } from './add-visualization.component';
import { AddVisualizationModule } from './add-visualization.module';

import { AbstractColorThemeService } from '@caci-critical-insight-solutions/nucleus-core';
import { ColorThemeService } from '../../services/color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: AddVisualization', () => {
    let component: AddVisualizationComponent;
    let fixture: ComponentFixture<AddVisualizationComponent>;
    let spyOnInit;

    initializeTestBed('Add Visualization', {
        providers: [
            { provide: AbstractColorThemeService, useClass: ColorThemeService },
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService
        ],
        imports: [
            MatDividerModule,
            MatGridListModule,
            AddVisualizationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddVisualizationComponent);
        component = fixture.componentInstance;
        spyOnInit = spyOn(component, 'ngOnInit');
        fixture.detectChanges();
    });

    it('tests default values', (() => {
        expect(component.showVisualizationsShortcut).toEqual(true);
        expect(component.selectedIndex).toEqual(-1);
        expect(component.messenger).toBeTruthy();
    }));

    it('Check that updateShowVisualizationsShortcut changes the correct booleans', (() => {
        let spyOnVisualizationsShortcut = spyOn(component, 'updateShowVisualizationsShortcut');
        let message = {
            show: false
        };

        expect(spyOnInit.calls.count()).toEqual(1);
        component.showVisualizationsShortcut = false;
        expect(component.showVisualizationsShortcut).toEqual(false);
        component.ngOnInit();
        expect(spyOnInit.calls.count()).toEqual(2);

        component.ngOnInit();
        component.updateShowVisualizationsShortcut(message);

        expect(spyOnInit.calls.count()).toEqual(3);
        expect(spyOnVisualizationsShortcut.calls.count()).toEqual(1);
    }));
});
