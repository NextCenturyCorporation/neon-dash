var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
import { Injectable, Inject } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { NeonGTDConfig } from '../neon-gtd-config';
import { ConnectionService } from './connection.service';
var TranslationService = /** @class */ (function () {
    function TranslationService(config, connectionService, http) {
        this.config = config;
        this.connectionService = connectionService;
        this.http = http;
        this.apis = {
            google: {
                base: 'https://www.googleapis.com/language/translate/v2',
                key: (this.config.translationKeys) ? this.config.translationKeys.google : undefined,
                methods: {
                    translate: '',
                    detect: '/detect',
                    languages: '/languages'
                },
                params: {
                    key: 'key',
                    from: 'source',
                    to: 'target',
                    text: 'q',
                    other: ['format=text']
                },
                languages: {}
            }
        };
        this.setService('google');
        this.loadTranslationCache();
    }
    /**
     * Sets the default translation service.
     * @param {String} serviceName Name of the service to set as default.
     * @param {Function} successCallback
     * @param {Function} failureCallback
     * @method setService
     */
    TranslationService.prototype.setService = function (serviceName, successCallback, failureCallback) {
        this.chosenApi = serviceName;
        if (!this.apis[this.chosenApi].key) {
            if (failureCallback) {
                failureCallback({
                    message: 'No key available',
                    reason: 'No key set for ' + this.chosenApi
                });
            }
        }
        else if (!this.apis[this.chosenApi].languages || _.keys(this.apis[this.chosenApi].languages).length === 0) {
            this.setSupportedLanguages().then(successCallback, failureCallback);
        }
        else {
            if (successCallback) {
                successCallback(null);
            }
        }
    };
    /**
     * Returns all the available translation services.
     * @method getAllServices
     * @return {Array} List of all the translation services.
     */
    TranslationService.prototype.getAllServices = function () {
        return _.keys(this.apis);
    };
    /**
     * If the service being used has an API key.
     * @method hasKey
     * @return {Boolean} True if there is an API key being used, false otherwise.
     */
    TranslationService.prototype.hasKey = function () {
        return this.apis[this.chosenApi].key ? true : false;
    };
    /**
     * Translates all strings in text with language code specified in 'from' to the language
     * code specified in 'to'. If no 'from' is provided, it will be automatically detected.
     * @param {Array} text List of strings to translate
     * @param {String} to Language code to translate all text to.
     * @param {Function} successCallback
     * @param {Function} failureCallback
     * @param {String} [from] Optional language code that all the text are in. If none is
     * provided then it will be detected for each string individually in the text array.
     * @method translate
     */
    TranslationService.prototype.translate = function (text, to, successCallback, failureCallback, from) {
        var _this = this;
        if (!this.apis[this.chosenApi].key) {
            failureCallback({
                message: 'Key not provided',
                reason: 'Key not provided'
            });
        }
        else if (!text.length) {
            failureCallback({
                message: 'No text provided',
                reason: 'No text provided'
            });
        }
        else {
            this.translationCache[to] = this.translationCache[to] || {};
            var translateCallback_1 = function () {
                var params = _this.apis[_this.chosenApi].params.key + '=' + _this.apis[_this.chosenApi].key;
                _this.apis[_this.chosenApi].params.other.forEach(function (param) {
                    params += '&' + param;
                });
                var cached = [];
                text.forEach(function (elem) {
                    if (_this.translationCache[to][elem]) {
                        // Add a blank parameter so their indicies match the indices of the list of cached translations.
                        params += '&' + _this.apis[_this.chosenApi].params.text + '=';
                        cached.push(_this.translationCache[to][elem]);
                    }
                    else {
                        params += '&' + _this.apis[_this.chosenApi].params.text + '=' + encodeURIComponent(elem);
                        // Add a blank element to the list of cached translations so its indices match the indices of the parameters.
                        cached.push('');
                    }
                });
                if (!to || !_this.apis[_this.chosenApi].languages[to]) {
                    return Promise.reject({
                        message: 'Unknown target language',
                        reason: 'Unknown target language'
                    });
                }
                params += '&' + _this.apis[_this.chosenApi].params.to + '=' + to;
                // If no 'from' (source) language is given, each text is auto-detected individually.
                // If it does exist, check that the language code is in the set of supported languages
                if (from && !_this.apis[_this.chosenApi].languages[from]) {
                    return Promise.reject({
                        message: 'Unknown source language',
                        reason: 'Unknown source language'
                    });
                }
                else if (from) {
                    params += '&' + _this.apis[_this.chosenApi].params.from + '=' + from;
                }
                var self = _this;
                return _this.http.get(_this.apis[_this.chosenApi].base + _this.apis[_this.chosenApi].methods.translate + '?' + params)
                    .toPromise()
                    .then(function (response) {
                    // Cache the translations for later use.
                    self.getResponseData(response).data.translations.forEach(function (item, index) {
                        if (!cached[index]) {
                            _this.translationCache[to][text[index]] = item.translatedText;
                        }
                    });
                    // Add the cached translations in the response data for the callback.
                    cached.forEach(function (item, index) {
                        if (item) {
                            self.getResponseData(response).data.translations[index].translatedText = item;
                        }
                    });
                    return response;
                })
                    .catch(function (response) {
                    return Observable.throw({
                        message: response.data.error.message,
                        reason: _this.concatErrorResponses(response.data.error.errors)
                    });
                });
            };
            if (!this.apis[this.chosenApi].languages || _.keys(this.apis[this.chosenApi].languages).length === 0) {
                this.setSupportedLanguages().then(function () { return translateCallback_1().then(successCallback, failureCallback); }, failureCallback);
            }
            else {
                translateCallback_1().then(successCallback, failureCallback);
            }
        }
    };
    /**
     * Saves the translation cache by sending it to the Neon server.
     * @method saveTranslationCache
     */
    TranslationService.prototype.saveTranslationCache = function () {
        var connection = this.connectionService.getActiveConnection();
        if (connection) {
            connection.setTranslationCache(this.translationCache, function () {
                // TODO
            });
        }
    };
    /**
     * Retrieves all languages supported by the default translation service.
     * @param {Function} successCallback
     * @param {Function} failureCallback
     * @method getSupportedLanguages
     */
    TranslationService.prototype.getSupportedLanguages = function (successCallback, failureCallback) {
        if (!this.apis[this.chosenApi].languages || _.keys(this.apis[this.chosenApi].languages).length === 0) {
            this.setSupportedLanguages().then(successCallback, failureCallback);
        }
        else {
            successCallback(this.apis[this.chosenApi].languages);
        }
    };
    /**
     * Retrieves and sets all languages supported by the default translation service.
     * @method setSupportedLanguages
     * @return {Promise}
     * @private
     */
    TranslationService.prototype.setSupportedLanguages = function () {
        var _this = this;
        var params = this.apis[this.chosenApi].params.key + '=' + this.apis[this.chosenApi].key +
            '&' + this.apis[this.chosenApi].params.to + '=en';
        var self = this;
        return this.http.get(this.apis[this.chosenApi].base + this.apis[this.chosenApi].methods.languages + '?' + params)
            .toPromise()
            .then(function (response) {
            _.forEach(self.getResponseData(response).data.languages, function (elem) {
                _this.apis[_this.chosenApi].languages[elem.language] = elem.name;
            });
            return _this.apis[_this.chosenApi].languages;
        })
            .catch(function (error) { return Observable.throw({
            message: error.data.error.message,
            reason: _this.concatErrorResponses(error.data.error.errors)
        }); });
    };
    /**
     * Helper method to combine a list of errors and their reasons into one string.
     * @param {Array} errors Array of errors containing reasons for the error.
     * @method concatErrorResponses
     * @return {String} All the error reasons in one string.
     * @private
     */
    TranslationService.prototype.concatErrorResponses = function (errors) {
        var reasons = 'Reasons:\n';
        _.forEach(errors, function (error) {
            reasons += error.reason + '\n';
        });
        return reasons;
    };
    /**
     * Loads the translation cache by asking the Neon server.
     * @method loadTranslationCache
     * @private
     */
    TranslationService.prototype.loadTranslationCache = function () {
        var _this = this;
        var connection = this.connectionService.getActiveConnection();
        if (connection) {
            connection.getTranslationCache(function (response) {
                _this.translationCache = JSON.parse(response);
            });
        }
    };
    /**
     * Returns the data in the given response object.
     *
     * @arg {object} response
     * @return {array}
     * @private
     */
    TranslationService.prototype.getResponseData = function (response) {
        /* tslint:disable:no-string-literal */
        return response['data'];
        /* tslint:enable:no-string-literal */
    };
    TranslationService = __decorate([
        Injectable(),
        __param(0, Inject('config')),
        __metadata("design:paramtypes", [NeonGTDConfig, ConnectionService,
            Http])
    ], TranslationService);
    return TranslationService;
}());
export { TranslationService };
//# sourceMappingURL=translation.service.js.map