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
import { CompoundFilterType } from '../models/widget-option';
import {
    CompoundFilterDesign,
    FilterDataSource,
    FilterDesign,
    FilterUtil,
    SimpleFilterDesign
} from '../util/filter.util';
import { FilterChangeListener, FilterService } from './filter.service';

import { DATABASES, DATASET, DATASTORE, FIELD_MAP, TABLES } from '../../testUtils/mock-dataset';

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
    let design1A: SimpleFilterDesign;
    let design1B: SimpleFilterDesign;
    let design2A: CompoundFilterDesign;
    let filter1A: any;
    let filter1B: any;
    let filter2A: any;
    let relationSource1: FilterDataSource[];
    let relationSource2: FilterDataSource[];
    let relationDesign1: SimpleFilterDesign;
    let relationDesign2: SimpleFilterDesign;
    let relationFilter1: any;
    let relationFilter2: any;

    beforeEach(() => {
        filterService = new FilterService();

        source1 = [{
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];
        source2 = [{
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.SIZE.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.SIZE.columnName,
            operator: '<'
        } as FilterDataSource];

        design1A = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.ID,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign;
        design1B = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.ID,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterDesign;
        design2A = {
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1,
                table: TABLES.testTable1,
                field: FIELD_MAP.SIZE,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1,
                table: TABLES.testTable1,
                field: FIELD_MAP.SIZE,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        filter1A = FilterUtil.createFilterFromDesign(design1A);
        filter1B = FilterUtil.createFilterFromDesign(design1B);
        filter2A = FilterUtil.createFilterFromDesign(design2A);

        design1A.id = filter1A.id;
        design1B.id = filter1B.id;
        design2A.id = filter2A.id;
        design2A.filters[0].id = filter2A.filters[0].id;
        design2A.filters[1].id = filter2A.filters[1].id;

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
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.RELATION_A.columnName,
            operator: '='
        } as FilterDataSource];
        relationSource2 = [{
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.RELATION_B.columnName,
            operator: '='
        } as FilterDataSource];

        relationDesign1 = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testRelation'
        } as SimpleFilterDesign;
        relationDesign2 = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testRelation'
        } as SimpleFilterDesign;

        relationFilter1 = FilterUtil.createFilterFromDesign(relationDesign1);
        relationFilter2 = FilterUtil.createFilterFromDesign(relationDesign2);
        relationFilter1.relations = [relationFilter2.id];
        relationFilter2.relations = [relationFilter1.id];

        relationDesign1.id = relationFilter1.id;
        relationDesign2.id = relationFilter2.id;
    };

    let findRelationDataList = () => [[[{
        datastore: DATASTORE.name,
        database: DATABASES.testDatabase1,
        table: TABLES.testTable1,
        field: FIELD_MAP.RELATION_A
    }], [{
        datastore: DATASTORE.name,
        database: DATABASES.testDatabase1,
        table: TABLES.testTable1,
        field: FIELD_MAP.RELATION_B
    }]]];

    it('should have expected properties', () => {
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1, source2]);
        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['_listeners']).toEqual(new Map<string, FilterChangeListener>());
        expect(filterService['_notifier'].toString()).toEqual(filterService.notifyFilterChangeListeners.bind(filterService).toString());
    });

    it('deleteFilter should delete filter and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilter('testCaller', design1A);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('deleteFilter should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilter('testCaller', relationDesign1);

        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
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

        let actual = filterService.deleteFilters('testCaller', [design1A]);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('deleteFilters should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilters('testCaller', [relationDesign1]);

        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('deleteFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilters('testCaller', [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.TEXT,
            operator: '='
        } as SimpleFilterDesign]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, [{
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource]]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('exchangeFilters should add new filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.exchangeFilters('testCaller', [testDesign], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should delete old filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.ID,
            operator: '=',
            value: 'testId5'
        } as SimpleFilterDesign;

        let actual = filterService.exchangeFilters('testCaller', [testDesign], []);

        let listComplete = filterService['filterCollection'].getFilters(source1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.ID);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testId5');

        testDesign.id = listComplete[0].id;

        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([testDesign]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [relationDesign1], findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.RELATION_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign1.id = listComplete[0].id;

        listComplete = filterService['filterCollection'].getFilters(relationSource2) as any[]; // TODO: Typings;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.RELATION_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign2.id = listComplete[0].id;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should also delete old relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let testDesign2 = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testExchangeRelation'
        } as SimpleFilterDesign;

        let actual = filterService.exchangeFilters('testCaller', [testDesign2], findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.RELATION_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testExchangeRelation');

        let testDesign1 = {
            id: listComplete[0].id,
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testExchangeRelation'
        } as SimpleFilterDesign;

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.RELATION_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testExchangeRelation');

        testDesign2.id = listComplete[0].id;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign1]);
        expect(actual.get(keys[3])).toEqual([testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters with filter-list-to-delete should delete argument filters', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [], [], [design1A]);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters with filter-list-to-delete should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [], [], [relationDesign1]);

        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('getFilters should return expected array', () => {
        expect(filterService.getFilters()).toEqual([design1A, design1B, design2A]);
        expect(filterService.getFilters(source1)).toEqual([design1A, design1B]);
        expect(filterService.getFilters(source2)).toEqual([design2A]);
        expect(filterService.getFilters([{
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource])).toEqual([]);
    });

    it('getFiltersToSaveInConfig should return expected array', () => {
        expect(filterService.getFiltersToSaveInConfig()).toEqual([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        }, {
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            }, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            }]
        }]);
    });

    it('getFiltersToSearch should return expected array', () => {
        expect(filterService.getFiltersToSearch('fakeDatastore1', 'testDatabase1', 'testTable1')).toEqual([]);
        expect(filterService.getFiltersToSearch('datastore1', 'fakeDatabase1', 'testTable1')).toEqual([]);
        expect(filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'fakeTable1')).toEqual([]);

        let filters = filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1');
        expect(filters.map((filter) => {
            let design = filter.toDesign();
            delete design.id;
            return design;
        })).toEqual([{
            type: CompoundFilterType.OR,
            filters: [filter1A.toDesign(), filter1B.toDesign()]
        }, {
            type: CompoundFilterType.OR,
            filters: [filter2A.toDesign()]
        }]);
    });

    it('getFiltersToSearch with filter-list-to-ignore should return expected array', () => {
        let filters1 = filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1', [design1A]);
        expect(filters1.map((filter) => {
            let design = filter.toDesign();
            delete design.id;
            return design;
        })).toEqual([{
            type: CompoundFilterType.OR,
            filters: [filter2A.toDesign()]
        }]);

        let filters2 = filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1', [design1B]);
        expect(filters2.map((filter) => {
            let design = filter.toDesign();
            delete design.id;
            return design;
        })).toEqual([{
            type: CompoundFilterType.OR,
            filters: [filter2A.toDesign()]
        }]);

        let filters3 = filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1', [design2A]);
        expect(filters3.map((filter) => {
            let design = filter.toDesign();
            delete design.id;
            return design;
        })).toEqual([{
            type: CompoundFilterType.OR,
            filters: [filter1A.toDesign(), filter1B.toDesign()]
        }]);

        expect(filterService.getFiltersToSearch('datastore1', 'testDatabase1', 'testTable1', [design1A, design2A])).toEqual([]);
    });

    it('notifyFilterChangeListeners does call each listener callback function', () => {
        let calledA = 0;
        let calledB = 0;

        const expectedCallerId = 'testCaller';
        const expectedChangeCollection = new Map<FilterDataSource[], FilterDesign[]>();

        const listenerA = (callerId: string, changeCollection: Map<FilterDataSource[], FilterDesign[]>) => {
            expect(callerId).toBe(expectedCallerId);
            expect(changeCollection).toBe(expectedChangeCollection);
            calledA++;
        };

        const listenerB = (callerId: string, changeCollection: Map<FilterDataSource[], FilterDesign[]>) => {
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
        const notifier = (__callerId: string, __changeCollection: Map<FilterDataSource[], FilterDesign[]>) => {
            // Do nothing.
        };

        filterService.overrideFilterChangeNotifier(notifier);

        expect(filterService['_notifier']).toBe(notifier);
    });

    it('registerFilterChangeListener does update _listeners', () => {
        const listener = (__callerId: string, __changeCollection: Map<FilterDataSource[], FilterDesign[]>) => {
            // Do nothing.
        };

        filterService['_listeners'] = new Map<string, FilterChangeListener>();

        filterService.registerFilterChangeListener('testIdA', listener);

        expect(filterService['_listeners'].get('testIdA')).toBe(listener);
        expect(filterService['_listeners'].get('testIdB')).toBe(undefined);
    });

    it('retrieveCompatibleFilterCollection should return expected filter collection', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let testCollection = filterService.retrieveCompatibleFilterCollection([design1A]);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B]);
    });

    it('retrieveCompatibleFilterCollection should copy multiple filters if multiple designs have compatible filters', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let testCollection = filterService.retrieveCompatibleFilterCollection([design1A, design2A]);

        expect(testCollection.getDataSources()).toEqual([source1, source2]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(testCollection.getFilters(source2)).toEqual([filter2A]);
    });

    it('retrieveCompatibleFilterCollection should not copy the same filters if designs have the same data source', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let testDesign = {
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1,
                table: TABLES.testTable1,
                field: FIELD_MAP.ID,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let testCollection = filterService.retrieveCompatibleFilterCollection([design1A, testDesign]);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B]);
    });

    it('retrieveCompatibleFilterCollection should do nothing with no compatible filters', () => {
        let testDesign = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.TEXT,
            operator: '='
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let testCollection = filterService.retrieveCompatibleFilterCollection([testDesign]);

        expect(testCollection.getDataSources()).toEqual([testSource]);
        expect(testCollection.getFilters(testSource)).toEqual([]);
    });

    it('setFiltersFromConfig should change filterCollection', () => {
        let actual;

        filterService.setFiltersFromConfig([], DATASET);
        expect(filterService['filterCollection'].getDataSources()).toEqual([]);

        filterService.setFiltersFromConfig([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }], DATASET);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(1);
        expect(actual[0].database).toEqual(DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(TABLES.testTable1);
        expect(actual[0].field).toEqual(FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');

        filterService.setFiltersFromConfig([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId3'
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId4'
        }], DATASET);
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

        filterService.setFiltersFromConfig([{
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            }, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            }]
        }], DATASET);
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

        filterService.setFiltersFromConfig([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        }, {
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            }, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            }]
        }], DATASET);
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

        let testDesign = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.ID,
            operator: '=',
            value: 'testId5'
        } as SimpleFilterDesign;

        let actual = filterService.toggleFilters('testCaller', [testDesign], []);

        let listComplete = filterService['filterCollection'].getFilters(source1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(3);
        expect(listComplete[0]).toEqual(filter1A);
        expect(listComplete[1]).toEqual(filter1B);
        expect(listComplete[2].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[2].table).toEqual(TABLES.testTable1);
        expect(listComplete[2].field).toEqual(FIELD_MAP.ID);
        expect(listComplete[2].operator).toEqual('=');
        expect(listComplete[2].value).toEqual('testId5');

        testDesign.id = listComplete[2].id;

        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, testDesign]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should add new filters to a new data source and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should delete old argument filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [design1A], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should add new argument filters, delete old argument filters, and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: DATASTORE.name,
            databaseName: DATABASES.testDatabase1.name,
            tableName: TABLES.testTable1.name,
            fieldName: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign, design1A], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [relationDesign1], findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.RELATION_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign1.id = listComplete[0].id;

        listComplete = filterService['filterCollection'].getFilters(relationSource2) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(TABLES.testTable1);
        expect(listComplete[0].field).toEqual(FIELD_MAP.RELATION_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign2.id = listComplete[0].id;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should keep old relation filters and add new relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let testDesign2 = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        let actual = filterService.toggleFilters('testCaller', [testDesign2], findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter1);
        expect(listComplete[1].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[1].table).toEqual(TABLES.testTable1);
        expect(listComplete[1].field).toEqual(FIELD_MAP.RELATION_A);
        expect(listComplete[1].operator).toEqual('=');
        expect(listComplete[1].value).toEqual('testToggleRelation');

        let testDesign1 = {
            id: listComplete[1].id,
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter2);
        expect(listComplete[1].database).toEqual(DATABASES.testDatabase1);
        expect(listComplete[1].table).toEqual(TABLES.testTable1);
        expect(listComplete[1].field).toEqual(FIELD_MAP.RELATION_B);
        expect(listComplete[1].operator).toEqual('=');
        expect(listComplete[1].value).toEqual('testToggleRelation');

        testDesign2.id = listComplete[1].id;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1, testDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2, testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should also delete old relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [relationDesign1], findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should keep non-argument relation filters and delete argument relation filters', () => {
        activateRelationFilters();

        let testDesign1 = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;
        let testDesign2 = {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1,
            field: FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        let testFilter1 = FilterUtil.createFilterFromDesign(testDesign1);
        let testFilter2 = FilterUtil.createFilterFromDesign(testDesign2);
        testFilter1.relations = [testFilter2.id];
        testFilter2.relations = [testFilter1.id];

        testDesign1.id = testFilter1.id;
        testDesign2.id = testFilter2.id;

        filterService['filterCollection'].setFilters(relationSource1, [relationFilter1, testFilter1]);
        filterService['filterCollection'].setFilters(relationSource2, [relationFilter2, testFilter2]);

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [relationDesign1], findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([testFilter1]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([testFilter2]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign1]);
        expect(actual.get(keys[3])).toEqual([testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('unregisterFilterChangeListener does update _listeners', () => {
        const listener = (__callerId: string, __changeCollection: Map<FilterDataSource[], FilterDesign[]>) => {
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

