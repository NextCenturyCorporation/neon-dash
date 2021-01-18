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

import { Input } from '@angular/core';
import { ConfigurableWidget } from './widget-option-collection';

// VisualizationType strings should be the same as the moduleId properties in app-lazy.module.ts
export enum VisualizationType {
    SAMPLE = 'sample',
    TEXT_CLOUD = 'text-cloud'
}

export abstract class VisualizationWidget {
    // Assign the VisualizationType enum to a class variable so it is accessible in our HTML files.
    public VISUALIZATION_TYPE = VisualizationType;

    @Input() configOptions: { [key: string]: any };
    @Input() visualizationType: VisualizationType;

    public abstract createExportData(): { name: string, data: any }[];
    public abstract getWidgetOptionMenuCallbacks(): ConfigurableWidget;
    public abstract onResize(): void;
    public abstract onResizeStart(): void;
    public abstract onResizeStop(): void;
    public abstract runQuery(): void;
}

