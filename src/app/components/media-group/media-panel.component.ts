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
import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
    Input,
    EventEmitter,
    Output
} from '@angular/core';
import { MediaTypes } from '../../models/types';
import { MediaMetaData } from './media-group.component';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-media-panel',
    templateUrl: './media-panel.component.html',
    styleUrls: ['./media-panel.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class MediaPanelComponent {
    @Input() media: MediaMetaData;
    @Input() imageObj: any;
    @Input() isThumbnail: boolean = false;
    @Output() selectionChange = new EventEmitter();

    public mediaTypes: any = MediaTypes;
    public active: boolean;

    constructor(
        private sanitizer: DomSanitizer
    ) { }

    public select(imageToSelect) {
        if (this.isThumbnail) {
            this.media.selected = imageToSelect;
            this.selectionChange.emit(null);
        }
        // This.active = !this.active;
        this.active = this.media.selected.link === this.imageObj.link;
    }

    isSelected(): boolean {
        return this.imageObj === this.media.selected;
    }

    showMedia() {
        return this.sanitizer.bypassSecurityTrustUrl(this.media.selected.link);
    }

    showVideoMedia() {
        return this.sanitizer.bypassSecurityTrustResourceUrl(this.media.selected.link);
    }
}
