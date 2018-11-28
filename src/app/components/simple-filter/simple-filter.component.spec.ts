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
import { FormsModule } from '@angular/forms';

import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { SimpleFilterComponent } from './simple-filter.component';
import { DatasetOptions, SimpleFilter } from '../../dataset';
import {
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    Component,
    DebugElement,
    NO_ERRORS_SCHEMA,
    OnDestroy, OnInit
} from '@angular/core';
import { By } from '@angular/platform-browser';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { ActiveGridService } from '../../services/active-grid.service';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';

const databaseName = 'database';
const tableName = 'table';
const fieldName = 'field';

// TODO Is this really needed?
class MockFilterService extends FilterServiceMock {
    addFilter(messenger: neon.eventing.Messenger, ownerId: string, database: string, table: string,
        whereClause: any, filterName: string | { visName: string; text: string },
        onSuccess: (resp: any) => any, onError: (resp: any) => any): void {
        super.addFilter(messenger, ownerId, database, table, whereClause, filterName, onSuccess, onError);
        onSuccess(super.getLatestFilterId());
    }
}

class MockDatasetService extends DatasetService {
    options = new DatasetOptions();
    constructor() {
        super(new NeonGTDConfig());
        this.options.simpleFilter = new SimpleFilter(databaseName, tableName, fieldName);
    }

    getActiveDatasetOptions() {
        return this.options;
    }
}
@Component({
    selector: 'app-simple-filter',
    templateUrl: './simple-filter.component.html',
    styleUrls: ['./simple-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestSimpleFilterComponent extends SimpleFilterComponent {
    constructor(
        changeDetection: ChangeDetectorRef,
        datasetService: DatasetService,
        filterService: FilterService,
        themesService: ThemesService
    ) {
        super(
            changeDetection,
            datasetService,
            filterService,
            themesService
        );
    }
}

class SimpleFilterTester {
    fixture: ComponentFixture<SimpleFilterComponent>;
    component: SimpleFilterComponent;
    filterService: FilterService;
    datasetService: DatasetService;
    element: DebugElement;
    spyOnInit;

    constructor(mockDataset = true, showSimpleSearch = true) {
        TestBed.configureTestingModule({
            declarations: [
                SimpleFilterComponent
            ],
            providers: [
                { provide: FilterService, useClass: MockFilterService },
                ThemesService,
                { provide: DatasetService, useClass: mockDataset ? MockDatasetService : DatasetService },
                ErrorNotificationService,
                { provide: 'config', useValue: new NeonGTDConfig() }
            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                BrowserAnimationsModule
            ]
        });
        let fixture = TestBed.createComponent(SimpleFilterComponent);
        this.fixture = fixture;
        this.component = fixture.componentInstance;
        this.component.showSimpleSearch = showSimpleSearch;
        this.spyOnInit = spyOn(this.component, 'ngOnInit');
        this.filterService = this.getInjected(FilterService);
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

        // ensure that html updates after filter is added
        this.detectChanges();
    }

    getCloseElement() {
        return this.element.children[2];
    }

    clickClose() {
        this.getCloseElement().triggerEventHandler('click', null);

        // ensure that html updates after filter is removed
        this.detectChanges();
    }

    detectChanges() { this.fixture.detectChanges(); }
}

describe('Component: SimpleFilter', () => {
    let tester: SimpleFilterTester;

    beforeEach(() => tester = new SimpleFilterTester());

    it('should create an instance', () => expect(tester.component).toBeTruthy());

    it('should show in the UI when the configuration includes a simpleFilter option', () => expect(tester.element).toBeTruthy());

    it('should filter when the user clicks the search icon', () => {
        // set input.value
        let value = 'filter with click';
        tester.setInput(value);

        // find search icon element and click it
        tester.clickSearch();

        // verify that filter is added to filterService
        expect(tester.filterService.getFilters().length).toBe(1);
        let filter = tester.filterService.getFilterById(tester.component.filterId.getValue());
        expect(filter).toBeTruthy();
        let expected = neon.query.where(fieldName, 'contains', value);
        expect(filter.filter.whereClause).toEqual(expected);
    });

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

describe('Component: SimpleFilter unconfigured', () => {

    let tester: SimpleFilterTester;

    beforeEach(() => tester = new SimpleFilterTester(false, false));

    it('should create an instance', () => expect(tester.component).toBeTruthy());

    it('**should not show in the UI when showSimpleFilter is set to false**', () => {
        expect(tester.element).toBeFalsy();
    });

    it('Checks Default values', () => {
        expect(tester.component.showSimpleSearch).toEqual(false);
    });

    it('Check that the publish function updates the correct booleans', (() => {
        let spyOnBingShowSimpleSearch = spyOn(tester.component, 'bindShowSimpleSearch');
        let spyOnPublishShowSimpleSearch = spyOn(tester.component, 'publishShowSimpleSearch');
        let message = {
            showSimpleSearch: false
        };

        expect(tester.spyOnInit.calls.count()).toEqual(1);

        tester.component.showSimpleSearch = false;
        expect(tester.component.showSimpleSearch).toEqual(false);
        tester.component.ngOnInit();

        tester.component.bindShowSimpleSearch(message);
        tester.component.ngOnInit();
        tester.component.publishShowSimpleSearch();

        expect(tester.spyOnInit.calls.count()).toEqual(3);
        expect(spyOnBingShowSimpleSearch.calls.count()).toEqual(1);
        expect(spyOnPublishShowSimpleSearch.calls.count()).toEqual(1);
    }));

});
