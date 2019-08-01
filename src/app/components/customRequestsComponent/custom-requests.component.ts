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
import { ChangeDetectionStrategy, Component, OnInit, EventEmitter, Output } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardState } from '../../models/dashboard-state';
import { PropertyMetaData, NeonCustomRequests } from '../../models/types';
import * as _ from 'lodash';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-custom-requests',
    templateUrl: './custom-requests.component.html',
    styleUrls: ['./custom-requests.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomRequestsComponent implements OnInit {
    @Output() closeComponent: EventEmitter<boolean> = new EventEmitter<boolean>();

    public requests: NeonCustomRequests[];
    public frameProperties: PropertyMetaData[] = [];
    public formRequest: PropertyMetaData[] = [];
    public endpoint: string;
    public readonly dashboardState: DashboardState;
    constructor(
        dashboardService: DashboardService,
        private http: HttpClient
    ) {
        this.dashboardState = dashboardService.state;
    }

    onSubmit() {
        this.postData();
    }

    postData() {
        let request = new NeonCustomRequests();
        request.endpoint = this.endpoint;
        request.properties = this.formRequest;
        this.http.post<PropertyMetaData>(this.endpoint, request);
    }

    ngOnInit() {
        this.requests = (this.dashboardState.getOptions() || {}).customRequests;
        if (!_.isEmpty(this.requests)) {
            this.frameProperties = this.requests[0].properties;
            this.endpoint = this.requests[0].endpoint;
        }
        this.formRequest = this.frameProperties;
    }

    /**
     * Emits an event to close the component.
     */
    public emitCloseComponent() {
        this.closeComponent.emit(true);
    }
}
