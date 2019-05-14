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
import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { } from 'jasmine-core';
import * as neon from 'neon-framework';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { NewsFeedComponent } from './news-feed.component';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { TransformedVisualizationData } from '../base-neon-component/base-neon.component';

describe('Component: NewsFeed', () => {
    let component: NewsFeedComponent;
    let fixture: ComponentFixture<NewsFeedComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    //may need to add or remove some initializations (copied from media-viewer.component)
    initializeTestBed('News Feed', {
        declarations: [
            NewsFeedComponent
        ],
        providers: [
            DatasetService,
            { provide: FilterService, useClass: FilterServiceMock },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    //may need to change further
    beforeEach(() => {
        fixture = TestBed.createComponent(NewsFeedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    //checks if all class properties are there
    it('does have expected class options properties', () => {
        expect(component.options.id).toEqual('');
        expect(component.options.ignoreSelf).toEqual(false);
        expect(component.options.contentField).toEqual(new FieldMetaData());
        expect(component.options.dateField).toEqual(new FieldMetaData());
        expect(component.options.filterField).toEqual(new FieldMetaData());
        expect(component.options.idField).toEqual(new FieldMetaData());
        expect(component.options.linkField).toEqual(new FieldMetaData());
        expect(component.options.primaryTitleField).toEqual(new FieldMetaData());
        expect(component.options.secondaryTitleField).toEqual(new FieldMetaData());
        expect(component.options.sortField).toEqual(new FieldMetaData());
    });

    it('does have expected class properties', () => {
        expect(component.filters).toEqual([]);
    });

    //checks if component exists
    it('exists', () => {
        expect(component).toBeTruthy();
    });

    // //for create Filter method
    it('createFilter does nothing if filterField is empty', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.createFilter('test text');

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with no existing filters does add a new filter', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');

        component.createFilter('test text');

        expect(component.filters).toEqual([{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.options, true, {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with ignoreSelf=true and no existing filters does not query', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = true;

        component.createFilter('test text');

        expect(component.filters).toEqual([{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.options, false, {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with one existing filter does replace an existing filter', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.createFilter('test text');

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([component.options, true, {
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with ignoreSelf=true and one existing filter does not query', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = true;
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.createFilter('test text');

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy2.calls.argsFor(0)).toEqual([component.options, false, {
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('createFilter with multiple existing filters does remove all filters and then add a new filter', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        component.createFilter('test text');

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        let args = spy3.calls.argsFor(0);
        expect(args[0]).toEqual(component.options);
        expect(args[1]).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
        expect(args[2]).toEqual(false);
        expect(args[3]).toEqual(false);

        // Run the callback.
        expect(typeof args[4]).toEqual('function');
        args[4]();

        expect(component.filters).toEqual([{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.options, true, {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
    });

    it('createFilter with ignoreSelf=true and multiple existing filters does not query', () => {
        let spy1 = spyOn(component, 'addNeonFilter');
        let spy2 = spyOn(component, 'replaceNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = true;
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        component.createFilter('test text');

        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
        let args = spy3.calls.argsFor(0);
        expect(args[0]).toEqual(component.options);
        expect(args[1]).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
        expect(args[2]).toEqual(false);
        expect(args[3]).toEqual(false);

        // Run the callback.
        expect(typeof args[4]).toEqual('function');
        args[4]();

        expect(component.filters).toEqual([{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }]);

        expect(spy1.calls.count()).toEqual(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.options, false, {
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'test text'
        }, neon.query.where('testFilterField', '=', 'test text')]);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(1);
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.table = new TableMetaData('testTable');
        component.options.id = 'testId';
        component.options.idField = new FieldMetaData('testIdField');
        component.options.sortField = new FieldMetaData('testSortField');
        component.options.primaryTitleField = new FieldMetaData('testPrimaryTitleField');
        component.options.secondaryTitleField = new FieldMetaData('testSecondaryTitleField');
        component.options.filterField = new FieldMetaData('testFilterField');
        component.options.contentField = new FieldMetaData('testContentField');
        component.options.dateField = new FieldMetaData('testDateField');

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            fields: ['*'],
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
                field: 'testSortField',
                order: -1
            }
        });

        delete component.options.sortField.columnName;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            fields: ['*'],
            filter: null
        });
    }));

    // //for filter exists method
    it('filterExists does return expected boolean', () => {
        expect(component.filterExists('field1', 'value1')).toEqual(false);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value2'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value1'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);
        expect(component.filterExists('field2', 'value1')).toEqual(true);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);
        expect(component.filterExists('field2', 'value1')).toEqual(true);
        expect(component.filterExists('field2', 'value2')).toEqual(true);

        component.filters = [];

        expect(component.filterExists('field1', 'value1')).toEqual(false);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);
    });

    //for getCloseableFilters method
    it('getCloseableFilters does return expected array of filters', () => {
        expect(component.getCloseableFilters()).toEqual([]);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(component.getCloseableFilters()).toEqual([{
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);

        component.filters.push({
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.getCloseableFilters()).toEqual([{
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
    });

    //for getElementRefs method
    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.newsFeed).toBeDefined();
        expect(refs.visualization).toBeDefined();
        //expect(refs.filter).toBeDefined();
    });

    //for getFiltersToIgnore Method
    it('getFiltersToIgnore does return null if no filters are set', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;

        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.ignoreSelf = true;

        expect(component.getFiltersToIgnore()).toEqual(null);
    });

    it('getFiltersToIgnore does return null if filters are set because ignoreSelf=false', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');

        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore with ignoreSelf=true does return expected array of IDs if filters are set matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        component.options.ignoreSelf = true;

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore with ignoreSelf=true does return null if no filters are set matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = new FieldMetaData('testField', 'Test Field');
        component.options.ignoreSelf = true;

        // Test matching database/table but not field.
        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');

        // Test matching database/field but not table.
        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[1];

        // Test matching table/field but not database.
        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore with ignoreSelf=true does return expected array of IDs if no filterField is set', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testField1', '!=', null), 'testFilterName1');
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testField2', '!=', null), 'testFilterName2');

        component.options.ignoreSelf = true;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1',
            'testDatabase1-testTable1-testFilterName2']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    //for getFilterText method
    it('getFilterText does return expected string', () => {
        expect(component.getFilterText({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        })).toEqual('prettyField1 = value1');
    });

    it('validateVisualizationQuery does return expected boolean', () => {
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.database = DatasetServiceMock.DATABASES[0];
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.table = DatasetServiceMock.TABLES[0];
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.idField = new FieldMetaData('tesIdField', 'Test Id Field');
        expect(component.validateVisualizationQuery(component.options)).toEqual(true);
    });

    it('transformVisualizationQueryResults with aggregation query data does return expected data', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _id: 'id1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }]);

        expect(actual.data).toEqual([{
            _id: 'id1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }]);
    });

    it('transformVisualizationQueryResults with empty aggregation query data does return expected data', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');

        let actual = component.transformVisualizationQueryResults(component.options, []);

        expect(actual.data).toEqual([]);
    });

    it('transformVisualizationQueryResults with limited aggregation query data does return expected data', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.limit = 1;
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _id: 'id1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }]);

        expect(actual.data).toEqual([{
            _id: 'id1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }]);
    });

    it('transformVisualizationQueryResults with link prefix does return expected data', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _id: 'id1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }]);

        expect(actual.data).toEqual([{
            _id: 'id1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }]);
    });

    //for isSelectable method
    it('isSelectable does return expected boolean', () => {
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        expect(component.isSelectable()).toEqual(true);
        component.options.filterField = new FieldMetaData();

        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');
        expect(component.isSelectable()).toEqual(true);
        component.options.idField = new FieldMetaData();
    });

    //for isSelected method
    it('isSelected does return expected boolean', () => {
        expect(component.isSelected({})).toEqual(false);

        expect(component.isSelected({
            testFilterField: 'testFilterValue'
        })).toEqual(false);

        component.filters = [{
            id: undefined,
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'testFilterValue'
        }];

        expect(component.isSelected({
            testFilterField: 'testFilterValue'
        })).toEqual(false);

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');

        expect(component.isSelected({
            testFilterField: 'testFilterValue'
        })).toEqual(true);

        component.filters = [];

        expect(component.isSelected({
            testFilterField: 'testFilterValue'
        })).toEqual(false);
    });

    //for refreshVisualization method
    it('refreshVisualization does call changeDetection.detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
    });

    //for removeFilter method
    it('removeFilter does remove objects from filters', () => {
        let filter1 = {
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let filter2 = {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        };
        component.filters = [filter1, filter2];

        component.removeFilter(filter1);
        expect(component.filters).toEqual([filter2]);

        component.removeFilter(filter2);
        expect(component.filters).toEqual([]);
    });

    it('removeFilter does not remove objects from filters with non-matching IDs', () => {
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.removeFilter({
            id: 'idC',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });
        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
    });

    //private get array values method test?

    //for selectGridItem method
    it('selectGridItem does call publishSelectId if idField is set', () => {
        let spy = spyOn(component, 'publishSelectId');

        component.selectGridItem({
            testIdField: 'id1'
        });
        expect(spy.calls.count()).toEqual(0);

        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');

        component.selectGridItem({
            testIdField: 'id1'
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['id1']);
    });

    it('selectGridItem does call createFilter if filterField is set', () => {
        let spy = spyOn(component, 'createFilter');

        component.selectGridItem({
            testFilterField: 'filter1'
        });
        expect(spy.calls.count()).toEqual(0);

        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');

        component.selectGridItem({
            testFilterField: 'filter1'
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['filter1']);
    });

    //for  setupFilters method
    it('setupFilters does not do anything if no filter exists', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([]);
    });

    it('setupFilters does add neon filter to filters', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does not add neon filter with non-matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;

        // Test matching database/table but not field.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        // Test matching database/field but not table.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[1];

        // Test matching table/field but not table.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does not add neon filter matching existing filter field/value', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName1');

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName2');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does remove previous filters', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testFilterField', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;
        component.filters = [{
            id: 'idA',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'value2'
        }];

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testFilterField',
            prettyField: 'Test Filter Field',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does ignore neon filters with multiple clauses', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [
                neon.query.where('testFilterField', '=', 'value1'),
                neon.query.where('testFilterField', '=', 'value2')
            ]), 'testFilterName2');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.filterField = DatasetServiceMock.FILTER_FIELD;

        component.setupFilters();
        expect(component.filters).toEqual([]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });
});
