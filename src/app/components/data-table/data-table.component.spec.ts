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
import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import {} from 'jasmine-core';

import { NeonGTDConfig } from '../../neon-gtd-config';
import { DataTableComponent } from './data-table.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { FilterService } from '../../services/filter.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { ThemesService } from '../../services/themes.service';
import { TranslationService } from '../../services/translation.service';
import { VisualizationService } from '../../services/visualization.service';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { By } from '@angular/platform-browser';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: DataTable', () => {
    let component: DataTableComponent,
        fixture: ComponentFixture<DataTableComponent>,
        getDebug = (selector: string) => fixture.debugElement.query(By.css(selector)),
        getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            DataTableComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            DatasetService,
            { provide: FilterService, useClass: FilterServiceMock },
            ExportService,
            TranslationService,
            ErrorNotificationService,
            VisualizationService,
            ThemesService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            NgxDatatableModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DataTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('createClause does return expected object', () => {
        component.options.sortField = new FieldMetaData('testSortField');
        expect(component.createClause()).toEqual(neon.query.where('testSortField', '!=', null));

        component.options.unsharedFilterField = new FieldMetaData('testFilterField');
        component.options.unsharedFilterValue = 'testFilterValue';
        expect(component.createClause()).toEqual(neon.query.and(neon.query.where('testSortField', '!=', null),
            neon.query.where('testFilterField', '=', 'testFilterValue')));
    });

    it('getButtonText does return expected string', () => {
        component.options.limit = 10;
        expect(component.getButtonText()).toBe('No Data');
        component.docCount = 10;
        expect(component.getButtonText()).toBe('Total 10');
        component.docCount = 20;
        expect(component.getButtonText()).toBe('1 - 10 of 20');
        component.page = 2;
        expect(component.getButtonText()).toBe('11 - 20 of 20');
        component.options.limit = 5;
        expect(component.getButtonText()).toBe('6 - 10 of 20');
        component.docCount = 5;
        expect(component.getButtonText()).toBe('Total 5');
    });

    it('addFilter should add filter', () => {
        let filter1 = {
            id: undefined,
            field: 'testDataField',
            prettyField: 'Test Data Field',
            value: 'Test Value'
        };

        component.addFilter(filter1, neon.query.where('testDataField', '=', 'Test Value'));

        expect(component.getCloseableFilters().length).toBe(1);
        expect(getService(FilterService).getFilters().length).toBe(1);

        //Set another filter. Filter key must be different
        let filter2 = {
            id: undefined,
            field: 'testDataField2',
            prettyField: 'Test Data Field 2',
            value: 'Test Value 2'
        };

        component.addFilter(filter2, neon.query.where('testDataField2', '=', 'Test Value 2'));
        expect(getService(FilterService).getFilters().length).toBe(2);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('removeFilter should remove filter', () => {
        let filter1 = {
            id: undefined,
            field: 'testDataField',
            prettyField: 'Test Data Field',
            value: 'Test Value'
        };

        component.addFilter(filter1, neon.query.where('testDataField', '=', 'Test Value'));

        expect(getService(FilterService).getFilters().length).toBe(1);
        component.removeLocalFilterFromLocalAndNeon(filter1, true, true);
        expect(getService(FilterService).getFilters().length).toBe(0);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('should remove filter when clicked', () => {
        let filter1 = {
            id: undefined,
            field: 'testDataField',
            prettyField: 'Test Data Field',
            value: 'Test Value'
        };

        component.addFilter(filter1, neon.query.where('testDataField', '=', 'Test Value'));

        expect(getService(FilterService).getFilters().length).toBe(1);
        let xEl = getDebug('.datatable-filter-reset .mat-icon-button');
        xEl.triggerEventHandler('click', null);
        expect(getService(FilterService).getFilters().length).toBe(0);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('filter-reset element should exist if filter is set', () => {
        expect(getDebug('.datatablefilter-reset')).toBeNull();

        let filter1 = {
            id: undefined,
            field: 'testDataField',
            prettyField: 'Test Data Field',
            value: 'Test Value'
        };

        component.addFilter(filter1, neon.query.where('testDataField', '=', 'Test Value'));

        expect(getDebug('.datatable-filter-reset')).toBeDefined();
    });

    it('no filter-reset elements should exist if filter is not set', () => {
        expect(component.getCloseableFilters().length).toBe(0);
        expect(getDebug('.filter-reset')).toBeNull();
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });
});
