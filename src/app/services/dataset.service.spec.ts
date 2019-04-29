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
import { TestBed, inject } from '@angular/core/testing';
import { Dashboard, DashboardOptions, DatabaseMetaData, Datastore, FieldMetaData, TableMetaData } from '../dataset';
import { DatasetService } from './dataset.service';
import { NeonGTDConfig } from '../neon-gtd-config';
import { initializeTestBed } from '../../testUtils/initializeTestBed';
import { DatasetServiceMock } from '../../testUtils/MockServices/DatasetServiceMock';

describe('Service: DatasetService', () => {
    let datasetService: DatasetService;

    initializeTestBed('Dataset Service', {
        providers: [
            DatasetService,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ]
    });

    beforeEach(inject([DatasetService], (_datasetService: DatasetService) => {
        datasetService = _datasetService;
    }));

    it('should have no active datastores at creation', () => {
        expect(datasetService.getDataset()).toEqual(new Datastore());
    });

    it('should have no active dashboards at creation', () => {
        expect(datasetService.getCurrentDashboard()).not.toBeDefined();
    });

    it('should return datastores by name', () => {
        datasetService.addDataset({
            name: 'd1',
            databases: []
        });

        expect(datasetService.getDatasetWithName('d1')).toEqual({
            name: 'd1',
            databases: []
        });
    });

    it('getCurrentDatabase does return expected object', () => {
        expect(datasetService.getCurrentDatabase()).not.toBeDefined();
    });
});

