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
import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';

import { NeonDashboardConfig, NeonDashboardChoiceConfig } from '../../model/types';

import { eventing } from 'neon-framework';
import { DashboardService } from '../../services/dashboard.service';

import * as _ from 'lodash';

@Component({
    selector: 'app-dashboard-selector',
    templateUrl: 'dashboard-selector.component.html',
    styleUrls: ['dashboard-selector.component.scss']
})
export class DashboardSelectorComponent implements OnInit, OnDestroy {

    public dashboardChoice: NeonDashboardConfig;

    @Output() closeComponent: EventEmitter<boolean> = new EventEmitter<boolean>();

    choices: NeonDashboardChoiceConfig[] = [];

    private messenger: eventing.Messenger;

    constructor(
        private dashboardService: DashboardService
    ) {
        this.messenger = new eventing.Messenger();
    }

    get dashboards() {
        return this.dashboardService.config.dashboards;
    }

    ngOnInit(): void {
        this.dashboardService.stateSource.subscribe((state) => {
            this.onDashboardStateChange(state.dashboard);
        })
    }

    ngOnDestroy(): void {
        this.messenger.unsubscribeAll();
    }

    get choiceNodes() {
        return this.choices.filter((db) => 'choices' in db);
    }

    /**
     * Emits an event to close the component.
     */
    public emitCloseComponent() {
        this.closeComponent.emit(true);
    }

    private onDashboardStateChange(dashboard: NeonDashboardConfig): void {
        this.dashboardChoice = dashboard;
        this.choices = this.computePath();
        if (!this.choices.length) {
            this.choices = [this.dashboards];
        }
    }

    private computePath(root: NeonDashboardConfig = this.dashboards) {
        if ('choices' in root) {
            for (const key of Object.keys(root.choices)) {
                const res = this.computePath(root.choices[key]);
                if (res.length) {
                    return [root, ...res];
                }
            }
        } else if (root.fullTitle === this.dashboardChoice.fullTitle) {
            return [root];
        }
        return [];
    }

    /**
     * If selection change event bubbles up from dashboard-dropdown, this will set the
     * dashboardChoice to the appropriate value.
     */
    public selectDashboard(dashboard: NeonDashboardConfig, idx: number) {
        if ('choices' in dashboard && !_.isEmpty(dashboard.choices)) {
            this.choices = [...this.choices.slice(0, idx + 1), dashboard];
        } else {
            this.dashboardChoice = dashboard;
        }
    }

    /**
     * Updates the current dashboard state to the selected dashboardChoice.
     */
    public updateDashboardState(dashboard: NeonDashboardConfig) {
        if (dashboard && 'tables' in dashboard) {
            this.dashboardService.setActiveDashboard(dashboard);
        }
    }

    public getChoices(dashboard: NeonDashboardChoiceConfig) {
        return Object.values(dashboard.choices)
            .filter((db1) => !!db1.name)
            .sort((db1, db2) => {
                return db1.name.localeCompare(db2.name);
            });
    }
}
