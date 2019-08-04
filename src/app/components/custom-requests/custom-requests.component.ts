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
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { DashboardService } from '../../services/dashboard.service';
import { DashboardState } from '../../models/dashboard-state';
import { NeonCustomRequests } from '../../models/types';

@Component({
    selector: 'app-custom-requests',
    templateUrl: 'custom-requests.component.html',
    styleUrls: ['custom-requests.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomRequestsComponent implements OnInit {
    public requests: NeonCustomRequests[];
    public readonly dashboardState: DashboardState;

    constructor(
        dashboardService: DashboardService,
        private http: HttpClient
    ) {
        this.dashboardState = dashboardService.state;
    }

    ngOnInit() {
        this.requests = (this.dashboardState.getOptions() || {}).customRequests || [];
    }

    submit(request: NeonCustomRequests): void {
        this.http.post<Record<string, string>>(request.endpoint, request.properties.reduce((data, property) => {
            data[property.name] = property.value;
            return data;
        }, {})).subscribe((__response: any) => {
            // Do nothing.
        });
    }

    validate(request: NeonCustomRequests): boolean {
        return request.properties.every((property) => !!property.value);
    }
}
