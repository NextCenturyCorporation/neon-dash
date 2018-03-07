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
import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';
import * as neon from 'neon-framework';

import { DocumentViewerComponent } from './document-viewer.component';
import { ExportControlComponent } from '../export-control/export-control.component';

import { neonVariables } from '../../neon-namespaces';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { TranslationService } from '../../services/translation.service';
import { VisualizationService } from '../../services/visualization.service';

class TestDatasetService extends DatasetService {
    constructor() {
        super(new NeonGTDConfig());
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [
            new TableMetaData('testTable', 'Test Table', [
                new FieldMetaData('testDataField', 'Test Data Field'),
                new FieldMetaData('testDateField', 'Test Date Field'),
                new FieldMetaData('testIDField', 'Test ID Field')
            ])
        ];
        testDatabase.tables[0].mappings = {
            newsfeed_text: 'testDataField'
        };
        this.setActiveDataset({
            databases: [testDatabase]
        });
    }
}

/*
 * First, a note about sending queries to neon:
 *
 * Sending queries to neon is done asynchronously, via XHR and more specifically via jQuery.ajax.
 * because we use jQuery.ajax instead of Angular's http functionality, Angular's hhtp mocking doesn't
 * work to mock the calls we make. As such, where we need to test methods that involve sending out queries
 * I've replaced the executeQuery method of our component object with a dummy that simply calls onQuerySuccess
 * with the data we should get back.
 */
