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
import { Component, Input, OnInit, ViewChild, HostBinding } from '@angular/core';

import { eventing } from 'neon-framework';

import { NeonGridItem } from '../../models/neon-grid-item';
import { neonEvents } from '../../models/neon-namespaces';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';

@Component({
    selector: 'app-visualization-container',
    templateUrl: 'visualization-container.component.html',
    styleUrls: ['visualization-container.component.scss']
})
export class VisualizationContainerComponent implements OnInit {
    @ViewChild(VisualizationInjectorComponent, { static: true }) injector: VisualizationInjectorComponent;

    public expanded: boolean;
    public showToolbar: boolean;
    public showDragging: boolean;

    @Input() visualization: NeonGridItem;

    @HostBinding('class.moving') @Input() moving: boolean;

    private messenger: any;

    constructor() {
        this.messenger = new eventing.Messenger();
        this.expanded = false;
        this.showToolbar = false;
    }

    ngOnInit() {
        // Do nothing.
    }

    close() {
        this.messenger.publish(neonEvents.WIDGET_DELETE, {
            id: this.visualization.id
        });
    }

    openSettings() {
        this.messenger.publish(neonEvents.SHOW_OPTION_MENU, this.visualization);
    }

    contract() {
        this.onResizeStart();
        this.expanded = false;
        this.messenger.publish(neonEvents.WIDGET_CONTRACT, {
            widgetGridItem: this.visualization
        });
        setTimeout(() => {
            this.onResizeStop();
        }, 300);
    }

    expand() {
        this.onResizeStart();
        this.expanded = true;
        this.messenger.publish(neonEvents.WIDGET_EXPAND, {
            widgetGridItem: this.visualization
        });
        setTimeout(() => {
            this.onResizeStop();
        }, 300);
    }

    moveToTop() {
        this.messenger.publish(neonEvents.WIDGET_MOVE_TO_TOP, {
            widgetGridItem: this.visualization
        });
    }

    moveToBottom() {
        this.messenger.publish(neonEvents.WIDGET_MOVE_TO_BOTTOM, {
            widgetGridItem: this.visualization
        });
    }

    onResizeStart() {
        this.injector.onResizeStart();
    }

    onResize() {
        this.injector.onResize();
    }

    onResizeStop() {
        this.onResize();
        this.injector.onResizeStop();
    }
}
