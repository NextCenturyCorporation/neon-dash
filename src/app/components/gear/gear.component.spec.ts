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
/*
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {} from 'jasmine-core';

import { SampleComponent } from './sample.component';
import { AbstractSubcomponent, SubcomponentListener } from './subcomponent.abstract';
import { SubcomponentImpl1 } from './subcomponent.impl1';
import { SubcomponentImpl2 } from './subcomponent.impl2';
import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

// Helper functions.

let validateSelect = (element: any, name: string, required: boolean = false, disabled: boolean = false) => {
    expect(element.componentInstance.disabled).toEqual(disabled);
    expect(element.componentInstance.placeholder).toEqual(name);
    expect(element.componentInstance.required).toEqual(required);
};

let validateSelectFields = (element: any, required: boolean = false, selected: string = '') => {
    let options = element.componentInstance.options.toArray();
    expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + (required ? 0 : 1));
    if (!required) {
        // Check for the empty field!
        expect(options[0].getLabel()).toEqual('(None)');
    }
    // Normally you shouldn't use a loop to test elements in an array but the FIELDS are updated for use by many visualizations.
    for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
        let index = (required ? i : (i + 1));
        expect(options[index].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
        expect(options[index].selected).toEqual(selected ? (DatasetServiceMock.FIELDS[i].columnName === selected) : false);
    }
};

let validateToggle = (element: any, value: any, content: string, checked: boolean) => {
    expect(element.componentInstance.value).toEqual(value);
    expect(element.nativeElement.textContent).toContain(content);
    expect(element.nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(checked);
};

// Must define the test component.
@Component({
        selector: 'app-test-sample',
        templateUrl: './sample.component.html',
        styleUrls: ['./sample.component.scss'],
        encapsulation: ViewEncapsulation.Emulated,
        changeDetection: ChangeDetectionStrategy.OnPush
})

class TestSampleComponent extends SampleComponent {
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
