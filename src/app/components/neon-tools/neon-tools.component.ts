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
import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { NeonConfig } from '../../models/types';

@Component({
    selector: 'app-neon-tools',
    templateUrl: './neon-tools.component.html',
    styleUrls: ['./neon-tools.component.css']
})
export class NeonToolsComponent implements OnInit {
    programName: string;
    programSponsor: string;
    programManager: string;
    principalInvestigator: string;
    contributors: any[];

    constructor(private configService: ConfigService) { }

    ngOnInit() {
        this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
            if (typeof neonConfig.neonTools === 'object') {
                this.programName = neonConfig.neonTools.programName;
                this.programSponsor = neonConfig.neonTools.programSponsor;
                this.programManager = neonConfig.neonTools.programManager;
                this.principalInvestigator = neonConfig.neonTools.principalInvestigator;
                this.contributors = neonConfig.neonTools.contributors;
            }
        });
    }
}
