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

import { DashboardService } from '../../services/dashboard.service';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { DashboardState } from '../../models/dashboard-state';

import { neonEvents } from '../../models/neon-namespaces';

import { eventing } from 'neon-framework';

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
    }];

    public exportFormat: number;
    public readonly dashboardState: DashboardState;

    private messenger: eventing.Messenger;

    constructor(
        dashboardService: DashboardService,
        protected connectionService: InjectableConnectionService,
        private viewContainerRef: ViewContainerRef
    ) {
        this.messenger = new eventing.Messenger();
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
        let link = document.createElement('a');
        let url = URL.createObjectURL(new Blob([queryResults.data], { type: 'text/plain;charset=utf-8' }));
        link.href = url;
        link.target = '_blank';
        link.download = queryResults.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    exportFail(response) {
        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            error: response,
            message: 'Export Failed'
        });
    }

    getExportButtonText(): string {
        return (this.exportCallbacks.length > 1) ? 'Export All Visualizations' : 'Export to File';
    }

    handleExportClick() {
        if (!this.dashboardState.datastores.length) {
            return;
        }

        // TODO THOR-1062 Iterate over, connect, and call runExportQuery on each datastore.
        let connection = this.connectionService.connect(this.dashboardState.datastores[0].type,
            this.dashboardState.datastores[0].host);
        let data = {
            // TODO Change this hardcoded value to something like a user ID.
            name: ((this.exportCallbacks.length > 1) ? 'All_Widgets' : 'Export'),
            data: []
        };

        if (!connection) {
            this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                message: 'Please select a dataset to export.'
            });
            return;
        }

        // TODO THOR-1062 The exportCallbacks should return the query datastore name.
        let widgetExportDataList: ({ name: string, data: any }[])[] = this.exportCallbacks.map((callback) => callback());

        for (let widgetExportData of widgetExportDataList) {
            for (let widgetExportItem of widgetExportData) {
                data.data.push(widgetExportItem.data);
            }
        }

        if (!widgetExportDataList.length) {
            this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                message: 'No visualizations to export.'
            });
            return;
        }

        /*
        If (data && data.data && data.data.length === 1) {
            data.name = data.data[0].name;
        }*/

        let exportData = data.data[0];
        let exportFormatName = this.exportFormatList[this.exportFormat].name;
        connection.runExportQuery(exportData, exportFormatName, this.exportSuccess.bind(this), this.exportFail.bind(this));
    }
}
