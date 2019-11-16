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

/* eslint-disable header/header */
/*
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { NeonConfig } from '../../models/types';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { QueryBarComponent } from './query-bar.component';
import { DatasetOptions, SimpleFilter } from '../../models/types';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { query } from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

const databaseName = 'database';
const tableName = 'table';
const fieldName = 'field';

class MockDashboardService extends DashboardService {
    options = Dashboard.getOptions();
    constructor() {
        super(NeonConfig.get());
        this.options.queryBar = new SimpleFilter(databaseName, tableName, fieldName);
    }

    getCurrentDashboardOptions() {
        return this.options;
    }
}

class queryBarTester {
    fixture: ComponentFixture<QueryBarComponent>;
    component: QueryBarComponent;
    filterService: InjectableFilterService;
    datasetService: DashboardService;
    element: DebugElement;

    constructor(mockDataset = true) {
        TestBed.configureTestingModule({
            declarations: [
                QueryBarComponent
            ],
            providers: [
                { provide: InjectableFilterService, useClass: MockFilterService },
                InjectableColorThemeService,
                { provide: DashboardService, useClass: mockDataset ? MockDashboardService : DashboardService },

            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                BrowserAnimationsModule
            ]
        });
        let fixture = TestBed.createComponent(QueryBarComponent);
        this.fixture = fixture;
        this.component = fixture.componentInstance;
        this.filterService = this.getInjected(InjectableFilterService);
        this.detectChanges();

        this.element = this.getElement('.simple-filter');
    }

    getElement(selector: string) {
        return this.fixture.debugElement.query(By.css(selector));
    }

    getInjected(type: any) {
        return this.fixture.debugElement.injector.get(type);
    }

    getInputElement() {
        return this.getElement('input.simple-filter-input');
    }

    setInput(input: string) {
        let inputEl = this.getInputElement();
        inputEl.nativeElement.value = input;
        this.detectChanges();
    }

    clickSearch() {
        this.element.children[0].triggerEventHandler('click', null);

        // Ensure that html updates after filter is added
        this.detectChanges();
    }

    getCloseElement() {
        return this.element.children[2];
    }

    clickClose() {
        this.getCloseElement().triggerEventHandler('click', null);

        // Ensure that html updates after filter is removed
        this.detectChanges();
    }

    detectChanges() {
        this.fixture.detectChanges();
    }
}

describe('Component: queryBar', () => {
    let tester: queryBarTester;

    beforeEach(() => tester = new queryBarTester());

    it('should create an instance', () => expect(tester.component).toBeTruthy());

    it('should show in the UI when the configuration includes a queryBar option', () => expect(tester.element).toBeTruthy());

    it('should filter when the user clicks the search icon', () => {
        // Set input.value
        let value = 'filter with click';
        tester.setInput(value);

        // Find search icon element and click it
        tester.clickSearch();

        // Verify that filter is added to filterService
        expect(tester.filterService.getFilters().length).toBe(1);
        let filter = tester.filterService.getFilterById(tester.component.filterId.getValue());
        expect(filter).toBeTruthy();
        let expected = query.where(fieldName, 'contains', value);
        expect(filter.filter.whereClause).toEqual(expected);
    });

    it('should replace filter when one already exists', () => {
        // Set input.value
        let value = 'filter with click';
        tester.setInput(value);

        // Find search icon element and click it
        tester.clickSearch();
        let filterId = tester.component.filterId.getValue();

        value = 'replace filter with click';
        tester.setInput(value);
        tester.clickSearch();

        // Verify that filter id didn't change
        expect(tester.component.filterId.getValue()).toBe(filterId, 'filter id should not have changed');

        // Verify that only one filter is in the filter service
        expect(tester.filterService.getFilters().length).toBe(1, 'there should still only be 1 filter');

        let filter = tester.filterService.getFilterById(tester.component.filterId.getValue());
        expect(filter).toBeTruthy();

        let expected = query.where(fieldName, 'contains', value);
        expect(filter.filter.whereClause).toEqual(expected, 'filter clause should be updated');
    });

    it('should filter when the user presses enter', () => {
        // Set input.value
        let value = 'filter with enter';
        tester.setInput(value);

        // Simulate enter key
        tester.getInputElement().triggerEventHandler('keyup.enter', null);

        // Verify that filter is added to filterService
        expect(tester.filterService.getFilters().length).toBe(1);
        let filter = tester.filterService.getFilterById(tester.component.filterId.getValue());
        expect(filter).toBeTruthy();
        let expected = query.where(fieldName, 'contains', value);
        expect(filter.filter.whereClause).toEqual(expected);
    });

    it('should show close icon when filter has been created', () => {
        // Set input.value
        tester.setInput('filter for showing close icon');

        // Find search icon element and click it
        tester.clickSearch();

        // Verify that close exists
        expect(tester.getCloseElement()).toBeTruthy();

        // Should even show if user removes text from input
        tester.setInput('');

        // Verify that close exists
        expect(tester.getCloseElement()).toBeTruthy();
    });

    it('should clear the filter if the user clicks the close icon', () => {
        // Set input.value
        tester.setInput('filter for checking close button');

        // Find search icon element and click it
        tester.clickSearch();

        // Find close icon element and click it
        tester.clickClose();

        // Verify that filter is no longer in filterService
        expect(tester.filterService.getFilters().length).toBe(0);
    });

    it('should clear the filter if the user filters on an empty string', () => {
        // Set input.value
        tester.setInput('filter for empty string test');

        // Find search icon element and click it
        tester.clickSearch();

        // Set input.value to ''
        tester.setInput('');

        // Click search
        tester.clickSearch();

        // Verify that filter is no longer in filterService
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

