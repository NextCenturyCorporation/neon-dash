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
import { DatabaseMetaData, FieldMetaData, TableMetaData, Dataset } from '../../dataset';

import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import { TextCloudComponent } from './text-cloud.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { neonVariables } from '../../neon-namespaces';

import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';

describe('Component: TextCloud', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            TextCloudComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            ConnectionService,
            {
                provide: DatasetService,
                useClass: DatasetServiceMock
            },
            { provide: FilterService, useClass: FilterServiceMock },
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
        expect(component.options.aggregation).toBe(neonVariables.COUNT);
        expect(component.options.andFilters).toBe(true);
        expect(component.options.dataField).toEqual(new FieldMetaData());
        expect(component.options.sizeField).toEqual(new FieldMetaData());
    });

    it('has expected class properties', () => {
        expect(component.activeData).toEqual([]);
        expect(component.termsCount).toBe(0);
        expect(component.textColor).toBe('#54C8CD');
    });

    it('has a subNgOnInit method', () => {
        expect(component.subNgOnInit).toBeDefined();
    });

    it('has a postInit method, which calls executeQueryChain', () => {
        expect(component.postInit).toBeDefined();
        let executeQueryChainHasBeenCalled = false;
        component.executeQueryChain = () => {
            executeQueryChainHasBeenCalled = true;
        };
        component.postInit();
        expect(executeQueryChainHasBeenCalled).toBeTruthy();
    });

    it('has subNgOnDestroy function that does nothing', () => {
        expect(component.subNgOnDestroy).toBeDefined();
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
        let createTextCloudHasBeenCalled = false;
        component.createTextCloud = () => {
            createTextCloudHasBeenCalled = true;
        };
        component.refreshVisualization();
        expect(createTextCloudHasBeenCalled).toBeTruthy();
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

    it('has an isValidQuery method that properly checks whether or not a valid query can be made', () => {
        expect(component.isValidQuery()).toBeFalsy();
        component.options.database = new DatabaseMetaData('testDatabase1');
        expect(component.isValidQuery()).toBeFalsy();
        component.options.table = new TableMetaData('testTable1');
        expect(component.isValidQuery()).toBeFalsy();
        component.options.dataField = new FieldMetaData('testTextField');
        expect(component.isValidQuery()).toBeTruthy();
    });

    it('returns expected query from createQuery', () => {
        component.options.database = new DatabaseMetaData('testDatabase1');
        component.options.table = new TableMetaData('testTable1');
        component.options.dataField = new FieldMetaData('testTextField');

        let whereClause = neon.query.where('testTextField', '!=', null);
        let query = new neon.query.Query().selectFrom('testDatabase1', 'testTable1')
            .where(whereClause)
            .groupBy('testTextField')
            .aggregate(neonVariables.COUNT, '*', 'value')
            .sortBy('value', neonVariables.DESCENDING)
            .limit(40);

        expect(component.createQuery()).toEqual(query);

        component.options.aggregation = neonVariables.AVG;
        component.options.sizeField = new FieldMetaData('testSizeField');
        component.options.limit = 25;
        let whereClauses = neon.query.and(whereClause, neon.query.where('testSizeField', '!=', null));

        query = new neon.query.Query().selectFrom('testDatabase1', 'testTable1')
            .where(whereClauses)
            .groupBy('testTextField')
            .aggregate(neonVariables.AVG, 'testSizeField', 'testSizeField')
            .sortBy('testSizeField', neonVariables.DESCENDING)
            .limit(25);

        expect(component.createQuery()).toEqual(query);
    });

    it('returns null from getFiltersToIgnore', () => {
        expect(component.getFiltersToIgnore()).toBeNull();
    });

    it('sets the expected values when getTermsCount is called', () => {
        component.termsCount = 40;
        let termsCountResponse = {
            data: [{
                _termsCount: 8,
                testTextField: 'getTermsCount works differently in the text cloud than in other places'
            },
            {
                _termsCount: 5,
                testTextField: 'it doesn\'t operate on raw documents, and so can\'t somply give a nice count'
            },
            {
                _termsCount: 1,
                testTextField: 'instead, it returns a list of all values and counts them'
            }]
        };
        let calledExecuteQuery = false;
        component.executeQuery = () => {
            calledExecuteQuery = true;
            component.onQuerySuccess(termsCountResponse);
        };

        component.getTermsCount();

        expect(calledExecuteQuery).toBeTruthy();
        expect(component.termsCount).toBe(3);
    });

    it('sets expected values and calls getTermsCount if onQuerySuccess returns no data', () => {
        component.options.dataField = new FieldMetaData('testTextField', 'Test Text Field');
        let response = {
            data: []
        };
        // Mock executeQuery to avoid actually sending HTTP requests; assume they succeed.
        // See document viewer tests for an explanation of why we're doing it this way.
        let calledExecuteQuery = false;
        component.executeQuery = () => {
            calledExecuteQuery = true;
        };

        component.executeQueryChain = () => undefined; // postInit calls executeQueryChain, but we don't care.
        component.postInit(); // To initialize the text cloud so it can update.
        component.onQuerySuccess(response);

        expect(component.activeData).toEqual([]);
        expect(component.termsCount).toBe(0);
        expect(calledExecuteQuery).toBeFalsy(); // Don't query for doc count if we got no data.

        component.options.sizeField = new FieldMetaData('testSizeField', 'Test Size Field');

        component.onQuerySuccess(response);

        expect(component.activeData).toEqual([]);
        expect(component.termsCount).toBe(0);
        expect(calledExecuteQuery).toBeFalsy();
    });

    it('sets expected values and calls getTermsCount if onQuerySuccess returns data', () => {
        component.options.dataField = new FieldMetaData('testTextField', 'Test Text Field');
        let response = {
            data: [{
                value: 8,
                testTextField: 'First',
                testSizeField: 100
            },
            {
                value: 5,
                testTextField: 'Second',
                testSizeField: 75
            },
            {
                value: 1,
                testTextField: 'Third',
                testSizeField: 50
            }]
        };
        let termsCountResponse = {
            data: [{
                _termsCount: 8,
                testTextField: 'a value'
            },
            {
                _termsCount: 5,
                testTextField: 'a second value'
            },
            {
                _termsCount: 1,
                testTextField: 'a third value'
            }]
        };
        // Mock executeQuery to avoid actually sending HTTP requests; assume they succeed.
        // See document viewer tests for an explanation of why we're doing it this way.
        let calledExecuteQuery = false;
        component.executeQuery = () => {
            calledExecuteQuery = true;
            component.onQuerySuccess(termsCountResponse);
        };
        // Mock createTextCloud to skip over its editing of activeData. That will be tested elsewhere.
        let calledCreateTextCloud = false;
        component.createTextCloud = () => {
            calledCreateTextCloud = true;
        };

        component.subNgOnInit();
        component.onQuerySuccess(response);

        expect(component.activeData).toEqual([{
            value: 8,
            testTextField: 'First',
            testSizeField: 100,
            key: 'First',
            keyTranslated: 'First'
        },
        {
            value: 5,
            testTextField: 'Second',
            testSizeField: 75,
            key: 'Second',
            keyTranslated: 'Second'
        },
        {
            value: 1,
            testTextField: 'Third',
            testSizeField: 50,
            key: 'Third',
            keyTranslated: 'Third'
        }]);
        expect(component.termsCount).toBe(3);
        expect(calledCreateTextCloud).toBeTruthy();
        expect(calledExecuteQuery).toBeTruthy();

        component.options.sizeField = new FieldMetaData('testSizeField', 'Test Size Field');
        calledCreateTextCloud = false;
        calledExecuteQuery = false;

        component.onQuerySuccess(response);

        expect(component.activeData).toEqual([{
            value: 100,
            testTextField: 'First',
            testSizeField: 100,
            key: 'First',
            keyTranslated: 'First'
        },
        {
            value: 75,
            testTextField: 'Second',
            testSizeField: 75,
            key: 'Second',
            keyTranslated: 'Second'
        },
        {
            value: 50,
            testTextField: 'Third',
            testSizeField: 50,
            key: 'Third',
            keyTranslated: 'Third'
        }]);
        expect(component.termsCount).toBe(3);
        expect(calledCreateTextCloud).toBeTruthy();
        expect(calledExecuteQuery).toBeTruthy();
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

    it('properly modifies the activeData in createTextCloud', () => {
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
        component.executeQueryChain = () => undefined; // postInit calls executeQueryChain, but we don't care.
        component.activeData = data;
        component.postInit();
        component.createTextCloud();
        expect(component.activeData[0].fontSize).toBeDefined();
        expect(component.activeData[0].color).toBeDefined();
        expect(component.activeData[1].fontSize).toBeDefined();
        expect(component.activeData[2].color).toBeDefined();
    });

    it('returns the proper value from getButtonText', () => {
        expect(component.getButtonText()).toEqual('0 Terms');
        component.activeData = [{
            testTextField: 'Value',
            value: 10
        }];
        expect(component.getButtonText()).toEqual('1 Term');
        component.activeData = [{
            testTextField: 'Value',
            value: 10
        }, {
            testTextField: 'Value',
            value: 100
        }];
        expect(component.getButtonText()).toEqual('2 Terms');
        component.termsCount = 5;
        component.options.limit = 2;
        expect(component.getButtonText()).toEqual('1 - 2 of 5 Terms');
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

    it('createClause does return expected object', () => {
        component.options.dataField = new FieldMetaData('testTextField');
        expect(component.createClause()).toEqual(neon.query.where('testTextField', '!=', null));

        component.options.unsharedFilterField = new FieldMetaData('testFilterField');
        component.options.unsharedFilterValue = 'testFilterValue';
        expect(component.createClause()).toEqual(neon.query.and.apply(neon.query, [
            neon.query.where('testTextField', '!=', null),
            neon.query.where('testFilterField', '=', 'testFilterValue')
        ]));
    });
});

describe('Component: Textcloud with config', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;

    initializeTestBed({
        declarations: [
            TextCloudComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            ConnectionService,
            DatasetService,
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'title', useValue: 'Textcloud with Config Title' },
            { provide: 'tableKey', useValue: 'table_key_1' },
            { provide: 'dataField', useValue: 'testTextField' },
            { provide: 'filter', useValue: null },
            { provide: 'unsharedFilterField', useValue: 'testUnsharedFilterField' },
            { provide: 'unsharedFilterValue', useValue: 'testUnsharedFilterValue' },
            { provide: 'sizeField', useValue: 'testSizeField' },
            { provide: 'aggregation', useValue: neonVariables.COUNT },
            { provide: 'limit', useValue: 25 }
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

    it('returns expected query from createQuery when an unshared filter is given', () => {
        component.options.database = new DatabaseMetaData('testDatabase1');
        component.options.table = new TableMetaData('testTable1');
        component.options.dataField = new FieldMetaData('testTextField');
        component.options.unsharedFilterField = new FieldMetaData('testUnsharedFilterField');
        component.options.unsharedFilterValue = 'testUnsharedFilterValue';

        let whereClause = neon.query.and.apply(neon.query, [
            neon.query.where('testTextField', '!=', null),
            neon.query.where('testUnsharedFilterField', '=', 'testUnsharedFilterValue')
        ]);
        let query = new neon.query.Query().selectFrom('testDatabase1', 'testTable1')
            .where(whereClause)
            .groupBy('testTextField')
            .aggregate(neonVariables.COUNT, '*', 'value')
            .sortBy('value', neonVariables.DESCENDING)
            .limit(25);

        expect(component.createQuery()).toEqual(query);
    });
});

describe('Component: Textcloud with config including filter', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;

    initializeTestBed({
        declarations: [
            TextCloudComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            ConnectionService,
            DatasetService,
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'title', useValue: 'Textcloud with Config Title' },
            { provide: 'tableKey', useValue: 'table_key_1' },
            { provide: 'dataField', useValue: 'testTextField' },
            { provide: 'filter', useValue: {
                use: true,
                lhs: 'testConfigFilterField',
                operator: '=',
                rhs: 'testConfigFilterValue'
            }
            },
            { provide: 'unsharedFilterField', useValue: 'testUnsharedFilterField' },
            { provide: 'unsharedFilterValue', useValue: 'testUnsharedFilterValue' },
            { provide: 'sizeField', useValue: 'testSizeField' },
            { provide: 'aggregation', useValue: neonVariables.COUNT },
            { provide: 'limit', useValue: 25 }
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

    it('returns expected query from createQuery when a config filter is given', () => {
        component.options.database = new DatabaseMetaData('testDatabase1');
        component.options.table = new TableMetaData('testTable1');
        component.options.dataField = new FieldMetaData('testTextField');

        let whereClause = neon.query.and.apply(neon.query, [
            neon.query.where('testTextField', '!=', null),
            neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue')
        ]);
        let query = new neon.query.Query().selectFrom('testDatabase1', 'testTable1')
            .where(whereClause)
            .groupBy('testTextField')
            .aggregate(neonVariables.COUNT, '*', 'value')
            .sortBy('value', neonVariables.DESCENDING)
            .limit(25);

        expect(component.createQuery()).toEqual(query);
    });

    it('createClause does return expected object', () => {
        component.options.dataField = new FieldMetaData('testTextField');
        expect(component.createClause()).toEqual(neon.query.and.apply(neon.query, [
            neon.query.where('testTextField', '!=', null),
            neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue')
        ]));

        component.options.unsharedFilterField = new FieldMetaData('testFilterField');
        component.options.unsharedFilterValue = 'testFilterValue';
        expect(component.createClause()).toEqual(neon.query.and.apply(neon.query, [
            neon.query.where('testTextField', '!=', null),
            neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue'),
            neon.query.where('testFilterField', '=', 'testFilterValue')
        ]));
    });
});
