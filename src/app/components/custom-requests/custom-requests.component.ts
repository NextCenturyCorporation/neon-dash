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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import { DashboardState } from '../../models/dashboard-state';
import { NeonCustomRequests } from '../../models/types';

import * as yaml from 'js-yaml';

@Component({
    selector: 'app-custom-requests',
    templateUrl: 'custom-requests.component.html',
    styleUrls: ['custom-requests.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomRequestsComponent {
    public loading: boolean = true;
    public requests: NeonCustomRequests[] = [];
    public readonly dashboardState: DashboardState;

    constructor(
        private changeDetection: ChangeDetectorRef,
        private dashboardService: DashboardService,
        private http: HttpClient
    ) {
        this.dashboardState = this.retrieveDashboardState(this.dashboardService);
        this.updateRequests(this.dashboardState);
        this.watchDashboardStateChanges();
    }

    protected buildRequest(type: string, endpoint: string, data: Record<string, string>): Observable<Record<string, any>> {
        if (type.toUpperCase() === 'DELETE') {
            return this.http.delete(endpoint);
        }

        // Assume GET if type is undefined and data does not contain properties.
        if (type.toUpperCase() === 'GET' || (!type && !Object.keys(data).length)) {
            return this.http.get(endpoint);
        }

        // Assume POST if type is undefined and data contains properties.
        if (type.toUpperCase() === 'POST' || (!type && Object.keys(data).length)) {
            return this.http.post<Record<string, string>>(endpoint, data);
        }

        if (type.toUpperCase() === 'PUT') {
            return this.http.put<Record<string, string>>(endpoint, data);
        }

        return null;
    }

    deleteData(request: NeonCustomRequests): void {
        request.status = undefined;
        request.response = undefined;
        (request.properties || []).forEach((property) => {
            property.value = undefined;
        });
    }

    isValidRequestBody(request: NeonCustomRequests): boolean {
        return (request.properties || []).every((property) => !!property.value);
    }

    isValidUserInput(request: NeonCustomRequests): boolean {
        return !!(request.properties || []).length && request.properties.some((property) => !!property.value);
    }

    protected retrieveDashboardState(dashboardService: DashboardService): DashboardState {
        return dashboardService.state;
    }

    retrieveResponse(request: NeonCustomRequests): any {
        return request.response ? yaml.safeDump(request.response) : '';
    }

    protected runRequest(
        observable: Observable<Record<string, any>>,
        onSuccess: (response: any) => void,
        onFailure: (error: any) => void
    ): void {
        observable.subscribe(onSuccess, onFailure);
    }

    submitData(request: NeonCustomRequests): void {
        let bodyData: Record<string, string> = (request.properties || []).reduce((data, property) => {
            data[property.name] = property.value;
            return data;
        }, {});

        let httpObservable: Observable<Record<string, any>> = this.buildRequest(request.type || '', request.endpoint, bodyData);

        if (httpObservable) {
            request.status = 'Loading...';
            this.runRequest(httpObservable, (response: any) => {
                request.status = 'Successful';
                request.response = response;
                this.changeDetection.detectChanges();
            }, (error: any) => {
                request.status = 'Failed';
                request.response = error.message;
                this.changeDetection.detectChanges();
            });
        } else {
            request.status = 'Dashboard Error';
        }
    }

    protected updateRequests(dashboardState: DashboardState): void {
        this.requests = ((dashboardState.getOptions() || {}).customRequests || []).filter((request) =>
            ((request.type.toUpperCase() === 'PUT' || request.type.toUpperCase() === 'POST' || request.type.toUpperCase() === 'GET' ||
                request.type.toUpperCase() === 'DELETE') && request.endpoint && request.pretty));
        this.loading = false;
    }

    protected watchDashboardStateChanges(): void {
        this.dashboardService.stateSource.subscribe((dashboardState) => {
            this.updateRequests(dashboardState);
            this.changeDetection.detectChanges();
        });
    }
}
