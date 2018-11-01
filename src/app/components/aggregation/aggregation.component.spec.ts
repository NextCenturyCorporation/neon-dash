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
import { LegendComponent } from '../legend/legend.component';
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

    let COLOR_1 = new Color(173, 216, 230);
    let COLOR_2 = new Color(228, 26, 28);
    let COLOR_3 = new Color(55, 126, 184);

    initializeTestBed({
        declarations: [
            AggregationComponent,
            ExportControlComponent,
            LegendComponent,
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

        component.subcomponentMain = component.initializeSubcomponent(component.subcomponentMainElementRef);
        component.subcomponentZoom = component.initializeSubcomponent(component.subcomponentZoomElementRef);
    });

    it('class options properties are set to expected defaults', () => {
        expect(component.options.aggregationField).toEqual(new FieldMetaData());
        expect(component.options.groupField).toEqual(new FieldMetaData());
        expect(component.options.xField).toEqual(new FieldMetaData());
        expect(component.options.yField).toEqual(new FieldMetaData());

        expect(component.options.aggregation).toEqual('count');
        expect(component.options.dualView).toEqual('');
        expect(component.options.granularity).toEqual('year');
        expect(component.options.hideGridLines).toEqual(false);
        expect(component.options.hideGridTicks).toEqual(false);
        expect(component.options.ignoreSelf).toEqual(false);
        expect(component.options.lineCurveTension).toEqual(0.3);
        expect(component.options.lineFillArea).toEqual(false);
        expect(component.options.logScaleX).toEqual(false);
        expect(component.options.logScaleY).toEqual(false);
        expect(component.options.notFilterable).toEqual(false);
        expect(component.options.requireAll).toEqual(false);
        expect(component.options.savePrevious).toEqual(false);
        expect(component.options.scaleMaxX).toEqual('');
        expect(component.options.scaleMaxY).toEqual('');
        expect(component.options.scaleMinX).toEqual('');
        expect(component.options.scaleMinY).toEqual('');
        expect(component.options.showHeat).toEqual(false);
        expect(component.options.sortByAggregation).toEqual(false);
        expect(component.options.timeFill).toEqual(false);
        expect(component.options.type).toEqual('line');
        expect(component.options.yPercentage).toEqual(0.3);
        expect(component.options.newType).toEqual('line');
    });

    it('class properties are set to expected defaults', () => {
        expect(component.activeData).toEqual([]);
        expect(component.filterToPassToSuperclass).toEqual({});
        expect(component.groupFilters).toEqual([]);
        expect(component.lastPage).toEqual(true);
        expect(component.legendActiveGroups).toEqual([]);
        expect(component.legendFields).toEqual([]);
        expect(component.legendGroups).toEqual([]);
        expect(component.minimumDimensionsMain.height).toBeDefined();
        expect(component.minimumDimensionsMain.width).toBeDefined();
        expect(component.minimumDimensionsZoom.height).toBeDefined();
        expect(component.minimumDimensionsZoom.width).toBeDefined();
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([]);
        expect(component.selectedArea).toEqual(null);
        expect(component.selectedAreaOffset.x).toBeDefined();
        expect(component.selectedAreaOffset.y).toBeDefined();
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
            name: 'Text List (Aggregations)',
            type: 'list'
        }]);
        expect(component.valueFilters).toEqual([]);

        // Element Refs
        expect(component.headerText).toBeDefined();
        expect(component.hiddenCanvas).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.subcomponentMainElementRef).toBeDefined();
        expect(component.subcomponentZoomElementRef).toBeDefined();
        expect(component.visualization).toBeDefined();
    });

    it('allowDualView does return expected boolean', () => {
        expect(component.allowDualView('histogram')).toEqual(true);
        expect(component.allowDualView('line')).toEqual(true);
        expect(component.allowDualView('line-xy')).toEqual(true);

        expect(component.allowDualView('bar-h')).toEqual(false);
        expect(component.allowDualView('bar-v')).toEqual(false);
        expect(component.allowDualView('doughnut')).toEqual(false);
        expect(component.allowDualView('pie')).toEqual(false);
        expect(component.allowDualView('scatter')).toEqual(false);
        expect(component.allowDualView('scatter-xy')).toEqual(false);
        expect(component.allowDualView('table')).toEqual(false);
    });

    it('createFilterPrettyText does return expected string', () => {
        expect(component.createFilterPrettyText({
            field: 'field1',
            label: '1234',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 1234
        })).toEqual('prettyField1 is 1234');

        expect(component.createFilterPrettyText({
            field: 'field1',
            label: 'value1',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'value1'
        })).toEqual('prettyField1 is value1');

        expect(component.createFilterPrettyText({
            field: 'field1',
            label: '',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: {
                beginX: 'beginX1',
                endX: 'endX1'
            }
        })).toEqual('prettyField1 from beginX1 to endX1');

        expect(component.createFilterPrettyText({
            field: 'field1',
            label: '',
            neonFilter: null,
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

    it('createFilterPrettyText with date data does return expected string', () => {
        component.options.xField = DatasetServiceMock.DATE_FIELD;

        expect(component.createFilterPrettyText({
            field: 'field1',
            label: '',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: {
                beginX: '2018-01-01T00:00:00.000Z',
                endX: '2018-01-03T00:00:00.000Z'
            }
        })).toEqual('prettyField1 from Mon, Jan 1, 2018, 12:00 AM to Wed, Jan 3, 2018, 12:00 AM');

        expect(component.createFilterPrettyText({
            field: 'field1',
            label: '',
            neonFilter: null,
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

    it('createOrRemoveNeonFilter with no groupFilters, valueFilters, or filterToPassToSuperclass.id does nothing', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with groupFilters does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        component.groupFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([true, {}, neonFilter1]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with multiple groupFilters does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        let neonFilter2 = neon.query.where('field2', '=', 'value2');
        component.groupFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            field: 'field2',
            label: '',
            neonFilter: neonFilter2,
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([true, {}, neon.query.and.apply(neon.query, [neonFilter1, neonFilter2])]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with valueFilters does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        component.valueFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([true, {}, neonFilter1]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with multiple valueFilters does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        let neonFilter2 = neon.query.where('field2', '=', 'value2');
        component.valueFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            field: 'field2',
            label: '',
            neonFilter: neonFilter2,
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([true, {}, neon.query.or.apply(neon.query, [neonFilter1, neonFilter2])]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with multiple valueFilters and requireAll=true does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        let neonFilter2 = neon.query.where('field2', '=', 'value2');
        component.valueFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            field: 'field2',
            label: '',
            neonFilter: neonFilter2,
            prettyField: 'prettyField2',
            value: 'value2'
        }];
        component.options.requireAll = true;

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([true, {}, neon.query.and.apply(neon.query, [neonFilter1, neonFilter2])]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with groupFilters and valueFilters does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        let neonFilter2 = neon.query.where('field2', '=', 'value2');

        component.groupFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.valueFilters = [{
            field: 'field2',
            label: '',
            neonFilter: neonFilter2,
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([true, {}, neon.query.and.apply(neon.query, [neonFilter1, neonFilter2])]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with multiple groupFilters and valueFilters does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        let neonFilter2 = neon.query.where('field2', '=', 'value2');
        let neonFilter3 = neon.query.where('field3', '=', 'value3');
        let neonFilter4 = neon.query.where('field4', '=', 'value4');

        component.groupFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            field: 'field2',
            label: '',
            neonFilter: neonFilter2,
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        component.valueFilters = [{
            field: 'field3',
            label: '',
            neonFilter: neonFilter3,
            prettyField: 'prettyField3',
            value: 'value3'
        }, {
            field: 'field4',
            label: '',
            neonFilter: neonFilter4,
            prettyField: 'prettyField4',
            value: 'value4'
        }];

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([true, {}, neon.query.and.apply(neon.query, [
            neon.query.and.apply(neon.query, [neonFilter1, neonFilter2]),
            neon.query.or.apply(neon.query, [neonFilter3, neonFilter4])
        ])]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with filters and filterToPassToSuperclass.id does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        component.groupFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }];
        component.filterToPassToSuperclass.id = 'testId';

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([true, {
            id: 'testId'
        }, neonFilter1]);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with no filters and filterToPassToSuperclass.id does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        component.filterToPassToSuperclass.id = 'testId';

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy3.calls.argsFor(0)).toEqual([{
            id: 'testId'
        }, true, true]);
    });

    it('createOrRemoveNeonFilter with groupFilters and ignoreSelf=true does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        component.groupFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }];
        component.options.ignoreSelf = true;

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([false, {}, neonFilter1]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createOrRemoveNeonFilter with filters and filterToPassToSuperclass.id and ignoreSelf=true does work as expected', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        component.groupFilters = [{
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        }];
        component.filterToPassToSuperclass.id = 'testId';
        component.options.ignoreSelf = true;

        component.createOrRemoveNeonFilter();

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([false, {
            id: 'testId'
        }, neonFilter1]);
        expect(spy3.calls.count()).toEqual(0);
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
        expect(component.getButtonText()).toEqual('Total 0');

        component.responseData = [{}, {}, {}, {}];
        expect(component.getButtonText()).toEqual('1 of 4');

        component.options.limit = 2;
        expect(component.getButtonText()).toEqual('1 - 2 of 4');

        component.page = 2;
        expect(component.getButtonText()).toEqual('3 - 4 of 4');
    });

    it('getCloseableFilters does return expected object', () => {
        expect(component.getCloseableFilters()).toEqual([]);

        component.filterToPassToSuperclass.id = 'testId';

        expect(component.getCloseableFilters()).toEqual([{
            id: 'testId'
        }]);
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
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

    it('getFiltersToIgnore does return null if service and local filters are set but ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testXField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.filterToPassToSuperclass = {
            id: 'testDatabase1-testTable1-testFilterName1'
        };

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return expected array of IDs if service and local filters are set and ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testXField', '!=', null), 'testFilterName1');

        component.options.ignoreSelf = true;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.filterToPassToSuperclass = {
            id: 'testDatabase1-testTable1-testFilterName1'
        };

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return null if group service filters are set but local filters are empty and ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testCategoryField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return null if group service and local filters are set but ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testCategoryField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.filterToPassToSuperclass = {
            id: 'testDatabase1-testTable1-testFilterName1'
        };

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return expected array of IDs if group service and local filters are set and ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testCategoryField', '!=', null), 'testFilterName1');

        component.options.ignoreSelf = true;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.filterToPassToSuperclass = {
            id: 'testDatabase1-testTable1-testFilterName1'
        };

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

    it('getFiltersToIgnore does return null if XY service and local filters are set but ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [neon.query.where('testXField', '!=', null), neon.query.where('testYField', '!=', null)]),
            'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.type = 'scatter-xy';
        component.filterToPassToSuperclass = {
            id: 'testDatabase1-testTable1-testFilterName1'
        };

        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.yField = DatasetServiceMock.Y_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return expected array of IDs if XY service and local filters are set and ignoreSelf=true', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [neon.query.where('testXField', '!=', null), neon.query.where('testYField', '!=', null)]),
            'testFilterName1');

        component.options.ignoreSelf = true;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.type = 'scatter-xy';
        component.filterToPassToSuperclass = {
            id: 'testDatabase1-testTable1-testFilterName1'
        };

        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.yField = DatasetServiceMock.Y_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return null if service and local filters are set but are not matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testXField', '!=', null), 'testFilterName1');

        component.options.ignoreSelf = true;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.xField = DatasetServiceMock.Y_FIELD;
        component.filterToPassToSuperclass = {
            id: 'testDatabase1-testTable1-testFilterName1'
        };

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

    it('getFilterText with a single filter does return expected string', () => {
        component.groupFilters = [{
            field: 'field1',
            label: 'not group1',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'group1'
        }];

        expect(component.getFilterText({})).toEqual('prettyField1 is not group1');

        component.groupFilters = [];

        component.valueFilters = [{
            field: 'field1',
            label: 'value1',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.getFilterText({})).toEqual('prettyField1 is value1');

        component.valueFilters = [{
            field: 'field1',
            label: '',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: {
                beginX: 'beginX1',
                endX: 'endX1'
            }
        }];

        expect(component.getFilterText({})).toEqual('prettyField1 from beginX1 to endX1');

        component.valueFilters = [{
            field: 'field1',
            label: '',
            neonFilter: null,
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
        }];

        expect(component.getFilterText({})).toEqual('prettyX1 from beginX1 to endX1 and prettyY1 from beginY1 to endY1');
    });

    it('getFilterText with multiple filters does return expected string', () => {
        component.groupFilters = [{
            field: 'field1',
            label: 'not group1',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'group1'
        }, {
            field: 'field1',
            label: 'not group2',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'group2'
        }];

        expect(component.getFilterText({})).toEqual('2 Filters');

        component.valueFilters = [{
            field: 'field1',
            label: '1234',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 1234
        }, {
            field: 'field1',
            label: 'value1',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            field: 'field1',
            label: '',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: {
                beginX: 'beginX1',
                endX: 'endX1'
            }
        }, {
            field: 'field1',
            label: '',
            neonFilter: null,
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
        }];

        expect(component.getFilterText({})).toEqual('6 Filters');
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

        expect(component.getXFieldLabel('list')).toEqual('Row Field');
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
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.newType = 'line-xy';

        component.handleChangeSubcomponentType();

        expect(component.options.sortByAggregation).toEqual(false);
        expect(component.options.type).toEqual('line-xy');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does not call expected functions if new type equals subcomponent type', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.newType = 'line';
        component.options.sortByAggregation = true;

        component.handleChangeSubcomponentType();

        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.type).toEqual('line');
        expect(spy.calls.count()).toEqual(0);
    });

    it('handleChangeSubcomponentType does not update dualView if new type is allowed to have dual views', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.newType = 'line-xy';
        component.options.dualView = 'on';

        component.handleChangeSubcomponentType();

        expect(component.options.dualView).toEqual('on');
        expect(component.options.type).toEqual('line-xy');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does update dualView if new type is not allowed to have dual views', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.newType = 'bar-h';
        component.options.dualView = 'on';

        component.handleChangeSubcomponentType();

        expect(component.options.dualView).toEqual('');
        expect(component.options.type).toEqual('bar-h');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does update sortByAggregation if new type is not sortable by aggregation', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.newType = 'line-xy';
        component.options.sortByAggregation = true;

        component.handleChangeSubcomponentType();

        expect(component.options.sortByAggregation).toEqual(false);
        expect(component.options.type).toEqual('line-xy');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does not update sortByAggregation if new type is sortable by aggregation', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.newType = 'bar-h';
        component.options.sortByAggregation = true;

        component.handleChangeSubcomponentType();

        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.type).toEqual('bar-h');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleLegendItemSelected does call toggleFilter', () => {
        let spy = spyOn(component, 'toggleFilter');

        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;

        component.handleLegendItemSelected({
            value: 'testValue'
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], {
            field: 'testCategoryField',
            label: 'not testValue',
            neonFilter: neon.query.where('testCategoryField', '!=', 'testValue'),
            prettyField: 'Test Category Field',
            value: 'testValue'
        }]);
    });

    it('handleLegendItemSelected does not call toggleFilter if notFilterable=true', () => {
        let spy = spyOn(component, 'toggleFilter');

        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.notFilterable = true;

        component.handleLegendItemSelected({
            value: 'testValue'
        });

        expect(spy.calls.count()).toEqual(0);
    });

    it('handleLegendItemSelected with groupFields does call toggleFilter', () => {
        let spy = spyOn(component, 'toggleFilter');

        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;

        component.groupFilters = [{
            field: 'testCategoryField',
            label: 'not testOtherValue',
            neonFilter: neon.query.where('testCategoryField', '!=', 'testOtherValue'),
            prettyField: 'Test Category Field',
            value: 'testOtherValue'
        }];

        component.handleLegendItemSelected({
            value: 'testValue'
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            field: 'testCategoryField',
            label: 'not testOtherValue',
            neonFilter: neon.query.where('testCategoryField', '!=', 'testOtherValue'),
            prettyField: 'Test Category Field',
            value: 'testOtherValue'
        }], {
            field: 'testCategoryField',
            label: 'not testValue',
            neonFilter: neon.query.where('testCategoryField', '!=', 'testValue'),
            prettyField: 'Test Category Field',
            value: 'testValue'
        }]);
    });

    it('initializeSubcomponent does return expected object', () => {
        let subcomponentObject = component.initializeSubcomponent(component.subcomponentMainElementRef);
        expect(subcomponentObject.constructor.name).toEqual(ChartJsLineSubcomponent.name);
    });

    it('isContinuous does return expected boolean', () => {
        expect(component.isContinuous('histogram')).toEqual(true);
        expect(component.isContinuous('line')).toEqual(true);
        expect(component.isContinuous('line-xy')).toEqual(true);
        expect(component.isContinuous('scatter')).toEqual(true);
        expect(component.isContinuous('scatter-xy')).toEqual(true);

        expect(component.isContinuous('bar-h')).toEqual(false);
        expect(component.isContinuous('bar-v')).toEqual(false);
        expect(component.isContinuous('doughnut')).toEqual(false);
        expect(component.isContinuous('pie')).toEqual(false);
        expect(component.isContinuous('table')).toEqual(false);
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
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: 1,
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: 3,
            y: 4
        }]);
        expect(component.xList).toEqual([1, 3]);
        expect(component.yList).toEqual([2, 4]);
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
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: 1,
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: 3,
            y: 4
        }]);
        expect(component.xList).toEqual([1, 3]);
        expect(component.yList).toEqual([2, 4]);
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
        expect(component.legendActiveGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_2,
            group: 'a',
            x: 1,
            y: 2
        }, {
            color: COLOR_2,
            group: 'a',
            x: 3,
            y: 4
        }, {
            color: COLOR_3,
            group: 'b',
            x: 5,
            y: 6
        }, {
            color: COLOR_3,
            group: 'b',
            x: 7,
            y: 8
        }]);
        expect(component.xList).toEqual([1, 3, 5, 7]);
        expect(component.yList).toEqual([2, 4, 6, 8]);
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
        expect(component.legendActiveGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_2,
            group: 'a',
            x: 1,
            y: 2
        }, {
            color: COLOR_2,
            group: 'a',
            x: 3,
            y: 4
        }, {
            color: COLOR_3,
            group: 'b',
            x: 5,
            y: 6
        }, {
            color: COLOR_3,
            group: 'b',
            x: 7,
            y: 8
        }]);
        expect(component.xList).toEqual([1, 3, 5, 7]);
        expect(component.yList).toEqual([2, 4, 6, 8]);
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
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }]);
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z', '2018-01-03T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 4]);
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
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }]);
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z', '2018-01-03T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 4]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with savePrevious=true does keep previous xList string data', () => {
        component.options.savePrevious = true;
        component.options.xField = DatasetServiceMock.TEXT_FIELD;
        component.page = 2;
        component.xList = ['z', 'a', 'b', 'c', 'd'];
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _aggregation: 2,
                testTextField: 'a'
            }, {
                _aggregation: 4,
                testTextField: 'c'
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: 'a',
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: 'c',
            y: 4
        }]);
        expect(component.xList).toEqual(['z', 'a', 'b', 'c', 'd']);
        expect(component.yList).toEqual([2, 4]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with savePrevious=true does keep previous xList number data', () => {
        component.options.savePrevious = true;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.page = 2;
        component.xList = [0, 1, 2, 3, 4];
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
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: 1,
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: 3,
            y: 4
        }]);
        expect(component.xList).toEqual([0, 1, 2, 3, 4]);
        expect(component.yList).toEqual([2, 4]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with savePrevious=true does keep previous xList date data', () => {
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.savePrevious = true;
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.xList = ['2018-01-01T00:00:00.000Z', '2018-01-02T00:00:00.000Z', '2018-01-03T00:00:00.000Z', '2018-01-04T00:00:00.000Z',
            '2018-01-05T00:00:00.000Z'];
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _date: '2018-01-02T00:00:00.000Z',
                testYField: 2
            }, {
                _date: '2018-01-04T00:00:00.000Z',
                testYField: 4
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-04T00:00:00.000Z',
            y: 4
        }]);
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z', '2018-01-02T00:00:00.000Z', '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z', '2018-01-05T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 4]);
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
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }]);
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z', '2018-01-02T00:00:00.000Z', '2018-01-03T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 0, 4]);
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
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 3
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-04T00:00:00.000Z',
            y: 5
        }]);
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z', '2018-01-02T00:00:00.000Z', '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 3, 4, 5]);
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
        expect(component.legendActiveGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_2,
            group: 'a',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: COLOR_2,
            group: 'a',
            x: '2018-01-02T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_2,
            group: 'a',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }, {
            color: COLOR_2,
            group: 'a',
            x: '2018-01-04T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_3,
            group: 'b',
            x: '2018-01-01T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_3,
            group: 'b',
            x: '2018-01-02T00:00:00.000Z',
            y: 3
        }, {
            color: COLOR_3,
            group: 'b',
            x: '2018-01-03T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_3,
            group: 'b',
            x: '2018-01-04T00:00:00.000Z',
            y: 5
        }]);
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z', '2018-01-02T00:00:00.000Z', '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 0, 4, 3, 5]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with savePrevious=true and timeFill=true does work as expected', () => {
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.savePrevious = true;
        component.options.timeFill = true;
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        component.xList = ['2018-01-01T00:00:00.000Z', '2018-01-02T00:00:00.000Z', '2018-01-03T00:00:00.000Z', '2018-01-04T00:00:00.000Z',
            '2018-01-05T00:00:00.000Z'];
        component.page = 2;
        let spy = spyOn(component, 'updateActiveData');

        component.onQuerySuccess({
            data: [{
                _date: '2018-01-02T00:00:00.000Z',
                testYField: 2
            }, {
                _date: '2018-01-04T00:00:00.000Z',
                testYField: 4
            }]
        });

        expect(component.errorMessage).toEqual('');
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            color: COLOR_1,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 2
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-04T00:00:00.000Z',
            y: 4
        }, {
            color: COLOR_1,
            group: 'All',
            x: '2018-01-05T00:00:00.000Z',
            y: 0
        }]);
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z', '2018-01-02T00:00:00.000Z', '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z', '2018-01-05T00:00:00.000Z']);
        expect(component.yList).toEqual([0, 2, 4]);
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
        expect(component.legendActiveGroups).toEqual([]);
        expect(component.legendGroups).toEqual([]);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([]);
        expect(component.xList).toEqual([]);
        expect(component.yList).toEqual([]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('postInit does work as expected', () => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(spy.calls.count()).toEqual(1);
    });

    it('redrawSubcomponents does recreate main subcomponent and call expected functions', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'refreshVisualization');
        let spy3 = spyOn(component.subcomponentMain, 'destroy');
        let spy4 = spyOn(component.subcomponentZoom, 'destroy');

        component.redrawSubcomponents();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.subcomponentMainElementRef]);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([true]);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy4.calls.count()).toEqual(1);
    });

    it('redrawSubcomponents does recreate both main and zoom subcomponents if dualView is truthy', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'refreshVisualization');
        let spy3 = spyOn(component.subcomponentMain, 'destroy');
        let spy4 = spyOn(component.subcomponentZoom, 'destroy');

        component.options.dualView = 'on';

        component.redrawSubcomponents();

        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(0)).toEqual([component.subcomponentMainElementRef]);
        expect(spy1.calls.argsFor(1)).toEqual([component.subcomponentZoomElementRef, true]);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([true]);
        expect(spy3.calls.count()).toEqual(1);
        expect(spy4.calls.count()).toEqual(1);
    });

    it('refreshVisualization does draw data', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.aggregation = 'sum';
        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 0,
            groups: [],
            sort: 'x',
            xAxis: 'number',
            xList: [],
            yAxis: 'number',
            yList: []
        }]);
        expect(spy2.calls.count()).toEqual(0);

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.legendGroups = ['a', 'b'];
        component.options.sortByAggregation = true;
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.legendFields).toEqual(['testCategoryField']);
    });

    it('refreshVisualization with XY subcomponent does draw data', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.type = 'line-xy';
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 0,
            groups: [],
            sort: 'x',
            xAxis: 'number',
            xList: [],
            yAxis: 'number',
            yList: []
        }]);
        expect(spy2.calls.count()).toEqual(0);

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.legendGroups = ['a', 'b'];
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'x',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.legendFields).toEqual(['testCategoryField']);
    });

    it('refreshVisualization does work as expected with date fields', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.type = 'line-xy';
        component.options.xField = DatasetServiceMock.DATE_FIELD;
        component.options.yField = DatasetServiceMock.DATE_FIELD;

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 0,
            groups: [],
            sort: 'x',
            xAxis: 'date',
            xList: [],
            yAxis: 'date',
            yList: []
        }]);
        expect(spy2.calls.count()).toEqual(0);

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.legendGroups = ['a', 'b'];
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'x',
            xAxis: 'date',
            xList: [1, 3],
            yAxis: 'date',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.legendFields).toEqual(['']);
    });

    it('refreshVisualization does work as expected with string fields', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.type = 'line-xy';
        component.options.xField = DatasetServiceMock.TEXT_FIELD;
        component.options.yField = DatasetServiceMock.TEXT_FIELD;

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 0,
            groups: [],
            sort: 'x',
            xAxis: 'string',
            xList: [],
            yAxis: 'string',
            yList: []
        }]);
        expect(spy2.calls.count()).toEqual(0);

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.legendGroups = ['a', 'b'];
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: undefined,
            aggregationLabel: undefined,
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'x',
            xAxis: 'string',
            xList: [1, 3],
            yAxis: 'string',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.legendFields).toEqual(['']);
    });

    it('refreshVisualization does draw zoom data if dualView is truthy', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.aggregation = 'sum';
        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.dualView = 'on';

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.legendGroups = ['a', 'b'];
        component.options.sortByAggregation = true;
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.legendFields).toEqual(['testCategoryField']);

        component.options.dualView = 'filter';

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(2);
        expect(spy2.calls.argsFor(1)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.legendFields).toEqual(['testCategoryField']);
    });

    it('refreshVisualization does not draw main data if filterToPassToSuperclass.id is defined unless dualView is falsey', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.aggregation = 'sum';
        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.dualView = 'on';
        component.filterToPassToSuperclass.id = 'testId';

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.legendGroups = ['a', 'b'];
        component.options.sortByAggregation = true;
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.legendFields).toEqual(['testCategoryField']);

        component.options.dualView = '';

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.legendFields).toEqual(['testCategoryField']);
    });

    it('refreshVisualization does draw main data if given true argument', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.aggregation = 'sum';
        component.options.aggregationField = DatasetServiceMock.SIZE_FIELD;
        component.options.groupField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.dualView = 'on';
        component.filterToPassToSuperclass.id = 'testId';

        component.activeData = [{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }];
        component.legendGroups = ['a', 'b'];
        component.options.sortByAggregation = true;
        component.xList = [1, 3];
        component.yList = [2, 4];

        component.refreshVisualization(true);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: 'Test Size Field',
            aggregationLabel: 'sum',
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.legendFields).toEqual(['testCategoryField']);
    });

    it('removeFilter does delete filters and call subcomponentMain.deselect', () => {
        let spy = spyOn(component.subcomponentMain, 'deselect');

        component.filterToPassToSuperclass.id = 'testId';
        component.groupFilters = [{
            field: 'field1',
            label: '',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'value1'
        }];
        component.valueFilters = [{
            field: 'field2',
            label: '',
            neonFilter: null,
            prettyField: 'prettyField2',
            value: 'value2'
        }];
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };

        component.removeFilter({
            id: 'testId'
        });

        expect(component.filterToPassToSuperclass).toEqual({});
        expect(component.groupFilters).toEqual([]);
        expect(component.valueFilters).toEqual([]);
        expect(component.selectedArea).toEqual(null);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([]);
    });

    it('showFooterContainer does return expected boolean', () => {
        expect(component.showFooterContainer()).toEqual(false);

        component.activeData = [{}];
        component.responseData = [{}, {}];

        expect(component.showFooterContainer()).toEqual(true);
    });

    it('showHeaderContainer does return expected boolean', () => {
        component.options.type = 'bar-h';

        expect(component.showHeaderContainer()).toEqual(false);

        component.legendGroups = ['a'];

        expect(component.showHeaderContainer()).toEqual(false);

        component.legendGroups = ['a', 'b'];

        expect(component.showHeaderContainer()).toEqual(true);

        component.legendGroups = [];
        component.groupFilters = [{
            field: 'field1',
            label: '',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.showHeaderContainer()).toEqual(true);

        component.groupFilters = [];
        component.valueFilters = [{
            field: 'field1',
            label: '',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.showHeaderContainer()).toEqual(true);
    });

    it('showHeaderContainer does always return true if type is line or scatter', () => {
        component.options.type = 'line';
        expect(component.showHeaderContainer()).toEqual(true);
        component.options.type = 'line-xy';
        expect(component.showHeaderContainer()).toEqual(true);
        component.options.type = 'scatter';
        expect(component.showHeaderContainer()).toEqual(true);
        component.options.type = 'scatter-xy';
        expect(component.showHeaderContainer()).toEqual(true);
    });

    it('showLegend does return expected boolean', () => {
        component.options.type = 'bar-h';

        expect(component.showLegend()).toEqual(false);

        component.legendGroups = ['a'];

        expect(component.showLegend()).toEqual(false);

        component.legendGroups = ['a', 'b'];

        expect(component.showLegend()).toEqual(true);
    });

    it('showLegend does always return true if type is line or scatter', () => {
        component.options.type = 'line';
        expect(component.showLegend()).toEqual(true);
        component.options.type = 'line-xy';
        expect(component.showLegend()).toEqual(true);
        component.options.type = 'scatter';
        expect(component.showLegend()).toEqual(true);
        component.options.type = 'scatter-xy';
        expect(component.showLegend()).toEqual(true);
    });

    it('showBothViews does return expected boolean', () => {
        expect(component.showBothViews()).toEqual(false);

        component.options.dualView = 'on';
        expect(component.showBothViews()).toEqual(true);

        component.options.dualView = 'filter';
        expect(component.showBothViews()).toEqual(false);

        component.filterToPassToSuperclass.id = 'testId';
        expect(component.showBothViews()).toEqual(true);
    });

    it('subcomponentRequestsDeselect does update selectedArea', () => {
        component.selectedArea = {
            height: 20,
            width: 10,
            x: 1,
            y: 2
        };

        component.subcomponentRequestsDeselect();

        expect(component.selectedArea).toEqual(null);
    });

    it('subcomponentRequestsFilterOnBounds with number data does update valueFilters and call createOrRemoveNeonFilter', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.subcomponentRequestsFilterOnBounds(12, 34, 56, 78);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.valueFilters).toEqual([{
            field: {
                x: 'testXField',
                y: 'testYField'
            },
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testXField', '>=', 12), neon.query.where('testYField', '>=', 34),
                neon.query.where('testXField', '<=', 56), neon.query.where('testYField', '<=', 78)
            ]),
            prettyField: {
                x: 'Test X Field',
                y: 'Test Y Field'
            },
            value: {
                beginX: 12,
                beginY: 34,
                endX: 56,
                endY: 78
            }
        }]);
    });

    it('subcomponentRequestsFilterOnBounds with string data does update valueFilters and call createOrRemoveNeonFilter', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.xField = DatasetServiceMock.TEXT_FIELD;
        component.options.yField = DatasetServiceMock.TEXT_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.subcomponentRequestsFilterOnBounds('testText1', 'testText2', 'testText3', 'testText4');

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.valueFilters).toEqual([{
            field: {
                x: 'testTextField',
                y: 'testTextField'
            },
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testTextField', '>=', 'testText1'), neon.query.where('testTextField', '>=', 'testText2'),
                neon.query.where('testTextField', '<=', 'testText3'), neon.query.where('testTextField', '<=', 'testText4')
            ]),
            prettyField: {
                x: 'Test Text Field',
                y: 'Test Text Field'
            },
            value: {
                beginX: 'testText1',
                beginY: 'testText2',
                endX: 'testText3',
                endY: 'testText4'
            }
        }]);
    });

    it('subcomponentRequestsFilterOnBounds does delete previous valueFilters if doNotReplace=false', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.valueFilters = [{
            field: {
                x: 'testXField',
                y: 'testYField'
            },
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testXField', '>=', 21), neon.query.where('testYField', '>=', 43),
                neon.query.where('testXField', '<=', 65), neon.query.where('testYField', '<=', 87)
            ]),
            prettyField: {
                x: 'Test X Field',
                y: 'Test Y Field'
            },
            value: {
                beginX: 21,
                beginY: 43,
                endX: 65,
                endY: 87
            }
        }];

        component.subcomponentRequestsFilterOnBounds(12, 34, 56, 78);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.valueFilters).toEqual([{
            field: {
                x: 'testXField',
                y: 'testYField'
            },
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testXField', '>=', 12), neon.query.where('testYField', '>=', 34),
                neon.query.where('testXField', '<=', 56), neon.query.where('testYField', '<=', 78)
            ]),
            prettyField: {
                x: 'Test X Field',
                y: 'Test Y Field'
            },
            value: {
                beginX: 12,
                beginY: 34,
                endX: 56,
                endY: 78
            }
        }]);
    });

    it('subcomponentRequestsFilterOnBounds does not delete previous valueFilters and does call toggleFilter if doNotReplace=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.valueFilters = [{
            field: {
                x: 'testXField',
                y: 'testYField'
            },
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testXField', '>=', 21), neon.query.where('testYField', '>=', 43),
                neon.query.where('testXField', '<=', 65), neon.query.where('testYField', '<=', 87)
            ]),
            prettyField: {
                x: 'Test X Field',
                y: 'Test Y Field'
            },
            value: {
                beginX: 21,
                beginY: 43,
                endX: 65,
                endY: 87
            }
        }];

        component.subcomponentRequestsFilterOnBounds(12, 34, 56, 78, true);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            field: {
                x: 'testXField',
                y: 'testYField'
            },
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testXField', '>=', 21), neon.query.where('testYField', '>=', 43),
                neon.query.where('testXField', '<=', 65), neon.query.where('testYField', '<=', 87)
            ]),
            prettyField: {
                x: 'Test X Field',
                y: 'Test Y Field'
            },
            value: {
                beginX: 21,
                beginY: 43,
                endX: 65,
                endY: 87
            }
        }], {
            field: {
                x: 'testXField',
                y: 'testYField'
            },
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testXField', '>=', 12), neon.query.where('testYField', '>=', 34),
                neon.query.where('testXField', '<=', 56), neon.query.where('testYField', '<=', 78)
            ]),
            prettyField: {
                x: 'Test X Field',
                y: 'Test Y Field'
            },
            value: {
                beginX: 12,
                beginY: 34,
                endX: 56,
                endY: 78
            }
        }]);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.valueFilters).toEqual([{
            field: {
                x: 'testXField',
                y: 'testYField'
            },
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testXField', '>=', 21), neon.query.where('testYField', '>=', 43),
                neon.query.where('testXField', '<=', 65), neon.query.where('testYField', '<=', 87)
            ]),
            prettyField: {
                x: 'Test X Field',
                y: 'Test Y Field'
            },
            value: {
                beginX: 21,
                beginY: 43,
                endX: 65,
                endY: 87
            }
        }]);
    });

    it('subcomponentRequestsFilterOnBounds does not remove selectedArea if ignoreSelf=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = true;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;

        component.subcomponentRequestsFilterOnBounds(1, 2, 3, 4);

        expect(component.selectedArea).toEqual({
            height: 4,
            width: 3,
            x: 2,
            y: 1
        });
    });

    it('subcomponentRequestsFilterOnBounds does not update valueFilters or call createOrRemoveNeonFilter if notFilterable=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.notFilterable = true;
        component.options.xField = DatasetServiceMock.X_FIELD;
        component.options.yField = DatasetServiceMock.Y_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.subcomponentRequestsFilterOnBounds(12, 34, 56, 78);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.valueFilters).toEqual([]);
    });

    it('subcomponentRequestsFilterOnDomain with number data does update valueFilters and call createOrRemoveNeonFilter', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.xField = DatasetServiceMock.X_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.subcomponentRequestsFilterOnDomain(1234, 5678);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.valueFilters).toEqual([{
            field: 'testXField',
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testXField', '>=', 1234), neon.query.where('testXField', '<=', 5678)
            ]),
            prettyField: 'Test X Field',
            value: {
                beginX: 1234,
                endX: 5678
            }
        }]);
    });

    it('subcomponentRequestsFilterOnDomain with string data does update valueFilters and call createOrRemoveNeonFilter', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.xField = DatasetServiceMock.TEXT_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.subcomponentRequestsFilterOnDomain('testText1', 'testText2');

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.valueFilters).toEqual([{
            field: 'testTextField',
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testTextField', '>=', 'testText1'), neon.query.where('testTextField', '<=', 'testText2')
            ]),
            prettyField: 'Test Text Field',
            value: {
                beginX: 'testText1',
                endX: 'testText2'
            }
        }]);
    });

    it('subcomponentRequestsFilterOnDomain does delete previous valueFilters if doNotReplace=false', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.xField = DatasetServiceMock.TEXT_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.valueFilters = [{
            field: 'testTextField',
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testTextField', '>=', 'testText3'), neon.query.where('testTextField', '<=', 'testText4')
            ]),
            prettyField: 'Test Text Field',
            value: {
                beginX: 'testText3',
                endX: 'testText4'
            }
        }];

        component.subcomponentRequestsFilterOnDomain('testText1', 'testText2');

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.valueFilters).toEqual([{
            field: 'testTextField',
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testTextField', '>=', 'testText1'), neon.query.where('testTextField', '<=', 'testText2')
            ]),
            prettyField: 'Test Text Field',
            value: {
                beginX: 'testText1',
                endX: 'testText2'
            }
        }]);
    });

    it('subcomponentRequestsFilterOnDomain does not delete previous valueFilters and does call toggleFilter if doNotReplace=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.xField = DatasetServiceMock.TEXT_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.valueFilters = [{
            field: 'testTextField',
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testTextField', '>=', 'testText3'), neon.query.where('testTextField', '<=', 'testText4')
            ]),
            prettyField: 'Test Text Field',
            value: {
                beginX: 'testText3',
                endX: 'testText4'
            }
        }];

        component.subcomponentRequestsFilterOnDomain('testText1', 'testText2', true);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            field: 'testTextField',
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testTextField', '>=', 'testText3'), neon.query.where('testTextField', '<=', 'testText4')
            ]),
            prettyField: 'Test Text Field',
            value: {
                beginX: 'testText3',
                endX: 'testText4'
            }
        }], {
            field: 'testTextField',
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testTextField', '>=', 'testText1'), neon.query.where('testTextField', '<=', 'testText2')
            ]),
            prettyField: 'Test Text Field',
            value: {
                beginX: 'testText1',
                endX: 'testText2'
            }
        }]);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.valueFilters).toEqual([{
            field: 'testTextField',
            label: '',
            neonFilter: neon.query.and.apply(neon.query, [
                neon.query.where('testTextField', '>=', 'testText3'), neon.query.where('testTextField', '<=', 'testText4')
            ]),
            prettyField: 'Test Text Field',
            value: {
                beginX: 'testText3',
                endX: 'testText4'
            }
        }]);
    });

    it('subcomponentRequestsFilterOnDomain does not remove selectedArea if ignoreSelf=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = true;
        component.options.xField = DatasetServiceMock.X_FIELD;

        component.subcomponentRequestsFilterOnDomain(1, 2);

        expect(component.selectedArea).toEqual({
            height: 4,
            width: 3,
            x: 2,
            y: 1
        });
    });

    it('subcomponentRequestsFilterOnDomain does not update valueFilters or call createOrRemoveNeonFilter if notFilterable=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.notFilterable = true;
        component.options.xField = DatasetServiceMock.X_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.subcomponentRequestsFilterOnDomain(1234, 5678);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.valueFilters).toEqual([]);
    });

    it('subcomponentRequestsFilter with number data does update valueFilters and call createOrRemoveNeonFilter', () => {
        component.options.xField = DatasetServiceMock.X_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.subcomponentRequestsFilter('testCategory', 1234);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.valueFilters).toEqual([{
            field: 'testXField',
            label: '1234',
            neonFilter: neon.query.where('testXField', '=', 1234),
            prettyField: 'Test X Field',
            value: 1234
        }]);
    });

    it('subcomponentRequestsFilter with string data does update valueFilters and call createOrRemoveNeonFilter', () => {
        component.options.xField = DatasetServiceMock.TEXT_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.subcomponentRequestsFilter('testCategory', 'testText1');

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.valueFilters).toEqual([{
            field: 'testTextField',
            label: 'testText1',
            neonFilter: neon.query.where('testTextField', '=', 'testText1'),
            prettyField: 'Test Text Field',
            value: 'testText1'
        }]);
    });

    it('subcomponentRequestsFilter does delete previous valueFilters if doNotReplace=false', () => {
        component.options.xField = DatasetServiceMock.TEXT_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.valueFilters = [{
            field: 'testTextField',
            label: 'testText2',
            neonFilter: neon.query.where('testTextField', '=', 'testText2'),
            prettyField: 'Test Text Field',
            value: 'testText2'
        }];

        component.subcomponentRequestsFilter('testCategory', 'testText1');

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.valueFilters).toEqual([{
            field: 'testTextField',
            label: 'testText1',
            neonFilter: neon.query.where('testTextField', '=', 'testText1'),
            prettyField: 'Test Text Field',
            value: 'testText1'
        }]);
    });

    it('subcomponentRequestsFilter does not delete previous valueFilters and does call toggleFilter if doNotReplace=true', () => {
        component.options.xField = DatasetServiceMock.TEXT_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.valueFilters = [{
            field: 'testTextField',
            label: 'testText2',
            neonFilter: neon.query.where('testTextField', '=', 'testText2'),
            prettyField: 'Test Text Field',
            value: 'testText2'
        }];

        component.subcomponentRequestsFilter('testCategory', 'testText1', true);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            field: 'testTextField',
            label: 'testText2',
            neonFilter: neon.query.where('testTextField', '=', 'testText2'),
            prettyField: 'Test Text Field',
            value: 'testText2'
        }], {
            field: 'testTextField',
            label: 'testText1',
            neonFilter: neon.query.where('testTextField', '=', 'testText1'),
            prettyField: 'Test Text Field',
            value: 'testText1'
        }]);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.valueFilters).toEqual([{
            field: 'testTextField',
            label: 'testText2',
            neonFilter: neon.query.where('testTextField', '=', 'testText2'),
            prettyField: 'Test Text Field',
            value: 'testText2'
        }]);
    });

    it('subcomponentRequestsFilter does not update valueFilters or call createOrRemoveNeonFilter if notFilterable=true', () => {
        component.options.notFilterable = true;
        component.options.xField = DatasetServiceMock.X_FIELD;
        let spy1 = spyOn(component, 'toggleFilter');
        let spy2 = spyOn(component, 'createOrRemoveNeonFilter');

        component.subcomponentRequestsFilter('testCategory', 1234);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.valueFilters).toEqual([]);
    });

    it('subcomponentRequestsRedraw does call stopEventPropagation and changeDetection.detectChanges', () => {
        let spy1 = spyOn(component, 'stopEventPropagation');
        let spy2 = spyOn(component.changeDetection, 'detectChanges');

        component.subcomponentRequestsRedraw({});

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('subcomponentRequestsSelect does update selectedArea and selectedAreaOffset', () => {
        component.selectedAreaOffset = null;

        component.subcomponentRequestsSelect(1, 2, 10, 20);

        expect(component.selectedArea).toEqual({
            height: 20,
            width: 10,
            x: 1,
            y: 2
        });
        expect(component.selectedAreaOffset.x).toBeDefined();
        expect(component.selectedAreaOffset.y).toBeDefined();
    });

    it('options.createBindings does set expected properties in bindings', () => {
        expect(component.options.createBindings()).toEqual({
            configFilter: undefined,
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            hideUnfiltered: false,
            limit: 10000,
            table: 'testTable1',
            title: 'Aggregation',
            unsharedFilterValue: '',
            unsharedFilterField: '',
            aggregationField: '',
            groupField: '',
            xField: '',
            yField: '',
            aggregation: 'count',
            dualView: '',
            granularity: 'year',
            hideGridLines: false,
            hideGridTicks: false,
            ignoreSelf: false,
            lineCurveTension: 0.3,
            lineFillArea: false,
            logScaleX: false,
            logScaleY: false,
            notFilterable: false,
            requireAll: false,
            savePrevious: false,
            scaleMaxX: '',
            scaleMaxY: '',
            scaleMinX: '',
            scaleMinY: '',
            showHeat: false,
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
        component.options.dualView = 'on';
        component.options.granularity = 'day';
        component.options.hideGridLines = true;
        component.options.hideGridTicks = true;
        component.options.ignoreSelf = true;
        component.options.lineCurveTension = 0;
        component.options.lineFillArea = true;
        component.options.logScaleX = true;
        component.options.logScaleY = true;
        component.options.notFilterable = true;
        component.options.requireAll = true;
        component.options.savePrevious = true;
        component.options.scaleMaxX = '44';
        component.options.scaleMaxY = '33';
        component.options.scaleMinX = '22';
        component.options.scaleMinY = '11';
        component.options.showHeat = true;
        component.options.sortByAggregation = true;
        component.options.timeFill = true;
        component.options.type = 'line-xy';
        component.options.yPercentage = 0.5;

        expect(component.options.createBindings()).toEqual({
            configFilter: undefined,
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            hideUnfiltered: false,
            limit: 10000,
            table: 'testTable1',
            title: 'Aggregation',
            unsharedFilterValue: '',
            unsharedFilterField: '',
            aggregationField: 'testSizeField',
            groupField: 'testCategoryField',
            xField: 'testXField',
            yField: 'testYField',
            aggregation: 'sum',
            dualView: 'on',
            granularity: 'day',
            hideGridLines: true,
            hideGridTicks: true,
            ignoreSelf: true,
            lineCurveTension: 0,
            lineFillArea: true,
            logScaleX: true,
            logScaleY: true,
            notFilterable: true,
            requireAll: true,
            savePrevious: true,
            scaleMaxX: '44',
            scaleMaxY: '33',
            scaleMinX: '22',
            scaleMinY: '11',
            showHeat: true,
            sortByAggregation: true,
            timeFill: true,
            type: 'line-xy',
            yPercentage: 0.5
        });
    });

    it('subNgOnDestroy does work as expected', () => {
        let spy1 = spyOn(component.subcomponentMain, 'destroy');
        let spy2 = spyOn(component.subcomponentZoom, 'destroy');

        component.subNgOnDestroy();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('subNgOnInit does initialize main subcomponent', () => {
        let spy = spyOn(component, 'initializeSubcomponent');

        component.subNgOnInit();

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([component.subcomponentMainElementRef]);
    });

    it('subNgOnInit does initialize both main and zoom subcomponents if dualView is truthy', () => {
        let spy = spyOn(component, 'initializeSubcomponent');

        component.options.dualView = 'on';

        component.subNgOnInit();

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(0)).toEqual([component.subcomponentMainElementRef]);
        expect(spy.calls.argsFor(1)).toEqual([component.subcomponentZoomElementRef, true]);
    });

    it('subOnResizeStop does work as expected', () => {
        component.minimumDimensionsMain = null;
        component.minimumDimensionsZoom = null;
        component.selectedAreaOffset = null;

        let spy1 = spyOn(component.subcomponentMain, 'redraw');
        let spy2 = spyOn(component.subcomponentZoom, 'redraw');

        component.subOnResizeStop();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.minimumDimensionsMain.height).toBeDefined();
        expect(component.minimumDimensionsMain.width).toBeDefined();
        expect(component.minimumDimensionsZoom.height).toBeDefined();
        expect(component.minimumDimensionsZoom.width).toBeDefined();
        expect(component.selectedAreaOffset.x).toBeDefined();
        expect(component.selectedAreaOffset.y).toBeDefined();
    });

    it('toggleFilter does add given filter to given empty array and call createOrRemoveNeonFilter', () => {
        let spy = spyOn(component, 'createOrRemoveNeonFilter');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        let filter1 = {
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let filters = [];

        component.toggleFilter(filters, filter1);

        expect(filters).toEqual([filter1]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('toggleFilter does add given filter to given non-empty array and call createOrRemoveNeonFilter', () => {
        let spy = spyOn(component, 'createOrRemoveNeonFilter');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        let filter1 = {
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let neonFilter2 = neon.query.where('field2', '=', 'value2');
        let filter2 = {
            field: 'field2',
            label: '',
            neonFilter: neonFilter2,
            prettyField: 'prettyField2',
            value: 'value2'
        };
        let filters = [filter1];

        component.toggleFilter(filters, filter2);

        expect(filters).toEqual([filter1, filter2]);
        expect(spy.calls.count()).toEqual(1);
    });

    it('toggleFilter does remove given filter from given array and call createOrRemoveNeonFilter', () => {
        let spy1 = spyOn(component, 'createOrRemoveNeonFilter');
        let spy2 = spyOn(component.subcomponentMain, 'deselect');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        let filter1 = {
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let filters = [filter1];

        component.toggleFilter(filters, {
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(filters).toEqual([]);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual(['value1']);
    });

    it('toggleFilter does remove given filter from given multi-element array and call createOrRemoveNeonFilter', () => {
        let spy1 = spyOn(component, 'createOrRemoveNeonFilter');
        let spy2 = spyOn(component.subcomponentMain, 'deselect');

        let neonFilter1 = neon.query.where('field1', '=', 'value1');
        let filter1 = {
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let neonFilter2 = neon.query.where('field2', '=', 'value2');
        let filter2 = {
            field: 'field2',
            label: '',
            neonFilter: neonFilter2,
            prettyField: 'prettyField2',
            value: 'value2'
        };
        let filters = [filter1, filter2];

        component.toggleFilter(filters, {
            field: 'field1',
            label: '',
            neonFilter: neonFilter1,
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(filters).toEqual([filter2]);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual(['value1']);
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

    it('does show filter-container and legend if type is line', async(() => {
        component.options.type = 'line-xy';

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
            expect(filterContainer).not.toBeNull();

            let legend = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container app-legend'));
            expect(legend).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
            expect(bodyContainer).not.toBeNull();
        });
    }));

    it('does show filter-container and legend if type is scatter', async(() => {
        component.options.type = 'scatter-xy';

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
            expect(filterContainer).not.toBeNull();

            let legend = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container app-legend'));
            expect(legend).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
            expect(bodyContainer).not.toBeNull();
        });
    }));

    it('does not show filter-container with no filters or legend if type is not line or scatter', async(() => {
        component.options.type = 'bar-h';

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
            expect(filterContainer).toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
            expect(bodyContainer).toBeNull();
        });
    }));

    it('does not show filter-container if legendGroups is single-element array', async(() => {
        component.options.type = 'bar-h';
        component.legendGroups = ['a'];

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
            expect(filterContainer).toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
            expect(bodyContainer).toBeNull();
        });
    }));

    it('does show filter-container and legend if legendGroups is multiple-element array', async(() => {
        component.options.type = 'bar-h';
        component.legendGroups = ['a', 'b'];

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
            expect(filterContainer).not.toBeNull();

            let legend = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container app-legend'));
            expect(legend).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
            expect(bodyContainer).not.toBeNull();
        });
    }));

    it('does show filter-container and filter-reset elements if groupFilters or valueFilters are non-empty array', async(() => {
        component.options.type = 'bar-h';
        component.groupFilters = [{
            field: 'field1',
            label: 'value1',
            neonFilter: null,
            prettyField: 'prettyField1',
            value: 'value1'
        }];
        component.valueFilters = [{
            field: 'field2',
            label: 'value2',
            neonFilter: null,
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
            expect(filterContainer).not.toBeNull();

            let legend = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container app-legend'));
            expect(legend).toBeNull();

            let filterResets = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container .filter-reset'));
            expect(filterResets.length).toEqual(2);

            let filterLabels = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container .filter-label'));
            expect(filterLabels.length).toEqual(2);

            expect(filterLabels[0].nativeElement.textContent).toContain('value1');
            expect(filterLabels[1].nativeElement.textContent).toContain('value2');

            let filterButtons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container .filter-reset button'));
            expect(filterButtons.length).toEqual(2);

            let filterIcons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .filter-container .filter-reset button mat-icon'));
            expect(filterIcons.length).toEqual(2);

            expect(filterIcons[0].nativeElement.textContent).toEqual('close');
            expect(filterIcons[1].nativeElement.textContent).toEqual('close');

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
            expect(bodyContainer).not.toBeNull();
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

    it('does show subcomponent-container and subcomponent-element', () => {
        let container = fixture.debugElement.query(By.css('mat-sidenav-container .body-container .subcomponent-container'));
        expect(container).not.toBeNull();
        let element = fixture.debugElement.query(By.css(
            'mat-sidenav-container .body-container .subcomponent-container .subcomponent-element'));
        expect(element).not.toBeNull();
    });

    it('does not show subcomponent-selection if selectedArea is null', () => {
        let selection = fixture.debugElement.query(By.css(
            'mat-sidenav-container .body-container .subcomponent-container .subcomponent-selection'));
        expect(selection).toBeNull();
    });

    it('does show subcomponent-selection if selectedArea is not null', async(() => {
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

            let selection = fixture.debugElement.query(By.css(
                'mat-sidenav-container .body-container .subcomponent-container .subcomponent-selection'));
            expect(selection).not.toBeNull();
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
            expect(selects.length).toEqual(11);
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
            expect(options[9].getLabel()).toEqual('Text List (Aggregations)');

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
            expect(selects[6].componentInstance.placeholder).toEqual('Dual View');
            expect(selects[6].componentInstance.required).toEqual(false);
            options = selects[6].componentInstance.options.toArray();
            expect(options.length).toEqual(3);
            expect(options[0].getLabel()).toEqual('Always Off');
            expect(options[0].selected).toEqual(true);
            expect(options[1].getLabel()).toEqual('Always On');
            expect(options[1].selected).toEqual(false);
            expect(options[2].getLabel()).toEqual('Only On Filter');
            expect(options[2].selected).toEqual(false);

            expect(selects[7].componentInstance.disabled).toEqual(false);
            expect(selects[7].componentInstance.placeholder).toEqual('Group Field');
            expect(selects[7].componentInstance.required).toEqual(false);
            options = selects[7].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(false);
            }

            expect(selects[8].componentInstance.disabled).toEqual(false);
            expect(selects[8].componentInstance.placeholder).toEqual('Line Curve Tension');
            expect(selects[8].componentInstance.required).toEqual(false);
            options = selects[8].componentInstance.options.toArray();
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

            expect(selects[9].componentInstance.disabled).toEqual(false);
            expect(selects[9].componentInstance.placeholder).toEqual('Y-Axis Max Width');
            expect(selects[9].componentInstance.required).toEqual(false);
            options = selects[9].componentInstance.options.toArray();
            expect(options.length).toEqual(5);
            expect(options[0].getLabel()).toEqual('10%');
            expect(options[1].getLabel()).toEqual('20%');
            expect(options[2].getLabel()).toEqual('30%');
            expect(options[3].getLabel()).toEqual('40%');
            expect(options[4].getLabel()).toEqual('50%');

            let toggles = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-button-toggle'));
            expect(toggles.length).toEqual(18);
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
            LegendComponent,
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
            { provide: 'notFilterable', useValue: true },
            { provide: 'requireAll', useValue: true },
            { provide: 'savePrevious', useValue: true },
            { provide: 'scaleMaxX', useValue: '44' },
            { provide: 'scaleMaxY', useValue: '33' },
            { provide: 'scaleMinX', useValue: '22' },
            { provide: 'scaleMinY', useValue: '11' },
            { provide: 'showHeat', useValue: true },
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
        expect(component.options.notFilterable).toEqual(true);
        expect(component.options.requireAll).toEqual(true);
        expect(component.options.savePrevious).toEqual(true);
        expect(component.options.scaleMaxX).toEqual('44');
        expect(component.options.scaleMaxY).toEqual('33');
        expect(component.options.scaleMinX).toEqual('22');
        expect(component.options.scaleMinY).toEqual('11');
        expect(component.options.showHeat).toEqual(true);
        expect(component.options.newType).toEqual('scatter');
        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.timeFill).toEqual(true);
        expect(component.options.type).toEqual('scatter');
        expect(component.options.yPercentage).toEqual(0.5);
        expect(component.subcomponentMain.constructor.name).toEqual(ChartJsScatterSubcomponent.name);
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
            expect(options[9].getLabel()).toEqual('Text List (Aggregations)');
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
            expect(selects[7].componentInstance.placeholder).toEqual('Y-Axis Max Width');
            expect(selects[7].componentInstance.required).toEqual(false);
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
            expect(toggles.length).toEqual(16);
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
            LegendComponent,
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
            { provide: 'notFilterable', useValue: true },
            { provide: 'requireAll', useValue: true },
            { provide: 'savePrevious', useValue: true },
            { provide: 'scaleMaxX', useValue: '44' },
            { provide: 'scaleMaxY', useValue: '33' },
            { provide: 'scaleMinX', useValue: '22' },
            { provide: 'scaleMinY', useValue: '11' },
            { provide: 'showHeat', useValue: true },
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
            expect(options[9].getLabel()).toEqual('Text List (Aggregations)');
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
            expect(selects[6].componentInstance.placeholder).toEqual('Y-Axis Max Width');
            expect(selects[6].componentInstance.required).toEqual(false);
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
            expect(toggles.length).toEqual(16);
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
            LegendComponent,
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
            { provide: 'notFilterable', useValue: true },
            { provide: 'requireAll', useValue: true },
            { provide: 'savePrevious', useValue: true },
            { provide: 'scaleMaxX', useValue: '44' },
            { provide: 'scaleMaxY', useValue: '33' },
            { provide: 'scaleMinX', useValue: '22' },
            { provide: 'scaleMinY', useValue: '11' },
            { provide: 'showHeat', useValue: true },
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
            expect(options[9].getLabel()).toEqual('Text List (Aggregations)');
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
            expect(selects[8].componentInstance.placeholder).toEqual('Y-Axis Max Width');
            expect(selects[8].componentInstance.required).toEqual(false);
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
            expect(toggles.length).toEqual(18);
        });
    }));
});
