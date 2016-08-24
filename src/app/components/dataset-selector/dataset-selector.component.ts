'use strict';

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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { URLSearchParams } from '@angular/http';

import { Dataset } from '.../../dataset';
import { DatasetService } from '../../services/dataset.service';
import { DatabaseMetaData } from '../../dataset.ts';

@Component({
    selector: 'dataset-selector',
    templateUrl: 'dataset-selector.component.html',
    styleUrls: [
        'dataset-selector.component.less'
    ]
})
export class DatasetSelectorComponent implements OnInit, OnDestroy {
    public HIDE_INFO_POPOVER: string = 'sr-only';
    private selectedDataset: string = 'Select a Dataset';

    private datasets: Dataset[] = [];
    private datasets: Dataset[] = [];
    private activeDataset: any = {
        name: 'Choose Dataset',
        info: '',
        data: false
    };

    private datasetName: string = '';
    private datastoreType: string = 'mongo';
    private datastoreHost: string = 'localhost';

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
   private customDatabases: DatabaseMetaData[] = [];

    /**
     * This is the array of custom relation objects configured by the user through the popup.  Each custom relation contains:
     *     {Array} customRelationDatabases The array of custom relation database objects configured by the user through the popup.  
     *             Each custom relation database contains:
     *         {Object} database The database object
     *         {Array} customRelationTables The array of custom relation table objects configured by the user through the popup.  
                   Each custom relation table contains:
     *             {Object} table The table object
     *             {Object} field The field object
     */
    private customRelations: RelationMetaData[] = [];

    /**
     * This is the array of custom visualization objects configured by the user through the popup.  Each custom visualization contains:
     *     {String} type The visualization type
     *     {Number} sizeX The width of the visualization
     *     {Number} minSizeX The minimum width of the visualization
     *     {Number} sizeY The height of the visualization
     *     {Number} minSizeY The minimum height of the visualization
     *     {String} database The database name to connect to it
     *     {String} table The table name to connect to it
     *     {Array} availableTables An array of table names that are available in the database selected
     */
    private customVisualizations: any[] = [];

    private messenger: any = new neon.eventing.Messenger();

    constructor(private datasetService: DatasetService, private parameterService: ParameterService) {
        this.datasets = datasetService.getDatasets();
    }

    getDatasets(): Dataset[] {
        return this.datasets;
    }

    ngOnInit(): void {
        this.messenger = new neon.eventing.Messenger();

        let params = $location.search();

        if (params.dashboard_state_id) {
            parameterService.loadState(params.dashboard_state_id, params.filter_state_id);
        } else {
            let activeDataset = (parameterService.findActiveDatasetInUrl() || '').toLowerCase();
            this.datasets.some(function(dataset, index) {
                if ((activeDataset && activeDataset === dataset.name.toLowerCase()) || (!activeDataset && dataset.connectOnLoad)) {
                    this.connectToPreset(index, true);
                    return true;
                }
                return false;
            });
        }

        $scope.messenger.subscribe(parameterService.STATE_CHANGED_CHANNEL, function(message) {
            if (message && message.dataset) {
                if (message.dataset) {
                    datasetService.setActiveDataset(message.dataset);

                    this.activeDataset = {
                        name: message.dataset.name,
                        info: $scope.HIDE_INFO_POPOVER,
                        data: true
                    };
                }
                if (message.dashboard) {
                    $scope.$apply(function() {
                        let layoutName = 'savedDashboard-' + message.dashboardStateId;

                        layouts[layoutName] = message.dashboard;

                        if (message.dataset) {
                            datasetService.setLayout(layoutName);
                        }

                        this.gridsterConfigs = message.dashboard;

                        for (let i = 0; i < this.gridsterConfigs.length; ++i) {
                            this.gridsterConfigs[i].id = uuid();
                        }
                    });
                }
            }
        });
    }

    ngOnDestroy(): void {
        console.log('dataset-selector destroyed');
    }
}

// angular.module('neonDemo.directives')
// .directive('databaseConfig', ['$location', 'layouts', 'visualizations', 'ConnectionService', 'DatasetService', 'ParameterService',
//     function($location, layouts, visualizations, connectionService, datasetService, parameterService) {
//     return {
//         templateUrl: 'components/databaseConfig/databaseConfig.html',
//         restrict: 'E',
//         scope: {
//             storeSelect: '=',
//             hostName: '=',
//             gridsterConfigs: "=",
//             hideAdvancedOptions: "="
//         },
//         link: function($scope, $element) {


//             var initialize = function() {
//                 $scope.messenger = new neon.eventing.Messenger();

//                 var params = $location.search();

//                 if(params.dashboard_state_id) {
//                     parameterService.loadState(params.dashboard_state_id, params.filter_state_id);
//                 } else {
//                     var activeDataset = (parameterService.findActiveDatasetInUrl() || "").toLowerCase();
//                     $scope.datasets.some(function(dataset, index) {
//                         if((activeDataset && activeDataset === dataset.name.toLowerCase()) || (!activeDataset && dataset.connectOnLoad)) {
//                             $scope.connectToPreset(index, true);
//                             return true;
//                         }
//                         return false;
//                     });
//                 }

