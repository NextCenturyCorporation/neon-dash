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
import { By } from '@angular/platform-browser';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterCollection } from '@caci-critical-insight-solutions/nucleus-core';
import { DatabaseConfig, FieldConfig, TableConfig } from '@caci-critical-insight-solutions/nucleus-core';

import { DocumentViewerComponent } from './document-viewer.component';

import { AbstractSearchService } from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { SearchServiceMock } from '@caci-critical-insight-solutions/nucleus-core';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { DocumentViewerModule } from './document-viewer.module';
import { CoreSearch } from '@caci-critical-insight-solutions/nucleus-core';

describe('Component: DocumentViewer', () => {
    let component: DocumentViewerComponent;
    let fixture: ComponentFixture<DocumentViewerComponent>;

    initializeTestBed('Document Viewer', {
        providers: [
            DashboardService,
            {
                provide: DashboardService,
                useClass: DashboardServiceMock
            },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            DocumentViewerModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('has expected options properties', () => {
        expect(component.options.dataField).toEqual(FieldConfig.get());
        expect(component.options.dateField).toEqual(FieldConfig.get());
        expect(component.options.idField).toEqual(FieldConfig.get());
        expect(component.options.metadataFields).toEqual([]);
        expect(component.options.popoutFields).toEqual([]);
        expect(component.options.showSelect).toBe(false);
        expect(component.options.showText).toBe(false);
    });

    it('returns the expectedvalue from validateVisualizationQuery', () => {
        expect(component.validateVisualizationQuery(component.options)).toBe(false);
        component.options.database = DatabaseConfig.get({ name: 'testDatabase1' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);
        component.options.table = TableConfig.get({ name: 'testTable1' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);
        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        expect(component.validateVisualizationQuery(component.options)).toBe(true);
    });

    it('returns expected query from finalizeVisualizationQuery with no sort', () => {
        component.options.database = DatabaseConfig.get({ name: 'testDatabase1' });
        component.options.table = TableConfig.get({ name: 'testTable1' });
        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;

        let searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testTextField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('returns expected query from finalizeVisualizationQuery with sort', () => {
        component.options.database = DatabaseConfig.get({ name: 'testDatabase1' });
        component.options.table = TableConfig.get({ name: 'testTable1' });
        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.sortField = DashboardServiceMock.FIELD_MAP.SORT;

        let searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testTextField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testSortField'
                },
                order: -1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('returns expected query from finalizeVisualizationQuery with metadataFields', () => {
        component.options.database = DatabaseConfig.get({ name: 'testDatabase1' });
        component.options.table = TableConfig.get({ name: 'testTable1' });
        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.metadataFields = [{
            field: 'a'
        }, {
            field: 'b'
        }];

        let searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: [{
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'a'
                }, {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'b'
                }]
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testTextField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('returns expected query from finalizeVisualizationQuery with metadataFields and popoutFields', () => {
        component.options.database = DatabaseConfig.get({ name: 'testDatabase1' });
        component.options.table = TableConfig.get({ name: 'testTable1' });
        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.metadataFields = [{
            field: 'a'
        }, {
            field: 'b'
        }];
        component.options.popoutFields = [{
            field: 'c'
        }, {
            field: 'd'
        }];

        let searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: [{
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'a'
                }, {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'b'
                }, {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'c'
                }, {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'd'
                }]
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testTextField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('sets expected properties if transformVisualizationQueryResults returns no data', () => {
        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;

        let actual = component.transformVisualizationQueryResults(component.options, [], new FilterCollection());

        expect(component.documentViewerData).toEqual([]);
        expect(actual).toEqual(0);
    });

    it('sets expected properties if transformVisualizationQueryResults returns data', () => {
        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            testTextField: 'text1',
            testDateField: 'date1',
            testIdField: 'id1'
        }, {
            testTextField: 'text2',
            testDateField: 'date2',
            testIdField: 'id2'
        }], new FilterCollection());

        expect(component.documentViewerData).toEqual([{
            data: {
                testTextField: 'text1',
                testDateField: 'date1',
                testIdField: 'id1'
            },
            rows: [{
                name: 'Test Text Field',
                text: 'text1'
            }, {
                name: 'Test Date Field',
                text: 'date1'
            }, {
                name: 'Test ID Field',
                text: 'id1'
            }]
        }, {
            data: {
                testTextField: 'text2',
                testDateField: 'date2',
                testIdField: 'id2'
            },
            rows: [{
                name: 'Test Text Field',
                text: 'text2'
            }, {
                name: 'Test Date Field',
                text: 'date2'
            }, {
                name: 'Test ID Field',
                text: 'id2'
            }]
        }]);
        expect(actual).toEqual(2);
    });

    it('doesn\'t do anything in refreshVisualization', () => {
        expect(component.refreshVisualization()).toBeUndefined();
        expect(component.options.dataField).toEqual(FieldConfig.get());
        expect(component.options.dateField).toEqual(FieldConfig.get());
        expect(component.options.idField).toEqual(FieldConfig.get());
        expect(component.options.metadataFields).toEqual([]);
        expect(component.options.popoutFields).toEqual([]);
        expect(component.options.showSelect).toBe(false);
        expect(component.options.showText).toBe(false);
    });

    it('createTableRowText given boolean field does return expected string', () => {
        expect(component.createTableRowText(true)).toEqual('true');
        expect(component.createTableRowText(false)).toEqual('false');
    });

    it('createTableRowText given number field does return expected string', () => {
        expect(component.createTableRowText(0)).toEqual('0');
        expect(component.createTableRowText(1)).toEqual('1');
        expect(component.createTableRowText(1234)).toEqual('1234');
        expect(component.createTableRowText(1.234)).toEqual('1.234');
    });

    it('createTableRowText given string field does return expected string', () => {
        expect(component.createTableRowText('A')).toEqual('A');
        expect(component.createTableRowText('The quick brown fox jumps over the lazy dog.')).toEqual(
            'The quick brown fox jumps over the lazy dog.'
        );
    });

    it('createTableRowText given date field does return expected string', () => {
        expect(component.createTableRowText(new Date(Date.UTC(2018, 0, 1)))).toEqual('Mon, Jan 1, 2018, 12:00 AM');
        expect(component.createTableRowText('2018-01-01T00:00:00.000Z')).toEqual('Mon, Jan 1, 2018, 12:00 AM');
    });

    it('createTableRowText given array field does return expected string', () => {
        expect(component.createTableRowText(['value'])).toEqual('value');
        expect(component.createTableRowText([1])).toEqual('1');
        expect(component.createTableRowText(['value1', 'value2'])).toEqual('value1, value2');
        expect(component.createTableRowText([2, 3])).toEqual('2, 3');
        expect(component.createTableRowText(['not a match', 'not a match', 'not a match'], {
            filterType: '=',
            filterFor: ['match']
        })).toEqual('');
        expect(component.createTableRowText(['not a match', 'match', 'not a match', 'match'], {
            filterType: '=',
            filterFor: ['match']
        })).toEqual('match, match');
        expect(component.createTableRowText(['match', 'match', 'match'], {
            filterType: '=',
            filterFor: ['match']
        })).toEqual('match, match, match');
        expect(component.createTableRowText([{
            value1: 'not a match',
            value2: 'return when matching (1)'
        }, {
            value1: 'not a match',
            value2: 'return when matching (2)'
        }], {
            filterType: '=',
            filterFor: ['match'],
            filterOn: 'value1',
            show: 'value2'
        })).toEqual('');
        expect(component.createTableRowText([{
            value1: 'match',
            value2: 'return when matching (1)'
        }, {
            value1: 'not a match',
            value2: 'return when matching (2)'
        }], {
            filterType: '=',
            filterFor: ['match'],
            filterOn: 'value1',
            show: 'value2'
        })).toEqual('return when matching (1)');
        expect(component.createTableRowText([{
            value1: 'match',
            value2: 'return when matching (1)'
        }, {
            value1: 'match',
            value2: 'return when matching (2)'
        }], {
            filterType: '=',
            filterFor: ['match'],
            filterOn: 'value1',
            show: 'value2'
        })).toEqual('return when matching (1), return when matching (2)');
    });

    it('createTableRowText given an empty string, empty array, any object, or null does return empty string', () => {
        expect(component.createTableRowText([])).toEqual('');
        expect(component.createTableRowText('')).toEqual('');
        expect(component.createTableRowText({})).toEqual('');
        expect(component.createTableRowText({
            key: 'value'
        })).toEqual('');
        expect(component.createTableRowText(null)).toEqual('');
        expect(component.createTableRowText(undefined)).toEqual('');
    });

    it('creates elements for data', async(() => {
        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        (component as any).documentViewerData = [{
            data: {
                testTextField: 'This is a string.',
                testDateField: '12:34:56 7/8/90',
                testIdField: '_12345',
                testMetadataField: 'First'
            },
            rows: [{
                name: 'Test Metadata Field',
                text: 'First'
            }]
        }, {
            data: {
                testTextField: 'This is another string.',
                testDateField: '09:87:65 4/3/21',
                testIdField: '_67890',
                testMetadataField: 'Second'
            },
            rows: [{
                name: 'Test Metadata Field',
                text: 'Second'
            }]
        }];
        component.options.metadataFields = [{
            name: 'Test Metadata Field',
            field: 'testMetadataField'
        }];
        component.changeDetection.detectChanges();

        let buttons = fixture.debugElement.queryAll(By.css('.document-viewer-button'));
        expect(buttons.length).toBe(2);
        let names = fixture.debugElement.queryAll(By.css('.document-viewer-name'));
        expect(names.length).toBe(2);
        let texts = fixture.debugElement.queryAll(By.css('.document-viewer-text'));
        expect(texts.length).toBe(2);
        expect(names[0].nativeElement.textContent).toEqual('Test Metadata Field: ');
        expect(texts[0].nativeElement.textContent).toEqual('First');
        expect(names[1].nativeElement.textContent).toEqual('Test Metadata Field: ');
        expect(texts[1].nativeElement.textContent).toEqual('Second');
    }));

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('populateActiveItem does update item data and rows as expected', () => {
        let activeItem = {
            data: {},
            rows: []
        };

        let responseItem = {
            testField1: 1,
            testField2: 1.234,
            testField3: 'A',
            testField4: true
        };

        component.populateActiveItem(activeItem, responseItem, [], 'testField1');

        expect(activeItem).toEqual({
            data: {
                testField1: 1
            },
            rows: [{
                name: 'testField1',
                text: '1'
            }]
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField2');

        expect(activeItem).toEqual({
            data: {
                testField1: 1,
                testField2: 1.234
            },
            rows: [{
                name: 'testField1',
                text: '1'
            }, {
                name: 'testField2',
                text: '1.234'
            }]
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField3');

        expect(activeItem).toEqual({
            data: {
                testField1: 1,
                testField2: 1.234,
                testField3: 'A'
            },
            rows: [{
                name: 'testField1',
                text: '1'
            }, {
                name: 'testField2',
                text: '1.234'
            }, {
                name: 'testField3',
                text: 'A'
            }]
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField4');

        expect(activeItem).toEqual({
            data: {
                testField1: 1,
                testField2: 1.234,
                testField3: 'A',
                testField4: true
            },
            rows: [{
                name: 'testField1',
                text: '1'
            }, {
                name: 'testField2',
                text: '1.234'
            }, {
                name: 'testField3',
                text: 'A'
            }, {
                name: 'testField4',
                text: 'true'
            }]
        });
    });

    it('populateActiveItem does update item with array values as expected', () => {
        let activeItem = {
            data: {},
            rows: []
        };

        let responseItem = {
            testField1: [1],
            testField2: [2, 3, 4]
        };

        component.populateActiveItem(activeItem, responseItem, [], 'testField1');

        expect(activeItem).toEqual({
            data: {
                testField1: [1]
            },
            rows: [{
                name: 'testField1',
                text: '1'
            }]
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField2');

        expect(activeItem).toEqual({
            data: {
                testField1: [1],
                testField2: [2, 3, 4]
            },
            rows: [{
                name: 'testField1',
                text: '1'
            }, {
                name: 'testField2',
                text: '2, 3, 4'
            }]
        });
    });

    it('populateActiveItem does update item with nested object values as expected', () => {
        let activeItem = {
            data: {},
            rows: []
        };

        let responseItem = {
            testObjectField1: {
                testField1: 1,
                testField2: 1.234,
                testField3: 'A',
                testField4: true
            },
            testObjectField2: {
                testField5: [10, 20],
                testNestedField1: {
                    testField6: [30, 40]
                }
            }
        };

        component.populateActiveItem(activeItem, responseItem, [], 'testObjectField1');

        expect(activeItem).toEqual({
            data: {
                testObjectField1: {
                    testField1: 1,
                    testField2: 1.234,
                    testField3: 'A',
                    testField4: true
                }
            },
            rows: [{
                name: 'testObjectField1.testField1',
                text: '1'
            }, {
                name: 'testObjectField1.testField2',
                text: '1.234'
            }, {
                name: 'testObjectField1.testField3',
                text: 'A'
            }, {
                name: 'testObjectField1.testField4',
                text: 'true'
            }]
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testObjectField2');

        expect(activeItem).toEqual({
            data: {
                testObjectField1: {
                    testField1: 1,
                    testField2: 1.234,
                    testField3: 'A',
                    testField4: true
                },
                testObjectField2: {
                    testField5: [10, 20],
                    testNestedField1: {
                        testField6: [30, 40]
                    }
                }
            },
            rows: [{
                name: 'testObjectField1.testField1',
                text: '1'
            }, {
                name: 'testObjectField1.testField2',
                text: '1.234'
            }, {
                name: 'testObjectField1.testField3',
                text: 'A'
            }, {
                name: 'testObjectField1.testField4',
                text: 'true'
            }, {
                name: 'testObjectField2.testField5',
                text: '10, 20'
            }, {
                name: 'testObjectField2.testNestedField1.testField6',
                text: '30, 40'
            }]
        });
    });

    it('populateActiveItem does not add nested object values that are in the config fields to rows', () => {
        let activeItem = {
            data: {},
            rows: []
        };

        let responseItem = {
            testObjectField1: {
                testField1: 1,
                testField2: 1.234,
                testField3: 'A',
                testField4: true
            }
        };

        component.populateActiveItem(activeItem, responseItem, [{
            field: 'testObjectField1.testField2'
        }, {
            field: 'testObjectField1.testField4'
        }], 'testObjectField1');

        expect(activeItem).toEqual({
            data: {
                testObjectField1: {
                    testField1: 1,
                    testField2: 1.234,
                    testField3: 'A',
                    testField4: true
                }
            },
            rows: [{
                name: 'testObjectField1.testField1',
                text: '1'
            }, {
                name: 'testObjectField1.testField3',
                text: 'A'
            }]
        });
    });

    it('populateActiveItem does update item with nested fields as expected', () => {
        let activeItem = {
            data: {},
            rows: []
        };

        let responseItem = {
            testNestedField1: {
                testField1: [10, 20],
                testNestedField2: {
                    testField2: 'A'
                }
            }
        };

        component.populateActiveItem(activeItem, responseItem, [], 'testNestedField1.testField1');

        expect(activeItem).toEqual({
            data: {
                'testNestedField1.testField1': [10, 20]
            },
            rows: [{
                name: 'testNestedField1.testField1',
                text: '10, 20'
            }]
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testNestedField1.testNestedField2.testField2');

        expect(activeItem).toEqual({
            data: {
                'testNestedField1.testField1': [10, 20],
                'testNestedField1.testNestedField2.testField2': 'A'
            },
            rows: [{
                name: 'testNestedField1.testField1',
                text: '10, 20'
            }, {
                name: 'testNestedField1.testNestedField2.testField2',
                text: 'A'
            }]
        });
    });

    it('populateActiveItem does handle falsey values as expected', () => {
        let activeItem = {
            data: {},
            rows: []
        };

        let responseItem = {
            testField1: null,
            testField2: '',
            testField3: [],
            testField4: {},
            testField5: 0,
            testField6: false
        };

        component.populateActiveItem(activeItem, responseItem, [], 'testField1');

        expect(activeItem).toEqual({
            data: {
                testField1: null
            },
            rows: []
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField2');

        expect(activeItem).toEqual({
            data: {
                testField1: null,
                testField2: ''
            },
            rows: []
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField3');

        expect(activeItem).toEqual({
            data: {
                testField1: null,
                testField2: '',
                testField3: []
            },
            rows: []
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField4');

        expect(activeItem).toEqual({
            data: {
                testField1: null,
                testField2: '',
                testField3: [],
                testField4: {}
            },
            rows: []
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField5');

        expect(activeItem).toEqual({
            data: {
                testField1: null,
                testField2: '',
                testField3: [],
                testField4: {},
                testField5: 0
            },
            rows: [{
                name: 'testField5',
                text: '0'
            }]
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField6');

        expect(activeItem).toEqual({
            data: {
                testField1: null,
                testField2: '',
                testField3: [],
                testField4: {},
                testField5: 0,
                testField6: false
            },
            rows: [{
                name: 'testField5',
                text: '0'
            }, {
                name: 'testField6',
                text: 'false'
            }]
        });
    });

    it('populateActiveItem does use given name argument', () => {
        let activeItem = {
            data: {},
            rows: []
        };

        let responseItem = {
            testField1: 'A',
            testField2: 'B'
        };

        component.populateActiveItem(activeItem, responseItem, [], 'testField1', 'Test Field 1');

        expect(activeItem).toEqual({
            data: {
                testField1: 'A'
            },
            rows: [{
                name: 'Test Field 1',
                text: 'A'
            }]
        });

        component.populateActiveItem(activeItem, responseItem, [], 'testField2', 'Test Field 2');

        expect(activeItem).toEqual({
            data: {
                testField1: 'A',
                testField2: 'B'
            },
            rows: [{
                name: 'Test Field 1',
                text: 'A'
            }, {
                name: 'Test Field 2',
                text: 'B'
            }]
        });
    });

    it('populateActiveItem does use field pretty name if no name is given', () => {
        component.options.databases = DashboardServiceMock.DATABASES_LIST;
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.tables = DashboardServiceMock.TABLES_LIST;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.fields = DashboardServiceMock.FIELDS;

        let activeItem = {
            data: {},
            rows: []
        };

        let responseItem = {};
        responseItem[DashboardServiceMock.FIELD_MAP.NAME.columnName] = 'A';
        responseItem[DashboardServiceMock.FIELD_MAP.TEXT.columnName] = 'B';

        component.populateActiveItem(activeItem, responseItem, [], DashboardServiceMock.FIELD_MAP.NAME.columnName);

        expect(activeItem).toEqual({
            data: {
                testNameField: 'A'
            },
            rows: [{
                name: 'Test Name Field',
                text: 'A'
            }]
        });

        component.populateActiveItem(activeItem, responseItem, [], DashboardServiceMock.FIELD_MAP.TEXT.columnName, 'My Test Field');

        expect(activeItem).toEqual({
            data: {
                testNameField: 'A',
                testTextField: 'B'
            },
            rows: [{
                name: 'Test Name Field',
                text: 'A'
            }, {
                name: 'My Test Field',
                text: 'B'
            }]
        });
    });

    it('showSelectButton does return expected boolean', () => {
        expect(component.showSelectButton()).toEqual(false);
        component.options.showSelect = true;
        expect(component.showSelectButton()).toEqual(false);
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        expect(component.showSelectButton()).toEqual(true);
    });

    it('showSourceButton does return expected boolean', () => {
        expect(component.showSourceButton()).toEqual(true);
        component.options.showText = true;
        expect(component.showSourceButton()).toEqual(false);
        component.options.showText = false;
        component.options.hideSource = true;
        expect(component.showSourceButton()).toEqual(false);
    });
});

describe('Component: Document Viewer with Config', () => {
    let component: DocumentViewerComponent;
    let fixture: ComponentFixture<DocumentViewerComponent>;

    initializeTestBed('Document Viewer', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            DocumentViewerModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DocumentViewerComponent);
        component = fixture.componentInstance;
        component.configOptions = {
            title: 'Document Viewer Title',
            tableKey: 'table_key_1',
            dataField: 'testTextField',
            dateField: 'testDateField',
            idField: 'testIdField',
            metadataFields: [
                [{
                    name: 'Single Item Metadata Row',
                    field: 'singleItemMetadataRow'
                }],
                [{
                    name: 'First of Multiple Item Metadata Row',
                    field: 'firstOfMultipleItemMetadataRow'
                },
                {
                    name: 'Second of Multiple Item Metadata Row',
                    field: 'secondOfMultipleItemMetadataRow'
                }]
            ],
            popoutFields: [],
            limit: 25
        };
        fixture.detectChanges();
    });

    it('has expected options properties after config is loaded', () => {
        expect(component.options.dataField).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(component.options.dateField).toEqual(DashboardServiceMock.FIELD_MAP.DATE);
        expect(component.options.idField).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(component.options.metadataFields).toEqual([
            [{
                name: 'Single Item Metadata Row',
                field: 'singleItemMetadataRow'
            }],
            [{
                name: 'First of Multiple Item Metadata Row',
                field: 'firstOfMultipleItemMetadataRow'
            },
            {
                name: 'Second of Multiple Item Metadata Row',
                field: 'secondOfMultipleItemMetadataRow'
            }]
        ]);
        expect(component.options.popoutFields).toEqual([]);
        expect(component.options.showSelect).toBe(false);
        expect(component.options.showText).toBe(false);
    });
});
