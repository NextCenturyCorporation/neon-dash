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
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';

import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import { DataMessageComponent } from '../data-message/data-message.component';
import { TextCloudComponent } from './text-cloud.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { AbstractSearchService, AggregationType } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { TransformedVisualizationData } from '../base-neon-component/base-neon.component';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

describe('Component: TextCloud', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed('Text Cloud', {
        declarations: [
            TextCloudComponent,
            UnsharedFilterComponent
        ],
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            {
                provide: DatasetService,
                useClass: DatasetServiceMock
            },
            { provide: FilterService, useClass: FilterServiceMock },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            BrowserAnimationsModule
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
        expect(component.textColor).toBe('#54C8CD');
    });

    it('returns the correct value from getExportFields', () => {
        component.options.dataField = new FieldMetaData('testTextField', 'Test Text Field');
        component.options.sizeField = new FieldMetaData('testSizeField');

        expect(component.getExportFields()).toEqual([{
            columnName: 'testTextField',
            prettyName: 'Test Text Field'
        }, {
            columnName: 'value',
            prettyName: 'Count'
        }]);

        component.options.sizeField.prettyName = 'Test Size Field';

        expect(component.getExportFields()).toEqual([{
            columnName: 'testTextField',
            prettyName: 'Test Text Field'
        }, {
            columnName: 'value',
            prettyName: 'Test Size Field'
        }]);
    });

    it('has a refreshVisualization method that calls createTextCloud', () => {
        let spy = spyOn(component.textCloud, 'createTextCloud');
        (component as any).layerIdToActiveData.set(component.options._id, new TransformedVisualizationData([]));
        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
    });

    it('getFilterText does return expected string', () => {
        expect(component.getFilterText({
            id: `1234567890`,
            field: 'testTextField',
            value: 'Value',
            prettyField: 'Test Text Field'
        })).toEqual('Test Text Field = Value');
    });

    it('getFilterDetail does return expected string', () => {
        expect(component.getFilterDetail({
            id: `1234567890`,
            field: 'testTextField',
            value: 'Value',
            prettyField: 'Test Text Field'
        })).toEqual('');

        expect(component.getFilterDetail({
            id: `1234567890`,
            translated: 'Translated Value',
            field: 'testTextField',
            value: 'Value',
            prettyField: 'Test Text Field'
        })).toEqual(' (Translated Value)');
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
                field: '*',
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

    it('returns null from getFiltersToIgnore', () => {
        expect(component.getFiltersToIgnore()).toBeNull();
    });

    it('transformVisualizationQueryResults with no data does return expected data', () => {
        component.options.dataField = new FieldMetaData('testTextField', 'Test Text Field');

        let actual1 = component.transformVisualizationQueryResults(component.options, []);

        expect(actual1.data).toEqual([]);

        component.options.sizeField = new FieldMetaData('testSizeField', 'Test Size Field');

        let actual2 = component.transformVisualizationQueryResults(component.options, []);

        expect(actual2.data).toEqual([]);
    });

    it('transformVisualizationQueryResults with data does return expected data', () => {
        component.options.dataField = new FieldMetaData('testTextField', 'Test Text Field');
        let data = [{
            _aggregation: 8,
            testTextField: 'First',
            testSizeField: 100
        }, {
            _aggregation: 5,
            testTextField: 'Second',
            testSizeField: 75
        }, {
            _aggregation: 1,
            testTextField: 'Third',
            testSizeField: 50
        }];

        let actual1 = component.transformVisualizationQueryResults(component.options, data);

        expect(actual1.data).toEqual([{
            _aggregation: 8,
            value: 8,
            testTextField: 'First',
            testSizeField: 100,
            key: 'First',
            keyTranslated: 'First'
        },
        {
            _aggregation: 5,
            value: 5,
            testTextField: 'Second',
            testSizeField: 75,
            key: 'Second',
            keyTranslated: 'Second'
        },
        {
            _aggregation: 1,
            value: 1,
            testTextField: 'Third',
            testSizeField: 50,
            key: 'Third',
            keyTranslated: 'Third'
        }]);
    });

    it('has an onClick method that properly sets local and remote filters', () => {
        component.options.database.name = 'testDatabase1';
        component.options.table.name = 'testTable1';
        component.options.dataField = new FieldMetaData('testTextField', 'testTextField');
        let spy = spyOn(component, 'addNeonFilter');

        expect(component.getCloseableFilters().length).toBe(0);

        component.onClick({
            key: 'testValue'
        });

        expect(spy.calls.count()).toEqual(1);
        expect(component.getCloseableFilters()[0]).toEqual({
            id: undefined,
            field: 'testTextField',
            prettyField: 'testTextField',
            translated: '',
            value: 'testValue'
        });
    });

    it('has a filterIsUnique method that properly checks the uniqueness of filters to add', () => {
        let filter1 = {
            id: '12345',
            field: 'testTextField',
            prettyField: 'testTextField',
            translated: '',
            value: 'Value 1'
        };
        let filter2 = {
            id: '67890',
            field: 'testTextField',
            prettyField: 'testTextField',
            translated: '',
            value: 'Value 1'
        };
        expect(component.filterIsUnique(filter2)).toBeTruthy();
        component.filters.push(filter1);
        expect(component.filterIsUnique(filter2)).toBeFalsy();
        filter2.field = 'testOtherField';
        expect(component.filterIsUnique(filter2)).toBeTruthy();
        filter2.field = 'testTextField';
        filter2.value = 'Value 2';
        expect(component.filterIsUnique(filter2)).toBeTruthy();
    });

    it('properly modifies the active data in refreshVisualization', () => {
        let data = [{
            testTextField: 'Value 1',
            value: 20
        },
        {
            testTextField: 'Value 2',
            value: 10
        },
        {
            testTextField: 'Value 3',
            value: 30
        }];
        (component as any).layerIdToActiveData.set(component.options._id, new TransformedVisualizationData(data));
        component.refreshVisualization();
        expect(component.textCloudData[0].fontSize).toBeDefined();
        expect(component.textCloudData[0].color).toBeDefined();
        expect(component.textCloudData[1].fontSize).toBeDefined();
        expect(component.textCloudData[2].color).toBeDefined();
    });

    it('properly returns the list of filters from getCloseableFilters', () => {
        let filter1 = {
            id: '12345',
            field: 'testTextField',
            prettyField: 'testTextField',
            translated: '',
            value: 'Value 1'
        };
        let filter2 = {
            id: '67890',
            field: 'testTextField',
            prettyField: 'testTextField',
            translated: '',
            value: 'Value 1'
        };

        expect(component.getCloseableFilters()).toEqual([]);
        component.filters.push(filter1);
        expect(component.getCloseableFilters()).toEqual([filter1]);
        component.filters.push(filter2);
        expect(component.getCloseableFilters()).toEqual([filter1, filter2]);
        component.removeFilter(filter1);
        expect(component.getCloseableFilters()).toEqual([filter2]);
        component.filters.push(filter1);
        expect(component.getCloseableFilters()).toEqual([filter2, filter1]);
        component.removeFilter(filter1);
        component.removeFilter(filter2);
        expect(component.getCloseableFilters()).toEqual([]);
    });

    it('properly removes filters in removeFilter', () => {
        let filter1 = {
            id: '12345',
            field: 'testTextField',
            prettyField: 'testTextField',
            translated: '',
            value: 'Value 1'
        };
        let filter2 = {
            id: '67890',
            field: 'testTextField',
            prettyField: 'testTextField',
            translated: '',
            value: 'Value 1'
        };

        expect(component.getCloseableFilters()).toEqual([]);
        component.filters.push(filter1);
        expect(component.getCloseableFilters()).toEqual([filter1]);
        component.filters.push(filter2);
        expect(component.getCloseableFilters()).toEqual([filter1, filter2]);
        component.removeFilter(filter1);
        expect(component.getCloseableFilters()).toEqual([filter2]);
        component.filters.push(filter1);
        expect(component.getCloseableFilters()).toEqual([filter2, filter1]);
        component.removeFilter(filter1);
        component.removeFilter(filter2);
        expect(component.getCloseableFilters()).toEqual([]);
    });

    it('has a requestExport method that does nothing', () => {
        expect(component.requestExport).toBeDefined();
    });
});
