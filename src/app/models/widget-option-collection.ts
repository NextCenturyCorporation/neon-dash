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
import {
    Dataset,
    DatasetUtil,
    DatabaseConfig,
    DatastoreConfig,
    FieldConfig,
    TableConfig
} from 'nucleus/dist/core/models/dataset';
import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';
import {
    ConfigOption,
    ConfigOptionDatabase,
    ConfigOptionDatastore,
    ConfigOptionFreeText,
    ConfigOptionNonPrimitive,
    ConfigOptionSelect,
    ConfigOptionTable,
    isFieldOption,
    OptionChoices,
    OptionType
} from 'nucleus/dist/core/models/config-option';

export class OptionConfig {
    constructor(protected config: any = {}) { }

    public get(bindingKey: string, defaultValue: any): any {
        // Assume config is just a Record<string, any>
        return typeof this.config[bindingKey] === 'undefined' ? defaultValue : this.config[bindingKey];
    }

    public set(bindingKey: string, newValue: any): void {
        this.config[bindingKey] = newValue;
    }
}

/**
 * Manages configurable options with databases, tables, and fields.
 */
export class OptionCollection {
    // An object containing strings mapped to WidgetOption objects.
    private _collection: { [bindingKey: string]: ConfigOption } = {};

    public _id: string;
    public databases: DatabaseConfig[] = [];
    public datastores: DatastoreConfig[] = [];
    public fields: FieldConfig[] = [];
    public tables: TableConfig[] = [];
    public tableKey: any;
    public database: DatabaseConfig;
    public datastore: DatastoreConfig;
    public table: TableConfig;
    public filter: any;

    constructor(protected dataset: Dataset = new Dataset({}), protected config: OptionConfig = new OptionConfig({})) {
        // TODO Do not use a default _id.  Throw an error if undefined!
        this._id = this.config.get('_id', uuidv4());
        const datastoreName = this.config.get('datastore', '');
        const databaseName = this.config.get('database', '');
        const tableName = this.config.get('table', '');
        const tableKey = this.config.get('tableKey', (datastoreName && databaseName && tableName) ?
            (datastoreName + '.' + databaseName + '.' + tableName) : '');
        this.append(new ConfigOptionDatastore(), dataset.retrieveDatastore(datastoreName) || DatastoreConfig.get());
        this.append(new ConfigOptionDatabase(), dataset.retrieveDatabase(datastoreName, databaseName) || DatabaseConfig.get());
        this.append(new ConfigOptionTable(), dataset.retrieveTable(datastoreName, databaseName, tableName) || TableConfig.get());
        this.append(new ConfigOptionFreeText('tableKey', 'Table Key', true, '', true), tableKey);
    }

    [key: string]: any; // Ordering demands it be placed here

    /**
     * Returns the option with the given binding key.
     *
     * @arg {string} bindingKey
     * @return {ConfigOption}
     */
    public access(bindingKey: string): ConfigOption {
        return this._collection[bindingKey];
    }

    /**
     * Appends the given option with the given current value into this collection and creates accessor methods.
     *
     * @arg {ConfigOption} option
     * @arg {any} valueCurrent
     */
    public append(option: ConfigOption, valueCurrent: any): void {
        option.valueCurrent = valueCurrent;
        this._collection[option.bindingKey] = option;
        Object.defineProperty(this, option.bindingKey, {
            get: () => this._collection[option.bindingKey].valueCurrent,
            set: (value: any) => {
                this._collection[option.bindingKey].valueCurrent = value;
                // Also update the original config object to keep the new value in case the dashboard is saved later.
                if (option.bindingKey === 'datastore' || option.bindingKey === 'database' || option.bindingKey === 'table') {
                    const datastoreName = this._collection.datastore.getValueToSaveInBindings();
                    const databaseName = this._collection.database.getValueToSaveInBindings();
                    const tableName = this._collection.table.getValueToSaveInBindings();
                    if (datastoreName && databaseName && tableName) {
                        this.tableKey = datastoreName + '.' + databaseName + '.' + tableName;
                    }
                } else if (option.bindingKey !== '_id') {
                    const newValue = option.getValueToSaveInBindings();
                    this.config.set(option.bindingKey, newValue === null ? undefined : newValue);
                }
            }
        });
    }

