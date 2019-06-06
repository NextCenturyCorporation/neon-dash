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
import { inject } from '@angular/core/testing';

import { AbstractSearchService } from './abstract.search.service';
import { Dashboard, DatabaseMetaData, FieldMetaData, TableMetaData } from '../types';
import { DashboardService } from './dashboard.service';
import { NeonGTDConfig, NeonDatastoreConfig } from '../neon-gtd-config';

import { initializeTestBed } from '../../testUtils/initializeTestBed';
import { DashboardServiceMock } from '../../testUtils/MockServices/DashboardServiceMock';
import { ConfigService } from './config.service';
import { SearchServiceMock } from '../../testUtils/MockServices/SearchServiceMock';

describe('Service: DashboardService', () => {
    let datasetService: DashboardService;

    initializeTestBed('Dashboard Service', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            DashboardService,
            { provide: ConfigService, useValue: ConfigService.as(NeonGTDConfig.get()) }
        ]
    });

    beforeEach(inject([DashboardService], (_datasetService: DashboardService) => {
        datasetService = _datasetService;
    }));

    it('should have no active datastores at creation', () => {
        expect(datasetService.state.datastore).toEqual({ host: '', type: '', databases: {} } as NeonDatastoreConfig);
    });

    it('should have no active dashboards at creation', () => {
        expect(datasetService.state.dashboard.name).not.toBeDefined();
    });

    it('should return datastores by name', () => {
        datasetService.addDatastore({
            name: 'd1',
            host: '',
            type: '',
            databases: {}
        });

        expect(datasetService.datastores.d1).toEqual({
            name: 'd1',
            host: '',
            type: '',
            databases: {}
        });
    });

    it('getCurrentDatabase does return undefined', () => {
        expect(datasetService.state.getDatabase()).not.toBeDefined();
    });
});

