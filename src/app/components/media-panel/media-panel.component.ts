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
import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation
} from '@angular/core';

export interface MediaTab {
    // TODO Add a way for the user to select other items from the list.
    loaded: boolean;
    name: string;
    selected: {
        border: string;
        link: string;
        mask: string;
        name: string;
        type: string;
    };
    list: {
        border: string;
        link: string;
        mask: string;
        name: string;
        type: string;
    }[];
}

@Component({
    selector: 'app-media-panel',
    templateUrl: './media-panel.component.html',
    styleUrls: ['./media-panel.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaPanelComponent { }
