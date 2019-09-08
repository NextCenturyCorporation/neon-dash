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
    Dataset,
    FieldKey,
    NeonDatastoreConfig,
    NeonDatabaseMetaData,
    NeonFieldMetaData,
    NeonTableMetaData
} from '../app/models/dataset';

export const FIELD_MAP = {
    CATEGORY: NeonFieldMetaData.get({ columnName: 'testCategoryField', prettyName: 'Test Category Field', type: 'string' }),
    DATE: NeonFieldMetaData.get({ columnName: 'testDateField', prettyName: 'Test Date Field', type: 'date' }),
    FIELD_KEY: NeonFieldMetaData.get({ columnName: 'testFieldKeyField', prettyName: 'Test Field Key Field', type: 'string' }),
    FILTER: NeonFieldMetaData.get({ columnName: 'testFilterField', prettyName: 'Test Filter Field', type: 'string' }),
    ID: NeonFieldMetaData.get({ columnName: 'testIdField', prettyName: 'Test ID Field', type: 'string' }),
    LINK: NeonFieldMetaData.get({ columnName: 'testLinkField', prettyName: 'Test Link Field', type: 'string' }),
    NAME: NeonFieldMetaData.get({ columnName: 'testNameField', prettyName: 'Test Name Field', type: 'string' }),
    RELATION_A: NeonFieldMetaData.get({ columnName: 'testRelationFieldA', prettyName: 'Test Relation Field A', type: 'string' }),
    RELATION_B: NeonFieldMetaData.get({ columnName: 'testRelationFieldB', prettyName: 'Test Relation Field B', type: 'string' }),
    SIZE: NeonFieldMetaData.get({ columnName: 'testSizeField', prettyName: 'Test Size Field', type: 'float' }),
    SORT: NeonFieldMetaData.get({ columnName: 'testSortField', prettyName: 'Test Sort Field', type: 'string' }),
    TEXT: NeonFieldMetaData.get({ columnName: 'testTextField', prettyName: 'Test Text Field', type: 'string' }),
    TYPE: NeonFieldMetaData.get({ columnName: 'testTypeField', prettyName: 'Test Type Field', type: 'string' }),
    X: NeonFieldMetaData.get({ columnName: 'testXField', prettyName: 'Test X Field', type: 'float' }),
    Y: NeonFieldMetaData.get({ columnName: 'testYField', prettyName: 'Test Y Field', type: 'float' }),
    ES_ID: NeonFieldMetaData.get({ columnName: '_id', prettyName: '_id' })
};

// Keep in alphabetical order.
export const FIELDS: NeonFieldMetaData[] = Object.values(FIELD_MAP);

export const TABLES = {
    testTable1: NeonTableMetaData.get({ name: 'testTable1', prettyName: 'Test Table 1', fields: FIELDS }),
    testTable2: NeonTableMetaData.get({ name: 'testTable2', prettyName: 'Test Table 2', fields: FIELDS })
};

export const TABLES_LIST = [TABLES.testTable1, TABLES.testTable2];

export const DATABASES = {
    testDatabase1: NeonDatabaseMetaData.get({
        name: 'testDatabase1',
        prettyName: 'Test Database 1',
        tables: TABLES
    }),
    testDatabase2: NeonDatabaseMetaData.get({
        name: 'testDatabase2',
        prettyName: 'Test Database 2',
        tables: TABLES
    })
};

export const DATABASES_LIST = [DATABASES.testDatabase1, DATABASES.testDatabase2];

export const DATASTORE: NeonDatastoreConfig = NeonDatastoreConfig.get({
    name: 'datastore1',
    host: 'testHostname',
    type: 'testDatastore',
    databases: DATABASES,
    hasUpdatedFields: true
});

export const TABLE_KEYS: Record<string, string> = {
    table_key_1: 'datastore1.testDatabase1.testTable1',
    table_key_2: 'datastore1.testDatabase2.testTable2'
};

export const FIELD_KEYS: Record<string, string> = {
    field_key_1: 'datastore1.testDatabase1.testTable1.testFieldKeyField'
};

const RELATIONS: string[][][] = [
    [
        [
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.RELATION_A.columnName
        ],
        [
            DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' + FIELD_MAP.RELATION_A.columnName
        ]
    ],
    [
        [
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.RELATION_B.columnName
        ],
        [
            DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' + FIELD_MAP.RELATION_B.columnName
        ]
    ]
];

export const DATASET: Dataset = new Dataset({ datastore1: DATASTORE }, null, null, RELATIONS, TABLE_KEYS, FIELD_KEYS);

