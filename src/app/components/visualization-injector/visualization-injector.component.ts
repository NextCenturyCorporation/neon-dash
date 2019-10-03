/**
 * Copyright 2019 Next Century Corporation
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
import { Component, Input, ReflectiveInjector, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { NeonGridItem } from '../../models/neon-grid-item';
import { ReactiveComponentLoader } from '@wishtack/reactive-component-loader';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';

@Component({
    selector: 'app-visualization-injector',
    template: `
        <div #dynamicComponentContainer></div>`
})
export class VisualizationInjectorComponent {
    currentComponent: ComponentRef<BaseNeonComponent> = null;

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

        this.findVisualizationComponent(data.type).subscribe((input) => {
            data.bindings = data.bindings || {};
            data.bindings._id = data.id;

            // Inputs need to be in the following format to be resolved properly
            let inputProviders = Object.keys(data.bindings).map((bindingKey) => ({
                provide: bindingKey,
                useValue: data.bindings[bindingKey]
            }));
            let resolvedInputs = ReflectiveInjector.resolve(inputProviders);

            // We create an injector out of the data we want to pass down and this components injector
            let injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.dynamicComponentContainer.parentInjector);

            // We create the component using the factory and the injector
            this.currentComponent = input.ngModuleFactory.create(injector).componentFactoryResolver
                .resolveComponentFactory<BaseNeonComponent>(input.componentType)
                .create(injector);

            // We insert the component into the dom container
            this.dynamicComponentContainer.insert(this.currentComponent.hostView);
        });
    }

    constructor(private loader: ReactiveComponentLoader) { }

    findVisualizationComponent(type: string) {
        const id = type.replace(/([a-z])([A-Z])/g, (__all, left, right) => `${left}-${right.toLowerCase()}`);
        return this.loader.getComponentRecipe({
            moduleId: id,
            selector: `app-${id}`
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
