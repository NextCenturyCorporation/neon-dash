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
import { ElementRef } from '@angular/core';

export interface SubcomponentListener {
    filterFromSubcomponent(text: string);
}

export abstract class AbstractSubcomponent {
    protected options: any;
    protected listener: SubcomponentListener;

    /**
     * @constructor
     * @arg {any} options
     * @arg {SubcomponentListener} listener
     */
    constructor(options: any, listener: SubcomponentListener) {
        this.options = options;
        this.listener = listener;
    }

    /**
     * Builds the subcomponent elements.
     *
     * @arg {ElementRef} elementRef
     */
    abstract buildElements(elementRef: ElementRef);

    /**
     * Destroys the subcomponent elements.
     */
    abstract destroyElements();

    /**
     * Updates the subcomponent data.
     *
     * @arg {array} data
     */
    abstract updateData(data: any[]);

    /**
     * Redraws the subcomponent.
     */
    redraw() {
        // Do nothing.
    }
}
