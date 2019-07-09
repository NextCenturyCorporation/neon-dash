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
import { inject } from '@angular/core/testing';

import { NeonConfig, NeonDashboardLeafConfig, FilterConfig } from '../models/types';
import { NeonDatastoreConfig } from '../models/dataset';
import { DashboardService } from './dashboard.service';

import { initializeTestBed, getConfigService } from '../../testUtils/initializeTestBed';
import { DashboardServiceMock, MockConnectionService } from '../../testUtils/MockServices/DashboardServiceMock';
import { ConfigService } from './config.service';

import * as _ from 'lodash';
import { InjectableFilterService } from './injectable.filter.service';
import { ConfigUtil } from '../util/config.util';

function extractNames(data: { [key: string]: any } | any[]) {
    if (Array.isArray(data)) {
        return data.map((el) => extractNames(el));
    } else if (_.isPlainObject(data)) {
        if ('columnName' in data || 'name' in data) {
            return data['columnName'] || data['name'];
        }
        const out = {};
        for (const key of Object.keys(data)) {
            out[key] = extractNames(data[key]);
        }
        return out;
    }
    return data;
}

describe('Service: DashboardService', () => {
    let dashboardService: DashboardService;

    initializeTestBed('Dashboard Service', {
        providers: [
            DashboardService,
            InjectableFilterService
        ]
    });

    beforeEach(inject([DashboardService], (_dashboardService: DashboardService) => {
        dashboardService = _dashboardService;
    }));

    it('should have no active datastores at creation', () => {
        expect(dashboardService.state.datastore).toEqual(NeonDatastoreConfig.get());
    });

    it('should have no active dashboards at creation', () => {
        expect(dashboardService.state.dashboard.name).not.toBeDefined();
    });

    it('should return datastores by name', () => {
        dashboardService.addDatastore({
            name: 'd1',
            host: '',
            type: '',
            databases: {}
        });

        expect(dashboardService.config.datastores.d1).toEqual({
            name: 'd1',
            host: '',
            type: '',
            databases: {}
        });
    });

    it('setActiveDashboard should translate string filter list', () => {
        let spy = spyOn(dashboardService['filterService'], 'setFiltersFromConfig');

        dashboardService.setActiveDashboard(NeonDashboardLeafConfig.get({
            filters: ConfigUtil.translate(JSON.stringify(JSON.parse(`[
                [".databaseZ.tableA.field1","=","value1","or"],
                ["and", "and",
                    [".databaseY.tableB.field2", "!=", "", "or"],
                    [".databaseY.tableB.field2", "!=", null, "or"]
                ]
            ]`)), ConfigUtil.encodeFiltersMap)
        }));

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)[0]).toEqual([{
            root: 'or',
            datastore: '',
            database: 'databaseZ',
            table: 'tableA',
            field: 'field1',
            operator: '=',
            value: 'value1'
        }, {
            root: 'and',
            type: 'and',
            filters: [{
                root: 'or',
                datastore: '',
                database: 'databaseY',
                table: 'tableB',
                field: 'field2',
                operator: '!=',
                value: ''
            }, {
                root: 'or',
                datastore: '',
                database: 'databaseY',
                table: 'tableB',
                field: 'field2',
                operator: '!=',
                value: null
            }]
        }]);
    });
});