//                 $scope.messenger.subscribe(parameterService.STATE_CHANGED_CHANNEL, function(message) {
//                     if(message && message.dataset) {
//                         if(message.dataset) {
//                             datasetService.setActiveDataset(message.dataset);

//                             $scope.activeDataset = {
//                                 name: message.dataset.name,
//                                 info: $scope.HIDE_INFO_POPOVER,
//                                 data: true
//                             };
//                         }
//                         if(message.dashboard) {
//                             $scope.$apply(function() {
//                                 var layoutName = "savedDashboard-" + message.dashboardStateId;

//                                 layouts[layoutName] = message.dashboard;

//                                 if(message.dataset) {
//                                     datasetService.setLayout(layoutName);
//                                 }

//                                 $scope.gridsterConfigs = message.dashboard;

//                                 for(var i = 0; i < $scope.gridsterConfigs.length; ++i) {
//                                     $scope.gridsterConfigs[i].id = uuid();
//                                 }
//                             });
//                         }
//                     }
//                 });
//             };

//             /**
//              * Connects to the preset dataset at the given index.
//              * @param {Number} index
//              * @param {Boolean} loadDashboardState Whether to load any saved dashboard states shown upon a dataset change
//              * @method connectToPreset
//              */
//             $scope.connectToPreset = function(index, loadDashboardState) {
//                 XDATA.userALE.log({
//                     activity: "select",
//                     action: "click",
//                     elementId: "dataset-menu",
//                     elementType: "button",
//                     elementGroup: "top",
//                     source: "user",
//                     tags: ["dataset", $scope.datasets[index].name, "connect"]
//                 });

//                 $scope.activeDataset = {
//                     name: $scope.datasets[index].name,
//                     info: $scope.HIDE_INFO_POPOVER,
//                     data: true
//                 };

//                 $scope.datastoreType = $scope.datasets[index].datastore;
//                 $scope.datastoreHost = $scope.datasets[index].hostname;

//                 var connection = connectionService.createActiveConnection($scope.datastoreType, $scope.datastoreHost);
//                 if(!connection) {
//                     return;
//                 }

//                 var finishConnectToPreset = function(dataset, loadDashboardState) {
//                     datasetService.setActiveDataset(dataset);
//                     updateLayout(loadDashboardState);
//                 };

//                 // Don't update the dataset if its fields are already updated.
//                 if($scope.datasets[index].hasUpdatedFields) {
//                     finishConnectToPreset($scope.datasets[index], loadDashboardState);
//                     return;
//                 }

//                 // Update the fields within each database and table within the selected dataset to include fields that weren't listed in the configuration file.
//                 datasetService.updateDatabases($scope.datasets[index], connection, function(dataset) {
//                     $scope.datasets[index] = dataset;
//                     // Update the layout inside a $scope.$apply because we're inside a jQuery ajax callback thread.
//                     $scope.$apply(function() {
//                         // Wait to update the layout until after we finish the dataset updates.
//                         finishConnectToPreset(dataset, loadDashboardState);
//                     });
//                 });
//             };

//             /**
//              * Updates the layout of visualizations in the dashboard for the active dataset.
//              * @param {Boolean} loadDashboardState Whether to load any saved dashboard states shown upon a dataset change
//              * @method updateLayout
//              * @private
//              */
//             var updateLayout = function(loadDashboardState) {
//                 var layoutName = datasetService.getLayout();

//                 XDATA.userALE.log({
//                     activity: "select",
//                     action: "show",
//                     elementId: "dataset-selector",
//                     elementType: "workspace",
//                     elementGroup: "top",
//                     source: "system",
//                     tags: ["connect", "dataset"]
//                 });

//                 // Clear any old filters prior to loading the new layout and dataset.
//                 $scope.messenger.clearFiltersSilently();

//                 // Use the default layout (if it exists) for custom datasets or datasets without a layout.
//                 if(!layoutName || !layouts[layoutName]) {
//                     layoutName = "default";
//                 }

//                 // Recreate the layout each time to ensure all visualizations are using the new dataset.
//                 $scope.gridsterConfigs = layouts[layoutName] ? angular.copy(layouts[layoutName]) : [];

//                 $scope.gridsterConfigs.forEach(function(config) {
//                     config.id = uuid();
//                 });

//                 parameterService.addFiltersFromUrl(!loadDashboardState);
//             };

//             *
//              * Updates the layout of visualizations in the dashboard for the custom visualizations set.
//              * @method updateCustomLayout
//              * @private

//             var updateCustomLayout = function() {
//                 XDATA.userALE.log({
//                     activity: "select",
//                     action: "show",
//                     elementId: "dataset-selector",
//                     elementType: "workspace",
//                     elementGroup: "top",
//                     source: "system",
//                     tags: ["connect", "dataset"]
//                 });

//                 $scope.gridsterConfigs = [];