    protected copyCommonProperties(copy: this): this {
        copy._id = this._id;
        copy.databases = this.databases;
        copy.datastores = this.datastores;
        copy.fields = this.fields;
        copy.tables = this.tables;
        this.list().forEach((option: ConfigOption) => {
            copy.append(_.cloneDeep(option), option.valueCurrent);
        });
        return copy;
    }

    /**
     * Returns a copy of this object.
     *
     * @return {OptionCollection}
     */
    public copy(): this {
        let copy = new (this.getConstructor())(this.dataset, this.config);
        return this.copyCommonProperties(copy);
    }

    /**
     * Returns the field object with the given column name or undefinied if the field does not exist.
     *
     * @arg {string} columnName
     * @return {FieldConfig}
     */
    public findField(columnName: string): FieldConfig {
        let outputFields = !columnName ? [] : this.fields.filter((field: FieldConfig) => field.columnName === columnName);

        if (!outputFields.length && this.fields.length) {
            // Check if the column name is actually an array index rather than a name.
            let fieldIndex = parseInt(columnName, 10);
            if (!isNaN(fieldIndex) && fieldIndex < this.fields.length) {
                outputFields = [this.fields[fieldIndex]];
            }
        }

        return outputFields.length ? outputFields[0] : undefined;
    }

    /**
     * Returns the field object for the given binding key or an empty field object.
     */
    public findFieldObject(dataset: Dataset, bindingKey: string): FieldConfig {
        let fieldKey = this.config.get(bindingKey, '');
        return this.findField(DatasetUtil.translateFieldKeyToFieldName(fieldKey, dataset.fieldKeyCollection)) || FieldConfig.get();
    }

    /**
     * Returns the array of field objects for the given binding key or an array of empty field objects.
     */
    public findFieldObjects(dataset: Dataset, bindingKey: string): FieldConfig[] {
        let bindings = this.config.get(bindingKey, []);
        return (Array.isArray(bindings) ? bindings : []).map((fieldKey) => this.findField(DatasetUtil.translateFieldKeyToFieldName(
            fieldKey, dataset.fieldKeyCollection
        ))).filter((fieldsObject) => !!fieldsObject);
    }

    protected getConstructor<T>(this: T): new (...args: any[]) => T {
        return this.constructor as new (...args: any[]) => T;
    }

    /**
     * Injects the given option(s) into this collection.
     *
     * @arg {ConfigOption|ConfigOption[]} options
     */
    public inject(options: ConfigOption | ConfigOption[]): void {
        (Array.isArray(options) ? options : [options]).forEach((option) => {
            this.append(option, this.config.get(option.bindingKey, option.valueDefault));
        });
    }

    /**
     * Returns the list of options in this collection.
     *
     * @return {ConfigOption[]}
     */
    public list(): ConfigOption[] {
        return Object.values(this._collection);
    }

    /**
     * Handles updated field options.
     */
    protected onUpdateFields(): void {
        // Override if needed.
    }

    /**
     * Updates all the databases, tables, and fields in the options.
     */
    public updateDatabases(dataset: Dataset): void {
        this.databases = Object.values(dataset.datastores).reduce((list, datastore) =>
            list.concat(Object.values(datastore.databases).sort((one, two) => one.name.localeCompare(two.name))), []);

        // If the previously set database is not in the newly set list, unset it.
        if (this.database.name && this.databases.length && this.databases.map((item) => item.name).indexOf(this.database.name) < 0) {
            this.database = DatabaseConfig.get();
        }

        if (this.databases.length) {
            let configuredDatabase;

            if (this.tableKey) {
                // The table key is either a tablekey string (datastore.database.table) or a unique ID in the dataset's tableKeyCollection.
                const datasetTableKey = dataset.tableKeyCollection[this.tableKey];
                configuredDatabase = DatasetUtil.deconstructTableOrFieldKeySafely(datasetTableKey || this.tableKey).database;
            }

            if (configuredDatabase) {
                for (const database of this.databases) {
                    if (configuredDatabase === database.name) {
                        this.database = database;
                        break;
                    }
                }
            }
        }

        // Ensure that the database object is not empty, but only once the table key (if any) is reviewed.
        this.database = this.database.name ? this.database : this.databases[0];

        return this.updateTables(dataset);
    }

