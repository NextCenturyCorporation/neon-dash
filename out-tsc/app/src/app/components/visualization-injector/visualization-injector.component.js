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
import { Component, Input, ViewContainerRef, ViewChild, ReflectiveInjector, ComponentFactoryResolver } from '@angular/core';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { FilterBuilderComponent } from '../filter-builder/filter-builder.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { MapComponent } from '../map/map.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';
import { StackedTimelineComponent } from '../stacked-timeline/stacked-timeline.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { WikiViewerComponent } from '../wiki-viewer/wiki-viewer.component';
import { VisualizationService } from '../../services/visualization.service';
var VisualizationInjectorComponent = /** @class */ (function () {
    function VisualizationInjectorComponent(resolver, visualizationService) {
        this.resolver = resolver;
        this.visualizationService = visualizationService;
        this.currentComponent = null;
    }
    Object.defineProperty(VisualizationInjectorComponent.prototype, "componentData", {
        // component: Class for the component you want to create
        // inputs: An object with key/value pairs mapped to input name/input value
        set: function (data) {
            if (!data) {
                return;
            }
            // Inputs need to be in the following format to be resolved properly
            var inputProviders = Object.keys(data.bindings ? data.bindings : {}).map(function (bindingName) {
                return { provide: bindingName, useValue: data.bindings[bindingName] };
            });
            var resolvedInputs = ReflectiveInjector.resolve(inputProviders);
            // We create an injector out of the data we want to pass down and this components injector
            var injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.dynamicComponentContainer.parentInjector);
            var vizComponent = this.getComponent(data.type);
            // Destroy the previously created component
            if (this.currentComponent) {
                this.currentComponent.destroy();
            }
            if (vizComponent) {
                // We create a factory out of the component we want to create
                var factory = this.resolver.resolveComponentFactory(vizComponent);
                // We create the component using the factory and the injector
                var component = factory.create(injector);
                // We insert the component into the dom container
                this.dynamicComponentContainer.insert(component.hostView);
                this.currentComponent = component;
                // Try and get the ID of the child component
                var c = component;
                if (c._component && c._component.id) {
                    var id = c._component.id;
                    this.visualizationService.registerGridData(id, data);
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    VisualizationInjectorComponent.prototype.getComponent = function (type) {
        switch (type) {
            case 'barChart': return BarChartComponent;
            case 'dataTable': return DataTableComponent;
            case 'documentViewer': return DocumentViewerComponent;
            case 'filterBuilder': return FilterBuilderComponent;
            case 'lineChart': return LineChartComponent;
            case 'map': return MapComponent;
            case 'scatterPlot': return ScatterPlotComponent;
            case 'stackedTimeline': return StackedTimelineComponent;
            case 'textCloud': return TextCloudComponent;
            case 'timeline': return TimelineComponent;
            case 'wikiViewer': return WikiViewerComponent;
            default: return null;
        }
    };
    VisualizationInjectorComponent.prototype.onResizeStart = function () {
        if (this.currentComponent) {
            this.currentComponent.instance.onResizeStart();
        }
    };
    VisualizationInjectorComponent.prototype.onResizeStop = function () {
        if (this.currentComponent) {
            this.currentComponent.instance.onResizeStop();
        }
    };
    __decorate([
        ViewChild('dynamicComponentContainer', { read: ViewContainerRef }),
        __metadata("design:type", ViewContainerRef)
    ], VisualizationInjectorComponent.prototype, "dynamicComponentContainer", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [Object])
    ], VisualizationInjectorComponent.prototype, "componentData", null);
    VisualizationInjectorComponent = __decorate([
        Component({
            selector: 'app-visualization-injector',
            entryComponents: [BarChartComponent, DataTableComponent, DocumentViewerComponent, FilterBuilderComponent, LineChartComponent,
                MapComponent, ScatterPlotComponent, StackedTimelineComponent, TextCloudComponent, TimelineComponent, WikiViewerComponent],
            template: "<div #dynamicComponentContainer></div>"
        }),
        __metadata("design:paramtypes", [ComponentFactoryResolver, VisualizationService])
    ], VisualizationInjectorComponent);
    return VisualizationInjectorComponent;
}());
export { VisualizationInjectorComponent };
//# sourceMappingURL=visualization-injector.component.js.map