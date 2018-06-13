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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {} from 'jasmine-core';

import { AggregationComponent, AggregationOptions } from './aggregation.component';
import { AbstractAggregationSubcomponent, AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';
import { ChartJsData } from './subcomponent.chartjs.abstract';
import { ChartJsLineSubcomponent } from './subcomponent.chartjs.line';
import { ChartJsScatterSubcomponent } from './subcomponent.chartjs.scatter';
import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: Aggregation', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            AggregationComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ActiveGridService,
            ColorSchemeService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            ErrorNotificationService,
            ExportService,
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService,
            VisualizationService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class options properties are set to expected defaults', () => {
        expect(component.options.aggregationField).toEqual(component.emptyField);
        expect(component.options.groupField).toEqual(component.emptyField);
        expect(component.options.xField).toEqual(component.emptyField);
        expect(component.options.yField).toEqual(component.emptyField);

        expect(component.options.aggregation).toEqual('count');
        expect(component.options.granularity).toEqual('year');
        expect(component.options.hideGridLines).toEqual(false);
        expect(component.options.hideGridTicks).toEqual(false);
        expect(component.options.ignoreSelf).toEqual(false);
        expect(component.options.lineCurveTension).toEqual(0.3);
        expect(component.options.lineFillArea).toEqual(false);
        expect(component.options.logScaleX).toEqual(false);
        expect(component.options.logScaleY).toEqual(false);
        expect(component.options.scaleMaxX).toEqual('');
        expect(component.options.scaleMaxY).toEqual('');
        expect(component.options.scaleMinX).toEqual('');
        expect(component.options.scaleMinY).toEqual('');
        expect(component.options.sortByAggregation).toEqual(false);
        expect(component.options.timeFill).toEqual(false);
        expect(component.options.type).toEqual('line');
        expect(component.options.yPercentage).toEqual(0.3);
        expect(component.options.newType).toEqual('line');
    });

    it('class properties are set to expected defaults', () => {
        expect(component.activeData).toEqual([]);
        expect(component.defaultGroupColor).toEqual(new Color(255, 255, 255));
        expect(component.defaultHoverColor).toEqual(new Color(255, 255, 255));
        expect(component.filters).toEqual([]);
        expect(component.lastPage).toEqual(true);
        expect(component.minimumDimensions.height).toBeDefined();
        expect(component.minimumDimensions.width).toBeDefined();
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([]);
        expect(component.selectedArea).toEqual(null);
        expect(component.selectedAreaOffset.x).toBeDefined();
        expect(component.selectedAreaOffset.y).toBeDefined();
        expect(component.subcomponentObject.constructor.name).toEqual(ChartJsLineSubcomponent.name);
        expect(component.subcomponentTypes).toEqual([{
            name: 'Bar, Horizontal (Aggregations)',
            type: 'bar-h'
        }, {
            name: 'Bar, Vertical (Aggregations)',
            type: 'bar-v'
        }, {
            name: 'Doughnut (Aggregations)',
            type: 'doughnut'
        }, {
            name: 'Histogram (Aggregations)',
            type: 'histogram'
        }, {
            name: 'Line (Aggregations)',
            type: 'line'
        }, {
            name: 'Line (Points)',
            type: 'line-xy'
        }, {
            name: 'Pie (Aggregations)',
            type: 'pie'
        }, {
            name: 'Scatter (Aggregations)',
            type: 'scatter'
        }, {
            name: 'Scatter (Points)',
            type: 'scatter-xy'
        }, {
            name: 'Table (Aggregations)',
            type: 'table'
        }]);

        // Element Refs
        expect(component.headerText).toBeDefined();
        expect(component.hiddenCanvas).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.subcomponentHtml).toBeDefined();
        expect(component.visualization).toBeDefined();
    });

    it('addOrReplaceFilter with doNotReplace=true does add new filter to empty array and call addNeonFilter', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        let spy = spyOn(component, 'addNeonFilter');

        let filter = {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let neonFilter = neon.query.where('field1', '=', 'value1');

        component.addOrReplaceFilter(filter, neonFilter, true);

        expect(component.filters).toEqual([filter]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, filter, neonFilter]);
    });

    it('addOrReplaceFilter with doNotReplace=true does add new filter to non-empty array and call addNeonFilter', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        let spy = spyOn(component, 'addNeonFilter');

        let filter = {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let neonFilter = neon.query.where('field1', '=', 'value1');
        let existingFilter = {
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        };
        component.filters = [existingFilter];

        component.addOrReplaceFilter(filter, neonFilter, true);
        expect(component.filters).toEqual([existingFilter, filter]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, filter, neonFilter]);
    });

    it('addOrReplaceFilter with doNotReplace=true does not add new filter or call addNeonFilter if matching filter exists', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        let spy = spyOn(component, 'addNeonFilter');

        let filter = {
            id: 'idB',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let neonFilter = neon.query.where('field1', '=', 'value1');
        let existingFilter = {
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        component.filters = [existingFilter];

        component.addOrReplaceFilter(filter, neonFilter, true);
        expect(component.filters).toEqual([existingFilter]);
        expect(spy.calls.count()).toEqual(0);
    });

    it('addOrReplaceFilter does add new filter to empty array and call addNeonFilter', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        let spy = spyOn(component, 'addNeonFilter');

        let filter = {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let neonFilter = neon.query.where('field1', '=', 'value1');

        component.addOrReplaceFilter(filter, neonFilter, true);
        expect(component.filters).toEqual([filter]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, filter, neonFilter]);
    });

    it('addOrReplaceFilter does replace existing filter in single element array and call replaceNeonFilter', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        let spy = spyOn(component, 'replaceNeonFilter');

        let filter = {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let neonFilter = neon.query.where('field1', '=', 'value1');
        let existingFilter = {
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        };
        component.filters = [existingFilter];

        component.addOrReplaceFilter(filter, neonFilter);

        expect(component.filters).toEqual([filter]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, filter, neonFilter]);
    });

    it('addOrReplaceFilter with a multiple element array and call removeAllFilters', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        let spy = spyOn(component, 'removeAllFilters');

        let filter = {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let neonFilter = neon.query.where('field1', '=', 'value1');
        let existingFilterA = {
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        };
        let existingFilterB = {
            id: 'idB',
            field: 'field3',
            prettyField: 'prettyField3',
            value: 'value3'
        };
        component.filters = [existingFilterA, existingFilterB];

        component.addOrReplaceFilter(filter, neonFilter);
        expect(spy.calls.count()).toEqual(1);
        let args = spy.calls.argsFor(0);
        expect(args[0]).toEqual([existingFilterA, existingFilterB]);

        // Run the callback.
        spy = spyOn(component, 'addNeonFilter');
        expect(typeof args[1]).toEqual('function');
        args[1]();
        expect(component.filters).toEqual([filter]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, filter, neonFilter]);
    });

    it('addVisualizationFilter does update filters', () => {
        component.addVisualizationFilter({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);

        component.addVisualizationFilter({
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
    });

    it('addVisualizationFilter does update filters if the ID of the given filter and the ID of an existing filter are matching', () => {
        component.addVisualizationFilter({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        component.addVisualizationFilter({
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
    });

    it('createQuery does return expected aggregation query', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.xField = DatasetServiceMock.X_FIELD;

        expect(component.createQuery()).toEqual(new neon.query.Query().limit(10000)
            .selectFrom(component.options.database.name, component.options.table.name)
            .where(neon.query.where('testXField', '!=', null))
            .groupBy(['testXField'])
            .aggregate(neonVariables.COUNT, '*', '_aggregation')
            .sortBy('testXField', neonVariables.ASCENDING));
    });

    it('createQuery does return expected aggregation query with optional fields', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.aggregation = 'sum';
        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.limit = 100;
        component.options.sortByAggregation = true;
        component.options.xField = DatasetServiceMock.X_FIELD;

        expect(component.createQuery()).toEqual(new neon.query.Query().limit(100)
            .selectFrom(component.options.database.name, component.options.table.name)
            .where(neon.query.where('testXField', '!=', null))
            .groupBy(['testXField', 'testCategoryField'])
            .aggregate(neonVariables.SUM, 'testSizeField', '_aggregation')
            .sortBy('_aggregation', neonVariables.DESCENDING));
    });

    it('createQuery does return expected XY query', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.type = 'line-xy';
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;

        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testXField', '!=', null),
            neon.query.where('testYField', '!=', null)
        ]);

        expect(component.createQuery()).toEqual(new neon.query.Query().limit(10000)
            .selectFrom(component.options.database.name, component.options.table.name)
            .where(wherePredicate)
            .groupBy(['testXField', 'testYField', 'testCategoryField'])
            .sortBy('testXField', neonVariables.ASCENDING));
    });

    it('createQuery does return expected aggregation query with filters', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.aggregation = 'sum';
        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.filter = {
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        };
        component.options.unsharedFilterField = DatasetServiceMock.FILTER_FIELD;
        component.options.unsharedFilterValue = 'testFilterValue';

        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testXField', '!=', null),
            neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue'),
            neon.query.where('testFilterField', '=', 'testFilterValue')
        ]);

        expect(component.createQuery()).toEqual(new neon.query.Query().limit(10000)
            .selectFrom(component.options.database.name, component.options.table.name)
            .where(wherePredicate)
            .groupBy(['testXField', 'testCategoryField'])
            .aggregate(neonVariables.SUM, 'testSizeField', '_aggregation')
            .sortBy('testXField', neonVariables.ASCENDING));
    });

    it('createQuery does return expected XY query with filters', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.type = 'line-xy';
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.options.filter = {
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        };
        component.options.unsharedFilterField = DatasetServiceMock.FILTER_FIELD;
        component.options.unsharedFilterValue = 'testFilterValue';

        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testXField', '!=', null),
            neon.query.where('testYField', '!=', null),
            neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue'),
            neon.query.where('testFilterField', '=', 'testFilterValue')
        ]);

        expect(component.createQuery()).toEqual(new neon.query.Query().limit(10000)
            .selectFrom(component.options.database.name, component.options.table.name)
            .where(wherePredicate)
            .groupBy(['testXField', 'testYField', 'testCategoryField'])
            .sortBy('testXField', neonVariables.ASCENDING));
    });

    it('createQuery does return expected date aggregation query', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.aggregation = 'sum';
        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.DATE_FIELD;

        let groups = [
            new neon.query.GroupByFunctionClause('year', 'testDateField', '_year'),
            'testCategoryField'
        ];

        expect(component.createQuery()).toEqual(new neon.query.Query().limit(10000)
            .selectFrom(component.options.database.name, component.options.table.name)
            .where(neon.query.where('testDateField', '!=', null))
            .groupBy(groups)
            .aggregate(neonVariables.MIN, 'testDateField', '_date')
            .aggregate(neonVariables.SUM, 'testSizeField', '_aggregation')
            .sortBy('_date', neonVariables.ASCENDING));
    });

    it('createQuery does return expected date XY query', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.type = 'line-xy';
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;

        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testDateField', '!=', null),
            neon.query.where('testYField', '!=', null)
        ]);

        let groups = [
            new neon.query.GroupByFunctionClause('year', 'testDateField', '_year'),
            'testYField',
            'testCategoryField'
        ];

        expect(component.createQuery()).toEqual(new neon.query.Query().limit(10000)
            .selectFrom(component.options.database.name, component.options.table.name)
            .where(wherePredicate)
            .groupBy(groups)
            .aggregate(neonVariables.MIN, 'testDateField', '_date')
            .sortBy('_date', neonVariables.ASCENDING));
    });

    it('createQuery does add multiple groups to date query if needed', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.aggregation = 'sum';
        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.granularity = 'minute';
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.DATE_FIELD;

        let groups = [
            new neon.query.GroupByFunctionClause('minute', 'testDateField', '_minute'),
            new neon.query.GroupByFunctionClause('hour', 'testDateField', '_hour'),
            new neon.query.GroupByFunctionClause('dayOfMonth', 'testDateField', '_day'),
            new neon.query.GroupByFunctionClause('month', 'testDateField', '_month'),
            new neon.query.GroupByFunctionClause('year', 'testDateField', '_year'),
            'testCategoryField'
        ];

        expect(component.createQuery()).toEqual(new neon.query.Query().limit(10000)
            .selectFrom(component.options.database.name, component.options.table.name)
            .where(neon.query.where('testDateField', '!=', null))
            .groupBy(groups)
            .aggregate(neonVariables.MIN, 'testDateField', '_date')
            .aggregate(neonVariables.SUM, 'testSizeField', '_aggregation')
            .sortBy('_date', neonVariables.ASCENDING));
    });

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toEqual('No Data');

        component.options.limit = 1;
        component.activeData = [{}];
        component.responseData = [{}, {}];
        expect(component.getButtonText()).toEqual('1 of 2');

        component.activeData = [{}, {}];
        expect(component.getButtonText()).toEqual('Total 2');

        component.responseData = [{}, {}, {}, {}];
        expect(component.getButtonText()).toEqual('1 of 4');

        component.options.limit = 2;
        expect(component.getButtonText()).toEqual('1 - 2 of 4');

        component.page = 2;
        expect(component.getButtonText()).toEqual('3 - 4 of 4');
    });

    it('getCloseableFilters does return expected array of filters', () => {
        expect(component.getCloseableFilters()).toEqual([]);

        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.getCloseableFilters()).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getExportFields does return expected array', () => {
        expect(component.getExportFields()).toEqual([{
            columnName: '',
            prettyName: ''
        }]);

        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;

        expect(component.getExportFields()).toEqual([{
            columnName: 'testXField',
            prettyName: 'Test X Field'
        }, {
            columnName: 'testSizeField',
            prettyName: 'Test Size Field'
        }, {
            columnName: 'testCategoryField',
            prettyName: 'Test Category Field'
        }]);

        component.options.type = 'line-xy';

        expect(component.getExportFields()).toEqual([{
            columnName: 'testXField',
            prettyName: 'Test X Field'
        }, {
            columnName: 'testYField',
            prettyName: 'Test Y Field'
        }, {
            columnName: 'testCategoryField',
            prettyName: 'Test Category Field'
        }]);
    });

    it('getFiltersToIgnore does return null if no filters are set', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(null);
    });

    it('getFiltersToIgnore does return null if service filters are set but local filters are empty and ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testXField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return null if service filters and local filters are set but ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testXField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.filters = [{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: undefined,
            prettyField: undefined,
            value: undefined
        }];

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return expected array of IDs if service filters and local filters are set and ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testXField', '!=', null), 'testFilterName1');

        component.options.ignoreSelf = true;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.filters = [{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: undefined,
            prettyField: undefined,
            value: undefined
        }];

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return null if XY service filters are set but local filters are empty and ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [neon.query.where('testXField', '!=', null), neon.query.where('testYField', '!=', null)]),
            'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.type = 'scatter-xy';

        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.yField = DatasetServiceMock.Y_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return null if XY service filters and local filters are set but ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [neon.query.where('testXField', '!=', null), neon.query.where('testYField', '!=', null)]),
            'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.type = 'scatter-xy';
        component.filters = [{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: undefined,
            prettyField: undefined,
            value: undefined
        }];

        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.yField = DatasetServiceMock.Y_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return expected array of IDs if XY service filters and local filters are set and ignoreSelf=true', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [neon.query.where('testXField', '!=', null), neon.query.where('testYField', '!=', null)]),
            'testFilterName1');

        component.options.ignoreSelf = true;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.type = 'scatter-xy';
        component.filters = [{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: undefined,
            prettyField: undefined,
            value: undefined
        }];

        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.yField = DatasetServiceMock.Y_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return null if service filters and local filters are set but are not matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testXField', '!=', null), 'testFilterName1');

        component.options.ignoreSelf = true;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.Y_FIELD;
        component.filters = [{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: undefined,
            prettyField: undefined,
            value: undefined
        }];

        // Test matching database/table but not field.
        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.xField = DatasetServiceMock.X_FIELD;

        // Test matching database/field but not table.
        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[1];

        // Test matching table/field but not database.
        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFilterText does return expected string', () => {
        expect(component.getFilterText({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 1234
        })).toEqual('prettyField1 = 1234');

        expect(component.getFilterText({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        })).toEqual('prettyField1 = value1');

        expect(component.getFilterText({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: {
                beginX: 'beginX1',
                endX: 'endX1'
            }
        })).toEqual('prettyField1 from beginX1 to endX1');

        expect(component.getFilterText({
            id: 'idA',
            field: 'field1',
            prettyField: {
                x: 'prettyX1',
                y: 'prettyY1'
            },
            value: {
                beginX: 'beginX1',
                beginY: 'beginY1',
                endX: 'endX1',
                endY: 'endY1'
            }
        })).toEqual('prettyX1 from beginX1 to endX1 and prettyY1 from beginY1 to endY1');
    });

    it('getFilterText with date data does return expected string', () => {
        component.options.xField = DatasetServiceMock.DATE_FIELD;

        expect(component.getFilterText({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: {
                beginX: '2018-01-01T00:00:00.000Z',
                endX: '2018-01-03T00:00:00.000Z'
            }
        })).toEqual('prettyField1 from Mon, Jan 1, 2018, 12:00 AM to Wed, Jan 3, 2018, 12:00 AM');

        expect(component.getFilterText({
            id: 'idA',
            field: 'field1',
            prettyField: {
                x: 'prettyX1',
                y: 'prettyY1'
            },
            value: {
                beginX: '2018-01-01T00:00:00.000Z',
                beginY: 'beginY1',
                endX: '2018-01-03T00:00:00.000Z',
                endY: 'endY1'
            }
        })).toEqual('prettyX1 from Mon, Jan 1, 2018, 12:00 AM to Wed, Jan 3, 2018, 12:00 AM and prettyY1 from beginY1 to endY1');
    });

    it('getFilterValueSummary does return expected string', () => {
        expect(component.getFilterValueSummary(true)).toEqual(true);
        expect(component.getFilterValueSummary(1234)).toEqual(1234);
        expect(component.getFilterValueSummary('testString')).toEqual('testString');
        expect(component.getFilterValueSummary({})).toEqual('Filter');
    });

    it('getHiddenCanvas does return hiddenCanvas', () => {
        expect(component.getHiddenCanvas()).toEqual(component.hiddenCanvas);
    });

    it('getOptions does return options', () => {
        expect(component.getOptions()).toEqual(component.options);
    });

    it('getXFieldLabel does return expected string', () => {
        expect(component.getXFieldLabel('bar-h')).toEqual('Bar Field');
        expect(component.getXFieldLabel('bar-v')).toEqual('Bar Field');
        expect(component.getXFieldLabel('histogram')).toEqual('Bar Field');

        expect(component.getXFieldLabel('doughnut')).toEqual('Slice Field');
        expect(component.getXFieldLabel('pie')).toEqual('Slice Field');

        expect(component.getXFieldLabel('line')).toEqual('X Field');
        expect(component.getXFieldLabel('line-xy')).toEqual('X Field');
        expect(component.getXFieldLabel('scatter')).toEqual('X Field');
        expect(component.getXFieldLabel('scatter-xy')).toEqual('X Field');

        expect(component.getXFieldLabel('table')).toEqual('Row Field');
    });

    it('goToNextPage does not update page or call updateActiveData if lastPage is true', () => {
        let spy = spyOn(component, 'updateActiveData');
        component.goToNextPage();

        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(0);
    });

    it('goToNextPage does update page and call updateActiveData if lastPage is false', () => {
        let spy = spyOn(component, 'updateActiveData');
        component.lastPage = false;

        component.goToNextPage();
        expect(component.page).toEqual(2);
        expect(spy.calls.count()).toEqual(1);

        component.goToNextPage();
        expect(component.page).toEqual(3);
        expect(spy.calls.count()).toEqual(2);
    });

    it('goToPreviousPage does not update page or call updateActiveData if page is 1', () => {
        let spy = spyOn(component, 'updateActiveData');
        component.goToPreviousPage();

        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(0);
    });

    it('goToPreviousPage does update page and call updateActiveData if page is not 1', () => {
        let spy = spyOn(component, 'updateActiveData');
        component.page = 3;

        component.goToPreviousPage();
        expect(component.page).toEqual(2);
        expect(spy.calls.count()).toEqual(1);

        component.goToPreviousPage();
        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(2);
    });

    it('handleChangeSubcomponentType does update subcomponent type and call expected functions', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'handleChangeData');
        let spy3 = spyOn(component.subcomponentObject, 'destroy');

        component.options.newType = 'line-xy';

        component.handleChangeSubcomponentType();

        expect(component.subcomponentObject).toEqual(null);
        expect(component.options.sortByAggregation).toEqual(false);
        expect(component.options.type).toEqual('line-xy');
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy3.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does not call expected functions if new type equals subcomponent type', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'handleChangeData');
        let spy3 = spyOn(component.subcomponentObject, 'destroy');

        component.options.newType = 'line';
        component.options.sortByAggregation = true;

        component.handleChangeSubcomponentType();

        expect(component.subcomponentObject).not.toEqual(null);
        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.type).toEqual('line');
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('handleChangeSubcomponentType does update sortByAggregation if new type is not sortable by aggregation', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'handleChangeData');
        let spy3 = spyOn(component.subcomponentObject, 'destroy');

        component.options.newType = 'line-xy';
        component.options.sortByAggregation = true;

        component.handleChangeSubcomponentType();

        expect(component.subcomponentObject).toEqual(null);
        expect(component.options.sortByAggregation).toEqual(false);
        expect(component.options.type).toEqual('line-xy');
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy3.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does not update sortByAggregation if new type is sortable by aggregation', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'handleChangeData');
        let spy3 = spyOn(component.subcomponentObject, 'destroy');

        component.options.newType = 'bar-h';
        component.options.sortByAggregation = true;

        component.handleChangeSubcomponentType();

        expect(component.subcomponentObject).toEqual(null);
        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.type).toEqual('bar-h');
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy3.calls.count()).toEqual(1);
    });

    it('initializeSubcomponent does update subcomponentObject', () => {
        component.subcomponentObject = null;
        component.initializeSubcomponent();
        expect(component.subcomponentObject.constructor.name).toEqual(ChartJsLineSubcomponent.name);
    });

    it('isScaled does return expected boolean', () => {
        expect(component.isScaled('bar-h')).toEqual(true);
        expect(component.isScaled('bar-v')).toEqual(true);
        expect(component.isScaled('histogram')).toEqual(true);
        expect(component.isScaled('line')).toEqual(true);
        expect(component.isScaled('line-xy')).toEqual(true);
        expect(component.isScaled('scatter')).toEqual(true);
        expect(component.isScaled('scatter-xy')).toEqual(true);

        expect(component.isScaled('doughnut')).toEqual(false);
        expect(component.isScaled('pie')).toEqual(false);
        expect(component.isScaled('table')).toEqual(false);
    });

    it('isSortableByAggregation does return expected boolean', () => {
        expect(component.isSortableByAggregation('bar-h')).toEqual(true);
        expect(component.isSortableByAggregation('bar-v')).toEqual(true);
        expect(component.isSortableByAggregation('doughnut')).toEqual(true);
        expect(component.isSortableByAggregation('histogram')).toEqual(true);
        expect(component.isSortableByAggregation('pie')).toEqual(true);
        expect(component.isSortableByAggregation('table')).toEqual(true);

        expect(component.isSortableByAggregation('line')).toEqual(false);
        expect(component.isSortableByAggregation('line-xy')).toEqual(false);
        expect(component.isSortableByAggregation('scatter')).toEqual(false);
        expect(component.isSortableByAggregation('scatter-xy')).toEqual(false);
    });

    it('isValidQuery does return expected boolean', () => {
        expect(component.isValidQuery()).toEqual(false);

        component.options.database = DatasetServiceMock.DATABASES[0];
        expect(component.isValidQuery()).toEqual(false);

        component.options.table = DatasetServiceMock.TABLES[0];
        expect(component.isValidQuery()).toEqual(false);

        component.options.xField = DatasetServiceMock.X_FIELD;
        expect(component.isValidQuery()).toEqual(true);

        component.options.aggregation = 'sum';
        expect(component.isValidQuery()).toEqual(false);

        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        expect(component.isValidQuery()).toEqual(true);
    });

    it('isValidQuery with XY subcomponent does return expected boolean', () => {
        component.options.type = 'line-xy';

        expect(component.isValidQuery()).toEqual(false);

        component.options.database = DatasetServiceMock.DATABASES[0];
        expect(component.isValidQuery()).toEqual(false);

        component.options.table = DatasetServiceMock.TABLES[0];
        expect(component.isValidQuery()).toEqual(false);

        component.options.xField = DatasetServiceMock.X_FIELD;
        expect(component.isValidQuery()).toEqual(false);

        component.options.yField = DatasetServiceMock.Y_FIELD;
        expect(component.isValidQuery()).toEqual(true);
    });

    it('isVisualizationFilterUnique does return expected boolean', () => {
        expect(component.isVisualizationFilterUnique('field1', 'value1')).toEqual(true);

        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.isVisualizationFilterUnique('field1', 'value1')).toEqual(false);
        expect(component.isVisualizationFilterUnique('field2', 'value1')).toEqual(true);
        expect(component.isVisualizationFilterUnique('field1', 'value2')).toEqual(true);

        component.filters = [{
            id: 'idA',
            field: {
                x: 'xField1',
                y: 'yField1'
            },
            prettyField: {
                x: 'xPrettyField1',
                y: 'yPrettyField1'
            },
            value: {
                beginX: 1,
                beginY: 2,
                endX: 3,
                endY: 4
            }
        }];

        expect(component.isVisualizationFilterUnique({
            x: 'xField1',
            y: 'yField1'
        }, {
            beginX: 1,
            beginY: 2,
            endX: 3,
            endY: 4
        })).toEqual(false);

        expect(component.isVisualizationFilterUnique({
            x: 'xField2',
            y: 'yField2'
        }, {
            beginX: 1,
            beginY: 2,
            endX: 3,
            endY: 4
        })).toEqual(true);

        expect(component.isVisualizationFilterUnique({
            x: 'xField1',
            y: 'yField1'
        }, {
            beginX: 1,
            beginY: 2,
            endX: 3,
            endY: 5
        })).toEqual(true);

        expect(component.isVisualizationFilterUnique('xField1', 1)).toEqual(true);
    });

    it('isXYSubcomponent does return expected boolean', () => {
        expect(component.isXYSubcomponent('bar-h')).toEqual(false);
        expect(component.isXYSubcomponent('bar-v')).toEqual(false);
        expect(component.isXYSubcomponent('doughnut')).toEqual(false);
        expect(component.isXYSubcomponent('histogram')).toEqual(false);
        expect(component.isXYSubcomponent('pie')).toEqual(false);
        expect(component.isXYSubcomponent('line')).toEqual(false);
        expect(component.isXYSubcomponent('scatter')).toEqual(false);
        expect(component.isXYSubcomponent('table')).toEqual(false);

        expect(component.isXYSubcomponent('line-xy')).toEqual(true);
        expect(component.isXYSubcomponent('scatter-xy')).toEqual(true);
    });

    it('onQuerySuccess with XY data does update expected properties and call expected functions', () => {
        component.options.type = 'line-xy';
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                testXField: 1,
                testYField: 2
            }, {
                testXField: 3,
                testYField: 4
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: new Color(255, 255, 255),
            group: 'All',
            x: 1,
            y: 2
        }, {
            color: new Color(255, 255, 255),
            group: 'All',
            x: 3,
            y: 4
        }]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with aggregated data does update expected properties and call expected functions', () => {
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _aggregation: 2,
                testXField: 1
            }, {
                _aggregation: 4,
                testXField: 3
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: new Color(255, 255, 255),
            group: 'All',
            x: 1,
            y: 2
        }, {
            color: new Color(255, 255, 255),
            group: 'All',
            x: 3,
            y: 4
        }]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with XY data and groups does create groups', () => {
        component.options.type = 'line-xy';
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                testCategoryField: 'a',
                testXField: 1,
                testYField: 2
            }, {
                testCategoryField: 'a',
                testXField: 3,
                testYField: 4
            }, {
                testCategoryField: 'b',
                testXField: 5,
                testYField: 6
            }, {
                testCategoryField: 'b',
                testXField: 7,
                testYField: 8
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: new Color(31, 120, 180),
            group: 'a',
            x: 1,
            y: 2
        }, {
            color: new Color(31, 120, 180),
            group: 'a',
            x: 3,
            y: 4
        }, {
            color: new Color(51, 160, 44),
            group: 'b',
            x: 5,
            y: 6
        }, {
            color: new Color(51, 160, 44),
            group: 'b',
            x: 7,
            y: 8
        }]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with aggregated data and groups does create groups', () => {
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _aggregation: 2,
                testCategoryField: 'a',
                testXField: 1
            }, {
                _aggregation: 4,
                testCategoryField: 'a',
                testXField: 3
            }, {
                _aggregation: 6,
                testCategoryField: 'b',
                testXField: 5
            }, {
                _aggregation: 8,
                testCategoryField: 'b',
                testXField: 7
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: new Color(31, 120, 180),
            group: 'a',
            x: 1,
            y: 2
        }, {
            color: new Color(31, 120, 180),
            group: 'a',
            x: 3,
            y: 4
        }, {
            color: new Color(51, 160, 44),
            group: 'b',
            x: 5,
            y: 6
        }, {
            color: new Color(51, 160, 44),
            group: 'b',
            x: 7,
            y: 8
        }]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with XY date data does work as expected', () => {
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _date: '2018-01-01T00:00:00.000Z',
                testYField: 2
            }, {
                _date: '2018-01-03T00:00:00.000Z',
                testYField: 4
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with aggregated date data does work as expected', () => {
        component.options.granularity = 'day';
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _aggregation: 2,
                _date: '2018-01-01T00:00:00.000Z'
            }, {
                _aggregation: 4,
                _date: '2018-01-03T00:00:00.000Z'
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with timeFill=true does add empty dates if needed', () => {
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.timeFill = true;
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _date: '2018-01-01T00:00:00.000Z',
                testYField: 2
            }, {
                _date: '2018-01-03T00:00:00.000Z',
                testYField: 4
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 0
        }, {
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with timeFill=true does not add empty dates if not needed', () => {
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.timeFill = true;
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _date: '2018-01-01T00:00:00.000Z',
                testYField: 2
            }, {
                _date: '2018-01-02T00:00:00.000Z',
                testYField: 3
            }, {
                _date: '2018-01-03T00:00:00.000Z',
                testYField: 4
            }, {
                _date: '2018-01-04T00:00:00.000Z',
                testYField: 5
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 3
        }, {
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }, {
            color: new Color(255, 255, 255),
            group: 'All',
            x: '2018-01-04T00:00:00.000Z',
            y: 5
        }]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with timeFill=true and groups does add empty dates to separate groups if needed', () => {
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.timeFill = true;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _date: '2018-01-01T00:00:00.000Z',
                testCategoryField: 'a',
                testYField: 2
            }, {
                _date: '2018-01-02T00:00:00.000Z',
                testCategoryField: 'b',
                testYField: 3
            }, {
                _date: '2018-01-03T00:00:00.000Z',
                testCategoryField: 'a',
                testYField: 4
            }, {
                _date: '2018-01-04T00:00:00.000Z',
                testCategoryField: 'b',
                testYField: 5
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: new Color(31, 120, 180),
            group: 'a',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: new Color(31, 120, 180),
            group: 'a',
            x: '2018-01-02T00:00:00.000Z',
            y: 0
        }, {
            color: new Color(31, 120, 180),
            group: 'a',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }, {
            color: new Color(31, 120, 180),
            group: 'a',
            x: '2018-01-04T00:00:00.000Z',
            y: 0
        }, {
            color: new Color(51, 160, 44),
            group: 'b',
            x: '2018-01-01T00:00:00.000Z',
            y: 0
        }, {
            color: new Color(51, 160, 44),
            group: 'b',
            x: '2018-01-02T00:00:00.000Z',
            y: 3
        }, {
            color: new Color(51, 160, 44),
            group: 'b',
            x: '2018-01-03T00:00:00.000Z',
            y: 0
        }, {
            color: new Color(51, 160, 44),
            group: 'b',
            x: '2018-01-04T00:00:00.000Z',
            y: 5
        }]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with no data does update expected properties and call expected functions', () => {
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: []
        });
        expect(component.errorMessage).toEqual('No Data');
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('postInit does work as expected', () => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(component.defaultGroupColor).toBeDefined();
        expect(component.defaultHoverColor).toBeDefined();
        expect(component.selectedAreaOffset.x).toBeDefined();
        expect(component.selectedAreaOffset.y).toBeDefined();
        expect(spy.calls.count()).toEqual(1);
    });

    it('refreshVisualization does call subcomponentObject.draw', () => {
        let spy = spyOn(component.subcomponentObject, 'draw');
        component.options.aggregation = 'sum';
        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 0,
            xAxis: 'number',
            xList: [],
            yAxis: 'number',
            yList: []
        }]);

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
    });

    it('refreshVisualization with XY subcomponent does call subcomponentObject.draw', () => {
        let spy = spyOn(component.subcomponentObject, 'draw');
        component.options.type = 'line-xy';
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 0,
            xAxis: 'number',
            xList: [],
            yAxis: 'number',
            yList: []
        }]);

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 2,
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
    });

    it('refreshVisualization does work as expected with date fields', () => {
        let spy = spyOn(component.subcomponentObject, 'draw');
        component.options.type = 'line-xy';
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.options.yField = DatasetServiceMock.DATE_FIELD;

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 0,
            xAxis: 'date',
            xList: [],
            yAxis: 'date',
            yList: []
        }]);

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 2,
            xAxis: 'date',
            xList: [1, 3],
            yAxis: 'date',
            yList: [2, 4]
        }]);
    });

    it('refreshVisualization does work as expected with string fields', () => {
        let spy = spyOn(component.subcomponentObject, 'draw');
        component.options.type = 'line-xy';
        component.options.xField = DatasetServiceMock.NAME_FIELD;
        component.options.yField = DatasetServiceMock.NAME_FIELD;

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 0,
            xAxis: 'string',
            xList: [],
            yAxis: 'string',
            yList: []
        }]);

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 2,
            xAxis: 'string',
            xList: [1, 3],
            yAxis: 'string',
            yList: [2, 4]
        }]);
    });

    it('removeFilter does remove objects from filters and call subcomponentObject.deselect', () => {
        let spy = spyOn(component.subcomponentObject, 'deselect');

        let filter1 = {
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let filter2 = {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        };
        component.filters = [filter1, filter2];

        component.removeFilter(filter1);
        expect(component.filters).toEqual([filter2]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['value1']);

        component.removeFilter(filter2);
        expect(component.filters).toEqual([]);
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual(['value2']);
    });

    it('removeFilter does not remove objects from filters with non-matching IDs and call subcomponentObject.deselect', () => {
        let spy = spyOn(component.subcomponentObject, 'deselect');

        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.removeFilter({
            id: 'idC',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['value1']);
        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
    });

    it('showFilterContainer does return expected boolean', () => {
        expect(component.showFilterContainer()).toEqual(false);

        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.showFilterContainer()).toEqual(true);
    });

    it('showFooterContainer does return expected boolean', () => {
        expect(component.showFooterContainer()).toEqual(false);

        component.activeData = [{}];
        component.responseData = [{}, {}];

        expect(component.showFooterContainer()).toEqual(true);
    });

    it('subcomponentDeselect does update selectedArea', () => {
        component.selectedArea = {
            height: 20,
            width: 10,
            x: 1,
            y: 2
        };

        component.subcomponentDeselect();

        expect(component.selectedArea).toEqual(null);
    });

    it('subcomponentFilterBounds does call addOrReplaceFilter', () => {
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        let spy = spyOn(component, 'addOrReplaceFilter');

        component.subcomponentFilterBounds(1, 2, 3, 4);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([{
            id: undefined,
            field: {
                x: 'testXField',
                y: 'testYField'
            },
            prettyField: {
                x: 'Test X Field',
                y: 'Test Y Field'
            },
            value: {
                beginX: 1,
                beginY: 2,
                endX: 3,
                endY: 4
            }
        }, neon.query.and.apply(neon.query, [
            neon.query.where('testXField', '>=', 1), neon.query.where('testYField', '>=', 2),
            neon.query.where('testXField', '<=', 3), neon.query.where('testYField', '<=', 4)
        ]), false]);

        component.subcomponentFilterBounds('testText1', 'testText2', 'testText3', 'testText4');
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([{
            id: undefined,
            field: {
                x: 'testXField',
                y: 'testYField'
            },
            prettyField: {
                x: 'Test X Field',
                y: 'Test Y Field'
            },
            value: {
                beginX: 'testText1',
                beginY: 'testText2',
                endX: 'testText3',
                endY: 'testText4'
            }
        }, neon.query.and.apply(neon.query, [
            neon.query.where('testXField', '>=', 'testText1'), neon.query.where('testYField', '>=', 'testText2'),
            neon.query.where('testXField', '<=', 'testText3'), neon.query.where('testYField', '<=', 'testText4')
        ]), false]);
    });

    it('subcomponentFilterDomain does call addOrReplaceFilter', () => {
        component.options.xField = DatasetServiceMock.X_FIELD;
        let spy = spyOn(component, 'addOrReplaceFilter');

        component.subcomponentFilterDomain(1, 2);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([{
            id: undefined,
            field: 'testXField',
            prettyField: 'Test X Field',
            value: {
                beginX: 1,
                endX: 2
            }
        }, neon.query.and.apply(neon.query, [
            neon.query.where('testXField', '>=', 1), neon.query.where('testXField', '<=', 2)
        ]), false]);

        component.subcomponentFilterDomain('testText1', 'testText2');
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([{
            id: undefined,
            field: 'testXField',
            prettyField: 'Test X Field',
            value: {
                beginX: 'testText1',
                endX: 'testText2'
            }
        }, neon.query.and.apply(neon.query, [
            neon.query.where('testXField', '>=', 'testText1'), neon.query.where('testXField', '<=', 'testText2')
        ]), false]);
    });

    it('subcomponentFilter does call addOrReplaceFilter', () => {
        component.options.xField = DatasetServiceMock.X_FIELD;
        let spy = spyOn(component, 'addOrReplaceFilter');

        component.subcomponentFilter(1);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([{
            id: undefined,
            field: 'testXField',
            prettyField: 'Test X Field',
            value: 1
        }, neon.query.where('testXField', '=', 1), false]);

        component.subcomponentFilter('testText');
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([{
            id: undefined,
            field: 'testXField',
            prettyField: 'Test X Field',
            value: 'testText'
        }, neon.query.where('testXField', '=', 'testText'), false]);
    });

    it('subcomponentRedraw does call stopEventPropagation and changeDetection.detectChanges', () => {
        let spy1 = spyOn(component, 'stopEventPropagation');
        let spy2 = spyOn(component.changeDetection, 'detectChanges');

        component.subcomponentRedraw({});

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('subcomponentSelect does update selectedArea', () => {
        component.subcomponentSelect(1, 2, 10, 20);

        expect(component.selectedArea).toEqual({
            height: 20,
            width: 10,
            x: 1,
            y: 2
        });
    });

    it('subGetBindings does set expected properties in bindings', () => {
        let bindings1 = {};
        component.subGetBindings(bindings1);
        expect(bindings1).toEqual({
            aggregationField: '',
            groupField: '',
            xField: '',
            yField: '',
            aggregation: 'count',
            granularity: 'year',
            hideGridLines: false,
            hideGridTicks: false,
            ignoreSelf: false,
            lineCurveTension: 0.3,
            lineFillArea: false,
            logScaleX: false,
            logScaleY: false,
            scaleMaxX: '',
            scaleMaxY: '',
            scaleMinX: '',
            scaleMinY: '',
            sortByAggregation: false,
            timeFill: false,
            type: 'line',
            yPercentage: 0.3
        });

        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;

        component.options.aggregation = 'sum';
        component.options.granularity = 'day';
        component.options.hideGridLines = true;
        component.options.hideGridTicks = true;
        component.options.ignoreSelf = true;
        component.options.lineCurveTension = 0;
        component.options.lineFillArea = true;
        component.options.logScaleX = true;
        component.options.logScaleY = true;
        component.options.scaleMaxX = '44';
        component.options.scaleMaxY = '33';
        component.options.scaleMinX = '22';
        component.options.scaleMinY = '11';
        component.options.sortByAggregation = true;
        component.options.timeFill = true;
        component.options.type = 'line-xy';
        component.options.yPercentage = 0.5;

        let bindings2 = {};
        component.subGetBindings(bindings2);
        expect(bindings2).toEqual({
            aggregationField: 'testSizeField',
            groupField: 'testCategoryField',
            xField: 'testXField',
            yField: 'testYField',
            aggregation: 'sum',
            granularity: 'day',
            hideGridLines: true,
            hideGridTicks: true,
            ignoreSelf: true,
            lineCurveTension: 0,
            lineFillArea: true,
            logScaleX: true,
            logScaleY: true,
            scaleMaxX: '44',
            scaleMaxY: '33',
            scaleMinX: '22',
            scaleMinY: '11',
            sortByAggregation: true,
            timeFill: true,
            type: 'line-xy',
            yPercentage: 0.5
        });
    });

    it('subNgOnDestroy does work as expected', () => {
        let spy = spyOn(component.subcomponentObject, 'destroy');

        component.subNgOnDestroy();
        expect(spy.calls.count()).toEqual(1);
    });

    it('subNgOnInit does work as expected', () => {
        let spy = spyOn(component, 'initializeSubcomponent');

        component.subNgOnInit();
        expect(spy.calls.count()).toEqual(1);
    });

    it('subOnResizeStop does work as expected', () => {
        let spy = spyOn(component.subcomponentObject, 'redraw');
        component.minimumDimensions = null;

        component.subOnResizeStop();
        expect(spy.calls.count()).toEqual(1);
        expect(component.minimumDimensions.height).toBeDefined();
        expect(component.minimumDimensions.width).toBeDefined();
    });

    it('updateActiveData does update activeData and lastPage from responseData, page, and limit and call refreshVisualization', () => {
        component.options.limit = 2;
        component.page = 1;
        component.responseData = [{}, {}, {}];
        let spy = spyOn(component, 'refreshVisualization');

        component.updateActiveData();
        expect(component.activeData).toEqual([{}, {}]);
        expect(component.lastPage).toEqual(false);
        expect(spy.calls.count()).toEqual(1);
    });

    it('updateActiveData does set lastPage to true if on last page', () => {
        component.options.limit = 2;
        component.page = 2;
        component.responseData = [{}, {}, {}];
        let spy = spyOn(component, 'refreshVisualization');

        component.updateActiveData();
        expect(component.activeData).toEqual([{}]);
        expect(component.lastPage).toEqual(true);
        expect(spy.calls.count()).toEqual(1);
    });

    it('does show toolbar and sidenav and body-container', () => {
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let sidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav'));
        expect(sidenav).not.toBeNull();
        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container'));
        expect(bodyContainer).not.toBeNull();
    });

    it('does show header in toolbar with visualization title', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Aggregation');
    });

    it('does show data-info and hide error-message in toolbar and sidenav if errorMessage is undefined', () => {
        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).not.toBeNull();
        expect(dataInfoTextInToolbar.nativeElement.textContent).toContain('No Data');

        let dataInfoIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info mat-icon'));
        expect(dataInfoIconInSidenav).not.toBeNull();
        expect(dataInfoIconInSidenav.nativeElement.textContent).toEqual('info');

        let dataInfoTextInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info span'));
        expect(dataInfoTextInSidenav).not.toBeNull();
        expect(dataInfoTextInSidenav.nativeElement.textContent).toContain('No Data');

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();

        let errorIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
        expect(errorIconInSidenav).toBeNull();

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
        expect(errorMessageInSidenav).toBeNull();
    });

    it('does show error-message in toolbar and sidenav if errorMessage is defined', async(() => {
        component.errorMessage = 'Test Error Message';

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .data-info'));
            expect(dataInfoTextInToolbar).toBeNull();

            let dataInfoIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info mat-icon'));
            expect(dataInfoIconInSidenav).not.toBeNull();
            expect(dataInfoIconInSidenav.nativeElement.textContent).toEqual('info');

            let dataInfoTextInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info span'));
            expect(dataInfoTextInSidenav).not.toBeNull();
            expect(dataInfoTextInSidenav.nativeElement.textContent).toContain('No Data');

            let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
            expect(errorMessageInToolbar).not.toBeNull();
            expect(errorMessageInToolbar.nativeElement.textContent).toContain('Test Error Message');

            let errorIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
            expect(errorIconInSidenav).not.toBeNull();
            expect(errorIconInSidenav.nativeElement.textContent).toEqual('error');

            let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
            expect(errorMessageInSidenav).not.toBeNull();
            expect(errorMessageInSidenav.nativeElement.textContent).toContain('Test Error Message');
        });
    }));

    it('does show settings icon button in toolbar', () => {
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toEqual('settings');
    });

    it('does show sidenav options menu', () => {
        let menu = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card'));
        expect(menu).not.toBeNull();

        let content = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content'));
        expect(content).not.toBeNull();
    });

    it('does show unshared filter in sidenav options menu', () => {
        let unsharedFilter = fixture.debugElement.query(By.css(
            'mat-sidenav-container mat-sidenav mat-card mat-card-content app-unshared-filter'));
        expect(unsharedFilter).not.toBeNull();
        expect(unsharedFilter.componentInstance.meta).toEqual(component.options);
        expect(unsharedFilter.componentInstance.unsharedFilterChanged).toBeDefined();
        expect(unsharedFilter.componentInstance.unsharedFilterRemoved).toBeDefined();
    });

    it('does show export control in sidenav options menu', () => {
        let exportControl = fixture.debugElement.query(By.css(
            'mat-sidenav-container mat-sidenav mat-card mat-card-content app-export-control'));
        expect(exportControl).not.toBeNull();
        expect(exportControl.componentInstance.exportId).toEqual(component.exportId);
    });

    it('does hide loading overlay by default', () => {
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    });

    it('does show loading overlay if isLoading is true', async(() => {
        component.isLoading = true;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
            expect(loadingOverlay).not.toBeNull();

            let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
            expect(spinner).not.toBeNull();
        });
    }));

    it('does not show filter-container if filters is empty array', () => {
        let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
        expect(filterContainer).toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
        expect(bodyContainer).toBeNull();
    });

    it('does show filter-container and filter-reset elements if filters is non-empty array', async(() => {
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
            expect(filterContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
            expect(bodyContainer).not.toBeNull();

            let filterResets = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container .filter-reset'));
            expect(filterResets.length).toEqual(2);

            let filterLabels = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container .filter-label'));
            expect(filterLabels.length).toEqual(2);

            expect(filterLabels[0].nativeElement.textContent).toContain('value1');
            expect(filterLabels[1].nativeElement.textContent).toContain('value2');

            let filterButtons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container button'));
            expect(filterButtons.length).toEqual(2);

            let filterIcons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container button mat-icon'));
            expect(filterIcons.length).toEqual(2);

            expect(filterIcons[0].nativeElement.textContent).toEqual('close');
            expect(filterIcons[1].nativeElement.textContent).toEqual('close');
        });
    }));

    it('does not show footer-container or pagination-button elements if activeData.length === responseData.length', () => {
        let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
        expect(footerContainer).toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
        expect(bodyContainer).toBeNull();
    });

    it('does show footer-container and pagination-button elements if activeData.length < responseData.length (first page)', async(() => {
        component.activeData = [{}];
        component.responseData = [{}, {}, {}];
        component.lastPage = false;
        component.page = 1;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
            expect(footerContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
            expect(bodyContainer).not.toBeNull();

            let footerButtons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .footer .footer-button-container .pagination-button'));
            expect(footerButtons.length).toEqual(2);

            expect(footerButtons[0].componentInstance.disabled).toEqual(true);
            expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

            expect(footerButtons[1].componentInstance.disabled).toEqual(false);
            expect(footerButtons[1].nativeElement.textContent).toContain('Next');
        });
    }));

    it('does show footer-container and pagination-button elements if activeData.length < responseData.length (middle page)', async(() => {
        component.activeData = [{}];
        component.responseData = [{}, {}, {}];
        component.lastPage = false;
        component.page = 2;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
            expect(footerContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
            expect(bodyContainer).not.toBeNull();

            let footerButtons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .footer .footer-button-container .pagination-button'));
            expect(footerButtons.length).toEqual(2);

            expect(footerButtons[0].componentInstance.disabled).toEqual(false);
            expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

            expect(footerButtons[1].componentInstance.disabled).toEqual(false);
            expect(footerButtons[1].nativeElement.textContent).toContain('Next');
        });
    }));

    it('does show footer-container and pagination-button elements if activeData.length < responseData.length (last page)', async(() => {
        component.activeData = [{}];
        component.responseData = [{}, {}, {}];
        component.lastPage = true;
        component.page = 3;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
            expect(footerContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
            expect(bodyContainer).not.toBeNull();

            let footerButtons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .footer .footer-button-container .pagination-button'));
            expect(footerButtons.length).toEqual(2);

            expect(footerButtons[0].componentInstance.disabled).toEqual(false);
            expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

            expect(footerButtons[1].componentInstance.disabled).toEqual(true);
            expect(footerButtons[1].nativeElement.textContent).toContain('Next');
        });
    }));

    it('does show chart-container and chart', () => {
        let chartContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container .chart-container'));
        expect(chartContainer).not.toBeNull();
        let chart = fixture.debugElement.query(By.css('mat-sidenav-container .body-container .chart-container .chart'));
        expect(chart).not.toBeNull();
    });

    it('does not show chart-selection if selectedArea is null', () => {
        let chartSelection = fixture.debugElement.query(By.css('mat-sidenav-container .body-container .chart-container .chart-selection'));
        expect(chartSelection).toBeNull();
    });

    it('does show chart-selection if selectedArea is not null', async(() => {
        component.selectedArea = {
            height: 20,
            width: 10,
            x: 1,
            y: 2
        };

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let chartSelection = fixture.debugElement.query(By.css(
                'mat-sidenav-container .body-container .chart-container .chart-selection'));
            expect(chartSelection).not.toBeNull();
        });
    }));

    it('does show elements in sidenav options menu that have expected options', async(() => {
        // Force the component to update all its selected elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toEqual(7);

            expect(inputs[0].attributes.placeholder).toBe('Title');
            expect(inputs[0].nativeElement.value).toContain('Aggregation');

            expect(inputs[1].attributes.placeholder).toBe('Limit');
            expect(inputs[1].nativeElement.value).toContain('10');

            expect(inputs[2].attributes.placeholder).toBe('X Scale Min');
            expect(inputs[2].nativeElement.value).toEqual('');

            expect(inputs[3].attributes.placeholder).toBe('X Scale Max');
            expect(inputs[3].nativeElement.value).toEqual('');

            expect(inputs[4].attributes.placeholder).toBe('Y Scale Min');
            expect(inputs[4].nativeElement.value).toEqual('');

            expect(inputs[5].attributes.placeholder).toBe('Y Scale Max');
            expect(inputs[5].nativeElement.value).toEqual('');

            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toEqual(10);
            let options;

            expect(selects[0].componentInstance.disabled).toEqual(false);
            expect(selects[0].componentInstance.placeholder).toEqual('Subcomponent Type');
            expect(selects[0].componentInstance.required).toEqual(true);
            options = selects[0].componentInstance.options.toArray();
            expect(options.length).toEqual(10);
            expect(options[0].getLabel()).toEqual('Bar, Horizontal (Aggregations)');
            expect(options[1].getLabel()).toEqual('Bar, Vertical (Aggregations)');
            expect(options[2].getLabel()).toEqual('Doughnut (Aggregations)');
            expect(options[3].getLabel()).toEqual('Histogram (Aggregations)');
            expect(options[4].getLabel()).toEqual('Line (Aggregations)');
            expect(options[5].getLabel()).toEqual('Line (Points)');
            expect(options[6].getLabel()).toEqual('Pie (Aggregations)');
            expect(options[7].getLabel()).toEqual('Scatter (Aggregations)');
            expect(options[8].getLabel()).toEqual('Scatter (Points)');
            expect(options[9].getLabel()).toEqual('Table (Aggregations)');

            expect(selects[1].componentInstance.disabled).toEqual(false);
            expect(selects[1].componentInstance.placeholder).toEqual('Database');
            expect(selects[1].componentInstance.required).toEqual(true);
            options = selects[1].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Database 1');
            expect(options[0].selected).toEqual(true);
            expect(options[1].getLabel()).toEqual('Test Database 2');
            expect(options[1].selected).toEqual(false);

            expect(selects[2].componentInstance.disabled).toEqual(false);
            expect(selects[2].componentInstance.placeholder).toEqual('Table');
            expect(selects[2].componentInstance.required).toEqual(true);
            options = selects[2].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Table 1');
            expect(options[0].selected).toEqual(true);
            expect(options[1].getLabel()).toEqual('Test Table 2');
            expect(options[1].selected).toEqual(false);

            expect(selects[3].componentInstance.disabled).toEqual(false);
            expect(selects[3].componentInstance.placeholder).toEqual('X Field');
            expect(selects[3].componentInstance.required).toEqual(true);
            options = selects[3].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length);
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i].selected).toEqual(false);
            }

            expect(selects[4].componentInstance.disabled).toEqual(false);
            expect(selects[4].componentInstance.placeholder).toEqual('Aggregation');
            expect(selects[4].componentInstance.required).toEqual(true);
            options = selects[4].componentInstance.options.toArray();
            expect(options.length).toEqual(5);
            expect(options[0].getLabel()).toEqual('Count');
            expect(options[1].getLabel()).toEqual('Average');
            expect(options[2].getLabel()).toEqual('Max');
            expect(options[3].getLabel()).toEqual('Min');
            expect(options[4].getLabel()).toEqual('Sum');

            expect(selects[5].componentInstance.disabled).toEqual(false);
            expect(selects[5].componentInstance.placeholder).toEqual('Aggregation Field');
            expect(selects[5].componentInstance.required).toEqual(true);
            options = selects[5].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(false);
            }

            expect(selects[6].componentInstance.disabled).toEqual(false);
            expect(selects[6].componentInstance.placeholder).toEqual('Group Field');
            expect(selects[6].componentInstance.required).toEqual(false);
            options = selects[6].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(false);
            }

            expect(selects[7].componentInstance.disabled).toEqual(false);
            expect(selects[7].componentInstance.placeholder).toEqual('Line Curve Tension');
            expect(selects[7].componentInstance.required).toEqual(true);
            options = selects[7].componentInstance.options.toArray();
            expect(options.length).toEqual(10);
            expect(options[0].getLabel()).toEqual('0%');
            expect(options[1].getLabel()).toEqual('10%');
            expect(options[2].getLabel()).toEqual('20%');
            expect(options[3].getLabel()).toEqual('30%');
            expect(options[4].getLabel()).toEqual('40%');
            expect(options[5].getLabel()).toEqual('50%');
            expect(options[6].getLabel()).toEqual('60%');
            expect(options[7].getLabel()).toEqual('70%');
            expect(options[8].getLabel()).toEqual('80%');
            expect(options[9].getLabel()).toEqual('90%');

            expect(selects[8].componentInstance.disabled).toEqual(false);
            expect(selects[8].componentInstance.placeholder).toEqual('Y-Axis Labels Percentage');
            expect(selects[8].componentInstance.required).toEqual(true);
            options = selects[8].componentInstance.options.toArray();
            expect(options.length).toEqual(5);
            expect(options[0].getLabel()).toEqual('10%');
            expect(options[1].getLabel()).toEqual('20%');
            expect(options[2].getLabel()).toEqual('30%');
            expect(options[3].getLabel()).toEqual('40%');
            expect(options[4].getLabel()).toEqual('50%');

            let toggles = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-button-toggle'));
            expect(toggles.length).toEqual(12);

            expect(toggles[0].componentInstance.value).toEqual(false);
            expect(toggles[0].nativeElement.textContent).toContain('Yes');
            expect(toggles[0].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[1].componentInstance.value).toEqual(true);
            expect(toggles[1].nativeElement.textContent).toContain('No');
            expect(toggles[1].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[2].componentInstance.value).toEqual(false);
            expect(toggles[2].nativeElement.textContent).toContain('Show');
            expect(toggles[2].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[3].componentInstance.value).toEqual(true);
            expect(toggles[3].nativeElement.textContent).toContain('Hide');
            expect(toggles[3].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[4].componentInstance.value).toEqual(false);
            expect(toggles[4].nativeElement.textContent).toContain('Show');
            expect(toggles[4].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[5].componentInstance.value).toEqual(true);
            expect(toggles[5].nativeElement.textContent).toContain('Hide');
            expect(toggles[5].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[6].componentInstance.value).toEqual(false);
            expect(toggles[6].nativeElement.textContent).toContain('No');
            expect(toggles[6].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[7].componentInstance.value).toEqual(true);
            expect(toggles[7].nativeElement.textContent).toContain('Yes');
            expect(toggles[7].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[8].componentInstance.value).toEqual(false);
            expect(toggles[8].nativeElement.textContent).toContain('No');
            expect(toggles[8].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[9].componentInstance.value).toEqual(true);
            expect(toggles[9].nativeElement.textContent).toContain('Yes');
            expect(toggles[9].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[10].componentInstance.value).toEqual(false);
            expect(toggles[10].nativeElement.textContent).toContain('No');
            expect(toggles[10].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[11].componentInstance.value).toEqual(true);
            expect(toggles[11].nativeElement.textContent).toContain('Yes');
            expect(toggles[11].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);
        });
    }));
});

