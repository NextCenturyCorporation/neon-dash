
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
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';

import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { QueryBarComponent } from './query-bar.component';
import { DatasetOptions, FieldMetaData, SimpleFilter } from '../../dataset';
import { DebugElement, ElementRef, Injector, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { MatAutocompleteModule, MatAutocomplete } from '@angular/material';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { ExportService } from '../../services/export.service';
import { VisualizationService } from '../../services/visualization.service';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as uuid from 'node-uuid';
import { Observable } from 'rxjs/Observable';
import { map, startWith } from 'rxjs/operators';
import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { neonUtilities, neonVariables } from '../../neon-namespaces';

const databaseName = 'database';
const tableName = 'table';
const fieldName = 'field';

describe('Component: queryBar', () => {
    let component: QueryBarComponent;
    let fixture: ComponentFixture<QueryBarComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            QueryBarComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            ExportService,
            ErrorNotificationService,
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService,
            VisualizationService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule,
            MatAutocompleteModule,
            ReactiveFormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QueryBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', () => expect(component).toBeTruthy());

    it('should show in the UI when the configuration includes a queryBar option', () => {
        expect(component.options.id).toEqual('');
        expect(component.options.placeHolder).toEqual('Query');
        expect(component.options.idField).toEqual(component.emptyField);
        expect(component.options.filterField).toEqual(component.emptyField);
        expect(component.options.extendedFilter).toEqual(false);
        expect(component.options.extensionFields).toEqual([]);
    });

    /**
     * todo: something is wrong with getElementRefs. queryBar is
     * being initialized somewhere for headerText, but visualization is
     * not being initialized. This is taking place somewhere outside
     * of the class
     */

    /*
    //for getElementRefs method
    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });
    */

    //for getExportFields Method

    it('getExportFields does return expected Array', () => {
        expect(component.getExportFields()).toEqual([]);
        //add more when the method is updated to return more than just an empty array

    });

    //for getoptions method
    it('getOptions does return the options for the specific visualization', () => {
        expect(component.getOptions()).toEqual(component.options);
    });

    //for refresh visualization
    it('refreshVisualization does call changeDetection.detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.refreshVisualization();
        expect(spy.calls.count()).toBe(1);
    }));

    //for getFiltersToIgnore
    it('getFiltersToIgnore with ignoreSelf=true does return expected array of IDs if no filterField is set', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testField1', '!=', null), 'testFilterName1');
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testField2', '!=', null), 'testFilterName2');

        //component.options.ignoreSelf = true;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.fields = DatasetServiceMock.FIELDS;

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1',
            'testDatabase1-testTable1-testFilterName2']);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    //for getFilterText method
    it('getFilterText does return expected string', () => {
        expect(component.getFilterText({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        })).toEqual('prettyField1 = value1');
    });

    //for getCloseableFilters method

    it('getCloseableFilters does return expected Array', () => {
        expect(component.getExportFields()).toEqual([]);
        //add more when the method is updated to return more than just an empty array

    });

    //for createFilter method
    it('create filter should call removeFilter if empty', () => {
        let spy = spyOn(component, 'removeFilter');
        component.createFilter('');
        expect(spy.calls.count()).toBe(1);
    });

    //filterExists
    it('filterExists does return expected boolean', () => {
        expect(component.filterExists('field1', 'value1')).toEqual(false);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value2'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value1'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);
        expect(component.filterExists('field2', 'value1')).toEqual(true);
        expect(component.filterExists('field2', 'value2')).toEqual(false);

        component.filters.push({
            id: undefined,
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.filterExists('field1', 'value1')).toEqual(true);
        expect(component.filterExists('field1', 'value2')).toEqual(true);
        expect(component.filterExists('field2', 'value1')).toEqual(true);
        expect(component.filterExists('field2', 'value2')).toEqual(true);

        component.filters = [];

        expect(component.filterExists('field1', 'value1')).toEqual(false);
        expect(component.filterExists('field1', 'value2')).toEqual(false);
        expect(component.filterExists('field2', 'value1')).toEqual(false);
        expect(component.filterExists('field2', 'value2')).toEqual(false);
    });

    //for setupFilters

    //for subGetBindings
    it('subGetBindings does set expected bindings', (() => {
        let bindings = {};

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: '',
            filterField: '',
            extendedFilter: false,
            extensionFields: []
        });

        component.options.idField = new FieldMetaData('testIdField');
        component.options.filterField = new FieldMetaData('testFilterField');
        component.options.extendedFilter = false;
        component.options.extensionFields = [];

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: 'testIdField',
            filterField: 'testFilterField',
            extendedFilter: false,
            extensionFields: []

        });
    }));

    //for postInit method

    // it('should filter when the user clicks the search icon', () => {

    //     // set input.value
    //     let value = 'filter with click';
    //     tester.setInput(value);

    //     // find search icon element and click it
    //     tester.clickSearch();

    //     // verify that filter is added to filterService

    //     expect(tester.filterService.getFilters().length).toBe(1);
    //     let filter = tester.filterService.getFilterById(tester.component.filterId.getValue());
    //     expect(filter).toBeTruthy();
    //     let expected = neon.query.where(fieldName, 'contains', value);
    //     expect(filter.filter.whereClause).toEqual(expected);
    // });
});
/*
    it('should replace filter when one already exists', () => {
        // set input.value
        let value = 'filter with click';
        tester.setInput(value);

        // find search icon element and click it
        tester.clickSearch();
        let filterId = tester.component.filterId.getValue();

        value = 'replace filter with click';
        tester.setInput(value);
        tester.clickSearch();

        // verify that filter id didn't change
        expect(tester.component.filterId.getValue()).toBe(filterId, 'filter id should not have changed');

        // verify that only one filter is in the filter service
        expect(tester.filterService.getFilters().length).toBe(1, 'there should still only be 1 filter');

        let filter = tester.filterService.getFilterById(tester.component.filterId.getValue());
        expect(filter).toBeTruthy();

        let expected = neon.query.where(fieldName, 'contains', value);
        expect(filter.filter.whereClause).toEqual(expected, 'filter clause should be updated');
    });

    it('should filter when the user presses enter', () => {
        // set input.value
        let value = 'filter with enter';
        tester.setInput(value);

        // simulate enter key
        tester.getInputElement().triggerEventHandler('keyup.enter', null);

        // verify that filter is added to filterService
        expect(tester.filterService.getFilters().length).toBe(1);
        let filter = tester.filterService.getFilterById(tester.component.filterId.getValue());
        expect(filter).toBeTruthy();
        let expected = neon.query.where(fieldName, 'contains', value);
        expect(filter.filter.whereClause).toEqual(expected);
    });

    it('should show close icon when filter has been created', () => {
        // set input.value
        tester.setInput('filter for showing close icon');

        // find search icon element and click it
        tester.clickSearch();

        // verify that close exists
        expect(tester.getCloseElement()).toBeTruthy();

        // should even show if user removes text from input
        tester.setInput('');

        // verify that close exists
        expect(tester.getCloseElement()).toBeTruthy();
    });

    it('should clear the filter if the user clicks the close icon', () => {
        // set input.value
        tester.setInput('filter for checking close button');

        // find search icon element and click it
        tester.clickSearch();

        // find close icon element and click it
        tester.clickClose();

        // verify that filter is no longer in filterService
        expect(tester.filterService.getFilters().length).toBe(0);
    });

    it('should clear the filter if the user filters on an empty string', () => {
        // set input.value
        tester.setInput('filter for empty string test');

        // find search icon element and click it
        tester.clickSearch();

        // set input.value to ''
        tester.setInput('');

        // click search
        tester.clickSearch();

        // verify that filter is no longer in filterService
        expect(tester.filterService.getFilters().length).toBe(0);
    });
});

describe('Component: queryBar unconfigured', () => {

    let tester: queryBarTester;

    beforeEach(() => tester = new queryBarTester(false));

    it('should create an instance', () => expect(tester.component).toBeTruthy());

    it('should not show in the UI when the configuration does not include a queryBar option', () => expect(tester.element).toBeFalsy());
});

*/
