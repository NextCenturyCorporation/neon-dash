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

import { FilterService } from '../../services/filter.service';
import { DatasetService } from '../../services/dataset.service';
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
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { SimpleFilterModule } from './simple-filter.module';

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
    options = new DashboardOptions();
    constructor() {
        super(new NeonGTDConfig());

        let dashboardTableKeys: { [key: string]: string } = {};
        dashboardTableKeys.tableKey = 'datastore1.' + databaseName + '.' + tableName;

        let dashboardFieldKeys: { [key: string]: string } = {};
        dashboardFieldKeys.fieldKey = 'datastore1.' + databaseName + '.' + tableName + '.' + fieldName;

        let dashboard = {
            name: 'Test Discovery Config',
            layout: 'DISCOVERY',
            tables: dashboardTableKeys,
            fields: dashboardFieldKeys,
            options: new DashboardOptions()
        };
        dashboard.options.simpleFilter = new SimpleFilter(databaseName, tableName, fieldName, 'Search', '', 'tableKey', 'fieldKey');
        this.setCurrentDashboard(dashboard);
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
        filterService: FilterService
    ) {
        super(
            changeDetection,
            datasetService,
            filterService
        );
    }
}

describe('Component: SimpleFilter', () => {
    let component: SimpleFilterComponent;
    let fixture: ComponentFixture<SimpleFilterComponent>;
    let filterService: FilterService;
    let element: DebugElement;
    let setInput = (input: string) => {
        fixture.debugElement.query(By.css('input.simple-filter-input')).nativeElement.value = input;
        fixture.detectChanges();
    };
    let clickSearch = () => {
        element.children[0].triggerEventHandler('click', null);
        fixture.detectChanges();
    };

    initializeTestBed('Simple Filter', {
        providers: [
            { provide: FilterService, useClass: MockFilterService },
            { provide: DatasetService, useClass: MockDatasetService },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            SimpleFilterModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SimpleFilterComponent);
        component = fixture.componentInstance;
        component.showSimpleSearch = true;
        filterService = fixture.debugElement.injector.get(FilterService);
        fixture.detectChanges();
        element = fixture.debugElement.query(By.css('.simple-filter'));
    });

    afterEach(() => {
        // Cleanup:  Remove all filters that were added in each test.
        filterService.removeFilters(null, filterService.getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('should show in the UI when the configuration includes a simpleFilter option', () => expect(element).toBeTruthy());

    it('should filter when the user clicks the search icon', () => {
        // set input.value
        let value = 'filter with click';
        setInput(value);

        // find search icon element and click it
        clickSearch();

        // verify that filter is added to filterService
        expect(filterService.getFilters().length).toBe(1);
        let filter = filterService.getFilterById(component.filterId.getValue());
        expect(filter).toBeTruthy();
        let expected = neon.query.where(fieldName, 'contains', value);
        expect(filter.filter.whereClause).toEqual(expected);
    });

    it('should replace filter when one already exists', () => {
        // set input.value
        let value = 'filter with click';
        setInput(value);

        // find search icon element and click it
        clickSearch();
        let filterId = component.filterId.getValue();

        value = 'replace filter with click';
        setInput(value);
        clickSearch();

        // verify that filter id didn't change
        expect(component.filterId.getValue()).toBe(filterId, 'filter id should not have changed');

        // verify that only one filter is in the filter service
        expect(filterService.getFilters().length).toBe(1, 'there should still only be 1 filter');

        let filter = filterService.getFilterById(component.filterId.getValue());
        expect(filter).toBeTruthy();

        let expected = neon.query.where(fieldName, 'contains', value);
        expect(filter.filter.whereClause).toEqual(expected, 'filter clause should be updated');
    });

    it('should filter when the user presses enter', () => {
        // set input.value
        let value = 'filter with enter';
        setInput(value);

        // simulate enter key
        fixture.debugElement.query(By.css('input.simple-filter-input')).triggerEventHandler('keyup.enter', null);

        // verify that filter is added to filterService
        expect(filterService.getFilters().length).toBe(1);
        let filter = filterService.getFilterById(component.filterId.getValue());
        expect(filter).toBeTruthy();
        let expected = neon.query.where(fieldName, 'contains', value);
        expect(filter.filter.whereClause).toEqual(expected);
    });

    it('should show close icon when filter has been created', () => {
        // set input.value
        setInput('filter for showing close icon');

        // find search icon element and click it
        clickSearch();

        // verify that close exists
        expect(element.children[2]).toBeTruthy();

        // should even show if user removes text from input
        setInput('');

        // verify that close exists
        expect(element.children[2]).toBeTruthy();
    });

    it('should clear the filter if the user clicks the close icon', () => {
        // set input.value
        setInput('filter for checking close button');

        // find search icon element and click it
        clickSearch();

        // find close icon element and click it
        element.children[2].triggerEventHandler('click', null);
        fixture.detectChanges();

        // verify that filter is no longer in filterService
        expect(filterService.getFilters().length).toBe(0);
    });

    it('should clear the filter if the user filters on an empty string', () => {
        // set input.value
        setInput('filter for empty string test');

        // find search icon element and click it
        clickSearch();

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
    let element: DebugElement;
    let spyOnInit;

    initializeTestBed('Simple Filter', {
        declarations: [
            SimpleFilterComponent
        ],
        providers: [
            { provide: FilterService, useClass: MockFilterService },
            { provide: DatasetService, useClass: DatasetService },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            SimpleFilterModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SimpleFilterComponent);
        component = fixture.componentInstance;
        component.showSimpleSearch = false;
        spyOnInit = spyOn(component, 'ngOnInit');
        fixture.detectChanges();
        element = fixture.debugElement.query(By.css('.simple-filter'));
    });

    it('**should not show in the UI when showSimpleFilter is set to false**', () => {
        expect(element).toBeFalsy();
    });

    it('Checks Default values', () => {
        expect(component.showSimpleSearch).toEqual(false);
    });

    it('Check that the publish function updates the correct booleans', (() => {
        let spyOnBingShowSimpleSearch = spyOn(component, 'bindShowSimpleSearch');
        let spyOnPublishShowSimpleSearch = spyOn(component, 'publishShowSimpleSearch');
        let message = {
            showSimpleSearch: false
        };

        expect(spyOnInit.calls.count()).toEqual(1);

        component.showSimpleSearch = false;
        expect(component.showSimpleSearch).toEqual(false);
        component.ngOnInit();

        component.bindShowSimpleSearch(message);
        component.ngOnInit();
        component.publishShowSimpleSearch();

        expect(spyOnInit.calls.count()).toEqual(3);
        expect(spyOnBingShowSimpleSearch.calls.count()).toEqual(1);
        expect(spyOnPublishShowSimpleSearch.calls.count()).toEqual(1);
    }));

});
