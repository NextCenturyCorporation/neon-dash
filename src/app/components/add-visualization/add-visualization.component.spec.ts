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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation
} from '@angular/core';
import { MatSnackBar, MatGridListModule, MatDividerModule } from '@angular/material';
import { } from 'jasmine-core';

import { AddVisualizationComponent } from './add-visualization.component';
import { AddVisualizationModule } from './add-visualization.module';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { NeonConfig } from '../../model/types';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { ConfigService } from '../../services/config.service';

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
        widgetService: AbstractWidgetService,
        snackBar: MatSnackBar
    ) {
        super(
            snackBar,
            widgetService
        );
    }

    // TODO Add any needed custom functions here.
}

describe('Component: AddVisualization', () => {
    let component: TestAddVisualizationComponent;
    let fixture: ComponentFixture<TestAddVisualizationComponent>;
    let spyOnInit;

    initializeTestBed('Add Visualization', {
        declarations: [
            TestAddVisualizationComponent
        ],
        providers: [
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) },
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            {
                provide: AbstractWidgetService,
                useClass: WidgetService
            }
        ],
        imports: [
            MatDividerModule,
            MatGridListModule,
            AddVisualizationModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestAddVisualizationComponent);
        component = fixture.componentInstance;
        spyOnInit = spyOn(component, 'ngOnInit');
        fixture.detectChanges();
    });

    it('tests default values', (() => {
        expect(component.showVisualizationsShortcut).toEqual(true);
        expect(component.selectedIndex).toEqual(-1);
        expect(component.messenger).toBeTruthy();
    }));

    it('Check that updateShowVisualizationsShortcut changes the correct booleans', (() => {
        let spyOnVisualizationsShortcut = spyOn(component, 'updateShowVisualizationsShortcut');
        let message = {
            show: false
        };

        expect(spyOnInit.calls.count()).toEqual(1);
        component.showVisualizationsShortcut = false;
        expect(component.showVisualizationsShortcut).toEqual(false);
        component.ngOnInit();
        expect(spyOnInit.calls.count()).toEqual(2);

        component.ngOnInit();
        component.updateShowVisualizationsShortcut(message);

        expect(spyOnInit.calls.count()).toEqual(3);
        expect(spyOnVisualizationsShortcut.calls.count()).toEqual(1);
    }));
});
