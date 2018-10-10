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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {} from 'jasmine-core';

import { SampleComponent, SampleOptions } from './sample.component';
import { AbstractSubcomponent, SubcomponentListener } from './subcomponent.abstract';
import { SubcomponentImpl1 } from './subcomponent.impl1';
import { SubcomponentImpl2 } from './subcomponent.impl2';
import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

// Must define the test component.
@Component({
        selector: 'app-test-sample',
        templateUrl: './sample.component.html',
        styleUrls: ['./sample.component.scss'],
        encapsulation: ViewEncapsulation.Emulated,
        changeDetection: ChangeDetectionStrategy.OnPush
})

class TestSampleComponent extends SampleComponent {
    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService
    ) {

        super(
            activeGridService,
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            ref,
            visualizationService
        );
    }

    // TODO Add any needed custom functions here.
}

// TODO Create a test implementation of your subcomponent so you can test its behavior.

/* tslint:disable:component-class-suffix */
class TestSubcomponent extends AbstractSubcomponent {
    buildElements(elementRef: ElementRef) {
        // TODO
    }

    destroyElements() {
        // TODO
    }

    updateData(data: any[]) {
        // TODO
    }
}
/* tslint:enable:component-class-suffix */

describe('Component: Sample', () => {
    let component: TestSampleComponent;
    let fixture: ComponentFixture<TestSampleComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            TestSampleComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            ErrorNotificationService,
            ExportService,
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService,
            VisualizationService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestSampleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class options properties are set to expected defaults', () => {
        expect(component.options.sampleOptionalField).toEqual(component.emptyField);
        expect(component.options.sampleRequiredField).toEqual(component.emptyField);
        expect(component.options.sortDescending).toEqual(false);
        expect(component.options.subcomponentType).toEqual('Impl1');
        expect(component.options.subcomponentTypes).toEqual(['Impl1', 'Impl2']);
    });

    it('class properties are set to expected defaults', () => {
        expect(component.activeData).toEqual([]);
        expect(component.docCount).toEqual(0);
        expect(component.filters).toEqual([]);
        expect(component.lastPage).toEqual(true);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([]);

        // Element Refs
        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.subcomponentElementRef).toBeDefined();
        expect(component.visualization).toBeDefined();

        // Subcomponent
        expect(component.subcomponentObject.constructor.name).toEqual(SubcomponentImpl1.name);
    });

    it('addVisualizationFilter does update filters', () => {
        component.addVisualizationFilter({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);

        component.addVisualizationFilter({
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
    });

    it('addVisualizationFilter does update filters if the ID of the given filter and the ID of an existing filter are matching', () => {
        component.addVisualizationFilter({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        component.addVisualizationFilter({
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
    });

    it('createQuery does return expected query', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        expect(component.createQuery()).toEqual(new neon.query.Query()
            .selectFrom(component.options.database.name, component.options.table.name)
            .where(neon.query.where('testRequiredField1', '!=', null)).groupBy(['testRequiredField1'])
            .aggregate(neonVariables.COUNT, '*', 'count').sortBy('count', neonVariables.DESCENDING));
    });

    it('createQuery does return expected query with sampleOptionalField', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        component.options.sampleOptionalField = new FieldMetaData('testOptionalField1', 'Test Optional Field 1');

        let wherePredicate = neon.query.and.apply(neon.query, [
            neon.query.where('testRequiredField1', '!=', null),
            neon.query.where('testOptionalField1', '!=', null)
        ]);

        expect(component.createQuery()).toEqual(new neon.query.Query()
            .selectFrom(component.options.database.name, component.options.table.name).where(wherePredicate)
            .groupBy(['testRequiredField1', 'testOptionalField1']).aggregate(neonVariables.COUNT, '*', 'count')
            .sortBy('count', neonVariables.DESCENDING));
    });

    it('createVisualizationFilter does return expected filter object', () => {
        expect(component.createVisualizationFilter('idA', 'field1', 'prettyField1', 'value1')).toEqual({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });
    });

    it('createWhere does return expected where predicate', () => {
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        expect(component.createWhere()).toEqual(neon.query.where('testRequiredField1', '!=', null));
    });

    it('createWhere does return expected where predicate with sampleOptionalField, config filter, and unshared filter', () => {
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        component.options.sampleOptionalField = new FieldMetaData('testOptionalField1', 'Test Optional Field 1');
        component.options.filter = {
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        };
        component.options.unsharedFilterField = new FieldMetaData('testUnsharedFilterField', 'Test Unshared Filter Field');
        component.options.unsharedFilterValue = 'testUnsharedFilterValue';

        expect(component.createWhere()).toEqual(neon.query.and.apply(neon.query, [
            neon.query.where('testRequiredField1', '!=', null),
            neon.query.where('testOptionalField1', '!=', null),
            neon.query.where('testConfigFilterField', '=', 'testConfigFilterValue'),
            neon.query.where('testUnsharedFilterField', '=', 'testUnsharedFilterValue')
        ]));
    });

    it('filterFromSubcomponent does call filterOnItem', () => {
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        let spy = spyOn(component, 'filterOnItem');

        component.filterFromSubcomponent('testInput');
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([{
            field: 'testRequiredField1',
            prettyField: 'Test Required Field 1',
            value: 'testInput'
        }]);
    });

    it('filterOnItem does add new filter to empty array and call addNeonFilter', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        let spy = spyOn(component, 'addNeonFilter');

        component.filterOnItem({
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });
        expect(component.filters).toEqual([{
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, neon.query.where('field1', '=', 'value1')]);
    });

    it('filterOnItem does add new filter to non-empty array and call addNeonFilter', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.filters = [{
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }];
        let spy = spyOn(component, 'addNeonFilter');

        component.filterOnItem({
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });
        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }, {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, neon.query.where('field1', '=', 'value1')]);
    });

    it('filterOnItem does not add new filter or call addNeonFilter if matching filter exists', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.filters = [{
            id: 'idB',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];
        let spy = spyOn(component, 'addNeonFilter');

        component.filterOnItem({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });
        expect(component.filters).toEqual([{
            id: 'idB',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
        expect(spy.calls.count()).toEqual(0);
    });

    it('filterOnItem with replaceAll does add new filter to empty array and call addNeonFilter', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        let spy = spyOn(component, 'addNeonFilter');

        component.filterOnItem({
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, true);
        expect(component.filters).toEqual([{
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, neon.query.where('field1', '=', 'value1')]);
    });

    it('filterOnItem with replaceAll does replace existing filter in single element array and call replaceNeonFilter', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.filters = [{
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        let spy = spyOn(component, 'replaceNeonFilter');
        component.filterOnItem({
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, true);

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, {
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, neon.query.where('field1', '=', 'value1')]);
    });

    it('filterOnItem with replaceAll and a multiple element array and call removeAllFilters', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.filters = [{
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }, {
            id: 'idC',
            field: 'field3',
            prettyField: 'prettyField3',
            value: 'value3'
        }];
        let spy = spyOn(component, 'removeAllFilters');

        component.filterOnItem({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, true);
        expect(spy.calls.count()).toEqual(1);
        let args = spy.calls.argsFor(0);
        expect(args[0]).toEqual([{
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }, {
            id: 'idC',
            field: 'field3',
            prettyField: 'prettyField3',
            value: 'value3'
        }]);

        // Run the callback.
        spy = spyOn(component, 'addNeonFilter');
        expect(typeof args[1]).toEqual('function');
        args[1]();
        expect(component.filters).toEqual([{
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, neon.query.where('field1', '=', 'value1')]);
    });

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toEqual('No Data');

        component.options.limit = 1;
        component.activeData = [{}];
        component.responseData = [{}, {}];
        expect(component.getButtonText()).toEqual('1 of 2');

        component.activeData = [{}, {}];
        expect(component.getButtonText()).toEqual('Total 2');

        component.responseData = [{}, {}, {}, {}];
        expect(component.getButtonText()).toEqual('1 of 4');

        component.options.limit = 2;
        expect(component.getButtonText()).toEqual('1 - 2 of 4');

        component.page = 2;
        expect(component.getButtonText()).toEqual('3 - 4 of 4');
    });

    it('getCloseableFilters does return expected array of filters', () => {
        expect(component.getCloseableFilters()).toEqual([]);

        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.getCloseableFilters()).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getExportFields does return expected array', () => {
        expect(component.getExportFields()).toEqual([{
            columnName: '',
            prettyName: ''
        }, {
            columnName: '',
            prettyName: ''
        }]);

        component.options.sampleOptionalField = new FieldMetaData('testOptionalField1', 'Test Optional Field 1');
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        expect(component.getExportFields()).toEqual([{
            columnName: 'testOptionalField1',
            prettyName: 'Test Optional Field 1'
        }, {
            columnName: 'testRequiredField1',
            prettyName: 'Test Required Field 1'
        }]);
    });

    it('getFiltersToIgnore does return null if no filters are set', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        expect(component.getFiltersToIgnore()).toEqual(null);
    });

    it('getFiltersToIgnore does return expected array of IDs if filters are set matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testRequiredField1', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFiltersToIgnore does return null if no filters are set matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testRequiredField1', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField2', 'Test Required Field 2');

        // Test matching database/table but not field.
        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        // Test matching database/field but not table.
        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[1];

        // Test matching table/field but not database.
        expect(component.getFiltersToIgnore()).toEqual(null);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('getFilterText does return expected string', () => {
        expect(component.getFilterText({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        })).toEqual('prettyField1 = value1');
    });

    it('getOptions does return options', () => {
        expect(component.getOptions()).toEqual(component.options);
    });

    it('goToNextPage does not update page or call updateActiveData if lastPage is true', () => {
        let spy = spyOn(component, 'updateActiveData');
        component.goToNextPage();

        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(0);
    });

    it('goToNextPage does update page and call updateActiveData if lastPage is false', () => {
        let spy = spyOn(component, 'updateActiveData');
        component.lastPage = false;

        component.goToNextPage();
        expect(component.page).toEqual(2);
        expect(spy.calls.count()).toEqual(1);

        component.goToNextPage();
        expect(component.page).toEqual(3);
        expect(spy.calls.count()).toEqual(2);
    });

    it('goToPreviousPage does not update page or call updateActiveData if page is 1', () => {
        let spy = spyOn(component, 'updateActiveData');
        component.goToPreviousPage();

        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(0);
    });

    it('goToPreviousPage does update page and call updateActiveData if page is not 1', () => {
        let spy = spyOn(component, 'updateActiveData');
        component.page = 3;

        component.goToPreviousPage();
        expect(component.page).toEqual(2);
        expect(spy.calls.count()).toEqual(1);

        component.goToPreviousPage();
        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(2);
    });

    it('handleChangeData does work as expected', () => {
        // TODO Update if you override handleChangeData with custom behavior for the visualization.  Otherwise delete this test.
    });

    it('handleChangeSubcomponentType does update subcomponentType and call expected functions', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'handleChangeData');
        let spy3 = spyOn(component.subcomponentObject, 'destroyElements');

        component.handleChangeSubcomponentType('Impl2');

        expect(component.options.subcomponentType).toEqual('Impl2');
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy3.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does not call expected functions if new type equals subcomponentType', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'handleChangeData');
        let spy3 = spyOn(component.subcomponentObject, 'destroyElements');

        component.handleChangeSubcomponentType('Impl1');

        expect(component.options.subcomponentType).toEqual('Impl1');
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('initializeSubcomponent does update subcomponentObject', () => {
        component.subcomponentObject = null;
        component.initializeSubcomponent();
        expect(component.subcomponentObject.constructor.name).toEqual(SubcomponentImpl1.name);
    });

    it('isValidQuery does return expected boolean', () => {
        expect(component.isValidQuery()).toEqual(false);

        component.options.database = DatasetServiceMock.DATABASES[0];
        expect(component.isValidQuery()).toEqual(false);

        component.options.table = DatasetServiceMock.TABLES[0];
        expect(component.isValidQuery()).toEqual(false);

        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        expect(component.isValidQuery()).toEqual(true);
    });

    it('isVisualizationFilterUnique does return expected boolean', () => {
        expect(component.isVisualizationFilterUnique('field1', 'value1')).toEqual(true);

        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.isVisualizationFilterUnique('field1', 'value1')).toEqual(false);
        expect(component.isVisualizationFilterUnique('field2', 'value1')).toEqual(true);
        expect(component.isVisualizationFilterUnique('field1', 'value2')).toEqual(true);
    });

    it('onQuerySuccess with aggregation query data does update expected properties and call expected functions', () => {
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        component.page = 2;
        let spy1 = spyOn(component, 'updateActiveData');
        let spy2 = spyOn(component, 'runDocCountQuery');

        component.onQuerySuccess({
            data: [{
                count: 2,
                testRequiredField1: 'a'
            }, {
                count: 1,
                testRequiredField1: 'z'
            }]
        });
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            count: 2,
            field: 'testRequiredField1',
            label: 'a',
            prettyField: 'Test Required Field 1',
            value: 'a'
        }, {
            count: 1,
            field: 'testRequiredField1',
            label: 'z',
            prettyField: 'Test Required Field 1',
            value: 'z'
        }]);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with empty aggregation query data does update expected properties and call expected functions', () => {
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        component.page = 2;
        let spy1 = spyOn(component, 'updateActiveData');
        let spy2 = spyOn(component, 'runDocCountQuery');

        component.onQuerySuccess({
            data: []
        });
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([]);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('onQuerySuccess with aggregation query data and optional field does update expected properties and call expected functions', () => {
        component.options.sampleOptionalField = new FieldMetaData('testOptionalField1', 'Test Optional Field 1');
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        component.page = 2;
        let spy1 = spyOn(component, 'updateActiveData');
        let spy2 = spyOn(component, 'runDocCountQuery');

        component.onQuerySuccess({
            data: [{
                count: 2,
                testOptionalField1: 'alpha',
                testRequiredField1: 'a'
            }, {
                count: 1,
                testOptionalField1: 'omega',
                testRequiredField1: 'z'
            }]
        });
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([{
            count: 2,
            field: 'testRequiredField1',
            label: 'a - alpha',
            prettyField: 'Test Required Field 1',
            value: 'a'
        }, {
            count: 1,
            field: 'testRequiredField1',
            label: 'z - omega',
            prettyField: 'Test Required Field 1',
            value: 'z'
        }]);
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
    });

    it('onQuerySuccess with document count query data does update docCount', () => {
        let spy1 = spyOn(component, 'updateActiveData');
        let spy2 = spyOn(component, 'runDocCountQuery');

        component.onQuerySuccess({
            data: [{
                _docCount: 1234
            }]
        });
        expect(component.docCount).toEqual(1234);
        expect(component.responseData).toEqual([]);
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
    });

    it('postInit does work as expected', () => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(spy.calls.count()).toEqual(1);
    });

    it('refreshVisualization does call subcomponentObject.updateData', () => {
        let spy = spyOn(component.subcomponentObject, 'updateData');

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[]]);

        component.activeData = [{}, {}];
        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{}, {}]]);
    });

    it('removeFilter does remove objects from filters', () => {
        let filter1 = {
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        };
        let filter2 = {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        };
        component.filters = [filter1, filter2];

        component.removeFilter(filter1);
        expect(component.filters).toEqual([filter2]);

        component.removeFilter(filter2);
        expect(component.filters).toEqual([]);
    });

    it('removeFilter does not remove objects from filters with non-matching IDs', () => {
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        component.removeFilter({
            id: 'idC',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });
        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
    });

    it('runDocCountQuery does call executeQuery', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        let spy = spyOn(component, 'executeQuery');

        component.runDocCountQuery();
        expect(spy.calls.count()).toEqual(1);
        let query = new neon.query.Query().selectFrom('testDatabase1', 'testTable1')
            .where(neon.query.where('testRequiredField1', '!=', null)).aggregate(neonVariables.COUNT, '*', '_docCount');
        expect(spy.calls.argsFor(0)).toEqual([query]);
    });

    it('runDocCountQuery does add ignoreFilters to query', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testRequiredField1', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = [new FieldMetaData('testRequiredField1', 'Test Required Field 1')];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        let spy = spyOn(component, 'executeQuery');

        component.runDocCountQuery();
        expect(spy.calls.count()).toEqual(1);
        let query = new neon.query.Query().selectFrom('testDatabase1', 'testTable1')
            .where(neon.query.where('testRequiredField1', '!=', null)).ignoreFilters(['testDatabase1-testTable1-testFilterName1'])
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        expect(spy.calls.argsFor(0)).toEqual([query]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does not do anything if no filter exists', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = [new FieldMetaData('testRequiredField1', 'Test Required Field 1')];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        component.setupFilters();
        expect(component.filters).toEqual([]);
    });

    it('setupFilters does add neon filter to filters', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testRequiredField1', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = [new FieldMetaData('testRequiredField1', 'Test Required Field 1')];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testRequiredField1',
            prettyField: 'Test Required Field 1',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does not add neon filter with non-matching database/table/field', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testRequiredField1', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = [new FieldMetaData('testRequiredField1', 'Test Required Field 1'),
            new FieldMetaData('testRequiredField2', 'Test Required Field 2')];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField2', 'Test Required Field 2');

        // Test matching database/table but not field.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        // Test matching database/field but not table.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[1];

        // Test matching table/field but not table.
        component.setupFilters();
        expect(component.filters).toEqual([]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does not add neon filter matching existing filter field/value', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testRequiredField1', '=', 'value1'), 'testFilterName1');

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testRequiredField1', '=', 'value1'), 'testFilterName2');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = [new FieldMetaData('testRequiredField1', 'Test Required Field 1')];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testRequiredField1',
            prettyField: 'Test Required Field 1',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does remove previous filters', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testRequiredField1', '=', 'value1'), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = [new FieldMetaData('testRequiredField1', 'Test Required Field 1')];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        component.filters = [{
            id: 'idA',
            field: 'testRequiredField1',
            prettyField: 'Test Required Field 1',
            value: 'value2'
        }];

        component.setupFilters();
        expect(component.filters).toEqual([{
            id: 'testDatabase1-testTable1-testFilterName1',
            field: 'testRequiredField1',
            prettyField: 'Test Required Field 1',
            value: 'value1'
        }]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('setupFilters does ignore neon filters with multiple clauses', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.and.apply(neon.query, [
                neon.query.where('testRequiredField1', '=', 'value1'),
                neon.query.where('testRequiredField1', '=', 'value2')
            ]), 'testFilterName2');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = [new FieldMetaData('testRequiredField1', 'Test Required Field 1'),
            new FieldMetaData('testRequiredField2', 'Test Required Field 2')];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField2', 'Test Required Field 2');

        component.setupFilters();
        expect(component.filters).toEqual([]);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('showFilterContainer does return expected boolean', () => {
        expect(component.showFilterContainer()).toEqual(false);

        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.showFilterContainer()).toEqual(true);
    });

    it('showFooterContainer does return expected boolean', () => {
        expect(component.showFooterContainer()).toEqual(false);

        component.activeData = [{}];
        component.responseData = [{}, {}];

        expect(component.showFooterContainer()).toEqual(true);
    });

    it('subGetBindings does set expected properties in bindings', () => {
        let bindings1 = {};
        component.subGetBindings(bindings1);
        expect(bindings1).toEqual({
            sampleOptionalField: '',
            sampleRequiredField: '',
            sortDescending: false,
            subcomponentType: 'Impl1'
        });

        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        component.options.sampleOptionalField = new FieldMetaData('testOptionalField1', 'Test Optional Field 1');
        component.options.sortDescending = true;
        component.options.subcomponentType = 'Impl2';

        let bindings2 = {};
        component.subGetBindings(bindings2);
        expect(bindings2).toEqual({
            sampleOptionalField: 'testOptionalField1',
            sampleRequiredField: 'testRequiredField1',
            sortDescending: true,
            subcomponentType: 'Impl2'
        });
    });

    it('subHandleChangeLimit does work as expected', () => {
        // TODO Update if you override subHandleChangeLimit with custom behavior for the visualization.  Otherwise delete this test.
    });

    it('subNgOnDestroy does work as expected', () => {
        let spy = spyOn(component.subcomponentObject, 'destroyElements');

        component.subNgOnDestroy();
        expect(spy.calls.count()).toEqual(1);
    });

    it('subNgOnInit does work as expected', () => {
        let spy = spyOn(component, 'initializeSubcomponent');

        component.subNgOnInit();
        expect(spy.calls.count()).toEqual(1);
    });

    it('subOnResizeStop does work as expected', () => {
        let spy = spyOn(component.subcomponentObject, 'redraw');

        component.subOnResizeStop();
        expect(spy.calls.count()).toEqual(1);
    });

    it('updateActiveData does update activeData and lastPage from responseData, page, and limit and call refreshVisualization', () => {
        component.options.limit = 2;
        component.page = 1;
        component.responseData = [{}, {}, {}];
        let spy = spyOn(component, 'refreshVisualization');

        component.updateActiveData();
        expect(component.activeData).toEqual([{}, {}]);
        expect(component.lastPage).toEqual(false);
        expect(spy.calls.count()).toEqual(1);
    });

    it('updateActiveData does set lastPage to true if on last page', () => {
        component.options.limit = 2;
        component.page = 2;
        component.responseData = [{}, {}, {}];
        let spy = spyOn(component, 'refreshVisualization');

        component.updateActiveData();
        expect(component.activeData).toEqual([{}]);
        expect(component.lastPage).toEqual(true);
        expect(spy.calls.count()).toEqual(1);
    });

    it('options.onInit does set non-field options as expected', () => {
        component.options.onInit();
        expect(component.options.subcomponentType).toEqual('Impl1');
    });

    it('options.updateFieldsOnTableChanged does set field options as expected', () => {
        component.options.updateFieldsOnTableChanged();
        expect(component.options.sampleOptionalField).toEqual(component.emptyField);
        expect(component.options.sampleRequiredField).toEqual(component.emptyField);
    });

    it('does show toolbar and sidenav and body-container', () => {
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let sidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav'));
        expect(sidenav).not.toBeNull();
        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container'));
        expect(bodyContainer).not.toBeNull();
    });

    it('does show header in toolbar with visualization title', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Sample');
    });

    it('does show data-info and hide error-message in toolbar and sidenav if errorMessage is undefined', () => {
        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).not.toBeNull();
        expect(dataInfoTextInToolbar.nativeElement.textContent).toContain('No Data');

        let dataInfoIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info mat-icon'));
        expect(dataInfoIconInSidenav).not.toBeNull();
        expect(dataInfoIconInSidenav.nativeElement.textContent).toEqual('info');

        let dataInfoTextInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info span'));
        expect(dataInfoTextInSidenav).not.toBeNull();
        expect(dataInfoTextInSidenav.nativeElement.textContent).toContain('No Data');

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();

        let errorIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
        expect(errorIconInSidenav).toBeNull();

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
        expect(errorMessageInSidenav).toBeNull();
    });

    it('does show error-message in toolbar and sidenav if errorMessage is defined', async(() => {
        component.errorMessage = 'Test Error Message';

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .data-info'));
            expect(dataInfoTextInToolbar).toBeNull();

            let dataInfoIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info mat-icon'));
            expect(dataInfoIconInSidenav).not.toBeNull();
            expect(dataInfoIconInSidenav.nativeElement.textContent).toEqual('info');

            let dataInfoTextInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info span'));
            expect(dataInfoTextInSidenav).not.toBeNull();
            expect(dataInfoTextInSidenav.nativeElement.textContent).toContain('No Data');

            let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
            expect(errorMessageInToolbar).not.toBeNull();
            expect(errorMessageInToolbar.nativeElement.textContent).toContain('Test Error Message');

            let errorIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
            expect(errorIconInSidenav).not.toBeNull();
            expect(errorIconInSidenav.nativeElement.textContent).toEqual('error');

            let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
            expect(errorMessageInSidenav).not.toBeNull();
            expect(errorMessageInSidenav.nativeElement.textContent).toContain('Test Error Message');
        });
    }));

    it('does show settings icon button in toolbar', () => {
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toEqual('settings');
    });

    it('does show sidenav options menu', () => {
        let menu = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card'));
        expect(menu).not.toBeNull();

        let content = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content'));
        expect(content).not.toBeNull();
    });

    it('does show elements in sidenav options menu that have expected options', async(() => {
        // Force the component to update all its selected elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toEqual(3); // The final input is in the unshared filter.

            // Title Input
            expect(inputs[0].attributes.placeholder).toBe('Title');
            expect(inputs[0].nativeElement.value).toContain('Sample');

            // Limit Input
            expect(inputs[1].attributes.placeholder).toBe('Sample Limit');
            expect(inputs[1].nativeElement.value).toContain('10');

            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toEqual(6); // The final select is in the unshared filter.
            let options;

            // Database Dropdown
            expect(selects[0].componentInstance.disabled).toEqual(false);
            expect(selects[0].componentInstance.placeholder).toEqual('Database');
            expect(selects[0].componentInstance.required).toEqual(true);
            options = selects[0].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Database 1');
            expect(options[0].selected).toEqual(true);
            expect(options[1].getLabel()).toEqual('Test Database 2');
            expect(options[1].selected).toEqual(false);

            // Table Dropdown
            expect(selects[1].componentInstance.disabled).toEqual(false);
            expect(selects[1].componentInstance.placeholder).toEqual('Table');
            expect(selects[1].componentInstance.required).toEqual(true);
            options = selects[1].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Table 1');
            expect(options[0].selected).toEqual(true);
            expect(options[1].getLabel()).toEqual('Test Table 2');
            expect(options[1].selected).toEqual(false);

            // Sample Required Field Dropdown
            expect(selects[2].componentInstance.disabled).toEqual(false);
            expect(selects[2].componentInstance.placeholder).toEqual('Sample Required Field');
            expect(selects[2].componentInstance.required).toEqual(true);
            options = selects[2].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length);
            // Normally you shouldn't use a loop to test elements in an array but the FIELDS are updated for use by many visualizations.
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i].selected).toEqual(false);
            }

            // Sample Optional Field Dropdown
            expect(selects[3].componentInstance.disabled).toEqual(false);
            expect(selects[3].componentInstance.placeholder).toEqual('Sample Optional Field');
            expect(selects[3].componentInstance.required).toEqual(false);
            options = selects[3].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            // Check for the empty field!
            expect(options[0].getLabel()).toEqual('(None)');
            // Normally you shouldn't use a loop to test elements in an array but the FIELDS are updated for use by many visualizations.
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(false);
            }

            // Subcomponent Type Dropdown
            expect(selects[4].componentInstance.disabled).toEqual(false);
            expect(selects[4].componentInstance.placeholder).toEqual('Subcomponent Type');
            expect(selects[4].componentInstance.required).toEqual(true);
            options = selects[4].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Impl1');
            expect(options[1].getLabel()).toEqual('Impl2');

            let toggles = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-button-toggle'));
            expect(toggles.length).toEqual(2);

            expect(toggles[0].componentInstance.value).toEqual(false);
            expect(toggles[0].nativeElement.textContent).toContain('Ascending');
            expect(toggles[0].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);

            expect(toggles[1].componentInstance.value).toEqual(true);
            expect(toggles[1].nativeElement.textContent).toContain('Descending');
            expect(toggles[1].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);
        });
    }));

    it('does show unshared filter in sidenav options menu', () => {
        let unsharedFilter = fixture.debugElement.query(By.css(
            'mat-sidenav-container mat-sidenav mat-card mat-card-content app-unshared-filter'));
        expect(unsharedFilter).not.toBeNull();
        expect(unsharedFilter.componentInstance.meta).toEqual(component.options);
        expect(unsharedFilter.componentInstance.unsharedFilterChanged).toBeDefined();
        expect(unsharedFilter.componentInstance.unsharedFilterRemoved).toBeDefined();
    });

    it('does show export control in sidenav options menu', () => {
        let exportControl = fixture.debugElement.query(By.css(
            'mat-sidenav-container mat-sidenav mat-card mat-card-content app-export-control'));
        expect(exportControl).not.toBeNull();
        expect(exportControl.componentInstance.exportId).toEqual(component.exportId);
    });

    it('does hide loading overlay by default', () => {
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    });

    it('does show loading overlay if isLoading is true', async(() => {
        component.isLoading = true;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
            expect(loadingOverlay).not.toBeNull();

            let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
            expect(spinner).not.toBeNull();
        });
    }));

    it('does not show filter-container if filters is empty array', () => {
        let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
        expect(filterContainer).toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
        expect(bodyContainer).toBeNull();
    });

    it('does show filter-container and filter-reset elements if filters is non-empty array', async(() => {
        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }];

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let filterContainer = fixture.debugElement.query(By.css('mat-sidenav-container .filter-container'));
            expect(filterContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-filter'));
            expect(bodyContainer).not.toBeNull();

            let filterResets = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container .filter-reset'));
            expect(filterResets.length).toEqual(2);

            let filterLabels = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container .filter-label'));
            expect(filterLabels.length).toEqual(2);

            expect(filterLabels[0].nativeElement.textContent).toContain('value1');
            expect(filterLabels[1].nativeElement.textContent).toContain('value2');

            let filterButtons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container button'));
            expect(filterButtons.length).toEqual(2);

            let filterIcons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .filter-container button mat-icon'));
            expect(filterIcons.length).toEqual(2);

            expect(filterIcons[0].nativeElement.textContent).toEqual('close');
            expect(filterIcons[1].nativeElement.textContent).toEqual('close');
        });
    }));

    it('does show doc-count', async(() => {
        let docCount = fixture.debugElement.query(By.css('mat-sidenav-container .body-container .doc-count'));
        expect(docCount).not.toBeNull();
        expect(docCount.nativeElement.textContent).toContain('Total Document Count: 0');
        component.docCount = 1234;

        // Force the component to update all its elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            docCount = fixture.debugElement.query(By.css('mat-sidenav-container .body-container .doc-count'));
            expect(docCount).not.toBeNull();
            expect(docCount.nativeElement.textContent).toContain('Total Document Count: 1234');
        });
    }));

    it('does not show data-item elements if activeData is empty array', () => {
        let dataItems = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item'));
        expect(dataItems.length).toEqual(0);
    });

    it('does show data-item elements if activeData is non-empty array', async(() => {
        component.activeData = [{
            count: 2,
            label: 'alpha',
            value: 'a'
        }, {
            count: 1,
            label: 'omega',
            value: 'z'
        }];

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let dataItems = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item'));
            expect(dataItems.length).toEqual(2);

            let dataItemLabels = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item .text'));
            expect(dataItemLabels.length).toEqual(2);

            expect(dataItemLabels[0].nativeElement.textContent).toContain('alpha: 2');
            expect(dataItemLabels[1].nativeElement.textContent).toContain('omega: 1');

            let dataItemButtons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item button'));
            expect(dataItemButtons.length).toEqual(4);

            let dataItemIcons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item mat-icon'));
            expect(dataItemIcons.length).toEqual(4);

            expect(dataItemIcons[0].nativeElement.textContent).toEqual('search');
            expect(dataItemIcons[1].nativeElement.textContent).toEqual('find_replace');
            expect(dataItemIcons[2].nativeElement.textContent).toEqual('search');
            expect(dataItemIcons[3].nativeElement.textContent).toEqual('find_replace');
        });
    }));

    it('does show empty chart-container', () => {
        let chartContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container .chart-container'));
        expect(chartContainer).not.toBeNull();

        // TODO Add custom behavior here to test your subcomponent.
    });

    it('does show non-empty chart-container if ...', () => {
        let chartContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container .chart-container'));
        expect(chartContainer).not.toBeNull();

        // TODO Add custom behavior here to test your subcomponent.
    });

    it('does not show footer-container or pagination-button elements if activeData.length === responseData.length', () => {
        let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
        expect(footerContainer).toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
        expect(bodyContainer).toBeNull();
    });

    it('does show footer-container and pagination-button elements if activeData.length < responseData.length (first page)', async(() => {
        component.activeData = [{}];
        component.responseData = [{}, {}, {}];
        component.lastPage = false;
        component.page = 1;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
            expect(footerContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
            expect(bodyContainer).not.toBeNull();

            let footerButtons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .footer .footer-button-container .pagination-button'));
            expect(footerButtons.length).toEqual(2);

            expect(footerButtons[0].componentInstance.disabled).toEqual(true);
            expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

            expect(footerButtons[1].componentInstance.disabled).toEqual(false);
            expect(footerButtons[1].nativeElement.textContent).toContain('Next');
        });
    }));

    it('does show footer-container and pagination-button elements if activeData.length < responseData.length (middle page)', async(() => {
        component.activeData = [{}];
        component.responseData = [{}, {}, {}];
        component.lastPage = false;
        component.page = 2;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
            expect(footerContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
            expect(bodyContainer).not.toBeNull();

            let footerButtons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .footer .footer-button-container .pagination-button'));
            expect(footerButtons.length).toEqual(2);

            expect(footerButtons[0].componentInstance.disabled).toEqual(false);
            expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

            expect(footerButtons[1].componentInstance.disabled).toEqual(false);
            expect(footerButtons[1].nativeElement.textContent).toContain('Next');
        });
    }));

    it('does show footer-container and pagination-button elements if activeData.length < responseData.length (last page)', async(() => {
        component.activeData = [{}];
        component.responseData = [{}, {}, {}];
        component.lastPage = true;
        component.page = 3;

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let footerContainer = fixture.debugElement.query(By.css('mat-sidenav-container .footer'));
            expect(footerContainer).not.toBeNull();

            let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container.with-footer'));
            expect(bodyContainer).not.toBeNull();

            let footerButtons = fixture.debugElement.queryAll(By.css(
                'mat-sidenav-container .footer .footer-button-container .pagination-button'));
            expect(footerButtons.length).toEqual(2);

            expect(footerButtons[0].componentInstance.disabled).toEqual(false);
            expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

            expect(footerButtons[1].componentInstance.disabled).toEqual(true);
            expect(footerButtons[1].nativeElement.textContent).toContain('Next');
        });
    }));
});

