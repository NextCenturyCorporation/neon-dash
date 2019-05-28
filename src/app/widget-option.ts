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
import { Injector } from '@angular/core';
import { AggregationType } from './services/abstract.search.service';
import { DatasetService } from './services/dataset.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from './dataset';
import * as _ from 'lodash';
import * as yaml from 'js-yaml';
import * as uuidv4 from 'uuid/v4';

type OptionCallback = (options: any) => boolean;
interface OptionChoice { prettyName: string, variable: any }

export enum OptionType {
    DATABASE = 'DATABASE',
    FIELD = 'FIELD',
    FIELD_ARRAY = 'FIELD_ARRAY',
    FREE_TEXT = 'FREE_TEXT',
    MULTIPLE_SELECT = 'MULTIPLE_SELECT',
    NON_PRIMITIVE = 'NON_PRIMITIVE',
    COLOR = 'COLOR',
    SELECT = 'SELECT',
    TABLE = 'TABLE'
}

export abstract class WidgetOption {
    public valueCurrent: any;

    /**
     * @constructor
     * @arg {OptionType} optionType
     * @arg {boolean} isRequired
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {OptionChoice[]} valueChoices
     * @arg {boolean|OptionCallback} [enableInMenu=true]
     */
    constructor(
        public optionType: OptionType,
        public isRequired: boolean,
        public bindingKey: string,
        public prettyName: string,
        public valueDefault: any,
        public valueChoices: OptionChoice[],
        public enableInMenu: boolean | OptionCallback = true
    ) {}

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     */
    public getValueToSaveInBindings(): any {
        return this.valueCurrent;
    }
}

export class WidgetDatabaseOption extends WidgetOption {
    /**
     * @constructor
     */
    constructor() {
        // Value default and choices are set elsewhere.
        super(OptionType.DATABASE, true, 'database', 'Database', undefined, undefined, true);
    }

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     * @override
     */
    public getValueToSaveInBindings(): any {
        return this.valueCurrent.name;
    }
}

export class WidgetFieldArrayOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {boolean} isRequired
     * @arg {boolean|OptionCallback} [enableInMenu=true]
     */
    constructor(bindingKey: string, prettyName: string, isRequired: boolean, enableInMenu: boolean | OptionCallback = true) {
        // Value default and choices are set elsewhere.
        super(OptionType.FIELD_ARRAY, isRequired, bindingKey, prettyName, undefined, undefined, enableInMenu);
    }

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     * @override
     */
    public getValueToSaveInBindings(): any {
        return this.valueCurrent.map((fieldElement) => fieldElement.columnName);
    }
}

export class WidgetFieldOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {boolean} isRequired
     * @arg {boolean|OptionCallback} [enableInMenu=true]
     */
    constructor(bindingKey: string, prettyName: string, isRequired: boolean = false, enableInMenu: boolean | OptionCallback = true) {
        // Value default and choices are set elsewhere.
        super(OptionType.FIELD, isRequired, bindingKey, prettyName, undefined, undefined, enableInMenu);
    }

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     * @override
     */
    public getValueToSaveInBindings(): any {
        return this.valueCurrent.columnName;
    }
}

export class WidgetFreeTextOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {boolean|OptionCallback} [enableInMenu=true]
     */
    constructor(
        bindingKey: string,
        prettyName: string,
        valueDefault: any,
        enableInMenu: boolean | OptionCallback = true
    ) {
        super(OptionType.FREE_TEXT, false, bindingKey, prettyName, valueDefault, undefined, enableInMenu);
    }
}

export class WidgetColorOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {boolean|OptionCallback} [enableInMenu=true]
     */
    constructor(
        bindingKey: string,
        prettyName: string,
        valueDefault: any,
        enableInMenu: boolean | OptionCallback = true
    ) {
        super(OptionType.COLOR, false, bindingKey, prettyName, valueDefault, undefined, enableInMenu);
    }
}

export class WidgetMultipleSelectOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {OptionChoice[]} valueChoices
     * @arg {boolean|OptionCallback} [enableInMenu=true]
     */
    constructor(
        public bindingKey: string,
        public prettyName: string,
        public valueDefault: any,
        public valueChoices: OptionChoice[],
        public enableInMenu: boolean | OptionCallback = true
    ) {
        super(OptionType.MULTIPLE_SELECT, true, bindingKey, prettyName, valueDefault, valueChoices, enableInMenu);
    }
}

export class WidgetNonPrimitiveOption extends WidgetOption {
    private _intermediateValue: string;

    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {boolean|OptionCallback} [enableInMenu=true]
     */
    constructor(
        bindingKey: string,
        prettyName: string,
        valueDefault: any = undefined as any,
        enableInMenu: boolean | OptionCallback = true
    ) {
        super(OptionType.NON_PRIMITIVE, false, bindingKey, prettyName,
            valueDefault, undefined, enableInMenu);
    }

