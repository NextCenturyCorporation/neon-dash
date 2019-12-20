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

import { DataTableComponent } from './data-table.component';

import { AbstractSearchService } from 'nucleus/dist/core/services/abstract.search.service';
import { CompoundFilterType } from 'nucleus/dist/core/models/config-option';
import { DashboardService } from '../../services/dashboard.service';
import { FilterCollection, ListFilterDesign } from 'nucleus/dist/core/models/filters';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { DatabaseConfig, FieldConfig, TableConfig } from 'nucleus/dist/core/models/dataset';
import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { SearchServiceMock } from 'nucleus/dist/core/services/mock.search.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { DataTableModule } from './data-table.module';
import { CoreSearch } from 'nucleus/dist/core/services/search.service';

// TODO Change toHaveBeenCalled to toHaveBeenCalledWith
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */

describe('Component: DataTable', () => {
    let component: DataTableComponent;
    let fixture: ComponentFixture<DataTableComponent>;

    initializeTestBed('Data Table', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            DataTableModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DataTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0]).type).toEqual('and');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).values).toEqual([undefined]);

        component.options.arrayFilterOperator = 'or';
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0]).type).toEqual('or');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).values).toEqual([undefined]);

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY, DashboardServiceMock.FIELD_MAP.TEXT];
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0]).type).toEqual('or');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).values).toEqual([undefined]);
        expect((actual[1]).type).toEqual('or');
        expect((actual[1]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TEXT.columnName);
        expect((actual[1]).operator).toEqual('=');
        expect((actual[1]).values).toEqual([undefined]);
    });

    it('onResize does call refreshVisualization', () => {
        let spy = spyOn(component, 'refreshVisualization');

        component.onResize();

        expect(spy).toHaveBeenCalled();
    });

    it('initializeProperties does create the expected headers in order', () => {
        let spy = spyOn(component, 'recalculateActiveHeaders');

        component.headers = [];
        component.options.fields = [
            FieldConfig.get({ columnName: 'category', prettyName: 'Category' }),
            FieldConfig.get({ columnName: 'field1', prettyName: 'Field 1' }),
            FieldConfig.get({ columnName: 'field2', prettyName: 'Field 2' }),
            FieldConfig.get({ columnName: 'date', prettyName: 'Date' })
        ];

        component['initializeProperties']();

        expect(component.headers.length).toEqual(4);
        expect(component.headers[0].prop).toEqual('category');
        expect(component.headers[0].name).toEqual('Category');
        expect(component.headers[0].active).toEqual(true);
        expect(component.headers[0].style).toEqual({});
        expect(component.headers[0].cellClass).toBeDefined();
        expect(component.headers[0].widthAuto).toEqual(100);
        expect(component.headers[0].widthUser).toEqual(null);
        expect(component.headers[1].prop).toEqual('field1');
        expect(component.headers[1].name).toEqual('Field 1');
        expect(component.headers[1].active).toEqual(true);
        expect(component.headers[1].style).toEqual({});
        expect(component.headers[1].cellClass).toBeDefined();
        expect(component.headers[1].widthAuto).toEqual(100);
        expect(component.headers[1].widthUser).toEqual(null);
        expect(component.headers[2].prop).toEqual('field2');
        expect(component.headers[2].name).toEqual('Field 2');
        expect(component.headers[2].active).toEqual(true);
        expect(component.headers[2].style).toEqual({});
        expect(component.headers[2].cellClass).toBeDefined();
        expect(component.headers[2].widthAuto).toEqual(100);
        expect(component.headers[2].widthUser).toEqual(null);
        expect(component.headers[3].prop).toEqual('date');
        expect(component.headers[3].name).toEqual('Date');
        expect(component.headers[3].active).toEqual(true);
        expect(component.headers[3].style).toEqual({});
        expect(component.headers[3].cellClass).toBeDefined();
        expect(component.headers[3].widthAuto).toEqual(100);
        expect(component.headers[3].widthUser).toEqual(null);

        expect(spy).toHaveBeenCalled();
    });

    it('initializeProperties does work as expected with configured showFields', () => {
        let spy = spyOn(component, 'recalculateActiveHeaders');

        component.headers = [];
        component.options.fields = [
            FieldConfig.get({ columnName: 'category', prettyName: 'Category' }),
            FieldConfig.get({ columnName: 'field1', prettyName: 'Field 1' }),
            FieldConfig.get({ columnName: 'field2', prettyName: 'Field 2' }),
            FieldConfig.get({ columnName: 'date', prettyName: 'Date' })
        ];
        component.options.showFields = [component.options.fields[0], component.options.fields[3]];

        component['initializeProperties']();

        expect(component.headers.length).toEqual(4);
        expect(component.headers[0].prop).toEqual('category');
        expect(component.headers[0].name).toEqual('Category');
        expect(component.headers[0].active).toEqual(true);
        expect(component.headers[0].style).toEqual({});
        expect(component.headers[0].cellClass).toBeDefined();
        expect(component.headers[0].widthAuto).toEqual(100);
        expect(component.headers[0].widthUser).toEqual(null);
        expect(component.headers[1].prop).toEqual('field1');
        expect(component.headers[1].name).toEqual('Field 1');
        expect(component.headers[1].active).toEqual(false);
        expect(component.headers[1].style).toEqual({});
        expect(component.headers[1].cellClass).toBeDefined();
        expect(component.headers[1].widthAuto).toEqual(100);
        expect(component.headers[1].widthUser).toEqual(null);
        expect(component.headers[2].prop).toEqual('field2');
        expect(component.headers[2].name).toEqual('Field 2');
        expect(component.headers[2].active).toEqual(false);
        expect(component.headers[2].style).toEqual({});
        expect(component.headers[2].cellClass).toBeDefined();
        expect(component.headers[2].widthAuto).toEqual(100);
        expect(component.headers[2].widthUser).toEqual(null);
        expect(component.headers[3].prop).toEqual('date');
        expect(component.headers[3].name).toEqual('Date');
        expect(component.headers[3].active).toEqual(true);
        expect(component.headers[3].style).toEqual({});
        expect(component.headers[3].cellClass).toBeDefined();
        expect(component.headers[3].widthAuto).toEqual(100);
        expect(component.headers[3].widthUser).toEqual(null);

        expect(spy).toHaveBeenCalled();
    });

    it('initializeProperties does work as expected with configured customColumnWidths', () => {
        let spy = spyOn(component, 'recalculateActiveHeaders');

        component.headers = [];
        component.options.fields = [
            FieldConfig.get({ columnName: 'category', prettyName: 'Category' }),
            FieldConfig.get({ columnName: 'field1', prettyName: 'Field 1' }),
            FieldConfig.get({ columnName: 'field2', prettyName: 'Field 2' }),
            FieldConfig.get({ columnName: 'date', prettyName: 'Date' })
        ];
        component.options.customColumnWidths = [
            ['category', 123],
            ['date', 456]
        ];

        component['initializeProperties']();

        expect(component.headers.length).toEqual(4);
        expect(component.headers[0].prop).toEqual('category');
        expect(component.headers[0].name).toEqual('Category');
        expect(component.headers[0].active).toEqual(true);
        expect(component.headers[0].style).toEqual({});
        expect(component.headers[0].cellClass).toBeDefined();
        expect(component.headers[0].widthAuto).toEqual(123);
        expect(component.headers[0].widthUser).toEqual(null);
        expect(component.headers[1].prop).toEqual('field1');
        expect(component.headers[1].name).toEqual('Field 1');
        expect(component.headers[1].active).toEqual(true);
        expect(component.headers[1].style).toEqual({});
        expect(component.headers[1].cellClass).toBeDefined();
        expect(component.headers[1].widthAuto).toEqual(100);
        expect(component.headers[1].widthUser).toEqual(null);
        expect(component.headers[2].prop).toEqual('field2');
        expect(component.headers[2].name).toEqual('Field 2');
        expect(component.headers[2].active).toEqual(true);
        expect(component.headers[2].style).toEqual({});
        expect(component.headers[2].cellClass).toBeDefined();
        expect(component.headers[2].widthAuto).toEqual(100);
        expect(component.headers[2].widthUser).toEqual(null);
        expect(component.headers[3].prop).toEqual('date');
        expect(component.headers[3].name).toEqual('Date');
        expect(component.headers[3].active).toEqual(true);
        expect(component.headers[3].style).toEqual({});
        expect(component.headers[3].cellClass).toBeDefined();
        expect(component.headers[3].widthAuto).toEqual(456);
        expect(component.headers[3].widthUser).toEqual(null);

        expect(spy).toHaveBeenCalled();
    });

    it('retrieveConfiguredColumnWidth returns the width of the matching column in options.customColumnWidths', () => {
        component.options.customColumnWidths = [
            ['fieldWithCustomWidth', 260]
        ];

        expect(component.retrieveConfiguredColumnWidth('fieldWithCustomWidth')).toEqual(260);
    });

    it('retrieveConfiguredColumnWidth returns the default width if field not found in options.customColumnWidths', () => {
        component.options.customColumnWidths = [
            ['fieldWithNoMatch', 300]
        ];

        expect(component.retrieveConfiguredColumnWidth('anotherColumn')).toEqual(null);
    });

    it('recalculateActiveHeaders does update activeHeaders and call detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.headers = [{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }];

        spyOn(component, 'getVisualizationWidth').and.returnValue(100);

        component.recalculateActiveHeaders();

        expect(spy).toHaveBeenCalled();
        expect(component.headers).toEqual([{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }]);
        expect(component.activeHeaders).toEqual([{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }]);
    });

    it('recalculateActiveHeaders does increase widths if visualization is bigger than table and call detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.headers = [{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field3',
            name: 'Field 3',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field4',
            name: 'Field 4',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }];

        spyOn(component, 'getVisualizationWidth').and.returnValue(900);

        component.recalculateActiveHeaders();

        expect(spy).toHaveBeenCalled();
        expect(component.headers).toEqual([{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field3',
            name: 'Field 3',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field4',
            name: 'Field 4',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }]);
        expect(component.activeHeaders).toEqual([{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field3',
            name: 'Field 3',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }]);
    });

    it('recalculateActiveHeaders does decrease widths if table is bigger than visualization and call detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.headers = [{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 500,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 500,
            widthUser: null
        }, {
            prop: 'field3',
            name: 'Field 3',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 500,
            widthUser: null
        }, {
            prop: 'field4',
            name: 'Field 4',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 500,
            widthUser: null
        }];

        spyOn(component, 'getVisualizationWidth').and.returnValue(900);

        component.recalculateActiveHeaders();

        expect(spy).toHaveBeenCalled();
        expect(component.headers).toEqual([{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field3',
            name: 'Field 3',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field4',
            name: 'Field 4',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 500,
            widthUser: null
        }]);
        expect(component.activeHeaders).toEqual([{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field3',
            name: 'Field 3',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }]);
    });

    it('recalculateActiveHeaders does not change widths of columns with widthUser', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.headers = [{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: 100
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: 500
        }, {
            prop: 'field3',
            name: 'Field 3',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field4',
            name: 'Field 4',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }];

        spyOn(component, 'getVisualizationWidth').and.returnValue(900);

        component.recalculateActiveHeaders();

        expect(spy).toHaveBeenCalled();
        expect(component.headers).toEqual([{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: 100
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: 500
        }, {
            prop: 'field3',
            name: 'Field 3',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }, {
            prop: 'field4',
            name: 'Field 4',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }]);
        expect(component.activeHeaders).toEqual([{
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: 100
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: 500
        }, {
            prop: 'field3',
            name: 'Field 3',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 300,
            widthUser: null
        }]);
    });

    it('refreshVisualization does call expected functions', ((done) => {
        let recalcHeadersSpy = spyOn(component, 'recalculateActiveHeaders');
        let tableRecalcSpy = spyOn(component.table, 'recalculate');
        let detectChangesSpy = spyOn(component.table.cd, 'detectChanges');

        component.refreshVisualization();

        setTimeout(() => {
            expect(recalcHeadersSpy).toHaveBeenCalled();
            expect(tableRecalcSpy).toHaveBeenCalled();
            expect(detectChangesSpy).toHaveBeenCalled();
            done();
        }, 300);
    }));

    it('validateVisualizationQuery does return false if no options exist', (() => {
        expect(component.validateVisualizationQuery(component.options)).toBeTruthy();
        expect(component.validateVisualizationQuery({
            ...component.options,
            database: {}
        })).toBeFalsy();
    }));

    it('validateVisualizationQuery does return false if not all specified options exist', (() => {
        component.options.database = DatabaseConfig.get({ name: undefined });
        component.options.table = TableConfig.get({ name: 'documents' });

        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();

        component.options.database = DatabaseConfig.get({ name: 'someDatastore' });
        component.options.table = TableConfig.get(undefined);

        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();
    }));

    it('validateVisualizationQuery does return true if all specified options exist', (() => {
        component.options.database = DatabaseConfig.get({ name: 'someDatastore' });
        component.options.table = TableConfig.get({ name: 'documents' });

        expect(component.validateVisualizationQuery(component.options)).toBeTruthy();
    }));

    it('finalizeVisualizationQuery does return expected object', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.sortField = DashboardServiceMock.FIELD_MAP.SORT;
        component.options.limit = 25;
        (component as any).page = 1;

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
                    field: 'testSortField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testSortField'
                },
                order: -1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });

        component.options.sortField = new FieldConfig();
        searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: null,
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('arrayToString does return the expected string value', () => {
        expect(component.arrayToString(['someElement'])).toEqual('[someElement]');
        expect(component.arrayToString([{ key: 'hi' }])).toEqual('[]');
    });

    it('objectToString does return empty string', () => {
        expect(component.objectToString({ key: 'value' })).toEqual('');
    });

    it('toCellString does return expected value', () => {
        expect(component.toCellString(null, 'object')).toEqual('');
        expect(component.toCellString(['someElement'], 'array')).toEqual('[someElement]');
        expect(component.toCellString({ key: 'value' }, 'object')).toEqual('');
        expect(component.toCellString(4, 'number')).toEqual(4);
    });

    it('transformVisualizationQueryResults does update properties as expected when response.data.length is 1', () => {
        component.options.fields = [
            FieldConfig.get({ columnName: '_id', prettyName: 'id', hide: false, type: 'number' }),
            FieldConfig.get({ columnName: 'category', prettyName: 'Category', hide: false, type: 'string' }),
            FieldConfig.get({ columnName: 'testField', prettyName: 'Test Field', hide: false, type: 'string' })
        ];

        let actual = component.transformVisualizationQueryResults(component.options, [
            { _id: 1, category: 'books', testField: 'test', ignore: 'ignore', _docCount: 1 }
        ], new FilterCollection());

        expect(component.tableData).toEqual([
            { _filtered: false, _id: 1, category: 'books', testField: 'test' }
        ]);
        expect(actual).toEqual(1);
    });

    it('transformVisualizationQueryResults does update properties as expected when response.data.length is not equal to 1', () => {
        component.options.fields = [
            FieldConfig.get({ columnName: '_id', prettyName: 'id', hide: false, type: 'number' }),
            FieldConfig.get({ columnName: 'category', prettyName: 'Category', hide: false, type: 'string' }),
            FieldConfig.get({ columnName: 'testField', prettyName: 'Test Field', hide: false, type: 'string' })
        ];

        let actual = component.transformVisualizationQueryResults(component.options, [
            { _id: 1, category: 'books', testField: 'test', ignore: 'ignore', _docCount: 1 },
            { _id: 2, category: 'books', testField: 'some other value', ignore: 'ignoring' }
        ], new FilterCollection());

        expect(component.tableData).toEqual([
            { _filtered: false, _id: 1, category: 'books', testField: 'test' },
            { _filtered: false, _id: 2, category: 'books', testField: 'some other value' }
        ]);
        expect(actual).toEqual(2);
    });

    it('onSelect does update selected array and calls publishAnyCustomEvents, but not publishSelectId', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let selected = [{
            testCategoryField: 'books',
            testTextField: 'Test'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalledTimes(0);
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy).toHaveBeenCalledTimes(0);
    });

    it('onSelect does update selected array, calls publishSelectId and publishAnyCustomEvents', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let selected = [{
            testCategoryField: 'books',
            testTextField: 'Test'
        }];
        component.options.idField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy).toHaveBeenCalledTimes(0);
    });

    it('onSelect with single values does create simple filter and call exchangeFilters', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let selected = [{
            testCategoryField: 'books',
            testTextField: 'Test'
        }];
        component.options.idField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.fields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterable = true;
        component.options.singleFilter = false;
        (component as any).tableData = [{
            testCategoryField: 'books',
            testTextField: 'Test'
        }, {
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(1);
        expect(exchangeFiltersSpy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['books'])
        ], []]);

        let selected2 = [{
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected2 });

        expect(component.selected).toEqual(selected2);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(2);
        expect(exchangeFiltersSpy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['books', 'meals'])
        ], []]);
    });

    it('onSelect with single values does create compound AND filter and call exchangeFilters if singleFilter=true', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let selected = [{
            testCategoryField: 'books',
            testTextField: 'Test'
        }];
        component.options.idField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.fields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterable = true;
        component.options.singleFilter = true;
        (component as any).tableData = [{
            testCategoryField: 'books',
            testTextField: 'Test'
        }, {
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(1);
        expect(exchangeFiltersSpy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['books'])
        ], []]);

        let selected2 = [{
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected2 });

        expect(component.selected).toEqual(selected2);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(2);
        expect(exchangeFiltersSpy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['meals'])
        ], []]);
    });

    it('onSelect with multiple values does create compound AND filter and call exchangeFilters', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let selected = [{
            testCategoryField: ['books', 'games', 'shows'],
            testTextField: 'Test'
        }];
        component.options.idField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.fields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterable = true;
        component.options.singleFilter = false;
        component.options.arrayFilterOperator = 'and';
        (component as any).tableData = [{
            testCategoryField: ['books', 'games', 'shows'],
            testTextField: 'Test'
        }, {
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(1);
        expect(exchangeFiltersSpy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['books', 'games', 'shows'])
        ], []]);

        let selected2 = [{
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected2 });

        expect(component.selected).toEqual(selected2);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(2);
        expect(exchangeFiltersSpy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['books', 'games', 'shows', 'meals'])
        ], []]);
    });

    it('onSelect with multiple values does create compound OR filter if arrayFilterOperator=or', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let selected = [{
            testCategoryField: ['books', 'games', 'shows'],
            testTextField: 'Test'
        }];
        component.options.idField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.fields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterable = true;
        component.options.singleFilter = false;
        component.options.arrayFilterOperator = 'or';
        (component as any).tableData = [{
            testCategoryField: ['books', 'games', 'shows'],
            testTextField: 'Test'
        }, {
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(1);
        expect(exchangeFiltersSpy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['books', 'games', 'shows'])
        ], []]);

        let selected2 = [{
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected2 });

        expect(component.selected).toEqual(selected2);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(2);
        expect(exchangeFiltersSpy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['books', 'games', 'shows', 'meals'])
        ], []]);
    });

    it('onSelect with multiple values does create compound AND filter and call exchangeFilters if singleFilter=true', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let selected = [{
            testCategoryField: ['books', 'games', 'shows'],
            testTextField: 'Test'
        }];
        component.options.idField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.fields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterable = true;
        component.options.singleFilter = true;
        component.options.arrayFilterOperator = 'and';
        (component as any).tableData = [{
            testCategoryField: ['books', 'games', 'shows'],
            testTextField: 'Test'
        }, {
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(1);
        expect(exchangeFiltersSpy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['books', 'games', 'shows'])
        ], []]);

        let selected2 = [{
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected2 });

        expect(component.selected).toEqual(selected2);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(2);
        expect(exchangeFiltersSpy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['meals'])
        ], []]);
    });

    it('onSelect does create compound OR filter and call exchangeFilters if arrayFilterOperator=or and singleFilter=true', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let selected = [{
            testCategoryField: ['books', 'games', 'shows'],
            testTextField: 'Test'
        }];
        component.options.idField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.fields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        component.options.filterable = true;
        component.options.singleFilter = true;
        component.options.arrayFilterOperator = 'or';
        (component as any).tableData = [{
            testCategoryField: ['books', 'games', 'shows'],
            testTextField: 'Test'
        }, {
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(1);
        expect(exchangeFiltersSpy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['books', 'games', 'shows'])
        ], []]);

        let selected2 = [{
            testCategoryField: 'meals',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected2 });

        expect(component.selected).toEqual(selected2);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(2);
        expect(exchangeFiltersSpy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '=', ['meals'])
        ], []]);
    });

    it('onTableResize updates headers and calls refreshVisualization', () => {
        let spy = spyOn(component, 'refreshVisualization');

        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthUser: 500
        }, {
            prop: 'testField2',
            name: 'Test Field 2',
            active: true,
            style: {},
            cellClass: '',
            widthUser: null
        }];

        component.onTableResize({ column: { prop: 'testField1' }, newValue: 100 });

        expect(component.headers[0].widthUser).toEqual(100);
        expect(component.headers[1].widthUser).toEqual(null);

        expect(spy.calls.count()).toEqual(1);

        component.onTableResize({ column: { prop: 'testField2' }, newValue: 200 });

        expect(component.headers[0].widthUser).toEqual(100);
        expect(component.headers[1].widthUser).toEqual(200);

        expect(spy.calls.count()).toEqual(2);
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getCellClassFunction does return function', () => {
        expect(typeof component.getCellClassFunction()).toEqual('function');
    });

    it('getCellClassFunction function with colorField does set color class', () => {
        let cellClassFunction = component.getCellClassFunction();

        component.options.colorField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: 'red'
        })).toEqual({
            'color-field': true,
            'red': true
        });

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: 'blue'
        })).toEqual({
            'color-field': true,
            'blue': true
        });

        expect(component.styleSheet.cssRules.length).toEqual(2);
        expect(component.styleSheet.cssRules[0].selectorText).toEqual('.blue::before');
        expect(component.styleSheet.cssRules[0].style.cssText).toEqual('background-color: blue;');
        expect(component.styleSheet.cssRules[1].selectorText).toEqual('.red::before');
        expect(component.styleSheet.cssRules[1].style.cssText).toEqual('background-color: red;');
        expect(component.styleRules).toEqual(['red', 'blue']);
    });

    it('getCellClassFunction function with colorField does not set repeat color class style rules', () => {
        let cellClassFunction = component.getCellClassFunction();

        component.options.colorField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: 'red'
        })).toEqual({
            'color-field': true,
            'red': true
        });

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: 'red'
        })).toEqual({
            'color-field': true,
            'red': true
        });

        expect(component.styleSheet.cssRules.length).toEqual(1);
        expect(component.styleSheet.cssRules[0].selectorText).toEqual('.red::before');
        expect(component.styleSheet.cssRules[0].style.cssText).toEqual('background-color: red;');
        expect(component.styleRules).toEqual(['red']);
    });

    it('getCellClassFunction function with no colorField does not set color class', () => {
        let cellClassFunction = component.getCellClassFunction();

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: 'red'
        })).toEqual({});

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: 'blue'
        })).toEqual({});

        expect(component.styleSheet.cssRules.length).toEqual(0);
        expect(component.styleRules).toEqual([]);
    });

    it('getCellClassFunction function with colorField does set hex color class', () => {
        let cellClassFunction = component.getCellClassFunction();

        component.options.colorField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: '#ff0000'
        })).toEqual({
            'color-field': true,
            'hex_ff0000': true
        });

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: '#0000ff'
        })).toEqual({
            'color-field': true,
            'hex_0000ff': true
        });

        expect(component.styleSheet.cssRules.length).toEqual(2);
        expect(component.styleSheet.cssRules[0].selectorText).toEqual('.hex_0000ff::before');
        expect(component.styleSheet.cssRules[0].style.cssText).toEqual('background-color: rgb(0, 0, 255);');
        expect(component.styleSheet.cssRules[1].selectorText).toEqual('.hex_ff0000::before');
        expect(component.styleSheet.cssRules[1].style.cssText).toEqual('background-color: rgb(255, 0, 0);');
        expect(component.styleRules).toEqual(['hex_ff0000', 'hex_0000ff']);
    });

    it('getCellClassFunction function with colorField does set RGB color class', () => {
        let cellClassFunction = component.getCellClassFunction();

        component.options.colorField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: '12 34 56'
        })).toEqual({
            'color-field': true,
            'rgb_12_34_56': true
        });

        expect(cellClassFunction({
            column: {
                prop: 'testCategoryField'
            },
            value: '21,43,65'
        })).toEqual({
            'color-field': true,
            'rgb_21_43_65': true
        });

        expect(component.styleSheet.cssRules.length).toEqual(2);
        expect(component.styleSheet.cssRules[0].selectorText).toEqual('.rgb_21_43_65::before');
        expect(component.styleSheet.cssRules[0].style.cssText).toEqual('background-color: rgb(21, 43, 65);');
        expect(component.styleSheet.cssRules[1].selectorText).toEqual('.rgb_12_34_56::before');
        expect(component.styleSheet.cssRules[1].style.cssText).toEqual('background-color: rgb(12, 34, 56);');
        expect(component.styleRules).toEqual(['rgb_12_34_56', 'rgb_21_43_65']);
    });

    it('getRowClassFunction function does set active to false', () => {
        let rowClassFunction = component.getRowClassFunction();

        expect(rowClassFunction({})).toEqual({
            active: false
        });

        expect(rowClassFunction({
            testFilterField: 'testFilterValue'
        })).toEqual({
            active: false
        });

        expect(rowClassFunction({
            _filtered: false,
            testFilterField: 'testFilterValue'
        })).toEqual({
            active: false
        });
    });

    it('getRowClassFunction function with simple filters and filterFields does set active to expected boolean', () => {
        let rowClassFunction = component.getRowClassFunction();

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.FILTER];

        expect(rowClassFunction({})).toEqual({
            active: false
        });

        expect(rowClassFunction({
            testFilterField: 'testFilterValue'
        })).toEqual({
            active: false
        });

        expect(rowClassFunction({
            _filtered: false,
            testFilterField: 'testFilterValue'
        })).toEqual({
            active: false
        });

        expect(rowClassFunction({
            _filtered: true,
            testFilterField: 'testFilterValue'
        })).toEqual({
            active: true
        });
    });

    it('getRowClassFunction function with heatmapField and heatmapDivisor does set expected heat', () => {
        let rowClassFunction = component.getRowClassFunction();

        component.options.heatmapDivisor = 1.5;
        component.options.heatmapField = DashboardServiceMock.FIELD_MAP.SIZE;

        expect(rowClassFunction({
            testSizeField: 0
        })).toEqual({
            'active': false,
            'heat-1': true
        });

        expect(rowClassFunction({
            testSizeField: 1.5
        })).toEqual({
            'active': false,
            'heat-1': true
        });

        expect(rowClassFunction({
            testSizeField: 3.0
        })).toEqual({
            'active': false,
            'heat-2': true
        });

        expect(rowClassFunction({
            testSizeField: 4.5
        })).toEqual({
            'active': false,
            'heat-3': true
        });

        expect(rowClassFunction({
            testSizeField: 6.0
        })).toEqual({
            'active': false,
            'heat-4': true
        });

        expect(rowClassFunction({
            testSizeField: 7.5
        })).toEqual({
            'active': false,
            'heat-5': true
        });

        expect(rowClassFunction({
            testSizeField: 9.0
        })).toEqual({
            'active': false,
            'heat-5': true
        });

        expect(rowClassFunction({
            testSizeField: '5.0'
        })).toEqual({
            'active': false,
            'heat-3': true
        });
    });

    it('getRowClassFunction function with heatmapDivisor less than 1 does set expected heat', () => {
        let rowClassFunction = component.getRowClassFunction();

        component.options.heatmapDivisor = 0.2;
        component.options.heatmapField = DashboardServiceMock.FIELD_MAP.SIZE;

        expect(rowClassFunction({
            testSizeField: 0
        })).toEqual({
            'active': false,
            'heat-1': true
        });

        expect(rowClassFunction({
            testSizeField: 0.2
        })).toEqual({
            'active': false,
            'heat-1': true
        });

        expect(rowClassFunction({
            testSizeField: 0.4
        })).toEqual({
            'active': false,
            'heat-2': true
        });

        expect(rowClassFunction({
            testSizeField: 0.6
        })).toEqual({
            'active': false,
            'heat-3': true
        });

        expect(rowClassFunction({
            testSizeField: 0.8
        })).toEqual({
            'active': false,
            'heat-4': true
        });

        expect(rowClassFunction({
            testSizeField: 1.0
        })).toEqual({
            'active': false,
            'heat-5': true
        });

        expect(rowClassFunction({
            testSizeField: 2.0
        })).toEqual({
            'active': false,
            'heat-5': true
        });

        expect(rowClassFunction({
            testSizeField: '0.5'
        })).toEqual({
            'active': false,
            'heat-2': true
        });
    });

    it('getRowClassFunction function with heatmapField and heatmapDivisor does set expected heat of non-numbers', () => {
        let rowClassFunction = component.getRowClassFunction();

        component.options.heatmapDivisor = 0.2;
        component.options.heatmapField = DashboardServiceMock.FIELD_MAP.SIZE;

        expect(rowClassFunction({})).toEqual({
            'active': false,
            'heat-0': true
        });

        expect(rowClassFunction({
            testSizeField: ''
        })).toEqual({
            'active': false,
            'heat-0': true
        });

        expect(rowClassFunction({
            testSizeField: 'Text'
        })).toEqual({
            'active': false,
            'heat-0': true
        });

        expect(rowClassFunction({
            testSizeField: 'NaN'
        })).toEqual({
            'active': false,
            'heat-0': true
        });
    });

    it('onChangeData does update headers if database or table is updated', () => {
        let spy = spyOn(component, 'initializeProperties');

        component.onChangeData(true);

        expect(spy).toHaveBeenCalled();
    });

    it('onChangeData does use configured showFields to update active status in existing headers', () => {
        let spy = spyOn(component, 'recalculateActiveHeaders');

        component.headers = [{
            prop: 'category',
            name: 'Category',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field1',
            name: 'Field 1',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'date',
            name: 'Date',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }];

        component.options.fields = [
            FieldConfig.get({ columnName: 'category', prettyName: 'Category' }),
            FieldConfig.get({ columnName: 'field1', prettyName: 'Field 1' }),
            FieldConfig.get({ columnName: 'field2', prettyName: 'Field 2' }),
            FieldConfig.get({ columnName: 'date', prettyName: 'Date' })
        ];

        component.options.showFields = [component.options.fields[0], component.options.fields[3]];

        component.onChangeData();

        expect(component.headers).toEqual([{
            prop: 'category',
            name: 'Category',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field1',
            name: 'Field 1',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'field2',
            name: 'Field 2',
            active: false,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }, {
            prop: 'date',
            name: 'Date',
            active: true,
            style: {},
            cellClass: '',
            widthAuto: 100,
            widthUser: null
        }]);

        expect(spy).toHaveBeenCalled();

        expect(component.selected).toEqual([]);
    });

    it('generateLink does return the expected string', () => {
        expect(component.generateLink('testLink')).toEqual('testLink');
        component.options.linkPrefix = 'http://hostname/endpoint?argument=';
        expect(component.generateLink('testLink')).toEqual('http://hostname/endpoint?argument=testLink');
        expect(component.generateLink('http://hostname/endpoint?argument=testLink')).toEqual('http://hostname/endpoint?argument=testLink');
        expect(component.generateLink('http://testLink')).toEqual('http://testLink');
    });

    it('isLinkColumn does return the expected result', () => {
        component.options.fields = [
            FieldConfig.get({ columnName: 'category', prettyName: 'Category' }),
            FieldConfig.get({ columnName: 'field1', prettyName: 'Field 1' }),
            FieldConfig.get({ columnName: 'field2', prettyName: 'Field 2' }),
            FieldConfig.get({ columnName: 'date', prettyName: 'Date' })
        ];

        expect(component.isLinkColumn('field1')).toEqual(false);

        component.options.linkFields = [component.options.fields[1]];

        expect(component.isLinkColumn('field1')).toEqual(true);
        expect(component.isLinkColumn('field2')).toEqual(false);
        expect(component.isLinkColumn('')).toEqual(false);
    });
});
