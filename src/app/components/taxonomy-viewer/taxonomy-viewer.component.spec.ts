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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { } from 'jasmine-core';

import {
    AbstractSearchService,
    CompoundFilterType,
    CoreSearch,
    DatabaseConfig,
    FieldConfig,
    FilterCollection,
    ListFilterDesign,
    SearchServiceMock,
    TableConfig
} from '@caci-critical-insight-solutions/nucleus-core';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { DashboardService } from '../../services/dashboard.service';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { TaxonomyViewerComponent, TaxonomyGroup } from './taxonomy-viewer.component';

import { TaxonomyViewerModule } from './taxonomy-viewer.module';

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
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
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

        expect(component.options.categoryField).toEqual(FieldConfig.get());
        expect(component.options.typeField).toEqual(FieldConfig.get());
        expect(component.options.subTypeField).toEqual(FieldConfig.get());
        expect(component.options.idField).toEqual(FieldConfig.get());
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
        component.options.subTypeField = FieldConfig.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];
        component.options.ascending = true;

        let searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

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
                    field: 'testIdField'
                },
                operator: '!=',
                rhs: null
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testCategoryField'
                },
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
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

        component.options.database = DatabaseConfig.get({ name: 'testDatabase' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.table = TableConfig.get({ name: 'testTable' });
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

        component.transformVisualizationQueryResults(component.options, responseData, new FilterCollection());

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
        component.options.subTypeField = FieldConfig.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData, new FilterCollection());

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
        component.options.subTypeField = FieldConfig.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData, new FilterCollection());

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
        component.options.subTypeField = FieldConfig.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData, new FilterCollection());

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
        component.options.subTypeField = FieldConfig.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData, new FilterCollection());

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
        component.options.subTypeField = FieldConfig.get({ columnName: 'testSubTypeField' });
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData, new FilterCollection());

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
        component.options.subTypeField = FieldConfig.get({ columnName: 'testSubTypeField' });
        component.options.valueField = FieldConfig.get({ columnName: 'testValueField' });

        component.transformVisualizationQueryResults(component.options, responseData, new FilterCollection());

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
        component.options.subTypeField = FieldConfig.get({ columnName: 'testSubTypeField' });
        component.options.valueField = FieldConfig.get({ columnName: 'testValueField' });

        component.transformVisualizationQueryResults(component.options, responseData, new FilterCollection());

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
        component.options.subTypeField = FieldConfig.get({ columnName: 'testSubTypeField' });
        component.options.valueField = FieldConfig.get({ columnName: 'testValueField' });

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
        expect(actual.length).toEqual(1);
        expect((actual[0]).type).toEqual('and');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('!=');
        expect((actual[0]).values).toEqual([undefined]);

        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0]).type).toEqual('and');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('!=');
        expect((actual[0]).values).toEqual([undefined]);
        expect((actual[1]).type).toEqual('and');
        expect((actual[1]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TYPE.columnName);
        expect((actual[1]).operator).toEqual('!=');
        expect((actual[1]).values).toEqual([undefined]);

        component.options.subTypeField = DashboardServiceMock.FIELD_MAP.NAME;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(3);
        expect((actual[0]).type).toEqual('and');
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.CATEGORY.columnName);
        expect((actual[0]).operator).toEqual('!=');
        expect((actual[0]).values).toEqual([undefined]);
        expect((actual[1]).type).toEqual('and');
        expect((actual[1]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TYPE.columnName);
        expect((actual[1]).operator).toEqual('!=');
        expect((actual[1]).values).toEqual([undefined]);
        expect((actual[2]).type).toEqual('and');
        expect((actual[2]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.NAME.columnName);
        expect((actual[2]).operator).toEqual('!=');
        expect((actual[2]).values).toEqual([undefined]);
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
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', ['testCategoryI']),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testTypeA', 'testTypeB']),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testSubType1', 'testSubType2'])
        ], [], true]);
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
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testTypeA']),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testSubType1', 'testSubType2'])
        ], [
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', [undefined])
        ], true]);
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

        expect(spy.calls.count()).toEqual(1);
        expect(filters[0]).toEqual(new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testTypeA']));
        expect(filters[1]).toEqual(new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testSubType1']));

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
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', ['testCategoryI', 'testCategoryII']),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testTypeA', 'testTypeB', 'testTypeC', 'testTypeD']),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testSubType1', 'testSubType2'])
        ], [], true]);
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
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', ['testCategoryII']),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testTypeA', 'testTypeC', 'testTypeD']),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testSubType1', 'testSubType2'])
        ], [], true]);
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
        expect(spy.calls.argsFor(0)).toEqual([[], [
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', [undefined]),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', [undefined]),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', [undefined])
        ], true]);
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
        expect(spy.calls.argsFor(0)).toEqual([[], [
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', [undefined]),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', [undefined]),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', [undefined])
        ], true]);
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
        expect(spy.calls.argsFor(0)).toEqual([[], [
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', [undefined]),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', [undefined]),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', [undefined])
        ], true]);
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
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', ['testCategoryI'])
        ], [], true]);
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
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', ['testCategoryI']),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=', ['testTypeA', 'testTypeB'])
        ], [], true]);
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
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(
                CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name +
                '.' + DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=',
                ['testCategoryI', 'testCategoryI.testTypeA', 'testCategoryI.testTypeB']
            ),
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.NAME.columnName, '!=', ['testSubType1', 'testSubType2'])
        ], [], true]);
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
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.CATEGORY.columnName, '!=', ['testCategoryI']),
            new ListFilterDesign(
                CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name +
                '.' + DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.TYPE.columnName, '!=',
                ['testTypeA', 'testTypeA.testSubType1', 'testTypeA.testSubType2', 'testTypeB']
            )
        ], [], true]);
        expect(groups[0].checked).toEqual(false);
        expect(groups[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[0].checked).toEqual(false);
        expect(groups[0].children[0].children[1].checked).toEqual(false);
        expect(groups[0].children[1].checked).toEqual(false);
    });
});
