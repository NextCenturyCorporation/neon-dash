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
import { CustomConnectionData } from './custom-connection-data';

/**
 * Base class for custom connection steps.
 */
export abstract class CustomConnectionStep {
    public selected: boolean;
    public stepNumber: number;
    public title: string;

    @Input() public data: CustomConnectionData;

    /**
     * Checks that the entered data for this step is valid such that the process of connecting
     * to a custom dataset can continue.
     *
     * @abstract
     * @returns {boolean} true if the entered data is valid, or false otherwise.
     * @memberof CustomConnectionStep
     */
    public abstract isStepValid(): boolean;

    /**
     * Applies the data entered in this step to this step's given Dataset.
     *
     * @abstract
     * @memberof CustomConnectionStep
     */
    public abstract onComplete(): void;
}
