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

import {
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    Component,
    Injector,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    ViewChildren,
    QueryList
} from '@angular/core';

import { MatSidenav } from '@angular/material';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FieldMetaData, SimpleFilter, TableMetaData } from '../../dataset';
import { OptionType, WidgetFieldOption, WidgetOption, WidgetOptionCollection } from '../../widget-option';
import { OptionsListComponent } from '../options-list/options-list.component';

import { neonEvents } from '../../neon-namespaces';
import { eventing } from 'neon-framework';

@Component({
    selector: 'app-gear',
    templateUrl: './gear.component.html',
    styleUrls: ['./gear.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated
})
export class GearComponent implements OnInit, OnDestroy {
    @Input() sideNavRight: MatSidenav;
    @ViewChildren('listChildren') listChildren: QueryList<OptionsListComponent>;

    private messenger: eventing.Messenger;
    private originalOptions: any;

    // Set to a stub object to stop initialization errors.
    public modifiedOptions: any = {
        databases: [],
        fields: [],
        layers: [],
        tables: []
    };

    public exportCallbacks: (() => { name: string, data: any }[])[] = [];
    public requiredList: string[] = [];
    public requiredListNonField: string[] = [];
    public optionalList: string[] = [];
    public optionalListNonField: string[] = [];

    private createLayer: (options: any, layerBinding?: any) => any;
    private deleteLayer: (options: any, layerOptions: any) => boolean;
    private finalizeCreateLayer: (layerOptions: any) => void;
    private finalizeDeleteLayer: (layerOptions: any) => void;
    private handleChangeData: (options?: any, databaseOrTableChange?: boolean) => void;
    private handleChangeFilterData: (options?: any, databaseOrTableChange?: boolean) => void;
    private handleChangeSubcomponentType: (options?: any) => void;

    private changeSubcomponentType: boolean = false;
    public changeMade: boolean = false;
    public collapseOptionalOptions: boolean = true;
    public layerHidden: Map<string, boolean> = new Map<string, boolean>();

    constructor(
        private changeDetection: ChangeDetectorRef,
        public injector: Injector,
        protected datasetService: DatasetService,
        protected widgetService: AbstractWidgetService
    ) {
        this.messenger = new eventing.Messenger();
    }

    private closeSidenav() {
        this.sideNavRight.close();
    }

    /**
     * Constructs requiredList & optionalList at the same time
     */
    private constructOptions() {
        this.modifiedOptions = this.originalOptions.copy();

        let optionList: WidgetOption[] = this.modifiedOptions.list();
        optionList = this.removeOptionsByEnableInMenu(optionList, false);
        optionList = this.removeOptionsByBindingKey(optionList, 'title');
        optionList = this.removeOptionsByType(optionList, 'DATABASE');
        optionList = this.removeOptionsByType(optionList, 'TABLE');

        let requiredList: WidgetOption[] = [];
        let optionalList: WidgetOption[] = [];
        let requiredFieldList: WidgetOption[] = [];
        let optionalFieldList: WidgetOption[] = [];

        optionList.forEach(function(element) {
            if (element.isRequired) {
                requiredList.push(element);
            } else {
                optionalList.push(element);
            }
        });

        requiredList.forEach(function(element) {
            if (element.optionType === 'FIELD') {
                requiredFieldList.push(element);
                requiredList.splice(requiredList.indexOf(element), 1);
            }
        });

        optionalList.forEach(function(element) {
            if (element.optionType === 'FIELD') {
                optionalFieldList.push(element);
                optionalList.splice(optionalList.indexOf(element), 1);
            }
        });

        this.requiredList = requiredFieldList.map((option) => option.bindingKey);
        this.requiredListNonField = requiredList.map((option) => option.bindingKey);
        this.optionalList = optionalList.map((option) => option.bindingKey);
        this.optionalListNonField = optionalFieldList.map((option) => option.bindingKey);
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
     * Returns the icon for the optional options.
     *
     * @return {string}
     */
    public getIconForOptions() {
        let icon: string;
        if (this.collapseOptionalOptions) {
            icon = 'keyboard_arrow_down';
        } else {
            icon = 'keyboard_arrow_up';
        }
        return icon;
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
                this.finalizeDeleteLayer(layer);
            }
        });
        let originalLayerIds = this.originalOptions.layers.map((layer) => layer._id);
        this.modifiedOptions.layers.forEach((layer) => {
            // If the layer was created, finalize its creation.
            if (originalLayerIds.indexOf(layer._id) < 0) {
                this.finalizeCreateLayer(layer);
            }
        });

        this.originalOptions.layers = this.modifiedOptions.layers;

        // TODO THOR-1061
        if (this.changeSubcomponentType) {
            this.handleChangeSubcomponentType();
        }

        if (filterDataChange) {
            this.handleChangeFilterData(undefined, databaseOrTableChange);
        } else {
            this.handleChangeData(undefined, databaseOrTableChange);
        }

        this.resetOptionsAndClose();
    }

    /**
     * Handles the change of database in the given options.
     *
     * @arg {any} options A WidgetOptionCollection
     */
    public handleChangeDatabase(options: any): void {
        options.updateTables(this.datasetService);
        this.changeMade = true;
    }

    /**
     * Handles the change of table in the given options.
     *
     * @arg {any} options A WidgetOptionCollection
     */
    public handleChangeTable(options: any): void {
        options.updateFields(this.datasetService);
        this.changeMade = true;
    }

    /**
     * Creates a new layer.
     */
    public handleCreateLayer() {
        let layer: any = this.createLayer(this.modifiedOptions);
        this.layerHidden.set(layer._id, false);
        this.changeMade = true;
    }

    /**
     * Deletes the given layer.
     */
    public handleDeleteLayer(layer: any) {
        let successful: boolean = this.deleteLayer(this.modifiedOptions, layer);
        if (successful) {
            this.layerHidden.delete(layer._id);
            this.changeMade = true;
        } else {
            this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                message: 'Cannot delete final layer of ' + this.modifiedOptions.title + ' (' + layer.title + ')'
            });
        }
    }

    private isFilterData(optionType: OptionType): boolean {
        return optionType === OptionType.DATABASE || optionType === OptionType.TABLE || optionType === OptionType.FIELD ||
            optionType === OptionType.FIELD_ARRAY;
    }

    /**
     * Returns whether the given item is a number.
     *
     * @arg {any} item
     * @return {boolean}
     */
    private isNumber(item: any): boolean {
        return !isNaN(parseFloat(item)) && isFinite(item);
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    ngOnInit() {
        this.messenger.subscribe(neonEvents.SHOW_OPTION_MENU, (message) => this.updateOptions(message));
        this.changeDetection.detectChanges();
    }

    private removeOptionsByBindingKey(list: any[], bindingKey: string): any[] {
        let newList = list;
        newList = newList.filter(function(field) {
            return field.bindingKey !== bindingKey;
        });
        return newList;
    }

    private removeOptionsByEnableInMenu(list: any[], enableInMenu: boolean): any[] {
        let newList = list;
        newList = newList.filter(function(field) {
            return field.enableInMenu !== enableInMenu;
        });
        return newList;
    }

    private removeOptionsByType(list: any[], optionType: string): any[] {
        let newList = list;
        newList = newList.filter(function(field) {
            return field.optionType !== optionType;
        });
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
        this.collapseOptionalOptions = true;
        this.layerHidden = new Map<string, boolean>();

        this.requiredList = [];
        this.requiredListNonField = [];
        this.optionalList = [];
        this.optionalListNonField = [];

        this.modifiedOptions = {
            databases: [],
            fields: [],
            layers: [],
            tables: []
        };
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
     * Toggles the visibility of the optional options
     */
    public toggleOptionalOptions(): void {
        this.collapseOptionalOptions = !this.collapseOptionalOptions;
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

    /**
     * Receives the message object with the WidgetOptionCollection object and callbacks from the widget
     *
     * @arg {message} message
     */
    private updateOptions(message) {
        this.createLayer = message.createLayer;
        this.deleteLayer = message.deleteLayer;
        this.finalizeCreateLayer = message.finalizeCreateLayer;
        this.finalizeDeleteLayer = message.finalizeDeleteLayer;
        this.originalOptions = message.options;
        this.handleChangeData = message.changeData;
        this.handleChangeFilterData = message.changeFilterData;
        this.handleChangeSubcomponentType = message.handleChangeSubcomponentType;
        this.exportCallbacks = [message.exportData];

        this.resetOptions();
        this.constructOptions();
    }

}
