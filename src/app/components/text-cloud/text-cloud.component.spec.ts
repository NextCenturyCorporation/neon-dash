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
            DataMessageComponent,
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
        // TODO This color should not be hard-coded...
        expect(component.textColor).toBe('#367588');
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

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.dataField = DatasetServiceMock.TEXT_FIELD;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0].filterDesign as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((actual[0].filterDesign as any).operator).toEqual('=');
        expect((actual[0].filterDesign as any).value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawText.bind(component).toString());
    });

    it('onClick does call toggleFilters with expected object', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.dataField = DatasetServiceMock.TEXT_FIELD;
        let spy = spyOn((component as any), 'toggleFilters');

        component.onClick({
            key: 'testText1'
        });

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            optional: false,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
            operator: '=',
            value: 'testText1'
        }]]);

        component.options.andFilters = false;

        component.onClick({
            key: 'testText2'
        });

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            optional: true,
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.TEXT_FIELD,
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

        spyOn((component as any), 'isFiltered').and.callFake((filterDesign) => {
            return filterDesign.value === 'key2';
        });

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

    it('redrawText does update textCloudData if some text is selected', () => {
        component.textCloudData = [{
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
        }];

        spyOn((component as any), 'isFiltered').and.returnValue(true);

        (component as any).redrawText();

        expect(component.textCloudData).toEqual([{
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
        }]);
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
            testTextField: 'First'
        }, {
            _aggregation: 5,
            testTextField: 'Second'
        }, {
            _aggregation: 1,
            testTextField: 'Third'
        }];

        let actual1 = component.transformVisualizationQueryResults(component.options, data);

        expect(actual1.data).toEqual([{
            selected: false,
            value: 8,
            key: 'First',
            keyTranslated: 'First'
        },
        {
            selected: false,
            value: 5,
            key: 'Second',
            keyTranslated: 'Second'
        },
        {
            selected: false,
            value: 1,
            key: 'Third',
            keyTranslated: 'Third'
        }]);
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

    it('has a requestExport method that does nothing', () => {
        expect(component.requestExport).toBeDefined();
    });
});
