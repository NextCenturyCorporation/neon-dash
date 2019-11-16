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
import { ComponentFixture, async, TestBed } from '@angular/core/testing';

import { DashboardSelectorComponent } from './dashboard-selector.component';
import { NeonDashboardChoiceConfig } from '../../models/types';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { DashboardSelectorModule } from './dashboard-selector.module';
import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { DashboardService } from '../../services/dashboard.service';
import { RouterTestingModule } from '@angular/router/testing';

let dashboards = NeonDashboardChoiceConfig.get({
    category: 'Choose an option',
    choices: {
        dash1: {
            fullTitle: ['Test Discovery Config'],
            layout: 'DISCOVERY',
            tables: {
                tableKey: 'datastore1.database1.table1'
            },
            fields: {
                fieldKey: 'datastore1.database1.table1.field1'
            }
        },
        dash2: {
            fullTitle: ['Other Config'],
            category: 'Select an option...',
            choices: {
                nextChoice: {
                    fullTitle: ['Other Config', 'Last Config'],
                    layout: 'layout3',
                    tables: {
                        tableKey: 'datastore2.database2.table1'
                    },
                    fields: {
                        fieldKey: 'datastore2.database2.table1.field1'
                    }
                }
            }
        }
    }
});

describe('Component: Dashboard Selector', () => {
    let fixture: ComponentFixture<DashboardSelectorComponent>;
    let component: DashboardSelectorComponent;

    initializeTestBed('Dashboard Selector', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ],
        imports: [
            RouterTestingModule,
            DashboardSelectorModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardSelectorComponent);
        component = fixture.componentInstance;
        component.dashboards = dashboards;
        component.ngOnInit();
    });

    it('should create an instance', async(() => {
        expect(component).toBeTruthy();
    }));

    it('getNextChoices() should return an array of dashboards from the choices field', (() => {
        expect(component.getNextChoices(dashboards).map((choice) => choice.name)).toEqual(['dash1', 'dash2']);
    }));

    it('getDashboardName() should return correct dashboard name', (() => {
        const choices = component.getNextChoices(component.dashboards);
        expect(choices.find((ch) => ch.name === 'dash1').fullTitle).toEqual(['Test Discovery Config']);
        expect(choices.find((ch) => ch.name === 'dash2').fullTitle).toEqual(['Other Config']);
    }));

    it('updateDashboardState() should navigate to dashboard name', (() => {
        let spy = spyOn(component['router'], 'navigate');

        component.updateDashboardState(dashboards.choices.dash1);
        expect(spy.calls.count()).toEqual(1);
        const [path, params] = spy.calls.argsFor(0);
        expect(path).toEqual(['/']);
        expect(params.queryParams).toEqual({
            dashboard: '-/dash1'
        });
    }));

    it('selectDashboard() should set dashboardChoice if no more choices exists', (() => {
        const next = component.getNextChoices(component.dashboards)[0];
        component.selectDashboard(next, 1);

        expect(component.dashboardChoice).toEqual(next);
    }));

    it('selectDashboard() should add choice to choices, if there are still more decisions to make', (() => {
        const next = component.getNextChoices(component.dashboards)[1];
        component.selectDashboard(next, 1);

        expect(component.choiceNodes.length).toEqual(2);
        expect(component.choiceNodes.pop()).toEqual(next);
        expect(component.dashboardChoice).toBeUndefined();
    }));

    it('nextChoices() should return empty  if no more nested choices exist', (() => {
        const next = component.getNextChoices(component.dashboards)[0];
        expect(component.getNextChoices(next)).toEqual([]);
    }));

    it('nextChoices() should return choice list if more nested choices exist', (() => {
        const next = component.getNextChoices(component.dashboards)[1];
        expect(component.getNextChoices(next)).toEqual(
            Object.values((next as NeonDashboardChoiceConfig).choices || {}).sort((db1, db2) => db1.name.localeCompare(db2.name))
        );
    }));

    it('computePath() should compute the appropriate path from a selected dashboard', () => {
        const next = (dashboards.choices.dash2 as NeonDashboardChoiceConfig).choices.nextChoice;
        expect(component.choiceNodes).toEqual([dashboards]);

        component.onDashboardStateChange(next);
        expect(component.choiceNodes.length).toEqual(2);
        expect(component.choiceNodes.map((dash) => dash.name))
            .toEqual([dashboards, dashboards.choices.dash2].map((dash) => dash.name));

        expect(component.choices.length).toEqual(3);
        expect(component.choices.map((dash) => dash.name)).toEqual(
            [dashboards, dashboards.choices.dash2, next].map((dash) => dash.name)
        );

        component.onDashboardStateChange(undefined);

        expect(component.choices.length).toEqual(1);
        expect(component.choices).toEqual([dashboards]);
    });
});
