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
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { } from 'jasmine-core';

import { TimelineComponent } from './timeline.component';

import {
    AbstractSearchService,
    CompoundFilterType,
    CoreSearch,
    DomainFilterDesign,
    FieldConfig,
    FilterCollection,
    ListFilterDesign,
    SearchServiceMock,
    TimeInterval
} from '@caci-critical-insight-solutions/nucleus-core';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DashboardServiceMock } from '../../services/mock.dashboard-service';

import { TimelineModule } from './timeline.module';

describe('Component: Timeline', () => {
    let component: TimelineComponent;
    let fixture: ComponentFixture<TimelineComponent>;

    initializeTestBed('Timeline', {
        providers: [
            InjectableColorThemeService,
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
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

        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;

        let date = new Date();
        let startDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 3, date.getDay());
        let endDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 2, date.getDay());

        component.onTimelineSelection(startDate, endDate, []);

        expect((component as any).selected).toEqual([startDate, endDate]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new DomainFilterDesign(DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.DATE.columnName, startDate, endDate)
        ]]);
    });

    it('onTimelineSelection does not set custom filters if filterField does not exist', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;

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
        expect(spy.calls.argsFor(0)).toEqual([[
            new DomainFilterDesign(DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.DATE.columnName, startDate, endDate)
        ]]);
    });

    it('onTimelineSelection does set custom filters on empty string if filterField does exist but selectedData does not exist', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.filterField = DashboardServiceMock.FIELD_MAP.FILTER;

        let date = new Date();
        let startDate = new Date(date.getUTCFullYear() - 1, date.getUTCMonth(), date.getDay());
        let endDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDay());

        component.onTimelineSelection(startDate, endDate, []);

        expect((component as any).selected).toEqual([startDate, endDate]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new DomainFilterDesign(DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.DATE.columnName, startDate, endDate),
            // TODO NEON-36
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.FILTER.columnName, '=', [''])
        ]]);
    });

    it('onTimelineSelection does set custom filters if filterField and selectedData both exist', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.filterField = DashboardServiceMock.FIELD_MAP.FILTER;

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
        expect(spy.calls.argsFor(0)).toEqual([[
            new DomainFilterDesign(DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.DATE.columnName, startDate, endDate),
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.FILTER.columnName, '=', ['filterValue1', 'filterValue2', 'filterValue3'])
        ]]);
    });

    it('finalizeVisualizationQuery does return expected query without id and filter fields', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.dateField = FieldConfig.get({ columnName: 'testDateField', prettyName: 'Test Date Field' });

        let searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_date',
                operation: 'min'
            }, {
                type: 'group',
                group: '_year',
                label: '_aggregation'
            }],
            groupByClauses: [{
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_year',
                operation: 'year'
            }],
            orderByClauses: [{
                type: 'operation',
                operation: '_date',
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });

        searchObject = new CoreSearch(component.options.database.name, component.options.table.name);
        component.options.granularity = TimeInterval.DAY_OF_MONTH;

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_date',
                operation: 'min'
            }, {
                type: 'group',
                group: '_dayOfMonth',
                label: '_aggregation'
            }],
            groupByClauses: [{
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_dayOfMonth',
                operation: 'dayOfMonth'
            }, {
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_month',
                operation: 'month'
            }, {
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_year',
                operation: 'year'
            }],
            orderByClauses: [{
                type: 'operation',
                operation: '_date',
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('finalizeVisualizationQuery does return expected query with id and filter fields', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.dateField = FieldConfig.get({ columnName: 'testDateField', prettyName: 'Test Date Field' });
        component.options.filterField = FieldConfig.get({ columnName: 'testFilterField', prettyName: 'Test Filter Field' });
        component.options.idField = FieldConfig.get({ columnName: 'testIdField', prettyName: 'Test ID Field' });

        let searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_date',
                operation: 'min'
            }, {
                type: 'group',
                group: '_year',
                label: '_aggregation'
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testFilterField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testIdField'
                }
            }, {
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_year',
                operation: 'year'
            }],
            orderByClauses: [{
                type: 'operation',
                operation: '_date',
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });

        searchObject = new CoreSearch(component.options.database.name, component.options.table.name);
        component.options.granularity = TimeInterval.DAY_OF_MONTH;

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_date',
                operation: 'min'
            }, {
                type: 'group',
                group: '_dayOfMonth',
                label: '_aggregation'
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testFilterField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testIdField'
                }
            }, {
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_dayOfMonth',
                operation: 'dayOfMonth'
            }, {
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_month',
                operation: 'month'
            }, {
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_year',
                operation: 'year'
            }],
            orderByClauses: [{
                type: 'operation',
                operation: '_date',
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('transformVisualizationQueryResults does return expected data with id and filter fields', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.dateField = FieldConfig.get({ columnName: 'testDateField', prettyName: 'Test Date Field' });
        component.options.filterField = FieldConfig.get({ columnName: 'testFilterField', prettyName: 'Test Filter Field' });
        component.options.idField = FieldConfig.get({ columnName: 'testIdField', prettyName: 'Test ID Field' });
        component.options.granularity = TimeInterval.MONTH;

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
        }], new FilterCollection());

        expect(actual).toEqual(4);
        // Expected date value equals UTCMonth - 1
        expect(component.timelineQueryResults).toEqual([{
            value: 3,
            ids: ['id1', 'id2', 'id3'],
            filters: ['filter1', 'filter2', 'filter3'],
            origDate: 1509035593000,
            date: new Date(1509035593000)
        }, {
            value: 1,
            ids: ['id4'],
            filters: ['filter4'],
            origDate: 1515110400000,
            date: new Date(1515110400000)
        }]);
    });

    it('transformVisualizationQueryResults does return expected data without id and filter fields', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.dateField = FieldConfig.get({ columnName: 'testDateField', prettyName: 'Test Date Field' });

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
        }], new FilterCollection());

        expect(actual).toEqual(11);
        // Expected date value equals UTCMonth - 1
        expect(component.timelineQueryResults).toEqual([{
            value: 10,
            date: new Date(1509035593000)
        }, {
            value: 1,
            date: new Date(1515110400000)
        }]);
    });

    it('findDateInPreviousItem does return a previous item when the current item is within range of granularity', () => {
        component.options.granularity = TimeInterval.YEAR;

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

        component.options.granularity = TimeInterval.DAY_OF_MONTH;

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
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.dateField = FieldConfig.get({ columnName: 'testDateField', prettyName: 'Test Date Field' });
        component.options.filterField = FieldConfig.get({ columnName: 'testFilterField', prettyName: 'Test Filter Field' });
        component.options.idField = FieldConfig.get({ columnName: 'testIdField', prettyName: 'Test ID Field' });
        component.options.granularity = TimeInterval.HOUR;

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

        component.options.granularity = TimeInterval.MINUTE;

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
