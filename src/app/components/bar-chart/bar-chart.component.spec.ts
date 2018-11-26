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
import * as neon from 'neon-framework';

import { BarChartComponent, BarDataSet } from './bar-chart.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FilterService } from '../../services/filter.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonVariables } from '../../neon-namespaces';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { AppMaterialModule } from '../../app.material.module';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';
import { Color } from '../../color';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { WidgetService } from '../../services/widget.service';
import { LegendComponent } from '../legend/legend.component';
import { ChartComponent } from '../chart/chart.component';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: BarChart', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BarChartComponent;
    let fixture: ComponentFixture<BarChartComponent>;

    initializeTestBed({
        declarations: [
            ChartComponent,
            LegendComponent,
            BarChartComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ConnectionService,
            DatasetService,
            FilterService,
            Injector,
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            BrowserAnimationsModule,
            AppMaterialModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BarChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));

    it('does have expected options properties', () => {
        expect(component.options.aggregation).toBe('count');
        expect(component.options.andFilters).toBe(true);
        expect(component.options.ignoreSelf).toBe(true);
        expect(component.options.limit).toBe(10);
        expect(component.options.logScale).toBe(false);
        expect(component.options.scaleManually).toBe(false);
        expect(component.options.scaleMin).toBe('');
        expect(component.options.scaleMax).toBe('');
        expect(component.options.type).toBe('bar');
        expect(component.options.yPercentage).toBe(0.2);

        expect(component.options.aggregationField).toEqual(new FieldMetaData());
        expect(component.options.colorField).toEqual(new FieldMetaData());
        expect(component.options.dataField).toEqual(new FieldMetaData());
    });

    it('does have expected class properties', () => {
        expect(component.labelCount).toBe(0);
        expect(component.labelMax).toBe(0);
        expect(component.lastPage).toBe(true);
        expect(component.page).toBe(1);
        expect(component.minSize).toEqual({
            height: 0,
            width: 0
        });
        expect(component.bars).toEqual([]);
        expect(component.seenBars).toEqual([]);
    });

    it('Checks for expected value from options.getExportFields', (() => {
        component.options.dataField = new FieldMetaData('Test datafield column', 'Test datafield prettyName');
        let expectedObject = [{
            columnName: 'Test datafield column',
            prettyName: 'Test datafield prettyName'
        }, {
            columnName: 'value',
            prettyName: 'Count'
        }];
        expect(component.options.getExportFields()).toEqual(expectedObject);
    }));

    it('Filter Check', (() => {
        expect(component.getCloseableFilters()).toEqual([]);
    }));

    it('Checks for expected query from createQuery', (() => {
        let spyQuerySuccess = spyOn(component, 'onQuerySuccess');
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.table = new TableMetaData('testTable');
        component.options.dataField = new FieldMetaData('Test datafield column', 'Test datafield prettyName');
        let groupBy: any[] = ['Test datafield column'];

        let query = new neon.query.Query().selectFrom('testDatabase', 'testTable');

        let whereClauses = [
            neon.query.where('Test datafield column', '!=', null)
        ];

        query.where(neon.query.and.apply(query, whereClauses));

        query.groupBy(groupBy).aggregate(neonVariables.COUNT, '*', 'value')
            .sortBy('value', neonVariables.DESCENDING);

        expect(component.createQuery()).toEqual(query);
        expect(spyQuerySuccess.calls.count()).toBe(0);
    }));

    it('Tests expects return from isValidQuery', (() => {
        expect(component.isValidQuery()).toEqual('');
    }));

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toBe('No Data');
        component.bars = ['a'];
        expect(component.getButtonText()).toBe('Total 1');

        component.bars = ['a', 'b'];
        component.options.limit = 10;
        expect(component.getButtonText()).toBe('Total 2');
        component.options.limit = 1;
        expect(component.getButtonText()).toBe('1 of 2');

        component.bars = ['a', 'b', 'c', 'd'];
        component.options.limit = 10;
        expect(component.getButtonText()).toBe('Total 4');
        component.options.limit = 4;
        expect(component.getButtonText()).toBe('Total 4');
        component.options.limit = 2;
        expect(component.getButtonText()).toBe('1 - 2 of 4');
        component.page = 2;
        expect(component.getButtonText()).toBe('3 - 4 of 4');
    });

    it('handleChangeLimit does update limit and seenBars and does call logChangeAndStartQueryChain', () => {
        let spy = spyOn(component, 'logChangeAndStartQueryChain');

        component.options.newLimit = 1234;
        component.seenBars = ['a', 'b', 'c', 'd'];

        component.handleChangeLimit();
        expect(component.options.limit).toEqual(1234);
        expect(component.seenBars).toEqual([]);
        expect(spy.calls.count()).toBe(1);

        component.options.newLimit = 0;

        component.handleChangeLimit();
        expect(component.options.limit).toEqual(1234);
        expect(component.options.newLimit).toEqual(1234);
        expect(component.seenBars).toEqual([]);
        expect(spy.calls.count()).toBe(1);
    });

    it('handleChangeData does update seenBars and does call logChangeAndStartQueryChain', () => {
        let spy = spyOn(component, 'logChangeAndStartQueryChain');
        component.seenBars = ['a', 'b', 'c', 'd'];
        component.handleChangeData();
        expect(component.seenBars).toEqual([]);
        expect(spy.calls.count()).toBe(1);
    });

    it('onClick does call add functions if filters is an empty array', () => {
        component.options.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        let spy2 = spyOn(component, 'addNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');
        let spy4 = spyOn(component, 'replaceNeonFilter');
        let spy5 = spyOn(component, 'refreshVisualization');

        component.onClick({}, [{
            _model: {
                label: 'testFilter'
            }
        }]);

        expect(component.getCloseableFilters()).toEqual([{
            id: undefined,
            field: 'testDataField',
            value: 'testFilter',
            prettyField: 'Test Data Field',
            operator: '='
        }]);
        expect(spy2.calls.count()).toBe(1);
        expect(spy2.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            field: 'testDataField',
            value: 'testFilter',
            prettyField: 'Test Data Field',
            operator: '='
        }, neon.query.where('testDataField', '=', 'testFilter')]);
        expect(spy3.calls.count()).toBe(0);
        expect(spy4.calls.count()).toBe(0);
        expect(spy5.calls.count()).toBe(1);
    });

    it('onClick does change filters and does call replace function if filters is not an empty array and filter does match', () => {
        component.options.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        component.addLocalFilter({
            id: 1,
            field: 'otherField',
            value: 'otherValue'
        });
        let spy2 = spyOn(component, 'addNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');
        let spy4 = spyOn(component, 'replaceNeonFilter');
        let spy5 = spyOn(component, 'refreshVisualization');

        component.onClick({}, [{
            _model: {
                label: 'testFilter'
            }
        }]);

        expect(component.getCloseableFilters()).toEqual([{
            id: 1,
            field: 'testDataField',
            value: 'testFilter',
            prettyField: 'Test Data Field',
            operator: '='
        }]);
        expect(spy2.calls.count()).toBe(0);
        expect(spy3.calls.count()).toBe(0);
        expect(spy4.calls.count()).toBe(1);
        expect(spy4.calls.argsFor(0)).toEqual([true, {
            id: 1,
            field: 'testDataField',
            value: 'testFilter',
            prettyField: 'Test Data Field',
            operator: '='
        }, neon.query.where('testDataField', '=', 'testFilter')]);
        expect(spy5.calls.count()).toBe(1);
    });

    it('onClick does call remove and add functions if filters is not an empty array and filter does not match', () => {
        let filter1 = {
            id: 1,
            field: 'otherField1',
            value: 'otherValue1'
        };
        let filter2 = {
            id: 2,
            field: 'otherField2',
            value: 'otherValue2'
        };

        component.options.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        component.addLocalFilter(filter1);
        component.addLocalFilter(filter2);

        let spy2 = spyOn(component, 'addNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');
        let spy4 = spyOn(component, 'replaceNeonFilter');
        let spy5 = spyOn(component, 'refreshVisualization');

        component.onClick({}, [{
            _model: {
                label: 'testFilter'
            }
        }]);

        expect(component.getCloseableFilters()).toEqual([filter1, filter2]);
        expect(spy2.calls.count()).toBe(0);
        expect(spy3.calls.count()).toBe(1);
        expect(spy4.calls.count()).toBe(0);
        expect(spy5.calls.count()).toBe(1);

        component.removeFilter(filter1);
        component.removeFilter(filter2);

        // Call the callback function for removeAllFilters.  It should call addNeonFilter.
        let args = spy3.calls.argsFor(0);
        expect(args[0]).toEqual([filter1, filter2]);
        expect(typeof args[1]).toBe('function');
        args[1]();

        expect(component.getCloseableFilters()).toEqual([{
            id: undefined,
            field: 'testDataField',
            value: 'testFilter',
            prettyField: 'Test Data Field',
            operator: '='
        }]);
        expect(spy2.calls.count()).toBe(1);
        expect(spy2.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            field: 'testDataField',
            value: 'testFilter',
            prettyField: 'Test Data Field',
            operator: '='
        }, neon.query.where('testDataField', '=', 'testFilter')]);
    });

    it('onClick only uses first input element', () => {
        component.options.dataField = new FieldMetaData('testDataField', 'Test Data Field');
        let spy2 = spyOn(component, 'addNeonFilter');
        let spy3 = spyOn(component, 'removeAllFilters');
        let spy4 = spyOn(component, 'replaceNeonFilter');
        let spy5 = spyOn(component, 'refreshVisualization');

        component.onClick({}, [{
            _model: {
                label: 'testFilter'
            }
        }, {
            _model: {
                label: 'testFilterThatShouldBeUnused'
            }
        }]);

        expect(component.getCloseableFilters()).toEqual([{
            id: undefined,
            field: 'testDataField',
            value: 'testFilter',
            prettyField: 'Test Data Field',
            operator: '='
        }]);
        expect(spy2.calls.count()).toBe(1);
        expect(spy2.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            field: 'testDataField',
            value: 'testFilter',
            prettyField: 'Test Data Field',
            operator: '='
        }, neon.query.where('testDataField', '=', 'testFilter')]);
        expect(spy3.calls.count()).toBe(0);
        expect(spy4.calls.count()).toBe(0);
        expect(spy5.calls.count()).toBe(1);
    });

    it('refreshVisualization does not change dataset colors if no filters are set', () => {
        let activeData = new BarDataSet(4, 'group1', new Color(255, 255, 255), new Color(0, 0, 0));
        activeData.data = [10, 5, 1, 0];
        expect(activeData.backgroundColor).toEqual(['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)']);
        expect(activeData.hoverBackgroundColor).toEqual(['rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)']);

        component.activeData = [activeData];

        component.refreshVisualization();

        expect(component.selectedLabels).toEqual([]);
        expect(activeData.backgroundColor).toEqual(['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)']);
        expect(activeData.hoverBackgroundColor).toEqual(['rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)']);
        expect(component.activeData[0].backgroundColor).toEqual(['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)',
            'rgb(255,255,255)']);
    });

    it('refreshVisualization does change dataset colors and selectedLabels if filters are set', () => {
        let activeData = new BarDataSet(4, 'group1', new Color(255, 255, 255), new Color(0, 0, 0));
        activeData.data = [10, 5, 1, 0];

        let barChartData = new BarDataSet(4, 'group1', new Color(255, 255, 255), new Color(0, 0, 0));
        barChartData.data = [10, 5, 1, 0];

        component.activeData = [activeData];
        component.chartInfo.data.labels = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.chartInfo.data.datasets = [barChartData];
        component.addLocalFilter({
            id: undefined,
            field: 'testDataField',
            value: 'bar2',
            prettyField: 'Test Data Field',
            operator: '='
        });

        component.refreshVisualization();

        expect(component.selectedLabels).toEqual(['group1']);
        expect(activeData.backgroundColor).toEqual(['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)']);
        expect(activeData.hoverBackgroundColor).toEqual(['rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)']);
        expect(component.chartInfo.data.datasets[0].backgroundColor).toEqual(['rgba(255,255,255,0.2)', 'rgb(255,255,255)',
            'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)']);
    });

    it('onQuerySuccess does update page and lastPage and does call updateBarChart', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.options.dataField = new FieldMetaData('testDataField');
        component.options.limit = 2;
        component.page = 2;
        component.lastPage = true;

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

        expect(component.page).toBe(1);
        expect(component.lastPage).toBe(false);
        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 2]);

        component.options.limit = 4;
        component.page = 2;

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

        expect(component.page).toBe(1);
        expect(component.lastPage).toBe(true);
        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([0, 4]);
    });

    it('onQuerySuccess does update bars and activeData', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.options.dataField = new FieldMetaData('testDataField');

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

        let dataset1 = new BarDataSet(4, '', new Color(255, 255, 255), new Color(255, 255, 255));
        dataset1.data = [10, 5, 1, 0];

        expect(component.bars).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.activeData).toEqual([dataset1]);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 10]);
    });

    it('onQuerySuccess does work with color field', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.options.dataField = new FieldMetaData('testDataField');
        component.options.colorField = new FieldMetaData('testColorField');

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

        let dataset1 = new BarDataSet(4, 'group1', new Color(255, 135, 55), new Color(255, 255, 255));
        dataset1.data = [400, 40, 4, 0];
        expect(dataset1.backgroundColor).toEqual(['rgb(255,135,55)', 'rgb(255,135,55)', 'rgb(255,135,55)', 'rgb(255,135,55)']);

        let dataset2 = new BarDataSet(4, 'group2', new Color(94, 80, 143), new Color(255, 255, 255));
        dataset2.data = [300, 30, 3, 0];
        expect(dataset2.backgroundColor).toEqual(['rgb(94,80,143)', 'rgb(94,80,143)', 'rgb(94,80,143)', 'rgb(94,80,143)']);

        let dataset3 = new BarDataSet(4, 'group3', new Color(177, 194, 54), new Color(255, 255, 255));
        dataset3.data = [200, 20, 0, 2];
        expect(dataset3.backgroundColor).toEqual(['rgb(177,194,54)', 'rgb(177,194,54)', 'rgb(177,194,54)', 'rgb(177,194,54)']);

        let dataset4 = new BarDataSet(4, 'group4', new Color(243, 88, 112), new Color(255, 255, 255));
        dataset4.data = [100, 10, 0, 0];
        expect(dataset4.backgroundColor).toEqual(['rgb(243,88,112)', 'rgb(243,88,112)', 'rgb(243,88,112)', 'rgb(243,88,112)']);

        expect(component.bars).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.activeData).toEqual([dataset1, dataset2, dataset3, dataset4]);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 10]);
    });

    it('onQuerySuccess does add seenBars', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.options.dataField = new FieldMetaData('testDataField');
        component.seenBars = ['bar2', 'bar3'];

        component.onQuerySuccess({
            data: [{
                testDataField: 'bar1',
                value: 10
            }, {
                testDataField: 'bar2',
                value: 5
            }]
        });

        let dataset1 = new BarDataSet(3, '', new Color(255, 255, 255), new Color(255, 255, 255));
        dataset1.data = [10, 5, 0];

        expect(component.bars).toEqual(['bar1', 'bar2', 'bar3']);
        expect(component.activeData).toEqual([dataset1]);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 10]);
    });

    it('updateBarChart does update colorFieldNames and chartInfo.data and does call refreshVisualization', () => {
        let dataset1 = new BarDataSet(4, 'segment1', new Color(0, 0, 0), new Color(255, 255, 255));
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];

        component.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.activeData = [dataset1];
        component.options.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(0, 4);

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does work with multiple datasets', () => {
        let dataset1 = new BarDataSet(4, 'segment1', new Color(0, 0, 0), new Color(255, 255, 255));
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4, 'segment2', new Color(5, 5, 5), new Color(255, 255, 255));
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.activeData = [dataset1, dataset2];
        component.options.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(0, 4);

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1, dataset2]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does work with index', () => {
        let dataset1 = new BarDataSet(4, 'segment1', new Color(0, 0, 0), new Color(255, 255, 255));
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4, 'segment2', new Color(5, 5, 5), new Color(255, 255, 255));
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.activeData = [dataset1, dataset2];
        component.options.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(2, 4);

        dataset1.backgroundColor = ['rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.hoverBackgroundColor = ['rgb(255,255,255)', 'rgb(255,255,255)'];
        dataset1.data = [21, 11];
        dataset2.backgroundColor = ['rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.hoverBackgroundColor = ['rgb(255,255,255)', 'rgb(255,255,255)'];
        dataset2.data = [22, 12];

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar3', 'bar4']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1, dataset2]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does work with limit', () => {
        let dataset1 = new BarDataSet(4, 'segment1', new Color(0, 0, 0), new Color(255, 255, 255));
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4, 'segment2', new Color(5, 5, 5), new Color(255, 255, 255));
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.activeData = [dataset1, dataset2];
        component.options.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(0, 2);

        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)'];
        dataset1.hoverBackgroundColor = ['rgb(255,255,255)', 'rgb(255,255,255)'];
        dataset1.data = [41, 31];
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)'];
        dataset2.hoverBackgroundColor = ['rgb(255,255,255)', 'rgb(255,255,255)'];
        dataset2.data = [42, 32];

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar1', 'bar2']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1, dataset2]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does work with index and limit', () => {
        let dataset1 = new BarDataSet(4, 'segment1', new Color(0, 0, 0), new Color(255, 255, 255));
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4, 'segment2', new Color(5, 5, 5), new Color(255, 255, 255));
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.activeData = [dataset1, dataset2];
        component.options.colorField = new FieldMetaData('testColorField');
        let spy = spyOn(component, 'refreshVisualization');

        component.updateBarChart(1, 2);

        dataset1.backgroundColor = ['rgb(2, 2, 2)', 'rgb(3, 3, 3)'];
        dataset1.hoverBackgroundColor = ['rgb(255,255,255)', 'rgb(255,255,255)'];
        dataset1.data = [31, 21];
        dataset2.backgroundColor = ['rgb(7, 7, 7)', 'rgb(8, 8, 8)'];
        dataset2.hoverBackgroundColor = ['rgb(255,255,255)', 'rgb(255,255,255)'];
        dataset2.data = [32, 22];

        expect(component.colorFieldNames).toEqual(['testColorField']);
        expect(component.chartInfo.data.labels).toEqual(['bar2', 'bar3']);
        expect(component.chartInfo.data.datasets).toEqual([dataset1, dataset2]);
        expect(spy.calls.count()).toBe(1);
    });

    it('updateBarChart does not change bars or data in activeData', () => {
        let dataset1 = new BarDataSet(4, 'segment1', new Color(0, 0, 0), new Color(255, 255, 255));
        dataset1.backgroundColor = ['rgb(1, 1, 1)', 'rgb(2, 2, 2)', 'rgb(3, 3, 3)', 'rgb(4, 4, 4)'];
        dataset1.data = [41, 31, 21, 11];
        let dataset2 = new BarDataSet(4, 'segment2', new Color(5, 5, 5), new Color(255, 255, 255));
        dataset2.backgroundColor = ['rgb(6, 6, 6)', 'rgb(7, 7, 7)', 'rgb(8, 8, 8)', 'rgb(9, 9, 9)'];
        dataset2.data = [42, 32, 22, 12];

        component.bars = ['bar1', 'bar2', 'bar3', 'bar4'];
        component.activeData = [dataset1, dataset2];

        component.updateBarChart(2, 4);

        expect(component.bars).toEqual(['bar1', 'bar2', 'bar3', 'bar4']);
        expect(component.activeData.length).toBe(2);
        expect(component.activeData[0].data).toEqual([41, 31, 21, 11]);
        expect(component.activeData[1].data).toEqual([42, 32, 22, 12]);
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

        component.lastPage = false;
        component.nextPage();
        expect(component.page).toBe(2);
        expect(spy.calls.count()).toBe(1);

        component.lastPage = false;
        component.nextPage();
        expect(component.page).toBe(3);
        expect(spy.calls.count()).toBe(2);
    });

    it('previousPage does decrease page and does call updatePageData', () => {
        let spy = spyOn(component, 'updatePageData');
        component.page = 3;

        component.previousPage();
        expect(component.page).toBe(2);
        expect(spy.calls.count()).toBe(1);

        component.previousPage();
        expect(component.page).toBe(1);
        expect(spy.calls.count()).toBe(2);
    });

    it('updatePageData does update lastPage and does call updateBarChart', () => {
        let spy = spyOn(component, 'updateBarChart');
        component.bars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

        component.updatePageData();
        expect(component.lastPage).toBe(true);
        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, 10]);

        component.options.limit = 4;

        component.updatePageData();
        expect(component.lastPage).toBe(false);
        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([0, 4]);

        component.page = 2;

        component.updatePageData();
        expect(component.lastPage).toBe(false);
        expect(spy.calls.count()).toBe(3);
        expect(spy.calls.argsFor(2)).toEqual([4, 4]);

        component.page = 3;

        component.updatePageData();
        expect(component.lastPage).toBe(true);
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
        component.bars = ['a', 'b', 'c', 'd'];
        component.options.limit = 2;

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
        component.bars = ['a', 'b', 'c', 'd'];
        component.options.limit = 2;
        component.page = 2;

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
        component.bars = ['a', 'b', 'c', 'd'];
        component.lastPage = true;
        component.options.limit = 2;

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
        component.bars = ['a', 'b', 'c', 'd'];
        component.lastPage = false;
        component.options.limit = 2;

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

    it('subOnResizeStop with options.type=horizontalBar does update minSize', () => {
        component.options.type = 'horizontalBar';

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 20,
            width: 40
        });

        component.bars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
        component.labelCount = 8;
        component.options.limit = 12;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 200,
            width: 240
        });

        component.options.limit = 6;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 110,
            width: 240
        });

        component.labelCount = 4;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 110,
            width: 140
        });

        component.bars = ['a', 'b'];

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 50,
            width: 140
        });
    });

    it('subOnResizeStop with options.type=bar does update minSize', () => {
        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 20,
            width: 40
        });

        component.bars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
        component.labelCount = 8;
        component.options.limit = 12;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 140,
            width: 340
        });

        component.options.limit = 6;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 140,
            width: 190
        });

        component.labelCount = 4;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 80,
            width: 190
        });

        component.bars = ['a', 'b'];

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 80,
            width: 90
        });
    });

    it('subOnResizeStop with options.type=horizontalBar does update minSize', () => {
        component.options.type = 'horizontalBar';

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 20,
            width: 40
        });

        component.bars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
        component.labelCount = 8;
        component.options.limit = 12;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 200,
            width: 240
        });

        component.options.limit = 6;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 110,
            width: 240
        });

        component.labelCount = 4;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 110,
            width: 140
        });

        component.bars = ['a', 'b'];

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 50,
            width: 140
        });
    });

    it('subOnResizeStop with options.type=bar does update minSize', () => {
        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 20,
            width: 40
        });

        component.bars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
        component.labelCount = 8;
        component.options.limit = 12;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 140,
            width: 340
        });

        component.options.limit = 6;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 140,
            width: 190
        });

        component.labelCount = 4;

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 80,
            width: 190
        });

        component.bars = ['a', 'b'];

        component.subOnResizeStop();
        expect(component.minSize).toEqual({
            height: 80,
            width: 90
        });
    });
});
