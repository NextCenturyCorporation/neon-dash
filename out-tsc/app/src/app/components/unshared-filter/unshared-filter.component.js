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
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FieldMetaData } from '../../dataset';
/**
 * Component for managing the unshared filter of a visualization.
 * You must bind the 'meta' field from the BaseNeonComponent to the 'meta' field in this component.
 *
 * You can bind to the different outputs to update the visualization if the filter changes.
 *
 * This can only be used within components that extend BaseNeonComponent, and will not handle layers.
 */
var UnsharedFilterComponent = /** @class */ (function () {
    function UnsharedFilterComponent() {
        /**
         * Triggered when the filter field has changed.
         * @type {EventEmitter<FieldMetaData>}
         */
        this.unsharedFilterFieldChanged = new EventEmitter();
        /**
         * Triggered when the filter has been cleared
         * @type {EventEmitter<void>}
         */
        this.unsharedFilterRemoved = new EventEmitter();
        /**
         * Triggered when the filter value has changed
         * @type {EventEmitter<string>}
         */
        this.unsharedFilterValueChanged = new EventEmitter();
        /**
         * Triggered when either the filter's field or value has changed.
         * Either bind to this, or to the filter/value change events. Both events will be triggered either way.
         * @type {EventEmitter<void>}
         */
        this.unsharedFilterChanged = new EventEmitter();
    }
    UnsharedFilterComponent.prototype.handleChangeUnsharedFilterField = function () {
        this.unsharedFilterFieldChanged.emit(this.meta.unsharedFilterField);
        this.unsharedFilterChanged.emit();
    };
    UnsharedFilterComponent.prototype.handleRemoveUnsharedFilter = function () {
        this.meta.unsharedFilterValue = null;
        this.meta.unsharedFilterField = new FieldMetaData();
        this.unsharedFilterRemoved.emit();
    };
    UnsharedFilterComponent.prototype.handleChangeUnsharedFilterValue = function () {
        this.unsharedFilterValueChanged.emit(this.meta.unsharedFilterValue);
        this.unsharedFilterChanged.emit();
    };
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], UnsharedFilterComponent.prototype, "meta", void 0);
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], UnsharedFilterComponent.prototype, "unsharedFilterFieldChanged", void 0);
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], UnsharedFilterComponent.prototype, "unsharedFilterRemoved", void 0);
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], UnsharedFilterComponent.prototype, "unsharedFilterValueChanged", void 0);
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], UnsharedFilterComponent.prototype, "unsharedFilterChanged", void 0);
    UnsharedFilterComponent = __decorate([
        Component({
            selector: 'app-unshared-filter',
            templateUrl: './unshared-filter.component.html',
            styleUrls: ['./unshared-filter.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        })
    ], UnsharedFilterComponent);
    return UnsharedFilterComponent;
}());
export { UnsharedFilterComponent };
//# sourceMappingURL=unshared-filter.component.js.map