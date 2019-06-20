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
import { WidgetOptionCollection } from '../../models/widget-option';
import { OptionsListModule } from '../options-list/options-list.module';

@Component({
    selector: 'app-options-section',
    templateUrl: './options-section.component.html',
    styleUrls: ['./options-section.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.Default
})
export class OptionsSectionComponent {
    @Input() modifiedOptions: WidgetOptionCollection;
    @Input() optionslist: OptionsListModule;
}
