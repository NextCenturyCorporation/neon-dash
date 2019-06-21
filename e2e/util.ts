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
import './types';
import { $, $$ } from 'protractor';
import { By } from 'selenium-webdriver';

// eslint-disable-next-line no-extend-native
Object.defineProperties(By.prototype, {
    first: {
        get: function(this: By) {
            return $(this['value']);
        }
    },
    all: {
        get: function(this: By) {
            return $$(this['value']);
        }
    },
    asText: {
        get: function(this: By) {
            return this.first.getText();
        }
    },
    nest: {
        get: function() {
            return function(this: By, value: string) {
                // eslint-disable-next-line no-invalid-this
                return By.css(`${this['value']} ${value}`);
            };
        }
    }
});
