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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { BarChartComponent, BarDataSet } from './bar-chart.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ActiveGridService } from '../../services/active-grid.service';
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
import { By } from '@angular/platform-browser';
import { AppMaterialModule } from '../../app.material.module';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { VisualizationService } from '../../services/visualization.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { LegendComponent } from '../legend/legend.component';
import { ChartComponent } from '../chart/chart.component';

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
                ChartComponent,
                LegendComponent,
                BarChartComponent,
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
                FormsModule
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
        expect(component.active.limit).toBe(10);
        expect(component.active.page).toBe(1);
        expect(component.active.lastPage).toBe(true);
        expect(component.active.filterable).toBe(true);
        expect(component.active.aggregation).toBe('count');
        expect(component.active.chartType).toBe('bar');
        expect(component.active.bars).toEqual([]);
        expect(component.active.seenBars).toEqual([]);

        component.active.aggregationFieldHidden = false;
        component.active.andFilters = false;
        component.active.limit = 42;
        component.active.filterable = false;
        component.active.aggregation = 'test';
        component.active.chartType = 'testChart';

        expect(component.active.aggregationFieldHidden).toBe(false);
        expect(component.active.andFilters).toBe(false);
        expect(component.active.limit).toBe(42);
        expect(component.active.filterable).toBe(false);
        expect(component.active.aggregation).toBe('test');
        expect(component.active.chartType).toBe('testChart');
    }));

    it('Checks optionsFromConfig default value', (() => {
        expect(component.getOptionFromConfig('title')).toBeNull();
        expect(component.getOptionFromConfig('database')).toBeNull();
        expect(component.getOptionFromConfig('table')).toBeNull();
        expect(component.getOptionFromConfig('dataField')).toBeNull();
        expect(component.getOptionFromConfig('aggregation')).toBeNull();
        expect(component.getOptionFromConfig('aggregationField')).toBeNull();
        expect(component.getOptionFromConfig('colorField')).toBeNull();
        expect(component.getOptionFromConfig('limit')).toBe(10);
        expect(component.getOptionFromConfig('unsharedFilterField')).toEqual({});
        expect(component.getOptionFromConfig('unsharedFilterValue')).toBe('');
        expect(component.getOptionFromConfig('chartType')).toBe('bar');
    }));

    it('Handle change Aggregation method calls the correct function', (() => {
        let spyExecuteQueryChain = spyOn(component, 'executeQueryChain');
        component.handleChangeAggregation();
        expect(spyExecuteQueryChain.calls.count()).toBe(1);
    }));

    it('checks return values', (() => {
        expect(component.getFilterCloseText('test')).toBe('test');
        expect(component.getRemoveFilterTooltip('test')).toBe('Delete Filter  = test');
    }));

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
    }));

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

        query.groupBy(groupBy).aggregate(neonVariables.COUNT, '*', 'value').sortBy('value', neonVariables.DESCENDING);

        expect(component.createQuery()).toEqual(query);
        expect(spyQuerySuccess.calls.count()).toBe(0);
    }));

    it('Tests expects return from isValidQuery', (() => {
        expect(component.isValidQuery()).toEqual('');
    }));

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toBe('No Data');
        component.active.bars = ['a'];
        expect(component.getButtonText()).toBe('Total 1');

        component.active.bars = ['a', 'b'];
        component.active.limit = 10;
        expect(component.getButtonText()).toBe('Total 2');
        component.active.limit = 1;
        expect(component.getButtonText()).toBe('1 of 2');

        component.active.bars = ['a', 'b', 'c', 'd'];
        component.active.limit = 10;
        expect(component.getButtonText()).toBe('Total 4');
        component.active.limit = 4;
        expect(component.getButtonText()).toBe('Total 4');
        component.active.limit = 2;
        expect(component.getButtonText()).toBe('1 - 2 of 4');
        component.active.page = 2;
        expect(component.getButtonText()).toBe('3 - 4 of 4');
    });

    it('handleChangeLimit does update limit and seenBars and does call logChangeAndStartQueryChain', () => {
        let spy = spyOn(component, 'logChangeAndStartQueryChain');

        component.active.newLimit = 1234;
        component.active.seenBars = ['a', 'b', 'c', 'd'];

        component.handleChangeLimit();
        expect(component.active.limit).toEqual(1234);
        expect(component.active.seenBars).toEqual([]);
        expect(spy.calls.count()).toBe(1);

        component.active.newLimit = 0;

        component.handleChangeLimit();
        expect(component.active.limit).toEqual(1234);
        expect(component.active.newLimit).toEqual(1234);
        expect(component.active.seenBars).toEqual([]);
        expect(spy.calls.count()).toBe(1);
    });

    it('handleChangeField does update seenBars and does call logChangeAndStartQueryChain', () => {
        let spy = spyOn(component, 'logChangeAndStartQueryChain');
        component.active.seenBars = ['a', 'b', 'c', 'd'];
        component.handleChangeField();
        expect(component.active.seenBars).toEqual([]);
        expect(spy.calls.count()).toBe(1);
    });

    it('onClick does call add functions if filters is an empty array', () => {
        component.active.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        let spy1 = spyOn(component, 'addLocalFilter');
        let spy2 = spyOn(component, 'addNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');
        let spy4 = spyOn(component, 'replaceNeonFilter');
        let spy5 = spyOn(component, 'refreshVisualization');

        component.onClick({}, [{
            _model: {
                label: 'testFilter'
            }
        }]);

        expect(spy1.calls.count()).toBe(1);
        expect(spy1.calls.argsFor(0)).toEqual([{
            id: undefined,
            key: 'testDataField',
            value: 'testFilter',
            prettyKey: 'Test Data Field'
        }]);
        expect(spy2.calls.count()).toBe(1);
        expect(spy2.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            key: 'testDataField',
            value: 'testFilter',
            prettyKey: 'Test Data Field'
        }]);
        expect(spy3.calls.count()).toBe(0);
        expect(spy4.calls.count()).toBe(0);
        expect(spy5.calls.count()).toBe(1);
    });

    it('onClick does change filters and does call replace function if filters is not an empty array and filter does match', () => {
        component.active.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        component.addLocalFilter({
            key: 'otherField',
            value: 'otherValue'
        });
        let spy1 = spyOn(component, 'addLocalFilter');
        let spy2 = spyOn(component, 'addNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');
        let spy4 = spyOn(component, 'replaceNeonFilter');
        let spy5 = spyOn(component, 'refreshVisualization');

        component.onClick({}, [{
            _model: {
                label: 'testFilter'
            }
        }]);

        expect(spy1.calls.count()).toBe(0);
        expect(spy2.calls.count()).toBe(0);
        expect(spy3.calls.count()).toBe(0);
        expect(spy4.calls.count()).toBe(1);
        expect(spy4.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            key: 'testDataField',
            value: 'testFilter',
            prettyKey: 'Test Data Field'
        }]);
        expect(spy5.calls.count()).toBe(1);
    });

    it('onClick does does call remove and add functions if filters is not an empty array and filter does not match', () => {
        component.active.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        component.addLocalFilter({
            key: 'testDataField',
            value: 'testFilter'
        });
        let spy1 = spyOn(component, 'addLocalFilter');
        let spy2 = spyOn(component, 'addNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');
        let spy4 = spyOn(component, 'replaceNeonFilter');
        let spy5 = spyOn(component, 'refreshVisualization');

        component.onClick({}, [{
            _model: {
                label: 'testFilter'
            }
        }]);

        expect(spy1.calls.count()).toBe(1);
        expect(spy1.calls.argsFor(0)).toEqual([{
            id: undefined,
            key: 'testDataField',
            value: 'testFilter',
            prettyKey: 'Test Data Field'
        }]);
        expect(spy2.calls.count()).toBe(1);
        expect(spy2.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            key: 'testDataField',
            value: 'testFilter',
            prettyKey: 'Test Data Field'
        }]);
        expect(spy3.calls.count()).toBe(1);
        expect(spy3.calls.argsFor(0)).toEqual([false, false]);
        expect(spy4.calls.count()).toBe(0);
        expect(spy5.calls.count()).toBe(1);
    });

    it('onClick only uses first input element', () => {
        component.active.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        let spy1 = spyOn(component, 'addLocalFilter');
        let spy2 = spyOn(component, 'addNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');
        let spy4 = spyOn(component, 'replaceNeonFilter');
        let spy5 = spyOn(component, 'refreshVisualization');

        component.onClick({}, [{
            _model: {
                label: 'testFilter1'
            }
        }, {
            _model: {
                label: 'testFilter2'
            }
        }]);

        expect(spy1.calls.count()).toBe(1);
        expect(spy1.calls.argsFor(0)).toEqual([{
            id: undefined,
            key: 'testDataField',
            value: 'testFilter1',
            prettyKey: 'Test Data Field'
        }]);
        expect(spy2.calls.count()).toBe(1);
        expect(spy2.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            key: 'testDataField',
            value: 'testFilter1',
            prettyKey: 'Test Data Field'
        }]);
        expect(spy3.calls.count()).toBe(0);
        expect(spy4.calls.count()).toBe(0);
        expect(spy5.calls.count()).toBe(1);
    });

    it('refreshVisualization does not change dataset colors if no filters are set', () => {
        let activeData = new BarDataSet(4);
        activeData.label = 'group1';
        activeData.color = new Color(255, 255, 255);
        activeData.backgroundColor = ['', '', '', ''];
        activeData.data = [10, 5, 1, 0];

        component.active.data = [activeData];

        component.refreshVisualization();

        expect(component.selectedLabels).toEqual([]);
        expect(component.active.data[0].backgroundColor).toEqual(['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)',
            'rgb(255,255,255)']);
    });

    it('refreshVisualization does change dataset colors and selectedLabels if filters are set', () => {
        let activeData = new BarDataSet(4);
        activeData.label = 'group1';
        activeData.color = new Color(255, 255, 255);
        activeData.backgroundColor = ['', '', '', ''];
        activeData.data = [10, 5, 1, 0];

        let barChartData = new BarDataSet(4);
        barChartData.label = 'group1';
        barChartData.color = new Color(255, 255, 255);
        barChartData.backgroundColor = ['', '', '', ''];
        barChartData.data = [10, 5, 1, 0];

        component.active.data = [activeData];
        component.chartInfo.data.labels = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.chartInfo.data.datasets = [barChartData];
        component.addLocalFilter({
            key: 'testDataField',
            value: 'bar2'
        });

        component.refreshVisualization();

        expect(component.selectedLabels).toEqual(['group1']);
        expect(component.active.data[0].backgroundColor).toEqual(['', '', '', '']);
        expect(component.chartInfo.data.datasets[0].backgroundColor).toEqual(['rgba(255,255,255,0.3)', 'rgb(255,255,255)',
            'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)']);
    });

    it('onQuerySuccess does update active.page and active.lastPage and does call updateBarChart', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.active.dataField = new FieldMetaData('testDataField');
        component.active.limit = 2;
        component.active.page = 2;
        component.active.lastPage = true;

        component.onQuerySuccess({
            data: [{
                testDataField: 'bar1',
                value: 10
            }, {
                testDataField: 'bar2',
                value: 5
            }, {
                testDataField: 'bar3',
                value: 1
            }, {
                testDataField: 'bar4',
                value: 0
            }]
        });

        expect(component.active.page).toBe(1);
        expect(component.active.lastPage).toBe(false);
        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 2]);

        component.active.limit = 4;
        component.active.page = 2;

        component.onQuerySuccess({
            data: [{
                testDataField: 'bar1',
                value: 10
            }, {
                testDataField: 'bar2',
                value: 5
            }, {
                testDataField: 'bar3',
                value: 1
            }, {
                testDataField: 'bar4',
                value: 0
            }]
        });

        expect(component.active.page).toBe(1);
        expect(component.active.lastPage).toBe(true);
        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([0, 4]);
    });

    it('onQuerySuccess does update active.bars and active.data', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.active.dataField = new FieldMetaData('testDataField');

        component.onQuerySuccess({
            data: [{
                testDataField: 'bar1',
                value: 10
            }, {
                testDataField: 'bar2',
                value: 5
            }, {
                testDataField: 'bar3',
                value: 1
            }, {
                testDataField: 'bar4',
                value: 0
            }]
        });

        let dataset1 = new BarDataSet(4);
        dataset1.label = '';
        dataset1.color = new Color(255, 255, 255);
        dataset1.backgroundColor = ['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)'];
        dataset1.data = [10, 5, 1, 0];

        expect(component.active.bars).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.active.data).toEqual([dataset1]);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 10]);
    });

    it('onQuerySuccess does work with color field', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.active.dataField = new FieldMetaData('testDataField');
        component.active.colorField = new FieldMetaData('testColorField');

        component.onQuerySuccess({
            data: [{
                testColorField: 'group1',
                testDataField: 'bar1',
                value: 400
            }, {
                testColorField: 'group2',
                testDataField: 'bar1',
                value: 300
            }, {
                testColorField: 'group3',
                testDataField: 'bar1',
                value: 200
            }, {
                testColorField: 'group4',
                testDataField: 'bar1',
                value: 100
            }, {
                testColorField: 'group1',
                testDataField: 'bar2',
                value: 40
            }, {
                testColorField: 'group2',
                testDataField: 'bar2',
                value: 30
            }, {
                testColorField: 'group3',
                testDataField: 'bar2',
                value: 20
            }, {
                testColorField: 'group4',
                testDataField: 'bar2',
                value: 10
            }, {
                testColorField: 'group1',
                testDataField: 'bar3',
                value: 4
            }, {
                testColorField: 'group2',
                testDataField: 'bar3',
                value: 3
            }, {
                testColorField: 'group3',
                testDataField: 'bar4',
                value: 2
            }]
        });

        let dataset1 = new BarDataSet(4);
        dataset1.label = 'group1';
        dataset1.color = new Color(31, 120, 180);
        dataset1.backgroundColor = ['rgb(31,120,180)', 'rgb(31,120,180)', 'rgb(31,120,180)', 'rgb(31,120,180)'];
        dataset1.data = [400, 40, 4, 0];
        let dataset2 = new BarDataSet(4);
        dataset2.label = 'group2';
        dataset2.color = new Color(51, 160, 44);
        dataset2.backgroundColor = ['rgb(51,160,44)', 'rgb(51,160,44)', 'rgb(51,160,44)', 'rgb(51,160,44)'];
        dataset2.data = [300, 30, 3, 0];
        let dataset3 = new BarDataSet(4);
        dataset3.label = 'group3';
        dataset3.color = new Color(227, 26, 28);
        dataset3.backgroundColor = ['rgb(227,26,28)', 'rgb(227,26,28)', 'rgb(227,26,28)', 'rgb(227,26,28)'];
        dataset3.data = [200, 20, 0, 2];
        let dataset4 = new BarDataSet(4);
        dataset4.label = 'group4';
        dataset4.color = new Color(255, 127, 0);
        dataset4.backgroundColor = ['rgb(255,127,0)', 'rgb(255,127,0)', 'rgb(255,127,0)', 'rgb(255,127,0)'];
        dataset4.data = [100, 10, 0, 0];

        expect(component.active.bars).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.active.data).toEqual([dataset1, dataset2, dataset3, dataset4]);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 10]);
    });

    it('onQuerySuccess does add seenBars', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.active.dataField = new FieldMetaData('testDataField');
        component.active.seenBars = ['bar2', 'bar3'];

        component.onQuerySuccess({
            data: [{
                testDataField: 'bar1',
                value: 10
            }, {
                testDataField: 'bar2',
                value: 5
            }]
        });

        let dataset1 = new BarDataSet(3);
        dataset1.label = '';
        dataset1.color = new Color(255, 255, 255);
        dataset1.backgroundColor = ['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)'];
        dataset1.data = [10, 5, 0];

        expect(component.active.bars).toEqual(['bar1', 'bar2', 'bar3']);
        expect(component.active.data).toEqual([dataset1]);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 10]);
    });

    it('updateBarChart does update colorFieldNames and chartInfo.data and does call refreshVisualization', () => {
        let dataset1 = new BarDataSet(4);
        dataset1.label = 'segment1';
        dataset1.color = new Color(0, 0, 0);
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];

        component.active.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.active.data = [dataset1];
        component.active.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(0, 4);

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does work with multiple datasets', () => {
        let dataset1 = new BarDataSet(4);
        dataset1.label = 'segment1';
        dataset1.color = new Color(0, 0, 0);
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4);
        dataset2.label = 'segment2';
        dataset2.color = new Color(5, 5, 5);
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.active.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.active.data = [dataset1, dataset2];
        component.active.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(0, 4);

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1, dataset2]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does work with index', () => {
        let dataset1 = new BarDataSet(4);
        dataset1.label = 'segment1';
        dataset1.color = new Color(0, 0, 0);
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4);
        dataset2.label = 'segment2';
        dataset2.color = new Color(5, 5, 5);
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.active.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.active.data = [dataset1, dataset2];
        component.active.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(2, 4);

        dataset1.backgroundColor = ['rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [21, 11];
        dataset2.backgroundColor = ['rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [22, 12];

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar3', 'bar4']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1, dataset2]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does work with limit', () => {
        let dataset1 = new BarDataSet(4);
        dataset1.label = 'segment1';
        dataset1.color = new Color(0, 0, 0);
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4);
        dataset2.label = 'segment2';
        dataset2.color = new Color(5, 5, 5);
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.active.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.active.data = [dataset1, dataset2];
        component.active.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(0, 2);

        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)'];
        dataset1.data = [41, 31];
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)'];
        dataset2.data = [42, 32];

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar1', 'bar2']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1, dataset2]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does work with index and limit', () => {
        let dataset1 = new BarDataSet(4);
        dataset1.label = 'segment1';
        dataset1.color = new Color(0, 0, 0);
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4);
        dataset2.label = 'segment2';
        dataset2.color = new Color(5, 5, 5);
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.active.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.active.data = [dataset1, dataset2];
        component.active.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(1, 2);

        dataset1.backgroundColor = ['rgb(2, 2, 2)', 'rgb(3, 3, 3)'];
        dataset1.data = [31, 21];
        dataset2.backgroundColor = ['rgb(7, 7, 7)', 'rgb(8, 8, 8)'];
        dataset2.data = [32, 22];

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar2', 'bar3']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1, dataset2]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does not change active.bars or data in active.data', () => {
        let dataset1 = new BarDataSet(4);
        dataset1.label = 'segment1';
        dataset1.color = new Color(0, 0, 0);
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4);
        dataset2.label = 'segment2';
        dataset2.color = new Color(5, 5, 5);
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.active.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.active.data = [dataset1, dataset2];

        component.updateBarChart(2, 4);

        expect(component.active.bars).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.active.data.length).toBe(2);
        expect(component.active.data[0].data).toEqual([41, 31, 21, 11]);
        expect(component.active.data[1].data).toEqual([42, 32, 22, 12]);
    });

    it('formatNumber does round numbers and return strings', () => {
        expect(component.formatNumber('foobar')).toBe('foobar');
        expect(component.formatNumber(1)).toBe('1');
        expect(component.formatNumber(1.23456789)).toBe('1.235');
        expect(component.formatNumber('1.23456789')).toBe('1.235');
        expect(component.formatNumber(1234567890)).toBe('1,234,567,890');
        expect(component.formatNumber('1234567890')).toBe('1,234,567,890');
        expect(component.formatNumber(1234.5678)).toBe('1,234');
        expect(component.formatNumber('1234.5678')).toBe('1,234');
    });

    it('nextPage does increase page and does call updatePageData', () => {
        let spy = spyOn(component, 'updatePageData');

        component.active.lastPage = false;
        component.nextPage();
        expect(component.active.page).toBe(2);
        expect(spy.calls.count()).toBe(1);

        component.active.lastPage = false;
        component.nextPage();
        expect(component.active.page).toBe(3);
        expect(spy.calls.count()).toBe(2);
    });

    it('previousPage does decrease page and does call updatePageData', () => {
        let spy = spyOn(component, 'updatePageData');
        component.active.page = 3;

        component.previousPage();
        expect(component.active.page).toBe(2);
        expect(spy.calls.count()).toBe(1);

        component.previousPage();
        expect(component.active.page).toBe(1);
        expect(spy.calls.count()).toBe(2);
    });

    it('updatePageData does update lastPage and does call updateBarChart', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.active.bars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

        component.updatePageData();
        expect(component.active.lastPage).toBe(true);
        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 10]);

        component.active.limit = 4;

        component.updatePageData();
        expect(component.active.lastPage).toBe(false);
        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([0, 4]);

        component.active.page = 2;

        component.updatePageData();
        expect(component.active.lastPage).toBe(false);
        expect(spy.calls.count()).toBe(3);
        expect(spy.calls.argsFor(2)).toEqual([4, 4]);

        component.active.page = 3;

        component.updatePageData();
        expect(component.active.lastPage).toBe(true);
        expect(spy.calls.count()).toBe(4);
        expect(spy.calls.argsFor(3)).toEqual([8, 4]);
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('does not have previous page button if bars < limit', () => {
        fixture.detectChanges();
        let button = fixture.debugElement.query(By.css('.previous-button'));
        expect(button).toBeNull();
    });

    it('does have disabled previous page button if bars > limit and page is 1', async(() => {
        component.active.bars = ['a', 'b', 'c', 'd'];
        component.active.limit = 2;

        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('.previous-button'));
            expect(button).not.toBeNull();
            expect(button.nativeElement.textContent.trim()).toBe('Previous');
            expect(button.nativeElement.disabled).toBe(true);
            expect(button.componentInstance.disabled).toBe(true);
        });
    }));

    it('does have enabled previous page button if bars > limit and page is 2', async(() => {
        component.active.bars = ['a', 'b', 'c', 'd'];
        component.active.limit = 2;
        component.active.page = 2;

        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('.previous-button'));
            expect(button).not.toBeNull();
            expect(button.nativeElement.textContent.trim()).toBe('Previous');
            expect(button.nativeElement.disabled).toBe(false);
            expect(button.componentInstance.disabled).toBe(false);
        });
    }));

    it('does not have next page button if bars < limit', () => {
        fixture.detectChanges();
        let button = fixture.debugElement.query(By.css('.next-button'));
        expect(button).toBeNull();
    });

    it('does have disabled next page button if bars > limit and lastPage is true', async(() => {
        component.active.bars = ['a', 'b', 'c', 'd'];
        component.active.lastPage = true;
        component.active.limit = 2;

        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('.next-button'));
            expect(button).not.toBeNull();
            expect(button.nativeElement.textContent.trim()).toBe('Next');
            expect(button.nativeElement.disabled).toBe(true);
            expect(button.componentInstance.disabled).toBe(true);
        });
    }));

    it('does have enabled next page button if bars > limit and lastPage is false', async(() => {
        component.active.bars = ['a', 'b', 'c', 'd'];
        component.active.lastPage = false;
        component.active.limit = 2;

        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('.next-button'));
            expect(button).not.toBeNull();
            expect(button.nativeElement.textContent.trim()).toBe('Next');
            expect(button.nativeElement.disabled).toBe(false);
            expect(button.componentInstance.disabled).toBe(false);
        });
    }));
});
