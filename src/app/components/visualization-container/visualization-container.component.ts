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
import { Component, Input, OnInit, ViewChild } from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { NeonGridItem } from '../../neon-grid-item';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';

@Component({
  selector: 'app-visualization-container',
  templateUrl: 'visualization-container.component.html',
  styleUrls: ['visualization-container.component.scss']
})
export class VisualizationContainerComponent implements OnInit {
    @ViewChild(VisualizationInjectorComponent) injector: VisualizationInjectorComponent;

    public expanded: boolean;
    public showToolbar: boolean;

    @Input() visualization: NeonGridItem;

    constructor(private activeGridService: ActiveGridService) {
        this.expanded = false;
        this.showToolbar = false;
    }

    ngOnInit() {
        // Do nothing.
    }

    close() {
        this.activeGridService.closeItem(this.visualization.id);
    }

    contract() {
        this.onResizeStart();
        this.expanded = false;
        this.activeGridService.contractItem(this.visualization);
        setTimeout(() => {
            this.onResizeStop();
        }, 300);
    }

    expand() {
        this.onResizeStart();
        this.expanded = true;
        this.activeGridService.expandItem(this.visualization);
        setTimeout(() => {
            this.onResizeStop();
        }, 300);

    }

    moveToTop() {
        this.activeGridService.moveItemToTop(this.visualization);
    }

    moveToBottom() {
        this.activeGridService.moveItemToBottom(this.visualization);
    }

    onResizeStart() {
        this.injector.onResizeStart();
    }

    onResizeStop() {
        this.injector.onResizeStop();
    }
}
