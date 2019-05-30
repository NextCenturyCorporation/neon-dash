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
import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Dashboard } from '../../dataset';
import { neonEvents } from '../../neon-namespaces';
import { DashboardDropdownComponent } from '../dashboard-dropdown/dashboard-dropdown.component';

import { eventing } from 'neon-framework';

@Component({
    selector: 'app-dashboard-selector',
    templateUrl: 'dashboard-selector.component.html',
    styleUrls: ['dashboard-selector.component.scss']
})
export class DashboardSelectorComponent implements OnInit, OnDestroy {
    public dashboardChoice: Dashboard;

    @Input() dashboards: Dashboard;

    @ViewChild('dashboardDropdown') dashboardDropdown: DashboardDropdownComponent;

    private messenger: eventing.Messenger;

    constructor() {
        this.messenger = new eventing.Messenger();
    }

    ngOnInit(): void {
        this.messenger.subscribe(neonEvents.DASHBOARD_STATE, this.onDashboardStateChange.bind(this));
    }

    ngOnDestroy(): void {
        this.messenger.unsubscribeAll();
    }

    private onDashboardStateChange(eventMessage: { dashboard: Dashboard }): void {
        // If the dashboard state is changed by an external source, update the dropdowns as needed.
        let paths = eventMessage.dashboard.pathFromTop;
        this.dashboardDropdown.selectDashboardChoice(this.dashboards, paths, 0, this.dashboardDropdown);
    }

    /**
     * If selection change event bubbles up from dashboard-dropdown, this will set the
     * dashboardChoice to the appropriate value.
     * @param {any} event
     */
    public setDashboardChoice($event: any) {
        this.dashboardChoice = $event;
    }

    /**
     * Updates the current dashboard state to the selected dashboardChoice.
     */
    public updateDashboardState(dashboard: Dashboard) {
        if (dashboard) {
            this.messenger.publish(neonEvents.DASHBOARD_STATE, {
                dashboard: dashboard
            });
        }
    }
}
