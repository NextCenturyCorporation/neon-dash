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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, Injector } from '@angular/core';
import { NetworkGraphComponent } from './network-graph.component';
import { DatasetService } from '../../services/dataset.service';
import { FieldMetaData } from '../../dataset';
import { FilterService } from '../../services/filter.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { WidgetService } from '../../services/widget.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { By } from '@angular/platform-browser';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { NetworkGraphModule } from './network-graph.module';
import { ConfigService } from '../../services/config.service';

describe('Component: NetworkGraph', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: NetworkGraphComponent;
    let fixture: ComponentFixture<NetworkGraphComponent>;

    initializeTestBed('Network Graph', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
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

        expect(component.options.nodeColorField).toEqual(new FieldMetaData());
        expect(component.options.edgeColorField).toEqual(new FieldMetaData());
        expect(component.options.linkField).toEqual(new FieldMetaData());
        expect(component.options.linkNameField).toEqual(new FieldMetaData());
        expect(component.options.nodeField).toEqual(new FieldMetaData());
        expect(component.options.nodeNameField).toEqual(new FieldMetaData());
        expect(component.options.xPositionField).toEqual(new FieldMetaData());
        expect(component.options.yPositionField).toEqual(new FieldMetaData());
        expect(component.options.xTargetPositionField).toEqual(new FieldMetaData());
        expect(component.options.yTargetPositionField).toEqual(new FieldMetaData());
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeColorField = new FieldMetaData('testNodeColorField');
        component.options.edgeColorField = new FieldMetaData('testEdgeColorField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');
        component.options.xTargetPositionField = new FieldMetaData('testXTargetPositionField');
        component.options.yTargetPositionField = new FieldMetaData('testYTargetPositionField');
        component.options.filterFields = [new FieldMetaData('testFilter1'), new FieldMetaData('testFilter2')];

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
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');
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
                idField: new FieldMetaData('testNodeIdField'),
                nameField: new FieldMetaData('testNodeNameField'),
                colorField: new FieldMetaData('testNodeColorField'),
                param1Field: new FieldMetaData('testNodeXPositionField'),
                param2Field: new FieldMetaData('testNodeYPositionField'),
                filterFields: [new FieldMetaData('testFilterField')]
            },
            {
                database: 'testEdgeDatabase',
                table: 'testTable',
                layerType: 'edges',
                nameField: new FieldMetaData('testEdgeNameField'),
                colorField: new FieldMetaData('testEdgeColorField'),
                param1Field: new FieldMetaData('testEdgeSourceIdField'),
                param2Field: new FieldMetaData('testEdgeDestinationIdField'),
                filterFields: [new FieldMetaData('testFilterField')]
            }
        ];
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
        component.options.edgeColorField = new FieldMetaData('testEdgeColorField');
        component.options.displayLegend = false;
        component.displayGraph = false;

        component.changeDetection.detectChanges();

        let container = fixture.debugElement.query(By.css('.legend-container'));
        expect(container).toBeNull();
    });

    it('legendIsNeeded does not display a legend when edgeColorField is not set', () => {
        component.options.edgeColorField = new FieldMetaData('');
        component.options.displayLegend = true;
        component.displayGraph = true;

        component.changeDetection.detectChanges();

        let container = fixture.debugElement.query(By.css('.legend-container'));
        expect(container).toBeNull();
    });

    it('legendIsNeeded displays a legend when display boolean is set to true and edgeColorField is set', () => {
        component.options.edgeColorField = new FieldMetaData('testEdgeColorField');
        component.options.displayLegend = true;
        component.displayGraph = true;

        component.changeDetection.detectChanges();

        let container = fixture.debugElement.query(By.css('.legend-container'));
        expect(container).not.toBeNull();
    });

    it('does create filter for graph when legend item is selected', (() => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.edgeColorField = DatasetServiceMock.TYPE_FIELD;
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');
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
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '!=',
            value: 'testTypeValue'
        }]]);

        component.legendItemSelected({ currentlyActive: true, value: 'testTypeValue2' });

        expect((component as any).disabledSet).toEqual([['testTypeField', 'testTypeValue'], ['testTypeField', 'testTypeValue2']]);
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '!=',
            value: 'testTypeValue2'
        }]]);

        component.legendItemSelected({ currentlyActive: false, value: 'testTypeValue' });

        expect((component as any).disabledSet).toEqual([['testTypeField', 'testTypeValue2']]);
        expect(spy.calls.count()).toEqual(3);
        expect(spy.calls.argsFor(2)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '!=',
            value: 'testTypeValue'
        }]]);

        component.legendItemSelected({ currentlyActive: false, value: 'testTypeValue2' });

        expect((component as any).disabledSet).toEqual([]);
        expect(spy.calls.count()).toEqual(4);
        expect(spy.calls.argsFor(3)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '!=',
            value: 'testTypeValue2'
        }]]);
    }));

    it('does create simple filter for graph when graph node is selected', (() => {
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');
        component.options.filterFields = [DatasetServiceMock.TYPE_FIELD];
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
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '=',
            value: 'testTypeValue'
        }]]);

        component.onSelect({ nodes: ['testNodeValue2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '=',
            value: 'testTypeValue2'
        }]]);
    }));

    it('does create compound AND filter for graph when graph node with data list is selected', (() => {
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');
        component.options.filterFields = [DatasetServiceMock.TYPE_FIELD];
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
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '=',
            value: 'testTypeValueA'
        }]]);

        component.onSelect({ nodes: ['testNodeValue2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '=',
                value: 'testTypeValueB'
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '=',
                value: 'testTypeValueC'
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '=',
                value: 'testTypeValueD'
            }]
        }]]);
    }));

    it('does create compound OR filter for graph when graph node with data list is selected', (() => {
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');
        component.options.filterFields = [DatasetServiceMock.TYPE_FIELD];
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
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '=',
            value: 'testTypeValueA'
        }]]);

        component.onSelect({ nodes: ['testNodeValue2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            type: 'or',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '=',
                value: 'testTypeValueB'
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '=',
                value: 'testTypeValueC'
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '=',
                value: 'testTypeValueD'
            }]
        }]]);
    }));

    it('does create simple filters on multiple filter fields for graph when graph node is selected', (() => {
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');
        component.options.filterFields = [DatasetServiceMock.ID_FIELD, DatasetServiceMock.TYPE_FIELD];
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
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 1
        }, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '=',
            value: 'testTypeValue'
        }]]);

        component.onSelect({ nodes: ['testNodeValue2'] });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.ID_FIELD,
            operator: '=',
            value: 2
        }, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '=',
            value: 'testTypeValue2'
        }]]);
    }));

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.edgeColorField = DatasetServiceMock.TYPE_FIELD;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign).field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('!=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawLegend.bind(component).toString());
        component.options.edgeColorField = new FieldMetaData();

        component.options.nodeField = DatasetServiceMock.NAME_FIELD;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign).field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('or');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        component.options.nodeField = new FieldMetaData();

        component.options.filterFields = [DatasetServiceMock.CATEGORY_FIELD];
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign).field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('or');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());

        component.options.multiFilterOperator = 'and';
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign).field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('and');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());

        component.options.filterFields = [DatasetServiceMock.CATEGORY_FIELD, DatasetServiceMock.TEXT_FIELD];
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect((actual[0].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign).field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('and');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[2].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[2].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[2].filterDesign).field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((actual[2].filterDesign).operator).toEqual('=');
        expect((actual[2].filterDesign).value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[3].filterDesign).type).toEqual('and');
        expect((actual[3].filterDesign).filters.length).toEqual(1);
        expect((actual[3].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[3].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[3].filterDesign).filters[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((actual[3].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[3].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());

        component.options.edgeColorField = DatasetServiceMock.TYPE_FIELD;
        component.options.nodeField = DatasetServiceMock.NAME_FIELD;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(7);
        expect((actual[0].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign).field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('!=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawLegend.bind(component).toString());
        expect((actual[1].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign).field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((actual[1].filterDesign).operator).toEqual('=');
        expect((actual[1].filterDesign).value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[2].filterDesign).type).toEqual('and');
        expect((actual[2].filterDesign).filters.length).toEqual(1);
        expect((actual[2].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[2].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[2].filterDesign).filters[0].field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((actual[2].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[2].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[3].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[3].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[3].filterDesign).field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[3].filterDesign).operator).toEqual('=');
        expect((actual[3].filterDesign).value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[4].filterDesign).type).toEqual('and');
        expect((actual[4].filterDesign).filters.length).toEqual(1);
        expect((actual[4].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[4].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[4].filterDesign).filters[0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[4].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[4].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[4].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[5].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[5].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[5].filterDesign).field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((actual[5].filterDesign).operator).toEqual('=');
        expect((actual[5].filterDesign).value).toBeUndefined();
        expect(actual[5].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[6].filterDesign).type).toEqual('and');
        expect((actual[6].filterDesign).filters.length).toEqual(1);
        expect((actual[6].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[6].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[6].filterDesign).filters[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((actual[6].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[6].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[6].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
    });

    it('designEachFilterWithNoValues with layers does return expected object', () => {
        component.options.layers = [{}];
        component.options.edgeColorField = DatasetServiceMock.TYPE_FIELD;
        component.options.layers[0].layerType = 'nodes';
        component.options.layers[0].filterFields = [DatasetServiceMock.CATEGORY_FIELD, DatasetServiceMock.TEXT_FIELD];
        component.options.layers[0].nodeField = DatasetServiceMock.NAME_FIELD;

        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(7);
        expect((actual[0].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign).field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('!=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawLegend.bind(component).toString());
        expect((actual[1].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign).field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((actual[1].filterDesign).operator).toEqual('=');
        expect((actual[1].filterDesign).value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[2].filterDesign).type).toEqual('or');
        expect((actual[2].filterDesign).filters.length).toEqual(1);
        expect((actual[2].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[2].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[2].filterDesign).filters[0].field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((actual[2].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[2].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[3].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[3].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[3].filterDesign).field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[3].filterDesign).operator).toEqual('=');
        expect((actual[3].filterDesign).value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[4].filterDesign).type).toEqual('or');
        expect((actual[4].filterDesign).filters.length).toEqual(1);
        expect((actual[4].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[4].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[4].filterDesign).filters[0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[4].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[4].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[4].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[5].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[5].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[5].filterDesign).field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((actual[5].filterDesign).operator).toEqual('=');
        expect((actual[5].filterDesign).value).toBeUndefined();
        expect(actual[5].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
        expect((actual[6].filterDesign).type).toEqual('or');
        expect((actual[6].filterDesign).filters.length).toEqual(1);
        expect((actual[6].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[6].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[6].filterDesign).filters[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((actual[6].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[6].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[6].redrawCallback.toString()).toEqual((component as any).redrawFilteredNodes.bind(component).toString());
    });
});
