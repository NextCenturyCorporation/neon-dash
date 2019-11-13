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
    ElementRef,
    Inject
} from '@angular/core';

import { MatSidenav } from '@angular/material';

import { DashboardService } from '../../services/dashboard.service';
import { Dataset } from '../../library/core/models/dataset';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { WidgetOptionCollection, ConfigurableWidget } from '../../models/widget-option-collection';

import { neonEvents } from '../../models/neon-namespaces';
import { eventing } from 'neon-framework';
import { DashboardState } from '../../models/dashboard-state';

@Component({
    selector: 'app-import-data',
    templateUrl: './import-data.component.html',
    styleUrls: ['./import-data.component.scss'],
    encapsulation: ViewEncapsulation.Emulated
})
export class ImportDataComponent implements OnDestroy {
    @ViewChild('inputFile') inputFile: ElementRef;
    @Input() comp: ConfigurableWidget;
    @Input() sideNavRight: MatSidenav;

    private dataset: Dataset;
    private messenger: eventing.Messenger;
    public optionCollection: WidgetOptionCollection;
    public isFileSelected: boolean;
    public readonly dashboardState: DashboardState;

    public csvParseError: string;
    public warningMessage: string;

    constructor(
        dashboardService: DashboardService,
        protected connectionService: InjectableConnectionService,
        @Inject(Object) private papa: any
    ) {
        this.messenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
        let stateSourceSubscription = dashboardService.stateSource.subscribe((dashboardState) => {
            this.dataset = dashboardState.asDataset();
            this.optionCollection = new WidgetOptionCollection(this.dataset);
        });

        stateSourceSubscription.unsubscribe();
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    public onDatastoreChanged() {
        this.optionCollection.updateDatabases(this.dataset);
        this.warningMessage = null;
    }

    public onDatabaseChanged() {
        this.optionCollection.updateTables(this.dataset);
        this.warningMessage = null;
    }

    public get selectedFile() {
        return this.isFileSelected ? this.inputFile.nativeElement.files[0].name : '';
    }

    public onFileSelected() {
        this.isFileSelected = true;
    }

    public onCancel() {
        this.sideNavRight.close();
    }

    public onImportClick() {
        let file = this.inputFile.nativeElement.files[0];
        this.papa.parse(file, { header: true,
            complete: this.import.bind(this) });
    }

    import(result: any) {
        if (result.errors.length > 0) {
            this.csvParseError = `CSV parsing error at line ${result.errors[0].row}: ${result.errors[0].message}`;
            return;
        }
        else
        {
            this.csvParseError = "";
        }

        this.csvParseError = '';
        let sourceColumns = Object.keys(result.data[0]);

        let connection = this.connectionService.connect(this.dashboardState.getDatastoreType(),
            this.dashboardState.getDatastoreHost());

        connection.getTableNamesAndFieldNames(this.optionCollection.database.name,
            ((response: any) => {
                let destinatinColumns: string[] = response[this.optionCollection.table.name];
                if (!this.warningMessage && destinatinColumns) {
                    // Check if source and destination columns match, and if not show warning to user
                    let newSourceColumns = sourceColumns.filter((sourceColumn: string) => destinatinColumns.indexOf(sourceColumn) === -1);
                    if (newSourceColumns.length > 0) {
                        this.warningMessage = `The columns <b>${newSourceColumns.join(', ')}</b> in the CSV file
                                               do not exist in destination table. They will be added as new columns. 
                                               Click on 'Import' again to proceed?`;
                        return;
                    }
                }

                let importQuery = {
                    hostName: this.optionCollection.datastore.host,
                    dataStoreType: this.optionCollection.datastore.type,
                    database: this.optionCollection.database.name,
                    table: this.optionCollection.table.name,
                    source: result.data.map((row) => JSON.stringify(row))
                };

                connection.runImportQuery(importQuery,
                    ((importResponse: any) => {
                        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                            message: importResponse.failCount === 0 ?
                                `All ${importResponse.total} records successfully imported!` :
                                `Out of ${importResponse.total} records, ${importResponse.total - importResponse.failCount} 
                                successfully imported and ${importResponse.failCount} failed.`
                        });

                        this.sideNavRight.close();
                    }),

                    ((error: any) => {
                        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                            message: 'Import failed:' + error
                        });
                    }));
            }),

            ((response: any) => {
                let error = response.responseJSON ? response.responseJSON.message : response.statusText;
                this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                    message: 'Error accessing destination columns:' + error
                });
            }));
    }
}
