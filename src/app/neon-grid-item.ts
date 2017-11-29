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
import { NgGridItemConfig } from 'angular2-grid';

export interface NeonGridItem {
    bindings?: any;
    col?: number;
    description?: string;
    id?: string;
    row?: number;
    sizex?: number;
    sizey?: number;
    title?: string;
    type?: string;

    /** The active NgGridItem configuration for this visualization instance. */
    gridItemConfig: NgGridItemConfig;

    /** The previous NgGridItem configuration for this visualization--used for expand/collapse features. */
    lastGridItemConfig?: NgGridItemConfig;
}
