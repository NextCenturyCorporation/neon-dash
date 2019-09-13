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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterCollection, ListFilterDesign, SimpleFilterDesign } from '../../models/filters';
import { DatabaseConfig, FieldConfig, TableConfig } from '../../models/dataset';

import { Injector } from '@angular/core';

import { TextCloudComponent } from './text-cloud.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { AggregationType, CompoundFilterType } from '../../models/widget-option';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { TextCloudModule } from './text-cloud.module';

describe('Component: TextCloud', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;

    initializeTestBed('Text Cloud', {
        providers: [
            InjectableColorThemeService,
            {
                provide: DashboardService,
                useClass: DashboardServiceMock
            },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector

        ],
        imports: [
            TextCloudModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TextCloudComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('has expected options properties', () => {
        expect(component.options.aggregation).toBe(AggregationType.COUNT);
        expect(component.options.andFilters).toBe(true);
        expect(component.options.dataField).toEqual(FieldConfig.get());
        expect(component.options.sizeField).toEqual(FieldConfig.get());
    });

    it('has an validateVisualizationQuery method that properly checks whether or not a valid query can be made', () => {
        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();
        component.options.database = DatabaseConfig.get({ name: 'testDatabase1' });
        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();
        component.options.table = TableConfig.get({ name: 'testTable1' });
        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();
        component.options.dataField = FieldConfig.get({ columnName: 'testTextField' });
        expect(component.validateVisualizationQuery(component.options)).toBeTruthy();
    });

    it('returns expected query from finalizeVisualizationQuery', () => {
        component.options.database = DatabaseConfig.get({ name: 'testDatabase1' });
        component.options.table = TableConfig.get({ name: 'testTable1' });
        component.options.dataField = FieldConfig.get({ columnName: 'testTextField' });

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testTextField',
                name: '_aggregation',
                type: 'count'
            }],
            groups: ['testTextField'],
            filter: {
                field: 'testTextField',
                operator: '!=',
                value: null
            },
            sort: {
                field: '_aggregation',
                order: -1
            }
        });

        component.options.aggregation = AggregationType.AVG;
        component.options.sizeField = FieldConfig.get({ columnName: 'testSizeField' });
        component.options.limit = 25;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testSizeField',
                name: '_aggregation',
                type: 'avg'
            }],
            filter: {
                field: 'testTextField',
                operator: '!=',
                value: null
            },
            groups: ['testTextField'],
            sort: {
                field: '_aggregation',
                order: -1
            }
        });
    });

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0]).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1.name);
        expect((actual[0]).table).toEqual(DashboardServiceMock.TABLES.testTable1.name);
        expect((actual[0]).field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).value).toBeUndefined();
    });

    it('onClick does call toggleFilters with expected object', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.dataField = DashboardServiceMock.FIELD_MAP.TEXT;
        let spyExchange = spyOn((component as any), 'exchangeFilters');
        let spyToggle = spyOn((component as any), 'toggleFilters');

        component.options.andFilters = false;

        component.onClick({
            key: 'testText1'
        });

        expect(spyExchange.calls.count()).toEqual(0);
        expect(spyToggle.calls.count()).toEqual(1);
        expect(spyToggle.calls.argsFor(0)).toEqual([[
            new SimpleFilterDesign(DashboardServiceMock.DATASTORE.name, DashboardServiceMock.DATABASES.testDatabase1.name,
                DashboardServiceMock.TABLES.testTable1.name, DashboardServiceMock.FIELD_MAP.TEXT.columnName, '=', 'testText1')
        ]]);

        component.onClick({
            key: 'testText2'
        });

        expect(spyExchange.calls.count()).toEqual(0);
        expect(spyToggle.calls.count()).toEqual(2);
        expect(spyToggle.calls.argsFor(1)).toEqual([[
            new SimpleFilterDesign(DashboardServiceMock.DATASTORE.name, DashboardServiceMock.DATABASES.testDatabase1.name,
                DashboardServiceMock.TABLES.testTable1.name, DashboardServiceMock.FIELD_MAP.TEXT.columnName, '=', 'testText2')
        ]]);

        component.options.andFilters = true;

        component.onClick({
            key: 'testText3'
        });

        expect(spyToggle.calls.count()).toEqual(2);
        expect(spyExchange.calls.count()).toEqual(1);
        expect(spyExchange.calls.argsFor(0)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TEXT.columnName, '=', ['testText1', 'testText2', 'testText3'])
        ]]);

        component.onClick({
            key: 'testText4'
        });

        expect(spyToggle.calls.count()).toEqual(2);
        expect(spyExchange.calls.count()).toEqual(2);
        expect(spyExchange.calls.argsFor(1)).toEqual([[
            new ListFilterDesign(CompoundFilterType.AND, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TEXT.columnName, '=', ['testText1', 'testText2', 'testText3', 'testText4'])
        ]]);
    });

    it('redrawFilters does update textCloudData if no text is selected', () => {
        component.textCloudData = [{
            color: 'color1',
            fontSize: 'fontSize1',
            key: 'key1',
            keyTranslated: 'keyTranslated1',
            selected: true,
            value: 'value1'
        }, {
            color: 'color2',
            fontSize: 'fontSize2',
            key: 'key2',
            keyTranslated: 'keyTranslated2',
            selected: true,
            value: 'value2'
        }];

        (component as any).redrawFilters(new FilterCollection());

        expect(component.textCloudData).toEqual([{
            color: 'color1',
            fontSize: 'fontSize1',
            key: 'key1',
            keyTranslated: 'keyTranslated1',
            selected: false,
            value: 'value1'
        }, {
            color: 'color2',
            fontSize: 'fontSize2',
            key: 'key2',
            keyTranslated: 'keyTranslated2',
            selected: false,
            value: 'value2'
        }]);
    });

    it('redrawFilters does update textCloudData if some text is selected', () => {
        component.textCloudData = [{
            color: 'color1',
            fontSize: 'fontSize1',
            key: 'key1',
            keyTranslated: 'keyTranslated1',
            selected: true,
            value: 'value1'
        }, {
            color: 'color2',
            fontSize: 'fontSize2',
            key: 'key2',
            keyTranslated: 'keyTranslated2',
            selected: false,
            value: 'value2'
        }];

        let testCollection = new FilterCollection();
        spyOn(testCollection, 'isFiltered').and.callFake((design) => design.value === 'key2');

        (component as any).redrawFilters(testCollection);

        expect(component.textCloudData).toEqual([{
            color: 'color1',
            fontSize: 'fontSize1',
            key: 'key1',
            keyTranslated: 'keyTranslated1',
            selected: false,
            value: 'value1'
        }, {
            color: 'color2',
            fontSize: 'fontSize2',
            key: 'key2',
            keyTranslated: 'keyTranslated2',
            selected: true,
            value: 'value2'
        }]);
    });

    it('transformVisualizationQueryResults with no data does return expected data', () => {
        component.options.dataField = FieldConfig.get({ columnName: 'testTextField', prettyName: 'Test Text Field' });

        let actual1 = component.transformVisualizationQueryResults(component.options, [], new FilterCollection());

        expect(component.textCloudData).toEqual([]);
        expect(actual1).toEqual(0);

        component.options.sizeField = FieldConfig.get({ columnName: 'testSizeField', prettyName: 'Test Size Field' });

        let actual2 = component.transformVisualizationQueryResults(component.options, [], new FilterCollection());

        expect(component.textCloudData).toEqual([]);
        expect(actual2).toEqual(0);
    });

    it('transformVisualizationQueryResults with data does return expected data', () => {
        component.options.dataField = FieldConfig.get({ columnName: 'testTextField', prettyName: 'Test Text Field' });
        let data = [{
            _aggregation: 8,
            testTextField: 'First'
        }, {
            _aggregation: 5,
            testTextField: 'Second'
        }, {
            _aggregation: 1,
            testTextField: 'Third'
        }];

        let actual1 = component.transformVisualizationQueryResults(component.options, data, new FilterCollection());

        expect(component.textCloudData).toEqual([{
            fontSize: '140%',
            color: '#54c8cd',
            selected: false,
            value: 8,
            key: 'First',
            keyTranslated: 'First'
        },
        {
            fontSize: '114.28571428571428%',
            color: '#46888b',
            selected: false,
            value: 5,
            key: 'Second',
            keyTranslated: 'Second'
        },
        {
            fontSize: '80%',
            color: '#333333',
            selected: false,
            value: 1,
            key: 'Third',
            keyTranslated: 'Third'
        }]);
        expect(actual1).toEqual(3);
    });
});
