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

import { ChangeDetectorRef, ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, Injector } from '@angular/core';
import { URLSearchParams } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { DatasetOptions, FieldMetaData, SimpleFilter, TableMetaData } from '../../dataset';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';

import * as _ from 'lodash';
import * as neon from 'neon-framework';
import { WidgetFieldOption, WidgetOption, WidgetOptionCollection } from '../../widget-option';
import { isNgTemplate } from '@angular/compiler';

@Component({
    selector: 'app-gear',
    templateUrl: 'gear.component.html',
    styleUrls: ['gear.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GearComponent implements OnInit, OnDestroy {

    public options: any = new WidgetOptionCollection();
    public messenger: neon.eventing.Messenger;
    public optionsList: WidgetOption[];
    public requiredList: WidgetOption[];
    public optionalList: WidgetOption[];
    public changeList: any[];
    public changeCallback: Function; //{(): => void; };
    public changeLimitCallback: Function;
    public handleChangeCallback: Function;
    //public toggleGear: boolean;
    public newLimit: string;
    public limitChanged: boolean;

    constructor(
        private changeDetection: ChangeDetectorRef,
        public injector: Injector,
        protected widgetService: AbstractWidgetService
    ) {
        this.injector = injector;

        this.requiredList = [];
        this.optionalList = [];
        this.changeList = [];
        this.messenger = new neon.eventing.Messenger();
        //this.messenger.subscribe('options', (message) => this.updateOptions(message));
    }

    overrideExistingChange(option: WidgetOption) {
        //let exists = false;
        this.changeList = this.changeList.filter((change) =>
            change.widgetOption.bindingKey !== option.bindingKey
        );
    }

    checkOptionType(currentType: string, checkType) {
        if (currentType === checkType) {
            return true;
        }
        return false;
    }

    cleanShowOptions() {
        let list = this.optionsList;
        list = this.removeOptionsByEnableInMenu(list, false);
        list = this.removeOptionsByBindingKey(list, 'title');
        list = this.removeOptionsByType(list, 'DATABASE');
        list = this.removeOptionsByType(list, 'TABLE');
        this.optionsList = list;
    }

    constructOptionsLists() {
        let list = this.optionsList;
        let requiredList = [];
        list.forEach(function(element) {
            if (element.isRequired && element instanceof WidgetFieldOption) {
                requiredList.push(element);
                list.splice(list.indexOf(element), 1);
            }
        });
        this.requiredList = requiredList;
        this.optionalList = list;
        //console.log(this.requiredList);
        //console.log(this.optionalList);
    }

    getApplyButtonText() {
        return 'Apply Field Changes';
    }

    getTitle() {
        let titleOption = this.options.access('title');
        return titleOption.valueCurrent;
    }

    handleApplyClick() {
        this.changeList.forEach((change) => {
            this.options[change.widgetOption.bindingkey] = change.newValue;
        });
        this.changeList = [];

        if (this.limitChanged) {
            this.changeLimitCallback();
        }

        this.changeCallback();
    }

    handleChangeLimit(widgetOption, newValue) {
        this.newLimit = newValue;
        if (this.isNumber(this.newLimit)) {
            let newLimit = parseFloat('' + this.newLimit);
            if (newLimit > 0) {
                this.limitChanged = true;
                this.changeList.push(widgetOption, newValue);
            } else {
                this.limitChanged = false;
                this.newLimit = this.options.limit;
            }
        } else {
            this.limitChanged = false;
            this.newLimit = this.options.limit;
        }
    }

    handleDataChange(widgetOption, newValue) {

        //console.log(this.changeList);
        //console.log('widget option');
        //console.log(widgetOption);
        //console.log('New value"');
        //console.log(newValue);
        if (widgetOption.bindingkey === 'limit') {
            this.handleChangeLimit(widgetOption, newValue);
        } else {
            this.overrideExistingChange(widgetOption);
            this.changeList.push({ widgetOption, newValue });
        }
        this.options[widgetOption.bindingKey] = newValue;
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
        this.changeDetection.detectChanges();
    }

    updateOptions(message) {
        //console.log(message);
        this.options = message.options;
        this.changeCallback = message.changeCallback;
        this.changeLimitCallback = message.changeLimitCallback;

        this.optionsList = this.options.list();
        this.cleanShowOptions();
        this.constructOptionsLists();
    }

}
