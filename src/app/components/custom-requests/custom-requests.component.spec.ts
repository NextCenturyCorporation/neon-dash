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
import { NeonCustomRequests } from '../../models/types';

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
        expect(component.requests.length).toEqual(4);
        expect(component.requests[0]).toEqual({
            type: 'delete',
            endpoint: 'http://test/delete',
            pretty: 'Test Delete'
        });
        expect(component.requests[1]).toEqual({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get'
        });
        expect(component.requests[2].type).toEqual('post');
        expect(component.requests[2].endpoint).toEqual('http://test/post');
        expect(component.requests[2].pretty).toEqual('Test Post');
        expect(component.requests[2].properties.length).toEqual(2);
        expect(component.requests[2].properties[0].name).toEqual('one');
        expect(component.requests[2].properties[0].pretty).toEqual('One');
        expect(component.requests[2].properties[0].angularFormControl).toBeDefined();
        expect(component.requests[2].properties[1].name).toEqual('two');
        expect(component.requests[2].properties[1].pretty).toEqual('Two');
        expect(component.requests[2].properties[1].angularFormControl).toBeDefined();
        expect(component.requests[3].type).toEqual('put');
        expect(component.requests[3].endpoint).toEqual('http://test/put');
        expect(component.requests[3].pretty).toEqual('Test Put');
        expect(component.requests[3].properties.length).toEqual(1);
        expect(component.requests[3].properties[0].name).toEqual('data');
        expect(component.requests[3].properties[0].pretty).toEqual('Data');
        expect(component.requests[3].properties[0].angularFormControl).toBeDefined();
    });

    it('createLabel does return expected string', () => {
        expect(component.createLabel({
            name: 'whatever',
            pretty: 'Whatever'
        })).toEqual('Whatever (Required, Text)');
        expect(component.createLabel({
            name: 'whatever',
            pretty: 'Whatever',
            disabled: true
        })).toEqual('Whatever (Pre-Configured, Text)');
        expect(component.createLabel({
            name: 'whatever',
            pretty: 'Whatever',
            optional: true
        })).toEqual('Whatever (Optional, Text)');

        expect(component.createLabel({
            json: true,
            name: 'whatever',
            pretty: 'Whatever'
        })).toEqual('Whatever (Required, JSON)');
        expect(component.createLabel({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            disabled: true
        })).toEqual('Whatever (Pre-Configured, JSON)');
        expect(component.createLabel({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            optional: true
        })).toEqual('Whatever (Optional, JSON)');

        expect(component.createLabel({
            number: true,
            name: 'whatever',
            pretty: 'Whatever'
        })).toEqual('Whatever (Required, Number)');
        expect(component.createLabel({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            disabled: true
        })).toEqual('Whatever (Pre-Configured, Number)');
        expect(component.createLabel({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            optional: true
        })).toEqual('Whatever (Optional, Number)');

        expect(component.createLabel({
            choices: [],
            name: 'whatever',
            pretty: 'Whatever'
        })).toEqual('Whatever');
    });

    it('createPlaceholder does return expected string', () => {
        expect(component.createPlaceholder({
            name: 'whatever',
            pretty: 'Whatever'
        })).toEqual('Enter Your Text Input');

        expect(component.createPlaceholder({
            json: true,
            name: 'whatever',
            pretty: 'Whatever'
        })).toEqual('Enter Your JSON Input');

        expect(component.createPlaceholder({
            number: true,
            name: 'whatever',
            pretty: 'Whatever'
        })).toEqual('Enter Your Number Input');
    });

    it('deleteData does delete request status, response, and property array values', () => {
        let request = {
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
        } as NeonCustomRequests;

        component.deleteData(request);
        expect(request).toEqual({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                name: 'one',
                pretty: 'One',
                value: undefined
            }, {
                name: 'two',
                pretty: 'Two',
                value: undefined
            }],
            status: undefined,
            response: undefined
        });
    });

    it('deleteData does not error if request does not have properties', () => {
        let request = {
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get'
        } as NeonCustomRequests;

        component.deleteData(request);
        expect(request).toEqual({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get',
            status: undefined,
            response: undefined
        });
    });

    it('doesHaveProperties does return expected boolean', () => {
        expect(component.doesHaveProperties({
            endpoint: 'http://endpoint',
            pretty: 'Endpoint',
            properties: []
        })).toEqual(false);

        expect(component.doesHaveProperties({
            endpoint: 'http://endpoint',
            pretty: 'Endpoint',
            properties: [{
                name: 'whatever',
                pretty: 'Whatever'
            }]
        })).toEqual(true);
    });

    it('isValidJsonValue does return expected boolean', () => {
        expect(component.isValidJsonValue('1')).toEqual(true);
        expect(component.isValidJsonValue('"string"')).toEqual(true);
        expect(component.isValidJsonValue('[]')).toEqual(true);
        expect(component.isValidJsonValue('["string", 1]')).toEqual(true);
        expect(component.isValidJsonValue('{}')).toEqual(true);
        expect(component.isValidJsonValue('{"propertyA":"string","propertyB":1}')).toEqual(true);

        expect(component.isValidJsonValue('string')).toEqual(false);
        expect(component.isValidJsonValue('"string",1')).toEqual(false);
        expect(component.isValidJsonValue('["string"')).toEqual(false);
        expect(component.isValidJsonValue('{"key":"value"')).toEqual(false);
        expect(component.isValidJsonValue('{"key"}')).toEqual(false);
        expect(component.isValidJsonValue('{{}}')).toEqual(false);
    });

    it('isValidNumberValue does return expected boolean', () => {
        expect(component.isValidNumberValue('0')).toEqual(true);
        expect(component.isValidNumberValue('1')).toEqual(true);
        expect(component.isValidNumberValue('1234')).toEqual(true);
        expect(component.isValidNumberValue('0.1234')).toEqual(true);
        expect(component.isValidNumberValue('12.34')).toEqual(true);
        expect(component.isValidNumberValue('-1')).toEqual(true);

        expect(component.isValidNumberValue('string')).toEqual(false);
        expect(component.isValidNumberValue('one')).toEqual(false);
        expect(component.isValidNumberValue('1,234')).toEqual(false);
        expect(component.isValidNumberValue('123abc')).toEqual(false);
    });

    it('isValidRequestBody does return false if not all request properties have values', () => {
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

    it('isValidRequestBody does return true if all request properties have values', () => {
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
            pretty: 'Test Get'
        })).toEqual(true);
    });

    it('isValidRequestBody does validate JSON property data', () => {
        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                json: true,
                name: 'one',
                pretty: 'One',
                value: '{"key":"value"' // Missing bracket
            }]
        })).toEqual(false);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                json: true,
                name: 'one',
                pretty: 'One',
                value: '{"key":"value"}'
            }]
        })).toEqual(true);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                json: true,
                name: 'one',
                pretty: 'One',
                value: '{"key":"value"' // Missing bracket
            }, {
                json: true,
                name: 'two',
                pretty: 'Two',
                value: '{"key":"value"}'
            }]
        })).toEqual(false);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                json: true,
                name: 'one',
                pretty: 'One',
                value: '{}'
            }, {
                json: true,
                name: 'two',
                pretty: 'Two',
                value: '{"key":"value"}'
            }]
        })).toEqual(true);
    });

    it('isValidRequestBody does validate number property data', () => {
        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                number: true,
                name: 'one',
                pretty: 'One',
                value: 'string'
            }]
        })).toEqual(false);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                number: true,
                name: 'one',
                pretty: 'One',
                value: '1234'
            }]
        })).toEqual(true);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                number: true,
                name: 'one',
                pretty: 'One',
                value: 'string'
            }, {
                json: true,
                name: 'two',
                pretty: 'Two',
                value: '1234'
            }]
        })).toEqual(false);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                number: true,
                name: 'one',
                pretty: 'One',
                value: '0'
            }, {
                json: true,
                name: 'two',
                pretty: 'Two',
                value: '1234'
            }]
        })).toEqual(true);
    });

    it('isValidRequestBody does ignore invalid optional properties', () => {
        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                optional: true,
                name: 'one',
                pretty: 'One',
                value: undefined
            }]
        })).toEqual(true);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                optional: true,
                json: true,
                name: 'one',
                pretty: 'One',
                value: '{'
            }]
        })).toEqual(true);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                optional: true,
                number: true,
                name: 'one',
                pretty: 'One',
                value: 'string'
            }]
        })).toEqual(true);

        expect(component.isValidRequestBody({
            type: 'post',
            endpoint: 'http://test/post',
            pretty: 'Test Post',
            properties: [{
                name: 'one',
                pretty: 'One',
                value: undefined
            }, {
                optional: true,
                name: 'two',
                pretty: 'Two',
                value: undefined
            }]
        })).toEqual(false);
    });

    it('isValidRequestBody does return boolean', () => {
        expect(component.isValidRequestObject({
            endpoint: 'http://endpoint',
            pretty: 'Endpoint',
            type: 'put'
        })).toEqual(true);
        expect(component.isValidRequestObject({
            endpoint: 'http://endpoint',
            pretty: 'Endpoint',
            type: 'post'
        })).toEqual(true);
        expect(component.isValidRequestObject({
            endpoint: 'http://endpoint',
            pretty: 'Endpoint',
            type: 'get'
        })).toEqual(true);
        expect(component.isValidRequestObject({
            endpoint: 'http://endpoint',
            pretty: 'Endpoint',
            type: 'delete'
        })).toEqual(true);
        expect(component.isValidRequestObject({
            endpoint: 'http://endpoint',
            pretty: 'Endpoint'
        })).toEqual(true);

        expect(component.isValidRequestObject({
            endpoint: null,
            pretty: 'Endpoint',
            type: 'get'
        })).toEqual(false);
        expect(component.isValidRequestObject({
            endpoint: 'http://endpoint',
            pretty: null,
            type: 'get'
        })).toEqual(false);
        expect(component.isValidRequestObject({
            endpoint: 'http://endpoint',
            pretty: 'Endpoint',
            type: 'string'
        })).toEqual(false);
    });

    it('isValidUserInput does return false if no request properties have values', () => {
        expect(component.isValidUserInput({
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
    });

    it('isValidUserInput does return true if some request properties have values', () => {
        expect(component.isValidUserInput({
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
        })).toEqual(true);

        expect(component.isValidUserInput({
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

    it('isValidUserInput does return false if request does not have properties', () => {
        expect(component.isValidUserInput({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get'
        })).toEqual(false);
    });

    it('retrieveRequestValue given string data does return expected object', () => {
        expect(component.retrieveRequestValue({
            name: 'whatever',
            pretty: 'Whatever',
            value: ''
        })).toEqual('');
        expect(component.retrieveRequestValue({
            name: 'whatever',
            pretty: 'Whatever',
            value: 'string'
        })).toEqual('string');
        expect(component.retrieveRequestValue({
            name: 'whatever',
            pretty: 'Whatever',
            value: 'one fish two fish red fish blue fish'
        })).toEqual('one fish two fish red fish blue fish');
        expect(component.retrieveRequestValue({
            name: 'whatever',
            pretty: 'Whatever',
            value: '1'
        })).toEqual('1');
    });

    it('retrieveRequestValue given JSON data does return expected object', () => {
        expect(component.retrieveRequestValue({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: 'string'
        })).toEqual(null);
        expect(component.retrieveRequestValue({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '"string",1'
        })).toEqual(null);
        expect(component.retrieveRequestValue({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '["string"'
        })).toEqual(null);
        expect(component.retrieveRequestValue({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '{"key":"value"'
        })).toEqual(null);

        expect(component.retrieveRequestValue({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '"string"'
        })).toEqual('string');
        expect(component.retrieveRequestValue({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '1'
        })).toEqual(1);
        expect(component.retrieveRequestValue({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '["string",1]'
        })).toEqual(['string', 1]);
        expect(component.retrieveRequestValue({
            json: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '{"propertyA":"string","propertyB":1}'
        })).toEqual({ propertyA: 'string', propertyB: 1 });
    });

    it('retrieveRequestValue given number data does return expected object', () => {
        expect(component.retrieveRequestValue({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: 'string'
        })).toEqual(null);
        expect(component.retrieveRequestValue({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: 'one'
        })).toEqual(null);
        expect(component.retrieveRequestValue({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '1,234'
        })).toEqual(null);
        expect(component.retrieveRequestValue({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '123abc'
        })).toEqual(null);

        expect(component.retrieveRequestValue({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '0'
        })).toEqual(0);
        expect(component.retrieveRequestValue({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '1'
        })).toEqual(1);
        expect(component.retrieveRequestValue({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '12.34'
        })).toEqual(12.34);
        expect(component.retrieveRequestValue({
            number: true,
            name: 'whatever',
            pretty: 'Whatever',
            value: '-1'
        })).toEqual(-1);
    });

    it('retrieveResponse does return response as string', () => {
        expect(component.retrieveResponse({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get',
            response: 'Test Response'
        })).toEqual('Test Response\n');

        expect(component.retrieveResponse({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get',
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
            pretty: 'Test Get'
        })).toEqual('');
    });

    it('submitData does call buildRequest and runRequest', () => {
        let observable = new Observable<Record<string, any>>();
        let spyBuild = component.createSpy('buildRequest').and.returnValue(observable);
        let spyRun = component.createSpy('runRequest');

        component.submitData({
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get'
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

    it('submitData with date does add date to request property values', () => {
        let observable = new Observable<Record<string, any>>();
        let spyBuild = component.createSpy('buildRequest').and.returnValue(observable);
        let spyRun = component.createSpy('runRequest');

        component.submitData({
            type: 'post',
            endpoint: 'http://test/post',
            date: 'testDate',
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
        let args = spyBuild.calls.argsFor(0);
        expect(args[0]).toEqual('post');
        expect(args[1]).toEqual('http://test/post');
        expect(Object.keys(args[2]).length).toEqual(3);
        expect(args[2].one).toEqual('a');
        expect(args[2].two).toEqual('b');
        expect(args[2].testDate).toBeDefined();
        expect(spyRun.calls.count()).toEqual(1);
    });

    it('submitData with id does add id to request property values', () => {
        let observable = new Observable<Record<string, any>>();
        let spyBuild = component.createSpy('buildRequest').and.returnValue(observable);
        let spyRun = component.createSpy('runRequest');

        component.submitData({
            type: 'post',
            endpoint: 'http://test/post',
            id: 'testId',
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
        let args = spyBuild.calls.argsFor(0);
        expect(args[0]).toEqual('post');
        expect(args[1]).toEqual('http://test/post');
        expect(Object.keys(args[2]).length).toEqual(3);
        expect(args[2].one).toEqual('a');
        expect(args[2].two).toEqual('b');
        expect(args[2].testId).toBeDefined();
        expect(spyRun.calls.count()).toEqual(1);
    });

    it('toggleResponse does update showResponse', () => {
        let request = {
            type: 'get',
            endpoint: 'http://test/get',
            pretty: 'Test Get'
        } as NeonCustomRequests;

        component.toggleResponse(request);
        expect(request.showResponse).toEqual(true);

        component.toggleResponse(request);
        expect(request.showResponse).toEqual(false);
    });
});

