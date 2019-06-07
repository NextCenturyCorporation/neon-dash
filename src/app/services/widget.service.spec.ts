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
import { inject } from '@angular/core/testing';

import { AbstractSearchService } from './abstract.search.service';
import { DatasetService } from './dataset.service';
import { NeonGTDConfig } from '../neon-gtd-config';
import { WidgetService } from './widget.service';

import { initializeTestBed } from '../../testUtils/initializeTestBed';
import { DatasetServiceMock } from '../../testUtils/MockServices/DatasetServiceMock';
import { ConfigService } from './config.service';
import { SearchServiceMock } from '../../testUtils/MockServices/SearchServiceMock';

describe('Service: Widget', () => {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    let service: WidgetService;

    initializeTestBed('Widget Service', {
        providers: [
            WidgetService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            DatasetService,
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) }

        ]
    });

    beforeEach(inject([WidgetService], (widgetService: WidgetService) => {
        service = widgetService;
    }));

    it('does have expected default theme and no existing ColorSets', () => {
        // TODO THOR-936
    });

    it('getColor does create new ColorSet', () => {
        // TODO THOR-936
    });

    it('getColor does use existing ColorSet', () => {
        // TODO THOR-936
    });

    it('getColorKey does return expected string', () => {
        // TODO THOR-936
    });

    it('getColorSet does return expected ColorSet', () => {
        // TODO THOR-936
    });

    it('getTheme does return expected theme ID', () => {
        // TODO THOR-936
    });

    it('getThemes does return expected theme array', () => {
        // TODO THOR-936
    });

    it('getThemeAccentColorHex does return expected theme color', () => {
        // TODO THOR-936
    });

    it('getThemeTextColorHex does return expected theme color', () => {
        // TODO THOR-936
    });

    it('setTheme does update theme ID', () => {
        // TODO THOR-936
    });
});

describe('ColorSet', () => {
    initializeTestBed('Widget Service ColorSet', {
        providers: [
            WidgetService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) }

        ]
    });

    it('creates ColorSets for the colorMaps in the dataset', () => {
        // TODO THOR-936
    });

    it('getColor does use existing ColorSet from colorMaps', () => {
        // TODO THOR-936
    });
});
