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
import { } from 'jasmine-core';

import { AnnotationViewerComponent } from './annotation-viewer.component';

import { AbstractSearchService } from 'nucleus/dist/core/services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { SearchServiceMock } from 'nucleus/dist/core/services/mock.search.service';
import { FieldConfig } from 'nucleus/dist/core/models/dataset';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { AnnotationViewerModule } from './annotation-viewer.module';

describe('Component: AnnotationViewer', () => {
    let component: AnnotationViewerComponent;
    let fixture: ComponentFixture<AnnotationViewerComponent>;

    initializeTestBed('Annotation Viewer', {
        providers: [
            InjectableColorThemeService,
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            AnnotationViewerModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AnnotationViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('properties are set to expected defaults', () => {
        // Element Refs
        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.visualization).toBeDefined();

        // Options
    });

    it('Checks if option object has expected defaults', () => {
        expect(component.annotations).toBeUndefined();
        expect(component.options.startCharacterField).toEqual(FieldConfig.get());
        expect(component.options.endCharacterField).toEqual(FieldConfig.get());
        expect(component.options.textField).toEqual(FieldConfig.get());
        expect(component.options.typeField).toEqual(FieldConfig.get());

        expect(component.options.documentTextField).toEqual(FieldConfig.get());
        expect(component.data).toEqual([]);
        expect(component.options.singleColor).toEqual(false);
    });
});
