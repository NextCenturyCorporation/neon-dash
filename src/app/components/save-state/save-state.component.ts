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

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';

import { Dashboard } from '../../types';
import { NeonGridItem } from '../../neon-grid-item';
import { neonEvents } from '../../neon-namespaces';

import * as _ from 'lodash';

import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { eventing } from 'neon-framework';
import { tap } from 'rxjs/operators';
import { ConnectionService } from '../../services/connection.service';
import { NeonGTDConfig } from '../../neon-gtd-config';

@Component({
    selector: 'app-save-state',
    templateUrl: 'save-state.component.html',
    styleUrls: ['save-state.component.scss']
})
export class SaveStateComponent implements OnInit {
    private static SAVED_STATE_DASHBOARD_KEY = 'saved_state';

    @Input() sidenav: MatSidenav;

    @Input() public widgetGridItems: NeonGridItem[] = [];
    @Input() public widgets: Map<string, BaseNeonComponent> = new Map();
    @Input() public current: Dashboard;

    public confirmDialogRef: MatDialogRef<DynamicDialogComponent>;
    private isLoading: boolean = false;
    private messenger: eventing.Messenger;
    public states: { total: number, results: NeonGTDConfig[] } = { total: 0, results: [] };

    constructor(
        protected datasetService: DashboardService,
        protected filterService: FilterService,
        protected connectionService: ConnectionService,
        protected searchService: AbstractSearchService,
        public widgetService: AbstractWidgetService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.messenger = new eventing.Messenger();
    }

    ngOnInit() {
        this.fetchStates();
    }

    private closeSidenav() {
        if (this.sidenav) {
            this.sidenav.close();
        }
    }

