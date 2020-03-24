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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import {
    SearchServiceMock,
    DATABASES,
    DATASTORE,
    FIELD_MAP,
    TABLES
} from '@caci-critical-insight-solutions/nucleus-core';

import { AnnotationComponent, AnnotationDialogInput } from './annotation.component';
import { AnnotationModule } from './annotation.module';
import { ConfigService } from '../../services/config.service';
import { ConnectionServiceMock } from '../../services/mock.connection-service';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { InjectableSearchService } from '../../services/injectable.search.service';
import { NeonConfig } from '../../models/types';

import { initializeTestBed, getConfigService } from '../../../testUtils/initializeTestBed';

describe('Component: Annotation', () => {
    let fixture: ComponentFixture<AnnotationComponent>;
    let component: AnnotationComponent;

    const configService = getConfigService();
    const connectionService = new ConnectionServiceMock();
    const searchService = new SearchServiceMock();

    const ANNOTATION_DATA = {
        datastore: DATASTORE,
        database: DATABASES.testDatabase1,
        table: TABLES.testTable1,
        idField: FIELD_MAP.ID,
        dataId: 'testId',
        dataName: 'testName',
        annotationFields: new Map(Object.entries({
            testIdField: { field: FIELD_MAP.ID, value: 1 },
            testLinkField: { field: FIELD_MAP.LINK, value: 'http://link1' },
            testNameField: { field: FIELD_MAP.NAME, value: 'name1' },
            testSizeField: { field: FIELD_MAP.SIZE, value: 1234 },
            testTextField: { field: FIELD_MAP.TEXT, value: 'test text 1' },
            testTypeField: { field: FIELD_MAP.TYPE, value: 'type1' }
        }))
    } as AnnotationDialogInput;

    initializeTestBed('Annotation', {
        providers: [
            { provide: InjectableConnectionService, useValue: connectionService },
            { provide: InjectableSearchService, useValue: searchService },
            { provide: ConfigService, useValue: configService },
            { provide: MatDialogRef, useValue: {} },
            { provide: MAT_DIALOG_DATA, useValue: ANNOTATION_DATA }
        ],
        imports: [
            AnnotationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AnnotationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class properties are set as expected', () => {
        expect(component.datastore).toEqual(DATASTORE);
        expect(component.database).toEqual(DATABASES.testDatabase1);
        expect(component.table).toEqual(TABLES.testTable1);
        expect(component.idField).toEqual(FIELD_MAP.ID);
        expect(component.dataId).toEqual('testId');
        expect(component.dataName).toEqual('testName');
        expect(component.inputs).toEqual([{
            field: FIELD_MAP.ID,
            currentValue: 1,
            newValue: 1,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.LINK,
            currentValue: 'http://link1',
            newValue: 'http://link1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.NAME,
            currentValue: 'name1',
            newValue: 'name1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.SIZE,
            currentValue: 1234,
            newValue: 1234,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.TEXT,
            currentValue: 'test text 1',
            newValue: 'test text 1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.TYPE,
            currentValue: 'type1',
            newValue: 'type1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }]);
    });

    it('does update inputs on config change', () => {
        configService.setActive(NeonConfig.get({
            annotations: {
                datastore1: {
                    testDatabase1: {
                        testTable1: {
                            fields: {
                                testLinkField: {
                                    // Hidden
                                },
                                testNameField: {
                                    oneLineInput: true
                                },
                                testSizeField: {
                                    oneLineInput: true
                                },
                                testTextField: {
                                    multiLineInput: true
                                },
                                testTypeField: {
                                    setValue: 'type2'
                                }
                            }
                        }
                    }
                }
            }
        }));

        expect(component.inputs).toEqual([{
            field: FIELD_MAP.ID,
            currentValue: 1,
            newValue: 1,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.LINK,
            currentValue: 'http://link1',
            newValue: 'http://link1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.NAME,
            currentValue: 'name1',
            newValue: 'name1',
            oneLineInput: true,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }, {
            field: FIELD_MAP.SIZE,
            currentValue: 1234,
            newValue: 1234,
            oneLineInput: true,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }, {
            field: FIELD_MAP.TEXT,
            currentValue: 'test text 1',
            newValue: 'test text 1',
            oneLineInput: false,
            multiLineInput: true,
            dropdown: false,
            hidden: false
        }, {
            field: FIELD_MAP.TYPE,
            currentValue: 'type1',
            newValue: 'type2',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }]);
    });

    it('isSaveDisabled does return expected boolean', () => {
        expect(component.isSaveDisabled([{
            field: FIELD_MAP.NAME,
            currentValue: 'name1',
            newValue: 'name2',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }, {
            field: FIELD_MAP.TYPE,
            currentValue: 1234,
            newValue: 5678,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }])).toEqual(false);

        expect(component.isSaveDisabled([{
            field: FIELD_MAP.NAME,
            currentValue: 'name1',
            newValue: 'name1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }, {
            field: FIELD_MAP.TYPE,
            currentValue: 1234,
            newValue: 5678,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }])).toEqual(false);

        expect(component.isSaveDisabled([{
            field: FIELD_MAP.NAME,
            currentValue: 'name1',
            newValue: 'name2',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }, {
            field: FIELD_MAP.TYPE,
            currentValue: 1234,
            newValue: 1234,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }])).toEqual(false);

        expect(component.isSaveDisabled([{
            field: FIELD_MAP.NAME,
            currentValue: 'name1',
            newValue: 'name1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }, {
            field: FIELD_MAP.TYPE,
            currentValue: 1234,
            newValue: 1234,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: false
        }])).toEqual(true);
    });

    it('saveAnnotation does run mutation query with correct inputs', () => {
        let calls = 0;
        spyOn(connectionService, 'connect').and.returnValue({
            runMutate: (body, __onSuccess, __onError) => {
                ++calls;
                expect(JSON.parse(JSON.stringify(body))).toEqual({
                    datastoreHost: DATASTORE.host,
                    datastoreType: DATASTORE.type,
                    databaseName: DATABASES.testDatabase1.name,
                    tableName: TABLES.testTable1.name,
                    idFieldName: FIELD_MAP.ID.columnName,
                    dataId: 'testId',
                    fieldsWithValues: {
                        testIdField: 2,
                        testLinkField: 'http://link2',
                        testNameField: 'name2',
                        testSizeField: 5678,
                        testTextField: 'test text 2',
                        testTypeField: 'type1'
                    }
                });
            }
        });

        component.inputs[0].newValue = 2;
        component.inputs[1].newValue = 'http://link2';
        component.inputs[2].newValue = 'name2';
        component.inputs[3].newValue = 5678;
        component.inputs[4].newValue = 'test text 2';
        component.inputs[5].newValue = 'type1';
        component.saveAnnotation();

        expect(calls).toEqual(1);
    });
});

describe('Component: Annotation with Dropdowns', () => {
    let fixture: ComponentFixture<AnnotationComponent>;
    let component: AnnotationComponent;

    const configService = getConfigService();
    const connectionService = new ConnectionServiceMock();
    const searchService = new SearchServiceMock();

    const ANNOTATION_DATA = {
        datastore: DATASTORE,
        database: DATABASES.testDatabase1,
        table: TABLES.testTable1,
        idField: FIELD_MAP.ID,
        dataId: 'testId',
        dataName: 'testName',
        annotationFields: new Map(Object.entries({
            testIdField: { field: FIELD_MAP.ID, value: 1 },
            testLinkField: { field: FIELD_MAP.LINK, value: 'http://link1' },
            testNameField: { field: FIELD_MAP.NAME, value: 'name1' },
            testSizeField: { field: FIELD_MAP.SIZE, value: 1234 },
            testTextField: { field: FIELD_MAP.TEXT, value: 'test text 1' },
            testTypeField: { field: FIELD_MAP.TYPE, value: 'type1' }
        }))
    } as AnnotationDialogInput;

    initializeTestBed('Annotation with Dropdowns', {
        providers: [
            { provide: InjectableConnectionService, useValue: connectionService },
            { provide: InjectableSearchService, useValue: searchService },
            { provide: ConfigService, useValue: configService },
            { provide: MatDialogRef, useValue: {} },
            { provide: MAT_DIALOG_DATA, useValue: ANNOTATION_DATA }
        ],
        imports: [
            AnnotationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AnnotationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does run search queries for dropdown inputs on config change', () => {
        let spy = spyOn(searchService, 'runSearch').and.returnValue({
            done: (callback) => {
                callback({
                    data: [{
                        testNameField: 'a',
                        testIrrelevantField: 'x'
                    }, {
                        testNameField: 'b',
                        testIrrelevantField: 'y'
                    }, {
                        testNameField: 'd',
                        testIrrelevantField: 'z'
                    }]
                });
            },
            fail: (__callback) => {
                // Do nothing.
            }
        });

        configService.setActive(NeonConfig.get({
            annotations: {
                datastore1: {
                    testDatabase1: {
                        testTable1: {
                            fields: {
                                testNameField: {
                                    dropdown: ['b', 'c']
                                },
                                testSizeField: {
                                    dropdown: [1, 2, 3, 4]
                                }
                            }
                        }
                    }
                }
            }
        }));

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(0)[0]).toEqual(DATASTORE.type);
        expect(spy.calls.argsFor(0)[1]).toEqual(DATASTORE.host);
        expect(JSON.parse(JSON.stringify(spy.calls.argsFor(0)[2]))).toEqual({
            selectClause: {
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                fieldClauses: []
            },
            aggregateClauses: [{
                type: 'field',
                label: '_aggregation',
                operation: 'count',
                fieldClause: {
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.NAME.columnName
                }
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.NAME.columnName
                }
            }],
            joinClauses: [],
            limitClause: null,
            offsetClause: null,
            orderByClauses: [],
            whereClause: null,
            isDistinct: false
        });
        expect(spy.calls.argsFor(1)[0]).toEqual(DATASTORE.type);
        expect(spy.calls.argsFor(1)[1]).toEqual(DATASTORE.host);
        expect(JSON.parse(JSON.stringify(spy.calls.argsFor(1)[2]))).toEqual({
            selectClause: {
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                fieldClauses: []
            },
            aggregateClauses: [{
                type: 'field',
                label: '_aggregation',
                operation: 'count',
                fieldClause: {
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.SIZE.columnName
                }
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.SIZE.columnName
                }
            }],
            joinClauses: [],
            limitClause: null,
            offsetClause: null,
            orderByClauses: [],
            whereClause: null,
            isDistinct: false
        });

        expect(component.inputs).toEqual([{
            field: FIELD_MAP.ID,
            currentValue: 1,
            newValue: 1,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.LINK,
            currentValue: 'http://link1',
            newValue: 'http://link1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.NAME,
            currentValue: 'name1',
            newValue: 'name1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: ['a', 'b', 'c', 'd'],
            hidden: false
        }, {
            field: FIELD_MAP.SIZE,
            currentValue: 1234,
            newValue: 1234,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: [1, 2, 3, 4],
            hidden: false
        }, {
            field: FIELD_MAP.TEXT,
            currentValue: 'test text 1',
            newValue: 'test text 1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.TYPE,
            currentValue: 'type1',
            newValue: 'type1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }]);
    });
});

describe('Component: Annotation with Image', () => {
    let fixture: ComponentFixture<AnnotationComponent>;
    let component: AnnotationComponent;

    const configService = getConfigService();
    const connectionService = new ConnectionServiceMock();
    const searchService = new SearchServiceMock();

    const ANNOTATION_DATA = {
        datastore: DATASTORE,
        database: DATABASES.testDatabase1,
        table: TABLES.testTable1,
        idField: FIELD_MAP.ID,
        dataId: 'testId',
        dataName: 'testName',
        dataImageHeight: 123,
        dataImageWidth: 456,
        dataImageUrl: 'http://imageUrl',
        annotationFields: new Map(Object.entries({
            testIdField: { field: FIELD_MAP.ID, value: 1 },
            testLinkField: { field: FIELD_MAP.LINK, value: 'http://link1' },
            testNameField: { field: FIELD_MAP.NAME, value: 'name1' },
            testSizeField: { field: FIELD_MAP.SIZE, value: 1234 },
            testTextField: { field: FIELD_MAP.TEXT, value: 'test text 1' },
            testTypeField: { field: FIELD_MAP.TYPE, value: 'type1' }
        }))
    } as AnnotationDialogInput;

    initializeTestBed('Annotation with Image', {
        providers: [
            { provide: InjectableConnectionService, useValue: connectionService },
            { provide: InjectableSearchService, useValue: searchService },
            { provide: ConfigService, useValue: configService },
            { provide: MatDialogRef, useValue: {} },
            { provide: MAT_DIALOG_DATA, useValue: ANNOTATION_DATA }
        ],
        imports: [
            AnnotationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AnnotationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class properties (including image) are set as expected', () => {
        expect(component.datastore).toEqual(DATASTORE);
        expect(component.database).toEqual(DATABASES.testDatabase1);
        expect(component.table).toEqual(TABLES.testTable1);
        expect(component.idField).toEqual(FIELD_MAP.ID);
        expect(component.dataId).toEqual('testId');
        expect(component.dataName).toEqual('testName');
        expect(component.dataImageHeight).toEqual(123);
        expect(component.dataImageWidth).toEqual(456);
        expect(component.dataImageUrl).toEqual('http://imageUrl');
        expect(component.inputs).toEqual([{
            field: FIELD_MAP.ID,
            currentValue: 1,
            newValue: 1,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.LINK,
            currentValue: 'http://link1',
            newValue: 'http://link1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.NAME,
            currentValue: 'name1',
            newValue: 'name1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.SIZE,
            currentValue: 1234,
            newValue: 1234,
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.TEXT,
            currentValue: 'test text 1',
            newValue: 'test text 1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }, {
            field: FIELD_MAP.TYPE,
            currentValue: 'type1',
            newValue: 'type1',
            oneLineInput: false,
            multiLineInput: false,
            dropdown: false,
            hidden: true
        }]);
    });
});

