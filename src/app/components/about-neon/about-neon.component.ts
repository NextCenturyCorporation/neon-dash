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
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { NeonConfig } from '../../models/types';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-about-neon',
    templateUrl: 'about-neon.component.html',
    styleUrls: ['about-neon.component.scss']
})
export class AboutNeonComponent implements OnInit {
    @ViewChild('customAboutTextDiv') customAboutTextDiv: ElementRef;

    public dashBuildDate = environment.buildDate;
    public dashGitCommit = environment.recentGit;
    public serverBuildDate = '?';
    public serverGitCommit = '?';

    constructor(private configService: ConfigService, private connectionService: InjectableConnectionService) {
        // Do nothing.
    }

    getCustomAboutTextDivElement(): HTMLElement {
        return this.customAboutTextDiv.nativeElement;
    }

    ngOnInit() {
        let divElement = this.getCustomAboutTextDivElement();
        this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
            divElement.innerHTML = neonConfig.about;
        });
        this.connectionService.getServerStatus((response) => {
            this.serverBuildDate = response['Build Date'] || '?';
            this.serverGitCommit = response['Git Commit'] || '?';
        });
    }
}
