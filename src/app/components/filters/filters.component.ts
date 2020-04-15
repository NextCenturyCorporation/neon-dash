/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { Component, EventEmitter, Output } from '@angular/core';

// Includes the filter-builder as well as the current-filters component.
@Component({
    selector: 'app-filters',
    templateUrl: './filters.component.html',
    styleUrls: ['./filters.component.scss']
})
export class FiltersComponent {
    @Output() closeDialog: EventEmitter<boolean> = new EventEmitter<boolean>();

    /**
     * Returns the default title.
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
