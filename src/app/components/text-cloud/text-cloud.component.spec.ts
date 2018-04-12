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
import { ActiveGridService } from '../../services/active-grid.service';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationService } from '../../services/visualization.service';
import { neonVariables } from '../../neon-namespaces';

import * as neon from 'neon-framework';
import { ChartComponent } from '../chart/chart.component';

class TestDatasetService extends DatasetService {
    constructor() {
        super(new NeonGTDConfig());
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.name = 'testName';
        testDatabase.tables = [
            new TableMetaData('testTable', 'Test Table', [
                new FieldMetaData('testDataField', 'Test Data Field'),
                new FieldMetaData('testSizeField', 'Test Size Field')
            ])
        ];
        this.setActiveDataset({
            databases: [testDatabase]
        });
    }
}

describe('Component: TextCloud', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChartComponent,
                TextCloudComponent,
                ExportControlComponent,
                UnsharedFilterComponent,
                ChartComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                {
                    provide: DatasetService,
                    useClass: TestDatasetService
                },
                FilterService,
                ExportService,
                TranslationService,
                VisualizationService,
                ErrorNotificationService,
                ThemesService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() }
            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(TextCloudComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', () => {
        expect(component).toBeTruthy();
    });

    it('has expected options properties', () => {
        expect(component.options.aggregation).toBe('AVG');
        expect(component.options.andFilters).toBe(true);
        expect(component.options.dataField).toEqual(component.emptyField);
        expect(component.options.sizeField).toEqual(component.emptyField);
    });

    it('has expected class properties', () => {
        expect(component.activeData).toEqual([]);
        expect(component.termsCount).toBe(0);
        expect(component.textColor).toBe('#ffffff');
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

    it('has subGetBindings function that updates the input bindings with specific config options', () => {
        component.options.dataField = new FieldMetaData('testDataField');
        component.options.sizeField = new FieldMetaData('testSizeField');
        component.options.aggregation = 'SUM';
        let bindings = {
            dataField: undefined,
            sizeField: undefined,
            sizeAggregation: undefined
        };
        component.subGetBindings(bindings);
        expect(bindings.dataField).toEqual('testDataField');
        expect(bindings.sizeField).toEqual('testSizeField');
        expect(bindings.sizeAggregation).toEqual('SUM');
    });

    it('returns the correct value from getExportFields', () => {
        component.options.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        component.options.sizeField = new FieldMetaData('testSizeField');

        expect(component.getExportFields()).toEqual([{
            columnName: 'testDataField',
            prettyName: 'Test Data Field'
        }, {
            columnName: 'value',
            prettyName: 'Count'
        }]);

        component.options.sizeField.prettyName = 'Test Size Field';

        expect(component.getExportFields()).toEqual([{
            columnName: 'testDataField',
            prettyName: 'Test Data Field'
        }, {
            columnName: 'value',
            prettyName: 'Test Size Field'
        }]);
    });

    it('addLocalFilter does add the given filter', () => {
        component.addLocalFilter({
            id: '1234567890',
            field: 'testDataField1',
            value: 'Test Value 1',
            prettyField: 'Test Data Field 1'
        });
        expect(component.getCloseableFilters()).toEqual([{
            id: '1234567890',
            field: 'testDataField1',
            value: 'Test Value 1',
            prettyField: 'Test Data Field 1'
        }]);

        component.addLocalFilter({
            id: '9876543210',
            field: 'testDataField2',
            value: 'Test Value 2',
            prettyField: 'Test Data Field 2'
        });
        expect(component.getCloseableFilters()).toEqual([{
            id: '1234567890',
            field: 'testDataField1',
            value: 'Test Value 1',
            prettyField: 'Test Data Field 1'
        }, {
            id: '9876543210',
            field: 'testDataField2',
            value: 'Test Value 2',
            prettyField: 'Test Data Field 2'
        }]);
    });

    it('addLocalFilter does replace the existing filter if the given filter has the same ID', () => {
        component.addLocalFilter({
            id: '1234567890',
            field: 'testDataField1',
            value: 'Test Value 1',
            prettyField: 'Test Data Field 1'
        });
        expect(component.getCloseableFilters()).toEqual([{
            id: '1234567890',
            field: 'testDataField1',
            value: 'Test Value 1',
            prettyField: 'Test Data Field 1'
        }]);

        component.addLocalFilter({
            id: '1234567890',
            field: 'testDataField2',
            value: 'Test Value 2',
            prettyField: 'Test Data Field 2'
        });
        expect(component.getCloseableFilters()).toEqual([{
            id: '1234567890',
            field: 'testDataField2',
            value: 'Test Value 2',
            prettyField: 'Test Data Field 2'
        }]);
    });

    it('returns the expected value from getVisualizationName', () => {
        expect(component.getVisualizationName()).toEqual('Text Cloud');
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
            field: 'testDataField',
            value: 'Value',
            prettyField: 'Test Data Field'
        })).toEqual('Test Data Field = Value');
    });

    it('getFilterDetail does return expected string', () => {
        expect(component.getFilterDetail({
            id: `1234567890`,
            field: 'testDataField',
            value: 'Value',
            prettyField: 'Test Data Field'
        })).toEqual('');

        expect(component.getFilterDetail({
            id: `1234567890`,
            translated: 'Translated Value',
            field: 'testDataField',
            value: 'Value',
            prettyField: 'Test Data Field'
        })).toEqual(' (Translated Value)');
    });

    it('has an isValidQuery method that properly checks whether or not a valid query can be made', () => {
        expect(component.isValidQuery()).toBeFalsy();
        component.options.database = new DatabaseMetaData('testDatabase');
        expect(component.isValidQuery()).toBeFalsy();
        component.options.table = new TableMetaData('testTable');
        expect(component.isValidQuery()).toBeFalsy();
        component.options.dataField = new FieldMetaData('testDataField');
        expect(component.isValidQuery()).toBeTruthy();
    });

    it('returns expected query from createQuery', () => {
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.table = new TableMetaData('testTable');
        component.options.dataField = new FieldMetaData('testDataField');

        let whereClause = neon.query.where('testDataField', '!=', null);
        let query = new neon.query.Query().selectFrom('testDatabase', 'testTable')
            .where(whereClause)
            .groupBy('testDataField')
            .aggregate(neonVariables.COUNT, '*', 'value')
            .sortBy('value', neonVariables.DESCENDING)
            .limit(40);

        expect(component.createQuery()).toEqual(query);

        component.options.sizeField = new FieldMetaData('testSizeField');
        component.options.limit = 25;
        let whereClauses = neon.query.and(whereClause, neon.query.where('testSizeField', '!=', null));

        query = new neon.query.Query().selectFrom('testDatabase', 'testTable')
            .where(whereClauses)
            .groupBy('testDataField')
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
                testDataField: 'getTermsCount works differently in the text cloud than in other places'
            },
            {
                _termsCount: 5,
                testDataField: 'it doesn\'t operate on raw documents, and so can\'t somply give a nice count'
            },
            {
                _termsCount: 1,
                testDataField: 'instead, it returns a list of all values and counts them'
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
        component.options.dataField = new FieldMetaData('testDataField', 'Test Data Field');
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
        component.options.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        let response = {
            data: [{
                value: 8,
                testDataField: 'First',
                testSizeField: 100
            },
            {
                value: 5,
                testDataField: 'Second',
                testSizeField: 75
            },
            {
                value: 1,
                testDataField: 'Third',
                testSizeField: 50
            }]
        };
        let termsCountResponse = {
            data: [{
                _termsCount: 8,
                testDataField: 'a value'
            },
            {
                _termsCount: 5,
                testDataField: 'a second value'
            },
            {
                _termsCount: 1,
                testDataField: 'a third value'
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
            testDataField: 'First',
            testSizeField: 100,
            key: 'First',
            keyTranslated: 'First'
        },
        {
            value: 5,
            testDataField: 'Second',
            testSizeField: 75,
            key: 'Second',
            keyTranslated: 'Second'
        },
        {
            value: 1,
            testDataField: 'Third',
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
            testDataField: 'First',
            testSizeField: 100,
            key: 'First',
            keyTranslated: 'First'
        },
        {
            value: 75,
            testDataField: 'Second',
            testSizeField: 75,
            key: 'Second',
            keyTranslated: 'Second'
        },
        {
            value: 50,
            testDataField: 'Third',
            testSizeField: 50,
            key: 'Third',
            keyTranslated: 'Third'
        }]);
        expect(component.termsCount).toBe(3);
        expect(calledCreateTextCloud).toBeTruthy();
        expect(calledExecuteQuery).toBeTruthy();
    });

    it('properly sets up filters in setupFilters', () => {
        component.options.database.name = 'testDatabase';
        component.options.table.name = 'testTable';
        component.options.dataField = new FieldMetaData('testDataField');
        component.setupFilters();
        expect(component.isFilterSet()).toBeFalsy();

        let filterService = fixture.componentRef.injector.get(FilterService);
        filterService.getFiltersForFields = (database, table, fields): any[] => {
            return [{
                id: '1234567890',
                ownerId: '12345',
                database: 'testDatabase',
                table: 'testTable',
                filter: {
                    filterName: '',
                    databaseName: 'testDatabase',
                    tableName: 'testTable',
                    whereClause: {
                        type: 'where',
                        lhs: 'testDataField',
                        operator: '=',
                        rhs: 'Value'
                    }
                }
            }];
        };

        component.setupFilters();
        expect(component.isFilterSet()).toBeTruthy();
    });

    it('has an isFilterSet method that properly checks for local filters', () => {
        let filter1 = {
            id: '1q2w-3e4r-5t6y-7u8i',
            field: 'testDataField',
            value: 'testValue',
            translated: '',
            prettyField: 'testDataField'
        };
        let filter2 = {
            id: '0p9o-8i7u-6y5t-4r3e',
            field: 'testDataField',
            value: 'testValueTheSecond',
            translated: '',
            prettyField: 'testDataField'
        };
        expect(component.isFilterSet()).toBeFalsy();
        component.addLocalFilter(filter1);
        expect(component.isFilterSet()).toBeTruthy();
        component.addLocalFilter(filter2);
        expect(component.isFilterSet()).toBeTruthy();
        component.removeFilter(filter1);
        expect(component.isFilterSet()).toBeTruthy();
        component.removeFilter(filter2);
        expect(component.isFilterSet()).toBeFalsy();
    });

    it('has an onClick method that properly sets local and remote filters', () => {
        component.options.database.name = 'testDatabase';
        component.options.table.name = 'testTable';
        component.options.dataField = new FieldMetaData('testDataField', 'testDataField');
        let filterService = fixture.componentRef.injector.get(FilterService);
        let serviceAddFilterHasBeenCalled = false;
        filterService.addFilter = () => {
            serviceAddFilterHasBeenCalled = true;
        };

        expect(filterService.getFilters().length).toBe(0);
        expect(component.isFilterSet()).toBeFalsy();

        component.onClick({
            key: 'testValue'
        });

        expect(serviceAddFilterHasBeenCalled).toBeTruthy();
        expect(component.isFilterSet()).toBeTruthy();
        expect(component.getCloseableFilters()[0]).toEqual({
            id: undefined,
            field: 'testDataField',
            value: 'testValue',
            prettyField: 'testDataField'
        });
    });

    it('has a filterIsUnique method that properly checks the uniqueness of filters to add', () => {
        let filter1 = {
            id: '12345',
            field: 'testDataField',
            value: 'Value 1',
            prettyField: 'testDataField'
        };
        let filter2 = {
            id: '67890',
            field: 'testDataField',
            value: 'Value 1',
            prettyField: 'testDataField'
        };
        expect(component.filterIsUnique(filter2)).toBeTruthy();
        component.addLocalFilter(filter1);
        expect(component.filterIsUnique(filter2)).toBeFalsy();
        filter2.field = 'testOtherField';
        expect(component.filterIsUnique(filter2)).toBeTruthy();
        filter2.field = 'testDataField';
        filter2.value = 'Value 2';
        expect(component.filterIsUnique(filter2)).toBeTruthy();
    });

    it('properly modifies the activeData in createTextCloud', () => {
        let data = [{
            testDataField: 'Value 1',
            value: 20
        },
        {
            testDataField: 'Value 2',
            value: 10
        },
        {
            testDataField: 'Value 3',
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
        expect(component.getButtonText()).toEqual('No Data');
        component.activeData = [{
            testDataField: 'Value',
            value: 10
        }];
        component.termsCount = 1;
        expect(component.getButtonText()).toEqual('Total 1');
        component.termsCount = 5;
        expect(component.getButtonText()).toEqual('1 of 5');
    });

    it('properly returns the list of filters from getCloseableFilters', () => {
        let filter1 = {
            id: '12345',
            field: 'testDataField',
            value: 'Value 1',
            prettyField: 'testDataField'
        };
        let filter2 = {
            id: '67890',
            field: 'testDataField',
            value: 'Value 1',
            prettyField: 'testDataField'
        };

        expect(component.getCloseableFilters()).toEqual([]);
        component.addLocalFilter(filter1);
        expect(component.getCloseableFilters()).toEqual([filter1]);
        component.addLocalFilter(filter2);
        expect(component.getCloseableFilters()).toEqual([filter1, filter2]);
        component.removeFilter(filter1);
        expect(component.getCloseableFilters()).toEqual([filter2]);
        component.addLocalFilter(filter1);
        expect(component.getCloseableFilters()).toEqual([filter2, filter1]);
        component.removeFilter(filter1);
        component.removeFilter(filter2);
        expect(component.getCloseableFilters()).toEqual([]);
    });

    it('properly removes filters in removeFilter', () => {
        let filter1 = {
            id: '12345',
            field: 'testDataField',
            value: 'Value 1',
            prettyField: 'testDataField'
        };
        let filter2 = {
            id: '67890',
            field: 'testDataField',
            value: 'Value 1',
            prettyField: 'testDataField'
        };

        expect(component.getCloseableFilters()).toEqual([]);
        component.addLocalFilter(filter1);
        expect(component.getCloseableFilters()).toEqual([filter1]);
        component.addLocalFilter(filter2);
        expect(component.getCloseableFilters()).toEqual([filter1, filter2]);
        component.removeFilter(filter1);
        expect(component.getCloseableFilters()).toEqual([filter2]);
        component.addLocalFilter(filter1);
        expect(component.getCloseableFilters()).toEqual([filter2, filter1]);
        component.removeFilter(filter1);
        component.removeFilter(filter2);
        expect(component.getCloseableFilters()).toEqual([]);
    });

    it('has a requestExport method that does nothing', () => {
        expect(component.requestExport).toBeDefined();
    });

    it('createClause does return expected object', () => {
        component.options.dataField = new FieldMetaData('testDataField');
        expect(component.createClause()).toEqual(neon.query.where('testDataField', '!=', null));

        component.options.unsharedFilterField = new FieldMetaData('testFilterField');
        component.options.unsharedFilterValue = 'testFilterValue';
        expect(component.createClause()).toEqual(neon.query.and.apply(neon.query, [
            neon.query.where('testDataField', '!=', null),
            neon.query.where('testFilterField', '=', 'testFilterValue')
        ]));
    });
});

