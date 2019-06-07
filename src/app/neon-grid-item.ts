import { NeonLayoutGridConfig } from './types';

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
export interface NeonGridItem extends NeonLayoutGridConfig {
    hide?: boolean;
    id?: string;
    icon?: string;
    type?: string;
    name?: string;
    bindings?: Record<string, any>;

    minPixelx?: number;
    minPixely?: number;
    minSizex?: number;
    minSizey?: number;

    borderSize?: number;
    dragHandle?: string;

    // The previous grid item config that is stored when the widget is expanded and restored the widget is contracted. */
    previousConfig?: Partial<NeonGridItem>;
}
