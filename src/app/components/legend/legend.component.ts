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
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { ColorSchemeService, ColorSet } from '../../services/color-scheme.service';

/**
 * Component that will display a legend of colors.
 *
 * Provided a list of field names, the legend gets all keys/colors for that set from the
 * ColorSchemeService, and it draws it.
 */
@Component({
    selector: 'app-legend',
    templateUrl: './legend.component.html',
    styleUrls: ['./legend.component.scss'],
    encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
})
export class LegendComponent implements OnInit {
    /**
     * List of fields that should be colored as 'active'.
     * If this list is non-empty, all values are checked if they should be marked as active
     * from just this list.
     */
    @Input() activeList: string[];
    /**
     * List of fields that should be colored as 'inactive'
     * If the active list is empty, any values in this list will be marked as inactive
     */
    @Input() disabledList: string[];
    /**
     * List of [columnName, value] pairs that should be marked as inactive.
     * If this list is populated, it will be used over the disabledList
     */
    @Input() disabledSets: [string[]];

    /**
     * Switch for adding or removing filtering capability for the legend
     */
    @Input() filteringOn: boolean = true;
    /**
     * Event triggered when an item in the legend has been selected.
     * The event includes the field name, value, and a boolean if the value is currently selected
     */
    @Output() itemSelected = new EventEmitter<{fieldName: string, value: string, currentlyActive: boolean}>();

    @ViewChild('menu') menu: ElementRef;

    public menuIcon: string;
    public colorSets: ColorSet[] = [];
    private _FieldNames: string[];

    constructor(private colorSchemeService: ColorSchemeService) {
        this.menuIcon = 'keyboard_arrow_down';
    }

    @Input() set fieldNames(names: string[]) {
        this._FieldNames = names;
        this.loadAllColorSets();
    }
    get fieldNames(): string[] {
        return this._FieldNames;
    }

    /**
     * Get all the color sets we need from the ColorSchemeService
     */
    private loadAllColorSets() {
        this.colorSets = [];
        for (let name of (this.fieldNames || [])) {
            let colorSet = this.colorSchemeService.getColorSet(name || '');
            if (colorSet) {
                this.colorSets.push(colorSet);
            }
        }
    }

    ngOnInit() {
        this.loadAllColorSets();
    }

    getColorFor(colorSet: ColorSet, key: string): string {
        let color = colorSet.getColorForValue(key);
        return color.toRgb();
    }

    /**
     * Handle a selection of a value in the legend
     * @param $event
     * @param {string} setName
     * @param {string} key
     */
    keySelected($event, setName: string, key: string) {
        this.itemSelected.emit({
            fieldName: setName,
            value: key,
            currentlyActive: !this.isDisabled(setName, key)
        });
        this.stopPropagation($event);

    }

    /**
     * Check if the value should be marked as disabled
     * @param {string} key
     * @param {string} setName
     * @return {boolean}
     */
    isDisabled(setName: string, key: string): boolean {
        if (this.disabledSets && this.disabledSets.length > 0) {
            try {
                for (let set of this.disabledSets) {
                    if (set[0] === setName && set[1] === key) {
                        return true;
                    }
                }
            } catch (e) {
                console.error(e);
                // Let errors pass
            }
        }
        // If the enabled list is non-null, check it
        if (this.activeList && this.activeList.length > 0) {
            return this.activeList.indexOf(key) === -1;
        }
        return this.disabledList && this.disabledList.indexOf(key) >= 0;
    }

    getIcon(setName: string, key: string): string {
        if (!this.filteringOn) {
            return 'stop';
        } else if (this.isDisabled(setName, key)) {
            return 'check_box_outline_blank';
        } else {
            return 'check_box';
        }
    }

    getTextDecoration(setName: string, key: string): string {
        if (this.isDisabled(setName, key)) {
            return 'line-through';
        } else {
            return '';
        }
    }

    onMenuOpen() {
        this.menuIcon = 'keyboard_arrow_up';
    }

    onMenuClose() {
        this.menuIcon = 'keyboard_arrow_down';
    }

    stopPropagation($event) {
        $event.stopPropagation();
    }
}
