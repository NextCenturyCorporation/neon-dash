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

import { CompoundFilterType } from './widget-option';

export interface FilterDataSource {
    datastore: string;
    database: string;
    table: string;
    field: string;
    operator?: string;
}

export interface SimpleFilterConfig {
    id?: string;
    datastore: string;
    database: string;
    table: string;
    field: string;
    operator: string;
    value?: any;
}

export interface CompoundFilterConfig {
    id?: string;
    type: CompoundFilterType;
    filters: (SimpleFilterConfig | CompoundFilterConfig)[];
}

export type FilterConfig = SimpleFilterConfig | CompoundFilterConfig;

export interface BoundsValues {
    begin1: boolean|number|string;
    begin2: boolean|number|string;
    field1: string;
    field2: string;
    end1: boolean|number|string;
    end2: boolean|number|string;
}

export interface DomainValues {
    begin: boolean|number|string|Date;
    field: string;
    end: boolean|number|string|Date;
}

export interface PairOfValues {
    field1: string;
    field2: string;
    operator1: string;
    operator2: string;
    value1: boolean|number|string;
    value2: boolean|number|string;
}

export interface OneValue {
    field: string;
    operator: string;
    value: boolean|number|string;
}

export type FilterValues = BoundsValues | DomainValues | PairOfValues | OneValue;

