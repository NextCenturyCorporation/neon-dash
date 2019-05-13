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
import { Injector, DebugElement } from '@angular/core';

import { } from 'jasmine-core';

import { FiltersComponent } from './filters.component';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { By } from '@angular/platform-browser';

import { FiltersModule } from './filters.module';

describe('Component: Filters', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: FiltersComponent;
    let fixture: ComponentFixture<FiltersComponent>;
    let debugElement: DebugElement;

    initializeTestBed('Filters', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            FiltersModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FiltersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        debugElement = fixture.debugElement;
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('showFilterBuilderView is true on default if no input passed in', (() => {
        expect(component.showFilterBuilderView).toBeTruthy();
    }));

    it('getDefaultTitle() returns correct string', (() => {
        expect(component.getDefaultTitle()).toEqual('Filters');
    }));

    it('closeFiltersDialog() emits boolean when called', (() => {
        spyOn(component.closeDialog, 'emit');
        component.closeFiltersDialog();
        expect(component.closeDialog.emit).toHaveBeenCalled();
        expect(component.closeDialog.emit).toHaveBeenCalledWith(true);
    }));

    it('filter-builder is shown when showFilterBuilderView is true', (() => {
        expect(debugElement.nativeElement.querySelectorAll('app-filter-builder')).toBeTruthy();
        expect(debugElement.nativeElement.querySelectorAll('app-current-filters')).toBeTruthy();
        expect(debugElement.query(By.css('app-filter-builder')).nativeElement.hidden).toBeFalsy();
        expect(debugElement.query(By.css('app-current-filters')).nativeElement.hidden).toBeTruthy();
    }));

    it('current-filters is shown when showFilterBuilderView is false', (() => {
        component.showFilterBuilderView = false;
        fixture.detectChanges();

        expect(debugElement.nativeElement.querySelectorAll('app-filter-builder')).toBeTruthy();
        expect(debugElement.nativeElement.querySelectorAll('app-current-filters')).toBeTruthy();
        expect(debugElement.query(By.css('app-filter-builder')).nativeElement.hidden).toBeTruthy();
        expect(debugElement.query(By.css('app-current-filters')).nativeElement.hidden).toBeFalsy();
    }));
});
