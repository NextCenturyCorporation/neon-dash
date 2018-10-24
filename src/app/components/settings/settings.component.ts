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

import { Component, OnInit, ViewContainerRef, Input, Injector } from '@angular/core';
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
import { DatasetOptions, SimpleFilter } from '../../dataset';

export class SettingsOptions extends BaseNeonOptions {
    public simpleSearch: DatasetOptions;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        //
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        //
    }

}

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html',
    styleUrls: ['settings.component.scss']
})
export class SettingsComponent implements OnInit {

    @Input() sidenav: MatSidenav;

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
    public showVisShortcut: boolean = true;
    public showSimpleSearch: boolean;
    public simpleSearch = {};
    public simpleSearchField = {};

    public messenger: neon.eventing.Messenger;

    constructor(
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

    ngOnInit() {
        this.formData.exportFormat = this.exportService.getFileFormats()[0].value;
        this.formData.currentTheme = this.themesService.getCurrentTheme().id;
        this.simpleSearch = this.datasetService.getActiveDatasetOptions();

        this.messenger.subscribe('showVisShortcut', (message) => {
            this.showVisShortcut = message.showVisShortcut;
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

}
