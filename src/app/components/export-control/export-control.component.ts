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
import { Component, OnInit, ViewContainerRef, Input } from '@angular/core';

import { MatDialog, MatDialogRef, MatSnackBar, MatSnackBarConfig } from '@angular/material';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ParameterService } from '../../services/parameter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ConfigEditorComponent } from '../config-editor/config-editor.component';

import { neonEvents } from '../../neon-namespaces';

import * as neon from 'neon-framework';

@Component({
  selector: 'app-export-control',
  templateUrl: './export-control.component.html',
  styleUrls: ['./export-control.component.scss']
})
export class ExportControlComponent {
    @Input() widgets: BaseNeonComponent | Map<string, BaseNeonComponent>;

    public exportFormatList: any[] = [{
        name: 'csv',
        value: 0
    }, {
        name: 'xlsx',
        value: 1
    }];

    public exportFormat: number = this.exportFormatList[0].value;

    constructor(
        protected connectionService: ConnectionService,
        protected datasetService: DatasetService,
        private matSnackBar: MatSnackBar,
        private viewContainerRef: ViewContainerRef
    ) {
        this.handleExportClick = this.handleExportClick.bind(this);
    }

    setExportFormat(value: number) {
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
        return (this.widgets instanceof Map) ? 'Export All Visualizations' : 'Export to File';
    }

    handleExportClick() {
        let connection: neon.query.Connection = this.connectionService.createActiveConnection(this.datasetService.getDatastoreType(),
            this.datasetService.getDatastoreHost());
        let config = new MatSnackBarConfig();
        config.viewContainerRef = this.viewContainerRef;
        let data = {
            // TODO Change this hardcoded value to something like a user ID.
            name: ((this.widgets instanceof Map) ? 'All_Widgets' : 'Export'),
            data: []
        };

        if (!connection) {
            this.matSnackBar.open('Please select a dataset before exporting.', 'OK', config);
            return;
        }

        let widgetExportDataList: ({ name: string, data: any }[])[] = ((this.widgets instanceof Map) ? Array.from(this.widgets.values()) :
            [this.widgets]).map((widget) => widget.createExportData());

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
        connection.executeExport(data, this.exportSuccess.bind(this), this.exportFail.bind(this), this.exportFormat);
    }
}
