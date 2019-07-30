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
    Component,
    ViewEncapsulation,
    Input,
    ChangeDetectionStrategy
} from '@angular/core';
import { MediaTypes } from '../../models/types';
export interface MediaMetaData {
    // TODO Add a way for the user to select other items from the list.
    // Masks removed as VMAP was the only one using masks,
    // mask implementations is still in other functions if wanted to be added back.
    loaded: boolean;
    name: string;
    selected: {
        border: string;
        link: string;
        name: string;
        type: string;
    };
    list: {
        border: string;
        link: string;
        name: string;
        type: string;
    }[];
}

@Component({
    selector: 'app-media-group',
    templateUrl: './media-group.component.html',
    styleUrls: ['./media-group.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaGroupComponent {
    @Input() tabsAndMedia: MediaMetaData = {
        loaded: false,
        name: '',
        selected: {
            border: '',
            link: '',
            name: '',
            type: ''
        },
        list: []
    };

    public selectedLinkIndex: number = 0;

    public mediaTypes: any = MediaTypes;

    /**
     * Checks if an image is the one selected
     * @arg {object} imageObj an object from the list of images within the mediaMetaData
     */
    // isSelected(imageObj): boolean {
    //     if (this.tabsAndMedia.selected) {
    //         return this.tabsAndMedia.selected.link === imageObj.link;
    //     }
    //     return false;
    // }

    /**
     * Move left on selecting the thumbnails (used for the button/anchor for previous picture)
     */
    // selectLeft() {
    //     let length = this.tabsAndMedia.list.length;
    //     this.selectedLinkIndex = (((this.selectedLinkIndex - 1) % length) + length) % length;
    //     this.tabsAndMedia.selected = this.tabsAndMedia.list[this.selectedLinkIndex];
    // }

    /**
     * Move right on selecting the thumbnails (used for the button/anchor for next picture)
     */
    // selectRight() {
    //     this.selectedLinkIndex = (this.selectedLinkIndex + 1) % this.tabsAndMedia.list.length;
    //     this.tabsAndMedia.selected = this.tabsAndMedia.list[this.selectedLinkIndex];
    // }
}
