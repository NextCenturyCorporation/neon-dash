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

import {
    ConfigOptionDatabase,
    ConfigOptionDatastore,
    ConfigOptionField,
    ConfigOptionFieldArray,
    ConfigOptionFreeText,
    ConfigOptionNonPrimitive,
    ConfigOptionNumber,
    ConfigOptionSelect,
    ConfigOptionTable,
    DatabaseConfig,
    DatastoreConfig,
    FieldConfig,
    TableConfig,
    DATABASES,
    DATABASES_LIST,
    DATASET,
    DATASTORE,
    FIELD_MAP,
    FIELDS,
    TABLES,
    TABLES_LIST
} from '@caci-critical-insight-solutions/nucleus-core';
import { OptionCollection, OptionConfig, RootWidgetOptionCollection, WidgetOptionCollection } from './widget-option-collection';

import * as _ from 'lodash';
import * as yaml from 'js-yaml';

describe('OptionCollection', () => {
    let options: OptionCollection;

    beforeEach(() => {
        options = new OptionCollection(DATASET, new OptionConfig({
            keyA: 'provideA',
            keyB: 'provideB',
            testDate: 'testDateField',
            testFake: 'testFakeField',
            testList: ['testDateField', 'testFakeField', 'testNameField', 'testSizeField'],
            testName: 'testNameField',
            testSize: 'testSizeField',
            testFieldKey: 'field_key_1',
            testListWithFieldKey: ['field_key_1', 'field_key_2']
        }));
    });

    it('does have an _id', () => {
        expect(options._id).toBeDefined();
    });

    it('does have empty databases, fields, and tables', () => {
        expect(options.databases).toEqual([]);
        expect(options.fields).toEqual([]);
        expect(options.tables).toEqual([]);
    });

    it('access does return widget option with given key', () => {
        let widgetOption1 = new ConfigOptionSelect('key1', 'label1', false, 'default1', []);
        let widgetOption2 = new ConfigOptionSelect('key2', 'label2', false, 'default2', []);

        options.append(widgetOption1, 'current1');
        options.append(widgetOption2, 'current2');

        expect(widgetOption1.valueCurrent).toEqual('current1');
        expect(widgetOption2.valueCurrent).toEqual('current2');

        expect(options.access('key1')).toEqual(widgetOption1);
        expect(options.access('key2')).toEqual(widgetOption2);
    });

    it('append does add given widget option', () => {
        options.append(new ConfigOptionSelect('key1', 'label1', false, 'default1', []), 'current1');
        expect(options.key1).toEqual('current1');
        options.key1 = '';
        expect(options.key1).toEqual('');
        options.key1 = 'new1';
        expect(options.key1).toEqual('new1');
    });

    it('append does ignore provided binding', () => {
        options.append(new ConfigOptionSelect('keyA', 'labelA', false, 'defaultA', []), 'currentA');
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
        expect(options.findFieldObject(DATASET, 'testName')).toEqual(FieldConfig.get());
        expect(options.findFieldObjects(DATASET, 'testList')).toEqual([]);
    });

    it('findField does return expected object or undefined', () => {
        options.fields = FIELDS;

        expect(options.findField('testDateField')).toEqual(FIELD_MAP.DATE);
        expect(options.findField('testNameField')).toEqual(FIELD_MAP.NAME);
        expect(options.findField('testSizeField')).toEqual(FIELD_MAP.SIZE);
        expect(options.findField('testFakeField')).toEqual(undefined);
    });

    it('findField does work as expected if given an array index', () => {
        options.fields = FIELDS;

        let dateIndex = _.findIndex(FIELDS, (fieldObject: FieldConfig) => fieldObject.columnName === 'testDateField');
        let nameIndex = _.findIndex(FIELDS, (fieldObject: FieldConfig) => fieldObject.columnName === 'testNameField');
        let sizeIndex = _.findIndex(FIELDS, (fieldObject: FieldConfig) => fieldObject.columnName === 'testSizeField');

        expect(options.findField('' + dateIndex)).toEqual(FIELD_MAP.DATE);
        expect(options.findField('' + nameIndex)).toEqual(FIELD_MAP.NAME);
        expect(options.findField('' + sizeIndex)).toEqual(FIELD_MAP.SIZE);
        expect(options.findField('' + FIELDS.length)).toEqual(undefined);
        expect(options.findField('-1')).toEqual(undefined);
        expect(options.findField('abcd')).toEqual(undefined);
    });

    it('findFieldObject does return expected object', () => {
        options.fields = FIELDS;

        expect(options.findFieldObject(DATASET, 'testDate')).toEqual(FIELD_MAP.DATE);
        expect(options.findFieldObject(DATASET, 'testName')).toEqual(FIELD_MAP.NAME);
        expect(options.findFieldObject(DATASET, 'testSize')).toEqual(FIELD_MAP.SIZE);
        expect(options.findFieldObject(DATASET, 'testFieldKey')).toEqual(FIELD_MAP.FIELD_KEY);
        expect(options.findFieldObject(DATASET, 'testFake')).toEqual(FieldConfig.get());
        expect(options.findFieldObject(DATASET, 'fakeBind')).toEqual(FieldConfig.get());
    });

    it('findFieldObjects does return expected array', () => {
        options.fields = FIELDS;

        expect(options.findFieldObjects(DATASET, 'testList')).toEqual([
            FIELD_MAP.DATE,
            FIELD_MAP.NAME,
            FIELD_MAP.SIZE
        ]);
        expect(options.findFieldObjects(DATASET, 'testListWithFieldKey')).toEqual([
            FIELD_MAP.FIELD_KEY
        ]);
        expect(options.findFieldObjects(DATASET, 'testName')).toEqual([]);
        expect(options.findFieldObjects(DATASET, 'fakeBind')).toEqual([]);
    });

    it('inject does add given widget option with provided binding', () => {
        options.inject(new ConfigOptionSelect('keyA', 'labelA', false, 'defaultA', []));
        expect(options.keyA).toEqual('provideA');
        options.keyA = '';
        expect(options.keyA).toEqual('');
        options.keyA = 'newA';
        expect(options.keyA).toEqual('newA');
    });

    it('inject does add given widget option without provided binding', () => {
        options.inject(new ConfigOptionSelect('key1', 'label1', false, 'default1', []));
        expect(options.key1).toEqual('default1');
        options.key1 = '';
        expect(options.key1).toEqual('');
        options.key1 = 'new1';
        expect(options.key1).toEqual('new1');
    });

    it('inject does add multiple given widget options with provided bindings', () => {
        options.inject([
            new ConfigOptionSelect('keyA', 'labelA', false, 'defaultA', []),
            new ConfigOptionSelect('keyB', 'labelB', false, 'defaultB', [])
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
            new ConfigOptionSelect('key1', 'label1', false, 'default1', []),
            new ConfigOptionSelect('key2', 'label2', false, 'default2', [])
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
            new ConfigOptionSelect('keyA', 'labelA', false, 'defaultA', []),
            new ConfigOptionSelect('key1', 'label1', false, 'default1', [])
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
        let datastoreOption = new ConfigOptionDatastore();
        datastoreOption.valueCurrent = DATASTORE;
        let databaseOption = new ConfigOptionDatabase();
        databaseOption.valueCurrent = DatabaseConfig.get();
        let tableOption = new ConfigOptionTable();
        tableOption.valueCurrent = TableConfig.get();
        let tableKeyOption = new ConfigOptionFreeText('tableKey', 'Table Key', true, '', true);
        tableKeyOption.valueCurrent = '';
        expect(options.list()).toEqual([datastoreOption, databaseOption, tableOption, tableKeyOption]);

        let widgetOption1 = new ConfigOptionSelect('key1', 'label1', false, 'default1', []);
        let widgetOption2 = new ConfigOptionSelect('key2', 'label2', false, 'default2', []);

        options.append(widgetOption1, 'current1');
        options.append(widgetOption2, 'current2');

        expect(widgetOption1.valueCurrent).toEqual('current1');
        expect(widgetOption2.valueCurrent).toEqual('current2');

        expect(options.list()).toEqual([datastoreOption, databaseOption, tableOption, tableKeyOption, widgetOption1, widgetOption2]);
    });

    it('updateDatabases without config does update databases, tables, and fields', () => {
        options.datastores = [DATASTORE];
        options.datastore = DATASTORE;
        options.databases = [];
        options.database = DatabaseConfig.get();
        options.tables = [];
        options.table = TableConfig.get();
        options.fields = [];

        options.updateDatabases(DATASET);

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES_LIST[0]);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES_LIST[0]);
        expect(options.fields).toEqual(FIELDS);
    });

    it('updateDatastores without config does update datastores, databases, tables, and fields', () => {
        options.datastores = [];
        options.datastore = DatastoreConfig.get();
        options.databases = [];
        options.database = DatabaseConfig.get();
        options.tables = [];
        options.table = TableConfig.get();
        options.fields = [];

        options.updateDatastores(DATASET);

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES_LIST[0]);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES_LIST[0]);
        expect(options.fields).toEqual(FIELDS);
    });

    it('updateFields without config does update fields', () => {
        options.datastores = [DATASTORE];
        options.datastore = DATASTORE;
        options.databases = DATABASES_LIST;
        options.database = DATABASES_LIST[0];
        options.tables = TABLES_LIST;
        options.table = TABLES_LIST[0];
        options.fields = [];

        options.updateFields();

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES_LIST[0]);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES_LIST[0]);
        expect(options.fields).toEqual(FIELDS);
    });

    it('updateTables without config does update tables and fields', () => {
        options.datastores = [DATASTORE];
        options.datastore = DATASTORE;
        options.databases = DATABASES_LIST;
        options.database = DATABASES_LIST[0];
        options.tables = [];
        options.table = TableConfig.get();
        options.fields = [];

        options.updateTables(DATASET);

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES_LIST[0]);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES_LIST[0]);
        expect(options.fields).toEqual(FIELDS);
    });

    it('updateDatabases with tableKey does update databases, tables, and fields', () => {
        options.datastores = [DATASTORE];
        options.datastore = DATASTORE;
        options.databases = [];
        options.database = DatabaseConfig.get();
        options.tables = [];
        options.table = TableConfig.get();
        options.fields = [];

        options.tableKey = 'datastore1.testDatabase2.testTable2';
        options.updateDatabases(DATASET);

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.fields).toEqual(FIELDS);
    });

    it('updateDatastores with tableKey does update databases, tables, and fields', () => {
        options.datastores = [];
        options.datastore = DatastoreConfig.get();
        options.databases = [];
        options.database = DatabaseConfig.get();
        options.tables = [];
        options.table = TableConfig.get();
        options.fields = [];

        options.tableKey = 'datastore1.testDatabase2.testTable2';
        options.updateDatastores(DATASET);

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.fields).toEqual(FIELDS);
    });

    it('updateFields with tableKey does update fields', () => {
        options.datastores = [DATASTORE];
        options.datastore = DATASTORE;
        options.databases = DATABASES_LIST;
        options.database = DATABASES.testDatabase2;
        options.tables = TABLES_LIST;
        options.table = TABLES.testTable2;
        options.fields = [];

        options.tableKey = 'datastore1.testDatabase2.testTable2';
        options.updateFields();

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.fields).toEqual(FIELDS);
    });

    it('updateTables with tableKey does update tables and fields', () => {
        options.datastores = [DATASTORE];
        options.datastore = DATASTORE;
        options.databases = DATABASES_LIST;
        options.database = DATABASES.testDatabase2;
        options.tables = [];
        options.table = TableConfig.get();
        options.fields = [];

        options.tableKey = 'datastore1.testDatabase2.testTable2';
        options.updateTables(DATASET);

        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.fields).toEqual(FIELDS);
    });
});

