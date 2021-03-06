/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { Component, ComponentFactoryResolver, Input, ReflectiveInjector, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { NeonGridItem } from '../../models/neon-grid-item';
import { ReactiveComponentLoader } from '@wishtack/reactive-component-loader';
import { VisualizationType, VisualizationWidget } from '../../models/visualization-widget';

@Component({
    selector: 'app-visualization-injector',
    template: `
        <div #dynamicComponentContainer></div>`
})
export class VisualizationInjectorComponent {
    currentComponent: ComponentRef<VisualizationWidget> = null;

    @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: true }) dynamicComponentContainer: ViewContainerRef;

    // Component: Class for the component you want to create
    // inputs: An object with key/value pairs mapped to input name/input value
    @Input() set componentData(data: NeonGridItem) {
        if (!data) {
            return;
        }

        // Destroy the previously created component
        if (this.currentComponent) {
            this.currentComponent.destroy();
        }

        const moduleId = this._findModuleId(data.type);
        this._findVisualizationComponent(moduleId).subscribe((input) => {
            data.bindings = data.bindings || {};
            data.bindings._id = data.id;

            // Create an injector using an empty array since we'll just save the custom bindings on the widget's configOptions property.
            let injector = ReflectiveInjector.fromResolvedProviders(ReflectiveInjector.resolve([]),
                this.dynamicComponentContainer.parentInjector);

            // Use the ngModuleFactory from the component recipe to create the new component.
            this.currentComponent = this.dynamicComponentContainer.createComponent(input.ngModuleFactory.create(injector)
                .componentFactoryResolver.resolveComponentFactory<VisualizationWidget>(input.componentType));

            this.currentComponent.instance.configOptions = data.bindings;
            this.currentComponent.instance.visualizationType = moduleId as any as VisualizationType;
        });
    }

    constructor(private loader: ReactiveComponentLoader, private resolver: ComponentFactoryResolver) { }

    private _findModuleId(configType: string): string {
        return configType.replace(/([a-z])([A-Z])/g, (__all, left, right) => `${left}-${right.toLowerCase()}`);
    }

    private _findSelector(moduleId: string): string {
        switch (moduleId) {
            case 'text-cloud':
                return 'app-single-visualization-widget';
            default:
                return 'app-' + moduleId;
        }
    }

    private _findVisualizationComponent(moduleId: string) {
        const selector = this._findSelector(moduleId);
        return this.loader.getComponentRecipe({
            moduleId,
            selector
        });
    }

    onResizeStart() {
        if (this.currentComponent) {
            this.currentComponent.instance.onResizeStart();
        }
    }

    onResize() {
        if (this.currentComponent) {
            this.currentComponent.instance.onResize();
        }
    }

    onResizeStop() {
        if (this.currentComponent) {
            this.currentComponent.instance.onResizeStop();
        }
    }
}