    openEditConfigDialog() {
        this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'config-editor'
            },
            height: '80%',
            width: '80%',
            hasBackdrop: true,
            disableClose: true
        });
    }

    private createDashboard(stateName: string, dashboard: Dashboard, filters: any[]): Dashboard {
        // Don't modify the original dashboard object
        let clonedDashboard = _.cloneDeep(dashboard);
        clonedDashboard.options.connectOnLoad = true;
        clonedDashboard.modified = false;

        // Customize the dashboard with the saved state name
        clonedDashboard.name = stateName;
        clonedDashboard.layout = stateName;

        // Add the dashboard filters
        clonedDashboard.filters = filters;

        // Unset the properties that were set by the dataset service (but keep the fullTitle)
        clonedDashboard.datastores = undefined;
        clonedDashboard.layoutObject = undefined;
        clonedDashboard.pathFromTop = undefined;

        return clonedDashboard;
    }

    private createLayouts(stateName: string, widgetGridItems: NeonGridItem[]): { [key: string]: any } {
        let layouts: { [key: string]: any } = {};

        layouts[stateName] = widgetGridItems.map((widgetGridItem) => {
            let widget = this.getWidgetById(widgetGridItem.id);

            let widgetConfig: { [key: string]: any } = {
                type: widgetGridItem.type,
                col: widgetGridItem.col,
                row: widgetGridItem.row,
                sizex: widgetGridItem.sizex,
                sizey: widgetGridItem.sizey,
                bindings: widget.getBindings()
            };

            return widgetConfig;
        });

        return layouts;
    }

    /**
     * Saves the current dashboard state using the given name and closes the saved state menu.
     *
     * @arg {string} name
     */
    public saveState(name: string, isOverwrite = false): void {
        if (isOverwrite) {
            this.openConfirmationDialog(
                'Save Changes',
                'Looks like you have made changes to the current saved state.  Would you like to save these changes?',
                'Save',
                'Discard'
            )
                .subscribe((result) => {
                    if (result) {
                        this.saveState(name, false);
                    }
                });
            return;
        }
        let connection = this.openConnection();
        if (connection) {
            let validStateName = this.validateName(name);
            // Same format as the config file.
            let stateData: any = {
                dashboards: this.createDashboard(validStateName, this.datasetService.getCurrentDashboard(),
                    this.filterService.getFiltersToSaveInConfig()),
                datastores: this.datasetService.getDatastoresInConfigFormat(),
                layouts: this.createLayouts(validStateName, this.widgetGridItems),
                stateName: validStateName
            };

            connection.saveState(stateData, (response) => {
                if (this.current) {
                    this.current.name = name;
                    this.current.fileName = `${validStateName}.yaml`;
                }
                this.handleSaveStateSuccess(response, validStateName);
            }, (response) => {
                this.handleStateFailure(response, validStateName);
            });
        }
        this.closeSidenav();
    }

    /**
     * Loads the dashboard state with the given name.
     *
     * @arg {string} name
     */
    public loadState(name: string): void {
        let connection = this.openConnection();
        if (connection) {
            let validStateName = this.validateName(name);
            connection.loadState(validStateName, (response) => {
                this.handleLoadStateSuccess(response, validStateName);
            }, (response) => {
                this.handleStateFailure(response, validStateName);
            });
        }
        this.closeSidenav();
    }

    /*
     * Deletes the state for the name choosen.
     * @method deleteState
     */
    public deleteState(name: string, verify = false) {
        if (verify) {
            this.openConfirmationDialog(
                'Delete Changes',
                `Are you sure you want to delete '${name}' ?`,
                'Delete'
            )
                .subscribe((result) => {
                    if (result) {
                        this.deleteState(name, false);
                    }
                });
            return;
        }
        let connection = this.openConnection();
        if (connection) {
            let validStateName = this.validateName(name);
            connection.deleteState(validStateName, (response) => {
                this.handleDeleteStateSuccess(response, validStateName);
            }, (response) => {
                this.handleStateFailure(response, validStateName);
            });
        }
    }

    getDefaultOptionTitle() {
        return this.isLoading ? 'Loading...' : 'Select a name';
    }

    private getWidgetById(id: string): any {
        return this.widgets.get(id);
    }

    private handleDeleteStateSuccess(__response: any, name: string) {
        this.fetchStates();
        this.openNotification(name, 'deleted');
    }

    private handleLoadStateSuccess(response: NeonGTDConfig, name: string) {
        if (response.dashboards && response.datastores && response.layouts) {
            let dashboard: Dashboard = this.datasetService.appendDatasets(this.wrapInSavedStateDashboard(name, response.dashboards),
                response.datastores, response.layouts);
            // Dashboard choices should be set by wrapInSavedStateDashboard
            if (dashboard.choices[SaveStateComponent.SAVED_STATE_DASHBOARD_KEY] &&
                dashboard.choices[SaveStateComponent.SAVED_STATE_DASHBOARD_KEY].choices[name]) {
                const dash = dashboard.choices[SaveStateComponent.SAVED_STATE_DASHBOARD_KEY].choices[name];
                dash.fileName = response['fileName'];  // TODO: Reconcile
                dash.lastModified = response['lastModified'];
                this.messenger.publish(neonEvents.DASHBOARD_STATE, {
                    dashboard: dash
                });
                this.openNotification(name, 'loaded');
            } else {
                console.error('Dashboard does not have saved state ' + name, dashboard);
            }
        } else {
            this.openNotification(name, 'not loaded:  bad format');
        }
    }

    /**
     * Updates the state in the URL parameters and reloads the available dashboard state names.
     *
     * @arg {Object} response
     * @private
     */
    private handleSaveStateSuccess(__response: any, name: string) {
        this.current.modified = false;
        this.current.lastModified = Date.now();

        this.fetchStates();
        this.openNotification(name, 'saved');
    }

    /**
     * Shows an error notification.
     *
     * @arg {Object} response
     * @private
     */
    private handleStateFailure(response: any, name: string) {
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
    private fetchStates(limit = 100, offset = 0) {
        this.isLoading = true;
        this.states = { total: 0, results: [] };
        let connection = this.openConnection();
        if (connection) {
            connection.listStates(limit, offset, (states) => {
                this.isLoading = false;
                this.states = states;
            }, (response) => {
                this.isLoading = false;
                this.handleStateFailure(response, 'load states');
            });
        }
    }

    public openConfirmationDialog(title: string, message: string, confirmText = 'Ok', cancelText = 'Cancel') {
        this.confirmDialogRef = this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'confirmation-dialog',
                title,
                confirmMessage: message,
                confirmText,
                cancelText
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

    private openConnection(): any {
        return this.connectionService.connect(this.datasetService.getDatastoreType(), this.datasetService.getDatastoreHost());
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

    private wrapInSavedStateDashboard(stateName: string, dashboard: Dashboard): Dashboard {
        let savedStateDashboard: Dashboard = new Dashboard();
        savedStateDashboard.name = 'Saved State';
        savedStateDashboard.choices = {};
        savedStateDashboard.choices[stateName] = dashboard;

        let rootDashboard: Dashboard = new Dashboard();
        rootDashboard.choices = {};
        rootDashboard.choices[SaveStateComponent.SAVED_STATE_DASHBOARD_KEY] = savedStateDashboard;
        return rootDashboard;
    }
}
