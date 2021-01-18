/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { NeonLayoutGridConfig } from './types';

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

export interface NeonGridTab {
    name: string;
    list: NeonGridItem[];
}