describe('Component: Sample with config', () => {
    let component: TestSampleComponent;
    let fixture: ComponentFixture<TestSampleComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            TestSampleComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            ErrorNotificationService,
            ExportService,
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService,
            VisualizationService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'configFilter', useValue: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'tableKey', useValue: 'table_key_2' },
            { provide: 'limit', useValue: 1234 },
            { provide: 'sampleOptionalField', useValue: 'testNameField' },
            { provide: 'sampleRequiredField', useValue: 'testCategoryField' },
            { provide: 'sortDescending', useValue: true },
            { provide: 'subcomponentType', useValue: 'Impl2' },
            { provide: 'title', useValue: 'Test Title' }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestSampleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('superclass options properties are set to expected values from config', () => {
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.limit).toEqual(1234);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.filter).toEqual({
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        });
    });

    it('class options properties are set to expected values from config', () => {
        expect(component.options.sampleOptionalField).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.options.sampleRequiredField).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(component.options.sortDescending).toEqual(true);
        expect(component.options.subcomponentType).toEqual('Impl2');
        expect(component.options.subcomponentTypes).toEqual(['Impl1', 'Impl2']);
        expect(component.subcomponentObject.constructor.name).toEqual(SubcomponentImpl2.name);
    });

    it('options.onInit does set non-field options as expected from config bindings', () => {
        component.options.sortDescending = false;
        component.options.subcomponentType = 'Impl1';

        component.options.onInit();
        expect(component.options.sortDescending).toEqual(true);
        expect(component.options.subcomponentType).toEqual('Impl2');
    });

    it('options.updateFieldsOnTableChanged does set field options as expected from config bindings', () => {
        component.options.sampleOptionalField = component.emptyField;
        component.options.sampleRequiredField = component.emptyField;

        component.options.updateFieldsOnTableChanged();
        expect(component.options.sampleOptionalField).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.options.sampleRequiredField).toEqual(DatasetServiceMock.CATEGORY_FIELD);
    });

    it('does show header in toolbar with visualization title from config', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });

    it('does show elements in sidenav options menu that have expected options', async(() => {
        // Force the component to update all its selected elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toEqual(3); // The final input is in the unshared filter.

            // Title Input
            expect(inputs[0].attributes.placeholder).toBe('Title');
            expect(inputs[0].nativeElement.value).toContain('Test Title');

            // Limit Input
            expect(inputs[1].attributes.placeholder).toBe('Sample Limit');
            expect(inputs[1].nativeElement.value).toContain('1234');

            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toEqual(6); // The final select is in the unshared filter.
            let options;

            // Database Dropdown
            expect(selects[0].componentInstance.disabled).toEqual(false);
            expect(selects[0].componentInstance.placeholder).toEqual('Database');
            expect(selects[0].componentInstance.required).toEqual(true);
            options = selects[0].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Database 1');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Test Database 2');
            expect(options[1].selected).toEqual(true);

            // Table Dropdown
            expect(selects[1].componentInstance.disabled).toEqual(false);
            expect(selects[1].componentInstance.placeholder).toEqual('Table');
            expect(selects[1].componentInstance.required).toEqual(true);
            options = selects[1].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Table 1');
            expect(options[0].selected).toEqual(false);
            expect(options[1].getLabel()).toEqual('Test Table 2');
            expect(options[1].selected).toEqual(true);

            // Sample Required Field Dropdown
            expect(selects[2].componentInstance.disabled).toEqual(false);
            expect(selects[2].componentInstance.placeholder).toEqual('Sample Required Field');
            expect(selects[2].componentInstance.required).toEqual(true);
            options = selects[2].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length);
            // Normally you shouldn't use a loop to test elements in an array but the FIELDS are updated for use by many visualizations.
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testCategoryField');
            }

            // Sample Optional Field Dropdown
            expect(selects[3].componentInstance.disabled).toEqual(false);
            expect(selects[3].componentInstance.placeholder).toEqual('Sample Optional Field');
            expect(selects[3].componentInstance.required).toEqual(false);
            options = selects[3].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            // Check for the empty field!
            expect(options[0].getLabel()).toEqual('(None)');
            // Normally you shouldn't use a loop to test elements in an array but the FIELDS are updated for use by many visualizations.
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testNameField');
            }

            // Subcomponent Type Dropdown
            expect(selects[4].componentInstance.disabled).toEqual(false);
            expect(selects[4].componentInstance.placeholder).toEqual('Subcomponent Type');
            expect(selects[4].componentInstance.required).toEqual(true);
            options = selects[4].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Impl1');
            expect(options[1].getLabel()).toEqual('Impl2');

            let toggles = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-button-toggle'));
            expect(toggles.length).toEqual(2);

            expect(toggles[0].componentInstance.value).toEqual(false);
            expect(toggles[0].nativeElement.textContent).toContain('Ascending');
            expect(toggles[0].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(false);

            expect(toggles[1].componentInstance.value).toEqual(true);
            expect(toggles[1].nativeElement.textContent).toContain('Descending');
            expect(toggles[1].nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(true);
        });
    }));
});
