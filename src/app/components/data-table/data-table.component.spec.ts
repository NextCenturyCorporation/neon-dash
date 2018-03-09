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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
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
import { FilterMock } from '../../../testUtils/MockServices/FilterMock';
import { By } from '@angular/platform-browser';
import * as neon from 'neon-framework';

describe('Component: DataTable', () => {
    let component: DataTableComponent,
        fixture: ComponentFixture<DataTableComponent>,
        addFilter = (key: String, value: String, prettyKey: String) => {
            let filter = {
                id: undefined,
                key: key,
                value: value,
                prettyKey: prettyKey
            };
            component.addFilter(filter);
            return filter;
        },
        getDebug = (selector: string) => fixture.debugElement.query(By.css(selector)),
        getService = (type: any) => fixture.debugElement.injector.get(type);

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DataTableComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                { provide: FilterService, useClass: FilterMock },
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
        fixture = TestBed.createComponent(DataTableComponent);
        component = fixture.componentInstance;
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('createClause does return expected object', () => {
        component.active.sortField = new FieldMetaData('testSortField');
        expect(component.createClause()).toEqual(neon.query.where('testSortField', '!=', null));

        component.meta.unsharedFilterField = new FieldMetaData('testFilterField');
        component.meta.unsharedFilterValue = 'testFilterValue';
        expect(component.createClause()).toEqual(neon.query.and(neon.query.where('testSortField', '!=', null),
            neon.query.where('testFilterField', '=', 'testFilterValue')));
    });

    it('getButtonText does return expected string', () => {
        component.active.limit = 10;
        expect(component.getButtonText()).toBe('No Data');
        component.active.docCount = 10;
        expect(component.getButtonText()).toBe('Total 10');
        component.active.docCount = 20;
        expect(component.getButtonText()).toBe('1 - 10 of 20');
        component.active.page = 2;
        expect(component.getButtonText()).toBe('11 - 20 of 20');
        component.active.limit = 5;
        expect(component.getButtonText()).toBe('6 - 10 of 20');
        component.active.docCount = 5;
        expect(component.getButtonText()).toBe('Total 5');
    });

    it('addFilter should add filter', () => {
        addFilter('testDataField', 'Test Value', 'Test Data Field');
        expect(component.getFilterData().length).toBe(1);
        expect(getService(FilterService).getFilters().length).toBe(1);
        //Set another filter. Filter key must be different
        addFilter('testDataField2', 'Test Value2', 'Test Data Field 2');
        expect(getService(FilterService).getFilters().length).toBe(2);
    });

    it('removeFilter should remove filter', () => {
        let filter = addFilter('testDataField', 'Test Value', 'Test Data Field');
        expect(getService(FilterService).getFilters().length).toBe(1);
        component.removeLocalFilterFromLocalAndNeon(filter, true, true);
        expect(getService(FilterService).getFilters().length).toBe(0);
    });

    it('should remove filter when clicked', () => {
        addFilter('testDataField', 'Test Value', 'Test Data Field');
        expect(getService(FilterService).getFilters().length).toBe(1);
        let xEl = getDebug('.filter-reset .mat-icon-button');
        xEl.triggerEventHandler('click', null);
        expect(getService(FilterService).getFilters().length).toBe(0);
    });

    it('filter-reset element should exist if filter is set', () => {
        expect(getDebug('.filter-reset')).toBeNull();
        addFilter('testDataField', 'Test Value', 'Test Data Field');
        expect(getDebug('.filter-reset')).toBeDefined();
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