describe('Component: Aggregation with config', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            AggregationComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ActiveGridService,
            ColorSchemeService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            ErrorNotificationService,
            ExportService,
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService,
            VisualizationService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'configFilter', useValue: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'database', useValue: 'testDatabase2' },
            { provide: 'limit', useValue: 1234 },
            { provide: 'table', useValue: 'testTable2' },
            { provide: 'title', useValue: 'Test Title' },
            { provide: 'aggregationField', useValue: 'testSizeField' },
            { provide: 'groupField', useValue: 'testCategoryField' },
            { provide: 'xField', useValue: 'testXField' },
            { provide: 'yField', useValue: 'testYField' },
            { provide: 'aggregation', useValue: 'sum' },
            { provide: 'granularity', useValue: 'day' },
            { provide: 'hideGridLines', useValue: true },
            { provide: 'hideGridTicks', useValue: true },
            { provide: 'ignoreSelf', useValue: true },
            { provide: 'lineCurveTension', useValue: 0 },
            { provide: 'lineFillArea', useValue: true },
            { provide: 'logScaleX', useValue: true },
            { provide: 'logScaleY', useValue: true },
            { provide: 'scaleMaxX', useValue: '44' },
            { provide: 'scaleMaxY', useValue: '33' },
            { provide: 'scaleMinX', useValue: '22' },
            { provide: 'scaleMinY', useValue: '11' },
            { provide: 'sortByAggregation', useValue: true },
            { provide: 'timeFill', useValue: true },
            { provide: 'type', useValue: 'scatter' },
            { provide: 'yPercentage', useValue: 0.5 }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('superclass properties are set to expected values from config', () => {
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.limit).toEqual(1234);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.filter).toEqual({
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        });
    });

    it('class options properties are set to expected values from config', () => {
        expect(component.options.aggregationField).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(component.options.groupField).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(component.options.xField).toEqual(DatasetServiceMock.X_FIELD);
        expect(component.options.yField).toEqual(DatasetServiceMock.Y_FIELD);

        expect(component.options.aggregation).toEqual('sum');
        expect(component.options.granularity).toEqual('day');
        expect(component.options.hideGridLines).toEqual(true);
        expect(component.options.hideGridTicks).toEqual(true);
        expect(component.options.ignoreSelf).toEqual(true);
        expect(component.options.lineCurveTension).toEqual(0);
        expect(component.options.lineFillArea).toEqual(true);
        expect(component.options.logScaleX).toEqual(true);
        expect(component.options.logScaleY).toEqual(true);
        expect(component.options.scaleMaxX).toEqual('44');
        expect(component.options.scaleMaxY).toEqual('33');
        expect(component.options.scaleMinX).toEqual('22');
        expect(component.options.scaleMinY).toEqual('11');
        expect(component.options.newType).toEqual('scatter');
        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.timeFill).toEqual(true);
        expect(component.options.type).toEqual('scatter');
        expect(component.options.yPercentage).toEqual(0.5);
        expect(component.subcomponentObject.constructor.name).toEqual(ChartJsScatterSubcomponent.name);
    });

    it('does show header in toolbar with visualization title from config', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });

    it('does show elements in sidenav options menu that have expected options from config', async(() => {
        // Force the component to update all its selected elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toEqual(7);

            expect(inputs[0].attributes.placeholder).toBe('Title');
            expect(inputs[0].nativeElement.value).toContain('Test Title');

            expect(inputs[1].attributes.placeholder).toBe('Limit');
            expect(inputs[1].nativeElement.value).toContain('1234');

            expect(inputs[2].attributes.placeholder).toBe('X Scale Min');
            expect(inputs[2].nativeElement.value).toContain('');

            expect(inputs[3].attributes.placeholder).toBe('X Scale Max');
            expect(inputs[3].nativeElement.value).toContain('');

            expect(inputs[4].attributes.placeholder).toBe('Y Scale Min');
            expect(inputs[4].nativeElement.value).toContain('');

            expect(inputs[5].attributes.placeholder).toBe('Y Scale Max');
            expect(inputs[5].nativeElement.value).toContain('');

            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toEqual(9);
            let options;

            expect(selects[0].componentInstance.disabled).toEqual(false);
            expect(selects[0].componentInstance.placeholder).toEqual('Subcomponent Type');
            expect(selects[0].componentInstance.required).toEqual(true);
            options = selects[0].componentInstance.options.toArray();
            expect(options.length).toEqual(10);
            expect(options[0].getLabel()).toEqual('Bar, Horizontal (Aggregations)');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Bar, Vertical (Aggregations)');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('Doughnut (Aggregations)');
            expect(options[2].selected).toEqual(false);
            expect(options[3].getLabel()).toEqual('Histogram (Aggregations)');
            expect(options[3].selected).toEqual(false);
            expect(options[4].getLabel()).toEqual('Line (Aggregations)');
            expect(options[4].selected).toEqual(false);
            expect(options[5].getLabel()).toEqual('Line (Points)');
            expect(options[5].selected).toEqual(false);
            expect(options[6].getLabel()).toEqual('Pie (Aggregations)');
            expect(options[6].selected).toEqual(false);
            expect(options[7].getLabel()).toEqual('Scatter (Aggregations)');
            expect(options[7].selected).toEqual(true);
            expect(options[8].getLabel()).toEqual('Scatter (Points)');
            expect(options[8].selected).toEqual(false);
            expect(options[9].getLabel()).toEqual('Table (Aggregations)');
            expect(options[9].selected).toEqual(false);

            expect(selects[1].componentInstance.disabled).toEqual(false);
            expect(selects[1].componentInstance.placeholder).toEqual('Database');
            expect(selects[1].componentInstance.required).toEqual(true);
            options = selects[1].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Database 1');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Test Database 2');
            expect(options[1].selected).toEqual(true);

            expect(selects[2].componentInstance.disabled).toEqual(false);
            expect(selects[2].componentInstance.placeholder).toEqual('Table');
            expect(selects[2].componentInstance.required).toEqual(true);
            options = selects[2].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Table 1');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Test Table 2');
            expect(options[1].selected).toEqual(true);

            expect(selects[3].componentInstance.disabled).toEqual(false);
            expect(selects[3].componentInstance.placeholder).toEqual('X Field');
            expect(selects[3].componentInstance.required).toEqual(true);
            options = selects[3].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length);
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testXField');
            }

            expect(selects[4].componentInstance.disabled).toEqual(false);
            expect(selects[4].componentInstance.placeholder).toEqual('Aggregation');
            expect(selects[4].componentInstance.required).toEqual(true);
            options = selects[4].componentInstance.options.toArray();
            expect(options.length).toEqual(5);
            expect(options[0].getLabel()).toEqual('Count');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Average');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('Max');
            expect(options[2].selected).toEqual(false);
            expect(options[3].getLabel()).toEqual('Min');
            expect(options[3].selected).toEqual(false);
            expect(options[4].getLabel()).toEqual('Sum');
            expect(options[4].selected).toEqual(true);

            expect(selects[5].componentInstance.disabled).toEqual(false);
            expect(selects[5].componentInstance.placeholder).toEqual('Aggregation Field');
            expect(selects[5].componentInstance.required).toEqual(true);
            options = selects[5].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testSizeField');
            }

            expect(selects[6].componentInstance.disabled).toEqual(false);
            expect(selects[6].componentInstance.placeholder).toEqual('Group Field');
            expect(selects[6].componentInstance.required).toEqual(false);
            options = selects[6].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testCategoryField');
            }

            expect(selects[7].componentInstance.disabled).toEqual(false);
            expect(selects[7].componentInstance.placeholder).toEqual('Y-Axis Labels Percentage');
            expect(selects[7].componentInstance.required).toEqual(true);
            options = selects[7].componentInstance.options.toArray();
            expect(options.length).toEqual(5);
            expect(options[0].getLabel()).toEqual('10%');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('20%');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('30%');
            expect(options[2].selected).toEqual(false);
            expect(options[3].getLabel()).toEqual('40%');
            expect(options[3].selected).toEqual(false);
            expect(options[4].getLabel()).toEqual('50%');
            expect(options[4].selected).toEqual(true);

            let toggles = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-button-toggle'));
            expect(toggles.length).toEqual(10);

            expect(toggles[0].componentInstance.value).toEqual(false);
            expect(toggles[0].nativeElement.textContent).toContain('Yes');
            expect(toggles[0].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[1].componentInstance.value).toEqual(true);
            expect(toggles[1].nativeElement.textContent).toContain('No');
            expect(toggles[1].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[2].componentInstance.value).toEqual(false);
            expect(toggles[2].nativeElement.textContent).toContain('Show');
            expect(toggles[2].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[3].componentInstance.value).toEqual(true);
            expect(toggles[3].nativeElement.textContent).toContain('Hide');
            expect(toggles[3].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[4].componentInstance.value).toEqual(false);
            expect(toggles[4].nativeElement.textContent).toContain('Show');
            expect(toggles[4].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[5].componentInstance.value).toEqual(true);
            expect(toggles[5].nativeElement.textContent).toContain('Hide');
            expect(toggles[5].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[6].componentInstance.value).toEqual(false);
            expect(toggles[6].nativeElement.textContent).toContain('No');
            expect(toggles[6].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[7].componentInstance.value).toEqual(true);
            expect(toggles[7].nativeElement.textContent).toContain('Yes');
            expect(toggles[7].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[8].componentInstance.value).toEqual(false);
            expect(toggles[8].nativeElement.textContent).toContain('No');
            expect(toggles[8].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[9].componentInstance.value).toEqual(true);
            expect(toggles[9].nativeElement.textContent).toContain('Yes');
            expect(toggles[9].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);
        });
    }));
});

