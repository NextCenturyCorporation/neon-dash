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

import { CompoundFilterType } from 'component-library/dist/core/models/config-option';
import { FilterConfig, NeonConfig, NeonDashboardChoiceConfig, NeonDashboardLeafConfig } from '../models/types';
import { DashboardService } from './dashboard.service';

import { initializeTestBed, getConfigService } from '../../testUtils/initializeTestBed';
import { DashboardServiceMock, ConnectionServiceMock } from '../services/mock.dashboard-service';
import { ConfigService } from './config.service';

import { InjectableFilterService } from './injectable.filter.service';
import { ConfigUtil } from '../util/config.util';
import {
    BoundsFilter,
    CompoundFilter,
    CompoundFilterDesign,
    DomainFilter,
    ListFilter,
    ListFilterDesign,
    PairFilter
} from 'component-library/dist/core/models/filters';
import { DATABASES, DATASTORE, FIELD_MAP, TABLES } from 'component-library/dist/core/models/mock.dataset';

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
        expect(dashboardService.state.datastores).toEqual([]);
    });

    it('should have no active dashboards at creation', () => {
        expect(dashboardService.state.dashboard.name).not.toBeDefined();
    });

    it('getFiltersToSaveInURL should return expected JSON string', () => {
        expect(dashboardService.getFiltersToSaveInURL()).toEqual(ConfigUtil.translate('[]', ConfigUtil.encodeFiltersMap));

        spyOn(dashboardService['filterService'], 'getFilters').and.returnValue([
            new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' +
                DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
                FIELD_MAP.ID.columnName, '=', ['testValue'], 'id1', ['relation1']),
            new CompoundFilter(CompoundFilterType.AND, [
                new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' +
                    DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' +
                    FIELD_MAP.NAME.columnName, 'contains', ['testName1'], 'id3'),
                new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' +
                    DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' +
                    FIELD_MAP.TYPE.columnName, '!=', ['testType1'], 'id4')
            ], 'id2', ['relation2'])
        ]);

        // Use the parse and stringify functions so we don't have to type unicode here.
        expect(dashboardService.getFiltersToSaveInURL()).toEqual(ConfigUtil.translate(JSON.stringify(JSON.parse(`[
            ["list", "id1", ["relation1"], "or", "datastore1.testDatabase1.testTable1.testIdField", "=", "testValue"],
            ["and", "id2", ["relation2"],
                ["list", "id3", [], "or", "datastore1.testDatabase2.testTable2.testNameField", "contains", "testName1"],
                ["list", "id4", [], "or", "datastore1.testDatabase2.testTable2.testTypeField", "!=", "testType1"]
            ]
        ]`)), ConfigUtil.encodeFiltersMap));
    });

    it('getFiltersToSaveInURL does work with booleans, empty strings, nulls, and numbers', () => {
        expect(dashboardService.getFiltersToSaveInURL()).toEqual(ConfigUtil.translate('[]', ConfigUtil.encodeFiltersMap));

        spyOn(dashboardService['filterService'], 'getFilters').and.returnValue([
            new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' +
                DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
                FIELD_MAP.ID.columnName, '!=', [false], 'id1'),
            new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' +
                DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
                FIELD_MAP.ID.columnName, '!=', [''], 'id2'),
            new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' +
                DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
                FIELD_MAP.ID.columnName, '!=', [null], 'id3'),
            new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' +
                DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
                FIELD_MAP.ID.columnName, '!=', [1234], 'id4')
        ]);

        // Use the parse and stringify functions so we don't have to type unicode here.
        expect(dashboardService.getFiltersToSaveInURL()).toEqual(ConfigUtil.translate(JSON.stringify(JSON.parse(`[
            ["list", "id1", [], "or", "datastore1.testDatabase1.testTable1.testIdField", "!=", false],
            ["list", "id2", [], "or", "datastore1.testDatabase1.testTable1.testIdField", "!=", ""],
            ["list", "id3", [], "or", "datastore1.testDatabase1.testTable1.testIdField", "!=", null],
            ["list", "id4", [], "or", "datastore1.testDatabase1.testTable1.testIdField", "!=", 1234]
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
        expect(dashboardService.state.datastores).toEqual([DATASTORE]);
    });

    it('should return active datastores by name', () => {
        expect(dashboardService.config.datastores.datastore1).toEqual(DATASTORE);
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
                ["id1", ["relation1"], "datastore1.testDatabase1.testTable1.testNameField", "=", "testValue"],
                ["and", "id2", ["relation2"],
                    ["id3", [], "datastore1.testDatabase2.testTable2.testTypeField", "!=", ""],
                    ["id4", [], "datastore1.testDatabase2.testTable2.testTypeField", "!=", null]
                ]
            ]`, ConfigUtil.encodeFiltersMap)
        }));

        expect(spy.calls.count()).toEqual(1);
        const filters = spy.calls.argsFor(0)[0];
        expect(filters).toEqual([
            new ListFilter(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testNameField', '=', ['testValue'], 'id1',
                ['relation1']),
            new CompoundFilter(CompoundFilterType.AND, [
                new ListFilter(CompoundFilterType.OR, 'datastore1.testDatabase2.testTable2.testTypeField', '!=', [''], 'id3'),
                new ListFilter(CompoundFilterType.OR, 'datastore1.testDatabase2.testTable2.testTypeField', '!=', [null], 'id4')
            ], 'id2', ['relation2'])
        ]);
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
                                }
                            }
                        }
                    }
                }
            },
            layouts,
            dashboards: {
                fullTitle: ['Full Title'],
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

    it('exportToConfig should produce valid results', (done) => {
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

        const conn = new ConnectionServiceMock();
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
            expect(data.dashboards.fullTitle).toEqual(['Full Title']);
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
                new ListFilterDesign(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testNameField', '=', ['testValue'],
                    (filters as any)[0].id),
                new CompoundFilterDesign(CompoundFilterType.AND, [
                    new ListFilterDesign(CompoundFilterType.OR, 'datastore1.testDatabase2.testTable2.testTypeField', '!=', [''],
                        (filters as any)[1].filters[0].id),
                    new ListFilterDesign(CompoundFilterType.OR, 'datastore1.testDatabase2.testTable2.testTypeField', '!=', [null],
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

    it('exportToConfig should produce valid results with string filter', (done) => {
        const { config, layouts } = getConfig(`[
            ["id1", ["relation1"], "datastore1.testDatabase1.testTable1.testNameField", "=", "testValue"],
            ["and", "id2", ["relation2"],
                ["id3", [], "datastore1.testDatabase2.testTable2.testTypeField", "!=", ""],
                ["id4", [], "datastore1.testDatabase2.testTable2.testTypeField", "!=", null]
            ]
        ]`);

        const conn = new ConnectionServiceMock();
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
            expect(data.dashboards.fullTitle).toEqual(['Full Title']);
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
                new ListFilterDesign(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testNameField', '=', ['testValue'], 'id1',
                    ['relation1']),
                new CompoundFilterDesign(CompoundFilterType.AND, [
                    new ListFilterDesign(CompoundFilterType.OR, 'datastore1.testDatabase2.testTable2.testTypeField', '!=', [''], 'id3'),
                    new ListFilterDesign(CompoundFilterType.OR, 'datastore1.testDatabase2.testTable2.testTypeField', '!=', [null], 'id4')
                ], 'id2', ['relation2'])
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

    it('createEmptyDashboardConfig does return expected object', () => {
        expect(dashboardService.createEmptyDashboardConfig('testDashboardName')).toEqual(NeonConfig.get({
            dashboards: NeonDashboardChoiceConfig.get({
                choices: {
                    testDashboardName: {
                        layout: 'empty',
                        options: {
                            connectOnLoad: true
                        }
                    }
                }
            }),
            datastores: {
                datastore1: DATASTORE
            },
            layouts: {
                empty: []
            },
            projectTitle: 'testDashboardName'
        }));
    });
});

describe('DashboardService DASHBOARD_FILTER_UTIL', () => {
    it('createDataListFromFilter on bounds filter does return expected list', () => {
        let boundsFilterA = new BoundsFilter(
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            -50, -100, 50, 100
        );

        expect(DashboardService.DASHBOARD_FILTER_UTIL.createDataListFromFilter(boundsFilterA)).toEqual([
            'bounds',
            boundsFilterA.id,
            [],
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            -50,
            50,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            -100,
            100
        ]);
    });

    it('createDataListFromFilter on domain filter does return expected list', () => {
        let domainFilterA = new DomainFilter(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
            FIELD_MAP.SIZE.columnName, -100, 100);

        expect(DashboardService.DASHBOARD_FILTER_UTIL.createDataListFromFilter(domainFilterA)).toEqual([
            'domain',
            domainFilterA.id,
            [],
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.SIZE.columnName,
            -100,
            100
        ]);
    });

    it('createDataListFromFilter on list filter does return expected list', () => {
        let listFilterA = new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName, '!=', ['testText1', 'testText2', 'testText3']);

        expect(DashboardService.DASHBOARD_FILTER_UTIL.createDataListFromFilter(listFilterA)).toEqual([
            'list',
            listFilterA.id,
            [],
            CompoundFilterType.OR,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName,
            '!=',
            'testText1',
            'testText2',
            'testText3'
        ]);
    });

    it('createDataListFromFilter on pair filter does return expected list', () => {
        let pairFilterA = new PairFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName, '=', '!=', 'testName', 'testType');

        expect(DashboardService.DASHBOARD_FILTER_UTIL.createDataListFromFilter(pairFilterA)).toEqual([
            'pair',
            pairFilterA.id,
            [],
            CompoundFilterType.OR,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName,
            '=',
            'testName',
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName,
            '!=',
            'testType'
        ]);
    });

    it('createDataListFromFilter on compound filter does return expected list', () => {
        let boundsFilterA = new BoundsFilter(
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            -50, -100, 50, 100
        );

        let domainFilterA = new DomainFilter(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
            FIELD_MAP.SIZE.columnName, -100, 100);

        let listFilterA = new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName, '!=', ['testText1', 'testText2', 'testText3']);

        let pairFilterA = new PairFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName, '=', '!=', 'testName', 'testType');

        let compoundFilterA = new CompoundFilter(CompoundFilterType.AND, [boundsFilterA, domainFilterA, listFilterA, pairFilterA]);

        expect(DashboardService.DASHBOARD_FILTER_UTIL.createDataListFromFilter(compoundFilterA)).toEqual([
            'and',
            compoundFilterA.id,
            [],
            [
                'bounds',
                boundsFilterA.id,
                [],
                DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
                -50,
                50,
                DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
                -100,
                100
            ],
            [
                'domain',
                domainFilterA.id,
                [],
                DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.SIZE.columnName,
                -100,
                100
            ],
            [
                'list',
                listFilterA.id,
                [],
                CompoundFilterType.OR,
                DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName,
                '!=',
                'testText1',
                'testText2',
                'testText3'
            ],
            [
                'pair',
                pairFilterA.id,
                [],
                CompoundFilterType.OR,
                DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName,
                '=',
                'testName',
                DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName,
                '!=',
                'testType'
            ]
        ]);
    });

    it('createDataListFromFilter on compound filter with nested filters does return expected list', () => {
        let boundsFilterA = new BoundsFilter(
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            -50, -100, 50, 100
        );

        let domainFilterA = new DomainFilter(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
            FIELD_MAP.SIZE.columnName, -100, 100);

        let listFilterA = new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName, '!=', ['testText1', 'testText2', 'testText3']);

        let pairFilterA = new PairFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName, '=', '!=', 'testName', 'testType');

        let compoundFilterB = new CompoundFilter(CompoundFilterType.OR, [boundsFilterA, domainFilterA]);

        let compoundFilterC = new CompoundFilter(CompoundFilterType.OR, [listFilterA, pairFilterA]);

        let compoundFilterD = new CompoundFilter(CompoundFilterType.AND, [compoundFilterB, compoundFilterC]);

        expect(DashboardService.DASHBOARD_FILTER_UTIL.createDataListFromFilter(compoundFilterD)).toEqual([
            'and',
            compoundFilterD.id,
            [],
            [
                'or',
                compoundFilterB.id,
                [],
                [
                    'bounds',
                    boundsFilterA.id,
                    [],
                    DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
                    -50,
                    50,
                    DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
                    -100,
                    100
                ],
                [
                    'domain',
                    domainFilterA.id,
                    [],
                    DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.SIZE.columnName,
                    -100,
                    100
                ]
            ],
            [
                'or',
                compoundFilterC.id,
                [],
                [
                    'list',
                    listFilterA.id,
                    [],
                    CompoundFilterType.OR,
                    DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName,
                    '!=',
                    'testText1',
                    'testText2',
                    'testText3'
                ],
                [
                    'pair',
                    pairFilterA.id,
                    [],
                    CompoundFilterType.OR,
                    DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName,
                    '=',
                    'testName',
                    DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName,
                    '!=',
                    'testType'
                ]
            ]
        ]);
    });

    it('createFilterFromDataList on simple filter data does return list filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromDataList([
            'filterId1',
            ['relationId1'],
            'datastore1.testDatabase2.testTable2.testIdField',
            '=',
            'testValue'
        ]);
        expect(actual instanceof ListFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as ListFilter).fieldKey).toEqual('datastore1.testDatabase2.testTable2.testIdField');
        expect((actual as ListFilter).operator).toEqual('=');
        expect((actual as ListFilter).values).toEqual(['testValue']);
    });

    it('createFilterFromDataList does return bounds filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromDataList([
            'bounds',
            'filterId1',
            ['relationId1'],
            'datastore1.testDatabase2.testTable2.testXField',
            'testBegin1',
            'testEnd1',
            'datastore1.testDatabase2.testTable2.testYField',
            'testBegin2',
            'testEnd2'
        ]);
        expect(actual instanceof BoundsFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as BoundsFilter).fieldKey1).toEqual('datastore1.testDatabase2.testTable2.testXField');
        expect((actual as BoundsFilter).fieldKey2).toEqual('datastore1.testDatabase2.testTable2.testYField');
        expect((actual as BoundsFilter).begin1).toEqual('testBegin1');
        expect((actual as BoundsFilter).begin2).toEqual('testBegin2');
        expect((actual as BoundsFilter).end1).toEqual('testEnd1');
        expect((actual as BoundsFilter).end2).toEqual('testEnd2');
    });

    it('createFilterFromDataList does return domain filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromDataList([
            'domain',
            'filterId1',
            ['relationId1'],
            'datastore1.testDatabase2.testTable2.testSizeField',
            'testBegin',
            'testEnd'
        ]);
        expect(actual instanceof DomainFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as DomainFilter).fieldKey).toEqual('datastore1.testDatabase2.testTable2.testSizeField');
        expect((actual as DomainFilter).begin).toEqual('testBegin');
        expect((actual as DomainFilter).end).toEqual('testEnd');
    });

    it('createFilterFromDataList does return list filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromDataList([
            'list',
            'filterId1',
            ['relationId1'],
            'and',
            'datastore1.testDatabase2.testTable2.testTextField',
            '!=',
            'testValue1',
            'testValue2'
        ]);
        expect(actual instanceof ListFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as ListFilter).fieldKey).toEqual('datastore1.testDatabase2.testTable2.testTextField');
        expect((actual as ListFilter).operator).toEqual('!=');
        expect((actual as ListFilter).values).toEqual(['testValue1', 'testValue2']);
    });

    it('createFilterFromDataList does return pair filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromDataList([
            'pair',
            'filterId1',
            ['relationId1'],
            'and',
            'datastore1.testDatabase2.testTable2.testNameField',
            'contains',
            'testValue1',
            'datastore1.testDatabase2.testTable2.testTypeField',
            'not contains',
            'testValue2'
        ]);
        expect(actual instanceof PairFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as PairFilter).fieldKey1).toEqual('datastore1.testDatabase2.testTable2.testNameField');
        expect((actual as PairFilter).fieldKey2).toEqual('datastore1.testDatabase2.testTable2.testTypeField');
        expect((actual as PairFilter).operator1).toEqual('contains');
        expect((actual as PairFilter).operator2).toEqual('not contains');
        expect((actual as PairFilter).value1).toEqual('testValue1');
        expect((actual as PairFilter).value2).toEqual('testValue2');
    });

    it('createFilterFromDataList does return compound filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromDataList([
            'and',
            'filterId1',
            ['relationId1'],
            ['and',
                'id2',
                ['relationId2'],
                ['id3', [], 'datastore1.testDatabase2.testTable2.testNameField', 'contains', 'testValue1'],
                ['id4', [], 'datastore1.testDatabase2.testTable2.testTypeField', 'not contains', 'testValue2']],
            ['id5', [], 'datastore1.testDatabase2.testTable2.testIdField', '=', 'testValue3']
        ]);
        expect(actual instanceof CompoundFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as any).type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters.length).toEqual(2);
        expect((actual as any).filters[0] instanceof CompoundFilter).toEqual(true);
        expect((actual as any).filters[0].id).toEqual('id2');
        expect((actual as any).filters[0].relations).toEqual(['relationId2']);
        expect((actual as any).filters[0].type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters[0].filters.length).toEqual(2);
        expect((actual as any).filters[0].filters[0] instanceof ListFilter).toEqual(true);
        expect((actual as any).filters[0].filters[0].fieldKey).toEqual('datastore1.testDatabase2.testTable2.testNameField');
        expect((actual as any).filters[0].filters[0].operator).toEqual('contains');
        expect((actual as any).filters[0].filters[0].values).toEqual(['testValue1']);
        expect((actual as any).filters[0].filters[1] instanceof ListFilter).toEqual(true);
        expect((actual as any).filters[0].filters[1].fieldKey).toEqual('datastore1.testDatabase2.testTable2.testTypeField');
        expect((actual as any).filters[0].filters[1].operator).toEqual('not contains');
        expect((actual as any).filters[0].filters[1].values).toEqual(['testValue2']);
        expect((actual as any).filters[1] instanceof ListFilter).toEqual(true);
        expect((actual as any).filters[1].fieldKey).toEqual('datastore1.testDatabase2.testTable2.testIdField');
        expect((actual as any).filters[1].operator).toEqual('=');
        expect((actual as any).filters[1].values).toEqual(['testValue3']);
    });

    it('createFilterFromConfig on simple filter config does return list filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromConfig({
            id: 'filterId1',
            relations: ['relationId1'],
            datastore: 'datastore1',
            database: 'testDatabase2',
            table: 'testTable2',
            field: 'testIdField',
            operator: '=',
            value: 'testValue'
        });
        expect(actual instanceof ListFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as ListFilter).fieldKey).toEqual('datastore1.testDatabase2.testTable2.testIdField');
        expect((actual as ListFilter).operator).toEqual('=');
        expect((actual as ListFilter).values).toEqual(['testValue']);
    });

    it('createFilterFromConfig does return bounds filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromConfig({
            id: 'filterId1',
            relations: ['relationId1'],
            fieldKey1: 'datastore1.testDatabase2.testTable2.testXField',
            begin1: 'testBegin1',
            end1: 'testEnd1',
            fieldKey2: 'datastore1.testDatabase2.testTable2.testYField',
            begin2: 'testBegin2',
            end2: 'testEnd2'
        });
        expect(actual instanceof BoundsFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as BoundsFilter).fieldKey1).toEqual('datastore1.testDatabase2.testTable2.testXField');
        expect((actual as BoundsFilter).fieldKey2).toEqual('datastore1.testDatabase2.testTable2.testYField');
        expect((actual as BoundsFilter).begin1).toEqual('testBegin1');
        expect((actual as BoundsFilter).begin2).toEqual('testBegin2');
        expect((actual as BoundsFilter).end1).toEqual('testEnd1');
        expect((actual as BoundsFilter).end2).toEqual('testEnd2');
    });

    it('createFilterFromConfig does return domain filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromConfig({
            id: 'filterId1',
            relations: ['relationId1'],
            fieldKey: 'datastore1.testDatabase2.testTable2.testSizeField',
            begin: 'testBegin',
            end: 'testEnd'
        });
        expect(actual instanceof DomainFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as DomainFilter).fieldKey).toEqual('datastore1.testDatabase2.testTable2.testSizeField');
        expect((actual as DomainFilter).begin).toEqual('testBegin');
        expect((actual as DomainFilter).end).toEqual('testEnd');
    });

    it('createFilterFromConfig does return list filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromConfig({
            id: 'filterId1',
            relations: ['relationId1'],
            type: CompoundFilterType.AND,
            fieldKey: 'datastore1.testDatabase2.testTable2.testTextField',
            operator: '!=',
            values: ['testValue1', 'testValue2']
        });
        expect(actual instanceof ListFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as ListFilter).fieldKey).toEqual('datastore1.testDatabase2.testTable2.testTextField');
        expect((actual as ListFilter).operator).toEqual('!=');
        expect((actual as ListFilter).values).toEqual(['testValue1', 'testValue2']);
    });

    it('createFilterFromConfig does return pair filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromConfig({
            id: 'filterId1',
            relations: ['relationId1'],
            type: CompoundFilterType.AND,
            fieldKey1: 'datastore1.testDatabase2.testTable2.testNameField',
            operator1: 'contains',
            value1: 'testValue1',
            fieldKey2: 'datastore1.testDatabase2.testTable2.testTypeField',
            operator2: 'not contains',
            value2: 'testValue2'
        });
        expect(actual instanceof PairFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as PairFilter).fieldKey1).toEqual('datastore1.testDatabase2.testTable2.testNameField');
        expect((actual as PairFilter).fieldKey2).toEqual('datastore1.testDatabase2.testTable2.testTypeField');
        expect((actual as PairFilter).operator1).toEqual('contains');
        expect((actual as PairFilter).operator2).toEqual('not contains');
        expect((actual as PairFilter).value1).toEqual('testValue1');
        expect((actual as PairFilter).value2).toEqual('testValue2');
    });

    it('createFilterFromConfig does return compound filter object', () => {
        const actual = DashboardService.DASHBOARD_FILTER_UTIL.createFilterFromConfig({
            id: 'filterId1',
            relations: ['relationId1'],
            type: CompoundFilterType.AND,
            filters: [{
                id: 'id2',
                relations: ['relationId2'],
                type: CompoundFilterType.AND,
                filters: [{
                    id: 'id3',
                    relations: [],
                    type: CompoundFilterType.OR,
                    fieldKey: 'datastore1.testDatabase2.testTable2.testNameField',
                    operator: 'contains',
                    values: ['testValue1']
                }, {
                    id: 'id4',
                    relations: [],
                    type: CompoundFilterType.OR,
                    fieldKey: 'datastore1.testDatabase2.testTable2.testTypeField',
                    operator: 'not contains',
                    values: ['testValue2']
                }]
            }, {
                id: 'id5',
                relations: [],
                type: CompoundFilterType.OR,
                fieldKey: 'datastore1.testDatabase2.testTable2.testIdField',
                operator: '=',
                values: ['testValue3']
            }]
        });
        expect(actual instanceof CompoundFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as any).type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters.length).toEqual(2);
        expect((actual as any).filters[0] instanceof CompoundFilter).toEqual(true);
        expect((actual as any).filters[0].id).toEqual('id2');
        expect((actual as any).filters[0].relations).toEqual(['relationId2']);
        expect((actual as any).filters[0].type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters[0].filters.length).toEqual(2);
        expect((actual as any).filters[0].filters[0] instanceof ListFilter).toEqual(true);
        expect((actual as any).filters[0].filters[0].fieldKey).toEqual('datastore1.testDatabase2.testTable2.testNameField');
        expect((actual as any).filters[0].filters[0].operator).toEqual('contains');
        expect((actual as any).filters[0].filters[0].values).toEqual(['testValue1']);
        expect((actual as any).filters[0].filters[1] instanceof ListFilter).toEqual(true);
        expect((actual as any).filters[0].filters[1].fieldKey).toEqual('datastore1.testDatabase2.testTable2.testTypeField');
        expect((actual as any).filters[0].filters[1].operator).toEqual('not contains');
        expect((actual as any).filters[0].filters[1].values).toEqual(['testValue2']);
        expect((actual as any).filters[1] instanceof ListFilter).toEqual(true);
        expect((actual as any).filters[1].fieldKey).toEqual('datastore1.testDatabase2.testTable2.testIdField');
        expect((actual as any).filters[1].operator).toEqual('=');
        expect((actual as any).filters[1].values).toEqual(['testValue3']);
    });
});

