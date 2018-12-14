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

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { BaseLayeredNeonComponent } from '../base-neon-component/base-layered-neon.component';
import { ConfigEditorComponent } from '../config-editor/config-editor.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
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
    //public toggleGear: boolean;

    constructor(
        private changeDetection: ChangeDetectorRef,
        public injector: Injector,
        protected widgetService: AbstractWidgetService
    ) {
        this.injector = injector;

        this.requiredList = [];
        this.optionalList = [];
        this.messenger = new neon.eventing.Messenger();
        //this.messenger.subscribe('options', (message) => this.updateOptions(message));
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

    getTitle() {
        let titleOption = this.options.access('title');
        return titleOption.valueCurrent;
    }

    handleBtnChange(widgetOption, newValue) {
        //console.log(widgetOption);
        //console.log(newValue);
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

    updateOptions(message) {
        this.options = message.options;
        this.optionsList = this.options.list();
        this.cleanShowOptions();
        this.constructOptionsLists();
        //console.log(this.options);
    }

}
