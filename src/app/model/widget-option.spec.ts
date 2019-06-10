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
import { ReflectiveInjector } from '@angular/core';
import { inject } from '@angular/core/testing';
import * as yaml from 'js-yaml';

import { NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData } from './types';
import { DashboardService } from '../services/dashboard.service';
import {
    WidgetDatabaseOption,
    WidgetFieldOption,
    WidgetFieldArrayOption,
    WidgetSelectOption,
    WidgetOptionCollection,
    WidgetTableOption,
    WidgetNonPrimitiveOption
} from './widget-option';

import { initializeTestBed } from '../../testUtils/initializeTestBed';
import { DashboardServiceMock } from '../../testUtils/MockServices/DashboardServiceMock';

import * as _ from 'lodash';

describe('WidgetOptionCollection', () => {
    let options: WidgetOptionCollection;

    initializeTestBed('Widget Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ]
    });

    beforeEach(() => {
        options = new WidgetOptionCollection(() => [], ReflectiveInjector.resolveAndCreate([{
            provide: 'keyA',
            useValue: 'provideA'
        }, {
            provide: 'keyB',
            useValue: 'provideB'
        }, {
            provide: 'testDate',
            useValue: 'testDateField'
        }, {
            provide: 'testFake',
            useValue: 'testFakeField'
        }, {
            provide: 'testList',
            useValue: ['testDateField', 'testFakeField', 'testNameField', 'testSizeField']
        }, {
            provide: 'testName',
            useValue: 'testNameField'
        }, {
            provide: 'testSize',
            useValue: 'testSizeField'
        }, {
            provide: 'testFieldKey',
            useValue: 'field_key_1'
        }, {
            provide: 'testListWithFieldKey',
            useValue: ['field_key_1', 'testNameField']
        }]));
    });

    it('does have empty databases, fields, and tables', () => {
        expect(options.databases).toEqual([]);
        expect(options.fields).toEqual([]);
        expect(options.tables).toEqual([]);
    });

    it('access does return widget option with given key', () => {
        let widgetOption1 = new WidgetSelectOption('key1', 'label1', 'default1', []);
        let widgetOption2 = new WidgetSelectOption('key2', 'label2', 'default2', []);

        options.append(widgetOption1, 'current1');
        options.append(widgetOption2, 'current2');

        expect(widgetOption1.valueCurrent).toEqual('current1');
        expect(widgetOption2.valueCurrent).toEqual('current2');

        expect(options.access('key1')).toEqual(widgetOption1);
        expect(options.access('key2')).toEqual(widgetOption2);
    });

    it('append does add given widget option', () => {
        options.append(new WidgetSelectOption('key1', 'label1', 'default1', []), 'current1');
        expect(options.key1).toEqual('current1');
        options.key1 = '';
        expect(options.key1).toEqual('');
        options.key1 = 'new1';
        expect(options.key1).toEqual('new1');
    });

    it('append does ignore provided binding', () => {
        options.append(new WidgetSelectOption('keyA', 'labelA', 'defaultA', []), 'currentA');
        expect(options.keyA).toEqual('currentA');
        options.keyA = '';
        expect(options.keyA).toEqual('');
        options.keyA = 'newA';
        expect(options.keyA).toEqual('newA');
    });

    it('find field functions do not error if fields are not set', inject([DashboardService], (dashboardService: DashboardService) => {
        expect(options.findField('testNameField')).toEqual(undefined);
        expect(options.findFieldObject(dashboardService.state, 'testName')).toEqual(NeonFieldMetaData.get());
        expect(options.findFieldObjects(dashboardService.state, 'testList')).toEqual([]);
    }));

    it('findField does return expected object or undefined', () => {
        options.fields = DashboardServiceMock.FIELDS;

        expect(options.findField('testDateField')).toEqual(DashboardServiceMock.FIELD_MAP.DATE);
        expect(options.findField('testNameField')).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(options.findField('testSizeField')).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(options.findField('testFakeField')).toEqual(undefined);
    });

    it('findField does work as expected if given an array index', () => {
        options.fields = DashboardServiceMock.FIELDS;

        let dateIndex = _.findIndex(DashboardServiceMock.FIELDS, (fieldObject) => fieldObject.columnName === 'testDateField');
        let nameIndex = _.findIndex(DashboardServiceMock.FIELDS, (fieldObject) => fieldObject.columnName === 'testNameField');
        let sizeIndex = _.findIndex(DashboardServiceMock.FIELDS, (fieldObject) => fieldObject.columnName === 'testSizeField');

        expect(options.findField('' + dateIndex)).toEqual(DashboardServiceMock.FIELD_MAP.DATE);
        expect(options.findField('' + nameIndex)).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(options.findField('' + sizeIndex)).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(options.findField('' + DashboardServiceMock.FIELDS.length)).toEqual(undefined);
        expect(options.findField('-1')).toEqual(undefined);
        expect(options.findField('abcd')).toEqual(undefined);
    });

    it('findFieldObject does return expected object', inject([DashboardService], (dashboardService: DashboardService) => {
        options.fields = DashboardServiceMock.FIELDS;

        expect(options.findFieldObject(dashboardService.state, 'testDate')).toEqual(DashboardServiceMock.FIELD_MAP.DATE);
        expect(options.findFieldObject(dashboardService.state, 'testName')).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(options.findFieldObject(dashboardService.state, 'testSize')).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(options.findFieldObject(dashboardService.state, 'testFieldKey')).toEqual(DashboardServiceMock.FIELD_MAP.FIELD_KEY);
        expect(options.findFieldObject(dashboardService.state, 'testFake')).toEqual(NeonFieldMetaData.get());
        expect(options.findFieldObject(dashboardService.state, 'fakeBind')).toEqual(NeonFieldMetaData.get());
    }));

    it('findFieldObjects does return expected array', inject([DashboardService], (dashboardService: DashboardService) => {
        options.fields = DashboardServiceMock.FIELDS;

        expect(options.findFieldObjects(dashboardService.state, 'testList')).toEqual([
            DashboardServiceMock.FIELD_MAP.DATE,
            DashboardServiceMock.FIELD_MAP.NAME,
            DashboardServiceMock.FIELD_MAP.SIZE
        ]);
        expect(options.findFieldObjects(dashboardService.state, 'testListWithFieldKey')).toEqual([
            DashboardServiceMock.FIELD_MAP.FIELD_KEY,
            DashboardServiceMock.FIELD_MAP.NAME
        ]);
        expect(options.findFieldObjects(dashboardService.state, 'testName')).toEqual([]);
        expect(options.findFieldObjects(dashboardService.state, 'fakeBind')).toEqual([]);
    }));

    it('inject does add given widget option with provided binding', () => {
        options.inject(new WidgetSelectOption('keyA', 'labelA', 'defaultA', []));
        expect(options.keyA).toEqual('provideA');
        options.keyA = '';
        expect(options.keyA).toEqual('');
        options.keyA = 'newA';
        expect(options.keyA).toEqual('newA');
    });

    it('inject does add given widget option without provided binding', () => {
        options.inject(new WidgetSelectOption('key1', 'label1', 'default1', []));
        expect(options.key1).toEqual('default1');
        options.key1 = '';
        expect(options.key1).toEqual('');
        options.key1 = 'new1';
        expect(options.key1).toEqual('new1');
    });

    it('inject does add multiple given widget options with provided bindings', () => {
        options.inject([
            new WidgetSelectOption('keyA', 'labelA', 'defaultA', []),
            new WidgetSelectOption('keyB', 'labelB', 'defaultB', [])
        ]);
        expect(options.keyA).toEqual('provideA');
        expect(options.keyB).toEqual('provideB');

        options.keyA = 'newA';
        expect(options.keyA).toEqual('newA');
        expect(options.keyB).toEqual('provideB');

        options.keyB = 'newB';
        expect(options.keyA).toEqual('newA');
        expect(options.keyB).toEqual('newB');
    });

    it('inject does add multiple given widget options without provided bindings', () => {
        options.inject([
            new WidgetSelectOption('key1', 'label1', 'default1', []),
            new WidgetSelectOption('key2', 'label2', 'default2', [])
        ]);
        expect(options.key1).toEqual('default1');
        expect(options.key2).toEqual('default2');

        options.key1 = 'new1';
        expect(options.key1).toEqual('new1');
        expect(options.key2).toEqual('default2');

        options.key2 = 'new2';
        expect(options.key1).toEqual('new1');
        expect(options.key2).toEqual('new2');
    });

    it('inject does add multiple given widget options with and without provided bindings', () => {
        options.inject([
            new WidgetSelectOption('keyA', 'labelA', 'defaultA', []),
            new WidgetSelectOption('key1', 'label1', 'default1', [])
        ]);
        expect(options.keyA).toEqual('provideA');
        expect(options.key1).toEqual('default1');

        options.keyA = 'newA';
        expect(options.keyA).toEqual('newA');
        expect(options.key1).toEqual('default1');

        options.key1 = 'new1';
        expect(options.keyA).toEqual('newA');
        expect(options.key1).toEqual('new1');
    });

    it('list does return an array of all widget options', () => {
        let databaseOption = new WidgetDatabaseOption();
        databaseOption.valueCurrent = NeonDatabaseMetaData.get();
        let tableOption = new WidgetTableOption();
        tableOption.valueCurrent = NeonTableMetaData.get();
        expect(options.list()).toEqual([databaseOption, tableOption]);

        let widgetOption1 = new WidgetSelectOption('key1', 'label1', 'default1', []);
        let widgetOption2 = new WidgetSelectOption('key2', 'label2', 'default2', []);

        options.append(widgetOption1, 'current1');
        options.append(widgetOption2, 'current2');

        expect(widgetOption1.valueCurrent).toEqual('current1');
        expect(widgetOption2.valueCurrent).toEqual('current2');

        expect(options.list()).toEqual([databaseOption, tableOption, widgetOption1, widgetOption2]);
    });

    it('updateDatabases does update databases, tables, and fields', inject([DashboardService], (dashboardService: DashboardService) => {
        options.databases = [];
        options.database = NeonDatabaseMetaData.get();
        options.tables = [];
        options.table = NeonTableMetaData.get();
        options.fields = [];

        options.updateDatabases(dashboardService.state);

        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);
    }));

    it('updateFields does update fields', inject([DashboardService], (dashboardService: DashboardService) => {
        options.databases = DashboardServiceMock.DATABASES_LIST;
        options.database = DashboardServiceMock.DATABASES.testDatabase1;
        options.tables = DashboardServiceMock.TABLES_LIST;
        options.table = DashboardServiceMock.TABLES.testTable1;
        options.fields = [];

        options.updateFields(dashboardService.state);

        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);
    }));

    it('updateTables does update tables and fields', inject([DashboardService], (dashboardService: DashboardService) => {
        options.databases = DashboardServiceMock.DATABASES_LIST;
        options.database = DashboardServiceMock.DATABASES.testDatabase1;
        options.tables = [];
        options.table = NeonTableMetaData.get();
        options.fields = [];

        options.updateTables(dashboardService.state);

        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);
    }));
});

