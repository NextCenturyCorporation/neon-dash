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

/**
 * The config options of an individual widget for the angular2-grid.
 */
export interface NeonGridItem {
    bindings?: any;
    hide?: boolean;
    id?: string;
    icon?: string;
    name?: string;
    type?: string;

    borderSize?: number;
    col?: number;
    dragHandle?: string;
    row?: number;
    sizex?: number;
    sizey?: number;

    // The previous grid item config that is stored when the widget is expanded and restored the widget is contracted. */
    previousConfig?: { col: number, row: number, sizex: number, sizey: number };
}