describe('WidgetOptionCollection', () => {
    let options: WidgetOptionCollection;

    beforeEach(() => {
        options = new WidgetOptionCollection(DATASET, () => [
            new ConfigOptionFreeText('tableKey', 'Table Key', true, 'datastore1.testDatabase1.testTable1'),
            new ConfigOptionField('testCustomField', 'Test Custom Field', false),
            new ConfigOptionFieldArray('testCustomFieldArray', 'Test Custom Field Array', false),
            new ConfigOptionFreeText('testCustomKey', 'Test Custom Key', false, 'default value')
        ], 'Test Title', 100, new OptionConfig({
            tableKey: 'table_key_2',
            limit: '1234',
            title: 'Test Custom Title',
            testCustomField: 'testTextField',
            testCustomFieldArray: ['testNameField', 'testTypeField'],
            testCustomKey: 'testCustomValue'
        }));
    });

    it('does have databases, fields, tables, and custom properties', () => {
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.fields).toEqual(FIELDS);

        expect(options.limit).toEqual('1234');
        expect(options.title).toEqual('Test Custom Title');

        expect(options.testCustomField).toEqual(FIELD_MAP.TEXT);
        expect(options.testCustomFieldArray).toEqual([FIELD_MAP.NAME, FIELD_MAP.TYPE]);
        expect(options.testCustomKey).toEqual('testCustomValue');
    });

    it('updateDatabases does update databases, tables, and fields with custom properties', () => {
        options.databases = [];
        options.database = DatabaseConfig.get();
        options.tables = [];
        options.table = TableConfig.get();
        options.fields = [];
        options.testCustomField = FieldConfig.get();
        options.testCustomFieldArray = [];

        options.updateDatabases(DATASET);

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.fields).toEqual(FIELDS);
        expect(options.testCustomField).toEqual(FieldConfig.get());
        expect(options.testCustomFieldArray).toEqual([]);
    });

    it('updateDatastores does update databases, tables, and fields with custom properties', () => {
        options.datastores = [];
        options.datastore = DatastoreConfig.get();
        options.databases = [];
        options.database = DatabaseConfig.get();
        options.tables = [];
        options.table = TableConfig.get();
        options.fields = [];
        options.testCustomField = FieldConfig.get();
        options.testCustomFieldArray = [];

        options.updateDatastores(DATASET);

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.fields).toEqual(FIELDS);
        expect(options.testCustomField).toEqual(FieldConfig.get());
        expect(options.testCustomFieldArray).toEqual([]);
    });

    it('updateFields does update fields with custom properties', () => {
        options.fields = [];
        options.testCustomField = FieldConfig.get();
        options.testCustomFieldArray = [];

        options.updateFields();

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.fields).toEqual(FIELDS);
        expect(options.testCustomField).toEqual(FieldConfig.get());
        expect(options.testCustomFieldArray).toEqual([]);
    });

    it('updateTables does update tables and fields with custom properties', () => {
        options.tables = [];
        options.table = TableConfig.get();
        options.fields = [];
        options.testCustomField = FieldConfig.get();
        options.testCustomFieldArray = [];

        options.updateTables(DATASET);

        expect(options.datastores).toEqual([DATASTORE]);
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.fields).toEqual(FIELDS);
        expect(options.testCustomField).toEqual(FieldConfig.get());
        expect(options.testCustomFieldArray).toEqual([]);
    });
});

