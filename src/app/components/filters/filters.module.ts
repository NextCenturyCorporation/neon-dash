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
import { FiltersComponent } from './filters.component';
import { FormsModule } from '@angular/forms';
import { FilterBuilderModule } from '../filter-builder/filter-builder.module';
import { CurrentFiltersModule } from '../current-filters/current-filters.module';
import { CommonWidgetModule } from '../../common-widget.module';
import { MatButtonToggleModule } from '@angular/material';

@NgModule({
    declarations: [FiltersComponent],
    exports: [FiltersComponent],
    imports: [
        CommonWidgetModule,
        MatButtonToggleModule,
        FormsModule,
        FilterBuilderModule,
        CurrentFiltersModule,
        CommonModule
    ]
})
export class FiltersModule { }
