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
import { CommonWidgetModule } from '../../common-widget.module';
import { MatFormFieldModule, MatIconModule, MatButtonModule, MatSelectModule, MatInputModule } from '@angular/material';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { CustomRequestsComponent } from './custom-requests.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
    declarations: [CustomRequestsComponent],
    entryComponents: [CustomRequestsComponent],
    exports: [CustomRequestsComponent],
    imports: [
        CommonWidgetModule,
        FormsModule,
        ReactiveFormsModule.withConfig({ warnOnNgModelWithFormControl: 'never' }),
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MonacoEditorModule.forRoot({ baseUrl: 'assets/' }),
        CommonModule
    ]
})
export class CustomRequestsModule { }