    /**
     * Updates all the datastores, databases, tables, and fields in the options.
     */
    public updateDatastores(dataset: Dataset): void {
        this.datastores = Object.values(dataset.datastores);

        // If the previously set datastore is not in the newly set list, unset it.
        if (this.datastore.name && this.datastores.length && this.datastores.map((item) => item.name).indexOf(this.datastore.name) < 0) {
            this.datastore = DatastoreConfig.get();
        }

        if (this.datastores.length) {
            let configuredDatastore;

            if (this.tableKey) {
                // The table key is either a tablekey string (datastore.database.table) or a unique ID in the dataset's tableKeyCollection.
                const datasetTableKey = dataset.tableKeyCollection[this.tableKey];
                configuredDatastore = DatasetUtil.deconstructTableOrFieldKeySafely(datasetTableKey || this.tableKey).datastore;
            }

            if (configuredDatastore) {
                for (const datastore of this.datastores) {
                    if (configuredDatastore === datastore.name) {
                        this.datastore = datastore;
                        break;
                    }
                }
            }
        }

        // Ensure that the datastore object is not empty, but only once the table key (if any) is reviewed.
        this.datastore = this.datastore.name ? this.datastore : this.datastores[0];

        return this.updateDatabases(dataset);
    }

    /**
     * Updates all the fields in the options.
     */
    public updateFields(): void {
        if (this.database && this.table) {
            // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
            this.fields = this.table.fields.filter((field) => field.columnName && !field.hide).sort((one, two) => {
                if (!one.prettyName || !two.prettyName) {
                    return 0;
                }
                // Compare each field pretty name and ignore case.
                return (one.prettyName.toUpperCase() < two.prettyName.toUpperCase()) ? -1 :
                    ((one.prettyName.toUpperCase() > two.prettyName.toUpperCase()) ? 1 : 0);
            });

            this.onUpdateFields();
        }
    }

    /**
     * Updates all the tables and fields in the options.
     */
    public updateTables(dataset: Dataset): void {
        this.tables = !this.database ? [] : Object.values(this.database.tables).sort((tableA, tableB) =>
            tableA.name.localeCompare(tableB.name));

        // If the previously set table is not in the newly set list, unset it.
        if (this.table.name && this.tables.length && this.tables.map((table) => table.name).indexOf(this.table.name) < 0) {
            this.table = TableConfig.get();
        }

        if (this.tables.length) {
            let configuredTable;

            if (this.tableKey) {
                // The table key is either a tablekey string (datastore.database.table) or a unique ID in the dataset's tableKeyCollection.
                const datasetTableKey = dataset.tableKeyCollection[this.tableKey];
                configuredTable = DatasetUtil.deconstructTableOrFieldKeySafely(datasetTableKey || this.tableKey).table;
            }

            if (configuredTable) {
                for (const table of this.tables) {
                    if (configuredTable === table.name) {
                        this.table = table;
                        break;
                    }
                }
            }
        }

        // Ensure that the table object is not empty, but only once the table key (if any) is reviewed.
        this.table = this.table.name ? this.table : this.tables[0];

        return this.updateFields();
    }
}

/**
 * Manages configurable options with common widget options and a custom options callback function to initialize them.
 */
export class WidgetOptionCollection extends OptionCollection {
    constructor(
        dataset: Dataset = new Dataset({}),
        protected createOptionsCallback: () => ConfigOption[] = () => [],
        defaultTitle: string = '',
        defaultLimit: number = 0,
        config: OptionConfig = new OptionConfig({})
    ) {
        super(dataset, config);

        let nonFieldOptions = this.createOptions().filter((option) => !isFieldOption(option));

        this.inject([
            new ConfigOptionFreeText('title', 'Title', true, defaultTitle),
            new ConfigOptionFreeText('limit', 'Limit', true, defaultLimit),
            ...nonFieldOptions
        ]);

        this.updateDatastores(dataset);
    }

    /**
     * Returns a copy of this object.
     *
     * @return {WidgetOptionCollection}
     * @override
     */
    public copy(): this {
        let copy = new (this.getConstructor())(this.dataset, this.createOptionsCallback, this.title, this.limit, this.config);
        return this.copyCommonProperties(copy);
    }

    /**
     * Creates and returns a WidgetOption list for the collection.
     */
    protected createOptions(): ConfigOption[] {
        return this.createOptionsCallback();
    }

