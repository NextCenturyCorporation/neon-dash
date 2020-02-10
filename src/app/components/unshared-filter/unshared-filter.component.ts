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
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { DatabaseConfig, FieldConfig, TableConfig } from '@caci-critical-insight-solutions/nucleus-core';

/**
 * Component for managing the unshared filter of a visualization.
 * You must bind the 'meta' field from the BaseNeonComponent to the 'meta' field in this component.
 *
 * You can bind to the different outputs to update the visualization if the filter changes.
 *
 * This can only be used within components that extend BaseNeonComponent, and will not handle layers.
 */
@Component({
    selector: 'app-unshared-filter',
    templateUrl: './unshared-filter.component.html',
    styleUrls: ['./unshared-filter.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnsharedFilterComponent {
    /**
     * This should be bound to the 'meta' component from the BaseNeonComponent class
     */
    @Input() public meta: {
        databases: DatabaseConfig[];
        database: DatabaseConfig;
        tables: TableConfig[];
        table: TableConfig;
        unsharedFilterField: FieldConfig;
        unsharedFilterValue: string;
        fields: FieldConfig[];
    };

    /**
     * Triggered when the filter field has changed.
     * @type {EventEmitter<FieldConfig>}
     */
    @Output() unsharedFilterFieldChanged = new EventEmitter<FieldConfig>();

    /**
     * Triggered when the filter has been cleared
     * @type {EventEmitter<void>}
     */
    @Output() unsharedFilterRemoved = new EventEmitter<void>();

    /**
     * Triggered when the filter value has changed
     * @type {EventEmitter<string>}
     */
    @Output() unsharedFilterValueChanged = new EventEmitter<string>();

    /**
     * Triggered when either the filter's field or value has changed.
     * Either bind to this, or to the filter/value change events. Both events will be triggered either way.
     * @type {EventEmitter<void>}
     */
    @Output() unsharedFilterChanged = new EventEmitter<void>();

    handleChangeUnsharedFilterField(): void {
        this.unsharedFilterFieldChanged.emit(this.meta.unsharedFilterField);
        this.unsharedFilterChanged.emit();
    }

    handleRemoveUnsharedFilter(): void {
        this.meta.unsharedFilterValue = null;
        this.meta.unsharedFilterField = FieldConfig.get();
        this.unsharedFilterRemoved.emit();
    }

    handleChangeUnsharedFilterValue(): void {
        this.unsharedFilterValueChanged.emit(this.meta.unsharedFilterValue);
        this.unsharedFilterChanged.emit();
    }
}
