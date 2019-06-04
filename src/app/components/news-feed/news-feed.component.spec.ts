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
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../types';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { } from 'jasmine-core';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { NewsFeedComponent } from './news-feed.component';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { NewsFeedModule } from './news-feed.module';
import { ConfigService } from '../../services/config.service';

describe('Component: NewsFeed', () => {
    let component: NewsFeedComponent;
    let fixture: ComponentFixture<NewsFeedComponent>;

    // May need to add or remove some initializations (copied from media-viewer.component)
    initializeTestBed('News Feed', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) }

        ],
        imports: [
            NewsFeedModule
        ]
    });

    // May need to change further
    beforeEach(() => {
        fixture = TestBed.createComponent(NewsFeedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // Checks if all class properties are there
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

    it('createFilter does call filterService.toggleFilters as expected', () => {
        let spy = spyOn((component as any), 'toggleFilters');

        component.createFilter('testText');

        expect(spy.calls.count()).toEqual(0);

        component.options.filterField = DashboardServiceMock.FILTER_FIELD;

        component.createFilter('testText');

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES[0],
            table: DashboardServiceMock.TABLES[0],
            field: DashboardServiceMock.FILTER_FIELD,
            operator: '=',
            value: 'testText'
        }]]);
    });

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.filterField = DashboardServiceMock.FILTER_FIELD;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES[0]);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FILTER_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
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

    // For getElementRefs method
    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.newsFeed).toBeDefined();
        expect(refs.visualization).toBeDefined();
        // TODO expect(refs.filter).toBeDefined();
    });

    it('validateVisualizationQuery does return expected boolean', () => {
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.database = DashboardServiceMock.DATABASES[0];
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.table = DashboardServiceMock.TABLES[0];
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.idField = new FieldMetaData('tesIdField', 'Test Id Field');
        expect(component.validateVisualizationQuery(component.options)).toEqual(true);
    });

    it('transformVisualizationQueryResults with aggregation query data does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;
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

        expect(component.newsFeedData).toEqual([{
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
        expect(actual).toEqual(2);
    });

    it('transformVisualizationQueryResults with empty aggregation query data does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');

        let actual = component.transformVisualizationQueryResults(component.options, []);

        expect(component.newsFeedData).toEqual([]);
        expect(actual).toEqual(0);
    });

    it('transformVisualizationQueryResults with limited aggregation query data does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;
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

        expect(component.newsFeedData).toEqual([{
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
        expect(actual).toEqual(2);
    });

    it('transformVisualizationQueryResults with link prefix does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;
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

        expect(actual).toEqual(2);
        expect(component.newsFeedData).toEqual([{
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

    // For isSelectable method
    it('isSelectable does return expected boolean', () => {
        component.options.filterField = new FieldMetaData('testFilterField', 'Test Filter Field');
        expect(component.isSelectable()).toEqual(true);
        component.options.filterField = new FieldMetaData();

        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');
        expect(component.isSelectable()).toEqual(true);
        component.options.idField = new FieldMetaData();
    });

    // For isSelected method
    it('isSelected does return expected boolean', () => {
        expect(component.isSelected({})).toEqual(false);

        expect(component.isSelected({
            testFilterField: 'testFilterValue1'
        })).toEqual(false);

        component.options.filterField = DashboardServiceMock.FILTER_FIELD;

        expect(component.isSelected({
            testFilterField: 'testFilterValue1'
        })).toEqual(false);

        spyOn((component as any), 'isFiltered').and.callFake((filterDesign) => filterDesign.database === component.options.database &&
            filterDesign.table === component.options.table && filterDesign.field === component.options.filterField &&
            filterDesign.operator === '=' && filterDesign.value === 'testFilterValue1');

        expect(component.isSelected({
            testFilterField: 'testFilterValue1'
        })).toEqual(true);

        expect(component.isSelected({
            testFilterField: 'testFilterValue2'
        })).toEqual(false);

        expect(component.isSelected({
            testNotAFilterField: 'testFilterValue1'
        })).toEqual(false);

        component.options.filterField = new FieldMetaData();

        expect(component.isSelected({
            testFilterField: 'testFilterValue1'
        })).toEqual(false);
    });

    // For refreshVisualization method
    it('refreshVisualization does call changeDetection.detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
    });

    // Private get array values method test?

    // for selectGridItem method
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
});
