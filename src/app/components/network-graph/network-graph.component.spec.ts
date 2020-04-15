/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NetworkGraphComponent } from './network-graph.component';
import { DashboardService } from '../../services/dashboard.service';
import {
    AbstractSearchService,
    CompoundFilterType,
    CoreSearch,
    FieldConfig,
    FilterCollection,
    ListFilterDesign,
    SearchServiceMock
} from '@caci-critical-insight-solutions/nucleus-core';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { By } from '@angular/platform-browser';
import { DashboardServiceMock } from '../../services/mock.dashboard-service';

import { NetworkGraphModule } from './network-graph.module';
import { WidgetOptionCollection } from '../../models/widget-option-collection';

describe('Component: NetworkGraph', () => {
    let component: NetworkGraphComponent;
    let fixture: ComponentFixture<NetworkGraphComponent>;

    initializeTestBed('Network Graph', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            InjectableColorThemeService
        ],
        imports: [
            NetworkGraphModule
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NetworkGraphComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));

    it('does have expected class properties', () => {
        expect(component.options.isDirected).toEqual(false);
        expect(component.options.isReified).toEqual(false);
        expect(component.options.displayLegend).toEqual(false);
        expect(component.options.nodeShape).toEqual('box');
        expect(component.options.nodeColor).toEqual('#96c1fc');
        expect(component.options.linkColor).toEqual('#96c1fc');
        expect(component.options.edgeColor).toEqual('#2b7ce9');
        expect(component.options.fontColor).toEqual('#343434');
        expect(component.options.edgeWidth).toEqual(1);
        expect(component.options.limit).toEqual(500000);
        expect(component.options.filterFields).toEqual([]);
        expect(component.options.physics).toEqual(true);
        expect(component.options.filterable).toEqual(false);
        expect(component.options.multiFilterOperator).toEqual('or');
        expect(component.options.cleanLegendLabels).toEqual(false);
        expect(component.options.legendFiltering).toEqual(true);

        expect(component.options.nodeColorField).toEqual(FieldConfig.get());
        expect(component.options.edgeColorField).toEqual(FieldConfig.get());
        expect(component.options.linkField).toEqual(FieldConfig.get());
        expect(component.options.linkNameField).toEqual(FieldConfig.get());
        expect(component.options.nodeField).toEqual(FieldConfig.get());
        expect(component.options.nodeNameField).toEqual(FieldConfig.get());
        expect(component.options.xPositionField).toEqual(FieldConfig.get());
        expect(component.options.yPositionField).toEqual(FieldConfig.get());
        expect(component.options.xTargetPositionField).toEqual(FieldConfig.get());
        expect(component.options.yTargetPositionField).toEqual(FieldConfig.get());
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeColorField = FieldConfig.get({ columnName: 'testNodeColorField' });
        component.options.edgeColorField = FieldConfig.get({ columnName: 'testEdgeColorField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.xTargetPositionField = FieldConfig.get({ columnName: 'testXTargetPositionField' });
        component.options.yTargetPositionField = FieldConfig.get({ columnName: 'testYTargetPositionField' });
        component.options.filterFields = [
            FieldConfig.get({ columnName: 'testFilter1' }),
            FieldConfig.get({ columnName: 'testFilter2' })
        ];

        let searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'or',
                whereClauses: [{
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testNodeField'
                    },
                    operator: '!=',
                    rhs: null
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testLinkField'
                    },
                    operator: '!=',
                    rhs: null
                }]
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testNodeColorField'
                },
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    }));

    it('transformVisualizationQueryResults does load the Network Graph with reified data', (() => {
        component.options.isReified = true;
        component.options.limit = 8;

        component.transformVisualizationQueryResults(component.options, [{
            object: 'testObject',
            predicate: 'testPredicate',
            provenance: ['testProvenance'],
            subject: 'testSubject'
        },
        {
            object: 'testObject2',
            predicate: 'testPredicate',
            provenance: ['testProvenance2'],
            subject: ['testSubject2a', 'testSubject2b']
        },
        {
            object: 'testObject3',
            predicate: 'testPredicate3',
            provenance: 'testProvenance3',
            subject: ['testSubject3']
        },
        {
            object: 'testObject',
            predicate: 'testPredicate5',
            provenance: 'testProvenance4',
            subject: ['testSubject4']
        },
        {
            object: 'testObject4',
            predicate: 'testPredicate3',
            provenance: 'testProvenance4',
            subject: ['testSubject4']
        }], new FilterCollection());

        expect(component.totalNodes).toEqual(8); // Total based on allowed limit
        expect(component.displayGraph).toEqual(true);
        expect(component.graphData.nodes.length).toEqual(component.totalNodes);
        expect(component.graphData.edges.length).toEqual(5);
    }));

    it('transformVisualizationQueryResults does load the Network Graph with tabular data', (() => {
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.nodeColorField = FieldConfig.get({ columnName: 'testNodeColorField' });
        component.options.edgeColorField = FieldConfig.get({ columnName: 'testEdgeColorField' });
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = 3;

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode1',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testType1',
            testNodeColorField: 'testNodeColorValue',
            testEdgeColorField: 'testEdgeColorValue',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testType2',
            testNodeColorField: 'testNodeColorValue2',
            testEdgeColorField: 'testEdgeColorValue2',
            testXPositionField: -858,
            testYPositionField: 495
        },
        {
            testLinkField: 'testLinkValue3',
            testLinkNameField: 'testLinkNameValue3',
            testNodeField: 'testNode3',
            testNodeNameField: 'testNodeNameValue3',
            testTypeField: 'testType3',
            testNodeColorField: 'testNodeColorValue3',
            testEdgeColorField: 'testEdgeColorValue3',
            testXPositionField: -549,
            testYPositionField: -656
        },
        {
            testLinkField: 'testLinkValue4',
            testLinkNameField: 'testLinkNameValue4',
            testNodeField: 'testNode4',
            testNodeNameField: 'testNodeNameValue4',
            testTypeField: 'testType4',
            testNodeColorField: 'testNodeColorValue4',
            testEdgeColorField: 'testEdgeColorValue4',
            testXPositionField: 191,
            testYPositionField: -525
        }], new FilterCollection());

        expect(component.totalNodes).toEqual(3); // Total based on allowed limit
        expect(component.displayGraph).toEqual(true);
        expect(component.graphData.nodes.length).toEqual(component.totalNodes);
        expect(component.graphData.edges.length).toEqual(4);
    }));

    it('transformVisualizationQueryResults does load the Network Graph from multiple data tables', (() => {
        let options = component.options;
        options.layers = [
            {
                database: 'testNodeDatabase',
                table: 'testNodeTable',
                layerType: 'nodes',
                idField: FieldConfig.get({ columnName: 'testNodeIdField' }),
                nameField: FieldConfig.get({ columnName: 'testNodeNameField' }),
                colorField: FieldConfig.get({ columnName: 'testNodeColorField' }),
                param1Field: FieldConfig.get({ columnName: 'testNodeXPositionField' }),
                param2Field: FieldConfig.get({ columnName: 'testNodeYPositionField' }),
                filterFields: [FieldConfig.get({ columnName: 'testFilterField' })]
            },
            {
                database: 'testEdgeDatabase',
                table: 'testTable',
                layerType: 'edges',
                nameField: FieldConfig.get({ columnName: 'testEdgeNameField' }),
                colorField: FieldConfig.get({ columnName: 'testEdgeColorField' }),
                param1Field: FieldConfig.get({ columnName: 'testEdgeSourceIdField' }),
                param2Field: FieldConfig.get({ columnName: 'testEdgeDestinationIdField' }),
                filterFields: [FieldConfig.get({ columnName: 'testFilterField' })]
            }
        ] as any as WidgetOptionCollection[]; // TODO: Violating typing rules
        options.nodeColor = '#96f4f2';
        options.edgeColor = '#93663e';
        options.linkColor = '#938d8f';
        options.nodeShape = 'star';
        options.isReified = false;
        options.limit = 3;

        component.initializeProperties();
        component.transformVisualizationQueryResults(options.layers[0], [{
            testNodeIdField: 'nodeId1',
            testNodeNameField: 'nodeName1',
            testNodeColorField: 'Entity',
            testNodeXPositionField: 100,
            testNodeYPositionField: 215
        },
        {
            testNodeIdField: 'nodeId2',
            testNodeNameField: 'nodeName2',
            testNodeColorField: 'Event',
            testNodeXPositionField: -858,
            testNodeYPositionField: 495
        },
        {
            testNodeIdField: 'nodeId3',
            testNodeNameField: 'nodeName3',
            testNodeColorField: 'Relation',
            testNodeXPositionField: -549,
            testNodeYPositionField: -656
        },
        {
            testNodeIdField: 'nodeId4',
            testNodeNameField: 'nodeName4',
            testNodeColorField: 'Entity',
            testNodeXPositionField: 191,
            testNodeYPositionField: -525
        }], new FilterCollection());

        let edgesData = [{
            testEdgeNameField: 'edgeName1',
            testEdgeSourceIdField: 'nodeId1',
            testEdgeDestinationIdField: 'nodeId2'
        },
        {
            testEdgeNameField: 'edgeName2',
            testEdgeSourceIdField: 'nodeId2',
            testEdgeDestinationIdField: 'nodeId3'
        },
        {
            testEdgeNameField: 'edgeName3',
            testEdgeSourceIdField: 'nodeId3',
            testEdgeDestinationIdField: 'nodeId2'
        },
        {
            testEdgeNameField: 'edgeName4',
            testEdgeSourceIdField: 'nodeId3',
            testEdgeDestinationIdField: 'nodeId1'
        }];

        component.transformVisualizationQueryResults(options.layers[1], edgesData, new FilterCollection());

        expect(component.totalNodes).toEqual(component.options.limit); // Total based on allowed limit
        expect(component.displayGraph).toEqual(true);
        expect(component.graphData.nodes.length).toEqual(component.options.limit);
        expect(component.graphData.edges.length).toEqual(edgesData.length);
    }));

    it('transformVisualizationQueryResults does load the Network Graph with relation data', (() => {
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.nodeColorField = FieldConfig.get({ columnName: 'testNodeColorField' });
        component.options.edgeColorField = FieldConfig.get({ columnName: 'testEdgeColorField' });
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.relationLinks = true;
        component.options.relationNodeIdentifier = 'testNodeColorValue2';
        component.options.isReified = false;
        component.options.limit = Infinity;

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode1',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testType1',
            testNodeColorField: 'testNodeColorValue',
            testEdgeColorField: 'testEdgeColorValue',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testType2',
            testNodeColorField: 'testNodeColorValue2',
            testEdgeColorField: 'testEdgeColorValue2',
            testXPositionField: -858,
            testYPositionField: 495
        },
        {
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode3',
            testNodeNameField: 'testNodeNameValue3',
            testTypeField: 'testType3',
            testNodeColorField: 'testNodeColorValue3',
            testEdgeColorField: 'testEdgeColorValue',
            testXPositionField: -549,
            testYPositionField: -656
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode3',
            testNodeNameField: 'testNodeNameValue3',
            testTypeField: 'testType3',
            testNodeColorField: 'testNodeColorValue3',
            testEdgeColorField: 'testEdgeColorValue2',
            testXPositionField: -549,
            testYPositionField: -656
        },
        {
            testNodeField: 'testNode4',
            testNodeNameField: 'testNodeNameValue4',
            testTypeField: 'testType4',
            testNodeColorField: 'testNodeColorValue4',
            testXPositionField: 191,
            testYPositionField: -525
        },
        {
            testLinkField: 'testLinkValue5',
            testLinkNameField: 'testLinkNameValue5',
            testNodeField: 'testNode5',
            testNodeNameField: 'testNodeNameValue5',
            testTypeField: 'testType1',
            testNodeColorField: 'testNodeColorValue5',
            testEdgeColorField: 'testEdgeColorValue5',
            testXPositionField: 439,
            testYPositionField: -211
        },
        {
            testLinkField: 'testLinkValue5',
            testLinkNameField: 'testLinkNameValue5',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testType2',
            testNodeColorField: 'testNodeColorValue2',
            testEdgeColorField: 'testEdgeColorValue5',
            testXPositionField: -858,
            testYPositionField: 495
        }], new FilterCollection());

        expect(component.options.relationNodeIdentifier).not.toBeNull();
        expect(component.options.relationNodeIdentifier).not.toEqual('');
        expect(component.totalNodes).toEqual(5); // Total based on allowed limit
        expect(component.displayGraph).toEqual(true);
        expect(component.graphData.nodes.length).toEqual(component.totalNodes);
        expect(component.graphData.edges.length).toEqual(6);
    }));

    it('legendIsNeeded does not display a legend when display boolean is set to false', () => {
        component.options.edgeColorField = FieldConfig.get({ columnName: 'testEdgeColorField' });
        component.options.displayLegend = false;
        component.displayGraph = false;

        component.changeDetection.detectChanges();

        let container = fixture.debugElement.query(By.css('.legend-container'));
        expect(container).toBeNull();
    });

    it('legendIsNeeded does not display a legend when edgeColorField is not set', () => {
        component.options.edgeColorField = FieldConfig.get({ columnName: '' });
        component.options.displayLegend = true;
        component.displayGraph = true;

        component.changeDetection.detectChanges();

        let container = fixture.debugElement.query(By.css('.legend-container'));
        expect(container).toBeNull();
    });

    it('legendIsNeeded displays a legend when display boolean is set to true and edgeColorField is set', () => {
        component.options.edgeColorField = FieldConfig.get({ columnName: 'testEdgeColorField' });
        component.options.displayLegend = true;
        component.displayGraph = true;

        component.changeDetection.detectChanges();

        let container = fixture.debugElement.query(By.css('.legend-container'));
        expect(container).not.toBeNull();
    });

    it('does create filter for graph when legend item is selected', (() => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.edgeColorField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.nodeColorField = FieldConfig.get({ columnName: 'testNodeColorField' });
        component.options.nodeColor = '#715e93';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode1',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testType1',
            testNodeColorField: 'testNodeColorValue',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testType2',
            testNodeColorField: 'testNodeColorValue2',
            testXPositionField: -858,
            testYPositionField: 495
        }], new FilterCollection());

        let spy = spyOn((component as any), 'exchangeFilters');

        component.legendItemSelected({ currentlyActive: true, value: 'testType1' });

        expect((component as any).disabledSet).toEqual([['testTypeField', 'testType1']]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testType1'])
        ]]);

        component.legendItemSelected({ currentlyActive: true, value: 'testType2' });

        expect((component as any).disabledSet).toEqual([['testTypeField', 'testType1'], ['testTypeField', 'testType2']]);
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testType1', 'testType2'])
        ]]);

        component.legendItemSelected({ currentlyActive: false, value: 'testType1' });

        expect((component as any).disabledSet).toEqual([['testTypeField', 'testType2']]);
        expect(spy.calls.count()).toEqual(3);
        expect(spy.calls.argsFor(2)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testType2'])
        ]]);

        component.legendItemSelected({ currentlyActive: false, value: 'testType2' });

        expect((component as any).disabledSet).toEqual([]);
        expect(spy.calls.count()).toEqual(4);
        expect(spy.calls.argsFor(3)).toEqual([[], [
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', [undefined])
        ]]);
    }));

    it('does create compound AND filter for graph when graph node is selected', (() => {
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.nodeColorField = FieldConfig.get({ columnName: 'testNodeColorField' });
        component.options.edgeColorField = FieldConfig.get({ columnName: 'testEdgeColorField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'and';
        component.options.toggleFiltered = true;

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode1',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testType1',
            testNodeColorField: 'testNodeColorValue',
            testEdgeColorField: 'testEdgeColorValue',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testType2',
            testNodeColorField: 'testNodeColorValue2',
            testEdgeColorField: 'testEdgeColorValue2',
            testXPositionField: -858,
            testYPositionField: 495
        }], new FilterCollection());

        let spy = spyOn((component as any), 'exchangeFilters');

        component.onSelect({ nodes: ['testNode1'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testType1'])
        ], [], true]);

        component.onSelect({ nodes: ['testNode2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testType1', 'testType2'])
        ], [], true]);
    }));

    it('does create compound OR filter for graph when graph node is selected', (() => {
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.nodeColorField = FieldConfig.get({ columnName: 'testNodeColorField' });
        component.options.edgeColorField = FieldConfig.get({ columnName: 'testEdgeColorField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'or';
        component.options.toggleFiltered = true;

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode1',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testType1',
            testNodeColorField: 'testNodeColorValue',
            testEdgeColorField: 'testEdgeColorValue',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testType2',
            testNodeColorField: 'testNodeColorValue2',
            testEdgeColorField: 'testEdgeColorValue2',
            testXPositionField: -858,
            testYPositionField: 495
        }], new FilterCollection());

        let spy = spyOn((component as any), 'exchangeFilters');

        component.onSelect({ nodes: ['testNode1'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testType1'])
        ], [], true]);

        component.onSelect({ nodes: ['testNode2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testType1', 'testType2'])
        ], [], true]);
    }));

    it('does create compound AND filter for graph when graph node with data list is selected', (() => {
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.nodeColorField = FieldConfig.get({ columnName: 'testNodeColorField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'and';
        component.options.toggleFiltered = true;

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode1',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: ['testTypeA'],
            testNodeColorField: 'testNodeColorValue',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: ['testTypeB', 'testTypeC', 'testTypeD'],
            testNodeColorField: 'testNodeColorValue2',
            testXPositionField: -858,
            testYPositionField: 495
        }], new FilterCollection());

        let spy = spyOn((component as any), 'exchangeFilters');

        component.onSelect({ nodes: ['testNode1'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testTypeA'])
        ], [], true]);

        component.onSelect({ nodes: ['testNode2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testTypeA', 'testTypeB', 'testTypeC', 'testTypeD'])
        ], [], true]);
    }));

    it('does create compound OR filter for graph when graph node with data list is selected', (() => {
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'or';
        component.options.toggleFiltered = true;

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode1',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: ['testTypeA'],
            testEdgeColorField: '#5f9365',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: ['testTypeB', 'testTypeC', 'testTypeD'],
            testEdgeColorField: '#5f9365',
            testXPositionField: -858,
            testYPositionField: 495
        }], new FilterCollection());

        let spy = spyOn((component as any), 'exchangeFilters');

        component.onSelect({ nodes: ['testNode1'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testTypeA'])
        ], [], true]);

        component.onSelect({ nodes: ['testNode2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testTypeA', 'testTypeB', 'testTypeC', 'testTypeD'])
        ], [], true]);
    }));

    it('does create compound AND filter on multiple filter fields for graph when graph node is selected', (() => {
        component.options.idField = FieldConfig.get({ columnName: 'idLinkField' });
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.typeField = FieldConfig.get({ columnName: 'testTypeField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.ID, DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'and';
        component.options.toggleFiltered = true;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 1,
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode1',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testType1',
            testEdgeColorField: '#5f9365',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testIdField: 2,
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testType2',
            testEdgeColorField: '#5f9365',
            testXPositionField: -858,
            testYPositionField: 495
        }], new FilterCollection());

        let spy = spyOn((component as any), 'exchangeFilters');

        component.onSelect({ nodes: ['testNode1'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.ID.columnName, '=', [1]),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testType1'])
        ], [], true]);

        component.onSelect({ nodes: ['testNode2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.ID.columnName, '=', [1, 2]),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testType1', 'testType2'])
        ], [], true]);
    }));

    it('does create compound OR filter on multiple filter fields for graph when graph node is selected', (() => {
        component.options.idField = FieldConfig.get({ columnName: 'idLinkField' });
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.typeField = FieldConfig.get({ columnName: 'testTypeField' });
        component.options.linkNameField = FieldConfig.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = FieldConfig.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = FieldConfig.get({ columnName: 'testNodeField' });
        component.options.xPositionField = FieldConfig.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = FieldConfig.get({ columnName: 'testYPositionField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.ID, DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'or';
        component.options.toggleFiltered = true;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 1,
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNode1',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testType1',
            testEdgeColorField: '#5f9365',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testIdField: 2,
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNode2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testType2',
            testEdgeColorField: '#5f9365',
            testXPositionField: -858,
            testYPositionField: 495
        }], new FilterCollection());

        let spy = spyOn((component as any), 'exchangeFilters');

        component.onSelect({ nodes: ['testNode1'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.ID.columnName, '=', [1]),
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testType1'])
        ], [], true]);

        component.onSelect({ nodes: ['testNode2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.ID.columnName, '=', [1, 2]),
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '=', ['testType1', 'testType2'])
        ], [], true]);
    }));

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.edgeColorField = DashboardServiceMock.FIELD_MAP.TYPE;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0]).type).toEqual('and');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TYPE.columnName);
        expect((actual[0]).operator).toEqual('!=');
        expect((actual[0]).values).toEqual([undefined]);
        component.options.edgeColorField = FieldConfig.get();

        component.options.nodeField = DashboardServiceMock.FIELD_MAP.NAME;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0]).type).toEqual('or');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.NAME.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).values).toEqual([undefined]);
        component.options.nodeField = FieldConfig.get();

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0]).type).toEqual('or');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).values).toEqual([undefined]);

        component.options.multiFilterOperator = 'and';
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0]).type).toEqual('and');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).values).toEqual([undefined]);

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY, DashboardServiceMock.FIELD_MAP.TEXT];
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0]).type).toEqual('and');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).values).toEqual([undefined]);
        expect((actual[1]).type).toEqual('and');
        expect((actual[1]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TEXT.columnName);
        expect((actual[1]).operator).toEqual('=');
        expect((actual[1]).values).toEqual([undefined]);

        component.options.edgeColorField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.nodeField = DashboardServiceMock.FIELD_MAP.NAME;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect((actual[0]).type).toEqual('and');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TYPE.columnName);
        expect((actual[0]).operator).toEqual('!=');
        expect((actual[0]).values).toEqual([undefined]);
        expect((actual[1]).type).toEqual('and');
        expect((actual[1]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.NAME.columnName);
        expect((actual[1]).operator).toEqual('=');
        expect((actual[1]).values).toEqual([undefined]);
        expect((actual[2]).type).toEqual('and');
        expect((actual[2]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[2]).operator).toEqual('=');
        expect((actual[2]).values).toEqual([undefined]);
        expect((actual[3]).type).toEqual('and');
        expect((actual[3]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TEXT.columnName);
        expect((actual[3]).operator).toEqual('=');
        expect((actual[3]).values).toEqual([undefined]);
    });

    it('designEachFilterWithNoValues with layers does return expected object', () => {
        component.options.layers = [new WidgetOptionCollection(component['dataset'])];
        component.options.edgeColorField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.layers[0].layerType = 'nodes';
        component.options.layers[0].filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY, DashboardServiceMock.FIELD_MAP.TEXT];
        component.options.layers[0].nodeField = DashboardServiceMock.FIELD_MAP.NAME;

        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect((actual[0]).type).toEqual('and');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TYPE.columnName);
        expect((actual[0]).operator).toEqual('!=');
        expect((actual[0]).values).toEqual([undefined]);
        expect((actual[1]).type).toEqual('or');
        expect((actual[1]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.NAME.columnName);
        expect((actual[1]).operator).toEqual('=');
        expect((actual[1]).values).toEqual([undefined]);
        expect((actual[2]).type).toEqual('or');
        expect((actual[2]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[2]).operator).toEqual('=');
        expect((actual[2]).values).toEqual([undefined]);
        expect((actual[3]).type).toEqual('or');
        expect((actual[3]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TEXT.columnName);
        expect((actual[3]).operator).toEqual('=');
        expect((actual[3]).values).toEqual([undefined]);
    });
});
