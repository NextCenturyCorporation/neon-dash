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

import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { CompoundFilterDesign, FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { DatasetService } from '../../services/dataset.service';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { TaxonomyViewerComponent } from './taxonomy-viewer.component';
import { TreeModule } from 'angular-tree-component';

describe('Component: TaxonomyViewer', () => {
    let component: TaxonomyViewerComponent;
    let fixture: ComponentFixture<TaxonomyViewerComponent>;

    let responseData = [{
        testIdField: 'testId1',
        testTypeField: ['testTypeA', 'testTypeB', 'testTypeC', 'testTypeD'],
        testCategoryField: ['testCategoryI', 'testCategoryII']
    }, {
        testIdField: 'testId2',
        testTypeField: ['testTypeA', 'testTypeB', 'testTypeC', 'testTypeD', 'testTypeE', 'testTypeF', 'testTypeG', 'testTypeH'],
        testCategoryField: ['testCategoryII']
    }, {
        testIdField: 'testId3',
        testTypeField: ['testTypeC', 'testTypeD', 'testTypeE', 'testTypeF'],
        testCategoryField: ['testCategoryIII']
    }, {
        testIdField: 'testId4',
        testTypeField: ['testTypeE', 'testTypeF'],
        testCategoryField: ['testCategoryI', 'testCategoryIII']
    }, {
        testIdField: 'testId5',
        testTypeField: ['testTypeH'],
        testCategoryField: ['testCategoryII', 'testCategoryIII']
    }, {
        testIdField: 'testId6',
        testTypeField: ['testTypeE'],
        testCategoryField: ['testCategoryI', 'testCategoryIIII']
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
        }];

        taxonomyGroups.forEach((categoryNode) => categoryNode.children.forEach((typeNode) => {
            (typeNode as any).parent = categoryNode;
            (typeNode as any).children.forEach((subTypeNode) => (subTypeNode as any).parent = typeNode);
        }));
        return taxonomyGroups;
    };

    initializeTestBed('Taxonomy', {
        declarations: [
            TaxonomyViewerComponent,
            UnsharedFilterComponent
        ],
        providers: [
            {provide: DatasetService, useClass: DatasetServiceMock},
            FilterService,
            {provide: AbstractSearchService, useClass: SearchServiceMock},
            Injector,
            {provide: 'config', useValue: new NeonGTDConfig()}
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule,
            TreeModule.forRoot()
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
        expect(component.testOptions).toBeDefined();
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
        expect(refs.treeRoot).toBeDefined();
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
        component.options.ascending  = true;

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
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
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
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
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
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
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
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
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
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
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

    it('onEvent does trigger when node is double clicked', async(() => {
        let spy = spyOn(component, 'onEvent');

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[0].ondblclick();
            expect(spy.calls.count()).toBe(1);
        });
    }));

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[0].filterDesign as any).operator).toEqual('!=');
        expect((actual[0].filterDesign as any).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[1].filterDesign as any).type).toEqual('and');
        expect((actual[1].filterDesign as any).filters.length).toEqual(1);
        expect((actual[1].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[1].filterDesign as any).filters[0].operator).toEqual('!=');
        expect((actual[1].filterDesign as any).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());

        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect((actual[0].filterDesign as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[0].filterDesign as any).operator).toEqual('!=');
        expect((actual[0].filterDesign as any).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[1].filterDesign as any).type).toEqual('and');
        expect((actual[1].filterDesign as any).filters.length).toEqual(1);
        expect((actual[1].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[1].filterDesign as any).filters[0].operator).toEqual('!=');
        expect((actual[1].filterDesign as any).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[2].filterDesign as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[2].filterDesign as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[2].filterDesign as any).field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect((actual[2].filterDesign as any).operator).toEqual('!=');
        expect((actual[2].filterDesign as any).value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[3].filterDesign as any).type).toEqual('and');
        expect((actual[3].filterDesign as any).filters.length).toEqual(1);
        expect((actual[3].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[3].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[3].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect((actual[3].filterDesign as any).filters[0].operator).toEqual('!=');
        expect((actual[3].filterDesign as any).filters[0].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());

        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(6);
        expect((actual[0].filterDesign as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[0].filterDesign as any).operator).toEqual('!=');
        expect((actual[0].filterDesign as any).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[1].filterDesign as any).type).toEqual('and');
        expect((actual[1].filterDesign as any).filters.length).toEqual(1);
        expect((actual[1].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect((actual[1].filterDesign as any).filters[0].operator).toEqual('!=');
        expect((actual[1].filterDesign as any).filters[0].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[2].filterDesign as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[2].filterDesign as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[2].filterDesign as any).field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect((actual[2].filterDesign as any).operator).toEqual('!=');
        expect((actual[2].filterDesign as any).value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[3].filterDesign as any).type).toEqual('and');
        expect((actual[3].filterDesign as any).filters.length).toEqual(1);
        expect((actual[3].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[3].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[3].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect((actual[3].filterDesign as any).filters[0].operator).toEqual('!=');
        expect((actual[3].filterDesign as any).filters[0].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[4].filterDesign as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[4].filterDesign as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[4].filterDesign as any).field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((actual[4].filterDesign as any).operator).toEqual('!=');
        expect((actual[4].filterDesign as any).value).toBeUndefined();
        expect(actual[4].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
        expect((actual[5].filterDesign as any).type).toEqual('and');
        expect((actual[5].filterDesign as any).filters.length).toEqual(1);
        expect((actual[5].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[5].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[5].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((actual[5].filterDesign as any).filters[0].operator).toEqual('!=');
        expect((actual[5].filterDesign as any).filters[0].value).toBeUndefined();
        expect(actual[5].redrawCallback.toString()).toEqual((component as any).redrawTaxonomy.bind(component).toString());
    });

    it('checkRelatedNodes to deselect a category does call exchangeFilters with category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(component.taxonomyGroups[0], {
            target: {
                checked: false
            }
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
            name: 'Test Database 1 / Test Table 1 / Test Type Field : Filter on Taxonomy Types',
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
            name: 'Test Database 1 / Test Table 1 / Test Name Field : Filter on Taxonomy Subtypes',
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
        expect(component.taxonomyGroups[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a type does call exchangeFilters with type / subtype filters and remove category filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(component.taxonomyGroups[0].children[0], {
            target: {
                checked: false
            }
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
            name: 'Test Database 1 / Test Table 1 / Test Name Field : Filter on Taxonomy Subtypes',
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
        expect(component.taxonomyGroups[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].indeterminate).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a subtype does call exchangeFilters with subtype filters and remove category / type filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(component.taxonomyGroups[0].children[0].children[0], {
            target: {
                checked: false
            }
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
        expect(component.taxonomyGroups[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].indeterminate).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a category with other unselected categories does call exchangeFilters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        component.taxonomyGroups[1].checked = false;
        component.taxonomyGroups[1].children[0].checked = false;
        component.taxonomyGroups[1].children[1].checked = false;

        component.checkRelatedNodes(component.taxonomyGroups[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            name: 'Test Database 1 / Test Table 1 / Test Category Field : Filter on Taxonomy Categories',
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
            name: 'Test Database 1 / Test Table 1 / Test Type Field : Filter on Taxonomy Types',
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
            name: 'Test Database 1 / Test Table 1 / Test Name Field : Filter on Taxonomy Subtypes',
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
        expect(component.taxonomyGroups[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[1].checked).toEqual(false);
        expect(component.taxonomyGroups[1].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[1].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a type with other unselected types does call exchangeFilters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        component.taxonomyGroups[1].checked = false;
        component.taxonomyGroups[1].children[0].checked = false;
        component.taxonomyGroups[1].children[1].checked = false;

        component.checkRelatedNodes(component.taxonomyGroups[0].children[0], {
            target: {
                checked: false
            }
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
            name: 'Test Database 1 / Test Table 1 / Test Type Field : Filter on Taxonomy Types',
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
            name: 'Test Database 1 / Test Table 1 / Test Name Field : Filter on Taxonomy Subtypes',
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
        expect(component.taxonomyGroups[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].indeterminate).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].checked).toEqual(false);
        expect(component.taxonomyGroups[1].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[1].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to select a category does call exchangeFilters and remove category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        component.taxonomyGroups[0].checked = false;
        component.taxonomyGroups[0].children[0].checked = false;
        component.taxonomyGroups[0].children[0].children[0].checked = false;

        component.checkRelatedNodes(component.taxonomyGroups[0], {
            target: {
                checked: true
            }
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
        expect(component.taxonomyGroups[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to select a type does call exchangeFilters and remove all category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        component.taxonomyGroups[0].children[0].checked = false;
        component.taxonomyGroups[0].children[0].children[0].checked = false;

        component.checkRelatedNodes(component.taxonomyGroups[0].children[0], {
            target: {
                checked: true
            }
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
        expect(component.taxonomyGroups[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to select a subtype does call exchangeFilters and remove all category / type / subtype filters', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = DatasetServiceMock.NAME_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();
        component.taxonomyGroups[0].children[0].children[0].checked = false;

        component.checkRelatedNodes(component.taxonomyGroups[0].children[0].children[0], {
            target: {
                checked: true
            }
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
        expect(component.taxonomyGroups[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a category does call exchangeFilters (with no typeField or subTypeField)', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(component.taxonomyGroups[0], {
            target: {
                checked: false
            }
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
        expect(component.taxonomyGroups[0].checked).toEqual(false);
        expect(component.taxonomyGroups[1].checked).toEqual(true);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
    });

    it('checkRelatedNodes to deselect a category does call exchangeFilters (with no subTypeField)', () => {
        let spy = spyOn(component, 'exchangeFilters');

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.taxonomyGroups = createTestTaxonomyGroups();

        component.checkRelatedNodes(component.taxonomyGroups[0], {
            target: {
                checked: false
            }
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
            name: 'Test Database 1 / Test Table 1 / Test Type Field : Filter on Taxonomy Types',
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
        expect(component.taxonomyGroups[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[1].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[0].checked).toEqual(true);
        expect(component.taxonomyGroups[1].children[1].checked).toEqual(true);
        expect(component.taxonomyGroups[2].checked).toEqual(true);
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
        }];

        component.checkRelatedNodes(component.taxonomyGroups[0], {
            target: {
                checked: false
            }
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            name: 'Test Database 1 / Test Table 1 / Test Category Field : Filter on Taxonomy Categories',
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
            name: 'Test Database 1 / Test Table 1 / Test Name Field : Filter on Taxonomy Subtypes',
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
        expect(component.taxonomyGroups[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(false);
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
        }];

        component.checkRelatedNodes(component.taxonomyGroups[0], {
            target: {
                checked: false
            }
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
            name: 'Test Database 1 / Test Table 1 / Test Type Field : Filter on Taxonomy Types',
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
        expect(component.taxonomyGroups[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[0].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[0].children[1].checked).toEqual(false);
        expect(component.taxonomyGroups[0].children[1].checked).toEqual(false);
    });
});
