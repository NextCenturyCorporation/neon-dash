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
import { OnInit, HostBinding, Inject } from '@angular/core';
import { ConfigService } from './services/config.service';
import { NeonConfig } from './models/types';
import { Router, NavigationEnd } from '@angular/router';
import { distinctUntilKeyChanged, filter, mergeMap } from 'rxjs/operators';
import { APP_BASE_HREF } from '@angular/common';

export class RouteWithStateComponent implements OnInit {
    public config: NeonConfig;

    @HostBinding('class.loading')
    loading = true;

    constructor(
        private configService: ConfigService,
        private router: Router,
        @Inject(APP_BASE_HREF) private baseHref: string
    ) { }

    ngOnInit() {
        this.router.events
            .pipe(
                filter((ev) => ev instanceof NavigationEnd),
                mergeMap(() => this.configService.setActiveByURL(window.location, this.baseHref)),
                distinctUntilKeyChanged('fileName')
            )
            .subscribe((config) => {
                this.config = config;
                this.loading = false;
            });

        this.configService.setActiveByURL(window.location, this.baseHref).subscribe((config) => {
            this.config = config;
            this.loading = false;
        });
    }
}
