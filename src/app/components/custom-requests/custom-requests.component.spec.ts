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
import { } from 'jasmine-core';

import { ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CustomRequestsComponent } from './custom-requests.component';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardState } from '../../models/dashboard-state';

class TestCustomRequestsComponent extends CustomRequestsComponent {
    public createSpy(name: string): any {
        /* eslint-disable-next-line jasmine/no-unsafe-spy */
        return spyOn(this, name);
    }

    protected retrieveDashboardState(): DashboardState {
        return {
            getOptions: () => ({
                customRequests: [{
                    type: 'delete',
                    endpoint: 'http://test/delete',
                    pretty: 'Test Delete'
                }, {
                    type: 'get',
                    endpoint: 'http://test/get',
                    pretty: 'Test Get'
                }, {
                    type: 'post',
                    endpoint: 'http://test/post',
                    pretty: 'Test Post',
                    properties: [{
                        name: 'one',
                        pretty: 'One'
                    }, {
                        name: 'two',
                        pretty: 'Two'
                    }]
                }, {
                    type: 'put',
                    endpoint: 'http://test/put',
                    pretty: 'Test Put',
                    properties: [{
                        name: 'data',
                        pretty: 'Data'
                    }]
                }, {
                    type: 'bad',
                    endpoint: 'http://test/bad',
                    pretty: 'Test Bad',
                    properties: [{
                        name: 'prop',
                        pretty: 'Prop'
                    }]
                }]
            })
        } as any as DashboardState;
    }

    protected watchDashboardStateChanges(): void {
        // Do nothing.
    }
}

describe('Component: Custom Requests', () => {
    let component: TestCustomRequestsComponent;

    beforeEach(() => {
        let changeDetection = {
            detectChanges: () => {
                // Do nothing.
            }
        } as any as ChangeDetectorRef;
        let dashboardService = {} as any as DashboardService;
        let http = {} as any as HttpClient;
        component = new TestCustomRequestsComponent(changeDetection, dashboardService, http);
    });

    it('class properties are set to expected defaults', () => {
        expect(component.requests).toEqual([{
            type: 'delete',
            endpoint: 'http://test/delete',
            pretty: 'Test Delete'
        }, {
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get'
        }, {
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                name: 'one',
                pretty: 'One'
            }, {
                name: 'two',
                pretty: 'Two'
            }]
        }, {
            type: 'put',
            endpoint: 'http://test/put',
            pretty: 'Test Put',
            properties: [{
                name: 'data',
                pretty: 'Data'
            }]
        }]);
    });

    it('isValidRequestBody does return false if not all properties have values', () => {
        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                name: 'one',
                pretty: 'One'
            }, {
                name: 'two',
                pretty: 'Two'
            }]
        })).toEqual(false);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                name: 'one',
                pretty: 'One',
                value: 'a'
            }, {
                name: 'two',
                pretty: 'Two'
            }]
        })).toEqual(false);
    });

    it('isValidRequestBody does return true if all properties have values', () => {
        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                name: 'one',
                pretty: 'One',
                value: 'a'
            }, {
                name: 'two',
                pretty: 'Two',
                value: 'b'
            }]
        })).toEqual(true);
    });

    it('isValidRequestBody does return true if request does not have properties', () => {
        expect(component.isValidRequestBody({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get',
            properties: []
        })).toEqual(true);
    });

    it('retrieveResponse does return response as string', () => {
        expect(component.retrieveResponse({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get',
            properties: [],
            response: 'Test Response'
        })).toEqual('Test Response\n');

        expect(component.retrieveResponse({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get',
            properties: [],
            response: {
                key1: 'value1',
                key2: 'value2'
            }
        })).toEqual('key1: value1\nkey2: value2\n');
    });

    it('retrieveResponse does return an empty string if response is undefined', () => {
        expect(component.retrieveResponse({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get',
            properties: []
        })).toEqual('');
    });

    it('submitData does call buildRequest and runRequest', () => {
        let observable = new Observable<Record<string, any>>();
        let spyBuild = component.createSpy('buildRequest').and.returnValue(observable);
        let spyRun = component.createSpy('runRequest');

        component.submitData({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get',
            properties: []
        });

        expect(spyBuild.calls.count()).toEqual(1);
        expect(spyBuild.calls.argsFor(0)).toEqual(['get', 'http://test/get', {}]);
        expect(spyRun.calls.count()).toEqual(1);
    });

    it('submitData does call buildRequest and runRequest with request property values', () => {
        let observable = new Observable<Record<string, any>>();
        let spyBuild = component.createSpy('buildRequest').and.returnValue(observable);
        let spyRun = component.createSpy('runRequest');

        component.submitData({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                name: 'one',
                pretty: 'One',
                value: 'a'
            }, {
                name: 'two',
                pretty: 'Two',
                value: 'b'
            }]
        });

        expect(spyBuild.calls.count()).toEqual(1);
        expect(spyBuild.calls.argsFor(0)).toEqual(['post', 'http://test/post', {
            one: 'a',
            two: 'b'
        }]);
        expect(spyRun.calls.count()).toEqual(1);
    });
});

