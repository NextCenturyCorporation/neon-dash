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

import { ViewContainerRef } from '@angular/core';

import { SaveStateComponent } from './save-state.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { MatSnackBar } from '@angular/material';
import { Dashboard } from '../../types';
import { NeonGTDConfig, NeonDatastoreConfig } from '../../neon-gtd-config';

import { NeonGridItem } from '../../neon-grid-item';
import { neonEvents } from '../../neon-namespaces';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { SaveStateModule } from './save-state.module';
import { ConfigService } from '../../services/config.service';

describe('Component: SaveStateComponent', () => {
    let testConfig: NeonGTDConfig = NeonGTDConfig.get();
    let fixture: ComponentFixture<SaveStateComponent>;
    let component: SaveStateComponent;

    initializeTestBed('Save State', {
        imports: [
            SaveStateModule
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
        spyOn(component, 'closeSidenav');

        let calls = 0;
        let listCalls = 1;
        spyOn(component, 'openConnection').and.callFake(() => ({
            deleteState: (data, successCallback) => {
                calls++;
                expect(data).toEqual('testState');

                let successSpy = spyOn(component, 'handleDeleteStateSuccess');
                successCallback();
                expect(successSpy.calls.count()).toEqual(1);
            },
            listStates: (__data, callback) => {
                listCalls += 1;
                callback();
            }
        }));

        spyOn(component, 'fetchStates');

        component.deleteState('testState', false);
        expect(calls).toEqual(1);
        expect(listCalls).toEqual(1);
    });

    it('deleteState does validate the state name', () => {
        spyOn(component, 'closeSidenav');

        let calls = 0;
        spyOn(component, 'openConnection').and.callFake(() => ({
            deleteState: (data, __successCallback) => {
                calls++;
                expect(data).toEqual('folder.my-test.state_name1234');
            }
        }));

        component.deleteState('../folder/my-test.!@#$%^&*state_name`~?\\1234');
        expect(calls).toEqual(1);
    });

    it('getDefaultOptionTitle does return expected string', () => {
        // TODO THOR-1133
    });

    it('handleDeleteStateSuccess does reset stateToDelete and call fetchStates', () => {
        let spy = spyOn(component, 'fetchStates');
        component['handleDeleteStateSuccess']({}, 'testState');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleLoadStateSuccess does reset stateToLoad and publish dashboard state event', () => {
        let spyDashboardService = spyOn(component['dashboardService'], 'addDatastore').and.returnValue({
            choices: {
                saved_state: {
                    choices: {
                        testState: {
                            name: 'dashboard1'
                        }
                    }
                }
            }
        });
        let spyMessengerPublish = spyOn(component['messenger'], 'publish');
        component['handleLoadStateSuccess']({
            fileName: 'dashboard1',
            version: '1',
            lastModified: Date.now(),
            dashboards: {
                name: 'dashboard1'
            } as Dashboard, // TODO: Verify typings,
            datastores: {
                datastore1: {}
            } as any as Record<string, NeonDatastoreConfig>, // TODO: Verify typings
            layouts: {
                layout1: []
            }
        }, 'testState');

        let savedStateDashboard = Dashboard.get({
            name: 'dashboard1'
        });

        ; // TODO: Verify why this is what it is

        expect(spyDashboardService.calls.count()).toEqual(1);
        expect(spyDashboardService.calls.argsFor(0)).toEqual([
            savedStateDashboard,
            {
                datastore1: {}
            },
            {
                layout1: []
            }
        ]);
        expect(spyMessengerPublish.calls.count()).toEqual(1);
        const [type, { dashboard: { lastModified, ...dashboard } }] = spyMessengerPublish.calls.argsFor(0);
        expect([type, { dashboard }]).toEqual([neonEvents.DASHBOARD_STATE, {
            dashboard: {
                fileName: 'dashboard1',
                name: 'dashboard1'
            }
        }]);
        expect(lastModified).toBeDefined();
    });

    it('handleSaveStateSuccess does reset stateToSave and call fetchStates', () => { /* A
        component.current = Dashboard.get();
        component.current.lastModified = 0;
        component.current.modified = true;
        component['handleSaveStateSuccess']({}, 'testState');
        expect(component.current.lastModified).toBeGreaterThan(0);
        expect(component.current.modified).toBeFalsy();
    */ });

    it('loadState does call connection.loadState with expected data', () => {
        let spy = spyOn(component, 'closeSidenav');

        let calls = 0;
        spyOn(component, 'openConnection').and.callFake(() => ({
            loadState: (data, successCallback) => {
                calls++;
                expect(data).toEqual('testState');

                let successSpy = spyOn(component, 'handleLoadStateSuccess');
                successCallback();
                expect(successSpy.calls.count()).toEqual(1);
            }
        }));

        component.loadState('testState');
        expect(calls).toEqual(1);
        expect(spy.calls.count()).toEqual(1);
    });

    it('loadState does validate the state name', () => {
        spyOn(component, 'closeSidenav');

        let calls = 0;
        spyOn(component, 'openConnection').and.callFake(() => ({
            loadState: (data, __successCallback) => {
                calls++;
                expect(data).toEqual('folder.my-test.state_name1234');
            }
        }));

        component.loadState('../folder/my-test.!@#$%^&*state_name`~?\\1234');
        expect(calls).toEqual(1);
    });

    it('fetchStates does call connection.listStates with expected behavior', () => {
        let calls = 0;
        spyOn(component, 'openConnection').and.callFake(() => ({
            listStates: () => {
                calls++;
            }
        }));

        component['fetchStates']();
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

    it('saveState does call connection.saveState with expected data', () => {
        let spy = spyOn(component, 'closeSidenav');

        let dashboard = Dashboard.get();
        dashboard.datastores = {};
        dashboard.fullTitle = 'Full Title';
        dashboard.layout = 'layoutName';
        dashboard.name = 'dashName';
        dashboard.pathFromTop = ['a', 'b', 'c', 'd'];

        dashboard.tables = {
            table_key_1: 'datastore1.databaseZ.tableA',
            table_key_2: 'datastore2.databaseY.tableB'
        };
        dashboard.fields = {
            field_key_1: 'datastore1.databaseZ.tableA.field1',
            field_key_2: 'datastore2.databaseY.tableB.field2'
        };
        dashboard.options = {
            simpleFilter: {
                databaseName: 'databaseZ',
                tableName: 'tableA',
                fieldName: 'field1'
            }
        };

        let datastores = {
            datastore1: {
                host: 'host1',
                type: 'type1',
                databases: {
                    databaseZ: {
                        tables: {
                            tableA: {}
                        }
                    }
                }
            },
            datastore2: {
                host: 'host2',
                type: 'type2',
                databases: {
                    databaseY: {
                        tables: {
                            tableB: {},
                            tableC: {}
                        }
                    },
                    databaseX: {
                        tables: {
                            tableD: {}
                        }
                    }
                }
            },
            datastore3: {
                host: 'host3',
                type: 'type3',
                databases: {
                    databaseW: {
                        tables: {
                            tableE: {}
                        }
                    }
                }
            }
        };

        let filters = [{
            optional: true,
            datastore: 'datastore1',
            database: 'databaseZ',
            table: 'tableA',
            field: 'field1',
            operator: '=',
            value: 'value1'
        }, {
            optional: false,
            type: 'and',
            filters: [{
                datastore: 'datastore1',
                database: 'databaseY',
                table: 'tableB',
                field: 'field2',
                operator: '!=',
                value: ''
            }, {
                datastore: 'datastore1',
                database: 'databaseY',
                table: 'tableB',
                field: 'field2',
                operator: '!=',
                value: null
            }]
        }];

        spyOn(component['dashboardState'], 'dashboard').and.returnValue(dashboard);
        spyOn(component['dashboardService'], 'getDatastoresInConfigFormat').and.returnValue(datastores);
        spyOn(component['filterService'], 'getFiltersToSaveInConfig').and.returnValue(filters);
        spyOn(component, 'getWidgetById').and.callFake((id: string) => {
            if (id === 'id1') {
                return {
                    getBindings: () => ({
                        binding1: 'a',
                        binding2: 'b'
                    })
                };
            }

            if (id === 'id2') {
                return {
                    getBindings: () => ({
                        binding3: 'c',
                        binding4: 'd'
                    })
                };
            }

            return null;
        });

        component.widgetGridItems = [{
            id: 'id1',
            col: 1,
            row: 2,
            sizex: 3,
            sizey: 4,
            type: 'type1'
        } as NeonGridItem, {
            id: 'id2',
            col: 5,
            row: 6,
            sizex: 7,
            sizey: 8,
            type: 'type2'
        } as NeonGridItem];

        let calls = 0;
        spyOn(component, 'openConnection').and.callFake(() => ({
            saveState: (data: NeonGTDConfig<Dashboard>, successCallback) => {
                calls++;
                expect(data.dashboards.fullTitle).toEqual('Full Title');
                expect(data.dashboards.layout).toEqual('testState');
                expect(data.dashboards.name).toEqual('testState');
                expect(data.dashboards.tables).toEqual({
                    table_key_1: 'datastore1.databaseZ.tableA',
                    table_key_2: 'datastore2.databaseY.tableB'
                });
                expect(data.dashboards.fields).toEqual({
                    field_key_1: 'datastore1.databaseZ.tableA.field1',
                    field_key_2: 'datastore2.databaseY.tableB.field2'
                });
                expect(data.dashboards.options).toEqual({
                    connectOnLoad: true,
                    simpleFilter: {
                        databaseName: 'databaseZ',
                        tableName: 'tableA',
                        fieldName: 'field1'
                    }
                });
                expect(data.dashboards.datastores).toBeUndefined();
                expect(data.dashboards.pathFromTop).toBeUndefined();
                expect(data.dashboards.filters).toEqual([{
                    optional: true,
                    datastore: 'datastore1',
                    database: 'databaseZ',
                    table: 'tableA',
                    field: 'field1',
                    operator: '=',
                    value: 'value1'
                }, {
                    optional: false,
                    type: 'and',
                    filters: [{
                        datastore: 'datastore1',
                        database: 'databaseY',
                        table: 'tableB',
                        field: 'field2',
                        operator: '!=',
                        value: ''
                    }, {
                        datastore: 'datastore1',
                        database: 'databaseY',
                        table: 'tableB',
                        field: 'field2',
                        operator: '!=',
                        value: null
                    }]
                }]);
                expect(data.datastores).toEqual(datastores);
                expect(data.layouts).toEqual(
                    {
                        testState: [{
                            col: 1,
                            row: 2,
                            sizex: 3,
                            sizey: 4,
                            type: 'type1',
                            bindings: {
                                binding1: 'a',
                                binding2: 'b'
                            }
                        }, {
                            col: 5,
                            row: 6,
                            sizex: 7,
                            sizey: 8,
                            type: 'type2',
                            bindings: {
                                binding3: 'c',
                                binding4: 'd'
                            }
                        }]
                    }
                );
                expect(data.projectTitle).toEqual('testState');

                let successSpy = spyOn(component, 'handleSaveStateSuccess');
                successCallback();
                expect(successSpy.calls.count()).toEqual(1);
            }
        }));

        component.saveState('testState');
        expect(calls).toEqual(1);
        expect(spy.calls.count()).toEqual(1);
    });

    it('saveState does validate the state name', () => {
        spyOn(component, 'closeSidenav');
        spyOn(component['dashboardState'], 'dashboard').and.returnValue(Dashboard.get());
        spyOn(component['dashboardService'], 'getDatastoresInConfigFormat').and.returnValue([]);
        spyOn(component['filterService'], 'getFiltersToSaveInConfig').and.returnValue([]);
        spyOn(component, 'getWidgetById').and.returnValue(null);
        component.widgetGridItems = [];

        let calls = 0;
        spyOn(component, 'openConnection').and.callFake(() => ({
            saveState: (data, __successCallback) => {
                calls++;
                expect(data.projectTitle).toEqual('folder.my-test.state_name1234');
            }
        }));

        component.saveState('../folder/my-test.!@#$%^&*state_name`~?\\1234');
        expect(calls).toEqual(1);
    });
});