describe('WidgetOptionCollection with no bindings', () => {
    let options: WidgetOptionCollection;

    beforeEach(() => {
        options = new WidgetOptionCollection(DATASET, () => [
            new ConfigOptionFreeText('tableKey', 'Table Key', true, 'datastore1.testDatabase1.testTable1'),
            new ConfigOptionField('testCustomField', 'Test Custom Field', false),
            new ConfigOptionFieldArray('testCustomFieldArray', 'Test Custom Field Array', false),
            new ConfigOptionFreeText('testCustomKey', 'Test Custom Key', false, 'default value')
        ], 'Test Title', 100);
    });

    it('does have databases, fields, tables, and custom properties with default values', () => {
        expect(options.datastore).toEqual(DATASTORE);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(DATABASES.testDatabase1);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(TABLES.testTable1);
        expect(options.fields).toEqual(FIELDS);

        expect(options.limit).toEqual(100);
        expect(options.title).toEqual('Test Title');

        expect(options.testCustomField).toEqual(FieldConfig.get());
        expect(options.testCustomFieldArray).toEqual([]);
        expect(options.testCustomKey).toEqual('default value');
    });
});

describe('RootWidgetOptionCollection', () => {
    let options: RootWidgetOptionCollection;

    beforeEach(() => {
        options = new RootWidgetOptionCollection(DATASET, () => [
            new ConfigOptionFreeText('tableKey', 'Table Key', true, 'datastore1.testDatabase1.testTable1'),
            new ConfigOptionField('testCustomField', 'Test Custom Field', false),
            new ConfigOptionFieldArray('testCustomFieldArray', 'Test Custom Field Array', false),
            new ConfigOptionFreeText('testCustomKey', 'Test Custom Key', false, 'default value')
        ], () => [
            new ConfigOptionFreeText('tableKey', 'Table Key', true, 'datastore1.testDatabase1.testTable1'),
            new ConfigOptionField('testCustomLayerField', 'Test Custom Layer Field', false),
            new ConfigOptionFieldArray('testCustomLayerFieldArray', 'Test Custom Layer Field Array', false),
            new ConfigOptionFreeText('testCustomLayerKey', 'Test Custom Layer Key', false, 'default layer value')
        ], 'Test Title', 100, true, new OptionConfig({
            contributionKeys: ['next_century'],
            filter: { lhs: 'a', operator: '!=', rhs: 'b' },
            hideUnfiltered: true,
            limit: '1234',
            title: 'Test Custom Title',
            testCustomField: 'testTextField',
            testCustomFieldArray: ['testNameField', 'testTypeField'],
            testCustomKey: 'testCustomValue',
            layers: [{
                tableKey: 'table_key_2',
                limit: 5678,
                title: 'Test Layer Title',
                testCustomLayerField: 'testDateField',
                testCustomLayerFieldArray: ['testXField', 'testYField'],
                testCustomLayerKey: 'testCustomLayerValue'
            }]
        }));
    });

    it('does have databases, fields, tables, custom properties, and custom layers', () => {
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(null);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(null);
        expect(options.fields).toEqual(FIELDS);

        expect(options.contributionKeys).toEqual(['next_century']);
        expect(options.filter).toEqual({ lhs: 'a', operator: '!=', rhs: 'b' });
        expect(options.hideUnfiltered).toEqual(true);
        expect(options.limit).toEqual('1234');
        expect(options.title).toEqual('Test Custom Title');

        expect(options.testCustomField).toEqual(FIELD_MAP.TEXT);
        expect(options.testCustomFieldArray).toEqual([FIELD_MAP.NAME, FIELD_MAP.TYPE]);
        expect(options.testCustomKey).toEqual('testCustomValue');

        expect(options.layers.length).toEqual(1);
        expect(options.layers[0].datastore).toEqual(DATASTORE);
        expect(options.layers[0].databases).toEqual(DATABASES_LIST);
        expect(options.layers[0].database).toEqual(DATABASES.testDatabase2);
        expect(options.layers[0].tables).toEqual(TABLES_LIST);
        expect(options.layers[0].table).toEqual(TABLES.testTable2);
        expect(options.layers[0].fields).toEqual(FIELDS);
        expect(options.layers[0].limit).toEqual(5678);
        expect(options.layers[0].title).toEqual('Test Layer Title');
        expect(options.layers[0].testCustomLayerField).toEqual(FIELD_MAP.DATE);
        expect(options.layers[0].testCustomLayerFieldArray).toEqual([FIELD_MAP.X, FIELD_MAP.Y]);
        expect(options.layers[0].testCustomLayerKey).toEqual('testCustomLayerValue');
    });

    it('addLayer does add a new layer', () => {
        let newLayer = options.addLayer();
        expect(options.layers.length).toEqual(2);
        expect(options.layers[1].title).toEqual('Layer 2');
        expect(options.layers[1].databases).toEqual(DATABASES_LIST);
        expect(options.layers[1].database).toEqual(DATABASES.testDatabase1);
        expect(options.layers[1].tables).toEqual(TABLES_LIST);
        expect(options.layers[1].table).toEqual(TABLES.testTable1);
        expect(options.layers[1].fields).toEqual(FIELDS);
        expect(options.layers[1].testCustomLayerField).toEqual(FieldConfig.get());
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
        expect(options.layers[1].databases).toEqual(DATABASES_LIST);
        expect(options.layers[1].database).toEqual(DATABASES.testDatabase2);
        expect(options.layers[1].tables).toEqual(TABLES_LIST);
        expect(options.layers[1].table).toEqual(TABLES.testTable2);
        expect(options.layers[1].fields).toEqual(FIELDS);
        expect(options.layers[1].limit).toEqual(5678);
        expect(options.layers[1].title).toEqual('Test Layer Title');
        expect(options.layers[1].testCustomLayerField).toEqual(FIELD_MAP.DATE);
        expect(options.layers[1].testCustomLayerFieldArray).toEqual([FIELD_MAP.X, FIELD_MAP.Y]);
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

    beforeEach(() => {
        options = new RootWidgetOptionCollection(DATASET, () => [
            new ConfigOptionFreeText('tableKey', 'Table Key', true, 'datastore1.testDatabase1.testTable1'),
            new ConfigOptionField('testCustomField', 'Test Custom Field', false),
            new ConfigOptionFieldArray('testCustomFieldArray', 'Test Custom Field Array', false),
            new ConfigOptionFreeText('testCustomKey', 'Test Custom Key', false, 'default value')
        ], () => [
            new ConfigOptionFreeText('tableKey', 'Table Key', true, 'datastore1.testDatabase1.testTable1'),
            new ConfigOptionField('testCustomLayerField', 'Test Custom Layer Field', false),
            new ConfigOptionFieldArray('testCustomLayerFieldArray', 'Test Custom Layer Field Array', false),
            new ConfigOptionFreeText('testCustomLayerKey', 'Test Custom Layer Key', false, 'default layer value')
        ], 'Test Title', 100, true);
    });

    it('does have databases, fields, tables, custom properties, and custom layers with default values', () => {
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.database).toEqual(null);
        expect(options.tables).toEqual(TABLES_LIST);
        expect(options.table).toEqual(null);
        expect(options.fields).toEqual(FIELDS);

        expect(options.contributionKeys).toEqual(undefined);
        expect(options.filter).toEqual(undefined);
        expect(options.hideUnfiltered).toEqual(false);
        expect(options.limit).toEqual(100);
        expect(options.title).toEqual('Test Title');

        expect(options.testCustomField).toEqual(FieldConfig.get());
        expect(options.testCustomFieldArray).toEqual([]);
        expect(options.testCustomKey).toEqual('default value');

        expect(options.layers.length).toEqual(1);
        expect(options.layers[0].datastore).toEqual(DATASTORE);
        expect(options.layers[0].databases).toEqual(DATABASES_LIST);
        expect(options.layers[0].database).toEqual(DATABASES.testDatabase1);
        expect(options.layers[0].tables).toEqual(TABLES_LIST);
        expect(options.layers[0].table).toEqual(TABLES.testTable1);
        expect(options.layers[0].fields).toEqual(FIELDS);
        expect(options.layers[0].limit).toEqual(100);
        expect(options.layers[0].title).toEqual('Layer 1');
        expect(options.layers[0].testCustomLayerField).toEqual(FieldConfig.get());
        expect(options.layers[0].testCustomLayerFieldArray).toEqual([]);
        expect(options.layers[0].testCustomLayerKey).toEqual('default layer value');
    });
});

describe('NonPrimitive Fields', () => {
    it('Objects initialize properly', () => {
        const optEmpty = new ConfigOptionNonPrimitive('test', 'Test', false, {}, true);
        expect(optEmpty.valueDefault).toEqual({});
        expect(optEmpty.intermediateValue).toEqual('');
        expect(optEmpty.getValueToSaveInBindings()).toEqual({});

        const optNull = new ConfigOptionNonPrimitive('test', 'Test', false, undefined, true);
        expect(optNull.valueDefault).toEqual(undefined);
        expect(optNull.intermediateValue).toEqual('');
        expect(optNull.getValueToSaveInBindings()).toEqual(undefined);

        const optComplex = new ConfigOptionNonPrimitive('test', 'Test', false, { a: 5, b: [1, 2, { c: 3 }] }, true);
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
        const option = new ConfigOptionNonPrimitive('test', 'Test', false, {}, true);
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
        const optEmpty = new ConfigOptionNumber('test', 'Test', false, 0, true);
        expect(optEmpty.valueDefault).toEqual(0);
        expect(optEmpty.intermediateValue).toEqual('');
        expect(optEmpty.getValueToSaveInBindings()).toEqual(0);

        const optNull = new ConfigOptionNumber('test', 'Test', false, undefined, true);
        expect(optNull.valueDefault).toEqual(undefined);
        expect(optNull.intermediateValue).toEqual('');
        expect(optNull.getValueToSaveInBindings()).toEqual(undefined);
    });

    it('Object updates properly', () => {
        const opt = new ConfigOptionNumber('test', 'Test', false, 0, true);
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
