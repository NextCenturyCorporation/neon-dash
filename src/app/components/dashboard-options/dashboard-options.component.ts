/*
 * Copyright 2016 Next Century Corporation
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
import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { URLSearchParams } from '@angular/http';

import { MdSnackBar, MdSnackBarConfig } from '@angular/material';
import { MdDialog, MdDialogRef } from '@angular/material';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ParameterService } from '../../services/parameter.service';
import { ThemesService } from '../../services/themes.service';

import { ConfigEditorComponent } from '../config-editor/config-editor.component';

import * as _ from 'lodash';
import * as neon from 'neon-framework';

@Component({
  selector: 'app-dashboard-options',
  templateUrl: './dashboard-options.component.html',
  styleUrls: ['./dashboard-options.component.scss']
})
export class DashboardOptionsComponent implements OnInit {
    public formData: any = {
        exportFormat: 0,
        currentTheme: 'neon-green-theme',
        newStateName: '',
        stateToLoad: '',
        stateToDelete: ''
    };

    private dashboardStateId: string = '';
    private filterStateId: string = '';
    private isLoading: boolean = false;
    private messenger: neon.eventing.Messenger;
    public stateNames: string[] = [];
    private stateName: string = '';
    private stateNameError: boolean = false;
    public exportTarget: string = 'all';

    constructor(private connectionService: ConnectionService,  private datasetService: DatasetService,
        private errorNotificationService: ErrorNotificationService, public exportService: ExportService,
        private mdSnackBar: MdSnackBar, private parameterService: ParameterService,
        public themesService: ThemesService, private viewContainerRef: ViewContainerRef, private dialog: MdDialog) { }

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
        //dialogRef.instance.configEditorRef
        //dialogRef.afterClosed().subscribe(result => {
        //  this.selectedOption = result;
        //});
      }


    /*
     * Saves the current state to the given name.
     * @param {String} name
     * @method saveState
     */
    saveState(name) {
        // TODO: Enable once the visualization service has been migrated
        let stateParams: any = {
            // dashboard: this.visualizations
        };

        if (name) {
            stateParams.stateName = name;
        }

        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (connection) {
            this.datasetService.setLineCharts([{}]);
            this.datasetService.setMapLayers([{}]);

            // Get each visualization's bindings and save them to our dashboard state parameter
            // this.visualizationService.getWidgets().forEach(function(widget) {
            //     let bindings = widget.callback();
            //     let visualization = _.filter(stateParams.dashboard, {
            //         id: widget.id
            //     });
            //     if(visualization && visualization.length) {
            //         visualization[0].bindings = _.deepClone(bindings);
            //     }
            // });

            stateParams.dataset = this.datasetService.getDataset();

            connection.saveState(stateParams, this.handleSaveStateSuccess, this.handleStateFailure);
        }
    };

    /*
     * Validates a state's name by checking that the name doesn't exist already for another saved state.
     */
    validateName() {
        this.stateNameError = (!this.stateNames.length || this.stateNames.indexOf(this.stateName) === -1 ? false : true);
    };

    /*
     * Loads the states for the name choosen and updates the dashboard and url parameters.
     */
    loadState() {
        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (connection) {
            let stateParams = {
                stateName: this.stateName
            };
            let me = this;
            connection.loadState(stateParams, function(dashboardState) {
                if (_.keys(dashboardState).length) {
                    let searchParams: URLSearchParams = new URLSearchParams();
                    dashboardState.dashboardStateId = searchParams.get('dashboard_state_id');
                    dashboardState.filterStateId = searchParams.get('filter_state_id');

                    me.parameterService.loadStateSuccess(dashboardState, dashboardState.dashboardStateId);
                } else {
                    me.errorNotificationService.showErrorMessage(null, 'State ' + this.stateName + ' not found.');
                }
            }, this.handleStateFailure);
        }
    };

    /*
     * Deletes the state for the name choosen.
     * @method deleteState
     */
    deleteState() {
        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (connection) {
            connection.deleteState(this.stateName, function(stateIds) {
                let params: URLSearchParams = new URLSearchParams();
                let dashboardStateId: string = params.get('dashboard_state_id');
                let filterStateId: string = params.get('filter_state_id');
                console.log('loaded ' + dashboardStateId + ' ' + filterStateId);

                // Delete the state parameters if either match the IDs deleted
                if (dashboardStateId && stateIds.dashboardStateId && dashboardStateId === stateIds.dashboardStateId)  {
                    params.delete('dashboard_state_id');
                }
                if (filterStateId && stateIds.filterStateId && filterStateId === stateIds.filterStateId)  {
                    params.delete('filter_state_id');
                }
            }, this.handleStateFailure);
        }
    };

    getDefaultOptionTitle() {
        return this.isLoading ? 'Loading...' : 'Select a name';
    };

    /*
     * Replaces the url parameters on a successful state save.
     * @param {Object} response
     * @private
     */
    handleSaveStateSuccess(response) {
        this.dashboardStateId = response.dashboardStateId;
        this.filterStateId = response.filterStateId;

        // Add/Replace state ids in the url parameters
        // TODO: Enable after replacing old $location calls with appropriate router calls.
        // $location.search("dashboard_state_id", response.dashboardStateId);
        // $location.search("filter_state_id", response.filterStateId);
    };

    /*
     * Shows an error notification on a state call error.
     * @param {Object} response
     * @private
     */
    handleStateFailure(response) {
        this.errorNotificationService.showErrorMessage(null, response.responseJSON.error);
    };

    /*
     * Retrieves all the current state names before when any of the modals are shown.
     * @private
     */
    loadStateNames() {
        this.stateName = '';
        this.stateNameError = false;

        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (!connection) {
            connection = this.connectionService.createActiveConnection();
        }

        let me = this;
        this.isLoading = true;
        connection.getAllStateNames(function(stateNames) {
            me.isLoading = false;
            me.stateNames = stateNames;
        }, function(response) {
            me.isLoading = false;
            me.stateNames = [];
            me.errorNotificationService.showErrorMessage(null, response.responseJSON.error);
        });
    };

    setStateToLoad(name: string) {
        this.formData.stateToLoad = name;
    }

    setStateToDelete(name: string) {
        this.formData.stateToDelete = name;
    }
}
