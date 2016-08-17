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

import { NeonGTDConfig } from './neon-gtd-config';
import { Dataset } from './dataset';
import { DatasetService } from './services/dataset.service';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.less']
})
export class AppComponent implements OnInit, OnDestroy {
    selectedDataset: string = 'Select a Dataset';
    datasets: Dataset[] = [];

    constructor(private datasetService: DatasetService) {
        console.log("CONSTRUCTING!!");
        this.datasets = datasetService.getDatasets();
    }

    getDatasets(): Dataset[] {
        return this.datasets;
    }

    ngOnInit(): void {
        this.getDatasets();
    }

    ngOnDestroy(): void {
        console.log('neon gtd onDestroy called')
    }
}
