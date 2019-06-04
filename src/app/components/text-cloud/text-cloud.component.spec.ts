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

import { TextCloudComponent } from './text-cloud.component';

import { AbstractSearchService, AggregationType, CompoundFilterType } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { NeonGTDConfig } from '../../neon-gtd-config';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { TextCloudModule } from './text-cloud.module';
import { ConfigService } from '../../services/config.service';

describe('Component: TextCloud', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;

    initializeTestBed('Text Cloud', {
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            {
                provide: DashboardService,
                useClass: DashboardServiceMock
            },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonGTDConfig.get()) }

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

    it('exists', () => {
        expect(component).toBeTruthy();
    });

    it('has expected options properties', () => {
        expect(component.options.aggregation).toBe(AggregationType.COUNT);
        expect(component.options.andFilters).toBe(true);
        expect(component.options.dataField).toEqual(new FieldMetaData());
        expect(component.options.sizeField).toEqual(new FieldMetaData());
    });

    it('has expected class properties', () => {
        // TODO This color should not be hard-coded...
        expect(component.textColor).toBe('#367588');
    });

    it('has an validateVisualizationQuery method that properly checks whether or not a valid query can be made', () => {
        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();
        component.options.database = new DatabaseMetaData('testDatabase1');
        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();
        component.options.table = new TableMetaData('testTable1');
        expect(component.validateVisualizationQuery(component.options)).toBeFalsy();
        component.options.dataField = new FieldMetaData('testTextField');
        expect(component.validateVisualizationQuery(component.options)).toBeTruthy();
    });

    it('returns expected query from finalizeVisualizationQuery', () => {
        component.options.database = new DatabaseMetaData('testDatabase1');
        component.options.table = new TableMetaData('testTable1');
        component.options.dataField = new FieldMetaData('testTextField');

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
        component.options.sizeField = new FieldMetaData('testSizeField');
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

        component.options.dataField = DashboardServiceMock.TEXT_FIELD;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.TEXT_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawText.bind(component).toString());
    });

    it('onClick does call toggleFilters with expected object', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.dataField = DashboardServiceMock.TEXT_FIELD;
        let spy = spyOn((component as any), 'toggleFilters');

        component.onClick({
            key: 'testText1'
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.TEXT_FIELD,
            operator: '=',
            value: 'testText1'
        }]]);

        component.options.andFilters = false;

        component.onClick({
            key: 'testText2'
        });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.TEXT_FIELD,
            operator: '=',
            value: 'testText2'
        }]]);
    });

    it('redrawText does update textCloudData if no text is selected', () => {
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

        spyOn((component as any), 'isFiltered').and.returnValue(false);

        (component as any).redrawText();

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

    it('redrawText does update textCloudData if some text is selected', () => {
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

        spyOn((component as any), 'isFiltered').and.callFake((filterDesign) => filterDesign.value === 'key2');

        (component as any).redrawText();

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
        component.options.dataField = new FieldMetaData('testTextField', 'Test Text Field');

        let actual1 = component.transformVisualizationQueryResults(component.options, []);

        expect(component.textCloudData).toEqual([]);
        expect(actual1).toEqual(0);

        component.options.sizeField = new FieldMetaData('testSizeField', 'Test Size Field');

        let actual2 = component.transformVisualizationQueryResults(component.options, []);

        expect(component.textCloudData).toEqual([]);
        expect(actual2).toEqual(0);
    });

    it('transformVisualizationQueryResults with data does return expected data', () => {
        component.options.dataField = new FieldMetaData('testTextField', 'Test Text Field');
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

        let actual1 = component.transformVisualizationQueryResults(component.options, data);

        expect(component.textCloudData).toEqual([{
            fontSize: '140%',
            color: '#367588',
            selected: false,
            value: 8,
            key: 'First',
            keyTranslated: 'First'
        },
        {
            fontSize: '114.28571428571428%',
            color: '#688c97',
            selected: false,
            value: 5,
            key: 'Second',
            keyTranslated: 'Second'
        },
        {
            fontSize: '80%',
            color: '#aaaaaa',
            selected: false,
            value: 1,
            key: 'Third',
            keyTranslated: 'Third'
        }]);
        expect(actual1).toEqual(3);
    });
});
