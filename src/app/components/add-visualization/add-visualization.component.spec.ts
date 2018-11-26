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
    NO_ERRORS_SCHEMA,
    Injector,
    ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatSnackBar } from '@angular/material';
import { } from 'jasmine-core';

import { AddVisualizationComponent } from './add-visualization.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

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
    selector: 'app-test-add-visualization',
    templateUrl: 'add-visualization.component.html',
    styleUrls: ['add-visualization.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

class TestAddVisualizationComponent extends AddVisualizationComponent {
    constructor(
        activeGridService: ActiveGridService,
        themesService: ThemesService,
        snackBar: MatSnackBar
    ) {
        super(
            activeGridService,
            snackBar,
            themesService
        );
    }

    // TODO Add any needed custom functions here.
}

describe('Component: Add Visualization', () => {
    let component: TestAddVisualizationComponent;
    let fixture: ComponentFixture<TestAddVisualizationComponent>,
        getService = (type: any) => fixture.debugElement.injector.get(type);
    let debugElement: DebugElement;
    let spyOnInit;

    initializeTestBed({
        declarations: [
            TestAddVisualizationComponent
        ],
        providers: [
            ActiveGridService,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        schemas: [NO_ERRORS_SCHEMA]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestAddVisualizationComponent);
        component = fixture.componentInstance;
        spyOnInit = spyOn(component, 'ngOnInit');
        fixture.detectChanges();

        debugElement = fixture.debugElement;
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('tests default values', (() => {
        expect(component.showVisShortcut).toEqual(true);
        expect(component.selectedIndex).toEqual(-1);
        expect(component.messenger).toBeTruthy();
    }));

    it('Check that the publish function updates the correct booleans', (() => {
        let spyOnBingShowVisualShortcut = spyOn(component, 'bindShowVisShortcut');
        let message = {
            showVisShortcut: false
        };

        expect(spyOnInit.calls.count()).toEqual(1);
        component.showVisShortcut = false;
        expect(component.showVisShortcut).toEqual(false);
        component.ngOnInit();
        expect(spyOnInit.calls.count()).toEqual(2);

        component.ngOnInit();
        component.bindShowVisShortcut(message);

        expect(spyOnInit.calls.count()).toEqual(3);
        expect(spyOnBingShowVisualShortcut.calls.count()).toEqual(1);
    }));

});
