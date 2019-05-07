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

import { ChangeDetectorRef, ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, Injector } from '@angular/core';
import { URLSearchParams } from '@angular/http';

import { MatDialog, MatDialogRef, MatSnackBar, MatSidenav } from '@angular/material';
import { BehaviorSubject } from 'rxjs';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ConfigEditorComponent } from '../config-editor/config-editor.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { DatabaseMetaData, FieldMetaData, SimpleFilter, TableMetaData } from '../../dataset';
import { neonEvents } from '../../neon-namespaces';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';

import * as _ from 'lodash';
import { eventing } from 'neon-framework';

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html',
    styleUrls: ['settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy {

    @Input() public widgets: Map<string, BaseNeonComponent> = new Map();

    public formData: any = {
        currentTheme: 'neon-green-theme'
    };

    public confirmDialogRef: MatDialogRef<ConfirmationDialogComponent>;
    public messenger: eventing.Messenger;

    public fields: FieldMetaData[] = [];
    public searchField: FieldMetaData;

    public showFilterTray: boolean = true;
    public showSimpleSearch: boolean;
    public showVisualizationsShortcut: boolean = true;

    constructor(
        private changeDetection: ChangeDetectorRef,
        protected datasetService: DatasetService,
        private dialog: MatDialog,
        public injector: Injector,
        public widgetService: AbstractWidgetService
    ) {
        this.datasetService = datasetService;
        this.injector = injector;
        this.messenger = new eventing.Messenger();
    }

    changeSimpleSearchFilter() {
        this.datasetService.setCurrentDashboardSimpleFilterFieldName(this.searchField);
    }

    getExportCallbacks(widgets: Map<string, BaseNeonComponent>): (() => { name: string, data: any }[])[] {
        return Array.from(widgets.values()).map((widget) => widget.createExportData);
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    ngOnInit() {
        this.formData.currentTheme = this.widgetService.getTheme();

        this.updateSimpleSearchFilter();

        this.messenger.subscribe(neonEvents.TOGGLE_FILTER_TRAY, (message) => {
            this.showFilterTray = message.show;
        });

        this.messenger.subscribe(neonEvents.TOGGLE_SIMPLE_SEARCH, (message) => {
            this.showSimpleSearch = message.show;
        });

        this.messenger.subscribe(neonEvents.TOGGLE_VISUALIZATIONS_SHORTCUT, (message) => {
            this.showVisualizationsShortcut = message.show;
        });

        this.messenger.subscribe(neonEvents.DASHBOARD_RESET, this.updateSimpleSearchFilter.bind(this));

        this.changeDetection.detectChanges();
    }

    openEditConfigDialog() {
        let dConfig  = {
            height: '80%',
            width: '80%',
            hasBackdrop: true,
            disableClose: true
        };
        let dialogRef = this.dialog.open(ConfigEditorComponent, dConfig);
    }

    publishShowFilterTray() {
        this.showFilterTray = !this.showFilterTray;
        this.messenger.publish(neonEvents.TOGGLE_FILTER_TRAY, {
            show: this.showFilterTray
        });
    }

    publishShowSimpleSearch() {
        this.showSimpleSearch = !this.showSimpleSearch;
        this.messenger.publish(neonEvents.TOGGLE_SIMPLE_SEARCH, {
            show: this.showSimpleSearch
        });
    }

    publishShowVisualizationsShortcut() {
        this.showVisualizationsShortcut = !this.showVisualizationsShortcut;
        this.messenger.publish(neonEvents.TOGGLE_VISUALIZATIONS_SHORTCUT, {
            show: this.showVisualizationsShortcut
        });
    }

    setCurrentTheme(themeId: any) {
        if (themeId) {
            this.widgetService.setTheme(themeId);
        }
    }

    private updateSimpleSearchFilter() {
        let simpleFilter: any = (this.datasetService.getCurrentDashboardOptions() || {}).simpleFilter || {};

        if (simpleFilter.databaseName && simpleFilter.tableName && simpleFilter.fieldName) {
            let database: DatabaseMetaData = this.datasetService.getDatabaseWithName(simpleFilter.databaseName);
            let table: TableMetaData = this.datasetService.getTableWithName(simpleFilter.databaseName, simpleFilter.tableName);
            let field: FieldMetaData = this.datasetService.getFieldWithName(simpleFilter.databaseName, simpleFilter.tableName,
                simpleFilter.fieldName);

            this.fields = table.fields;
            this.searchField = field;
            this.showSimpleSearch = true;
        } else {
            this.fields = this.datasetService.getActiveFields();
        }
    }
}
