var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
import { Component, ViewContainerRef } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ParameterService } from '../../services/parameter.service';
import { ThemesService } from '../../services/themes.service';
import { ConfigEditorComponent } from '../config-editor/config-editor.component';
import * as _ from 'lodash';
import * as neon from 'neon-framework';
import { VisualizationService } from '../../services/visualization.service';
var DashboardOptionsComponent = /** @class */ (function () {
    function DashboardOptionsComponent(connectionService, datasetService, errorNotificationService, exportService, matSnackBar, parameterService, themesService, viewContainerRef, dialog, visualizationService) {
        this.connectionService = connectionService;
        this.datasetService = datasetService;
        this.errorNotificationService = errorNotificationService;
        this.exportService = exportService;
        this.matSnackBar = matSnackBar;
        this.parameterService = parameterService;
        this.themesService = themesService;
        this.viewContainerRef = viewContainerRef;
        this.dialog = dialog;
        this.visualizationService = visualizationService;
        this.formData = {
            exportFormat: 0,
            currentTheme: 'neon-green-theme',
            newStateName: '',
            stateToLoad: '',
            stateToDelete: ''
        };
        this.dashboardStateId = '';
        this.filterStateId = '';
        this.isLoading = false;
        this.stateNames = [];
        this.exportTarget = 'all';
    }
    DashboardOptionsComponent.prototype.ngOnInit = function () {
        this.formData.exportFormat = this.exportService.getFileFormats()[0].value;
        this.formData.currentTheme = this.themesService.getCurrentTheme().id;
        this.messenger = new neon.eventing.Messenger();
        this.loadStateNames();
    };
    DashboardOptionsComponent.prototype.setCurrentTheme = function (themeId) {
        if (themeId) {
            this.themesService.setCurrentTheme(themeId);
        }
    };
    DashboardOptionsComponent.prototype.openEditConfigDialog = function () {
        var dConfig = {
            height: '80%',
            width: '80%',
            hasBackdrop: true,
            disableClose: true
        };
        var dialogRef = this.dialog.open(ConfigEditorComponent, dConfig);
    };
    /*
     * Saves the current state to the given name.
     * @param {String} name
     * @method saveState
     */
    DashboardOptionsComponent.prototype.saveState = function (name) {
        var _this = this;
        if (!this.validateName(name)) {
            console.error('Name already exists');
            return;
        }
        // TODO: Enable once the visualization service has been migrated
        var stateParams = {};
        if (name) {
            stateParams.stateName = name;
        }
        var connection = this.connectionService.getActiveConnection();
        if (connection) {
            this.datasetService.setLineCharts([{}]);
            this.datasetService.setMapLayers([{}]);
            // Get each visualization's bindings and save them to our dashboard state parameter
            stateParams.dashboard = this.visualizationService.getWidgets();
            stateParams.dataset = this.datasetService.getDataset();
            connection.saveState(stateParams, function (response) {
                _this.handleSaveStateSuccess(response);
            }, function (response) {
                _this.handleStateFailure(response);
            });
        }
    };
    /*
     * Validates a state's name by checking that the name doesn't exist already for another saved state.
     */
    DashboardOptionsComponent.prototype.validateName = function (name) {
        return (!this.stateNames.length || this.stateNames.indexOf(name) === -1);
    };
    /*
     * Loads the states for the name choosen and updates the dashboard and url parameters.
     */
    DashboardOptionsComponent.prototype.loadState = function (name) {
        var _this = this;
        if (this.validateName(name)) {
            return;
        }
        var connection = this.connectionService.getActiveConnection();
        if (connection) {
            var stateParams = {
                stateName: name
            };
            connection.loadState(stateParams, function (dashboardState) {
                if (_.keys(dashboardState).length) {
                    _this.parameterService.loadStateSuccess(dashboardState, dashboardState.dashboardStateId);
                }
                else {
                    _this.errorNotificationService.showErrorMessage(null, 'State ' + name + ' not found.');
                }
            }, function (response) {
                _this.handleStateFailure(response);
            });
        }
    };
    /*
     * Deletes the state for the name choosen.
     * @method deleteState
     */
    DashboardOptionsComponent.prototype.deleteState = function (name) {
        var _this = this;
        if (this.validateName(name)) {
            return;
        }
        var connection = this.connectionService.getActiveConnection();
        if (connection) {
            connection.deleteState(this.formData.stateToDelete, function (stateIds) {
                _this.loadStateNames();
            }, function (response) {
                _this.handleStateFailure(response);
            });
        }
    };
    DashboardOptionsComponent.prototype.getDefaultOptionTitle = function () {
        return this.isLoading ? 'Loading...' : 'Select a name';
    };
    /*
     * Replaces the url parameters on a successful state save.
     * @param {Object} response
     * @private
     */
    DashboardOptionsComponent.prototype.handleSaveStateSuccess = function (response) {
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
    DashboardOptionsComponent.prototype.handleStateFailure = function (response) {
        this.errorNotificationService.showErrorMessage(null, response.responseJSON.error);
    };
    /*
     * Retrieves all the current state names before when any of the modals are shown.
     * @private
     */
    DashboardOptionsComponent.prototype.loadStateNames = function () {
        var _this = this;
        this.formData.stateToDelete = '';
        this.formData.stateToLoad = '';
        var connection = this.connectionService.getActiveConnection();
        if (!connection) {
            connection = this.connectionService.createActiveConnection();
        }
        this.isLoading = true;
        connection.getAllStateNames(function (stateNames) {
            _this.stateNames = stateNames;
            _this.isLoading = false;
        }, function (response) {
            _this.isLoading = false;
            _this.stateNames = [];
            _this.errorNotificationService.showErrorMessage(null, response.responseJSON.error);
        });
    };
    DashboardOptionsComponent.prototype.setStateToLoad = function (name) {
        this.formData.stateToLoad = name;
    };
    DashboardOptionsComponent.prototype.setStateToDelete = function (name) {
        this.formData.stateToDelete = name;
    };
    DashboardOptionsComponent = __decorate([
        Component({
            selector: 'app-dashboard-options',
            templateUrl: './dashboard-options.component.html',
            styleUrls: ['./dashboard-options.component.scss']
        }),
        __metadata("design:paramtypes", [ConnectionService, DatasetService,
            ErrorNotificationService, ExportService,
            MatSnackBar, ParameterService,
            ThemesService, ViewContainerRef, MatDialog,
            VisualizationService])
    ], DashboardOptionsComponent);
    return DashboardOptionsComponent;
}());
export { DashboardOptionsComponent };
//# sourceMappingURL=dashboard-options.component.js.map