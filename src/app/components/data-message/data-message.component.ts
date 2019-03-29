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
import { ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { MatDialogRef, MatSnackBar } from '@angular/material';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { neonEvents, neonVisualizations } from '../../neon-namespaces';

import * as neon from 'neon-framework';
import * as _ from 'lodash';

@Component({
    selector: 'app-data-message',
    templateUrl: 'data-message.component.html',
    styleUrls: ['data-message.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated
})
export class DataMessageComponent implements OnInit {
    @Input() visualizationName: string;
    public chartsAndGraph: any[];
    public visualizations: any[];
    public currentVisualization: any;

    public messenger: neon.eventing.Messenger;

    constructor(
        private changeDetection: ChangeDetectorRef,
        public snackBar: MatSnackBar,
        protected widgetService: AbstractWidgetService
    ) {
    }

    ngOnInit() {
        this.currentVisualization = neonVisualizations.filter((visualization) => {
            return visualization.name === this.visualizationName;
        });
        this.changeDetection.detectChanges();
    }

    getIconPath() {
        return './assets/icons/' + this.currentVisualization[0].icon + '.svg';
    }
}
