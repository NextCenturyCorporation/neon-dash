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
import { Component, OnInit, OnDestroy } from '@angular/core';

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
    destroy = new Subject();

    private messenger: eventing.Messenger;

    constructor(private configService: ConfigService) {
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
                this.reset();
            });
    }

    ngOnDestroy() {
        this.destroy.next();
    }

    public save() {
        const settings = yaml.safeLoad(this.configText);

        this.configService.save(settings)
            .subscribe(() => {
                this.configService.setActive(settings);
                this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                    message: 'New configuration saved successfully.  Refresh to see changes.'
                });
            },
            (response) => {
                this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                    error: response,
                    message: 'Error saving new configuration'
                });
            });
    }

    public reset() {
        this.configText = yaml.safeDump(this.currentConfig);
    }
}
