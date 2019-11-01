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
    @ViewChild('customAboutTextDiv', { static: true }) customAboutTextDiv: ElementRef;

    public dashBuildDate = environment.buildDate;
    public dashGitCommit = environment.recentGit;
    public serverBuildDate = '?';
    public serverGitCommit = '?';

    public info = null;
    public memberList = null;
    public misc = null;

    constructor(private configService: ConfigService, private connectionService: InjectableConnectionService) {
        // Do nothing.
    }

    getCustomAboutTextDivElement(): HTMLElement {
        return this.customAboutTextDiv.nativeElement;
    }

    ngOnInit() {
        let divElement = this.getCustomAboutTextDivElement();
        this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
            if (typeof neonConfig.about === 'string') {
                divElement.innerHTML = neonConfig.about;
            }

            if (typeof neonConfig.about === 'object') {
                this.info = (neonConfig.about.info && typeof neonConfig.about.info === 'object') ? {
                    data: neonConfig.about.info.data,
                    header: neonConfig.about.info.header,
                    icon: neonConfig.about.info.icon,
                    leader: neonConfig.about.info.leader,
                    link: neonConfig.about.info.link
                } : null;
                this.memberList = (neonConfig.about.memberList && typeof neonConfig.about.memberList === 'object') ? {
                    data: neonConfig.about.memberList.data,
                    header: neonConfig.about.memberList.header
                } : null;
                this.misc = (neonConfig.about.misc && Array.isArray(neonConfig.about.misc)) ? neonConfig.about.misc.map((item) => ({
                    data: item.data,
                    header: item.header
                })) : null;
            }
        });
        this.connectionService.getServerStatus((response) => {
            this.serverBuildDate = response['Build Date'] || '?';
            this.serverGitCommit = response['Git Commit'] || '?';
        });
    }
}
