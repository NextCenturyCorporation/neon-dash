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
    Input,
    ViewChild,
    ElementRef
} from '@angular/core';

import { MatSidenav } from '@angular/material';

import { DashboardService } from '../../services/dashboard.service';
import { Dataset } from '../../library/core/models/dataset';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { WidgetOptionCollection, ConfigurableWidget } from '../../models/widget-option-collection';

import { neonEvents } from '../../models/neon-namespaces';
import { eventing } from 'neon-framework';
import { DashboardState } from '../../models/dashboard-state';
import * as _ from 'lodash';

import * as Papa from 'papaparse';

@Component({
    selector: 'app-import-data',
    templateUrl: './import-data.component.html',
    styleUrls: ['./import-data.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
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

    public csvParseError: String;
    public warningMessage: string;

    constructor(
        private changeDetection: ChangeDetectorRef,
        dashboardService: DashboardService,
        protected connectionService: InjectableConnectionService
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

    public onDatastoreChanged()
    {
        this.optionCollection.updateDatabases(this.dataset);
    }

    public onDatabaseChanged()
    {
        this.optionCollection.updateTables(this.dataset);
    }

    public get selectedFile()
    {
        return this.isFileSelected ? this.inputFile.nativeElement.files[0].name : '';
    }

    public onFileSelected() {
        this.isFileSelected = true;
    }
 
    public onCancel()
    {
        this.sideNavRight.close();
    }

    public onImportClick() {
        let file = this.inputFile.nativeElement.files[0];
        
        let reader: FileReader = new FileReader();
        reader.readAsText(file);
        reader.onload = (e) => {
            let csv: string = reader.result as string;
            Papa.parse(file, { header: true,
                complete: this.import.bind(this) })
        };        
    }

    import(result: any)
    {
        if (result.errors.length > 0)
        {
            this.csvParseError = `Parsing error at line ${result.errors[0].row}: ${result.errors[0].message}`;
            return;
        }
        else 
        {
            this.csvParseError = '';
        }

        let sourceColumns = Object.keys(result.data[0]);

        let connection = this.connectionService.connect(this.dashboardState.getDatastoreType(),
            this.dashboardState.getDatastoreHost());

        connection.getTableNamesAndFieldNames(this.optionCollection.database.name, 
            ((response: any) => {
                let destinatinColumns: string[] = response[this.optionCollection.table.name];
                if (!this.warningMessage && destinatinColumns)
                {//check if source and destination columns match, and if not show warning to user
                    let newSourceColumns = sourceColumns.filter((sourceColumn: string) => destinatinColumns.indexOf(sourceColumn) == -1 );
                    if (newSourceColumns.length > 0)
                    {
                        this.warningMessage = `The columns <b>${newSourceColumns.join(", ")}</b> in the CSV file
                                               do not exist in destination table. They will be added as new columns. 
                                               Click on 'Import' again to proceed?`;
                        this.changeDetection.detectChanges();
                        return;                         
                    }    
                }

                let importQuery = { 
                    hostName: this.optionCollection.datastore.host, 
                    dataStoreType: this.optionCollection.datastore.type,
                    database: this.optionCollection.database.name, 
                    table: this.optionCollection.table.name,
                    source: result.data.map(row => JSON.stringify(row))
                };                
                
                connection.runImportQuery(importQuery,
                    ((response: any) => {
                        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                            message: response[0].failCount == 0 ? 
                                    `All ${response[0].total} records successfully imported!`:
                                    `Out of ${response[0].total} records, ${response[0].total - response[0].failCount} successfully imported and ${response[0].failCount} failed.`
                        });     

                        this.sideNavRight.close();                   

                    }).bind(this),

                    ((response: any) => {
                        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
                            message: 'Import failed:' + response
                        });                
                    }).bind(this)
                );

            }).bind(this),

            ((response: any) => {
                let error = response.responseJSON ? response.responseJSON.message : response.statusText;
                this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {                    
                    message: 'Error accessing destination columns:' + error
                });                
            }).bind(this)
        );             

    }
}