describe('Component: Aggregation with XY config', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            AggregationComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ActiveGridService,
            ColorSchemeService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            ErrorNotificationService,
            ExportService,
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService,
            VisualizationService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'configFilter', useValue: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'database', useValue: 'testDatabase2' },
            { provide: 'limit', useValue: 1234 },
            { provide: 'table', useValue: 'testTable2' },
            { provide: 'title', useValue: 'Test Title' },
            { provide: 'aggregationField', useValue: 'testSizeField' },
            { provide: 'groupField', useValue: 'testCategoryField' },
            { provide: 'xField', useValue: 'testXField' },
            { provide: 'yField', useValue: 'testYField' },
            { provide: 'aggregation', useValue: 'sum' },
            { provide: 'granularity', useValue: 'day' },
            { provide: 'hideGridLines', useValue: true },
            { provide: 'hideGridTicks', useValue: true },
            { provide: 'ignoreSelf', useValue: true },
            { provide: 'lineCurveTension', useValue: 0 },
            { provide: 'lineFillArea', useValue: true },
            { provide: 'logScaleX', useValue: true },
            { provide: 'logScaleY', useValue: true },
            { provide: 'scaleMaxX', useValue: '44' },
            { provide: 'scaleMaxY', useValue: '33' },
            { provide: 'scaleMinX', useValue: '22' },
            { provide: 'scaleMinY', useValue: '11' },
            { provide: 'sortByAggregation', useValue: true },
            { provide: 'timeFill', useValue: true },
            { provide: 'type', useValue: 'scatter-xy' },
            { provide: 'yPercentage', useValue: 0.5 }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does show elements in sidenav options menu that have expected options if subcomponent type is XY', async(() => {
        // Force the component to update all its selected elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toEqual(7);

            expect(inputs[0].attributes.placeholder).toBe('Title');
            expect(inputs[0].nativeElement.value).toContain('Test Title');

            expect(inputs[1].attributes.placeholder).toBe('Limit');
            expect(inputs[1].nativeElement.value).toContain('1234');

            expect(inputs[2].attributes.placeholder).toBe('X Scale Min');
            expect(inputs[2].nativeElement.value).toContain('');

            expect(inputs[3].attributes.placeholder).toBe('X Scale Max');
            expect(inputs[3].nativeElement.value).toContain('');

            expect(inputs[4].attributes.placeholder).toBe('Y Scale Min');
            expect(inputs[4].nativeElement.value).toContain('');

            expect(inputs[5].attributes.placeholder).toBe('Y Scale Max');
            expect(inputs[5].nativeElement.value).toContain('');

            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toEqual(8);
            let options;

            expect(selects[0].componentInstance.disabled).toEqual(false);
            expect(selects[0].componentInstance.placeholder).toEqual('Subcomponent Type');
            expect(selects[0].componentInstance.required).toEqual(true);
            options = selects[0].componentInstance.options.toArray();
            expect(options.length).toEqual(10);
            expect(options[0].getLabel()).toEqual('Bar, Horizontal (Aggregations)');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Bar, Vertical (Aggregations)');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('Doughnut (Aggregations)');
            expect(options[2].selected).toEqual(false);
            expect(options[3].getLabel()).toEqual('Histogram (Aggregations)');
            expect(options[3].selected).toEqual(false);
            expect(options[4].getLabel()).toEqual('Line (Aggregations)');
            expect(options[4].selected).toEqual(false);
            expect(options[5].getLabel()).toEqual('Line (Points)');
            expect(options[5].selected).toEqual(false);
            expect(options[6].getLabel()).toEqual('Pie (Aggregations)');
            expect(options[6].selected).toEqual(false);
            expect(options[7].getLabel()).toEqual('Scatter (Aggregations)');
            expect(options[7].selected).toEqual(false);
            expect(options[8].getLabel()).toEqual('Scatter (Points)');
            expect(options[8].selected).toEqual(true);
            expect(options[9].getLabel()).toEqual('Table (Aggregations)');
            expect(options[9].selected).toEqual(false);

            expect(selects[1].componentInstance.disabled).toEqual(false);
            expect(selects[1].componentInstance.placeholder).toEqual('Database');
            expect(selects[1].componentInstance.required).toEqual(true);
            options = selects[1].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Database 1');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Test Database 2');
            expect(options[1].selected).toEqual(true);

            expect(selects[2].componentInstance.disabled).toEqual(false);
            expect(selects[2].componentInstance.placeholder).toEqual('Table');
            expect(selects[2].componentInstance.required).toEqual(true);
            options = selects[2].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Table 1');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Test Table 2');
            expect(options[1].selected).toEqual(true);

            expect(selects[3].componentInstance.disabled).toEqual(false);
            expect(selects[3].componentInstance.placeholder).toEqual('X Field');
            expect(selects[3].componentInstance.required).toEqual(true);
            options = selects[3].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length);
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testXField');
            }

            expect(selects[4].componentInstance.disabled).toEqual(false);
            expect(selects[4].componentInstance.placeholder).toEqual('Y Field');
            expect(selects[4].componentInstance.required).toEqual(true);
            options = selects[4].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length);
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testYField');
            }

            expect(selects[5].componentInstance.disabled).toEqual(false);
            expect(selects[5].componentInstance.placeholder).toEqual('Group Field');
            expect(selects[5].componentInstance.required).toEqual(false);
            options = selects[5].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testCategoryField');
            }

            expect(selects[6].componentInstance.disabled).toEqual(false);
            expect(selects[6].componentInstance.placeholder).toEqual('Y-Axis Labels Percentage');
            expect(selects[6].componentInstance.required).toEqual(true);
            options = selects[6].componentInstance.options.toArray();
            expect(options.length).toEqual(5);
            expect(options[0].getLabel()).toEqual('10%');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('20%');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('30%');
            expect(options[2].selected).toEqual(false);
            expect(options[3].getLabel()).toEqual('40%');
            expect(options[3].selected).toEqual(false);
            expect(options[4].getLabel()).toEqual('50%');
            expect(options[4].selected).toEqual(true);

            let toggles = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-button-toggle'));
            expect(toggles.length).toEqual(10);

            expect(toggles[0].componentInstance.value).toEqual(false);
            expect(toggles[0].nativeElement.textContent).toContain('Yes');
            expect(toggles[0].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[1].componentInstance.value).toEqual(true);
            expect(toggles[1].nativeElement.textContent).toContain('No');
            expect(toggles[1].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[2].componentInstance.value).toEqual(false);
            expect(toggles[2].nativeElement.textContent).toContain('Show');
            expect(toggles[2].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[3].componentInstance.value).toEqual(true);
            expect(toggles[3].nativeElement.textContent).toContain('Hide');
            expect(toggles[3].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[4].componentInstance.value).toEqual(false);
            expect(toggles[4].nativeElement.textContent).toContain('Show');
            expect(toggles[4].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[5].componentInstance.value).toEqual(true);
            expect(toggles[5].nativeElement.textContent).toContain('Hide');
            expect(toggles[5].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[6].componentInstance.value).toEqual(false);
            expect(toggles[6].nativeElement.textContent).toContain('No');
            expect(toggles[6].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[7].componentInstance.value).toEqual(true);
            expect(toggles[7].nativeElement.textContent).toContain('Yes');
            expect(toggles[7].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[8].componentInstance.value).toEqual(false);
            expect(toggles[8].nativeElement.textContent).toContain('No');
            expect(toggles[8].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[9].componentInstance.value).toEqual(true);
            expect(toggles[9].nativeElement.textContent).toContain('Yes');
            expect(toggles[9].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);
        });
    }));
});

