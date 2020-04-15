/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import {
    Component, OnInit, Inject, ViewChild, ComponentRef,
    ViewContainerRef, Injector, OnDestroy
} from '@angular/core';
import { ReactiveComponentLoader } from '@wishtack/reactive-component-loader';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-dynamic-dialog',
    template: '<ng-template #target></ng-template>',
    styleUrls: ['./dynamic-dialog.component.scss']
})
export class DynamicDialogComponent implements OnInit, OnDestroy {
  @ViewChild('target', { read: ViewContainerRef, static: true }) vcRef: ViewContainerRef;

  componentRef: ComponentRef<any>;

  constructor(
      private loader: ReactiveComponentLoader,
      private injector: Injector,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
      this.loader.getComponentRecipe({
          moduleId: this.data.moduleId || this.data.component,
          selector: this.data.selector || `app-${this.data.component}`
      }).subscribe((cmp) => {
          const factory = cmp.ngModuleFactory
              .create(this.injector)
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
