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

import { CompoundFilterConfig, FilterConfig, SimpleFilterConfig } from '../models/filter';
import { CompoundFilterType } from '../models/widget-option';
import { NeonConfig, NeonDashboardLeafConfig } from '../models/types';
import { NeonDatastoreConfig } from '../models/dataset';
import { DashboardService } from './dashboard.service';

import { initializeTestBed, getConfigService } from '../../testUtils/initializeTestBed';
import { DashboardServiceMock, MockConnectionService } from '../../testUtils/MockServices/DashboardServiceMock';
import { ConfigService } from './config.service';

import * as _ from 'lodash';
import { InjectableFilterService } from './injectable.filter.service';
import { ConfigUtil } from '../util/config.util';
import { CompoundFilterDesign, FilterUtil, SimpleFilterDesign } from '../util/filter.util';
import { DATASET } from '../../testUtils/mock-dataset';

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

    it('getFiltersToSaveInURL should return expected output', () => {
        expect(dashboardService.getFiltersToSaveInURL()).toEqual(ConfigUtil.translate('[]', ConfigUtil.encodeFiltersMap));

        spyOn(dashboardService['filterService'], 'getFilters').and.returnValue([{
            datastore: 'datastore1',
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testNameField',
            operator: '=',
            value: 'testValue'
        } as SimpleFilterConfig, {
            type: 'and',
            filters: [{
                datastore: 'datastore1',
                database: 'testDatabase2',
                table: 'testTable2',
                field: 'testTypeField',
                operator: '!=',
                value: ''
            } as SimpleFilterConfig, {
                datastore: 'datastore1',
                database: 'testDatabase2',
                table: 'testTable2',
                field: 'testTypeField',
                operator: '!=',
                value: null
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

        // Use the parse and stringify functions so we don't have to type unicode here.
        expect(dashboardService.getFiltersToSaveInURL()).toEqual(ConfigUtil.translate(JSON.stringify(JSON.parse(`[
            ["datastore1.testDatabase1.testTable1.testNameField", "=", "testValue"],
            ["and",
                ["datastore1.testDatabase2.testTable2.testTypeField", "!=", ""],
                ["datastore1.testDatabase2.testTable2.testTypeField", "!=", null]
            ]
        ]`)), ConfigUtil.encodeFiltersMap));
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

    it('setActiveDashboard should translate string filter list', () => {
        let spy = spyOn(dashboardService['filterService'], 'setFilters');

        dashboardService.setActiveDashboard(NeonDashboardLeafConfig.get({
            filters: ConfigUtil.translate(`[
                ["datastore1.testDatabase1.testTable1.testNameField", "=", "testValue"],
                ["and",
                    ["datastore1.testDatabase2.testTable2.testTypeField", "!=", ""],
                    ["datastore1.testDatabase2.testTable2.testTypeField", "!=", null]
                ]
            ]`, ConfigUtil.encodeFiltersMap)
        }));

        expect(spy.calls.count()).toEqual(1);
        const filters = spy.calls.argsFor(0)[0];
        expect(filters).toEqual([FilterUtil.createFilterFromConfig({
            id: filters[0].id,
            datastore: 'datastore1',
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testNameField',
            operator: '=',
            value: 'testValue'
        }, DATASET), FilterUtil.createFilterFromConfig({
            id: filters[1].id,
            type: CompoundFilterType.AND,
            filters: [{
                id: filters[1].filters[0].id,
                datastore: 'datastore1',
                database: 'testDatabase2',
                table: 'testTable2',
                field: 'testTypeField',
                operator: '!=',
                value: ''
            }, {
                id: filters[1].filters[1].id,
                datastore: 'datastore1',
                database: 'testDatabase2',
                table: 'testTable2',
                field: 'testTypeField',
                operator: '!=',
                value: null
            }]
        }, DATASET)]);
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
                        testDatabase1: {
                            prettyName: 'testDatabase1',
                            tables: {
                                testTable1: {
                                    prettyName: 'testTable1',
                                    fields: [
                                        { columnName: 'testNameField', type: 'string', prettyName: 'Field1' }
                                    ]
                                }
                            }
                        },
                        testDatabase2: {
                            name: 'testDatabase2',
                            prettyName: 'testDatabase2',
                            tables: {
                                testTable2: {
                                    name: 'testTable2',
                                    prettyName: 'testTable2',
                                    fields: [
                                        { columnName: 'testTypeField', type: 'string', prettyName: 'Field2' }
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
                    table_key_1: 'datastore1.testDatabase1.testTable1',
                    table_key_2: 'datastore1.testDatabase2.testTable2'
                },
                fields: {
                    field_key_1: 'datastore1.testDatabase1.testTable1.testNameField',
                    field_key_2: 'datastore1.testDatabase2.testTable2.testTypeField'
                },
                options: {
                    connectOnLoad: true,
                    simpleFilter: {
                        databaseName: 'testDatabase1',
                        tableKey: 'table_key_1',
                        fieldKey: 'field_key_1',
                        tableName: 'testTable1',
                        fieldName: 'testNameField'
                    }
                }
            }
        });

        return { config, filters, layouts };
    }

    it('exportConfig should produce valid results', (done) => {
        const { config, filters, layouts } = getConfig([
            {
                id: 'id1',
                datastore: 'datastore1',
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testNameField',
                operator: '=',
                value: 'testValue'
            },
            {
                id: 'id2',
                type: CompoundFilterType.AND,
                filters: [
                    {
                        id: 'id3',
                        datastore: 'datastore1',
                        database: 'testDatabase2',
                        table: 'testTable2',
                        field: 'testTypeField',
                        operator: '!=',
                        value: ''
                    },
                    {
                        id: 'id4',
                        datastore: 'datastore1',
                        database: 'testDatabase2',
                        table: 'testTable2',
                        field: 'testTypeField',
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
                table_key_1: 'datastore1.testDatabase1.testTable1',
                table_key_2: 'datastore1.testDatabase2.testTable2'
            });
            expect(data.dashboards.fields).toEqual({
                field_key_1: 'datastore1.testDatabase1.testTable1.testNameField',
                field_key_2: 'datastore1.testDatabase2.testTable2.testTypeField'
            });
            expect(data.dashboards.options).toEqual({
                connectOnLoad: true,
                simpleFilter: {
                    tableKey: 'table_key_1',
                    fieldKey: 'field_key_1',
                    databaseName: 'testDatabase1',
                    tableName: 'testTable1',
                    fieldName: 'testNameField'
                }
            });
            expect(data.dashboards.filters).toEqual([
                new SimpleFilterDesign('datastore1', 'testDatabase1', 'testTable1', 'testNameField', '=', 'testValue',
                    (filters as any)[0].id),
                new CompoundFilterDesign(CompoundFilterType.AND, [
                    new SimpleFilterDesign('datastore1', 'testDatabase2', 'testTable2', 'testTypeField', '!=', '',
                        (filters as any)[1].filters[0].id),
                    new SimpleFilterDesign('datastore1', 'testDatabase2', 'testTable2', 'testTypeField', '!=', null,
                        (filters as any)[1].filters[1].id)
                ], (filters as any)[1].id)
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

    it('exportConfig should produce valid results with string filter', (done) => {
        const { config, layouts } = getConfig(`[
            ["datastore1.testDatabase1.testTable1.testNameField", "=", "testValue"],
            ["and",
                ["datastore1.testDatabase2.testTable2.testTypeField", "!=", ""],
                ["datastore1.testDatabase2.testTable2.testTypeField", "!=", null]
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
                table_key_1: 'datastore1.testDatabase1.testTable1',
                table_key_2: 'datastore1.testDatabase2.testTable2'
            });
            expect(data.dashboards.fields).toEqual({
                field_key_1: 'datastore1.testDatabase1.testTable1.testNameField',
                field_key_2: 'datastore1.testDatabase2.testTable2.testTypeField'
            });
            expect(data.dashboards.options).toEqual({
                connectOnLoad: true,
                simpleFilter: {
                    tableKey: 'table_key_1',
                    fieldKey: 'field_key_1',
                    databaseName: 'testDatabase1',
                    tableName: 'testTable1',
                    fieldName: 'testNameField'
                }
            });
            const filters = (data.dashboards as any).filters;
            expect(data.dashboards.filters).toEqual([
                new SimpleFilterDesign('datastore1', 'testDatabase1', 'testTable1', 'testNameField', '=', 'testValue', filters[0].id),
                new CompoundFilterDesign(CompoundFilterType.AND, [
                    new SimpleFilterDesign('datastore1', 'testDatabase2', 'testTable2', 'testTypeField', '!=', '',
                        filters[1].filters[0].id),
                    new SimpleFilterDesign('datastore1', 'testDatabase2', 'testTable2', 'testTypeField', '!=', null,
                        filters[1].filters[1].id)
                ], filters[1].id)
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
