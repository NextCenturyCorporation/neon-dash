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
    ViewEncapsulation
} from '@angular/core';
import { WidgetOption } from '../../library/core/models/widget-option';
import { WidgetOptionCollection } from '../../models/widget-option-collection';

@Component({
    selector: 'app-options-section',
    templateUrl: './options-section.component.html',
    styleUrls: ['./options-section.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.Default
})
export class OptionsSectionComponent {
    @Input() optionCollection: WidgetOptionCollection;
    @Input() updateOnChange: Function;
    @Input() handleChangeDatabase: Function;
    @Input() handleChangeTable: Function;

    public collapseOptionalOptions: boolean = true;

    /**
     * Removes option from display list. (must manually display options that are removed)
     *
     * @param {WidgetOption[]}
     * @returns {WidgetOption[]}
     */
    private removeOptionsFromList(optList: WidgetOption[]): WidgetOption[] {
        let optionList: WidgetOption[] = optList;
        optionList = this.removeOptions(optionList, 'bindingKey', 'title');
        optionList = this.removeOptions(optionList, 'hideFromMenu', true);
        optionList = this.removeOptions(optionList, 'bindingKey', 'limit');
        optionList = this.removeOptions(optionList, 'optionType', 'DATABASE');
        optionList = this.removeOptions(optionList, 'optionType', 'TABLE');
        return optionList;
    }

    public getRequiredFields(optionCollection: WidgetOptionCollection): string[] {
        let requiredList: WidgetOption[] = optionCollection.list();
        requiredList = this.removeOptionsFromList(requiredList);
        return requiredList.filter((option) => option.isRequired &&
            (option['optionType'] === 'FIELD' || option['optionType'] === 'FIELD_ARRAY'))
            .map((option) => option.bindingKey);
    }

    public getOptionalFields(optionCollection: WidgetOptionCollection): string[] {
        let optionalList: WidgetOption[] = optionCollection.list();
        optionalList = this.removeOptionsFromList(optionalList);
        return optionalList.filter((option) => !option.isRequired &&
            (option.optionType === 'FIELD' || option.optionType === 'FIELD_ARRAY'))
            .map((option) => option.bindingKey);
    }

    public getRequiredNonFields(optionCollection: WidgetOptionCollection): string[] {
        let requiredNonList: WidgetOption[] = optionCollection.list();
        requiredNonList = this.removeOptionsFromList(requiredNonList);
        return requiredNonList.filter((option) => option.isRequired &&
            !(option.optionType === 'FIELD' || option.optionType === 'FIELD_ARRAY'))
            .map((option) => option.bindingKey);
    }

    public getOptionalNonFields(optionCollection: WidgetOptionCollection): string[] {
        let optionalNonList: WidgetOption[] = optionCollection.list();
        optionalNonList = this.removeOptionsFromList(optionalNonList);
        return optionalNonList.filter((option) => !option.isRequired &&
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

    private removeOptions(list: any[], property: string, compareValue: boolean | string): any[] {
        return list.filter((optionObject) => optionObject[property] !== compareValue);
    }

    /**
     * Toggles the visibility of the optional options
     */
    public toggleOptionalOptions(): void {
        this.collapseOptionalOptions = !this.collapseOptionalOptions;
    }

    public optionSectionResetOptions() {
        this.collapseOptionalOptions = true;
    }
}
