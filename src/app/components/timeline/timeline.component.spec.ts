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
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {} from 'jasmine-core';

import * as neon from 'neon-framework';
import { FieldMetaData } from '../../dataset';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { AppMaterialModule } from '../../app.material.module';
import { ExportControlComponent } from '../export-control/export-control.component';
import { TimelineComponent, TransformedTimelineAggregationData } from './timeline.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { WidgetService } from '../../services/widget.service';

let d3 = require('../../../assets/d3.min.js');

describe('Component: Timeline', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: TimelineComponent;
    let fixture: ComponentFixture<TimelineComponent>;

    initializeTestBed({
        declarations: [
            TimelineComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            { provide: AbstractWidgetService, useClass: WidgetService },
            DatasetService,
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimelineComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });
});