describe('WidgetOptionCollection with custom fields', () => {
    let options: WidgetOptionCollection;

    initializeTestBed('Widget Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ]
    });

    beforeEach(() => {
        options = new WidgetOptionCollection(() => [
            new WidgetFieldOption('testCustomField', 'Test Custom Field', false),
            new WidgetFieldArrayOption('testCustomFieldArray', 'Test Custom Field Array', false)
        ], ReflectiveInjector.resolveAndCreate([]));
    });

    it('updateDatabases does update databases, tables, and fields with custom fields', inject([DashboardService],
        (dashboardService: DashboardService) => {
            options.databases = [];
            options.database = NeonDatabaseMetaData.get();
            options.tables = [];
            options.table = NeonTableMetaData.get();
            options.fields = [];
            options.testCustomField = null;
            options.testCustomFieldArray = null;

            options.updateDatabases(dashboardService.state);

            expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
            expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
            expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
            expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
            expect(options.fields).toEqual(DashboardServiceMock.FIELDS);
            expect(options.testCustomField).toEqual(NeonFieldMetaData.get());
            expect(options.testCustomFieldArray).toEqual([]);
        }));

    it('updateFields does update fields with custom fields', inject([DashboardService], (dashboardService: DashboardService) => {
        options.databases = DashboardServiceMock.DATABASES_LIST;
        options.database = DashboardServiceMock.DATABASES.testDatabase1;
        options.tables = DashboardServiceMock.TABLES_LIST;
        options.table = DashboardServiceMock.TABLES.testTable1;
        options.fields = [];
        options.testCustomField = null;
        options.testCustomFieldArray = null;

        options.updateFields(dashboardService.state);

        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);
        expect(options.testCustomField).toEqual(NeonFieldMetaData.get());
        expect(options.testCustomFieldArray).toEqual([]);
    }));

    it('updateTables does update tables and fields with custom fields', inject([DashboardService], (dashboardService: DashboardService) => {
        options.databases = DashboardServiceMock.DATABASES_LIST;
        options.database = DashboardServiceMock.DATABASES.testDatabase1;
        options.tables = [];
        options.table = NeonTableMetaData.get();
        options.fields = [];
        options.testCustomField = null;
        options.testCustomFieldArray = null;

        options.updateTables(dashboardService.state);

        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);
        expect(options.testCustomField).toEqual(NeonFieldMetaData.get());
        expect(options.testCustomFieldArray).toEqual([]);
    }));
});

