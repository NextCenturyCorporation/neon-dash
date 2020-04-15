/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { DynamicDialogComponent } from './dynamic-dialog.component';
import { DynamicDialogModule } from './dynamic-dialog.module';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { NgModuleFactoryLoader } from '@angular/core';
import { AppLazyModule } from '../../app-lazy.module';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogModule } from '../confirmation-dialog/confirmation-dialog.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

describe('DynamicDialogComponent', () => {
    let component: DynamicDialogComponent;
    let fixture: ComponentFixture<DynamicDialogComponent>;

    initializeTestBed('DynamicDialog', {
        providers: [
            {
                provide: MAT_DIALOG_DATA,
                useValue: {
                    component: 'confirmation-dialog',
                    cancelText: 'Uhoh'
                }
            },
            {
                provide: MatDialogRef,
                useValue: {}
            }
        ],
        imports: [
            AppLazyModule,
            DynamicDialogModule,
            RouterTestingModule
        ]
    });

    beforeEach(() => {
        const spyNgModuleFactoryLoader = TestBed.get(NgModuleFactoryLoader);
        spyNgModuleFactoryLoader.stubbedModules = {
            './components/confirmation-dialog/confirmation-dialog.module#ConfirmationDialogModule': ConfirmationDialogModule
        };

        fixture = TestBed.createComponent(DynamicDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create with dynamic component', fakeAsync(() => {
        component.ngOnInit();
        tick(1000);
        fixture.detectChanges();
        tick(1000);

        expect(component).toBeTruthy();
        const inst = component.componentRef.instance;
        expect(inst.constructor).toEqual(ConfirmationDialogComponent);
        expect((inst as ConfirmationDialogComponent).cancelText).toEqual('Uhoh');
    }));
});