    get intermediateValue() {
        if (this._intermediateValue === undefined) {
            try {
                const v = this.valueCurrent || this.valueDefault;
                this._intermediateValue = _.isEmpty(v) ? '' : yaml.safeDump(v);
            } catch {
                // Consume error
            }
            this._intermediateValue = this._intermediateValue || '';
        }

        return this._intermediateValue;
    }

    set intermediateValue(v: any) {
        this._intermediateValue = v;
        try {
            this.valueCurrent = _.isEmpty(v) ? undefined : yaml.safeLoad(this._intermediateValue);
        } catch {
            // Ignore error
        }
    }

    getValueToSaveInBindings() {
        delete this._intermediateValue;
        return this.valueCurrent || this.valueDefault;
    }
}

export class WidgetSelectOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {OptionChoice[]} valueChoices
     * @arg {boolean|OptionCallback} [enableInMenu=true]
     */
    constructor(
        public bindingKey: string,
        public prettyName: string,
        public valueDefault: any,
        public valueChoices: OptionChoice[],
        public enableInMenu: boolean | OptionCallback = true
    ) {
        super(OptionType.SELECT, true, bindingKey, prettyName, valueDefault, valueChoices, enableInMenu);
    }
}

export class WidgetTableOption extends WidgetOption {
    /**
     * @constructor
     */
    constructor() {
        // Value default and choices are set elsewhere.
        super(OptionType.TABLE, true, 'table', 'Table', undefined, undefined, true);
    }

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     * @override
     */
    public getValueToSaveInBindings(): any {
        return this.valueCurrent.name;
    }
}

/**
 * Manages configurable options for all widgets.
 */
export class WidgetOptionCollection {
    // An object containing strings mapped to WidgetOption objects.
    private _collection: { [bindingKey: string]: WidgetOption } = {};

    public _id: string;
    public database: DatabaseMetaData = null;
    public databases: DatabaseMetaData[] = [];
    public fields: FieldMetaData[] = [];
    public layers: WidgetOptionCollection[] = [];
    public table: TableMetaData = null;
    public tables: TableMetaData[] = [];

    /**
     * @constructor
     * @arg {function} createFieldOptionsCallback A callback function to create the field options.
     * @arg {Injector} [injector] An injector with bindings; if undefined, uses config.
     * @arg {any} [config] An object with bindings; used if injector is undefined.
     */
    constructor(
        protected createFieldOptionsCallback: () => (WidgetFieldOption | WidgetFieldArrayOption)[],
        protected injector?: Injector,
        protected config?: any
    ) {
        // TODO Do not use a default _id.  Throw an error if undefined!
        this._id = (this.injector ? this.injector.get('_id', uuidv4()) : ((this.config || {})._id || uuidv4()));
        this.append(new WidgetDatabaseOption(), new DatabaseMetaData());
        this.append(new WidgetTableOption(), new TableMetaData());
    }

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

    /**
     * Returns a copy of this object.
     *
     * @return {WidgetOptionCollection}
     */
    public copy(): WidgetOptionCollection {
        let copy = new WidgetOptionCollection(this.createFieldOptionsCallback, this.injector, this.config);
        copy._id = this._id;
        copy.database = this.database;
        copy.databases = this.databases;
        copy.fields = this.fields;
        copy.layers = this.layers.map((layer) => layer.copy());
        copy.table = this.table;
        copy.tables = this.tables;
        this.list().forEach((option: WidgetOption) => {
            copy.append(_.cloneDeep(option), option.valueCurrent);
        });
        return copy;
    }

