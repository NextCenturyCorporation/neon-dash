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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectionStrategy,
    ChangeDetectorRef, Component,
    CUSTOM_ELEMENTS_SCHEMA,
    ElementRef,
    Injector,
    ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {} from 'jasmine-core';

import { ExportControlComponent } from '../export-control/export-control.component';
import { GearComponent } from '../gear/gear.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';

import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { WidgetService } from '../../services/widget.service';

import { WidgetOptionCollection, WidgetFreeTextOption } from '../../widget-option';

/* tslint:disable:component-class-suffix */

describe('Component: Gear Component', () => {
    let component: GearComponent;
    let fixture: ComponentFixture<GearComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed('gear component', {
        declarations: [
            GearComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: AbstractWidgetService, useClass: WidgetService }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GearComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class options properties are set to expected defaults', () => {
        expect(component.modifiedOptions).toBeDefined();
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerVisible).toBeDefined();
    });

    it('returns correct icon', () => {
        expect(component.getIconForOptions()).toEqual('keyboard_arrow_down');
        component.collapseOptionalOptions = false;
        expect(component.getIconForOptions()).toEqual('keyboard_arrow_up');
    });

    it('calls expected functions', () => {
        let spy = spyOn(component, 'createGearMenuData');

        let options = new WidgetOptionCollection(() => []);
        let title = new WidgetFreeTextOption('title', 'title', 'default title');
        options.inject(title);
        let message = {
            options: options
        };

        component.updateOptions(message);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('toggleOptionalOptions changes value', () => {
        expect(component.collapseOptionalOptions).toEqual(true);
        component.toggleOptionalOptions();
        expect(component.collapseOptionalOptions).toEqual(false);
    });

});