describe('Service: DashboardService Static Functions', () => {
    let datasetService: DashboardService;

    initializeTestBed('Dashboard Service with Mock Data', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: ConfigService, useValue: ConfigService.as(NeonGTDConfig.get()) }
        ]
    });

    beforeEach(inject([DashboardService], (_datasetService: DashboardService) => {
        datasetService = _datasetService;
    }));

    initializeTestBed('Dashboard Service Static Functions', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: 'config', useValue: NeonGTDConfig.get() }
        ]
    });

    it('assignDashboardChoicesFromConfig with no config choices and no existing choices should do nothing', () => {
        let input = {};
        DashboardService.assignDashboardChoicesFromConfig(input, {});
        expect(input).toEqual({});
    });

    it('assignDashboardChoicesFromConfig with config choices and no existing choices should update given choices', () => {
        let input = {};
        let dashboard = Dashboard.get();
        dashboard.name = 'name';
        DashboardService.assignDashboardChoicesFromConfig(input, {
            test: dashboard
        });
        expect(input).toEqual({
            test: dashboard
        });
    });

    it('assignDashboardChoicesFromConfig with nested config choices and no existing choices should update given choices', () => {
        let input = {};
        let dashboard = Dashboard.get();
        dashboard.name = 'name';
        DashboardService.assignDashboardChoicesFromConfig(input, {
            test1: {
                choices: {
                    test2: dashboard
                }
            } as any as Dashboard // TODO: Typings verify
        });
        expect(input).toEqual({
            test1: {
                choices: {
                    test2: dashboard
                }
            }
        });
    });

    it('assignDashboardChoicesFromConfig with config choices and existing choices should update given choices', () => {
        let previousDashboard = Dashboard.get();
        previousDashboard.name = 'previous';
        let input = {
            prev: previousDashboard
        };
        let dashboard = Dashboard.get();
        dashboard.name = 'name';
        DashboardService.assignDashboardChoicesFromConfig(input, {
            test: dashboard
        });
        expect(input).toEqual({
            prev: previousDashboard,
            test: dashboard
        });
    });

    it('assignDashboardChoicesFromConfig with nested config choices and nested existing choices should update given choices', () => {
        let previousDashboard = Dashboard.get();
        previousDashboard.name = 'previous';
        let input = {
            test1: {
                choices: {
                    prev2: previousDashboard
                }
            }
        } as any as Dashboard['choices']; // TODO: Figure out why typings
        let dashboard = Dashboard.get();
        dashboard.name = 'name';
        DashboardService.assignDashboardChoicesFromConfig(input, {
            test1: {
                choices: {
                    test2: dashboard
                }
            }
        } as any as Dashboard['choices']); // TODO: Figure out why typings

        expect(input).toEqual({
            test1: {
                choices: {
                    prev2: previousDashboard,
                    test2: dashboard
                }
            }
        });
    });

    it('assignDashboardChoicesFromConfig with same ID in config choices and existing choices should not update given choices', () => {
        let previousDashboard = Dashboard.get();
        previousDashboard.name = 'previous';
        let input = {
            prev: previousDashboard
        };
        let dashboard = Dashboard.get();
        dashboard.name = 'name';
        DashboardService.assignDashboardChoicesFromConfig(input, {
            prev: dashboard
        });
        expect(input).toEqual({
            prev: previousDashboard
        });
    });

    it('appendDatastoresFromConfig with no config and no datastores should do nothing', () => {
        let input = {};
        DashboardService.appendDatastoresFromConfig({}, {});
        expect(input).toEqual({});
    });

    it('appendDatastoresFromConfig with config and no existing datastores should update given datastores', () => {
        let input = {};

        DashboardService.appendDatastoresFromConfig({
            datastore1: {
                host: 'host1',
                type: 'type1',
                databases: {
                    database1: {
                        prettyName: 'Database 1',
                        tables: {
                            table1: {
                                prettyName: 'Table 1',
                                mappings: {
                                    mappingA: 'fieldA',
                                    mappingB: 'fieldB'
                                },
                                labelOptions: {
                                    valueA: 'labelA',
                                    valueB: 'labelB'
                                },
                                fields: [{
                                    columnName: 'fieldA',
                                    prettyName: 'Field A',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldB',
                                    prettyName: 'Field B',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            }
        }, input);

        let table1 = new TableMetaData('table1', 'Table 1');
        table1.fields = [
            new FieldMetaData('fieldA', 'Field A', false, 'text'),
            new FieldMetaData('fieldB', 'Field B', true, 'date')
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = new DatabaseMetaData('database1', 'Database 1');
        database1.tables = { [table1.name]: table1 };
        let datastore1 = { name: 'datastore1', host: 'host1', type: 'type1', hasUpdatedFields: false, databases: {} };
        datastore1.databases = { [database1.name]: database1 };
        datastore1.hasUpdatedFields = false;
        expect(input).toEqual({ [datastore1.name]: datastore1 });
    });

    it('appendDatastoresFromConfig with config of multiple datastores and no existing datastores should update given datastores', () => {
        let input = {};

        DashboardService.appendDatastoresFromConfig({
            datastore1: {
                host: 'host1',
                type: 'type1',
                databases: {
                    database1: {
                        prettyName: 'Database 1',
                        tables: {
                            table1: {
                                prettyName: 'Table 1',
                                mappings: {
                                    mappingA: 'fieldA',
                                    mappingB: 'fieldB'
                                },
                                labelOptions: {
                                    valueA: 'labelA',
                                    valueB: 'labelB'
                                },
                                fields: [{
                                    columnName: 'fieldA',
                                    prettyName: 'Field A',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldB',
                                    prettyName: 'Field B',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            },
            datastore2: {
                host: 'host2',
                type: 'type2',
                databases: {
                    database2: {
                        prettyName: 'Database 2',
                        tables: {
                            table2: {
                                prettyName: 'Table 2',
                                mappings: {
                                    mappingC: 'fieldC',
                                    mappingD: 'fieldD'
                                },
                                labelOptions: {
                                    valueC: 'labelC',
                                    valueD: 'labelD'
                                },
                                fields: [{
                                    columnName: 'fieldC',
                                    prettyName: 'Field C',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldD',
                                    prettyName: 'Field D',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            }
        }, input);

        let table1 = new TableMetaData('table1', 'Table 1');
        table1.fields = [
            new FieldMetaData('fieldA', 'Field A', false, 'text'),
            new FieldMetaData('fieldB', 'Field B', true, 'date')
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = new DatabaseMetaData('database1', 'Database 1');
        database1.tables = { [table1.name]: table1 };
        let datastore1 = { name: 'datastore1', host: 'host1', type: 'type1', hasUpdatedFields: false, databases: {} };
        datastore1.databases = { [database1.name]: database1 };
        datastore1.hasUpdatedFields = false;

        let table2 = new TableMetaData('table2', 'Table 2');
        table2.fields = [
            new FieldMetaData('fieldC', 'Field C', false, 'text'),
            new FieldMetaData('fieldD', 'Field D', true, 'date')
        ];
        table2.labelOptions = {
            valueC: 'labelC',
            valueD: 'labelD'
        };
        table2.mappings = {
            mappingC: 'fieldC',
            mappingD: 'fieldD'
        };
        let database2 = new DatabaseMetaData('database2', 'Database 2');
        database2.tables = { [table2.name]: table2 };
        let datastore2 = { name: 'datastore2', host: 'host2', type: 'type2', hasUpdatedFields: false, databases: {} };
        datastore2.databases = { [database2.name]: database2 };
        datastore2.hasUpdatedFields = false;

        expect(input).toEqual({ [datastore1.name]: datastore1, [datastore2.name]: datastore2 });
    });

    it('appendDatastoresFromConfig does keep updated fields if config hasUpdatedFields', () => {
        let input = {};

        DashboardService.appendDatastoresFromConfig({
            datastore1: {
                ...{ hasUpdatedFields: true },
                host: 'host1',
                type: 'type1',
                databases: {
                    database1: {
                        prettyName: 'Database 1',
                        tables: {
                            table1: {
                                prettyName: 'Table 1',
                                mappings: {
                                    mappingA: 'fieldA',
                                    mappingB: 'fieldB'
                                },
                                labelOptions: {
                                    valueA: 'labelA',
                                    valueB: 'labelB'
                                },
                                fields: [{
                                    columnName: 'fieldA',
                                    prettyName: 'Field A',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldB',
                                    prettyName: 'Field B',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            }
        }, input);

        let table1 = new TableMetaData('table1', 'Table 1');
        table1.fields = [
            new FieldMetaData('fieldA', 'Field A', false, 'text'),
            new FieldMetaData('fieldB', 'Field B', true, 'date')
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = new DatabaseMetaData('database1', 'Database 1');
        database1.tables = { [table1.name]: table1 };
        let datastore1 = { name: 'datastore1', host: 'host1', type: 'type1', hasUpdatedFields: false, databases: {} };
        datastore1.databases = { [database1.name]: database1 };
        datastore1.hasUpdatedFields = true;
        expect(input).toEqual({ [datastore1.name]: datastore1 });
    });

    it('appendDatastoresFromConfig with config and existing datastores should update given datastores', () => {
        let table1 = new TableMetaData('table1', 'Table 1');
        table1.fields = [
            new FieldMetaData('fieldA', 'Field A', false, 'text'),
            new FieldMetaData('fieldB', 'Field B', true, 'date')
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = new DatabaseMetaData('database1', 'Database 1');
        database1.tables = { [table1.name]: table1 };
        let datastore1 = { name: 'datastore1', host: 'host1', type: 'type1', hasUpdatedFields: false, databases: {} };
        datastore1.databases = { [database1.name]: database1 };
        datastore1.hasUpdatedFields = false;
        let input = { [datastore1.name]: datastore1 };

        DashboardService.appendDatastoresFromConfig({
            datastore2: {
                name: 'datastore2',
                host: 'host2',
                type: 'type2',
                databases: {
                    database2: {
                        prettyName: 'Database 2',
                        tables: {
                            table2: {
                                prettyName: 'Table 2',
                                mappings: {
                                    mappingC: 'fieldC',
                                    mappingD: 'fieldD'
                                },
                                labelOptions: {
                                    valueC: 'labelC',
                                    valueD: 'labelD'
                                },
                                fields: [{
                                    columnName: 'fieldC',
                                    prettyName: 'Field C',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldD',
                                    prettyName: 'Field D',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            }
        }, input);

        let table2 = new TableMetaData('table2', 'Table 2');
        table2.fields = [
            new FieldMetaData('fieldC', 'Field C', false, 'text'),
            new FieldMetaData('fieldD', 'Field D', true, 'date')
        ];
        table2.labelOptions = {
            valueC: 'labelC',
            valueD: 'labelD'
        };
        table2.mappings = {
            mappingC: 'fieldC',
            mappingD: 'fieldD'
        };
        let database2 = new DatabaseMetaData('database2', 'Database 2');
        database2.tables = { [table2.name]: table2 };
        let datastore2 = { name: 'datastore2', host: 'host2', type: 'type2', hasUpdatedFields: false, databases: {} };
        datastore2.databases = { [database2.name]: database2 };
        datastore2.hasUpdatedFields = false;
        expect(input).toEqual({ [datastore1.name]: datastore1, [datastore2.name]: datastore2 });
    });

    it('appendDatastoresFromConfig with same datastore in config and existing datastores should not update given datastores', () => {
        let table1 = new TableMetaData('table1', 'Table 1');
        table1.fields = [
            new FieldMetaData('fieldA', 'Field A', false, 'text'),
            new FieldMetaData('fieldB', 'Field B', true, 'date')
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = new DatabaseMetaData('database1', 'Database 1');
        database1.tables = { [table1.name]: table1 };
        let datastore1 = { name: 'datastore1', host: 'host1', type: 'type1', hasUpdatedFields: false, databases: {} };
        datastore1.databases = { [database1.name]: database1 };
        datastore1.hasUpdatedFields = false;
        let input = { [datastore1.name]: datastore1 };

        DashboardService.appendDatastoresFromConfig({
            datastore1: {
                name: 'datastore1',
                host: 'host1',
                type: 'type1',
                databases: {
                    database1: {
                        prettyName: 'Database 1',
                        tables: {
                            table1: {
                                prettyName: 'Table 1',
                                mappings: {
                                    mappingA: 'fieldA',
                                    mappingB: 'fieldB'
                                },
                                labelOptions: {
                                    valueA: 'labelA',
                                    valueB: 'labelB'
                                },
                                fields: [{
                                    columnName: 'fieldA',
                                    prettyName: 'Field A',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldB',
                                    prettyName: 'Field B',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            }
        }, input);

        expect(input).toEqual({ [datastore1.name]: datastore1 });
    });

    it('updateDatastoresInDashboards should set datastores property in given dashboards with tables', () => {
        let table1 = new TableMetaData('table1', 'Table 1');
        table1.fields = [
            new FieldMetaData('fieldA', 'Field A', false, 'text'),
            new FieldMetaData('fieldB', 'Field B', true, 'date')
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = new DatabaseMetaData('database1', 'Database 1');
        database1.tables = { [table1.name]: table1 };
        let datastore1 = { name: 'datastore1', host: 'host1', type: 'type1', hasUpdatedFields: false, databases: {} };
        datastore1.databases = { [database1.name]: database1 };

        let dashboard1 = Dashboard.get();
        dashboard1.tables = {
            key1: 'datastore1.database1.table1'
        };

        DashboardService.updateDatastoresInDashboards(dashboard1, { [datastore1.name]: datastore1 });
        expect(dashboard1.datastores).toEqual({ [datastore1.name]: datastore1 });
    });

    it('updateDatastoresInDashboards should set datastores property in given dashboards with choices', () => {
        let table1 = new TableMetaData('table1', 'Table 1');
        table1.fields = [
            new FieldMetaData('fieldA', 'Field A', false, 'text'),
            new FieldMetaData('fieldB', 'Field B', true, 'date')
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = new DatabaseMetaData('database1', 'Database 1');
        database1.tables = { [table1.name]: table1 };
        let datastore1 = { name: 'datastore1', host: 'host1', type: 'type1', hasUpdatedFields: false, databases: {} };
        datastore1.databases = { [database1.name]: database1 };

        let table2 = new TableMetaData('table2', 'Table 2');
        table2.fields = [
            new FieldMetaData('fieldC', 'Field C', false, 'text'),
            new FieldMetaData('fieldD', 'Field D', true, 'date')
        ];
        table2.labelOptions = {
            valueC: 'labelC',
            valueD: 'labelD'
        };
        table2.mappings = {
            mappingC: 'fieldC',
            mappingD: 'fieldD'
        };
        let database2 = new DatabaseMetaData('database2', 'Database 2');
        database2.tables = { [table2.name]: table2 };
        let datastore2 = { name: 'datastore2', host: 'host2', type: 'type2', hasUpdatedFields: false, databases: {} };
        datastore2.databases = { [database2.name]: database2 };

        let dashboard1 = Dashboard.get();
        dashboard1.tables = {
            key1: 'datastore1.database1.table1'
        };
        let dashboard2 = Dashboard.get();
        dashboard2.tables = {
            key1: 'datastore2.database2.table2'
        };
        let dashboard3 = Dashboard.get();
        dashboard3.choices = {
            choice1: dashboard1,
            choice2: dashboard2
        };

        DashboardService.updateDatastoresInDashboards(dashboard3, { [datastore1.name]: datastore1, [datastore2.name]: datastore2 });
        expect(dashboard1.datastores).toEqual({ [datastore1.name]: datastore1 });
        expect(dashboard2.datastores).toEqual({ [datastore2.name]: datastore2 });
    });

    it('updateLayoutInDashboards should set layoutObject property in given dashboards with layout', () => {
        datasetService['config'].layouts = {
            layout1: [1, 2, 3],
            layout2: [4, 5, 6]
        } as any;
        datasetService.setLayout('layout1');
        expect(datasetService.layouts[datasetService.state.getLayout()]).toEqual([1, 2, 3]);
    });

    it('updateLayoutInDashboards should set layoutObject property in given dashboards with choices', () => {
        datasetService['config'].layouts = {
            layout1: [1, 2, 3],
            layout2: [4, 5, 6]
        } as any;

        datasetService.setLayout('layout1');
        expect(datasetService.layouts[datasetService.state.getLayout()]).toEqual([1, 2, 3]);
        datasetService.setLayout('layout2');
        expect(datasetService.layouts[datasetService.state.getLayout()]).toEqual([4, 5, 6]);
    });

    it('validateDashboards should set category and fullTitle and pathFromTop properties in given dashboards', () => {
        // TODO THOR-692
    });

    it('validateDashboards should update simpleFilter properties in given dashboards', () => {
        // TODO THOR-692
    });

    it('validateDashboards should delete choices with no layout or tables from given dashboards', () => {
        // TODO THOR-692
    });

    it('validateDashboards should add root dashboard if needed to given dashboards', () => {
        let argument = Dashboard.get();
        argument.layout = 'layout1';
        argument.name = 'dashboard1';
        argument.tables = {
            key1: 'datastore1.database1.table1'
        };

        let expected = Dashboard.get();
        expected.category = (DashboardService as any).DASHBOARD_CATEGORY_DEFAULT;
        expected.choices = {
            dashboard1: argument
        };

        let actual = DashboardService.validateDashboards(argument);
        expect(actual).toEqual(expected);
    });
});

describe('Service: DashboardService with Mock Data', () => {
    let datasetService: DashboardService;

    initializeTestBed('Dashboard Service with Mock Data', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: ConfigService, useValue: ConfigService.as(NeonGTDConfig.get()) }
        ]
    });

    beforeEach(inject([DashboardService], (_datasetService: DashboardService) => {
        datasetService = _datasetService;
    }));

    it('should have active datastore at creation', () => {
        let datastore = { name: 'datastore1', host: 'testHostname', type: 'testDatastore', databases: {} };
        datastore.databases = DashboardServiceMock.DATABASES;
        datastore['hasUpdatedFields'] = true;
        expect(datasetService.state.datastore).toEqual(datastore);
    });

    it('should have active dashboard at creation', () => {
        let dashboard: Dashboard = Dashboard.get();
        dashboard.name = 'Test Discovery Config';
        dashboard.layout = 'DISCOVERY';
        dashboard.options = {};
        dashboard.visualizationTitles = {
            dataTableTitle: 'Documents'
        };
        dashboard.tables = {
            table_key_1: 'datastore1.testDatabase1.testTable1',
            table_key_2: 'datastore1.testDatabase2.testTable2'
        };
        dashboard.fields = {
            field_key_1: 'datastore1.testDatabase1.testTable1.testFieldKeyField'
        };
        dashboard.relations = [
            ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldB'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        ];
        expect(datasetService.state.dashboard).toEqual(dashboard);
    });

    it('appendDatasets does add given dashboards, datastores, and layouts to existing dataset', () => {
        // TODO THOR-692
    });

    it('findRelationDataList does work with relations in string list structure', () => {
        spyOn(datasetService.state, 'dashboard').and.returnValue({
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
                ['datastore1.testDatabase1.testTable1.testRelationFieldB', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        });

        expect(datasetService.state.findRelationDataList()).toEqual([
            [
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.RELATION_FIELD_A
                }],
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.RELATION_FIELD_A
                }]
            ],
            [
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.RELATION_FIELD_B
                }],
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.RELATION_FIELD_B
                }]
            ]
        ]);
    });

    it('findRelationDataList does work with relations in nested list structure', () => {
        spyOn(datasetService.state, 'dashboard').and.returnValue({
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
        });

        expect(datasetService.state.findRelationDataList()).toEqual([
            [
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.RELATION_FIELD_A
                }],
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.RELATION_FIELD_A
                }]
            ],
            [
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.RELATION_FIELD_A
                }, {
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.RELATION_FIELD_B
                }],
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.RELATION_FIELD_A
                }, {
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.RELATION_FIELD_B
                }]
            ]
        ]);
    });

    it('findRelationDataList does work with relations in both structures', () => {
        spyOn(datasetService.state, 'dashboard').and.returnValue({
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', ['datastore1.testDatabase2.testTable2.testRelationFieldA']],
                [['datastore1.testDatabase1.testTable1.testRelationFieldB'], 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        });

        expect(datasetService.state.findRelationDataList()).toEqual([
            [
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.RELATION_FIELD_A
                }],
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.RELATION_FIELD_A
                }]
            ],
            [
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.RELATION_FIELD_B
                }],
                [{
                    datastore: '',
                    database: DashboardServiceMock.DATABASES.testDatabase2,
                    table: DashboardServiceMock.TABLES.testTable2,
                    field: DashboardServiceMock.RELATION_FIELD_B
                }]
            ]
        ]);
    });

    it('findRelationDataList does ignore relations on databases/tables/fields that don\'t exist', () => {
        spyOn(datasetService.state, 'dashboard').and.returnValue({
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
        });

        expect(datasetService.state.findRelationDataList()).toEqual([]);
    });

    it('findRelationDataList does ignore relations with unequal filter fields', () => {
        spyOn(datasetService.state, 'dashboard').and.returnValue({
            relations: [
                [
                    ['datastore1.testDatabase1.testTable1.testRelationFieldA'],
                    []
                ],
                [
                    [],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA']
                ],
                [
                    ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase1.testTable1.testRelationFieldB'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA']
                ],
                [
                    ['datastore1.testDatabase1.testTable1.testRelationFieldA'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
                ]
            ]
        });

        expect(datasetService.state.findRelationDataList()).toEqual([]);
    });

    it('getCurrentDatabase does return expected object', () => {
        expect(datasetService.state.getDatabase()).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
    });

    it('getDatastoresInConfigFormat does return expected object', () => {
        expect(datasetService.getDatastoresInConfigFormat()).toEqual({
            datastore1: {
                hasUpdatedFields: true,
                host: 'testHostname',
                type: 'testDatastore',
                databases: {
                    testDatabase1: {
                        prettyName: 'Test Database 1',
                        tables: {
                            testTable1: {
                                prettyName: 'Test Table 1',
                                fields: DashboardServiceMock.FIELDS.map((field) => ({
                                    columnName: field.columnName,
                                    prettyName: field.prettyName,
                                    hide: field.hide,
                                    type: field.type
                                })),
                                labelOptions: {},
                                mappings: {}
                            },
                            testTable2: {
                                prettyName: 'Test Table 2',
                                fields: DashboardServiceMock.FIELDS.map((field) => ({
                                    columnName: field.columnName,
                                    prettyName: field.prettyName,
                                    hide: field.hide,
                                    type: field.type
                                })),
                                labelOptions: {},
                                mappings: {}
                            }
                        }
                    },
                    testDatabase2: {
                        prettyName: 'Test Database 2',
                        tables: {
                            testTable1: {
                                prettyName: 'Test Table 1',
                                fields: DashboardServiceMock.FIELDS.map((field) => ({
                                    columnName: field.columnName,
                                    prettyName: field.prettyName,
                                    hide: field.hide,
                                    type: field.type
                                })),
                                labelOptions: {},
                                mappings: {}
                            },
                            testTable2: {
                                prettyName: 'Test Table 2',
                                fields: DashboardServiceMock.FIELDS.map((field) => ({
                                    columnName: field.columnName,
                                    prettyName: field.prettyName,
                                    hide: field.hide,
                                    type: field.type
                                })),
                                labelOptions: {},
                                mappings: {}
                            }
                        }
                    }
                }
            }
        });
    });

    it('translateFieldKeyToValue does return expected string', () => {
        expect(datasetService.state.translateFieldKeyToValue('field_key_1')).toEqual('testFieldKeyField');
        expect(datasetService.state.translateFieldKeyToValue('testDateField')).toEqual('testDateField');
        expect(datasetService.state.translateFieldKeyToValue('testNameField')).toEqual('testNameField');
        expect(datasetService.state.translateFieldKeyToValue('testSizeField')).toEqual('testSizeField');
    });
});
