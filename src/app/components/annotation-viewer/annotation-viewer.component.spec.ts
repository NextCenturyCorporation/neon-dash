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
import { Injector } from '@angular/core';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { } from 'jasmine-core';

import { AnnotationViewerComponent } from './annotation-viewer.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { NeonFieldMetaData } from '../../models/dataset';
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
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector
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
        expect(component.options.startCharacterField).toEqual(NeonFieldMetaData.get());
        expect(component.options.endCharacterField).toEqual(NeonFieldMetaData.get());
        expect(component.options.textField).toEqual(NeonFieldMetaData.get());
        expect(component.options.typeField).toEqual(NeonFieldMetaData.get());

        expect(component.options.documentTextField).toEqual(NeonFieldMetaData.get());
        expect(component.data).toEqual([]);
        expect(component.options.singleColor).toEqual(false);
    });

    it('hasUrl checks if url is in string and sets url variable', () => {
        let testString = 'Hello World, https://www.google.com Goodbye world.';

        component.hasUrl(testString);

        expect(component.url).toEqual(['https://www.google.com']);
        expect(component.text).toEqual(['Hello World, ', ' Goodbye world.']);
    });

    it('hasUrl correctly recognizes different link prefixes or postfixes', () => {
        let ftpString = 'Hello World, ftp://www.files.org Goodbye world.';
        let queryString = 'Hello World, ftp://www.files.org/there?next=free Goodbye world.';
        let fragIdString = 'Hello World, ftp://www.files.org/there.html#bar Goodbye world.';

        component.hasUrl(ftpString);
        expect(component.url).toEqual(['ftp://www.files.org']);
        expect(component.text).toEqual(['Hello World, ', ' Goodbye world.']);

        component.hasUrl(queryString);
        expect(component.url).toEqual(['ftp://www.files.org/there?next=free']);
        expect(component.text).toEqual(['Hello World, ', ' Goodbye world.']);

        component.hasUrl(fragIdString);
        expect(component.url).toEqual(['ftp://www.files.org/there.html#bar']);
        expect(component.text).toEqual(['Hello World, ', ' Goodbye world.']);
    });

    it('hasUrl works with multiple links', () => {
        let multUrlString = 'Use https://www.google.com to search as well as http://www.bing.com They both work well.';

        component.hasUrl(multUrlString);
        expect(component.url).toEqual(['https://www.google.com', 'http://www.bing.com']);
        expect(component.text).toEqual(['Use ', ' to search as well as ', ' They both work well.']);
    });

    it('hasUrl checks if url is in string and sets url variable, and adds http if needed', () => {
        let testString = 'Hello World, www.google.com Goodbye world';

        component.hasUrl(testString);

        expect(component.url).toEqual(['http://www.google.com']);
    });
});
