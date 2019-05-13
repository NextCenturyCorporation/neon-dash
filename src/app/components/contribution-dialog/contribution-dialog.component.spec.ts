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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { ContributionDialogModule } from './contribution-dialog.module';

import { ContributionDialogComponent } from './contribution-dialog.component';
import { FilterService } from '../../services/filter.service';
import { DatasetService } from '../../services/dataset.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: ContributionDialogComponent', () => {
    let fixture: ComponentFixture<ContributionDialogComponent>;
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: ContributionDialogComponent;

    initializeTestBed('ContributionDialogComponent', {
        providers: [
            FilterService,
            DatasetService,
            { provide: 'config', useValue: testConfig },
            { provide: MatDialogRef, useValue: {} },
            { provide: MAT_DIALOG_DATA, useValue: [] }
        ],
        imports: [
            ContributionDialogModule
        ]
    });

    it('should create an instance', (() => {
        fixture = TestBed.createComponent(ContributionDialogComponent);
        component = fixture.componentInstance;
        expect(component).toBeTruthy();
    }));

    it('getEmailLink() returns expected string', (() => {
        expect((component as any).getEmailLink('test@test.com')).toEqual('mailto:test@test.com');
    }));
});
