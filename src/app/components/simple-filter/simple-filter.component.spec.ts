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

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { SimpleFilterComponent } from './simple-filter.component';
import { DashboardOptions, SimpleFilter } from '../../dataset';
import {
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    Component,
    DebugElement
} from '@angular/core';
import { By } from '@angular/platform-browser';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';

import { SimpleFilterModule } from './simple-filter.module';
import { ConfigService } from '../../services/config.service';

describe('Component: SimpleFilter', () => {
    let component: SimpleFilterComponent;
    let fixture: ComponentFixture<SimpleFilterComponent>;
    let filterService: FilterService;
    let searchService: AbstractSearchService;
    let setInput = (input: string) => {
        component.showSimpleSearch = true;
        (component as any).changeDetection.detectChanges();
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
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) }
        ],
        imports: [
            SimpleFilterModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SimpleFilterComponent);
        component = fixture.componentInstance;
        filterService = fixture.debugElement.injector.get(FilterService);
        searchService = fixture.debugElement.injector.get(AbstractSearchService);
        fixture.debugElement.injector.get(DatasetService).getCurrentDashboardOptions().simpleFilter = {
            databaseName: DatasetServiceMock.DATABASES[0].name,
            tableName: DatasetServiceMock.TABLES[0].name,
            fieldName: DatasetServiceMock.TEXT_FIELD.columnName
        };
        fixture.detectChanges();
    });

    it('should filter when the user clicks the search icon', () => {
        // set input.value
        let value = 'add filter with click';
        setInput(value);

        // find search icon element and click it
        clickSearch();

        // verify that filter is added to filterService
        let filters = filterService.getFilters();
        expect(filters.length).toEqual(1);
        expect((filters[0] as SimpleFilterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((filters[0] as SimpleFilterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((filters[0] as SimpleFilterDesign).field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((filters[0] as SimpleFilterDesign).operator).toEqual('contains');
        expect((filters[0] as SimpleFilterDesign).value).toEqual('add filter with click');
    });

    it('should replace filter when one already exists', () => {
        // set input.value
        let value = 'add filter with click';
        setInput(value);

        // find search icon element and click it
        clickSearch();

        value = 'replace filter with click';
        setInput(value);
        clickSearch();

        let filters = filterService.getFilters();
        expect(filters.length).toEqual(1);
        expect((filters[0] as SimpleFilterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((filters[0] as SimpleFilterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((filters[0] as SimpleFilterDesign).field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((filters[0] as SimpleFilterDesign).operator).toEqual('contains');
        expect((filters[0] as SimpleFilterDesign).value).toEqual('replace filter with click');
    });

    it('should filter when the user presses enter', () => {
        // set input.value
        let value = 'add filter with enter';
        setInput(value);

        // simulate enter key
        fixture.debugElement.query(By.css('input.simple-filter-input')).triggerEventHandler('keyup.enter', null);

        // verify that filter is added to filterService
        let filters = filterService.getFilters();
        expect(filters.length).toEqual(1);
        expect((filters[0] as SimpleFilterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((filters[0] as SimpleFilterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((filters[0] as SimpleFilterDesign).field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect((filters[0] as SimpleFilterDesign).operator).toEqual('contains');
        expect((filters[0] as SimpleFilterDesign).value).toEqual('add filter with enter');
    });

    it('should show close icon when filter has been created', () => {
        // set input.value
        setInput('filter for showing close icon');

        // find search icon element and click it
        clickSearch();

        // verify that close exists
        expect(fixture.debugElement.query(By.css('.simple-filter')).children[2]).toBeTruthy();

        // should even show if user removes text from input
        setInput('');

        // verify that close exists
        expect(fixture.debugElement.query(By.css('.simple-filter')).children[2]).toBeTruthy();
    });

    it('should clear the filter if the user clicks the close icon', () => {
        // set input.value
        setInput('filter for checking close button');

        // find search icon element and click it
        clickSearch();

        expect(filterService.getFilters().length).toBe(1);

        // find close icon element and click it
        fixture.debugElement.query(By.css('.simple-filter')).children[2].triggerEventHandler('click', null);
        fixture.detectChanges();

        // verify that filter is no longer in filterService
        expect(filterService.getFilters().length).toBe(0);
    });

    it('should clear the filter if the user filters on an empty string', () => {
        // set input.value
        setInput('filter for empty string test');

        // find search icon element and click it
        clickSearch();

        expect(filterService.getFilters().length).toBe(1);

        // set input.value to ''
        setInput('');

        // click search
        clickSearch();

        // verify that filter is no longer in filterService
        expect(filterService.getFilters().length).toBe(0);
    });
});

describe('Component: SimpleFilter unconfigured', () => {
    let component: SimpleFilterComponent;
    let fixture: ComponentFixture<SimpleFilterComponent>;

    initializeTestBed('Simple Filter', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: DatasetService, useClass: DatasetService },
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) }
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