describe('WidgetOptionCollection with bindings and custom fields', () => {
    let options: WidgetOptionCollection;

    initializeTestBed('Widget Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ]
    });

    beforeEach(() => {
        options = new WidgetOptionCollection(() => [
            new WidgetFieldOption('testCustomField', 'Test Custom Field', false),
            new WidgetFieldArrayOption('testCustomFieldArray', 'Test Custom Field Array', false)
        ], ReflectiveInjector.resolveAndCreate([{
            provide: 'tableKey',
            useValue: 'table_key_2'
        }, {
            provide: 'testCustomField',
            useValue: 'testTextField'
        }, {
            provide: 'testCustomFieldArray',
            useValue: ['testNameField', 'testTypeField']
        }]));
    });

    it('updateDatabases does update databases, tables, and fields with bindings',
        inject([DashboardService], (dashboardService: DashboardService) => {
            options.databases = [];
            options.database = NeonDatabaseMetaData.get();
            options.tables = [];
            options.table = NeonTableMetaData.get();
            options.fields = [];
            options.testCustomField = null;
            options.testCustomFieldArray = null;

            options.updateDatabases(dashboardService.state);

            expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
            expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
            expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
            expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
            expect(options.fields).toEqual(DashboardServiceMock.FIELDS);
            expect(options.testCustomField).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
            expect(options.testCustomFieldArray).toEqual([DashboardServiceMock.FIELD_MAP.NAME, DashboardServiceMock.FIELD_MAP.TYPE]);
        }));

    it('updateFields does update fields with bindings', inject([DashboardService], (dashboardService: DashboardService) => {
        options.databases = DashboardServiceMock.DATABASES_LIST;
        options.database = DashboardServiceMock.DATABASES.testDatabase2;
        options.tables = DashboardServiceMock.TABLES_LIST;
        options.table = DashboardServiceMock.TABLES.testTable2;
        options.fields = [];
        options.testCustomField = null;
        options.testCustomFieldArray = null;

        options.updateFields(dashboardService.state);

        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);
        expect(options.testCustomField).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(options.testCustomFieldArray).toEqual([DashboardServiceMock.FIELD_MAP.NAME, DashboardServiceMock.FIELD_MAP.TYPE]);
    }));

    it('updateTables does update tables and fields with bindings', inject([DashboardService], (dashboardService: DashboardService) => {
        options.databases = DashboardServiceMock.DATABASES_LIST;
        options.database = DashboardServiceMock.DATABASES.testDatabase2;
        options.tables = [];
        options.table = NeonTableMetaData.get();
        options.fields = [];
        options.testCustomField = null;
        options.testCustomFieldArray = null;

        options.updateTables(dashboardService.state);

        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table.prettyName).toEqual(DashboardServiceMock.TABLES.testTable2.prettyName);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);
        expect(options.testCustomField).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(options.testCustomFieldArray).toEqual([DashboardServiceMock.FIELD_MAP.NAME, DashboardServiceMock.FIELD_MAP.TYPE]);
    }));
});