    /**
     * Returns the field object with the given column name or undefinied if the field does not exist.
     *
     * @arg {string} columnName
     * @return {FieldMetaData}
     */
    public findField(columnName: string): FieldMetaData {
        let outputFields = !columnName ? [] : this.fields.filter((field: FieldMetaData) => field.columnName === columnName);

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
     *
     * @arg {DatasetService} datasetService
     * @arg {string} bindingKey
     * @return {FieldMetaData}
     */
    public findFieldObject(datasetService: DatasetService, bindingKey: string): FieldMetaData {
        let fieldKey = (this.config || {})[bindingKey] || (this.injector ? this.injector.get(bindingKey, '') : '');
        return this.findField(datasetService.translateFieldKeyToValue(fieldKey)) || new FieldMetaData();
    }

    /**
     * Returns the array of field objects for the given binding key or an array of empty field objects.
     *
     * @arg {DatasetService} datasetService
     * @arg {string} bindingKey
     * @return {FieldMetaData[]}
     */
    public findFieldObjects(datasetService: DatasetService, bindingKey: string): FieldMetaData[] {
        let bindings = (this.config || {})[bindingKey] || (this.injector ? this.injector.get(bindingKey, []) : []);
        return (Array.isArray(bindings) ? bindings : []).map((fieldKey) => this.findField(datasetService.translateFieldKeyToValue(
            fieldKey
        ))).filter((fieldsObject) => !!fieldsObject);
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
        return Object.keys(this._collection).map((property) => this.access(property));
    }

    /**
     * Updates all the databases, tables, and fields in the options.
     *
     * @arg {DatasetService} datasetService
     */
    public updateDatabases(datasetService: DatasetService): void {
        this.databases = datasetService.getDatabases();
        this.database = datasetService.getCurrentDatabase() || this.databases[0] || this.database;

        if (this.databases.length) {
            let tableKey = (this.config || {}).tableKey || (this.injector ? this.injector.get('tableKey', null) : null);
            let currentDashboard = datasetService.getCurrentDashboard();
            let configDatabase: any;

            if (tableKey && currentDashboard && currentDashboard.tables && currentDashboard.tables[tableKey]) {
                configDatabase = datasetService.getDatabaseNameFromCurrentDashboardByKey(tableKey);

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

        return this.updateTables(datasetService);
    }

    /**
     * Updates all the fields in the options.
     *
     * @arg {DatasetService} datasetService
     */
    public updateFields(datasetService: DatasetService): void {
        if (this.database && this.table) {
            // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
            this.fields = datasetService.getSortedFields(this.database.name, this.table.name, true)
                .filter((field) => (field && field.columnName));

            // Create the field options and assign the default value as FieldMetaData objects.
            this.createFieldOptionsCallback().forEach((fieldsOption) => {
                if (fieldsOption.optionType === OptionType.FIELD) {
                    this.append(fieldsOption, this.findFieldObject(datasetService, fieldsOption.bindingKey));
                }
                if (fieldsOption.optionType === OptionType.FIELD_ARRAY) {
                    this.append(fieldsOption, this.findFieldObjects(datasetService, fieldsOption.bindingKey));
                }
            });
        }
    }

    /**
     * Updates all the tables and fields in the options.
     *
     * @arg {DatasetService} datasetService
     */
    public updateTables(datasetService: DatasetService): void {
        this.tables = this.database ? datasetService.getTables(this.database.name) : [];
        this.table = this.tables[0] || this.table;

        if (this.tables.length > 0) {
            let tableKey = (this.config || {}).tableKey || (this.injector ? this.injector.get('tableKey', null) : null);
            let currentDashboard = datasetService.getCurrentDashboard();
            let configTable: any;

            if (tableKey && currentDashboard && currentDashboard.tables && currentDashboard.tables[tableKey]) {
                configTable = datasetService.getTableNameFromCurrentDashboardByKey(tableKey);

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

        return this.updateFields(datasetService);
    }
}

export namespace OptionChoices {
    export const Aggregation: OptionChoice[] = [{
        prettyName: 'Count',
        variable: AggregationType.COUNT
    }, {
        prettyName: 'Average',
        variable: AggregationType.AVG
    }, {
        prettyName: 'Max',
        variable: AggregationType.MAX
    }, {
        prettyName: 'Min',
        variable: AggregationType.MIN
    }, {
        prettyName: 'Sum',
        variable: AggregationType.SUM
    }];

    export const AscendingFalseDescendingTrue: OptionChoice[] = [{
        prettyName: 'Ascending',
        variable: false
    }, {
        prettyName: 'Descending',
        variable: true
    }];

    export const DateGranularity: OptionChoice[] = [{
        prettyName: 'Year',
        variable: 'year'
    }, {
        prettyName: 'Month',
        variable: 'month'
    }, {
        prettyName: 'Day',
        variable: 'day'
    }, {
        prettyName: 'Hour',
        variable: 'hour'
    }, {
        prettyName: 'Minute',
        variable: 'minute'
    }];

    export const HideFalseShowTrue: OptionChoice[] = [{
        prettyName: 'Hide',
        variable: false
    }, {
        prettyName: 'Show',
        variable: true
    }];

    export const NoFalseYesTrue: OptionChoice[] = [{
        prettyName: 'No',
        variable: false
    }, {
        prettyName: 'Yes',
        variable: true
    }];

    export const OrFalseAndTrue: OptionChoice[] = [{
        prettyName: 'OR',
        variable: false
    }, {
        prettyName: 'AND',
        variable: true
    }];

    export const ShowFalseHideTrue: OptionChoice[] = [{
        prettyName: 'Show',
        variable: false
    }, {
        prettyName: 'Hide',
        variable: true
    }];

    export const YesFalseNoTrue: OptionChoice[] = [{
        prettyName: 'Yes',
        variable: false
    }, {
        prettyName: 'No',
        variable: true
    }];
}
