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
    ChangeDetectionStrategy,
    Input,
    ElementRef
} from '@angular/core';
import { MediaMetaData } from '../media-panel/media-panel.component';
import { MediaTypes } from '../../models/types';
import { RootWidgetOptionCollection } from '../../models/widget-option-collection';
import { DashboardState } from '../../models/dashboard-state';

@Component({
    selector: 'app-media-group',
    templateUrl: './media-group.component.html',
    styleUrls: ['./media-group.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaGroupComponent {
    @Input() tabsAndMedia: MediaMetaData[];
    @Input() dashboardState: DashboardState;
    @Input() visualization: ElementRef;
    @Input() options: RootWidgetOptionCollection;

    public selectedTabIndex: number = 0;

    protected MEDIA_PADDING: number = 10;
    protected SLIDER_HEIGHT: number = 30;
    protected TAB_HEIGHT: number = 30;
    protected CONTRIBUTION_FOOTER_HEIGHT: number = 20;
    protected TOOLBAR_HEIGHT: number = 40;

    public mediaTypes: any = MediaTypes;

    public showContribution() {
        return ((this.options.contributionKeys && this.options.contributionKeys.length !== 0) ||
            (this.options.contributionKeys === null &&
                this.dashboardState.dashboard &&
                this.dashboardState.dashboard.contributors &&
                Object.keys(this.dashboardState.dashboard.contributors).length));
    }

    /**
     * @override
     */
    public updateOnResize(event?: any) {
        if (!this.visualization) {
            return;
        }

        let frames = this.visualization.nativeElement.querySelectorAll('.frame');
        let images = this.visualization.nativeElement.querySelectorAll('.image');
        let audios = this.visualization.nativeElement.querySelectorAll('.audio');

        if (!this.options.resize) {
            frames.forEach((frame) => {
                frame.style.maxHeight = '';
                frame.style.maxWidth = '';
            });
            images.forEach((image) => {
                image.style.maxHeight = '';
                image.style.maxWidth = '';
            });
            audios.forEach((audio) => {
                audio.style.maxHeight = '';
                audio.style.maxWidth = '';
            });
            return;
        }

        let tabIndex = event ? event.index : this.selectedTabIndex;
        let sliderHeight = ((this.tabsAndMedia.length > tabIndex && this.tabsAndMedia[tabIndex].selected.type ===
            this.mediaTypes.maskImage) ? this.SLIDER_HEIGHT : 0);

        frames.forEach((frame) => {
            if (this.showContribution()) {
                frame.style.height = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT -
                    this.CONTRIBUTION_FOOTER_HEIGHT - this.TAB_HEIGHT -
                    this.MEDIA_PADDING - sliderHeight - 5) + 'px';
                frame.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT -
                    this.CONTRIBUTION_FOOTER_HEIGHT - this.TAB_HEIGHT -
                    this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            } else {
                frame.style.height = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                    this.MEDIA_PADDING - sliderHeight - 5) + 'px';
                frame.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                    this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            }

            frame.style.width = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
            frame.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });

        images.forEach((image) => {
            if (this.showContribution()) {
                image.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT -
                    this.CONTRIBUTION_FOOTER_HEIGHT - this.TAB_HEIGHT -
                    this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            } else {
                image.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                    this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            }
            image.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });

        audios.forEach((audio) => {
            if (this.showContribution()) {
                audio.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                    this.CONTRIBUTION_FOOTER_HEIGHT - this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            } else {
                audio.style.maxHeight = (this.visualization.nativeElement.clientHeight - this.TOOLBAR_HEIGHT - this.TAB_HEIGHT -
                    this.MEDIA_PADDING - sliderHeight - 5) + 'px';
            }
            audio.style.maxWidth = (this.visualization.nativeElement.clientWidth - this.MEDIA_PADDING) + 'px';
        });
    }
}
