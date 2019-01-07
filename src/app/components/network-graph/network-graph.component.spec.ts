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
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA, Injector } from '@angular/core';
import * as neon from 'neon-framework';
import { NetworkGraphComponent } from './network-graph.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FieldMetaData } from '../../dataset';
import { FilterService } from '../../services/filter.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { WidgetService } from '../../services/widget.service';
import { LegendComponent } from '../legend/legend.component';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { By } from '@angular/platform-browser';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { neonVariables } from '../../neon-namespaces';

describe('Component: NetworkGraph', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: NetworkGraphComponent;
    let fixture: ComponentFixture<NetworkGraphComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            LegendComponent,
            NetworkGraphComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: 'config', useValue: testConfig },
            { provide: 'limit', useValue: 'testLimit' }
        ],
        imports: [
            BrowserAnimationsModule,
            AppMaterialModule,
            FormsModule
        ],
        schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
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
        expect(component.options.typeField).toEqual(new FieldMetaData());
        expect(component.options.xPositionField).toEqual(new FieldMetaData());
        expect(component.options.yPositionField).toEqual(new FieldMetaData());
        expect(component.options.xTargetPositionField).toEqual(new FieldMetaData());
        expect(component.options.yTargetPositionField).toEqual(new FieldMetaData());
    });

    it('createQuery does return expected query', (() => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.typeField = new FieldMetaData('testTypeField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeColorField = new FieldMetaData('testNodeColorField');
        component.options.edgeColorField = new FieldMetaData('testEdgeColorField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');
        component.options.xTargetPositionField = new FieldMetaData('testXTargetPositionField');
        component.options.yTargetPositionField = new FieldMetaData('testYTargetPositionField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        let query = new neon.query.Query()
            .selectFrom(component.options.database.name, component.options.table.name)
            .withFields(['testNodeField', 'testLinkField', 'testNodeColorField', 'testEdgeColorField', 'testNodeNameField',
                'testLinkNameField', 'testTypeField', 'testXPositionField', 'testYPositionField', 'testXTargetPositionField',
                'testYTargetPositionField', 'testFilter1', 'testFilter2']);

        query.where(neon.query.and.apply(query, [])).sortBy('testNodeColorField', neonVariables.ASCENDING);
        expect(component.createQuery(component.options)).toEqual(query);
    }));

    it('onQuerySuccess does load the Network Graph with reified data', (() => {
        component.options.isReified = true;
        component.options.limit = 8;

        component.onQuerySuccess(component.options, {
            data: [{
                object : 'testObject',
                predicate : 'testPredicate',
                provenance : ['testProvenance'],
                subject : 'testSubject'
            },
            {
                object : 'testObject2',
                predicate : 'testPredicate',
                provenance : ['testProvenance2'],
                subject : ['testSubject2a', 'testSubject2b']
            },
            {
                object : 'testObject3',
                predicate : 'testPredicate3',
                provenance : 'testProvenance3',
                subject : ['testSubject3']
            },
            {
                object : 'testObject',
                predicate : 'testPredicate5',
                provenance : 'testProvenance4',
                subject : ['testSubject4']
            },
            {
                object : 'testObject4',
                predicate : 'testPredicate3',
                provenance : 'testProvenance4',
                subject : ['testSubject4']
            }]
        });

        expect(component.totalNodes).toEqual(8); //Total based on allowed limit
        expect(component.displayGraph).toEqual(true);
        expect(component.graphData.nodes.length).toEqual(component.totalNodes);
        expect(component.graphData.edges.length).toEqual(5);

    }));

    it('onQuerySuccess does load the Network Graph with tabular data', (() => {
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.typeField = new FieldMetaData('testTypeField');
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

        component.onQuerySuccess(component.options, {
            data: [{
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
            }]
        });

        expect(component.totalNodes).toEqual(3); //Total based on allowed limit
        expect(component.displayGraph).toEqual(true);
        expect(component.graphData.nodes.length).toEqual(component.totalNodes);
        expect(component.graphData.edges.length).toEqual(4);

    }));

    it('legendIsNeeded does not display a legend when display boolean is set to false', async(() => {
        component.options.edgeColorField = new FieldMetaData('testEdgeColorField');
        component.displayGraph = false;

        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let container = fixture.debugElement.query(By.css('mat-sidenav-container .legend-container'));
            expect(container).toBeNull();
        });
    }));

    it('legendIsNeeded does not display a legend when edgeColorField is not set', async(() => {
        component.options.edgeColorField = new FieldMetaData('');
        component.displayGraph = true;

        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let container = fixture.debugElement.query(By.css('mat-sidenav-container .legend-container'));
            expect(container).toBeNull();
        });
    }));

    it('legendIsNeeded displays a legend when display boolean is set to true and edgeColorField is set', async(() => {
        component.options.edgeColorField = new FieldMetaData('testEdgeColorField');
        component.displayGraph = true;

        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let container = fixture.debugElement.query(By.css('mat-sidenav-container .legend-container'));
            expect(container).not.toBeNull();
        });
    }));

    it('does filter graph when filters are set', (() => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.typeField = new FieldMetaData('testTypeField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');

        getService(FilterService).addFilter(null, 'idA', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
        neon.query.where('testTypeField', '=', 'testTypeValue'), 'testTypeFilter1');

        getService(FilterService).addFilter(null, 'idB', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testTypeField', '=', 'testTypeValue4'), 'testTypeFilter2');

        let spy = spyOn(component, 'resetGraphData');

        component.onQuerySuccess(component.options, {
            data: [{
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
                }]
        });

        expect(component.neonFilters.length).toEqual(2);
        expect(spy.calls.count()).toEqual(1);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    }));

    it('does create filter for graph when legend item is selected', (() => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.typeField = new FieldMetaData('testTypeField');
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

        component.onQuerySuccess(component.options, {
            data: [{
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
            }]
        });

        component.legendItemSelected({currentlyActive: true, fieldName: 'testTypeField', value: 'testTypeValue2'});

        let filters = getService(FilterService).getFiltersForFields(component.options.database.name, component.options.table.name,
            component.options.filterFields);
        expect(filters.length).toEqual(1);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));

    }));

    it('does create filter for graph when graph node is selected', (() => {
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.linkNameField = new FieldMetaData('testLinkNameField');
        component.options.typeField = new FieldMetaData('testTypeField');
        component.options.nodeNameField = new FieldMetaData('testNodeNameField');
        component.options.nodeField = new FieldMetaData('testNodeField');
        component.options.xPositionField = new FieldMetaData('testXPositionField');
        component.options.yPositionField = new FieldMetaData('testYPositionField');
        component.options.nodeColor = '#96f4f2';
        component.options.edgeColor = '#93663e';
        component.options.linkColor = '#938d8f';
        component.options.nodeShape = 'star';
        component.options.isReified = false;
        component.options.filterFields = ['testTypeField'];
        component.options.limit = Infinity;
        component.options.multiFilterOperator = 'and';

        component.onQuerySuccess(component.options, {
            data: [{
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
            }]
        });

        component.onSelect({nodes: ['testNodeValue2']});

        let filters = getService(FilterService).getFiltersForFields(component.options.database.name, component.options.table.name,
            component.options.filterFields);
        expect(filters.length).toEqual(1);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));

    }));

});
