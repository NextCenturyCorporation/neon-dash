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

    it('onResize does call refreshVisualization', () => {
        let spy = spyOn(component, 'refreshVisualization');

        component.onResize();

        expect(spy).toHaveBeenCalled();
    });

    it('initializeHeadersFromExceptionsToStatus does create the expected headers in order', () => {
        component.options.fields = [
            new FieldMetaData('category', 'Category'),
            new FieldMetaData('field1', 'Field 1'),
            new FieldMetaData('field2', 'Field 2'),
            new FieldMetaData('date', 'Date')
        ];
        component.options.exceptionsToStatus = [
            'date',
            'field2'
        ];

        component.initializeHeadersFromExceptionsToStatus();

        expect(component.options.headers.length).toEqual(4);
        expect(component.options.headers[0].prop).toEqual('date');
        expect(component.options.headers[0].name).toEqual('Date');
        expect(component.options.headers[0].active).toEqual(false);
        expect(component.options.headers[0].style).toEqual({});
        expect(component.options.headers[0].cellClass).toBeDefined();
        expect(component.options.headers[0].width).toEqual(150);
        expect(component.options.headers[1].prop).toEqual('field2');
        expect(component.options.headers[1].name).toEqual('Field 2');
        expect(component.options.headers[1].active).toEqual(false);
        expect(component.options.headers[1].style).toEqual({});
        expect(component.options.headers[1].cellClass).toBeDefined();
        expect(component.options.headers[1].width).toEqual(150);
        expect(component.options.headers[2].prop).toEqual('category');
        expect(component.options.headers[2].name).toEqual('Category');
        expect(component.options.headers[2].active).toEqual(true);
        expect(component.options.headers[2].style).toEqual({});
        expect(component.options.headers[2].cellClass).toBeDefined();
        expect(component.options.headers[2].width).toEqual(150);
        expect(component.options.headers[3].prop).toEqual('field1');
        expect(component.options.headers[3].name).toEqual('Field 1');
        expect(component.options.headers[3].active).toEqual(true);
        expect(component.options.headers[3].style).toEqual({});
        expect(component.options.headers[3].cellClass).toBeDefined();
        expect(component.options.headers[3].width).toEqual(150);
    });

    it('initializeHeadersFromFieldsConfig does create the expected headers in order', () => {
        component.options.headers = [];
        component.options.fields = [
            new FieldMetaData('category', 'Category'),
            new FieldMetaData('field1', 'Field 1'),
            new FieldMetaData('field2', 'Field 2'),
            new FieldMetaData('date', 'Date')
        ];
        component.options.allColumnStatus = 'show';
        component.options.fieldsConfig = [
            {name: 'date'},
            {name: 'field2', hide: true}
        ];

        component.initializeHeadersFromFieldsConfig();

        expect(component.options.headers.length).toEqual(4);
        expect(component.options.headers[0].prop).toEqual('date');
        expect(component.options.headers[0].name).toEqual('Date');
        expect(component.options.headers[0].active).toEqual(true);
        expect(component.options.headers[0].style).toEqual({});
        expect(component.options.headers[0].cellClass).toBeDefined();
        expect(component.options.headers[0].width).toEqual(150);
        expect(component.options.headers[1].prop).toEqual('field2');
        expect(component.options.headers[1].name).toEqual('Field 2');
        expect(component.options.headers[1].active).toEqual(false);
        expect(component.options.headers[1].style).toEqual({});
        expect(component.options.headers[1].cellClass).toBeDefined();
        expect(component.options.headers[1].width).toEqual(150);
        expect(component.options.headers[2].prop).toEqual('category');
        expect(component.options.headers[2].name).toEqual('Category');
        expect(component.options.headers[2].active).toEqual(true);
        expect(component.options.headers[2].style).toEqual({});
        expect(component.options.headers[2].cellClass).toBeDefined();
        expect(component.options.headers[2].width).toEqual(150);
        expect(component.options.headers[3].prop).toEqual('field1');
        expect(component.options.headers[3].name).toEqual('Field 1');
        expect(component.options.headers[3].active).toEqual(true);
        expect(component.options.headers[3].style).toEqual({});
        expect(component.options.headers[3].cellClass).toBeDefined();
        expect(component.options.headers[3].width).toEqual(150);

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
        expect(initHeadersFromFieldsConfigSpy).toHaveBeenCalled();
        expect(initHeadersFromExceptionsSpy).toHaveBeenCalledTimes(0);
        expect(recalcActiveHeadersSpy).toHaveBeenCalled();
    });

    it('subNgOnInit does call expected methods if options.fieldsConfig does not exist', () => {
        let initHeadersFromFieldsConfigSpy = spyOn(component, 'initializeHeadersFromFieldsConfig');
        let initHeadersFromExceptionsSpy = spyOn(component, 'initializeHeadersFromExceptionsToStatus');
        let recalcActiveHeadersSpy = spyOn(component, 'recalculateActiveHeaders');

        component.subNgOnInit();
        expect(initHeadersFromFieldsConfigSpy).toHaveBeenCalledTimes(0);
        expect(initHeadersFromExceptionsSpy).toHaveBeenCalled();
        expect(recalcActiveHeadersSpy).toHaveBeenCalled();
    });

    it('postInit does call executeQueryChain', () => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(spy).toHaveBeenCalled();
    });

    it('subNgOnDestroy function does exist', (() => {
        expect(component.subNgOnDestroy).toBeDefined();
    }));

    it('recalculateActiveHeaders does update activeHeaders and call detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.options.headers = [{
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
        expect(component.options.headers).toEqual([{
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
        /* tslint:disable:no-string-literal */
        component.activeHeaders[0]['width'] = 50000;
        /* tslint:enable:no-string-literal */

        component.options.headers = [{
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

        expect(component.options.headers[0].prop).toEqual('createdDate');
        expect(component.options.headers[0].name).toEqual('Date Created');
        expect(component.options.headers[0].active).toBeTruthy();
        expect(component.options.headers[0].style).toEqual({});
        expect(component.options.headers[0].cellClass).toEqual('');
        /* tslint:disable:no-string-literal */
        expect(component.options.headers[0]['width']).toBeLessThan(50000);
        expect(component.options.headers[0]['$$oldWidth']).toBeLessThan(50000);
        /* tslint:enable:no-string-literal */
        expect(component.activeHeaders.length).toBe(1);
        expect(component.activeHeaders[0].prop).toEqual('createdDate');
        expect(component.activeHeaders[0].name).toEqual('Date Created');
        expect(component.activeHeaders[0].active).toBeTruthy();
        expect(component.activeHeaders[0].style).toEqual({});
        expect(component.activeHeaders[0].cellClass).toEqual('');
        /* tslint:disable:no-string-literal */
        expect(component.activeHeaders[0]['width']).toBeLessThan(50000);
        expect(component.activeHeaders[0]['$$oldWidth']).toBeLessThan(50000);
        /* tslint:enable:no-string-literal */
        expect(component.headerWidths.get('createdDate')).toBeLessThan(50000);
        expect(spy).toHaveBeenCalled();
    });

    it('getActiveHeaders does return list of active headers', (() => {
        component.options.headers = [{
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

    it('closeColumnSelector does hide column selector and call detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.showColumnSelector = 'show';

        component.closeColumnSelector();
        expect(component.showColumnSelector).toEqual('hide');
        expect(spy).toHaveBeenCalled();
    }));

    it('deactivateAllHeaders does set all headers to inactive and calls detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.options.headers = [{
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
        expect(component.options.headers).toEqual([{
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
        component.options.headers = [{
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
        expect(component.options.headers).toEqual([{
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

    it('addLocalFilter does add the correct filter', (() => {
        component.filters = [{
            id: 'filterId',
            field: 'someField',
            value: 'value',
            prettyField: 'Some Field'
        }];

        component.addLocalFilter({
            id: 'newId',
            field: 'newField',
            value: 'something else',
            prettyField: 'New Field'
        });

        expect(component.filters).toEqual([{
            id: 'filterId',
            field: 'someField',
            value: 'value',
            prettyField: 'Some Field'
        }, {
            id: 'newId',
            field: 'newField',
            value: 'something else',
            prettyField: 'New Field'
        }]);
    }));

    it('filterIsUnique does return correct boolean value', (() => {
        component.filters = [{
            id: 'notUniqueId',
            field: 'someField',
            value: 'value',
            prettyField: 'Some Field'
        }];

        expect(component.filterIsUnique({
            id: 'notUniqueId',
            field: 'someField',
            value: 'value',
            prettyField: 'Some Field'
        })).toBeFalsy();

        expect(component.filterIsUnique({
            id: 'newId',
            field: 'newField',
            value: 'something else',
            prettyField: 'New Field'
        })).toBeTruthy();
    }));

    it('getFilterText does return correct label', (() => {
        component.filters = [{
            id: 'notUniqueId',
            field: 'someField',
            value: 'value',
            prettyField: 'Some Field'
        }];

        expect(component.getFilterText({
            id: 'notUniqueId',
            field: 'someField',
            value: 'value',
            prettyField: 'Some Field'
        })).toEqual('Some Field = value');

        expect(component.getFilterText({
            id: 'newId',
            field: 'newField',
            value: 40,
            prettyField: 'New Field'
        })).toEqual('New Field = 40');
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

    it('isValidQuery does return false if no options exist', (() => {
        expect(component.isValidQuery()).toBeFalsy();
    }));

    it('isValidQuery does return false if not all specified options exist', (() => {
        component.options.database = new DatabaseMetaData(undefined);
        component.options.table = new TableMetaData('documents');
        component.options.sortField = new FieldMetaData('sortField');

        expect(component.isValidQuery()).toBeFalsy();

        component.options.database = new DatabaseMetaData('someDatastore');
        component.options.table = new TableMetaData(undefined);
        component.options.sortField = new FieldMetaData('sortField');

        expect(component.isValidQuery()).toBeFalsy();

        component.options.database = new DatabaseMetaData('someDatastore');
        component.options.table = new TableMetaData('documents');
        component.options.sortField = new FieldMetaData(undefined);

        expect(component.isValidQuery()).toBeFalsy();
    }));

    it('isValidQuery does return true if all specified options exist', (() => {
        component.options.database = new DatabaseMetaData('someDatastore');
        component.options.table = new TableMetaData('documents');
        component.options.sortField = new FieldMetaData('sortField');

        expect(component.isValidQuery()).toBeTruthy();
    }));

    it('options.createBindings does set expected bindings', (() => {
        expect(component.options.createBindings()).toEqual({
            configFilter: undefined,
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            hideUnfiltered: false,
            limit: 100,
            table: 'testTable1',
            title: 'Data Table',
            unsharedFilterValue: '',
            unsharedFilterField: '',
            colorField: '',
            heatmapField: '',
            idField: '',
            sortField: '',
            filterFields: [],
            arrayFilterOperator: 'and',
            exceptionsToStatus: [],
            filterable: false,
            heatmapDivisor: 0,
            ignoreSelf: false,
            reorderable: true,
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
        component.options.reorderable = false;
        component.options.singleFilter = true;
        component.options.skinny = true;
        component.options.sortDescending = false;
        component.options.headers = [{
            cellClass: function() { /* No-op */ },
            prop: 'name',
            name: 'Name',
            active: false,
            style: {},
            width: 100
        }];

        expect(component.options.createBindings()).toEqual({
            configFilter: undefined,
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            hideUnfiltered: false,
            limit: 100,
            table: 'testTable1',
            title: 'Data Table',
            unsharedFilterValue: '',
            unsharedFilterField: '',
            colorField: '',
            heatmapField: '',
            idField: 'testIdField',
            sortField: 'testSortField',
            filterFields: ['filterField'],
            arrayFilterOperator: 'or',
            exceptionsToStatus: ['exception1', 'exception2'],
            filterable: true,
            heatmapDivisor: 0,
            ignoreSelf: true,
            reorderable: false,
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

    it('createQuery does return expected object', () => {
        component.options.database = new DatabaseMetaData('someDatastore');
        component.options.table = new TableMetaData('documents');
        component.options.sortField = new FieldMetaData('testSortField');
        component.options.limit = 25;
        component.page = 1;

        let expectedQuery = new neon.query.Query().selectFrom(component.options.database.name, component.options.table.name)
            .where('testSortField', '!=', null).sortBy('testSortField', -1).limit(25)
            .offset(0);

        expect(component.createQuery()).toEqual(expectedQuery);
    });

    it('getFiltersToIgnore does return null', () => {
        component.options.ignoreSelf = false;

        expect(component.getFiltersToIgnore()).toBeNull();
    });

    it('getFiltersToIgnore does return an array', () => {
        component.options.ignoreSelf = true;
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterField');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterFields = [DatasetServiceMock.FILTER_FIELD];

        let filtersResult = component.getFiltersToIgnore();
        expect(filtersResult.length).toEqual(1);
        expect(filtersResult[0]).toEqual('testDatabase1-testTable1-testFilterField');
    });

    it('arrayToString does return the expected string value', () => {
        expect(component.arrayToString(['someElement'])).toEqual('[someElement]');
        expect(component.arrayToString([{key: 'hi'}])).toEqual('[]');
    });

    it('objectToString does return empty string', () => {
        expect(component.objectToString({key: 'value'})).toEqual('');
    });

    it('toCellString does return expected value', () => {
        expect(component.toCellString(null, 'object')).toEqual('');
        expect(component.toCellString(['someElement'], 'array')).toEqual('[someElement]');
        expect(component.toCellString({key: 'value'}, 'object')).toEqual('');
        expect(component.toCellString(4, 'number')).toEqual(4);
    });

    it('onQuerySuccess does update properties as expected when response.data.length is 1', () => {
        let getDocCountSpy = spyOn(component, 'getDocCount');
        let refreshVisSpy = spyOn(component, 'refreshVisualization');
        component.options.fields = component.options.fields = [
            new FieldMetaData('_id', 'id', false, 'number'),
            new FieldMetaData('category', 'Category', false, 'string'),
            new FieldMetaData('testField', 'Test Field', false, 'string')
        ];

        component.onQuerySuccess({data: [
            {_id: 1, category: 'books', testField: 'test', ignore: 'ignore', _docCount: 1}
        ]});

        expect(component.activeData).toEqual([]);
        expect(component.responseData).toEqual([]);
        expect(component.docCount).toEqual(1);
        expect(getDocCountSpy).toHaveBeenCalledTimes(0);
        expect(refreshVisSpy).toHaveBeenCalledTimes(0);
    });

    it('onQuerySuccess does update properties as expected when response.data.length is not equal to 1', () => {
        let getDocCountSpy = spyOn(component, 'getDocCount');
        let refreshVisSpy = spyOn(component, 'refreshVisualization');
        component.options.fields = component.options.fields = [
            new FieldMetaData('_id', 'id', false, 'number'),
            new FieldMetaData('category', 'Category', false, 'string'),
            new FieldMetaData('testField', 'Test Field', false, 'string')
        ];

        component.onQuerySuccess({data: [
            {_id: 1, category: 'books', testField: 'test', ignore: 'ignore', _docCount: 1},
            {_id: 2, category: 'books', testField: 'some other value', ignore: 'ignoring'}
        ]});

        expect(component.activeData).toEqual([
            {_id: 1, category: 'books', testField: 'test'},
            {_id: 2, category: 'books', testField: 'some other value'}
        ]);
        expect(component.responseData).toEqual([
            {_id: 1, category: 'books', testField: 'test', ignore: 'ignore', _docCount: 1},
            {_id: 2, category: 'books', testField: 'some other value', ignore: 'ignoring'}
        ]);
        expect(component.docCount).toEqual(0);
        expect(getDocCountSpy).toHaveBeenCalled();
        expect(refreshVisSpy).toHaveBeenCalled();
    });

    it('getDocCount does call expected functions if cannotExecuteQuery returns false', () => {
        spyOn(component, 'cannotExecuteQuery').and.returnValue(false);
        let getFiltersSpy = spyOn(component, 'getFiltersToIgnore');
        let exQuerySpy = spyOn(component, 'executeQuery');

        component.getDocCount();

        expect(getFiltersSpy).toHaveBeenCalled();
        expect(exQuerySpy).toHaveBeenCalled();
    });

    it('getDocCount does not call executeQuery if cannotExecuteQuery returns true', () => {
        spyOn(component, 'cannotExecuteQuery').and.returnValue(true);
        let getFiltersSpy = spyOn(component, 'getFiltersToIgnore');
        let exQuerySpy = spyOn(component, 'executeQuery');

        component.getDocCount();

        expect(getFiltersSpy).toHaveBeenCalledTimes(0);
        expect(exQuerySpy).toHaveBeenCalledTimes(0);
    });

    it('setupFilters does not do anything if no filter exists', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;

        component.setupFilters();
        expect(component.filters).toEqual([]);
    });

    it('setupFilters does not add neon filter with non-matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;

        // Test matching database/table but not field.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        component.options.database = DatasetServiceMock.DATABASES[1];

        // Test matching database/field but not table.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[1];

        // Test matching table/field but not table.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does add neon filter to filters', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testSortField', '=', 'value1'), 'testSortField');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.sortField = DatasetServiceMock.SORT_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testSortField',
            field: 'testSortField',
            prettyField: 'Test Sort Field',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does remove previous filters', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testSortField', '=', 'value1'), 'testSortField');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.sortField = DatasetServiceMock.SORT_FIELD;

        component.filters = [{
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'value2'
        }];

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testSortField',
            field: 'testSortField',
            prettyField: 'Test Sort Field',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does ignore neon filters with multiple clauses', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [
                neon.query.where('testFilterField', '=', 'value1'),
                neon.query.where('testSortField', '=', 'value2')
            ]), 'testSortField');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.sortField = DatasetServiceMock.SORT_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('handleFiltersChangedEvent does set page and call expected function', () => {
        let spy = spyOn(component, 'executeQueryChain');
        component.page = 5;
        component.handleFiltersChangedEvent();

        expect(component.page).toEqual(1);
        expect(spy).toHaveBeenCalled();
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
        component.options.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {color: 'black'},
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
        component.options.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {color: 'black'},
            cellClass: '',
            width: 100
        }, {
            prop: 'testField2',
            name: 'Test Field 2',
            active: true,
            style: {color: 'black'},
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
        component.options.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {color: 'black'},
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
        expect(component.options.headers[0].style).toEqual({
            color: 'black',
            backgroundColor: 'rgba(0, 0, 0, .2)',
            border: 'grey dashed 1px'
        });
    });

    it('onMouseEnter does not set drag object or styles if isDragging is false', () => {
        component.options.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {color: 'black'},
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
        expect(component.options.headers[0].style).toEqual({color: 'black'});
    });

    it('onMouseEnter does set drag object and styles if isDragging is true', () => {
        component.options.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {color: 'black'},
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
        expect(component.options.headers[0].style).toEqual({
            color: 'black',
            borderTop: 'thick solid grey'
        });
        expect(component.options.headers[1].style).toEqual({});

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
        expect(component.options.headers[0].style).toEqual({
            color: 'black',
            borderTop: 'thick solid grey'
        });
        expect(component.options.headers[1].style).toEqual({
            borderBottom: 'thick solid grey'
        });
    });

    it('onMouseLeaveItem does not set styles if isDragging is false or index matches drag.downIndex', () => {
        component.options.headers = [{
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

        expect(component.options.headers[0].style).toEqual({
            borderTop: 'thick solid grey',
            borderBottom: 'thick solid grey'
        });

        component.drag.mousedown = true;
        component.drag.downIndex = 0;

        component.onMouseLeaveItem(0);

        expect(component.options.headers[0].style).toEqual({
            borderTop: 'thick solid grey',
            borderBottom: 'thick solid grey'
        });
    });

    it('onMouseLeaveItem does set styles if isDragging is true and index does not match drag.downIndex', () => {
        component.drag.mousedown = true;
        component.drag.downIndex = 1;
        component.options.headers = [{
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

        expect(component.options.headers[0].style).toEqual({
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
        component.options.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {borderTop: 'thick solid grey'},
            cellClass: '',
            width: 100
        }];

        component.onMouseLeaveArea();

        expect(component.drag.downIndex).toEqual(-1);
        expect(component.drag.mousedown).toBeFalsy();
        expect(component.options.headers[0].style).toEqual({});
    });

    it('onMouseMove does not set drag object if isDragging is false', () => {
        component.onMouseMove({screenX: 40, screenY: 55});

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
        component.onMouseMove({screenX: 40, screenY: 55});

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
        component.options.headers = [{
            prop: 'testField1',
            name: 'Test Field 1',
            active: true,
            style: {color: 'black'},
            cellClass: '',
            width: 100
        }, {
            prop: 'testField2',
            name: 'Test Field 2',
            active: true,
            style: {padding: '10px'},
            cellClass: '',
            width: 100
        }];

        component.clearHeaderStyles();

        expect(component.options.headers[0].style).toEqual({});
        expect(component.options.headers[1].style).toEqual({});
    });

    it('getCloseableFilters does return filters', () => {
        component.filters = [{
            id: 'filterId',
            field: 'someField',
            value: 'value',
            prettyField: 'Some Field'
        }];

        expect(component.getCloseableFilters()).toEqual([{
            id: 'filterId',
            field: 'someField',
            value: 'value',
            prettyField: 'Some Field'
        }]);
    });

    it('nextPage does add 1 to page and call expected function', () => {
        component.page = 1;
        let spy = spyOn(component, 'executeQueryChain');
        component.nextPage();

        expect(component.page).toEqual(2);
        expect(spy).toHaveBeenCalled();
    });

    it('previousPage does subtract 1 from page and call expected function', () => {
        component.page = 5;
        let spy = spyOn(component, 'executeQueryChain');
        component.previousPage();

        expect(component.page).toEqual(4);
        expect(spy).toHaveBeenCalled();
    });

    it('getButtonText does return expected string', () => {
        component.options.limit = 10;
        expect(component.getButtonText()).toBe('No Data');
        component.options.hideUnfiltered = true;
        expect(component.getButtonText()).toBe('Please Filter');
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

    it('onSelect does update selected array and calls publishAnyCustomEvents, but not publishSelectId', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let addFilterSpy = spyOn(component, 'addFilter');
        let selected = [{
            category: 'books',
            title: 'Test'
        }];

        component.onSelect({selected: selected});

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalledTimes(0);
        expect(publishAnySpy).toHaveBeenCalled();
        expect(addFilterSpy).toHaveBeenCalledTimes(0);
    });

    it('onSelect does update selected array, calls publishSelectId and publishAnyCustomEvents', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let addFilterSpy = spyOn(component, 'addFilter');
        let selected = [{
            category: 'books',
            title: 'Test'
        }];
        component.options.idField = new FieldMetaData('category');

        component.onSelect({selected: selected});

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(addFilterSpy).toHaveBeenCalledTimes(0);
    });

    it('onSelect does update selected array and filters, calls publishSelectId and publishAnyCustomEvents', () => {
        let publishIdSpy = spyOn(component, 'publishSelectId');
        let publishAnySpy = spyOn(component, 'publishAnyCustomEvents');
        let addFilterSpy = spyOn(component, 'addFilter');
        let selected = [{
            category: 'books',
            title: 'Test'
        }];
        component.options.idField = new FieldMetaData('category');
        component.options.fields = [new FieldMetaData('category')];
        component.options.filterFields = [new FieldMetaData('category')];
        component.options.filterable = true;
        component.responseData = [{
            category: 'books',
            title: 'Test'
        }, {
            category: 'test',
            title: 'Test 2'
        }];

        component.onSelect({selected: selected});

        expect(component.selected).toEqual(selected);
        expect(publishIdSpy).toHaveBeenCalled();
        expect(publishAnySpy).toHaveBeenCalled();
        expect(addFilterSpy).toHaveBeenCalled();
    });

    it('createFilterObject does return expected filter object', () => {
        expect(component.createFilterObject('someField', 'value', 'Some Field')).toEqual({
            id: undefined,
            field: 'someField',
            value: 'value',
            prettyField: 'Some Field'
        });
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
        /* tslint:disable:no-string-literal */
        component.activeHeaders[0]['width'] = 75;
        component.activeHeaders[1]['width'] = 150;
        /* tslint:enable:no-string-literal */

        component.onTableResize({column: {prop: 'someField', width: 100}, newValue: 50});

        expect(component.headerWidths.get('createdDate')).toEqual(75);
        expect(component.headerWidths.get('someField')).toEqual(50);
        expect(component.headerWidths.get('testField')).toEqual(200);
        expect(spy).toHaveBeenCalled();
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
        expect(component.options).toEqual(component.options);
    });

    it('getCellClassFunction does return function', () => {
        expect(typeof component.getCellClassFunction()).toEqual('function');
    });

    it('getCellClassFunction function with colorField does set color class', () => {
        let cellClassFunction = component.getCellClassFunction();

        component.options.colorField = DatasetServiceMock.CATEGORY_FIELD;

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

        component.options.colorField = DatasetServiceMock.CATEGORY_FIELD;

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

        component.options.colorField = DatasetServiceMock.CATEGORY_FIELD;

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

        component.options.colorField = DatasetServiceMock.CATEGORY_FIELD;

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
