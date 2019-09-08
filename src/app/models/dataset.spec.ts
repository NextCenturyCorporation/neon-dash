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
import { Dataset, DatasetUtil } from './dataset';
import { DATABASES, DATASET, DATASTORE, FIELD_MAP, TABLES } from '../../testUtils/mock-dataset';

describe('Dataset Tests', () => {
    it('retrieveMetaDataFromFieldKey does return expected list', () => {
        expect(DATASET.retrieveMetaDataFromFieldKey({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.ID.columnName
        })).toEqual([DATASTORE, DATABASES.testDatabase2, TABLES.testTable2, FIELD_MAP.ID]);
    });

    it('retrieveMetaDataFromFieldKey does work with empty datastore', () => {
        expect(DATASET.retrieveMetaDataFromFieldKey({
            datastore: '',
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.ID.columnName
        })).toEqual([DATASTORE, DATABASES.testDatabase2, TABLES.testTable2, FIELD_MAP.ID]);
    });

    it('dataset constructor does work with relations in string list format', () => {
        const relations = [
            ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
            ['datastore1.testDatabase1.testTable1.testRelationFieldB', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
        ];
        const dataset = new Dataset({ datastore1: DATASTORE }, null, null, relations);
        expect(dataset.getRelations()).toEqual([
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }]
            ],
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }]
            ]
        ]);
    });

    it('setRelations does work with relations in string list format', () => {
        const dataset = new Dataset({ datastore1: DATASTORE });
        const relations = [
            ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
            ['datastore1.testDatabase1.testTable1.testRelationFieldB', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
        ];
        dataset.setRelations(relations);
        expect(dataset.getRelations()).toEqual([
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }]
            ],
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }]
            ]
        ]);
    });

    it('dataset constructor does work with relations in nested list format', () => {
        const relations = [
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldA']
            ],
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase1.testTable1.testRelationFieldB'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        ];
        const dataset = new Dataset({ datastore1: DATASTORE }, null, null, relations);
        expect(dataset.getRelations()).toEqual([
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }]
            ],
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }]
            ]
        ]);
    });

    it('setRelations does work with relations in nested list format', () => {
        const dataset = new Dataset({ datastore1: DATASTORE });
        const relations = [
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldA']
            ],
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase1.testTable1.testRelationFieldB'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        ];
        dataset.setRelations(relations);
        expect(dataset.getRelations()).toEqual([
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }]
            ],
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }]
            ]
        ]);
    });

    it('dataset constructor does work with relations in both single and nested list formats', () => {
        const relations = [
            ['datastore1.testDatabase1.testTable1.testRelationFieldA', ['datastore1.testDatabase2.testTable2.testRelationFieldA']],
            [['datastore1.testDatabase1.testTable1.testRelationFieldB'], 'datastore1.testDatabase2.testTable2.testRelationFieldB']
        ];
        const dataset = new Dataset({ datastore1: DATASTORE }, null, null, relations);
        expect(dataset.getRelations()).toEqual([
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }]
            ],
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }]
            ]
        ]);
    });

    it('setRelations does work with relations in both single and nested list formats', () => {
        const dataset = new Dataset({ datastore1: DATASTORE });
        const relations = [
            ['datastore1.testDatabase1.testTable1.testRelationFieldA', ['datastore1.testDatabase2.testTable2.testRelationFieldA']],
            [['datastore1.testDatabase1.testTable1.testRelationFieldB'], 'datastore1.testDatabase2.testTable2.testRelationFieldB']
        ];
        dataset.setRelations(relations);
        expect(dataset.getRelations()).toEqual([
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_A.columnName
                }]
            ],
            [
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }],
                [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase2.name,
                    table: TABLES.testTable2.name,
                    field: FIELD_MAP.RELATION_B.columnName
                }]
            ]
        ]);
    });

    it('dataset constructor does ignore relations on databases/tables/fields that don\'t exist', () => {
        const relations = [
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
        ];
        const dataset = new Dataset({ datastore1: DATASTORE }, null, null, relations);
        expect(dataset.getRelations()).toEqual([]);
    });

    it('setRelations does ignore relations on databases/tables/fields that don\'t exist', () => {
        const dataset = new Dataset({ datastore1: DATASTORE });
        const relations = [
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
        ];
        dataset.setRelations(relations);
        expect(dataset.getRelations()).toEqual([]);
    });

    it('dataset constructor does ignore relations with unequal numbers of fields', () => {
        const relations = [
            [['datastore1.testDatabase1.testTable1.testRelationFieldA'], []],
            [[], ['datastore1.testDatabase2.testTable2.testRelationFieldA']],
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase1.testTable1.testRelationFieldB'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldA']
            ],
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        ];
        const dataset = new Dataset({ datastore1: DATASTORE }, null, null, relations);
        expect(dataset.getRelations()).toEqual([]);
    });

    it('setRelations does ignore relations with unequal numbers of fields', () => {
        const dataset = new Dataset({ datastore1: DATASTORE });
        const relations = [
            [['datastore1.testDatabase1.testTable1.testRelationFieldA'], []],
            [[], ['datastore1.testDatabase2.testTable2.testRelationFieldA']],
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase1.testTable1.testRelationFieldB'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldA']
            ],
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        ];
        dataset.setRelations(relations);
        expect(dataset.getRelations()).toEqual([]);
    });
});

