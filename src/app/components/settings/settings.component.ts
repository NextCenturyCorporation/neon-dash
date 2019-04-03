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
import { FieldMetaData, SimpleFilter, TableMetaData } from '../../dataset';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';

import * as _ from 'lodash';
import * as neon from 'neon-framework';

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
    public options;
    public searchField: FieldMetaData;
    public showFiltersComponentIcon: boolean = true;
    public showSimpleSearch: boolean;
    public showVisShortcut: boolean = true;
    public simpleFilter = new BehaviorSubject<SimpleFilter>(undefined);
    public simpleSearch = {};
    public simpleSearchField = {};
    public tableField: TableMetaData;
    public messenger: neon.eventing.Messenger;

    constructor(
        private changeDetection: ChangeDetectorRef,
        protected datasetService: DatasetService,
        private dialog: MatDialog,
        public injector: Injector,
        public widgetService: AbstractWidgetService
    ) {
        this.datasetService = datasetService;
        this.injector = injector;
        this.messenger = new neon.eventing.Messenger();
    }

    changeSimpleSearchFilter() {
        this.datasetService.setCurrentDashboardSimpleFilterFieldName(this.searchField);
    }

    checkSimpleFilter() {
        if (this.simpleFilter && this.showSimpleSearch !== false) {
            this.showSimpleSearch = true;
        } else {
            this.showSimpleSearch = false;
        }
    }

    getExportCallbacks(widgets: Map<string, BaseNeonComponent>): (() => { name: string, data: any }[])[] {
        return Array.from(widgets.values()).map((widget) => widget.createExportData);
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    ngOnInit() {
        this.formData.currentTheme = this.widgetService.getTheme();
        this.checkSimpleFilter();
        this.validateDatasetService();

        this.messenger.subscribe('showFiltersComponentIcon', (message) => {
            this.showFiltersComponentIcon = message.showFiltersComponentIcon;
        });
        this.messenger.subscribe('showSimpleSearch', (message) => {
            this.showSimpleSearch = message.showSimpleSearch;
        });

        this.messenger.subscribe('showVisShortcut', (message) => {
            this.showVisShortcut = message.showVisShortcut;
        });

        this.messenger.subscribe('simpleFilter', (message) => {
            this.options.searchField = message.searchField;
            this.options.tableField = message.tableField;
        });
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

    publishShowFiltersComponentIcon() {
        this.showFiltersComponentIcon = !this.showFiltersComponentIcon;
        this.messenger.publish('showFiltersComponentIcon', {
            showFiltersComponentIcon: this.showFiltersComponentIcon
        });
    }

    publishShowSimpleSearch() {
        this.showSimpleSearch = !this.showSimpleSearch;
        this.messenger.publish('showSimpleSearch', {
            showSimpleSearch: this.showSimpleSearch
        });
    }

    publishShowVisShortcut() {
        this.showVisShortcut = !this.showVisShortcut;
        this.messenger.publish('showVisShortcut', {
            showVisShortcut: this.showVisShortcut
        });
    }

    setCurrentTheme(themeId: any) {
        if (themeId) {
            this.widgetService.setTheme(themeId);
        }
    }

    validateDatasetService() {
        if (this.datasetService.getCurrentDashboardOptions()) {
            this.simpleSearch = this.datasetService.getCurrentDashboardOptions();
        }
        if (this.datasetService.getActiveFields()) {
            this.options = this.datasetService.getActiveFields();
        }

        if (this.datasetService.getCurrentDashboardSimpleFilterFieldName()) {
            this.searchField = new FieldMetaData(this.datasetService.getCurrentDashboardSimpleFilterFieldName(),
                this.datasetService.getCurrentDashboardSimpleFilterFieldName());
        }
    }

}
