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
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { distinctUntilKeyChanged } from 'rxjs/operators';

import { AbstractColorThemeService } from '@caci-critical-insight-solutions/nucleus-core';
import { ConfigService } from './services/config.service';
import { DashboardService } from './services/dashboard.service';
import { RouteWithStateComponent } from './route-with-state.component';

@Component({
    selector: 'app-route-request',
    templateUrl: './route-request.component.html',
    styleUrls: ['./route-request.component.scss']
})
export class RouteRequestComponent extends RouteWithStateComponent {
    public webpageTitle: string = 'Loading...';

    constructor(
        private colorThemeService: AbstractColorThemeService,
        configService: ConfigService,
        dashboardService: DashboardService,
        router: Router
    ) {
        super(configService, dashboardService, router);
        dashboardService.configSource.pipe(distinctUntilKeyChanged('fileName')).subscribe((config) => {
            this.webpageTitle = 'Submit Data to ' + (config.projectTitle || 'Neon');
            document.title = this.webpageTitle;
        });
    }
}
