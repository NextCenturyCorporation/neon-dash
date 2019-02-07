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
import { inject } from '@angular/core/testing';

import { AggregationType, BoolFilterType, SortOrder, TimeInterval } from './abstract.search.service';
import { ConnectionService } from './connection.service';
import { SearchService, GroupWrapper, QueryWrapper, WhereWrapper } from './search.service';

import { initializeTestBed } from '../../testUtils/initializeTestBed';

import * as neon from 'neon-framework';

describe('Service: Search', () => {
    initializeTestBed({
        providers: [
            SearchService,
            ConnectionService
        ]
    });

    it('buildBoolFilterClause does return expected filter clause', inject([SearchService], (service: SearchService) => {
        expect(service.buildBoolFilterClause([
            new WhereWrapper(neon.query.where('field1', '=', 'value1')),
            new WhereWrapper(neon.query.where('field2', '=', 'value2'))
        ])).toEqual(new WhereWrapper(neon.query.and.apply(neon.query, [
            neon.query.where('field1', '=', 'value1'),
            neon.query.where('field2', '=', 'value2')
        ])));

        expect(service.buildBoolFilterClause([
            new WhereWrapper(neon.query.where('field1', '=', 'value1')),
            new WhereWrapper(neon.query.where('field2', '=', 'value2'))
        ], BoolFilterType.OR)).toEqual(new WhereWrapper(neon.query.or.apply(neon.query, [
            neon.query.where('field1', '=', 'value1'),
            neon.query.where('field2', '=', 'value2')
        ])));

        expect(service.buildBoolFilterClause([
            new WhereWrapper(neon.query.where('field1', '=', 'value1')),
            new WhereWrapper(neon.query.or.apply(neon.query, [
                neon.query.where('field2', '=', 'value2'),
                neon.query.where('field3', '=', 'value3')
            ]))
        ])).toEqual(new WhereWrapper(neon.query.and.apply(neon.query, [
            neon.query.where('field1', '=', 'value1'),
            neon.query.or.apply(neon.query, [
                neon.query.where('field2', '=', 'value2'),
                neon.query.where('field3', '=', 'value3')
            ])
        ])));
    }));

    it('buildBoolFilterClause does not wrap single filter clause', inject([SearchService], (service: SearchService) => {
        expect(service.buildBoolFilterClause([new WhereWrapper(neon.query.where('field', '=', 'value'))])).toEqual(
            new WhereWrapper(neon.query.where('field', '=', 'value')));
    }));

    it('buildDateQueryGroup does return expected query group', inject([SearchService], (service: SearchService) => {
        expect(service.buildDateQueryGroup('groupField', TimeInterval.MINUTE)).toEqual(new GroupWrapper(
            new neon.query.GroupByFunctionClause('minute', 'groupField', '_minute')));
        expect(service.buildDateQueryGroup('groupField', TimeInterval.HOUR)).toEqual(new GroupWrapper(
            new neon.query.GroupByFunctionClause('hour', 'groupField', '_hour')));
        expect(service.buildDateQueryGroup('groupField', TimeInterval.DAY_OF_MONTH)).toEqual(new GroupWrapper(
            new neon.query.GroupByFunctionClause('dayOfMonth', 'groupField', '_dayOfMonth')));
        expect(service.buildDateQueryGroup('groupField', TimeInterval.MONTH)).toEqual(new GroupWrapper(
            new neon.query.GroupByFunctionClause('month', 'groupField', '_month')));
        expect(service.buildDateQueryGroup('groupField', TimeInterval.YEAR)).toEqual(new GroupWrapper(
            new neon.query.GroupByFunctionClause('year', 'groupField', '_year')));
    }));

    it('buildFilterClause does return expected filter clause', inject([SearchService], (service: SearchService) => {
        expect(service.buildFilterClause('field', '=', 'value')).toEqual(new WhereWrapper(neon.query.where('field', '=', 'value')));
    }));

    it('buildQueryGroup does return expected query group', inject([SearchService], (service: SearchService) => {
        expect(service.buildQueryGroup('groupField')).toEqual(new GroupWrapper('groupField'));
    }));

    it('buildQueryPayload does return expected query payload', inject([SearchService], (service: SearchService) => {
        expect(service.buildQueryPayload('database', 'table')).toEqual(new QueryWrapper(new neon.query.Query().selectFrom('database',
            'table')));

        expect(service.buildQueryPayload('database', 'table', ['field'])).toEqual(new QueryWrapper(new neon.query.Query().selectFrom(
            'database', 'table').withFields(['field'])));

        expect(service.buildQueryPayload('database', 'table', ['field1', 'field2'])).toEqual(new QueryWrapper(new neon.query.Query()
            .selectFrom('database', 'table').withFields(['field1', 'field2'])));

        expect(service.buildQueryPayload('database', 'table', [])).toEqual(new QueryWrapper(new neon.query.Query().selectFrom('database',
            'table')));
    }));

    it('canRunSearch does return false with no active connection', inject([ConnectionService, SearchService],
        (connectionService: ConnectionService, service: SearchService
    ) => {

        let spy = spyOn(connectionService, 'createActiveConnection').and.returnValue(null);

        expect(service.canRunSearch('type', 'host')).toEqual(false);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['type', 'host']);
    }));

    it('canRunSearch does return true with active connection', inject([ConnectionService, SearchService],
        (connectionService: ConnectionService, service: SearchService
    ) => {

        let spy = spyOn(connectionService, 'createActiveConnection').and.returnValue({});

        expect(service.canRunSearch('type', 'host')).toEqual(true);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['type', 'host']);
    }));

    it('runSearch does call expected function', inject([ConnectionService, SearchService], (connectionService: ConnectionService,
        service: SearchService
    ) => {

        let queryPayload = new QueryWrapper(new neon.query.Query());
        let called = 0;
        let spy = spyOn(connectionService, 'createActiveConnection').and.returnValue({
            executeQuery: (query, options) => {
                expect(query).toEqual(queryPayload.query);
                called++;
            }
        });

        service.runSearch('type', 'host', queryPayload);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['type', 'host']);
        expect(called).toEqual(1);
    }));

    it('transformFilterClauseValues does work as expected', inject([SearchService], (service: SearchService) => {
        let map = {
            field: {
                newValue: 'oldValue'
            }
        };

        let input1 = new neon.query.Query().where(neon.query.where('field', '=', 'oldValue'));
        service.transformFilterClauseValues(new QueryWrapper(input1), {});
        expect(input1).toEqual(new neon.query.Query().where(neon.query.where('field', '=', 'oldValue')));

        let input2 = new neon.query.Query().where(neon.query.where('field', '=', 'oldValue'));
        service.transformFilterClauseValues(new QueryWrapper(input2), map);
        expect(input2).toEqual(new neon.query.Query().where(neon.query.where('field', '=', 'newValue')));

        let input3 = new neon.query.Query().where(neon.query.where('field', '=', 'otherValue'));
        service.transformFilterClauseValues(new QueryWrapper(input3), map);
        expect(input3).toEqual(new neon.query.Query().where(neon.query.where('field', '=', 'otherValue')));

        let input4 = new neon.query.Query().where(neon.query.where('otherField', '=', 'oldValue'));
        service.transformFilterClauseValues(new QueryWrapper(input4), map);
        expect(input4).toEqual(new neon.query.Query().where(neon.query.where('otherField', '=', 'oldValue')));
    }));

    it('transformFilterClauseValues does work as expected with bool filter', inject([SearchService], (service: SearchService) => {
        let map = {
            field1: {
                newValue1: 'oldValue1'
            },
            field2: {
                newValue2: 'oldValue2',
                newValue3: 'oldValue3'
            }
        };

        let input = new neon.query.Query().where(neon.query.and.apply(neon.query, [
            neon.query.where('field1', '=', 'oldValue1'),
            neon.query.where('field1', '=', 'oldValue2'),
            neon.query.where('field2', '=', 'oldValue2'),
            neon.query.where('field2', '=', 'oldValue3'),
            neon.query.or.apply(neon.query, [
                neon.query.where('field1', '=', 'oldValue1'),
                neon.query.where('field1', '=', 'oldValue2'),
                neon.query.where('field2', '=', 'oldValue2'),
                neon.query.where('field2', '=', 'oldValue3')
            ])
        ]));
        service.transformFilterClauseValues(new QueryWrapper(input), map);
        expect(input).toEqual(new neon.query.Query().where(neon.query.and.apply(neon.query, [
            neon.query.where('field1', '=', 'newValue1'),
            neon.query.where('field1', '=', 'oldValue2'),
            neon.query.where('field2', '=', 'newValue2'),
            neon.query.where('field2', '=', 'newValue3'),
            neon.query.or.apply(neon.query, [
                neon.query.where('field1', '=', 'newValue1'),
                neon.query.where('field1', '=', 'oldValue2'),
                neon.query.where('field2', '=', 'newValue2'),
                neon.query.where('field2', '=', 'newValue3')
            ])
        ])));
    }));

    it('updateAggregation does update given query payload and does not remove previous aggregations', inject([SearchService],
        (service: SearchService
    ) => {
        let input: neon.query.Query = new neon.query.Query();

        service.updateAggregation(new QueryWrapper(input), AggregationType.AVG, '_avg', 'field');
        expect(input).toEqual(new neon.query.Query().aggregate('avg', 'field', '_avg'));

        service.updateAggregation(new QueryWrapper(input), AggregationType.COUNT, '_count', '*');
        expect(input).toEqual(new neon.query.Query().aggregate('avg', 'field', '_avg').aggregate('count', '*', '_count'));
    }));

    it('updateFieldsToMatchAll does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: neon.query.Query = new neon.query.Query();
        input.withFields(['field']);

        service.updateFieldsToMatchAll(new QueryWrapper(input));
        expect(input).toEqual(new neon.query.Query());
    }));

    it('updateFilter does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: neon.query.Query = new neon.query.Query();

        service.updateFilter(new QueryWrapper(input), new WhereWrapper(neon.query.where('field1', '=', 'value1')));
        expect(input).toEqual(new neon.query.Query().where(neon.query.where('field1', '=', 'value1')));

        service.updateFilter(new QueryWrapper(input), new WhereWrapper(neon.query.or.apply(neon.query, [
            neon.query.where('field2', '=', 'value2'), neon.query.where('field3', '=', 'value3')
        ])));
        expect(input).toEqual(new neon.query.Query().where(neon.query.or.apply(neon.query, [
            neon.query.where('field2', '=', 'value2'), neon.query.where('field3', '=', 'value3')
        ])));
    }));

    it('updateGroups does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: neon.query.Query = new neon.query.Query();

        service.updateGroups(new QueryWrapper(input), [new GroupWrapper('group1')]);
        expect(input).toEqual(new neon.query.Query().groupBy(['group1']));

        service.updateGroups(new QueryWrapper(input), [new GroupWrapper('group2'), new GroupWrapper('group3')]);
        expect(input).toEqual(new neon.query.Query().groupBy(['group2', 'group3']));
    }));

    it('updateLimit does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: neon.query.Query = new neon.query.Query();

        service.updateLimit(new QueryWrapper(input), 0);
        expect(input).toEqual(new neon.query.Query().limit(0));

        service.updateLimit(new QueryWrapper(input), 100);
        expect(input).toEqual(new neon.query.Query().limit(100));
    }));

    it('updateOffset does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: neon.query.Query = new neon.query.Query();

        service.updateOffset(new QueryWrapper(input), 0);
        expect(input).toEqual(new neon.query.Query().offset(0));

        service.updateOffset(new QueryWrapper(input), 100);
        expect(input).toEqual(new neon.query.Query().offset(100));
    }));

    it('updateSort does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: neon.query.Query = new neon.query.Query();

        service.updateSort(new QueryWrapper(input), 'sortField');
        expect(input).toEqual(new neon.query.Query().sortBy('sortField', 1));

        service.updateSort(new QueryWrapper(input), 'sortField', SortOrder.DESCENDING);
        expect(input).toEqual(new neon.query.Query().sortBy('sortField', -1));
    }));
});
