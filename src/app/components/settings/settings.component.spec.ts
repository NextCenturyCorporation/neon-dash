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
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DebugElement,
    Injector,
    ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';
import { } from 'jasmine-core';

import { SettingsComponent } from './settings.component';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

// Must define the test component.
@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html',
    styleUrls: ['settings.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

class TestSettingsComponent extends SettingsComponent {
    constructor(
        changeDetection: ChangeDetectorRef,
        datasetService: DatasetService,
        dialog: MatDialog,
        injector: Injector,
        widgetService: AbstractWidgetService
    ) {

        super(
            changeDetection,
            datasetService,
            dialog,
            injector,
            widgetService
        );
    }

    // TODO Add any needed custom functions here.
}

describe('Component: Settings', () => {
    let component: TestSettingsComponent;
    let fixture: ComponentFixture<TestSettingsComponent>,
        getService = (type: any) => fixture.debugElement.injector.get(type);
    let debugElement: DebugElement;

    initializeTestBed({
        declarations: [
            TestSettingsComponent
        ],
        providers: [
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            { provide: AbstractWidgetService, useClass: WidgetService }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        debugElement = fixture.debugElement;
    });

});
