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
import { Component, OnInit, Input } from '@angular/core';
import { MatDialog, MatSidenav } from '@angular/material';
import { Router } from '@angular/router';

import { filter } from 'rxjs/operators';

import { ConfigService } from '../../services/config.service';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardState } from '../../models/dashboard-state';
import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { NeonConfig } from '../../models/types';
import { neonEvents } from '../../models/neon-namespaces';

import { eventing } from 'neon-framework';

export function Confirm(config: {
    title: string | ((arg: any) => string);
    confirmMessage: string | ((arg: any) => string);
    confirmText: string | ((arg: any) => string);
    cancelText?: string | ((arg: any) => string);
}) {
    return (__inst: any, __prop: string | symbol, descriptor) => {
        const fn = descriptor.value;
        // TODO Why doesn't this function have a return value?
        /* eslint-disable-next-line consistent-return */
        descriptor.value = function(this: SaveStateComponent, value: any, confirm = true) {
            if (!confirm) {
                return fn.call(this, value);
            }
            const out = {} as typeof config;
            for (const el of Object.keys(config)) {
                out[el] = typeof config[el] === 'string' ? config[el] : config[el](value);
            }
            this.openConfirmationDialog(out as any)
                .pipe(filter((result) => !!result))
                .subscribe(() => fn.call(this, value));
        };
    };
}

@Component({
    selector: 'app-save-state',
    templateUrl: 'save-state.component.html',
    styleUrls: ['save-state.component.scss']
})
export class SaveStateComponent implements OnInit {
    @Input() sidenav: MatSidenav;

    public states: { total: number, results: NeonConfig[] } = { total: 0, results: [] };

    public readonly dashboardState: DashboardState;

    private isLoading: boolean = false;
    private messenger: eventing.Messenger;

    constructor(
        protected configService: ConfigService,
        protected dashboardService: DashboardService,
        private dialog: MatDialog,
        private router: Router
    ) {
        this.messenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
    }

    ngOnInit() {
        this.listStates();
    }

    private closeSidenav() {
        if (this.sidenav) {
            this.sidenav.close();
        }
    }

    /**
     * Creates an empty dashboard state using the given name, automatically loads it, and closes the saved state menu.
     */
    public createState(name: string): void {
        const config = this.dashboardService.createEmptyDashboardConfig(name);
        this.configService.save(config, name)
            .subscribe(() => {
                this.openNotification(name, 'created');
                this.loadState(name);
            }, this.handleStateFailure.bind(this, name));
    }

    get currentFilename() {
        return this.dashboardService.config.fileName;
    }

    /**
     * Saves the current dashboard state using the given name and closes the saved state menu.
     */
    @Confirm({
        title: 'Save Changes',
        confirmMessage: 'Looks like you have made changes to the current saved state.  Would you like to save these changes?',
        confirmText: 'Save',
        cancelText: 'Discard'
    })
    public saveState(name: string, __confirm = true): void {
        const config = this.dashboardService.exportToConfig(name);
        this.configService.save(config, name)
            .subscribe(() => {
                this.dashboardState.modified = false;
                this.openNotification(name, 'saved');
                this.closeSidenav();
            }, this.handleStateFailure.bind(this, name));
    }

    /**
     * Loads the dashboard state with the given name.
     */
    public loadState(name: string): void {
        this.configService.load(name)
            .subscribe((config) => {
                this.router.navigate(['/'], {
                    fragment: '',
                    queryParams: {
                        dashboard: config.fileName
                    },
                    relativeTo: this.router.routerState.root
                });
                this.closeSidenav();
            }, this.handleStateFailure.bind(this, name));
    }

    /*
     * Deletes the state for the name chosen.
     */
    @Confirm({
        title: 'Delete Changes',
        confirmMessage: (name) => `Are you sure you want to delete '${name}' ?`,
        confirmText: 'Delete'
    })
    public deleteState(name: string, __confirm = true) {
        this.configService.delete(name)
            .subscribe(() => {
                this.listStates();
                this.openNotification(name, 'deleted');
            }, this.handleStateFailure.bind(this, name));
    }

    getDefaultOptionTitle() {
        return this.isLoading ? 'Loading...' : 'Select a name';
    }

    /**
     * Shows an error notification.
     */
    private handleStateFailure(name: string, response: any) {
        this.isLoading = false;
        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            error: response,
            message: 'Dashboard state operation failed on "' + name + '"'
        });
    }

    /**
     * Updates the list of available dashboard states.
     */
    listStates(limit = 100, offset = 0) {
        this.isLoading = true;
        this.states = { total: 0, results: [] };
        this.configService.list(limit, offset)
            .subscribe((items) => {
                this.isLoading = false;
                this.states = items;
            }, this.handleStateFailure.bind(this, 'load states'));
    }

    public openConfigEditor() {
        this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'config-editor'
            },
            height: '95%',
            width: '95%',
            hasBackdrop: true,
            disableClose: true
        });
    }

    public openConfirmationDialog(config: { title: string, message: string, confirmText: string, cancelText?: string }) {
        return this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'confirmation-dialog',
                cancelText: 'Cancel',
                ...config
            },
            height: 'auto',
            width: '500px',
            disableClose: false
        }).afterClosed();
    }

    public openNotification(stateName: string, actionName: string) {
        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            message: `Dashboard state "${stateName}" was ${actionName} successfully!`
        });
    }
}
