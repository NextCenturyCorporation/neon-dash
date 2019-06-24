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
import { Component, Input, OnInit } from '@angular/core';

import { util } from 'neon-framework';

@Component({
    selector: 'app-about-neon',
    templateUrl: 'about-neon.component.html',
    styleUrls: ['about-neon.component.scss']
})
export class AboutNeonComponent implements OnInit {
    @Input() public dashboardVersion: string = 'Unavailable...';

    public backendVersion: string = 'Unavailable...';

    ngOnInit() {
        if (!this.backendVersion) {
            util.infoUtils.getNeonVersion((result) => {
                this.backendVersion = result;
            });
        }
    }
}
