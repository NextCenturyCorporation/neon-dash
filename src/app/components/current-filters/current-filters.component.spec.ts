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

import * as moment from 'moment';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrentFiltersComponent, FilterDisplayUtil } from './current-filters.component';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { DatasetService } from '../../services/dataset.service';
import { FilterService, SimpleFilter, CompoundFilter, AbstractFilter } from '../../services/filter.service';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { CurrentFiltersModule } from './current-filters.module';
import { ConfigService } from '../../services/config.service';
import { CompoundFilterType } from '../../services/abstract.search.service';
import { SearchService } from '../../services/search.service';

describe('Component: CurrentFiltersComponent', () => {
    let fixture: ComponentFixture<CurrentFiltersComponent>;
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: CurrentFiltersComponent;
    const search = new SearchService();

    function simple(field: string, op: string, value: any) {
        const out = new SimpleFilter('store',
            {
                name: 'base',
                prettyName: 'Base',
                tables: []
            },
            {
                name: 'table',
                prettyName: 'Table',
                fields: [],
                mappings: {},
                labelOptions: {}
            },
            {
                hide: false,
                columnName: field.toLowerCase(),
                prettyName: field.toUpperCase(),
                type: value instanceof Date ? 'date' : typeof value === 'number' ? 'double' : typeof value
            },
            op,
            value,
            search);
        return out;
    }

    function and(...filters: AbstractFilter[]) {
        return new CompoundFilter(
            CompoundFilterType.AND,
            filters,
            search
        );
    }

    initializeTestBed('Current Filters', {
        providers: [
            DatasetService,
            FilterService,
            { provide: ConfigService, useValue: ConfigService.as(testConfig) }
        ],
        imports: [CurrentFiltersModule]
    });

    it('should create an instance', (() => {
        fixture = TestBed.createComponent(CurrentFiltersComponent);
        component = fixture.componentInstance;
        expect(component).toBeTruthy();
    }));

    it('Simple computeFilter Should Produce Meaningful Text', (() => {
        const eqs = FilterDisplayUtil.computeFilter(
            simple('field', '=', 'value')
        );
        expect(eqs).toBeTruthy();
        expect(eqs.field).toEqual('FIELD');
        expect(eqs.text).toEqual('FIELD value');

        const neqs = FilterDisplayUtil.computeFilter(
            simple('field', '!=', 'value')
        );
        expect(neqs).toBeTruthy();
        expect(neqs.field).toEqual('FIELD');
        expect(neqs.text).toEqual('FIELD != value');
    }));

    it('Date computeFilter Should Produce Meaningful Text', (() => {
        const now = new Date();

        const before = FilterDisplayUtil.computeFilter(
            simple('date', '<=', now)
        );
        expect(before).toBeTruthy();
        expect(before.field).toEqual('DATE');
        expect(before.text).toEqual(`DATE before ${moment(now).format('YYYY-MM-DD')}`);

        const after = FilterDisplayUtil.computeFilter(
            simple('date', '>=', now)
        );
        expect(after).toBeTruthy();
        expect(after.field).toEqual('DATE');
        expect(after.text).toEqual(`DATE after ${moment(now).format('YYYY-MM-DD')}`);

        const range = FilterDisplayUtil.computeFilter(
            and(simple('date', '<=', now), simple('date', '>=', now))
        );

        expect(range.field).toEqual('DATE');
        expect(range.text).toEqual(`DATE between ${moment(now).format('YYYY-MM-DD')} and ${moment(now).format('YYYY-MM-DD')}`);
    }));

    it('Geo computeFilter Should Produce Meaningful Text', (() => {
        const point = FilterDisplayUtil.computeFilter(
            and(
                simple('loc.lat', '=', 5.0),
                simple('loc.lon', '=', 5.0)
            )
        );
        expect(point).toBeTruthy();
        expect(point.field).toEqual('LOC');
        expect(point.text).toEqual('LOC at (5.000, 5.000)');

        const area = FilterDisplayUtil.computeFilter(
            and(
                simple('loc.lat', '=', 5.0),
                simple('loc.lon', '=', 5.0),
                simple('loc.lat', '=', 15.0),
                simple('loc.lon', '=', 15.0)
            )
        );

        expect(area.field).toEqual('LOC');
        expect(area.text).toEqual('LOC from (5.000, 5.000) to (15.000, 15.000)');
    }));
});
