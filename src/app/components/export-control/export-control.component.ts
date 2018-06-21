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
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ParameterService } from '../../services/parameter.service';
import { ThemesService } from '../../services/themes.service';

import { ConfigEditorComponent } from '../config-editor/config-editor.component';

import * as _ from 'lodash';
import * as neon from 'neon-framework';

@Component({
  selector: 'app-export-control',
  templateUrl: './export-control.component.html',
  styleUrls: ['./export-control.component.scss']
})
export class ExportControlComponent implements OnInit {
    @Input() exportTarget: string;
    @Input() hideFormats: boolean;
    @Input() exportId: number;
    @Input() buttonTextOverride: string;
    public exportFormat: number;

    public buttonText: string;

    constructor(private connectionService: ConnectionService,
        private errorNotificationService: ErrorNotificationService,
        public exportService: ExportService,
        private matSnackBar: MatSnackBar,
        public themesService: ThemesService,
        private viewContainerRef: ViewContainerRef) {
        this.handleExportClick = this.handleExportClick.bind(this);
        this.exportFormat = 0;
    }

    ngOnInit() {
        this.exportFormat = this.exportService.getFileFormats()[0].value;
        this.buttonText = (this.exportTarget === 'all' ? ' Export All Visualizations ' : 'Export to File');
        if (this.buttonTextOverride) {
          this.buttonText = this.buttonTextOverride;
        }
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

    handleExportClick() {
        let exportAll = this.exportTarget === 'all';
        this.export(exportAll);

    }

    export(exportAll: boolean) {
        this.exportService.setFileFormat(this.exportFormat);
        let connection: neon.query.Connection = this.connectionService.getActiveConnection();
        let config = new MatSnackBarConfig();
        config.viewContainerRef = this.viewContainerRef;
        let data = {
            // TODO Change this hardcoded value to something like a user ID.
            name: (exportAll ? 'All_Widgets' : 'Export'),
            data: []
        };

        if (!connection) {
            this.matSnackBar.open('Please select a dataset before exporting.', 'OK', config);
            return;
        }

        let localExportId = this.exportId;
        let widgetObjects = this.exportService.getWidgets()
          .filter((widget) => {
              return exportAll || widget.id === localExportId;
          })
          .map((widget) => widget.callback());
        for (let widgetObject of widgetObjects) {
            if (Array.isArray(widgetObject)) {
                for (let widgetObjectIndx of widgetObject) {
                     for (let widgetObjectItem of widgetObjectIndx.data) {
                            data.data.push(widgetObjectItem);
                        }
                }
            } else {
            for (let widgetObjectItem of widgetObject.data) {
                data.data.push(widgetObjectItem);
            }
            }
        }

        if (this.exportService.getWidgets().length === 0) {
            this.matSnackBar.open('There are no visualizations to export.', 'OK', config);
            return;
        }
        if (data && data.data && data.data.length === 1) {
            data.name = data.data[0].name;
        }
        connection.executeExport(data, this.exportSuccess.bind(this), this.exportFail.bind(this), this.exportService.getFileFormat());
    }
}
