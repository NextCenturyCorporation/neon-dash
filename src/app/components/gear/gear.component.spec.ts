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
*//*
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {} from 'jasmine-core';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { GearComponent } from './gear.component';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

@Component({
        selector: 'app-test-sample',
        templateUrl: './sample.component.html',
        styleUrls: ['./sample.component.scss'],
        encapsulation: ViewEncapsulation.Emulated,
        changeDetection: ChangeDetectionStrategy.OnPush
})

class TestGearComponent extends GearComponent {
    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );
    }

    // TODO Add any needed custom functions here.
}

// TODO Create a test implementation of your subcomponent so you can test its behavior.

/* tslint:disable:component-class-suffix */ /*
class TestSubcomponent extends AbstractSubcomponent {
    buildElements(elementRef: ElementRef) {
        // TODO
    }

    destroyElements() {
        // TODO
    }

    updateData(data: any[]) {
        // TODO
    }
}
/* tslint:enable:component-class-suffix */ /*

describe('Component: Sample', () => {
    let component: TestSampleComponent;
    let fixture: ComponentFixture<TestSampleComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            TestSampleComponent,
            ExportControlComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestSampleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

});
*/
