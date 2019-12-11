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

import { ViewContainerRef, NgModuleFactoryLoader } from '@angular/core';

import { SaveStateComponent } from './save-state.component';

import { AbstractSearchService } from 'nucleus/dist/core/services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { NeonConfig } from '../../models/types';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { SearchServiceMock } from 'nucleus/dist/core/services/mock.search.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { ConfirmationDialogModule } from '../../components/confirmation-dialog/confirmation-dialog.module';

import { SaveStateModule } from './save-state.module';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { AppLazyModule } from '../../app-lazy.module';
import { DynamicDialogModule } from '../dynamic-dialog/dynamic-dialog.module';

const Modules = {
    './components/confirmation-dialog/confirmation-dialog.module#ConfirmationDialogModule': ConfirmationDialogModule
};

describe('Component: SaveStateComponent', () => {
    let fixture: ComponentFixture<SaveStateComponent>;
    let component: SaveStateComponent;

    initializeTestBed('Save State', {
        imports: [
            DynamicDialogModule,
            AppLazyModule,
            SaveStateModule,
            RouterTestingModule
        ],
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            ViewContainerRef
        ]
    });

    beforeEach(() => {
        const spyNgModuleFactoryLoader = TestBed.get(NgModuleFactoryLoader);
        spyNgModuleFactoryLoader.stubbedModules = Modules;

        fixture = TestBed.createComponent(SaveStateComponent);
        component = fixture.componentInstance;
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.ngOnInit = () => { /* Don't call loadStateNames. */ };
        fixture.detectChanges();
    });

    it('does have expected properties', () => {
        // TODO THOR-1133
    });

    it('does load state names on initialization', () => {
        // TODO THOR-1133
    });

    it('does have expected HTML elements with no state names', () => {
        // TODO THOR-1133
    });

    it('does have expected HTML elements with state names', () => {
        // TODO THOR-1133
    });

    it('Save button does call saveState', () => {
        // TODO THOR-1133
    });

    it('Load button does call loadState', () => {
        // TODO THOR-1133
    });

    it('Delete button does call deleteState', () => {
        // TODO THOR-1133
    });

    it('deleteState does call configService.delete with expected data', () => {
        let calls = 0;

        spyOn(component['configService'], 'delete').and.callFake((data) => {
            calls++;
            expect(data).toEqual('testState');
            return of(1);
        });

        component.deleteState('testState', false); // Bypass confirm

        expect(calls).toEqual(1);
    });

    it('deleteState will prompt if confirm is not set to false', () => {
        let deleteCalls = 0;
        let confirmCalls = 0;

        spyOn(component['configService'], 'delete').and.callFake(() => {
            deleteCalls++;
            return of(1);
        });

        let confirm = false; // Reject confirmation

        spyOn(component, 'openConfirmationDialog').and.callFake(() => {
            confirmCalls++;
            return of(confirm);
        });

        component.deleteState('testState'); // Require confirm

        expect(deleteCalls).toEqual(0);
        expect(confirmCalls).toEqual(1);

        component.deleteState('testState', true); // Require confirm

        expect(deleteCalls).toEqual(0);
        expect(confirmCalls).toEqual(2);

        confirm = true; // Accept
        component.deleteState('testState', true); // Require confirm

        expect(deleteCalls).toEqual(1);
        expect(confirmCalls).toEqual(3);
    });

    it('createState does call configService.save with expected data', () => {
        let calls = 0;

        spyOn(component['dashboardService'], 'createEmptyDashboardConfig').and.callFake(() => ({}));

        spyOn(component['configService'], 'save').and.callFake((data) => {
            calls++;
            expect(data).toEqual({});
            return of(1);
        });

        component.createState('testState');

        expect(calls).toEqual(1);
    });

    it('saveState does call configService.save with expected data', () => {
        let calls = 0;

        spyOn(component['dashboardService'], 'exportToConfig').and.callFake(() => ({}));

        spyOn(component['configService'], 'save').and.callFake((data) => {
            calls++;
            expect(data).toEqual({});
            return of(1);
        });

        component.saveState('testState', false); // Bypass confirm

        expect(calls).toEqual(1);
    });

    it('saveState will prompt if confirm is not set to false', () => {
        let saveCalls = 0;
        let confirmCalls = 0;

        spyOn(component['configService'], 'save').and.callFake(() => {
            saveCalls++;
            return of(1);
        });

        spyOn(component['dashboardService'], 'exportToConfig').and.callFake(() => ({}));

        let confirm = false; // Reject confirmation

        spyOn(component, 'openConfirmationDialog').and.callFake(() => {
            confirmCalls++;
            return of(confirm);
        });

        component.saveState('testState'); // Require confirm

        expect(saveCalls).toEqual(0);
        expect(confirmCalls).toEqual(1);

        component.saveState('testState', true); // Require confirm

        expect(saveCalls).toEqual(0);
        expect(confirmCalls).toEqual(2);

        confirm = true; // Accept
        component.saveState('testState', true); // Require confirm

        expect(saveCalls).toEqual(1);
        expect(confirmCalls).toEqual(3);
    });

    it('getDefaultOptionTitle does return expected string', () => {
        // TODO THOR-1133
    });

    it('loadState does call config.load with expected data, and activates returned config', () => {
        let spy = spyOn(component, 'closeSidenav');

        let loads = 0;
        let navigated = 0;
        spyOn(component['router'], 'navigate').and.callFake(() => {
            navigated += 1;
        });

        spyOn(component['configService'], 'load').and.callFake((data) => {
            loads++;
            expect(data).toEqual('testState');
            return of(NeonConfig.get({ name: 'testState' }));
        });

        component.loadState('testState');
        expect(loads).toEqual(1);
        expect(navigated).toEqual(1);
        expect(spy.calls.count()).toEqual(1);
    });

    it('loadState does drops config on invalid response', () => {
        let spy = spyOn(component, 'closeSidenav');

        let loads = 0;
        let activated = 0;

        spyOn(component['configService'], 'setActive').and.callFake(() => {
            activated += 1;
        });

        spyOn(component['configService'], 'load').and.callFake((data) => {
            loads++;
            expect(data).toEqual('badTestState');
            return throwError(new Error('Bad config'));
        });

        component.loadState('badTestState');
        expect(loads).toEqual(1);
        expect(activated).toEqual(0);
        expect(spy.calls.count()).toEqual(0);
    });

    it('listStates does call configService.list', () => {
        let calls = 0;
        spyOn(component['configService'], 'list').and.callFake(() => {
            calls++;
            return of({ results: [{}], total: 1 });
        });

        component.listStates();
        expect(calls).toEqual(1);
        expect(component.states.total).toEqual(1);
        expect(component.states.results).toEqual([{}]);
        expect(component['isLoading']).toEqual(false);
    });

    it('openConfirmationDialog does open dialog', () => {
        // TODO THOR-1133f
    });

    it('openNotification does open notification in snack bar', () => {
        // TODO THOR-1133
    });
});
