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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { BaseLayeredNeonComponent } from '../base-neon-component/base-layered-neon.component';

import * as _ from 'lodash';

// Includes the filter-builder as well as the current-filters component.
@Component({
    selector: 'app-filters',
    templateUrl: './filters.component.html',
    styleUrls: ['./filters.component.scss']
})
export class FiltersComponent {
    @Input() widgets: Map<string, BaseNeonComponent | BaseLayeredNeonComponent>;
    @Output() closeDialog: EventEmitter<boolean> = new EventEmitter<boolean>();
    public showFilterBuilderView: boolean = true; // if false, show current filters instead

    /**
     * Returns the default title.
     *
     * @return {string}
     */
    getDefaultTitle(): string {
        return 'Filters';
    }

    /**
     * Emits an event to close the filters component.
     */
    closeFiltersDialog() {
        this.closeDialog.emit(true);
    }
}
