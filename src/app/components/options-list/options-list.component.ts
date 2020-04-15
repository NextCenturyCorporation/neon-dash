/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { ConfigOption, FieldConfig } from '@caci-critical-insight-solutions/nucleus-core';
import { WidgetOptionCollection } from '../../models/widget-option-collection';

@Component({
    selector: 'app-options-list',
    templateUrl: './options-list.component.html',
    styleUrls: ['./options-list.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.Default
})
export class OptionsListComponent {
    @Input() bindingsList: string[];
    @Input() fields: FieldConfig[];
    @Input() options: WidgetOptionCollection;
    @Input() updateOnChange: Function;

    /**
     * Creates and returns a new empty field object.
     *
     * @return {FieldConfig}
     */
    public createEmptyField(): FieldConfig {
        return FieldConfig.get();
    }

    /**
     * Returns the ConfigOption at the given binding key.
     *
     * @arg {string} bindingKey
     * @return {ConfigOption}
     */
    public getOption(bindingKey: string): ConfigOption {
        return this.options.access(bindingKey);
    }

    /**
     * Trys the string of prettyName as a function
     */
    public getPrettyName(pretty: string) {
        let name: string;
        try {
            // Careful as eval evaluates the string as a function if the pretty names ever become
            // user input this could lead to some very dangerous XSS
            // eslint-disable-next-line no-eval
            name = eval(pretty);
        } catch {
            name = pretty;
        }
        return name;
    }
}
