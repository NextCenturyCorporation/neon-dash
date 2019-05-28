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
import { Injector } from '@angular/core';
import { query } from 'neon-framework';
import { } from 'jasmine-core';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { CompoundFilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { DatasetService } from '../../services/dataset.service';

import { DatabaseMetaData, FieldMetaData, TableMetaData, SimpleFilter } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { TaxonomyViewerComponent, TaxonomyGroup } from './taxonomy-viewer.component';

import { TaxonomyViewerModule } from './taxonomy-viewer.module';
import { ConfigService } from '../../services/config.service';

fdescribe('Component: TaxonomyViewer', () => {
    let component: TaxonomyViewerComponent;
    let fixture: ComponentFixture<TaxonomyViewerComponent>;

    function group(gidx: number) {
        return component.taxonomyGroups[gidx];
    }

    function subGroup(gidx: number, sidx: number) {
        return group(gidx).children[sidx] as TaxonomyGroup;
    }

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
            description: DatasetServiceMock.CATEGORY_FIELD,
            indeterminate: false,
            level: 1,
            name: 'testCategoryI',
            children: [{
                checked: true,
                description: DatasetServiceMock.TYPE_FIELD,
                indeterminate: false,
                level: 2,
                name: 'testTypeA',
                children: [{
                    checked: true,
                    description: DatasetServiceMock.NAME_FIELD,
                    indeterminate: false,
                    level: 3,
                    name: 'testSubType1',
                    children: []
                }, {
                    checked: true,
                    description: DatasetServiceMock.NAME_FIELD,
                    indeterminate: false,
                    level: 3,
                    name: 'testSubType2',
                    children: []
                }]
            }, {
                checked: true,
                description: DatasetServiceMock.TYPE_FIELD,
                indeterminate: false,
                level: 2,
                name: 'testTypeB',
                children: []
            }]
        }, {
            checked: true,
            description: DatasetServiceMock.CATEGORY_FIELD,
            indeterminate: false,
            level: 1,
            name: 'testCategoryII',
            children: [{
                checked: true,
                description: DatasetServiceMock.TYPE_FIELD,
                indeterminate: false,
                level: 2,
                name: 'testTypeC',
                children: []
            }, {
                checked: true,
                description: DatasetServiceMock.TYPE_FIELD,
                indeterminate: false,
                level: 2,
                name: 'testTypeD',
                children: []
            }]
        }, {
            checked: true,
            description: DatasetServiceMock.CATEGORY_FIELD,
            indeterminate: false,
            level: 1,
            name: 'testCategoryIII',
            children: []
        }] as any as TaxonomyGroup[];

        taxonomyGroups.forEach((categoryNode) => categoryNode.children.forEach((typeNode) => {
            typeNode['parent'] = categoryNode;
            typeNode['children'].forEach((subTypeNode) => subTypeNode['parent'] = typeNode);
        }));
        return taxonomyGroups;
    };

    initializeTestBed('Taxonomy', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) }

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

        expect(component.options.categoryField).toEqual(new FieldMetaData());
        expect(component.options.typeField).toEqual(new FieldMetaData());
        expect(component.options.subTypeField).toEqual(new FieldMetaData());
        expect(component.options.idField).toEqual(new FieldMetaData());
    });

    it('does have expected class properties', () => {
        expect(component.taxonomyGroups).toEqual([]);
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
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
    });

    it('validateVisualizationQuery does return expected result', (() => {
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.database = new DatabaseMetaData('testDatabase');
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.table = new TableMetaData('testTable');
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.idField = DatasetServiceMock.ID_FIELD;
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        expect(component.validateVisualizationQuery(component.options)).toBe(true);
    }));

    it('transformVisualizationQueryResults does load the Taxonomy', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.ascending = true;

        component.transformVisualizationQueryResults(component.options, responseData);

        expect(component.taxonomyGroups.length).toEqual(4);
        expect(group(0).name).toEqual('testCategoryI');
        expect(group(0).children.length).toEqual(6);
        expect(group(1).name).toEqual('testCategoryII');
        expect(group(1).children.length).toEqual(8);
        expect(group(2).name).toEqual('testCategoryIII');
        expect(group(2).children.length).toEqual(5);
        expect(group(3).name).toEqual('testCategoryIIII');
        expect(group(3).children.length).toEqual(1);

    }));

    fit('does create filter when a parent node in the taxonomy is unselected', async(() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            component.treeControl.dataNodes[2].checked = false;
            expect(group(2).checked).toBe(false);

            fixture.detectChanges();

            let filters = component['cachedFilters'].getFilters([]);
            expect(filters.length).toEqual(1);
            expect((filters[0] as query.WhereClause).field).toEqual('testCategoryField');
            expect((filters[0] as query.WhereClause).value).toEqual('testCategoryIII');
        });
    }));

    it('does remove parent filter and create a new filter when a child node in the taxonomy is selected', async(() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.treeControl.dataNodes[1].checked = false;
            (component.treeControl.dataNodes[1] as TaxonomyGroup).children[3].checked = true;
            expect(group(1).checked).toBe(false);
            expect(subGroup(1, 3).checked).toBe(true);

            let filters = component['cachedFilters'].getFilters([]);
            expect(filters.length).toEqual(1);
            expect((filters[0] as query.WhereClause).field).toEqual('testTypeField');
            expect((filters[0] as query.WhereClause).value).toEqual('testCategoryII testTypeField');
        });
    }));

    it('does remove and create a new filter when a child node in the taxonomy is unselected', async(() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            (component.treeControl.dataNodes[1] as TaxonomyGroup).children[3].checked = false;
            expect(subGroup(1, 3).checked).toBe(false);

            let filters = component['cachedFilters'].getFilters([]);
            expect(filters.length).toEqual(1);
            expect((filters[0] as query.WhereClause).field).toEqual('testTypeField');
            expect((filters[0] as query.WhereClause).value).toEqual('testCategoryII testTypeField');
        });
    }));

    it('does select child nodes when a parent nodes is selected in the taxonomy', async(() => {
        let refs = component.getElementRefs();
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            (component.treeControl.dataNodes[3] as TaxonomyGroup).children[1].checked = true;
            expect((component.treeControl.dataNodes[3] as TaxonomyGroup).children.length).toEqual(2);
            expect(group(3).checked).toEqual(true);
        });
    }));

    it('does update parent node when child node is selected in the taxonomy', async(() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            (component.treeControl.dataNodes[2] as TaxonomyGroup).children[1].checked = true;
            expect(subGroup(2, 1).checked).toEqual(true);
            expect(component.treeControl.dataNodes[2].parent.indeterminate).toEqual(true);
        });
    }));

    it('does add leaf values under a type when value field exists', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.valueField = new FieldMetaData('testValueField');

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            expect(group(0).name).toEqual('testCategoryI');
            expect(group(0).children.length).toEqual(6);
            expect(subGroup(0, 0).name).toEqual('testTypeA');
            for (let child of group(0).children as TaxonomyGroup[]) {
                expect(child.children[0].name).toEqual('value01');
            }

            expect(group(1).name).toEqual('testCategoryII');
            expect(group(1).children.length).toEqual(8);
            expect(subGroup(1, 7).name).toEqual('testTypeH');
            expect(subGroup(1, 7).children.length).toEqual(1);
            expect(subGroup(1, 7).children[0].name).toEqual('value05');

            expect(group(2).name).toEqual('testCategoryIII');
            expect(group(2).children.length).toEqual(5);
            expect(subGroup(2, 0).name).toEqual('testTypeC');
            expect(subGroup(2, 0).children.length).toEqual(1);
            expect(subGroup(2, 0).children[0].name).toEqual('value02');
        });
    }));

    it('does not add leaf values under a type when value field does not exist', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.valueField = new FieldMetaData('testValueField');

        component.transformVisualizationQueryResults(component.options, responseData);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            expect(group(1).name).toEqual('testCategoryII');
            expect(group(1).children.length).toEqual(8);
            expect(subGroup(1, 6).name).toEqual('testTypeG');
            expect(subGroup(1, 6).children.length).toEqual(0);

            expect(group(3).name).toEqual('testCategoryIIII');
            expect(group(3).children.length).toEqual(1);
            expect(subGroup(3, 0).name).toEqual('testTypeE');
            expect(subGroup(3, 0).children.length).toEqual(0);
        });
    }));

    it('leaf node class is set based on position in tree', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.valueField = new FieldMetaData('testValueField');

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
    }));

    it('designEachFilterWithNoValues does return expected object', () => {
        expect(component['designEachFilterWithNoValues']()).toEqual([]);

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        let actual = component['designEachFilterWithNoValues']();
        expect(actual.length).toEqual(2);
        expect(actual[0].filterDesign['database']).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].filterDesign['table']).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].filterDesign['field']).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(actual[0].filterDesign['operator']).toEqual('!=');
        expect(actual[0].filterDesign['value']).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
        expect(actual[1].filterDesign['type']).toEqual('and');
        expect(actual[1].filterDesign['filters'].length).toEqual(1);
        expect(actual[1].filterDesign['filters'][0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[1].filterDesign['filters'][0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[1].filterDesign['filters'][0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(actual[1].filterDesign['filters'][0].operator).toEqual('!=');
        expect(actual[1].filterDesign['filters'][0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());

        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        actual = component['designEachFilterWithNoValues']();
        expect(actual.length).toEqual(4);
        expect(actual[0].filterDesign['database']).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].filterDesign['table']).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].filterDesign['field']).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(actual[0].filterDesign['operator']).toEqual('!=');
        expect(actual[0].filterDesign['value']).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
        expect(actual[1].filterDesign['type']).toEqual('and');
        expect(actual[1].filterDesign['filters'].length).toEqual(1);
        expect(actual[1].filterDesign['filters'][0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[1].filterDesign['filters'][0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[1].filterDesign['filters'][0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(actual[1].filterDesign['filters'][0].operator).toEqual('!=');
        expect(actual[1].filterDesign['filters'][0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
        expect(actual[2].filterDesign['database']).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[2].filterDesign['table']).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[2].filterDesign['field']).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect(actual[2].filterDesign['operator']).toEqual('!=');
        expect(actual[2].filterDesign['value']).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
        expect(actual[3].filterDesign['type']).toEqual('and');
        expect(actual[3].filterDesign['filters'].length).toEqual(1);
        expect(actual[3].filterDesign['filters'][0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[3].filterDesign['filters'][0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[3].filterDesign['filters'][0].field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect(actual[3].filterDesign['filters'][0].operator).toEqual('!=');
        expect(actual[3].filterDesign['filters'][0].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());

        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        actual = component['designEachFilterWithNoValues']();
        expect(actual.length).toEqual(6);
        expect(actual[0].filterDesign['database']).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[0].filterDesign['table']).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[0].filterDesign['field']).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(actual[0].filterDesign['operator']).toEqual('!=');
        expect(actual[0].filterDesign['value']).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
        expect(actual[1].filterDesign['type']).toEqual('and');
        expect(actual[1].filterDesign['filters'].length).toEqual(1);
        expect(actual[1].filterDesign['filters'][0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[1].filterDesign['filters'][0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[1].filterDesign['filters'][0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(actual[1].filterDesign['filters'][0].operator).toEqual('!=');
        expect(actual[1].filterDesign['filters'][0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
        expect(actual[2].filterDesign['database']).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[2].filterDesign['table']).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[2].filterDesign['field']).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect(actual[2].filterDesign['operator']).toEqual('!=');
        expect(actual[2].filterDesign['value']).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
        expect(actual[3].filterDesign['type']).toEqual('and');
        expect(actual[3].filterDesign['filters'].length).toEqual(1);
        expect(actual[3].filterDesign['filters'][0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[3].filterDesign['filters'][0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[3].filterDesign['filters'][0].field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect(actual[3].filterDesign['filters'][0].operator).toEqual('!=');
        expect(actual[3].filterDesign['filters'][0].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
        expect(actual[4].filterDesign['database']).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[4].filterDesign['table']).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[4].filterDesign['field']).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(actual[4].filterDesign['operator']).toEqual('!=');
        expect(actual[4].filterDesign['value']).toBeUndefined();
        expect(actual[4].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
        expect(actual[5].filterDesign['type']).toEqual('and');
        expect(actual[5].filterDesign['filters'].length).toEqual(1);
        expect(actual[5].filterDesign['filters'][0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(actual[5].filterDesign['filters'][0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(actual[5].filterDesign['filters'][0].field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(actual[5].filterDesign['filters'][0].operator).toEqual('!=');
        expect(actual[5].filterDesign['filters'][0].value).toBeUndefined();
        expect(actual[5].redrawCallback.toString()).toEqual(component['redrawTaxonomy'].bind(component).toString());
    });

    it('checkRelatedNodes to deselect a category does call exchangeFilters with category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(group(0), {
            checked: false
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: 'testCategoryI'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeB'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(group(0).checked).toEqual(false);
        expect(subGroup(0, 0).checked).toEqual(false);
        expect(subGroup(0, 0).children[0].checked).toEqual(false);
        expect(subGroup(0, 0).children[1].checked).toEqual(false);
        expect(subGroup(0, 1).checked).toEqual(false);
        expect(group(1).checked).toEqual(true);
        expect(subGroup(1, 0).checked).toEqual(true);
        expect(subGroup(1, 1).checked).toEqual(true);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a type does call exchangeFilters with type / subtype filters and remove category filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(subGroup(0, 0), {
            checked: false
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '!=',
            value: 'testTypeA'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], [{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign]]);
        expect(group(0).checked).toEqual(true);
        expect(group(0).indeterminate).toEqual(true);
        expect(subGroup(0, 0).checked).toEqual(false);
        expect(subGroup(0, 0).children[0].checked).toEqual(false);
        expect(subGroup(0, 0).children[1].checked).toEqual(false);
        expect(subGroup(0, 1).checked).toEqual(true);
        expect(group(1).checked).toEqual(true);
        expect(subGroup(1, 0).checked).toEqual(true);
        expect(subGroup(1, 1).checked).toEqual(true);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a subtype does call exchangeFilters with subtype filters and remove category / type filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(subGroup(0, 0).children[0], {
            checked: false
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '!=',
            value: 'testSubType1'
        } as SimpleFilterDesign], [{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign]]);
        expect(group(0).checked).toEqual(true);
        expect(subGroup(0, 0).checked).toEqual(true);
        expect(subGroup(0, 0).indeterminate).toEqual(true);
        expect(subGroup(0, 0).children[0].checked).toEqual(false);
        expect(subGroup(0, 0).children[1].checked).toEqual(true);
        expect(subGroup(0, 1).checked).toEqual(true);
        expect(group(1).checked).toEqual(true);
        expect(subGroup(1, 0).checked).toEqual(true);
        expect(subGroup(1, 1).checked).toEqual(true);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a category with other unselected categories does call exchangeFilters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        group(1).checked = false;
        subGroup(1, 0).checked = false;
        subGroup(1, 1).checked = false;

        component.checkRelatedNodes(group(0), {
            checked: false
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.CATEGORY_FIELD,
                operator: '!=',
                value: 'testCategoryI'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.CATEGORY_FIELD,
                operator: '!=',
                value: 'testCategoryII'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeB'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeC'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeD'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(group(0).checked).toEqual(false);
        expect(subGroup(0, 0).checked).toEqual(false);
        expect(subGroup(0, 0).children[0].checked).toEqual(false);
        expect(subGroup(0, 0).children[1].checked).toEqual(false);
        expect(subGroup(0, 1).checked).toEqual(false);
        expect(group(1).checked).toEqual(false);
        expect(subGroup(1, 0).checked).toEqual(false);
        expect(subGroup(1, 1).checked).toEqual(false);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a type with other unselected types does call exchangeFilters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        group(1).checked = false;
        subGroup(1, 0).checked = false;
        subGroup(1, 1).checked = false;

        component.checkRelatedNodes(subGroup(0, 0), {
            checked: false
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: 'testCategoryII'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeC'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeD'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(group(0).checked).toEqual(true);
        expect(group(0).indeterminate).toEqual(true);
        expect(subGroup(0, 0).checked).toEqual(false);
        expect(subGroup(0, 0).children[0].checked).toEqual(false);
        expect(subGroup(0, 0).children[1].checked).toEqual(false);
        expect(subGroup(0, 1).checked).toEqual(true);
        expect(group(1).checked).toEqual(false);
        expect(subGroup(1, 0).checked).toEqual(false);
        expect(subGroup(1, 1).checked).toEqual(false);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes to select a category does call exchangeFilters and remove category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        group(0).checked = false;
        subGroup(0, 0).checked = false;
        subGroup(0, 0).children[0].checked = false;

        component.checkRelatedNodes(group(0), {
            checked: true
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], [{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign]]);
        expect(group(0).checked).toEqual(true);
        expect(subGroup(0, 0).checked).toEqual(true);
        expect(subGroup(0, 0).children[0].checked).toEqual(true);
        expect(subGroup(0, 0).children[1].checked).toEqual(true);
        expect(subGroup(0, 1).checked).toEqual(true);
        expect(group(1).checked).toEqual(true);
        expect(subGroup(1, 0).checked).toEqual(true);
        expect(subGroup(1, 1).checked).toEqual(true);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes to select a type does call exchangeFilters and remove all category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        subGroup(0, 0).checked = false;
        subGroup(0, 0).children[0].checked = false;

        component.checkRelatedNodes(subGroup(0, 0), {
            checked: true
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], [{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign]]);
        expect(group(0).checked).toEqual(true);
        expect(subGroup(0, 0).checked).toEqual(true);
        expect(subGroup(0, 0).children[0].checked).toEqual(true);
        expect(subGroup(0, 0).children[1].checked).toEqual(true);
        expect(subGroup(0, 1).checked).toEqual(true);
        expect(group(1).checked).toEqual(true);
        expect(subGroup(1, 0).checked).toEqual(true);
        expect(subGroup(1, 1).checked).toEqual(true);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes to select a subtype does call exchangeFilters and remove all category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        subGroup(0, 0).children[0].checked = false;

        component.checkRelatedNodes(subGroup(0, 0).children[0], {
            checked: true
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], [{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TYPE_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign, {
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.NAME_FIELD,
            operator: '!=',
            value: undefined
        } as SimpleFilterDesign]]);
        expect(group(0).checked).toEqual(true);
        expect(subGroup(0, 0).checked).toEqual(true);
        expect(subGroup(0, 0).children[0].checked).toEqual(true);
        expect(subGroup(0, 0).children[1].checked).toEqual(true);
        expect(subGroup(0, 1).checked).toEqual(true);
        expect(group(1).checked).toEqual(true);
        expect(subGroup(1, 0).checked).toEqual(true);
        expect(subGroup(1, 1).checked).toEqual(true);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a category does call exchangeFilters (with no typeField or subTypeField)', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(group(0), {
            checked: false
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: 'testCategoryI'
        } as SimpleFilterDesign], []]);
        expect(group(0).checked).toEqual(false);
        expect(group(1).checked).toEqual(true);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a category does call exchangeFilters (with no subTypeField)', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(group(0), {
            checked: false
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: 'testCategoryI'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeB'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(group(0).checked).toEqual(false);
        expect(subGroup(0, 0).checked).toEqual(false);
        expect(subGroup(0, 1).checked).toEqual(false);
        expect(group(1).checked).toEqual(true);
        expect(subGroup(1, 0).checked).toEqual(true);
        expect(subGroup(1, 1).checked).toEqual(true);
        expect(group(2).checked).toEqual(true);
    });

    it('checkRelatedNodes does ignore unselected types if typeField equals categoryField', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = [{
            checked: true,
            description: DatasetServiceMock.CATEGORY_FIELD,
            indeterminate: false,
            level: 1,
            name: 'testCategoryI',
            children: [{
                checked: true,
                description: DatasetServiceMock.CATEGORY_FIELD,
                indeterminate: false,
                level: 2,
                name: 'testCategoryI.testTypeA',
                children: [{
                    checked: true,
                    description: DatasetServiceMock.NAME_FIELD,
                    indeterminate: false,
                    level: 3,
                    name: 'testSubType1',
                    children: []
                }, {
                    checked: true,
                    description: DatasetServiceMock.NAME_FIELD,
                    indeterminate: false,
                    level: 3,
                    name: 'testSubType2',
                    children: []
                }]
            }, {
                checked: true,
                description: DatasetServiceMock.CATEGORY_FIELD,
                indeterminate: false,
                level: 2,
                name: 'testCategoryI.testTypeB',
                children: []
            }]
        }] as any;

        component.checkRelatedNodes(group(0), {
            checked: false
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.CATEGORY_FIELD,
                operator: '!=',
                value: 'testCategoryI'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.CATEGORY_FIELD,
                operator: '!=',
                value: 'testCategoryI.testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.CATEGORY_FIELD,
                operator: '!=',
                value: 'testCategoryI.testTypeB'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.NAME_FIELD,
                operator: '!=',
                value: 'testSubType2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(group(0).checked).toEqual(false);
        expect(subGroup(0, 0).checked).toEqual(false);
        expect(subGroup(0, 0).children[0].checked).toEqual(false);
        expect(subGroup(0, 0).children[1].checked).toEqual(false);
        expect(subGroup(0, 1).checked).toEqual(false);
    });

    it('checkRelatedNodes does ignore unselected subtypes if subTypeField equals typeField', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.TYPE_FIELD;
        component.taxonomyGroups = [{
            checked: true,
            description: DatasetServiceMock.CATEGORY_FIELD,
            indeterminate: false,
            level: 1,
            name: 'testCategoryI',
            children: [{
                checked: true,
                description: DatasetServiceMock.TYPE_FIELD,
                indeterminate: false,
                level: 2,
                name: 'testTypeA',
                children: [{
                    checked: true,
                    description: DatasetServiceMock.TYPE_FIELD,
                    indeterminate: false,
                    level: 3,
                    name: 'testTypeA.testSubType1',
                    children: []
                }, {
                    checked: true,
                    description: DatasetServiceMock.TYPE_FIELD,
                    indeterminate: false,
                    level: 3,
                    name: 'testTypeA.testSubType2',
                    children: []
                }]
            }, {
                checked: true,
                description: DatasetServiceMock.TYPE_FIELD,
                indeterminate: false,
                level: 2,
                name: 'testTypeB',
                children: []
            }]
        }] as any;

        component.checkRelatedNodes(group(0), {
            checked: false
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.CATEGORY_FIELD,
            operator: '!=',
            value: 'testCategoryI'
        } as SimpleFilterDesign, {
            type: 'and',
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeA'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeA.testSubType1'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeA.testSubType2'
            } as SimpleFilterDesign, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.TYPE_FIELD,
                operator: '!=',
                value: 'testTypeB'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign], []]);
        expect(group(0).checked).toEqual(false);
        expect(subGroup(0, 0).checked).toEqual(false);
        expect(subGroup(0, 0).children[0].checked).toEqual(false);
        expect(subGroup(0, 0).children[1].checked).toEqual(false);
        expect(subGroup(0, 1).checked).toEqual(false);
    });
});