describe('Component: DocumentViewer', () => {
    let component: DocumentViewerComponent;
    let fixture: ComponentFixture<DocumentViewerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DocumentViewerComponent,
                ExportControlComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                ErrorNotificationService,
                ExportService,
                FilterService,
                ThemesService,
                TranslationService,
                VisualizationService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() }
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule,
                HttpModule
            ]
        });
        fixture = TestBed.createComponent(DocumentViewerComponent);
        component = fixture.componentInstance;
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('has expected active properties', () => {
        expect(component.active).toEqual({
            data: [],
            dataField: new FieldMetaData(),
            dateField: new FieldMetaData(),
            docCount: 0,
            idField: new FieldMetaData(),
            limit: 50,
            page: 1,
            metadataFields: []
        });
    });

    it('has a subNgOnInit method that does nothing', () => {
        expect(component.subNgOnInit).toBeDefined();
    });

    it('has a postInit method that does nothing', () => {
        expect(component.postInit).toBeDefined();
    });

    it('has a subNgOnDestroy method that does nothing', () => {
        expect(component.subNgOnDestroy).toBeDefined();
    });

    it('has a subGetBindings method that does nothing', () => {
        expect(component.subGetBindings).toBeDefined(); // TODO: fix this once subGetBindings is no longer a stub.
    });

    it('returns the correct list from getExportFields', () => {
        component.active.dataField.columnName = 'testDataField';
        component.active.dataField.prettyName = 'Test Data Field';
        component.active.dateField.columnName = 'testDateField';
        component.active.dateField.prettyName = 'Test Date Field';
        component.active.idField.columnName = 'testIDField';
        component.active.idField.prettyName = 'Test ID Field';

        expect(component.getExportFields()).toEqual([
            {
                columnName: 'testDataField',
                prettyName: 'Test Data Field'
            },
            {
                columnName: 'testDateField',
                prettyName: 'Test Date Field'
            },
            {
                columnName: 'testIDField',
                prettyName: 'Test ID Field'
            }
        ]);
    });

    it('returns null options from getOptionFromConfig because config is empty', () => {
        expect(component.getOptionFromConfig('title')).toBeNull();
        expect(component.getOptionFromConfig('database')).toBeNull();
        expect(component.getOptionFromConfig('table')).toBeNull();
        expect(component.getOptionFromConfig('dataField')).toBeNull();
        expect(component.getOptionFromConfig('dateField')).toBeNull();
        expect(component.getOptionFromConfig('idField')).toBeNull();
        expect(component.getOptionFromConfig('metadataFields')).toBeNull();
        expect(component.getOptionFromConfig('popoutFields')).toBeNull();
        expect(component.getOptionFromConfig('limit')).toBeNull();
    });

    it('sets expected fields in onUpdateFields to empty strings because fields are empty', () => {
        component.onUpdateFields();
        expect(component.active.dataField).toEqual(new FieldMetaData());
        expect(component.active.dataField).toEqual(new FieldMetaData());
        expect(component.active.dataField).toEqual(new FieldMetaData());
    });

    it('returns an empty string from getFilterText', () => {
        expect(component.getFilterText({})).toBe('');
        expect(component.getFilterText({
            value: 'test value'
        })).toBe('');
    });

    it('returns an empty array from getNeonFilterFields', () => {
        expect(component.getNeonFilterFields()).toEqual([]);
    });

    it('returns the expected string from getVisualizationName', () => {
        expect(component.getVisualizationName()).toBe('Document Viewer');
    });

    it('returns null from getFiltersToIgnore', () => {
        expect(component.getFiltersToIgnore()).toBeNull();
    });

    it('returns the expectedvalue from isValidQuery', () => {
        expect(component.isValidQuery()).toBe(false);
        component.meta.database = new DatabaseMetaData('testDatabase');
        expect(component.isValidQuery()).toBe(false);
        component.meta.table = new TableMetaData('testTable');
        expect(component.isValidQuery()).toBe(false);
        component.active.dataField.columnName = 'testDataField';
        expect(component.isValidQuery()).toBe(true);
    });

    it('returns expected query from createQuery', () => {
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        component.active.dataField.columnName = 'testDataField';
        // Start with no date field to make sure we don't sort without it.
        component.active.idField.columnName = 'testIDField';
        let query = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .where(new neon.query.WhereClause('testDataField', '!=', null))
            .withFields([
                'testDataField',
                'testIDField'
            ])
            .limit(50)
            .offset(0);
        expect(component.createQuery()).toEqual(query);

        // Then add a date field and ensure the result is properly sorting.
        component.active.dateField.columnName = 'testDateField';
        query = query.sortBy('testDateField', neonVariables.DESCENDING)
            .withFields([
                'testDataField',
                'testDateField',
                'testIDField'
            ]);
        expect(component.createQuery()).toEqual(query);
    });

    it('sets expected properties and calls getDocCount if onQuerySuccess returns no data', () => {

        component.active.dataField.columnName = 'testDataField';
        component.active.dateField.columnName = 'testDateField';
        component.active.idField.columnName = 'testIDField';
        component.active.docCount = 50;
        let response = {
            data: []
        };
        let docCountResponse = {
            data: [{
                _docCount: 0
            }]
        };

        /*
        Here lies spyOn, along with all my hopes and dreams for doing this in a non-hacky manner.
        (spyOn should have worked for this but didn't. To investigate?)

        spyOn(component, 'getDocCount');
        spyOn(component, 'executeQuery').and.callFake((query: neon.query.Query) => {
            // Check that we got here by calling getDocCount.
            expect(component.getDocCount).toHaveBeenCalled();
            component.onQuerySuccess(docCountResponse);
        });*/

        let calledExecuteQuery = false;
        // The XHR is done via jQuery which makes it astoundingly difficult to test, so we're going to bypass it.
        // If we get to executeQuery after calling onQuerySuccess, that means we went through getDocCount.
        component.executeQuery = () => {
            calledExecuteQuery = true;
            component.onQuerySuccess(docCountResponse);
        };

        component.onQuerySuccess(response);

        expect(calledExecuteQuery).toBeTruthy();
        expect(component.active.docCount).toBe(0);
        expect(component.active.data).toEqual([]);
    });

    it('sets expected properties and calls getDocCount if onQuerySuccess returns data', () => {

        component.active.dataField.columnName = 'testDataField';
        component.active.dateField.columnName = 'testDateField';
        component.active.idField.columnName = 'testIDField';
        component.active.docCount = 50;
        let response = {
            data: [
                {
                    testDataField: 'data1',
                    testDateField: 'date1',
                    testIDField: '12345'
                },
                {
                    testDataField: 'data2',
                    testDateField: 'date2',
                    testIDField: '67890'
                }
            ]
        };
        let docCountResponse = {
            data: [{
                _docCount: 2
            }]
        };

        let calledExecuteQuery = false;
        // The XHR is done via jQuery which makes it astoundingly difficult to test, so we're going to bypass it.
        // If we get to executeQuery after calling onQuerySuccess, that means we went through getDocCount.
        component.executeQuery = () => {
            calledExecuteQuery = true;
            component.onQuerySuccess(docCountResponse);
        };

        component.onQuerySuccess(response);

        expect(calledExecuteQuery).toBeTruthy();
        expect(component.active.docCount).toBe(2);
        expect(component.active.data).toEqual([
            {
                testDataField: 'data1',
                testDateField: 'date1',
                testIDField: '12345'
            },
            {
                testDataField: 'data2',
                testDateField: 'date2',
                testIDField: '67890'
            }
        ]);
    });

    it('sets the expected value when getDocCount is called', () => {
        component.active.docCount = 50;
        let docCountResponse = {
            data: [{
                _docCount: 9999
            }]
        };

        let calledExecuteQuery = false;
        // The XHR is done via jQuery which makes it astoundingly difficult to test, so we're going to bypass it.
        component.executeQuery = () => {
            calledExecuteQuery = true;
            component.onQuerySuccess(docCountResponse);
        };

        component.getDocCount();

        expect(calledExecuteQuery).toBeTruthy();
        expect(component.active.docCount).toBe(9999);
    });

    it('doesn\'t do anything in refreshVisualization', () => {
        let active = {
            data: [],
            dataField: component.active.dataField,
            dateField: component.active.dateField,
            docCount: 0,
            idField: component.active.idField,
            limit: 50,
            page: 1,
            metadataFields: []
        };

        expect(component.refreshVisualization()).toBe(undefined);
        expect(component.active).toEqual(active);
    });

    it('returns the expected value from getButtonText', () => {
        // When active.data.length == 0
        component.active.data = [];
        expect(component.getButtonText()).toBe('No Data');

        // When active.data.langth < active.data.docCount
        component.active.data = ['value1', 'value2'];
        component.active.docCount = 50;
        expect(component.getButtonText()).toBe('1 - 50 of 50');

        // When active.data.length >= active.data.docCount
        component.active.data = ['value1', 'value2'];
        component.active.docCount = 2;
        expect(component.getButtonText()).toBe('Total 2');
    });

    it('has setupFilters method that does nothing of substance', () => {
        expect(component.setupFilters).toBeDefined();
    });

    it('properly formats string metadata entries', () => {
        let record = {
            'value': 'non-nested value',
            'nest1.nest2.nestedValue': 'nested value'
        };
        expect(component.formatMetadataEntry(record, {field: 'value'})).toEqual('non-nested value');
        expect(component.formatMetadataEntry(record, {field: 'nest1.nest2.nestedValue'})).toEqual('nested value');
    });

    it('properly formats array metadata entries in formatMetadataEntry', () => {
        let record = {
            empty: [],
            single_string: ['value'],
            single_number: [1],
            multiple_string: ['value1', 'value2'],
            multiple_number: [2, 3],
            string_no_natches: ['not a match', 'not a match', 'not a match'],
            string_some_matches: ['not a match', 'match', 'not a match', 'match'],
            string_all_matches: ['match', 'match', 'match'],
            object_no_matches: [{
                value1: 'not a match',
                value2: 'return when matching (1)'
            }, {
                value1: 'not a match',
                value2: 'return when matching (2)'
            }],
            object_some_matches: [{
                value1: 'match',
                value2: 'return when matching (1)'
            }, {
                value1: 'not a match',
                value2: 'return when matching (2)'
            }],
            object_all_matches: [{
                value1: 'match',
                value2: 'return when matching (1)'
            }, {
                value1: 'match',
                value2: 'return when matching (2)'
            }]
        };
        let emptyMDO = {
            field: 'empty'
        };
        let singleStringMDO = {
            field: 'single_string'
        };
        let singleNumberMDO = {
            field: 'single_number'
        };
        let multipleStringMDO = {
            field: 'multiple_string'
        };
        let multipleNumberMDO = {
            field: 'multiple_number'
        };
        let stringNoMatchesMDO = {
            field: 'string_no_matches',
            arrayFilter: {
                filterType: '=',
                filterFor: ['match']
            }
        };
        let stringSomeMatchesMDO = {
            field: 'string_some_matches',
            arrayFilter: {
                filterType: '=',
                filterFor: ['match']
            }
        };
        let stringAllMatchesMDO = {
            field: 'string_all_matches',
            arrayFilter: {
                filterType: '=',
                filterFor: ['match']
            }
        };
        let objectNoMatchesMDO = {
            field: 'object_no_matches',
            arrayFilter: {
                filterType: '=',
                filterFor: ['match'],
                filterOn: 'value1',
                show: 'value2'
            }
        };
        let objectSomeMatchesMDO = {
            field: 'object_some_matches',
            arrayFilter: {
                filterType: '=',
                filterFor: ['match'],
                filterOn: 'value1',
                show: 'value2'
            }
        };
        let objectAllMatchesMDO = {
            field: 'object_all_matches',
            arrayFilter: {
                filterType: '=',
                filterFor: ['match'],
                filterOn: 'value1',
                show: 'value2'
            }
        };

        expect(component.formatMetadataEntry(record, emptyMDO)).toEqual('None');
        expect(component.formatMetadataEntry(record, singleStringMDO)).toEqual('value');
        expect(component.formatMetadataEntry(record, singleNumberMDO)).toEqual('1');
        expect(component.formatMetadataEntry(record, multipleStringMDO)).toEqual('value1, value2');
        expect(component.formatMetadataEntry(record, multipleNumberMDO)).toEqual('2, 3');
        expect(component.formatMetadataEntry(record, stringNoMatchesMDO)).toEqual('None');
        expect(component.formatMetadataEntry(record, stringSomeMatchesMDO)).toEqual('match, match');
        expect(component.formatMetadataEntry(record, stringAllMatchesMDO)).toEqual('match, match, match');
        expect(component.formatMetadataEntry(record, objectNoMatchesMDO)).toEqual('None');
        expect(component.formatMetadataEntry(record, objectSomeMatchesMDO)).toEqual('return when matching (1)');
        expect(component.formatMetadataEntry(record, objectAllMatchesMDO)).toEqual('return when matching (1), return when matching (2)');
    });

    it('returns None for non-string, non-array metadata entries', () => {
        let record = {
            object: {},
            integer: 123,
            double: 1.23
        };
        expect(component.formatMetadataEntry(record, 'object')).toEqual('None');
        expect(component.formatMetadataEntry(record, 'integer')).toEqual('None');
        expect(component.formatMetadataEntry(record, 'double')).toEqual('None');
        expect(component.formatMetadataEntry(record, 'nonexistent')).toEqual('None');
    });

    it('creates elements for data', () => {
        component.active.dataField.columnName = 'testDataField';
        component.active.dateField.columnName = 'testDateField';
        component.active.idField.columnName = 'testIDField';
        component.active.data = [
            {
                testDataField: 'This is a string.',
                testDateField: '12:34:56 7/8/90',
                testIDField: '_12345',
                metadataValue: 'First'
            },
            {
                testDataField: 'This is another string.',
                testDateField: '09:87:65 4/3/21',
                testIDField: '_67890',
                metadataValue: 'Second'
            }
        ];
        component.active.metadataFields = [{
            name: 'Test',
            field: 'metadataValue'
        }];
        fixture.detectChanges();

        // Make sure we have a list of two items.
        let selects = fixture.debugElement.queryAll(By.css('.document-viewer-button-cell'));
        expect(selects.length).toBe(2);
        // Make sure each item has a single row of metadata.
        selects = fixture.debugElement.queryAll(By.css('.metadata-row'));
        expect(selects.length).toBe(2);
        // Make sure each metadata row has a single item in it, and that those items have the right name.
        expect(selects[0].children[0].nativeElement.textContent).toEqual('Test: ');
        expect(selects[0].children[1].nativeElement.textContent).toEqual('First');
        expect(selects[1].children[0].nativeElement.textContent).toEqual('Test: ');
        expect(selects[1].children[1].nativeElement.textContent).toEqual('Second');

        selects = fixture.debugElement.queryAll(By.css('.metadata-bold'));
        expect(selects.length).toBe(2);
    });

    it('createClause does return expected object', () => {
        component.active.dataField = new FieldMetaData('testDataField');
        expect(component.createClause()).toEqual(neon.query.where('testDataField', '!=', null));

        component.meta.unsharedFilterField = new FieldMetaData('testFilterField');
        component.meta.unsharedFilterValue = 'testFilterValue';
        expect(component.createClause()).toEqual(neon.query.and(neon.query.where('testDataField', '!=', null),
            neon.query.where('testFilterField', '=', 'testFilterValue')));
    });
});

