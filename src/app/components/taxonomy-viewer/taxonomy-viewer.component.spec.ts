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

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

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
import { ProtractorBrowser } from 'protractor';

describe('Component: TaxonomyViewer', () => {
    let component: TaxonomyViewerComponent;
    let fixture: ComponentFixture<TaxonomyViewerComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);
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
            ActiveGridService,
            ConnectionService,
            {provide: DatasetService, useClass: DatasetServiceMock},
            ExportService,
            ErrorNotificationService,
            {provide: FilterService, useClass: FilterServiceMock},
            ThemesService,
            VisualizationService,
            Injector,
            {provide: 'config', useValue: new NeonGTDConfig()}
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            ProtractorBrowser,
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
        expect(component.options.categoryField).toEqual(component.emptyField);
        expect(component.options.typeField).toEqual(component.emptyField);
        expect(component.options.subTypeField).toEqual(component.emptyField);
        expect(component.options.linkField).toEqual(component.emptyField);
        expect(component.options.idField).toEqual(component.emptyField);
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
        component.options.linkField = DatasetServiceMock.LINK_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');
        component.options.filterFields = ['testFilter1', 'testFilter2'];

        let query = new neon.query.Query()
            .selectFrom(component.options.database.name, component.options.table.name)
            .withFields(['testIdField', 'testFilter1', 'testFilter2', 'testCategoryField', 'testLinkField', 'testTypeField',
                'testSubTypeField']);

        let whereClauses = [
            neon.query.where(component.options.idField.columnName, '!=', null),
            neon.query.where(component.options.idField.columnName, '!=', '')
        ];

        query.where(neon.query.and.apply(query, whereClauses)).sortBy('testCategoryField', neonVariables.ASCENDING);
        expect(component.createQuery()).toEqual(query);
    }));

    it('getButtonText does return null', (() => {
        expect(component.getButtonText()).toEqual(null);
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
        component.options.linkField = DatasetServiceMock.LINK_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField', 'Test SubType Field');

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
            columnName: 'testLinkField',
            prettyName: 'Test Link Field'
        }, {
            columnName: 'testSubTypeField',
            prettyName: 'Test SubType Field'
        }
        ]);
    }));

    it('getFiltersToIgnore does return empty array if no filters are set', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.idField = DatasetServiceMock.ID_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(null);
    });

    /*    it('getFiltersToIgnore does return expected array of IDs if filters are set matching database/table', () => {

            component.options.database = DatasetServiceMock.DATABASES[0];
            component.options.table = DatasetServiceMock.TABLES[0];
            component.options.idField = new FieldMetaData('testIdField1', 'Test ID Field 1');
            component.options.filterFields = ['testFilter1', 'testFilter2'];
            component.options.ignoreSelf = true;

            getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
                neon.query.where('testIdField1', '!=', null), 'testFilter1');

            getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
                neon.query.where('testIdField1', '!=', null), 'testFilter2');

                   let neonFilters = getService(FilterService).getFiltersForFields(this.options.database.name, this.options.table.name,
                this.options.filterFields);
                console.log(neonFilters);

            expect(component.getFiltersToIgnore().length).toEqual(2);
            expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilter1',
            'testDatabase1-testTable1-testFilter2']);
        });*/

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
        expect(component.isValidQuery()).toBe(false);

        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        expect(component.isValidQuery()).toBe(true);
    }));

    it('onQuerySuccess does load the Taxonomy', (() => {
        let refs = component.getElementRefs();
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];

        component.onQuerySuccess({
            data: responseData
        });

        expect(refs.treeRoot.treeModel.nodes.length).toEqual(4);
        expect(refs.treeRoot.treeModel.nodes[0].name).toEqual('testCategoryI');
        expect(refs.treeRoot.treeModel.nodes[0].children.length).toEqual(6);
        expect(refs.treeRoot.treeModel.nodes[1].name).toEqual('testCategoryII');
        expect(refs.treeRoot.treeModel.nodes[1].children.length).toEqual(8);
        expect(refs.treeRoot.treeModel.nodes[2].name).toEqual('testCategoryIII');
        expect(refs.treeRoot.treeModel.nodes[2].children.length).toEqual(5);
        expect(refs.treeRoot.treeModel.nodes[3].name).toEqual('testCategoryIIII');
        expect(refs.treeRoot.treeModel.nodes[3].children.length).toEqual(1);

    }));

    /*    it('does create filter when a parent node in the taxonomy is unselected', (() => {
            let refs = component.getElementRefs();
            component.options.idField = DatasetServiceMock.ID_FIELD;
            component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
            component.options.linkField = DatasetServiceMock.LINK_FIELD;
            component.options.typeField = DatasetServiceMock.TYPE_FIELD;
            component.options.subTypeField = new FieldMetaData('testSubTypeField');
            component.options.filterFields = ['testFilter1', 'testFilter2'];

            component.onQuerySuccess({
                data: responseData
            });

            refs.treeRoot.treeModel.nodes[2].checked = false;

            let filters = getService(FilterService).getFiltersForFields(component.options.database.name, component.options.table.name,
                component.options.filterFields);
            expect(filters.length).toEqual(1);
            expect(component.filters.length).toEqual(1);
            expect(filters[0].field).toEqual('testCategoryField');
            expect(filters[0].value).toEqual('testCategoryIII');
            expect(filters[0].prettyField).toEqual('Tree Node');

            // getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            //     return filter.id;
            // }));
        }));

        it('does remove parent filter and create a new filter when a child node in the taxonomy is selected', (() => {
            let refs = component.getElementRefs();
            component.options.idField = DatasetServiceMock.ID_FIELD;
            component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
            component.options.linkField = DatasetServiceMock.LINK_FIELD;
            component.options.typeField = DatasetServiceMock.TYPE_FIELD;
            component.options.subTypeField = new FieldMetaData('testSubTypeField');
            component.options.filterFields = ['testFilter1', 'testFilter2'];

            component.onQuerySuccess({
                data: responseData
            });

            refs.treeRoot.treeModel.nodes[1].checked = false;
            refs.treeRoot.treeModel.nodes[1].children[3].checked = true;

            let filters = getService(FilterService).getFiltersForFields(component.options.database.name, component.options.table.name,
            component.options.filterFields);
            expect(filters.length).toEqual(1);
            expect(component.filters.length).toEqual(1);
            expect(filters[0].field).toEqual('testTypeField');
            expect(filters[0].value).toEqual('testCategoryII testTypeField');
            expect(filters[0].prettyField).toEqual('Tree Node');

            // getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            //     return filter.id;
            // }));
        }));

        it('does remove and create a new filter when a child node in the taxonomy is unselected', (() => {
            let refs = component.getElementRefs();
            component.options.idField = DatasetServiceMock.ID_FIELD;
            component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
            component.options.linkField = DatasetServiceMock.LINK_FIELD;
            component.options.typeField = DatasetServiceMock.TYPE_FIELD;
            component.options.subTypeField = new FieldMetaData('testSubTypeField');
            component.options.filterFields = ['testFilter1', 'testFilter2'];

            component.onQuerySuccess({
                data: responseData
            });

            refs.treeRoot.treeModel.nodes[1].children[3].checked = false;

            let filters = getService(FilterService).getFiltersForFields(component.options.database.name, component.options.table.name,
                component.options.filterFields);
            expect(filters.length).toEqual(1);
            expect(filters[0].field).toEqual('testTypeField');
            expect(filters[0].value).toEqual('testCategoryII testTypeField');
            expect(filters[0].prettyField).toEqual('Tree Node');

    /!*        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
                return filter.id;
            }));*!/
        }));

        it('does select child nodes when a parent nodes is selected in the taxonomy', (() => {
            let refs = component.getElementRefs();
            component.options.idField = DatasetServiceMock.ID_FIELD;
            component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
            component.options.linkField = DatasetServiceMock.LINK_FIELD;
            component.options.typeField = DatasetServiceMock.TYPE_FIELD;
            component.options.subTypeField = new FieldMetaData('testSubTypeField');
            component.options.filterFields = ['testFilter1', 'testFilter2'];

            component.onQuerySuccess({
                data: responseData
            });

            refs.treeRoot.treeModel.nodes[3].checked = true;

            expect(refs.treeRoot.treeModel.nodes.children.length).toEqual(2);
            expect(refs.treeRoot.treeModel.nodes.children[1].checked).toEqual(true);
        }));

        it('does update parent node when child node is selected in the taxonomy', (() => {
            let refs = component.getElementRefs();
            component.options.idField = DatasetServiceMock.ID_FIELD;
            component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
            component.options.linkField = DatasetServiceMock.LINK_FIELD;
            component.options.typeField = DatasetServiceMock.TYPE_FIELD;
            component.options.subTypeField = new FieldMetaData('testSubTypeField');
            component.options.filterFields = ['testFilter1', 'testFilter2'];

            component.onQuerySuccess({
                data: responseData
            });

            refs.treeRoot.treeModel.nodes[2].children[1].checked = true;
            expect(refs.treeRoot.treeModel.nodes.parent.data.indeterminate).toEqual(true);
        }));*/

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

    /*   it('onEvent does trigger when node is double clicked', (() => {
           let spy = spyOn(component, 'onEvent');
           component.postInit();
           expect(spy.calls.count()).toBe(1);
       }));*/

    it('subGetBindings does set expected bindings', (() => {
        let bindings = {};

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: '',
            linkField: '',
            categoryField: '',
            typeField: '',
            subTypeField: ''
        });

        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkField = DatasetServiceMock.LINK_FIELD;
        component.options.categoryField = DatasetServiceMock.CATEGORY_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.subTypeField = new FieldMetaData('testSubTypeField');

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: 'testIdField',
            linkField: 'testLinkField',
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