    /**
     * Handles updated field options.
     *
     * @override
     */
    protected onUpdateFields(): void {
        // Create the field options and assign the default value as FieldConfig objects.
        this.createOptions().forEach((option) => {
            if (option.optionType === OptionType.FIELD) {
                this.append(option, this.findFieldObject(this.dataset, option.bindingKey));
            }
            if (option.optionType === OptionType.FIELD_ARRAY) {
                this.append(option, this.findFieldObjects(this.dataset, option.bindingKey));
            }
        });
    }
}

/**
 * Manages configurable options with common widget options, layers, and custom options callback functions to initialize them.
 */
export class RootWidgetOptionCollection extends WidgetOptionCollection {
    public layers: WidgetOptionCollection[] = [];

    private _nextLayerIndex = 1;

    constructor(
        dataset: Dataset = new Dataset({}),
        createOptionsCallback: () => ConfigOption[] = () => [],
        protected createOptionsForLayerCallback: () => ConfigOption[] = () => [],
        defaultTitle: string = '',
        defaultLimit: number = 0,
        defaultLayer: boolean = false,
        config: OptionConfig = new OptionConfig({})
    ) {
        super(dataset, createOptionsCallback, defaultTitle, defaultLimit, config);

        // Backwards compatibility (configFilter deprecated and renamed to filter).
        this.filter = this.filter || this.config.get('configFilter', undefined);

        this.config.get('layers', []).forEach((layerBindings) => {
            this.addLayer(layerBindings);
        });

        // Add a new empty default layer if needed.
        if (!this.layers.length && defaultLayer) {
            this.addLayer();
        }

        // Remove the database and the table from this options if it has a layer to manage them both.
        if (defaultLayer) {
            this.datastore = null;
            this.database = null;
            this.table = null;
        }
    }

    /**
     * Adds a new layer to this option collection and returns the layer.
     */
    public addLayer(layerBindings: any = {}): WidgetOptionCollection {
        let layerOptions = new WidgetOptionCollection(this.dataset, this.createOptionsForLayerCallback,
            'Layer ' + this._nextLayerIndex++, this.limit, new OptionConfig(layerBindings));
        this.layers.push(layerOptions);
        return layerOptions;
    }

    /**
     * Returns a copy of this object.
     *
     * @return {RootWidgetOptionCollection}
     * @override
     */
    public copy(): this {
        let copy = new (this.getConstructor())(this.dataset, this.createOptionsCallback, this.createOptionsForLayerCallback,
            this.title, this.limit, false, this.config);
        copy.layers = this.layers.map((layer) => layer.copy());
        return this.copyCommonProperties(copy);
    }

    /**
     * Creates and returns a WidgetOption list for the collection.
     *
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionNonPrimitive('customEventsToPublish', 'Custom Events To Publish', false, [], true),
            new ConfigOptionNonPrimitive('customEventsToReceive', 'Custom Events To Receive', false, [], true),
            new ConfigOptionNonPrimitive('filter', 'Custom Widget Filter', false, undefined),
            new ConfigOptionSelect('hideUnfiltered', 'Hide Widget if Unfiltered', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionNonPrimitive('contributionKeys', 'Contribution Keys', false, undefined, true),
            ...super.createOptions()
        ];
    }

    /**
     * Removes the given layer from the option collection if it is not the final layer and returns if the layer was removed.
     */
    public removeLayer(layerOptions: any): boolean {
        let layers: WidgetOptionCollection[] = this.layers.filter((layer) => layer._id !== layerOptions._id);
        // Do not delete the final layer!
        if (layers.length) {
            this.layers = layers;
            return true;
        }
        return false;
    }
}

export interface ConfigurableWidget {
    options: RootWidgetOptionCollection;
    changeOptions(options?: WidgetOptionCollection, databaseOrTableChange?: boolean): void;
    createLayer(options: WidgetOptionCollection, layerBindings?: Record<string, any>): void;
    finalizeCreateLayer(layerOptions: any): void;
    deleteLayer(options: WidgetOptionCollection, layerOptions: any): boolean;
    finalizeDeleteLayer(layerOptions: any): void;
    handleChangeSubcomponentType(options?: WidgetOptionCollection): void;
    exportData(): { name: string, data: any }[];
}
