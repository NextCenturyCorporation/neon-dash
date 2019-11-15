/**
 * Copyright 2019 Next Century Corporation
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
 */

import {
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    ViewEncapsulation,
    Input
} from '@angular/core';

import { MatSidenav } from '@angular/material';

import { DashboardService } from '../../services/dashboard.service';
import { OptionType } from 'component-library/dist/core/models/config-option';
import { RootWidgetOptionCollection, WidgetOptionCollection, ConfigurableWidget } from '../../models/widget-option-collection';

import { neonEvents } from '../../models/neon-namespaces';
import { eventing } from 'component-library/node_modules/neon-framework/dist/neon';
import { DashboardState } from '../../models/dashboard-state';
import * as _ from 'lodash';

@Component({
    selector: 'app-gear',
    templateUrl: './gear.component.html',
    styleUrls: ['./gear.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated
})
export class GearComponent implements OnDestroy {
    @Input() comp: ConfigurableWidget;
    @Input() sideNavRight: MatSidenav;

    private messenger: eventing.Messenger;
    private originalOptions: RootWidgetOptionCollection;

    // Set to a stub object to stop initialization errors.
    public modifiedOptions: RootWidgetOptionCollection;

    public exportCallbacks: (() => { name: string, data: any }[])[] = [];

    private changeSubcomponentType: boolean = false;
    public changeMade: boolean = false;
    public layerHidden: Map<string, boolean> = new Map<string, boolean>();

    public readonly dashboardState: DashboardState;

    constructor(
        private changeDetection: ChangeDetectorRef,
        dashboardService: DashboardService
    ) {
        this.messenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
        this.modifiedOptions = this.createEmptyOptionsCollection();
    }

    private closeSidenav() {
        this.sideNavRight.close();
    }

    /**
     * Updates the modifiedOptions.
     */
    private constructOptions() {
        this.modifiedOptions = this.originalOptions.copy();
    }

    private createEmptyOptionsCollection(): RootWidgetOptionCollection {
        return new RootWidgetOptionCollection();
    }

    /**
     * Returns the icon for the filter for the layer with the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {string}
     */
    public getIconForFilter(options: any): string {
        return this.layerHidden.get(options._id) ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
    }

    /**
     * Applys the list of changes in the changeList and calls the
     * handleChange functions accordingly.
     */
    public handleApplyClick() {
        let databaseOrTableChange = this.originalOptions.datastore !== this.modifiedOptions.datastore ||
            this.originalOptions.database !== this.modifiedOptions.database ||
            this.originalOptions.table !== this.modifiedOptions.table;

        this.originalOptions.datastore = this.modifiedOptions.datastore;
        this.originalOptions.database = this.modifiedOptions.database;
        this.originalOptions.databases = this.modifiedOptions.databases;
        this.originalOptions.table = this.modifiedOptions.table;
        this.originalOptions.tables = this.modifiedOptions.tables;
        this.originalOptions.fields = this.modifiedOptions.fields;

        this.modifiedOptions.list().forEach((option) => {
            this.originalOptions[option.bindingKey] = option.valueCurrent;
        });

        let modifiedLayerIds = this.modifiedOptions.layers.map((layer) => layer._id);
        this.originalOptions.layers.forEach((layer) => {
            // If the layer was deleted, finalize its deletion.
            if (modifiedLayerIds.indexOf(layer._id) < 0) {
                this.comp.finalizeDeleteLayer(layer);
            }
        });
        let originalLayerIds = this.originalOptions.layers.map((layer) => layer._id);
        this.modifiedOptions.layers.forEach((layer) => {
            // If the layer was created, finalize its creation.
            if (originalLayerIds.indexOf(layer._id) < 0) {
                this.comp.finalizeCreateLayer(layer);
            }
        });

        this.originalOptions.layers = this.modifiedOptions.layers;

        // TODO THOR-1061
        if (this.changeSubcomponentType) {
            this.comp.handleChangeSubcomponentType();
        }

        this.comp.changeOptions(undefined, databaseOrTableChange);

        this.resetOptionsAndClose();
    }

    /**
     * Handles the change of datastore in the given options.
     *
     * @arg {any} options A WidgetOptionCollection
     */
    public handleChangeDatastore(options: WidgetOptionCollection): void {
        options.updateDatabases(this.dashboardState.asDataset());
        this.changeMade = true;
    }

    /**
     * Handles the change of database in the given options.
     *
     * @arg {any} options A WidgetOptionCollection
     */
    public handleChangeDatabase(options: WidgetOptionCollection): void {
        options.updateTables(this.dashboardState.asDataset());
        this.changeMade = true;
    }

    /**
     * Handles the change of table in the given options.
     *
     * @arg {any} options A WidgetOptionCollection
     */
    public handleChangeTable(options: WidgetOptionCollection): void {
        options.updateFields();
        this.changeMade = true;
    }

    /**
     * Creates a new layer.
     */
    public handleCreateLayer() {
        let layer: any = this.comp.createLayer(this.modifiedOptions);
        this.layerHidden.set(layer._id, false);
        this.changeMade = true;
    }

    /**
     * Deletes the given layer.
     */
    public handleDeleteLayer(layer: any) {
        let successful: boolean = this.comp.deleteLayer(this.modifiedOptions, layer);
        if (successful) {
            this.layerHidden.delete(layer._id);
            this.changeMade = true;
        } else {
            this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                message: 'Sorry, you cannot delete the final layer of ' + this.modifiedOptions.title + ' (' + layer.title + ')'
            });
        }
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    /**
     * Receives
     */
    ngAfterViewInit() {
        if (this.comp) {
            this.originalOptions = this.comp.options;
            this.exportCallbacks = [this.comp.exportData.bind(this.comp)];
            this.resetOptions();
            this.constructOptions();
        }
    }

    /**
     * Resets the data and closes the menu.
     */
    public resetOptionsAndClose() {
        this.closeSidenav();
        this.resetOptions();
        this.changeDetection.detectChanges();
    }

    private resetOptions() {
        this.changeMade = false;
        this.changeSubcomponentType = false;
        this.layerHidden = new Map<string, boolean>();

        this.modifiedOptions = this.createEmptyOptionsCollection();
    }

    /**
     * Toggles the visibility of the filter for the layer with the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    public toggleFilter(options: any): void {
        this.layerHidden.set(options._id, !(this.layerHidden.get(options._id)));
    }

    /**
     * Updates the gear menu on data change.
     *
     * @arg {string} bindingKey
     */
    public updateOnChange(bindingKey: string) {
        // If the original binding key has been changed and added before
        if (this.originalOptions.access(bindingKey) !== undefined) {
            if (this.originalOptions.access(bindingKey).optionType === OptionType.NON_PRIMITIVE) {
                if (_.isEqual(this.originalOptions[bindingKey], this.modifiedOptions[bindingKey])) {
                    this.changeMade = false;
                    return;
                }
            }
        }
        // If the modified gets cleared while original has already been set
        if (_.isEmpty(this.modifiedOptions[bindingKey]) && !_.isEmpty(this.originalOptions[bindingKey])) {
            this.changeMade = true;
            return;
        }
        // If modified has never been set (undefined) and the original has already been set before (currently empty)
        if (typeof (this.modifiedOptions[bindingKey]) === 'undefined' && _.isPlainObject(this.originalOptions[bindingKey])) {
            this.changeMade = false;
            return;
        }
        this.changeMade = true;
        // TODO THOR-1061
        if (bindingKey === 'type') {
            this.changeSubcomponentType = true;
        }
    }
}
