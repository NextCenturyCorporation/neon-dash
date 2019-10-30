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
    Injector,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    Input
} from '@angular/core';

import { MatSidenav } from '@angular/material';

import { DashboardService } from '../../services/dashboard.service';
import { Dataset, DatasetUtil, FieldConfig, TableConfig, DatabaseConfig } from '../../library/core/models/dataset';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
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
export class UploadDataComponent implements OnInit, OnDestroy {
    @Input() comp: ConfigurableWidget;
    @Input() sideNavRight: MatSidenav;

    protected dataset: Dataset;
    private messenger: eventing.Messenger;
    public uploadedData = {};
    public database: DatabaseConfig = null;
    public table: TableConfig = null;

    public readonly dashboardState: DashboardState;
    constructor(
        private changeDetection: ChangeDetectorRef,
        dashboardService: DashboardService,
        protected connectionService: InjectableConnectionService
    ) {
        this.messenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
        this.dataset = this.dashboardState.asDataset();
        dashboardService.stateSource.subscribe((dashboardState) => {
            this.dataset = dashboardState.asDataset();
        });
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    ngOnInit() {
        this.changeDetection.detectChanges();
    }

    public changeListener() {
        // Console.log(this.dataset);
        let file = (<HTMLInputElement>document.getElementById('fileInput')).files[0];
        // Console.log(file.name);
        // console.log(file.size);
        // console.log(file.type);
        let reader: FileReader = new FileReader();
        reader.readAsText(file);
        reader.onload = (e) => {
            let csv: string = reader.result as string;
            // Console.log(csv);
            Papa.parse(file, { header: true,
                complete: function(results) {
                    // Console.log("Finished:", results.data);
                    // console.log(results);
                    this.uploadedData = results.data;
                    // Console.log(this.uploadedData);
                } });
        };
        this.uploadToDatabase();
        this.changeDetection.detectChanges();
    }

    updateDatabase(DatabaseConfig) {
        this.database = DatabaseConfig;
    }

    uploadToDatabase() {
        let connection = this.connectionService.connect(this.dashboardState.getDatastoreType(),
            this.dashboardState.getDatastoreHost());
        // Console.log('upload to database');
        // console.log(this.dataset);
        // console.log(this.dataset.datastores.es1.databases.somali092019.name);
        // console.log(this.dataset.datastores.es1.databases.somali092019.tables.ui_output.name);
        // TODO: Get rid of hardcoded database and table.
        connection.runUploadData(this.dataset.datastores, this.dataset.datastores.es1.databases.somali092019.name,
            this.dataset.datastores.es1.databases.somali092019.tables.ui_output.name,
            this.uploadedData,
            this.uploadSuccess.bind(this), this.uploadFail.bind(this));
    }

    uploadSuccess(queryResults) {
        let link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(queryResults.data);
        link.target = '_blank';
        link.download = queryResults.fileName;
        link.click();
        link.remove();
    }

    uploadFail(response) {
        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            error: response,
            message: 'Upload Failed'
        });
    }
}
