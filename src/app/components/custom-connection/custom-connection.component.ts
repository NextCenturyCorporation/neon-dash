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
import { Component, EventEmitter, Output, QueryList, ViewChildren, AfterViewInit } from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { DatasetService } from '../../services/dataset.service';
import { Dataset, Dashboard, DashboardDatastoreChoice } from '../../dataset';
import { MatDialogRef } from '@angular/material';

import { CustomConnectionStep } from './custom-connection-step';
import { CustomConnectionData } from './custom-connection-data';

import * as neon from 'neon-framework';

@Component({
    selector: 'app-custom-connection',
    templateUrl: 'custom-connection.component.html',
    styleUrls: ['custom-connection.component.scss']
})
export class CustomConnectionComponent implements AfterViewInit {
    public data: CustomConnectionData = new CustomConnectionData();
    public dialogRef: MatDialogRef<CustomConnectionComponent>;
    @Output() datasetCreated: EventEmitter<any> = new EventEmitter<any>();

    private datasetService: DatasetService;
    private activeGridService: ActiveGridService;
    private messenger: neon.eventing.Messenger;

    @ViewChildren('step') private stepQueryList: QueryList<CustomConnectionStep>;
    private steps: CustomConnectionStep[];
    private currentStep: CustomConnectionStep;
    private currentStepIndex: number;

    constructor(activeGridService: ActiveGridService, datasetService: DatasetService, dialogRef: MatDialogRef<CustomConnectionComponent>) {
        this.dialogRef = dialogRef;
        this.activeGridService = activeGridService;
        this.datasetService = datasetService;
        this.messenger = new neon.eventing.Messenger();

        this.steps = [];
        this.currentStepIndex = 0;
    }

    ngAfterViewInit() {
        this.steps = this.stepQueryList.toArray();
        this.steps.sort((a, b) => a.stepNumber - b.stepNumber);
        this.currentStep = this.steps[0];
    }

    previousStep() {
        this.currentStepIndex -= 1;
        this.currentStep = this.steps[this.currentStepIndex];
        this.updateStepVisibility();
    }

    nextStep() {
        this.steps[this.currentStepIndex].onComplete();
        if (this.currentStepIndex >= this.steps.length - 1) {
            this.createDataset();
        } else {
            this.currentStepIndex += 1;
            this.currentStep = this.steps[this.currentStepIndex];
            this.updateStepVisibility();
        }
    }

    createDataset() {
        let dataset = new Dataset(this.data.datasetName, this.data.datastoreType, this.data.datastoreHost);
        dataset.databases = this.data.selectedDatabases;
        this.datasetService.addDataset(dataset);
        this.datasetService.setActiveDataset(dataset);

        // TODO: 825: fix so that the dashboard is added to existing list

        this.datasetService.setCurrentDashboardConfigName(this.data.datasetName);

        // TODO: 825: fix so that this uses dashboards properly/incorporate next line
        //this.datasetService.setCurrentDashboardConfig(??)

        this.messenger.clearFiltersSilently();
        this.activeGridService.clear();
        this.datasetCreated.emit(dataset);
        this.dialogRef.close();
    }

    validateStep() {
        return this.steps.length > 0 ? this.steps[this.currentStepIndex].isStepValid() : false;
    }

    private updateStepVisibility() {
        for (let step of this.steps) {
            step.selected = (this.currentStep.stepNumber === step.stepNumber);
        }
    }

    private getCurrentStepTitle(): string {
        return this.currentStep ? this.currentStep.title : '';
    }

    private getCurrentStepNumber(): string {
        return this.currentStep ? this.currentStep.stepNumber.toString() : '';
    }

    private onFinalStep(): boolean {
        return this.currentStepIndex === this.steps.length - 1;
    }
}
