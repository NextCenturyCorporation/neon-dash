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
import * as neon from 'neon-framework';

import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../app/dataset';
import { DatasetService } from '../../app/services/dataset.service';
import { NeonGTDConfig } from '../../app/neon-gtd-config';

export class DatasetServiceMock extends DatasetService {
    public static CATEGORY_FIELD = new FieldMetaData('testCategoryField', 'Test Category Field', false, 'string');
    public static DATE_FIELD = new FieldMetaData('testDateField', 'Test Date Field', false, 'date');
    public static FILTER_FIELD = new FieldMetaData('testFilterField', 'Test Filter Field', false, 'string');
    public static ID_FIELD = new FieldMetaData('testIdField', 'Test ID Field', false, 'string');
    public static LINK_FIELD = new FieldMetaData('testLinkField', 'Test Link Field', false, 'string');
    public static NAME_FIELD = new FieldMetaData('testNameField', 'Test Name Field', false, 'string');
    public static RELATION_FIELD_A = new FieldMetaData('testRelationFieldA', 'Test Relation Field A', false, 'string');
    public static RELATION_FIELD_B = new FieldMetaData('testRelationFieldB', 'Test Relation Field B', false, 'string');
    public static SIZE_FIELD = new FieldMetaData('testSizeField', 'Test Size Field', false, 'float');
    public static SORT_FIELD = new FieldMetaData('testSortField', 'Test Sort Field', false, 'string');
    public static TEXT_FIELD = new FieldMetaData('testTextField', 'Test Text Field', false, 'string');
    public static TYPE_FIELD = new FieldMetaData('testTypeField', 'Test Type Field', false, 'string');
    public static X_FIELD = new FieldMetaData('testXField', 'Test X Field', false, 'float');
    public static Y_FIELD = new FieldMetaData('testYField', 'Test Y Field', false, 'float');
    public static ES_ID_FIELD = new FieldMetaData('_id', '_id', false, '');

    // Keep in alphabetical order.
    public static FIELDS: FieldMetaData[] = [
        DatasetServiceMock.CATEGORY_FIELD,
        DatasetServiceMock.DATE_FIELD,
        DatasetServiceMock.FILTER_FIELD,
        DatasetServiceMock.ID_FIELD,
        DatasetServiceMock.LINK_FIELD,
        DatasetServiceMock.NAME_FIELD,
        DatasetServiceMock.RELATION_FIELD_A,
        DatasetServiceMock.RELATION_FIELD_B,
        DatasetServiceMock.SIZE_FIELD,
        DatasetServiceMock.SORT_FIELD,
        DatasetServiceMock.TEXT_FIELD,
        DatasetServiceMock.TYPE_FIELD,
        DatasetServiceMock.X_FIELD,
        DatasetServiceMock.Y_FIELD,
        DatasetServiceMock.ES_ID_FIELD
    ];

    public static TABLES: TableMetaData[] = [
        new TableMetaData('testTable1', 'Test Table 1', DatasetServiceMock.FIELDS),
        new TableMetaData('testTable2', 'Test Table 2', DatasetServiceMock.FIELDS)
    ];

    public static DATABASES: DatabaseMetaData[] = [
        new DatabaseMetaData('testDatabase1', 'Test Database 1', DatasetServiceMock.TABLES),
        new DatabaseMetaData('testDatabase2', 'Test Database 2', DatasetServiceMock.TABLES)
    ];

    constructor() {
        super(new NeonGTDConfig());
        this.setActiveDataset({
            databases: DatasetServiceMock.DATABASES,
            relations: [{
                members: [{
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testRelationFieldA'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testRelationFieldA'
                }]
            }, {
                members: [{
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testRelationFieldB'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testRelationFieldB'
                }]
            }]
        });
    }
}
