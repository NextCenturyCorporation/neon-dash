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
import { Dashboard, DashboardOptions, DatabaseMetaData, Datastore, FieldMetaData, TableMetaData } from '../../app/types';
import { DashboardService } from '../../app/services/dashboard.service';
import { NeonGTDConfig } from '../../app/neon-gtd-config';
import { ConfigService } from '../../app/services/config.service';
import { ConnectionService } from '../../app/services/connection.service';

class MockConnectionService extends ConnectionService {
    public connect(__datastoreType: string, __datastoreHost: string) {
        return null as any;
    }
}

export class DashboardServiceMock extends DashboardService {
    public static CATEGORY_FIELD = new FieldMetaData('testCategoryField', 'Test Category Field', false, 'string');
    public static DATE_FIELD = new FieldMetaData('testDateField', 'Test Date Field', false, 'date');
    public static FIELD_KEY_FIELD = new FieldMetaData('testFieldKeyField', 'Test Field Key Field', false, 'string');
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

    public static TABLES: TableMetaData[] = [
        new TableMetaData('testTable1', 'Test Table 1', DashboardServiceMock.FIELDS),
        new TableMetaData('testTable2', 'Test Table 2', DashboardServiceMock.FIELDS)
    ];

    public static DATABASES: DatabaseMetaData[] = [
        new DatabaseMetaData('testDatabase1', 'Test Database 1', DashboardServiceMock.TABLES),
        new DatabaseMetaData('testDatabase2', 'Test Database 2', DashboardServiceMock.TABLES)
    ];

    constructor() {
        super(new ConfigService(null).set(new NeonGTDConfig()), new MockConnectionService());
        let datastore: Datastore = new Datastore('datastore1', 'testHostname', 'testDatastore');
        datastore.databases = DashboardServiceMock.DATABASES;
        datastore.hasUpdatedFields = true;
        this.dataset = datastore;
        this.datasets = [datastore];

        let dashboard: Dashboard = new Dashboard();

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
        dashboard.options = new DashboardOptions();
        this.setCurrentDashboard(dashboard);
    }
}
