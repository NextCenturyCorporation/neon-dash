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
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';

import { ConnectionService } from '../../services/connection.service';
import { Dataset, DatabaseMetaData, TableMetaData, FieldMetaData, Relation } from '../../dataset';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ParameterService } from '../../services/parameter.service';

import { NeonGridItem } from '../../neon-grid-item';
import { neonEvents, neonVisualizationMinPixel } from '../../neon-namespaces';

import * as neon from 'neon-framework';
import * as _ from 'lodash';

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

    public connectOnLoad: boolean = false;
    public datasets: Dataset[] = [];
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
     *             Each custom relation table contains:
     *             {Object} table The table object
     *             {Object} field The field object
     */
    private customRelations: any[] = [];

    /**
     * This is the array of custom visualization objects configured by the user through the popup.  Each custom visualization contains:
     *     {String} type The visualization type
     *     {Number} sizex The width of the visualization
     *     {Number} sizey The height of the visualization
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
    @Output() activeDatasetChanged: EventEmitter<any> = new EventEmitter<any>();

    private messenger: neon.eventing.Messenger;

    constructor(
        private connectionService: ConnectionService,
        private datasetService: DatasetService,
        private filterService: FilterService,
        private parameterService: ParameterService
    ) {
        this.messenger = new neon.eventing.Messenger();
    }

    getDatasets(): Dataset[] {
        return this.datasets;
    }

    ngOnInit(): void {
        let dashboardStateId: string = this.parameterService.findDashboardStateIdInUrl();

        this.datasets = this.datasetService.getDatasets();
        this.layouts = this.datasetService.getLayouts();

        if (dashboardStateId) {
            this.parameterService.loadState(dashboardStateId, this.parameterService.findFilterStateIdInUrl());
        } else {
            let activeDataset: string = (this.parameterService.findActiveDatasetInUrl() || '').toLowerCase();
            this.datasets.some((dataset, index) => {
                if (dataset.connectOnLoad) {
                    this.connectOnLoad = true;
                }
                if ((activeDataset && activeDataset === dataset.name.toLowerCase()) || (!activeDataset && dataset.connectOnLoad)) {
                    this.connectToPreset(index, true);
                    this.activeDatasetChanged.emit(); // Close the sidenav opened by connectToPreset.
                    return true;
                }
                return false;
            });
        }

        this.messenger.subscribe(neonEvents.DASHBOARD_STATE, (message) => {
            if (message && message.dataset) {
                if (message.dataset) {
                    this.datasetService.setActiveDataset(message.dataset);

                    this.activeDataset = {
                        name: message.dataset.name,
                        info: DatasetSelectorComponent.HIDE_INFO_POPOVER,
                        data: true
                    };
                    this.activeDatasetChanged.emit(this.activeDataset);
                }
                if (message.dashboard) {
                    let layoutName: string = 'savedDashboard-' + message.dashboardStateId;

                    this.layouts[layoutName] = message.dashboard;

                    if (message.dataset) {
                        this.datasetService.setLayout(layoutName);
                    }

                    this.messenger.publish(neonEvents.DASHBOARD_CLEAR, {});

                    let gridNameToLayout = !Array.isArray(this.layouts[layoutName]) ? this.layouts[layoutName] : {
                        '': this.layouts[layoutName]
                    };

                    // Recreate the layout each time to ensure all visualizations are using the new dataset.
                    // Use an empty array of visualizations if the new dataset has no defined layout.
                    Object.keys(gridNameToLayout).forEach((gridName) => {
                        let layout = gridNameToLayout[gridName];
                        layout.forEach((widgetGridItem) => {
                            this.messenger.publish(neonEvents.WIDGET_ADD, {
                                gridName: gridName,
                                widgetGridItem: _.cloneDeep(widgetGridItem)
                            });
                        });
                    });

                    this.activeDatasetChanged.emit(this.activeDataset);
                }
            }
        });

        if (!this.connectOnLoad) {
            this.activeDatasetChanged.emit(this.activeDataset);
        }
    }

    ngOnDestroy(): void {
        // Do nothing.
    }

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
        this.datasetService.updateDatabases(this.datasets[index], connection, (dataset) => {
            this.datasets[index] = dataset;

            // Wait to update the layout until after we finish the dataset updates.
            this.finishConnectToPreset(dataset, loadDashboardState);
        });
    }

    finishConnectToPreset(dataset: Dataset, loadDashboardState: boolean) {
        this.datasetService.setActiveDataset(dataset);
        this.updateLayout(loadDashboardState);
        this.filterService.clearFilters();
    }

    /**
     * Updates the layout of visualizations in the dashboard for the active dataset.
     * @param {Boolean} loadDashboardState Whether to load any saved dashboard states shown upon a dataset change
     * @private
     */
    updateLayout(loadDashboardState: boolean) {
        let layoutName = this.datasetService.getLayout();
        let layoutConfig = this.layouts[layoutName] || [];

        // Clear any old filters prior to loading the new layout and dataset.
        this.messenger.clearFiltersSilently();

        this.messenger.publish(neonEvents.DASHBOARD_CLEAR, {});

        let gridNameToLayout = !Array.isArray(layoutConfig) ? layoutConfig : {
            '': layoutConfig
        };

        // Recreate the layout each time to ensure all visualizations are using the new dataset.
        // Use an empty array of visualizations if the new dataset has no defined layout.
        Object.keys(gridNameToLayout).forEach((gridName) => {
            let layout = gridNameToLayout[gridName];
            layout.forEach((widgetGridItem) => {
                this.messenger.publish(neonEvents.WIDGET_ADD, {
                    gridName: gridName,
                    widgetGridItem: _.cloneDeep(widgetGridItem)
                });
            });
        });

        this.activeDatasetChanged.emit(this.activeDataset);
        this.parameterService.addFiltersFromUrl(!loadDashboardState);
    }
}
