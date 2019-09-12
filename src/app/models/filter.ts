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
    relations?: string[];
    datastore: string;
    database: string;
    table: string;
    field: string;
    operator: string;
    value?: any;
}

export interface CompoundFilterConfig {
    id?: string;
    relations?: string[];
    type: CompoundFilterType;
    filters: (SimpleFilterConfig | CompoundFilterConfig)[];
}

export type FilterConfig = SimpleFilterConfig | CompoundFilterConfig;

export abstract class FilterValues { }

export class BoundsValues extends FilterValues {
    constructor(
        public begin1: boolean|number|string,
        public begin2: boolean|number|string,
        public field1: string,
        public field2: string,
        public end1: boolean|number|string,
        public end2: boolean|number|string
    ) {
        super();
    }
}

export class CompoundValues extends FilterValues {
    constructor(public type: CompoundFilterType, public nested: FilterValues[]) {
        super();
    }
}

export class DomainValues extends FilterValues {
    constructor(public begin: boolean|number|string|Date, public field: string, public end: boolean|number|string|Date) {
        super();
    }
}

export class ListOfValues extends FilterValues {
    constructor(
        public type: CompoundFilterType,
        public field: string,
        public operator: string,
        public values: (boolean|number|string)[]
    ) {
        super();
    }
}

export class OneValue extends FilterValues {
    constructor(public field: string, public operator: string, public value: boolean|number|string) {
        super();
    }
}

export class PairOfValues extends FilterValues {
    constructor(
        public type: CompoundFilterType,
        public field1: string,
        public field2: string,
        public operator1: string,
        public operator2: string,
        public value1: boolean|number|string,
        public value2: boolean|number|string
    ) {
        super();
    }
}

