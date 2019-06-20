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
import { browser } from 'protractor';

/* eslint-disable no-invalid-this */
export class NeonGtdPage {
    goTo(path = '/') {
        return browser.get(path);
    }
}

export const root = 'app-dashboard';
export const toolbar = `${root} mat-toolbar`;
export const toolbarTitle = `${toolbar} .dashboard-name`;
