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
    ElementRef,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    AfterViewInit
} from '@angular/core';
import { MediaTypes } from '../../models/types';
import { RootWidgetOptionCollection } from '../../models/widget-option-collection';
import { DashboardState } from '../../models/dashboard-state';
import { DomSanitizer } from '@angular/platform-browser';

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
export class MediaGroupComponent implements AfterViewInit {
    @Input() tabsAndMedia: MediaMetaData;
    @Input() dashboardState: DashboardState;
    @Input() visualization: ElementRef;
    @Input() options: RootWidgetOptionCollection;
    @Input() sanitizer: DomSanitizer;
    @Input() changeDetection: ChangeDetectorRef;

    public selectedLinkIndex: number = 0;

    public mediaTypes: any = MediaTypes;

    /**
     * Returns the opacity for the given percent.
     *
     * @arg {number} percent
     * @return {number}
     */
    calculateOpacity(percent: number): number {
        return (100 - percent) / 100;
    }

    sanitize(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    ngAfterViewInit() {
        this.refreshVisualization();
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        /* eslint-disable-next-line dot-notation */
        if (!this.changeDetection['destroyed']) {
            this.changeDetection.detectChanges();
        }
    }
}
