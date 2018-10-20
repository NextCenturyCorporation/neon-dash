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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {} from 'jasmine-core';

import { ExportControlComponent } from '../export-control/export-control.component';
import { RightPanelComponent } from './right-panel.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { RightPanelService } from '../../services/right-panel.service';
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
        selector: 'app-test-right-panel',
        templateUrl: 'right-panel.component.html',
        styleUrls: ['right-panel.component.scss'],
        encapsulation: ViewEncapsulation.Emulated,
        changeDetection: ChangeDetectionStrategy.OnPush
})

class TestRightPanelComponent extends RightPanelComponent {
    constructor(
        rightPanelService: RightPanelService,
        themesService: ThemesService
    ) {

        super(
            rightPanelService,
            themesService
        );
    }

    // TODO Add any needed custom functions here.
}

describe('Component: Sample', () => {
    let component: TestRightPanelComponent;
    let fixture: ComponentFixture<TestRightPanelComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            TestRightPanelComponent
        ],
        providers: [
            RightPanelService,
            ThemesService
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestRightPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

});
