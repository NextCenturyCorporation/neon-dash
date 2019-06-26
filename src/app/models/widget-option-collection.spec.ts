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
import { ReflectiveInjector } from '@angular/core';
import { inject } from '@angular/core/testing';
import * as yaml from 'js-yaml';

import { NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData } from './types';
import { DashboardService } from '../services/dashboard.service';
import {
    WidgetDatabaseOption,
    WidgetFieldOption,
    WidgetFieldArrayOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetNumberOption,
    WidgetSelectOption,
    WidgetTableOption
} from './widget-option';
import { OptionCollection, RootWidgetOptionCollection, WidgetOptionCollection } from './widget-option-collection';

import { initializeTestBed } from '../../testUtils/initializeTestBed';
import { DashboardServiceMock } from '../../testUtils/MockServices/DashboardServiceMock';

import * as _ from 'lodash';

describe('OptionCollection', () => {
    let options: OptionCollection;
    let dashboardService: DashboardService;

    initializeTestBed('Option Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ]
    });

    beforeEach(inject([DashboardService], (_dashboardService) => {
        dashboardService = _dashboardService;

        options = new OptionCollection(ReflectiveInjector.resolveAndCreate([{
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
            useValue: ['field_key_1', 'field_key_2']
        }]));
    }));

    it('does have an _id', () => {
        expect(options._id).toBeDefined();
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

    it('copy does return a copy', () => {
        let copy = options.copy();
        // Verify that toBe (true equality) is false and toEqual (deep equality) is true.
        expect(copy).not.toBe(options);
        expect(copy).toEqual(options);
    });

    it('find field functions do not error if fields are not set', () => {
        expect(options.findField('testNameField')).toEqual(undefined);
        expect(options.findFieldObject(dashboardService.state, 'testName')).toEqual(NeonFieldMetaData.get());
        expect(options.findFieldObjects(dashboardService.state, 'testList')).toEqual([]);
    });

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

    it('findFieldObject does return expected object', () => {
        options.fields = DashboardServiceMock.FIELDS;

        expect(options.findFieldObject(dashboardService.state, 'testDate')).toEqual(DashboardServiceMock.FIELD_MAP.DATE);
        expect(options.findFieldObject(dashboardService.state, 'testName')).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(options.findFieldObject(dashboardService.state, 'testSize')).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(options.findFieldObject(dashboardService.state, 'testFieldKey')).toEqual(DashboardServiceMock.FIELD_MAP.FIELD_KEY);
        expect(options.findFieldObject(dashboardService.state, 'testFake')).toEqual(NeonFieldMetaData.get());
        expect(options.findFieldObject(dashboardService.state, 'fakeBind')).toEqual(NeonFieldMetaData.get());
    });

    it('findFieldObjects does return expected array', () => {
        options.fields = DashboardServiceMock.FIELDS;

        expect(options.findFieldObjects(dashboardService.state, 'testList')).toEqual([
            DashboardServiceMock.FIELD_MAP.DATE,
            DashboardServiceMock.FIELD_MAP.NAME,
            DashboardServiceMock.FIELD_MAP.SIZE
        ]);
        expect(options.findFieldObjects(dashboardService.state, 'testListWithFieldKey')).toEqual([
            DashboardServiceMock.FIELD_MAP.FIELD_KEY
        ]);
        expect(options.findFieldObjects(dashboardService.state, 'testName')).toEqual([]);
        expect(options.findFieldObjects(dashboardService.state, 'fakeBind')).toEqual([]);
    });

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

    it('updateDatabases does update databases, tables, and fields', () => {
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
    });

    it('updateFields does update fields', () => {
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
    });

    it('updateTables does update tables and fields', () => {
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
    });
});

describe('WidgetOptionCollection', () => {
    let options: WidgetOptionCollection;
    let dashboardService: DashboardService;

    initializeTestBed('Widget Option Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ]
    });

    beforeEach(inject([DashboardService], (_dashboardService) => {
        dashboardService = _dashboardService;

        options = new WidgetOptionCollection(() => [
            new WidgetFieldOption('testCustomField', 'Test Custom Field', false),
            new WidgetFieldArrayOption('testCustomFieldArray', 'Test Custom Field Array', false),
            new WidgetFreeTextOption('testCustomKey', 'Test Custom Key', 'default value')
        ], dashboardService.state, 'Test Title', 100, ReflectiveInjector.resolveAndCreate([{
            provide: 'tableKey',
            useValue: 'table_key_2'
        }, {
            provide: 'limit',
            useValue: '1234'
        }, {
            provide: 'title',
            useValue: 'Test Custom Title'
        }, {
            provide: 'testCustomField',
            useValue: 'testTextField'
        }, {
            provide: 'testCustomFieldArray',
            useValue: ['testNameField', 'testTypeField']
        }, {
            provide: 'testCustomKey',
            useValue: 'testCustomValue'
        }]));
    }));

    it('does have databases, fields, tables, and custom properties', () => {
        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);

        expect(options.limit).toEqual('1234');
        expect(options.title).toEqual('Test Custom Title');

        expect(options.testCustomField).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(options.testCustomFieldArray).toEqual([DashboardServiceMock.FIELD_MAP.NAME, DashboardServiceMock.FIELD_MAP.TYPE]);
        expect(options.testCustomKey).toEqual('testCustomValue');
    });

    it('updateDatabases does update databases, tables, and fields with custom properties', () => {
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
    });

    it('updateFields does update fields with custom properties', () => {
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
    });

    it('updateTables does update tables and fields with custom properties', () => {
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
    });
});

