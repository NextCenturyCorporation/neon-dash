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
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Injector,
    OnInit,
    ViewEncapsulation
} from '@angular/core';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { NeonGTDConfig } from '../../neon-gtd-config';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetMultipleSelectOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import { basename } from 'path';
import * as neon from 'neon-framework';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import * as _ from 'lodash';

@Component({
    selector: 'app-test-base-neon',
    templateUrl: './base-neon.component.html',
    styleUrls: ['./base-neon.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestBaseNeonComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    public filters: any[] = [];
    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        changeDetection: ChangeDetectorRef
    ) {
        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            changeDetection
        );
    }

    postInit() {
        //Method for anything that needs to be done once the visualization has been initialized
    }

    subNgOnInit() {
        //Method to do any visualization-specific initialization.
    }

    subNgOnDestroy() {
        //Get an option from the visualization's config
    }

    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [];
    }

    createNonFieldOptions(): WidgetOption[] {
        return [];
    }

    createQuery() {
        let query = new neon.query.Query();
        return query;
    }

    getCloseableFilters() {
        return [];
    }

    getElementRefs() {
        return {};
    }

    getFiltersToIgnore() {
        let ignoredFilterIds = [];
        return ignoredFilterIds;
    }

    getFilterText(filter) {
        if (filter && filter.filterName) {
            return filter.filterName;
          } else {
            return 'Test Filter';
        }
    }

    getVisualizationDefaultLimit(): number {
        return 1234;
    }

    getVisualizationDefaultTitle(): string {
        return 'Mock Superclass';
    }

    isValidQuery() {
        return true;
    }

    onQuerySuccess() {
        return new neon.query.Query();
    }

    refreshVisualization() {
        //
    }

    removeFilter() {
        //
    }

    setupFilters() {
        let database = 'test database';
        let table = 'test table';
        let fields = ['test field'];
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                let f = {
                    id: filter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                };
            }
        } else {
            this.filters = [];
        }
        //
    }
}

@Component({
    selector: 'app-test-advanced-neon',
    templateUrl: './base-neon.component.html',
    styleUrls: ['./base-neon.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestAdvancedNeonComponent extends TestBaseNeonComponent {
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('testRequiredField', 'Test Required Field', true),
            new WidgetFieldOption('testOptionalField', 'Test Optional Field', false),
            new WidgetFieldArrayOption('testMultipleFields', 'Test Multiple Fields', false)
        ];
    }

    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetFreeTextOption('testFreeText', 'Test Free Text', ''),
            new WidgetMultipleSelectOption('testMultipleSelect', 'Test Multiple Select', [], [{
                prettyName: 'A',
                variable: 'a'
            }, {
                prettyName: 'B',
                variable: 'b'
            }, {
                prettyName: 'C',
                variable: 'c'
            }]),
            new WidgetNonPrimitiveOption('testArray', 'Test Array', []),
            new WidgetNonPrimitiveOption('testObject', 'Test Object', {}),
            new WidgetSelectOption('testSelect', 'Test Select', 'y', [{
                prettyName: 'X',
                variable: 'x'
            }, {
                prettyName: 'Y',
                variable: 'y'
            }, {
                prettyName: 'Z',
                variable: 'z'
            }]),
            new WidgetSelectOption('testToggle', 'Test Toggle', false, OptionChoices.NoFalseYesTrue)
        ];
    }
}