describe('Component: Textcloud with config', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChartComponent,
                TextCloudComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                FilterService,
                ExportService,
                TranslationService,
                VisualizationService,
                ErrorNotificationService,
                ThemesService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                { provide: 'title', useValue: 'Textcloud with Config Title' },
                { provide: 'database', useValue: 'testDatabase' },
                { provide: 'table', useValue: 'testTable' },
                { provide: 'dataField', useValue: 'testDataField' },
                { provide: 'configFilter', useValue: null },
                { provide: 'unsharedFilterField', useValue: 'testUnsharedFilterField' },
                { provide: 'unsharedFilterValue', useValue: 'testUnsharedFilterValue' },
                { provide: 'sizeField', useValue: 'testSizeField' },
                { provide: 'sizeAggregation', useValue: 'COUNT' },
                { provide: 'limit', useValue: 25 }
            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(TextCloudComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('returns expected query from createQuery when an unshared filter is given', () => {
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.table = new TableMetaData('testTable');
        component.options.dataField = new FieldMetaData('testDataField');
        component.options.unsharedFilterField = new FieldMetaData('testUnsharedFilterField');
        component.options.unsharedFilterValue = 'testUnsharedFilterValue';

        let whereClause = neon.query.and.apply(neon.query, [
            neon.query.where('testDataField', '!=', null),
            neon.query.where('testUnsharedFilterField', '=', 'testUnsharedFilterValue')
        ]);
        let query = new neon.query.Query().selectFrom('testDatabase', 'testTable')
            .where(whereClause)
            .groupBy('testDataField')
            .aggregate(neonVariables.COUNT, '*', 'value')
            .sortBy('value', neonVariables.DESCENDING)
            .limit(25);

        expect(component.createQuery()).toEqual(query);
    });
});

