/*
 * Copyright 2016 Next Century Corporation
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
import { Inject, Injectable } from '@angular/core';
import { URLSearchParams } from '@angular/http';
import * as neon from 'neon-framework';
import * as $ from 'jquery';

import { Dataset, DatasetOptions, DatabaseMetaData, TableMetaData, TableMappings, FieldMetaData } from '../dataset';
import { ConnectionService } from './connection.service';
import { DatasetService } from './dataset.service';
import { Subscription, Observable } from 'rxjs/Rx';
import { NeonGTDConfig } from '../neon-gtd-config';
import { neonMappings } from '../neon-namespaces';
import * as _ from 'lodash';

@Injectable()
export class FilterService {
    addFilter(messenger: neon.eventing.Messenger, database: DatabaseMetaData, table: TableMetaData, fields: FieldMetaData,
        callback: (resp: any) => any, filterName: string, nextFunction: (resp: any) => any, lastFunctino: (resp: any) => any) {

    };

    getFilterState(successHandler: (resp: any) => any, errorHandler: (resp: any) => any) {

    };
}
