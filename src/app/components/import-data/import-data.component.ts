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
    Component,
    OnDestroy,
    ViewEncapsulation,
    Input,
    ViewChild,
    ElementRef
} from '@angular/core';

import { MatSidenav } from '@angular/material';

import { DashboardService } from '../../services/dashboard.service';
import { Dataset, FieldConfig } from 'component-library/dist/core/models/dataset';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { WidgetOptionCollection, ConfigurableWidget } from '../../models/widget-option-collection';

import { eventing } from 'neon-framework';
import { DashboardState } from '../../models/dashboard-state';
import { CSVService } from '../../services/csv.service';

enum ImportStatus {
    NOT_STARTED,
    IN_PROGRESS,
    COMPLETED,
    ABORTED
}

@Component({
    selector: 'app-import-data',
    templateUrl: './import-data.component.html',
    styleUrls: ['./import-data.component.scss'],
    encapsulation: ViewEncapsulation.Emulated
})
export class ImportDataComponent implements OnDestroy {
    @ViewChild('inputFile', { static: true }) inputFile: ElementRef;
    @Input() comp: ConfigurableWidget;
    @Input() sideNavRight: MatSidenav;

    private dataset: Dataset;
    private messenger: eventing.Messenger;
    private readonly dashboardState: DashboardState;

    public maxAllowedErrors = 100000;
    public optionCollection: WidgetOptionCollection;
    public isFileSelected: boolean;
    public importStatus: ImportStatus = ImportStatus.NOT_STARTED;;
    public processedRecordsCount: number = 0;
    public processedChunksCount: number = 0;
    public parseErrors: any[] = [];
    public dbErrors: any[] = [];
    public warningMessage: string;

    constructor(
        dashboardService: DashboardService,
        private connectionService: InjectableConnectionService,
        private csvservice: CSVService
    ) {
        this.messenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
        let stateSourceSubscription = dashboardService.stateSource.subscribe((dashboardState) => {
            this.dataset = dashboardState.asDataset();
            this.optionCollection = new WidgetOptionCollection(this.dataset);
        });

        stateSourceSubscription.unsubscribe();
    }

    reset() {
        this.importStatus = ImportStatus.NOT_STARTED;
        this.processedChunksCount = 0;
        this.processedRecordsCount = 0;
        this.dbErrors = [];
        this.parseErrors = [];
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
        if (this.inProgress) {
            this.importStatus = ImportStatus.ABORTED;
        }
    }

    public onDatastoreChanged() {
        this.optionCollection.updateDatabases(this.dataset);
        this.warningMessage = null;
        this.reset();
    }

    public onDatabaseChanged() {
        this.optionCollection.updateTables(this.dataset);
        this.warningMessage = null;
        this.reset();
    }

    public onFileSelected() {
        this.isFileSelected = true;
        this.reset();
    }

    public get selectedFile() {
        return this.isFileSelected ? this.inputFile.nativeElement.files[0].name : '';
    }

    public onDownloadErrors(errorType: string) {
        let link = document.createElement('a');
        let errors = errorType === 'parse' ?
            this.parseErrors.map((error) => ({ row: error.row, error: error.message })) : this.dbErrors;

        const blob = new Blob([this.csvservice.unparse(errors)], { type: 'text/csv' });
        link.href = window.URL.createObjectURL(blob);
        link.target = '_blank';
        link.download = `${errorType}-errors.csv`;
        link.click();
        link.remove();
    }

    public onCancel() {
        this.sideNavRight.close();
    }

    public onImportClick() {
        let file = this.inputFile.nativeElement.files[0];
        this.reset();
        this.importStatus = ImportStatus.IN_PROGRESS;

        this.csvservice.parse(file, { header: true,
            skipEmptyLines: true,
            transformHeader: function(header: string) {
                return header.trim();
            },
            chunk: this.importChunk.bind(this),
            complete: this.importEnd.bind(this) });
    }

    public get inProgress(): boolean {
        return this.importStatus === ImportStatus.IN_PROGRESS;
    }

    public get progressIndicator(): any {
        let errorCount = this.parseErrors.length + this.dbErrors.length;

        const inProgressMessage = this.processedChunksCount === 0 ? 'Parsing file, please wait...' :
            `Importing batch ${this.processedChunksCount}, ${this.processedRecordsCount} records processed so far ...`;

        switch (this.importStatus) {
            case ImportStatus.IN_PROGRESS:
                return {
                    cssClass: '',
                    message: inProgressMessage
                };
            case ImportStatus.ABORTED:
                return {
                    cssClass: 'error',
                    message: `Import aborted. ${this.processedRecordsCount} records processed. ${errorCount} record(s) failed.`
                };
            case ImportStatus.COMPLETED:
                return {
                    cssClass: 'success',
                    message: this.warningMessage ?
                        '' : `Import completed. ${this.processedRecordsCount} records processed. ${errorCount} record(s) failed.`
                };
            default:
                return { css: '', message: '' };
        }
    }

    private importChunk(result: any, parser: any) {
        if (!this.inProgress) { // Indicates import is aborted outside of this event handler (eg. by closing the import UI). abort papaparse
            parser.abort();
            return;
        } else if (result.errors.length > 0) {
            this.parseErrors = this.parseErrors.concat(result.errors);
            if (this.parseErrors.length + this.dbErrors.length > this.maxAllowedErrors) { // To many errors, quit import
                parser.abort();
                this.importStatus = ImportStatus.ABORTED;
                return;
            }
        }

        let sourceColumns = result.meta.fields.map((field) => field.trim());

        // TODO THOR-1062 Iterate over, connect, and call runExportQuery on each datastore.
        let connection = this.connectionService.connect(this.dashboardState.datastores[0].type,
            this.dashboardState.datastores[0].host);

        let destinationColumns: string[] = this.optionCollection.fields.map((field: FieldConfig) => field.columnName);
        if (!this.warningMessage && destinationColumns) {
            // Check if source and destination columns match, and if not show warning to user
            let newSourceColumns = sourceColumns.filter((sourceColumn: string) => destinationColumns.indexOf(sourceColumn) === -1);
            if (newSourceColumns.length > 0) {
                this.warningMessage = `The columns <b>${newSourceColumns.join(', ')}</b> in the CSV file
                                        do not exist in destination table. They will be added as new columns. 
                                        Click on 'Import' again to proceed?`;
                parser.abort();
                this.parseErrors = [];
                return;
            }
        }

        this.warningMessage = null;

        // Exclude rows with errors from the data to be imported
        let errorRows = result.errors.map((error) => error.row);
        let source = result.data.filter((row, index) => row && errorRows.indexOf(index) === -1);

        let importQuery = {
            hostName: this.optionCollection.datastore.host,
            dataStoreType: this.optionCollection.datastore.type,
            database: this.optionCollection.database.name,
            table: this.optionCollection.table.name,
            source: source.map((row) => JSON.stringify(row))
        };

        connection.runImportQuery(importQuery,
            ((importResponse: any) => {
                this.dbErrors = this.dbErrors.concat(importResponse.recordErrors ? importResponse.recordErrors : []);
                parser.resume();
            }),

            ((response: any) => {
                parser.abort();
                this.importStatus = ImportStatus.ABORTED;
                this.warningMessage = `Batch ${this.processedChunksCount + 1} failed. 
                                       Check server logs for detail. response status is ${response.statusText}`;
            }));

        this.processedRecordsCount += result.data.length;
        this.processedChunksCount++;
        parser.pause(); // Pause until the current chunk returns.
    }

    private importEnd() {
        this.importStatus = ImportStatus.COMPLETED;
    }
}
