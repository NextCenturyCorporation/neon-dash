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
import { Injectable, Inject } from '@angular/core';
import { Http, RequestOptionsArgs, Headers  } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { NeonGTDConfig } from '../neon-gtd-config';
import { ConnectionService } from './connection.service';

@Injectable()
export class PropertyService {
    baseUrl: string;

    constructor(private http: Http) {
        this.http = http;
        this.baseUrl = '/neon/services/propertyservice/';
    }

    /**
     * Sets the a given property.
     * @param {String} propertyName Name of property
     * @param {String} value String representation of property value
     * @param {Function} successCallback
     * @param {Function} failureCallback
     * @method setProperty
     */
    setProperty(propertyName: string, value: string, successCallback?: (resp: any) => any, failureCallback?: (resp: any) => any) {
        let h: Headers = new Headers();
        h.append('content-type', 'text/plain');
        return this.http.post(this.baseUrl + propertyName, value, {
            headers: h
        })
          .toPromise().then(successCallback).catch(failureCallback);
    }

    setPropertyJson(propertyName: string, value: object, successCallback?: (resp: any) => any, failureCallback?: (resp: any) => any) {
        return this.setProperty(propertyName, JSON.stringify(value), successCallback, failureCallback);
    }

    /**
     * Gets a string representation of a property
     * @param {String} serviceName Name of the service to set as default.
     * @param {Function} successCallback
     * @param {Function} failureCallback
     * @method getProperty
     */
    getProperty(propertyName: string, successCallback?: (resp: any) => any, failureCallback?: (resp: any) => any) {
         return this.http.get(this.baseUrl + propertyName).toPromise().then(successCallback).catch(failureCallback);
    }

    getPropertyJson(propertyName: string, successCallback?: (resp: any) => any, failureCallback?: (resp: any) => any) {
        return this.http.get(this.baseUrl + propertyName).toPromise().then((resp: any) => {
            try {
              let json = JSON.parse(resp.value);
              successCallback(json);
            } catch (err) {
                failureCallback(resp);
            }
        }).catch(failureCallback);
    }

    /**
     * Sets the default translation service.
     * @param {String} serviceName Name of the service to set as default.
     * @param {Function} successCallback
     * @param {Function} failureCallback
     * @method setService
     */
    deleteProperty(propertyName: string, successCallback?: (resp: any) => any, failureCallback?: (resp: any) => any) {
         return this.http.delete(this.baseUrl + propertyName).toPromise().then(successCallback).catch(failureCallback);
    }

    /**
     * If the service being used has an API key.
     * @method hasKey
     * @return {Boolean} True if there is an API key being used, false otherwise.
     */
    hasProperty(): boolean {
        throw new Error('Not implemented yet');
    }
}
