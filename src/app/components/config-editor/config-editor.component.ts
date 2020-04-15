/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConfigService } from '../../services/config.service';
import { NeonConfig } from '../../models/types';

import { neonEvents } from '../../models/neon-namespaces';

import { eventing } from 'neon-framework';

import * as yaml from 'js-yaml';

@Component({
    selector: 'app-config-editor',
    templateUrl: 'config-editor.component.html',
    styleUrls: [
        'config-editor.component.scss'
    ]
})
export class ConfigEditorComponent implements OnInit, OnDestroy {
    public CONFIG_PROP_NAME: string = 'config';
    public currentConfig: NeonConfig;
    public configText: string;
    public dashboardName: string = '';
    destroy = new Subject();

    private messenger: eventing.Messenger;

    constructor(private configService: ConfigService, private router: Router) {
        this.messenger = new eventing.Messenger();
    }

    ngOnInit(): void {
        this.configService.getActive()
            .pipe(takeUntil(this.destroy))
            .subscribe((neonConfig) => {
                this.currentConfig = neonConfig;
                if (this.currentConfig.errors) {
                    delete this.currentConfig.errors;
                }
                this.cancel();
            });
    }

    ngOnDestroy() {
        this.destroy.next();
    }

    public save() {
        const settings = yaml.safeLoad(this.configText);

        this.configService.save(settings, this.dashboardName)
            .subscribe(() => {
                this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                    message: 'Dashboard ' + this.dashboardName + ' saved successfully.'
                });
                this.configService.load(this.dashboardName).subscribe((config) => {
                    this.router.navigate(['/'], {
                        fragment: '',
                        queryParams: {
                            dashboard: config.fileName
                        },
                        relativeTo: this.router.routerState.root
                    });
                });
            },
            (response) => {
                this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                    error: response,
                    message: 'Error saving new configuration'
                });
            });
    }

    public cancel() {
        this.configText = yaml.safeDump(this.currentConfig);
    }
}
