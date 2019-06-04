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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector } from '@angular/core';

import { } from 'jasmine-core';

import { NeonGTDConfig } from '../../neon-gtd-config';

import { TimelineComponent } from './timeline.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { WidgetService } from '../../services/widget.service';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';

import { TimelineModule } from './timeline.module';
import { ConfigService } from '../../services/config.service';
import { FieldMetaData } from '../../types';

describe('Component: Timeline', () => {
    let testConfig: NeonGTDConfig = NeonGTDConfig.get();
    let component: TimelineComponent;
    let fixture: ComponentFixture<TimelineComponent>;

    initializeTestBed('Timeline', {
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(testConfig) }

        ],
        imports: [
            TimelineModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimelineComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('onTimelineSelection does set a new date filter', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.dateField = DashboardServiceMock.DATE_FIELD;

        let date = new Date();
        let startDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 3, date.getDay());
        let endDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 2, date.getDay());

        component.onTimelineSelection(startDate, endDate, []);

        expect((component as any).selected).toEqual([startDate, endDate]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES[0],
                table: DashboardServiceMock.TABLES[0],
                field: DashboardServiceMock.DATE_FIELD,
                operator: '>=',
                value: startDate
            }, {
                datastore: '',
                database: DashboardServiceMock.DATABASES[0],
                table: DashboardServiceMock.TABLES[0],
                field: DashboardServiceMock.DATE_FIELD,
                operator: '<=',
                value: endDate
            }]
        }]]);
    });

    it('onTimelineSelection does not set custom filters if filterField does not exist', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.dateField = DashboardServiceMock.DATE_FIELD;

        let date = new Date();
        let startDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 2, date.getDay());
        let endDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 1, date.getDay());

        let selectedData = [
            {
                date: new Date(date.getUTCDay() - 45),
                value: 10,
                filters: ['filterValue1']
            },
            {
                date: new Date(date.getUTCDay() - 32),
                value: 10,
                filters: ['filterValue2', 'filterValue3']
            }
        ];
        component.onTimelineSelection(startDate, endDate, selectedData);

        expect((component as any).selected).toEqual([startDate, endDate]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES[0],
                table: DashboardServiceMock.TABLES[0],
                field: DashboardServiceMock.DATE_FIELD,
                operator: '>=',
                value: startDate
            }, {
                datastore: '',
                database: DashboardServiceMock.DATABASES[0],
                table: DashboardServiceMock.TABLES[0],
                field: DashboardServiceMock.DATE_FIELD,
                operator: '<=',
                value: endDate
            }]
        }]]);
    });

    it('onTimelineSelection does set custom filters on empty string if filterField does exist but selectedData does not exist', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.dateField = DashboardServiceMock.DATE_FIELD;
        component.options.filterField = DashboardServiceMock.FILTER_FIELD;

        let date = new Date();
        let startDate = new Date(date.getUTCFullYear() - 1, date.getUTCMonth(), date.getDay());
        let endDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDay());

        component.onTimelineSelection(startDate, endDate, []);

        expect((component as any).selected).toEqual([startDate, endDate]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES[0],
                table: DashboardServiceMock.TABLES[0],
                field: DashboardServiceMock.DATE_FIELD,
                operator: '>=',
                value: startDate
            }, {
                datastore: '',
                database: DashboardServiceMock.DATABASES[0],
                table: DashboardServiceMock.TABLES[0],
                field: DashboardServiceMock.DATE_FIELD,
                operator: '<=',
                value: endDate
            }]
        }, {
            // TODO NEON-36
            root: 'or',
            datastore: '',
            database: DashboardServiceMock.DATABASES[0],
            table: DashboardServiceMock.TABLES[0],
            field: DashboardServiceMock.FILTER_FIELD,
            operator: '=',
            value: ''
        }]]);
    });

    it('onTimelineSelection does set custom filters if filterField and selectedData both exist', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.dateField = DashboardServiceMock.DATE_FIELD;
        component.options.filterField = DashboardServiceMock.FILTER_FIELD;

        let date = new Date();
        let startDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 2, date.getDay());
        let endDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 1, date.getDay());

        let selectedData = [
            {
                date: new Date(date.getUTCDay() - 45),
                value: 10,
                filters: ['filterValue1']
            },
            {
                date: new Date(date.getUTCDay() - 32),
                value: 10,
                filters: ['filterValue2', 'filterValue3']
            }
        ];
        component.onTimelineSelection(startDate, endDate, selectedData);

        expect((component as any).selected).toEqual([startDate, endDate]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES[0],
                table: DashboardServiceMock.TABLES[0],
                field: DashboardServiceMock.DATE_FIELD,
                operator: '>=',
                value: startDate
            }, {
                datastore: '',
                database: DashboardServiceMock.DATABASES[0],
                table: DashboardServiceMock.TABLES[0],
                field: DashboardServiceMock.DATE_FIELD,
                operator: '<=',
                value: endDate
            }]
        }, {
            root: 'or',
            datastore: '',
            database: DashboardServiceMock.DATABASES[0],
            table: DashboardServiceMock.TABLES[0],
            field: DashboardServiceMock.FILTER_FIELD,
            operator: '=',
            value: 'filterValue1'
        }, {
            root: 'or',
            datastore: '',
            database: DashboardServiceMock.DATABASES[0],
            table: DashboardServiceMock.TABLES[0],
            field: DashboardServiceMock.FILTER_FIELD,
            operator: '=',
            value: 'filterValue2'
        }, {
            root: 'or',
            datastore: '',
            database: DashboardServiceMock.DATABASES[0],
            table: DashboardServiceMock.TABLES[0],
            field: DashboardServiceMock.FILTER_FIELD,
            operator: '=',
            value: 'filterValue3'
        }]]);
    });

    it('finalizeVisualizationQuery does return expected query without id and filter fields', () => {
        component.options.database = DashboardServiceMock.DATABASES[0];
        component.options.table = DashboardServiceMock.TABLES[0];
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                field: 'testDateField',
                operator: '!=',
                value: null
            },
            groups: [{
                field: 'testDateField',
                type: 'year'
            }],
            aggregation: [
                {
                    type: 'min',
                    name: '_date',
                    field: 'testDateField'
                },
                {
                    type: 'count',
                    name: '_aggregation',
                    field: '_year'
                }
            ],
            sort: {
                field: '_date',
                order: 1
            }
        });

        component.options.granularity = 'month';

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                field: 'testDateField',
                operator: '!=',
                value: null
            },
            groups: [{
                field: 'testDateField',
                type: 'month'
            },
            {
                field: 'testDateField',
                type: 'year'
            }],
            aggregation: [
                {
                    type: 'min',
                    name: '_date',
                    field: 'testDateField'
                },
                {
                    type: 'count',
                    name: '_aggregation',
                    field: '_month'
                }
            ],
            sort: {
                field: '_date',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected query with id and filter fields', () => {
        component.options.database = DashboardServiceMock.DATABASES[0];
        component.options.table = DashboardServiceMock.TABLES[0];
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                field: 'testDateField',
                operator: '!=',
                value: null
            },
            groups: ['testFilterField',
                'testIdField',
                {
                    field: 'testDateField',
                    type: 'year'
                }],
            aggregation: [
                {
                    type: 'min',
                    name: '_date',
                    field: 'testDateField'
                },
                {
                    type: 'count',
                    name: '_aggregation',
                    field: '_year'
                }
            ],
            sort: {
                field: '_date',
                order: 1
            }
        });

        component.options.granularity = 'day';

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                field: 'testDateField',
                operator: '!=',
                value: null
            },
            groups: ['testFilterField',
                'testIdField',
                {
                    field: 'testDateField',
                    type: 'dayOfMonth'
                },
                {
                    field: 'testDateField',
                    type: 'month'
                },
                {
                    field: 'testDateField',
                    type: 'year'
                }],
            aggregation: [
                {
                    type: 'min',
                    name: '_date',
                    field: 'testDateField'
                },
                {
                    type: 'count',
                    name: '_aggregation',
                    field: '_day'
                }
            ],
            sort: {
                field: '_date',
                order: 1
            }
        });
    });

    it('transformVisualizationQueryResults does return expected data with id and filter fields', () => {
        component.options.database = DashboardServiceMock.DATABASES[0];
        component.options.table = DashboardServiceMock.TABLES[0];
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');
        component.options.granularity = 'month';

        let actual = component.transformVisualizationQueryResults(component.options, [{
            testFilterField: 'filter1',
            testIdField: 'id1',
            _aggregation: 1,
            _date: 1509035593000,
            _month: 10,
            _year: 2017
        }, {
            testFilterField: 'filter2',
            testIdField: 'id2',
            _aggregation: 1,
            _date: 1509035593000,
            _month: 10,
            _year: 2017
        }, {
            testFilterField: 'filter3',
            testIdField: 'id3',
            _aggregation: 1,
            _date: 1509035593000,
            _month: 10,
            _year: 2017
        }, {
            testIdField: 'id4',
            testFilterField: 'filter4',
            _aggregation: 1,
            _date: 1515110400000,
            _month: 1,
            _year: 2018
        }]);

        expect(actual).toEqual(4);
        // Expected date value equals UTCMonth - 1
        expect(component.timelineQueryResults).toEqual([{
            value: 3,
            ids: ['id1', 'id2', 'id3'],
            filters: ['filter1', 'filter2', 'filter3'],
            origDate: 1509035593000,
            date: new Date(2017, 9, 26, 12, 33, 13)
        }, {
            value: 1,
            ids: ['id4'],
            filters: ['filter4'],
            origDate: 1515110400000,
            date: new Date(2017, 12, 4, 19, 0, 0)
        }]);
    });

    it('transformVisualizationQueryResults does return expected data without id and filter fields', () => {
        component.options.database = DashboardServiceMock.DATABASES[0];
        component.options.table = DashboardServiceMock.TABLES[0];
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

        let actual = component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'id1',
            _aggregation: 10,
            _date: 1509035593000,
            _month: 10,
            _year: 2017
        }, {
            testIdField: 'id2',
            _aggregation: 1,
            _date: 1515110400000,
            _month: 1,
            _year: 2018
        }]);

        expect(actual).toEqual(11);
        // Expected date value equals UTCMonth - 1
        expect(component.timelineQueryResults).toEqual([{
            value: 10,
            date: new Date(2017, 9, 26, 12, 33, 13)
        }, {
            value: 1,
            date: new Date(2017, 12, 4, 19, 0, 0)
        }]);
    });

    it('findDateInPreviousItem does return a previous item when the current item is within range of granularity', () => {
        component.options.granularity = 'year';

        let previousItem = component.findDateInPreviousItem([{
            value: 1,
            ids: ['id1'],
            filters: ['filter1'],
            origDate: 1509035593000,
            date: new Date(2017, 9, 26, 12, 33, 13)
        }, {
            value: 1,
            ids: ['id2'],
            filters: ['filter2'],
            origDate: 1515110400000,
            date: new Date(2017, 12, 4, 19, 0, 0)
        }], {
            testIdField: 'id3',
            testFilterField: 'filter3',
            _aggregation: 1,
            _date: 1515123034000, // Date(2017, 12, 4, 22, 30, 34)
            _month: 1,
            _year: 2018

        });

        // Expected date value equals UTCMonth - 1
        expect(previousItem).toEqual({
            value: 1,
            ids: ['id2'],
            filters: ['filter2'],
            origDate: 1515110400000,
            date: new Date(2017, 12, 4, 19, 0, 0)
        });

        component.options.granularity = 'day';

        let previousItem2 = component.findDateInPreviousItem([{
            value: 1,
            ids: ['id1'],
            filters: ['filter1'],
            origDate: 1509035593000,
            date: new Date(2017, 9, 26, 12, 33, 13)
        }, {
            value: 1,
            ids: ['id2'],
            filters: ['filter2'],
            origDate: 1515110400000,
            date: new Date(2017, 12, 4, 19, 0, 0)
        }], {
            testIdField: 'id3',
            testFilterField: 'filter3',
            _aggregation: 1,
            _date: 1515123034000, // Date(2017, 12, 4, 22, 30, 34)
            _month: 1,
            _year: 2018

        });

        // Expected date value equals UTCMonth - 1
        expect(previousItem2).toEqual({
            value: 1,
            ids: ['id2'],
            filters: ['filter2'],
            origDate: 1515110400000,
            date: new Date(2017, 12, 4, 19, 0, 0)
        });
    });

    it('findDateInPreviousItem does not return a previous item when the current item is not within range of granularity', () => {
        component.options.database = DashboardServiceMock.DATABASES[0];
        component.options.table = DashboardServiceMock.TABLES[0];
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');
        component.options.granularity = 'hour';

        let previousItem = component.findDateInPreviousItem([{
            value: 1,
            ids: ['id1'],
            filters: ['filter1'],
            origDate: 1509035593000,
            date: new Date(2017, 9, 26, 12, 33, 13)
        }, {
            value: 1,
            ids: ['id2'],
            filters: ['filter2'],
            origDate: 1515110400000,
            date: new Date(2017, 12, 4, 19, 0, 0)
        }], {
            testIdField: 'id3',
            testFilterField: 'filter3',
            _aggregation: 1,
            _date: 1515123034000, // Date(2017, 12, 4, 22, 30, 34)
            _month: 1,
            _year: 2018

        });

        expect(previousItem).toEqual(undefined);

        component.options.granularity = 'minute';

        let previousItem2 = component.findDateInPreviousItem([{
            value: 1,
            ids: ['id1'],
            filters: ['filter1'],
            origDate: 1509035593000,
            date: new Date(2017, 9, 26, 12, 33, 13)
        }, {
            value: 1,
            ids: ['id2'],
            filters: ['filter2'],
            origDate: 1515110400000,
            date: new Date(2017, 12, 4, 19, 0, 0)
        }], {
            testIdField: 'id3',
            testFilterField: 'filter3',
            _aggregation: 1,
            _date: 1515123034000, // Date(2017, 12, 4, 22, 30, 34)
            _month: 1,
            _year: 2018

        });

        expect(previousItem2).toEqual(undefined);
    });
});
