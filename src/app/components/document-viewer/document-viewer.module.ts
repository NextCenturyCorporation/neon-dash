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
import { DocumentViewerComponent } from './document-viewer.component';
import { MatListModule } from '@angular/material';
import { DataMessageModule } from '../data-message/data-message.module';
import { CommonWidgetModule } from '../../common-widget.module';

@NgModule({
    declarations: [DocumentViewerComponent],
    exports: [DocumentViewerComponent],
    entryComponents: [DocumentViewerComponent],
    imports: [
        CommonWidgetModule,
        MatListModule,
        DataMessageModule,
        CommonModule
    ]
})
export class DocumentViewerModule { }
