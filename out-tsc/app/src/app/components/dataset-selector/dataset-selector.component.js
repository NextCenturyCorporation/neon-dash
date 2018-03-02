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
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { URLSearchParams } from '@angular/http';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { Dataset, DatabaseMetaData, TableMetaData } from '../../dataset';
import { DatasetService } from '../../services/dataset.service';
import { ParameterService } from '../../services/parameter.service';
import { neonVisualizationMinPixel } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import * as uuid from 'node-uuid';
/**
 * The dataset selector allows a user to select one of the pre-configured datasets stored in the application
 * config file/service.
 * TODO: Refactoring the updateLayout methods that clone layout components to use the active layout
 * service instead.  This may be accomplished by adding a vis factory method to the service that takes
 * the generic JSON in the config file and returns a valid NeonGridItem
 */
var DatasetSelectorComponent = /** @class */ (function () {
    function DatasetSelectorComponent(connectionService, datasetService, parameterService, activeGridService) {
        this.connectionService = connectionService;
        this.datasetService = datasetService;
        this.parameterService = parameterService;
        this.activeGridService = activeGridService;
        this.datasets = [];
        this.datasetName = '';
        this.datastoreType = 'mongo';
        this.datastoreHost = 'localhost';
        this.layouts = {};
        /**
         * This is the array of custom database objects configured by the user through the popup.  Each custom database contains:
         *     {Object} database The database object
         *     {Array} customTables The array of custom table objects configured by the user through the popup.  Each custom table contains:
         *         {Object} table The table object
         *         {Object} latitude The field object for the latitude
         *         {Object} longitude The field object for the longitude
         *         {Object} date The field object for the date
         *         {Object} tags The field object for the hashtags
         */
        this.customDatabases = [];
        /**
         * This is the array of custom relation objects configured by the user through the popup.  Each custom relation contains:
         *     {Array} customRelationDatabases The array of custom relation database objects configured by the user through the popup.
         *             Each custom relation database contains:
         *         {Object} database The database object
         *         {Array} customRelationTables The array of custom relation table objects configured by the user through the popup.
         *             Each custom relation table contains:
         *             {Object} table The table object
         *             {Object} field The field object
         */
        this.customRelations = [];
        /**
         * This is the array of custom visualization objects configured by the user through the popup.  Each custom visualization contains:
         *     {String} type The visualization type
         *     {Number} sizex The width of the visualization
         *     {Number} minSizeX The minimum width of the visualization
         *     {Number} sizey The height of the visualization
         *     {Number} minSizeY The minimum height of the visualization
         *     {String} database The database name to connect to it
         *     {String} table The table name to connect to it
         *     {Array} availableTables An array of table names that are available in the database selected
         */
        this.customVisualizations = [];
        this.activeDataset = {
            name: 'Choose a Dataset',
            info: '',
            data: false
        };
        this.gridItemsChanged = new EventEmitter();
        this.activeDatasetChanged = new EventEmitter();
    }
    DatasetSelectorComponent_1 = DatasetSelectorComponent;
    DatasetSelectorComponent.prototype.getDatasets = function () {
        return this.datasets;
    };
    DatasetSelectorComponent.prototype.ngOnInit = function () {
        var _this = this;
        var params = new URLSearchParams();
        var dashboardStateId = params.get('dashboard_state_id');
        var filterStateId = params.get('filter_state_id');
        this.messenger = new neon.eventing.Messenger();
        this.datasets = this.datasetService.getDatasets();
        this.layouts = this.datasetService.getLayouts();
        if (params.get('dashboard_state_id')) {
            this.parameterService.loadState(dashboardStateId, filterStateId);
        }
        else {
            var activeDataset_1 = (this.parameterService.findActiveDatasetInUrl() || '').toLowerCase();
            this.datasets.some(function (dataset, index) {
                if ((activeDataset_1 && activeDataset_1 === dataset.name.toLowerCase()) || (!activeDataset_1 && dataset.connectOnLoad)) {
                    _this.connectToPreset(index, true);
                    _this.activeDatasetChanged.emit(); // Close the sidenav opened by connectToPreset.
                    return true;
                }
                return false;
            });
        }
        var me = this;
        this.messenger.subscribe(ParameterService.STATE_CHANGED_CHANNEL, function (message) {
            if (message && message.dataset) {
                if (message.dataset) {
                    me.datasetService.setActiveDataset(message.dataset);
                    me.activeDataset = {
                        name: message.dataset.name,
                        info: DatasetSelectorComponent_1.HIDE_INFO_POPOVER,
                        data: true
                    };
                    me.activeDatasetChanged.emit(me.activeDataset);
                }
                if (message.dashboard) {
                    var layoutName = 'savedDashboard-' + message.dashboardStateId;
                    me.layouts[layoutName] = message.dashboard;
                    if (message.dataset) {
                        me.datasetService.setLayout(layoutName);
                    }
                    for (var _i = 0, _a = message.dashboard; _i < _a.length; _i++) {
                        var dashboard = _a[_i];
                        dashboard.id = uuid.v4();
                    }
                    me.activeGridService.setGridItems(message.dashboard);
                    me.activeDatasetChanged.emit(me.activeDataset);
                    me.gridItemsChanged.emit(message.dashboard.length);
                }
            }
        });
    };
    DatasetSelectorComponent.prototype.ngOnDestroy = function () {
        // Do nothing.
    };
    /**
     * Connects to the preset dataset at the given index.
     * @param {Number} index
     * @param {Boolean} loadDashboardState Whether to load any saved dashboard states shown upon a dataset change
     * @method connectToPreset
     */
    DatasetSelectorComponent.prototype.connectToPreset = function (index, loadDashboardState) {
        this.activeDataset = {
            name: this.datasets[index].name,
            info: DatasetSelectorComponent_1.HIDE_INFO_POPOVER,
            data: true
        };
        this.datastoreType = this.datasets[index].datastore;
        this.datastoreHost = this.datasets[index].hostname;
        var connection = this.connectionService.createActiveConnection(this.datastoreType, this.datastoreHost);
        if (!connection) {
            return;
        }
        // Don't update the dataset if its fields are already updated.
        if (this.datasets[index].hasUpdatedFields) {
            this.finishConnectToPreset(this.datasets[index], loadDashboardState);
            return;
        }
        // Update the fields within each database and table within the selected dataset
        // to include fields that weren't listed in the configuration file.
        var me = this;
        this.datasetService.updateDatabases(this.datasets[index], connection, function (dataset) {
            me.datasets[index] = dataset;
            // Wait to update the layout until after we finish the dataset updates.
            me.finishConnectToPreset(dataset, loadDashboardState);
        });
    };
    DatasetSelectorComponent.prototype.finishConnectToPreset = function (dataset, loadDashboardState) {
        this.datasetService.setActiveDataset(dataset);
        this.updateLayout(loadDashboardState);
    };
    /**
     * Updates the layout of visualizations in the dashboard for the active dataset.
     * @param {Boolean} loadDashboardState Whether to load any saved dashboard states shown upon a dataset change
     * @private
     */
    DatasetSelectorComponent.prototype.updateLayout = function (loadDashboardState) {
        var layoutName = this.datasetService.getLayout();
        // Clear any old filters prior to loading the new layout and dataset.
        this.messenger.clearFiltersSilently();
        // Use the default layout (if it exists) for custom datasets or datasets without a layout.
        if (!layoutName || !this.layouts[layoutName]) {
            layoutName = 'default';
        }
        // Clear the old grid items;
        this.activeGridService.clear();
        // Recreate the layout each time to ensure all visualizations are using the new dataset.
        for (var _i = 0, _a = this.layouts[layoutName]; _i < _a.length; _i++) {
            var layout = _a[_i];
            var item = _.cloneDeep(layout);
            item.gridItemConfig = {
                row: item.row,
                col: item.col,
                sizex: item.sizex,
                sizey: item.sizey,
                dragHandle: '.drag-handle',
                borderSize: 10
            };
            item.id = uuid.v4();
            this.activeGridService.addItem(item);
        }
        this.gridItemsChanged.emit(this.layouts[layoutName].length);
        this.activeDatasetChanged.emit(this.activeDataset);
        this.parameterService.addFiltersFromUrl(!loadDashboardState);
    };
    /**
     * Updates the layout of visualizations in the dashboard for the custom visualizations set.
     * @method updateCustomLayout
     * @private
     */
    DatasetSelectorComponent.prototype.updateCustomLayout = function () {
        // Clear the old grid items;
        this.activeGridService.clear();
        // Clear any old filters prior to loading the new layout and dataset.
        this.messenger.clearFilters();
        _.each(this.customVisualizations, function (visualization) {
            var id = uuid.v4();
            var layout = {
                id: id,
                bindings: {},
                bordersize: 5,
                dragHandle: '.drag-handle',
                gridConfig: {
                    row: visualization.row,
                    col: visualization.col,
                    sizex: visualization.sizex,
                    sizey: visualization.sizey
                },
                payload: id,
                minSizeX: visualization.minSizeX,
                minSizeY: visualization.minSizeY,
                minPixelX: neonVisualizationMinPixel.x,
                minPixelY: neonVisualizationMinPixel.y,
                sizex: visualization.sizex,
                sizey: visualization.sizey,
                title: visualization.title,
                type: visualization.type
            };
            if (visualization.database && visualization.table) {
                layout.bindings = {
                    'bind-database': '\'' + visualization.database + '\'',
                    'bind-table': '\'' + visualization.table + '\''
                };
            }
            _.each(visualization.bindings, function (value, key) {
                layout.bindings[key] = '\'' + value + '\'';
            });
            this.activeGridService.addItem(layout);
        });
        // TODO: Clear any saved states loaded through the parameters
        // $location.search("dashboard_state_id", null);
        // $location.search("filter_state_id", null);
        this.gridItemsChanged.emit(this.customVisualizations.length);
        this.parameterService.addFiltersFromUrl();
    };
    /**
     * Selection event for the custom dataset popup.
     */
    DatasetSelectorComponent.prototype.selectCustom = function () {
        // Removed call to xdata logger library
        // Custom connection dialog is not yet implemented.
    };
    /**
     * Creates and returns a new custom dataset object using the user configuration saved in the global variables.
     * @return {Object}
     */
    DatasetSelectorComponent.prototype.createCustomDataset = function () {
        var dataset = new Dataset(this.datasetName, this.datastoreType, this.datastoreHost);
        this.customDatabases.forEach(function (customDatabase) {
            var database = new DatabaseMetaData(customDatabase.database.name, customDatabase.database.prettyName);
            customDatabase.customTables.forEach(function (customTable) {
                var tableObject = new TableMetaData(customTable.table.name, customTable.table.prettyName, customTable.table.fields, customTable.table.mappings);
                database.tables.push(tableObject);
            });
            dataset.databases.push(database);
        });
        this.customRelations.forEach(function (customRelation) {
            var relation = {};
            customRelation.customRelationDatabases.forEach(function (customRelationDatabase) {
                if (!relation[customRelationDatabase.database.name]) {
                    relation[customRelationDatabase.database.name] = {};
                }
                customRelationDatabase.customRelationTables.forEach(function (customRelationTable) {
                    relation[customRelationDatabase.database.name][customRelationTable.table.name] = customRelationTable.field.columnName;
                });
            });
            dataset.relations.push(relation);
        });
        return dataset;
    };
    /**
     * Sets the active dataset to the databases and tables in the list of custom databases
     * in the given config and saves it in the Dataset Service.
     * @param {Object} config
     * @param {Array} config.customDatabases
     * @param {Array} config.customRelations
     * @param {Array} config.customVisualizations
     * @param {String} config.datastoreType
     * @param {String} config.datastoreHost
     * @param {String} config.datasetName
     * @method setDataset
     */
    DatasetSelectorComponent.prototype.setDataset = function (config) {
        this.customDatabases = config.customDatabases;
        this.customRelations = config.customRelations;
        this.customVisualizations = config.customVisualizations;
        this.datastoreType = config.datastoreType;
        this.datastoreHost = config.datastoreHost;
        this.datasetName = config.datasetName;
        var dataset = this.createCustomDataset();
        this.activeDataset = {
            name: dataset.name,
            info: DatasetSelectorComponent_1.HIDE_INFO_POPOVER,
            data: true
        };
        this.activeDatasetChanged.emit(this.activeDataset);
        this.datasets = this.datasetService.addDataset(dataset);
        this.datasetService.setActiveDataset(dataset);
        this.updateCustomLayout();
        // TODO: Manage the custom connection modal.
        // $element.find(".modal").modal("hide");
    };
    DatasetSelectorComponent.HIDE_INFO_POPOVER = 'sr-only';
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], DatasetSelectorComponent.prototype, "activeDataset", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], DatasetSelectorComponent.prototype, "gridItemsChanged", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], DatasetSelectorComponent.prototype, "activeDatasetChanged", void 0);
    DatasetSelectorComponent = DatasetSelectorComponent_1 = __decorate([
        Component({
            selector: 'app-dataset-selector',
            templateUrl: 'dataset-selector.component.html',
            styleUrls: ['dataset-selector.component.scss']
        }),
        __metadata("design:paramtypes", [ConnectionService, DatasetService,
            ParameterService, ActiveGridService])
    ], DatasetSelectorComponent);
    return DatasetSelectorComponent;
    var DatasetSelectorComponent_1;
}());
export { DatasetSelectorComponent };
//# sourceMappingURL=dataset-selector.component.js.map