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
import { Injector } from '@angular/core';
import { Dataset, NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData } from './dataset';
import { DataUtil } from '../util/data.util';
import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';
import {
    isFieldOption,
    OptionChoices,
    OptionType,
    WidgetDatabaseOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption,
    WidgetTableOption
} from './widget-option';

/**
 * Manages configurable options with databases, tables, and fields.
 */
export class OptionCollection {
    // An object containing strings mapped to WidgetOption objects.
    private _collection: { [bindingKey: string]: WidgetOption } = {};

    public _id: string;
    public database: NeonDatabaseMetaData = null;
    public databases: NeonDatabaseMetaData[] = [];
    public fields: NeonFieldMetaData[] = [];
    public table: NeonTableMetaData = null;
    public tables: NeonTableMetaData[] = [];

    /**
     * @constructor
     * @arg {Injector} [injector] An injector with bindings; if undefined, uses config.
     * @arg {any} [config] An object with bindings; used if injector is undefined.
     */
    constructor(protected injector?: Injector, protected config?: any) {
        // TODO Do not use a default _id.  Throw an error if undefined!
        this._id = (this.injector ? this.injector.get('_id', uuidv4()) : ((this.config || {})._id || uuidv4()));
        this.append(new WidgetDatabaseOption(), NeonDatabaseMetaData.get());
        this.append(new WidgetTableOption(), NeonTableMetaData.get());
    }

    [key: string]: any; // Ordering demands it be placed here

    /**
     * Returns the option with the given binding key.
     *
     * @arg {string} bindingKey
     * @return {WidgetOption}
     */
    public access(bindingKey: string): WidgetOption {
        return this._collection[bindingKey];
    }

    /**
     * Appends the given option with the given current value into this collection and creates accessor methods.
     *
     * @arg {WidgetOption} option
     * @arg {any} valueCurrent
     */
    public append(option: WidgetOption, valueCurrent: any): void {
        option.valueCurrent = valueCurrent;
        this._collection[option.bindingKey] = option;
        Object.defineProperty(this, option.bindingKey, {
            get: () => this._collection[option.bindingKey].valueCurrent,
            set: (value: any) => {
                this._collection[option.bindingKey].valueCurrent = value;
            }
        });
    }

