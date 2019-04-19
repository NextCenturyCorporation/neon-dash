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
import { Dashboard, DashboardOptions, Datastore } from '../dataset';
import { DatasetService } from './dataset.service';
import { NeonGTDConfig } from '../neon-gtd-config';
import { initializeTestBed } from '../../testUtils/initializeTestBed';
import { DatasetServiceMock } from '../../testUtils/MockServices/DatasetServiceMock';

describe('Service: DatasetService', () => {
    let testConfig = new NeonGTDConfig();

    initializeTestBed('Dataset Service', {
        providers: [
            DatasetService,
            { provide: 'config', useValue: testConfig }
        ]
    });

    it('should have no active datastores at creation', inject([DatasetService], (service: DatasetService) => {
        expect(service.getDataset()).toEqual(new Datastore());
    }));

    it('should have no active dashboards at creation', inject([DatasetService], (service: DatasetService) => {
        expect(service.getCurrentDashboard()).not.toBeDefined();
    }));

    it('should return datastores by name',
        inject([DatasetService], (service: DatasetService) => {
            service.addDataset({
            name: 'd1',
            databases: []
        });

        expect(service.getDatasetWithName('d1')).toEqual({
            name: 'd1',
            databases: []
        });
    }));

    it('getCurrentDatabase does return expected object', inject([DatasetService], (service: DatasetService) => {
        expect(service.getCurrentDatabase()).not.toBeDefined();
    }));
});

describe('Service: mock DatasetService with mock data', () => {
    let testConfig = new NeonGTDConfig();

    initializeTestBed('Dataset Service', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: 'config', useValue: testConfig }
        ]
    });

    it('should have active datastore at creation', inject([DatasetService], (service: DatasetService) => {
        let datastore: Datastore = new Datastore('datastore1', 'testHostname', 'testDatastore');
        datastore.databases = DatasetServiceMock.DATABASES;
        expect(service.getDataset()).toEqual(datastore);
    }));

    it('should have active dashboard at creation', inject([DatasetService], (service: DatasetService) => {
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
        expect(service.getCurrentDashboard()).toEqual(dashboard);
    }));

    it('findRelationDataList does not error if relations are undefined', inject([DatasetService], (service: DatasetService) => {
        spyOn(service, 'getCurrentDashboard').and.returnValue({});
        expect(service.findRelationDataList()).toEqual([]);
    }));

    it('findRelationDataList does work with relations in string list structure', inject([DatasetService], (service: DatasetService) => {
        spyOn(service, 'getCurrentDashboard').and.returnValue({
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
                ['datastore1.testDatabase1.testTable1.testRelationFieldB', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        });

        expect(service.findRelationDataList()).toEqual([
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
    }));

    it('findRelationDataList does work with relations in nested list structure', inject([DatasetService], (service: DatasetService) => {
        spyOn(service, 'getCurrentDashboard').and.returnValue({
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

        expect(service.findRelationDataList()).toEqual([
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
    }));

    it('findRelationDataList does work with relations in both structures', inject([DatasetService], (service: DatasetService) => {
        spyOn(service, 'getCurrentDashboard').and.returnValue({
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', ['datastore1.testDatabase2.testTable2.testRelationFieldA']],
                [['datastore1.testDatabase1.testTable1.testRelationFieldB'], 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        });

        expect(service.findRelationDataList()).toEqual([
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
    }));

    it('findRelationDataList does ignore relations on bad databases/tables/fields', inject([DatasetService], (service: DatasetService) => {
        spyOn(service, 'getCurrentDashboard').and.returnValue({
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

        expect(service.findRelationDataList()).toEqual([]);
    }));

    it('findRelationDataList does ignore relations with unequal filter fields', inject([DatasetService], (service: DatasetService) => {
        spyOn(service, 'getCurrentDashboard').and.returnValue({
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

        expect(service.findRelationDataList()).toEqual([]);
    }));

    it('getCurrentDatabase does return expected object', inject([DatasetService], (service: DatasetService) => {
        expect(service.getCurrentDatabase()).toEqual(DatasetServiceMock.DATABASES[0]);
    }));

    it('translateFieldKeyToValue does return expected string', inject([DatasetService], (service: DatasetService) => {
        expect(service.translateFieldKeyToValue('field_key_1')).toEqual('testFieldKeyField');
        expect(service.translateFieldKeyToValue('testDateField')).toEqual('testDateField');
        expect(service.translateFieldKeyToValue('testNameField')).toEqual('testNameField');
        expect(service.translateFieldKeyToValue('testSizeField')).toEqual('testSizeField');
    }));
});
