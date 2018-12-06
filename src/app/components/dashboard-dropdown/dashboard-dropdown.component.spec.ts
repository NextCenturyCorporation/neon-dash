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

import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DashboardDropdownComponent } from './dashboard-dropdown.component';
import { DashboardOptions, Dashboard } from '../../dataset';

describe('Component: DashboardDropdown with input', () => {
    let fixture: ComponentFixture<DashboardDropdownComponent>;
    let component: DashboardDropdownComponent;

    /* tslint:disable:no-string-literal */
    let dashboardTableKeys1 = new Map<string, string>();
    dashboardTableKeys1['tableKey'] = 'datastore1.database1.table1';

    let dashboardFieldKeys1 = new Map<string, string>();
    dashboardFieldKeys1['fieldKey'] = 'datastore1.database1.table1.field1';

    let dashboardTableKeys2 = new Map<string, string>();
    dashboardTableKeys2['tableKey'] = 'datastore2.database2.table1';

    let dashboardFieldKeys2 = new Map<string, string>();
    dashboardFieldKeys2['fieldKey'] = 'datastore2.database2.table1.field1';

    let choices = new Map<string, Dashboard>();
    choices['dash1'] = {
        pathFromTop: 'choices.dash1',
        name: 'Test Discovery Config',
        layout: 'DISCOVERY',
        datastore: 'datastore1',
        tables: dashboardTableKeys1,
        fields: dashboardFieldKeys1,
        options: new DashboardOptions()
    };
    choices['dash2'] = {
        name: 'Other Config',
        pathFromTop: 'choices.dash2',
        category: 'Select an option...',
        choices: {
            nextChoice: {
                pathFromTop: 'choices.dash2.choices.nextChoice',
                name: 'Last Config',
                layout: 'layout3',
                datastore: 'datastore2',
                tables: dashboardTableKeys2,
                fields: dashboardFieldKeys2,
                options: new DashboardOptions()
            }
        }
    };

    let dashboards = {
        category: 'Choose an option',
        choices: choices
    };
    /* tslint:enable:no-string-literal */

    initializeTestBed({
        declarations: [
            DashboardDropdownComponent
        ],
        imports: [
            FormsModule,
            AppMaterialModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardDropdownComponent);
        component = fixture.componentInstance;
        component.dashboards = dashboards;
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));

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

        /* tslint:disable:no-string-literal */
        component.selectedDashboard = component.dashboards.choices['dash1'];
        /* tslint:enable:no-string-literal */

        component.emitSelectedDashboard();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.allArgs().length).toEqual(1);
        expect(spy.calls.allArgs()[0][0]).toEqual(component.selectedDashboard);
    }));

    it('emitSelectedDashboard() should emit nothing if selectedDashboard is populated but more choices exist', (() => {
        let spy = spyOn(component.selectionChange, 'emit');

        /* tslint:disable:no-string-literal */
        component.selectedDashboard = component.dashboards.choices['dash2'];
        /* tslint:enable:no-string-literal */

        component.emitSelectedDashboard();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.allArgs().length).toEqual(1);
        expect(spy.calls.allArgs()[0][0]).toBeUndefined();
    }));

    it('hasMoreChoices() should return false if no more nested choices exist within the selectedDashboard', (() => {
        /* tslint:disable:no-string-literal */
        component.selectedDashboard = component.dashboards.choices['dash1'];
        /* tslint:enable:no-string-literal */

        expect(component.hasMoreChoices()).toBeFalsy();
    }));

    it('hasMoreChoices() should return true if more nested choices exist within the selectedDashboard', (() => {
        /* tslint:disable:no-string-literal */
        component.selectedDashboard = component.dashboards.choices['dash2'];
        /* tslint:enable:no-string-literal */

        expect(component.hasMoreChoices()).toBeTruthy();
    }));

    it('onSelectionChange() should emit event argument', (() => {
        let spy = spyOn(component.selectionChange, 'emit');
        let mockEvent = {event: 'test'};

        component.onSelectionChange(mockEvent);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.allArgs().length).toEqual(1);
        expect(spy.calls.allArgs()[0][0]).toEqual(mockEvent);
    }));

    it('selectDashboardChoice() should call emitSelectedDashboard()', (() => {
        let spy = spyOn(component, 'emitSelectedDashboard');

        /* tslint:disable:no-string-literal */
        component.selectDashboardChoice(component.dashboards, ['dash1'], 0, component);
        expect(spy.calls.count()).toEqual(1);
        /* tslint:enable:no-string-literal */
    }));

    it('selectDashboardChoice() should select correct dashboard choice', (() => {
        /* tslint:disable:no-string-literal */
        component.selectDashboardChoice(component.dashboards, ['dash1'], 0, component);

        expect(component.selectedDashboard).toEqual(component.dashboards.choices['dash1']);
        /* tslint:enable:no-string-literal */
    }));
});