describe('Dataset Util Tests', () => {
    it('deconstructTableOrFieldKeySafely should work as expected', () => {
        expect(DatasetUtil.deconstructTableOrFieldKeySafely(null)).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('')).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a')).toEqual({
            datastore: 'a',
            database: '',
            table: '',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a.b')).toEqual({
            datastore: 'a',
            database: 'b',
            table: '',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a.b.c')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('...d')).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: 'd'
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a.b.c.d')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd'
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a.b.c.d.e.f')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd.e.f'
        });
    });

    it('deconstructTableOrFieldKeySafely with key map should work as expected', () => {
        const keyMap = {
            key1: 'a.b.c',
            key2: 'a.b.c.d',
            key3: 'a.b.c.d.e.f'
        };

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('key1', keyMap)).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('key2', keyMap)).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd'
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('key3', keyMap)).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd.e.f'
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('w.x.y.z', keyMap)).toEqual({
            datastore: 'w',
            database: 'x',
            table: 'y',
            field: 'z'
        });
    });

    it('deconstructTableOrFieldKey should work as expected', () => {
        expect(DatasetUtil.deconstructTableOrFieldKey(null)).toEqual(null);
        expect(DatasetUtil.deconstructTableOrFieldKey('')).toEqual(null);
        expect(DatasetUtil.deconstructTableOrFieldKey('a')).toEqual(null);
        expect(DatasetUtil.deconstructTableOrFieldKey('a.b')).toEqual(null);
        expect(DatasetUtil.deconstructTableOrFieldKey('...d')).toEqual(null);

        expect(DatasetUtil.deconstructTableOrFieldKey('a.b.c')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKey('a.b.c.d')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd'
        });

        expect(DatasetUtil.deconstructTableOrFieldKey('a.b.c.d.e.f')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd.e.f'
        });
    });

    it('translateFieldKeyToFieldName does return expected string', () => {
        const keyMap = {
            key1: 'a.b.c',
            key2: 'a.b.c.d',
            key3: 'a.b.c.d.e.f'
        };

        expect(DatasetUtil.translateFieldKeyToFieldName('key2', keyMap)).toEqual('d');
        expect(DatasetUtil.translateFieldKeyToFieldName('key3', keyMap)).toEqual('d.e.f');
        expect(DatasetUtil.translateFieldKeyToFieldName('w.x.y.z', keyMap)).toEqual('z');
        expect(DatasetUtil.translateFieldKeyToFieldName('testFieldName', keyMap)).toEqual('testFieldName');
    });
});
