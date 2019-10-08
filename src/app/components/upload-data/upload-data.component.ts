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

import {
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    ViewEncapsulation,
    Input
} from '@angular/core';

import { MatSidenav } from '@angular/material';

import { DashboardService } from '../../services/dashboard.service';
import { OptionType } from '../../library/core/models/config-option';
import { RootWidgetOptionCollection, WidgetOptionCollection, ConfigurableWidget } from '../../models/widget-option-collection';

import { neonEvents } from '../../models/neon-namespaces';
import { eventing } from 'neon-framework';
import { DashboardState } from '../../models/dashboard-state';
import * as _ from 'lodash';

import * as Papa from 'papaparse';

@Component({
    selector: 'app-upload-data',
    templateUrl: './upload-data.component.html',
    styleUrls: ['./upload-data.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated
})
export class UploadDataComponent implements OnDestroy {
    @Input() comp: ConfigurableWidget;
    @Input() sideNavRight: MatSidenav;

    private messenger: eventing.Messenger;

    public readonly dashboardState: DashboardState;
    constructor(
        private changeDetection: ChangeDetectorRef,
        dashboardService: DashboardService
    ) {
        this.messenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    public changeListener() {
        //console.log(files);
        let file = (<HTMLInputElement>document.getElementById('fileInput')).files[0];
        // console.log(file.name);
        // console.log(file.size);
        // console.log(file.type);
        let reader: FileReader = new FileReader();
        reader.readAsText(file);
        reader.onload = (e) => {
            let csv: string = reader.result as string;
            // console.log(csv);
            Papa.parse(file, {
                complete: function (results) {
                    // console.log("Finished:", results.data);
                    // console.log(results);
                }
            });
        }
    }

}
