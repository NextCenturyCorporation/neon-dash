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
    ChangeDetectionStrategy,
    Component,
    Input,
    ViewEncapsulation
} from '@angular/core';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { WidgetFieldOption, WidgetOption, WidgetOptionCollection } from '../../widget-option';

@Component({
    selector: 'app-options-list',
    templateUrl: './options-list.component.html',
    styleUrls: ['./options-list.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.Default
})
export class OptionsListComponent {
    @Input() optionsList: any[];
    @Input() index: number;
    @Input() databases: any[];
    @Input() fields: any[];
    @Input() tables: any[];

    @Input() handleChangeData: Function;
    @Input() handleChangeDatabase: Function;
    @Input() handleChangeLimit: Function;
    @Input() handleChangeFilterField: Function;
    @Input() handleChangeSubcomponentType: Function;
    @Input() handleChangeTable: Function;
    @Input() handleDataChange: Function;

    isLayer: boolean = false;
    newList: any[];
    constructor(public widgetService: AbstractWidgetService) {
        this.newList = [];
    }

    checkOptionType(currentType: string, checkType) {
        if (currentType === checkType) {
            return true;
        }
        return false;
    }

    handleListDataChange(widgetOption, newValue) {
        if (this.index) {
            this.handleDataChange(widgetOption, newValue, this.index);
        } else {
            this.handleDataChange(widgetOption, newValue, this.index);
        }
    }

}
