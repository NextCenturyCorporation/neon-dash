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

import { MdSnackBar } from '@angular/material';
import { MdDialog } from '@angular/material';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ParameterService } from '../../services/parameter.service';
import { ThemesService } from '../../services/themes.service';

import { ConfigEditorComponent } from '../config-editor/config-editor.component';

import * as _ from 'lodash';
import * as neon from 'neon-framework';
import {VisualizationService} from '../../services/visualization.service';

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
    public exportTarget: string = 'all';

    constructor(private connectionService: ConnectionService,  private datasetService: DatasetService,
        private errorNotificationService: ErrorNotificationService, public exportService: ExportService,
        private mdSnackBar: MdSnackBar, private parameterService: ParameterService,
        public themesService: ThemesService, private viewContainerRef: ViewContainerRef, private dialog: MdDialog,
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
    saveState(name: string) {
        if (!this.validateName(name)) {
            console.log('Name already exists');
            return;
        }
        // TODO: Enable once the visualization service has been migrated
        let stateParams: any = {
            dashboard: []
        };

        if (name) {
            stateParams.stateName = name;
        }

        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (connection) {
            this.datasetService.setLineCharts([{}]);
            this.datasetService.setMapLayers([{}]);

            // Get each visualization's bindings and save them to our dashboard state parameter
            this.visualizationService.getWidgets().forEach((widget) => {
                let bindings = widget.getBindings();
                stateParams.dashboard.push({
                    id: widget.id,
                    bindings: _.cloneDeep(bindings)
                });
            });

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

            connection.saveState(stateParams, (response) => {
                this.handleSaveStateSuccess(response);
            }, (response) => {
                this.handleStateFailure(response);
            });
        }
    };

    /*
     * Validates a state's name by checking that the name doesn't exist already for another saved state.
     */
    validateName(name: string): boolean {
        return (!this.stateNames.length || this.stateNames.indexOf(name) === -1);
    };

    /*
     * Loads the states for the name choosen and updates the dashboard and url parameters.
     */
    loadState(name: string) {
        if (this.validateName(name)) {
            console.log('State doesnt exist?');
            return;
        }
        console.log('Loading ' + name);
        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (connection) {
            let stateParams = {
                stateName: name
            };
            connection.loadState(stateParams, (dashboardState) => {
                if (_.keys(dashboardState).length) {
                    let searchParams: URLSearchParams = new URLSearchParams();
                    dashboardState.dashboardStateId = searchParams.get('dashboard_state_id');
                    dashboardState.filterStateId = searchParams.get('filter_state_id');

                    this.parameterService.loadStateSuccess(dashboardState, dashboardState.dashboardStateId);
                } else {
                    this.errorNotificationService.showErrorMessage(null, 'State ' + name + ' not found.');
                }
            }, (response) => {
                this.handleStateFailure(response);
            });
        }
    };

    /*
     * Deletes the state for the name choosen.
     * @method deleteState
     */
    deleteState(name: string) {
        if (this.validateName(name)) {
            console.log('State doesnt exist?');
            return;
        }
        console.log('Deleting ' + name);
        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        if (connection) {
            connection.deleteState(this.formData.stateToDelete, (stateIds) => {
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
                this.loadStateNames();
            }, (response) => {
                this.handleStateFailure(response);
            });
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
        this.loadStateNames();
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
    };

    setStateToLoad(name: string) {
        this.formData.stateToLoad = name;
    }

    setStateToDelete(name: string) {
        this.formData.stateToDelete = name;
    }
}
