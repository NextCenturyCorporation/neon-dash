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

import { AggregationType, CompoundFilterType, SortOrder, TimeInterval } from './abstract.search.service';
import { SearchService, NeonConnection, NeonGroupWrapper, NeonQueryWrapper, NeonWhereWrapper } from './search.service';

import { initializeTestBed } from '../../testUtils/initializeTestBed';

import { query } from 'neon-framework';

describe('Service: Search', () => {
    initializeTestBed('Search Service', {
        providers: [
            SearchService
        ]
    });

    it('buildCompoundFilterClause does return expected filter clause', inject([SearchService], (service: SearchService) => {
        expect(service.buildCompoundFilterClause([
            new NeonWhereWrapper(query.where('field1', '=', 'value1')),
            new NeonWhereWrapper(query.where('field2', '=', 'value2'))
        ])).toEqual(new NeonWhereWrapper(query.and.apply(query, [
            query.where('field1', '=', 'value1'),
            query.where('field2', '=', 'value2')
        ])));

        expect(service.buildCompoundFilterClause([
            new NeonWhereWrapper(query.where('field1', '=', 'value1')),
            new NeonWhereWrapper(query.where('field2', '=', 'value2'))
        ], CompoundFilterType.OR)).toEqual(new NeonWhereWrapper(query.or.apply(query, [
            query.where('field1', '=', 'value1'),
            query.where('field2', '=', 'value2')
        ])));

        expect(service.buildCompoundFilterClause([
            new NeonWhereWrapper(query.where('field1', '=', 'value1')),
            new NeonWhereWrapper(query.or.apply(query, [
                query.where('field2', '=', 'value2'),
                query.where('field3', '=', 'value3')
            ]))
        ])).toEqual(new NeonWhereWrapper(query.and.apply(query, [
            query.where('field1', '=', 'value1'),
            query.or.apply(query, [
                query.where('field2', '=', 'value2'),
                query.where('field3', '=', 'value3')
            ])
        ])));
    }));

    it('buildCompoundFilterClause does not wrap single filter clause', inject([SearchService], (service: SearchService) => {
        expect(service.buildCompoundFilterClause([new NeonWhereWrapper(query.where('field', '=', 'value'))])).toEqual(
            new NeonWhereWrapper(query.where('field', '=', 'value')));
    }));

    it('buildDateQueryGroup does return expected query group', inject([SearchService], (service: SearchService) => {
        expect(service.buildDateQueryGroup('groupField', TimeInterval.MINUTE)).toEqual(new NeonGroupWrapper(
            new query.GroupByFunctionClause('minute', 'groupField', '_minute')));
        expect(service.buildDateQueryGroup('groupField', TimeInterval.HOUR)).toEqual(new NeonGroupWrapper(
            new query.GroupByFunctionClause('hour', 'groupField', '_hour')));
        expect(service.buildDateQueryGroup('groupField', TimeInterval.DAY_OF_MONTH)).toEqual(new NeonGroupWrapper(
            new query.GroupByFunctionClause('dayOfMonth', 'groupField', '_dayOfMonth')));
        expect(service.buildDateQueryGroup('groupField', TimeInterval.MONTH)).toEqual(new NeonGroupWrapper(
            new query.GroupByFunctionClause('month', 'groupField', '_month')));
        expect(service.buildDateQueryGroup('groupField', TimeInterval.YEAR)).toEqual(new NeonGroupWrapper(
            new query.GroupByFunctionClause('year', 'groupField', '_year')));
    }));

    it('buildFilterClause does return expected filter clause', inject([SearchService], (service: SearchService) => {
        expect(service.buildFilterClause('field', '=', 'value')).toEqual(new NeonWhereWrapper(query.where('field', '=', 'value')));
    }));

    it('buildQueryGroup does return expected query group', inject([SearchService], (service: SearchService) => {
        expect(service.buildQueryGroup('groupField')).toEqual(new NeonGroupWrapper('groupField'));
    }));

    it('buildQueryPayload does return expected query payload', inject([SearchService], (service: SearchService) => {
        expect(service.buildQueryPayload('database', 'table')).toEqual(new NeonQueryWrapper(new query.Query().selectFrom('database',
            'table')));

        expect(service.buildQueryPayload('database', 'table', ['field'])).toEqual(new NeonQueryWrapper(new query.Query().selectFrom(
            'database', 'table').withFields(['field'])));

        expect(service.buildQueryPayload('database', 'table', ['field1', 'field2'])).toEqual(new NeonQueryWrapper(new query.Query()
            .selectFrom('database', 'table').withFields(['field1', 'field2'])));

        expect(service.buildQueryPayload('database', 'table', [])).toEqual(new NeonQueryWrapper(new query.Query().selectFrom('database',
            'table')));
    }));

    it('canRunSearch does return false with no active connection', inject([SearchService], (service: SearchService) => {
        let spy = spyOn(service, 'createConnection').and.returnValue(null);

        expect(service.canRunSearch('type', 'host')).toEqual(false);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['type', 'host']);
    }));

    it('canRunSearch does return true with active connection', inject([SearchService], (service: SearchService) => {
        let spy = spyOn(service, 'createConnection').and.returnValue({});

        expect(service.canRunSearch('type', 'host')).toEqual(true);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['type', 'host']);
    }));

    it('createConnection does return a new connection', inject([SearchService], (service: SearchService) => {
        let connection = new query.Connection();
        spyOn((service as any), 'createNeonConnection').and.returnValue(connection);
        let spy = spyOn(connection, 'connect');

        let output = service.createConnection('elasticsearchrest', 'localhost');

        expect(output.connection).toEqual(connection);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['elasticsearchrest', 'localhost']);
    }));

    it('createConnection does return an existing connection', inject([SearchService], (service: SearchService) => {
        let existingNeonConnection = new NeonConnection(new query.Connection());
        (service as any).connections.set('elasticsearchrest', new Map<string, any>());
        (service as any).connections.get('elasticsearchrest').set('localhost', existingNeonConnection);

        let connection = new query.Connection();
        spyOn((service as any), 'createNeonConnection').and.returnValue(connection);
        let spy = spyOn(connection, 'connect');

        let output = service.createConnection('elasticsearchrest', 'localhost');

        expect(output).toEqual(existingNeonConnection);
        expect(spy.calls.count()).toEqual(0);
    }));

    it('runSearch does call expected function', inject([SearchService], (service: SearchService) => {
        let queryPayload = new NeonQueryWrapper(new query.Query());
        let called = 0;
        let spy = spyOn(service, 'createConnection').and.returnValue({
            runSearchQuery: (queryInput, options) => {
                expect(queryInput).toEqual(queryPayload);
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

        let input1 = new query.Query().where(query.where('field', '=', 'oldValue'));
        service.transformFilterClauseValues(new NeonQueryWrapper(input1), {});
        expect(input1).toEqual(new query.Query().where(query.where('field', '=', 'oldValue')));

        let input2 = new query.Query().where(query.where('field', '=', 'oldValue'));
        service.transformFilterClauseValues(new NeonQueryWrapper(input2), map);
        expect(input2).toEqual(new query.Query().where(query.where('field', '=', 'newValue')));

        let input3 = new query.Query().where(query.where('field', '=', 'otherValue'));
        service.transformFilterClauseValues(new NeonQueryWrapper(input3), map);
        expect(input3).toEqual(new query.Query().where(query.where('field', '=', 'otherValue')));

        let input4 = new query.Query().where(query.where('otherField', '=', 'oldValue'));
        service.transformFilterClauseValues(new NeonQueryWrapper(input4), map);
        expect(input4).toEqual(new query.Query().where(query.where('otherField', '=', 'oldValue')));
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

        let input = new query.Query().where(query.and.apply(query, [
            query.where('field1', '=', 'oldValue1'),
            query.where('field1', '=', 'oldValue2'),
            query.where('field2', '=', 'oldValue2'),
            query.where('field2', '=', 'oldValue3'),
            query.or.apply(query, [
                query.where('field1', '=', 'oldValue1'),
                query.where('field1', '=', 'oldValue2'),
                query.where('field2', '=', 'oldValue2'),
                query.where('field2', '=', 'oldValue3')
            ])
        ]));
        service.transformFilterClauseValues(new NeonQueryWrapper(input), map);
        expect(input).toEqual(new query.Query().where(query.and.apply(query, [
            query.where('field1', '=', 'newValue1'),
            query.where('field1', '=', 'oldValue2'),
            query.where('field2', '=', 'newValue2'),
            query.where('field2', '=', 'newValue3'),
            query.or.apply(query, [
                query.where('field1', '=', 'newValue1'),
                query.where('field1', '=', 'oldValue2'),
                query.where('field2', '=', 'newValue2'),
                query.where('field2', '=', 'newValue3')
            ])
        ])));
    }));

    it('updateAggregation does update given query payload and does not remove previous aggregations', inject([SearchService],
        (service: SearchService
    ) => {
        let input: query.Query = new query.Query();

        service.updateAggregation(new NeonQueryWrapper(input), AggregationType.AVG, '_avg', 'field');
        expect(input).toEqual(new query.Query().aggregate('avg', 'field', '_avg'));

        service.updateAggregation(new NeonQueryWrapper(input), AggregationType.COUNT, '_count', '*');
        expect(input).toEqual(new query.Query().aggregate('avg', 'field', '_avg').aggregate('count', '*', '_count'));
    }));

    it('updateFieldsToMatchAll does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: query.Query = new query.Query();
        input.withFields(['field']);

        service.updateFieldsToMatchAll(new NeonQueryWrapper(input));
        expect(input).toEqual(new query.Query());
    }));

    it('updateFilter does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: query.Query = new query.Query();

        service.updateFilter(new NeonQueryWrapper(input), new NeonWhereWrapper(query.where('field1', '=', 'value1')));
        expect(input).toEqual(new query.Query().where(query.where('field1', '=', 'value1')));

        service.updateFilter(new NeonQueryWrapper(input), new NeonWhereWrapper(query.or.apply(query, [
            query.where('field2', '=', 'value2'), query.where('field3', '=', 'value3')
        ])));
        expect(input).toEqual(new query.Query().where(query.or.apply(query, [
            query.where('field2', '=', 'value2'), query.where('field3', '=', 'value3')
        ])));
    }));

    it('updateGroups does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: query.Query = new query.Query();

        service.updateGroups(new NeonQueryWrapper(input), [new NeonGroupWrapper('group1')]);
        expect(input).toEqual(new query.Query().groupBy(['group1']));

        service.updateGroups(new NeonQueryWrapper(input), [new NeonGroupWrapper('group2'), new NeonGroupWrapper('group3')]);
        expect(input).toEqual(new query.Query().groupBy(['group2', 'group3']));
    }));

    it('updateLimit does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: query.Query = new query.Query();

        service.updateLimit(new NeonQueryWrapper(input), 0);
        expect(input).toEqual(new query.Query().limit(0));

        service.updateLimit(new NeonQueryWrapper(input), 100);
        expect(input).toEqual(new query.Query().limit(100));
    }));

    it('updateOffset does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: query.Query = new query.Query();

        service.updateOffset(new NeonQueryWrapper(input), 0);
        expect(input).toEqual(new query.Query().offset(0));

        service.updateOffset(new NeonQueryWrapper(input), 100);
        expect(input).toEqual(new query.Query().offset(100));
    }));

    it('updateSort does update given query payload', inject([SearchService], (service: SearchService) => {
        let input: query.Query = new query.Query();

        service.updateSort(new NeonQueryWrapper(input), 'sortField');
        expect(input).toEqual(new query.Query().sortBy('sortField', 1));

        service.updateSort(new NeonQueryWrapper(input), 'sortField', SortOrder.DESCENDING);
        expect(input).toEqual(new query.Query().sortBy('sortField', -1));
    }));
});
