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
import { Color } from '../../services/color-scheme.service';
import { FieldMetaData } from '../../dataset';
import { ElementRef } from '@angular/core';

export enum graphType { ngxgraph }

export interface OptionsFromConfig {
    title: string;
    database: string;
    table: string;
    nodeField: string; //The field nodes are created from
    linkField: string; //The field links are created from
    //sizeField: string; //
    //colorField: string;
    dataField: string; //
    limit: number;
    graphType: graphType | string;
    unsharedFilterField: Object;
    unsharedFilterValue: string;
}

export class GraphData {
    nodes: [{
        id: string;
        label: string;
        nodeType: string;
        size: number;
    }];

    links: [{
        source: string;
        target: string;
        label: string;
        count: number;
    }];
}

export abstract class AbstractGraph {
    protected optionsFromConfig: OptionsFromConfig;

    initialize(graphContainer: ElementRef, optionsFromConfig: OptionsFromConfig) {
        this.optionsFromConfig = optionsFromConfig;
        this.doCustomInitialization(graphContainer);
    }

    abstract doCustomInitialization(graphContainer: ElementRef);

    abstract destroy();

}
