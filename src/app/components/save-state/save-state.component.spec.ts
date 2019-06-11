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

import { ViewContainerRef, NgModuleFactoryLoader } from '@angular/core';

import { SaveStateComponent } from './save-state.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { MatSnackBar } from '@angular/material';
import { NeonConfig } from '../../model/types';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { ConfirmationDialogModule } from '../../components/confirmation-dialog/confirmation-dialog.module';

import { SaveStateModule } from './save-state.module';
import { ConfigService } from '../../services/config.service';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { AppLazyModule } from '../../app-lazy.module';
import { DynamicDialogModule } from '../dynamic-dialog/dynamic-dialog.module';

const Modules = {
    './components/confirmation-dialog/confirmation-dialog.module#ConfirmationDialogModule': ConfirmationDialogModule
};


fdescribe('Component: SaveStateComponent', () => {
    let testConfig: NeonConfig = NeonConfig.get();
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
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: AbstractWidgetService, useClass: WidgetService },
            MatSnackBar,
            ViewContainerRef,
            { provide: ConfigService, useValue: ConfigService.as(testConfig) }
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

    it('deleteState does call connection.deleteState with expected data', () => {
        let spy = spyOn(component, 'closeSidenav');

        let calls = 0;
        spyOn(component, 'configService').and.callFake(() => ({
            delete: (data) => {
                calls++;
                expect(data).toEqual('testState');
                return of(null);
            }
        }));

        component.deleteState('testState');
        expect(calls).toEqual(1);
        expect(spy.calls.count()).toEqual(1);
    });

    it('getDefaultOptionTitle does return expected string', () => {
        // TODO THOR-1133
    });

    it('loadState does call config.load with expected data, and activates returned config', () => {
        let spy = spyOn(component, 'closeSidenav');


        let loads = 0;
        let activated = 0;
        spyOn(component, 'configService').and.callFake(() => ({
            setActive: (data) => {
                activated += 1;
            },
            load: (data) => {
                loads++;
                expect(data).toEqual('testState');
                return of(NeonConfig.get({ name: 'testState' }));
            }
        }));

        component.loadState('testState');
        expect(loads).toEqual(1);
        expect(activated).toEqual(1);
        expect(spy.calls.count()).toEqual(1);
    });

    it('loadState does drops config on invalid response', () => {
        let spy = spyOn(component, 'closeSidenav');


        let loads = 0;
        let activated = 0;

        spyOn(component, 'configService').and.callFake(() => ({
            setActive: (data) => {
                activated += 1;
            },
            load: (data) => {
                loads++;
                expect(data).toEqual('badTestState');
                return of({});
            }
        }));

        component.loadState('badTestState');
        expect(loads).toEqual(1);
        expect(activated).toEqual(0);
        expect(spy.calls.count()).toEqual(0);
    });

    it('listStates does call configService.list', () => {
        let calls = 0;
        spyOn(component, 'configService').and.callFake(() => ({
            list: () => {
                calls++;
                return of({ results: [], total: 0 })
            }
        }));

        component.listStates();
        expect(calls).toEqual(1);
        expect(component['isLoading']).toEqual(true);
        expect(component.states.results).toEqual([]);
    });

    it('openConfirmationDialog does open dialog', () => {
        // TODO THOR-1133f
    });

    it('openNotification does open notification in snack bar', () => {
        // TODO THOR-1133
    });
});