describe('WidgetOptionCollection with no bindings', () => {
    let options: WidgetOptionCollection;
    let dashboardService: DashboardService;

    initializeTestBed('Widget Option Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ]
    });

    beforeEach(inject([DashboardService], (_dashboardService) => {
        dashboardService = _dashboardService;

        options = new WidgetOptionCollection(() => [
            new WidgetFieldOption('testCustomField', 'Test Custom Field', false),
            new WidgetFieldArrayOption('testCustomFieldArray', 'Test Custom Field Array', false),
            new WidgetFreeTextOption('testCustomKey', 'Test Custom Key', 'default value')
        ], dashboardService.state, 'Test Title', 100, ReflectiveInjector.resolveAndCreate([]));
    }));

    it('does have databases, fields, tables, and custom properties with default values', () => {
        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);

        expect(options.limit).toEqual(100);
        expect(options.title).toEqual('Test Title');

        expect(options.testCustomField).toEqual(NeonFieldMetaData.get());
        expect(options.testCustomFieldArray).toEqual([]);
        expect(options.testCustomKey).toEqual('default value');
    });
});

describe('RootWidgetOptionCollection', () => {
    let options: RootWidgetOptionCollection;
    let dashboardService: DashboardService;

    initializeTestBed('Root Widget Option Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ]
    });

    beforeEach(inject([DashboardService], (_dashboardService) => {
        dashboardService = _dashboardService;

        options = new RootWidgetOptionCollection(() => [
            new WidgetFieldOption('testCustomField', 'Test Custom Field', false),
            new WidgetFieldArrayOption('testCustomFieldArray', 'Test Custom Field Array', false),
            new WidgetFreeTextOption('testCustomKey', 'Test Custom Key', 'default value')
        ], () => [
            new WidgetFieldOption('testCustomLayerField', 'Test Custom Layer Field', false),
            new WidgetFieldArrayOption('testCustomLayerFieldArray', 'Test Custom Layer Field Array', false),
            new WidgetFreeTextOption('testCustomLayerKey', 'Test Custom Layer Key', 'default layer value')
        ], dashboardService.state, 'Test Title', 100, true, ReflectiveInjector.resolveAndCreate([{
            provide: 'tableKey',
            useValue: 'table_key_2'
        }, {
            provide: 'contributionKeys',
            useValue: ['next_century']
        }, {
            provide: 'filter',
            useValue: { lhs: 'a', operator: '!=', rhs: 'b' }
        }, {
            provide: 'hideUnfiltered',
            useValue: true
        }, {
            provide: 'limit',
            useValue: '1234'
        }, {
            provide: 'title',
            useValue: 'Test Custom Title'
        }, {
            provide: 'unsharedFilterField',
            useValue: 'testFilterField'
        }, {
            provide: 'unsharedFilterValue',
            useValue: 'testFilterValue'
        }, {
            provide: 'testCustomField',
            useValue: 'testTextField'
        }, {
            provide: 'testCustomFieldArray',
            useValue: ['testNameField', 'testTypeField']
        }, {
            provide: 'testCustomKey',
            useValue: 'testCustomValue'
        }, {
            provide: 'layers',
            useValue: [{
                tableKey: 'table_key_2',
                limit: 5678,
                title: 'Test Layer Title',
                testCustomLayerField: 'testDateField',
                testCustomLayerFieldArray: ['testXField', 'testYField'],
                testCustomLayerKey: 'testCustomLayerValue'
            }]
        }]));
    }));

    it('does have databases, fields, tables, custom properties, and custom layers', () => {
        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);

        expect(options.contributionKeys).toEqual(['next_century']);
        expect(options.filter).toEqual({ lhs: 'a', operator: '!=', rhs: 'b' });
        expect(options.hideUnfiltered).toEqual(true);
        expect(options.limit).toEqual('1234');
        expect(options.title).toEqual('Test Custom Title');
        expect(options.unsharedFilterField).toEqual(DashboardServiceMock.FIELD_MAP.FILTER);
        expect(options.unsharedFilterValue).toEqual('testFilterValue');

        expect(options.testCustomField).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(options.testCustomFieldArray).toEqual([DashboardServiceMock.FIELD_MAP.NAME, DashboardServiceMock.FIELD_MAP.TYPE]);
        expect(options.testCustomKey).toEqual('testCustomValue');

        expect(options.layers.length).toEqual(1);
        expect(options.layers[0].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.layers[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(options.layers[0].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.layers[0].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(options.layers[0].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(options.layers[0].limit).toEqual(5678);
        expect(options.layers[0].title).toEqual('Test Layer Title');
        expect(options.layers[0].testCustomLayerField).toEqual(DashboardServiceMock.FIELD_MAP.DATE);
        expect(options.layers[0].testCustomLayerFieldArray).toEqual([DashboardServiceMock.FIELD_MAP.X, DashboardServiceMock.FIELD_MAP.Y]);
        expect(options.layers[0].testCustomLayerKey).toEqual('testCustomLayerValue');
    });

    it('addLayer does add a new layer', () => {
        let newLayer = options.addLayer();
        expect(options.layers.length).toEqual(2);
        expect(options.layers[1].title).toEqual('Layer 2');
        expect(options.layers[1].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.layers[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(options.layers[1].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.layers[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(options.layers[1].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(options.layers[1].testCustomLayerField).toEqual(NeonFieldMetaData.get());
        expect(options.layers[1].testCustomLayerFieldArray).toEqual([]);
        expect(options.layers[1].testCustomLayerKey).toEqual('default layer value');
        expect(newLayer).toEqual(options.layers[1]);
    });

    it('addLayer with options and bindings does add a new layer to it', () => {
        let newLayer = options.addLayer({
            tableKey: 'table_key_2',
            limit: 5678,
            title: 'Test Layer Title',
            testCustomLayerField: 'testDateField',
            testCustomLayerFieldArray: ['testXField', 'testYField'],
            testCustomLayerKey: 'testCustomLayerValue'
        });
        expect(options.layers.length).toEqual(2);
        expect(options.layers[1].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.layers[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(options.layers[1].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.layers[1].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(options.layers[1].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(options.layers[1].limit).toEqual(5678);
        expect(options.layers[1].title).toEqual('Test Layer Title');
        expect(options.layers[1].testCustomLayerField).toEqual(DashboardServiceMock.FIELD_MAP.DATE);
        expect(options.layers[1].testCustomLayerFieldArray).toEqual([DashboardServiceMock.FIELD_MAP.X, DashboardServiceMock.FIELD_MAP.Y]);
        expect(options.layers[1].testCustomLayerKey).toEqual('testCustomLayerValue');
        expect(newLayer).toEqual(options.layers[1]);
    });

    it('copy does copy layers', () => {
        let copy = options.copy();
        // Verify that toBe (true equality) is false and toEqual (deep equality) is true.
        expect(copy).not.toBe(options);
        expect(copy).toEqual(options);
    });

    it('removeLayer does remove the given layer if it is not the final layer', () => {
        let newLayer = options.addLayer();
        let successful = options.removeLayer(options.layers[0]);
        expect(successful).toEqual(true);
        expect(options.layers.length).toEqual(1);
        expect(options.layers[0]).toEqual(newLayer);
    });

    it('removeLayer does not remove the given layer if it is the final layer', () => {
        let successful = options.removeLayer(options.layers[0]);
        expect(successful).toEqual(false);
        expect(options.layers.length).toEqual(1);
    });
});

describe('RootWidgetOptionCollection with no bindings', () => {
    let options: RootWidgetOptionCollection;
    let dashboardService: DashboardService;

    initializeTestBed('Root Widget Option Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ]
    });

    beforeEach(inject([DashboardService], (_dashboardService) => {
        dashboardService = _dashboardService;

        options = new RootWidgetOptionCollection(() => [
            new WidgetFieldOption('testCustomField', 'Test Custom Field', false),
            new WidgetFieldArrayOption('testCustomFieldArray', 'Test Custom Field Array', false),
            new WidgetFreeTextOption('testCustomKey', 'Test Custom Key', 'default value')
        ], () => [
            new WidgetFieldOption('testCustomLayerField', 'Test Custom Layer Field', false),
            new WidgetFieldArrayOption('testCustomLayerFieldArray', 'Test Custom Layer Field Array', false),
            new WidgetFreeTextOption('testCustomLayerKey', 'Test Custom Layer Key', 'default layer value')
        ], dashboardService.state, 'Test Title', 100, true, ReflectiveInjector.resolveAndCreate([]));
    }));

    it('does have databases, fields, tables, custom properties, and custom layers with default values', () => {
        expect(options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(options.fields).toEqual(DashboardServiceMock.FIELDS);

        expect(options.contributionKeys).toEqual(null);
        expect(options.filter).toEqual(null);
        expect(options.hideUnfiltered).toEqual(false);
        expect(options.limit).toEqual(100);
        expect(options.title).toEqual('Test Title');
        expect(options.unsharedFilterField).toEqual(NeonFieldMetaData.get());
        expect(options.unsharedFilterValue).toEqual('');

        expect(options.testCustomField).toEqual(NeonFieldMetaData.get());
        expect(options.testCustomFieldArray).toEqual([]);
        expect(options.testCustomKey).toEqual('default value');

        expect(options.layers.length).toEqual(1);
        expect(options.layers[0].limit).toEqual(100);
        expect(options.layers[0].title).toEqual('Layer 1');
        expect(options.layers[0].testCustomLayerField).toEqual(NeonFieldMetaData.get());
        expect(options.layers[0].testCustomLayerFieldArray).toEqual([]);
        expect(options.layers[0].testCustomLayerKey).toEqual('default layer value');
    });
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

describe('Number Fields', () => {
    it('Object initializes correctly', () => {
        const optEmpty = new WidgetNumberOption('test', 'Test', 0, true);
        expect(optEmpty.valueDefault).toEqual(0);
        expect(optEmpty.intermediateValue).toEqual(0);
        expect(optEmpty.getValueToSaveInBindings()).toEqual(0);

        const optNull = new WidgetNumberOption('test', 'Test', undefined, true);
        expect(optNull.valueDefault).toEqual(undefined);
        expect(optNull.intermediateValue).toEqual(undefined);
        expect(optNull.getValueToSaveInBindings()).toEqual(undefined);
    });

    it('Object updates properly', () => {
        const opt = new WidgetNumberOption('test', 'Test', 0, true);
        expect(opt.valueDefault).toEqual(0);
        opt.intermediateValue = 7;
        expect(opt.getValueToSaveInBindings()).toEqual(7);

        // ValueCurrent is null because invalid input so therefore the value returned is the default
        opt.intermediateValue = 'Hello World';
        expect(opt.getValueToSaveInBindings()).toEqual(0);

        opt.intermediateValue = undefined;
        expect(opt.getValueToSaveInBindings()).toEqual(0);
    });
});
