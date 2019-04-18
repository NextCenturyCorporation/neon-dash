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
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {} from 'jasmine-core';

import * as neon from 'neon-framework';
import { FieldMetaData } from '../../dataset';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { AppMaterialModule } from '../../app.material.module';
import { ExportControlComponent } from '../export-control/export-control.component';
import { TimelineComponent, TransformedTimelineAggregationData } from './timeline.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { WidgetService } from '../../services/widget.service';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';

describe('Component: Timeline', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: TimelineComponent;
    let fixture: ComponentFixture<TimelineComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            TimelineComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            {provide: AbstractWidgetService, useClass: WidgetService},
            {provide: DatasetService, useClass: DatasetServiceMock},
            {provide: FilterService, useClass: FilterServiceMock},
            {provide: AbstractSearchService, useClass: SearchServiceMock},
            Injector,
            {provide: 'config', useValue: testConfig}
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimelineComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('createNeonFilter returns where clauses for the date range', () => {
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');
        let dateFilter = {
            field: component.options.dateField.columnName,
            startDate: new Date(2018, 12, 24),
            endDate: new Date()
        };

        let neonQuery = component.createNeonFilter(dateFilter);

        let filterClauses = [
                neon.query.where('testDateField', '>=', dateFilter.startDate),
                neon.query.where('testDateField', '<', dateFilter.endDate)
            ],
            expected = neon.query.and.apply(neon.query, filterClauses);

        expect(neonQuery).toEqual(expected);
    });

    it('createNeonFieldFilter returns where clauses for the filter values', () => {
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        let neonQuery = component.createNeonFieldFilter(component.options.filterField.columnName, ['idValue1', 'idValue2']);

        let filterClauses = [
                neon.query.where('testFilterField', '=', 'idValue1'),
                neon.query.where('testFilterField', '=', 'idValue2')
            ],
            expected = neon.query.or.apply(neon.query, filterClauses);

        expect(neonQuery).toEqual(expected);
    });

    it('onTimelineSelection adds a new date filter when there is no selectedData and no existing filters ', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

        let date = new Date(),
            startDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 3, date.getDay()),
            endDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 2, date.getDay());

        let selectedData = [];

        component.onTimelineSelection(startDate, endDate, selectedData);

        expect(spy1.calls.count()).toEqual(1);

        expect(spy1.calls.argsFor(0)).toEqual([component.options, false, {
            id: undefined,
            field: component.options.dateField.columnName,
            prettyField: component.options.dateField.prettyName,
            startDate: startDate,
            endDate: endDate,
            local: true
        }, neon.query.and.apply(neon.query, [
            neon.query.where('testDateField', '>=', startDate),
            neon.query.where('testDateField', '<', endDate)
        ])]);

        expect(spy2.calls.count()).toEqual(0);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((f) => {
            return f.id;
        }));

    });

    it('onTimelineSelection replaces the existing date filter when there is no selectedData ', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query,
                [
                    neon.query.where('testDateField', '>=', ''),
                    neon.query.where('testDateField', '<', '')]
            ), 'testDateName1');

        let neonFilters = getService(FilterService).getFiltersForFields(component.options.database.name, component.options.table.name,
            [component.options.dateField.columnName]);

        component.addLocalFilter(neonFilters[0].id, component.options.dateField.columnName,
            component.options.dateField.prettyName, neonFilters[0].filter.whereClause.whereClauses[0].rhs,
            neonFilters[0].filter.whereClause.whereClauses[1].rhs);

        let date = new Date(),
            startDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDay() - 8),
            endDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDay() - 4);

        let selectedData = [];

        component.onTimelineSelection(startDate, endDate, selectedData);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);

        expect(spy2.calls.argsFor(0)).toEqual([component.options, false, {
            id: 'testDatabase1-testTable1-testDateName1',
            field: component.options.dateField.columnName,
            prettyField: component.options.dateField.prettyName,
            startDate: startDate,
            endDate: endDate,
            local: true
        }, neon.query.and.apply(neon.query, [
            neon.query.where('testDateField', '>=', startDate),
            neon.query.where('testDateField', '<', endDate)
        ])]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((f) => {
            return f.id;
        }));
    });

    it('manageFieldFilters does not get called if filterField and selectedData do not exist', () => {

        let spy1 = spyOn(component, 'manageFieldFilters');
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

        let date = new Date(),
            startDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 5, date.getDay()),
            endDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 3, date.getDay());

        let selectedData = [];
        component.onTimelineSelection(startDate, endDate, selectedData);

        expect(spy1.calls.count()).toEqual(0);
    });

    it('manageFieldFilters does not get called if filterField does not exist', () => {
        let spy1 = spyOn(component, 'manageFieldFilters');
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

        let date = new Date(),
            startDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 2, date.getDay()),
            endDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 1, date.getDay());

        let selectedData = [
            {
                date: new Date(date.getUTCDay() - 45),
                value: 10,
                filters: ['filterValue1', 'filterValue2', 'filterValue3']
            },
            {
                date: new Date(date.getUTCDay() - 32),
                value: 10,
                filters: ['filterValue4', 'filterValue5']
            }
        ];
        component.onTimelineSelection(startDate, endDate, selectedData);

        expect(spy1.calls.count()).toEqual(0);
    });

    it('manageFieldFilters does not get called if selectedData does not exist', () => {
        let spy1 = spyOn(component, 'manageFieldFilters');
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        let date = new Date(),
            startDate = new Date(date.getUTCFullYear() - 1, date.getUTCMonth(), date.getDay()),
            endDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDay());

        let selectedData = [];
        component.onTimelineSelection(startDate, endDate, selectedData);

        expect(spy1.calls.count()).toEqual(0);
    });

    it('manageFieldFilters gets called if filterField and selectedData exist', () => {
        let spy1 = spyOn(component, 'manageFieldFilters');
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        let date = new Date(),
            startDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 2, date.getDay()),
            endDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 1, date.getDay());

        let selectedData = [
            {
                date: new Date(date.getUTCDay() - 45),
                value: 10,
                filters: ['filterValue1', 'filterValue2', 'filterValue3']
            },
            {
                date: new Date(date.getUTCDay() - 32),
                value: 10,
                filters: ['filterValue4', 'filterValue5']
            }
        ];
        component.onTimelineSelection(startDate, endDate, selectedData);

        expect(spy1.calls.count()).toEqual(1);
    });

    it('manageFieldFilters with no existing filters does add a new filter', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.idField = new FieldMetaData('testIDField', 'Test ID Field');

        let filter = {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: ['test text1', 'test text2']
        };
        component.manageFieldFilters(filter, [], false);

        expect(spy1.calls.count()).toEqual(1);

        expect(spy1.calls.argsFor(0)).toEqual([component.options, false, {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: ['test text1', 'test text2']
        }, neon.query.or.apply(neon.query, [
            neon.query.where('testFilterField', '=', 'test text1'),
            neon.query.where('testFilterField', '=', 'test text2')
        ])]);

        expect(spy2.calls.count()).toEqual(0);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((f) => {
            return f.id;
        }));

    });

    it('manageFieldFilters replaces an existing filter', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'test text1'), 'testFilterName1');

        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let fields = ['testFilterField'];

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');

        let neonFilters = getService(FilterService).getFiltersForFields(component.options.database.name, component.options.table.name,
            fields);

        let filter = {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: ['test text1', 'test text2', 'test text3']
        };

        component.manageFieldFilters(filter, neonFilters, false);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);

        expect(spy2.calls.argsFor(0)).toEqual([component.options, false, {
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: ['test text1', 'test text2', 'test text3']
        }, neon.query.or.apply(neon.query, [
            neon.query.where('testFilterField', '=', 'test text1'),
            neon.query.where('testFilterField', '=', 'test text2'),
            neon.query.where('testFilterField', '=', 'test text3')
        ])]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((f) => {
            return f.id;
        }));
    });

    it('getFilterText does return expected filter string', () => {
        let startDate = new Date(2019, 2, 13),
            endDate = new Date(2019, 5, 24);

        expect(component.getFilterText({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        })).toEqual('prettyField1 = value1');

        //Date month value equals UTCMonth + 1
        expect(component.getFilterText({
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            startDate: startDate,
            endDate: endDate
        })).toEqual('prettyField2 from 3/13/2019 to 6/24/2019');

    });

    it('finalizeVisualizationQuery does return expected query without id and filter fields', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
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
            }
            ],
            aggregation: [
                {
                    type: 'min',
                    name: '_date',
                    field: 'testDateField'
                },
                {
                    type: 'count',
                    name: '_aggregation',
                    field: '*'
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
                }
            ],
            aggregation: [
                {
                    type: 'min',
                    name: '_date',
                    field: 'testDateField'
                },
                {
                    type: 'count',
                    name: '_aggregation',
                    field: '*'
                }
            ],
            sort: {
                field: '_date',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected query with id and filter fields', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
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
                }
            ],
            aggregation: [
                {
                    type: 'min',
                    name: '_date',
                    field: 'testDateField'
                },
                {
                    type: 'count',
                    name: '_aggregation',
                    field: '*'
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
                }
            ],
            aggregation: [
                {
                    type: 'min',
                    name: '_date',
                    field: 'testDateField'
                },
                {
                    type: 'count',
                    name: '_aggregation',
                    field: '*'
                }
            ],
            sort: {
                field: '_date',
                order: 1
            }
        });
    });

    it('getFiltersToIgnore does return null if no filters are set', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;

        expect(component.getFiltersToIgnore()).toEqual(null);

    });

    it('getFiltersToIgnore does return null if one filter is set', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testDateField', '!=', null), 'testDateName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore with ignoreSelf=true does return expected array of IDs if 2 filters are set matching database/table/field',
        () => {
            let date = new Date(),
                startDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDay() - 12),
                endDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDay() - 2);

            getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
                neon.query.or.apply(neon.query, [
                    neon.query.where('testDateField', '>=', startDate),
                    neon.query.where('testDateField', '<', endDate)
                ]), 'testDateName1');

            component.options.database = DatasetServiceMock.DATABASES[0];
            component.options.table = DatasetServiceMock.TABLES[0];
            component.options.fields = DatasetServiceMock.FIELDS;
            component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

            expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testDateName1']);

            getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
                return filter.id;
            }));
        });

    it('getFiltersToIgnore with ignoreSelf=true does return null if filters have more than two clauses', () => {
        let date = new Date(),
            startDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 6, date.getDay()),
            endDate = new Date(date.getUTCFullYear(), date.getUTCMonth() - 4, date.getDay());

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.or.apply(neon.query, [
                neon.query.where('testDateField', '!=', null),
                neon.query.where('testDateField', '>=', startDate),
                neon.query.where('testDateField', '<', endDate)
            ]), 'testDateName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('transformVisualizationQueryResults does return expected data with id and filter fields', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
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
            testIdField: 'id2',
            testFilterField: 'filter2',
            _aggregation: 1,
            _date: 1515110400000,
            _month: 1,
            _year: 2018

        }]);

        //Expected date value equals UTCMonth - 1
        expect(actual.data).toEqual([{
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
        }]);
    });

    it('transformVisualizationQueryResults does return expected data without id and filter fields', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.dateField = new FieldMetaData('testDateField', 'Test Date Field');

        let actual = component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'id1',
            _aggregation: 1,
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

        //Expected date value equals UTCMonth - 1
        expect(actual.data).toEqual([{
            value: 1,
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
            _date: 1515123034000, //new Date(2017, 12, 4, 22, 30, 34)
            _month: 1,
            _year: 2018

        });

        //Expected date value equals UTCMonth - 1
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
            _date: 1515123034000, //new Date(2017, 12, 4, 22, 30, 34)
            _month: 1,
            _year: 2018

        });

        //Expected date value equals UTCMonth - 1
        expect(previousItem2).toEqual({
            value: 1,
            ids: ['id2'],
            filters: ['filter2'],
            origDate: 1515110400000,
            date: new Date(2017, 12, 4, 19, 0, 0)
        });
    });

    it('findDateInPreviousItem does not return a previous item when the current item is not within range of granularity', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
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
            _date: 1515123034000, //new Date(2017, 12, 4, 22, 30, 34)
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
            _date: 1515123034000, //new Date(2017, 12, 4, 22, 30, 34)
            _month: 1,
            _year: 2018

        });

        expect(previousItem2).toEqual(undefined);
    });

})
;
