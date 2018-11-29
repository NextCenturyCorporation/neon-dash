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

/**
 * The config options of an individual widget for the angular2-grid.
 */
export interface NeonGridItem {
    bindings?: any;
    description?: string;
    id?: string;
    title?: string;
    type?: string;

    // Backwards-compatible col property for the angular2-grid item config.
    col?: number;
    // Backwards-compatible row property for the angular2-grid item config.
    row?: number;
    // Backwards-compatible sizex property for the angular2-grid item config.
    sizex?: number;
    // Backwards-compatible sizey property for the angular2-grid item config.
    sizey?: number;

    // The angular2-grid item config.
    config: NgGridItemConfig;

    // The previous grid item config that is stored when the widget is expanded and restored the widget is contracted. */
    previousConfig?: { col: number, row: number, sizex: number, sizey: number };
}