describe('Component: DashboardDropdown with no inputs', () => {
    let fixture: ComponentFixture<DashboardDropdownComponent>;
    let component: DashboardDropdownComponent;

    /* tslint:disable:no-string-literal */
    let dashboardTableKeys1 = new Map<string, string>();
    dashboardTableKeys1['tableKey'] = 'datastore1.database1.table1';

    let dashboardFieldKeys1 = new Map<string, string>();
    dashboardFieldKeys1['fieldKey'] = 'datastore1.database1.table1.field1';

    let dashboardTableKeys2 = new Map<string, string>();
    dashboardTableKeys2['tableKey'] = 'datastore2.database2.table1';

    let dashboardFieldKeys2 = new Map<string, string>();
    dashboardFieldKeys2['fieldKey'] = 'datastore2.database2.table1.field1';

    let choices = new Map<string, Dashboard>();
    choices['dash1'] = {
        pathFromTop: 'choices.dash1',
        name: 'Test Discovery Config',
        layout: 'DISCOVERY',
        datastore: 'datastore1',
        tables: dashboardTableKeys1,
        fields: dashboardFieldKeys1,
        options: new DashboardOptions()
    };
    choices['dash2'] = {
        name: 'Other Config',
        pathFromTop: 'choices.dash2',
        category: 'Select an option...',
        choices: {
            nextChoice: {
                pathFromTop: 'choices.dash2.choices.nextChoice',
                name: 'Last Config',
                layout: 'layout3',
                datastore: 'datastore2',
                tables: dashboardTableKeys2,
                fields: dashboardFieldKeys2,
                options: new DashboardOptions()
            }
        }
    };

    let dashboards = {
        category: 'Choose an option',
        choices: choices
    };
    /* tslint:enable:no-string-literal */

    initializeTestBed({
        declarations: [
            DashboardDropdownComponent
        ],
        imports: [
            FormsModule,
            AppMaterialModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardDropdownComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));

    it('selectDashboardChoice() should populate dashboards and call emitSelectedDashboard()', (() => {
        let spy = spyOn(component, 'emitSelectedDashboard');

        /* tslint:disable:no-string-literal */
        component.selectDashboardChoice(dashboards, ['dash1'], 0, component);
        expect(component.dashboards).toEqual(dashboards);
        expect(spy.calls.count()).toEqual(1);
        /* tslint:enable:no-string-literal */
    }));

    it('selectDashboardChoice() should populate dashboards and select correct dashboard choice', (() => {
        /* tslint:disable:no-string-literal */
        component.selectDashboardChoice(dashboards, ['dash1'], 0, component);

        expect(component.dashboards).toEqual(dashboards);
        expect(component.selectedDashboard).toEqual(component.dashboards.choices['dash1']);
        /* tslint:enable:no-string-literal */
    }));

    it('selectDashboardChoice() should select correct dashboard choice and select the appropriate choice within the next dropdown', (() => {
        /* tslint:disable:no-string-literal */
        component.selectDashboardChoice(dashboards, ['dash2', 'nextChoice'], 0, component);

        expect(component.dashboards).toEqual(dashboards);
        expect(component.selectedDashboard).toEqual(component.dashboards.choices['dash2']);
        expect(component.nextDropdown.dashboards).toEqual(component.dashboards.choices['dash2']);
        expect(component.nextDropdown.selectedDashboard).toEqual(component.dashboards.choices['dash2'].choices['nextChoice']);
        /* tslint:enable:no-string-literal */
    }));
});