describe('BaseNeonComponent Options', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    initializeTestBed({
        declarations: [
            TestBaseNeonComponent
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: testConfig },
            { provide: 'testDate', useValue: 'testDateField' },
            { provide: 'testFake', useValue: 'testFakeField' },
            { provide: 'testList', useValue: ['testDateField', 'testFakeField', 'testNameField', 'testSizeField'] },
            { provide: 'testName', useValue: 'testNameField' },
            { provide: 'testSize', useValue: 'testSizeField' }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestBaseNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected properties', () => {
        expect(component.options.customEventsToPublish).toEqual([]);
        expect(component.options.customEventsToReceive).toEqual([]);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.filter).toEqual(null);
        expect(component.options.hideUnfiltered).toEqual(false);
        expect(component.options.limit).toEqual(1234);
        expect(component.newLimit).toEqual(1234);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.title).toEqual('Mock Superclass');
        expect(component.options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(component.options.unsharedFilterValue).toEqual('');
    });

    it('findField does return expected object or undefined', () => {
        expect(component.findField(component.options.fields, 'testDateField')).toEqual(DatasetServiceMock.DATE_FIELD);
        expect(component.findField(component.options.fields, 'testNameField')).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.findField(component.options.fields, 'testSizeField')).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(component.findField(component.options.fields, 'testFakeField')).toEqual(undefined);
    });

    it('findField does work as expected if given an array index', () => {
        let dateIndex = _.findIndex(DatasetServiceMock.FIELDS, (fieldObject) => {
            return fieldObject.columnName === 'testDateField';
        });
        let nameIndex = _.findIndex(DatasetServiceMock.FIELDS, (fieldObject) => {
            return fieldObject.columnName === 'testNameField';
        });
        let sizeIndex = _.findIndex(DatasetServiceMock.FIELDS, (fieldObject) => {
            return fieldObject.columnName === 'testSizeField';
        });
        expect(component.findField(component.options.fields, '' + dateIndex)).toEqual(DatasetServiceMock.DATE_FIELD);
        expect(component.findField(component.options.fields, '' + nameIndex)).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.findField(component.options.fields, '' + sizeIndex)).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(component.findField(component.options.fields, '' + DatasetServiceMock.FIELDS.length)).toEqual(undefined);
        expect(component.findField(component.options.fields, '-1')).toEqual(undefined);
    });

    it('findFieldObject does return expected object', () => {
        expect(component.findFieldObject(component.options.fields, 'testDate')).toEqual(DatasetServiceMock.DATE_FIELD);
        expect(component.findFieldObject(component.options.fields, 'testName')).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.findFieldObject(component.options.fields, 'testSize')).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(component.findFieldObject(component.options.fields, 'testFake')).toEqual(new FieldMetaData());
        expect(component.findFieldObject(component.options.fields, 'fakeBind')).toEqual(new FieldMetaData());
    });

    it('findFieldObjects does return expected array', () => {
        expect(component.findFieldObjects(component.options.fields, 'testList')).toEqual([
            DatasetServiceMock.DATE_FIELD,
            DatasetServiceMock.NAME_FIELD,
            DatasetServiceMock.SIZE_FIELD
        ]);
        expect(component.findFieldObjects(component.options.fields, 'testName')).toEqual([]);
        expect(component.findFieldObjects(component.options.fields, 'fakeBind')).toEqual([]);
    });

    it('getBindings does return expected object', () => {
        expect(component.getBindings()).toEqual({
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            filter: null,
            hideUnfiltered: false,
            layers: undefined,
            limit: 1234,
            table: 'testTable1',
            title: 'Mock Superclass',
            unsharedFilterValue: '',
            unsharedFilterField: ''
        });
    });

    it('getExportFields does return expected array', () => {
        expect(component.getExportFields()).toEqual([]);
    });

    it('getVisualizationDefaultLimit does return expected number', () => {
        expect(component.getVisualizationDefaultLimit()).toEqual(1234);
    });

    it('getVisualizationDefaultTitle does return expected string', () => {
        expect(component.getVisualizationDefaultTitle()).toEqual('Mock Superclass');
    });

    it('hasUnsharedFilter does return expected boolean', () => {
        expect(component.hasUnsharedFilter()).toEqual(false);
    });

    it('initializeFieldsInOptions does not update unshared filter field because it is not set', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.initializeFieldsInOptions(component.options);
        expect(component.options.unsharedFilterField).toEqual(new FieldMetaData());
    });

    it('updateDatabasesInOptions does update databases, tables, and fields', () => {
        component.updateDatabasesInOptions(component.options);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('updateFieldsInOptions does update fields', () => {
        component.options.databases = DatasetServiceMock.DATABASES;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.tables = DatasetServiceMock.TABLES;
        component.options.table = DatasetServiceMock.TABLES[0];
        component.updateFieldsInOptions(component.options);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('updateTablesInOptions does update tables and fields', () => {
        component.options.databases = DatasetServiceMock.DATABASES;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.updateTablesInOptions(component.options);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
    });
});

describe('Advanced BaseNeonComponent Options', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    initializeTestBed({
        declarations: [
            TestAdvancedNeonComponent
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: testConfig }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestAdvancedNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected properties', () => {
        expect(component.options.customEventsToPublish).toEqual([]);
        expect(component.options.customEventsToReceive).toEqual([]);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.filter).toEqual(null);
        expect(component.options.hideUnfiltered).toEqual(false);
        expect(component.options.limit).toEqual(1234);
        expect(component.newLimit).toEqual(1234);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.testArray).toEqual([]);
        expect(component.options.testFreeText).toEqual('');
        expect(component.options.testMultipleFields).toEqual([]);
        expect(component.options.testMultipleSelect).toEqual([]);
        expect(component.options.testObject).toEqual({});
        expect(component.options.testOptionalField).toEqual(new FieldMetaData());
        expect(component.options.testRequiredField).toEqual(new FieldMetaData());
        expect(component.options.testSelect).toEqual('y');
        expect(component.options.testToggle).toEqual(false);
        expect(component.options.title).toEqual('Mock Superclass');
        expect(component.options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(component.options.unsharedFilterValue).toEqual('');
    });

    it('getBindings does return expected object', () => {
        expect(component.getBindings()).toEqual({
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            filter: null,
            hideUnfiltered: false,
            layers: undefined,
            limit: 1234,
            table: 'testTable1',
            testArray: [],
            testFreeText: '',
            testMultipleFields: [],
            testMultipleSelect: [],
            testObject: {},
            testOptionalField: '',
            testRequiredField: '',
            testSelect: 'y',
            testToggle: false,
            title: 'Mock Superclass',
            unsharedFilterValue: '',
            unsharedFilterField: ''
        });
    });

    it('getExportFields does return expected array', () => {
        expect(component.getExportFields()).toEqual([]);
    });

    it('hasUnsharedFilter does return expected boolean', () => {
        expect(component.hasUnsharedFilter()).toEqual(false);
    });
});

