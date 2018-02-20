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
import { ElementRef } from '@angular/core';
import { AbstractGraph } from './ng.type.abstract';
import { FieldMetaData } from '../../dataset';

import * as shape from 'd3-shape';
import { select } from 'd3-selection';
import 'd3-transition';
import * as dagre from 'dagre';
import { colorSets } from './color-sets';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import {
    BaseChartComponent,
    ChartComponent,
    calculateViewDimensions,
    ViewDimensions,
    ColorHelper
} from '@swimlane/ngx-charts';

export class NgxGraph extends AbstractGraph {
    private graphViewer: any;
    private graphData: any;

    graphGroups: any;
    graph: any;
    realTimeData: boolean = false;
    hierarchialGraph: { nodes: any[], links: any[] };

    view: any[];
    width: number = 200;
    height: number = 100;
    fitContainer: boolean = true;
    autoZoom: boolean = false;
    // options
    showLegend = false;

    colorSets: any;
    colorScheme: any;
    schemeType: string = 'ordinal';

    orientation: 'LR'; // LR, RL, TB, BT
    // line interpolation
    curveType: 'Linear';
    //curve: shape.curveLinear;
    interpolationTypes = [
        'Bundle', 'Cardinal', 'Catmull Rom', 'Linear', 'Monotone X',
        'Monotone Y', 'Natural', 'Step', 'Step After', 'Step Before'
    ];

    doCustomInitialization(graphContainer: ElementRef) {
        let ngxSetting: any = {
            theme: 'dark',
            chartType: 'Network Graph',
            realTimeData: false,
            width: 400,
            height: 200,
            fitContainer: true,
            autoZoom: false,
            // options
            showLegend: false
        };
    }

    destroy() {
        return this.graphViewer && this.graphViewer.destroy();
    }
/*
    setColorScheme(name) {
        this.selectedColorScheme = name;
        this.colorScheme = this.colorSets.find((s) => s.name === name);
    }//*/
}
