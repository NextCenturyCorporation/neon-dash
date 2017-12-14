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

import { ChartModule } from 'angular2-chartjs';

import { TextCloudComponent } from './text-cloud.component';
import { ExportControlComponent } from '../export-control/export-control.component';
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
import { neonMappings, neonVariables } from '../../neon-namespaces';

import * as neon from 'neon-framework';

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
        testDatabase.tables[0].mappings = {
            tags: 'testDataAndSizeField'
        };
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
                TextCloudComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
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
                ChartModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(TextCloudComponent);
        component = fixture.componentInstance;
    });

    it('exists', () => {
        expect(component).toBeTruthy();
    });

    it('has expected active properties', () => {
        expect(component.active).toEqual({
            dataField: new FieldMetaData(),
            sizeField: new FieldMetaData(),
            andFilters: true,
            limit: 40,
            textColor: '#111',
            allowsTranslations: true,
            filterable: true,
            data: [],
            count: 0
        });
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
        component.active.dataField.columnName = 'testDataField';
        component.active.sizeField.columnName = 'testSizeField';
        let bindings = {
            dataField: undefined,
            sizeField: undefined,
            sizeAggregation: undefined,
            limit: undefined
        };
        component.subGetBindings(bindings);
        expect(bindings.dataField).toEqual('testDataField');
        expect(bindings.sizeField).toEqual('testSizeField');
        expect(bindings.sizeAggregation).toEqual('AVG'); // Default value on creation.
        expect(bindings.limit).toEqual(40); // Default value on creation.
    });

    it('returns the correct value from getExportFields', () => {
        component.active.dataField.columnName = 'testDataField';
        component.active.dataField.prettyName = 'Test Data Field';
        component.active.sizeField.columnName = 'testSizeField';

        expect(component.getExportFields()).toEqual([{
            columnName: 'testDataField',
            prettyName: 'Test Data Field'
        }, {
            columnName: 'value',
            prettyName: 'Count'
        }]);

        component.active.sizeField.prettyName = 'Test Size Field';

        expect(component.getExportFields()).toEqual([{
            columnName: 'testDataField',
            prettyName: 'Test Data Field'
        }, {
            columnName: 'value',
            prettyName: 'Test Size Field'
        }]);
    });

    it('returns the correct values from getOptionFromConfig', () => {
        expect(component.getOptionFromConfig('title')).toBeNull();
        expect(component.getOptionFromConfig('database')).toBeNull();
        expect(component.getOptionFromConfig('table')).toBeNull();
        expect(component.getOptionFromConfig('dataField')).toBeNull();
        expect(component.getOptionFromConfig('configFilter')).toBeNull();
        expect(component.getOptionFromConfig('unsharedFilterField')).toBeNull();
        expect(component.getOptionFromConfig('unsharedFilterValue')).toBeNull();
        expect(component.getOptionFromConfig('sizeField')).toBeNull();
        expect(component.getOptionFromConfig('sizeAggregation')).toEqual('AVG');
        expect(component.getOptionFromConfig('limit')).toBe(40);
        expect(component.getOptionFromConfig('nonexistentOption')).toBeUndefined();
    });

    it('properly updates objects in updateObject', () => {
        let startingObject = component.updateObject({}, 'value', 'a value');
        startingObject = component.updateObject(startingObject, 'newField', 'new field value');
        startingObject = component.updateObject(startingObject, 'value', 'new value');
        expect(startingObject).toEqual({
            value: 'new value',
            newField: 'new field value'
        });
    });

    it('properly updates arrays in updateArray', () => {
        let startingArray = component.updateArray([], 'first');
        startingArray = component.updateArray(startingArray, 'second');
        expect(startingArray).toEqual(['first', 'second']);
    });

    it('sets expected fields in onUpdateFields to the correct values', () => {
        component.meta.database = new DatabaseMetaData('testDatabase', 'Test Database');
        component.meta.database.name = 'testName';
        component.meta.table = new TableMetaData('testTable', 'Test Table');

        component.onUpdateFields();
        expect(component.active.dataField).toEqual({
            columnName: '',
            prettyName: '',
            hide: false
        });
        expect(component.active.sizeField).toEqual({
            columnName: '',
            prettyName: '',
            hide: false
        });

        component.meta.fields = [
            new FieldMetaData('testDataField'),
            new FieldMetaData('testSizeField'),
            new FieldMetaData('testDataAndSizeField') // Because dataField and sizeField both default to TAGS
        ];

        component.onUpdateFields();
        expect(component.active.dataField).toEqual(new FieldMetaData('testDataAndSizeField'));
        expect(component.active.sizeField).toEqual(new FieldMetaData('testDataAndSizeField'));
    });

    it('properly adds a local filter in addLocalFilter', () => {
        component.addLocalFilter({
            id: '1234567890',
            key: 'testDataField',
            value: 'Test Value',
            prettyKey: 'Test Data Field'
        });
        expect(component.getFilterData().length).toBe(1);
        expect(component.getFilterData()[0].id).toEqual('1234567890');
        component.addLocalFilter({
            id: '6789012345',
            key: 'testDataField',
            value: 'Test Value the Second',
            prettyKey: 'Test Data Field'
        });
        expect(component.getFilterData().length).toBe(2);
        expect(component.getFilterData()[0].id).toEqual('1234567890');
        expect(component.getFilterData()[1].id).toEqual('6789012345');
        component.addLocalFilter({
            id: '1234567890',
            key: 'testDataField',
            value: 'Test Value Again',
            prettyKey: 'Test Data Field'
        });
        expect(component.getFilterData().length).toBe(2);
        expect(component.getFilterData()[0].id).toEqual('1234567890');
        expect(component.getFilterData()[1].id).toEqual('6789012345');
    });

    it('creates the correct filter clause in createNeonFilterClauseEquals', () => {
        // This is a nonsensical situation (local filters are added before Neon filters) but test it anyway.
        expect(component.createNeonFilterClauseEquals('testDatabase', 'testTable', 'testDataField'))
            .toEqual(neon.query.and.apply([]));

        component.addLocalFilter({
            id: '1234567890',
            key: 'testDataField',
            value: 'Test Value',
            prettyKey: 'Test Data Field'
        });
        expect(component.createNeonFilterClauseEquals('testDatabase', 'testTable', 'testDataField'))
            .toEqual(new neon.query.WhereClause('testDataField', '=', 'Test Value'));

        component.addLocalFilter({
            id: '6789012345',
            key: 'testDataField',
            value: 'Test Value the Second',
            prettyKey: 'Test Data Field'
        });
        expect(component.createNeonFilterClauseEquals('testDatabase', 'testTable', 'testDataField'))
            .toEqual(neon.query.and.apply(neon.query, [new neon.query.WhereClause('testDataField', '=', 'Test Value'),
                                          new neon.query.WhereClause('testDataField', '=', 'Test Value the Second')]));

        component.active.andFilters = false;
        expect(component.createNeonFilterClauseEquals('testDatabase', 'testTable', 'testDataField'))
        .toEqual(neon.query.or.apply(neon.query, [new neon.query.WhereClause('testDataField', '=', 'Test Value'),
                                      new neon.query.WhereClause('testDataField', '=', 'Test Value the Second')]));
    });

    it('returns the expected values from getNeonFilterFields', () => {
        component.active.dataField.columnName = 'testDataField';
        component.active.sizeField.columnName = 'testSizeField';
        expect(component.getNeonFilterFields()).toEqual(['testDataField']);
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

    it('has a getFilterText method that returns the value of a filter passed to it', () => {
        let filter = {
            id: `1234567890`,
            key: 'testDataField',
            value: 'Value',
            prettyKey: 'Test Data Field'
        };
        expect(component.getFilterText(filter)).toEqual('Value');
    });

    it('has an isValidQuery method that properly checks whether or not a valid query can be made', () => {
        expect(component.isValidQuery()).toBeFalsy();
        component.meta.database = new DatabaseMetaData('testDatabase');
        expect(component.isValidQuery()).toBeFalsy();
        component.meta.table = new TableMetaData('testTable');
        expect(component.isValidQuery()).toBeFalsy();
        component.active.dataField.columnName = 'testDataField';
        expect(component.isValidQuery()).toBeTruthy();
    });

    it('returns expected query from createQuery', () => {
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        component.active.dataField.columnName = 'testDataField';

        let whereClause = neon.query.where('testDataField', '!=', null);
        let query = new neon.query.Query().selectFrom('testDatabase', 'testTable')
            .where(whereClause)
            .groupBy('testDataField')
            .aggregate(neonVariables.COUNT, '*', 'value')
            .sortBy('value', neonVariables.DESCENDING)
            .limit(40);

        expect(component.createQuery()).toEqual(query);

        component.active.sizeField.columnName = 'testSizeField';
        component.active.limit = 25;
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

    it('sets the expected values when getDocCount is called', () => {
        component.active.count = 40;
        let docCountResponse = {
            data: [{
                _docCount: 8,
                testDataField: 'getDocCount works differently in the text cloud than in other places'
            },
            {
                _docCount: 5,
                testDataField: 'it doesn\'t operate on raw documents, and so can\'t somply give a nice count'
            },
            {
                _docCount: 1,
                testDataField: 'instead, it returns a list of all values and counts them'
            }]
        };
        let calledExecuteQuery = false;
        component.executeQuery = () => {
            calledExecuteQuery = true;
            component.onQuerySuccess(docCountResponse);
        };

        component.getDocCount();

        expect(calledExecuteQuery).toBeTruthy();
        expect(component.active.count).toBe(3);
    });

    it('sets expected values and calls getDocCount if onQuerySuccess returns no data', () => {
        component.active.dataField.columnName = 'testDataField';
        component.active.dataField.prettyName = 'Test Data Field';
        let response = {
            data: []
        };
        // Mock executeQuery to avoid actually sending HTTP requests; assume they succeed.
        // See document viewer tests for an explanation of why we're doing it this way.
        let calledExecuteQuery = false;
        component.executeQuery = () => {
            calledExecuteQuery = true;
        };

        component.subNgOnInit(); // To initialize the text cloud so it can update.
        component.onQuerySuccess(response);

        expect(component.active.data).toEqual([]);
        expect(component.active.count).toBe(0);
        expect(component.createTitle()).toEqual('Text Cloud by Test Data Field');
        expect(calledExecuteQuery).toBeFalsy(); // Don't query for doc count if we got no data.

        component.active.sizeField.columnName = 'testSizeField';
        component.active.sizeField.prettyName = 'Test Size Field';

        component.onQuerySuccess(response);

        expect(component.active.data).toEqual([]);
        expect(component.active.count).toBe(0);
        expect(component.createTitle()).toEqual('Text Cloud by Test Data Field and Test Size Field');
        expect(calledExecuteQuery).toBeFalsy();
    });

    it('sets expected values and calls getDocCount if onQuerySuccess returns data', () => {
        component.active.dataField.columnName = 'testDataField';
        component.active.dataField.prettyName = 'Test Data Field';
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
        let docCountResponse = {
            data: [{
                _docCount: 8,
                testDataField: 'a value'
            },
            {
                _docCount: 5,
                testDataField: 'a second value'
            },
            {
                _docCount: 1,
                testDataField: 'a third value'
            }]
        };
        // Mock executeQuery to avoid actually sending HTTP requests; assume they succeed.
        // See document viewer tests for an explanation of why we're doing it this way.
        let calledExecuteQuery = false;
        component.executeQuery = () => {
            calledExecuteQuery = true;
            component.onQuerySuccess(docCountResponse);
        };
        // Mock createTextCloud to skip over its editing of active.data. That will be tested elsewhere.
        let calledCreateTextCloud = false;
        component.createTextCloud = () => {
            calledCreateTextCloud = true;
        };

        component.subNgOnInit();
        component.onQuerySuccess(response);

        expect(component.active.data).toEqual([{
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
        expect(component.active.count).toBe(3);
        expect(component.createTitle()).toEqual('Text Cloud by Test Data Field');
        expect(calledCreateTextCloud).toBeTruthy();
        expect(calledExecuteQuery).toBeTruthy();

        component.active.sizeField.columnName = 'testSizeField';
        component.active.sizeField.prettyName = 'Test Size Field';
        calledCreateTextCloud = false;
        calledExecuteQuery = false;

        component.onQuerySuccess(response);

        expect(component.active.data).toEqual([{
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
        expect(component.active.count).toBe(3);
        expect(component.createTitle()).toEqual('Text Cloud by Test Data Field and Test Size Field');
        expect(calledCreateTextCloud).toBeTruthy();
        expect(calledExecuteQuery).toBeTruthy();
    });

    it('properly sets up filters in setupFilters', () => {
        component.meta.database.name = 'testDatabase';
        component.meta.table.name = 'testTable';
        component.active.dataField.columnName = 'testDataField';
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
        expect(component.isFilterSet()).toBeFalsy();
        component.addLocalFilter({
            id: '1q2w-3e4r-5t6y-7u8i',
            key: 'testDataField',
            value: 'testValue',
            translated: '',
            prettyKey: 'testDataField'
        });
        expect(component.isFilterSet()).toBeTruthy();
        component.addLocalFilter({
            id: '0p9o-8i7u-6y5t-4r3e',
            key: 'testDataField',
            value: 'testValueTheSecond',
            translated: '',
            prettyKey: 'testDataField'
        });
        expect(component.isFilterSet()).toBeTruthy();
        component.removeFilter('1q2w-3e4r-5t6y-7u8i');
        expect(component.isFilterSet()).toBeTruthy();
        component.removeFilter('0p9o-8i7u-6y5t-4r3e');
        expect(component.isFilterSet()).toBeFalsy();
    });

    it('has an onClick method that properly sets local and remote filters', () => {
        component.meta.database.name = 'testDatabase';
        component.meta.table.name = 'testTable';
        component.active.dataField.columnName = 'testDataField';
        component.active.dataField.prettyName = 'testDataField';
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
        expect(component.getFilterData()[0]).toEqual({
            id: undefined,
            key: 'testDataField',
            value: 'testValue',
            prettyKey: 'testDataField'
        });
    });

    it('has a filterIsUnique method that properly checks the uniqueness of filters to add', () => {
        let filter1 = {
            id: '12345',
            key: 'testDataField',
            value: 'Value 1',
            prettyKey: 'testDataField'
        };
        let filter2 = {
            id: '67890',
            key: 'testDataField',
            value: 'Value 1',
            prettyKey: 'testDataField'
        };
        expect(component.filterIsUnique(filter2)).toBeTruthy();
        component.addLocalFilter(filter1);
        expect(component.filterIsUnique(filter2)).toBeFalsy();
        filter2.key = 'testOtherField';
        expect(component.filterIsUnique(filter2)).toBeTruthy();
        filter2.key = 'testDataField';
        filter2.value = 'Value 2';
        expect(component.filterIsUnique(filter2)).toBeTruthy();
    });

    it('properly modifies the active data in createTextCloud', () => {
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
        component.active.data = data;
        component.subNgOnInit();
        component.createTextCloud();
        expect(component.active.data[0].fontSize).toBeDefined();
        expect(component.active.data[0].color).toBeDefined();
        expect(component.active.data[1].fontSize).toBeDefined();
        expect(component.active.data[2].color).toBeDefined();
    });

    it('calls logChangeAndStartQueryChain in handleChangeDataField', () => {
        let logChangeAndStartQueryChainWasCalled = false;
        component.logChangeAndStartQueryChain = () => {
            logChangeAndStartQueryChainWasCalled = true;
        };

        component.handleChangeDataField();
        expect(logChangeAndStartQueryChainWasCalled).toBeTruthy();
    });

    it('ensures the limit is not zero and calls logChangeAndStartQueryChain in handleChangeLimit', () => {
        let logChangeAndStartQueryChainWasCalled = false;
        component.logChangeAndStartQueryChain = () => {
            logChangeAndStartQueryChainWasCalled = true;
        };

        component.handleChangeLimit();
        expect(component.active.limit).toBe(40);
        expect(logChangeAndStartQueryChainWasCalled).toBeTruthy();

        component.active.limit = 0;
        logChangeAndStartQueryChainWasCalled = false;
        component.handleChangeLimit();
        expect(component.active.limit).toBe(1);
        expect(logChangeAndStartQueryChainWasCalled).toBeTruthy();
    });

    it('calls logChangeAndStartQueryChain in handleChangeAndFilters', () => {
        let logChangeAndStartQueryChainWasCalled = false;
        component.logChangeAndStartQueryChain = () => {
            logChangeAndStartQueryChainWasCalled = true;
        };

        component.handleChangeAndFilters();
        expect(logChangeAndStartQueryChainWasCalled).toBeTruthy();
    });

    it('calls logChangeAndStartQueryChain in handleChangeSizeField', () => {
        let logChangeAndStartQueryChainWasCalled = false;
        component.logChangeAndStartQueryChain = () => {
            logChangeAndStartQueryChainWasCalled = true;
        };

        component.handleChangeSizeField();
        expect(logChangeAndStartQueryChainWasCalled).toBeTruthy();
    });

    it('returns the proper value from getButtonText', () => {
        expect(component.getButtonText()).toEqual('No Data');
        component.active.data = [{
            testDataField: 'Value',
            value: 10
        }];
        component.active.count = 1;
        expect(component.getButtonText()).toEqual('Total 1');
        component.active.count = 5;
        expect(component.getButtonText()).toEqual('Top 1 of 5');
    });

    it('properly returns the list of filters from getFilterData', () => {
        let filter1 = {
            id: '12345',
            key: 'testDataField',
            value: 'Value 1',
            prettyKey: 'testDataField'
        };
        let filter2 = {
            id: '67890',
            key: 'testDataField',
            value: 'Value 1',
            prettyKey: 'testDataField'
        };

        expect(component.getFilterData()).toEqual([]);
        component.addLocalFilter(filter1);
        expect(component.getFilterData()).toEqual([filter1]);
        component.addLocalFilter(filter2);
        expect(component.getFilterData()).toEqual([filter1, filter2]);
        component.removeFilter('12345');
        expect(component.getFilterData()).toEqual([filter2]);
        component.addLocalFilter(filter1);
        expect(component.getFilterData()).toEqual([filter2, filter1]);
        component.removeFilter('12345');
        component.removeFilter('67890');
        expect(component.getFilterData()).toEqual([]);
    });

    it('returns the correct value from createFilterDesc', () => {
        expect(component.createFilterDesc('test')).toEqual(' = test');
        component.active.dataField.columnName = 'testDataField';
        expect(component.createFilterDesc('value 2')).toEqual('testDataField = value 2');
        component.active.dataField.columnName = 'test2';
        expect(component.createFilterDesc('value 3')).toEqual('test2 = value 3');
    });

    it('returns the correct value from createFilterText', () => {
        let filter = {
            id: '67890',
            key: 'testDataField',
            value: 'Value One',
            prettyKey: 'testDataField',
            translated: 'Value Uno'
        };
        expect(component.createFilterText('Value One')).toEqual('');
        component.addLocalFilter(filter);
        expect(component.createFilterText('Value One')).toEqual('Value Uno');
        component.removeFilter('67890');
        filter.translated = '';
        component.addLocalFilter(filter);
        expect(component.createFilterText('Value One')).toEqual('Value One');
        component.active.allowsTranslations = false;
        expect(component.createFilterText('Value One')).toEqual('Value One');
    });

    it('returns the correct value from getRemoveDesc', () => {
        expect(component.getRemoveDesc('test')).toEqual('Delete Filter  = test');
        component.active.dataField.columnName = 'testDataField';
        expect(component.getRemoveDesc('value 2')).toEqual('Delete Filter testDataField = value 2');
        component.active.dataField.columnName = 'test2';
        expect(component.getRemoveDesc('value 3')).toEqual('Delete Filter test2 = value 3');
    });

    it('properly removes filters in removeFilter', () => {
        let filter1 = {
            id: '12345',
            key: 'testDataField',
            value: 'Value 1',
            prettyKey: 'testDataField'
        };
        let filter2 = {
            id: '67890',
            key: 'testDataField',
            value: 'Value 1',
            prettyKey: 'testDataField'
        };

        expect(component.getFilterData()).toEqual([]);
        component.addLocalFilter(filter1);
        expect(component.getFilterData()).toEqual([filter1]);
        component.addLocalFilter(filter2);
        expect(component.getFilterData()).toEqual([filter1, filter2]);
        component.removeFilter('12345');
        expect(component.getFilterData()).toEqual([filter2]);
        component.addLocalFilter(filter1);
        expect(component.getFilterData()).toEqual([filter2, filter1]);
        component.removeFilter('12345');
        component.removeFilter('67890');
        expect(component.getFilterData()).toEqual([]);
    });

    it('has a requestExport method that does nothing', () => {
        expect(component.requestExport).toBeDefined();
    });

    it('has an unsharedFilterChanged method that calls executeQueryChain', () => {
        let executeQueryChainWasCalled = false;
        component.executeQueryChain = () => {
            executeQueryChainWasCalled = true;
        };
        component.unsharedFilterChanged();
        expect(executeQueryChainWasCalled).toBeTruthy();
    });

    it('has an unsharedFilterRemoved method that calls executeQueryChain', () => {
        let executeQueryChainWasCalled = false;
        component.executeQueryChain = () => {
            executeQueryChainWasCalled = true;
        };
        component.unsharedFilterRemoved();
        expect(executeQueryChainWasCalled).toBeTruthy();
    });
});

describe('Component: Textcloud with config', () => {
    let component: TextCloudComponent;
    let fixture: ComponentFixture<TextCloudComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                TextCloudComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
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
                ChartModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(TextCloudComponent);
        component = fixture.componentInstance;
    });

    it('something to do with getOptionsFromConfig', () => {
        expect(component.getOptionFromConfig('title')).toEqual('Textcloud with Config Title');
        expect(component.getOptionFromConfig('database')).toEqual('testDatabase');
        expect(component.getOptionFromConfig('table')).toEqual('testTable');
        expect(component.getOptionFromConfig('dataField')).toEqual('testDataField');
        expect(component.getOptionFromConfig('configFilter')).toBeNull();
        expect(component.getOptionFromConfig('unsharedFilterField')).toEqual('testUnsharedFilterField');
        expect(component.getOptionFromConfig('unsharedFilterValue')).toEqual('testUnsharedFilterValue');
        expect(component.getOptionFromConfig('sizeField')).toEqual('testSizeField');
        expect(component.getOptionFromConfig('sizeAggregation')).toEqual('COUNT');
        expect(component.getOptionFromConfig('limit')).toBe(25);
    });

    it('returns expected query from createQuery when an unshared filter is given', () => {
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        component.active.dataField.columnName = 'testDataField';
        component.meta.unsharedFilterField.columnName = 'testUnsharedFilterField';
        component.meta.unsharedFilterValue = 'testUnsharedFilterValue';

        let whereClause = neon.query.where('testUnsharedFilterField', '=', 'testUnsharedFilterValue');
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
                TextCloudComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
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
                ChartModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(TextCloudComponent);
        component = fixture.componentInstance;
    });

    it('returns expected query from createQuery when a config filter is given', () => {
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        component.active.dataField.columnName = 'testDataField';

        let whereClause = neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue');
        let query = new neon.query.Query().selectFrom('testDatabase', 'testTable')
            .where(whereClause)
            .groupBy('testDataField')
            .aggregate(neonVariables.COUNT, '*', 'value')
            .sortBy('value', neonVariables.DESCENDING)
            .limit(25);

        expect(component.createQuery()).toEqual(query);
    });
});
