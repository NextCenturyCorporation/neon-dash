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
import { TimelineComponent } from './timeline.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
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
            ConnectionService,
            DatasetService,
            FilterService,
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

    it('createClause does return expected object', () => {
        component.options.dateField = new FieldMetaData('testDateField');
        expect(component.createClause()).toEqual(neon.query.where('testDateField', '!=', null));

        component.options.unsharedFilterField = new FieldMetaData('testFilterField');
        component.options.unsharedFilterValue = 'testFilterValue';
        expect(component.createClause()).toEqual(neon.query.and(neon.query.where('testDateField', '!=', null),
            neon.query.where('testFilterField', '=', 'testFilterValue')));
    });

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toBe('0 Results');

        component.activeData = [{
            date: new Date(),
            value: 0
        }];
        expect(component.getButtonText()).toBe('0 Results');

        component.activeData = [{
            date: new Date(),
            value: 1
        }];
        expect(component.getButtonText()).toBe('1 Result');

        component.activeData = [{
            date: new Date(),
            value: 1
        }, {
            date: new Date(),
            value: 1
        }];
        expect(component.getButtonText()).toBe('2 Results');

        component.activeData = [{
            date: new Date(),
            value: 3
        }, {
            date: new Date(),
            value: 2
        }, {
            date: new Date(),
            value: 1
        }, {
            date: new Date(),
            value: 0
        }];
        expect(component.getButtonText()).toBe('6 Results');

        component.options.limit = 2;
        expect(component.getButtonText()).toBe('6 Results (Limited)');
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });
});
