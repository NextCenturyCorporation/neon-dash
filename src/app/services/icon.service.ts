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

import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';
import { Injectable } from '@angular/core';

/**
 * Registers icons for use with the mat-icon tag
 */
@Injectable()
export class IconService {
    constructor(private domSanitizer: DomSanitizer,
                private matIconRegistry: MatIconRegistry) {
    }

    public registerIcons() {
        this.registerIcon('filter_builder', 'filter_builder', null,
            './assets/icons');

        this.registerIcon(
            'filter_builder_active', 'filter_builder_active', null,
            './assets/icons'
        );

        this.registerIcon('add_circle', 'add_circle-24px');
        this.registerIcon('arrow_downward', 'arrow_downward-24px');
        this.registerIcon('arrow_drop_down', 'arrow_drop_down-24px');
        this.registerIcon('arrow_upward', 'arrow_upward-24px');
        this.registerIcon('check_circle', 'check_circle-24px');
        this.registerIcon('clear', 'clear-24px');
        this.registerIcon('close', 'close-24px');
        this.registerIcon('delete', 'delete-24px');
        this.registerIcon('delete_sweep', 'delete_sweep-24px');
        this.registerIcon('dashboard', 'dashboard-24px');
        this.registerIcon('drag_handle', 'drag_handle-24px');
        this.registerIcon('error', 'error-24px');
        this.registerIcon('filter_list', 'filter_list-24px');
        this.registerIcon('find_replace', 'find_replace-24px');
        this.registerIcon('fullscreen', 'fullscreen-24px');
        this.registerIcon('fullscreen_exit', 'fullscreen_exit-24px');
        this.registerIcon('info', 'info-24px');
        this.registerIcon('keyboard_arrow_down', 'keyboard_arrow_down-24px');
        this.registerIcon('keyboard_arrow_up', 'keyboard_arrow_up-24px');
        this.registerIcon('menu', 'menu-24px');
        this.registerIcon('refresh', 'refresh-24px');
        this.registerIcon('save', 'save-24px');
        this.registerIcon('search', 'search-24px');
        this.registerIcon('settings', 'settings-24px');
        this.registerIcon('stop', 'stop-24px');
        this.registerIcon('storage', 'storage-24px');
    }

    protected registerIcon(name: string,
                           fileBasename: string,
                           namespace: string = 'neon',
                           directory: string = './assets/material-icons') {
        let url = this.domSanitizer.bypassSecurityTrustResourceUrl(
            directory + '/' + fileBasename + '.svg');
        if (namespace == null) {
            this.matIconRegistry.addSvgIcon(name, url);
        } else {
            this.matIconRegistry.addSvgIconInNamespace(
                namespace,
                name,
                url
            );
        }

    }

}
