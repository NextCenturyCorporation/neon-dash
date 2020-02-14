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
import { } from 'jasmine-core';

import { AggregationModule } from './aggregation.module';

import { AggregationComponent } from './aggregation.component';
import { ChartJsLineSubcomponent } from './subcomponent.chartjs.line';
import { ChartJsScatterSubcomponent } from './subcomponent.chartjs.scatter';

import {
    AbstractSearchService,
    AggregationType,
    BoundsFilterDesign,
    Color,
    CompoundFilterType,
    CoreSearch,
    DomainFilterDesign,
    FieldConfig,
    FilterCollection,
    ListFilter,
    ListFilterDesign,
    SearchServiceMock,
    TimeInterval
} from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { StatisticsUtil } from '../../util/statistics.util';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: Aggregation', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;

    let DEFAULT_COLOR = new Color('#54C8CD', 'rgba(84,200,205,0.66)', 'rgba(84,200,205,0.33)');
    let COLOR_1 = new Color('var(--color-set-1)', 'var(--color-set-dark-1)', 'var(--color-set-1-transparency-high)');
    let COLOR_2 = new Color('var(--color-set-2)', 'var(--color-set-dark-2)', 'var(--color-set-2-transparency-high)');

    initializeTestBed('Aggregation', {
        providers: [
            InjectableColorThemeService,
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
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
        expect(component.options.aggregationField).toEqual(FieldConfig.get());
        expect(component.options.groupField).toEqual(FieldConfig.get());
        expect(component.options.xField).toEqual(FieldConfig.get());
        expect(component.options.yField).toEqual(FieldConfig.get());

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
        expect(component.options.scaleMaxX).toEqual(undefined);
        expect(component.options.scaleMaxY).toEqual(undefined);
        expect(component.options.scaleMinX).toEqual(undefined);
        expect(component.options.scaleMinY).toEqual(undefined);
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
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('!=');
        expect((actual[0]).values).toEqual([undefined]);

        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(3);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('!=');
        expect((actual[0]).values).toEqual([undefined]);
        expect((actual[1]).type).toEqual(CompoundFilterType.OR);
        expect((actual[1]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.X.columnName);
        expect((actual[1]).operator).toEqual('=');
        expect((actual[1]).values).toEqual([undefined]);
        expect((actual[2]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.X.columnName);
        expect((actual[2]).begin).toEqual(undefined);
        expect((actual[2]).end).toEqual(undefined);

        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('!=');
        expect((actual[0]).values).toEqual([undefined]);
        expect((actual[1]).type).toEqual(CompoundFilterType.OR);
        expect((actual[1]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.X.columnName);
        expect((actual[1]).operator).toEqual('=');
        expect((actual[1]).values).toEqual([undefined]);
        expect((actual[2]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.X.columnName);
        expect((actual[2]).begin).toEqual(undefined);
        expect((actual[2]).end).toEqual(undefined);
        expect((actual[3]).fieldKey1).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.X.columnName);
        expect((actual[3]).fieldKey2).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.Y.columnName);
        expect((actual[3]).begin1).toEqual(undefined);
        expect((actual[3]).begin2).toEqual(undefined);
        expect((actual[3]).end1).toEqual(undefined);
        expect((actual[3]).end2).toEqual(undefined);
    });

    it('finalizeVisualizationQuery does return expected count aggregation query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

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
                    field: 'testXField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                },
                label: '_aggregation',
                operation: 'count'
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                }
            }],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                },
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
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

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

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
                    field: 'testXField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testSizeField'
                },
                label: '_aggregation',
                operation: 'sum'
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                }
            }],
            orderByClauses: [{
                type: 'operation',
                operation: '_aggregation',
                order: -1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('finalizeVisualizationQuery does return expected XY query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                whereClauses: [{
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testXField'
                    },
                    operator: '!=',
                    rhs: null
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testYField'
                    },
                    operator: '!=',
                    rhs: null
                }],
                type: 'and'
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                },
                label: '_aggregation',
                operation: 'count'
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testYField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                }
            }],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                },
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('finalizeVisualizationQuery does return expected count aggregation query with filters', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [{
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testConfigFilterField'
            },
            operator: '=',
            rhs: 'testConfigFilterValue'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testFilterField'
            },
            operator: '=',
            rhs: 'testFilterValue'
        }])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                whereClauses: [{
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testConfigFilterField'
                    },
                    operator: '=',
                    rhs: 'testConfigFilterValue'
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testFilterField'
                    },
                    operator: '=',
                    rhs: 'testFilterValue'
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testXField'
                    },
                    operator: '!=',
                    rhs: null
                }],
                type: 'and'
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                },
                label: '_aggregation',
                operation: 'count'
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                }
            }],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                },
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('finalizeVisualizationQuery does return expected non-count aggregation query with filters', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [{
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testConfigFilterField'
            },
            operator: '=',
            rhs: 'testConfigFilterValue'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testFilterField'
            },
            operator: '=',
            rhs: 'testFilterValue'
        }])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                whereClauses: [{
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testConfigFilterField'
                    },
                    operator: '=',
                    rhs: 'testConfigFilterValue'
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testFilterField'
                    },
                    operator: '=',
                    rhs: 'testFilterValue'
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testXField'
                    },
                    operator: '!=',
                    rhs: null
                }],
                type: 'and'
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testSizeField'
                },
                label: '_aggregation',
                operation: 'sum'
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                }
            }],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                },
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('finalizeVisualizationQuery does return expected XY query with filters', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [{
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testConfigFilterField'
            },
            operator: '=',
            rhs: 'testConfigFilterValue'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testFilterField'
            },
            operator: '=',
            rhs: 'testFilterValue'
        }])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                whereClauses: [{
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testConfigFilterField'
                    },
                    operator: '=',
                    rhs: 'testConfigFilterValue'
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testFilterField'
                    },
                    operator: '=',
                    rhs: 'testFilterValue'
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testXField'
                    },
                    operator: '!=',
                    rhs: null
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testYField'
                    },
                    operator: '!=',
                    rhs: null
                }],
                type: 'and'
            },
            aggregateClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                },
                label: '_aggregation',
                operation: 'count'
            }],
            groupByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testYField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                }
            }],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testXField'
                },
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('finalizeVisualizationQuery does return expected date count aggregation query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

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
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                },
                label: '_aggregation',
                operation: 'count'
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
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                }
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

    it('finalizeVisualizationQuery does return expected date non-count aggregation query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

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
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testSizeField'
                },
                label: '_aggregation',
                operation: 'sum'
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
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                }
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

    it('finalizeVisualizationQuery does return expected date XY query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'and',
                whereClauses: [{
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testDateField'
                    },
                    operator: '!=',
                    rhs: null
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testYField'
                    },
                    operator: '!=',
                    rhs: null
                }]
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
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                },
                label: '_aggregation',
                operation: 'count'
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
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testYField'
                }
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                }
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

    it('finalizeVisualizationQuery does add multiple groups to date query if needed', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.aggregation = AggregationType.SUM;
        component.options.aggregationField = DashboardServiceMock.FIELD_MAP.SIZE;
        component.options.granularity = TimeInterval.SECOND;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;

        let searchObject = new CoreSearch('testDatabase1', 'testTable1');

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
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testSizeField'
                },
                label: '_aggregation',
                operation: 'sum'
            }],
            groupByClauses: [{
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_second',
                operation: 'second'
            }, {
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_minute',
                operation: 'minute'
            }, {
                type: 'operation',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testDateField'
                },
                label: '_hour',
                operation: 'hour'
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
            }, {
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                }
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

    it('handleLegendItemSelected does call exchangeFilters', () => {
        let spy = spyOn(component, 'exchangeFilters');

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
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', ['testValue'])
        ]]);

        // Does work second call.
        component.handleLegendItemSelected({
            value: 'testValue2'
        });
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', ['testValue', 'testValue2'])
        ]]);

        // Does toggle.
        component.handleLegendItemSelected({
            value: 'testValue'
        });
        expect(spy.calls.count()).toEqual(3);
        expect(spy.calls.argsFor(2)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', ['testValue2'])
        ]]);

        component.handleLegendItemSelected({
            value: 'testValue2'
        });
        expect(spy.calls.count()).toEqual(4);
        expect(spy.calls.argsFor(3)).toEqual([[], [
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', [undefined])
        ]]);
    });

    it('handleLegendItemSelected does not call exchangeFilters if notFilterable=true', () => {
        let spy = spyOn(component, 'exchangeFilters');

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

    /*
    It('redrawBounds does call subcomponentMain.select and refreshVisualization', () => {
        let spySelect = spyOn(component.subcomponentMain, 'select');
        let spyRedraw = spyOn(component, 'refreshVisualization');

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

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
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

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
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '>=',
            value: 12
        } as SimpleFilterConfig]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(1)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(2);

        (component as any).redrawBounds([{
            type: 'or',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

        expect(spySelect.calls.count()).toEqual(3);
        expect(spySelect.calls.argsFor(2)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(3);

        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '!=',
                value: 90
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

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
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        // Different table
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(1)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(2);

        // Different xField
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.SIZE;
        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

        expect(spySelect.calls.count()).toEqual(3);
        expect(spySelect.calls.argsFor(2)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(3);

        // Different yField
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.SIZE;
        (component as any).redrawBounds([{
            type: 'and',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

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
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 34
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

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
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '>=',
            value: 12
        } as SimpleFilterConfig]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        (component as any).redrawDomain([{
            type: 'and',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 56
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '>=',
                value: 34
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.Y.columnName,
                operator: '<=',
                value: 78
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

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
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 34
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        // Different table
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        (component as any).redrawDomain([{
            type: 'and',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 34
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(1)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(2);

        // Different xField
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.SIZE;
        (component as any).redrawDomain([{
            type: 'and',
            filters: [{
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '>=',
                value: 12
            } as SimpleFilterConfig, {
                datastore: DashboardServiceMock.DATASTORE.name,
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.X.columnName,
                operator: '<=',
                value: 34
            } as SimpleFilterConfig]
        } as CompoundFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterConfig, {
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '=',
            value: 'testValue2'
        } as SimpleFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterConfig]);

        expect(spySelect.calls.count()).toEqual(1);
        expect(spySelect.calls.argsFor(0)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(1);

        // Different table
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        (component as any).redrawFilteredItems([{
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterConfig]);

        expect(spySelect.calls.count()).toEqual(2);
        expect(spySelect.calls.argsFor(1)).toEqual([[]]);
        expect(spyRedraw.calls.count()).toEqual(2);

        // Different xField
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.xField = DashboardServiceMock.FIELD_MAP.TEXT;
        (component as any).redrawFilteredItems([{
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '=',
            value: 'testValue1'
        } as SimpleFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY.columnName,
            operator: '!=',
            value: 'testGroup2'
        } as SimpleFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY.columnName,
            operator: '!=',
            value: 'testGroup1'
        } as SimpleFilterConfig, {
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY.columnName,
            operator: '!=',
            value: 'testGroup2'
        } as SimpleFilterConfig, {
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY.columnName,
            operator: '!=',
            value: 'testGroup3'
        } as SimpleFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY.columnName,
            operator: '!=',
            value: 'testGroup2'
        } as SimpleFilterConfig]);

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
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '!=',
            value: 'testGroup1'
        } as SimpleFilterConfig]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendDisabledGroups).toEqual([]);

        // Different table
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        (component as any).redrawLegend([{
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '!=',
            value: 'testGroup1'
        } as SimpleFilterConfig]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendDisabledGroups).toEqual([]);

        // Different groupField
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.TEXT;
        (component as any).redrawLegend([{
            datastore: DashboardServiceMock.DATASTORE.name,
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.X.columnName,
            operator: '!=',
            value: 'testGroup1'
        } as SimpleFilterConfig]);

        expect(component.legendGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendActiveGroups).toEqual(['testGroup1', 'testGroup2', 'testGroup3']);
        expect(component.legendDisabledGroups).toEqual([]);
    });
    */

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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 1,
            y: 2
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: undefined,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 1,
            y: 2
        }, {
            aggregation: undefined,
            color: DEFAULT_COLOR,
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
            _aggregation: 90,
            testCategoryField: 'a',
            testXField: 1,
            testYField: 2
        }, {
            _aggregation: 80,
            testCategoryField: 'a',
            testXField: 3,
            testYField: 4
        }, {
            _aggregation: 70,
            testCategoryField: 'b',
            testXField: 5,
            testYField: 6
        }, {
            _aggregation: 60,
            testCategoryField: 'b',
            testXField: 7,
            testYField: 8
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
            aggregation: 90,
            color: COLOR_1,
            group: 'a',
            x: 1,
            y: 2
        }, {
            aggregation: 80,
            color: COLOR_1,
            group: 'a',
            x: 3,
            y: 4
        }, {
            aggregation: 70,
            color: COLOR_2,
            group: 'b',
            x: 5,
            y: 6
        }, {
            aggregation: 60,
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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
            aggregation: undefined,
            color: COLOR_1,
            group: 'a',
            x: 1,
            y: 2
        }, {
            aggregation: undefined,
            color: COLOR_1,
            group: 'a',
            x: 3,
            y: 4
        }, {
            aggregation: undefined,
            color: COLOR_2,
            group: 'b',
            x: 5,
            y: 6
        }, {
            aggregation: undefined,
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

        let testStatus;

        let testFilterFieldKey = DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
            DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.CATEGORY.columnName;
        let testFilterA = new ListFilter(CompoundFilterType.AND, testFilterFieldKey, '!=', ['a']);
        let testFilterB = new ListFilter(CompoundFilterType.AND, testFilterFieldKey, '!=', ['a', 'b']);
        let testFilterC = new ListFilter(CompoundFilterType.AND, testFilterFieldKey, '!=', ['a', 'b', 'c']);

        let testCollection = new FilterCollection();
        spyOn(testCollection, 'getCompatibleFilters').and.callFake((design) => {
            if (design instanceof ListFilterDesign && design.fieldKey === testFilterFieldKey) {
                if (testStatus === 1) {
                    return [testFilterA];
                }
                if (testStatus === 2) {
                    return [testFilterB];
                }
                if (testStatus === 3) {
                    return [testFilterC];
                }
            }
            return [];
        });

        testStatus = 1;
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
        }], testCollection);
        expect(component.legendActiveGroups).toEqual(['b', 'c']);
        expect(component.legendDisabledGroups).toEqual(['a']);
        expect(component.legendGroups).toEqual(['a', 'b', 'c']);

        testStatus = 2;
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
        }], testCollection);
        expect(component.legendActiveGroups).toEqual(['c']);
        expect(component.legendDisabledGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b', 'c']);

        testStatus = 3;
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
        }], testCollection);
        expect(component.legendActiveGroups).toEqual([]);
        expect(component.legendDisabledGroups).toEqual(['a', 'b', 'c']);
        expect(component.legendGroups).toEqual(['a', 'b', 'c']);
    });

    it('transformVisualizationQueryResults with XY date data does return expected data', () => {
        component.options.countByAggregation = true;
        component.options.type = 'line-xy';
        component.options.granularity = TimeInterval.DAY_OF_MONTH;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _date: '2018-01-01T00:00:00.000Z',
            testYField: 2
        }, {
            _date: '2018-01-03T00:00:00.000Z',
            testYField: 4
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }]);
        expect(component.xList).toEqual(['2018-01-01T00:00:00.000Z', '2018-01-03T00:00:00.000Z']);
        expect(component.yList).toEqual([2, 4]);
    });

    it('transformVisualizationQueryResults with aggregated date data does return expected data', () => {
        component.options.countByAggregation = true;
        component.options.granularity = TimeInterval.DAY_OF_MONTH;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _aggregation: 2,
            _date: '2018-01-01T00:00:00.000Z'
        }, {
            _aggregation: 4,
            _date: '2018-01-03T00:00:00.000Z'
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: undefined,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            aggregation: undefined,
            color: DEFAULT_COLOR,
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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: undefined,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 'a',
            y: 2
        }, {
            aggregation: undefined,
            color: DEFAULT_COLOR,
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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: undefined,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 1,
            y: 2
        }, {
            aggregation: undefined,
            color: DEFAULT_COLOR,
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
        component.options.granularity = TimeInterval.DAY_OF_MONTH;
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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 2
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
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
        component.options.granularity = TimeInterval.DAY_OF_MONTH;
        component.options.timeFill = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _date: '2018-01-01T00:00:00.000Z',
            testYField: 2
        }, {
            _date: '2018-01-03T00:00:00.000Z',
            testYField: 4
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 0
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
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
        component.options.granularity = TimeInterval.DAY_OF_MONTH;
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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 3
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
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
        component.options.granularity = TimeInterval.DAY_OF_MONTH;
        component.options.timeFill = true;
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _aggregation: 90,
            _date: '2018-01-01T00:00:00.000Z',
            testCategoryField: 'a',
            testYField: 2
        }, {
            _aggregation: 80,
            _date: '2018-01-02T00:00:00.000Z',
            testCategoryField: 'b',
            testYField: 3
        }, {
            _aggregation: 70,
            _date: '2018-01-03T00:00:00.000Z',
            testCategoryField: 'a',
            testYField: 4
        }, {
            _aggregation: 60,
            _date: '2018-01-04T00:00:00.000Z',
            testCategoryField: 'b',
            testYField: 5
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['a', 'b']);
        expect(component.legendGroups).toEqual(['a', 'b']);
        expect(actual).toEqual(2);
        expect(component.aggregationData).toEqual([{
            aggregation: 90,
            color: COLOR_1,
            group: 'a',
            x: '2018-01-01T00:00:00.000Z',
            y: 2
        }, {
            aggregation: 0,
            color: COLOR_1,
            group: 'a',
            x: '2018-01-02T00:00:00.000Z',
            y: 0
        }, {
            aggregation: 70,
            color: COLOR_1,
            group: 'a',
            x: '2018-01-03T00:00:00.000Z',
            y: 4
        }, {
            aggregation: 0,
            color: COLOR_1,
            group: 'a',
            x: '2018-01-04T00:00:00.000Z',
            y: 0
        }, {
            aggregation: 0,
            color: COLOR_2,
            group: 'b',
            x: '2018-01-01T00:00:00.000Z',
            y: 0
        }, {
            aggregation: 80,
            color: COLOR_2,
            group: 'b',
            x: '2018-01-02T00:00:00.000Z',
            y: 3
        }, {
            aggregation: 0,
            color: COLOR_2,
            group: 'b',
            x: '2018-01-03T00:00:00.000Z',
            y: 0
        }, {
            aggregation: 60,
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
        component.options.granularity = TimeInterval.DAY_OF_MONTH;
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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual([{
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-01T00:00:00.000Z',
            y: 0
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-02T00:00:00.000Z',
            y: 2
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-03T00:00:00.000Z',
            y: 0
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: '2018-01-04T00:00:00.000Z',
            y: 4
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(6);
        expect(component.aggregationData).toEqual([{
            aggregation: 0,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 1,
            y: 2
        }, {
            aggregation: 0,
            color: DEFAULT_COLOR,
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
        }], new FilterCollection());

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(6);
        expect(component.aggregationData).toEqual([{
            aggregation: undefined,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 1,
            y: 2
        }, {
            aggregation: undefined,
            color: DEFAULT_COLOR,
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

        let actual = component.transformVisualizationQueryResults(component.options, [], new FilterCollection());
        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);
        expect(actual).toEqual(0);
        expect(component.aggregationData).toEqual([]);
        expect(component.xList).toEqual([]);
        expect(component.yList).toEqual([]);
    });

    it('transformVisualizationQueryResults with roc curve does return expected data', () => {
        component.options.countByAggregation = true;
        component.options.rocCurve = true;
        component.options.type = 'line-xy';
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;

        let rocCurveAUCs = new Map<string, number>();
        rocCurveAUCs.set('All', 0.9876);

        const rocCurvePoints = [{
            aggregation: 1,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 0,
            y: 0
        }, {
            aggregation: 1,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 0.2,
            y: 0.4
        }, {
            aggregation: 1,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 0.6,
            y: 0.8
        }, {
            aggregation: 1,
            color: DEFAULT_COLOR,
            group: 'All',
            x: 1,
            y: 1
        }];

        const rocCurveX = [0, 0.2, 0.6, 1];
        const rocCurveY = [0, 0.4, 0.8, 1];

        spyOn(StatisticsUtil, 'rocCurve').and.returnValue({
            aucs: rocCurveAUCs,
            points: rocCurvePoints,
            xArray: rocCurveX,
            yArray: rocCurveY
        });

        let actual = component.transformVisualizationQueryResults(component.options, [{
            testXField: 1,
            testYField: 2
        }, {
            testXField: 3,
            testYField: 4
        }], new FilterCollection());

        expect(component.options.lineCurveTension).toEqual(0);
        expect(component.options.notFilterable).toEqual(true);

        expect(component.legendActiveGroups).toEqual(['All']);
        expect(component.legendGroups).toEqual(['All']);

        expect(actual).toEqual(1);
        expect(component.aggregationData).toEqual(rocCurvePoints);
        expect(component['_rocCurveAUCs']).toEqual(rocCurveAUCs);
        expect(component.xList).toEqual(rocCurveX);
        expect(component.yList).toEqual(rocCurveY);
    });

    it('optionsAggregationIsCountOrNA does return expected boolean', () => {
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'bar-h' })).toEqual(true);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'bar-v' })).toEqual(true);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'doughnut' })).toEqual(true);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'histogram' })).toEqual(true);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'pie' })).toEqual(true);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'line' })).toEqual(true);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'scatter' })).toEqual(true);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'table' })).toEqual(true);

        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'line-xy' })).toEqual(true);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.COUNT, type: 'scatter-xy' })).toEqual(true);

        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'bar-h' })).toEqual(false);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'bar-v' })).toEqual(false);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'doughnut' })).toEqual(false);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'histogram' })).toEqual(false);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'pie' })).toEqual(false);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'line' })).toEqual(false);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'scatter' })).toEqual(false);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'table' })).toEqual(false);

        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'line-xy' })).toEqual(true);
        expect(component.optionsAggregationIsCountOrNA({ aggregation: AggregationType.SUM, type: 'scatter-xy' })).toEqual(true);
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

    it('optionsTypeIsNotDualViewCompatible does return expected boolean', () => {
        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'histogram' })).toEqual(false);
        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'line' })).toEqual(false);
        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'line-xy' })).toEqual(false);

        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'bar-h' })).toEqual(true);
        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'bar-v' })).toEqual(true);
        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'doughnut' })).toEqual(true);
        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'pie' })).toEqual(true);
        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'scatter' })).toEqual(true);
        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'scatter-xy' })).toEqual(true);
        expect(component.optionsTypeIsNotDualViewCompatible({ type: 'table' })).toEqual(true);
    });

    it('optionsTypeIsNotLine does return expected boolean', () => {
        expect(component.optionsTypeIsNotLine({ type: 'line' })).toEqual(false);
        expect(component.optionsTypeIsNotLine({ type: 'line-xy' })).toEqual(false);

        expect(component.optionsTypeIsNotLine({ type: 'bar-h' })).toEqual(true);
        expect(component.optionsTypeIsNotLine({ type: 'bar-v' })).toEqual(true);
        expect(component.optionsTypeIsNotLine({ type: 'doughnut' })).toEqual(true);
        expect(component.optionsTypeIsNotLine({ type: 'histogram' })).toEqual(true);
        expect(component.optionsTypeIsNotLine({ type: 'pie' })).toEqual(true);
        expect(component.optionsTypeIsNotLine({ type: 'scatter' })).toEqual(true);
        expect(component.optionsTypeIsNotLine({ type: 'scatter-xy' })).toEqual(true);
        expect(component.optionsTypeIsNotLine({ type: 'table' })).toEqual(true);
    });

    it('optionsTypeIsNotList does return expected boolean', () => {
        expect(component.optionsTypeIsNotList({ type: 'list' })).toEqual(false);

        expect(component.optionsTypeIsNotList({ type: 'bar-h' })).toEqual(true);
        expect(component.optionsTypeIsNotList({ type: 'bar-v' })).toEqual(true);
        expect(component.optionsTypeIsNotList({ type: 'doughnut' })).toEqual(true);
        expect(component.optionsTypeIsNotList({ type: 'histogram' })).toEqual(true);
        expect(component.optionsTypeIsNotList({ type: 'line' })).toEqual(true);
        expect(component.optionsTypeIsNotList({ type: 'line-xy' })).toEqual(true);
        expect(component.optionsTypeIsNotList({ type: 'pie' })).toEqual(true);
        expect(component.optionsTypeIsNotList({ type: 'scatter' })).toEqual(true);
        expect(component.optionsTypeIsNotList({ type: 'scatter-xy' })).toEqual(true);
        expect(component.optionsTypeIsNotList({ type: 'table' })).toEqual(true);
    });

    it('optionsTypeIsNotGrid does return expected boolean', () => {
        expect(component.optionsTypeIsNotGrid({ type: 'bar-h' })).toEqual(false);
        expect(component.optionsTypeIsNotGrid({ type: 'bar-v' })).toEqual(false);
        expect(component.optionsTypeIsNotGrid({ type: 'histogram' })).toEqual(false);
        expect(component.optionsTypeIsNotGrid({ type: 'line' })).toEqual(false);
        expect(component.optionsTypeIsNotGrid({ type: 'line-xy' })).toEqual(false);
        expect(component.optionsTypeIsNotGrid({ type: 'scatter' })).toEqual(false);
        expect(component.optionsTypeIsNotGrid({ type: 'scatter-xy' })).toEqual(false);

        expect(component.optionsTypeIsNotGrid({ type: 'doughnut' })).toEqual(true);
        expect(component.optionsTypeIsNotGrid({ type: 'pie' })).toEqual(true);
        expect(component.optionsTypeIsNotGrid({ type: 'table' })).toEqual(true);
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

    it('optionsXFieldIsNotDate does return expected boolean', () => {
        expect(component.optionsXFieldIsNotDate({ xField: { type: 'date' } })).toEqual(false);

        expect(component.optionsXFieldIsNotDate({ xField: { type: 'boolean' } })).toEqual(true);
        expect(component.optionsXFieldIsNotDate({ xField: { type: 'float' } })).toEqual(true);
        expect(component.optionsXFieldIsNotDate({ xField: { type: 'keyword' } })).toEqual(true);
        expect(component.optionsXFieldIsNotDate({ xField: { type: 'int' } })).toEqual(true);
        expect(component.optionsXFieldIsNotDate({ xField: { type: 'long' } })).toEqual(true);
        expect(component.optionsXFieldIsNotDate({ xField: { type: 'number' } })).toEqual(true);
        expect(component.optionsXFieldIsNotDate({ xField: { type: 'object' } })).toEqual(true);
        expect(component.optionsXFieldIsNotDate({ xField: { type: 'string' } })).toEqual(true);
        expect(component.optionsXFieldIsNotDate({ xField: { type: 'text' } })).toEqual(true);
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
        expect(spy3.calls.count()).toEqual(1);
        expect(spy4.calls.count()).toEqual(1);
    });

    it('refreshVisualization does draw data', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        spyOn(component.subcomponentMain, 'redraw');
        spyOn(component.subcomponentZoom, 'redraw');
        spyOn(component.subcomponentMain, 'getMinimumDimensions').and.returnValue({ height: 300, width: 400 });
        spyOn(component.subcomponentZoom, 'getMinimumDimensions').and.returnValue({ height: 100, width: 200 });
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
        spyOn(component.subcomponentMain, 'redraw');
        spyOn(component.subcomponentZoom, 'redraw');
        spyOn(component.subcomponentMain, 'getMinimumDimensions').and.returnValue({ height: 300, width: 400 });
        spyOn(component.subcomponentZoom, 'getMinimumDimensions').and.returnValue({ height: 100, width: 200 });
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        (component as any).aggregationData = [];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[], {
            aggregationField: '',
            aggregationLabel: 'count',
            dataLength: 0,
            groups: [],
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
            aggregationField: '',
            aggregationLabel: 'count',
            dataLength: 2,
            groups: ['a', 'b'],
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
        spyOn(component.subcomponentMain, 'redraw');
        spyOn(component.subcomponentZoom, 'redraw');
        spyOn(component.subcomponentMain, 'getMinimumDimensions').and.returnValue({ height: 300, width: 400 });
        spyOn(component.subcomponentZoom, 'getMinimumDimensions').and.returnValue({ height: 100, width: 200 });
        component.options.type = 'line-xy';
        component.options.xField = DashboardServiceMock.FIELD_MAP.DATE;
        component.options.yField = DashboardServiceMock.FIELD_MAP.DATE;
        (component as any).aggregationData = [];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[], {
            aggregationField: '',
            aggregationLabel: 'count',
            dataLength: 0,
            groups: [],
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
            aggregationField: '',
            aggregationLabel: 'count',
            dataLength: 2,
            groups: ['a', 'b'],
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
        spyOn(component.subcomponentMain, 'redraw');
        spyOn(component.subcomponentZoom, 'redraw');
        spyOn(component.subcomponentMain, 'getMinimumDimensions').and.returnValue({ height: 300, width: 400 });
        spyOn(component.subcomponentZoom, 'getMinimumDimensions').and.returnValue({ height: 100, width: 200 });
        component.options.type = 'line-xy';
        component.options.xField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.yField = DashboardServiceMock.FIELD_MAP.TEXT;
        (component as any).aggregationData = [];

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[], {
            aggregationField: '',
            aggregationLabel: 'count',
            dataLength: 0,
            groups: [],
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
            aggregationField: '',
            aggregationLabel: 'count',
            dataLength: 2,
            groups: ['a', 'b'],
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
        spyOn(component.subcomponentMain, 'redraw');
        spyOn(component.subcomponentZoom, 'redraw');
        spyOn(component.subcomponentMain, 'getMinimumDimensions').and.returnValue({ height: 300, width: 400 });
        spyOn(component.subcomponentZoom, 'getMinimumDimensions').and.returnValue({ height: 100, width: 200 });
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);
    });

    /*
    It('refreshVisualization does not draw main data if isFiltered returns true unless dualView is falsey', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        spyOn(component.subcomponentMain, 'redraw');
        spyOn(component.subcomponentZoom, 'redraw');
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(1);
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);
    });
    */

    it('refreshVisualization does draw main data if given true argument', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        spyOn(component.subcomponentMain, 'redraw');
        spyOn(component.subcomponentZoom, 'redraw');
        spyOn(component.subcomponentMain, 'getMinimumDimensions').and.returnValue({ height: 300, width: 400 });
        spyOn(component.subcomponentZoom, 'getMinimumDimensions').and.returnValue({ height: 100, width: 200 });
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
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
            legend: null,
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
            sort: 'y',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);
    });

    it('refreshVisualization with roc curve does have legend metadata', () => {
        let spy1 = spyOn(component.subcomponentMain, 'draw');
        let spy2 = spyOn(component.subcomponentZoom, 'draw');
        spyOn(component.subcomponentMain, 'redraw');
        spyOn(component.subcomponentZoom, 'redraw');
        spyOn(component.subcomponentMain, 'getMinimumDimensions').and.returnValue({ height: 300, width: 400 });
        spyOn(component.subcomponentZoom, 'getMinimumDimensions').and.returnValue({ height: 100, width: 200 });
        component.options.rocCurve = true;
        component.options.type = 'line-xy';
        component.options.groupField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        component.options.yField = DashboardServiceMock.FIELD_MAP.Y;
        (component as any).aggregationData = [];

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

        let rocCurveAUCs = new Map<string, number>();
        rocCurveAUCs.set('a', 0.9876);
        rocCurveAUCs.set('b', 0.5432);
        component['_rocCurveAUCs'] = rocCurveAUCs;

        let expectedGroupsToLabels = new Map<string, string>();
        expectedGroupsToLabels.set('a', 'a AUC=0.9876');
        expectedGroupsToLabels.set('b', 'b AUC=0.5432');

        component.refreshVisualization();
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[{
            x: 1,
            y: 2
        }, {
            x: 3,
            y: 4
        }], {
            aggregationField: '',
            aggregationLabel: 'count',
            dataLength: 2,
            groups: ['a', 'b'],
            legend: {
                groupsToLabels: expectedGroupsToLabels
            },
            maximumAggregation: 0,
            maxTicksX: undefined,
            maxTicksY: undefined,
            sort: 'x',
            xAxis: 'number',
            xList: [1, 3],
            yAxis: 'number',
            yList: [2, 4]
        }]);
        expect(spy2.calls.count()).toEqual(0);
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

        let fakeCollection = new FilterCollection();
        spyOn(fakeCollection, 'getFilters').and.returnValue([null]);
        spyOn(component['filterService'], 'retrieveCompatibleFilterCollection').and.returnValue(fakeCollection);
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

        component.subcomponentRequestsFilterOnBounds(12, 34, 56, 78);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[
            new BoundsFilterDesign(
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName, 12, 34, 56, 78
            )
        ], [], true]);
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

        component.subcomponentRequestsFilterOnBounds('testText1', 'testText2', 'testText3', 'testText4');

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[
            new BoundsFilterDesign(
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName, 'testText1', 'testText2',
                'testText3', 'testText4'
            )
        ], [], true]);
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

        component.subcomponentRequestsFilterOnBounds(1, 2, 3, 4);

        expect(component.selectedArea).toEqual({
            height: 4,
            width: 3,
            x: 2,
            y: 1
        });
        expect(spy1.calls.count()).toEqual(1);
    });

    it('subcomponentRequestsFilterOnBounds does call exchangeFilters if notFilterable=true', () => {
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

        component.subcomponentRequestsFilterOnBounds(12, 34, 56, 78);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
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

        component.subcomponentRequestsFilterOnDomain(12, 34);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[
            new DomainFilterDesign(DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName, 12, 34)
        ]]);
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

        component.subcomponentRequestsFilterOnDomain('testText1', 'testText2');

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[
            new DomainFilterDesign(DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName, 'testText1', 'testText2')
        ]]);
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

        component.subcomponentRequestsFilterOnDomain(12, 34);

        expect(component.selectedArea).toEqual({
            height: 4,
            width: 3,
            x: 2,
            y: 1
        });
        expect(spy1.calls.count()).toEqual(1);
    });

    it('subcomponentRequestsFilterOnDomain does not call exchangeFilters if notFilterable=true', () => {
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

        component.subcomponentRequestsFilterOnDomain(12, 34);

        expect(component.selectedArea).toEqual(null);
        expect(spy1.calls.count()).toEqual(0);
    });

    it('subcomponentRequestsFilter with primitive data does call exchangeFilters', () => {
        component.options.ignoreSelf = false;
        component.options.requireAll = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');

        component.subcomponentRequestsFilter('testCategory', 1234);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [1234])
        ]]);

        component.subcomponentRequestsFilter('testCategory', 5678);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [5678])
        ]]);

        component.subcomponentRequestsFilter('testCategory', 'testText1');

        expect(spy1.calls.count()).toEqual(3);
        expect(spy1.calls.argsFor(2)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', ['testText1'])
        ]]);

        component.subcomponentRequestsFilter('testCategory', 'testText2');

        expect(spy1.calls.count()).toEqual(4);
        expect(spy1.calls.argsFor(3)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', ['testText2'])
        ]]);

        component.subcomponentRequestsFilter('testCategory', true);

        expect(spy1.calls.count()).toEqual(5);
        expect(spy1.calls.argsFor(4)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [true])
        ]]);

        component.subcomponentRequestsFilter('testCategory', false);

        expect(spy1.calls.count()).toEqual(6);
        expect(spy1.calls.argsFor(5)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [false])
        ]]);
    });

    it('subcomponentRequestsFilter does toggle values and call exchangeFilters if doNotReplace=true', () => {
        component.options.ignoreSelf = false;
        component.options.requireAll = false;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');

        component.subcomponentRequestsFilter('testCategory', 1234, true);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [1234])
        ]]);

        component.subcomponentRequestsFilter('testCategory', 5678, true);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [1234, 5678])
        ]]);

        component.subcomponentRequestsFilter('testCategory', 1234, true);

        expect(spy1.calls.count()).toEqual(3);
        expect(spy1.calls.argsFor(2)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [5678])
        ]]);

        component.subcomponentRequestsFilter('testCategory', 5678, true);

        expect(spy1.calls.count()).toEqual(4);
        expect(spy1.calls.argsFor(3)).toEqual([[], [
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [undefined])
        ]]);
    });

    it('subcomponentRequestsFilter does call exchangeFilters with a compound AND filter if requireAll=true', () => {
        component.options.ignoreSelf = false;
        component.options.requireAll = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');

        component.subcomponentRequestsFilter('testCategory', 1234, true);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [1234])
        ]]);

        component.subcomponentRequestsFilter('testCategory', 5678, true);

        expect(spy1.calls.count()).toEqual(2);
        expect(spy1.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.X.columnName, '=', [1234, 5678])
        ]]);
    });

    it('subcomponentRequestsFilter does not call exchangeFilters or exchangeFilters if notFilterable=true', () => {
        component.options.ignoreSelf = false;
        component.options.notFilterable = true;
        component.options.xField = DashboardServiceMock.FIELD_MAP.X;
        let spy1 = spyOn(component, 'exchangeFilters');

        component.subcomponentRequestsFilter('testCategory', 1234);

        expect(spy1.calls.count()).toEqual(0);
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

    it('updateOnResize does work as expected', () => {
        component.minimumDimensionsMain = null;
        component.minimumDimensionsZoom = null;
        component.selectedAreaOffset = null;

        let spy1 = spyOn(component.subcomponentMain, 'redraw');
        let spy2 = spyOn(component.subcomponentZoom, 'redraw');
        spyOn(component.subcomponentMain, 'getMinimumDimensions').and.returnValue({ height: 300, width: 400 });
        spyOn(component.subcomponentZoom, 'getMinimumDimensions').and.returnValue({ height: 100, width: 200 });

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

    it('retrieveCompatibleFiltersToIgnore does return non-legend filters', () => {
        component.options.groupField = FieldConfig.get();
        expect(component['retrieveCompatibleFiltersToIgnore']([
            new ListFilter(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testName'], 'testId1'),
            new ListFilter(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testType'], 'testId2')
        ])).toEqual([
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testName'], 'testId1'),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testType'], 'testId2')
        ]);
    });

    it('retrieveCompatibleFiltersToIgnore does ignore legend filters', () => {
        component.options.groupField = DashboardServiceMock.FIELD_MAP.TYPE;
        expect(component['retrieveCompatibleFiltersToIgnore']([
            new ListFilter(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testName'], 'testId1'),
            new ListFilter(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testType'], 'testId2')
        ])).toEqual([
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testName'], 'testId1')
        ]);
    });
});

describe('Component: Aggregation with config', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;

    initializeTestBed('Aggregation', {
        providers: [
            InjectableColorThemeService,
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            AggregationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        component.configOptions = {
            tableKey: 'table_key_2',
            filter: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' },
            limit: 1234,
            title: 'Test Title',
            aggregationField: 'testSizeField',
            groupField: 'testCategoryField',
            xField: 'testXField',
            yField: 'testYField',
            aggregation: AggregationType.SUM,
            granularity: TimeInterval.DAY_OF_MONTH,
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
            showLegend: true,
            sortByAggregation: true,
            timeFill: true,
            type: 'scatter',
            yPercentage: 0.5
        };
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
        expect(component.options.granularity).toEqual(TimeInterval.DAY_OF_MONTH);
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
            InjectableColorThemeService,
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            AggregationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        component.configOptions = {
            tableKey: 'table_key_2',
            filter: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' },
            limit: 1234,
            title: 'Test Title',
            aggregationField: 'testSizeField',
            groupField: 'testCategoryField',
            xField: 'testXField',
            yField: 'testYField',
            aggregation: AggregationType.SUM,
            granularity: TimeInterval.DAY_OF_MONTH,
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
            showLegend: true,
            sortByAggregation: true,
            timeFill: true,
            type: 'scatter-xy',
            yPercentage: 0.5
        };
        fixture.detectChanges();
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
        expect(component.options.granularity).toEqual(TimeInterval.DAY_OF_MONTH);
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
});

describe('Component: Aggregation with date config', () => {
    let component: AggregationComponent;
    let fixture: ComponentFixture<AggregationComponent>;

    initializeTestBed('Aggregation', {
        providers: [
            InjectableColorThemeService,
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            AggregationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AggregationComponent);
        component = fixture.componentInstance;
        component.configOptions = {
            tableKey: 'table_key_2',
            filter: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' },
            limit: 1234,
            title: 'Test Title',
            aggregationField: 'testSizeField',
            groupField: 'testCategoryField',
            xField: 'testDateField',
            yField: 'testYField',
            aggregation: AggregationType.SUM,
            granularity: TimeInterval.DAY_OF_MONTH,
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
            showLegend: true,
            sortByAggregation: true,
            timeFill: true,
            type: 'scatter',
            yPercentage: 0.5
        };
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
        expect(component.options.granularity).toEqual(TimeInterval.DAY_OF_MONTH);
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
