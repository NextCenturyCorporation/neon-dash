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

@Injectable()
export class TranslationService {

    private apis: {};
    private chosenApi: string;
    private translationCache: {};

    constructor(@Inject('config') private config: NeonGTDConfig, private connectionService: ConnectionService,
        private http: Http) {
        this.apis = {
            google: {
                base: 'https://www.googleapis.com/language/translate/v2',
                key: (this.config.dashboard.translationKeys) ? this.config.dashboard.translationKeys.google : undefined,
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
    setService(serviceName: string, successCallback?: (resp: any) => any, failureCallback?: (resp: any) => any) {
        this.chosenApi = serviceName;

        if (!this.apis[this.chosenApi].key) {
            if (failureCallback) {
                failureCallback({
                    message: 'No key available',
                    reason: 'No key set for ' + this.chosenApi
                });
            }
        } else if (!this.apis[this.chosenApi].languages || _.keys(this.apis[this.chosenApi].languages).length === 0) {
            this.setSupportedLanguages().then(successCallback, failureCallback);
        } else {
            if (successCallback) {
                successCallback(null);
            }
        }
    }

    /**
     * Returns all the available translation services.
     * @method getAllServices
     * @return {Array} List of all the translation services.
     */
    getAllServices(): string[] {
        return _.keys(this.apis);
    }

    /**
     * If the service being used has an API key.
     * @method hasKey
     * @return {Boolean} True if there is an API key being used, false otherwise.
     */
    hasKey(): boolean {
        return this.apis[this.chosenApi].key ? true : false;
    }

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
    translate(text: string[], to: string, successCallback: (resp: any) => any, failureCallback: (resp: any) => any, from?: string) {
        if (!this.apis[this.chosenApi].key) {
            failureCallback({
                message: 'Key not provided',
                reason: 'Key not provided'
            });
        } else if (!text.length) {
            failureCallback({
                message: 'No text provided',
                reason: 'No text provided'
            });
        } else {
            this.translationCache[to] = this.translationCache[to] || {};

            let translateCallback = (): Promise<{}> => {
                let params = this.apis[this.chosenApi].params.key + '=' + this.apis[this.chosenApi].key;

                this.apis[this.chosenApi].params.other.forEach((param) => {
                    params += '&' + param;
                });

                let cached = [];

                text.forEach((elem) => {
                    if (this.translationCache[to][elem]) {
                        // Add a blank parameter so their indicies match the indices of the list of cached translations.
                        params += '&' + this.apis[this.chosenApi].params.text + '=';
                        cached.push(this.translationCache[to][elem]);
                    } else {
                        params += '&' + this.apis[this.chosenApi].params.text + '=' + encodeURIComponent(elem);
                        // Add a blank element to the list of cached translations so its indices match the indices of the parameters.
                        cached.push('');
                    }
                });

                if (!to || !this.apis[this.chosenApi].languages[to]) {
                    return Promise.reject({
                        message: 'Unknown target language',
                        reason: 'Unknown target language'
                    });
                }

                params += '&' + this.apis[this.chosenApi].params.to + '=' + to;

                // If no 'from' (source) language is given, each text is auto-detected individually.
                // If it does exist, check that the language code is in the set of supported languages
                if (from && !this.apis[this.chosenApi].languages[from]) {
                    return Promise.reject({
                        message: 'Unknown source language',
                        reason: 'Unknown source language'
                    });
                } else if (from) {
                    params += '&' + this.apis[this.chosenApi].params.from + '=' + from;
                }

                return this.http.get(this.apis[this.chosenApi].base + this.apis[this.chosenApi].methods.translate + '?' + params)
                    .toPromise()
                    .then((response) => {
                        // Cache the translations for later use.
                        this.getResponseData(response).data.translations.forEach((item, index) => {
                            if (!cached[index]) {
                                this.translationCache[to][text[index]] = item.translatedText;
                            }
                        });
                        // Add the cached translations in the response data for the callback.
                        cached.forEach((item, index) => {
                            if (item) {
                                this.getResponseData(response).data.translations[index].translatedText = item;
                            }
                        });
                        return response;
                    })
                    .catch((response) =>
                        Observable.throw({
                            message: response.data.error.message,
                            reason: this.concatErrorResponses(response.data.error.errors)
                        })
                    );
            };

            if (!this.apis[this.chosenApi].languages || _.keys(this.apis[this.chosenApi].languages).length === 0) {
                this.setSupportedLanguages().then(
                    () => translateCallback().then(successCallback, failureCallback),
                    failureCallback
                );
            } else {
                translateCallback().then(successCallback, failureCallback);
            }
        }
    }

    /**
     * Saves the translation cache by sending it to the Neon server.
     * @method saveTranslationCache
     */
    saveTranslationCache() {
        let connection = this.connectionService.getActiveConnection();
        if (connection) {
            connection.setTranslationCache(this.translationCache, () => {
                // TODO
            });
        }
    }

    /**
     * Retrieves all languages supported by the default translation service.
     * @param {Function} successCallback
     * @param {Function} failureCallback
     * @method getSupportedLanguages
     */
    getSupportedLanguages(successCallback: (resp: any) => any, failureCallback: (resp: any) => any) {
        if (!this.apis[this.chosenApi].languages || _.keys(this.apis[this.chosenApi].languages).length === 0) {
            this.setSupportedLanguages().then(successCallback, failureCallback);
        } else {
            successCallback(this.apis[this.chosenApi].languages);
        }
    }

    /**
     * Retrieves and sets all languages supported by the default translation service.
     * @method setSupportedLanguages
     * @return {Promise}
     * @private
     */
    private setSupportedLanguages(): Promise<{}> {
        let params = this.apis[this.chosenApi].params.key + '=' + this.apis[this.chosenApi].key +
            '&' + this.apis[this.chosenApi].params.to + '=en';

        return this.http.get(this.apis[this.chosenApi].base + this.apis[this.chosenApi].methods.languages + '?' + params)
            .toPromise()
            .then((response) => {
                _.forEach(this.getResponseData(response).data.languages, (elem: any) => {
                    this.apis[this.chosenApi].languages[elem.language] = elem.name;
                });
                return this.apis[this.chosenApi].languages;
            })
            .catch((error) => Observable.throw({
                message: error.data.error.message,
                reason: this.concatErrorResponses(error.data.error.errors)
            }));
    }

    /**
     * Helper method to combine a list of errors and their reasons into one string.
     * @param {Array} errors Array of errors containing reasons for the error.
     * @method concatErrorResponses
     * @return {String} All the error reasons in one string.
     * @private
     */
    private concatErrorResponses(errors: { reason: string }[]): string {
        let reasons = 'Reasons:\n';
        _.forEach(errors, (error) => {
            reasons += error.reason + '\n';
        });
        return reasons;
    }

    /**
     * Loads the translation cache by asking the Neon server.
     * @method loadTranslationCache
     * @private
     */
    private loadTranslationCache() {
        let connection = this.connectionService.getActiveConnection();
        if (connection) {
            connection.getTranslationCache((response) => {
                this.translationCache = JSON.parse(response);
            });
        }
    }

    /**
     * Returns the data in the given response object.
     *
     * @arg {object} response
     * @return {array}
     * @private
     */
    private getResponseData(response: any) {
        /* tslint:disable:no-string-literal */
        return response['data'];
        /* tslint:enable:no-string-literal */
    }
}
