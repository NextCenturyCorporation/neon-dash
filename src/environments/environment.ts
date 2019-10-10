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
function buildDate(){
    var bDate: string = new Date().toUTCString();
    var bDate_split = bDate.split(" ");
    var emptyDate = '';
    var retDate = emptyDate.concat(bDate_split[2], '. ', bDate_split[1], ', ', bDate_split[3], ', ', bDate_split[4], ' ', bDate_split[5])
    return retDate;
}

export const environment = {
    config: ['./app/config/config.yaml', './app/config/config.json'],
    production: false,
    buildDate: buildDate(),
    recentGit: 'HEAD'
};
