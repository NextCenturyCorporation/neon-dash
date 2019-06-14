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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Injector } from '@angular/core';
import { } from 'jasmine-core';

import { AggregationModule } from './aggregation.module';

import { AggregationComponent } from './aggregation.component';
import { ChartJsLineSubcomponent } from './subcomponent.chartjs.line';
import { ChartJsScatterSubcomponent } from './subcomponent.chartjs.scatter';

import { AbstractSearchService, AggregationType, CompoundFilterType } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { CompoundFilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { Color } from '../../models/color';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { NeonFieldMetaData, NeonConfig } from '../../models/types';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { ConfigService } from '../../services/config.service';

describe('Component: Aggregation', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;

    let COLOR_1 = new Color('var(--color-set-1)', 'var(--color-set-dark-1)', 'var(--color-set-1-transparency-high)');
    let COLOR_2 = new Color('var(--color-set-2)', 'var(--color-set-dark-2)', 'var(--color-set-2-transparency-high)');

    initializeTestBed('Aggregation', {
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) }
        ],
        imports: [
            AggregationModule
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
        expect(component.options.aggregationField).toEqual(NeonFieldMetaData.get());
        expect(component.options.groupField).toEqual(NeonFieldMetaData.get());
        expect(component.options.xField).toEqual(NeonFieldMetaData.get());
        expect(component.options.yField).toEqual(NeonFieldMetaData.get());

        expect(component.options.aggregation).toEqual(AggregationType.COUNT);
        expect(component.options.dualView).toEqual('');
        expect(component.options.granularity).toEqual('year');
        expect(component.options.hideGridLines).toEqual(false);
        expect(component.options.hideGridTicks).toEqual(false);
        expect(component.options.ignoreSelf).toEqual(true);
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
        expect(component.options.showLegend).toEqual(true);
        expect(component.options.sortByAggregation).toEqual(false);
        expect(component.options.timeFill).toEqual(false);
        expect(component.options.yPercentage).toEqual(0.3);
        expect(component.options.type).toEqual('line');
    });

    it('class properties are set to expected defaults', () => {
        expect(component.colorKeys).toEqual([]);
        expect(component.legendActiveGroups).toEqual([]);
        expect(component.legendDisabledGroups).toEqual([]);
        expect(component.legendGroups).toEqual([]);
        expect(component.minimumDimensionsMain.height).toBeDefined();
        expect(component.minimumDimensionsMain.width).toBeDefined();
        expect(component.minimumDimensionsZoom.height).toBeDefined();
        expect(component.minimumDimensionsZoom.width).toBeDefined();
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

        // Element Refs
        expect(component.headerText).toBeDefined();
        expect(component.hiddenCanvas).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.subcomponentMainElementRef).toBeDefined();
        expect(component.subcomponentZoomElementRef).toBeDefined();
        expect(component.visualization).toBeDefined();
    });

    it('constructVisualization does initialize main subcomponent', () => {
        let spy = spyOn(component, 'initializeSubcomponent');

        component.constructVisualization();

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([component.subcomponentMainElementRef]);
    });

    it('constructVisualization does initialize both main and zoom subcomponents if dualView is truthy', () => {
        let spy = spyOn(component, 'initializeSubcomponent');

        component.options.dualView = 'on';

        component.constructVisualization();

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(0)).toEqual([component.subcomponentMainElementRef]);
        expect(spy.calls.argsFor(1)).toEqual([component.subcomponentZoomElementRef, true]);
    });

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect(actual[0].filterDesign.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filterDesign.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filterDesign.field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect(actual[0].filterDesign.operator).toEqual('!=');
        expect(actual[0].filterDesign.value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawLegend.bind(component).toString());

        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(3);
        expect(actual[0].filterDesign.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filterDesign.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filterDesign.field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect(actual[0].filterDesign.operator).toEqual('!=');
        expect(actual[0].filterDesign.value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawLegend.bind(component).toString());
        expect(actual[1].filterDesign.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[1].filterDesign.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[1].filterDesign.field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(actual[1].filterDesign.operator).toEqual('=');
        expect(actual[1].filterDesign.value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredItems.bind(component).toString());
        expect((actual[2].filterDesign).type).toEqual('and');
        expect((actual[2].filterDesign).filters.length).toEqual(2);
        expect((actual[2].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect((actual[2].filterDesign).filters[0].operator).toEqual('>=');
        expect((actual[2].filterDesign).filters[0].value).toBeUndefined();
        expect((actual[2].filterDesign).filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2].filterDesign).filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2].filterDesign).filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect((actual[2].filterDesign).filters[1].operator).toEqual('<=');
        expect((actual[2].filterDesign).filters[1].value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawDomain.bind(component).toString());

        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect(actual[0].filterDesign.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filterDesign.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filterDesign.field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect(actual[0].filterDesign.operator).toEqual('!=');
        expect(actual[0].filterDesign.value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawLegend.bind(component).toString());
        expect(actual[1].filterDesign.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[1].filterDesign.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[1].filterDesign.field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(actual[1].filterDesign.operator).toEqual('=');
        expect(actual[1].filterDesign.value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredItems.bind(component).toString());
        expect((actual[2].filterDesign).type).toEqual('and');
        expect((actual[2].filterDesign).filters.length).toEqual(2);
        expect((actual[2].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect((actual[2].filterDesign).filters[0].operator).toEqual('>=');
        expect((actual[2].filterDesign).filters[0].value).toBeUndefined();
        expect((actual[2].filterDesign).filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2].filterDesign).filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2].filterDesign).filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect((actual[2].filterDesign).filters[1].operator).toEqual('<=');
        expect((actual[2].filterDesign).filters[1].value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawDomain.bind(component).toString());
        expect((actual[3].filterDesign).type).toEqual('and');
        expect((actual[3].filterDesign).filters.length).toEqual(4);
        expect((actual[3].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect((actual[3].filterDesign).filters[0].operator).toEqual('>=');
        expect((actual[3].filterDesign).filters[0].value).toBeUndefined();
        expect((actual[3].filterDesign).filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3].filterDesign).filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3].filterDesign).filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect((actual[3].filterDesign).filters[1].operator).toEqual('<=');
        expect((actual[3].filterDesign).filters[1].value).toBeUndefined();
        expect((actual[3].filterDesign).filters[2].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3].filterDesign).filters[2].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3].filterDesign).filters[2].field).toEqual(DashboardServiceMock.FIELD_MAP.Y);
        expect((actual[3].filterDesign).filters[2].operator).toEqual('>=');
        expect((actual[3].filterDesign).filters[2].value).toBeUndefined();
        expect((actual[3].filterDesign).filters[3].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3].filterDesign).filters[3].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3].filterDesign).filters[3].field).toEqual(DashboardServiceMock.FIELD_MAP.Y);
        expect((actual[3].filterDesign).filters[3].operator).toEqual('<=');
        expect((actual[3].filterDesign).filters[3].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawBounds.bind(component).toString());
    });

    it('finalizeVisualizationQuery does return expected count aggregation query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testXField',
                name: '_aggregation',
                type: 'count'
            }],
            filter: {
                field: 'testXField',
                operator: '!=',
                value: null
            },
            groups: ['testXField'],
            sort: {
                field: 'testXField',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected non-count aggregation query with optional fields', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.limit = 100;
        component.options.sortByAggregation = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testSizeField',
                name: '_aggregation',
                type: 'sum'
            }],
            filter: {
                field: 'testXField',
                operator: '!=',
                value: null
            },
            groups: ['testXField', 'testCategoryField'],
            sort: {
                field: '_aggregation',
                order: -1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected XY query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                filters: [{
                    field: 'testXField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testYField',
                    operator: '!=',
                    value: null
                }],
                type: 'and'
            },
            groups: ['testXField', 'testYField', 'testCategoryField'],
            sort: {
                field: 'testXField',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected count aggregation query with filters', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        expect(component.finalizeVisualizationQuery(component.options, {}, [{
            field: 'testConfigFilterField',
            operator: '=',
            value: 'testConfigFilterValue'
        }, {
            field: 'testFilterField',
            operator: '=',
            value: 'testFilterValue'
        }])).toEqual({
            aggregation: [{
                field: 'testCategoryField',
                name: '_aggregation',
                type: 'count'
            }],
            filter: {
                filters: [{
                    field: 'testConfigFilterField',
                    operator: '=',
                    value: 'testConfigFilterValue'
                }, {
                    field: 'testFilterField',
                    operator: '=',
                    value: 'testFilterValue'
                }, {
                    field: 'testXField',
                    operator: '!=',
                    value: null
                }],
                type: 'and'
            },
            groups: ['testXField', 'testCategoryField'],
            sort: {
                field: 'testXField',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected non-count aggregation query with filters', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        expect(component.finalizeVisualizationQuery(component.options, {}, [{
            field: 'testConfigFilterField',
            operator: '=',
            value: 'testConfigFilterValue'
        }, {
            field: 'testFilterField',
            operator: '=',
            value: 'testFilterValue'
        }])).toEqual({
            aggregation: [{
                field: 'testSizeField',
                name: '_aggregation',
                type: 'sum'
            }],
            filter: {
                filters: [{
                    field: 'testConfigFilterField',
                    operator: '=',
                    value: 'testConfigFilterValue'
                }, {
                    field: 'testFilterField',
                    operator: '=',
                    value: 'testFilterValue'
                }, {
                    field: 'testXField',
                    operator: '!=',
                    value: null
                }],
                type: 'and'
            },
            groups: ['testXField', 'testCategoryField'],
            sort: {
                field: 'testXField',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected XY query with filters', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        expect(component.finalizeVisualizationQuery(component.options, {}, [{
            field: 'testConfigFilterField',
            operator: '=',
            value: 'testConfigFilterValue'
        }, {
            field: 'testFilterField',
            operator: '=',
            value: 'testFilterValue'
        }])).toEqual({
            filter: {
                filters: [{
                    field: 'testConfigFilterField',
                    operator: '=',
                    value: 'testConfigFilterValue'
                }, {
                    field: 'testFilterField',
                    operator: '=',
                    value: 'testFilterValue'
                }, {
                    field: 'testXField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testYField',
                    operator: '!=',
                    value: null
                }],
                type: 'and'
            },
            groups: ['testXField', 'testYField', 'testCategoryField'],
            sort: {
                field: 'testXField',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected date count aggregation query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testDateField',
                name: '_date',
                type: 'min'
            }, {
                field: 'testCategoryField',
                name: '_aggregation',
                type: 'count'
            }],
            filter: {
                field: 'testDateField',
                operator: '!=',
                value: null
            },
            groups: [{
                field: 'testDateField',
                type: 'year'
            }, 'testCategoryField'],
            sort: {
                field: '_date',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected date non-count aggregation query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testDateField',
                name: '_date',
                type: 'min'
            }, {
                field: 'testSizeField',
                name: '_aggregation',
                type: 'sum'
            }],
            filter: {
                field: 'testDateField',
                operator: '!=',
                value: null
            },
            groups: [{
                field: 'testDateField',
                type: 'year'
            }, 'testCategoryField'],
            sort: {
                field: '_date',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected date XY query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testDateField',
                name: '_date',
                type: 'min'
            }],
            filter: {
                filters: [{
                    field: 'testDateField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testYField',
                    operator: '!=',
                    value: null
                }],
                type: 'and'
            },
            groups: [{
                field: 'testDateField',
                type: 'year'
            }, 'testYField', 'testCategoryField'],
            sort: {
                field: '_date',
                order: 1
            }
        });
    });

    it('finalizeVisualizationQuery does add multiple groups to date query if needed', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.granularity = 'minute';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testDateField',
                name: '_date',
                type: 'min'
            }, {
                field: 'testSizeField',
                name: '_aggregation',
                type: 'sum'
            }],
            filter: {
                field: 'testDateField',
                operator: '!=',
                value: null
            },
            groups: [{
                field: 'testDateField',
                type: 'minute'
            }, {
                field: 'testDateField',
                type: 'hour'
            }, {
                field: 'testDateField',
                type: 'dayOfMonth'
            }, {
                field: 'testDateField',
                type: 'month'
            }, {
                field: 'testDateField',
                type: 'year'
            }, 'testCategoryField'],
            sort: {
                field: '_date',
                order: 1
            }
        });
    });

    it('destroyVisualization does work as expected', () => {
        let spy1 = spyOn(component.subcomponentMain, 'destroy');
        let spy2 = spyOn(component.subcomponentZoom, 'destroy');

        component.destroyVisualization();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getHiddenCanvas does return hiddenCanvas', () => {
        expect(component.getHiddenCanvas()).toEqual(component.hiddenCanvas);
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

    it('handleChangeSubcomponentType does update subcomponent type and call expected functions', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.type = 'line-xy';

        component.handleChangeSubcomponentType();

        expect(component.options.sortByAggregation).toEqual(false);
        expect(component.options.type).toEqual('line-xy');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does not update dualView if new type is allowed to have dual views', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.type = 'line-xy';
        component.options.dualView = 'on';

        component.handleChangeSubcomponentType();

        expect(component.options.dualView).toEqual('on');
        expect(component.options.type).toEqual('line-xy');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does update dualView if new type is not allowed to have dual views', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.type = 'bar-h';
        component.options.dualView = 'on';

        component.handleChangeSubcomponentType();

        expect(component.options.dualView).toEqual('');
        expect(component.options.type).toEqual('bar-h');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does update sortByAggregation if new type is not sortable by aggregation', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.type = 'line-xy';
        component.options.sortByAggregation = true;

        component.handleChangeSubcomponentType();

        expect(component.options.sortByAggregation).toEqual(false);
        expect(component.options.type).toEqual('line-xy');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does not update sortByAggregation if new type is sortable by aggregation', () => {
        let spy = spyOn(component, 'redrawSubcomponents');
        component.options.type = 'bar-h';
        component.options.sortByAggregation = true;

        component.handleChangeSubcomponentType();

        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.type).toEqual('bar-h');
        expect(spy.calls.count()).toEqual(1);
    });

    it('handleLegendItemSelected does call toggleFilters', () => {
        let spy = spyOn(component, 'toggleFilters');

        // Does not work with no groupField.
        component.handleLegendItemSelected({
            value: 'testValue'
        });
        expect(spy.calls.count()).toEqual(0);

        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        // Does not work with no value.
        component.handleLegendItemSelected({});
        expect(spy.calls.count()).toEqual(0);

        // Does work with groupField and value.
        component.handleLegendItemSelected({
            value: 'testValue'
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testValue'
        } as SimpleFilterDesign]]);
    });

    it('handleLegendItemSelected does not call toggleFilters if notFilterable=true', () => {
        let spy = spyOn(component, 'toggleFilters');

        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.notFilterable = true;

        component.handleLegendItemSelected({
            value: 'testValue'
        });

        expect(spy.calls.count()).toEqual(0);
    });

    it('initializeSubcomponent does return expected object', () => {
        let subcomponentObject = component.initializeSubcomponent(component.subcomponentMainElementRef);
        expect(subcomponentObject.constructor.name).toEqual(ChartJsLineSubcomponent.name);
    });

    it('onChangeData does work as expected', () => {
        component.colorKeys = ['red', 'blue', 'green'];
        component.legendActiveGroups = ['a'];
        component.legendDisabledGroups = ['b'];
        component.legendGroups = ['a', 'b'];
        component.xList = [1, 2];
        component.yList = [3, 4];

        component.onChangeData();

        expect(component.colorKeys).toEqual([]);
        expect(component.legendActiveGroups).toEqual([]);
        expect(component.legendGroups).toEqual([]);
        expect(component.xList).toEqual([]);
        expect(component.yList).toEqual([]);

        // Keep disabled legend groups!
        expect(component.legendDisabledGroups).toEqual(['b']);
    });

    it('redrawBounds does call subcomponentMain.select and refreshVisualization', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[{
            beginX: 12,
            endX: 56,
            beginY: 34,
            endY: 78
        }]]);
        expect(spyRedraw.calls.count()).toEqual(1);
    });

    it('redrawBounds does update selectedArea', () => {
        // TODO THOR-1057
    });

    it('redrawBounds does deselect', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        component.selectedArea = {
            height: 20,
            width: 10,
            x: 1,
            y: 2
        };

        (component as any).redrawBounds([]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);
        expect(component.selectedArea).toEqual(null);
    });

    it('redrawBounds does accept filters with rearranged nested filters', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[{
            beginX: 12,
            endX: 56,
            beginY: 34,
            endY: 78
        }]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(0)).toEqual([[{
            beginX: 12,
            endX: 56,
            beginY: 34,
            endY: 78
        }]]);
        expect(spyRedraw.calls.count()).toEqual(2);
    });

    it('redrawBounds does ignore filters with incompatible designs', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        (component as any).redrawBounds([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '>=',
            value: 12
        } as SimpleFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(1)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(2);

        (component as any).redrawBounds([{
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(3);
        expect(spySelect.calls.argsFor(2)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(3);

        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '!=',
                value: 90
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(4);
        expect(spySelect.calls.argsFor(3)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(4);
    });

    it('redrawBounds does ignore filters with incompatible databases/tables/fields', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        // Different database
        component.options.database = DashboardServiceMock.DATABASES.testDatabase2;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        // Different table
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(1)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(2);

        // Different xField
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.SIZE;
        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(3);
        expect(spySelect.calls.argsFor(2)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(3);

        // Different yField
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.SIZE;
        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(4);
        expect(spySelect.calls.argsFor(3)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(4);
    });

    it('redrawDomain does call subcomponentMain.select and refreshVisualization', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        (component as any).redrawDomain([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 34
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[{
            beginX: 12,
            endX: 34
        }]]);
        expect(spyRedraw.calls.count()).toEqual(1);
    });

    it('redrawDomain does update selectedArea', () => {
        // TODO THOR-1057
    });

    it('redrawDomain does deselect', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.selectedArea = {
            height: 20,
            width: 10,
            x: 1,
            y: 2
        };

        (component as any).redrawDomain([]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);
        expect(component.selectedArea).toEqual(null);
    });

    it('redrawDomain does accept filters with rearranged nested filters', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        (component as any).redrawDomain([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[{
            beginX: 12,
            endX: 34
        }]]);
        expect(spyRedraw.calls.count()).toEqual(1);
    });

    it('redrawDomain does ignore filters with incompatible designs', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        (component as any).redrawDomain([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '>=',
            value: 12
        } as SimpleFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        (component as any).redrawDomain([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(1)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(2);
    });

    it('redrawDomain does ignore filters with incompatible databases/tables/fields', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        // Different database
        component.options.database = DashboardServiceMock.DATABASES.testDatabase2;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        (component as any).redrawDomain([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 34
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        // Different table
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        (component as any).redrawDomain([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 34
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(1)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(2);

        // Different xField
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.SIZE;
        (component as any).redrawDomain([{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 34
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]);

        expect(spySelect.calls.count()).toEqual(3);
        expect(spySelect.calls.argsFor(2)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(3);
    });

    it('redrawFilteredItems does call subcomponentMain.select and refreshVisualization', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        (component as any).redrawFilteredItems([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([['testValue1']]);
        expect(spyRedraw.calls.count()).toEqual(1);
    });

    it('redrawFilteredItems does also work with multiple filters', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        (component as any).redrawFilteredItems([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterDesign, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 'testValue2'
        } as SimpleFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([['testValue1', 'testValue2']]);
        expect(spyRedraw.calls.count()).toEqual(1);
    });

    it('redrawFilteredItems does deselect', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        (component as any).redrawFilteredItems([]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);
    });

    it('redrawFilteredItems does ignore filters with incompatible databases/tables/fields', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        // Different database
        component.options.database = DashboardServiceMock.DATABASES.testDatabase2;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        (component as any).redrawFilteredItems([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterDesign]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        // Different table
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        (component as any).redrawFilteredItems([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterDesign]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(1)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(2);

        // Different xField
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.TEXT;
        (component as any).redrawFilteredItems([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterDesign]);

        expect(spySelect.calls.count()).toEqual(3);
        expect(spySelect.calls.argsFor(2)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(3);
    });

    it('redrawFilteredItems does not error if subcomponentMain is not an object', () => {
        component.subcomponentMain = null;
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        (component as any).redrawFilteredItems([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterDesign]);

        expect(spyRedraw.calls.count()).toEqual(0);
    });

    it('redrawLegend does update legendActiveGroups and legendDisabledGroups (but not legendGroups)', () => {
        component.legendGroups = ['testGroup1', 'testGroup2', 'testGroup3'];
        component.legendActiveGroups = [];
        component.legendDisabledGroups = [];

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        (component as any).redrawLegend([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testGroup2'
        } as SimpleFilterDesign]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual(['testGroup1', 'testGroup3']);
        expect(component.legendDisabledGroups).toEqual(['testGroup2']);
    });

    it('redrawLegend does also work with multiple filters', () => {
        component.legendGroups = ['testGroup1', 'testGroup2', 'testGroup3'];
        component.legendActiveGroups = [];
        component.legendDisabledGroups = [];

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        (component as any).redrawLegend([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testGroup1'
        } as SimpleFilterDesign, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testGroup2'
        } as SimpleFilterDesign, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testGroup3'
        } as SimpleFilterDesign]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual([]);
        expect(component.legendDisabledGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
    });

    it('redrawLegend with no filters does activate all groups', () => {
        component.legendGroups = ['testGroup1', 'testGroup2', 'testGroup3'];
        component.legendActiveGroups = ['testGroup2'];
        component.legendDisabledGroups = ['testGroup1', 'testGroup3'];

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        (component as any).redrawLegend([]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendDisabledGroups).toEqual([]);
    });

    it('redrawLegend does change previous legendActiveGroups and legendDisabledGroups (but not legendGroups)', () => {
        component.legendGroups = ['testGroup1', 'testGroup2', 'testGroup3'];
        component.legendActiveGroups = ['testGroup1'];
        component.legendDisabledGroups = ['testGroup2', 'testGroup3'];

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        (component as any).redrawLegend([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testGroup2'
        } as SimpleFilterDesign]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual(['testGroup1', 'testGroup3']);
        expect(component.legendDisabledGroups).toEqual(['testGroup2']);
    });

    it('redrawLegend does ignore filters with incompatible databases/tables/fields', () => {
        component.legendGroups = ['testGroup1', 'testGroup2', 'testGroup3'];
        component.legendActiveGroups = [];
        component.legendDisabledGroups = [];

        // Different database
        component.options.database = DashboardServiceMock.DATABASES.testDatabase2;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        (component as any).redrawLegend([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '!=',
            value: 'testGroup1'
        } as SimpleFilterDesign]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendDisabledGroups).toEqual([]);

        // Different table
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        (component as any).redrawLegend([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '!=',
            value: 'testGroup1'
        } as SimpleFilterDesign]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendDisabledGroups).toEqual([]);

        // Different groupField
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.TEXT;
        (component as any).redrawLegend([{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '!=',
            value: 'testGroup1'
        } as SimpleFilterDesign]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendDisabledGroups).toEqual([]);
    });

    it('shouldFilterSelf does return expected boolean', () => {
        component.options.ignoreSelf = false;
        component.options.dualView = false;
        expect((component as any).shouldFilterSelf()).toEqual(true);

        component.options.ignoreSelf = false;
        component.options.dualView = true;
        expect((component as any).shouldFilterSelf()).toEqual(true);

        component.options.ignoreSelf = true;
        component.options.dualView = true;
        expect((component as any).shouldFilterSelf()).toEqual(true);

        component.options.ignoreSelf = true;
        component.options.dualView = false;
        expect((component as any).shouldFilterSelf()).toEqual(false);
    });

    it('validateVisualizationQuery does return expected boolean', () => {
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.table = DashboardServiceMock.TABLES.testTable1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        expect(component.validateVisualizationQuery(component.options)).toEqual(true);

        component.options.aggregation = AggregationType.SUM;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        expect(component.validateVisualizationQuery(component.options)).toEqual(true);
    });

    it('validateVisualizationQuery with XY subcomponent does return expected boolean', () => {
        component.options.type = 'line-xy';

        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.table = DashboardServiceMock.TABLES.testTable1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        expect(component.validateVisualizationQuery(component.options)).toEqual(true);
    });

    it('transformVisualizationQueryResults with XY data does return expected data', () => {
        component.options.countByAggregation = true;
        component.options.type = 'line-xy';
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            testXField: 1,
            testYField: 2
        }, {
            testXField: 3,
            testYField: 4
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
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
    });

    it('transformVisualizationQueryResults with aggregated data does return expected data', () => {
        component.options.countByAggregation = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _aggregation: 2,
            testXField: 1
        }, {
            _aggregation: 4,
            testXField: 3
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
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
    });

    it('transformVisualizationQueryResults with XY data and groups does create groups', () => {
        component.options.countByAggregation = true;
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
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
        }]);

        expect(component.legendActiveGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b']);
        expect(actual).toEqual(4);
        expect(component.aggregationData).toEqual([{
            color: COLOR_1,
            group: 'a',
            x: 1,
            y: 2
        }, {
            color: COLOR_1,
            group: 'a',
            x: 3,
            y: 4
        }, {
            color: COLOR_2,
            group: 'b',
            x: 5,
            y: 6
        }, {
            color: COLOR_2,
            group: 'b',
            x: 7,
            y: 8
        }]);
        expect(component.xList).toEqual([1, 3, 5, 7]);
        expect(component.yList).toEqual([2, 4, 6, 8]);
    });

    it('transformVisualizationQueryResults with aggregated data and groups does create groups', () => {
        component.options.countByAggregation = true;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        let actual = component.transformVisualizationQueryResults(component.options, [{
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
        }]);

        expect(component.legendActiveGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b']);
        expect(actual).toEqual(4);
        expect(component.aggregationData).toEqual([{
            color: COLOR_1,
            group: 'a',
            x: 1,
            y: 2
        }, {
            color: COLOR_1,
            group: 'a',
            x: 3,
            y: 4
        }, {
            color: COLOR_2,
            group: 'b',
            x: 5,
            y: 6
        }, {
            color: COLOR_2,
            group: 'b',
            x: 7,
            y: 8
        }]);
        expect(component.xList).toEqual([1, 3, 5, 7]);
        expect(component.yList).toEqual([2, 4, 6, 8]);
    });

    it('transformVisualizationQueryResults with disabled legend groups does create expected legend groups', () => {
        component.options.countByAggregation = true;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        component.legendDisabledGroups = ['a'];
        component.transformVisualizationQueryResults(component.options, [{
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
            testCategoryField: 'c',
            testXField: 7,
            testYField: 8
        }]);
        expect(component.legendActiveGroups).toEqual(['b', 'c']);
        expect(component.legendDisabledGroups).toEqual(['a']);
        expect(component.legendGroups).toEqual(['a', 'b', 'c']);

        component.legendDisabledGroups = ['a', 'b'];
        component.transformVisualizationQueryResults(component.options, [{
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
            testCategoryField: 'c',
            testXField: 7
        }]);
        expect(component.legendActiveGroups).toEqual(['c']);
        expect(component.legendDisabledGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b', 'c']);

        component.legendDisabledGroups = ['a', 'b', 'c'];
        component.transformVisualizationQueryResults(component.options, [{
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
            testCategoryField: 'c',
            testXField: 7,
            testYField: 8
        }]);
        expect(component.legendActiveGroups).toEqual([]);
        expect(component.legendDisabledGroups).toEqual(['a', 'b', 'c']);
        expect(component.legendGroups).toEqual(['a', 'b', 'c']);
    });

    it('transformVisualizationQueryResults with XY date data does return expected data', () => {
        component.options.countByAggregation = true;
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _date: '2018-01-01T00:00:00.000Z',
            testYField: 2
        }, {
            _date: '2018-01-03T00:00:00.000Z',
            testYField: 4
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
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
    });

    it('transformVisualizationQueryResults with aggregated date data does return expected data', () => {
        component.options.countByAggregation = true;
        component.options.granularity = 'day';
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _aggregation: 2,
            _date: '2018-01-01T00:00:00.000Z'
        }, {
            _aggregation: 4,
            _date: '2018-01-03T00:00:00.000Z'
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
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
    });

    it('transformVisualizationQueryResults with savePrevious=true does keep previous xList string data', () => {
        component.options.countByAggregation = true;
        component.options.savePrevious = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.xList = ['z', 'a', 'b', 'c', 'd'];

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _aggregation: 2,
            testTextField: 'a'
        }, {
            _aggregation: 4,
            testTextField: 'c'
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
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
    });

    it('transformVisualizationQueryResults with savePrevious=true does keep previous xList number data', () => {
        component.options.countByAggregation = true;
        component.options.savePrevious = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.xList = [0, 1, 2, 3, 4];

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _aggregation: 2,
            testXField: 1
        }, {
            _aggregation: 4,
            testXField: 3
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
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
    });

    it('transformVisualizationQueryResults with savePrevious=true does keep previous xList date data', () => {
        component.options.countByAggregation = true;
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.savePrevious = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        component.xList = ['2018-01-01T00:00:00.000Z',
            '2018-01-02T00:00:00.000Z',
            '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z',
            '2018-01-05T00:00:00.000Z'];

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _date: '2018-01-02T00:00:00.000Z',
            testYField: 2
        }, {
            _date: '2018-01-04T00:00:00.000Z',
            testYField: 4
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
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
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z',
            '2018-01-02T00:00:00.000Z',
            '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z',
            '2018-01-05T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 4]);
    });

    it('transformVisualizationQueryResults with timeFill=true does add empty dates if needed', () => {
        component.options.countByAggregation = true;
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.timeFill = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _date: '2018-01-01T00:00:00.000Z',
            testYField: 2
        }, {
            _date: '2018-01-03T00:00:00.000Z',
            testYField: 4
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(3);
        expect(component.aggregationData).toEqual([{
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
    });

    it('transformVisualizationQueryResults with timeFill=true does not add empty dates if not needed', () => {
        component.options.countByAggregation = true;
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.timeFill = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
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
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(4);
        expect(component.aggregationData).toEqual([{
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
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z',
            '2018-01-02T00:00:00.000Z',
            '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 3, 4, 5]);
    });

    it('transformVisualizationQueryResults with timeFill=true and groups does add empty dates to separate groups if needed', () => {
        component.options.countByAggregation = true;
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.timeFill = true;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
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
        }]);

        expect(component.legendActiveGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b']);
        expect(actual).toEqual(8);
        expect(component.aggregationData).toEqual([{
            color: COLOR_1,
            group: 'a',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            color: COLOR_1,
            group: 'a',
            x: '2018-01-02T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_1,
            group: 'a',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }, {
            color: COLOR_1,
            group: 'a',
            x: '2018-01-04T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_2,
            group: 'b',
            x: '2018-01-01T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_2,
            group: 'b',
            x: '2018-01-02T00:00:00.000Z',
            y: 3
        }, {
            color: COLOR_2,
            group: 'b',
            x: '2018-01-03T00:00:00.000Z',
            y: 0
        }, {
            color: COLOR_2,
            group: 'b',
            x: '2018-01-04T00:00:00.000Z',
            y: 5
        }]);
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z',
            '2018-01-02T00:00:00.000Z',
            '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 0, 4, 3, 5]);
    });

    it('transformVisualizationQueryResults with savePrevious=true and timeFill=true does work as expected', () => {
        component.options.countByAggregation = true;
        component.options.type = 'line-xy';
        component.options.granularity = 'day';
        component.options.savePrevious = true;
        component.options.timeFill = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        component.xList = ['2018-01-01T00:00:00.000Z',
            '2018-01-02T00:00:00.000Z',
            '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z',
            '2018-01-05T00:00:00.000Z'];

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _date: '2018-01-02T00:00:00.000Z',
            testYField: 2
        }, {
            _date: '2018-01-04T00:00:00.000Z',
            testYField: 4
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(5);
        expect(component.aggregationData).toEqual([{
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
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z',
            '2018-01-02T00:00:00.000Z',
            '2018-01-03T00:00:00.000Z',
            '2018-01-04T00:00:00.000Z',
            '2018-01-05T00:00:00.000Z']);
        expect(component.yList).toEqual([0, 2, 4]);
    });

    it('transformVisualizationQueryResults with XY data and countByAggregation=false does return expected data', () => {
        component.options.countByAggregation = false;
        component.options.type = 'line-xy';
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            testXField: 1,
            testYField: 2
        }, {
            testXField: 3,
            testYField: 4
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(6);
        expect(component.aggregationData).toEqual([{
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
    });

    it('transformVisualizationQueryResults with aggregated data and countByAggregation=false does return expected data', () => {
        component.options.countByAggregation = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _aggregation: 2,
            testXField: 1
        }, {
            _aggregation: 4,
            testXField: 3
        }]);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(6);
        expect(component.aggregationData).toEqual([{
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
    });

    it('transformVisualizationQueryResults with no data does work as expected', () => {
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, []);
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(0);
        expect(component.aggregationData).toEqual([]);
        expect(component.xList).toEqual([]);
        expect(component.yList).toEqual([]);
    });

    it('optionsAggregationIsNotCount does return expected boolean', () => {
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'bar-h' })).toEqual(false);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'bar-v' })).toEqual(false);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'doughnut' })).toEqual(false);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'histogram' })).toEqual(false);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'pie' })).toEqual(false);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'line' })).toEqual(false);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'scatter' })).toEqual(false);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'table' })).toEqual(false);

        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'line-xy' })).toEqual(false);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.COUNT, type: 'scatter-xy' })).toEqual(false);

        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'bar-h' })).toEqual(true);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'bar-v' })).toEqual(true);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'doughnut' })).toEqual(true);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'histogram' })).toEqual(true);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'pie' })).toEqual(true);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'line' })).toEqual(true);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'scatter' })).toEqual(true);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'table' })).toEqual(true);

        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'line-xy' })).toEqual(false);
        expect(component.optionsAggregationIsNotCount({ aggregation: AggregationType.SUM, type: 'scatter-xy' })).toEqual(false);
    });

    it('optionsTypeIsContinuous does return expected boolean', () => {
        expect(component.optionsTypeIsContinuous({ type: 'histogram' })).toEqual(true);
        expect(component.optionsTypeIsContinuous({ type: 'line' })).toEqual(true);
        expect(component.optionsTypeIsContinuous({ type: 'line-xy' })).toEqual(true);
        expect(component.optionsTypeIsContinuous({ type: 'scatter' })).toEqual(true);
        expect(component.optionsTypeIsContinuous({ type: 'scatter-xy' })).toEqual(true);

        expect(component.optionsTypeIsContinuous({ type: 'bar-h' })).toEqual(false);
        expect(component.optionsTypeIsContinuous({ type: 'bar-v' })).toEqual(false);
        expect(component.optionsTypeIsContinuous({ type: 'doughnut' })).toEqual(false);
        expect(component.optionsTypeIsContinuous({ type: 'pie' })).toEqual(false);
        expect(component.optionsTypeIsContinuous({ type: 'table' })).toEqual(false);
    });

    it('optionsTypeIsDualViewCompatible does return expected boolean', () => {
        expect(component.optionsTypeIsDualViewCompatible({ type: 'histogram' })).toEqual(true);
        expect(component.optionsTypeIsDualViewCompatible({ type: 'line' })).toEqual(true);
        expect(component.optionsTypeIsDualViewCompatible({ type: 'line-xy' })).toEqual(true);

        expect(component.optionsTypeIsDualViewCompatible({ type: 'bar-h' })).toEqual(false);
        expect(component.optionsTypeIsDualViewCompatible({ type: 'bar-v' })).toEqual(false);
        expect(component.optionsTypeIsDualViewCompatible({ type: 'doughnut' })).toEqual(false);
        expect(component.optionsTypeIsDualViewCompatible({ type: 'pie' })).toEqual(false);
        expect(component.optionsTypeIsDualViewCompatible({ type: 'scatter' })).toEqual(false);
        expect(component.optionsTypeIsDualViewCompatible({ type: 'scatter-xy' })).toEqual(false);
        expect(component.optionsTypeIsDualViewCompatible({ type: 'table' })).toEqual(false);
    });

    it('optionsTypeIsLine does return expected boolean', () => {
        expect(component.optionsTypeIsLine({ type: 'line' })).toEqual(true);
        expect(component.optionsTypeIsLine({ type: 'line-xy' })).toEqual(true);

        expect(component.optionsTypeIsLine({ type: 'bar-h' })).toEqual(false);
        expect(component.optionsTypeIsLine({ type: 'bar-v' })).toEqual(false);
        expect(component.optionsTypeIsLine({ type: 'doughnut' })).toEqual(false);
        expect(component.optionsTypeIsLine({ type: 'histogram' })).toEqual(false);
        expect(component.optionsTypeIsLine({ type: 'pie' })).toEqual(false);
        expect(component.optionsTypeIsLine({ type: 'scatter' })).toEqual(false);
        expect(component.optionsTypeIsLine({ type: 'scatter-xy' })).toEqual(false);
        expect(component.optionsTypeIsLine({ type: 'table' })).toEqual(false);
    });

    it('optionsTypeIsList does return expected boolean', () => {
        expect(component.optionsTypeIsList({ type: 'list' })).toEqual(true);

        expect(component.optionsTypeIsList({ type: 'bar-h' })).toEqual(false);
        expect(component.optionsTypeIsList({ type: 'bar-v' })).toEqual(false);
        expect(component.optionsTypeIsList({ type: 'doughnut' })).toEqual(false);
        expect(component.optionsTypeIsList({ type: 'histogram' })).toEqual(false);
        expect(component.optionsTypeIsList({ type: 'line' })).toEqual(false);
        expect(component.optionsTypeIsList({ type: 'line-xy' })).toEqual(false);
        expect(component.optionsTypeIsList({ type: 'pie' })).toEqual(false);
        expect(component.optionsTypeIsList({ type: 'scatter' })).toEqual(false);
        expect(component.optionsTypeIsList({ type: 'scatter-xy' })).toEqual(false);
        expect(component.optionsTypeIsList({ type: 'table' })).toEqual(false);
    });

    it('optionsTypeIsNotXY does return expected boolean', () => {
        expect(component.optionsTypeIsNotXY({ type: 'bar-h' })).toEqual(true);
        expect(component.optionsTypeIsNotXY({ type: 'bar-v' })).toEqual(true);
        expect(component.optionsTypeIsNotXY({ type: 'doughnut' })).toEqual(true);
        expect(component.optionsTypeIsNotXY({ type: 'histogram' })).toEqual(true);
        expect(component.optionsTypeIsNotXY({ type: 'pie' })).toEqual(true);
        expect(component.optionsTypeIsNotXY({ type: 'line' })).toEqual(true);
        expect(component.optionsTypeIsNotXY({ type: 'scatter' })).toEqual(true);
        expect(component.optionsTypeIsNotXY({ type: 'table' })).toEqual(true);

        expect(component.optionsTypeIsNotXY({ type: 'line-xy' })).toEqual(false);
        expect(component.optionsTypeIsNotXY({ type: 'scatter-xy' })).toEqual(false);
    });

    it('optionsTypeUsesGrid does return expected boolean', () => {
        expect(component.optionsTypeUsesGrid({ type: 'bar-h' })).toEqual(true);
        expect(component.optionsTypeUsesGrid({ type: 'bar-v' })).toEqual(true);
        expect(component.optionsTypeUsesGrid({ type: 'histogram' })).toEqual(true);
        expect(component.optionsTypeUsesGrid({ type: 'line' })).toEqual(true);
        expect(component.optionsTypeUsesGrid({ type: 'line-xy' })).toEqual(true);
        expect(component.optionsTypeUsesGrid({ type: 'scatter' })).toEqual(true);
        expect(component.optionsTypeUsesGrid({ type: 'scatter-xy' })).toEqual(true);

        expect(component.optionsTypeUsesGrid({ type: 'doughnut' })).toEqual(false);
        expect(component.optionsTypeUsesGrid({ type: 'pie' })).toEqual(false);
        expect(component.optionsTypeUsesGrid({ type: 'table' })).toEqual(false);
    });

    it('optionsTypeIsXY does return expected boolean', () => {
        expect(component.optionsTypeIsXY({ type: 'bar-h' })).toEqual(false);
        expect(component.optionsTypeIsXY({ type: 'bar-v' })).toEqual(false);
        expect(component.optionsTypeIsXY({ type: 'doughnut' })).toEqual(false);
        expect(component.optionsTypeIsXY({ type: 'histogram' })).toEqual(false);
        expect(component.optionsTypeIsXY({ type: 'pie' })).toEqual(false);
        expect(component.optionsTypeIsXY({ type: 'line' })).toEqual(false);
        expect(component.optionsTypeIsXY({ type: 'scatter' })).toEqual(false);
        expect(component.optionsTypeIsXY({ type: 'table' })).toEqual(false);

        expect(component.optionsTypeIsXY({ type: 'line-xy' })).toEqual(true);
        expect(component.optionsTypeIsXY({ type: 'scatter-xy' })).toEqual(true);
    });

    it('optionsXFieldIsDate does return expected boolean', () => {
        expect(component.optionsXFieldIsDate({ xField: { type: 'date' } })).toEqual(true);

        expect(component.optionsXFieldIsDate({ xField: { type: 'boolean' } })).toEqual(false);
        expect(component.optionsXFieldIsDate({ xField: { type: 'float' } })).toEqual(false);
        expect(component.optionsXFieldIsDate({ xField: { type: 'keyword' } })).toEqual(false);
        expect(component.optionsXFieldIsDate({ xField: { type: 'int' } })).toEqual(false);
        expect(component.optionsXFieldIsDate({ xField: { type: 'long' } })).toEqual(false);
        expect(component.optionsXFieldIsDate({ xField: { type: 'number' } })).toEqual(false);
        expect(component.optionsXFieldIsDate({ xField: { type: 'object' } })).toEqual(false);
        expect(component.optionsXFieldIsDate({ xField: { type: 'string' } })).toEqual(false);
        expect(component.optionsXFieldIsDate({ xField: { type: 'text' } })).toEqual(false);
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
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        (component as any).aggregationData = [];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[], {
            aggregationField: 'Test Size Field',
            aggregationLabel: AggregationType.SUM,
            dataLength: 0,
            groups: [],
            sort: 'x',
            xAxis: 'number',
            xList: [],
            yAxis: 'number',
            yList: []
        }]);
        expect(spy2.calls.count()).toEqual(0);

        (component as any).aggregationData = [{
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
            aggregationLabel: AggregationType.SUM,
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(0);
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);
    });

    it('refreshVisualization with XY subcomponent does draw data', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        (component as any).aggregationData = [];

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

        (component as any).aggregationData = [{
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
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);
    });

    it('refreshVisualization does work as expected with date fields', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.type = 'line-xy';
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.DATE;
        (component as any).aggregationData = [];

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

        (component as any).aggregationData = [{
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
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_']);
    });

    it('refreshVisualization does work as expected with string fields', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.type = 'line-xy';
        component.options.xField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.yField = DashboardServiceMock.FIELD_MAP.TEXT;
        (component as any).aggregationData = [];

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

        (component as any).aggregationData = [{
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
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_']);
    });

    it('refreshVisualization does draw zoom data if dualView is truthy', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.dualView = 'on';

        (component as any).aggregationData = [{
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
            aggregationLabel: AggregationType.SUM,
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
            aggregationLabel: AggregationType.SUM,
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);

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
            aggregationLabel: AggregationType.SUM,
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
            aggregationLabel: AggregationType.SUM,
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);
    });

    it('refreshVisualization does not draw main data if isFiltered returns true unless dualView is falsey', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.dualView = 'on';
        (component as any).isFiltered = () => true;

        (component as any).aggregationData = [{
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
            aggregationLabel: AggregationType.SUM,
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);

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
            aggregationLabel: AggregationType.SUM,
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);
    });

    it('refreshVisualization does draw main data if given true argument', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.dualView = 'on';

        (component as any).aggregationData = [{
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
            aggregationLabel: AggregationType.SUM,
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
            aggregationLabel: AggregationType.SUM,
            dataLength: 2,
            groups: ['a', 'b'],
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);
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

        (component as any).isFiltered = () => true;
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

    it('subcomponentRequestsFilterOnBounds with number data does call exchangeFilters', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnBounds(12, 34, 56, 78);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]]);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilterOnBounds with string data does call exchangeFilters', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnBounds('testText1', 'testText2', 'testText3', 'testText4');

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 'testText1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 'testText3'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 'testText2'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 'testText4'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]]);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilterOnBounds does call toggleFilters if doNotReplace=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnBounds(12, 34, 56, 78, true);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 56
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: 34
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 78
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]]);
    });

    it('subcomponentRequestsFilterOnBounds does not remove selectedArea if ignoreSelf=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnBounds(1, 2, 3, 4);

        expect(component.selectedArea).toEqual({
            height: 4,
            width: 3,
            x: 2,
            y: 1
        });
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilterOnBounds does call exchangeFilters or toggleFilters if notFilterable=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = false;
        component.options.notFilterable = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnBounds(12, 34, 56, 78);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilterOnDomain with number data does call exchangeFilters', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnDomain(12, 34);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 34
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]]);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilterOnDomain with string data does call exchangeFilters', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnDomain('testText1', 'testText2');

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 'testText1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 'testText2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]]);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilterOnDomain does call toggleFilters if doNotReplace=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnDomain(12, 34, true);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: 12
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 34
            } as SimpleFilterDesign]
        } as CompoundFilterDesign]]);
    });

    it('subcomponentRequestsFilterOnDomain does not remove selectedArea if ignoreSelf=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnDomain(12, 34);

        expect(component.selectedArea).toEqual({
            height: 4,
            width: 3,
            x: 2,
            y: 1
        });
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilterOnDomain does not call exchangeFilters or toggleFilters if notFilterable=true', () => {
        component.selectedArea = {
            height: 4,
            width: 3,
            x: 2,
            y: 1
        };
        component.options.ignoreSelf = false;
        component.options.notFilterable = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilterOnDomain(12, 34);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilter with number data does call exchangeFilters', () => {
        component.options.ignoreSelf = false;
        component.options.requireAll = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilter('testCategory', 1234);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 1234
        } as SimpleFilterDesign]]);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilter with string data does update valueFilters and call createOrRemoveNeonFilter', () => {
        component.options.ignoreSelf = false;
        component.options.requireAll = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilter('testCategory', 'testText1');

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 'testText1'
        } as SimpleFilterDesign]]);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilter does call exchangeFilters with OR root filter type if requireAll=false', () => {
        component.options.ignoreSelf = false;
        component.options.requireAll = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilter('testCategory', 1234);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 1234
        } as SimpleFilterDesign]]);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilter does call toggleFilters if doNotReplace=true', () => {
        component.options.ignoreSelf = true;
        component.options.requireAll = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilter('testCategory', 1234, true);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([[{
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 1234
        } as SimpleFilterDesign]]);
    });

    it('subcomponentRequestsFilter does call toggleFilters with OR root filter type if doNotReplace=true and requireAll=false', () => {
        component.options.ignoreSelf = true;
        component.options.requireAll = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilter('testCategory', 1234, true);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([[{
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '=',
            value: 1234
        } as SimpleFilterDesign]]);
    });

    it('subcomponentRequestsFilter does not call exchangeFilters or toggleFilters if notFilterable=true', () => {
        component.options.ignoreSelf = false;
        component.options.notFilterable = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');
        let spy2 = spyOn(component, 'toggleFilters');

        component.subcomponentRequestsFilter('testCategory', 1234);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
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

    it('getBindings does set expected properties in bindings', () => {
        expect(component.getBindings()).toEqual({
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            filter: null,
            hideUnfiltered: false,
            layers: undefined,
            limit: 10000,
            table: 'testTable1',
            title: 'Aggregation',
            unsharedFilterValue: '',
            unsharedFilterField: '',
            aggregationField: '',
            groupField: '',
            xField: '',
            yField: '',
            aggregation: AggregationType.COUNT,
            axisLabelX: '',
            axisLabelY: 'count',
            contributionKeys: null,
            countByAggregation: false,
            dualView: '',
            granularity: 'year',
            hideGridLines: false,
            hideGridTicks: false,
            ignoreSelf: true,
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
            showLegend: true,
            sortByAggregation: false,
            timeFill: false,
            type: 'line',
            yPercentage: 0.3
        });

        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        component.options.aggregation = AggregationType.SUM;
        component.options.countByAggregation = true;
        component.options.dualView = 'on';
        component.options.granularity = 'day';
        component.options.hideGridLines = true;
        component.options.hideGridTicks = true;
        component.options.ignoreSelf = false;
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
        component.options.showLegend = true;
        component.options.sortByAggregation = true;
        component.options.timeFill = true;
        component.options.type = 'line-xy';
        component.options.yPercentage = 0.5;

        expect(component.getBindings()).toEqual({
            contributionKeys: null,
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            filter: null,
            hideUnfiltered: false,
            layers: undefined,
            limit: 10000,
            table: 'testTable1',
            title: 'Aggregation',
            unsharedFilterValue: '',
            unsharedFilterField: '',
            aggregationField: 'testSizeField',
            groupField: 'testCategoryField',
            xField: 'testXField',
            yField: 'testYField',
            aggregation: AggregationType.SUM,
            axisLabelX: '',
            axisLabelY: 'count',
            countByAggregation: true,
            dualView: 'on',
            granularity: 'day',
            hideGridLines: true,
            hideGridTicks: true,
            ignoreSelf: false,
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
            showLegend: true,
            sortByAggregation: true,
            timeFill: true,
            type: 'line-xy',
            yPercentage: 0.5
        });
    });

    it('updateOnResize does work as expected', () => {
        component.minimumDimensionsMain = null;
        component.minimumDimensionsZoom = null;
        component.selectedAreaOffset = null;

        let spy1 = spyOn(component.subcomponentMain, 'redraw');
        let spy2 = spyOn(component.subcomponentZoom, 'redraw');

        component.updateOnResize();

        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.minimumDimensionsMain.height).toBeDefined();
        expect(component.minimumDimensionsMain.width).toBeDefined();
        expect(component.minimumDimensionsZoom.height).toBeDefined();
        expect(component.minimumDimensionsZoom.width).toBeDefined();
        expect(component.selectedAreaOffset.x).toBeDefined();
        expect(component.selectedAreaOffset.y).toBeDefined();
    });

    it('does show toolbar and body-container', () => {
        let toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let bodyContainer = fixture.debugElement.query(By.css('.body-container'));
        expect(bodyContainer).not.toBeNull();
    });

    it('does show header in toolbar with visualization title', () => {
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Aggregation');
    });

    it('does show data-info and hide error-message in toolbar if errorMessage is undefined', async(() => {
        (component as any).layerIdToElementCount.set(component.options._id, 10);

        // Force the component to update all its elements.
        component.changeDetection.detectChanges();

        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).not.toBeNull();
        expect(dataInfoTextInToolbar.nativeElement.textContent).toContain('10 Results');

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();
    }));

    it('does show error-message and hide data-info in toolbar and sidenav if errorMessage is defined', async(() => {
        (component as any).errorMessage = 'Test Error Message';

        // Force the component to update all its elements.
        component.changeDetection.detectChanges();

        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).toBeNull();

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-toolbar .error-message'));
        expect(errorMessageInToolbar).not.toBeNull();
        expect(errorMessageInToolbar.nativeElement.textContent).toContain('Test Error Message');
    }));

    it('does show settings icon button in toolbar', () => {
        let icon = fixture.debugElement.query(By.css('mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toEqual('settings');
    });

    it('does hide loading overlay by default', () => {
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('.not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('.not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    });

    it('does show loading overlay if loadingCount is positive', async(() => {
        (component as any).loadingCount = 1;

        // Force the component to update all its elements.
        component.changeDetection.detectChanges();

        let loadingOverlay = fixture.debugElement.query(By.css('.loading-overlay'));
        expect(loadingOverlay).not.toBeNull();

        let spinner = fixture.debugElement.query(By.css('.loading-overlay mat-spinner'));
        expect(spinner).not.toBeNull();
    }));

    it('does show filter-container and legend on initialization because showLegend is true', async(() => {
        let filterContainer = fixture.debugElement.query(By.css('.legend'));
        expect(filterContainer).not.toBeNull();

        let legend = fixture.debugElement.query(By.css('.legend app-legend'));
        expect(legend).not.toBeNull();
    }));

    it('does show filter-container and legend if type is line', async(() => {
        component.options.showLegend = false;
        component.options.type = 'line-xy';

        // Force the component to update all its elements.
        component.changeDetection.detectChanges();

        let filterContainer = fixture.debugElement.query(By.css('.legend'));
        expect(filterContainer).not.toBeNull();

        let legend = fixture.debugElement.query(By.css('.legend app-legend'));
        expect(legend).not.toBeNull();
    }));

    it('does show filter-container and legend if type is scatter', async(() => {
        component.options.showLegend = false;
        component.options.type = 'scatter-xy';

        // Force the component to update all its elements.
        component.changeDetection.detectChanges();

        let filterContainer = fixture.debugElement.query(By.css('.legend'));
        expect(filterContainer).not.toBeNull();

        let legend = fixture.debugElement.query(By.css('.legend app-legend'));
        expect(legend).not.toBeNull();
    }));

    it('does not show filter-container with no filters or legend if type is not line or scatter', async(() => {
        component.options.showLegend = false;
        component.options.type = 'bar-h';

        // Force the component to update all its elements.
        component.changeDetection.detectChanges();

        let filterContainer = fixture.debugElement.query(By.css('.legend'));
        expect(filterContainer).toBeNull();
    }));

    it('does not show filter-container if legendGroups is single-element array', async(() => {
        component.options.showLegend = false;
        component.options.type = 'bar-h';
        component.legendGroups = ['a'];

        // Force the component to update all its elements.
        component.changeDetection.detectChanges();

        let filterContainer = fixture.debugElement.query(By.css('.legend'));
        expect(filterContainer).toBeNull();
    }));

    it('does show filter-container and legend if legendGroups is multiple-element array', async(() => {
        component.options.showLegend = true;
        component.options.type = 'bar-h';
        component.legendGroups = ['a', 'b'];

        // Force the component to update all its elements.
        component.changeDetection.detectChanges();

        let filterContainer = fixture.debugElement.query(By.css('.legend'));
        expect(filterContainer).not.toBeNull();

        let legend = fixture.debugElement.query(By.css('.legend app-legend'));
        expect(legend).not.toBeNull();
    }));

    it('does show subcomponent-container and subcomponent-element', () => {
        let container = fixture.debugElement.query(By.css('.body-container .subcomponent-container'));
        expect(container).not.toBeNull();
        let element = fixture.debugElement.query(By.css(
            '.body-container .subcomponent-container .subcomponent-element'
        ));
        expect(element).not.toBeNull();
    });

    it('does not show subcomponent-selection if selectedArea is null', () => {
        let selection = fixture.debugElement.query(By.css(
            '.body-container .subcomponent-container .subcomponent-selection'
        ));
        expect(selection).toBeNull();
    });

    it('does show subcomponent-selection if selectedArea is not null', async(() => {
        component.selectedArea = {
            height: 20,
            width: 10,
            x: 1,
            y: 2
        };

        // Force the component to update all its elements.
        component.changeDetection.detectChanges();

        let selection = fixture.debugElement.query(By.css('.body-container .subcomponent-container .subcomponent-selection'));
        expect(selection).not.toBeNull();
    }));
});

describe('Component: Aggregation with config', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;

    initializeTestBed('Aggregation', {
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) },
            { provide: 'tableKey', useValue: 'table_key_2' },
            { provide: 'filter', useValue: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'limit', useValue: 1234 },
            { provide: 'title', useValue: 'Test Title' },
            { provide: 'aggregationField', useValue: 'testSizeField' },
            { provide: 'groupField', useValue: 'testCategoryField' },
            { provide: 'xField', useValue: 'testXField' },
            { provide: 'yField', useValue: 'testYField' },
            { provide: 'aggregation', useValue: AggregationType.SUM },
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
            { provide: 'showLegend', useValue: true },
            { provide: 'sortByAggregation', useValue: true },
            { provide: 'timeFill', useValue: true },
            { provide: 'type', useValue: 'scatter' },
            { provide: 'yPercentage', useValue: 0.5 }
        ],
        imports: [
            AggregationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('custom class options properties are set to expected values from config', () => {
        expect(component.options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.options.limit).toEqual(1234);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.filter).toEqual({
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        });

        expect(component.options.aggregationField).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(component.options.groupField).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect(component.options.xField).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(component.options.yField).toEqual(DashboardServiceMock.FIELD_MAP.Y);

        expect(component.options.aggregation).toEqual(AggregationType.SUM);
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
        expect(component.options.showLegend).toEqual(true);
        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.timeFill).toEqual(true);
        expect(component.options.type).toEqual('scatter');
        expect(component.options.yPercentage).toEqual(0.5);
        expect(component.subcomponentMain.constructor.name).toEqual(ChartJsScatterSubcomponent.name);
    });

    it('does show header in toolbar with visualization title from config', () => {
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });
});

