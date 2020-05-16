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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    AbstractSearchService,
    CompoundFilterType,
    CoreSearch,
    FieldConfig,
    FilterCollection,
    ListFilterDesign,
    SearchServiceMock
} from '@caci-critical-insight-solutions/nucleus-core';

import { } from 'jasmine-core';

import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { NewsFeedComponent } from './news-feed.component';
import { DashboardServiceMock } from '../../services/mock.dashboard-service';

import { NewsFeedModule } from './news-feed.module';

describe('Component: NewsFeed', () => {
    let component: NewsFeedComponent;
    let fixture: ComponentFixture<NewsFeedComponent>;

    // May need to add or remove some initializations (copied from media-viewer.component)
    initializeTestBed('News Feed', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
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
        expect(component.options.id).toEqual(undefined);
        expect(component.options.ignoreSelf).toEqual(false);
        expect(component.options.contentField).toEqual(FieldConfig.get());
        expect(component.options.secondaryContentField).toEqual(FieldConfig.get());
        expect(component.options.titleContentField).toEqual(FieldConfig.get());
        expect(component.options.dateField).toEqual(FieldConfig.get());
        expect(component.options.filterField).toEqual(FieldConfig.get());
        expect(component.options.idField).toEqual(FieldConfig.get());
        expect(component.options.sortField).toEqual(FieldConfig.get());
    });

    it('createFilter does call filterService.exchangeFilters as expected', () => {
        component.options.toggleFiltered = true;
        let spy = spyOn((component as any), 'exchangeFilters');

        component.createFilter('testText1');

        expect(spy.calls.count()).toEqual(0);

        component.options.filterField = DashboardServiceMock.FIELD_MAP.FILTER;

        component.createFilter('testText1');

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.FILTER.columnName, '=', ['testText1'])
        ]]);

        component.createFilter('testText2');

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.FILTER.columnName, '=', ['testText1', 'testText2'])
        ]]);
    });

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.filterField = DashboardServiceMock.FIELD_MAP.FILTER;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0]).type).toEqual(CompoundFilterType.OR);
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.FILTER.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).values).toEqual([undefined]);
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.id = 'testId';
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.sortField = DashboardServiceMock.FIELD_MAP.SORT;
        component.options.filterField = DashboardServiceMock.FIELD_MAP.FILTER;
        component.options.contentField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.secondaryContentField = DashboardServiceMock.FIELD_MAP.TEXT;
        component.options.titleContentField = DashboardServiceMock.FIELD_MAP.NAME;
        component.options.dateField = DashboardServiceMock.FIELD_MAP.DATE;

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
                    field: 'testSortField'
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
                    field: 'testSortField'
                },
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });

        component.options.sortField = new FieldConfig();
        searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: null,
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    }));

    it('validateVisualizationQuery does return expected boolean', () => {
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.table = DashboardServiceMock.TABLES.testTable1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.idField = FieldConfig.get({ columnName: 'tesIdField', prettyName: 'Test Id Field' });
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.dateField = FieldConfig.get({ columnName: 'testDateField', prettyName: 'Test Date Field' });
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.contentField = FieldConfig.get({ columnName: 'testContentField', prettyName: 'Test Content Field' });
        expect(component.validateVisualizationQuery(component.options)).toEqual(true);
    });

    it('transformVisualizationQueryResults with aggregation query data does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;

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
        }], new FilterCollection());

        expect(component.newsFeedData).toEqual([{
            _filtered: false,
            field: {
                testLinkField: 'link1',
                testNameField: 'name1',
                testSizeField: 0.1,
                testTypeField: 'type1',
                _id: 'id1'
            },
            media: undefined
        }, {
            _filtered: false,
            field: {
                testLinkField: 'link2',
                testNameField: 'name2',
                testSizeField: 0.2,
                testTypeField: 'type2',
                _id: 'id2'
            },
            media: undefined
        }]);
        expect(actual).toEqual(2);
    });

    it('transformVisualizationQueryResults with empty aggregation query data does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;

        let actual = component.transformVisualizationQueryResults(component.options, [], new FilterCollection());

        expect(component.newsFeedData).toEqual([]);
        expect(actual).toEqual(0);
    });

    it('transformVisualizationQueryResults with limited aggregation query data does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;
        component.options.searchLimit = 1;

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
        }], new FilterCollection());

        expect(component.newsFeedData).toEqual([{
            _filtered: false,
            field: {
                testLinkField: 'link1',
                testNameField: 'name1',
                testSizeField: 0.1,
                testTypeField: 'type1',
                _id: 'id1'
            },
            media: undefined
        }, {
            _filtered: false,
            field: {
                testLinkField: 'link2',
                testNameField: 'name2',
                testSizeField: 0.2,
                testTypeField: 'type2',
                _id: 'id2'
            },
            media: undefined
        }]);
        expect(actual).toEqual(2);
    });

    it('transformVisualizationQueryResults with link prefix does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;

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
        }], new FilterCollection());

        expect(actual).toEqual(2);
        expect(component.newsFeedData).toEqual([{
            _filtered: false,
            field: {
                testLinkField: 'link1',
                testNameField: 'name1',
                testSizeField: 0.1,
                testTypeField: 'type1',
                _id: 'id1'
            },
            media: undefined
        }, {
            _filtered: false,
            field: {
                testLinkField: 'link2',
                testNameField: 'name2',
                testSizeField: 0.2,
                testTypeField: 'type2',
                _id: 'id2'
            },
            media: undefined
        }]);
    });

    it('transformationQuery returns expected data with media', () => {
        component.options.fields = DashboardServiceMock.FIELDS;
        component.options.linkField = DashboardServiceMock.FIELD_MAP.LINK;
        let results = [{
            _id: 'id1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }];
        let actual = component.transformVisualizationQueryResults(component.options, results, new FilterCollection());
        expect(actual).toEqual(1);
        expect(component.newsFeedData).toEqual([{
            _filtered: false,
            field: {
                testLinkField: 'link1',
                testNameField: 'name1',
                testSizeField: 0.1,
                testTypeField: 'type1',
                _id: 'id1'
            },
            media: {
                selected: {
                    border: undefined,
                    link: 'link1',
                    name: '1: link1',
                    type: 'link1'
                },
                name: '',
                loaded: false,
                list: [{
                    border: undefined,
                    link: 'link1',
                    name: '1: link1',
                    type: 'link1'
                }]
            }
        }]);
    });

    // Private get array values method test?

    it('expandOrCollapse does call publishSelectId if ID is expanded', () => {
        let spy = spyOn(component, 'publishSelectId');

        component.options.idField = FieldConfig.get({ columnName: 'testIdField', prettyName: 'Test ID Field' });

        component.expandOrCollapse('id1');

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['id1']);
    });

    it('expandOrCollapse does not call publishSelectId if ID is not expanded', () => {
        let spy = spyOn(component, 'publishSelectId');

        component.options.idField = FieldConfig.get({ columnName: 'testIdField', prettyName: 'Test ID Field' });

        component['_expandedIdList'] = ['id1'];

        component.expandOrCollapse('id1');

        expect(spy.calls.count()).toEqual(0);
    });
});
