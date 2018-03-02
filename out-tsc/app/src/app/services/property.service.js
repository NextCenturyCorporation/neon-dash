var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
var PropertyService = /** @class */ (function () {
    function PropertyService(http) {
        this.http = http;
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
    PropertyService.prototype.setProperty = function (propertyName, value, successCallback, failureCallback) {
        var h = new Headers();
        h.append('content-type', 'text/plain');
        return this.http.post(this.baseUrl + propertyName, value, {
            headers: h
        })
            .toPromise().then(successCallback).catch(failureCallback);
    };
    PropertyService.prototype.setPropertyJson = function (propertyName, value, successCallback, failureCallback) {
        return this.setProperty(propertyName, JSON.stringify(value), successCallback, failureCallback);
    };
    /**
     * Gets a string representation of a property
     * @param {String} serviceName Name of the service to set as default.
     * @param {Function} successCallback
     * @param {Function} failureCallback
     * @method getProperty
     */
    PropertyService.prototype.getProperty = function (propertyName, successCallback, failureCallback) {
        return this.http.get(this.baseUrl + propertyName).toPromise().then(successCallback).catch(failureCallback);
    };
    PropertyService.prototype.getPropertyJson = function (propertyName, successCallback, failureCallback) {
        return this.http.get(this.baseUrl + propertyName).toPromise().then(function (resp) {
            try {
                var json = JSON.parse(resp.value);
                successCallback(json);
            }
            catch (err) {
                failureCallback(resp);
            }
        }).catch(failureCallback);
    };
    /**
     * Sets the default translation service.
     * @param {String} serviceName Name of the service to set as default.
     * @param {Function} successCallback
     * @param {Function} failureCallback
     * @method setService
     */
    PropertyService.prototype.deleteProperty = function (propertyName, successCallback, failureCallback) {
        return this.http.delete(this.baseUrl + propertyName).toPromise().then(successCallback).catch(failureCallback);
    };
    /**
     * If the service being used has an API key.
     * @method hasKey
     * @return {Boolean} True if there is an API key being used, false otherwise.
     */
    PropertyService.prototype.hasProperty = function () {
        throw new Error('Not implemented yet');
    };
    PropertyService = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [Http])
    ], PropertyService);
    return PropertyService;
}());
export { PropertyService };
//# sourceMappingURL=property.service.js.map