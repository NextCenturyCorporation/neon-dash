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
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
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
export class OptionsListComponent implements OnInit {
    /**
     * List of fields that should be colored as 'active'.
     * If this list is non-empty, all values are checked if they should be marked as active
     * from just this list.
     */
    @Input() optionsList: string[];
    @Input() layers: any[];
    @Input() fields: any[];

    @Input() handleChangeData: Function;
    @Input() handleChangeDatabase: Function;
    @Input() handleChangeLimit: Function;
    @Input() handleChangeFilterField: Function;
    @Input() handleChangeSubcomponentType: Function;
    @Input() handleChangeTable: Function;
    /**
     * Event triggered when an item in the legend has been selected.
     * The event includes the field name, value, and a boolean if the value is currently selected
     */
    @Output() itemSelected = new EventEmitter<{ fieldName: string, value: string, currentlyActive: boolean }>();

    @ViewChild('legend') legend: ElementRef;
    @ViewChild('menu') menu: ElementRef;

    public menuIcon: string;

    constructor(public widgetService: AbstractWidgetService) {
        this.menuIcon = 'keyboard_arrow_down';
    }

    checkOptionType(currentType: string, checkType) {
        if (currentType === checkType) {
            return true;
        }
        return false;
    }

    @Input() set colorKeys(colorKeys: string[]) {
        //
    }

    ngOnInit() {
        //
    }

}
