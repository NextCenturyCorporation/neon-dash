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

    import(fileContent: any)
    {
        let connection = this.connectionService.connect(this.dashboardState.getDatastoreType(),
            this.dashboardState.getDatastoreHost());

        let importQuery = { 
            hostName: this.optionCollection.datastore.host, 
            dataStoreType: this.optionCollection.datastore.type,
            database: this.optionCollection.database.name, 
            table: this.optionCollection.table.name,
            source: fileContent.data.map(row => JSON.stringify(row))
        };

        connection.runImportQuery(importQuery, this.uploadSuccess.bind(this), this.uploadFail.bind(this));                 

    }

    uploadSuccess(response) {
        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            message: response[0].failCount == 0 ? 
                    `All ${response[0].total} records successfully imported!`:
                    `Out of ${response[0].total} records, ${response[0].total - response[0].failCount} successfully imported and ${response[0].failCount} failed.`
        });        
    }

    uploadFail(response) {
        this.messenger.publish(neonEvents.DASHBOARD_MESSAGE, {
            message: 'Import failed:' + response
        });
    }
}
