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
import { Component, QueryList, ViewChildren, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ConnectionService } from '../../services/connection.service';
import { Dataset } from '../../dataset';
import { MatDialogRef } from '@angular/material';

import { CustomConnectionStep } from './custom-connection-step';
import { CustomConnectionData } from './custom-connection-data';

@Component({
    selector: 'app-custom-connection',
    templateUrl: 'custom-connection.component.html',
    styleUrls: ['custom-connection.component.scss']
})
export class CustomConnectionComponent implements OnInit, AfterViewInit, OnDestroy {
    public data: CustomConnectionData = new CustomConnectionData();
    public dialogRef: MatDialogRef<CustomConnectionComponent>;

    @ViewChildren('step') private stepQueryList: QueryList<CustomConnectionStep>;
    private steps: CustomConnectionStep[];
    currentStep: CustomConnectionStep;
    private currentStepIndex: number;

    constructor(dialogRef: MatDialogRef<CustomConnectionComponent>) {
        this.dialogRef = dialogRef;
        this.steps = [];
        this.currentStepIndex = 0;
    }

    ngOnInit() {
        // Do nothing.
    }

    ngAfterViewInit() {
        this.steps = this.stepQueryList.toArray();
        this.steps.sort((a, b) => a.stepNumber - b.stepNumber);
        this.currentStep = this.steps[0];
        //this.updateStepVisibility();
    }

    ngOnDestroy() {
        // Do nothing.
    }

    previousStep() {
        this.currentStepIndex -= 1;
        this.currentStep = this.steps[this.currentStepIndex];
        this.updateStepVisibility();
    }

    nextStep() {
        this.dialogRef.close();
        this.steps[this.currentStepIndex].onComplete();
        this.currentStepIndex += 1;
        this.currentStep = this.steps[this.currentStepIndex];
        this.updateStepVisibility();
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
