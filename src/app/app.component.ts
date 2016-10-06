/*
 * Copyright 2016 Next Century Corporation
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
import { Component, OnInit, OnDestroy } from '@angular/core';

import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { Dataset } from './dataset';
import { DatasetService } from './services/dataset.service';
import { NgGrid, NgGridItem } from 'angular2-grid'
import { NeonGridItem } from './neon-grid-item'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: [
        './app.component.scss',
        '../../node_modules/angular2-grid/dist/NgGrid.css',
        '../../node_modules/@angular2-material/core/overlay/overlay.css'
    ]
})
export class AppComponent implements OnInit, OnDestroy {
    activeDataset: any = {
        name: "Select a Dataset"
    };
    gridItems: NeonGridItem[];

    datasets: Dataset[] = [];

    gridConfig: { [key: string]: any } = {
        'resizeable': true, 
        'margins': [10, 0, 0, 10], 
        'min_cols': 1,
        'max_cols': 24,
        'min_rows': 0,
        'max_rows': 0,
        'min_width': 50,
        'min_height': 50, 
        'maintain_ratio': true,
        'auto_style': true,
        'auto_resize': true, 
        'cascade': 'up',
        'fix_to_grid': true
    };

    constructor(private datasetService: DatasetService) {
        this.datasets = datasetService.getDatasets();
    }

    gridItemsToString(): string {
        return JSON.stringify(this.gridItems);
    }

    getDatasets(): Dataset[] {
        return this.datasets;
    }

    onActiveDatasetChanged(value: any) {
        console.log("dataset changed " + JSON.stringify(value));
    }
    onGridItemsChanged(value: NeonGridItem[]) {
        console.log("items changed: " + value.length + " items");
    }

    toggleInfoDialog(): void {
        console.log("toggling info dialog");
    }

    ngOnInit(): void {
        this.getDatasets();
    }

    ngOnDestroy(): void {
        console.log('neon gtd onDestroy called');
    }
}
