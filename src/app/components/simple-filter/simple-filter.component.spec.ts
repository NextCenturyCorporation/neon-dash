/**
 * Copyright 2019 Next Century Corporation
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
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { NeonConfig } from '../../model/types';
import { SimpleFilterComponent } from './simple-filter.component';
import { By } from '@angular/platform-browser';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';

import { SimpleFilterModule } from './simple-filter.module';
import { ConfigService } from '../../services/config.service';

describe('Component: SimpleFilter', () => {
    let component: SimpleFilterComponent;
    let fixture: ComponentFixture<SimpleFilterComponent>;
    let filterService: FilterService;
    let setInput = (input: string) => {
        component.showSimpleSearch = true;
        component['changeDetection'].detectChanges();
        fixture.debugElement.query(By.css('input.simple-filter-input')).nativeElement.value = input;
        fixture.detectChanges();
    };
    let clickSearch = () => {
        fixture.debugElement.query(By.css('.simple-filter')).children[0].triggerEventHandler('click', null);
        fixture.detectChanges();
    };

    initializeTestBed('Simple Filter', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) }
        ],
        imports: [
            SimpleFilterModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SimpleFilterComponent);
        component = fixture.componentInstance;
        filterService = fixture.debugElement.injector.get(FilterService);
        fixture.debugElement.injector.get(DashboardService).state.getOptions().simpleFilter = {
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName
        };
        fixture.detectChanges();
    });

    it('should filter when the user clicks the search icon', () => {
        // Set input.value
        let value = 'add filter with click';
        setInput(value);

        // Find search icon element and click it
        clickSearch();

        // Verify that filter is added to filterService
        let filters = filterService.getFilters();
        expect(filters.length).toEqual(1);
        expect((filters[0] as SimpleFilterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((filters[0] as SimpleFilterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((filters[0] as SimpleFilterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((filters[0] as SimpleFilterDesign).operator).toEqual('contains');
        expect((filters[0] as SimpleFilterDesign).value).toEqual('add filter with click');
    });

    it('should replace filter when one already exists', () => {
        // Set input.value
        let value = 'add filter with click';
        setInput(value);

        // Find search icon element and click it
        clickSearch();

        value = 'replace filter with click';
        setInput(value);
        clickSearch();

        let filters = filterService.getFilters();
        expect(filters.length).toEqual(1);
        expect((filters[0] as SimpleFilterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((filters[0] as SimpleFilterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((filters[0] as SimpleFilterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((filters[0] as SimpleFilterDesign).operator).toEqual('contains');
        expect((filters[0] as SimpleFilterDesign).value).toEqual('replace filter with click');
    });

    it('should filter when the user presses enter', () => {
        // Set input.value
        let value = 'add filter with enter';
        setInput(value);

        // Simulate enter key
        fixture.debugElement.query(By.css('input.simple-filter-input')).triggerEventHandler('keyup.enter', null);

        // Verify that filter is added to filterService
        let filters = filterService.getFilters();
        expect(filters.length).toEqual(1);
        expect((filters[0] as SimpleFilterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((filters[0] as SimpleFilterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((filters[0] as SimpleFilterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect((filters[0] as SimpleFilterDesign).operator).toEqual('contains');
        expect((filters[0] as SimpleFilterDesign).value).toEqual('add filter with enter');
    });

    it('should show close icon when filter has been created', () => {
        // Set input.value
        setInput('filter for showing close icon');

        // Find search icon element and click it
        clickSearch();

        // Verify that close exists
        expect(fixture.debugElement.query(By.css('.simple-filter')).children[2]).toBeTruthy();

        // Should even show if user removes text from input
        setInput('');

        // Verify that close exists
        expect(fixture.debugElement.query(By.css('.simple-filter')).children[2]).toBeTruthy();
    });

    it('should clear the filter if the user clicks the close icon', () => {
        // Set input.value
        setInput('filter for checking close button');

        // Find search icon element and click it
        clickSearch();

        expect(filterService.getFilters().length).toBe(1);

        // Find close icon element and click it
        fixture.debugElement.query(By.css('.simple-filter')).children[2].triggerEventHandler('click', null);
        fixture.detectChanges();

        // Verify that filter is no longer in filterService
        expect(filterService.getFilters().length).toBe(0);
    });

    it('should clear the filter if the user filters on an empty string', () => {
        // Set input.value
        setInput('filter for empty string test');

        // Find search icon element and click it
        clickSearch();

        expect(filterService.getFilters().length).toBe(1);

        // Set input.value to ''
        setInput('');

        // Click search
        clickSearch();

        // Verify that filter is no longer in filterService
        expect(filterService.getFilters().length).toBe(0);
    });
});

describe('Component: SimpleFilter unconfigured', () => {
    let component: SimpleFilterComponent;
    let fixture: ComponentFixture<SimpleFilterComponent>;

    initializeTestBed('Simple Filter', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: DashboardService, useClass: DashboardService },
            FilterService,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) }
        ],
        imports: [
            SimpleFilterModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SimpleFilterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('**should not show in the UI when showSimpleFilter is set to false**', () => {
        expect(fixture.debugElement.query(By.css('.simple-filter'))).toBeFalsy();
    });

    it('Checks Default values', () => {
        expect(component.showSimpleSearch).toEqual(false);
    });
});
