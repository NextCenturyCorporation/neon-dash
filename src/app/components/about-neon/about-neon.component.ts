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
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { NeonConfig } from '../../models/types';
import { environment } from '../../../environments/environment';
import { util } from 'neon-framework';

@Component({
    selector: 'app-about-neon',
    templateUrl: 'about-neon.component.html',
    styleUrls: ['about-neon.component.scss']
})
export class AboutNeonComponent implements OnInit {
    @Input() public dashboardVersion: string = 'Unavailable...';

    @ViewChild('customAboutTextDiv') customAboutTextDiv: ElementRef;

    public backendVersion: string = 'Unavailable...';
    public buildDate: string = environment.buildDate;
    public commitId: string = environment.recentGit;

    constructor(private configService: ConfigService) {
        // Do nothing.
    }

    ngOnInit() {
        if (!this.backendVersion) {
            util.infoUtils.getNeonVersion((result) => {
                this.backendVersion = result;
            });
        }
        this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
            this.customAboutTextDiv.nativeElement.innerHTML = neonConfig.about;
        });
    }
}
