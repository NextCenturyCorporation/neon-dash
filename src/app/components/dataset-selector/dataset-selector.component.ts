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
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { ConnectionService } from '../../services/connection.service';
import { Datastore, DatabaseMetaData, TableMetaData, FieldMetaData, Relation, Dashboard } from '../../dataset';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ParameterService } from '../../services/parameter.service';

import { NeonGridItem } from '../../neon-grid-item';
import { neonEvents, neonVisualizationMinPixel } from '../../neon-namespaces';

import * as neon from 'neon-framework';
import * as _ from 'lodash';
import { DashboardDropdownComponent } from '../dashboard-dropdown/dashboard-dropdown.component';

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
    public datasets: Datastore[] = [];
    private datasetName: string = '';
    private datastoreType: string = 'mongo';
    private datastoreHost: string = 'localhost';
    private layouts: Map<string, any> = new Map<string, any>();
    public dashboards: Dashboard;
    public dashboardChoice: Dashboard;
    public connectOnLoadDashboard: Dashboard;

    @ViewChild('dashboardDropdown') dashboardDropdown: DashboardDropdownComponent;

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
    @Output() gridItemsChanged: EventEmitter<number> = new EventEmitter<number>();
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

    getDatasets(): Datastore[] {
        return this.datasets;
    }

    getDashboardKeys() {
        return Object.keys(this.dashboards);
    }

    // TODO: 825: using this to match dashboards to datastores for now
    findMatchingIndex(choice: Dashboard) {
        for (let index = 0; index < this.datasets.length; index ++) {
            if (this.datasets[index].name === choice.datastore) {
                return index;
            }
        }
    }

    /**
     * Returns boolean based on whether or not a dashboard exists that has connectOnLoad set to true.
     * Will also set connectOnLoadDashboard to the value of that dashboard if match is found.
     * @param {Map<string, Dashboard>} dashboardChoices
     * @param {string[]} keys
     * @return {Boolean}
     */
    hasConnectOnLoadDashboard(dashboardChoices: Map<string, Dashboard>, keys: string[]): boolean {
        return keys.some((choiceKey) => {
            let nestedChoiceKeys = dashboardChoices[choiceKey].choices ? Object.keys(dashboardChoices[choiceKey].choices) : [];

            if (!nestedChoiceKeys.length) {
                if (dashboardChoices[choiceKey].options && dashboardChoices[choiceKey].options.connectOnLoad === true) {
                    this.connectOnLoadDashboard = dashboardChoices[choiceKey];

                    return dashboardChoices[choiceKey];
                }
            } else {
                return this.hasConnectOnLoadDashboard(dashboardChoices[choiceKey].choices, nestedChoiceKeys);
            }
        });
    }

    ngOnInit(): void {
        let dashboardStateId: string = this.parameterService.findDashboardStateIdInUrl();

        this.datasets = this.datasetService.getDatasets();
        this.layouts = this.datasetService.getLayouts();
        this.dashboards = this.datasetService.getDashboards();

        if (dashboardStateId) {
            this.parameterService.loadState(dashboardStateId, this.parameterService.findFilterStateIdInUrl());
        } else {
            let activeDataset: string = (this.parameterService.findActiveDatasetInUrl() || '').toLowerCase();

            let dashboardKeys = this.dashboards.choices ? Object.keys(this.dashboards.choices) : [];

            if (this.hasConnectOnLoadDashboard(this.dashboards.choices, dashboardKeys)) {
                this.connectOnLoad = true;
                let paths = this.connectOnLoadDashboard.pathFromTop.replace(/choices./, '').split(/(?:.choices.)/);

                // If there is a dashboard choice with connectOnLoad set to true,
                // update the dashboard dropdowns one at a time until all
                // the dropdowns are populated
                this.dashboardDropdown.selectDashboardChoice(this.dashboards, paths, 0, this.dashboardDropdown);

                // TODO: 825: Won't need to use findMatchingIndex later to match dashboards to datastores.
                // Likely we would match via table keys. If error reporting is needed (dashboard/datastore
                // mismatch), we might be able to use ErrorNotificationService.
                let index = this.findMatchingIndex(this.connectOnLoadDashboard);
                let dataset = this.datasets[index];

                if ((activeDataset && activeDataset === dataset.name.toLowerCase())
                    || (!activeDataset && this.connectOnLoadDashboard.options.connectOnLoad)) {
                    this.connectToPreset(index, true, this.connectOnLoadDashboard);
                    this.activeDatasetChanged.emit(); // Close the sidenav opened by connectToPreset.
                }
            }

        }

        // TODO: 825: fix later
        // this is for loading saved state and passing in url params, but
        // maybe this shouldn't be here
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
                // TODO: 825: need new mechanism to set dashboard config?
                if (message.dashboard) {
                    let layoutName: string = 'savedDashboard-' + message.dashboardStateId;

                    this.layouts[layoutName] = message.dashboard;

                    if (message.dataset) {
                        this.datasetService.setLayout(layoutName);
                    }

                    this.messenger.publish(neonEvents.DASHBOARD_CLEAR, {});
                    message.dashboard.forEach((widgetGridItem) => {
                        this.messenger.publish(neonEvents.WIDGET_ADD, {
                            widgetGridItem: widgetGridItem
                        });
                    });
                    this.activeDatasetChanged.emit(this.activeDataset);
                    this.gridItemsChanged.emit(message.dashboard.length);
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
     * @param {Dashboard} dashboard to connect to
     * @method connectToPreset
     */
    // TODO: 825: new implementation:
    // - just focus on one connection for now
    // - for now using the datastores name to link dashboard and datastore
    // - then later, use the tablekeys and field keys from dashboards instead of
    //      the datastores/dashboards combo
    connectToPreset(index: number, loadDashboardState: boolean, dashboard: Dashboard) {
        this.activeDataset = {
            name: this.datasets[index].name,
            info: DatasetSelectorComponent.HIDE_INFO_POPOVER,
            data: true
        };
        this.datastoreType = this.datasets[index].type;
        this.datastoreHost = this.datasets[index].host;

        let connection: neon.query.Connection = this.connectionService.createActiveConnection(this.datastoreType, this.datastoreHost);
        if (!connection) {
            return;
        }

        // Don't update the dataset if its fields are already updated.
        if (this.datasets[index].hasUpdatedFields) {
            this.finishConnectToPreset(this.datasets[index], loadDashboardState, dashboard);
            return;
        }

        // Update the fields within each database and table within the selected dataset
        // to include fields that weren't listed in the configuration file.
        this.datasetService.updateDatabases(this.datasets[index], connection).then((dataset) => {
            this.datasets[index] = dataset;
            this.dashboards = this.datasetService.getDashboards();

            // Wait to update the layout until after we finish the dataset updates.
            this.finishConnectToPreset(dataset, loadDashboardState, dashboard);
        });
    }

    finishConnectToPreset(dataset: Datastore, loadDashboardState: boolean, dashboard: Dashboard) {
        if (_.get(this.dashboards, dashboard.pathFromTop)) {
            this.datasetService.setActiveDataset(dataset);
            this.datasetService.setCurrentDashboard(dashboard);
            this.updateLayout(loadDashboardState);
            this.filterService.clearFilters();
        }
    }

    /**
     * If selection change event bubbles up from dashboard-dropdown, this will set the
     * dashboardChoice to the appropriate value.
     * @param {any} event
     */
    setDashboardChoice($event: any) {
        this.dashboardChoice = $event;
    }

    /**
     * Finds the correct index for a particular dataset based on the dashboardChoice selected,
     * then calls connectToPreset().
     */
    callConnectToPreset() {
        if (this.dashboardChoice) {
            let index = this.findMatchingIndex(this.dashboardChoice);
            this.connectToPreset(index, false, this.dashboardChoice);
        }
    }

    /**
     * Updates the layout of visualizations in the dashboard for the active dataset.
     * @param {Boolean} loadDashboardState Whether to load any saved dashboard states shown upon a dataset change
     * @private
     */
    updateLayout(loadDashboardState: boolean) {
        let layoutName = this.datasetService.getLayout();
        let layout = this.layouts[layoutName] || [];

        // Clear any old filters prior to loading the new layout and dataset.
        this.messenger.clearFiltersSilently();

        this.messenger.publish(neonEvents.DASHBOARD_CLEAR, {});

        // Recreate the layout each time to ensure all visualizations are using the new dataset.
        // Use an empty array of visualizations if the new dataset has no defined layout.
        for (let widgetGridItem of layout) {
            this.messenger.publish(neonEvents.WIDGET_ADD, {
                widgetGridItem: _.cloneDeep(widgetGridItem)
            });
        }

        this.gridItemsChanged.emit(layout.length);
        this.activeDatasetChanged.emit(this.activeDataset);
        this.parameterService.addFiltersFromUrl(!loadDashboardState);
    }
}
