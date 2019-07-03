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
import { Component, ViewContainerRef, Input } from '@angular/core';

import { MatSnackBar, MatSnackBarConfig } from '@angular/material';

import { DashboardService } from '../../services/dashboard.service';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { DashboardState } from '../../models/dashboard-state';

@Component({
    selector: 'app-export-control',
    templateUrl: './export-control.component.html',
    styleUrls: ['./export-control.component.scss']
})
export class ExportControlComponent {
    @Input() exportCallbacks: (() => { name: string, data: any }[])[];

    public exportFormatList: any[] = [{
        name: 'csv',
        value: 0
    }, {
        name: 'xlsx',
        value: 1
    }];

    public exportFormat: number;
    public readonly dashboardState: DashboardState;

    constructor(
        dashboardService: DashboardService,
        protected connectionService: InjectableConnectionService,
        private matSnackBar: MatSnackBar,
        private viewContainerRef: ViewContainerRef
    ) {
        this.exportFormat = this.exportFormatList[0].value;

        // TODO Why is this needed?
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        this.handleExportClick = this.handleExportClick.bind(this);

        this.dashboardState = dashboardService.state;
    }

    setExportFormat(__value: number) {
        // Do nothing.
    }

    toggleExportFormat(event: Event) {
        event.preventDefault();
    }

    exportSuccess(queryResults) {
        let config = new MatSnackBarConfig();
        config.viewContainerRef = this.viewContainerRef;
        config.duration = 3000;
        this.matSnackBar.open('Export In Progress...', 'OK', config);
        window.location.assign('/neon/services/exportservice/generateZip/' + queryResults.data);
    }

    exportFail(response) {
        let config = new MatSnackBarConfig();
        config.viewContainerRef = this.viewContainerRef;
        if (response.responseJSON) {
            this.matSnackBar.open('Error: ' + response.responseJSON.error, 'Close', config);
        } else {
            this.matSnackBar.open('Error: The export service failed to respond properly.', 'Close', config);
        }
    }

    getExportButtonText(): string {
        return (this.exportCallbacks.length > 1) ? 'Export All Visualizations' : 'Export to File';
    }

    handleExportClick() {
        let connection = this.connectionService.connect(this.dashboardState.getDatastoreType(),
            this.dashboardState.getDatastoreHost());
        let config = new MatSnackBarConfig();
        config.viewContainerRef = this.viewContainerRef;
        let data = {
            // TODO Change this hardcoded value to something like a user ID.
            name: ((this.exportCallbacks.length > 1) ? 'All_Widgets' : 'Export'),
            data: []
        };

        if (!connection) {
            this.matSnackBar.open('Please select a dataset before exporting.', 'OK', config);
            return;
        }

        let widgetExportDataList: ({ name: string, data: any }[])[] = this.exportCallbacks.map((callback) => callback());

        for (let widgetExportData of widgetExportDataList) {
            for (let widgetExportItem of widgetExportData) {
                data.data.push(widgetExportItem.data);
            }
        }

        if (!widgetExportDataList.length) {
            this.matSnackBar.open('There are no visualizations to export.', 'OK', config);
            return;
        }
        if (data && data.data && data.data.length === 1) {
            data.name = data.data[0].name;
        }
        connection.runExportQuery(data, this.exportFormat, this.exportSuccess.bind(this), this.exportFail.bind(this));
    }
}
