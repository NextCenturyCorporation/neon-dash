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

import { ChangeDetectorRef, ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, Injector } from '@angular/core';

import { MatDialog } from '@angular/material';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { NeonFieldMetaData, NeonTableMetaData } from '../../models/dataset';
import { neonEvents } from '../../models/neon-namespaces';

import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';

import { eventing } from 'neon-framework';
import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { DashboardState } from '../../models/dashboard-state';

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

    public messenger: eventing.Messenger;

    public fields: NeonFieldMetaData[] = [];
    public searchField: NeonFieldMetaData;

    public showFilterTray: boolean = true;
    public showSimpleSearch: boolean;
    public showVisualizationsShortcut: boolean = true;
    public readonly dashboardState: DashboardState;

    constructor(
        private changeDetection: ChangeDetectorRef,
        private dashboardService: DashboardService,
        private dialog: MatDialog,
        public injector: Injector,
        public colorThemeService: InjectableColorThemeService
    ) {
        this.injector = injector;
        this.messenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
    }

    changeSimpleSearchFilter() {
        this.dashboardState.setSimpleFilterFieldName(this.searchField);
    }

    getExportCallbacks(widgets: Map<string, BaseNeonComponent>): (() => { name: string, data: any }[])[] {
        return Array.from(widgets.values()).map((widget) => widget.createExportData.bind(widget));
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    ngOnInit() {
        this.formData.currentTheme = this.colorThemeService.getTheme();

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

        this.dashboardService.stateSource.subscribe(() => {
            this.updateSimpleSearchFilter();
        });

        this.changeDetection.detectChanges();
    }

    openEditConfigDialog() {
        this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'config-editor'
            },
            height: '80%',
            width: '80%',
            hasBackdrop: true,
            disableClose: true
        });
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
            this.colorThemeService.setTheme(themeId);
        }
    }

    private updateSimpleSearchFilter() {
        let simpleFilter: any = (this.dashboardState.getOptions() || {}).simpleFilter || {};

        if (simpleFilter.databaseName && simpleFilter.tableName && simpleFilter.fieldName) {
            let table: NeonTableMetaData = this.dashboardState.getTableWithName(simpleFilter.databaseName, simpleFilter.tableName);
            let field: NeonFieldMetaData = this.dashboardState.getFieldWithName(simpleFilter.databaseName, simpleFilter.tableName,
                simpleFilter.fieldName);

            this.fields = table.fields;
            this.searchField = field;
            this.showSimpleSearch = true;
        } else {
            this.fields = this.dashboardState.getActiveFields();
        }
    }
}