describe('Advanced BaseNeonComponent Options with Config', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    initializeTestBed({
        declarations: [
            TestAdvancedNeonComponent
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: testConfig },
            { provide: 'database', useValue: 1 },
            { provide: 'table', useValue: 1 },
            { provide: 'configFilter', useValue: { lhs: 'testConfigField', operator: '!=', rhs: 'testConfigValue' } },
            { provide: 'customEventsToPublish', useValue: [ { id: 'testPublishId', fields: [ { columnName: 'testPublishColumnName',
                prettyName: 'testPublishPrettyName' } ] } ] },
            { provide: 'customEventsToReceive', useValue: [ { id: 'testReceiveId', fields: [ { columnName: 'testReceiveColumnName',
                type: 'testReceiveType' } ] } ] },
            { provide: 'hideUnfiltered', useValue: true },
            { provide: 'limit', useValue: 1234 },
            { provide: 'testArray', useValue: [4, 3, 2, 1] },
            { provide: 'testFreeText', useValue: 'the quick brown fox jumps over the lazy dog' },
            { provide: 'testMultipleFields', useValue: ['testXField', 'testYField'] },
            { provide: 'testMultipleSelect', useValue: ['b', 'c'] },
            { provide: 'testObject', useValue: { key: 'value' } },
            { provide: 'testOptionalField', useValue: 'testNameField' },
            { provide: 'testRequiredField', useValue: 'testSizeField' },
            { provide: 'testSelect', useValue: 'z' },
            { provide: 'testToggle', useValue: true },
            { provide: 'title', useValue: 'VisualizationTitle' },
            { provide: 'unsharedFilterField', useValue: 'testFilterField' },
            { provide: 'unsharedFilterValue', useValue: 'testFilterValue' }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestAdvancedNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected properties', () => {
        expect(component.options.customEventsToPublish).toEqual([{
            id: 'testPublishId',
            fields: [{
                columnName: 'testPublishColumnName',
                prettyName: 'testPublishPrettyName'
            }]
        }]);
        expect(component.options.customEventsToReceive).toEqual([{
            id: 'testReceiveId',
            fields: [{
                columnName: 'testReceiveColumnName',
                type: 'testReceiveType'
            }]
        }]);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.filter).toEqual({
            lhs: 'testConfigField',
            operator: '!=',
            rhs: 'testConfigValue'
        });
        expect(component.options.hideUnfiltered).toEqual(true);
        expect(component.options.limit).toEqual(1234);
        expect(component.newLimit).toEqual(1234);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.testArray).toEqual([4, 3, 2, 1]);
        expect(component.options.testFreeText).toEqual('the quick brown fox jumps over the lazy dog');
        expect(component.options.testMultipleFields).toEqual([DatasetServiceMock.X_FIELD, DatasetServiceMock.Y_FIELD]);
        expect(component.options.testMultipleSelect).toEqual(['b', 'c']);
        expect(component.options.testObject).toEqual({
            key: 'value'
        });
        expect(component.options.testOptionalField).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.options.testRequiredField).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(component.options.testSelect).toEqual('z');
        expect(component.options.testToggle).toEqual(true);
        expect(component.options.title).toEqual('VisualizationTitle');
        expect(component.options.unsharedFilterField).toEqual(DatasetServiceMock.FILTER_FIELD);
        expect(component.options.unsharedFilterValue).toEqual('testFilterValue');
    });

    it('getBindings does return expected object', () => {
        expect(component.getBindings()).toEqual({
            customEventsToPublish: [{
                id: 'testPublishId',
                fields: [{
                    columnName: 'testPublishColumnName',
                    prettyName: 'testPublishPrettyName'
                }]
            }],
            customEventsToReceive: [{
                id: 'testReceiveId',
                fields: [{
                    columnName: 'testReceiveColumnName',
                    type: 'testReceiveType'
                }]
            }],
            database: 'testDatabase2',
            filter: {
                lhs: 'testConfigField',
                operator: '!=',
                rhs: 'testConfigValue'
            },
            hideUnfiltered: true,
            layers: undefined,
            limit: 1234,
            table: 'testTable2',
            testArray: [4, 3, 2, 1],
            testFreeText: 'the quick brown fox jumps over the lazy dog',
            testMultipleFields: ['testXField', 'testYField'],
            testMultipleSelect: ['b', 'c'],
            testObject: {
                key: 'value'
            },
            testOptionalField: 'testNameField',
            testRequiredField: 'testSizeField',
            testSelect: 'z',
            testToggle: true,
            title: 'VisualizationTitle',
            unsharedFilterValue: 'testFilterValue',
            unsharedFilterField: 'testFilterField'
        });
    });

    it('getExportFields does return expected array', () => {
        expect(component.getExportFields()).toEqual([{
            columnName: 'testSizeField',
            prettyName: 'Test Size Field'
        }, {
            columnName: 'testNameField',
            prettyName: 'Test Name Field'
        }, {
            columnName: 'testXField',
            prettyName: 'Test X Field'
        }, {
            columnName: 'testYField',
            prettyName: 'Test Y Field'
        }, {
            columnName: 'testFilterField',
            prettyName: 'Test Filter Field'
        }]);
    });

    it('hasUnsharedFilter does return expected boolean', () => {
        expect(component.hasUnsharedFilter()).toEqual(true);
    });

    it('initializeFieldsInOptions does update unshared filter field', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.initializeFieldsInOptions(component.options);
        expect(component.options.unsharedFilterField).toEqual(DatasetServiceMock.FILTER_FIELD);
    });

    it('updateDatabasesInOptions does update database if given an array index', () => {
        component.updateDatabasesInOptions(component.options);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('updateFieldsInOptions does update fields', () => {
        component.options.databases = DatasetServiceMock.DATABASES;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.tables = DatasetServiceMock.TABLES;
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.unsharedFilterField = null;
        component.options.unsharedFilterValue = null;
        component.updateFieldsInOptions(component.options);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('updateTablesInOptions does update tables if given an array index', () => {
        component.options.databases = DatasetServiceMock.DATABASES;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.updateTablesInOptions(component.options);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
    });
});

describe('BaseNeon', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    initializeTestBed({
        declarations: [
            TestBaseNeonComponent
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: testConfig }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestBaseNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected properties', () => {
        expect(component.id).toBeDefined();
        expect(component.messenger).toBeDefined();

        expect(component.initializing).toBe(false);
        expect(component.isLoading).toBe(0);
        expect(component.isExportable).toBe(true);
        expect(component.errorMessage).toBe('');

        expect(component.options).toBeDefined();
        expect(component.newLimit).toBeDefined();
    });

    it('Tests ngOnDestroy function', (() => {
        expect(component.ngOnDestroy()).toBeUndefined();
        let spy = spyOn(component, 'subNgOnDestroy');
        component.ngOnDestroy();
        expect(spy.calls.count()).toBe(1);
    }));

    it('handleChangeDatabase does update options and does call handleChangeData', () => {
        let spyLog = spyOn(component, 'handleChangeData');
        component.options.databases = DatasetServiceMock.DATABASES;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.tables = [];
        component.options.table = null;
        component.options.fields = [];
        component.handleChangeDatabase(component.options);
        expect(spyLog.calls.count()).toBe(1);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(component.options.unsharedFilterValue).toEqual('');
    });

    it('handleChangeTable does update options and does call handleChangeData', () => {
        let spyLog = spyOn(component, 'handleChangeData');
        component.options.databases = DatasetServiceMock.DATABASES;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.tables = DatasetServiceMock.TABLES;
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = [];
        component.handleChangeTable(component.options);
        expect(spyLog.calls.count()).toBe(1);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(component.options.unsharedFilterValue).toEqual('');
    });

    it('handleChangeData does call handleChangeData', () => {
        let spy = spyOn(component, 'handleChangeData');
        component.handleChangeData();
        expect(spy.calls.count()).toBe(1);
    });

    it('handleChangeLimit does update limit and does call handleChangeData', () => {
        let spy = spyOn(component, 'executeQueryChain');

        component.newLimit = 1234;

        component.handleChangeLimit(component.options);
        expect(component.options.limit).toBe(1234);
        expect(spy.calls.count()).toBe(1);

        component.newLimit = 0;

        component.handleChangeLimit(component.options);
        expect(component.options.limit).toBe(1234);
        expect(component.newLimit).toBe(1234);
        expect(spy.calls.count()).toBe(1);
    });

    it('Handle Filters Changed Event method calls the correct functions', (() => {
        let spySetupFilters = spyOn(component, 'setupFilters');
        let spyExecuteQueryChain = spyOn(component, 'executeQueryChain');
        component.handleFiltersChangedEvent();
        expect(spySetupFilters.calls.count()).toBe(1);
        expect(spyExecuteQueryChain.calls.count()).toBe(1);
    }));

    it('Tests expected return', (() => {
        expect(component.getButtonText()).toBe('');
    }));

    it('Tests onQuery default response', (() => {
        let spyOnQuerySuccess = spyOn(component, 'onQuerySuccess');
        component.baseOnQuerySuccess(component.options, {
            data: []
         });
        expect(spyOnQuerySuccess.calls.count()).toBe(1);
        expect(component.isLoading).toEqual(-1);
    }));

    it('isNumber does return expected boolean', () => {
        expect(component.isNumber(true)).toBe(false);
        expect(component.isNumber('a')).toBe(false);
        expect(component.isNumber([1, 2])).toBe(false);
        expect(component.isNumber({
            value: 1
        })).toBe(false);

        expect(component.isNumber(1)).toBe(true);
        expect(component.isNumber(12.34)).toBe(true);
        expect(component.isNumber(-12.34)).toBe(true);
        expect(component.isNumber('1')).toBe(true);
        expect(component.isNumber('12.34')).toBe(true);
        expect(component.isNumber('-12.34')).toBe(true);
    });

    it('prettifyInteger does return expected string', () => {
        expect(component.prettifyInteger(0)).toBe('0');
        expect(component.prettifyInteger(1)).toBe('1');
        expect(component.prettifyInteger(12)).toBe('12');
        expect(component.prettifyInteger(123)).toBe('123');
        expect(component.prettifyInteger(1234)).toBe('1,234');
        expect(component.prettifyInteger(1234567890)).toBe('1,234,567,890');
    });

    it('removeAllFilters does work as expected with single filter', () => {
        let removeCalls = 0;

        component.removeLocalFilterFromLocalAndNeon = (opts, filter, bool1, bool2, removeMoreFilters) => {
            removeCalls++;
            if (removeCalls === 1) {
                expect(filter).toEqual({
                    id: 'id1',
                    key: 'key1',
                    value: 'value1',
                    prettyKey: 'prettyKey1'
                });
            }
            expect(bool1).toBe(false);
            expect(bool2).toBe(false);
            expect(typeof removeMoreFilters).toBe('function');
            removeMoreFilters();
        };

        component.removeAllFilters(component.options, [{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }]);

        expect(removeCalls).toBe(1);
    });

    it('removeAllFilters does work as expected with multiple filters', () => {
        let removeCalls = 0;

        component.removeLocalFilterFromLocalAndNeon = (opts, filter, bool1, bool2, removeMoreFilters) => {
            removeCalls++;
            if (removeCalls === 1) {
                expect(filter).toEqual({
                    id: 'id1',
                    key: 'key1',
                    value: 'value1',
                    prettyKey: 'prettyKey1'
                });
            }
            if (removeCalls === 2) {
                expect(filter).toEqual({
                    id: 'id2',
                    key: 'key2',
                    value: 'value2',
                    prettyKey: 'prettyKey2'
                });
            }
            expect(bool1).toBe(false);
            expect(bool2).toBe(false);
            expect(typeof removeMoreFilters).toBe('function');
            removeMoreFilters();
        };

        component.removeAllFilters(component.options, [{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }]);

        expect(removeCalls).toBe(2);
    });

    it('removeAllFilters does work as expected with single filter', () => {
        let removeCalls = 0;
        let callbackCalls = 0;

        component.removeLocalFilterFromLocalAndNeon = (opts, filter, bool1, bool2, removeMoreFilters) => {
            removeCalls++;
            removeMoreFilters();
        };

        component.removeAllFilters(component.options, [{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }], () => {
            callbackCalls++;
        });

        expect(removeCalls).toBe(2);
        expect(callbackCalls).toBe(1);
    });

    it('removeAllFilters does not change original array', () => {
        component.removeLocalFilterFromLocalAndNeon = (opts, filter, bool1, bool2, removeMoreFilters) => {
            removeMoreFilters();
        };

        let filters = [{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }];

        component.removeAllFilters(component.options, filters);

        expect(filters).toEqual([{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }]);
    });
});
