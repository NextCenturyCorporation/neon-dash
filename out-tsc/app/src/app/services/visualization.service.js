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
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
/**
 * This provides an Angular service for registering and unregistering visualizations on a page.
 *
 * @class neonDemo.services.VisualizationService
 * @constructor
 */
var VisualizationService = /** @class */ (function () {
    function VisualizationService() {
        this.widgets = [];
    }
    /**
     * Registers a function to this service, so that it can be executed as part of a bulk operation. Should be called by visualization
     * widgets upon being created.
     * @param {String} visualizationId The unique id for the visualization.
     * @param {Function} bundleFunction The function to register.
     */
    VisualizationService.prototype.registerBindings = function (visualizationId, component) {
        var widget = _.find(this.widgets, function (item) {
            return item.id === visualizationId;
        });
        // If the widget was found, add the binding function
        if (widget) {
            widget.component = component;
        }
        else {
            this.widgets.push({
                id: visualizationId,
                gridData: null,
                component: component
            });
        }
    };
    /**
     * Register the grid data for a visualization
     * @param {string} visualizationId
     * @param {NeonGridItem} gridData
     */
    VisualizationService.prototype.registerGridData = function (visualizationId, gridData) {
        var widget = _.find(this.widgets, function (item) {
            return item.id === visualizationId;
        });
        // If the widget was found, add the binding function
        if (widget) {
            widget.gridData = gridData;
        }
        else {
            this.widgets.push({
                id: visualizationId,
                gridData: gridData,
                component: null
            });
        }
    };
    /**
     * Unregisters a function with the given ID from this service. Should be called by visualization widgets upon being destroyed.
     * @param {String} visualizationId The unique ID of the function being unregistered.
     */
    VisualizationService.prototype.unregister = function (visualizationId) {
        var index = _.findIndex(this.widgets, {
            id: visualizationId
        });
        if (index >= 0) {
            this.widgets.splice(index, 1);
        }
    };
    /**
     * Returns a list of all objects currently registered to this service, so the functions they have references to can
     * be used for bulk operations.
     * @return {Array} The list of objects subscribed to this service.
     */
    VisualizationService.prototype.getWidgets = function () {
        var widgetList = [];
        // Build the list of widgets
        for (var _i = 0, _a = this.widgets; _i < _a.length; _i++) {
            var item = _a[_i];
            // Clone everything
            var gridItem = _.cloneDeep(item.gridData);
            // Move the row/col/sizes up to the root
            var gridItemConfig = gridItem.gridItemConfig;
            gridItem.sizex = gridItemConfig.sizex;
            gridItem.sizey = gridItemConfig.sizey;
            gridItem.row = gridItemConfig.row;
            gridItem.col = gridItemConfig.col;
            // Re-build the bindings
            gridItem.bindings = item.component.getBindings();
            widgetList.push(gridItem);
        }
        return widgetList;
    };
    VisualizationService = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [])
    ], VisualizationService);
    return VisualizationService;
}());
export { VisualizationService };
//# sourceMappingURL=visualization.service.js.map