    protected copyCommonProperties(copy: this): this {
        copy._id = this._id;
        copy.database = this.database;
        copy.databases = this.databases;
        copy.fields = this.fields;
        copy.table = this.table;
        copy.tables = this.tables;
        this.list().forEach((option: WidgetOption) => {
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
        let copy = new (this.getConstructor())(this.injector, this.config);
        return this.copyCommonProperties(copy);
    }

    /**
     * Returns the field object with the given column name or undefinied if the field does not exist.
     *
     * @arg {string} columnName
     * @return {NeonFieldMetaData}
     */
    public findField(columnName: string): NeonFieldMetaData {
        let outputFields = !columnName ? [] : this.fields.filter((field: NeonFieldMetaData) => field.columnName === columnName);

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
    public findFieldObject(dataset: Dataset, bindingKey: string): NeonFieldMetaData {
        let fieldKey = (this.config || {})[bindingKey] || (this.injector ? this.injector.get(bindingKey, '') : '');
        return this.findField(DataUtil.translateFieldKeyToValue(dataset.fieldKeys, fieldKey)) || NeonFieldMetaData.get();
    }

    /**
     * Returns the array of field objects for the given binding key or an array of empty field objects.
     */
    public findFieldObjects(dataset: Dataset, bindingKey: string): NeonFieldMetaData[] {
        let bindings = (this.config || {})[bindingKey] || (this.injector ? this.injector.get(bindingKey, []) : []);
        return (Array.isArray(bindings) ? bindings : []).map((fieldKey) =>
            this.findField(DataUtil.translateFieldKeyToValue(dataset.fieldKeys, fieldKey))).filter((fieldsObject) => !!fieldsObject);
    }

    protected getConstructor<T>(this: T): new(...args: any[]) => T {
        return this.constructor as new(...args: any[]) => T;
    }

    /**
     * Injects the given option(s) into this collection.
     *
     * @arg {WidgetOption|WidgetOption[]} options
     */
    public inject(options: WidgetOption | WidgetOption[]): void {
        (Array.isArray(options) ? options : [options]).forEach((option) => {
            this.append(option, (this.injector ? this.injector.get(option.bindingKey, option.valueDefault) :
                ((this.config || {})[option.bindingKey] || option.valueDefault)));
        });
    }

    /**
     * Returns the list of options in this collection.
     *
     * @return {WidgetOption[]}
     */
    public list(): WidgetOption[] {
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
        this.databases = dataset.datastores.reduce((list, datastore) =>
            list.concat(Object.values(datastore.databases).sort((one, two) => one.name.localeCompare(two.name))), []);
        this.database = this.databases[0] || this.database;

        if (this.databases.length) {
            let tableKey = (this.config || {}).tableKey || (this.injector ? this.injector.get('tableKey', null) : null);
            let configDatabase: any;

            if (tableKey && dataset.tableKeys[tableKey]) {
                configDatabase = DataUtil.deconstructTableName(dataset.tableKeys, tableKey).database;

                if (configDatabase) {
                    for (let database of this.databases) {
                        if (configDatabase === database.name) {
                            this.database = database;
                            break;
                        }
                    }
                }
            }
        }

        return this.updateTables(dataset);
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

        this.table = this.tables[0] || this.table;

        if (this.tables.length > 0) {
            let tableKey = (this.config || {}).tableKey || (this.injector ? this.injector.get('tableKey', null) : null);
            let configTable: any;

            if (tableKey && dataset.tableKeys[tableKey]) {
                configTable = DataUtil.deconstructTableName(dataset.tableKeys, tableKey).table;

                if (configTable) {
                    for (let table of this.tables) {
                        if (configTable === table.name) {
                            this.table = table;
                            break;
                        }
                    }
                }
            }
        }

        return this.updateFields();
    }
}

/**
 * Manages configurable options with common widget options and a custom options callback function to initialize them.
 */
export class WidgetOptionCollection extends OptionCollection {
    /**
     * @constructor
     * @arg {function} createOptionsCallback A callback function to create the options.
     * @arg {Dataset} dataset The current dataset.
     * @arg {string} defaultTitle The default value for the injected 'title' option.
     * @arg {number} defaultLimit The default value for the injected 'limit' option.
     * @arg {Injector} [injector] An injector with bindings; if undefined, uses config.
     * @arg {any} [config] An object with bindings; used if injector is undefined.
     */
    constructor(
        protected createOptionsCallback: () => WidgetOption[],
        protected dataset: Dataset,
        defaultTitle: string,
        defaultLimit: number,
        injector?: Injector,
        config?: any
    ) {
        super(injector, config);

        let nonFieldOptions = this.createOptions().filter((option) => !isFieldOption(option));

        this.inject([
            new WidgetFreeTextOption('title', 'Title', defaultTitle),
            new WidgetFreeTextOption('limit', 'Limit', defaultLimit),
            ...nonFieldOptions
        ]);

        this.updateDatabases(dataset);
    }

    /**
     * Returns a copy of this object.
     *
     * @return {WidgetOptionCollection}
     * @override
     */
    public copy(): this {
        let copy = new (this.getConstructor())(this.createOptionsCallback, this.dataset, this.title, this.limit, this.injector,
            this.config);
        return this.copyCommonProperties(copy);
    }

    /**
     * Creates and returns a WidgetOption list for the collection.
     */
    protected createOptions(): WidgetOption[] {
        return this.createOptionsCallback();
    }

    /**
     * Handles updated field options.
     *
     * @override
     */
    protected onUpdateFields(): void {
        // Create the field options and assign the default value as NeonFieldMetaData objects.
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

    /**
     * @constructor
     * @arg {function} createOptionsCallback A callback function to create the options.
     * @arg {function} createOptionsForLayerCallback A callback function to create the options for the layers (if any).
     * @arg {Dataset} dataset The current dataset.
     * @arg {string} defaultTitle The default value for the injected 'title' option.
     * @arg {number} defaultLimit The default value for the injected 'limit' option.
     * @arg {boolean} defaultLayer Whether to add a default layer.
     * @arg {Injector} [injector] An injector with bindings; if undefined, uses config.
     * @arg {any} [config] An object with bindings; used if injector is undefined.
     */
    constructor(
        createOptionsCallback: () => WidgetOption[],
        protected createOptionsForLayerCallback: () => WidgetOption[],
        dataset: Dataset,
        defaultTitle: string,
        defaultLimit: number,
        defaultLayer: boolean,
        injector?: Injector,
        config?: any
    ) {
        super(createOptionsCallback, dataset, defaultTitle, defaultLimit, injector, config);

        // Backwards compatibility (configFilter deprecated and renamed to filter).
        this.filter = this.filter || (injector ? injector.get('configFilter', null) : (config || {}).configFilter);

        (injector ? injector.get('layers', []) : ((config || {}).layers || [])).forEach((layerBindings) => {
            this.addLayer(layerBindings);
        });

        // Add a new empty default layer if needed.
        if (!this.layers.length && defaultLayer) {
            this.addLayer();
        }
    }

    /**
     * Adds a new layer to this option collection and returns the layer.
     */
    public addLayer(layerBindings: any = {}): WidgetOptionCollection {
        let layerOptions = new WidgetOptionCollection(this.createOptionsForLayerCallback, this.dataset,
            'Layer ' + this._nextLayerIndex++, this.limit, undefined, layerBindings);
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
        let copy = new (this.getConstructor())(this.createOptionsCallback, this.createOptionsForLayerCallback, this.dataset,
            this.title, this.limit, false, this.injector, this.config);
        copy.layers = this.layers.map((layer) => layer.copy());
        return this.copyCommonProperties(copy);
    }

    /**
     * Creates and returns a WidgetOption list for the collection.
     *
     * @override
     */
    protected createOptions(): WidgetOption[] {
        return [
            new WidgetFieldOption('unsharedFilterField', 'Local Filter Field', false, true),
            new WidgetNonPrimitiveOption('customEventsToPublish', 'Custom Events To Publish', [], true),
            new WidgetNonPrimitiveOption('customEventsToReceive', 'Custom Events To Receive', [], true),
            new WidgetNonPrimitiveOption('filter', 'Custom Widget Filter', null),
            new WidgetSelectOption('hideUnfiltered', 'Hide Widget if Unfiltered', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('unsharedFilterValue', 'Local Filter Value', '', true),
            new WidgetNonPrimitiveOption('contributionKeys', 'Contribution Keys', null, true),
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
    options: WidgetOptionCollection;
    changeData(options?: WidgetOptionCollection, databaseOrTableChange?: boolean): void;
    changeFilterData(options?: WidgetOptionCollection, databaseOrTableChange?: boolean): void;
    createLayer(options: WidgetOptionCollection, layerBindings?: Record<string, any>): void;
    finalizeCreateLayer(layerOptions: any): void;
    deleteLayer(options: WidgetOptionCollection, layerOptions: any): boolean;
    finalizeDeleteLayer(layerOptions: any): void;
    handleChangeSubcomponentType(options?: WidgetOptionCollection): void;
    exportData(): { name: string, data: any }[];
}
