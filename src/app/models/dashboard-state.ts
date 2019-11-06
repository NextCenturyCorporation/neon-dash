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
import { Dataset, DatasetUtil, FieldKey, DatastoreConfig, FieldConfig } from 'component-library/dist/core/models/dataset';
import { NeonDashboardLeafConfig } from './types';

export class DashboardState {
    modified = false;

    constructor(
        public dashboard: NeonDashboardLeafConfig = NeonDashboardLeafConfig.get(),
        public datastore: DatastoreConfig = DatastoreConfig.get()
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
     * Returns whether a datastore is active.
     */
    public hasDatastore(): boolean {
        return (this.datastore.type && this.datastore.host && (Object.keys(this.datastore.databases).length > 0));
    }

    /**
     * Returns the name of the active datastore.
     */
    public getDatastoreName(): string {
        return this.datastore.name;
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
     * Returns the datastore type for the active datastore (elasticsearchrest, mongo, etc)
     */
    public getDatastoreType(): string {
        return this.datastore.type;
    }

    /**
     * Returns the hostname for the active datastore.
     */
    public getDatastoreHost(): string {
        return this.datastore.host;
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
        let datastores = {};
        if (this.datastore && this.datastore.name) {
            datastores[this.datastore.name] = this.datastore;
        }
        return new Dataset(datastores, null, null, this.dashboard.relations, this.dashboard.tables, this.dashboard.fields);
    }
}
