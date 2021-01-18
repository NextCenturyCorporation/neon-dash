/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributionDialogComponent } from './contribution-dialog.component';
import { MatDialogModule, MatIconModule, MatButtonModule } from '@angular/material';
import { ConfirmationDialogModule } from '../confirmation-dialog/confirmation-dialog.module';

@NgModule({
    declarations: [
        ContributionDialogComponent
    ],
    entryComponents: [
        ContributionDialogComponent
    ],
    exports: [
        ConfirmationDialogModule
    ],
    imports: [
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        CommonModule
    ]
})
export class ContributionDialogModule { }
