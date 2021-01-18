/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { OnInit, HostBinding } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { distinctUntilKeyChanged, filter, mergeMap } from 'rxjs/operators';

import { ConfigService } from './services/config.service';
import { ConfigUtil } from './util/config.util';
import { DashboardService } from './services/dashboard.service';
import { NeonConfig } from './models/types';

export class RouteWithStateComponent implements OnInit {
    public config: NeonConfig;

    @HostBinding('class.loading')
    loading = true;

    constructor(
        public configService: ConfigService,
        public dashboardService: DashboardService,
        private router: Router
    ) { }

    ngOnInit() {
        this.router.events
            .pipe(
                filter((ev) => ev instanceof NavigationEnd),
                mergeMap(() => this.configService.setActiveByURL(window.location)),
                distinctUntilKeyChanged('fileName')
            )
            .subscribe((config) => {
                this.config = config;
                this.loading = false;
            });

        this.dashboardService.configSource.subscribe((config) => {
            const dashboard = ConfigUtil.findAutoShowDashboard(config.dashboards);

            if (dashboard) {
                this.dashboardService.setActiveDashboard(dashboard);
            }
        });

        this.configService.setActiveByURL(window.location).subscribe((config) => {
            this.config = config;
            this.loading = false;
        });
    }
}
