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
import { Datastore, Dashboard } from './dataset';

export class NeonGTDConfig {
    projectTitle: string;
    projectIcon: string;
    datastores: Map<string, Datastore> = new Map<string, Datastore>();
    dashboards: Dashboard;
    layouts: Map<string, any> = new Map<string, any>();
    errors: String[];
    neonServerUrl: string;
}
