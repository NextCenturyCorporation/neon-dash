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

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ThemesService } from '../../services/themes.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { neonMappings } from '../../neon-namespaces';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BaseLayeredNeonComponent } from '../base-neon-component/base-layered-neon.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { basename } from 'path';
import * as neon from 'neon-framework';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
///*
@Component({
    selector: 'app-kebah-case',
    templateUrl: './base-neon.component.html',
    styleUrls: ['./base-neon.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
  })
class TestBaseNeonComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    public filters = [];
    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        changeDetection: ChangeDetectorRef,
        visualizationService: VisualizationService) {
        super(
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            changeDetection,
            visualizationService
        );
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [
            new TableMetaData('testTable', 'Test Table', [
                new FieldMetaData('testIdField', 'Test ID Field'),
                new FieldMetaData('testLinkField', 'Test Link Field')
            ])
        ];
        this.filters = [];
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

    getOptionFromConfig(field) {
        //
    }

    subGetBindings(bindings: any) {
        //
    }

    createQuery() {
        let query = new neon.query.Query();
        return query;
    }

    createNeonFilterClauseEquals() {
        //
    }

    onUpdateFields() {
        //
    }

    getFilterText(filter) {
        if (filter && filter.filterName) {
            return filter.filterName;
          } else {
            return 'Test Filter';
        }
    }
///*
    getExportFields() {
        let fields = [{
            columnName: 'value',
            prettyName: 'Count'
        }];
        return fields;
    }
//*/
    getNeonFilterFields() {
        return null;
    }

    getVisualizationName() {
        return 'Test';
    }

    getFiltersToIgnore() {
        let ignoredFilterIds = [];
        return ignoredFilterIds;
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

    removeFilter() {
        //
    }
}

class TestDatasetService extends DatasetService {
    constructor() {
        super(new NeonGTDConfig());
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [
            new TableMetaData('testTable', 'Test Table', [
                new FieldMetaData('testIdField', 'Test ID Field'),
                new FieldMetaData('testLinkField', 'Test Link Field')
            ])
        ];
        this.setActiveDataset({
            databases: [testDatabase]
        });
    }
}

describe('Component: base-neon', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestBaseNeonComponent,
                ExportControlComponent
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule
            ],
            providers: [
                ConnectionService,
                {
                    provide: DatasetService,
                    useClass: TestDatasetService
                },
                DatasetService,
                FilterService,
                ErrorNotificationService,
                ExportService,
                VisualizationService,
                ThemesService,
                Injector,
                { provide: 'config', useValue: testConfig }
            ]
        });

        fixture = TestBed.createComponent(TestBaseNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create a component', (() => {
        expect(component).toBeTruthy();
    }));

    it('should return expected value from bindings', (() => {
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        expect(component.getBindings()).toEqual({
            title: component.createTitle(),
            database: component.meta.database.name,
            table: component.meta.table.name,
            unsharedFilterField: component.meta.unsharedFilterField.columnName,
            unsharedFilterValue: component.meta.unsharedFilterValue,
            colorField: component.meta.colorField.columnName
        });
    }));

    it('returns expected value from createTitle', (() => {
        expect(component.createTitle()).toEqual('');
        expect(component.createTitle(true)).toEqual('');
        expect(component.createTitle(false)).toEqual('');
    }));

    it('Checks both export functions', (() => {
        let query = component.createQuery();
        let queryTitle = component.createTitle();

        expect(component.export()).toBeDefined();
        expect(component.doExport()).toBeDefined();
        /*expect(component.export()).toEqual({
            name: 'Query_Results_Table',
            data: [{
                query: component.createQuery,
                name: String,
                fields: [{
                    query: 'value',
                    pretty: 'Count'
                }],
                ignoreFilters: query.ignoreFilters,
                selectionOnly: query.selectionOnly,
                ignoredFilterIds: [],
                type: 'query'
            }]
        });*/
    }));

    it('Checks to see doExport calls the export function once', (() => {
        let spy = spyOn(component, 'export');
        component.doExport();
        expect(spy.calls.count()).toBe(1);
    }));

    it('Tests ngOnDestroy function', (() => {
        expect(component.ngOnDestroy()).toBeUndefined();
        let spy = spyOn(component, 'subNgOnDestroy');
        component.ngOnDestroy();
        expect(spy.calls.count()).toBe(1);
    }));

    it('Initilization tests', (() => {
        let spyInitFields = spyOn(component, 'initFields');
        let spyInitTables = spyOn(component, 'initTables');
        let spyOnUpdateFields = spyOn(component, 'onUpdateFields');
        let spyLogChangeAndStartQueryChain = spyOn(component, 'logChangeAndStartQueryChain');

        component.initTables();
        expect(spyInitFields.calls.count()).toBe(0);
        //expect(component.meta.table).toBeEqual()

        component.initDatabases();
        expect(spyInitTables.calls.count()).toBe(1);

        component.initFields();
        expect(spyOnUpdateFields.calls.count()).toBe(0);

        spyInitTables.calls.reset();
        component.handleChangeDatabase();
        //expect(spyInitTables.calls.count()).toBe(1);
        expect(spyLogChangeAndStartQueryChain.calls.count()).toBe(1);

    }));

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

    it('Tests default return from findFieldObject', (() => {
        expect(component.findFieldObject('testField', null)).toEqual({
                columnName: '',
                prettyName: '',
                hide: false
            }
        );
    }));
});
