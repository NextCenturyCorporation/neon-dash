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
import { ComponentFixture, fakeAsync, inject, tick } from '@angular/core/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';

import { ErrorNotificationService } from './error-notification.service';
import { DatasetService } from './dataset.service';
import { FilterService, ServiceFilter } from './filter.service';
import { NeonGTDConfig } from '../neon-gtd-config';
import { DatasetServiceMock } from '../../testUtils/MockServices/DatasetServiceMock';
import { initializeTestBed } from '../../testUtils/initializeTestBed';

import * as neon from 'neon-framework';

@Injectable()
class TestFilterService extends FilterService {
    private idCounter: number = 1;

    constructor(
        protected errorNotificationService: ErrorNotificationService,
        protected datasetService: DatasetService,
        protected http: HttpClient
    ) {
        super(errorNotificationService, datasetService);
    }

    public createFilterId(database: string, table: string) {
        return database + '-' + table + '-' + (this.idCounter++);
    }

    protected getDatabaseFilterState(onSuccess: (filterList) => any, onError: (response: any) => any) {
        this.http.get('/filterservice/filters/*/*').subscribe(onSuccess, onError);
    }

    public reset() {
        this.filters = [];
        this.idCounter = 1;
    }
}

@Injectable()
class TestFilterServiceWithFilters extends TestFilterService {
    public FILTER_1 = new ServiceFilter('testFilter1', 'testOwnerA', 'testDatabase1', 'testTable1', {
        ownerId: 'testOwnerA',
        databaseName: 'testDatabase1',
        tableName: 'testTable1',
        whereClause: neon.query.where('testField1', '=', 'testValue1'),
        filterName: 'Test Database 1 - Test Table 1 - Test Filter 1'
    });

    public FILTER_2 = new ServiceFilter('testFilter2', 'testOwnerB', 'testDatabase2', 'testTable2', {
        ownerId: 'testOwnerB',
        databaseName: 'testDatabase2',
        tableName: 'testTable2',
        whereClause: neon.query.where('testField2', '=', 'testValue2'),
        filterName: 'Test Database 2 - Test Table 2 - Test Filter 2'
    });

    public FILTER_3 = new ServiceFilter('testFilter3', 'testOwnerB', 'testDatabase2', 'testTable2', {
        ownerId: 'testOwnerB',
        databaseName: 'testDatabase2',
        tableName: 'testTable2',
        whereClause: neon.query.where('testField3', '=', 'testValue3'),
        filterName: 'Test Database 2 - Test Table 2 - Test Filter 3'
    });

    public FILTER_4 = new ServiceFilter('testFilter4', 'testOwnerB', 'testDatabase2', 'testTable2', {
        ownerId: 'testOwnerB',
        databaseName: 'testDatabase2',
        tableName: 'testTable2',
        whereClause: neon.query.where('testField2', '=', 'testValue4'),
        filterName: 'Test Database 2 - Test Table 2 - Test Filter 4'
    });

    public FILTER_5 = new ServiceFilter('testFilter5', 'testOwnerC', 'testDatabase1', 'testTable1', {
        ownerId: 'testOwnerC',
        databaseName: 'testDatabase1',
        tableName: 'testTable1',
        whereClause: neon.query.where('testRelationFieldA', '=', 'testRelationValueA'),
        filterName: 'Test Database 1 - Test Table 1 - Test Filter 5'
    }, ['testFilter6']);

    public FILTER_6 = new ServiceFilter('testFilter6', undefined, 'testDatabase2', 'testTable2', {
        ownerId: undefined,
        databaseName: 'testDatabase2',
        tableName: 'testTable2',
        whereClause: neon.query.where('testRelationFieldA', '=', 'testRelationValueA'),
        filterName: 'Test Database 2 - Test Table 2 - Test Filter 6'
    }, ['testFilter5']);

    constructor(
        protected errorNotificationService: ErrorNotificationService,
        protected datasetService: DatasetService,
        protected http: HttpClient
    ) {
        super(errorNotificationService, datasetService, http);
        this.reset();
    }

