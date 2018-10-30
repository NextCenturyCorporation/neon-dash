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

import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit, Injector } from '@angular/core';
import { URLSearchParams } from '@angular/http';

import { MatDialog, MatDialogRef, MatSnackBar, MatSidenav } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';

import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';

import * as _ from 'lodash';
import * as neon from 'neon-framework';

import { BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { DatasetOptions, EMPTY_FIELD, FieldMetaData, SimpleFilter, TableMetaData } from '../../dataset';

export class SettingsOptions extends BaseNeonOptions {
    searchField: FieldMetaData;
    tableField: TableMetaData;
    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        //this.searchField = this.injector.get('');
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        //this.searchField = this.findFieldObject('');
    }

}

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html',
    styleUrls: ['settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {

    public formData: any = {
        exportFormat: 0,
        currentTheme: 'neon-green-theme',
        newStateName: '',
        stateToLoad: '',
        stateToDelete: ''
    };

    public confirmDialogRef: MatDialogRef<ConfirmationDialogComponent>;
    public exportTarget: string = 'all';
    public options: SettingsOptions;
    public searchField: FieldMetaData;
    public showVisShortcut: boolean = true;
    public showSimpleSearch: boolean;
    public simpleFilter = new BehaviorSubject<SimpleFilter>(undefined);
    public simpleSearch = {};
    public simpleSearchField = {};
    public tableField: TableMetaData;
    public messenger: neon.eventing.Messenger;

    constructor(
        private changeDetection: ChangeDetectorRef,
        public datasetService: DatasetService,
        public exportService: ExportService,
        public injector: Injector,
        public themesService: ThemesService
    ) {
        this.datasetService = datasetService;
        this.exportService = exportService;
        this.injector = injector;

        this.options = new SettingsOptions(this.injector, this.datasetService, 'Simple');

        this.messenger = new neon.eventing.Messenger();
    }

    checkSimpleFilter() {
        //console.log(this.showSimpleSearch);
        //console.table(this.simpleFilter);
        if (this.simpleFilter && this.showSimpleSearch !== false) {
            this.showSimpleSearch = true;
        } else {
            this.showSimpleSearch = false;
        }
        //console.log(this.showSimpleSearch);
    }

    ngOnInit() {
        this.formData.exportFormat = this.exportService.getFileFormats()[0].value;
        this.formData.currentTheme = this.themesService.getCurrentTheme().id;
        this.simpleSearch = this.datasetService.getActiveDatasetOptions();
        this.checkSimpleFilter();
        this.messenger.subscribe('showSimpleSearch', (message) => {
            this.showSimpleSearch = message.showSimpleSearch;
            this.changeDetection.detectChanges();
        });

        this.messenger.subscribe('showVisShortcut', (message) => {
            this.showVisShortcut = message.showVisShortcut;
        });

        this.messenger.subscribe('simpleFilter', (message) => {
            this.options.searchField = message.searchField;
            this.options.tableField = message.tableField;
        });
        //console.log(this.simpleFilter);
        this.changeDetection.detectChanges();
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
            this.themesService.setCurrentTheme(themeId);
        }
    }

    changeSimpleSearchFilter() {
        //this.simpleFilter.next(options && options.simpleFilter);
        //console.log(this.datasetService.getActiveDatasetOptions());
        //console.log(this.options.searchField);
        this.datasetService.setActiveDatasetSimpleFilterFieldName(this.options.searchField);
    }

}
