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
import {
    NeonConfig, NeonDatastoreConfig, NeonDashboardConfig,
    NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData, NeonDashboardLeafConfig
} from '../../app/model/types';
import { DashboardService } from '../../app/services/dashboard.service';
import { ConfigService } from '../../app/services/config.service';
import { ConnectionService } from '../../app/services/connection.service';
import { Injectable } from '@angular/core';

class MockConnectionService extends ConnectionService {
    public connect(__datastoreType: string, __datastoreHost: string) {
        return null as any;
    }
}

@Injectable()
export class DashboardServiceMock extends DashboardService {
    public static FIELD_MAP = {
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
    public static FIELDS: NeonFieldMetaData[] = Object.values(DashboardServiceMock.FIELD_MAP);

    public static TABLES = {
        testTable1: NeonTableMetaData.get({ name: 'testTable1', prettyName: 'Test Table 1', fields: DashboardServiceMock.FIELDS }),
        testTable2: NeonTableMetaData.get({ name: 'testTable2', prettyName: 'Test Table 2', fields: DashboardServiceMock.FIELDS })
    };

    public static TABLES_LIST = [DashboardServiceMock.TABLES.testTable1, DashboardServiceMock.TABLES.testTable2];

    public static DATABASES = {
        testDatabase1: NeonDatabaseMetaData.get({
            name: 'testDatabase1',
            prettyName: 'Test Database 1',
            tables: DashboardServiceMock.TABLES
        }),
        testDatabase2: NeonDatabaseMetaData.get({
            name: 'testDatabase2',
            prettyName: 'Test Database 2',
            tables: DashboardServiceMock.TABLES
        })
    };

    public static DATABASES_LIST = [DashboardServiceMock.DATABASES.testDatabase1, DashboardServiceMock.DATABASES.testDatabase2];

    constructor(configService: ConfigService) {
        super(
            configService,
            new MockConnectionService()
        );

        const datastore = NeonDatastoreConfig.get({
            name: 'datastore1',
            host: 'testHostname',
            type: 'testDatastore',
            databases: DashboardServiceMock.DATABASES,
            hasUpdatedFields: true
        });

        this.setActiveDatastore(datastore);

        const dashboard = NeonDashboardLeafConfig.get({
            name: 'Test Discovery Config',
            layout: 'DISCOVERY',

            tables: {
                table_key_1: 'datastore1.testDatabase1.testTable1',
                table_key_2: 'datastore1.testDatabase2.testTable2'
            },
            fields: {
                field_key_1: 'datastore1.testDatabase1.testTable1.testFieldKeyField'
            },
            visualizationTitles: {
                dataTableTitle: 'Documents'
            },
            relations: [
                ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
                [
                    ['datastore1.testDatabase1.testTable1.testRelationFieldB'],
                    ['datastore1.testDatabase2.testTable2.testRelationFieldB']
                ]
            ]
        });

        this.setActiveDashboard(dashboard);
    }
}
