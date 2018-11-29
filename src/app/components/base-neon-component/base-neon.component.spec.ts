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
import { FormsModule } from '@angular/forms';
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Injector,
    OnInit,
    ViewEncapsulation
} from '@angular/core';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BaseLayeredNeonComponent } from '../base-neon-component/base-layered-neon.component';
import { basename } from 'path';
import * as neon from 'neon-framework';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import * as _ from 'lodash';

export class TestOptions extends BaseNeonOptions {
    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        return bindings;
    }

    /**
     * Returns the list of field array properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldArrayProperties(): string[] {
        return [];
    }

    /**
     * Returns the list of field properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldProperties(): string[] {
        return [];
    }

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @override
     */
    initializeNonFieldBindings() {
        // Do nothing.
    }
}

@Component({
    selector: 'app-kebah-case',
    templateUrl: './base-neon.component.html',
    styleUrls: ['./base-neon.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
  })
class TestBaseNeonComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    public filters: any[] = [];
    public options: TestOptions;
    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        changeDetection: ChangeDetectorRef
    ) {
        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            changeDetection
        );
        this.options = new TestOptions(this.injector, this.datasetService, 'TestName');
    }

    postInit() {
        //Method for anything that needs to be done once the visualization has been initialized
    }

    subNgOnInit() {
        //Method to do any visualization-specific initialization.
    }

    subNgOnDestroy() {
        //Get an option from the visualization's config
    }

    createQuery() {
        let query = new neon.query.Query();
        return query;
    }

    getCloseableFilters() {
        return [];
    }

    getElementRefs() {
        return {};
    }

    getFiltersToIgnore() {
        let ignoredFilterIds = [];
        return ignoredFilterIds;
    }

    getFilterText(filter) {
        if (filter && filter.filterName) {
            return filter.filterName;
          } else {
            return 'Test Filter';
        }
    }

    getOptions() {
        return this.options;
    }

    isValidQuery() {
        return true;
    }

    onQuerySuccess() {
        return new neon.query.Query();
    }

    refreshVisualization() {
        //
    }

    removeFilter() {
        //
    }

    setupFilters() {
        let database = 'test database';
        let table = 'test table';
        let fields = ['test field'];
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                let f = {
                    id: filter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                };
            }
        } else {
            this.filters = [];
        }
        //
    }
}

