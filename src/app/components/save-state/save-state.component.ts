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
import { Component, OnInit, Input } from '@angular/core';

import { MatDialog, MatDialogRef, MatSnackBar, MatSidenav } from '@angular/material';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';

import { NeonGridItem } from '../../model/neon-grid-item';
import { neonEvents } from '../../model/neon-namespaces';

import * as _ from 'lodash';

import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { eventing } from 'neon-framework';
import { tap } from 'rxjs/operators';
import { NeonConfig, NeonDashboardConfig, NeonLayoutConfig } from '../../model/types';
import { DashboardState } from '../../model/dashboard-state';
import { ConfigService } from '../../services/config.service';

export function Verify(config: {
    title: string | ((arg: any) => string);
    message: string | ((arg: any) => string);
    confirmText: string | ((arg: any) => string);
    cancelText?: string | ((arg: any) => string);
}) {
    return (__inst: any, __prop: string | symbol, descriptor) => {
        const fn = descriptor.value;
        descriptor.value = function(this: SaveStateComponent, value: any, verify = false) {
            if (!verify) {
                return fn.call(this, value);
            }
            const out = {} as typeof config;
            for (const el of Object.keys(config)) {
                out[el] = typeof config[el] === 'string' ? config[el] : config[el](value);
            }
            this.openConfirmationDialog(out as any).subscribe(() => fn.call(this, value));
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

    public confirmDialogRef: MatDialogRef<DynamicDialogComponent>;
    private isLoading: boolean = false;
    private messenger: eventing.Messenger;
    public states: { total: number, results: NeonConfig[] } = { total: 0, results: [] };

    public readonly dashboardState: DashboardState;

    constructor(
        protected configService: ConfigService,
        protected dashboardService: DashboardService,
        protected filterService: FilterService,
        protected searchService: AbstractSearchService,
        public widgetService: AbstractWidgetService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
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

    private createDashboard(stateName: string, dashboard: NeonDashboardConfig, filters: any[]): NeonDashboardConfig {
        // Don't modify the original dashboard object
        let clonedDashboard = _.cloneDeep(dashboard);
        clonedDashboard.options = {
            ...(clonedDashboard.options || {}),
            connectOnLoad: true
        };
        // ClonedDashboard.modified = false;

        // Customize the dashboard with the saved state name
        clonedDashboard.name = stateName;
        clonedDashboard.layout = stateName;

        // Add the dashboard filters
        clonedDashboard.filters = filters;

        // Unset the properties that were set by the dataset service (but keep the fullTitle)
        clonedDashboard.pathFromTop = undefined;

        return clonedDashboard;
    }

    private createLayouts(stateName: string, widgetGridItems: NeonGridItem[]): Record<string, NeonLayoutConfig[]> {
        let layouts: Record<string, NeonLayoutConfig[]> = {};

        layouts[stateName] = widgetGridItems.map((widgetGridItem) => {
            // Let widget = this.getWidgetById(widgetGridItem.id);

            let widgetConfig: NeonLayoutConfig = {
                type: widgetGridItem.type,
                col: widgetGridItem.col,
                row: widgetGridItem.row,
                sizex: widgetGridItem.sizex,
                sizey: widgetGridItem.sizey
                // Bindings: widget.getBindings()
            };

            return widgetConfig;
        });

        return layouts;
    }

    /**
     * Saves the current dashboard state using the given name and closes the saved state menu.
     */
    @Verify({
        title: 'Save Changes',
        message: 'Looks like you have made changes to the current saved state.  Would you like to save these changes?',
        confirmText: 'Save',
        cancelText: 'Discard'
    })
    public saveState(name: string, __verify = false): void {
        const config = NeonConfig.get({

        });
        // Let stateData: NeonConfig = {
        //     projectTitle: validStateName,
        //     dashboards: this.createDashboard(validStateName, this.dashboardState.dashboard,
        //         this.filterService.getFiltersToSaveInConfig()),
        //     datastores: this.dashboardService.getDatastoresInConfigFormat(),
        //     layouts: this.createLayouts(validStateName, this.widgetGridItems),
        //     version: '1'
        // };

        this.configService.save(config)
            .subscribe(() => {
                this.listStates();
                this.openNotification(config.fileName, 'saved');
                this.closeSidenav();
            }, this.handleStateFailure.bind(this, config.fileName));
    }

    /**
     * Loads the dashboard state with the given name.
     *
     * @arg {string} name
     */
    public loadState(name: string): void {
        const validStateName = this.validateName(name);
        this.configService.load(validStateName)
            .subscribe((config) => {
                if (config.dashboards && config.datastores && config.layouts) {
                    this.dashboardService.setConfig(config);

                    // Dashboard choices should be set by wrapInSavedStateDashboard
                    this.messenger.publish(neonEvents.DASHBOARD_STATE, {
                        dashboard: config.dashboards
                    });
                    this.openNotification(name, 'loaded');
                    this.closeSidenav();
                } else {
                    this.openNotification(name, 'not loaded:  bad format');
                }
            }, this.handleStateFailure.bind(this, validStateName));
    }

    /*
     * Deletes the state for the name choosen.
     */
    @Verify({
        title: 'Delete Changes',
        message: (name) => `Are you sure you want to delete '${name}' ?`,
        confirmText: 'Delete'
    })
    public deleteState(name: string, __verify = false) {
        const validStateName = this.validateName(name);

        this.configService.delete(validStateName)
            .subscribe(() => {
                this.listStates();
                this.openNotification(name, 'deleted');
            }, this.handleStateFailure.bind(this, validStateName));
    }

    getDefaultOptionTitle() {
        return this.isLoading ? 'Loading...' : 'Select a name';
    }

    /**
     * Shows an error notification.
     *
     * @arg {Object} response
     * @private
     */
    private handleStateFailure(name: string, response: any) {
        this.isLoading = false;
        this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
            error: response.responseJSON ? response.responseJSON.error : undefined,
            message: 'State operation failed on ' + name
        });
    }

    /**
     * Updates the list of available dashboard states.
     *
     * @private
     */
    private listStates(limit = 100, offset = 0) {
        this.isLoading = true;
        this.states = { total: 0, results: [] };
        this.configService.list(limit, offset)
            .subscribe((items) => {
                this.isLoading = false;
                this.states = items;
            }, this.handleStateFailure.bind(this, 'load states'));
    }

    public openConfirmationDialog(config: { title: string, message: string, confirmText: string, cancelText?: string }) {
        this.confirmDialogRef = this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'confirmation-dialog',
                cancelText: 'Cancel',
                ...config
            },
            height: 'auto',
            width: '500px',
            disableClose: false
        });

        return this.confirmDialogRef.afterClosed()
            .pipe(tap(() => {
                this.confirmDialogRef = null;
            }));
    }

    public openNotification(stateName: string, actionName: string) {
        let message = 'State "' + stateName + '" was ' + actionName;
        this.snackBar.open(message, 'x', {
            duration: 5000,
            verticalPosition: 'top'
        });
    }

    private validateName(stateName: string): string {
        // Replace / with . and remove ../ and non-alphanumeric characters except ._-+=,
        return stateName.replace(/\.\.\//g, '').replace(/\//g, '.').replace(/[^A-Za-z0-9._\-+=,]/g, '');
    }
}
