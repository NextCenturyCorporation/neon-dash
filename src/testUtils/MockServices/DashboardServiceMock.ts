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
import { Dashboard, NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData } from '../../app/types';
import { DashboardService } from '../../app/services/dashboard.service';
import { NeonConfig, NeonDatastoreConfig } from '../../app/types';
import { ConfigService } from '../../app/services/config.service';
import { ConnectionService } from '../../app/services/connection.service';

class MockConnectionService extends ConnectionService {
    public connect(__datastoreType: string, __datastoreHost: string) {
        return null as any;
    }
}

export class DashboardServiceMock extends DashboardService {
    public static CATEGORY_FIELD = NeonFieldMetaData.get({ columnName: 'testCategoryField', prettyName: 'Test Category Field', hide: false, type: 'string' });
    public static DATE_FIELD = NeonFieldMetaData.get({ columnName: 'testDateField', prettyName: 'Test Date Field', hide: false, type: 'date' });
    public static FIELD_KEY_FIELD = NeonFieldMetaData.get({ columnName: 'testFieldKeyField', prettyName: 'Test Field Key Field', hide: false, type: 'string' });
    public static FILTER_FIELD = NeonFieldMetaData.get({ columnName: 'testFilterField', prettyName: 'Test Filter Field', hide: false, type: 'string' });
    public static ID_FIELD = NeonFieldMetaData.get({ columnName: 'testIdField', prettyName: 'Test ID Field', hide: false, type: 'string' });
    public static LINK_FIELD = NeonFieldMetaData.get({ columnName: 'testLinkField', prettyName: 'Test Link Field', hide: false, type: 'string' });
    public static NAME_FIELD = NeonFieldMetaData.get({ columnName: 'testNameField', prettyName: 'Test Name Field', hide: false, type: 'string' });
    public static RELATION_FIELD_A = NeonFieldMetaData.get({ columnName: 'testRelationFieldA', prettyName: 'Test Relation Field A', hide: false, type: 'string' });
    public static RELATION_FIELD_B = NeonFieldMetaData.get({ columnName: 'testRelationFieldB', prettyName: 'Test Relation Field B', hide: false, type: 'string' });
    public static SIZE_FIELD = NeonFieldMetaData.get({ columnName: 'testSizeField', prettyName: 'Test Size Field', hide: false, type: 'float' });
    public static SORT_FIELD = NeonFieldMetaData.get({ columnName: 'testSortField', prettyName: 'Test Sort Field', hide: false, type: 'string' });
    public static TEXT_FIELD = NeonFieldMetaData.get({ columnName: 'testTextField', prettyName: 'Test Text Field', hide: false, type: 'string' });
    public static TYPE_FIELD = NeonFieldMetaData.get({ columnName: 'testTypeField', prettyName: 'Test Type Field', hide: false, type: 'string' });
    public static X_FIELD = NeonFieldMetaData.get({ columnName: 'testXField', prettyName: 'Test X Field', hide: false, type: 'float' });
    public static Y_FIELD = NeonFieldMetaData.get({ columnName: 'testYField', prettyName: 'Test Y Field', hide: false, type: 'float' });
    public static ES_ID_FIELD = NeonFieldMetaData.get({ columnName: '_id', prettyName: '_id' });

    // Keep in alphabetical order.
    public static FIELDS: NeonFieldMetaData[] = [
        DashboardServiceMock.CATEGORY_FIELD,
        DashboardServiceMock.DATE_FIELD,
        DashboardServiceMock.FIELD_KEY_FIELD,
        DashboardServiceMock.FILTER_FIELD,
        DashboardServiceMock.ID_FIELD,
        DashboardServiceMock.LINK_FIELD,
        DashboardServiceMock.NAME_FIELD,
        DashboardServiceMock.RELATION_FIELD_A,
        DashboardServiceMock.RELATION_FIELD_B,
        DashboardServiceMock.SIZE_FIELD,
        DashboardServiceMock.SORT_FIELD,
        DashboardServiceMock.TEXT_FIELD,
        DashboardServiceMock.TYPE_FIELD,
        DashboardServiceMock.X_FIELD,
        DashboardServiceMock.Y_FIELD,
        DashboardServiceMock.ES_ID_FIELD
    ];

    public static TABLES = {
        testTable1: NeonTableMetaData.get({ name: 'testTable1', prettyName: 'Test Table 1', fields: DashboardServiceMock.FIELDS }),
        testTable2: NeonTableMetaData.get({ name: 'testTable2', prettyName: 'Test Table 2', fields: DashboardServiceMock.FIELDS })
    };

    public static TABLES_LIST = [DashboardServiceMock.TABLES.testTable1, DashboardServiceMock.TABLES.testTable2];

    public static DATABASES = {
        testDatabase1: NeonDatabaseMetaData.get({ name: 'testDatabase1', prettyName: 'Test Database 1', tables: DashboardServiceMock.TABLES }),
        testDatabase2: NeonDatabaseMetaData.get({ name: 'testDatabase2', prettyName: 'Test Database 2', tables: DashboardServiceMock.TABLES })
    };

    public static DATABASES_LIST = [DashboardServiceMock.DATABASES.testDatabase1, DashboardServiceMock.DATABASES.testDatabase2];

    constructor() {
        super(new ConfigService(null).set(NeonConfig.get()), new MockConnectionService());
        let datastore = NeonDatastoreConfig.get({ name: 'datastore1', host: 'testHostname', type: 'testDatastore' });
        datastore.databases = DashboardServiceMock.DATABASES;
        datastore['hasUpdatedFields'] = true;
        this.setActiveDatastore(datastore);
        this.addDatastore(datastore);

        let dashboard = Dashboard.get();

        let dashboardTableKeys: { [key: string]: string } = {};
        dashboardTableKeys.table_key_1 = 'datastore1.testDatabase1.testTable1';
        dashboardTableKeys.table_key_2 = 'datastore1.testDatabase2.testTable2';
        dashboard.tables = dashboardTableKeys;

        let dashboardFieldKeys: { [key: string]: string } = {};
        dashboardFieldKeys.field_key_1 = 'datastore1.testDatabase1.testTable1.testFieldKeyField';
        dashboard.fields = dashboardFieldKeys;

        let visTitles: { [key: string]: string } = {};
        visTitles.dataTableTitle = 'Documents';
        dashboard.visualizationTitles = visTitles;

        dashboard.relations = [
            ['datastore1.testDatabase1.testTable1.testRelationFieldA', 'datastore1.testDatabase2.testTable2.testRelationFieldA'],
            [
                ['datastore1.testDatabase1.testTable1.testRelationFieldB'],
                ['datastore1.testDatabase2.testTable2.testRelationFieldB']
            ]
        ];

        dashboard.name = 'Test Discovery Config';
        dashboard.layout = 'DISCOVERY';
        dashboard.options = {};

        this.setActiveDashboard(dashboard);
    }
}
