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
    Input,
    ViewChildren,
    QueryList
} from '@angular/core';

import { MatSidenav } from '@angular/material';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { OptionType, WidgetOption, WidgetOptionCollection, ConfigurableWidget } from '../../models/widget-option';
import { OptionsSectionComponent } from '../options-section/options-section.component';

import { neonEvents } from '../../models/neon-namespaces';
import { eventing } from 'neon-framework';
import { DashboardState } from '../../models/dashboard-state';

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
    @ViewChildren('listChildren') listChildren: QueryList<OptionsSectionComponent>;

    private messenger: eventing.Messenger;
    private originalOptions: WidgetOptionCollection;

    // Set to a stub object to stop initialization errors.
    public modifiedOptions: any = new WidgetOptionCollection(() => []);

    public exportCallbacks: (() => { name: string, data: any }[])[] = [];

    private changeSubcomponentType: boolean = false;
    public changeMade: boolean = false;
    public layerHidden: Map<string, boolean> = new Map<string, boolean>();

    public readonly dashboardState: DashboardState;

    constructor(
        private changeDetection: ChangeDetectorRef,
        dashboardService: DashboardService,
        protected widgetService: AbstractWidgetService
    ) {
        this.messenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
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
     * Returns the list of binding keys for the given layer.
     *
     * @arg {any} layer
     * @return {string[]}
     */
    public getLayerList(layer: any): string[] {
        // TODO THOR-1062
        let optionList: WidgetOption[] = layer.list();
        optionList = this.removeOptionsByEnableInMenu(optionList, false);
        optionList = this.removeOptionsByBindingKey(optionList, 'title');
        optionList = this.removeOptionsByBindingKey(optionList, 'limit');
        optionList = this.removeOptionsByType(optionList, 'DATABASE');
        optionList = this.removeOptionsByType(optionList, 'TABLE');
        return optionList.map((option) => option.bindingKey);
    }

    /**
     * Applys the list of changes in the changeList and calls the
     * handleChange functions accordingly.
     */
    public handleApplyClick() {
        let filterDataChange = this.originalOptions.database.name !== this.modifiedOptions.database.name ||
            this.originalOptions.table.name !== this.modifiedOptions.table.name;

        let databaseOrTableChange = this.originalOptions.database !== this.modifiedOptions.database ||
            this.originalOptions.table !== this.modifiedOptions.table;

        this.originalOptions.database = this.modifiedOptions.database;
        this.originalOptions.databases = this.modifiedOptions.databases;
        this.originalOptions.table = this.modifiedOptions.table;
        this.originalOptions.tables = this.modifiedOptions.tables;
        this.originalOptions.fields = this.modifiedOptions.fields;

        this.modifiedOptions.list().forEach((option) => {
            if (this.originalOptions[option.bindingKey] !== option.valueCurrent && this.isFilterData(option.optionType)) {
                filterDataChange = true;
            }
            // TODO THOR-1044 Validate number free text options
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

        if (filterDataChange) {
            this.comp.changeFilterData(undefined, databaseOrTableChange);
        } else {
            this.comp.changeData(undefined, databaseOrTableChange);
        }

        this.resetOptionsAndClose();
    }

    /**
     * Handles the change of database in the given options.
     *
     * @arg {any} options A WidgetOptionCollection
     */
    public handleChangeDatabase(options: WidgetOptionCollection): void {
        options.updateTables(this.dashboardState);
        this.changeMade = true;
    }

    /**
     * Handles the change of table in the given options.
     *
     * @arg {any} options A WidgetOptionCollection
     */
    public handleChangeTable(options: WidgetOptionCollection): void {
        options.updateFields(this.dashboardState);
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
            this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                message: 'Cannot delete final layer of ' + this.modifiedOptions.title + ' (' + layer.title + ')'
            });
        }
    }

    public handleRefreshClick() {
        this.comp.changeData(undefined, false);
        this.resetOptionsAndClose();
    }

    private isFilterData(optionType: OptionType): boolean {
        return optionType === OptionType.DATABASE || optionType === OptionType.TABLE || optionType === OptionType.FIELD ||
            optionType === OptionType.FIELD_ARRAY;
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
            /* eslint-disable-next-line @typescript-eslint/unbound-method */
            this.exportCallbacks = [this.comp.exportData];
            this.resetOptions();
            this.constructOptions();
        }
    }

    private removeOptionsByBindingKey(list: any[], bindingKey: string): any[] {
        let newList = list;
        newList = newList.filter((field) => field.bindingKey !== bindingKey);
        return newList;
    }

    private removeOptionsByEnableInMenu(list: any[], enableInMenu: boolean): any[] {
        let newList = list;
        newList = newList.filter((field) => field.enableInMenu !== enableInMenu);
        return newList;
    }

    private removeOptionsByType(list: any[], optionType: string): any[] {
        let newList = list;
        newList = newList.filter((field) => field.optionType !== optionType);
        return newList;
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

        // Call options-section reset to reset the lists
        this.listChildren.forEach((child) => {
            child.optionSectionResetOptions();
        });

        this.modifiedOptions = new WidgetOptionCollection(() => []);
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
        this.changeMade = true;
        // TODO THOR-1061
        if (bindingKey === 'type') {
            this.changeSubcomponentType = true;
        }
    }
}
