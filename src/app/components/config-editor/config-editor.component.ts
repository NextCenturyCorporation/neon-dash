/*
 * Copyright 2017 Next Century Corporation
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
 *
 */
import { Component, OnInit } from '@angular/core';

import { MatSnackBar } from '@angular/material';
import { NeonConfig } from './../../model/types';

import { AbstractWidgetService } from '../../services/abstract.widget.service';

import * as yaml from 'js-yaml';
import { ConfigService } from '../../services/config.service';

@Component({
    selector: 'app-config-editor',
    templateUrl: 'config-editor.component.html',
    styleUrls: [
        'config-editor.component.scss'
    ]
})
export class ConfigEditorComponent implements OnInit {
    public CONFIG_PROP_NAME: string = 'config';
    public currentConfig: NeonConfig;
    public DEFAULT_SNACK_BAR_DURATION: number = 3000;
    public configText: string;

    constructor(
        private configService: ConfigService,
        public snackBar: MatSnackBar,
        protected widgetService: AbstractWidgetService
    ) {
        this.snackBar = snackBar;
    }

    ngOnInit(): void {
        this.configService.getActive().subscribe((neonConfig) => {
            this.currentConfig = neonConfig;
            if (this.currentConfig.errors) {
                delete this.currentConfig.errors;
            }
            this.reset();
        });
    }

    public save() {
        const settings = yaml.safeLoad(this.configText);

        this.configService.save(settings)
            .subscribe(() => {
                this.configService.setActive(settings);
                this.snackBar.open('Configuration updated successfully.  Refresh to reflect changes.', 'OK', {
                    duration: this.DEFAULT_SNACK_BAR_DURATION
                });
            },
                (err) => {
                    this.snackBar.open('Error attempting to save configuration', 'OK', {
                        duration: this.DEFAULT_SNACK_BAR_DURATION
                    });
                    console.warn('Error attempting to save configuration:');
                    console.warn(err);
                });
    }

    public reset() {
        this.configText = yaml.safeDump(this.currentConfig);
    }
}