describe('Service: DatasetService Static Functions', () => {
    initializeTestBed('Dataset Service Static Functions', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ]
    });

    it('appendDatastoresFromConfig with no config and no datastores should do nothing', () => {
        let input = [];
        DatasetService.appendDatastoresFromConfig({}, input);
        expect(input).toEqual([]);
    });

    it('appendDatastoresFromConfig with config and no existing datastores should update given datastores', () => {
        let input = [];

        DatasetService.appendDatastoresFromConfig({
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
        database1.tables = [table1];
        let datastore1 = new Datastore('datastore1', 'host1', 'type1');
        datastore1.databases = [database1];
        datastore1.hasUpdatedFields = false;
        expect(input).toEqual([datastore1]);
    });

    it('appendDatastoresFromConfig with config of multiple datastores and no existing datastores should update given datastores', () => {
        let input = [];

        DatasetService.appendDatastoresFromConfig({
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
        database1.tables = [table1];
        let datastore1 = new Datastore('datastore1', 'host1', 'type1');
        datastore1.databases = [database1];
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
        database2.tables = [table2];
        let datastore2 = new Datastore('datastore2', 'host2', 'type2');
        datastore2.databases = [database2];
        datastore2.hasUpdatedFields = false;

        expect(input).toEqual([datastore1, datastore2]);
    });

    it('appendDatastoresFromConfig does keep updated fields if config hasUpdatedFields', () => {
        let input = [];

        DatasetService.appendDatastoresFromConfig({
            datastore1: {
                hasUpdatedFields: true,
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
        database1.tables = [table1];
        let datastore1 = new Datastore('datastore1', 'host1', 'type1');
        datastore1.databases = [database1];
        datastore1.hasUpdatedFields = true;
        expect(input).toEqual([datastore1]);
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
        database1.tables = [table1];
        let datastore1 = new Datastore('datastore1', 'host1', 'type1');
        datastore1.databases = [database1];
        datastore1.hasUpdatedFields = false;
        let input = [datastore1];

        DatasetService.appendDatastoresFromConfig({
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
        database2.tables = [table2];
        let datastore2 = new Datastore('datastore2', 'host2', 'type2');
        datastore2.databases = [database2];
        datastore2.hasUpdatedFields = false;
        expect(input).toEqual([datastore1, datastore2]);
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
        database1.tables = [table1];
        let datastore1 = new Datastore('datastore1', 'host1', 'type1');
        datastore1.databases = [database1];
        datastore1.hasUpdatedFields = false;
        let input = [datastore1];

        DatasetService.appendDatastoresFromConfig({
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

        expect(input).toEqual([datastore1]);
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
        database1.tables = [table1];
        let datastore1 = new Datastore('datastore1', 'host1', 'type1');
        datastore1.databases = [database1];

        let dashboard1 = new Dashboard();
        dashboard1.tables = {
            key1: 'datastore1.database1.table1'
        };

        DatasetService.updateDatastoresInDashboards(dashboard1, [datastore1]);
        expect(dashboard1.datastores).toEqual([datastore1]);
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
        database1.tables = [table1];
        let datastore1 = new Datastore('datastore1', 'host1', 'type1');
        datastore1.databases = [database1];

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
        database2.tables = [table2];
        let datastore2 = new Datastore('datastore2', 'host2', 'type2');
        datastore2.databases = [database2];

        let dashboard1 = new Dashboard();
        dashboard1.tables = {
            key1: 'datastore1.database1.table1'
        };
        let dashboard2 = new Dashboard();
        dashboard2.tables = {
            key1: 'datastore2.database2.table2'
        };
        let dashboard3 = new Dashboard();
        dashboard3.choices = {
            choice1: dashboard1,
            choice2: dashboard2
        };

        DatasetService.updateDatastoresInDashboards(dashboard3, [datastore1, datastore2]);
        expect(dashboard1.datastores).toEqual([datastore1]);
        expect(dashboard2.datastores).toEqual([datastore2]);
    });

    it('updateLayoutInDashboards should set layoutObject property in given dashboards with layout', () => {
        let layout = {
            layout1: [1, 2, 3],
            layout2: [4, 5, 6]
        };

        let dashboard1 = new Dashboard();
        dashboard1.layout = 'layout1';

        DatasetService.updateLayoutInDashboards(dashboard1, layout);
        expect(dashboard1.layoutObject).toEqual([1, 2, 3]);
    });

    it('updateLayoutInDashboards should set layoutObject property in given dashboards with choices', () => {
        let layout = {
            layout1: [1, 2, 3],
            layout2: [4, 5, 6]
        };

        let dashboard1 = new Dashboard();
        dashboard1.layout = 'layout1';
        let dashboard2 = new Dashboard();
        dashboard2.layout = 'layout2';
        let dashboard3 = new Dashboard();
        dashboard3.choices = {
            choice1: dashboard1,
            choice2: dashboard2
        };

        DatasetService.updateLayoutInDashboards(dashboard3, layout);
        expect(dashboard1.layoutObject).toEqual([1, 2, 3]);
        expect(dashboard2.layoutObject).toEqual([4, 5, 6]);
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
        let argument = new Dashboard();
        argument.layout = 'layout1';
        argument.name = 'dashboard1';
        argument.tables = {
            key1: 'datastore1.database1.table1'
        };

        let expected = new Dashboard();
        expected.category = (DatasetService as any).DASHBOARD_CATEGORY_DEFAULT;
        expected.choices = {
            dashboard1: argument
        };

        let actual = DatasetService.validateDashboards(argument);
        expect(actual).toEqual(expected);
    });
});

describe('Service: DatasetService with Mock Data', () => {
    let datasetService: DatasetService;

    initializeTestBed('Dataset Service with Mock Data', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ]
    });

    beforeEach(inject([DatasetService], (_datasetService: DatasetService) => {
        datasetService = _datasetService;
    }));

    it('should have active datastore at creation', () => {
        let datastore: Datastore = new Datastore('datastore1', 'testHostname', 'testDatastore');
        datastore.databases = DatasetServiceMock.DATABASES;
        expect(datasetService.getDataset()).toEqual(datastore);
    });

    it('should have active dashboard at creation', () => {
        let dashboard: Dashboard = new Dashboard();
        dashboard.name = 'Test Discovery Config';
        dashboard.layout = 'DISCOVERY';
        dashboard.options = new DashboardOptions();
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
        expect(datasetService.getCurrentDashboard()).toEqual(dashboard);
    });

    it('findRelationDataList does not error if relations are undefined', () => {
        spyOn(datasetService, 'getCurrentDashboard').and.returnValue({});
        expect(datasetService.findRelationDataList()).toEqual([]);
    });

    it('findRelationDataList does work with relations in string list structure', () => {
        spyOn(datasetService, 'getCurrentDashboard').and.returnValue({
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
                ['datastore1.testDatabase1.testTable1.testRelationFieldB', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        });

        expect(datasetService.findRelationDataList()).toEqual([
            [
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.RELATION_FIELD_A
                }],
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[1],
                    table: DatasetServiceMock.TABLES[1],
                    field: DatasetServiceMock.RELATION_FIELD_A
                }]
            ],
            [
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.RELATION_FIELD_B
                }],
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[1],
                    table: DatasetServiceMock.TABLES[1],
                    field: DatasetServiceMock.RELATION_FIELD_B
                }]
            ]
        ]);
    });

    it('findRelationDataList does work with relations in nested list structure', () => {
        spyOn(datasetService, 'getCurrentDashboard').and.returnValue({
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

        expect(datasetService.findRelationDataList()).toEqual([
            [
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.RELATION_FIELD_A
                }],
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[1],
                    table: DatasetServiceMock.TABLES[1],
                    field: DatasetServiceMock.RELATION_FIELD_A
                }]
            ],
            [
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.RELATION_FIELD_A
                }, {
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.RELATION_FIELD_B
                }],
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[1],
                    table: DatasetServiceMock.TABLES[1],
                    field: DatasetServiceMock.RELATION_FIELD_A
                }, {
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[1],
                    table: DatasetServiceMock.TABLES[1],
                    field: DatasetServiceMock.RELATION_FIELD_B
                }]
            ]
        ]);
    });

    it('findRelationDataList does work with relations in both structures', () => {
        spyOn(datasetService, 'getCurrentDashboard').and.returnValue({
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', ['datastore1.testDatabase2.testTable2.testRelationFieldA']],
                [['datastore1.testDatabase1.testTable1.testRelationFieldB'], 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        });

        expect(datasetService.findRelationDataList()).toEqual([
            [
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.RELATION_FIELD_A
                }],
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[1],
                    table: DatasetServiceMock.TABLES[1],
                    field: DatasetServiceMock.RELATION_FIELD_A
                }]
            ],
            [
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[0],
                    table: DatasetServiceMock.TABLES[0],
                    field: DatasetServiceMock.RELATION_FIELD_B
                }],
                [{
                    datastore: '',
                    database: DatasetServiceMock.DATABASES[1],
                    table: DatasetServiceMock.TABLES[1],
                    field: DatasetServiceMock.RELATION_FIELD_B
                }]
            ]
        ]);
    });

    it('findRelationDataList does ignore relations on databases/tables/fields that don\'t exist', () => {
        spyOn(datasetService, 'getCurrentDashboard').and.returnValue({
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

        expect(datasetService.findRelationDataList()).toEqual([]);
    });

    it('findRelationDataList does ignore relations with unequal filter fields', () => {
        spyOn(datasetService, 'getCurrentDashboard').and.returnValue({
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

        expect(datasetService.findRelationDataList()).toEqual([]);
    });

    it('getCurrentDatabase does return expected object', () => {
        expect(datasetService.getCurrentDatabase()).toEqual(DatasetServiceMock.DATABASES[0]);
    });

    it('translateFieldKeyToValue does return expected string', () => {
        expect(datasetService.translateFieldKeyToValue('field_key_1')).toEqual('testFieldKeyField');
        expect(datasetService.translateFieldKeyToValue('testDateField')).toEqual('testDateField');
        expect(datasetService.translateFieldKeyToValue('testNameField')).toEqual('testNameField');
        expect(datasetService.translateFieldKeyToValue('testSizeField')).toEqual('testSizeField');
    });
});