describe('NonPrimitive Fields', () => {
    it('Objects initialize properly', () => {
        const optEmpty = new WidgetNonPrimitiveOption('test', 'Test', {}, true);
        expect(optEmpty.valueDefault).toEqual({});
        expect(optEmpty.intermediateValue).toEqual('');
        expect(optEmpty.getValueToSaveInBindings()).toEqual({});

        const optNull = new WidgetNonPrimitiveOption('test', 'Test', undefined, true);
        expect(optNull.valueDefault).toEqual(undefined);
        expect(optNull.intermediateValue).toEqual('');
        expect(optNull.getValueToSaveInBindings()).toEqual(undefined);

        const optComplex = new WidgetNonPrimitiveOption('test', 'Test', { a: 5, b: [1, 2, { c: 3 }] }, true);
        expect(optComplex.valueDefault).toEqual({ a: 5, b: [1, 2, { c: 3 }] });
        expect(optComplex.intermediateValue).toEqual(yaml.safeDump({ a: 5, b: [1, 2, { c: 3 }] }));

        expect(optComplex.getValueToSaveInBindings()).toEqual({
            a: 5, b: [1, 2, { c: 3 }]
        });

        // Invalid yaml with duplicate keys
        optComplex.intermediateValue = `
          person:
            a: 5
            a: 10
        `;

        expect(optComplex.intermediateValue).toBeTruthy();
        expect(optComplex.valueCurrent).toBeFalsy();
        expect(optComplex.getValueToSaveInBindings()).toEqual({ a: 5, b: [1, 2, { c: 3 }] });
    });

    it('Objects update properly', () => {
        const option = new WidgetNonPrimitiveOption('test', 'Test', {}, true);
        expect(option.valueDefault).toEqual({});
        option.intermediateValue = 'a: [1,2,3]';
        expect(option.getValueToSaveInBindings()).toEqual({ a: [1, 2, 3] });
        option.intermediateValue = `
            a: 5
            b: 10
            c: [1,2,3]
        `;
        expect(option.getValueToSaveInBindings()).toEqual({ a: 5, b: 10, c: [1, 2, 3] });

        option.intermediateValue = '';

        expect(option.getValueToSaveInBindings()).toEqual({});

        option.intermediateValue = 'null';

        expect(option.getValueToSaveInBindings()).toEqual({});
    });
});
