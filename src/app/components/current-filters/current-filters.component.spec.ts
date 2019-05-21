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
import { CurrentFiltersComponent } from './current-filters.component';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { CurrentFiltersModule } from './current-filters.module';
import { ConfigService } from '../../services/config.service';

describe('Component: CurrentFiltersComponent', () => {
    let fixture: ComponentFixture<CurrentFiltersComponent>;
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: CurrentFiltersComponent;

    initializeTestBed('Current Filters', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            DatasetService,
            FilterService,
            { provide: ConfigService, useValue: ConfigService.as(testConfig) }
        ],
        imports: [CurrentFiltersModule]
    });

    it('should create an instance', (() => {
        fixture = TestBed.createComponent(CurrentFiltersComponent);
        component = fixture.componentInstance;
        expect(component).toBeTruthy();
    }));
});
