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
import { DatasetOptions, FieldMetaData, SimpleFilter, TableMetaData } from '../../dataset';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import * as neon from 'neon-framework';
import { WidgetFieldOption, WidgetOption, WidgetOptionCollection } from '../../widget-option';
import { MapType } from '../map/map.type.abstract';
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
    public options: any = new WidgetOptionCollection();
    private messenger: neon.eventing.Messenger;
    private optionsList: WidgetOption[];

    private requiredList: WidgetOption[];
    private requiredListNonField: WidgetOption[];
    private optionalList: WidgetOption[];
    private optionalListNonField: WidgetOption[];
    private optionsListCollection: [WidgetOption[]];
    private changeList: any[];
    private changeLayerList: any[];
    private componentThis: any;

    private addLayer: Function;
    private removeLayer: Function;
    private handleChangeData: Function;
    private handleChangeDatabase: Function;
    private handleChangeLimit: Function;
    private handleChangeFilterField: Function;
    private handleChangeSubcomponentType: Function;
    private handleChangeTable: Function;
    private newLimit: string;
    private changeSubcomponentType: boolean;
    private limitChanged: boolean;
    private mapType: MapType;

    public collapseOptionalOptions: boolean;

    public layerVisible: Map<string, boolean> = new Map<string, boolean>();

    constructor(
        private changeDetection: ChangeDetectorRef,
        public injector: Injector,
        protected widgetService: AbstractWidgetService
    ) {
        this.injector = injector;
        this.collapseOptionalOptions = true;
        this.requiredList = [];
        this.requiredListNonField = [];
        this.optionalList = [];
        this.optionalListNonField = [];
        this.changeList = [];
        this.changeLayerList = [];
        this.mapType = 3;
        this.messenger = new neon.eventing.Messenger();
    }

    changeFilterFieldLimit(widgetOption, newValue) {
        this.newLimit = newValue;
        if (this.isNumber(this.newLimit)) {
            let newLimit = parseFloat('' + this.newLimit);
            if (newLimit > 0) {
                this.limitChanged = true;
                this.changeList.push(widgetOption, newLimit);
            } else {
                this.limitChanged = false;
                this.newLimit = this.options.limit;
            }
        } else {
            this.limitChanged = false;
            this.newLimit = this.options.limit;
        }
    }

    checkOptionType(currentType: string, checkType) {
        if (currentType === checkType) {
            return true;
        }
        return false;
    }

    /**
     * Removes database and table options
     */
    cleanShowOptions() {
        let list = this.optionsList;
        list = this.removeOptionsByEnableInMenu(list, false);
        list = this.removeOptionsByBindingKey(list, 'title');
        list = this.removeOptionsByType(list, 'DATABASE');
        list = this.removeOptionsByType(list, 'TABLE');
        this.optionsList = list;
    }

    /**
     * Constructs requiredList & optionalList at the same time
     */
    constructOptionsLists() {
        let list = this.optionsList;
        let requiredList = [];
        let optionalList = [];
        let requiredFieldList = [];
        let optionalFieldList = [];
        list.forEach(function(element) {
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

        this.requiredList = requiredFieldList;
        this.requiredListNonField = requiredList;
        this.optionalList = optionalList;
        this.optionalListNonField = optionalFieldList;
    }

    createEmptyField(): FieldMetaData {
        return new FieldMetaData();
    }

    /**
     * Disables the Apply button if there are any changes
     */
    disableApplyButton(): boolean {
        if (this.changeList.length === 0 && this.changeLayerList.length === 0) {
            return true;
        } else {
            return false;
        }
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

    getLayerList(layer) {
        let list = layer.list();
        //console.log(list);
        return list;
    }

    getTitle() {
        let titleOption = this.options.access('title');
        return titleOption.valueCurrent;
    }

    /**
     * Applys the list of changes in the changeList and calls the
     * handleChange functions accordingly.
     */
    handleApplyClick() {
        this.changeList.forEach((change) => {
            this.options[change.widgetOption.bindingKey] = change.newValue;
        });
        if (this.changeLayerList.length > 0) {
            this.changeLayerList.forEach((change) => {
                this.options.layers[change.index][change.option.bindingKey] = change.newValue;
            });
        }
        this.changeList = [];
        this.changeLayerList = [];

        if (this.mapType !== 3) {
            this.handleChangeSubcomponentType(this.mapType);
            this.changeSubcomponentType = false;
        } else if (this.changeSubcomponentType) {
            this.handleChangeSubcomponentType();
            this.changeSubcomponentType = false;
        }

        if (this.limitChanged) {
            this.handleChangeLimit();
        }

        this.handleChangeData();
        this.sideNavRight.close();
        this.resetList();
        this.changeDetection.detectChanges();
    }

    /**
     * Returns the icon for the filter for the layer with the given options.
     *
     * @arg widgetOption, newValue A WidgetOption object & the new value.
     */
    handleDataChange(widgetOption, newValue, layerIndex?) {
        //console.log(widgetOption);
        //console.log(layerIndex);

        if (layerIndex > -1) {
            let layerChange = {
                option: widgetOption,
                value: newValue,
                index: layerIndex
            };
            this.changeLayerList.push(layerChange);
            //console.log('layer');
            //console.log(this.changeLayerList);
            //console.log(this.options);
        }

        if (widgetOption.bindingkey === 'limit') {
            this.changeFilterFieldLimit(widgetOption, newValue);
        } else {
            this.overrideExistingChange(widgetOption);
            this.changeList.push({ widgetOption, newValue });
        }

        if (widgetOption.bindingKey === 'type') {
            this.changeSubcomponentType = true;
            if (widgetOption.prettyName === 'Map Type') {
                this.mapType = newValue;
            }
        }
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

    overrideExistingChange(option: WidgetOption) {
        this.changeList = this.changeList.filter((change) =>
            change.widgetOption.bindingKey !== option.bindingKey
        );
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
        this.changeList = [];
        this.optionsList = this.options.list();
        this.cleanShowOptions();
        this.constructOptionsLists();
        this.sideNavRight.close();
        this.resetList();
        this.changeDetection.detectChanges();
    }

    resetList() {
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
     *  Receives the message object with the WidgetOptionCollection object and callbacks from the widget
     * @arg {message} message
     */
    updateOptions(message) {
        this.addLayer = message.addLayer;
        this.removeLayer = message.removeLayer;
        this.options = message.options;
        this.handleChangeData = message.changeData;
        this.handleChangeDatabase = message.changeDatabase;
        this.handleChangeFilterField = message.changeFilterField;
        this.handleChangeLimit = message.changeLimitCallback;
        this.handleChangeSubcomponentType = message.handleChangeSubcomponentType;
        this.handleChangeTable = message.changeTable;
        this.componentThis = message.componentThis;

        this.optionsList = this.options.list();
        this.cleanShowOptions();
        this.constructOptionsLists();
        //console.log(this.options);
    }

}
