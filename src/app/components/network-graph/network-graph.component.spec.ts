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
import { CUSTOM_ELEMENTS_SCHEMA, Injector } from '@angular/core';
import { NetworkGraphComponent } from './network-graph.component';
import { DashboardService } from '../../services/dashboard.service';
import { NeonConfig, NeonFieldMetaData } from '../../model/types';
import { FilterService } from '../../services/filter.service';
import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { WidgetService } from '../../services/widget.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { By } from '@angular/platform-browser';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { NetworkGraphModule } from './network-graph.module';
import { ConfigService } from '../../services/config.service';
import { WidgetOptionCollection } from '../../model/widget-option-collection';

describe('Component: NetworkGraph', () => {
    let testConfig: NeonConfig = NeonConfig.get();
    let component: NetworkGraphComponent;
    let fixture: ComponentFixture<NetworkGraphComponent>;

    initializeTestBed('Network Graph', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            Injector,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: ConfigService, useValue: ConfigService.as(testConfig) },
            { provide: 'limit', useValue: 'testLimit' }
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
        expect(component.options.edgeWidth).toEqual('1');
        expect(component.options.limit).toEqual('testLimit');
        expect(component.options.filterFields).toEqual([]);
        expect(component.options.physics).toEqual(true);
        expect(component.options.filterable).toEqual(false);
        expect(component.options.multiFilterOperator).toEqual('or');
        expect(component.options.cleanLegendLabels).toEqual(false);
        expect(component.options.legendFiltering).toEqual(true);

        expect(component.options.nodeColorField).toEqual(NeonFieldMetaData.get());
        expect(component.options.edgeColorField).toEqual(NeonFieldMetaData.get());
        expect(component.options.linkField).toEqual(NeonFieldMetaData.get());
        expect(component.options.linkNameField).toEqual(NeonFieldMetaData.get());
        expect(component.options.nodeField).toEqual(NeonFieldMetaData.get());
        expect(component.options.nodeNameField).toEqual(NeonFieldMetaData.get());
        expect(component.options.xPositionField).toEqual(NeonFieldMetaData.get());
        expect(component.options.yPositionField).toEqual(NeonFieldMetaData.get());
        expect(component.options.xTargetPositionField).toEqual(NeonFieldMetaData.get());
        expect(component.options.yTargetPositionField).toEqual(NeonFieldMetaData.get());
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.linkField = NeonFieldMetaData.get({ columnName: 'testLinkField' });
        component.options.linkNameField = NeonFieldMetaData.get({ columnName: 'testLinkNameField' });
        component.options.nodeField = NeonFieldMetaData.get({ columnName: 'testNodeField' });
        component.options.nodeNameField = NeonFieldMetaData.get({ columnName: 'testNodeNameField' });
        component.options.nodeColorField = NeonFieldMetaData.get({ columnName: 'testNodeColorField' });
        component.options.edgeColorField = NeonFieldMetaData.get({ columnName: 'testEdgeColorField' });
        component.options.xPositionField = NeonFieldMetaData.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = NeonFieldMetaData.get({ columnName: 'testYPositionField' });
        component.options.xTargetPositionField = NeonFieldMetaData.get({ columnName: 'testXTargetPositionField' });
        component.options.yTargetPositionField = NeonFieldMetaData.get({ columnName: 'testYTargetPositionField' });
        component.options.filterFields = [
            NeonFieldMetaData.get({ columnName: 'testFilter1' }),
            NeonFieldMetaData.get({ columnName: 'testFilter2' })
        ];

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                filters: [{
                    field: 'testNodeField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testLinkField',
                    operator: '!=',
                    value: null
                }],
                type: 'or'
            },
            sort: {
                field: 'testNodeColorField',
                order: 1
            }
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
        }]);

        expect(component.totalNodes).toEqual(8); // Total based on allowed limit
        expect(component.displayGraph).toEqual(true);
        expect(component.graphData.nodes.length).toEqual(component.totalNodes);
        expect(component.graphData.edges.length).toEqual(5);
    }));

    it('transformVisualizationQueryResults does load the Network Graph with tabular data', (() => {
        component.options.linkField = NeonFieldMetaData.get({ columnName: 'testLinkField' });
        component.options.linkNameField = NeonFieldMetaData.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = NeonFieldMetaData.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = NeonFieldMetaData.get({ columnName: 'testNodeField' });
        component.options.xPositionField = NeonFieldMetaData.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = NeonFieldMetaData.get({ columnName: 'testYPositionField' });
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = 3;

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNodeValue',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testTypeValue',
            testEdgeColorField: '#5f9365',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNodeValue2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testTypeValue2',
            testEdgeColorField: '#5f9365',
            testXPositionField: -858,
            testYPositionField: 495
        },
        {
            testLinkField: 'testLinkValue3',
            testLinkNameField: 'testLinkNameValue3',
            testNodeField: 'testNodeValue3',
            testNodeNameField: 'testNodeNameValue3',
            testTypeField: 'testTypeValue3',
            testEdgeColorField: '#5f9365',
            testXPositionField: -549,
            testYPositionField: -656
        },
        {
            testLinkField: 'testLinkValue4',
            testLinkNameField: 'testLinkNameValue4',
            testNodeField: 'testNodeValue4',
            testNodeNameField: 'testNodeNameValue4',
            testTypeField: 'testTypeValue4',
            testEdgeColorField: '#5f9365',
            testXPositionField: 191,
            testYPositionField: -525
        }]);

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
                idField: NeonFieldMetaData.get({ columnName: 'testNodeIdField' }),
                nameField: NeonFieldMetaData.get({ columnName: 'testNodeNameField' }),
                colorField: NeonFieldMetaData.get({ columnName: 'testNodeColorField' }),
                param1Field: NeonFieldMetaData.get({ columnName: 'testNodeXPositionField' }),
                param2Field: NeonFieldMetaData.get({ columnName: 'testNodeYPositionField' }),
                filterFields: [NeonFieldMetaData.get({ columnName: 'testFilterField' })]
            },
            {
                database: 'testEdgeDatabase',
                table: 'testTable',
                layerType: 'edges',
                nameField: NeonFieldMetaData.get({ columnName: 'testEdgeNameField' }),
                colorField: NeonFieldMetaData.get({ columnName: 'testEdgeColorField' }),
                param1Field: NeonFieldMetaData.get({ columnName: 'testEdgeSourceIdField' }),
                param2Field: NeonFieldMetaData.get({ columnName: 'testEdgeDestinationIdField' }),
                filterFields: [NeonFieldMetaData.get({ columnName: 'testFilterField' })]
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
        }]);

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

        component.transformVisualizationQueryResults(options.layers[1], edgesData);

        expect(component.totalNodes).toEqual(component.options.limit); // Total based on allowed limit
        expect(component.displayGraph).toEqual(true);
        expect(component.graphData.nodes.length).toEqual(component.options.limit);
        expect(component.graphData.edges.length).toEqual(edgesData.length);
    }));

    it('legendIsNeeded does not display a legend when display boolean is set to false', () => {
        component.options.edgeColorField = NeonFieldMetaData.get({ columnName: 'testEdgeColorField' });
        component.options.displayLegend = false;
        component.displayGraph = false;

        component.changeDetection.detectChanges();

        let container = fixture.debugElement.query(By.css('.legend-container'));
        expect(container).toBeNull();
    });

    it('legendIsNeeded does not display a legend when edgeColorField is not set', () => {
        component.options.edgeColorField = NeonFieldMetaData.get({ columnName: '' });
        component.options.displayLegend = true;
        component.displayGraph = true;

        component.changeDetection.detectChanges();

        let container = fixture.debugElement.query(By.css('.legend-container'));
        expect(container).toBeNull();
    });

    it('legendIsNeeded displays a legend when display boolean is set to true and edgeColorField is set', () => {
        component.options.edgeColorField = NeonFieldMetaData.get({ columnName: 'testEdgeColorField' });
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
        component.options.linkField = NeonFieldMetaData.get({ columnName: 'testLinkField' });
        component.options.linkNameField = NeonFieldMetaData.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = NeonFieldMetaData.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = NeonFieldMetaData.get({ columnName: 'testNodeField' });
        component.options.xPositionField = NeonFieldMetaData.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = NeonFieldMetaData.get({ columnName: 'testYPositionField' });
        component.options.nodeColor = '#715e93';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNodeValue',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testTypeValue',
            testEdgeColorField: '#5f9365',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNodeValue2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testTypeValue2',
            testEdgeColorField: '#5f9365',
            testXPositionField: -858,
            testYPositionField: 495
        }]);

        let spy = spyOn((component as any), 'toggleFilters');

        component.legendItemSelected({ currentlyActive: true, value: 'testTypeValue' });

        expect((component as any).disabledSet).toEqual([['testTypeField', 'testTypeValue']]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '!=',
            value: 'testTypeValue'
        }]]);

        component.legendItemSelected({ currentlyActive: true, value: 'testTypeValue2' });

        expect((component as any).disabledSet).toEqual([['testTypeField', 'testTypeValue'], ['testTypeField', 'testTypeValue2']]);
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '!=',
            value: 'testTypeValue2'
        }]]);

        component.legendItemSelected({ currentlyActive: false, value: 'testTypeValue' });

        expect((component as any).disabledSet).toEqual([['testTypeField', 'testTypeValue2']]);
        expect(spy.calls.count()).toEqual(3);
        expect(spy.calls.argsFor(2)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '!=',
            value: 'testTypeValue'
        }]]);

        component.legendItemSelected({ currentlyActive: false, value: 'testTypeValue2' });

        expect((component as any).disabledSet).toEqual([]);
        expect(spy.calls.count()).toEqual(4);
        expect(spy.calls.argsFor(3)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '!=',
            value: 'testTypeValue2'
        }]]);
    }));

    it('does create simple filter for graph when graph node is selected', (() => {
        component.options.linkField = NeonFieldMetaData.get({ columnName: 'testLinkField' });
        component.options.linkNameField = NeonFieldMetaData.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = NeonFieldMetaData.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = NeonFieldMetaData.get({ columnName: 'testNodeField' });
        component.options.xPositionField = NeonFieldMetaData.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = NeonFieldMetaData.get({ columnName: 'testYPositionField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'and';

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNodeValue',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testTypeValue',
            testEdgeColorField: '#5f9365',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNodeValue2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testTypeValue2',
            testEdgeColorField: '#5f9365',
            testXPositionField: -858,
            testYPositionField: 495
        }]);

        let spy = spyOn((component as any), 'toggleFilters');

        component.onSelect({ nodes: ['testNodeValue'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '=',
            value: 'testTypeValue'
        }]]);

        component.onSelect({ nodes: ['testNodeValue2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '=',
            value: 'testTypeValue2'
        }]]);
    }));

    it('does create compound AND filter for graph when graph node with data list is selected', (() => {
        component.options.linkField = NeonFieldMetaData.get({ columnName: 'testLinkField' });
        component.options.linkNameField = NeonFieldMetaData.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = NeonFieldMetaData.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = NeonFieldMetaData.get({ columnName: 'testNodeField' });
        component.options.xPositionField = NeonFieldMetaData.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = NeonFieldMetaData.get({ columnName: 'testYPositionField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'and';

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNodeValue',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: ['testTypeValueA'],
            testEdgeColorField: '#5f9365',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNodeValue2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: ['testTypeValueB', 'testTypeValueC', 'testTypeValueD'],
            testEdgeColorField: '#5f9365',
            testXPositionField: -858,
            testYPositionField: 495
        }]);

        let spy = spyOn((component as any), 'toggleFilters');

        component.onSelect({ nodes: ['testNodeValue'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '=',
            value: 'testTypeValueA'
        }]]);

        component.onSelect({ nodes: ['testNodeValue2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '=',
                value: 'testTypeValueB'
            }, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '=',
                value: 'testTypeValueC'
            }, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '=',
                value: 'testTypeValueD'
            }]
        }]]);
    }));

    it('does create compound OR filter for graph when graph node with data list is selected', (() => {
        component.options.linkField = NeonFieldMetaData.get({ columnName: 'testLinkField' });
        component.options.linkNameField = NeonFieldMetaData.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = NeonFieldMetaData.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = NeonFieldMetaData.get({ columnName: 'testNodeField' });
        component.options.xPositionField = NeonFieldMetaData.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = NeonFieldMetaData.get({ columnName: 'testYPositionField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'or';

        component.transformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNodeValue',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: ['testTypeValueA'],
            testEdgeColorField: '#5f9365',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNodeValue2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: ['testTypeValueB', 'testTypeValueC', 'testTypeValueD'],
            testEdgeColorField: '#5f9365',
            testXPositionField: -858,
            testYPositionField: 495
        }]);

        let spy = spyOn((component as any), 'toggleFilters');

        component.onSelect({ nodes: ['testNodeValue'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '=',
            value: 'testTypeValueA'
        }]]);

        component.onSelect({ nodes: ['testNodeValue2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '=',
                value: 'testTypeValueB'
            }, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '=',
                value: 'testTypeValueC'
            }, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '=',
                value: 'testTypeValueD'
            }]
        }]]);
    }));

    it('does create simple filters on multiple filter fields for graph when graph node is selected', (() => {
        component.options.linkField = NeonFieldMetaData.get({ columnName: 'testLinkField' });
        component.options.linkNameField = NeonFieldMetaData.get({ columnName: 'testLinkNameField' });
        component.options.nodeNameField = NeonFieldMetaData.get({ columnName: 'testNodeNameField' });
        component.options.nodeField = NeonFieldMetaData.get({ columnName: 'testNodeField' });
        component.options.xPositionField = NeonFieldMetaData.get({ columnName: 'testXPositionField' });
        component.options.yPositionField = NeonFieldMetaData.get({ columnName: 'testYPositionField' });
        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.ID, DashboardServiceMock.FIELD_MAP.TYPE];
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'and';

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 1,
            testLinkField: 'testLinkValue',
            testLinkNameField: 'testLinkNameValue',
            testNodeField: 'testNodeValue',
            testNodeNameField: 'testNodeNameValue',
            testTypeField: 'testTypeValue',
            testEdgeColorField: '#5f9365',
            testXPositionField: 100,
            testYPositionField: 215
        },
        {
            testIdField: 2,
            testLinkField: 'testLinkValue2',
            testLinkNameField: 'testLinkNameValue2',
            testNodeField: 'testNodeValue2',
            testNodeNameField: 'testNodeNameValue2',
            testTypeField: 'testTypeValue2',
            testEdgeColorField: '#5f9365',
            testXPositionField: -858,
            testYPositionField: 495
        }]);

        let spy = spyOn((component as any), 'toggleFilters');

        component.onSelect({ nodes: ['testNodeValue'] });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 1
        }, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '=',
            value: 'testTypeValue'
        }]]);

        component.onSelect({ nodes: ['testNodeValue2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 2
        }, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '=',
            value: 'testTypeValue2'
        }]]);
    }));

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.edgeColorField = DashboardServiceMock.FIELD_MAP.TYPE;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect((actual[0].filterDesign).operator).toEqual('!=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawLegend.bind(component).toString());
        component.options.edgeColorField = NeonFieldMetaData.get();

        component.options.nodeField = DashboardServiceMock.FIELD_MAP.NAME;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('or');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        component.options.nodeField = NeonFieldMetaData.get();

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY];
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('or');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());

        component.options.multiFilterOperator = 'and';
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('and');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY, DashboardServiceMock.FIELD_MAP.TEXT];
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('and');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[2].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((actual[2].filterDesign).operator).toEqual('=');
        expect((actual[2].filterDesign).value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[3].filterDesign).type).toEqual('and');
        expect((actual[3].filterDesign).filters.length).toEqual(1);
        expect((actual[3].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((actual[3].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[3].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());

        component.options.edgeColorField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.nodeField = DashboardServiceMock.FIELD_MAP.NAME;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(7);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect((actual[0].filterDesign).operator).toEqual('!=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawLegend.bind(component).toString());
        expect((actual[1].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((actual[1].filterDesign).operator).toEqual('=');
        expect((actual[1].filterDesign).value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[2].filterDesign).type).toEqual('and');
        expect((actual[2].filterDesign).filters.length).toEqual(1);
        expect((actual[2].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((actual[2].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[2].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[3].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[3].filterDesign).operator).toEqual('=');
        expect((actual[3].filterDesign).value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[4].filterDesign).type).toEqual('and');
        expect((actual[4].filterDesign).filters.length).toEqual(1);
        expect((actual[4].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[4].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[4].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[4].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[4].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[4].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[5].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[5].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[5].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((actual[5].filterDesign).operator).toEqual('=');
        expect((actual[5].filterDesign).value).toBeUndefined();
        expect(actual[5].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[6].filterDesign).type).toEqual('and');
        expect((actual[6].filterDesign).filters.length).toEqual(1);
        expect((actual[6].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[6].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[6].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((actual[6].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[6].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[6].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
    });

    it('designEachFilterWithNoValues with layers does return expected object', () => {
        component.options.layers = [new WidgetOptionCollection(() => [])];
        component.options.edgeColorField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.layers[0].layerType = 'nodes';
        component.options.layers[0].filterFields = [DashboardServiceMock.FIELD_MAP.CATEGORY, DashboardServiceMock.FIELD_MAP.TEXT];
        component.options.layers[0].nodeField = DashboardServiceMock.FIELD_MAP.NAME;

        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(7);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect((actual[0].filterDesign).operator).toEqual('!=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawLegend.bind(component).toString());
        expect((actual[1].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((actual[1].filterDesign).operator).toEqual('=');
        expect((actual[1].filterDesign).value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[2].filterDesign).type).toEqual('or');
        expect((actual[2].filterDesign).filters.length).toEqual(1);
        expect((actual[2].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((actual[2].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[2].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[3].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[3].filterDesign).operator).toEqual('=');
        expect((actual[3].filterDesign).value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[4].filterDesign).type).toEqual('or');
        expect((actual[4].filterDesign).filters.length).toEqual(1);
        expect((actual[4].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[4].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[4].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[4].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[4].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[4].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[5].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[5].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[5].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((actual[5].filterDesign).operator).toEqual('=');
        expect((actual[5].filterDesign).value).toBeUndefined();
        expect(actual[5].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[6].filterDesign).type).toEqual('or');
        expect((actual[6].filterDesign).filters.length).toEqual(1);
        expect((actual[6].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[6].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[6].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((actual[6].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[6].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[6].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
    });
});
