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
import { Injector } from '@angular/core';
import { } from 'jasmine-core';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { CompoundFilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { DashboardService } from '../../services/dashboard.service';

import { NeonConfig, NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData } from '../../model/types';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { TaxonomyViewerComponent, TaxonomyGroup } from './taxonomy-viewer.component';

import { TaxonomyViewerModule } from './taxonomy-viewer.module';
import { ConfigService } from '../../services/config.service';

describe('Component: TaxonomyViewer', () => {
    let component: TaxonomyViewerComponent;
    let fixture: ComponentFixture<TaxonomyViewerComponent>;

    let responseData = [{
        testIdField: 'testId1',
        testTypeField: ['testTypeA', 'testTypeB', 'testTypeC', 'testTypeD'],
        testCategoryField: ['testCategoryI', 'testCategoryII'],
        testValueField: 'value01',
        testSourceIdField: ['source1', 'source2']
    }, {
        testIdField: 'testId2',
        testTypeField: ['testTypeA', 'testTypeB', 'testTypeC', 'testTypeD', 'testTypeE', 'testTypeF', 'testTypeG', 'testTypeH'],
        testCategoryField: ['testCategoryII'],
        testValueField: '',
        testSourceIdField: ['source15', 'source16', 'source17', 'source18']
    }, {
        testIdField: 'testId3',
        testTypeField: ['testTypeC', 'testTypeD', 'testTypeE', 'testTypeF'],
        testCategoryField: ['testCategoryIII'],
        testValueField: 'value02',
        testSourceIdField: ['source9']
    }, {
        testIdField: 'testId4',
        testTypeField: ['testTypeE', 'testTypeF'],
        testCategoryField: ['testCategoryI', 'testCategoryIII'],
        testValueField: 'value04',
        testSourceIdField: ['source2', 'source5', 'source7', 'source15', 'source18']
    }, {
        testIdField: 'testId5',
        testTypeField: ['testTypeH'],
        testCategoryField: ['testCategoryII', 'testCategoryIII'],
        testValueField: 'value05',
        testSourceIdField: ['source20', 'source23']
    }, {
        testIdField: 'testId6',
        testTypeField: ['testTypeE'],
        testCategoryField: ['testCategoryI', 'testCategoryIIII'],
        testValueField: '',
        testSourceIdField: ['source3', 'source16', 'source17', 'source20', 'source23']
    }];

    let createTestTaxonomyGroups = () => {
        let taxonomyGroups = [{
            checked: true,
            description: DashboardServiceMock.FIELD_MAP.CATEGORY,
            indeterminate: false,
            level: 1,
            name: 'testCategoryI',
            children: [{
                checked: true,
                description: DashboardServiceMock.FIELD_MAP.TYPE,
                indeterminate: false,
                level: 2,
                name: 'testTypeA',
                children: [{
                    checked: true,
                    description: DashboardServiceMock.FIELD_MAP.NAME,
                    indeterminate: false,
                    level: 3,
                    name: 'testSubType1',
                    children: []
                }, {
                    checked: true,
                    description: DashboardServiceMock.FIELD_MAP.NAME,
                    indeterminate: false,
                    level: 3,
                    name: 'testSubType2',
                    children: []
                }]
            }, {
                checked: true,
                description: DashboardServiceMock.FIELD_MAP.TYPE,
                indeterminate: false,
                level: 2,
                name: 'testTypeB',
                children: []
            }]
        }, {
            checked: true,
            description: DashboardServiceMock.FIELD_MAP.CATEGORY,
            indeterminate: false,
            level: 1,
            name: 'testCategoryII',
            children: [{
                checked: true,
                description: DashboardServiceMock.FIELD_MAP.TYPE,
                indeterminate: false,
                level: 2,
                name: 'testTypeC',
                children: []
            }, {
                checked: true,
                description: DashboardServiceMock.FIELD_MAP.TYPE,
                indeterminate: false,
                level: 2,
                name: 'testTypeD',
                children: []
            }]
        }, {
            checked: true,
            description: DashboardServiceMock.FIELD_MAP.CATEGORY,
            indeterminate: false,
            level: 1,
            name: 'testCategoryIII',
            children: []
        }];

        taxonomyGroups.forEach((categoryNode) => categoryNode.children.forEach((typeNode) => {
            (typeNode as any).parent = categoryNode;
            (typeNode as any).children.forEach((subTypeNode) => {
                (subTypeNode).parent = typeNode;
            });
        }));
        return taxonomyGroups as TaxonomyGroup[];
    };

    initializeTestBed('Taxonomy', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) }

        ],
        imports: [
            TaxonomyViewerModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TaxonomyViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));

    it('does have expected class option properties', () => {
        expect(component.options.ascending).toEqual(false);
        expect(component.options.id).toEqual('');
        expect(component.options.ignoreSelf).toEqual(false);
        expect(component.options.filterFields).toEqual([]);

        expect(component.options.categoryField).toEqual(NeonFieldMetaData.get());
        expect(component.options.typeField).toEqual(NeonFieldMetaData.get());
        expect(component.options.subTypeField).toEqual(NeonFieldMetaData.get());
        expect(component.options.idField).toEqual(NeonFieldMetaData.get());
    });

    it('does have expected class properties', () => {
        expect(component.taxonomyGroups).toEqual([]);
        expect(component.testOptions).toBeDefined();
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = NeonFieldMetaData.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];
        component.options.ascending = true;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                filters: [{
                    field: 'testIdField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testIdField',
                    operator: '!=',
                    value: ''
                }],
                type: 'and'
            },
            sort: {
                field: 'testCategoryField',
                order: 1
            }
        });
    }));

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.treeRoot).toBeDefined();
    });

    it('validateVisualizationQuery does return expected result', (() => {
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.database = NeonDatabaseMetaData.get({ name: 'testDatabase' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.table = NeonTableMetaData.get({ name: 'testTable' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        expect(component.validateVisualizationQuery(component.options)).toBe(true);
    }));

    it('transformVisualizationQueryResults does load the Taxonomy', (() => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.ascending = true;

        component.transformVisualizationQueryResults(component.options, responseData);

        expect(component.taxonomyGroups.length).toEqual(4);
        expect(component.taxonomyGroups[0].name).toEqual('testCategoryI');
        expect(component.taxonomyGroups[0].children.length).toEqual(6);
        expect(component.taxonomyGroups[1].name).toEqual('testCategoryII');
        expect(component.taxonomyGroups[1].children.length).toEqual(8);
        expect(component.taxonomyGroups[2].name).toEqual('testCategoryIII');
        expect(component.taxonomyGroups[2].children.length).toEqual(5);
        expect(component.taxonomyGroups[3].name).toEqual('testCategoryIIII');
        expect(component.taxonomyGroups[3].children.length).toEqual(1);
    }));

    it('does create filter when a parent node in the taxonomy is unselected', async(() => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = NeonFieldMetaData.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[2].checked = false;
            expect(component.taxonomyGroups[2].checked).toBe(false);

            let filters = (component as any).cachedFilters.getFilters();
            expect(filters.length).toEqual(1);
            expect(filters[0].field).toEqual('testCategoryField');
            expect(filters[0].value).toEqual('testCategoryIII');
        });
    }));

    it('does remove parent filter and create a new filter when a child node in the taxonomy is selected', async(() => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = NeonFieldMetaData.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[1].checked = false;
            component.getElementRefs().treeRoot.treeModel.nodes[1].children[3].checked = true;
            expect(component.taxonomyGroups[1].checked).toBe(false);
            expect(component.taxonomyGroups[1].children[3].checked).toBe(true);

            let filters = (component as any).cachedFilters.getFilters();
            expect(filters.length).toEqual(1);
            expect(filters[0].field).toEqual('testTypeField');
            expect(filters[0].value).toEqual('testCategoryII testTypeField');
        });
    }));

    it('does remove and create a new filter when a child node in the taxonomy is unselected', async(() => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = NeonFieldMetaData.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[1].children[3].checked = false;
            expect(component.taxonomyGroups[1].children[3].checked).toBe(false);

            let filters = (component as any).cachedFilters.getFilters();
            expect(filters.length).toEqual(1);
            expect(filters[0].field).toEqual('testTypeField');
            expect(filters[0].value).toEqual('testCategoryII testTypeField');
        });
    }));

    it('does select child nodes when a parent nodes is selected in the taxonomy', async(() => {
        let refs = component.getElementRefs();
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = NeonFieldMetaData.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            refs.treeRoot.treeModel.nodes[3].children[1].checked = true;
            expect(refs.treeRoot.treeModel.nodes[3].children.length).toEqual(2);
            expect(component.taxonomyGroups[3].checked).toEqual(true);
        });
    }));

    it('does update parent node when child node is selected in the taxonomy', async(() => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = NeonFieldMetaData.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[2].children[1].checked = true;
            expect(component.taxonomyGroups[2].children[1].checked).toEqual(true);
            expect(component.getElementRefs().treeRoot.treeModel.nodes[2].parent.data.indeterminate).toEqual(true);
        });
    }));

    it('does add leaf values under a type when value field exists', (() => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = NeonFieldMetaData.get({ columnName: 'testSubTypeField' });
        component.options.valueField = NeonFieldMetaData.get({ columnName: 'testValueField' });

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            const groups = component.taxonomyGroups as any[];

            expect(groups[0].name).toEqual('testCategoryI');
            expect(groups[0].children.length).toEqual(6);
            expect(groups[0].children[0].name).toEqual('testTypeA');
            for (let child of groups[0].children) {
                expect(child.children[0].name).toEqual('value01');
            }

            expect(groups[1].name).toEqual('testCategoryII');
            expect(groups[1].children.length).toEqual(8);
            expect(groups[1].children[7].name).toEqual('testTypeH');
            expect(groups[1].children[7].children.length).toEqual(1);
            expect(groups[1].children[7].children[0].name).toEqual('value05');

            expect(groups[2].name).toEqual('testCategoryIII');
            expect(groups[2].children.length).toEqual(5);
            expect(groups[2].children[0].name).toEqual('testTypeC');
            expect(groups[2].children[0].children.length).toEqual(1);
            expect(groups[2].children[0].children[0].name).toEqual('value02');
        });
    }));

    it('does not add leaf values under a type when value field does not exist', (() => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = NeonFieldMetaData.get({ columnName: 'testSubTypeField' });
        component.options.valueField = NeonFieldMetaData.get({ columnName: 'testValueField' });

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            const groups = component.taxonomyGroups as any[];

            expect(groups[1].name).toEqual('testCategoryII');
            expect(groups[1].children.length).toEqual(8);
            expect(groups[1].children[6].name).toEqual('testTypeG');
            expect(groups[1].children[6].children.length).toEqual(0);

            expect(groups[3].name).toEqual('testCategoryIIII');
            expect(groups[3].children.length).toEqual(1);
            expect(groups[3].children[0].name).toEqual('testTypeE');
            expect(groups[3].children[0].children.length).toEqual(0);
        });
    }));

    it('leaf node class is set based on position in tree', (() => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = NeonFieldMetaData.get({ columnName: 'testSubTypeField' });
        component.options.valueField = NeonFieldMetaData.get({ columnName: 'testValueField' });

        let classString = 'test-class';

        let nodeA = {
            level: 3,
            hasChildren: false,
            children: []

        };
        let nodeB = {
            level: 2,
            hasChildren: false,
            children: [nodeA]

        };
        let nodeC = {
            level: 2,
            hasChildren: true,
            children: [nodeB]
        };
        let nodeD = {
            level: 1,
            hasChildren: true,
            children: [nodeA]
        };

        let nodeClass = component.setClassForTreePosition(nodeA, classString);
        expect(nodeClass).toEqual('test-class3 leaf-node-level');

        nodeClass = component.setClassForTreePosition(nodeB, classString);
        expect(nodeClass).toEqual('test-class2');

        nodeClass = component.setClassForTreePosition(nodeC, classString);
        expect(nodeClass).toEqual('test-class2 leaf-node-level');

        nodeClass = component.setClassForTreePosition(nodeD, classString);
        expect(nodeClass).toEqual('test-class1');
    }));

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[0].filterDesign).operator).toEqual('!=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('and');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('!=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());

        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[0].filterDesign).operator).toEqual('!=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('and');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('!=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[2].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect((actual[2].filterDesign).operator).toEqual('!=');
        expect((actual[2].filterDesign).value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[3].filterDesign).type).toEqual('and');
        expect((actual[3].filterDesign).filters.length).toEqual(1);
        expect((actual[3].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect((actual[3].filterDesign).filters[0].operator).toEqual('!=');
        expect((actual[3].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());

        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(6);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[0].filterDesign).operator).toEqual('!=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[1].filterDesign).type).toEqual('and');
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('!=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[2].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[2].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[2].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect((actual[2].filterDesign).operator).toEqual('!=');
        expect((actual[2].filterDesign).value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[3].filterDesign).type).toEqual('and');
        expect((actual[3].filterDesign).filters.length).toEqual(1);
        expect((actual[3].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[3].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[3].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect((actual[3].filterDesign).filters[0].operator).toEqual('!=');
        expect((actual[3].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[4].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[4].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[4].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((actual[4].filterDesign).operator).toEqual('!=');
        expect((actual[4].filterDesign).value).toBeUndefined();
        expect(actual[4].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[5].filterDesign).type).toEqual('and');
        expect((actual[5].filterDesign).filters.length).toEqual(1);
        expect((actual[5].filterDesign).filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[5].filterDesign).filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[5].filterDesign).filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((actual[5].filterDesign).filters[0].operator).toEqual('!=');
        expect((actual[5].filterDesign).filters[0].value).toBeUndefined();
        expect(actual[5].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
    });

    it('checkRelatedNodes to deselect a category does call exchangeFilters with category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;
        component.taxonomyGroups = createTestTaxonomyGroups();

        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        component.checkRelatedNodes(groups[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testCategoryI'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeB'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(groups[0].checked).toEqual(false);
        expect(groups[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[1].checked).toEqual(false);
        expect(groups[0].children[1].checked).toEqual(false);
        expect(groups[1].checked).toEqual(true);
        expect(groups[1].children[0].checked).toEqual(true);
        expect(groups[1].children[1].checked).toEqual(true);
        expect(groups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a type does call exchangeFilters with type / subtype filters and remove category filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;
        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        component.checkRelatedNodes(groups[0].children[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '!=',
            value: 'testTypeA'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], [{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign]]);
        expect(groups[0].checked).toEqual(true);
        expect(groups[0].indeterminate).toEqual(true);
        expect(groups[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[1].checked).toEqual(false);
        expect(groups[0].children[1].checked).toEqual(true);
        expect(groups[1].checked).toEqual(true);
        expect(groups[1].children[0].checked).toEqual(true);
        expect(groups[1].children[1].checked).toEqual(true);
        expect(groups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a subtype does call exchangeFilters with subtype filters and remove category / type filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;
        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        component.checkRelatedNodes(groups[0].children[0].children[0], {
            target: {
                checked: false
            }
        });

        const [filters] = spy.calls.argsFor(0);
        filters.forEach((filter) => {
            filter.database = filter.database.name;
            filter.table = filter.table.name;
            filter.field = filter.field.columnName;
        });

        const [filterA, filterB] = filters.sort((field1, field2) => field1.field.localeCompare(field2.field));

        expect(spy.calls.count()).toEqual(1);
        expect(filterA).toEqual({
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.NAME.columnName,
            operator: '!=',
            value: 'testTypeA'
        });
        expect(filterB).toEqual({
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.TYPE.columnName,
            operator: '!=',
            value: 'testSubType1'
        });

        expect(groups[0].checked).toEqual(true);
        expect(groups[0].children[0].checked).toEqual(true);
        expect(groups[0].children[0].indeterminate).toEqual(true);
        expect(groups[0].children[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[1].checked).toEqual(true);
        expect(groups[0].children[1].checked).toEqual(true);
        expect(groups[1].checked).toEqual(true);
        expect(groups[1].children[0].checked).toEqual(true);
        expect(groups[1].children[1].checked).toEqual(true);
        expect(groups[2].checked).toEqual(true);

    });


    it('checkRelatedNodes to deselect a category with other unselected categories does call exchangeFilters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;

        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        groups[1].checked = false;
        groups[1].children[0].checked = false;
        groups[1].children[1].checked = false;

        component.checkRelatedNodes(groups[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '!=',
                value: 'testCategoryI'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '!=',
                value: 'testCategoryII'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeB'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeC'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeD'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(groups[0].checked).toEqual(false);
        expect(groups[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[1].checked).toEqual(false);
        expect(groups[0].children[1].checked).toEqual(false);
        expect(groups[1].checked).toEqual(false);
        expect(groups[1].children[0].checked).toEqual(false);
        expect(groups[1].children[1].checked).toEqual(false);
        expect(groups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a type with other unselected types does call exchangeFilters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;

        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        groups[1].checked = false;
        groups[1].children[0].checked = false;
        groups[1].children[1].checked = false;

        component.checkRelatedNodes(groups[0].children[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testCategoryII'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeC'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeD'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(groups[0].checked).toEqual(true);
        expect(groups[0].indeterminate).toEqual(true);
        expect(groups[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[1].checked).toEqual(false);
        expect(groups[0].children[1].checked).toEqual(true);
        expect(groups[1].checked).toEqual(false);
        expect(groups[1].children[0].checked).toEqual(false);
        expect(groups[1].children[1].checked).toEqual(false);
        expect(groups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to select a category does call exchangeFilters and remove category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;

        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        groups[0].checked = false;
        groups[0].children[0].checked = false;
        groups[0].children[0].children[0].checked = false;

        component.checkRelatedNodes(groups[0], {
            target: {
                checked: true
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], [{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign]]);
        expect(groups[0].checked).toEqual(true);
        expect(groups[0].children[0].checked).toEqual(true);
        expect(groups[0].children[0].children[0].checked).toEqual(true);
        expect(groups[0].children[0].children[1].checked).toEqual(true);
        expect(groups[0].children[1].checked).toEqual(true);
        expect(groups[1].checked).toEqual(true);
        expect(groups[1].children[0].checked).toEqual(true);
        expect(groups[1].children[1].checked).toEqual(true);
        expect(groups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to select a type does call exchangeFilters and remove all category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;

        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        groups[0].children[0].checked = false;
        groups[0].children[0].children[0].checked = false;

        component.checkRelatedNodes(groups[0].children[0], {
            target: {
                checked: true
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], [{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign]]);
        expect(groups[0].checked).toEqual(true);
        expect(groups[0].children[0].checked).toEqual(true);
        expect(groups[0].children[0].children[0].checked).toEqual(true);
        expect(groups[0].children[0].children[1].checked).toEqual(true);
        expect(groups[0].children[1].checked).toEqual(true);
        expect(groups[1].checked).toEqual(true);
        expect(groups[1].children[0].checked).toEqual(true);
        expect(groups[1].children[1].checked).toEqual(true);
        expect(groups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to select a subtype does call exchangeFilters and remove all category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;

        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        groups[0].children[0].children[0].checked = false;

        component.checkRelatedNodes(groups[0].children[0].children[0], {
            target: {
                checked: true
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], [{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign]]);
        expect(groups[0].checked).toEqual(true);
        expect(groups[0].children[0].checked).toEqual(true);
        expect(groups[0].children[0].children[0].checked).toEqual(true);
        expect(groups[0].children[0].children[1].checked).toEqual(true);
        expect(groups[0].children[1].checked).toEqual(true);
        expect(groups[1].checked).toEqual(true);
        expect(groups[1].children[0].checked).toEqual(true);
        expect(groups[1].children[1].checked).toEqual(true);
        expect(groups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a category does call exchangeFilters (with no typeField or subTypeField)', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;

        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        component.checkRelatedNodes(groups[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testCategoryI'
        } as SimpleFilterDesign], []]);
        expect(groups[0].checked).toEqual(false);
        expect(groups[1].checked).toEqual(true);
        expect(groups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a category does call exchangeFilters (with no subTypeField)', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;

        const groups = createTestTaxonomyGroups() as any[];
        component.taxonomyGroups = groups;

        component.checkRelatedNodes(groups[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testCategoryI'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeB'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(groups[0].checked).toEqual(false);
        expect(groups[0].children[0].checked).toEqual(false);
        expect(groups[0].children[1].checked).toEqual(false);
        expect(groups[1].checked).toEqual(true);
        expect(groups[1].children[0].checked).toEqual(true);
        expect(groups[1].children[1].checked).toEqual(true);
        expect(groups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes does ignore unselected types if typeField equals categoryField', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;
        component.taxonomyGroups = [{
            checked: true,
            description: DashboardServiceMock.FIELD_MAP.CATEGORY,
            indeterminate: false,
            level: 1,
            name: 'testCategoryI',
            children: [{
                checked: true,
                description: DashboardServiceMock.FIELD_MAP.CATEGORY,
                indeterminate: false,
                level: 2,
                name: 'testCategoryI.testTypeA',
                children: [{
                    checked: true,
                    description: DashboardServiceMock.FIELD_MAP.NAME,
                    indeterminate: false,
                    level: 3,
                    name: 'testSubType1',
                    children: []
                }, {
                    checked: true,
                    description: DashboardServiceMock.FIELD_MAP.NAME,
                    indeterminate: false,
                    level: 3,
                    name: 'testSubType2',
                    children: []
                }]
            }, {
                checked: true,
                description: DashboardServiceMock.FIELD_MAP.CATEGORY,
                indeterminate: false,
                level: 2,
                name: 'testCategoryI.testTypeB',
                children: []
            }]
        }] as any[];

        const groups = component.taxonomyGroups as any[];

        component.checkRelatedNodes(groups[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '!=',
                value: 'testCategoryI'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '!=',
                value: 'testCategoryI.testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.CATEGORY,
                operator: '!=',
                value: 'testCategoryI.testTypeB'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(groups[0].checked).toEqual(false);
        expect(groups[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[1].checked).toEqual(false);
        expect(groups[0].children[1].checked).toEqual(false);
    });

    it('checkRelatedNodes does ignore unselected subtypes if subTypeField equals typeField', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DashboardServiceMock.FIELD_MAP.CATEGORY;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.taxonomyGroups = [{
            checked: true,
            description: DashboardServiceMock.FIELD_MAP.CATEGORY,
            indeterminate: false,
            level: 1,
            name: 'testCategoryI',
            children: [{
                checked: true,
                description: DashboardServiceMock.FIELD_MAP.TYPE,
                indeterminate: false,
                level: 2,
                name: 'testTypeA',
                children: [{
                    checked: true,
                    description: DashboardServiceMock.FIELD_MAP.TYPE,
                    indeterminate: false,
                    level: 3,
                    name: 'testTypeA.testSubType1',
                    children: []
                }, {
                    checked: true,
                    description: DashboardServiceMock.FIELD_MAP.TYPE,
                    indeterminate: false,
                    level: 3,
                    name: 'testTypeA.testSubType2',
                    children: []
                }]
            }, {
                checked: true,
                description: DashboardServiceMock.FIELD_MAP.TYPE,
                indeterminate: false,
                level: 2,
                name: 'testTypeB',
                children: []
            }]
        }] as any[];

        const groups = component.taxonomyGroups as any[];
        component.checkRelatedNodes(groups[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.CATEGORY,
            operator: '!=',
            value: 'testCategoryI'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeA.testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeA.testSubType2'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '!=',
                value: 'testTypeB'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(groups[0].checked).toEqual(false);
        expect(groups[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[1].checked).toEqual(false);
        expect(groups[0].children[1].checked).toEqual(false);
    });
});
