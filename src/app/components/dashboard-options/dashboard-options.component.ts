import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { URLSearchParams } from '@angular/http';

import { MdSnackBar, MdSnackBarConfig } from '@angular/material';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ParameterService } from '../../services/parameter.service';
import { ThemesService } from '../../services/themes.service';

import * as _ from 'lodash';
import * as neon from 'neon-framework';

@Component({
  selector: 'app-dashboard-options',
  templateUrl: './dashboard-options.component.html',
  styleUrls: ['./dashboard-options.component.scss']
})
export class DashboardOptionsComponent implements OnInit {
    private formData: any = {
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
    private stateNames: string[] = [];
    private stateName: string = '';
    private stateNameError: boolean = false;

    constructor(private connectionService: ConnectionService,  private datasetService: DatasetService,
        private errorNotificationService: ErrorNotificationService, private exportService: ExportService,
        private mdSnackBar: MdSnackBar, private parameterService: ParameterService,
        private themesService: ThemesService, private viewContainerRef: ViewContainerRef) { }

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

    setExportFormat(value: number) {
        this.exportService.setFileFormat(value);
    }

    toggleExportFormat(event: Event) {
        event.preventDefault();
    }

    exportSuccess(queryResults) {
        let config = new MdSnackBarConfig(this.viewContainerRef);
        console.log('shoop');
        this.mdSnackBar.open('Export In Progress...', 'OK', config);
        window.location.assign('/neon/services/exportservice/generateZip/' + queryResults.data);
    };

    exportFail(response) {
        let config = new MdSnackBarConfig(this.viewContainerRef);
        if (response.responseJSON) {
            this.mdSnackBar.open('Error: ' + response.responseJSON.error, 'Close', config);
        } else {
            this.mdSnackBar.open('Error: The export service failed to respond properly.', 'Close', config);
        }
    };

    exportAll() {
        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        let config = new MdSnackBarConfig(this.viewContainerRef);
        let data = {
            // TODO Change this hardcoded value to something like a user ID.
            name: 'All_Widgets',
            data: []
        };

        if (!connection) {
            this.mdSnackBar.open('Please select a dataset before exporting.', 'OK', config);
            return;
        }

        this.exportService.getWidgets().forEach(function(widget) {
            let widgetObject = widget.callback();
            for(let x = 0; x < widgetObject.data.length; x++) {
                data.data.push(widgetObject.data[x]);
            }
        });

        if (this.exportService.getWidgets().length === 0) {
            this.mdSnackBar.open('There are no visualizations to export.', 'OK', config);
            return;
        }

        connection.executeExport(data, this.exportSuccess.bind(this), this.exportFail.bind(this), this.exportService.getFileFormat());
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
            let params = {
                stateName: this.stateName
            };
            connection.loadState(params, function(dashboardState) {
                if (_.keys(dashboardState).length) {
                    let params: URLSearchParams = new URLSearchParams();
                    let dashboardStateId: string = params.get('dashboard_state_id');
                    let filterStateId: string = params.get('filter_state_id');

                    this.parameterService.loadStateSuccess(dashboardState, dashboardState.dashboardStateId);
                } else {
                    this.errorNotificationService.showErrorMessage(null, 'State ' + this.stateName + ' not found.');
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

                // Delete the state parameters if either match the IDs deleted
                // TODO: Enable after replacing old $location calls with appropriate router calls.
                // if(dashboardStateId && stateIds.dashboardStateId && dashboardStateId === stateIds.dashboardStateId)  {
                //     $location.search("dashboard_state_id", null);
                // }
                // if(filterStateId && stateIds.filterStateId && filterStateId === stateIds.filterStateId)  {
                //     $location.search("filter_state_id", null);
                // }
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
