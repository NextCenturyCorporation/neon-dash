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
import { Component, Input, ElementRef } from '@angular/core';
import 'chart.js';
var ChartComponent = /** @class */ (function () {
    function ChartComponent(elementRef) {
        this.elementRef = elementRef;
    }
    ChartComponent.prototype.ngOnInit = function () {
        this.create();
    };
    ChartComponent.prototype.ngOnChanges = function (changes) {
        var _this = this;
        if (this.chart) {
            if (changes.data) {
                var currentValue_1 = changes.data.currentValue;
                ['datasets', 'labels', 'xLabels', 'yLabels'].forEach(function (property) {
                    _this.chart.data[property] = currentValue_1[property];
                });
            }
            this.chart.update();
        }
    };
    ChartComponent.prototype.getNativeElement = function () {
        return this.elementRef.nativeElement;
    };
    ChartComponent.prototype.create = function () {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.elementRef.nativeElement.appendChild(this.canvas);
            this.chart = new Chart(this.canvas, {
                type: this.type,
                data: this.data,
                options: this.options
            });
        }
    };
    __decorate([
        Input(),
        __metadata("design:type", String)
    ], ChartComponent.prototype, "type", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], ChartComponent.prototype, "data", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], ChartComponent.prototype, "options", void 0);
    ChartComponent = __decorate([
        Component({
            selector: 'app-chart',
            template: '',
            styles: [':host { display: block; }']
        }),
        __metadata("design:paramtypes", [ElementRef])
    ], ChartComponent);
    return ChartComponent;
}());
export { ChartComponent };
//# sourceMappingURL=chart.component.js.map