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
 */import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterBuilderComponent } from './filter-builder.component';
import { MatButtonToggleModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatTooltipModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [FilterBuilderComponent],
  exports: [FilterBuilderComponent],
  entryComponents: [FilterBuilderComponent],
  imports: [
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    FormsModule,
    CommonModule
  ]
})
export class FilterBuilderModule { }