describe('Component: BaseNeonOptions', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let options: BaseNeonOptions;
    let fixture: ComponentFixture<BaseNeonComponent>;

    initializeTestBed({
        declarations: [
            TestBaseNeonComponent
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: testConfig },
            { provide: 'testDate', useValue: 'testDateField' },
            { provide: 'testFake', useValue: 'testFakeField' },
            { provide: 'testList', useValue: ['testDateField', 'testFakeField', 'testNameField', 'testSizeField'] },
            { provide: 'testName', useValue: 'testNameField' },
            { provide: 'testSize', useValue: 'testSizeField' }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestBaseNeonComponent);
        component = fixture.componentInstance;
        options = component.getOptions();
        fixture.detectChanges();
    });

    it('does have expected properties', () => {
        expect(options.customEventsToPublish).toEqual([]);
        expect(options.customEventsToReceive).toEqual([]);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(options.filter).toEqual(null);
        expect(options.hideUnfiltered).toEqual(false);
        expect(options.limit).toEqual(10);
        expect(options.newLimit).toEqual(10);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.title).toEqual('TestName');
        expect(options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(options.unsharedFilterValue).toEqual('');
    });

    it('createBindings does return expected object', () => {
        expect(options.createBindings()).toEqual({
            configFilter: undefined,
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            hideUnfiltered: false,
            limit: 10,
            table: 'testTable1',
            title: 'TestName',
            unsharedFilterValue: '',
            unsharedFilterField: ''
        });
    });

    it('findField does return expected object or undefined', () => {
        expect(options.findField('testDateField')).toEqual(DatasetServiceMock.DATE_FIELD);
        expect(options.findField('testNameField')).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(options.findField('testSizeField')).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(options.findField('testFakeField')).toEqual(undefined);
    });

    it('findField does work as expected if given an array index', () => {
        let dateIndex = _.findIndex(DatasetServiceMock.FIELDS, (fieldObject) => {
            return fieldObject.columnName === 'testDateField';
        });
        let nameIndex = _.findIndex(DatasetServiceMock.FIELDS, (fieldObject) => {
            return fieldObject.columnName === 'testNameField';
        });
        let sizeIndex = _.findIndex(DatasetServiceMock.FIELDS, (fieldObject) => {
            return fieldObject.columnName === 'testSizeField';
        });
        expect(options.findField('' + dateIndex)).toEqual(DatasetServiceMock.DATE_FIELD);
        expect(options.findField('' + nameIndex)).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(options.findField('' + sizeIndex)).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(options.findField('' + DatasetServiceMock.FIELDS.length)).toEqual(undefined);
        expect(options.findField('-1')).toEqual(undefined);
    });

    it('findFieldObject does return expected object', () => {
        expect(options.findFieldObject('testDate')).toEqual(DatasetServiceMock.DATE_FIELD);
        expect(options.findFieldObject('testName')).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(options.findFieldObject('testSize')).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(options.findFieldObject('testFake')).toEqual(new FieldMetaData());
        expect(options.findFieldObject('fakeBind')).toEqual(new FieldMetaData());
    });

    it('findFieldObjects does return expected array', () => {
        expect(options.findFieldObjects('testList')).toEqual([
            DatasetServiceMock.DATE_FIELD,
            new FieldMetaData(),
            DatasetServiceMock.NAME_FIELD,
            DatasetServiceMock.SIZE_FIELD
        ]);
        expect(options.findFieldObjects('testName')).toEqual([]);
        expect(options.findFieldObjects('fakeBind')).toEqual([]);
    });

    it('getAllFieldArrayProperties does return expected array', () => {
        expect(options.getAllFieldArrayProperties()).toEqual([]);
    });

    it('getAllFieldProperties does return expected array', () => {
        expect(options.getAllFieldProperties()).toEqual(['unsharedFilterField']);
    });

    it('getExportFields does return expected array', () => {
        expect(options.getExportFields()).toEqual([]);
    });

    it('updateDatabases does update databases, tables, and fields', () => {
        options.updateDatabases();
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('updateFields does update fields', () => {
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.tables = DatasetServiceMock.TABLES;
        options.table = DatasetServiceMock.TABLES[0];
        options.updateFields();
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('updateTables does update tables and fields', () => {
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.updateTables();
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
    });
});

describe('Component: BaseNeonOptions with config', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let options: BaseNeonOptions;
    let fixture: ComponentFixture<BaseNeonComponent>;

    initializeTestBed({
        declarations: [
            TestBaseNeonComponent
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: testConfig },
            { provide: 'configFilter', useValue: { lhs: 'testConfigField', operator: '!=', rhs: 'testConfigValue' } },
            { provide: 'customEventsToPublish', useValue: [ { id: 'testPublishId', fields: [ { columnName: 'testPublishColumnName',
                prettyName: 'testPublishPrettyName' } ] } ] },
            { provide: 'customEventsToReceive', useValue: [ { id: 'testReceiveId', fields: [ { columnName: 'testReceiveColumnName',
                type: 'testReceiveType' } ] } ] },
            { provide: 'hideUnfiltered', useValue: true },
            { provide: 'limit', useValue: 1234 },
            { provide: 'tableKey', useValue: 'table_key_2'},
            { provide: 'title', useValue: 'VisualizationTitle' },
            { provide: 'unsharedFilterField', useValue: 'testFilterField' },
            { provide: 'unsharedFilterValue', useValue: 'testFilterValue' }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestBaseNeonComponent);
        component = fixture.componentInstance;
        options = component.getOptions();
        fixture.detectChanges();
    });

    it('does have expected properties', () => {
        expect(options.customEventsToPublish).toEqual([{
            id: 'testPublishId',
            fields: [{
                columnName: 'testPublishColumnName',
                prettyName: 'testPublishPrettyName'
            }]
        }]);
        expect(options.customEventsToReceive).toEqual([{
            id: 'testReceiveId',
            fields: [{
                columnName: 'testReceiveColumnName',
                type: 'testReceiveType'
            }]
        }]);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(options.filter).toEqual({
            lhs: 'testConfigField',
            operator: '!=',
            rhs: 'testConfigValue'
        });
        expect(options.hideUnfiltered).toEqual(true);
        expect(options.limit).toEqual(1234);
        expect(options.newLimit).toEqual(1234);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.title).toEqual('VisualizationTitle');
        expect(options.unsharedFilterField).toEqual(DatasetServiceMock.FILTER_FIELD);
        expect(options.unsharedFilterValue).toEqual('testFilterValue');
    });

    it('createBindings does return expected object', () => {
        expect(options.createBindings()).toEqual({
            configFilter: {
                lhs: 'testConfigField',
                operator: '!=',
                rhs: 'testConfigValue'
            },
            customEventsToPublish: [{
                id: 'testPublishId',
                fields: [{
                    columnName: 'testPublishColumnName',
                    prettyName: 'testPublishPrettyName'
                }]
            }],
            customEventsToReceive: [{
                id: 'testReceiveId',
                fields: [{
                    columnName: 'testReceiveColumnName',
                    type: 'testReceiveType'
                }]
            }],
            database: 'testDatabase2',
            hideUnfiltered: true,
            limit: 1234,
            table: 'testTable2',
            title: 'VisualizationTitle',
            unsharedFilterValue: 'testFilterValue',
            unsharedFilterField: 'testFilterField'
        });
    });

    it('updateDatabases does update database if given a key', () => {
        options.updateDatabases();
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
    });

    it('updateFields does update unshared filter', () => {
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.tables = DatasetServiceMock.TABLES;
        options.table = DatasetServiceMock.TABLES[0];
        options.unsharedFilterField = null;
        options.unsharedFilterValue = null;
        options.updateFields();
        expect(options.unsharedFilterField).toEqual(DatasetServiceMock.FILTER_FIELD);
    });

    it('updateTables does update tables if given a key', () => {
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.updateTables();
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
    });
});