describe('Component: Aggregation with date config', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            AggregationComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ActiveGridService,
            ColorSchemeService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            ErrorNotificationService,
            ExportService,
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService,
            VisualizationService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'configFilter', useValue: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'database', useValue: 'testDatabase2' },
            { provide: 'limit', useValue: 1234 },
            { provide: 'table', useValue: 'testTable2' },
            { provide: 'title', useValue: 'Test Title' },
            { provide: 'aggregationField', useValue: 'testSizeField' },
            { provide: 'groupField', useValue: 'testCategoryField' },
            { provide: 'xField', useValue: 'testDateField' },
            { provide: 'yField', useValue: 'testYField' },
            { provide: 'aggregation', useValue: 'sum' },
            { provide: 'granularity', useValue: 'day' },
            { provide: 'hideGridLines', useValue: true },
            { provide: 'hideGridTicks', useValue: true },
            { provide: 'ignoreSelf', useValue: true },
            { provide: 'lineCurveTension', useValue: 0 },
            { provide: 'lineFillArea', useValue: true },
            { provide: 'logScaleX', useValue: true },
            { provide: 'logScaleY', useValue: true },
            { provide: 'scaleMaxX', useValue: '44' },
            { provide: 'scaleMaxY', useValue: '33' },
            { provide: 'scaleMinX', useValue: '22' },
            { provide: 'scaleMinY', useValue: '11' },
            { provide: 'sortByAggregation', useValue: true },
            { provide: 'timeFill', useValue: true },
            { provide: 'type', useValue: 'scatter' },
            { provide: 'yPercentage', useValue: 0.5 }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does show elements in sidenav options menu that have expected options if X field is date type', async(() => {
        // Force the component to update all its selected elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toEqual(7);

            expect(inputs[0].attributes.placeholder).toBe('Title');
            expect(inputs[0].nativeElement.value).toContain('Test Title');

            expect(inputs[1].attributes.placeholder).toBe('Limit');
            expect(inputs[1].nativeElement.value).toContain('1234');

            expect(inputs[2].attributes.placeholder).toBe('X Scale Min');
            expect(inputs[2].nativeElement.value).toContain('');

            expect(inputs[3].attributes.placeholder).toBe('X Scale Max');
            expect(inputs[3].nativeElement.value).toContain('');

            expect(inputs[4].attributes.placeholder).toBe('Y Scale Min');
            expect(inputs[4].nativeElement.value).toContain('');

            expect(inputs[5].attributes.placeholder).toBe('Y Scale Max');
            expect(inputs[5].nativeElement.value).toContain('');

            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toEqual(10);
            let options;

            expect(selects[0].componentInstance.disabled).toEqual(false);
            expect(selects[0].componentInstance.placeholder).toEqual('Subcomponent Type');
            expect(selects[0].componentInstance.required).toEqual(true);
            options = selects[0].componentInstance.options.toArray();
            expect(options.length).toEqual(10);
            expect(options[0].getLabel()).toEqual('Bar, Horizontal (Aggregations)');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Bar, Vertical (Aggregations)');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('Doughnut (Aggregations)');
            expect(options[2].selected).toEqual(false);
            expect(options[3].getLabel()).toEqual('Histogram (Aggregations)');
            expect(options[3].selected).toEqual(false);
            expect(options[4].getLabel()).toEqual('Line (Aggregations)');
            expect(options[4].selected).toEqual(false);
            expect(options[5].getLabel()).toEqual('Line (Points)');
            expect(options[5].selected).toEqual(false);
            expect(options[6].getLabel()).toEqual('Pie (Aggregations)');
            expect(options[6].selected).toEqual(false);
            expect(options[7].getLabel()).toEqual('Scatter (Aggregations)');
            expect(options[7].selected).toEqual(true);
            expect(options[8].getLabel()).toEqual('Scatter (Points)');
            expect(options[8].selected).toEqual(false);
            expect(options[9].getLabel()).toEqual('Table (Aggregations)');
            expect(options[9].selected).toEqual(false);

            expect(selects[1].componentInstance.disabled).toEqual(false);
            expect(selects[1].componentInstance.placeholder).toEqual('Database');
            expect(selects[1].componentInstance.required).toEqual(true);
            options = selects[1].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Database 1');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Test Database 2');
            expect(options[1].selected).toEqual(true);

            expect(selects[2].componentInstance.disabled).toEqual(false);
            expect(selects[2].componentInstance.placeholder).toEqual('Table');
            expect(selects[2].componentInstance.required).toEqual(true);
            options = selects[2].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Table 1');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Test Table 2');
            expect(options[1].selected).toEqual(true);

            expect(selects[3].componentInstance.disabled).toEqual(false);
            expect(selects[3].componentInstance.placeholder).toEqual('X Field');
            expect(selects[3].componentInstance.required).toEqual(true);
            options = selects[3].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length);
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testDateField');
            }

            expect(selects[4].componentInstance.disabled).toEqual(false);
            expect(selects[4].componentInstance.placeholder).toEqual('Aggregation');
            expect(selects[4].componentInstance.required).toEqual(true);
            options = selects[4].componentInstance.options.toArray();
            expect(options.length).toEqual(5);
            expect(options[0].getLabel()).toEqual('Count');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Average');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('Max');
            expect(options[2].selected).toEqual(false);
            expect(options[3].getLabel()).toEqual('Min');
            expect(options[3].selected).toEqual(false);
            expect(options[4].getLabel()).toEqual('Sum');
            expect(options[4].selected).toEqual(true);

            expect(selects[5].componentInstance.disabled).toEqual(false);
            expect(selects[5].componentInstance.placeholder).toEqual('Aggregation Field');
            expect(selects[5].componentInstance.required).toEqual(true);
            options = selects[5].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testSizeField');
            }

            expect(selects[6].componentInstance.disabled).toEqual(false);
            expect(selects[6].componentInstance.placeholder).toEqual('Date Granularity');
            expect(selects[6].componentInstance.required).toEqual(true);
            options = selects[6].componentInstance.options.toArray();
            expect(options.length).toEqual(5);
            expect(options[0].getLabel()).toEqual('Year');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Month');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('Day');
            expect(options[2].selected).toEqual(true);
            expect(options[3].getLabel()).toEqual('Hour');
            expect(options[3].selected).toEqual(false);
            expect(options[4].getLabel()).toEqual('Minute');
            expect(options[4].selected).toEqual(false);

            expect(selects[7].componentInstance.disabled).toEqual(false);
            expect(selects[7].componentInstance.placeholder).toEqual('Group Field');
            expect(selects[7].componentInstance.required).toEqual(false);
            options = selects[7].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testCategoryField');
            }

            expect(selects[8].componentInstance.disabled).toEqual(false);
            expect(selects[8].componentInstance.placeholder).toEqual('Y-Axis Labels Percentage');
            expect(selects[8].componentInstance.required).toEqual(true);
            options = selects[8].componentInstance.options.toArray();
            expect(options.length).toEqual(5);
            expect(options[0].getLabel()).toEqual('10%');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('20%');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('30%');
            expect(options[2].selected).toEqual(false);
            expect(options[3].getLabel()).toEqual('40%');
            expect(options[3].selected).toEqual(false);
            expect(options[4].getLabel()).toEqual('50%');
            expect(options[4].selected).toEqual(true);

            let toggles = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-button-toggle'));
            expect(toggles.length).toEqual(12);

            expect(toggles[0].componentInstance.value).toEqual(false);
            expect(toggles[0].nativeElement.textContent).toContain('No');
            expect(toggles[0].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[1].componentInstance.value).toEqual(true);
            expect(toggles[1].nativeElement.textContent).toContain('Yes');
            expect(toggles[1].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[2].componentInstance.value).toEqual(false);
            expect(toggles[2].nativeElement.textContent).toContain('Yes');
            expect(toggles[2].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[3].componentInstance.value).toEqual(true);
            expect(toggles[3].nativeElement.textContent).toContain('No');
            expect(toggles[3].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[4].componentInstance.value).toEqual(false);
            expect(toggles[4].nativeElement.textContent).toContain('Show');
            expect(toggles[4].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[5].componentInstance.value).toEqual(true);
            expect(toggles[5].nativeElement.textContent).toContain('Hide');
            expect(toggles[5].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[6].componentInstance.value).toEqual(false);
            expect(toggles[6].nativeElement.textContent).toContain('Show');
            expect(toggles[6].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[7].componentInstance.value).toEqual(true);
            expect(toggles[7].nativeElement.textContent).toContain('Hide');
            expect(toggles[7].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[8].componentInstance.value).toEqual(false);
            expect(toggles[8].nativeElement.textContent).toContain('No');
            expect(toggles[8].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[9].componentInstance.value).toEqual(true);
            expect(toggles[9].nativeElement.textContent).toContain('Yes');
            expect(toggles[9].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[10].componentInstance.value).toEqual(false);
            expect(toggles[10].nativeElement.textContent).toContain('No');
            expect(toggles[10].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[11].componentInstance.value).toEqual(true);
            expect(toggles[11].nativeElement.textContent).toContain('Yes');
            expect(toggles[11].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);
        });
    }));
});
