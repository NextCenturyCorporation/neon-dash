/**
 * Copyright 2019 Next Century Corporation
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
import { Component, EventEmitter, Output, QueryList, ViewChildren, AfterContentInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { CustomConnectionStep } from './custom-connection-step';
import { CustomConnectionData } from './custom-connection-data';

import { eventing } from 'neon-framework';
import { DatastoreConfig, DatabaseConfig } from 'component-library/dist/core/models/dataset';

@Component({
    selector: 'app-custom-connection',
    templateUrl: 'custom-connection.component.html',
    styleUrls: ['custom-connection.component.scss']
})
export class CustomConnectionComponent implements AfterContentInit {
    public data: CustomConnectionData = new CustomConnectionData();
    @Output() datasetCreated: EventEmitter<any> = new EventEmitter<any>();

    private messenger: eventing.Messenger;

    @ViewChildren('step') private stepQueryList: QueryList<CustomConnectionStep>;
    private steps: CustomConnectionStep[];
    private currentStep: CustomConnectionStep;
    private currentStepIndex: number;

    constructor(
        private dashboardService: DashboardService,
        private filterService: InjectableFilterService
    ) {
        this.messenger = new eventing.Messenger();

        this.steps = [];
        this.currentStepIndex = 0;
    }

    ngAfterContentInit() {
        /* TODO THOR-1056
        this.steps = this.stepQueryList.toArray();
        this.steps.sort((step1, step2) => step1.stepNumber - step2.stepNumber);
        this.currentStep = this.steps[0];
        */
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
        let datastore = DatastoreConfig.get({
            name: this.data.datasetName,
            host: this.data.datastoreHost,
            type: this.data.datastoreType
        });
        datastore.databases = this.data.selectedDatabases.reduce((acc, db) => {
            acc[db.name] = db;
            return acc;
        }, {} as { [key: string]: DatabaseConfig });
        this.dashboardService.setActiveDatastores(this.dashboardService.state.datastores.concat(datastore));

        // TODO: THOR-1056: fix so that the dashboard is added to existing list
        // TODO: THOR-1056: make enough information available to set entire currentDashboard here.

        // TODO: THOR-1056: fix so that this uses dashboards properly/incorporate next line
        // this.dashboardService.setCurrentDashboard(??)

        this.filterService.deleteFilters('CustomConnection');
        this.datasetCreated.emit(datastore);
    }

    close() {
        // TODO
    }

    validateStep() {
        return this.steps.length > 0 ? this.steps[this.currentStepIndex].isStepValid() : false;
    }

    private updateStepVisibility() {
        for (let step of this.steps) {
            step.selected = (this.currentStep.stepNumber === step.stepNumber);
        }
    }

    public getCurrentStepTitle(): string {
        return this.currentStep ? this.currentStep.title : '';
    }

    private getCurrentStepNumber(): string {
        return this.currentStep ? this.currentStep.stepNumber.toString() : '';
    }

    private onFinalStep(): boolean {
        return this.currentStepIndex === this.steps.length - 1;
    }
}