describe('Service: DashboardService with Mock Data', () => {
    let dashboardService: DashboardService;
    let configService: ConfigService;

    beforeEach(() => {
        configService = getConfigService();
        dashboardService = new DashboardServiceMock(configService);
    });

    it('should have active datastore at creation', () => {
        let datastore = { name: 'datastore1', host: 'testHostname', type: 'testDatastore', databases: {} };
        datastore.databases = DashboardServiceMock.DATABASES;
        datastore['hasUpdatedFields'] = true;
        expect(dashboardService.state.datastore).toEqual(datastore);
    });

    it('should have active dashboard at creation', () => {
        let dashboard = NeonDashboardLeafConfig.get({
            name: 'Test Discovery Config',
            layout: 'DISCOVERY',
            options: {},
            visualizationTitles: {
                dataTableTitle: 'Documents'
            },
            tables: {
                table_key_1: 'datastore1.testDatabase1.testTable1',
                table_key_2: 'datastore1.testDatabase2.testTable2'
            },
            fields: {
                field_key_1: 'datastore1.testDatabase1.testTable1.testFieldKeyField'
            },
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
                [
                    ['datastore1.testDatabase1.testTable1.testRelationFieldB'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldB']
                ]
            ]
        });
        expect(dashboardService.state.dashboard).toEqual(dashboard);
    });

    it('findRelationDataList does work with relations in string list structure', () => {
        dashboardService.setActiveDatastore(NeonDatastoreConfig.get({
            name: 'datastore1',
            databases: {
                testDatabase1: {
                    tables: {
                        testTable1: {
                            fields: [
                                { columnName: 'testRelationFieldA', prettyName: 'Pretty' },
                                { columnName: 'testRelationFieldB', prettyName: 'Pretty' }
                            ]
                        }
                    }
                },
                testDatabase2: {
                    tables: {
                        testTable2: {
                            fields: [
                                { columnName: 'testRelationFieldA', prettyName: 'Pretty' },
                                { columnName: 'testRelationFieldB', prettyName: 'Pretty' }
                            ]
                        }
                    }
                }
            }
        }));

        dashboardService.setActiveDashboard(NeonDashboardLeafConfig.get({
            tables: {
                testTable1: 'datastore1.testDatabase1.testTable1',
                testTable2: 'datastore1.testDatabase1.testTable2'
            },
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
                ['datastore1.testDatabase1.testTable1.testRelationFieldB', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        }));

        expect(extractNames(dashboardService.state.findRelationDataList())).toEqual(extractNames([
            [
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_A
                }],
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_A
                }]
            ],
            [
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_B
                }],
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_B
                }]
            ]
        ]));
    });

    it('findRelationDataList does work with relations in nested list structure', () => {
        dashboardService.setActiveDatastore(NeonDatastoreConfig.get({
            name: 'datastore1',
            databases: {
                testDatabase1: {
                    tables: {
                        testTable1: {
                            fields: [
                                { columnName: 'testRelationFieldA', prettyName: 'Pretty' },
                                { columnName: 'testRelationFieldB', prettyName: 'Pretty' }
                            ]
                        }
                    }
                },
                testDatabase2: {
                    tables: {
                        testTable2: {
                            fields: [
                                { columnName: 'testRelationFieldA', prettyName: 'Pretty' },
                                { columnName: 'testRelationFieldB', prettyName: 'Pretty' }
                            ]
                        }
                    }
                }
            }
        }));

        dashboardService.setActiveDashboard(NeonDashboardLeafConfig.get({
            tables: {
                testTable1: 'datastore1.testDatabase1.testTable1',
                testTable2: 'datastore1.testDatabase1.testTable2'
            },
            relations: [
                [
                    ['datastore1.testDatabase1.testTable1.testRelationFieldA'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA']
                ],
                [
                    ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase1.testTable1.testRelationFieldB'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
                ]
            ]
        }));

        expect(extractNames(dashboardService.state.findRelationDataList())).toEqual(extractNames([
            [
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_A
                }],
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_A
                }]
            ],
            [
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_A
                }, {
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_B
                }],
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_A
                }, {
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_B
                }]
            ]
        ]));
    });

    it('findRelationDataList does work with relations in both structures', () => {
        spyOn(dashboardService.state, 'dashboard').and.returnValue({
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', ['datastore1.testDatabase2.testTable2.testRelationFieldA']],
                [['datastore1.testDatabase1.testTable1.testRelationFieldB'], 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        });

        expect(extractNames(dashboardService.state.findRelationDataList())).toEqual(extractNames([
            [
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_A
                }],
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_A
                }]
            ],
            [
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_B
                }],
                [{
                    datastore: DashboardServiceMock.DATASTORE,
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.FIELD_MAP.RELATION_B
                }]
            ]
        ]));
    });

    it('findRelationDataList does ignore relations on databases/tables/fields that don\'t exist', () => {
        dashboardService.setActiveDatastore(NeonDatastoreConfig.get({
            name: 'datastore1',
            databases: {
                testDatabase1: {
                    tables: {
                        testTable1: {
                            fields: [
                                { columnName: 'testRelationFieldA', prettyName: 'Pretty' },
                                { columnName: 'testRelationFieldB', prettyName: 'Pretty' }
                            ]
                        }
                    }
                },
                testDatabase2: {
                    tables: {
                        testTable2: {
                            fields: [
                                { columnName: 'testRelationFieldA', prettyName: 'Pretty' },
                                { columnName: 'testRelationFieldB', prettyName: 'Pretty' }
                            ]
                        }
                    }
                }
            }
        }));

        dashboardService.setActiveDashboard(NeonDashboardLeafConfig.get({
            tables: {
                testTable1: 'datastore1.testDatabase1.testTable1',
                testTable2: 'datastore1.testDatabase2.testTable2'
            },
            relations: [
                ['datastore1.fakeDatabase1.testTable1.testRelationFieldA', 'datastore1.fakeDatabase2.testTable2.testRelationFieldA'],
                ['datastore1.testDatabase1.fakeTable1.testRelationFieldA', 'datastore1.testDatabase2.fakeTable2.testRelationFieldA'],
                ['datastore1.testDatabase1.testTable1.fakeRelationFieldA', 'datastore1.testDatabase2.testTable2.fakeRelationFieldA'],
                [
                    ['datastore1.fakeDatabase1.testTable1.fakeRelationFieldA', 'datastore1.fakeDatabase1.testTable1.fakeRelationFieldA'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
                ],
                [
                    ['datastore1.testDatabase1.fakeTable1.fakeRelationFieldA', 'datastore1.testDatabase1.fakeTable1.fakeRelationFieldA'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
                ],
                [
                    ['datastore1.testDatabase1.testTable1.fakeRelationFieldA', 'datastore1.testDatabase1.testTable1.fakeRelationFieldA'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
                ]
            ]
        }));

        expect(extractNames(dashboardService.state.findRelationDataList())).toEqual([]);
    });

    it('findRelationDataList does ignore relations with unequal filter fields', () => {
        dashboardService.setActiveDatastore(NeonDatastoreConfig.get({
            name: 'datastore1',
            databases: {
                testDatabase1: {
                    tables: {
                        testTable1: {
                            fields: [
                                { columnName: 'testRelationFieldA', prettyName: 'Pretty' },
                                { columnName: 'testRelationFieldB', prettyName: 'Pretty' }
                            ]
                        }
                    }
                },
                testDatabase2: {
                    tables: {
                        testTable2: {
                            fields: [
                                { columnName: 'testRelationFieldA', prettyName: 'Pretty' },
                                { columnName: 'testRelationFieldB', prettyName: 'Pretty' }
                            ]
                        }
                    }
                }
            }
        }));

        dashboardService.setActiveDashboard(NeonDashboardLeafConfig.get({
            tables: {
                testTable1: 'datastore1.testDatabase1.testTable1',
                testTable2: 'datastore1.testDatabase2.testTable2'
            },
            relations: [
                [['datastore1.testDatabase1.testTable1.testRelationFieldA'], []],
                [[], ['datastore1.testDatabase2.testTable2.testRelationFieldA']],
                [
                    ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase1.testTable1.testRelationFieldB'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA']
                ],
                [
                    ['datastore1.testDatabase1.testTable1.testRelationFieldA'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
                ]
            ]
        }));

        expect(dashboardService.state.findRelationDataList()).toEqual([]);
    });

    it('translateFieldKeyToValue does return expected string', () => {
        expect(dashboardService.state.translateFieldKeyToValue('field_key_1')).toEqual('testFieldKeyField');
        expect(dashboardService.state.translateFieldKeyToValue('testDateField')).toEqual('testDateField');
        expect(dashboardService.state.translateFieldKeyToValue('testNameField')).toEqual('testNameField');
        expect(dashboardService.state.translateFieldKeyToValue('testSizeField')).toEqual('testSizeField');
    });

    function getConfig(filters: string | FilterConfig[]) {
        const layouts = {
            testState: [
                {
                    col: 1,
                    row: 2,
                    sizex: 3,
                    sizey: 4,
                    name: 'type1',
                    type: 'type1',
                    bindings: {
                        binding1: 'a',
                        binding2: 'b'
                    }
                },
                {
                    col: 5,
                    row: 6,
                    sizex: 7,
                    sizey: 8,
                    name: 'type2',
                    type: 'type2',
                    bindings: {
                        binding3: 'c',
                        binding4: 'd'
                    }
                }
            ]
        };

        let config = NeonConfig.get({
            datastores: {
                datastore1: {
                    name: 'datastore1',
                    host: 'host1',
                    type: 'type1',
                    databases: {
                        databaseZ: {
                            prettyName: 'databaseZ',
                            tables: {
                                tableA: {
                                    prettyName: 'tableA',
                                    fields: [
                                        { columnName: 'field1', type: 'string', prettyName: 'Field1' }
                                    ]
                                }
                            }
                        },
                        databaseY: {
                            name: 'databaseY',
                            prettyName: 'databaseY',
                            tables: {
                                tableB: {
                                    name: 'tableB',
                                    prettyName: 'tableB',
                                    fields: [
                                        { columnName: 'field2', type: 'string', prettyName: 'Field2' }
                                    ]
                                },
                                tableC: { prettyName: 'tableC' }
                            }
                        },
                        databaseX: {
                            prettyName: 'databaseX',
                            tables: {
                                tableD: { prettyName: 'tableD' }
                            }
                        }
                    }
                }
            },
            layouts,
            dashboards: {
                fullTitle: 'Full Title',
                layout: 'testState',
                name: 'dashName',
                filters,
                tables: {
                    table_key_1: 'datastore1.databaseZ.tableA',
                    table_key_2: 'datastore1.databaseY.tableB'
                },
                fields: {
                    field_key_1: 'datastore1.databaseZ.tableA.field1',
                    field_key_2: 'datastore1.databaseY.tableB.field2'
                },
                options: {
                    connectOnLoad: true,
                    simpleFilter: {
                        databaseName: 'databaseZ',
                        tableKey: 'table_key_1',
                        fieldKey: 'field_key_1',
                        tableName: 'tableA',
                        fieldName: 'field1'
                    }
                }
            }
        });

        return { config, filters, layouts };
    }

    it('exportConfig should produce valid results', (done) => {
        const { config, layouts, filters } = getConfig([
            {
                root: 'or',
                datastore: 'datastore1',
                database: 'databaseZ',
                table: 'tableA',
                field: 'field1',
                operator: '=',
                value: 'value1'
            },
            {
                root: 'and',
                type: 'and',
                filters: [
                    {
                        root: 'or',
                        datastore: 'datastore1',
                        database: 'databaseY',
                        table: 'tableB',
                        field: 'field2',
                        operator: '!=',
                        value: ''
                    },
                    {
                        root: 'or',
                        datastore: 'datastore1',
                        database: 'databaseY',
                        table: 'tableB',
                        field: 'field2',
                        operator: '!=',
                        value: null
                    }
                ]
            }
        ]);

        const conn = new MockConnectionService();
        const localConfigService = getConfigService();
        const localDashboardService = new DashboardService(
            localConfigService,
            conn,
            new InjectableFilterService()
        );

        localDashboardService.stateSource.subscribe(() => {
            localDashboardService.gridState.tabs[0] = {
                name: 'testState',
                list: layouts.testState
            };

            const data = localDashboardService
                .exportToConfig('testState') as NeonConfig & { dashboards: NeonDashboardLeafConfig };
            expect(data.dashboards.fullTitle).toEqual('Full Title');
            expect(data.dashboards.layout).toEqual('testState');
            expect(data.dashboards.name).toEqual('testState');
            expect(data.dashboards.tables).toEqual({
                table_key_1: 'datastore1.databaseZ.tableA',
                table_key_2: 'datastore1.databaseY.tableB'
            });
            expect(data.dashboards.fields).toEqual({
                field_key_1: 'datastore1.databaseZ.tableA.field1',
                field_key_2: 'datastore1.databaseY.tableB.field2'
            });
            expect(data.dashboards.options).toEqual({
                connectOnLoad: true,
                simpleFilter: {
                    tableKey: 'table_key_1',
                    fieldKey: 'field_key_1',
                    databaseName: 'databaseZ',
                    tableName: 'tableA',
                    fieldName: 'field1'
                }
            });
            expect(data.dashboards.filters).toEqual(filters);
            expect(data.datastores).toEqual(config.datastores);
            expect(data.layouts).toEqual(layouts);
            expect(data.projectTitle).toEqual('testState');
            done();
        });

        localDashboardService.configSource.subscribe((conf) => {
            const dash = ConfigUtil.findAutoShowDashboard(conf.dashboards);
            localDashboardService.setActiveDashboard(dash);
        });

        localConfigService.setActive(config);
    });

    it('exportConfig should produce valid results with string filter', (done) => {
        const { config, layouts } = getConfig(`[
            ["datastore1.databaseZ.tableA.field1","=","value1","or"],
            ["and", "and",
                ["datastore1.databaseY.tableB.field2", "!=", "", "or"],
                ["datastore1.databaseY.tableB.field2", "!=", null, "or"]
            ]
        ]`);

        const conn = new MockConnectionService();
        const localConfigService = getConfigService();
        const localDashboardService = new DashboardService(
            localConfigService,
            conn,
            new InjectableFilterService()
        );

        localDashboardService.stateSource.subscribe(() => {
            localDashboardService.gridState.tabs[0] = {
                name: 'testState',
                list: layouts.testState
            };

            const data = localDashboardService
                .exportToConfig('testState') as NeonConfig & { dashboards: NeonDashboardLeafConfig };
            expect(data.dashboards.fullTitle).toEqual('Full Title');
            expect(data.dashboards.layout).toEqual('testState');
            expect(data.dashboards.name).toEqual('testState');
            expect(data.dashboards.tables).toEqual({
                table_key_1: 'datastore1.databaseZ.tableA',
                table_key_2: 'datastore1.databaseY.tableB'
            });
            expect(data.dashboards.fields).toEqual({
                field_key_1: 'datastore1.databaseZ.tableA.field1',
                field_key_2: 'datastore1.databaseY.tableB.field2'
            });
            expect(data.dashboards.options).toEqual({
                connectOnLoad: true,
                simpleFilter: {
                    tableKey: 'table_key_1',
                    fieldKey: 'field_key_1',
                    databaseName: 'databaseZ',
                    tableName: 'tableA',
                    fieldName: 'field1'
                }
            });
            expect(data.dashboards.filters).toEqual([
                {
                    root: 'or',
                    datastore: 'datastore1',
                    database: 'databaseZ',
                    table: 'tableA',
                    field: 'field1',
                    operator: '=',
                    value: 'value1'
                },
                {
                    root: 'and',
                    type: 'and',
                    filters: [
                        {
                            root: 'or',
                            datastore: 'datastore1',
                            database: 'databaseY',
                            table: 'tableB',
                            field: 'field2',
                            operator: '!=',
                            value: ''
                        },
                        {
                            root: 'or',
                            datastore: 'datastore1',
                            database: 'databaseY',
                            table: 'tableB',
                            field: 'field2',
                            operator: '!=',
                            value: null
                        }
                    ]
                }
            ]);
            expect(data.datastores).toEqual(config.datastores);
            expect(data.layouts).toEqual(layouts);
            expect(data.projectTitle).toEqual('testState');
            done();
        });

        localDashboardService.configSource.subscribe((conf) => {
            const dash = ConfigUtil.findAutoShowDashboard(conf.dashboards);
            localDashboardService.setActiveDashboard(dash);
        });

        localConfigService.setActive(config);
    });
});
