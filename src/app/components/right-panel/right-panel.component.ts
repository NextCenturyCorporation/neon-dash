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
 */
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation,
    ChangeDetectorRef
} from '@angular/core';

import { RightPanelService } from '../../services/right-panel.service';
import { ThemesService } from '../../services/themes.service';

@Component({
    selector: 'app-right-panel',
    templateUrl: 'right-panel.component.html',
    styleUrls: ['right-panel.component.scss']
})
export class RightPanelComponent implements OnInit {

    constructor(
        public rightPanelService: RightPanelService,
        public themesService: ThemesService
    ) {
        this.rightPanelService = rightPanelService;
        this.themesService = themesService;
    }

    ngOnInit() {
        //
    }

}
