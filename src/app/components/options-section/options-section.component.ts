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
    ChangeDetectionStrategy,
    Component,
    Input,
    ViewEncapsulation,
    ElementRef,
    Renderer2
} from '@angular/core';
import { WidgetOptionCollection, WidgetOption } from '../../models/widget-option';
import * as _ from 'lodash';

@Component({
    selector: 'app-options-section',
    templateUrl: './options-section.component.html',
    styleUrls: ['./options-section.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.Default
})
export class OptionsSectionComponent {
    @Input() modifiedOptions: WidgetOptionCollection;
    @Input() updateOnChange: Function;
    @Input() handleChangeDatabase: Function;
    @Input() handleChangeTable: Function;
    @Input() index: number;

    public collapseOptionalOptions: boolean = true;

    public getRequiredFields(modifiedOptions: WidgetOptionCollection): string[] {
        return modifiedOptions.list().filter((option) => option.isRequired &&
            (option.optionType === 'FIELD' || option.optionType === 'FIELD_ARRAY'))
            .map((option) => option.bindingKey);
    }

    public getOptionalFields(modifiedOptions: WidgetOptionCollection): string[] {
        return modifiedOptions.list().filter((option) => !option.isRequired &&
            (option.optionType === 'FIELD' || option.optionType === 'FIELD_ARRAY'))
            .map((option) => option.bindingKey);
    }

    public getRequiredNonFields(modifiedOptions: WidgetOptionCollection): string[] {
        return modifiedOptions.list().filter((option) => option.isRequired &&
            !(option.optionType === 'FIELD' || option.optionType === 'FIELD_ARRAY'))
            .map((option) => option.bindingKey);
    }

    public getOptionalNonFields(modifiedOptions: WidgetOptionCollection): string[] {
        return modifiedOptions.list().filter((option) => !option.isRequired &&
            !(option.optionType === 'FIELD' || option.optionType === 'FIELD_ARRAY'))
            .map((option) => option.bindingKey);
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
     * Toggles the visibility of the optional options
     */
    public toggleOptionalOptions(): void {
        this.collapseOptionalOptions = !this.collapseOptionalOptions;
    }

    public optionSectionResetOptions() {
        this.collapseOptionalOptions = true;

        this.requiredList = [];
        this.requiredListNonField = [];
        this.optionalList = [];
        this.optionalListNonField = [];
    }

    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
