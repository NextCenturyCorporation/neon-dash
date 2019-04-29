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
import { ViewContainerRef } from '@angular/core';

import { SaveStateComponent } from './save-state.component';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { MatSnackBar } from '@angular/material';
import { Dashboard } from '../../dataset';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { NeonGridItem } from '../../neon-grid-item';
import { neonEvents } from '../../neon-namespaces';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: SaveStateComponent', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let fixture: ComponentFixture<SaveStateComponent>;
    let component: SaveStateComponent;

    initializeTestBed('Save State', {
        declarations: [
            SaveStateComponent
        ],
        imports: [
            FormsModule,
            AppMaterialModule,
            BrowserAnimationsModule
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            MatSnackBar,
            { provide: AbstractWidgetService, useClass: WidgetService },
            ViewContainerRef,
            FilterService,
            { provide: 'config', useValue: testConfig }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SaveStateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected properties', () => {
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
        spyOn((component as any), 'openConnection').and.callFake(() => {
            return {
                deleteState: (data, successCallback) => {
                    calls++;
                    expect(data).toEqual('testState');

                    let successSpy = spyOn(component, 'handleDeleteStateSuccess');
                    successCallback();
                    expect(successSpy.calls.count()).toEqual(1);
                }
            };
        });

        component.deleteState('testState');
        expect(calls).toEqual(1);
        expect(spy.calls.count()).toEqual(1);
    });

    it('getDefaultOptionTitle does return expected string', () => {
        // TODO THOR-1133
    });

    it('handleDeleteStateSuccess does reset stateToDelete and call loadStateNames', () => {
        let spy = spyOn(component, 'loadStateNames');
        component.formData.stateToDelete = 'testState';
        (component as any).handleDeleteStateSuccess({}, 'testState');
        expect(component.formData.stateToDelete).toEqual('');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleLoadStateSuccess does reset stateToLoad and publish dashboard state event', () => {
        let spyDatasetService = spyOn((component as any).datasetService, 'appendDatasets').and.returnValue({
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
        let spyMessengerPublish = spyOn((component as any).messenger, 'publish');
        component.formData.stateToLoad = 'testState';
        (component as any).handleLoadStateSuccess({
            dashboards: {
                name: 'dashboard1'
            },
            datastores: {
                datastore1: {}
            },
            layouts: {
                layout1: []
            }
        }, 'testState');

        let savedStateDashboard = new Dashboard();
        savedStateDashboard.name = 'Saved State';
        savedStateDashboard.choices = {
            testState: {
                name: 'dashboard1'
            }
        };
        let expectedDashboard = new Dashboard();
        expectedDashboard.choices = {
            saved_state: savedStateDashboard
        };

        expect(component.formData.stateToDelete).toEqual('');
        expect(spyDatasetService.calls.count()).toEqual(1);
        expect(spyDatasetService.calls.argsFor(0)).toEqual([expectedDashboard, {
            datastore1: {}
        }, {
            layout1: []
        }]);
        expect(spyMessengerPublish.calls.count()).toEqual(1);
        expect(spyMessengerPublish.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_STATE, {
            dashboard: {
                name: 'dashboard1'
            }
        }]);
    });

    it('handleSaveStateSuccess does reset stateToSave and call loadStateNames', () => {
        let spy = spyOn(component, 'loadStateNames');
        component.formData.stateToSave = 'testState';
        (component as any).handleSaveStateSuccess({}, 'testState');
        expect(component.formData.stateToSave).toEqual('');
        expect(spy.calls.count()).toEqual(1);
    });

    it('loadState does call connection.loadState with expected data', () => {
        let spy = spyOn(component, 'closeSidenav');

        let calls = 0;
        spyOn((component as any), 'openConnection').and.callFake(() => {
            return {
                loadState: (data, successCallback) => {
                    calls++;
                    expect(data.stateName).toEqual('testState');

                    let successSpy = spyOn(component, 'handleLoadStateSuccess');
                    successCallback();
                    expect(successSpy.calls.count()).toEqual(1);
                }
            };
        });

        component.loadState('testState');
        expect(calls).toEqual(1);
        expect(spy.calls.count()).toEqual(1);
    });

    it('loadStateNames does call connection.getAllStateNames with expected behavior', () => {
        let calls = 0;
        spyOn((component as any), 'openConnection').and.callFake(() => {
            return {
                getAllStateNames: () => {
                    calls++;
                }
            };
        });

        (component as any).loadStateNames();
        expect(calls).toEqual(1);
        expect((component as any).isLoading).toEqual(true);
        expect(component.stateNames).toEqual([]);
    });

    it('openConfirmationDialog does open dialog', () => {
        // TODO THOR-1133
    });

    it('openNotification does open notification in snack bar', () => {
        // TODO THOR-1133
    });

    it('saveState does call connection.saveState with expected data', () => {
        let spy = spyOn(component, 'closeSidenav');

        let dashboard = new Dashboard();
        dashboard.datastores = [];
        dashboard.fullTitle = 'Full Title';
        dashboard.layout = 'layoutName';
        dashboard.layoutObject = [];
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

        spyOn((component as any).datasetService, 'getCurrentDashboard').and.returnValue(dashboard);
        spyOn((component as any).datasetService, 'getDatastoresInConfigFormat').and.returnValue(datastores);
        spyOn((component as any).filterService, 'getFiltersToSaveInConfig').and.returnValue(filters);
        spyOn((component as any), 'getWidgetById').and.callFake((id: string) => {
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
        spyOn((component as any), 'openConnection').and.callFake(() => {
            return {
                saveState: (data, successCallback) => {
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
                    expect(data.dashboards.layoutObject).toBeUndefined();
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
                    expect(data.layouts).toEqual({
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
                    });
                    expect(data.stateName).toEqual('testState');

                    let successSpy = spyOn(component, 'handleSaveStateSuccess');
                    successCallback();
                    expect(successSpy.calls.count()).toEqual(1);
                }
            };
        });

        component.saveState('testState');
        expect(calls).toEqual(1);
        expect(spy.calls.count()).toEqual(1);
    });
});
