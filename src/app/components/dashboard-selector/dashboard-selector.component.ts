/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';

import { NeonDashboardConfig, NeonDashboardChoiceConfig } from '../../models/types';

import { eventing } from 'neon-framework';
import { DashboardService } from '../../services/dashboard.service';

import * as _ from 'lodash';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard-selector',
    templateUrl: 'dashboard-selector.component.html',
    styleUrls: ['dashboard-selector.component.scss']
})
export class DashboardSelectorComponent implements OnInit, OnDestroy {
    public dashboardChoice?: NeonDashboardConfig;

    @Output() closeComponent: EventEmitter<boolean> = new EventEmitter<boolean>();

    choices: NeonDashboardChoiceConfig[] = [];

    dashboards: NeonDashboardConfig;

    private messenger: eventing.Messenger;

    constructor(
        public dashboardService: DashboardService,
        public router: Router
    ) {
        this.messenger = new eventing.Messenger();
    }

    ngOnInit(): void {
        this.dashboardService.stateSource.subscribe((state) => {
            this.dashboards = this.dashboardService.config.dashboards;
            this.onDashboardStateChange(state.dashboard);
        });

        this.onDashboardStateChange(undefined);
    }

    ngOnDestroy(): void {
        this.messenger.unsubscribeAll();
    }

    get choiceNodes() {
        return this.choices.filter((db) => 'choices' in db && !_.isEmpty(db.choices));
    }

    /**
     * Emits an event to close the component.
     */
    public emitCloseComponent() {
        this.closeComponent.emit(true);
    }

    public onDashboardStateChange(dashboard: NeonDashboardConfig): void {
        this.dashboardChoice = dashboard;
        if (!this.dashboards || !('choices' in this.dashboards)) {
            this.dashboards = NeonDashboardChoiceConfig.get({
                category: DashboardService.DASHBOARD_CATEGORY_DEFAULT,
                choices: dashboard ? { [dashboard.name]: dashboard } : {}
            });
        }
        this.choices = this.computePath();
        if (!this.choices.length) {
            this.choices = [this.dashboards];
        }
    }

    private computePath(root: NeonDashboardConfig = this.dashboards) {
        if ('choices' in root && !_.isEmpty(root.choices)) {
            for (const key of Object.keys(root.choices)) {
                const res = this.computePath(root.choices[key]);
                if (res.length) {
                    return [root, ...res];
                }
            }
        } else if (this.dashboardChoice && _.isEqual(root.fullTitle, this.dashboardChoice.fullTitle)) {
            return [root];
        }
        return [];
    }

    private computeNamePath(root: NeonDashboardConfig = this.dashboards) {
        if ('choices' in root && !_.isEmpty(root.choices)) {
            for (const key of Object.keys(root.choices)) {
                const res = this.computeNamePath(root.choices[key]);
                if (res) {
                    return [key, ...res];
                }
            }
        } else if (this.dashboardChoice && _.isEqual(root.fullTitle, this.dashboardChoice.fullTitle)) {
            return [];
        }
        return undefined;
    }

    /**
     * If selection change event bubbles up from dashboard-dropdown, this will set the
     * dashboardChoice to the appropriate value.
     */
    public selectDashboard(dashboard: NeonDashboardConfig, idx: number) {
        this.choices = [...this.choices.slice(0, idx + 1), dashboard];
        if (!('choices' in dashboard) || _.isEmpty(dashboard.choices)) {
            this.dashboardChoice = dashboard;
        }
    }

    /**
     * Updates the current dashboard state to the selected dashboardChoice.
     */
    public updateDashboardState(dashboard: NeonDashboardConfig) {
        if (dashboard && 'tables' in dashboard) {
            this.dashboardChoice = dashboard;
            this.router.navigate(['/'], {
                fragment: '',
                queryParams: {
                    dashboard: [this.dashboardService.config.fileName, ...this.computeNamePath()].join('/')
                },
                relativeTo: this.router.routerState.root
            });
        }
    }

    public getNextChoices(dashboard: NeonDashboardChoiceConfig) {
        return Object.values(dashboard.choices || {})
            .filter((db1) => !!db1.name)
            .sort((db1, db2) => db1.name.localeCompare(db2.name));
    }
}