describe('Component: Textcloud with config including configFilter', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChartComponent,
                TextCloudComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                FilterService,
                ExportService,
                TranslationService,
                VisualizationService,
                ErrorNotificationService,
                ThemesService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                { provide: 'title', useValue: 'Textcloud with Config Title' },
                { provide: 'database', useValue: 'testDatabase' },
                { provide: 'table', useValue: 'testTable' },
                { provide: 'dataField', useValue: 'testDataField' },
                { provide: 'configFilter', useValue: {
                        use: true,
                        lhs: 'testConfigFilterField',
                        operator: '=',
                        rhs: 'testConfigFilterValue'
                    }
                },
                { provide: 'unsharedFilterField', useValue: 'testUnsharedFilterField' },
                { provide: 'unsharedFilterValue', useValue: 'testUnsharedFilterValue' },
                { provide: 'sizeField', useValue: 'testSizeField' },
                { provide: 'sizeAggregation', useValue: 'COUNT' },
                { provide: 'limit', useValue: 25 }
            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(TextCloudComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('returns expected query from createQuery when a config filter is given', () => {
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.table = new TableMetaData('testTable');
        component.options.dataField = new FieldMetaData('testDataField');

        let whereClause = neon.query.and.apply(neon.query, [
            neon.query.where('testDataField', '!=', null),
            neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue')
        ]);
        let query = new neon.query.Query().selectFrom('testDatabase', 'testTable')
            .where(whereClause)
            .groupBy('testDataField')
            .aggregate(neonVariables.COUNT, '*', 'value')
            .sortBy('value', neonVariables.DESCENDING)
            .limit(25);

        expect(component.createQuery()).toEqual(query);
    });

    it('createClause does return expected object', () => {
        component.options.dataField = new FieldMetaData('testDataField');
        expect(component.createClause()).toEqual(neon.query.and.apply(neon.query, [
            neon.query.where('testDataField', '!=', null),
            neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue')
        ]));

        component.options.unsharedFilterField = new FieldMetaData('testFilterField');
        component.options.unsharedFilterValue = 'testFilterValue';
        expect(component.createClause()).toEqual(neon.query.and.apply(neon.query, [
            neon.query.where('testDataField', '!=', null),
            neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue'),
            neon.query.where('testFilterField', '=', 'testFilterValue')
        ]));
    });
});
