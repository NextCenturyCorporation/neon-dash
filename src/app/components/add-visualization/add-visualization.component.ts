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
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { AbstractWidgetService } from '../../services/abstract.widget.service';

import { NeonGridItem } from '../../model/neon-grid-item';
import { neonEvents, neonVisualizations } from '../../model/neon-namespaces';

import { eventing } from 'neon-framework';
import * as _ from 'lodash';

@Component({
    selector: 'app-add-visualization',
    templateUrl: 'add-visualization.component.html',
    styleUrls: ['add-visualization.component.scss']
})
export class AddVisualizationComponent implements OnInit {
    public chartsAndGraph: any[];
    public GridsAndTable: any[];
    public viewer: any[];
    public visualizations: any[];
    public selectedIndex: number = -1;
    public showVisualizationsShortcut: boolean = true;

    public messenger: eventing.Messenger;

    constructor(
        public snackBar: MatSnackBar,
        protected widgetService: AbstractWidgetService
    ) {
        this.messenger = new eventing.Messenger();
    }

    ngOnInit() {
        // Ignore the sample visualization.
        this.visualizations = neonVisualizations.filter((visualization) => visualization.type !== 'sample');
        this.messenger.subscribe(neonEvents.TOGGLE_VISUALIZATIONS_SHORTCUT, this.updateShowVisualizationsShortcut.bind(this));
    }

    public onItemSelected(__shiftKey: boolean, index: number) {
        if (this.selectedIndex !== -1) {
            this.visualizations[this.selectedIndex].selected = false;
        }

        this.visualizations[index].selected = true;
        this.selectedIndex = index;

        let widgetGridItem: NeonGridItem = _.cloneDeep(this.visualizations[index]);
        this.messenger.publish(neonEvents.WIDGET_ADD, {
            widgetGridItem: widgetGridItem
        });

        this.snackBar.open('Visualization Added', 'x', {
            duration: 5000,
            verticalPosition: 'top',
            panelClass: ['simpleSnackBar']
        });
    }

    publishShowVisualizationsShortcut() {
        this.showVisualizationsShortcut = !this.showVisualizationsShortcut;
        this.messenger.publish(neonEvents.TOGGLE_VISUALIZATIONS_SHORTCUT, {
            show: this.showVisualizationsShortcut
        });
    }

    updateShowVisualizationsShortcut(message) {
        this.showVisualizationsShortcut = message.show;
    }
}
