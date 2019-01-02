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

import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
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
    },
        {
            testIdField: 'testId2',
            testTypeField: ['testTypeA', 'testTypeB', 'testTypeC', 'testTypeD', 'testTypeE', 'testTypeF', 'testTypeG', 'testTypeH'],
            testCategoryField: ['testCategoryII']
        },
        {
            testIdField: 'testId3',
            testTypeField: ['testTypeC', 'testTypeD', 'testTypeE', 'testTypeF'],
            testCategoryField: ['testCategoryIII']

        },
        {
            testIdField: 'testId4',
            testTypeField: ['testTypeE', 'testTypeF'],
            testCategoryField: ['testCategoryI', 'testCategoryIII']
        },
        {
            testIdField: 'testId5',
            testTypeField: ['testTypeH'],
            testCategoryField: ['testCategoryII', 'testCategoryIII']
        },
        {
            testIdField: 'testId6',
            testTypeField: ['testTypeE'],
            testCategoryField: ['testCategoryI', 'testCategoryIIII']
        }];

    initializeTestBed({
        declarations: [
            TaxonomyViewerComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ConnectionService,
            {provide: DatasetService, useClass: DatasetServiceMock},
            {provide: FilterService, useClass: FilterServiceMock},
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
        expect(component.filters).toEqual([]);
        expect(component.taxonomyGroups).toEqual([]);
        expect(component.testOptions).toBeDefined();
    });

    it('createQuery does return expected query', (() => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];
        component.options.ascending = true;

        let query = new neon.query.Query()
            .selectFrom(component.options.database.name, component.options.table.name)
            .withFields(['testIdField', 'testCategoryField', 'testFilter1', 'testFilter2',  'testTypeField',
                'testSubTypeField']);

        let whereClauses = [
            neon.query.where(component.options.idField.columnName, '!=', null),
            neon.query.where(component.options.idField.columnName, '!=', '')
        ];

        query.where(neon.query.and.apply(query, whereClauses)).sortBy('testCategoryField', neonVariables.ASCENDING);
        expect(component.createQuery()).toEqual(query);
    }));

    it('getCloseableFilters does return null', (() => {
        expect(component.getCloseableFilters()).toEqual(null);
    }));

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.treeRoot).toBeDefined();
    });

    it('getExportFields does return expected array', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField', 'Test SubType Field');
        component.options.sourceIdField = new FieldMetaData('sourceIdField', 'Source ID Field');

        expect(component.getExportFields()).toEqual([{
            columnName: 'testCategoryField',
            prettyName: 'Test Category Field'
        }, {
            columnName: 'testTypeField',
            prettyName: 'Test Type Field'
        }, {
            columnName: 'testIdField',
            prettyName: 'Test ID Field'
        }, {
            columnName: 'sourceIdField',
            prettyName: 'Source ID Field'
        }, {
            columnName: 'testSubTypeField',
            prettyName: 'Test SubType Field'
        }
        ]);
    }));

    it('getFiltersToIgnore does return null', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.idField = DatasetServiceMock.ID_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(null);
    });

    it('filterExists does return expected boolean', () => {
        expect(component.filterExists('field1', 'value1')).toEqual(false);
        expect(component.filterExists('field1', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value2'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);

        component.filters = [];

        expect(component.filterExists('field1', 'value1')).toEqual(false);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
    });

    it('isValidQuery does return expected result', (() => {
        expect(component.isValidQuery()).toBe(false);

        component.options.database = new DatabaseMetaData('testDatabase');
        expect(component.isValidQuery()).toBe(false);

        component.options.table = new TableMetaData('testTable');
        expect(component.isValidQuery()).toBe(false);

        component.options.idField = DatasetServiceMock.ID_FIELD;
        expect(component.isValidQuery()).toBe(false);

        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        expect(component.isValidQuery()).toBe(true);
    }));

    it('onQuerySuccess does load the Taxonomy', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.ascending  = true;

        component.onQuerySuccess({
            data: responseData
        });

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

    it('does create filter when a parent node in the taxonomy is unselected', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.onQuerySuccess({
            data: responseData
        });

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[2].checked = false;

            expect(component.taxonomyGroups[2].checked).toBe(false);
            expect(component.filters.length).toEqual(1);
            expect(component.filters[0].field).toEqual('testCategoryField');
            expect(component.filters[0].value).toEqual('testCategoryIII');
            expect(component.filters[0].prettyField).toEqual('Tree Node');
        });
    }));

    it('does remove parent filter and create a new filter when a child node in the taxonomy is selected', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.onQuerySuccess({
            data: responseData
        });

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[1].checked = false;
            component.getElementRefs().treeRoot.treeModel.nodes[1].children[3].checked = true;
            expect(component.taxonomyGroups[1].checked).toBe(false);
            expect(component.taxonomyGroups[1].children[3].checked).toBe(true);

            expect(component.filters.length).toEqual(1);
            expect(component.filters[0].field).toEqual('testTypeField');
            expect(component.filters[0].value).toEqual('testCategoryII testTypeField');
            expect(component.filters[0].prettyField).toEqual('Tree Node');
        });
    }));

    it('does remove and create a new filter when a child node in the taxonomy is unselected', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.onQuerySuccess({
            data: responseData
        });

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[1].children[3].checked = false;
            expect(component.taxonomyGroups[1].children[3].checked).toBe(false);

            expect(component.filters.length).toEqual(1);
            expect(component.filters[0].field).toEqual('testTypeField');
            expect(component.filters[0].value).toEqual('testCategoryII testTypeField');
            expect(component.filters[0].prettyField).toEqual('Tree Node');
        });
    }));

    it('does select child nodes when a parent nodes is selected in the taxonomy', (() => {
        let refs = component.getElementRefs();
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.onQuerySuccess({
            data: responseData
        });

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            refs.treeRoot.treeModel.nodes[3].children[1].checked = true;
            expect(refs.treeRoot.treeModel.nodes[3].children.length).toEqual(2);
            expect(component.taxonomyGroups[3].checked).toEqual(true);
        });
    }));

    it('does update parent node when child node is selected in the taxonomy', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        component.onQuerySuccess({
            data: responseData
        });

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[2].children[1].checked = true;
            expect(component.taxonomyGroups[2].children[1].checked).toEqual(true);
            expect(component.getElementRefs().treeRoot.treeModel.nodes[2].parent.data.indeterminate).toEqual(true);
        });
    }));

    it('postInit does call executeQueryChain', (() => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(spy.calls.count()).toBe(1);
    }));

    it('removeFilter function does exist', (() => {
        expect(component.removeFilter).toBeDefined();
    }));

    it('setupFilters function does exist', (() => {
        expect(component.setupFilters).toBeDefined();
    }));

    it('onEvent does trigger when node is double clicked', (() => {
        let spy = spyOn(component, 'onEvent');

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            component.getElementRefs().treeRoot.treeModel.nodes[0].ondblclick();
            expect(spy.calls.count()).toBe(1);
        });
    }));

    it('subGetBindings does set expected bindings', (() => {
        let bindings = {};

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: '',
            categoryField: '',
            typeField: '',
            subTypeField: ''
        });

        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: 'testIdField',
            categoryField: 'testCategoryField',
            typeField: 'testTypeField',
            subTypeField: 'testSubTypeField'
        });
    }));

    it('subNgOnDestroy function does exist', (() => {
        expect(component.subNgOnDestroy).toBeDefined();
    }));

    it('subNgOnInit function does exist', (() => {
        expect(component.subNgOnInit).toBeDefined();
    }));
});
