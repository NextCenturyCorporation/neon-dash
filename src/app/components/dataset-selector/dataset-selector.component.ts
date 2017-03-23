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
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { URLSearchParams } from '@angular/http';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { Dataset } from '../../dataset';
import { DatasetService } from '../../services/dataset.service';
import { DatabaseMetaData, TableMetaData, FieldMetaData } from '../../dataset';
import { ParameterService } from '../../services/parameter.service';
import { neonVisualizationMinPixel } from '../../neon-namespaces';
import * as neon from 'neon-framework';

import * as _ from 'lodash';
import * as uuid from 'node-uuid';

export interface CustomTable {
    table: TableMetaData;
    latitude: FieldMetaData;
    longitude: FieldMetaData;
    date: FieldMetaData;
    tags: FieldMetaData;
}

/**
 * This interface defines the custom database objects configured by the user through the popup ialog.  Each custom database contains:
 *     {Object} database The database object
 *     {Array} customTables The array of custom table objects configured by the user through the popup.  Each custom table contains:
 *         {Object} table The table object
 *         {Object} latitude The field object for the latitude
 *         {Object} longitude The field object for the longitude
 *         {Object} date The field object for the date
 *         {Object} tags The field object for the hashtags
 */
export interface CustomDatabase {
   database: DatabaseMetaData;
   customTables: CustomTable[];
}

/**
 * The dataset selector allows a user to select one of the pre-configured datasets stored in the application
 * config file/service.
 * TODO: Refactoring the updateLayout methods that clone layout components to use the active layout
 * service instead.  This may be accomplished by adding a vis factory method to the service that takes
 * the generic JSON in the config file and returns a valid NeonGridItem
 */
@Component({
    selector: 'app-dataset-selector',
    templateUrl: 'dataset-selector.component.html',
    styleUrls: ['dataset-selector.component.scss']
})
export class DatasetSelectorComponent implements OnInit, OnDestroy {
    public static HIDE_INFO_POPOVER: string = 'sr-only';

    private datasets: Dataset[] = [];
    private datasetName: string = '';
    private datastoreType: string = 'mongo';
    private datastoreHost: string = 'localhost';
    private layouts: { [key: string]: any } = {};

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
   private customDatabases: CustomDatabase[] = [];

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
    private customRelations: any[] = [];

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
    private customVisualizations: any[] = [];

    @Input() activeDataset: any = {
        name: 'Choose a Dataset',
        info: '',
        data: false
    };
    @Output() onGridItemsChanged: EventEmitter<number> = new EventEmitter<number>();
    @Output() onActiveDatasetChanged: EventEmitter<any> = new EventEmitter<any>();

    private messenger: neon.eventing.Messenger;

    constructor(private connectionService: ConnectionService, private datasetService: DatasetService,
        private parameterService: ParameterService, private activeGridService: ActiveGridService) {
    }

    getDatasets(): Dataset[] {
        return this.datasets;
    }

    ngOnInit(): void {
        let params: URLSearchParams = new URLSearchParams();
        let dashboardStateId: string = params.get('dashboard_state_id');
        let filterStateId: string = params.get('filter_state_id');

        this.messenger = new neon.eventing.Messenger();
        this.datasets = this.datasetService.getDatasets();
        this.layouts = this.datasetService.getLayouts();

        if (params.get('dashboard_state_id')) {
            this.parameterService.loadState(dashboardStateId, filterStateId);
        } else {
            let activeDataset: string = (this.parameterService.findActiveDatasetInUrl() || '').toLowerCase();
            this.datasets.some(function(dataset, index) {
                if ((activeDataset && activeDataset === dataset.name.toLowerCase()) || (!activeDataset && dataset.connectOnLoad)) {
                    this.connectToPreset(index, true);
                    return true;
                }
                return false;
            });
        }

        let me = this;
        this.messenger.subscribe(ParameterService.STATE_CHANGED_CHANNEL, function(message) {
            if (message && message.dataset) {
                if (message.dataset) {
                    me.datasetService.setActiveDataset(message.dataset);

                    me.activeDataset = {
                        name: message.dataset.name,
                        info: DatasetSelectorComponent.HIDE_INFO_POPOVER,
                        data: true
                    };
                    me.onActiveDatasetChanged.emit(me.activeDataset);
                }
                if (message.dashboard) {
                    let layoutName: string = 'savedDashboard-' + message.dashboardStateId;

                    me.layouts[layoutName] = message.dashboard;

                    if (message.dataset) {
                        me.datasetService.setLayout(layoutName);
                    }

                    for (let i = 0; i < message.dashboard.length; ++i) {
                        message.dashboard[i].id = uuid.v4();
                    }
                    me.activeGridService.setGridItems(message.dashboard);
                    me.onActiveDatasetChanged.emit(me.activeDataset);
                    me.onGridItemsChanged.emit(message.dashboard.length);
                }
            }
        });
    }

    ngOnDestroy(): void { }

    /**
     * Connects to the preset dataset at the given index.
     * @param {Number} index
     * @param {Boolean} loadDashboardState Whether to load any saved dashboard states shown upon a dataset change
     * @method connectToPreset
     */
    connectToPreset(index: number, loadDashboardState: boolean) {
        this.activeDataset = {
            name: this.datasets[index].name,
            info: DatasetSelectorComponent.HIDE_INFO_POPOVER,
            data: true
        };
        this.datastoreType = this.datasets[index].datastore;
        this.datastoreHost = this.datasets[index].hostname;

        let connection: neon.query.Connection = this.connectionService.createActiveConnection(this.datastoreType, this.datastoreHost);
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
        let me = this;
        this.datasetService.updateDatabases(this.datasets[index], connection, function(dataset) {
            me.datasets[index] = dataset;

            // Wait to update the layout until after we finish the dataset updates.
            me.finishConnectToPreset(dataset, loadDashboardState);
        });
    };

