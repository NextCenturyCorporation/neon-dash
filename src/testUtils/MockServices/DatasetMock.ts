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
    // Keep in alphabetical order.
    public static FIELDS: FieldMetaData[] = [
        new FieldMetaData('testColorField', 'Test Color Field'),
        new FieldMetaData('testDateField', 'Test Date Field'),
        new FieldMetaData('testIdField', 'Test ID Field'),
        new FieldMetaData('testLatitudeField', 'Test Latitude Field'),
        new FieldMetaData('testLinkField', 'Test Link Field'),
        new FieldMetaData('testLongitudeField', 'Test Longitude Field'),
        new FieldMetaData('testSizeField', 'Test Size Field')
    ];

    constructor() {
        super(new NeonGTDConfig());
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [new TableMetaData('testTable', 'Test Table', DatasetMock.FIELDS)];
        this.setActiveDataset({
            databases: [testDatabase]
        });
    }
}
