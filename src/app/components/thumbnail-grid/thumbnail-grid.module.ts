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
import { ThumbnailGridComponent } from './thumbnail-grid.component';
import { CardThumbnailSubComponent } from './subcomponent.card-view';
import { TitleThumbnailSubComponent } from './subcomponent.title-view';
import { DetailsThumbnailSubComponent } from './subcomponent.details-view';
import { DataMessageModule } from '../data-message/data-message.module';
import { CommonWidgetModule } from '../../common-widget.module';

@NgModule({
    declarations: [
        ThumbnailGridComponent,
        CardThumbnailSubComponent,
        TitleThumbnailSubComponent,
        DetailsThumbnailSubComponent
    ],
    exports: [ThumbnailGridComponent],
    entryComponents: [ThumbnailGridComponent],
    imports: [
        CommonWidgetModule,
        DataMessageModule,
        CommonModule
    ]
})
export class ThumbnailGridModule { }
