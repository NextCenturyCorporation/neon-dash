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
import { Injector } from '@angular/core';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { } from 'jasmine-core';

import { AnnotationViewerComponent } from './annotation-viewer.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { FieldMetaData } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { AnnotationViewerModule } from './annotation-viewer.module';
import { ConfigService } from '../../services/config.service';

describe('Component: AnnotationViewer', () => {
    let component: AnnotationViewerComponent;
    let fixture: ComponentFixture<AnnotationViewerComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed('Annotation Viewer', {
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) }
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
        expect(component.options.startCharacterField).toEqual(new FieldMetaData());
        expect(component.options.endCharacterField).toEqual(new FieldMetaData());
        expect(component.options.textField).toEqual(new FieldMetaData());
        expect(component.options.typeField).toEqual(new FieldMetaData());

        expect(component.options.documentTextField).toEqual(new FieldMetaData());
        expect(component.data).toEqual([]);
        expect(component.options.singleColor).toEqual(false);
    });
});
