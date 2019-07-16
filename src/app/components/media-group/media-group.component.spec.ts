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
import { MediaGroupComponent, MediaMetaData } from './media-group.component';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { AbstractSearchService } from '../../services/abstract.search.service';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { Injector } from '@angular/core';
import { MediaGroupModule } from './media-group.module';

describe('Component: MediaGroup', () => {
    let component: MediaGroupComponent;
    let fixture: ComponentFixture<MediaGroupComponent>;

    initializeTestBed('Media Group', {
        providers: [
            DashboardService,
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector

        ],
        imports: [
            MediaGroupModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MediaGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // It('exists', () => {
    //     component.tabsAndMedia = [];
    //     expect(component.tabsAndMedia).toBeTruthy();
    //     expect(component.dashboardState).toBeTruthy();
    //     expect(component.options).toBeTruthy();
    //     expect(component.sanitizer).toBeTruthy();
    //     expect(component.visualization).toBeTruthy();
    //     expect(component.changeDetection).toBeTruthy();
    // });
});
