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
import { inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AbstractSearchService, CompoundFilterType } from './abstract.search.service';
import {
    CompoundFilterDesign,
    FilterBehavior,
    FilterCollection,
    FilterDataSource,
    FilterDesign,
    FilterUtil,
    SimpleFilterDesign
} from '../util/filter.util';
import { DashboardService } from './dashboard.service';
import { FilterChangeListener, FilterService } from './filter.service';

import { DashboardServiceMock } from '../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

describe('FilterService with no filters', () => {
    let filterService: FilterService;

    initializeTestBed('Filter Service with no filters', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: FilterService, useClass: FilterService },
            { provide: AbstractSearchService, useClass: SearchServiceMock }

        ],
        imports: [
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(inject([FilterService], (_filterService) => {
        filterService = _filterService;
    }));

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
    let datasetService: DashboardService;
    let filterService: FilterService;
    let searchService: AbstractSearchService;
    let source1: FilterDataSource[];
    let source2: FilterDataSource[];
    let design1A: SimpleFilterDesign;
    let design1B: SimpleFilterDesign;
    let design1C: SimpleFilterDesign;
    let design1D: SimpleFilterDesign;
    let design2A: CompoundFilterDesign;
    let filter1A: any;
    let filter1B: any;
    let filter1C: any;
    let filter1D: any;
    let filter2A: any;
    let relationSource1: FilterDataSource[];
    let relationSource2: FilterDataSource[];
    let relationDesign1: SimpleFilterDesign;
    let relationDesign2: SimpleFilterDesign;
    let relationFilter1: any;
    let relationFilter2: any;

    initializeTestBed('Filter Service with filters', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: FilterService, useClass: FilterService },
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([DashboardService, FilterService, AbstractSearchService], (_datasetService, _filterService, _searchService) => {
        datasetService = _datasetService;
        filterService = _filterService;
        searchService = _searchService;

        source1 = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];
        source2 = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '<'
        } as FilterDataSource];

        design1A = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign;
        design1B = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterDesign;
        design1C = {
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId3'
        } as SimpleFilterDesign;
        design1D = {
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId4'
        } as SimpleFilterDesign;
        design2A = {
            type: 'and',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        filter1A = FilterUtil.createFilterFromDesign(design1A);
        filter1B = FilterUtil.createFilterFromDesign(design1B);
        filter1C = FilterUtil.createFilterFromDesign(design1C);
        filter1D = FilterUtil.createFilterFromDesign(design1D);
        filter2A = FilterUtil.createFilterFromDesign(design2A);

        design1A.id = filter1A.id;
        design1A.name = filter1A.name;
        design1B.id = filter1B.id;
        design1B.name = filter1B.name;
        design1C.id = filter1C.id;
        design1C.name = filter1C.name;
        design1D.id = filter1D.id;
        design1D.name = filter1D.name;
        design2A.id = filter2A.id;
        design2A.name = filter2A.name;
        design2A.filters[0].id = filter2A.filters[0].id;
        design2A.filters[0].name = filter2A.filters[0].name;
        design2A.filters[1].id = filter2A.filters[1].id;
        design2A.filters[1].name = filter2A.filters[1].name;

        filterService['filterCollection'].setFilters(source1, [filter1A, filter1B, filter1C, filter1D]);
        filterService['filterCollection'].setFilters(source2, [filter2A]);
    }));

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
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.RELATION_A.columnName,
            operator: '='
        } as FilterDataSource];
        relationSource2 = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.RELATION_B.columnName,
            operator: '='
        } as FilterDataSource];

        relationDesign1 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testRelation'
        } as SimpleFilterDesign;
        relationDesign2 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testRelation'
        } as SimpleFilterDesign;

        relationFilter1 = FilterUtil.createFilterFromDesign(relationDesign1);
        relationFilter2 = FilterUtil.createFilterFromDesign(relationDesign2);
        relationFilter1.relations = [relationFilter2.id];
        relationFilter2.relations = [relationFilter1.id];

        relationDesign1.id = relationFilter1.id;
        relationDesign1.name = relationFilter1.name;
        relationDesign2.id = relationFilter2.id;
        relationDesign2.name = relationFilter2.name;

        /* eslint-disable-next-line jasmine/no-unsafe-spy */
        spyOn(datasetService.state, 'findRelationDataList').and.returnValue([[
            [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.RELATION_A
            }],
            [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.RELATION_B
            }]
        ]]);
    };

    it('should have expected properties', () => {
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1, source2]);
        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['_listeners']).toEqual(new Map<string, FilterChangeListener>());
        expect(filterService['_notifier'].toString()).toEqual(filterService.notifyFilterChangeListeners.bind(filterService).toString());
    });

    it('deleteFilter should delete filter and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilter('testCaller', design1A);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1B, design1C, design1D]);
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
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
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
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('deleteFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.deleteFilters('testCaller', [{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '='
        } as SimpleFilterDesign]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource]]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('exchangeFilters should add new filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.exchangeFilters('testCaller', [testDesign], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should delete old filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId5'
        } as SimpleFilterDesign;

        let actual = filterService.exchangeFilters('testCaller', [testDesign], []);

        let listComplete = filterService['filterCollection'].getFilters(source1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testId5');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([testDesign]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should work with custom root filters', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.exchangeFilters('testCaller', [testDesign], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [relationDesign1], datasetService.state.findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign1.id = listComplete[0].id;
        relationDesign1.name = listComplete[0].name;

        listComplete = filterService['filterCollection'].getFilters(relationSource2) as any[]; // TODO: Typings;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign2.id = listComplete[0].id;
        relationDesign2.name = listComplete[0].name;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
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
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testExchangeRelation'
        } as SimpleFilterDesign;

        let actual = filterService.exchangeFilters('testCaller', [testDesign2], datasetService.state.findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testExchangeRelation');

        let testDesign1 = {
            id: listComplete[0].id,
            name: listComplete[0].name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testExchangeRelation'
        } as SimpleFilterDesign;

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testExchangeRelation');

        testDesign2.id = listComplete[0].id;
        testDesign2.name = listComplete[0].name;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
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
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('exchangeFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.exchangeFilters('testCaller', [], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('getFilters should return expected array', () => {
        expect(filterService.getFilters()).toEqual([design1A, design1B, design1C, design1D, design2A]);
        expect(filterService.getFilters(source1)).toEqual([design1A, design1B, design1C, design1D]);
        expect(filterService.getFilters(source2)).toEqual([design2A]);
        expect(filterService.getFilters([{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource])).toEqual([]);
    });

    it('getFiltersToSaveInConfig should return expected array', () => {
        expect(filterService.getFiltersToSaveInConfig()).toEqual([{
            name: design1A.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }, {
            name: design1B.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        }, {
            name: design1C.name,
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId3'
        }, {
            name: design1D.name,
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId4'
        }, {
            name: design2A.name,
            root: CompoundFilterType.AND,
            type: 'and',
            filters: [{
                name: design2A.filters[0].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            }, {
                name: design2A.filters[1].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            }]
        }]);
    });

    it('getFiltersToSearch should return expected array', () => {
        expect(filterService.getFiltersToSearch('fakeDatastore1', 'testDatabase1', 'testTable1', searchService)).toEqual([]);
        expect(filterService.getFiltersToSearch('', 'fakeDatabase1', 'testTable1', searchService)).toEqual([]);
        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'fakeTable1', searchService)).toEqual([]);
        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService)).toEqual([{
            type: 'and',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId1'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId2'
            }]
        }, {
            type: 'or',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId3'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId4'
            }]
        }, {
            type: 'and',
            filters: [{
                field: 'testSizeField',
                operator: '>',
                value: 10
            }, {
                field: 'testSizeField',
                operator: '<',
                value: 20
            }]
        }]);
    });

    it('getFiltersToSearch with filter-list-to-ignore should return expected array', () => {
        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService, [])).toEqual([{
            type: 'and',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId1'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId2'
            }]
        }, {
            type: 'or',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId3'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId4'
            }]
        }, {
            type: 'and',
            filters: [{
                field: 'testSizeField',
                operator: '>',
                value: 10
            }, {
                field: 'testSizeField',
                operator: '<',
                value: 20
            }]
        }]);

        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService, [design1A])).toEqual([{
            type: 'and',
            filters: [{
                field: 'testSizeField',
                operator: '>',
                value: 10
            }, {
                field: 'testSizeField',
                operator: '<',
                value: 20
            }]
        }]);

        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService, [design2A])).toEqual([{
            type: 'and',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId1'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId2'
            }]
        }, {
            type: 'or',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId3'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId4'
            }]
        }]);

        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService, [design1A, design2A])).toEqual([]);
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

    it('setFiltersFromConfig should change filterCollection', () => {
        let actual;

        filterService.setFiltersFromConfig([], datasetService.state);
        expect(filterService['filterCollection'].getDataSources()).toEqual([]);

        filterService.setFiltersFromConfig([{
            name: design1A.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }], datasetService.state);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(1);
        expect(actual[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[0].root).toEqual(CompoundFilterType.AND);

        filterService.setFiltersFromConfig([{
            name: design1A.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }, {
            name: design1B.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        }, {
            name: design1C.name,
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId3'
        }, {
            name: design1D.name,
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId4'
        }], datasetService.state);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(4);
        expect(actual[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[0].root).toEqual(CompoundFilterType.AND);
        expect(actual[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[1].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[1].operator).toEqual('=');
        expect(actual[1].value).toEqual('testId2');
        expect(actual[1].root).toEqual(CompoundFilterType.AND);
        expect(actual[2].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[2].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[2].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[2].operator).toEqual('=');
        expect(actual[2].value).toEqual('testId3');
        expect(actual[2].root).toEqual(CompoundFilterType.OR);
        expect(actual[3].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[3].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[3].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[3].operator).toEqual('=');
        expect(actual[3].value).toEqual('testId4');
        expect(actual[3].root).toEqual(CompoundFilterType.OR);

        filterService.setFiltersFromConfig([{
            name: design2A.name,
            root: CompoundFilterType.AND,
            type: 'and',
            filters: [{
                name: design2A.filters[0].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            }, {
                name: design2A.filters[1].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            }]
        }], datasetService.state);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source2]);
        actual = filterService['filterCollection'].getFilters(source2);
        expect(actual.length).toEqual(1);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect(actual[0].root).toEqual(CompoundFilterType.AND);
        expect(actual[0].filters.length).toEqual(2);
        expect(actual[0].filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(actual[0].filters[0].operator).toEqual('>');
        expect(actual[0].filters[0].value).toEqual(10);
        expect(actual[0].filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(actual[0].filters[1].operator).toEqual('<');
        expect(actual[0].filters[1].value).toEqual(20);

        filterService.setFiltersFromConfig([{
            name: design1A.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }, {
            name: design1B.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        }, {
            name: design2A.name,
            root: CompoundFilterType.AND,
            type: 'and',
            filters: [{
                name: design2A.filters[0].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            }, {
                name: design2A.filters[1].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            }]
        }], datasetService.state);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1, source2]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[0].root).toEqual(CompoundFilterType.AND);
        expect(actual[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[1].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[1].operator).toEqual('=');
        expect(actual[1].value).toEqual('testId2');
        expect(actual[1].root).toEqual(CompoundFilterType.AND);
        actual = filterService['filterCollection'].getFilters(source2);
        expect(actual.length).toEqual(1);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect(actual[0].root).toEqual(CompoundFilterType.AND);
        expect(actual[0].filters.length).toEqual(2);
        expect(actual[0].filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(actual[0].filters[0].operator).toEqual('>');
        expect(actual[0].filters[0].value).toEqual(10);
        expect(actual[0].filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(actual[0].filters[1].operator).toEqual('<');
        expect(actual[0].filters[1].value).toEqual(20);
    });

    it('toggleFilters should add new filters to an existing data source and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId5'
        } as SimpleFilterDesign;

        let actual = filterService.toggleFilters('testCaller', [testDesign], []);

        let listComplete = filterService['filterCollection'].getFilters(source1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(5);
        expect(listComplete[0]).toEqual(filter1A);
        expect(listComplete[1]).toEqual(filter1B);
        expect(listComplete[2]).toEqual(filter1C);
        expect(listComplete[3]).toEqual(filter1D);
        expect(listComplete[4].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[4].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[4].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(listComplete[4].operator).toEqual('=');
        expect(listComplete[4].value).toEqual('testId5');

        testDesign.id = listComplete[4].id;
        testDesign.name = listComplete[4].name;

        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D, testDesign]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should add new filters to a new data source and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should delete old argument filters and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [design1A, design1C], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1B, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should add new argument filters, delete old argument filters, and call the _notifier', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign, design1A], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should work with custom root filters', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let testDesign = {
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [relationDesign1], datasetService.state.findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign1.id = listComplete[0].id;
        relationDesign1.name = listComplete[0].name;

        listComplete = filterService['filterCollection'].getFilters(relationSource2) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign2.id = listComplete[0].id;
        relationDesign2.name = listComplete[0].name;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
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
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        let actual = filterService.toggleFilters('testCaller', [testDesign2], datasetService.state.findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter1);
        expect(listComplete[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[1].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_A);
        expect(listComplete[1].operator).toEqual('=');
        expect(listComplete[1].value).toEqual('testToggleRelation');

        let testDesign1 = {
            id: listComplete[1].id,
            name: listComplete[1].name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter2);
        expect(listComplete[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[1].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_B);
        expect(listComplete[1].operator).toEqual('=');
        expect(listComplete[1].value).toEqual('testToggleRelation');

        testDesign2.id = listComplete[1].id;
        testDesign2.name = listComplete[1].name;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1, testDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2, testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should also delete old relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [relationDesign1], datasetService.state.findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should keep non-argument relation filters and delete argument relation filters', () => {
        activateRelationFilters();

        let testDesign1 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;
        let testDesign2 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        let testFilter1 = FilterUtil.createFilterFromDesign(testDesign1);
        let testFilter2 = FilterUtil.createFilterFromDesign(testDesign2);
        testFilter1.relations = [testFilter2.id];
        testFilter2.relations = [testFilter1.id];

        testDesign1.id = testFilter1.id;
        testDesign1.name = testFilter1.name;
        testDesign2.id = testFilter2.id;
        testDesign2.name = testFilter2.name;

        filterService['filterCollection'].setFilters(relationSource1, [relationFilter1, testFilter1]);
        filterService['filterCollection'].setFilters(relationSource2, [relationFilter2, testFilter2]);

        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller',
            [relationDesign1], datasetService.state.findRelationDataList());

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([testFilter1]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([testFilter2]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign1]);
        expect(actual.get(keys[3])).toEqual([testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testCaller', actual]);
    });

    it('toggleFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService as any, '_notifier');

        let actual = filterService.toggleFilters('testCaller', [], []);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('isFiltererd should return expected boolean', () => {
        let testCollection = new FilterCollection();
        expect(filterService.isFiltered(testCollection)).toEqual(false);

        testCollection.setFilters(source1, []);
        expect(filterService.isFiltered(testCollection)).toEqual(false);

        testCollection.setFilters(source1, [filter1A]);
        expect(filterService.isFiltered(testCollection)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design1A)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design2A)).toEqual(false);

        testCollection.setFilters(source2, [filter2A]);
        expect(filterService.isFiltered(testCollection)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design1A)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design2A)).toEqual(true);
        expect(filterService.isFiltered(testCollection, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '!='
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('isFiltered with compound filter designs that have a single data source should return expected boolean', () => {
        let testDesign = {
            type: 'or',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let testFilter = FilterUtil.createFilterFromDesign(testDesign);

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '='
        } as FilterDataSource];

        let testCollection = new FilterCollection();
        testCollection.setFilters(testSource, [testFilter]);

        // Same design (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same data source but too few nested filters (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same data source but too many nested filters (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With correct values (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With correct values in different order (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With incorrect values (should return false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 1
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);
    });

    it('isFiltered with compound filter designs that have multiple data sources should return expected boolean', () => {
        let testDesign = {
            type: 'or',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let testFilter = FilterUtil.createFilterFromDesign(testDesign);

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '!='
        } as FilterDataSource];

        let testCollection = new FilterCollection();
        testCollection.setFilters(testSource, [testFilter]);

        // Same design (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same design in different order (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same data source but too few nested filters (should return false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Same data source but too many nested filters (should return false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // With correct values (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With correct values in different order (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same design in different order With correct values (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With incorrect values (should return false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 50
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);
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

    it('updateCollectionWithGlobalCompatibleFilters should update argument filter collection and call redraw callback', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new FilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(calls).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should copy multiple filters if multiple behaviors have compatible filters', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls1 = 0;
        let testRedrawCallback1 = (filters) => {
            calls1++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let calls2 = 0;
        let testRedrawCallback2 = (filters) => {
            calls2++;
            expect(filters).toEqual([filter2A]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback1
        }, {
            filterDesign: design2A,
            redrawCallback: testRedrawCallback2
        } as FilterBehavior];

        let testCollection = new FilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1, source2]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(testCollection.getFilters(source2)).toEqual([filter2A]);
        expect(calls1).toEqual(1);
        expect(calls2).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should update existing filters', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new FilterCollection();
        testCollection.setFilters(source1, [filter1A, filter1C]);

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(calls).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should remove existing filters', () => {
        // Remove filters.
        filterService['filterCollection'].setFilters(source1, []);

        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
            expect(filters).toEqual([]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new FilterCollection();
        testCollection.setFilters(source1, [filter1A, filter1C]);

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([]);
        expect(calls).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should not copy the same filters if behaviors have the same data source', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let testDesign = {
            type: 'and',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.ID,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let calls1 = 0;
        let testRedrawCallback1 = (filters) => {
            calls1++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let calls2 = 0;
        let testRedrawCallback2 = (filters) => {
            calls2++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback1
        }, {
            filterDesign: testDesign,
            redrawCallback: testRedrawCallback2
        } as FilterBehavior];

        let testCollection = new FilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(calls1).toEqual(1);
        expect(calls2).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should do nothing with no compatible filters', () => {
        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '='
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let calls = 0;
        let testRedrawCallback = (__filters) => {
            calls++;
        };

        let testBehaviorList = [{
            filterDesign: testDesign,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new FilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([testSource]);
        expect(testCollection.getFilters(testSource)).toEqual([]);
        expect(calls).toEqual(0);
    });
});
