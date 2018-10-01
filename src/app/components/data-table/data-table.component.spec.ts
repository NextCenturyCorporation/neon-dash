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
import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { } from 'jasmine-core';

import { NeonGTDConfig } from '../../neon-gtd-config';
import { DataTableComponent } from './data-table.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { FilterService } from '../../services/filter.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { ThemesService } from '../../services/themes.service';
import { TranslationService } from '../../services/translation.service';
import { VisualizationService } from '../../services/visualization.service';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { By } from '@angular/platform-browser';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: DataTable', () => {
    let component: DataTableComponent,
        fixture: ComponentFixture<DataTableComponent>,
        getDebug = (selector: string) => fixture.debugElement.query(By.css(selector)),
        getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            DataTableComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            ExportService,
            TranslationService,
            ErrorNotificationService,
            VisualizationService,
            ThemesService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            NgxDatatableModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DataTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('initializeHeadersFromExceptionsToStatus does create the expected headers in order', () => {
        component.options.fields = [
            new FieldMetaData('category', 'Category'),
            new FieldMetaData('field1', 'Field 1'),
            new FieldMetaData('field2', 'Field 2'),
            new FieldMetaData('date', 'Date'),
            new FieldMetaData('address', 'Address')
        ];
        component.options.exceptionsToStatus = [
            'date',
            'address',
            'field2'
        ];

        component.initializeHeadersFromExceptionsToStatus();

        expect(component.headers).toEqual([
            { prop: 'date', name: 'Date', active: false, style: {}, width: 150 },
            { prop: 'address', name: 'Address', active: false, style: {}, width: 150 },
            { prop: 'field2', name: 'Field 2', active: false, style: {}, width: 150 },
            { prop: 'category', name: 'Category', active: true, style: {}, width: 150 },
            { prop: 'field1', name: 'Field 1', active: true, style: {}, width: 150 }
        ]);
    });

    it('initializeHeadersFromFieldsConfig does create the expected headers in order', () => {
        component.options.fields = [
            new FieldMetaData('category', 'Category'),
            new FieldMetaData('field1', 'Field 1'),
            new FieldMetaData('field2', 'Field 2'),
            new FieldMetaData('date', 'Date'),
            new FieldMetaData('address', 'Address')
        ];
        component.options.allColumnStatus = 'show';
        component.options.fieldsConfig = [
            { name: 'date' },
            { name: 'address', hide: true },
            { name: 'field2', hide: true }
        ];

        component.initializeHeadersFromFieldsConfig();

        expect(component.headers).toEqual([
            { prop: 'date', name: 'Date', active: true, style: {}, width: 150 },
            { prop: 'address', name: 'Address', active: false, style: {}, width: 150 },
            { prop: 'field2', name: 'Field 2', active: false, style: {}, width: 150 },
            { prop: 'category', name: 'Category', active: true, style: {}, width: 150 },
            { prop: 'field1', name: 'Field 1', active: true, style: {}, width: 150 }
        ]);
    });

    it('getColumnWidth returns the width of the matching column in options.customColumnWidths', () => {
        component.options.customColumnWidths = [
            ['fieldWithCustomWidth', 260]
        ];

        expect(component.getColumnWidth(new FieldMetaData('fieldWithCustomWidth', 'Field 1'))).toEqual(260);
    });

    it('getColumnWidth returns the default width if field not found in options.customColumnWidths', () => {
        component.options.customColumnWidths = [
            ['fieldWithNoMatch', 300]
        ];

        expect(component.getColumnWidth(new FieldMetaData('anotherColumn', 'Another Column'))).toEqual(150);
    });

    it('subNgOnInit does call expected methods if options.fieldsConfig exists', () => {
        component.options.fieldsConfig = [
            { name: 'testField' }
        ];
        let initHeadersFromFieldsConfigSpy = spyOn(component, 'initializeHeadersFromFieldsConfig');
        let initHeadersFromExceptionsSpy = spyOn(component, 'initializeHeadersFromExceptionsToStatus');
        let recalcActiveHeadersSpy = spyOn(component, 'recalculateActiveHeaders');

        component.subNgOnInit();
        expect(initHeadersFromFieldsConfigSpy.calls.count()).toEqual(1);
        expect(initHeadersFromExceptionsSpy.calls.count()).toEqual(0);
        expect(recalcActiveHeadersSpy.calls.count()).toEqual(1);
    });

    it('subNgOnInit does call expected methods if options.fieldsConfig does not exist', () => {
        let initHeadersFromFieldsConfigSpy = spyOn(component, 'initializeHeadersFromFieldsConfig');
        let initHeadersFromExceptionsSpy = spyOn(component, 'initializeHeadersFromExceptionsToStatus');
        let recalcActiveHeadersSpy = spyOn(component, 'recalculateActiveHeaders');

        component.subNgOnInit();
        expect(initHeadersFromFieldsConfigSpy.calls.count()).toEqual(0);
        expect(initHeadersFromExceptionsSpy.calls.count()).toEqual(1);
        expect(recalcActiveHeadersSpy.calls.count()).toEqual(1);
    });

    it('postInit does call executeQueryChain', () => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(spy.calls.count()).toEqual(1);
    });

    it('subNgOnDestroy function does exist', (() => {
        expect(component.subNgOnDestroy).toBeDefined();
    }));

    it('subGetBindings does set expected bindings', (() => {
        let bindings = {};

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            heatmapField: '',
            idField: '',
            sortField: '',
            filterFields: [],
            arrayFilterOperator: 'and',
            exceptionsToStatus: [],
            filterable: false,
            heatmapDivisor: 0,
            ignoreSelf: false,
            singleFilter: false,
            skinny: false,
            sortDescending: true,
            fieldsConfig: [({
                name: 'Test Category Field',
                hide: false
            }), ({
                name: 'Test Date Field',
                hide: false
            }), ({
                name: 'Test Filter Field',
                hide: false
            }), ({
                name: 'Test ID Field',
                hide: false
            }), ({
                name: 'Test Link Field',
                hide: false
            }), ({
                name: 'Test Name Field',
                hide: false
            }), ({
                name: 'Test Relation Field A',
                hide: false
            }), ({
                name: 'Test Relation Field B',
                hide: false
            }), ({
                name: 'Test Size Field',
                hide: false
            }), ({
                name: 'Test Sort Field',
                hide: false
            }), ({
                name: 'Test Text Field',
                hide: false
            }), ({
                name: 'Test Type Field',
                hide: false
            }), ({
                name: 'Test X Field',
                hide: false
            }), ({
                name: 'Test Y Field',
                hide: false
            }), ({
                name: '_id',
                hide: false
            })]
        });

        component.options.idField = new FieldMetaData('testIdField');
        component.options.sortField = new FieldMetaData('testSortField');
        component.options.filterFields = [new FieldMetaData('filterField')];
        component.options.arrayFilterOperator = 'or';
        component.options.exceptionsToStatus = ['exception1', 'exception2'];
        component.options.filterable = true;
        component.options.ignoreSelf = true;
        component.options.singleFilter = true;
        component.options.skinny = true;
        component.options.sortDescending = false;
        component.headers = [{
            prop: 'name',
            name: 'Name',
            active: false,
            style: {},
            width: 100
        }];

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            heatmapField: '',
            idField: 'testIdField',
            sortField: 'testSortField',
            filterFields: [new FieldMetaData('filterField')],
            arrayFilterOperator: 'or',
            exceptionsToStatus: ['exception1', 'exception2'],
            filterable: true,
            heatmapDivisor: 0,
            ignoreSelf: true,
            singleFilter: true,
            skinny: true,
            sortDescending: false,
            fieldsConfig: [{
                name: 'Name',
                hide: true
            }]
        });
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

    it('createClause does return expected object', () => {
        component.options.sortField = new FieldMetaData('testSortField');
        expect(component.createClause()).toEqual(neon.query.where('testSortField', '!=', null));

        component.options.unsharedFilterField = new FieldMetaData('testFilterField');
        component.options.unsharedFilterValue = 'testFilterValue';
        expect(component.createClause()).toEqual(neon.query.and(neon.query.where('testSortField', '!=', null),
            neon.query.where('testFilterField', '=', 'testFilterValue')));
    });

    it('getButtonText does return expected string', () => {
        component.options.limit = 10;
        expect(component.getButtonText()).toBe('No Data');
        component.docCount = 10;
        expect(component.getButtonText()).toBe('Total 10');
        component.docCount = 20;
        expect(component.getButtonText()).toBe('1 - 10 of 20');
        component.page = 2;
        expect(component.getButtonText()).toBe('11 - 20 of 20');
        component.options.limit = 5;
        expect(component.getButtonText()).toBe('6 - 10 of 20');
        component.docCount = 5;
        expect(component.getButtonText()).toBe('Total 5');
    });

    it('addFilter should add filter', () => {
        let filter1 = {
            id: undefined,
            field: 'testDataField',
            prettyField: 'Test Data Field',
            value: 'Test Value'
        };

        component.addFilter(filter1, neon.query.where('testDataField', '=', 'Test Value'));

        expect(component.getCloseableFilters().length).toBe(1);
        expect(getService(FilterService).getFilters().length).toBe(1);

        //Set another filter. Filter key must be different
        let filter2 = {
            id: undefined,
            field: 'testDataField2',
            prettyField: 'Test Data Field 2',
            value: 'Test Value 2'
        };

        component.addFilter(filter2, neon.query.where('testDataField2', '=', 'Test Value 2'));
        expect(getService(FilterService).getFilters().length).toBe(2);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('removeFilter should remove filter', () => {
        let filter1 = {
            id: undefined,
            field: 'testDataField',
            prettyField: 'Test Data Field',
            value: 'Test Value'
        };

        component.addFilter(filter1, neon.query.where('testDataField', '=', 'Test Value'));

        expect(getService(FilterService).getFilters().length).toBe(1);
        component.removeLocalFilterFromLocalAndNeon(filter1, true, true);
        expect(getService(FilterService).getFilters().length).toBe(0);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('should remove filter when clicked', () => {
        let filter1 = {
            id: undefined,
            field: 'testDataField',
            prettyField: 'Test Data Field',
            value: 'Test Value'
        };

        component.addFilter(filter1, neon.query.where('testDataField', '=', 'Test Value'));

        expect(getService(FilterService).getFilters().length).toBe(1);
        let xEl = getDebug('.datatable-filter-reset .mat-icon-button');
        xEl.triggerEventHandler('click', null);
        expect(getService(FilterService).getFilters().length).toBe(0);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('filter-reset element should exist if filter is set', () => {
        expect(getDebug('.datatablefilter-reset')).toBeNull();

        let filter1 = {
            id: undefined,
            field: 'testDataField',
            prettyField: 'Test Data Field',
            value: 'Test Value'
        };

        component.addFilter(filter1, neon.query.where('testDataField', '=', 'Test Value'));

        expect(getDebug('.datatable-filter-reset')).toBeDefined();
    });

    it('no filter-reset elements should exist if filter is not set', () => {
        expect(component.getCloseableFilters().length).toBe(0);
        expect(getDebug('.filter-reset')).toBeNull();
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getOptions does return options object', () => {
        expect(component.getOptions()).toEqual(component.options);
    });

    it('getRowClassFunction does return function', () => {
        expect(typeof component.getRowClassFunction()).toEqual('function');
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
    });

    it('getRowClassFunction function with filters and filterFields does set active to expected boolean', () => {
        let rowClassFunction = component.getRowClassFunction();

        component.options.filterFields = [DatasetServiceMock.FILTER_FIELD];

        expect(rowClassFunction({})).toEqual({
            active: false
        });

        expect(rowClassFunction({
            testFilterField: 'testFilterValue'
        })).toEqual({
            active: false
        });

        component.filters = [{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'testFilterValue'
        }];

        expect(rowClassFunction({
            testFilterField: 'testFilterValue'
        })).toEqual({
            active: true
        });

        expect(rowClassFunction({
            testFilterField: 'testFilterValue2'
        })).toEqual({
            active: false
        });

        expect(rowClassFunction({
            testFilterField2: 'testFilterValue'
        })).toEqual({
            active: false
        });

        component.filters = [{
            id: undefined,
            field: 'testFilterField2',
            prettyField: 'Test Filter Field 2',
            value: 'testFilterValue2'
        }];

        expect(rowClassFunction({
            testFilterField: 'testFilterValue'
        })).toEqual({
            active: false
        });
    });

    it('getRowClassFunction function with heatmapField and heatmapDivisor does set expected heat', () => {
        let rowClassFunction = component.getRowClassFunction();

        component.options.heatmapDivisor = 1.5;
        component.options.heatmapField = DatasetServiceMock.SIZE_FIELD;

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
        component.options.heatmapField = DatasetServiceMock.SIZE_FIELD;

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
        component.options.heatmapField = DatasetServiceMock.SIZE_FIELD;

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
});