describe('Component: Document Viewer with Config', () => {
    let component: DocumentViewerComponent;
    let fixture: ComponentFixture<DocumentViewerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DocumentViewerComponent,
                ExportControlComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                {
                    provide: DatasetService,
                    useClass: TestDatasetService
                },
                ErrorNotificationService,
                ExportService,
                FilterService,
                ThemesService,
                TranslationService,
                VisualizationService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                { provide: 'title', useValue: 'Document Viewer Title' },
                { provide: 'database', useValue: 'testDatabase' },
                { provide: 'table', useValue: 'testTable' },
                { provide: 'dataField', useValue: 'testDataField' },
                { provide: 'dateField', useValue: 'testDateField' },
                { provide: 'idField', useValue: 'testIDField' },
                { provide: 'metadataFields', useValue: [
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
                ]},
                { provide: 'popoutFields', useValue: null },
                { provide: 'limit', useValue: 25 }
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule,
                HttpModule
            ]
        });
        fixture = TestBed.createComponent(DocumentViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('has expected optionsFromConfig and active properties after config is loaded', () => {
        let optionsFromConfig = {
            title: 'Document Viewer Title',
            database: 'testDatabase',
            table: 'testTable',
            dataField: 'testDataField',
            dateField: 'testDateField',
            idField: 'testIDField',
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
            popoutFields: null,
            limit: 25
        };
        let active = {
            data: [],
            dataField: new FieldMetaData('testDataField', 'Test Data Field'),
            dateField: new FieldMetaData('testDateField', 'Test Date Field'),
            docCount: 0,
            idField: new FieldMetaData('testIDField', 'Test ID Field'),
            limit: 25,
            page: 1,
            metadataFields: [
                {
                    name: 'Single Item Metadata Row',
                    field: 'singleItemMetadataRow'
                },
                {
                    name: 'First of Multiple Item Metadata Row',
                    field: 'firstOfMultipleItemMetadataRow'
                },
                {
                    name: 'Second of Multiple Item Metadata Row',
                    field: 'secondOfMultipleItemMetadataRow'
                }
            ]
        };

        expect(component.getOptionFromConfig('title')).toEqual(optionsFromConfig.title);
        expect(component.getOptionFromConfig('database')).toEqual(optionsFromConfig.database);
        expect(component.getOptionFromConfig('table')).toEqual(optionsFromConfig.table);
        expect(component.getOptionFromConfig('dataField')).toEqual(optionsFromConfig.dataField);
        expect(component.getOptionFromConfig('dateField')).toEqual(optionsFromConfig.dateField);
        expect(component.getOptionFromConfig('idField')).toEqual(optionsFromConfig.idField);
        expect(component.getOptionFromConfig('metadataFields')).toEqual(optionsFromConfig.metadataFields);
        expect(component.getOptionFromConfig('popoutFields')).toEqual(optionsFromConfig.popoutFields);
        expect(component.getOptionFromConfig('limit')).toEqual(optionsFromConfig.limit);
        expect(component.active).toEqual(active);
    });

    it('sets expected fields in onUpdateFields to fields from the config', () => {
        let testDataField = new FieldMetaData('testDataField', 'Test Data Field');
        let testDateField = new FieldMetaData('testDateField', 'Test Date Field');
        let testIDField = new FieldMetaData('testIDField', 'Test ID Field');
        let testTable = new TableMetaData('testTable', 'Test Table', [testDataField, testDateField, testIDField]);
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [testTable];
        component.meta.database = testDatabase;
        component.meta.table = testTable;
        component.onUpdateFields();
        expect(component.active.dataField).toEqual(new FieldMetaData('testDataField', 'Test Data Field'));
        expect(component.active.dateField).toEqual(new FieldMetaData('testDateField', 'Test Date Field'));
        expect(component.active.idField).toEqual(new FieldMetaData('testIDField', 'Test ID Field'));
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });
});
