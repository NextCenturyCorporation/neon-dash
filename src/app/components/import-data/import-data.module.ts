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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportDataComponent } from './import-data.component';
import { MatDividerModule, MatRadioModule, MatFormFieldModule, MatSelectModule, MatButtonModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import * as papaparse from 'papaparse';

@NgModule({
    declarations: [ImportDataComponent],
    exports: [ImportDataComponent],
    entryComponents: [ImportDataComponent],
    imports: [
        MatDividerModule,
        MatRadioModule,
        MatButtonModule,
        MatSelectModule,
        MatFormFieldModule,
        FormsModule,
        CommonModule
    ],
    providers: [
        { provide: Object, useValue: papaparse }
    ]
})
export class ImportDataModule { }