describe('Component: base-neon', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    initializeTestBed({
        declarations: [
            TestBaseNeonComponent
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: testConfig }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestBaseNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should return expected value from bindings', (() => {
        component.getOptions().database = new DatabaseMetaData('testDatabase1');
        component.getOptions().table = new TableMetaData('testTable1');
        expect(component.getBindings()).toEqual({
            configFilter: undefined,
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            hideUnfiltered: false,
            limit: 10,
            table: 'testTable1',
            title: 'TestName',
            unsharedFilterValue: '',
            unsharedFilterField: ''
        });
    }));

    it('Tests ngOnDestroy function', (() => {
        expect(component.ngOnDestroy()).toBeUndefined();
        let spy = spyOn(component, 'subNgOnDestroy');
        component.ngOnDestroy();
        expect(spy.calls.count()).toBe(1);
    }));

    it('handleChangeDatabase does update options and does call logChangeAndStartQueryChain', () => {
        let options = component.getOptions();
        let spyLog = spyOn(component, 'logChangeAndStartQueryChain');
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.tables = [];
        options.table = null;
        options.fields = [];
        component.handleChangeDatabase();
        expect(spyLog.calls.count()).toBe(1);
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(options.unsharedFilterValue).toEqual('');
    });

    it('handleChangeTable does update options and does call logChangeAndStartQueryChain', () => {
        let options = component.getOptions();
        let spyLog = spyOn(component, 'logChangeAndStartQueryChain');
        options.databases = DatasetServiceMock.DATABASES;
        options.database = DatasetServiceMock.DATABASES[0];
        options.tables = DatasetServiceMock.TABLES;
        options.table = DatasetServiceMock.TABLES[0];
        options.fields = [];
        component.handleChangeTable();
        expect(spyLog.calls.count()).toBe(1);
        expect(options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(options.unsharedFilterValue).toEqual('');
    });

    it('handleChangeData does call logChangeAndStartQueryChain', () => {
        let spy = spyOn(component, 'logChangeAndStartQueryChain');
        component.handleChangeData();
        expect(spy.calls.count()).toBe(1);
    });

    it('handleChangeLimit does update limit and does call logChangeAndStartQueryChain', () => {
        let options = component.getOptions();
        let spy = spyOn(component, 'logChangeAndStartQueryChain');

        options.newLimit = 1234;

        component.handleChangeLimit();
        expect(options.limit).toBe(1234);
        expect(spy.calls.count()).toBe(1);

        options.newLimit = 0;

        component.handleChangeLimit();
        expect(options.limit).toBe(1234);
        expect(options.newLimit).toBe(1234);
        expect(spy.calls.count()).toBe(1);
    });

    it('Handle Filters Changed Event method calls the correct functions', (() => {
        let spySetupFilters = spyOn(component, 'setupFilters');
        let spyExecuteQueryChain = spyOn(component, 'executeQueryChain');
        component.handleFiltersChangedEvent();
        expect(spySetupFilters.calls.count()).toBe(1);
        expect(spyExecuteQueryChain.calls.count()).toBe(1);
    }));

    it('Tests expected return', (() => {
        expect(component.getButtonText()).toBe('');
    }));

    it('Tests onQuery default response', (() => {
        let spyOnQuerySuccess = spyOn(component, 'onQuerySuccess');
        component.baseOnQuerySuccess({
            data: []
         });
        expect(spyOnQuerySuccess.calls.count()).toBe(1);
        expect(component.isLoading).toBeFalsy();
    }));

    it('isNumber does return expected boolean', () => {
        expect(component.isNumber(true)).toBe(false);
        expect(component.isNumber('a')).toBe(false);
        expect(component.isNumber([1, 2])).toBe(false);
        expect(component.isNumber({
            value: 1
        })).toBe(false);

        expect(component.isNumber(1)).toBe(true);
        expect(component.isNumber(12.34)).toBe(true);
        expect(component.isNumber(-12.34)).toBe(true);
        expect(component.isNumber('1')).toBe(true);
        expect(component.isNumber('12.34')).toBe(true);
        expect(component.isNumber('-12.34')).toBe(true);
    });

    it('prettifyInteger does return expected string', () => {
        expect(component.prettifyInteger(0)).toBe('0');
        expect(component.prettifyInteger(1)).toBe('1');
        expect(component.prettifyInteger(12)).toBe('12');
        expect(component.prettifyInteger(123)).toBe('123');
        expect(component.prettifyInteger(1234)).toBe('1,234');
        expect(component.prettifyInteger(1234567890)).toBe('1,234,567,890');
    });

    it('removeAllFilters does work as expected with single filter', () => {
        let removeCalls = 0;

        component.removeLocalFilterFromLocalAndNeon = (filter, bool1, bool2, removeMoreFilters) => {
            removeCalls++;
            if (removeCalls === 1) {
                expect(filter).toEqual({
                    id: 'id1',
                    key: 'key1',
                    value: 'value1',
                    prettyKey: 'prettyKey1'
                });
            }
            expect(bool1).toBe(false);
            expect(bool2).toBe(false);
            expect(typeof removeMoreFilters).toBe('function');
            removeMoreFilters();
        };

        component.removeAllFilters([{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }]);

        expect(removeCalls).toBe(1);
    });

    it('removeAllFilters does work as expected with multiple filters', () => {
        let removeCalls = 0;

        component.removeLocalFilterFromLocalAndNeon = (filter, bool1, bool2, removeMoreFilters) => {
            removeCalls++;
            if (removeCalls === 1) {
                expect(filter).toEqual({
                    id: 'id1',
                    key: 'key1',
                    value: 'value1',
                    prettyKey: 'prettyKey1'
                });
            }
            if (removeCalls === 2) {
                expect(filter).toEqual({
                    id: 'id2',
                    key: 'key2',
                    value: 'value2',
                    prettyKey: 'prettyKey2'
                });
            }
            expect(bool1).toBe(false);
            expect(bool2).toBe(false);
            expect(typeof removeMoreFilters).toBe('function');
            removeMoreFilters();
        };

        component.removeAllFilters([{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }]);

        expect(removeCalls).toBe(2);
    });

    it('removeAllFilters does work as expected with single filter', () => {
        let removeCalls = 0;
        let callbackCalls = 0;

        component.removeLocalFilterFromLocalAndNeon = (filter, bool1, bool2, removeMoreFilters) => {
            removeCalls++;
            removeMoreFilters();
        };

        component.removeAllFilters([{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }], () => {
            callbackCalls++;
        });

        expect(removeCalls).toBe(2);
        expect(callbackCalls).toBe(1);
    });

    it('removeAllFilters does not change original array', () => {
        component.removeLocalFilterFromLocalAndNeon = (filter, bool1, bool2, removeMoreFilters) => {
            removeMoreFilters();
        };

        let filters = [{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }];

        component.removeAllFilters(filters);

        expect(filters).toEqual([{
            id: 'id1',
            key: 'key1',
            value: 'value1',
            prettyKey: 'prettyKey1'
        }, {
            id: 'id2',
            key: 'key2',
            value: 'value2',
            prettyKey: 'prettyKey2'
        }]);
    });
});
