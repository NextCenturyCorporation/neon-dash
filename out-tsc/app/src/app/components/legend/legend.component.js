var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
import { Component, ViewEncapsulation, ChangeDetectionStrategy, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { ColorSchemeService } from '../../services/color-scheme.service';
/**
 * Component that will display a legend of colors.
 *
 * Provided a list of field names, the legend gets all keys/colors for that set from the
 * ColorSchemeService, and it draws it.
 */
var LegendComponent = /** @class */ (function () {
    function LegendComponent(colorSchemeService) {
        this.colorSchemeService = colorSchemeService;
        /**
         * Event triggered when an item in the legend has been selected.
         * The event includes the field name, value, and a boolean if the value is currently selected
         */
        this.itemSelected = new EventEmitter();
        this.colorSets = [];
        this.menuIcon = 'keyboard_arrow_down';
    }
    Object.defineProperty(LegendComponent.prototype, "fieldNames", {
        get: function () {
            return this._FieldNames;
        },
        set: function (names) {
            this._FieldNames = names;
            this.loadAllColorSets();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get all the color sets we need from the ColorSchemeService
     */
    LegendComponent.prototype.loadAllColorSets = function () {
        this.colorSets = [];
        if (!this.fieldNames) {
            return;
        }
        for (var _i = 0, _a = this.fieldNames; _i < _a.length; _i++) {
            var name_1 = _a[_i];
            if (name_1 && name_1 !== '') {
                var colorSet = this.colorSchemeService.getColorSet(name_1);
                if (colorSet) {
                    this.colorSets.push(colorSet);
                }
            }
        }
    };
    LegendComponent.prototype.ngOnInit = function () {
        this.loadAllColorSets();
    };
    LegendComponent.prototype.getColorFor = function (colorSet, key) {
        var color = colorSet.getColorForValue(key);
        return this.isDisabled(colorSet.name, key) ? color.getInactiveRgba() : color.toRgb();
    };
    /**
     * Handle a selection of a value in the legend
     * @param $event
     * @param {string} setName
     * @param {string} key
     */
    LegendComponent.prototype.keySelected = function ($event, setName, key) {
        this.itemSelected.emit({
            fieldName: setName,
            value: key,
            currentlyActive: !this.isDisabled(setName, key)
        });
        $event.stopPropagation();
    };
    /**
     * Check if the value should be marked as disabled
     * @param {string} key
     * @param {string} setName
     * @return {boolean}
     */
    LegendComponent.prototype.isDisabled = function (setName, key) {
        if (this.disabledSets && this.disabledSets.length > 0) {
            try {
                for (var _i = 0, _a = this.disabledSets; _i < _a.length; _i++) {
                    var set = _a[_i];
                    if (set[0] === setName && set[1] === key) {
                        return true;
                    }
                }
            }
            catch (e) {
                console.error(e);
                // Let errors pass
            }
        }
        // If the enabled list is non-null, check it
        if (this.activeList && this.activeList.length > 0) {
            return this.activeList.indexOf(key) === -1;
        }
        return this.disabledList && this.disabledList.indexOf(key) >= 0;
    };
    LegendComponent.prototype.getIcon = function (colorSet, key) {
        if (this.isDisabled(colorSet.name, key)) {
            return 'check_box_outline_blank';
        }
        else {
            return 'check_box';
        }
    };
    LegendComponent.prototype.onMenuOpen = function () {
        this.menuIcon = 'keyboard_arrow_up';
    };
    LegendComponent.prototype.onMenuClose = function () {
        this.menuIcon = 'keyboard_arrow_down';
    };
    __decorate([
        Input(),
        __metadata("design:type", Array)
    ], LegendComponent.prototype, "activeList", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Array)
    ], LegendComponent.prototype, "disabledList", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Array)
    ], LegendComponent.prototype, "disabledSets", void 0);
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], LegendComponent.prototype, "itemSelected", void 0);
    __decorate([
        ViewChild('menu'),
        __metadata("design:type", Object)
    ], LegendComponent.prototype, "menu", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Array),
        __metadata("design:paramtypes", [Array])
    ], LegendComponent.prototype, "fieldNames", null);
    LegendComponent = __decorate([
        Component({
            selector: 'app-legend',
            templateUrl: './legend.component.html',
            styleUrls: ['./legend.component.scss'],
            encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
        }),
        __metadata("design:paramtypes", [ColorSchemeService])
    ], LegendComponent);
    return LegendComponent;
}());
export { LegendComponent };
//# sourceMappingURL=legend.component.js.map