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
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DashboardDropdownComponent } from './dashboard-dropdown.component';
import { NeonDashboardConfig } from '../../types';

import { DashboardDropdownModule } from './dashboard-dropdown.module';

let fixture: ComponentFixture<DashboardDropdownComponent>;
let component: DashboardDropdownComponent;

let dashboardTableKeys1: { [key: string]: string } = {};
dashboardTableKeys1.tableKey = 'datastore1.database1.table1';

let dashboardFieldKeys1: { [key: string]: string } = {};
dashboardFieldKeys1.fieldKey = 'datastore1.database1.table1.field1';

let dashboardTableKeys2: { [key: string]: string } = {};
dashboardTableKeys2.tableKey = 'datastore2.database2.table1';

let dashboardFieldKeys2: { [key: string]: string } = {};
dashboardFieldKeys2.fieldKey = 'datastore2.database2.table1.field1';

let choices: { [key: string]: NeonDashboardConfig } = {};
choices.dash1 = NeonDashboardConfig.get({
    pathFromTop: ['dash1'],
    name: 'Test Discovery Config',
    layout: 'DISCOVERY',
    tables: dashboardTableKeys1,
    fields: dashboardFieldKeys1,
});
choices.dash2 = NeonDashboardConfig.get({
    name: 'Other Config',
    pathFromTop: ['dash2'],
    category: 'Select an option...',
    choices: {
        nextChoice: {
            pathFromTop: ['dash2', 'nextChoice'],
            name: 'Last Config',
            layout: 'layout3',
            tables: dashboardTableKeys2,
            fields: dashboardFieldKeys2,
        }
    }
});

let dashboards = NeonDashboardConfig.get({
    category: 'Choose an option',
    filters: [],
    fullTitle: '',
    layout: '',
    pathFromTop: [],
    choices: choices
});

describe('Component: DashboardDropdown with input', () => {
    initializeTestBed('Dashboard Dropdown', {
        imports: [
            DashboardDropdownModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardDropdownComponent);
        component = fixture.componentInstance;
        component.dashboards = dashboards;
    });

    it('getDashboardKeys() should return an array of keys from dashboards object', (() => {
        expect(component.getDashboardKeys()).toEqual(['dash1', 'dash2']);
    }));

    it('getDashboardName() should return correct dashboard name', (() => {
        expect(component.getDashboardName('dash1')).toEqual('Test Discovery Config');
        expect(component.getDashboardName('dash2')).toEqual('Other Config');
    }));

    it('emitSelectedDashboard() should call detectChanges()', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.emitSelectedDashboard();
        expect(spy.calls.count()).toEqual(1);
    }));

    it('emitSelectedDashboard() should emit selectedDashboard if no more choices exists', (() => {
        let spy = spyOn(component.selectionChange, 'emit');

        component.selectedDashboard = component.dashboards.choices.dash1;

        component.emitSelectedDashboard();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.allArgs().length).toEqual(1);
        expect(spy.calls.allArgs()[0][0]).toEqual(component.selectedDashboard);
    }));

    it('emitSelectedDashboard() should emit nothing if selectedDashboard is populated but more choices exist', (() => {
        let spy = spyOn(component.selectionChange, 'emit');

        component.selectedDashboard = component.dashboards.choices.dash2;

        component.emitSelectedDashboard();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.allArgs().length).toEqual(1);
        expect(spy.calls.allArgs()[0][0]).toBeUndefined();
    }));

    it('hasMoreChoices() should return false if no more nested choices exist within the selectedDashboard', (() => {
        component.selectedDashboard = component.dashboards.choices.dash1;

        expect(component.hasMoreChoices()).toBeFalsy();
    }));

    it('hasMoreChoices() should return true if more nested choices exist within the selectedDashboard', (() => {
        component.selectedDashboard = component.dashboards.choices.dash2;

        expect(component.hasMoreChoices()).toBeTruthy();
    }));

    it('onChildSelectionChange() should emit event argument', (() => {
        let spy = spyOn(component.selectionChange, 'emit');
        let mockEvent = { event: 'test' };

        component.onChildSelectionChange(mockEvent);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.allArgs().length).toEqual(1);
        expect(spy.calls.allArgs()[0][0]).toEqual(mockEvent);
    }));

    it('selectDashboardChoice() should call emitSelectedDashboard()', (() => {
        let spy = spyOn(component, 'emitSelectedDashboard');

        component.selectDashboardChoice(component.dashboards, ['dash1'], 0, component);
        expect(spy.calls.count()).toEqual(1);
    }));

    it('selectDashboardChoice() should select correct dashboard choice', (() => {
        component.selectDashboardChoice(component.dashboards, ['dash1'], 0, component);

        expect(component.selectedDashboard).toEqual(component.dashboards.choices.dash1);
    }));
});

describe('Component: DashboardDropdown with no inputs', () => {
    initializeTestBed('Dashboard Dropdown', {
        imports: [
            DashboardDropdownModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardDropdownComponent);
        component = fixture.componentInstance;
    });

    it('selectDashboardChoice() should populate dashboards and call emitSelectedDashboard()', (() => {
        let spy = spyOn(component, 'emitSelectedDashboard');

        component.selectDashboardChoice(dashboards, ['dash1'], 0, component);
        expect(component.dashboards).toEqual(dashboards);
        expect(spy.calls.count()).toEqual(1);
    }));

    it('selectDashboardChoice() should populate dashboards and select correct dashboard choice', (() => {
        component.selectDashboardChoice(dashboards, ['dash1'], 0, component);

        expect(component.dashboards).toEqual(dashboards);
        expect(component.selectedDashboard).toEqual(component.dashboards.choices.dash1);
    }));

    it('selectDashboardChoice() should select correct dashboard choice and select the appropriate choice within the next dropdown', (() => {
        component.selectDashboardChoice(dashboards, ['dash2', 'nextChoice'], 0, component);

        expect(component.dashboards).toEqual(dashboards);
        expect(component.selectedDashboard).toEqual(component.dashboards.choices.dash2);
        expect(component.nextDropdown.dashboards).toEqual(component.dashboards.choices.dash2);
        expect(component.nextDropdown.selectedDashboard).toEqual(component.dashboards.choices.dash2.choices.nextChoice);
    }));
});
