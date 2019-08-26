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

import { CompoundFilter, CompoundFilterDesign, FilterUtil, SimpleFilter, SimpleFilterDesign } from '../util/filter.util';
import { CompoundFilterType } from '../models/widget-option';
import { CompoundFilterConfig, FilterDataSource, FilterConfig, SimpleFilterConfig } from '../models/filter';
import { Dataset } from '../models/dataset';
import { FilterChangeListener, FilterService } from './filter.service';

import { DATABASES, DATASET, DATASTORE, FIELD_MAP, TABLES } from '../../testUtils/mock-dataset';
import * as _ from 'lodash';

describe('FilterService with no filters', () => {
    let filterService: FilterService;

    beforeEach(() => {
        filterService = new FilterService();
    });

    it('should have expected properties with no filters', () => {
        expect(filterService['filterCollection']).toBeDefined();
        expect((filterService['filterCollection'])['data'].size).toEqual(0);
        expect(filterService['_listeners']).toEqual(new Map<string, FilterChangeListener>());
        expect(filterService['_notifier'].toString()).toEqual(filterService.notifyFilterChangeListeners.bind(filterService).toString());
    });

    it('getFilters with no filters should return expected array', () => {
        expect(filterService.getFilters()).toEqual([]);
    });
});

describe('FilterService with filters', () => {
    let filterService: FilterService;
    let source1: FilterDataSource[];
    let source2: FilterDataSource[];
    let config1A: SimpleFilterConfig;
    let config1B: SimpleFilterConfig;
    let config2A: CompoundFilterConfig;
    let filter1A: any;
    let filter1B: any;
    let filter2A: any;
    let relationSource1: FilterDataSource[];
    let relationSource2: FilterDataSource[];
    let relationConfig1: SimpleFilterConfig;
    let relationConfig2: SimpleFilterConfig;
    let relationFilter1: any;
    let relationFilter2: any;
    let dataset: Dataset;

    beforeEach(() => {
        filterService = new FilterService();
        dataset = _.cloneDeep(DATASET);
        dataset.relations = [[[{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.RELATION_A.columnName
        }], [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.RELATION_B.columnName
        }]]];

        source1 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];
        source2 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '<'
        } as FilterDataSource];

        config1A = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.ID.columnName,
            '=', 'testId1');
        config1B = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.ID.columnName,
            '=', 'testId2');
        config2A = new CompoundFilterDesign(CompoundFilterType.AND, [
            new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.SIZE.columnName, '>',
                10),
            new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.SIZE.columnName, '<',
                20)
        ]);

        filter1A = FilterUtil.createFilterFromConfig(config1A, dataset);
        filter1B = FilterUtil.createFilterFromConfig(config1B, dataset);
        filter2A = FilterUtil.createFilterFromConfig(config2A, dataset);

        config1A.id = filter1A.id;
        config1B.id = filter1B.id;
        config2A.id = filter2A.id;
        config2A.filters[0].id = filter2A.filters[0].id;
        config2A.filters[1].id = filter2A.filters[1].id;

        filterService['filterCollection'].setFilters(source1, [filter1A, filter1B]);
        filterService['filterCollection'].setFilters(source2, [filter2A]);
    });

    afterEach(() => {
        // Services are not recreated in each test so we must reset the internal data.
        (filterService['filterCollection'])['data'].clear();
    });

    /**
     * Generates test relation filters and activates them in the FilterService.
     */
    let activateRelationFilters = () => {
        generateRelationFilters();
        filterService['filterCollection'].setFilters(relationSource1, [relationFilter1]);
        filterService['filterCollection'].setFilters(relationSource2, [relationFilter2]);
    };

    /**
     * Generates test relation filters.
     */
    let generateRelationFilters = () => {
        relationSource1 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.RELATION_A.columnName,
            operator: '='
        } as FilterDataSource];
        relationSource2 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.RELATION_B.columnName,
            operator: '='
        } as FilterDataSource];

        relationConfig1 = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.RELATION_A.columnName, '=', 'testRelation');
        relationConfig2 = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.RELATION_B.columnName, '=', 'testRelation');

        relationFilter1 = FilterUtil.createFilterFromConfig(relationConfig1, dataset);
        relationFilter2 = FilterUtil.createFilterFromConfig(relationConfig2, dataset);
        relationFilter1.relations = [relationFilter2.id];
        relationFilter2.relations = [relationFilter1.id];

        relationConfig1.id = relationFilter1.id;
        relationConfig2.id = relationFilter2.id;
    };

    it('should have expected properties', () => {
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1, source2]);
        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['_listeners']).toEqual(new Map<string, FilterChangeListener>());
        expect(filterService['_notifier'].toString()).toEqual(filterService.notifyFilterChangeListeners.bind(filterService).toString());
    });

    it('deleteFilter should delete filter and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilter('testCaller', config1A);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('deleteFilter should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilter('testCaller', relationConfig1);

        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('deleteFilters should delete all filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilters('testCaller');

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('deleteFilters with filter-list-to-delete should delete argument filters', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilters('testCaller', [config1A]);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([config2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('deleteFilters should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilters('testCaller', [relationConfig1]);

        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('deleteFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilters('testCaller', [new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name,
            TABLES.testTable1.name, FIELD_MAP.TEXT.columnName, '=')]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource]]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('exchangeFilters should add new filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testConfig = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.TEXT.columnName, '=', 'testText');

        let testSource = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.exchangeFilters('testCaller', [testConfig], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.TEXT);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testText');

        testConfig.id = listComplete[0].id;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([testConfig]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should delete old filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testConfig = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.ID.columnName, '=', 'testId5');

        let actual = filterService.exchangeFilters('testCaller', [testConfig], dataset);

        let listComplete = filterService['filterCollection'].getFilters(source1);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.ID);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testId5');

        testConfig.id = listComplete[0].id;

        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([testConfig]);
        expect(actual.get(keys[1])).toEqual([config2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [relationConfig1], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.RELATION_A);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testRelation');

        relationConfig1.id = listComplete[0].id;

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.RELATION_B);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testRelation');

        relationConfig2.id = listComplete[0].id;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([relationConfig1]);
        expect(actual.get(keys[3])).toEqual([relationConfig2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should also delete old relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let testConfig2 = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.RELATION_B.columnName, '=', 'testExchangeRelation');

        let actual = filterService.exchangeFilters('testCaller', [testConfig2], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.RELATION_A);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testExchangeRelation');

        let testConfig1 = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.RELATION_A.columnName, '=', 'testExchangeRelation', listComplete[0].id);

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.RELATION_B);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testExchangeRelation');

        testConfig2.id = listComplete[0].id;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([testConfig1]);
        expect(actual.get(keys[3])).toEqual([testConfig2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters with filter-list-to-delete should delete argument filters', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [], dataset, [config1A]);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([config2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters with filter-list-to-delete should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [], dataset, [relationConfig1]);

        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('getFilters should return expected array', () => {
        expect(filterService.getFilters()).toEqual([config1A, config1B, config2A]);
        expect(filterService.getFilters(source1)).toEqual([config1A, config1B]);
        expect(filterService.getFilters(source2)).toEqual([config2A]);
        expect(filterService.getFilters([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource])).toEqual([]);
    });

    it('getFiltersToSearch should return expected array', () => {
        expect(filterService.getFiltersToSearch('fakeDatastore1', 'testDatabase1', 'testTable1')).toEqual([]);
        expect(filterService.getFiltersToSearch('datastore1', 'fakeDatabase1', 'testTable1')).toEqual([]);
        expect(filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'fakeTable1')).toEqual([]);

        let filters = filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1');
        expect(filters.map((filter) => {
            let config = filter.toConfig();
            config.id = undefined;
            return config;
        })).toEqual([new CompoundFilterDesign(CompoundFilterType.OR, [filter1A.toConfig(), filter1B.toConfig()]),
            new CompoundFilterDesign(CompoundFilterType.OR, [filter2A.toConfig()])]);
    });

    it('getFiltersToSearch with filter-list-to-ignore should return expected array', () => {
        let filters1 = filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1', [config1A]);
        expect(filters1.map((filter) => {
            let config = filter.toConfig();
            config.id = undefined;
            return config;
        })).toEqual([new CompoundFilterDesign(CompoundFilterType.OR, [filter2A.toConfig()])]);

        let filters2 = filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1', [config1B]);
        expect(filters2.map((filter) => {
            let config = filter.toConfig();
            config.id = undefined;
            return config;
        })).toEqual([new CompoundFilterDesign(CompoundFilterType.OR, [filter2A.toConfig()])]);

        let filters3 = filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1', [config2A]);
        expect(filters3.map((filter) => {
            let config = filter.toConfig();
            config.id = undefined;
            return config;
        })).toEqual([new CompoundFilterDesign(CompoundFilterType.OR, [filter1A.toConfig(), filter1B.toConfig()])]);

        expect(filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1', [config1A, config2A])).toEqual([]);
    });

    it('notifyFilterChangeListeners does call each listener callback function', () => {
        let calledA = 0;
        let calledB = 0;

        const expectedCallerId = 'testCaller';
        const expectedChangeCollection = new Map<FilterDataSource[], FilterConfig[]>();

        const listenerA = (callerId: string, changeCollection: Map<FilterDataSource[], FilterConfig[]>) => {
            expect(callerId).toBe(expectedCallerId);
            expect(changeCollection).toBe(expectedChangeCollection);
            calledA++;
        };

        const listenerB = (callerId: string, changeCollection: Map<FilterDataSource[], FilterConfig[]>) => {
            expect(callerId).toBe(expectedCallerId);
            expect(changeCollection).toBe(expectedChangeCollection);
            calledB++;
        };

        filterService['_listeners'] = new Map<string, FilterChangeListener>();

        filterService['_listeners'].set('testIdA', listenerA);
        filterService['_listeners'].set('testIdB', listenerB);

        filterService.notifyFilterChangeListeners(expectedCallerId, expectedChangeCollection);

        expect(calledA).toBe(1);
        expect(calledB).toBe(1);
    });

    it('overrideFilterChangeNotifier does update _notifier', () => {
        const notifier = (__callerId: string, __changeCollection: Map<FilterDataSource[], FilterConfig[]>) => {
            // Do nothing.
        };

        filterService.overrideFilterChangeNotifier(notifier);

        expect(filterService['_notifier']).toBe(notifier);
    });

    it('registerFilterChangeListener does update _listeners', () => {
        const listener = (__callerId: string, __changeCollection: Map<FilterDataSource[], FilterConfig[]>) => {
            // Do nothing.
        };

        filterService['_listeners'] = new Map<string, FilterChangeListener>();

        filterService.registerFilterChangeListener('testIdA', listener);

        expect(filterService['_listeners'].get('testIdA')).toBe(listener);
        expect(filterService['_listeners'].get('testIdB')).toBe(undefined);
    });

    it('retrieveCompatibleFilterCollection should return expected filter collection', () => {
        // Remove the filter value to make the config compatible with each filter of its data source
        config1A.value = undefined;

        let testCollection = filterService.retrieveCompatibleFilterCollection([config1A]);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B]);
    });

    it('retrieveCompatibleFilterCollection should copy multiple filters if multiple configs have compatible filters', () => {
        // Remove the filter value to make the config compatible with each filter of its data source
        config1A.value = undefined;

        let testCollection = filterService.retrieveCompatibleFilterCollection([config1A, config2A]);

        expect(testCollection.getDataSources()).toEqual([source1, source2]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(testCollection.getFilters(source2)).toEqual([filter2A]);
    });

    it('retrieveCompatibleFilterCollection should not copy the same filters if configs have the same data source', () => {
        // Remove the filter value to make the config compatible with each filter of its data source
        config1A.value = undefined;

        let testConfig = new CompoundFilterDesign(CompoundFilterType.AND, [
            new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.ID.columnName, '=')
        ]);

        let testCollection = filterService.retrieveCompatibleFilterCollection([config1A, testConfig]);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B]);
    });

    it('retrieveCompatibleFilterCollection should do nothing with no compatible filters', () => {
        let testConfig = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.TEXT.columnName, '=');

        let testSource = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let testCollection = filterService.retrieveCompatibleFilterCollection([testConfig]);

        expect(testCollection.getDataSources()).toEqual([testSource]);
        expect(testCollection.getFilters(testSource)).toEqual([]);
    });

    it('setFilters should change filterCollection', () => {
        let actual;

        filterService.setFilters([]);
        expect(filterService['filterCollection'].getDataSources()).toEqual([]);

        filterService.setFilters([
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.ID, '=', 'testId1')
        ]);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(1);
        expect(actual[0].database).toEqual(DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(TABLES.testTable1);
        expect(actual[0].field).toEqual(FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');

        filterService.setFilters([
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.ID, '=', 'testId1'),
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.ID, '=', 'testId2'),
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.ID, '=', 'testId3'),
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.ID, '=', 'testId4')
        ]);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(4);
        expect(actual[0].database).toEqual(DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(TABLES.testTable1);
        expect(actual[0].field).toEqual(FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[1].database).toEqual(DATABASES.testDatabase1);
        expect(actual[1].table).toEqual(TABLES.testTable1);
        expect(actual[1].field).toEqual(FIELD_MAP.ID);
        expect(actual[1].operator).toEqual('=');
        expect(actual[1].value).toEqual('testId2');
        expect(actual[2].database).toEqual(DATABASES.testDatabase1);
        expect(actual[2].table).toEqual(TABLES.testTable1);
        expect(actual[2].field).toEqual(FIELD_MAP.ID);
        expect(actual[2].operator).toEqual('=');
        expect(actual[2].value).toEqual('testId3');
        expect(actual[3].database).toEqual(DATABASES.testDatabase1);
        expect(actual[3].table).toEqual(TABLES.testTable1);
        expect(actual[3].field).toEqual(FIELD_MAP.ID);
        expect(actual[3].operator).toEqual('=');
        expect(actual[3].value).toEqual('testId4');

        filterService.setFilters([
            new CompoundFilter(CompoundFilterType.AND, [
                new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.SIZE, '>', 10),
                new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.SIZE, '<', 20)
            ])
        ]);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source2]);
        actual = filterService['filterCollection'].getFilters(source2);
        expect(actual.length).toEqual(1);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect(actual[0].filters.length).toEqual(2);
        expect(actual[0].filters[0].database).toEqual(DATABASES.testDatabase1);
        expect(actual[0].filters[0].table).toEqual(TABLES.testTable1);
        expect(actual[0].filters[0].field).toEqual(FIELD_MAP.SIZE);
        expect(actual[0].filters[0].operator).toEqual('>');
        expect(actual[0].filters[0].value).toEqual(10);
        expect(actual[0].filters[1].database).toEqual(DATABASES.testDatabase1);
        expect(actual[0].filters[1].table).toEqual(TABLES.testTable1);
        expect(actual[0].filters[1].field).toEqual(FIELD_MAP.SIZE);
        expect(actual[0].filters[1].operator).toEqual('<');
        expect(actual[0].filters[1].value).toEqual(20);

        filterService.setFilters([
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.ID, '=', 'testId1'),
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.ID, '=', 'testId2'),
            new CompoundFilter(CompoundFilterType.AND, [
                new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.SIZE, '>', 10),
                new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.SIZE, '<', 20)
            ])
        ]);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1, source2]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].database).toEqual(DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(TABLES.testTable1);
        expect(actual[0].field).toEqual(FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[1].database).toEqual(DATABASES.testDatabase1);
        expect(actual[1].table).toEqual(TABLES.testTable1);
        expect(actual[1].field).toEqual(FIELD_MAP.ID);
        expect(actual[1].operator).toEqual('=');
        expect(actual[1].value).toEqual('testId2');
        actual = filterService['filterCollection'].getFilters(source2);
        expect(actual.length).toEqual(1);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect(actual[0].filters.length).toEqual(2);
        expect(actual[0].filters[0].database).toEqual(DATABASES.testDatabase1);
        expect(actual[0].filters[0].table).toEqual(TABLES.testTable1);
        expect(actual[0].filters[0].field).toEqual(FIELD_MAP.SIZE);
        expect(actual[0].filters[0].operator).toEqual('>');
        expect(actual[0].filters[0].value).toEqual(10);
        expect(actual[0].filters[1].database).toEqual(DATABASES.testDatabase1);
        expect(actual[0].filters[1].table).toEqual(TABLES.testTable1);
        expect(actual[0].filters[1].field).toEqual(FIELD_MAP.SIZE);
        expect(actual[0].filters[1].operator).toEqual('<');
        expect(actual[0].filters[1].value).toEqual(20);
    });

    it('toggleFilters should add new filters to an existing data source and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testConfig = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.ID.columnName, '=', 'testId5');

        let actual = filterService.toggleFilters('testCaller', [testConfig], dataset);

        let listComplete = filterService['filterCollection'].getFilters(source1);
        expect(listComplete.length).toEqual(3);
        expect(listComplete[0]).toEqual(filter1A);
        expect(listComplete[1]).toEqual(filter1B);
        expect((listComplete[2] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[2] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[2] as SimpleFilter).field).toEqual(FIELD_MAP.ID);
        expect((listComplete[2] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[2] as SimpleFilter).value).toEqual('testId5');

        testConfig.id = listComplete[2].id;

        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B, testConfig]);
        expect(actual.get(keys[1])).toEqual([config2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should add new filters to a new data source and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testConfig = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.TEXT.columnName, '=', 'testText');

        let testSource = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testConfig], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.TEXT);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testText');

        testConfig.id = listComplete[0].id;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([testConfig]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should delete old argument filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [config1A], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should add new argument filters, delete old argument filters, and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testConfig = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.TEXT.columnName, '=', 'testText');

        let testSource = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testConfig, config1A], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.TEXT);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testText');

        testConfig.id = listComplete[0].id;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([testConfig]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [relationConfig1], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.RELATION_A);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testRelation');

        relationConfig1.id = listComplete[0].id;

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(1);
        expect((listComplete[0] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[0] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[0] as SimpleFilter).field).toEqual(FIELD_MAP.RELATION_B);
        expect((listComplete[0] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[0] as SimpleFilter).value).toEqual('testRelation');

        relationConfig2.id = listComplete[0].id;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([relationConfig1]);
        expect(actual.get(keys[3])).toEqual([relationConfig2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should keep old relation filters and add new relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let testConfig2 = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.RELATION_B.columnName, '=', 'testToggleRelation');

        let actual = filterService.toggleFilters('testCaller', [testConfig2], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1);
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter1);
        expect((listComplete[1] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[1] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[1] as SimpleFilter).field).toEqual(FIELD_MAP.RELATION_A);
        expect((listComplete[1] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[1] as SimpleFilter).value).toEqual('testToggleRelation');

        let testConfig1 = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.RELATION_A.columnName, '=', 'testToggleRelation', listComplete[1].id);

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter2);
        expect((listComplete[1] as SimpleFilter).database).toEqual(DATABASES.testDatabase1);
        expect((listComplete[1] as SimpleFilter).table).toEqual(TABLES.testTable1);
        expect((listComplete[1] as SimpleFilter).field).toEqual(FIELD_MAP.RELATION_B);
        expect((listComplete[1] as SimpleFilter).operator).toEqual('=');
        expect((listComplete[1] as SimpleFilter).value).toEqual('testToggleRelation');

        testConfig2.id = listComplete[1].id;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([relationConfig1, testConfig1]);
        expect(actual.get(keys[3])).toEqual([relationConfig2, testConfig2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should also delete old relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [relationConfig1], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should keep non-argument relation filters and delete argument relation filters', () => {
        activateRelationFilters();

        let testConfig1 = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.RELATION_A.columnName, '=', 'testToggleRelation');
        let testConfig2 = new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name,
            FIELD_MAP.RELATION_B.columnName, '=', 'testToggleRelation');

        let testFilter1 = FilterUtil.createFilterFromConfig(testConfig1, dataset);
        let testFilter2 = FilterUtil.createFilterFromConfig(testConfig2, dataset);
        testFilter1.relations = [testFilter2.id];
        testFilter2.relations = [testFilter1.id];

        testConfig1.id = testFilter1.id;
        testConfig2.id = testFilter2.id;

        filterService['filterCollection'].setFilters(relationSource1, [relationFilter1, testFilter1]);
        filterService['filterCollection'].setFilters(relationSource2, [relationFilter2, testFilter2]);

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [relationConfig1], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([testFilter1]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([testFilter2]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);
        expect(actual.get(keys[2])).toEqual([testConfig1]);
        expect(actual.get(keys[3])).toEqual([testConfig2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [], dataset);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([config1A, config1B]);
        expect(actual.get(keys[1])).toEqual([config2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('unregisterFilterChangeListener does update _listeners', () => {
        const listener = (__callerId: string, __changeCollection: Map<FilterDataSource[], FilterConfig[]>) => {
            // Do nothing.
        };

        filterService['_listeners'] = new Map<string, FilterChangeListener>();

        filterService['_listeners'].set('testIdA', listener);
        filterService['_listeners'].set('testIdB', listener);

        filterService.unregisterFilterChangeListener('testIdA');

        expect(filterService['_listeners'].get('testIdA')).toBe(undefined);
        expect(filterService['_listeners'].get('testIdB')).toBe(listener);
    });
});

