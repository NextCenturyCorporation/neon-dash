import {
    Component,
    OnInit,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    ViewChild,
    Input,
    EventEmitter,
    Output
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
     * Event triggered when an item in the legend has been selected.
     * The event includes the value selected, and a boolean if the value is currently selected
     * @type {EventEmitter<{value: string; currentlyActive: boolean}>}
     */
    @Output() itemSelected = new EventEmitter<{value: string, currentlyActive: boolean}>();

    @ViewChild('menu') menu: any;

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
        if (!this.fieldNames) {
            return;
        }
        for (let name of this.fieldNames) {
            if (name && name !== '') {
                let colorSet = this.colorSchemeService.getColorSet(name);
                if (colorSet) {
                    this.colorSets.push(colorSet);
                }
            }
        }
    }

    ngOnInit() {
        this.loadAllColorSets();
    }

    getColorFor(colorSet: ColorSet, key: string): string {
        let color = colorSet.getColorForValue(key);
        return this.isDisabled(key) ? color.getInactiveRgba() : color.toRgb();
    }

    /**
     * Handle a selection of a value in the legend
     * @param $event
     * @param {string} key
     */
    keySelected($event, key: string) {
        this.itemSelected.emit({
            value: key,
            currentlyActive: !this.isDisabled(key)
        });
        $event.stopPropagation();
    }

    /**
     * Check if the value should be marked as disabled
     * @param {string} key
     * @return {boolean}
     */
    isDisabled(key: string): boolean {
        // If the enabled list is non-null, check it first
        if (this.activeList && this.activeList.length > 0) {
            return this.activeList.indexOf(key) === -1;
        }
        return this.disabledList && this.disabledList.indexOf(key) >= 0;
    }

    getIcon(key: string): string {
        if (this.isDisabled(key)) {
            return 'check_box_outline_blank';
        } else {
            return 'check_box';
        }
    }

    onMenuOpen() {
        this.menuIcon = 'keyboard_arrow_up';
    }

    onMenuClose() {
        this.menuIcon = 'keyboard_arrow_down';
    }
}
