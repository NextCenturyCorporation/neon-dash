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

import { OptionsListComponent } from '../options-list/options-list.component';
import { FieldMetaData, SimpleFilter, TableMetaData } from '../../dataset';
import { DatasetService } from '../../services/dataset.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import * as neon from 'neon-framework';
import { OptionType, WidgetFieldOption, WidgetOption, WidgetOptionCollection } from '../../widget-option';
import { MatSidenav } from '@angular/material';

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

    private messenger: neon.eventing.Messenger;
    private originalOptions: any;
    public modifiedOptions: any = {
        databases: [],
        fields: [],
        layers: [],
        tables: []
    };

    private requiredList: string[] = [];
    private requiredListNonField: string[] = [];
    private optionalList: string[] = [];
    private optionalListNonField: string[] = [];
    private componentThis: any;

    private createLayer: Function;
    private deleteLayer: Function;
    private finalizeCreateLayer: Function;
    private finalizeDeleteLayer: Function;
    private handleChangeData: Function;
    private handleChangeFilterData: Function;
    private handleChangeSubcomponentType: Function;

    private changeSubcomponentType: boolean = false;
    public changeMade: boolean = false;
    public collapseOptionalOptions: boolean = true;
    public layerVisible: Map<string, boolean> = new Map<string, boolean>();

    constructor(
        private changeDetection: ChangeDetectorRef,
        public injector: Injector,
        protected datasetService: DatasetService,
        protected widgetService: AbstractWidgetService
    ) {
        this.messenger = new neon.eventing.Messenger();
    }

    /**
     * Constructs requiredList & optionalList at the same time
     */
    createGearMenuData() {
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

    createEmptyField(): FieldMetaData {
        return new FieldMetaData();
    }

    /**
     * Returns the icon for the filter for the layer with the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {string}
     */
    getIconForFilter(options: any): string {
        return this.layerVisible.get(options._id) ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
    }

    getIconForOptions() {
        let icon: string;
        if (this.collapseOptionalOptions) {
            icon = 'keyboard_arrow_down';
        } else {
            icon = 'keyboard_arrow_up';
        }
        return icon;
    }

    getLayerList(layer: any): string[] {
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
    handleApplyClick() {
        let filterDataChange = this.originalOptions.database.name !== this.modifiedOptions.database.name ||
            this.originalOptions.table.name !== this.modifiedOptions.table.name;

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
            this.handleChangeFilterData();
        } else {
            this.handleChangeData();
        }

        this.sideNavRight.close();
        this.resetList();
        this.changeDetection.detectChanges();
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
    isNumber(item: any): boolean {
        return !isNaN(parseFloat(item)) && isFinite(item);
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    ngOnInit() {
        this.messenger.subscribe('options', (message) => this.updateOptions(message));
        this.changeDetection.detectChanges();
    }

    /**
     * Runs any needed behavior after a new layer was added.
     *
     * @arg {any} options
     * @override
     */
    postAddLayer(options: any) {
        this.layerVisible.set(options._id, true);
    }

    removeOptionsByBindingKey(list: any[], bindingKey: string): any[] {
        let newList = list;
        newList = newList.filter(function(field) {
            return field.bindingKey !== bindingKey;
        });
        return newList;
    }

    removeOptionsByEnableInMenu(list: any[], enableInMenu: boolean): any[] {
        let newList = list;
        newList = newList.filter(function(field) {
            return field.enableInMenu !== enableInMenu;
        });
        return newList;
    }

    removeOptionsByType(list: any[], optionType: string): any[] {
        let newList = list;
        newList = newList.filter(function(field) {
            return field.optionType !== optionType;
        });
        return newList;
    }

    resetChangeList() {
        this.createGearMenuData();
        this.sideNavRight.close();
        this.resetList();
        this.changeDetection.detectChanges();
    }

    resetList() {
        this.changeMade = false;
        this.changeSubcomponentType = false;
        this.requiredList = [];
        this.requiredListNonField = [];
        this.optionalList = [];
        this.optionalListNonField = [];
    }

    /**
     * Toggles the visibility of the filter for the layer with the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    toggleFilter(options: any): void {
        this.layerVisible.set(options._id, !(this.layerVisible.get(options._id)));
    }

    /**
     * Toggles the visibility of the optional options
     */
    toggleOptionalOptions(): void {
        this.collapseOptionalOptions = !this.collapseOptionalOptions;
    }

    /**
     * Updates the gear menu on data change.
     *
     * @arg {string} bindingKey
     */
    updateGearMenuOnDataChange(bindingKey: string) {
        this.changeMade = true;
        // TODO THOR-1061
        if (bindingKey === 'type') {
            this.changeSubcomponentType = true;
        }
    }

    handleAddLayer() {
        this.createLayer(this.modifiedOptions);
        this.changeMade = true;
    }

    handleRemoveLayer(layer: any) {
        this.deleteLayer(this.modifiedOptions, layer);
        this.changeMade = true;
    }

    /**
     *  Receives the message object with the WidgetOptionCollection object and callbacks from the widget
     * @arg {message} message
     */
    updateOptions(message) {
        this.createLayer = message.createLayer;
        this.deleteLayer = message.deleteLayer;
        this.finalizeCreateLayer = message.finalizeCreateLayer;
        this.finalizeDeleteLayer = message.finalizeDeleteLayer;
        this.originalOptions = message.options;
        this.handleChangeData = message.changeData;
        this.handleChangeFilterData = message.changeFilterData;
        this.handleChangeSubcomponentType = message.handleChangeSubcomponentType;
        this.componentThis = message.componentThis;

        this.createGearMenuData();
    }

}
