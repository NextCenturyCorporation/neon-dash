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

export class DatasetMock extends DatasetService {
    public static COLOR_FIELD = new FieldMetaData('testColorField', 'Test Color Field');
    public static DATE_FIELD = new FieldMetaData('testDateField', 'Test Date Field');
    public static GROUP_FIELD = new FieldMetaData('testGroupField', 'Test Group Field');
    public static ID_FIELD = new FieldMetaData('testIdField', 'Test ID Field');
    public static LATITUDE_FIELD = new FieldMetaData('testLatitudeField', 'Test Latitude Field');
    public static LINK_FIELD = new FieldMetaData('testLinkField', 'Test Link Field');
    public static LONGITUDE_FIELD = new FieldMetaData('testLongitudeField', 'Test Longitude Field');
    public static NAME_FIELD = new FieldMetaData('testNameField', 'Test Name Field');
    public static SIZE_FIELD = new FieldMetaData('testSizeField', 'Test Size Field');
    public static TYPE_FIELD = new FieldMetaData('testTypeField', 'Test Type Field');

    // Keep in alphabetical order.
    public static FIELDS: FieldMetaData[] = [
        DatasetMock.COLOR_FIELD,
        DatasetMock.DATE_FIELD,
        DatasetMock.GROUP_FIELD,
        DatasetMock.ID_FIELD,
        DatasetMock.LATITUDE_FIELD,
        DatasetMock.LINK_FIELD,
        DatasetMock.LONGITUDE_FIELD,
        DatasetMock.NAME_FIELD,
        DatasetMock.SIZE_FIELD,
        DatasetMock.TYPE_FIELD
    ];

    public static TABLES: TableMetaData[] = [
        new TableMetaData('testTable1', 'Test Table 1', DatasetMock.FIELDS),
        new TableMetaData('testTable2', 'Test Table 2', DatasetMock.FIELDS)
    ];

    public static DATABASES: DatabaseMetaData[] = [
        new DatabaseMetaData('testDatabase1', 'Test Database 1', DatasetMock.TABLES),
        new DatabaseMetaData('testDatabase2', 'Test Database 2', DatasetMock.TABLES)
    ];

    constructor() {
        super(new NeonGTDConfig());
        this.setActiveDataset({
            databases: DatasetMock.DATABASES
        });
    }
}
