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
import { TestBed, inject } from '@angular/core/testing';

import { AbstractSearchService } from './abstract.search.service';
import { DatasetService } from './dataset.service';
import { NeonGTDConfig } from '../neon-gtd-config';
import { WidgetService } from './widget.service';

import { initializeTestBed } from '../../testUtils/initializeTestBed';
import { DatasetServiceMock } from '../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../testUtils/MockServices/SearchServiceMock';

describe('Service: Widget', () => {
    initializeTestBed('Widget Service', {
        providers: [
            WidgetService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            DatasetService,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ]
    });

    it('does have expected default theme and no existing ColorSets', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('getColor does create new ColorSet', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('getColor does use existing ColorSet', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('getColorKey does return expected string', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('getColorSet does return expected ColorSet', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('getTheme does return expected theme ID', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('getThemes does return expected theme array', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('getThemeAccentColorHex does return expected theme color', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('getThemeMainColorHex does return expected theme color', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('setTheme does update theme ID', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));
});

describe('Service: Widget', () => {
    initializeTestBed('Widget Service', {
        providers: [
            WidgetService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ]
    });

    it('creates ColorSets for the colorMaps in the dataset', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));

    it('getColor does use existing ColorSet from colorMaps', inject([WidgetService], (service: WidgetService) => {
        // TODO THOR-936
    }));
});