describe('Component: Aggregation with XY config', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;

    initializeTestBed('Aggregation', {
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) },
            { provide: 'tableKey', useValue: 'table_key_2' },
            { provide: 'filter', useValue: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'limit', useValue: 1234 },
            { provide: 'title', useValue: 'Test Title' },
            { provide: 'aggregationField', useValue: 'testSizeField' },
            { provide: 'groupField', useValue: 'testCategoryField' },
            { provide: 'xField', useValue: 'testXField' },
            { provide: 'yField', useValue: 'testYField' },
            { provide: 'aggregation', useValue: AggregationType.SUM },
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
            { provide: 'showLegend', useValue: true },
            { provide: 'sortByAggregation', useValue: true },
            { provide: 'timeFill', useValue: true },
            { provide: 'type', useValue: 'scatter-xy' },
            { provide: 'yPercentage', useValue: 0.5 }
        ],
        imports: [
            AggregationModule
        ]
    });

    it('custom XY class options properties are set to expected values from config', () => {
        expect(component.options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.options.limit).toEqual(1234);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.filter).toEqual({
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        });

        expect(component.options.aggregationField).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(component.options.groupField).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect(component.options.xField).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(component.options.yField).toEqual(DashboardServiceMock.FIELD_MAP.Y);

        expect(component.options.aggregation).toEqual(AggregationType.SUM);
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
        expect(component.options.showLegend).toEqual(true);
        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.timeFill).toEqual(true);
        expect(component.options.type).toEqual('scatter-xy');
        expect(component.options.yPercentage).toEqual(0.5);
        expect(component.subcomponentMain.constructor.name).toEqual(ChartJsScatterSubcomponent.name);
    });

    it('does show header in toolbar with visualization title from config with XY subcomponent', () => {
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
});

