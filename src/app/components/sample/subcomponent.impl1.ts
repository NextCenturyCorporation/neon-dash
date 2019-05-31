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
import { AbstractSubcomponent } from './subcomponent.abstract';
import { ElementRef } from '@angular/core';

export class SubcomponentImpl1 extends AbstractSubcomponent {
    /**
     * Builds the subcomponent elements.
     *
     * @arg {ElementRef} elementRef
     * @override
     */
    buildElements(__elementRef: ElementRef) {
        // TODO
    }

    /**
     * Destroys the subcomponent elements.
     *
     * @override
     */
    destroyElements() {
        // TODO
    }

    /**
     * Updates the subcomponent data.
     *
     * @arg {array} data
     * @override
     */
    updateData(__data: any[]) {
        // TODO
    }
}
