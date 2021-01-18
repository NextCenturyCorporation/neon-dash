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
import { Dataset, DatasetUtil, FieldKey, DatastoreConfig, FieldConfig } from '@caci-critical-insight-solutions/nucleus-core';
import { NeonDashboardLeafConfig } from './types';

export class DashboardState {
    modified = false;

    constructor(
        public dashboard: NeonDashboardLeafConfig = NeonDashboardLeafConfig.get(),
        public datastores: DatastoreConfig[] = []
    ) { }

    get id() {
        return this.dashboard.fullTitle;
    }

    /**
     * Returns the current dashboard config title.
     */
    public getTitle(): string[] {
        return this.dashboard ? this.dashboard.fullTitle : null;
    }

    /**
     *
     * @param simpleField The new field for the simple search
     */
    public setSimpleFilterFieldName(simpleField: FieldConfig) {
        this.createSimpleFilter();
        this.dashboard.options.simpleFilter.fieldName = simpleField.columnName;
    }

    /**
     * Creates a simpleFilter if it doesn't exist
     */
    public createSimpleFilter() {
        if (!this.dashboard.options.simpleFilter) {
            let tableKey = Object.keys(this.dashboard.tables)[0];

            const fieldKeyObject: FieldKey = DatasetUtil.deconstructTableOrFieldKeySafely(tableKey);

            this.dashboard.options.simpleFilter = {
                fieldKey: '',
                databaseName: fieldKeyObject.database,
                tableName: fieldKeyObject.table,
                fieldName: ''
            };
        }
    }

    /**
     * Returns the layout name for the currently selected dashboard.
     */
    public getLayout(): string {
        return this.dashboard.layout;
    }

    /**
     * Sets layout
     */
    public setLayout(layout: string) {
        this.dashboard.layout = layout;
    }

    /**
     * Returns the options for the current dashboard.
     */
    public getOptions(): NeonDashboardLeafConfig['options'] {
        return this.dashboard.options;
    }

    /**
     * Returns the current dashboard state as a dataset.
     */
    public asDataset(): Dataset {
        let datastores = this.datastores.reduce((collection, datastore) => {
            if (datastore.name) {
                collection[datastore.name] = datastore;
            }
            return collection;
        }, {});

        return new Dataset(datastores, null, null, this.dashboard.relations, this.dashboard.tables, this.dashboard.fields);
    }
}
