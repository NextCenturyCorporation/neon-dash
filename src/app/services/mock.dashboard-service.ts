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
import { NeonDashboardLeafConfig } from '../models/types';
import { DashboardService } from './dashboard.service';
import { ConfigService } from './config.service';
import { InjectableConnectionService } from './injectable.connection.service';
import { Injectable } from '@angular/core';
import { InjectableFilterService } from './injectable.filter.service';
import {
    DATABASES,
    DATABASES_LIST,
    DATASTORE,
    FIELD_KEYS,
    FIELD_MAP,
    FIELDS,
    TABLE_KEYS,
    TABLES,
    TABLES_LIST
} from 'nucleus/dist/core/models/mock.dataset';

export class ConnectionServiceMock extends InjectableConnectionService {
    public connect(__datastoreType: string, __datastoreHost: string) {
        return null as any;
    }
}

@Injectable()
export class DashboardServiceMock extends DashboardService {
    public static FIELD_MAP = FIELD_MAP;
    public static FIELDS = FIELDS;
    public static TABLES = TABLES;
    public static TABLES_LIST = TABLES_LIST;
    public static DATABASES = DATABASES;
    public static DATABASES_LIST = DATABASES_LIST;
    public static DATASTORE = DATASTORE;

    static init(svc: DashboardServiceMock) {
        svc.config.fileName = '-';

        svc.setActiveDatastores([DATASTORE]);

        const dashboard = NeonDashboardLeafConfig.get({
            name: 'Test Discovery Config',
            layout: 'DISCOVERY',
            tables: TABLE_KEYS,
            fields: FIELD_KEYS,
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

        svc.setActiveDashboard(dashboard);
    }

    constructor(configService: ConfigService) {
        super(
            configService,
            new ConnectionServiceMock(),
            new InjectableFilterService()
        );

        DashboardServiceMock.init(this);
    }
}

@Injectable()
export class EmptyDashboardServiceMock extends DashboardService {
    constructor(configService: ConfigService) {
        super(
            configService,
            new ConnectionServiceMock(),
            new InjectableFilterService()
        );
    }
}
