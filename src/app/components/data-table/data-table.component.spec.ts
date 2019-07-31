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
import { Injector } from '@angular/core';

import { } from 'jasmine-core';

import { DataTableComponent } from './data-table.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { CompoundFilterType } from '../../models/widget-option';
import { DashboardService } from '../../services/dashboard.service';
import { FilterCollection } from '../../util/filter.util';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData } from '../../models/dataset';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { DataTableModule } from './data-table.module';

// TODO Change toHaveBeenCalled to toHaveBeenCalledWith
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */

describe('Component: DataTable', () => {
    let component: DataTableComponent;
    let fixture: ComponentFixture<DataTableComponent>;

    initializeTestBed('Data Table', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector
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
        expect(actual.length).toEqual(2);
        expect((actual[0]).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0]).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0]).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).value).toBeUndefined();
        expect((actual[1]).type).toEqual('and');
        expect((actual[1]).filters.length).toEqual(1);
        expect((actual[1]).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1]).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1]).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[1]).filters[0].operator).toEqual('=');
        expect((actual[1]).filters[0].value).toBeUndefined();

        component.options.arrayFilterOperator = 'or';
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0]).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0]).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0]).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).value).toBeUndefined();
        expect((actual[1]).type).toEqual('or');
        expect((actual[1]).filters.length).toEqual(1);
        expect((actual[1]).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1]).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1]).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[1]).filters[0].operator).toEqual('=');
        expect((actual[1]).filters[0].value).toBeUndefined();

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY, DashboardServiceMock.FIELD_MAP.TEXT];
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect((actual[0]).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0]).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0]).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).value).toBeUndefined();
        expect((actual[1]).type).toEqual('or');
        expect((actual[1]).filters.length).toEqual(1);
        expect((actual[1]).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1]).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1]).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[1]).filters[0].operator).toEqual('=');
        expect((actual[1]).filters[0].value).toBeUndefined();
        expect((actual[2]).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2]).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2]).field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((actual[2]).operator).toEqual('=');
        expect((actual[2]).value).toBeUndefined();
        expect((actual[3]).type).toEqual('or');
        expect((actual[3]).filters.length).toEqual(1);
        expect((actual[3]).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3]).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3]).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((actual[3]).filters[0].operator).toEqual('=');
        expect((actual[3]).filters[0].value).toBeUndefined();
    });

    it('onResize does call refreshVisualization', () => {
        let spy = spyOn(component, 'refreshVisualization');

        component.onResize();

        expect(spy).toHaveBeenCalled();
    });

    it('initializeHeadersFromExceptionsToStatus does create the expected headers in order', () => {
        component.options.fields = [
            NeonFieldMetaData.get({ columnName: 'category', prettyName: 'Category' }),
            NeonFieldMetaData.get({ columnName: 'field1', prettyName: 'Field 1' }),
            NeonFieldMetaData.get({ columnName: 'field2', prettyName: 'Field 2' }),
            NeonFieldMetaData.get({ columnName: 'date', prettyName: 'Date' })
        ];
        component.options.exceptionsToStatus = [
            'date',
            'field2'
        ];

        component.initializeHeadersFromExceptionsToStatus();

        expect(component.headers.length).toEqual(4);
        expect(component.headers[0].prop).toEqual('date');
        expect(component.headers[0].name).toEqual('Date');
        expect(component.headers[0].active).toEqual(false);
        expect(component.headers[0].style).toEqual({});
        expect(component.headers[0].cellClass).toBeDefined();
        expect(component.headers[0].width).toEqual(150);
        expect(component.headers[1].prop).toEqual('field2');
        expect(component.headers[1].name).toEqual('Field 2');
        expect(component.headers[1].active).toEqual(false);
        expect(component.headers[1].style).toEqual({});
        expect(component.headers[1].cellClass).toBeDefined();
        expect(component.headers[1].width).toEqual(150);
        expect(component.headers[2].prop).toEqual('category');
        expect(component.headers[2].name).toEqual('Category');
        expect(component.headers[2].active).toEqual(true);
        expect(component.headers[2].style).toEqual({});
        expect(component.headers[2].cellClass).toBeDefined();
        expect(component.headers[2].width).toEqual(150);
        expect(component.headers[3].prop).toEqual('field1');
        expect(component.headers[3].name).toEqual('Field 1');
        expect(component.headers[3].active).toEqual(true);
        expect(component.headers[3].style).toEqual({});
        expect(component.headers[3].cellClass).toBeDefined();
        expect(component.headers[3].width).toEqual(150);
    });

    it('initializeHeadersFromFieldsConfig does create the expected headers in order', () => {
        component.headers = [];
        component.options.fields = [
            NeonFieldMetaData.get({ columnName: 'category', prettyName: 'Category' }),
            NeonFieldMetaData.get({ columnName: 'field1', prettyName: 'Field 1' }),
            NeonFieldMetaData.get({ columnName: 'field2', prettyName: 'Field 2' }),
            NeonFieldMetaData.get({ columnName: 'date', prettyName: 'Date' })
        ];
        component.options.allColumnStatus = 'show';
        component.options.fieldsConfig = [
            { name: 'date' },
            { name: 'field2', hide: true }
        ];

        component.initializeHeadersFromFieldsConfig();

        expect(component.headers.length).toEqual(4);
        expect(component.headers[0].prop).toEqual('date');
        expect(component.headers[0].name).toEqual('Date');
        expect(component.headers[0].active).toEqual(true);
        expect(component.headers[0].style).toEqual({});
        expect(component.headers[0].cellClass).toBeDefined();
        expect(component.headers[0].width).toEqual(150);
        expect(component.headers[1].prop).toEqual('field2');
        expect(component.headers[1].name).toEqual('Field 2');
        expect(component.headers[1].active).toEqual(false);
        expect(component.headers[1].style).toEqual({});
        expect(component.headers[1].cellClass).toBeDefined();
        expect(component.headers[1].width).toEqual(150);
        expect(component.headers[2].prop).toEqual('category');
        expect(component.headers[2].name).toEqual('Category');
        expect(component.headers[2].active).toEqual(true);
        expect(component.headers[2].style).toEqual({});
        expect(component.headers[2].cellClass).toBeDefined();
        expect(component.headers[2].width).toEqual(150);
        expect(component.headers[3].prop).toEqual('field1');
        expect(component.headers[3].name).toEqual('Field 1');
        expect(component.headers[3].active).toEqual(true);
        expect(component.headers[3].style).toEqual({});
        expect(component.headers[3].cellClass).toBeDefined();
        expect(component.headers[3].width).toEqual(150);
    });

    it('getColumnWidth returns the width of the matching column in options.customColumnWidths', () => {
        component.options.customColumnWidths = [
            ['fieldWithCustomWidth', 260]
        ];

        expect(component.getColumnWidth('fieldWithCustomWidth')).toEqual(260);
    });

    it('getColumnWidth returns the default width if field not found in options.customColumnWidths', () => {
        component.options.customColumnWidths = [
            ['fieldWithNoMatch', 300]
        ];

        expect(component.getColumnWidth('anotherColumn')).toEqual(150);
    });

    it('initializeProperties does call expected methods if options.fieldsConfig exists', () => {
        component.options.fieldsConfig = [
            { name: 'testField' }
        ];
        let initHeadersFromFieldsConfigSpy = spyOn(component, 'initializeHeadersFromFieldsConfig');
        let initHeadersFromExceptionsSpy = spyOn(component, 'initializeHeadersFromExceptionsToStatus');
        let recalcActiveHeadersSpy = spyOn(component, 'recalculateActiveHeaders');

        component.initializeProperties();
        expect(initHeadersFromFieldsConfigSpy).toHaveBeenCalled();
        expect(initHeadersFromExceptionsSpy).toHaveBeenCalledTimes(0);
        expect(recalcActiveHeadersSpy).toHaveBeenCalled();
    });

    it('initializeProperties does call expected methods if options.fieldsConfig does not exist', () => {
        let initHeadersFromFieldsConfigSpy = spyOn(component, 'initializeHeadersFromFieldsConfig');
        let initHeadersFromExceptionsSpy = spyOn(component, 'initializeHeadersFromExceptionsToStatus');
        let recalcActiveHeadersSpy = spyOn(component, 'recalculateActiveHeaders');

        component.initializeProperties();
        expect(initHeadersFromFieldsConfigSpy).toHaveBeenCalledTimes(0);
        expect(initHeadersFromExceptionsSpy).toHaveBeenCalled();
        expect(recalcActiveHeadersSpy).toHaveBeenCalled();
    });

    it('recalculateActiveHeaders does update activeHeaders and call detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.headers = [{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }];
        component.headerWidths.set('createdDate', 150);

        component.recalculateActiveHeaders();

        expect(spy).toHaveBeenCalled();
        expect(component.headers).toEqual([{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: '',
            width: 150,
            $$oldWidth: 150
        }]);
        expect(component.activeHeaders).toEqual([{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: '',
            width: 150,
            $$oldWidth: 150
        }]);
        expect(component.headerWidths.get('createdDate')).toEqual(150);
    });

    it('recalculateActiveHeaders does update widths if table is bigger than visualization and call detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.activeHeaders = [{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: ''
        }];

        /* eslint-disable-next-line dot-notation */
        component.activeHeaders[0]['width'] = 50000;

        component.headers = [{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: '',
            width: 50000
        }];
        component.headerWidths.set('createdDate', 50000);

        component.recalculateActiveHeaders();

        expect(spy).toHaveBeenCalled();

        expect(component.headers[0].prop).toEqual('createdDate');
        expect(component.headers[0].name).toEqual('Date Created');
        expect(component.headers[0].active).toBeTruthy();
        expect(component.headers[0].style).toEqual({});
        expect(component.headers[0].cellClass).toEqual('');

        /* eslint-disable-next-line dot-notation */
        expect(component.headers[0]['width']).toBeLessThan(50000);
        /* eslint-disable-next-line dot-notation */
        expect(component.headers[0]['$$oldWidth']).toBeLessThan(50000);

        expect(component.activeHeaders.length).toBe(1);
        expect(component.activeHeaders[0].prop).toEqual('createdDate');
        expect(component.activeHeaders[0].name).toEqual('Date Created');
        expect(component.activeHeaders[0].active).toBeTruthy();
        expect(component.activeHeaders[0].style).toEqual({});
        expect(component.activeHeaders[0].cellClass).toEqual('');

        /* eslint-disable-next-line dot-notation */
        expect(component.activeHeaders[0]['width']).toBeLessThan(50000);
        /* eslint-disable-next-line dot-notation */
        expect(component.activeHeaders[0]['$$oldWidth']).toBeLessThan(50000);

        expect(component.headerWidths.get('createdDate')).toBeLessThan(50000);
        expect(spy).toHaveBeenCalled();
    });

    it('getActiveHeaders does return list of active headers', (() => {
        component.headers = [{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'testField',
            name: 'Test Field',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'inactiveField',
            name: 'Inactive Field',
            active: false,
            style: {},
            cellClass: '',
            width: 100
        }];

        expect(component.getActiveHeaders()).toEqual([{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'testField',
            name: 'Test Field',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }]);
    }));

    it('getHeaderByName does return expected header, or null if not found', (() => {
        let headers = [{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            width: 100
        }, {
            prop: 'testField',
            name: 'Test Field',
            active: true,
            style: {},
            width: 100
        }, {
            prop: 'inactiveField',
            name: 'Inactive Field',
            active: false,
            style: {},
            width: 100
        }];

        expect(component.getHeaderByName('testField', headers)).toEqual({
            prop: 'testField',
            name: 'Test Field',
            active: true,
            style: {},
            width: 100
        });
        expect(component.getHeaderByName('Inactive Field', headers)).toEqual({
            prop: 'inactiveField',
            name: 'Inactive Field',
            active: false,
            style: {},
            width: 100
        });
        expect(component.getHeaderByName('notFound', headers)).toEqual(null);
    }));

    it('closeColumnSelector does hide column selector and call refreshVisualization', (() => {
        let spy = spyOn(component, 'refreshVisualization');
        component.options.showColumnSelector = 'show';

        component.closeColumnSelector();
        expect(component.options.showColumnSelector).toEqual('hide');
        expect(spy).toHaveBeenCalled();
    }));

    it('deactivateAllHeaders does set all headers to inactive and calls detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.headers = [{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'testField',
            name: 'Test Field',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'anotherField',
            name: 'Another Field',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }];

        component.deactivateAllHeaders();
        expect(component.headers).toEqual([{
            prop: 'createdDate',
            name: 'Date Created',
            active: false,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'testField',
            name: 'Test Field',
            active: false,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'anotherField',
            name: 'Another Field',
            active: false,
            style: {},
            cellClass: '',
            width: 100
        }]);
        expect(spy).toHaveBeenCalled();
    }));

    it('activateAllHeaders does set all headers to active and calls detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.headers = [{
            prop: 'createdDate',
            name: 'Date Created',
            active: false,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'testField',
            name: 'Test Field',
            active: false,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'anotherField',
            name: 'Another Field',
            active: false,
            style: {},
            cellClass: '',
            width: 100
        }];

        component.activateAllHeaders();
        expect(component.headers).toEqual([{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'testField',
            name: 'Test Field',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }, {
            prop: 'anotherField',
            name: 'Another Field',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }]);
        expect(spy).toHaveBeenCalled();
    }));

    it('refreshVisualization does call expected functions', ((done) => {
        let recalcHeadersSpy = spyOn(component, 'recalculateActiveHeaders');
        let tableRecalcSpy = spyOn(component.table, 'recalculate');
        let detectChangesSpy = spyOn(component.table.cd, 'detectChanges');

        component.refreshVisualization();

        setTimeout(() => {
            expect(recalcHeadersSpy).toHaveBeenCalledTimes(2);
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
        component.options.database = NeonDatabaseMetaData.get({ name: undefined });
        component.options.table = NeonTableMetaData.get({ name: 'documents' });

        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();

        component.options.database = NeonDatabaseMetaData.get({ name: 'someDatastore' });
        component.options.table = NeonTableMetaData.get(undefined);

        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();
    }));

    it('validateVisualizationQuery does return true if all specified options exist', (() => {
        component.options.database = NeonDatabaseMetaData.get({ name: 'someDatastore' });
        component.options.table = NeonTableMetaData.get({ name: 'documents' });

        expect(component.validateVisualizationQuery(component.options)).toBeTruthy();
    }));

    it('headerIsInExceptions does return whether or not header is in options.exceptionsToStatus', (() => {
        component.options.exceptionsToStatus = ['testField2'];

        expect(component.headerIsInExceptions({ columnName: 'testField1', prettyName: 'Test Field 1' })).toBeFalsy();
        expect(component.headerIsInExceptions({ columnName: 'testField2', prettyName: 'Test Field 2' })).toBeTruthy();
    }));

    it('sortOrderedHeaders does sort based on options.exceptionsToStatus', (() => {
        component.options.exceptionsToStatus = ['testField3', 'testField2'];

        expect(component.sortOrderedHeaders([{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {},
            width: 100
        }, {
            prop: 'testField2',
            name: 'Test Field 2',
            active: false,
            style: {},
            width: 120
        }, {
            prop: 'testField3',
            name: 'Test Field 3',
            active: true,
            style: {},
            width: 100
        }])).toEqual([{
            prop: 'testField3',
            name: 'Test Field 3',
            active: true,
            style: {},
            width: 100
        }, {
            prop: 'testField2',
            name: 'Test Field 2',
            active: false,
            style: {},
            width: 120
        }]);
    }));

    it('finalizeVisualizationQuery does return expected object', () => {
        component.options.database = NeonDatabaseMetaData.get({ name: 'someDatastore' });
        component.options.table = NeonTableMetaData.get({ name: 'documents' });
        component.options.sortField = NeonFieldMetaData.get({ columnName: 'testSortField' });
        component.options.limit = 25;
        (component as any).page = 1;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            fields: ['*'],
            filter: {
                field: 'testSortField',
                operator: '!=',
                value: null
            },
            sort: {
                field: 'testSortField',
                order: -1
            }
        });

        delete component.options.sortField.columnName;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            fields: ['*'],
            filter: null
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
            NeonFieldMetaData.get({ columnName: '_id', prettyName: 'id', hide: false, type: 'number' }),
            NeonFieldMetaData.get({ columnName: 'category', prettyName: 'Category', hide: false, type: 'string' }),
            NeonFieldMetaData.get({ columnName: 'testField', prettyName: 'Test Field', hide: false, type: 'string' })
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
            NeonFieldMetaData.get({ columnName: '_id', prettyName: 'id', hide: false, type: 'number' }),
            NeonFieldMetaData.get({ columnName: 'category', prettyName: 'Category', hide: false, type: 'string' }),
            NeonFieldMetaData.get({ columnName: 'testField', prettyName: 'Test Field', hide: false, type: 'string' })
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

    it('isDragging does return expected boolean', () => {
        component.drag.mousedown = true;
        component.drag.downIndex = 5;

        expect(component.isDragging()).toBeTruthy();

        component.drag.downIndex = -1;

        expect(component.isDragging()).toBeFalsy();

        component.drag.mousedown = false;

        expect(component.isDragging()).toBeFalsy();

        component.drag.downIndex = 5;

        expect(component.isDragging()).toBeFalsy();
    });

    it('onMouseUp does set expected drag properties and call clearHeaderStyles, but not recalculateActiveHeaders', () => {
        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: { color: 'black' },
            cellClass: '',
            width: 100
        }];
        component.drag.mousedown = true;
        component.drag.downIndex = 5;

        let clearStylesSpy = spyOn(component, 'clearHeaderStyles');
        let recalcHeadersSpy = spyOn(component, 'recalculateActiveHeaders');

        component.onMouseUp(0);

        expect(component.drag.downIndex).toEqual(-1);
        expect(component.drag.mousedown).toBeFalsy();
        expect(clearStylesSpy).toHaveBeenCalled();
        expect(recalcHeadersSpy).toHaveBeenCalledTimes(0);
    });

    it('onMouseUp does set expected drag properties and call clearHeaderStyles, recalculateActiveHeaders', () => {
        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: { color: 'black' },
            cellClass: '',
            width: 100
        }, {
            prop: 'testField2',
            name: 'Test Field 2',
            active: true,
            style: { color: 'black' },
            cellClass: '',
            width: 100
        }];
        component.drag.mousedown = true;
        component.drag.downIndex = 0;

        let clearStylesSpy = spyOn(component, 'clearHeaderStyles');
        let recalcHeadersSpy = spyOn(component, 'recalculateActiveHeaders');

        component.onMouseUp(1);

        expect(component.drag.downIndex).toEqual(-1);
        expect(component.drag.mousedown).toBeFalsy();
        expect(clearStylesSpy).toHaveBeenCalled();
        expect(recalcHeadersSpy).toHaveBeenCalled();
    });

    it('onMouseDown does set styles as expected', () => {
        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: { color: 'black' },
            cellClass: '',
            width: 100
        }];
        component.onMouseDown(-5);

        expect(component.drag).toEqual({
            mousedown: false,
            downIndex: -1,
            currentIndex: -1,
            field: null,
            x: 0,
            y: 0
        });

        component.onMouseDown(0);

        expect(component.drag).toEqual({
            mousedown: true,
            downIndex: 0,
            currentIndex: -1,
            field: null,
            x: 0,
            y: 0
        });
        expect(component.headers[0].style).toEqual({
            color: 'black',
            backgroundColor: 'rgba(0, 0, 0, .2)',
            border: 'grey dashed 1px'
        });
    });

    it('onMouseEnter does not set drag object or styles if isDragging is false', () => {
        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: { color: 'black' },
            cellClass: '',
            width: 100
        }];
        component.onMouseEnter(0);

        expect(component.drag).toEqual({
            mousedown: false,
            downIndex: -1,
            currentIndex: -1,
            field: null,
            x: 0,
            y: 0
        });
        expect(component.headers[0].style).toEqual({ color: 'black' });
    });

    it('onMouseEnter does set drag object and styles if isDragging is true', () => {
        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: { color: 'black' },
            cellClass: '',
            width: 100
        }, {
            prop: 'testField2',
            name: 'Test Field 2',
            active: true,
            style: {},
            cellClass: '',
            width: 100
        }];
        component.drag.mousedown = true;
        component.drag.downIndex = 1;

        component.onMouseEnter(0);

        expect(component.drag).toEqual({
            mousedown: true,
            downIndex: 1,
            currentIndex: 0,
            field: null,
            x: 0,
            y: 0
        });
        expect(component.headers[0].style).toEqual({
            color: 'black',
            borderTop: 'thick solid grey'
        });
        expect(component.headers[1].style).toEqual({});

        component.drag.downIndex = 0;

        component.onMouseEnter(1);

        expect(component.drag).toEqual({
            mousedown: true,
            downIndex: 0,
            currentIndex: 1,
            field: null,
            x: 0,
            y: 0
        });
        expect(component.headers[0].style).toEqual({
            color: 'black',
            borderTop: 'thick solid grey'
        });
        expect(component.headers[1].style).toEqual({
            borderBottom: 'thick solid grey'
        });
    });

    it('onMouseLeaveItem does not set styles if isDragging is false or index matches drag.downIndex', () => {
        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {
                borderTop: 'thick solid grey',
                borderBottom: 'thick solid grey'
            },
            cellClass: '',
            width: 100
        }];
        component.onMouseLeaveItem(0);

        expect(component.headers[0].style).toEqual({
            borderTop: 'thick solid grey',
            borderBottom: 'thick solid grey'
        });

        component.drag.mousedown = true;
        component.drag.downIndex = 0;

        component.onMouseLeaveItem(0);

        expect(component.headers[0].style).toEqual({
            borderTop: 'thick solid grey',
            borderBottom: 'thick solid grey'
        });
    });

    it('onMouseLeaveItem does set styles if isDragging is true and index does not match drag.downIndex', () => {
        component.drag.mousedown = true;
        component.drag.downIndex = 1;
        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {
                borderTop: 'thick solid grey',
                borderBottom: 'thick solid grey'
            },
            cellClass: '',
            width: 100
        }];
        component.onMouseLeaveItem(0);

        expect(component.headers[0].style).toEqual({
            borderTop: null,
            borderBottom: null
        });
    });

    it('onMouseLeaveArea does set expected drag properties and clears header styles', () => {
        component.drag = {
            mousedown: true,
            downIndex: 1,
            currentIndex: 0,
            field: null,
            x: 0,
            y: 0
        };
        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: { borderTop: 'thick solid grey' },
            cellClass: '',
            width: 100
        }];

        component.onMouseLeaveArea();

        expect(component.drag.downIndex).toEqual(-1);
        expect(component.drag.mousedown).toBeFalsy();
        expect(component.headers[0].style).toEqual({});
    });

    it('onMouseMove does not set drag object if isDragging is false', () => {
        component.onMouseMove({ screenX: 40, screenY: 55 });

        expect(component.drag).toEqual({
            mousedown: false,
            downIndex: -1,
            currentIndex: -1,
            field: null,
            x: 0,
            y: 0
        });
    });

    it('onMouseMove does set drag object if isDragging is true', () => {
        component.drag.mousedown = true;
        component.drag.downIndex = 1;
        component.onMouseMove({ screenX: 40, screenY: 55 });

        expect(component.drag).toEqual({
            mousedown: true,
            downIndex: 1,
            currentIndex: -1,
            field: null,
            x: 40,
            y: 55
        });
    });

    it('clearHeaderStyles does clear styles', () => {
        component.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: { color: 'black' },
            cellClass: '',
            width: 100
        }, {
            prop: 'testField2',
            name: 'Test Field 2',
            active: true,
            style: { padding: '10px' },
            cellClass: '',
            width: 100
        }];

        component.clearHeaderStyles();

        expect(component.headers[0].style).toEqual({});
        expect(component.headers[1].style).toEqual({});
    });

    it('onSelect does update selected array and calls publishAnyCustomEvents, but not publishSelectId', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let toggleFiltersSpy = spyOn(component, 'toggleFilters');
        let selected = [{
            testCategoryField: 'books',
            testTextField: 'Test'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalledTimes(0);
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy).toHaveBeenCalledTimes(0);
        expect(toggleFiltersSpy).toHaveBeenCalledTimes(0);
    });

    it('onSelect does update selected array, calls publishSelectId and publishAnyCustomEvents', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let toggleFiltersSpy = spyOn(component, 'toggleFilters');
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
        expect(toggleFiltersSpy).toHaveBeenCalledTimes(0);
    });

    it('onSelect does create simple filter and call toggleFilters', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let toggleFiltersSpy = spyOn(component, 'toggleFilters');
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
            testCategoryField: 'test',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(0);
        expect(toggleFiltersSpy.calls.count()).toEqual(1);
        expect(toggleFiltersSpy.calls.argsFor(0)).toEqual([[{
            root: CompoundFilterType.AND,
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '=',
            value: 'books'
        }]]);
    });

    it('onSelect does create simple filter and call exchangeFilters if singleFilter=true', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let toggleFiltersSpy = spyOn(component, 'toggleFilters');
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
            testCategoryField: 'test',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(1);
        expect(exchangeFiltersSpy.calls.argsFor(0)).toEqual([[{
            root: CompoundFilterType.AND,
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '=',
            value: 'books'
        }]]);
        expect(toggleFiltersSpy.calls.count()).toEqual(0);
    });

    it('onSelect does create compound AND filter and call toggleFilters', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let toggleFiltersSpy = spyOn(component, 'toggleFilters');
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
            testCategoryField: 'test',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(0);
        expect(toggleFiltersSpy.calls.count()).toEqual(1);
        expect(toggleFiltersSpy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'books'
            }, {
                root: CompoundFilterType.AND,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'games'
            }, {
                root: CompoundFilterType.AND,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'shows'
            }]
        }]]);
    });

    it('onSelect does create compound OR filter if arrayFilterOperator=or', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let toggleFiltersSpy = spyOn(component, 'toggleFilters');
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
            testCategoryField: 'test',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(0);
        expect(toggleFiltersSpy.calls.count()).toEqual(1);
        expect(toggleFiltersSpy.calls.argsFor(0)).toEqual([[{
            type: 'or',
            root: CompoundFilterType.OR,
            filters: [{
                root: CompoundFilterType.OR,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'books'
            }, {
                root: CompoundFilterType.OR,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'games'
            }, {
                root: CompoundFilterType.OR,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'shows'
            }]
        }]]);
    });

    it('onSelect does create compound AND filter and call exchangeFilters if singleFilter=true', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let toggleFiltersSpy = spyOn(component, 'toggleFilters');
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
            testCategoryField: 'test',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(1);
        expect(exchangeFiltersSpy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'books'
            }, {
                root: CompoundFilterType.AND,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'games'
            }, {
                root: CompoundFilterType.AND,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'shows'
            }]
        }]]);
        expect(toggleFiltersSpy.calls.count()).toEqual(0);
    });

    it('onSelect does create compound OR filter and call exchangeFilters if arrayFilterOperator=or and singleFilter=true', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let exchangeFiltersSpy = spyOn(component, 'exchangeFilters');
        let toggleFiltersSpy = spyOn(component, 'toggleFilters');
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
            testCategoryField: 'test',
            testTextField: 'Test 2'
        }];

        component.onSelect({ selected: selected });

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(exchangeFiltersSpy.calls.count()).toEqual(1);
        expect(exchangeFiltersSpy.calls.argsFor(0)).toEqual([[{
            type: 'or',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'books'
            }, {
                root: CompoundFilterType.AND,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'games'
            }, {
                root: CompoundFilterType.AND,
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '=',
                value: 'shows'
            }]
        }]]);
        expect(toggleFiltersSpy.calls.count()).toEqual(0);
    });

    it('onTableResize updates headerWidths and calls refreshVisualization', () => {
        let spy = spyOn(component, 'refreshVisualization');

        component.activeHeaders = [{
            prop: 'createdDate',
            name: 'Date Created',
            active: true,
            style: {},
            cellClass: ''
        }, {
            prop: 'testField',
            name: 'Test Field',
            active: true,
            style: {},
            cellClass: ''
        }];

        /* eslint-disable-next-line dot-notation */
        component.activeHeaders[0]['width'] = 75;
        /* eslint-disable-next-line dot-notation */
        component.activeHeaders[1]['width'] = 150;

        component.onTableResize({ column: { prop: 'someField', width: 100 }, newValue: 50 });

        expect(component.headerWidths.get('createdDate')).toEqual(75);
        expect(component.headerWidths.get('someField')).toEqual(50);
        expect(component.headerWidths.get('testField')).toEqual(200);
        expect(spy).toHaveBeenCalled();
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getOptions does return options object', () => {
        expect(component.options).toEqual(component.options);
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

    it('getTableHeaderHeight and getTableRowHeight both return expected number', () => {
        expect(component.getTableHeaderHeight()).toEqual(30);
        expect(component.getTableRowHeight()).toEqual(25);

        component.options.skinny = true;

        expect(component.getTableHeaderHeight()).toEqual(20);
        expect(component.getTableRowHeight()).toEqual(20);
    });

    it('onChangeData does not update headers if database or table is unchanged', () => {
        expect(component.headers.length).toEqual(16);

        component.options.fields = [
            NeonFieldMetaData.get({ columnName: 'category', prettyName: 'Category' }),
            NeonFieldMetaData.get({ columnName: 'field1', prettyName: 'Field 1' }),
            NeonFieldMetaData.get({ columnName: 'field2', prettyName: 'Field 2' }),
            NeonFieldMetaData.get({ columnName: 'date', prettyName: 'Date' })
        ];

        component.onChangeData();

        expect(component.headers.length).toEqual(16);
    });

    it('onChangeData does update headers if database or table is updated', () => {
        component.options.fields = [
            NeonFieldMetaData.get({ columnName: 'category', prettyName: 'Category' }),
            NeonFieldMetaData.get({ columnName: 'field1', prettyName: 'Field 1' }),
            NeonFieldMetaData.get({ columnName: 'field2', prettyName: 'Field 2' }),
            NeonFieldMetaData.get({ columnName: 'date', prettyName: 'Date' })
        ];

        component.onChangeData(true);

        expect(component.headers.length).toEqual(4);
        expect(component.headers[0].prop).toEqual('category');
        expect(component.headers[0].name).toEqual('Category');
        expect(component.headers[0].active).toEqual(true);
        expect(component.headers[0].style).toEqual({});
        expect(component.headers[0].cellClass).toBeDefined();
        expect(component.headers[0].width).toEqual(150);
        expect(component.headers[1].prop).toEqual('field1');
        expect(component.headers[1].name).toEqual('Field 1');
        expect(component.headers[1].active).toEqual(true);
        expect(component.headers[1].style).toEqual({});
        expect(component.headers[1].cellClass).toBeDefined();
        expect(component.headers[1].width).toEqual(150);
        expect(component.headers[2].prop).toEqual('field2');
        expect(component.headers[2].name).toEqual('Field 2');
        expect(component.headers[2].active).toEqual(true);
        expect(component.headers[2].style).toEqual({});
        expect(component.headers[2].cellClass).toBeDefined();
        expect(component.headers[2].width).toEqual(150);
        expect(component.headers[3].prop).toEqual('date');
        expect(component.headers[3].name).toEqual('Date');
        expect(component.headers[3].active).toEqual(true);
        expect(component.headers[3].style).toEqual({});
        expect(component.headers[3].cellClass).toBeDefined();
        expect(component.headers[3].width).toEqual(150);
    });
});
