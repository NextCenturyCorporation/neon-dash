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
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import { ChartModule } from 'angular2-chartjs';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { BarChartComponent } from './bar-chart.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationService } from '../../services/visualization.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { LegendComponent } from '../legend/legend.component';

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

describe('Component: BarChart', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BarChartComponent;
    let fixture: ComponentFixture<BarChartComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                LegendComponent,
                BarChartComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
                ConnectionService,
                DatasetService,
                FilterService,
                ExportService,
                TranslationService,
                ErrorNotificationService,
                VisualizationService,
                ThemesService,
                Injector,
                ColorSchemeService,
                { provide: 'config', useValue: testConfig }
            ],
            imports: [
                BrowserAnimationsModule,
                AppMaterialModule,
                FormsModule,
                ChartModule
            ]
        });
        fixture = TestBed.createComponent(BarChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));

    it('Checks Active value', (() => {
        expect(component.active.aggregationFieldHidden).toBe(true);
        expect(component.active.andFilters).toBe(true);
        expect(component.active.limit).toBe(100);
        expect(component.active.filterable).toBe(true);
        expect(component.active.aggregation).toBe('count');
        expect(component.active.chartType).toBe('bar');

        let testSeen = ['a', 'b', 'c', 'd', 'e'];

        component.active.aggregationFieldHidden = false;
        component.active.andFilters = false;
        component.active.limit = 42;
        component.active.filterable = false;
        component.active.aggregation = 'test';
        component.active.chartType = 'testChart';
        component.active.maxNum = 9001;
        component.active.seenValues = testSeen;

        expect(component.active.aggregationFieldHidden).toBe(false);
        expect(component.active.andFilters).toBe(false);
        expect(component.active.limit).toBe(42);
        expect(component.active.filterable).toBe(false);
        expect(component.active.aggregation).toBe('test');
        expect(component.active.chartType).toBe('testChart');
        expect(component.active.maxNum).toBe(9001);
        expect(component.active.seenValues).toEqual(testSeen);
    }));

    it('Checks optionsFromConfig default value', (() => {
        expect(component.getOptionFromConfig('title')).toBeNull();
        expect(component.getOptionFromConfig('database')).toBeNull();
        expect(component.getOptionFromConfig('table')).toBeNull();
        expect(component.getOptionFromConfig('dataField')).toBeNull();
        expect(component.getOptionFromConfig('aggregation')).toBeNull();
        expect(component.getOptionFromConfig('aggregationField')).toBeNull();
        expect(component.getOptionFromConfig('colorField')).toBeNull();
        expect(component.getOptionFromConfig('limit')).toBe(100);
        expect(component.getOptionFromConfig('unsharedFilterField')).toEqual({});
        expect(component.getOptionFromConfig('unsharedFilterValue')).toBe('');
        expect(component.getOptionFromConfig('chartType')).toBe('bar');
    }));

    it('Handle change Aggregation method calls the correct function', (() => {
        let spyExecuteQueryChain = spyOn(component, 'executeQueryChain');
        component.handleChangeAggregation();
        expect(spyExecuteQueryChain.calls.count()).toBe(1);
    }));

    it('Checks getButtonText function', (() => {
        expect(component.getButtonText()).toBe('No Data');
    }));

    it('checks return values', (() => {
        expect(component.getFilterCloseText('test')).toBe('test');
        expect(component.getRemoveFilterTooltip('test')).toBe('Delete Filter  = test');
    }));

    it('checks if logChangeAndStartQueryChain has been called correctly', (() => {
        let spyLogChange = spyOn(component, 'logChangeAndStartQueryChain');
        component.handleChangeLimit();
        expect(spyLogChange.calls.count()).toBe(1);
        component.handleChangeDataField();
        expect(spyLogChange.calls.count()).toBe(2);
        component.handleChangeAggregationField();
        expect(spyLogChange.calls.count()).toBe(3);
        component.handleChangeColorField();
        expect(spyLogChange.calls.count()).toBe(4);
        component.handleChangeAndFilters();
        expect(spyLogChange.calls.count()).toBe(5);
    }));
///*
    it('Checks for expected value from getExportFields', (() => {
        component.active.dataField.columnName = 'Test datafield column';
        component.active.dataField.prettyName = 'Test datafield prettyName';
        let expectedObject = [{
            columnName: 'Test datafield column',
            prettyName: 'Test datafield prettyName'
        }, {
            columnName: 'value',
            prettyName: 'Count'
        }];
        expect(component.getExportFields()).toEqual(expectedObject);
    })); //*/

    it('Filter Check', (() => {
        expect(component.getCloseableFilters()).toEqual([]);
    }));

    it('Checks for expected query from createQuery', (() => {
        let spyQuerySuccess = spyOn(component, 'onQuerySuccess');
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        component.active.dataField.columnName = 'Test datafield column';
        let groupBy: any[] = ['Test datafield column'];

        let query = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable');

        let whereClauses = [
            neon.query.where('Test datafield column', '!=', null)
        ];

        query.where(neon.query.and.apply(query, whereClauses));

        query.groupBy(groupBy).aggregate(neonVariables.COUNT, '*', 'value')
        .sortBy('value', neonVariables.DESCENDING).limit(component.active.limit);

        expect(component.createQuery()).toEqual(query);
        expect(spyQuerySuccess.calls.count()).toBe(0);
    }));

    it('Tests expected return from getButtonText', (() => {
        expect(component.getButtonText()).toEqual('No Data');
    }));

    it('Tests expects return from isValidQuery', (() => {
        expect(component.isValidQuery()).toEqual('');
    }));
/*
    it('Checks for expected query from onQuerySuccess', (() => {
        let spyRefreshVisualization = spyOn(component, 'refreshVisualization');
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        component.active.dataField.columnName = 'Test datafield column';

        let response = {
            data: []
        };

        expect(component.onQuerySuccess(response)).toBeUndefined();
        //expect(component.queryTitle).toEqual('Count by ');
        expect(spyRefreshVisualization.calls.count()).toBe(1);
    }));
*/
});