    public reset() {
        super.reset();
        this.filters = [this.FILTER_1, this.FILTER_2, this.FILTER_3, this.FILTER_4];
    }

    public resetWithRelationFilters() {
        this.filters = [this.FILTER_5, this.FILTER_6];
    }
}

describe('Service: Filter', () => {
    let service;
    let backend;

    initializeTestBed({
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            ErrorNotificationService,
            { provide: FilterService, useClass: TestFilterService },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(inject([FilterService, HttpTestingController], (filterService, httpTestingController) => {
        service = filterService;
        backend = httpTestingController;
    }));

    afterEach(() => {
        service.reset();
    });

    it('getFilters with no filters does return empty array', () => {
        expect(service.getFilters()).toEqual([]);
    });

    it('getFilters with no filters given comparator does return empty array', () => {
        expect(service.getFilters({
            id: 'testFilter1'
        })).toEqual([]);
    });

    it('getFiltersByOwner with no filters does return empty array', () => {
        expect(service.getFiltersByOwner('testOwnerA')).toEqual([]);
        expect(service.getFiltersByOwner('testOwnerB')).toEqual([]);
    });

    it('getFiltersForFields with no filters and not given field array does return empty array', () => {
        expect(service.getFiltersForFields('testDatabase1', 'testTable1')).toEqual([]);
        expect(service.getFiltersForFields('testDatabase2', 'testTable2')).toEqual([]);
    });

    it('getFiltersForFields with no filters given field array does return empty array', () => {
        expect(service.getFiltersForFields('testDatabase1', 'testTable1', ['testField1'])).toEqual([]);
        expect(service.getFiltersForFields('testDatabase2', 'testTable2', ['testField2'])).toEqual([]);
    });

    it('getFilterById with no filters does return undefined', () => {
        expect(service.getFilterById('testFilter1')).toEqual(undefined);
        expect(service.getFilterById('testFilter2')).toEqual(undefined);
    });

    it('getFilterState with no filters does not call replaceFilters but does call onSuccess', fakeAsync(() => {
        let spy = spyOn(service, 'replaceFilter');
        let successCalls = 0;
        let failureCalls = 0;
        service.getFilterState(() => {
            ++successCalls;
        }, () => {
            ++failureCalls;
        });

        let request = backend.expectOne({
            url: '/filterservice/filters/*/*',
            method: 'GET'
        });
        request.flush([]);

        expect(spy.calls.count()).toEqual(0);
        expect(service.getFilters()).toEqual([]);
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
    }));

    it('getFilterState with response filters does call both replaceFilters and onSuccess', fakeAsync(() => {
        let spy = spyOn(service, 'replaceFilter');
        let successCalls = 0;
        let failureCalls = 0;
        service.getFilterState(() => {
            ++successCalls;
        }, () => {
            ++failureCalls;
        });

        let request = backend.expectOne({
            url: '/filterservice/filters/*/*',
            method: 'GET'
        });
        request.flush([{
            id: 'testFilter1',
            dataSet: {
                databaseName: 'testDatabase1',
                tableName: 'testTable1'
            },
            filter: {
                databaseName: 'testDatabase1',
                tableName: 'testTable1',
                whereClause: neon.query.where('testField1', '=', 'testValue1'),
                filterName: 'Test Database 1 - Test Table 1 - Test Filter 1'
            }
        }, {
            id: 'testFilter2',
            dataSet: {
                databaseName: 'testDatabase2',
                tableName: 'testTable2'
            },
            filter: {
                databaseName: 'testDatabase2',
                tableName: 'testTable2',
                whereClause: neon.query.where('testField2', '=', 'testValue2'),
                filterName: 'Test Database 2 - Test Table 2 - Test Filter 2'
            }
        }]);

        let filter1 = new ServiceFilter('testFilter1', undefined, 'testDatabase1', 'testTable1', {
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            whereClause: neon.query.where('testField1', '=', 'testValue1'),
            filterName: 'Test Database 1 - Test Table 1 - Test Filter 1'
        });

        let filter2 = new ServiceFilter('testFilter2', undefined, 'testDatabase2', 'testTable2', {
            databaseName: 'testDatabase2',
            tableName: 'testTable2',
            whereClause: neon.query.where('testField2', '=', 'testValue2'),
            filterName: 'Test Database 2 - Test Table 2 - Test Filter 2'
        });

        expect(spy.calls.count()).toEqual(2);
        expect(service.getFilters()).toEqual([filter1, filter2]);

        let args1 = spy.calls.argsFor(0);
        expect(args1.length).toEqual(7);
        expect(args1[0].constructor.name).toEqual(neon.eventing.Messenger.name);
        expect(args1[1]).toEqual('testFilter1');
        expect(args1[2]).toEqual(undefined);
        expect(args1[3]).toEqual('testDatabase1');
        expect(args1[4]).toEqual('testTable1');
        expect(args1[5]).toEqual(neon.query.where('testField1', '=', 'testValue1'));
        expect(args1[6]).toEqual('Test Database 1 - Test Table 1 - Test Filter 1');

        let args2 = spy.calls.argsFor(1);
        expect(args2.length).toEqual(7);
        expect(args2[0].constructor.name).toEqual(neon.eventing.Messenger.name);
        expect(args2[1]).toEqual('testFilter2');
        expect(args2[2]).toEqual(undefined);
        expect(args2[3]).toEqual('testDatabase2');
        expect(args2[4]).toEqual('testTable2');
        expect(args2[5]).toEqual(neon.query.where('testField2', '=', 'testValue2'));
        expect(args2[6]).toEqual('Test Database 2 - Test Table 2 - Test Filter 2');
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
    }));

    it('getFilterState with response error does not call replaceFilters but does call onError', fakeAsync(() => {
        let spy = spyOn(service, 'replaceFilter');
        let successCalls = 0;
        let failureCalls = 0;
        service.getFilterState(() => {
            ++successCalls;
        }, (response) => {
            ++failureCalls;
            expect(response.statusText).toEqual('Test Error Message');
        });

        let request = backend.expectOne({
            url: '/filterservice/filters/*/*',
            method: 'GET'
        });
        request.flush(null, {
            statusText: 'Test Error Message',
            status: 500
        });

        expect(spy.calls.count()).toEqual(0);
        expect(service.getFilters()).toEqual([]);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(1);
    }));

    it('addFilter does call both messenger.addFilters and onSuccess', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'addFilters');
        let wherePredicate = neon.query.where('testField', '=', 'testValue');
        let neonFilter = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter.whereClause = wherePredicate;
        let filter = new ServiceFilter('testDatabase1-testTable1-1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter);

        service.addFilter(messenger, 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testDatabase1-testTable1-1', neonFilter]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([filter]);
    });

    it('addFilter given filter with relation field does call both messenger.addFilters and onSuccess once each', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'addFilters');
        let wherePredicate = neon.query.where('testRelationFieldA', '=', 'testNewValue1');
        let neonFilter1 = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter1.whereClause = wherePredicate;
        let filter1 = new ServiceFilter('testDatabase1-testTable1-1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter1,
            ['testDatabase2-testTable2-2']);

        service.addFilter(messenger, 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        let neonFilter2 = new neon.query.Filter().selectFrom('testDatabase2', 'testTable2')
            .name('Test Visualization - Test Database 2 - Test Table 2: Test Text');
        neonFilter2.whereClause = neon.query.where('testRelationFieldA', '=', 'testNewValue1');
        let filter2 = new ServiceFilter('testDatabase2-testTable2-2', undefined, 'testDatabase2', 'testTable2', neonFilter2,
            ['testDatabase1-testTable1-1']);

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testDatabase1-testTable1-1', neonFilter1], ['testDatabase2-testTable2-2', neonFilter2]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([filter2, filter1]);
    });

    it('addFilter given multiple-clause filter with only relation fields', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'addFilters');
        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testRelationFieldA', '=', 'testRelationValueA'),
            neon.query.where('testRelationFieldB', '=', 'testRelationValueB')
        ]);
        let neonFilter1 = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter1.whereClause = wherePredicate;
        let filter1 = new ServiceFilter('testDatabase1-testTable1-1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter1,
            ['testDatabase2-testTable2-2']);

        service.addFilter(messenger, 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        let neonFilter2 = new neon.query.Filter().selectFrom('testDatabase2', 'testTable2')
            .name('Test Visualization - Test Database 2 - Test Table 2: Test Text');
        neonFilter2.whereClause = neon.query.and.apply(neon.query, [
            neon.query.where('testRelationFieldA', '=', 'testRelationValueA'),
            neon.query.where('testRelationFieldB', '=', 'testRelationValueB')
        ]);
        let filter2 = new ServiceFilter('testDatabase2-testTable2-2', undefined, 'testDatabase2', 'testTable2', neonFilter2,
            ['testDatabase1-testTable1-1']);

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testDatabase1-testTable1-1', neonFilter1], ['testDatabase2-testTable2-2', neonFilter2]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([filter2, filter1]);
    });

    it('addFilter given multiple-clause filter with relation and non-relation fields', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'addFilters');
        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testFilterField', '=', 'testFilterText'),
            neon.query.where('testRelationFieldA', '=', 'testRelationText')
        ]);
        let neonFilter = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter.whereClause = wherePredicate;
        let filter = new ServiceFilter('testDatabase1-testTable1-1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter);

        service.addFilter(messenger, 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testDatabase1-testTable1-1', neonFilter]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([filter]);
    });

    it('addFilter does not add filter in onError', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'addFilters');
        let wherePredicate = neon.query.where('testField', '=', 'testValue');
        let neonFilter = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter.whereClause = wherePredicate;
        let filter = new ServiceFilter('testDatabase1-testTable1-1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter);

        service.addFilter(messenger, 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testDatabase1-testTable1-1', neonFilter]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[2]();
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(1);
        expect(service.getFilters()).toEqual([]);
    });

    it('removeFilters with no filters does not call onSuccess', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'removeFilters');

        service.removeFilters(messenger, ['testFilter1', 'testFilter2'], (filter) => {
            ++successCalls;
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(0);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([]);
    });

    it('replaceFilter given new filter ID does call addFilter', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let spy = spyOn(service, 'addFilter');
        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'replaceFilters');
        let wherePredicate = neon.query.where('testField', '=', 'testValue');

        service.replaceFilter(messenger, 'testNewFilter1', 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
        }, (response) => {
            ++failureCalls;
        });

        expect(spy.calls.count()).toEqual(1);
        expect(messengerSpy.calls.count()).toEqual(0);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([]);

        let args = spy.calls.argsFor(0);
        expect(args.length).toEqual(8);
        expect(args[0]).toEqual(messenger);
        expect(args[1]).toEqual('testOwnerZ');
        expect(args[2]).toEqual('testDatabase1');
        expect(args[3]).toEqual('testTable1');
        expect(args[4]).toEqual(wherePredicate);
        expect(args[5]).toEqual({
            visName: 'Test Visualization',
            text: 'Test Text'
        });
        expect(typeof args[6]).toEqual('function');
        expect(typeof args[7]).toEqual('function');

        args[6]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);

        args[7]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(1);
    });
});

