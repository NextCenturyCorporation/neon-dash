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
import { Component, Input, ViewChild } from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';
var VisualizationContainerComponent = /** @class */ (function () {
    function VisualizationContainerComponent(activeGridService) {
        this.activeGridService = activeGridService;
        this.expanded = false;
        this.showToolbar = false;
    }
    VisualizationContainerComponent.prototype.ngOnInit = function () {
        // Do nothing.
    };
    VisualizationContainerComponent.prototype.close = function () {
        this.activeGridService.closeItem(this.visualization.id);
    };
    VisualizationContainerComponent.prototype.contract = function () {
        this.expanded = false;
        this.activeGridService.contractItem(this.visualization);
    };
    VisualizationContainerComponent.prototype.expand = function () {
        this.expanded = true;
        this.activeGridService.expandItem(this.visualization);
    };
    VisualizationContainerComponent.prototype.moveToTop = function () {
        this.activeGridService.moveItemToTop(this.visualization);
    };
    VisualizationContainerComponent.prototype.moveToBottom = function () {
        this.activeGridService.moveItemToBottom(this.visualization);
    };
    VisualizationContainerComponent.prototype.onResizeStart = function () {
        this.injector.onResizeStart();
    };
    VisualizationContainerComponent.prototype.onResizeStop = function () {
        this.injector.onResizeStop();
    };
    __decorate([
        ViewChild(VisualizationInjectorComponent),
        __metadata("design:type", VisualizationInjectorComponent)
    ], VisualizationContainerComponent.prototype, "injector", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], VisualizationContainerComponent.prototype, "visualization", void 0);
    VisualizationContainerComponent = __decorate([
        Component({
            selector: 'app-visualization-container',
            templateUrl: 'visualization-container.component.html',
            styleUrls: ['visualization-container.component.scss']
        }),
        __metadata("design:paramtypes", [ActiveGridService])
    ], VisualizationContainerComponent);
    return VisualizationContainerComponent;
}());
export { VisualizationContainerComponent };
//# sourceMappingURL=visualization-container.component.js.map