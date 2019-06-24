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
import { NeonFieldMetaData } from '../../models/types';
import { WidgetOption } from '../../models/widget-option';

@Component({
    selector: 'app-options-list',
    templateUrl: './options-list.component.html',
    styleUrls: ['./options-list.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.Default
})
export class OptionsListComponent {
    @Input() bindingsList: string[];
    @Input() fields: NeonFieldMetaData[];
    @Input() index: number;
    @Input() options: any;
    @Input() updateOnChange: Function;

    /**
     * Creates and returns a new empty field object.
     *
     * @return {NeonFieldMetaData}
     */
    public createEmptyField(): NeonFieldMetaData {
        return NeonFieldMetaData.get();
    }

    /**
     * Returns the WidgetOption at the given binding key.
     *
     * @arg {string} bindingKey
     * @return {WidgetOption}
     */
    public getOption(bindingKey: string): WidgetOption {
        return this.options.access(bindingKey);
    }
}