describe('Service: Filter with existing filters', () => {
    let service;
    let http;
    let backend;

    initializeTestBed({
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            ErrorNotificationService,
            { provide: FilterService, useClass: TestFilterServiceWithFilters },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(inject([FilterService, HttpClient, HttpTestingController], (filterService, httpClient, httpTestingController) => {
        service = filterService;
        http = httpClient;
        backend = httpTestingController;
    }));

    afterEach(() => {
        service.reset();
    });

    it('getFilters with filters does return expected array', () => {
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);
    });

    it('getFilters with filters given comparator does return expected array', () => {
        expect(service.getFilters({
            id: 'testFilter1'
        })).toEqual([service.FILTER_1]);

        expect(service.getFilters({
            database: 'testDatabase2'
        })).toEqual([service.FILTER_2, service.FILTER_3, service.FILTER_4]);
    });

    it('getFiltersByOwner with filters does return expected array', () => {
        expect(service.getFiltersByOwner('testOwnerA')).toEqual([service.FILTER_1]);
        expect(service.getFiltersByOwner('testOwnerB')).toEqual([service.FILTER_2, service.FILTER_3, service.FILTER_4]);
    });

    it('getFiltersForFields with filters and not given field array does return expected array', () => {
        expect(service.getFiltersForFields('testDatabase1', 'testTable1')).toEqual([service.FILTER_1]);
        expect(service.getFiltersForFields('testDatabase2', 'testTable2')).toEqual([service.FILTER_2, service.FILTER_3, service.FILTER_4]);
    });

    it('getFiltersForFields with filters given field array does return expected array', () => {
        expect(service.getFiltersForFields('testDatabase1', 'testTable1', ['testField1'])).toEqual([service.FILTER_1]);
        expect(service.getFiltersForFields('testDatabase1', 'testTable1', ['testField2'])).toEqual([]);
        expect(service.getFiltersForFields('testDatabase2', 'testTable2', ['testField2'])).toEqual([service.FILTER_2, service.FILTER_4]);
        expect(service.getFiltersForFields('testDatabase2', 'testTable2', ['testField3'])).toEqual([service.FILTER_3]);
    });

    it('getFilterById with filters does return expected filter object', () => {
        expect(service.getFilterById('testFilter1')).toEqual(service.FILTER_1);
        expect(service.getFilterById('testFilter2')).toEqual(service.FILTER_2);
        expect(service.getFilterById('testFilter3')).toEqual(service.FILTER_3);
        expect(service.getFilterById('testFilter4')).toEqual(service.FILTER_4);
    });

    it('getFilterState does replace existing filters', () => {
        let spy = spyOn(service, 'replaceFilter');
        let successCalls = 0;
        let failureCalls = 0;
        service.getFilterState(() => {
            ++successCalls;
        }, () => {
            ++failureCalls;
        });

        let request = backend.expectOne({
            url: '/filterservice/filters/*/*',
            method: 'GET'
        });
        request.flush([{
            id: 'testFilter1',
            dataSet: {
                databaseName: 'testDatabase1',
                tableName: 'testTable1'
            },
            filter: {
                databaseName: 'testDatabase1',
                tableName: 'testTable1',
                whereClause: neon.query.where('testField1', '=', 'testNewValue1'),
                filterName: 'Test Database 1 - Test Table 1 - Test Filter 1'
            }
        }, {
            id: 'testFilter2',
            dataSet: {
                databaseName: 'testDatabase2',
                tableName: 'testTable2'
            },
            filter: {
                databaseName: 'testDatabase2',
                tableName: 'testTable2',
                whereClause: neon.query.where('testField2', '=', 'testNewValue2'),
                filterName: 'Test Database 2 - Test Table 2 - Test Filter 2'
            }
        }]);

        let filter1 = new ServiceFilter('testFilter1', undefined, 'testDatabase1', 'testTable1', {
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            whereClause: neon.query.where('testField1', '=', 'testNewValue1'),
            filterName: 'Test Database 1 - Test Table 1 - Test Filter 1'
        });

        let filter2 = new ServiceFilter('testFilter2', undefined, 'testDatabase2', 'testTable2', {
            databaseName: 'testDatabase2',
            tableName: 'testTable2',
            whereClause: neon.query.where('testField2', '=', 'testNewValue2'),
            filterName: 'Test Database 2 - Test Table 2 - Test Filter 2'
        });

        expect(spy.calls.count()).toEqual(2);
        expect(service.getFilters()).toEqual([filter1, filter2]);

        let args1 = spy.calls.argsFor(0);
        expect(args1.length).toEqual(7);
        expect(args1[0].constructor.name).toEqual(neon.eventing.Messenger.name);
        expect(args1[1]).toEqual('testFilter1');
        expect(args1[2]).toEqual(undefined);
        expect(args1[3]).toEqual('testDatabase1');
        expect(args1[4]).toEqual('testTable1');
        expect(args1[5]).toEqual(neon.query.where('testField1', '=', 'testNewValue1'));
        expect(args1[6]).toEqual('Test Database 1 - Test Table 1 - Test Filter 1');

        let args2 = spy.calls.argsFor(1);
        expect(args2.length).toEqual(7);
        expect(args2[0].constructor.name).toEqual(neon.eventing.Messenger.name);
        expect(args2[1]).toEqual('testFilter2');
        expect(args2[2]).toEqual(undefined);
        expect(args2[3]).toEqual('testDatabase2');
        expect(args2[4]).toEqual('testTable2');
        expect(args2[5]).toEqual(neon.query.where('testField2', '=', 'testNewValue2'));
        expect(args2[6]).toEqual('Test Database 2 - Test Table 2 - Test Filter 2');
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
    });

    it('addFilter with filters does call both messenger.addFilters and onSuccess', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'addFilters');
        let wherePredicate = neon.query.where('testField', '=', 'testValue');
        let neonFilter = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter.whereClause = wherePredicate;
        let filter = new ServiceFilter('testDatabase1-testTable1-1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter);

        service.addFilter(messenger, 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testDatabase1-testTable1-1', neonFilter]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4, filter]);
    });

    it('addFilter with filters given filter with relation field does call both messenger.addFilters and onSuccess once each', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'addFilters');
        let wherePredicate = neon.query.where('testRelationFieldA', '=', 'testNewValue1');
        let neonFilter1 = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter1.whereClause = wherePredicate;
        let filter1 = new ServiceFilter('testDatabase1-testTable1-1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter1,
            ['testDatabase2-testTable2-2']);

        service.addFilter(messenger, 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        let neonFilter2 = new neon.query.Filter().selectFrom('testDatabase2', 'testTable2')
            .name('Test Visualization - Test Database 2 - Test Table 2: Test Text');
        neonFilter2.whereClause = neon.query.where('testRelationFieldA', '=', 'testNewValue1');
        let filter2 = new ServiceFilter('testDatabase2-testTable2-2', undefined, 'testDatabase2', 'testTable2', neonFilter2,
            ['testDatabase1-testTable1-1']);

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testDatabase1-testTable1-1', neonFilter1], ['testDatabase2-testTable2-2', neonFilter2]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4, filter2, filter1]);
    });

    it('addFilter with filters given multiple-clause filter with only relation fields', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'addFilters');
        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testRelationFieldA', '=', 'testRelationValueA'),
            neon.query.where('testRelationFieldB', '=', 'testRelationValueB')
        ]);
        let neonFilter1 = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter1.whereClause = wherePredicate;
        let filter1 = new ServiceFilter('testDatabase1-testTable1-1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter1,
            ['testDatabase2-testTable2-2']);

        service.addFilter(messenger, 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        let neonFilter2 = new neon.query.Filter().selectFrom('testDatabase2', 'testTable2')
            .name('Test Visualization - Test Database 2 - Test Table 2: Test Text');
        neonFilter2.whereClause = neon.query.and.apply(neon.query, [
            neon.query.where('testRelationFieldA', '=', 'testRelationValueA'),
            neon.query.where('testRelationFieldB', '=', 'testRelationValueB')
        ]);
        let filter2 = new ServiceFilter('testDatabase2-testTable2-2', undefined, 'testDatabase2', 'testTable2', neonFilter2,
            ['testDatabase1-testTable1-1']);

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testDatabase1-testTable1-1', neonFilter1], ['testDatabase2-testTable2-2', neonFilter2]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4, filter2, filter1]);
    });

    it('addFilter with filters does not add filter in onError', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'addFilters');
        let wherePredicate = neon.query.where('testField', '=', 'testValue');
        let neonFilter = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter.whereClause = wherePredicate;
        let filter = new ServiceFilter('testDatabase1-testTable1-1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter);

        service.addFilter(messenger, 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testDatabase1-testTable1-1', neonFilter]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[2]();
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(1);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);
    });

    it('removeFilters with filters does call messenger.removeFilters and onSuccess', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'removeFilters');

        service.removeFilters(messenger, ['testFilter1'], (filter) => {
            ++successCalls;
            expect(filter).toEqual(service.FILTER_1);
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let args1 = messengerSpy.calls.argsFor(0);
        expect(args1.length).toEqual(3);
        expect(args1[0]).toEqual(['testFilter1']);
        expect(typeof args1[1]).toEqual('function');
        expect(typeof args1[2]).toEqual('function');

        args1[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_2, service.FILTER_3, service.FILTER_4]);
    });

    it('removeFilters with filters given multiple IDs does call both messenger.removeFilters and onSuccess multiple times', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'removeFilters');

        service.removeFilters(messenger, ['testFilter1', 'testFilter2'], (filter) => {
            ++successCalls;
            if (successCalls === 1) {
                expect(filter).toEqual(service.FILTER_1);
            }
            if (successCalls === 2) {
                expect(filter).toEqual(service.FILTER_2);
            }
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(2);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let args1 = messengerSpy.calls.argsFor(0);
        expect(args1.length).toEqual(3);
        expect(args1[0]).toEqual(['testFilter1']);
        expect(typeof args1[1]).toEqual('function');
        expect(typeof args1[2]).toEqual('function');

        args1[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let args2 = messengerSpy.calls.argsFor(1);
        expect(args2.length).toEqual(3);
        expect(args2[0]).toEqual(['testFilter2']);
        expect(typeof args2[1]).toEqual('function');
        expect(typeof args2[2]).toEqual('function');

        args2[1]();
        expect(successCalls).toEqual(2);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_3, service.FILTER_4]);
    });

    it('removeFilters with filters given an ID with siblings does call both messenger.removeFilters and onSuccess once', () => {
        service.resetWithRelationFilters();

        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'removeFilters');

        service.removeFilters(messenger, ['testFilter5'], (filter) => {
            ++successCalls;
            expect(filter).toEqual(service.FILTER_5);
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_5, service.FILTER_6]);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual(['testFilter6', 'testFilter5']);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([]);
    });

    it('removeFilters with filters does not remove filter in onError', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'removeFilters');

        service.removeFilters(messenger, ['testFilter1'], (filter) => {
            ++successCalls;
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let args1 = messengerSpy.calls.argsFor(0);
        expect(args1.length).toEqual(3);
        expect(args1[0]).toEqual(['testFilter1']);
        expect(typeof args1[1]).toEqual('function');
        expect(typeof args1[2]).toEqual('function');

        args1[2]();
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(1);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);
    });

    it('replaceFilter with filters given new filter ID does call addFilter', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let spy = spyOn(service, 'addFilter');
        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'replaceFilters');
        let wherePredicate = neon.query.where('testField', '=', 'testValue');

        service.replaceFilter(messenger, 'testNewFilter1', 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
        }, (response) => {
            ++failureCalls;
        });

        expect(spy.calls.count()).toEqual(1);
        expect(messengerSpy.calls.count()).toEqual(0);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let args = spy.calls.argsFor(0);
        expect(args.length).toEqual(8);
        expect(args[0]).toEqual(messenger);
        expect(args[1]).toEqual('testOwnerZ');
        expect(args[2]).toEqual('testDatabase1');
        expect(args[3]).toEqual('testTable1');
        expect(args[4]).toEqual(wherePredicate);
        expect(args[5]).toEqual({
            visName: 'Test Visualization',
            text: 'Test Text'
        });
        expect(typeof args[6]).toEqual('function');
        expect(typeof args[7]).toEqual('function');

        args[6]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
    });

    it('replaceFilter with filters given existing filter ID does call both messenger.replaceFilters and onSuccess', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'replaceFilters');
        let wherePredicate = neon.query.where('testField', '=', 'testValue');

        service.replaceFilter(messenger, 'testFilter1', 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testFilter1');
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let neonFilter = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter.whereClause = wherePredicate;
        let filter = new ServiceFilter('testFilter1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testFilter1', neonFilter]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([filter, service.FILTER_2, service.FILTER_3, service.FILTER_4]);
    });

    it('replaceFilter with filters given filter with relation field does call both messenger.addFilters and onSuccess once each', () => {
        service.resetWithRelationFilters();

        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'replaceFilters');
        let wherePredicate = neon.query.where('testRelationFieldA', '=', 'testNewValue1');

        service.replaceFilter(messenger, 'testFilter5', 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testFilter5');
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_5, service.FILTER_6]);

        let neonFilter1 = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter1.whereClause = wherePredicate;
        let filter1 = new ServiceFilter('testFilter5', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter1, ['testFilter6']);

        let neonFilter2 = new neon.query.Filter().selectFrom('testDatabase2', 'testTable2')
            .name('Test Visualization - Test Database 2 - Test Table 2: Test Text');
        neonFilter2.whereClause = wherePredicate;
        let filter2 = new ServiceFilter('testFilter6', undefined, 'testDatabase2', 'testTable2', neonFilter2, ['testFilter5']);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testFilter5', neonFilter1], ['testFilter6', neonFilter2]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([filter1, filter2]);
    });

    it('replaceFilter with filters given multiple-clause filter with only relation fields', () => {
        service.resetWithRelationFilters();

        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'replaceFilters');
        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testRelationFieldA', '=', 'testNewValue1'),
            neon.query.where('testRelationFieldB', '=', 'testNewValue2')
        ]);

        service.replaceFilter(messenger, 'testFilter5', 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testFilter5');
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_5, service.FILTER_6]);

        let neonFilter1 = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter1.whereClause = wherePredicate;
        let filter1 = new ServiceFilter('testFilter5', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter1, ['testFilter6']);

        let neonFilter2 = new neon.query.Filter().selectFrom('testDatabase2', 'testTable2')
            .name('Test Visualization - Test Database 2 - Test Table 2: Test Text');
        neonFilter2.whereClause = wherePredicate;
        let filter2 = new ServiceFilter('testFilter6', undefined, 'testDatabase2', 'testTable2', neonFilter2, ['testFilter5']);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testFilter5', neonFilter1], ['testFilter6', neonFilter2]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[1]();
        expect(successCalls).toEqual(1);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([filter1, filter2]);
    });

    it('replaceFilter with filters does not replace filter in onError', () => {
        let successCalls = 0;
        let failureCalls = 0;

        let messenger = new neon.eventing.Messenger();
        let messengerSpy = spyOn(messenger, 'replaceFilters');
        let wherePredicate = neon.query.where('testField', '=', 'testValue');

        service.replaceFilter(messenger, 'testFilter1', 'testOwnerZ', 'testDatabase1', 'testTable1', wherePredicate, {
            visName: 'Test Visualization',
            text: 'Test Text'
        }, (id) => {
            ++successCalls;
            expect(id).toEqual('testDatabase1-testTable1-1');
        }, (response) => {
            ++failureCalls;
        });

        expect(messengerSpy.calls.count()).toEqual(1);
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(0);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);

        let neonFilter = new neon.query.Filter().selectFrom('testDatabase1', 'testTable1')
            .name('Test Visualization - Test Database 1 - Test Table 1: Test Text');
        neonFilter.whereClause = wherePredicate;
        let filter = new ServiceFilter('testFilter1', 'testOwnerZ', 'testDatabase1', 'testTable1', neonFilter);

        let args = messengerSpy.calls.argsFor(0);
        expect(args.length).toEqual(3);
        expect(args[0]).toEqual([['testFilter1', neonFilter]]);
        expect(typeof args[1]).toEqual('function');
        expect(typeof args[2]).toEqual('function');

        args[2]();
        expect(successCalls).toEqual(0);
        expect(failureCalls).toEqual(1);
        expect(service.getFilters()).toEqual([service.FILTER_1, service.FILTER_2, service.FILTER_3, service.FILTER_4]);
    });
});