    finishConnectToPreset(dataset: Dataset, loadDashboardState: boolean) {
        this.datasetService.setActiveDataset(dataset);
        this.updateLayout(loadDashboardState);
    }

    /**
     * Updates the layout of visualizations in the dashboard for the active dataset.
     * @param {Boolean} loadDashboardState Whether to load any saved dashboard states shown upon a dataset change
     * @private
     */
    updateLayout(loadDashboardState: boolean) {
        let layoutName = this.datasetService.getLayout();

        // Clear any old filters prior to loading the new layout and dataset.
        this.messenger.clearFiltersSilently();

        // Use the default layout (if it exists) for custom datasets or datasets without a layout.
        if (!layoutName || !this.layouts[layoutName]) {
            layoutName = 'default';
        }

        // Clear the old grid items;
        this.activeGridService.clear();

        // Recreate the layout each time to ensure all visualizations are using the new dataset.
        for (let i = 0; i < this.layouts[layoutName].length; i++) {
            let item = _.cloneDeep(this.layouts[layoutName][i]);
            item.gridConfig = {
                row: item.row,
                col: item.col,
                sizex: item.sizex,
                sizey: item.sizey,
                dragHandle: '.drag-handle',
            };
            item.id = uuid.v4();
            this.activeGridService.addItem(item);
        }

        this.onGridItemsChanged.emit(this.layouts[layoutName].length);
        this.onActiveDatasetChanged.emit(this.activeDataset);
        this.parameterService.addFiltersFromUrl(!loadDashboardState);
    };


    /**
     * Updates the layout of visualizations in the dashboard for the custom visualizations set.
     * @method updateCustomLayout
     * @private
     */
    updateCustomLayout() {
        // Clear the old grid items;
        this.activeGridService.clear();

        // Clear any old filters prior to loading the new layout and dataset.
        this.messenger.clearFilters();

        _.each(this.customVisualizations, function(visualization) {
            let id: string = uuid.v4();
            let layout: { [key: string]: any } = {
                id: id,
                bindings: {},
                bordersize: 10,
                dragHandle: 'drag-' + id,
                gridConfig: {
                    row: visualization.row,
                    col: visualization.col,
                    sizex: visualization.sizex,
                    sizey: visualization.sizey
                },
                payload: id,
                minSizeX: visualization.minSizeX,
                minSizeY: visualization.minSizeY,
                minPixelX: neonVisualizationMinPixel.x, // jshint ignore:line
                minPixelY: neonVisualizationMinPixel.y, // jshint ignore:line
                sizex: visualization.sizex,
                sizey: visualization.sizey,
                title: visualization.title,
                type: visualization.type
            };

            if (visualization.database && visualization.table) {
                layout['bindings'] = {
                    'bind-database': '\'' + visualization.database + '\'',
                    'bind-table': '\'' + visualization.table + '\''
                };
            }

            _.each(visualization.bindings, function(value, key) {
                layout['bindings'][key] = '\'' + value + '\'';
            });

            this.activeGridService.addItem(layout);
        });

        // TODO: Clear any saved states loaded through the parameters
        // $location.search("dashboard_state_id", null);
        // $location.search("filter_state_id", null);

        this.onGridItemsChanged.emit(this.customVisualizations.length);
        this.parameterService.addFiltersFromUrl();
    };

    /**
     * Selection event for the custom dataset popup.
     */
    selectCustom() {
        // Removed call to xdata logger library
        // Custom connection dialog is not yet implemented.
    };

    /**
     * Creates and returns a new custom dataset object using the user configuration saved in the global variables.
     * @return {Object}
     */
    createCustomDataset(): Dataset {
        let dataset: Dataset = new Dataset(this.datasetName, this.datastoreType, this.datastoreHost);

        this.customDatabases.forEach(function(customDatabase: CustomDatabase) {
            let database: DatabaseMetaData = new DatabaseMetaData(customDatabase.database.name, customDatabase.database.prettyName);

            customDatabase.customTables.forEach(function(customTable: CustomTable) {
                let tableObject: TableMetaData = new TableMetaData(customTable.table.name,
                    customTable.table.prettyName, customTable.table.fields, customTable.table.mappings);
                database.tables.push(tableObject);
            });

            dataset.databases.push(database);
        });

        this.customRelations.forEach(function(customRelation) {
            let relation = {};

            customRelation.customRelationDatabases.forEach(function(customRelationDatabase) {
                if (!relation[customRelationDatabase.database.name]) {
                    relation[customRelationDatabase.database.name] = {};
                }

                customRelationDatabase.customRelationTables.forEach(function(customRelationTable) {
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
    setDataset(config: any) {
        this.customDatabases = config.customDatabases;
        this.customRelations = config.customRelations;
        this.customVisualizations = config.customVisualizations;
        this.datastoreType = config.datastoreType;
        this.datastoreHost = config.datastoreHost;
        this.datasetName = config.datasetName;

        let dataset = this.createCustomDataset();

        this.activeDataset = {
            name: dataset.name,
            info: DatasetSelectorComponent.HIDE_INFO_POPOVER,
            data: true
        };
        this.onActiveDatasetChanged.emit(this.activeDataset);
        this.datasets = this.datasetService.addDataset(dataset);
        this.datasetService.setActiveDataset(dataset);
        this.updateCustomLayout();

        // TODO: Manage the custom connection modal.
        // $element.find(".modal").modal("hide");
    };
}
