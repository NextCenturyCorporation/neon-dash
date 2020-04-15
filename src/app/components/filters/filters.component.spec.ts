/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { Injector } from '@angular/core';

import { } from 'jasmine-core';

import { FiltersComponent } from './filters.component';

import { AbstractSearchService, SearchServiceMock } from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { FiltersModule } from './filters.module';

describe('Component: Filters', () => {
    let component: FiltersComponent;
    let fixture: ComponentFixture<FiltersComponent>;

    initializeTestBed('Filters', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector
        ],
        imports: [
            FiltersModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FiltersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('getDefaultTitle() returns correct string', (() => {
        expect(component.getDefaultTitle()).toEqual('Filters');
    }));

    it('closeFiltersDialog() emits boolean when called', (() => {
        spyOn(component.closeDialog, 'emit');
        component.closeFiltersDialog();
        /* eslint-disable @typescript-eslint/unbound-method */
        expect(component.closeDialog.emit).toHaveBeenCalledWith(true);
        /* eslint-enable @typescript-eslint/unbound-method */
    }));
});