describe('Component: Aggregation with date config', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;

    initializeTestBed('Aggregation', {
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) },
            { provide: 'tableKey', useValue: 'table_key_2' },
            { provide: 'filter', useValue: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'limit', useValue: 1234 },
            { provide: 'title', useValue: 'Test Title' },
            { provide: 'aggregationField', useValue: 'testSizeField' },
            { provide: 'groupField', useValue: 'testCategoryField' },
            { provide: 'xField', useValue: 'testDateField' },
            { provide: 'yField', useValue: 'testYField' },
            { provide: 'aggregation', useValue: AggregationType.SUM },
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
            { provide: 'showLegend', useValue: true },
            { provide: 'sortByAggregation', useValue: true },
            { provide: 'timeFill', useValue: true },
            { provide: 'type', useValue: 'scatter' },
            { provide: 'yPercentage', useValue: 0.5 }
        ],
        imports: [
            AggregationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('custom date class options properties are set to expected values from config', () => {
        expect(component.options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.options.limit).toEqual(1234);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.filter).toEqual({
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        });

        expect(component.options.aggregationField).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(component.options.groupField).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect(component.options.xField).toEqual(DashboardServiceMock.FIELD_MAP.DATE);
        expect(component.options.yField).toEqual(DashboardServiceMock.FIELD_MAP.Y);

        expect(component.options.aggregation).toEqual(AggregationType.SUM);
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
        expect(component.options.showLegend).toEqual(true);
        expect(component.options.sortByAggregation).toEqual(true);
        expect(component.options.timeFill).toEqual(true);
        expect(component.options.type).toEqual('scatter');
        expect(component.options.yPercentage).toEqual(0.5);
        expect(component.subcomponentMain.constructor.name).toEqual(ChartJsScatterSubcomponent.name);
    });

    it('does show header in toolbar with visualization title from config with date fields', () => {
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });
});
