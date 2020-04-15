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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GearComponent } from './gear.component';
import { MatToolbarModule, MatFormFieldModule, MatIconModule, MatSelectModule, MatInputModule, MatButtonModule } from '@angular/material';
import { ExportControlModule } from '../export-control/export-control.module';
import { OptionsListModule } from '../options-list/options-list.module';
import { OptionsSectionModule } from '../options-section/options-section.module';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [GearComponent],
    exports: [GearComponent],
    entryComponents: [GearComponent],
    imports: [
        ExportControlModule,
        OptionsListModule,
        OptionsSectionModule,
        MatButtonModule,
        MatToolbarModule,
        MatFormFieldModule,
        MatIconModule,
        MatSelectModule,
        MatInputModule,
        FormsModule,
        CommonModule
    ]
})
export class GearModule { }
