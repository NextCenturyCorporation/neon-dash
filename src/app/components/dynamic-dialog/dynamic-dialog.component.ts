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
  Component, OnInit, Inject, ViewChild, ComponentRef,
  ViewContainerRef, Injector, OnDestroy, ReflectiveInjector
} from '@angular/core';
import { ReactiveComponentLoader } from '@wishtack/reactive-component-loader';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-dynamic-dialog',
  template: '<ng-template #target></ng-template>',
  styleUrls: ['./dynamic-dialog.component.scss']
})
export class DynamicDialogComponent implements OnInit, OnDestroy {

  @ViewChild('target', { read: ViewContainerRef }) vcRef: ViewContainerRef;

  componentRef: ComponentRef<any>;

  constructor(
    private loader: ReactiveComponentLoader,
    private injector: Injector,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.loader.getComponentRecipe({
      moduleId: this.data.moduleId,
      selector: this.data.selector
    }).subscribe((cmp) => {

      // Inputs need to be in the following format to be resolved properly
      let inputProviders = Object.keys(this.data).map((bindingKey) => {
        return {
          provide: bindingKey,
          useValue: this.data[bindingKey]
        };
      });

      let resolvedInputs = ReflectiveInjector.resolve(inputProviders);

      // We create an injector out of the data we want to pass down and this components injector
      let injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.injector);

      const factory = cmp.ngModuleFactory
        .create(injector)
        .componentFactoryResolver
        .resolveComponentFactory(cmp.componentType);

      this.componentRef = this.vcRef.createComponent(factory);
    });
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
}