//                 // Clear any old filters prior to loading the new layout and dataset.
//                 $scope.messenger.clearFilters();

//                 _.each($scope.customVisualizations, function(visualization) {
//                     var layout = {
//                         sizeX: visualization.sizeX,
//                         sizeY: visualization.sizeY,
//                         minSizeX: visualization.minSizeX,
//                         minSizeY: visualization.minSizeY,
//                         minPixelX: neonVisualizationMinPixel.x, // jshint ignore:line
//                         minPixelY: neonVisualizationMinPixel.y, // jshint ignore:line
//                         type: visualization.type,
//                         id: uuid(),
//                         bindings: {}
//                     };

//                     if(visualization.database && visualization.table) {
//                         layout.bindings = {
//                             "bind-database": "'" + visualization.database + "'",
//                             "bind-table": "'" + visualization.table + "'"
//                         };
//                     }

//                     _.each(visualization.bindings, function(value, key) {
//                         layout.bindings[key] = "'" + value + "'";
//                     });

//                     $scope.gridsterConfigs.push(layout);
//                 });

//                 // Clear any saved states loaded through the parameters
//                 $location.search("dashboard_state_id", null);
//                 $location.search("filter_state_id", null);

//                 parameterService.addFiltersFromUrl();
//             };

//             /**
//              * Selection event for the custom dataset popup.
//              * @method selectCustom
//              */
//             $scope.selectCustom = function() {
//                 XDATA.userALE.log({
//                     activity: "open",
//                     action: "click",
//                     elementId: "custom-dataset",
//                     elementType: "button",
//                     elementGroup: "top",
//                     source: "user",
//                     tags: ["custom", "dataset", "dialog"]
//                 });
//             };

//             /**
//              * Creates and returns a new custom dataset object using the user configuration saved in the global variables.
//              * @method createCustomDataset
//              * @return {Object}
//              */
//             var createCustomDataset = function() {
//                 var dataset = {
//                     name: $scope.datasetName,
//                     datastore: $scope.datastoreType,
//                     hostname: $scope.datastoreHost,
//                     databases: [],
//                     relations: [],
//                     options: {
//                         requery: 0
//                     }
//                 };

//                 $scope.customDatabases.forEach(function(customDatabase) {
//                     var database = {
//                         name: customDatabase.database.name,
//                         prettyName: customDatabase.database.prettyName,
//                         tables: []
//                     };

//                     customDatabase.customTables.forEach(function(customTable) {
//                         var tableObject = {
//                             name: customTable.table.name,
//                             prettyName: customTable.table.prettyName,
//                             fields: customTable.table.fields,
//                             mappings: customTable.table.mappings
//                         };

//                         database.tables.push(tableObject);
//                     });

//                     dataset.databases.push(database);
//                 });

//                 $scope.customRelations.forEach(function(customRelation) {
//                     var relation = {};

//                     customRelation.customRelationDatabases.forEach(function(customRelationDatabase) {
//                         if(!relation[customRelationDatabase.database.name]) {
//                             relation[customRelationDatabase.database.name] = {};
//                         }

//                         customRelationDatabase.customRelationTables.forEach(function(customRelationTable) {
//                             relation[customRelationDatabase.database.name][customRelationTable.table.name] = customRelationTable.field.columnName;
//                         });
//                     });

//                     dataset.relations.push(relation);
//                 });

//                 return dataset;
//             };

//             /**
//              * Sets the active dataset to the databases and tables in the list of custom databases
//              * in the given config and saves it in the Dataset Service.
//              * @param {Object} config
//              * @param {Array} config.customDatabases
//              * @param {Array} config.customRelations
//              * @param {Array} config.customVisualizations
//              * @param {String} config.datastoreType
//              * @param {String} config.datastoreHost
//              * @param {String} config.datasetName
//              * @method setDataset
//              */
//             $scope.setDataset = function(config) {
//                 XDATA.userALE.log({
//                     activity: "close",
//                     action: "click",
//                     elementId: "custom-dataset-done",
//                     elementType: "button",
//                     elementGroup: "top",
//                     source: "user",
//                     tags: ["custom", "dataset", "connect"]
//                 });

//                 $scope.customDatabases = config.customDatabases;
//                 $scope.customRelations = config.customRelations;
//                 $scope.customVisualizations = config.customVisualizations;
//                 $scope.datastoreType = config.datastoreType;
//                 $scope.datastoreHost = config.datastoreHost;
//                 $scope.datasetName = config.datasetName;

//                 var dataset = createCustomDataset();

//                 $scope.activeDataset = {
//                     name: dataset.name,
//                     info: $scope.HIDE_INFO_POPOVER,
//                     data: true
//                 };

//                 $scope.datasets = datasetService.addDataset(dataset);
//                 datasetService.setActiveDataset(dataset);
//                 updateCustomLayout();

//                 $element.find(".modal").modal("hide");
//             };

//             // Wait for neon to be ready, the create our messenger and intialize the view and data.
//             neon.ready(function() {
//                 initialize();
//             });
//         }
//     };
// }]);
