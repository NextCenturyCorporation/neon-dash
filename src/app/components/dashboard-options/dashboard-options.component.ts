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
import { Component, OnInit, ViewContainerRef, Input } from '@angular/core';
import { URLSearchParams } from '@angular/http';

import { MatDialog, MatDialogRef, MatSnackBar, MatSidenav } from '@angular/material';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ParameterService } from '../../services/parameter.service';
import { ThemesService } from '../../services/themes.service';

import { ConfigEditorComponent } from '../config-editor/config-editor.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';

import * as _ from 'lodash';
import * as neon from 'neon-framework';
import { VisualizationService } from '../../services/visualization.service';

@Component({
  selector: 'app-dashboard-options',
  templateUrl: './dashboard-options.component.html',
  styleUrls: ['./dashboard-options.component.scss']
})
export class DashboardOptionsComponent implements OnInit {

    @Input() sidenav: MatSidenav;

    public formData: any = {
        exportFormat: 0,
        currentTheme: 'neon-green-theme',
        newStateName: '',
        stateToLoad: '',
        stateToDelete: ''
    };

    public confirmDialogRef: MatDialogRef<ConfirmationDialogComponent>;
    private dashboardStateId: string = '';
    private filterStateId: string = '';
    private isLoading: boolean = false;
    private messenger: neon.eventing.Messenger;
    public stateNames: string[] = [];
    public exportTarget: string = 'all';

    constructor(private connectionService: ConnectionService,  private datasetService: DatasetService,
        private errorNotificationService: ErrorNotificationService, public exportService: ExportService,
        private snackBar: MatSnackBar, private parameterService: ParameterService,
        public themesService: ThemesService, private viewContainerRef: ViewContainerRef, private dialog: MatDialog,
        private visualizationService: VisualizationService) { }

    ngOnInit() {
        this.formData.exportFormat = this.exportService.getFileFormats()[0].value;
        this.formData.currentTheme = this.themesService.getCurrentTheme().id;
        this.messenger = new neon.eventing.Messenger();
        this.loadStateNames();
    }

    setCurrentTheme(themeId: any) {
        if (themeId) {
            this.themesService.setCurrentTheme(themeId);
        }
    }

    openEditConfigDialog() {
        let dConfig  = {
            height: '80%',
            width: '80%',
            hasBackdrop: true,
            disableClose: true
        };
        let dialogRef = this.dialog.open(ConfigEditorComponent, dConfig);
    }

    /*
     * Saves the current state to the given name.
     * @param {String} name
     * @method saveState
     */
    saveState(name: string) {
        /*
        // Commenting this out because it causes silent failure on trying to update a saved state.
        // Better for now to let people overwrite states and protect them from themselves later.
        if (!this.validateName(name)) {
            console.error('Name already exists');
            return;
        }*/
        let stateParams: any = {};

        if (name) {
            stateParams.stateName = name;
        }

        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (connection) {
            // Get each visualization's bindings and save them to our dashboard state parameter
            stateParams.dashboard = this.visualizationService.getWidgets();

            stateParams.dataset = this.datasetService.getDataset();

            connection.saveState(stateParams, (response) => {
                this.handleSaveStateSuccess(response);
                this.openNotification(name, 'saved');
            }, (response) => {
                this.handleStateFailure(response);
            });
        }
        this.sidenav.close();
    }

    /*
     * Validates a state's name by checking that the name doesn't exist already for another saved state.
     */
    validateName(name: string): boolean {
        return (!this.stateNames.length || this.stateNames.indexOf(name) === -1);
    }

    /*
     * Loads the states for the name choosen and updates the dashboard and url parameters.
     */
    loadState(name: string) {
        if (this.validateName(name)) {
            return;
        }
        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (connection) {
            let stateParams = {
                stateName: name
            };
            connection.loadState(stateParams, (dashboardState) => {
                if (_.keys(dashboardState).length) {
                    // ensure that active dataset matches the one we're attempting to load
                    dashboardState.dataset.name += ' (' + name + ')';
                    this.datasetService.setActiveDataset(dashboardState.dataset);
                    this.parameterService.loadStateSuccess(dashboardState, dashboardState.dashboardStateId);
                    this.openNotification(name, 'loaded');
                } else {
                    this.errorNotificationService.showErrorMessage(null, 'State ' + name + ' not found.');
                }
            }, (response) => {
                this.handleStateFailure(response);
            });
        }
        this.sidenav.close();
    }

    /*
     * Deletes the state for the name choosen.
     * @method deleteState
     */
    deleteState(name: string) {
        if (this.validateName(name)) {
            return;
        }
        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (connection) {
            connection.deleteState(this.formData.stateToDelete, (stateIds) => {
                this.loadStateNames();
                this.openNotification(name, 'deleted');
            }, (response) => {
                this.handleStateFailure(response);
            });
        }
        this.sidenav.close();
    }

    getDefaultOptionTitle() {
        return this.isLoading ? 'Loading...' : 'Select a name';
    }

    /*
     * Replaces the url parameters on a successful state save.
     * @param {Object} response
     * @private
     */
    handleSaveStateSuccess(response) {
        this.dashboardStateId = response.dashboardStateId;
        this.filterStateId = response.filterStateId;
        this.formData.stateToSave = '';

        this.parameterService.updateStateParameters(response.dashboardStateId, response.filterStateId);
        this.loadStateNames();
    }

    /*
     * Shows an error notification on a state call error.
     * @param {Object} response
     * @private
     */
    handleStateFailure(response) {
        this.errorNotificationService.showErrorMessage(null, response.responseJSON.error);
    }

    /*
     * Retrieves all the current state names before when any of the modals are shown.
     * @private
     */
    loadStateNames() {
        this.formData.stateToDelete = '';
        this.formData.stateToLoad = '';
        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (!connection) {
            connection = this.connectionService.createActiveConnection();
        }

        this.isLoading = true;
        connection.getAllStateNames((stateNames) => {
            this.stateNames = stateNames;
            this.isLoading = false;
        }, (response) => {
            this.isLoading = false;
            this.stateNames = [];
            this.errorNotificationService.showErrorMessage(null, response.responseJSON.error);
        });
    }

    setStateToLoad(name: string) {
        this.formData.stateToLoad = name;
    }

    setStateToDelete(name: string) {
        this.formData.stateToDelete = name;
    }

    openConfirmationDialog() {
        this.confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
            height: '130px',
            width: '500px',
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete ';
        this.confirmDialogRef.componentInstance.cancelText = 'Cancel';
        this.confirmDialogRef.componentInstance.confirmText = 'Delete';
        this.confirmDialogRef.componentInstance.target = this.formData.stateToDelete;

        this.confirmDialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.deleteState(this.formData.stateToDelete);
            }
            this.confirmDialogRef = null;
        });
    }

    public openNotification(stateName: String, actionName: String) {
        let message = 'State "' + stateName + '" has been ' + actionName;
        this.snackBar.open(message, 'x', {
            duration: 5000,
            verticalPosition: 'top',
            panelClass: ['simpleSnackBar']
         });
    }
}
