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

import { DateUtil, DateFormat } from '@caci-critical-insight-solutions/nucleus-core';
function buildDate(){
    let okDate: string = new Date().toISOString();
    let bDate: string = DateUtil.retrievePastTime(okDate, DateFormat.MINUTE);
    return bDate;
}

export const environment = {
    config: ['./app/config/config.yaml', './app/config/config.json'],
    production: false,
    buildDate: buildDate(),
    recentGit: 'HEAD'
};
