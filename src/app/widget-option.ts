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
import { DatabaseMetaData, FieldMetaData, TableMetaData } from './dataset';
import { neonVariables } from './neon-namespaces';
import * as uuidv4 from 'uuid/v4';

type OptionCallback = (options: any) => boolean;
interface OptionChoice { prettyName: string; variable: any; }

export enum OptionType {
    DATABASE = 'DATABASE',
    FIELD = 'FIELD',
    FIELD_ARRAY = 'FIELD_ARRAY',
    FREE_TEXT = 'FREE_TEXT',
    MULTIPLE_SELECT = 'MULTIPLE_SELECT',
    NON_PRIMITIVE = 'NON_PRIMITIVE',
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
    constructor(bindingKey: string, prettyName: string, isRequired: boolean, enableInMenu: boolean | OptionCallback = true) {
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
        super(OptionType.NON_PRIMITIVE, false, bindingKey, prettyName, valueDefault, undefined, enableInMenu);
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
    private _collection: { [bindingKey: string]: WidgetOption; } = {};

    public _id: string;
    public databases: DatabaseMetaData[] = [];
    public fields: FieldMetaData[] = [];
    public isMultiLayerWidget: boolean = false;
    public layers: WidgetOptionCollection[] = [];
    public layeredWidget: boolean = false;
    public tables: TableMetaData[] = [];

    /**
     * @constructor
     * @arg {Injector} [injector] An injector with bindings; if undefined, uses config.
     * @arg {any} [config] An object with bindings; used if injector is undefined.
     */
    constructor(protected injector?: Injector, protected config?: any) {
        // TODO Do not use a default _id.  Throw an error if undefined!
        this._id = (this.injector ? this.injector.get('_id', uuidv4()) : ((this.config || {})._id || uuidv4()));
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

}

export namespace OptionChoices {
    export const AggregationType: OptionChoice[] = [{
        prettyName: 'Count',
        variable: neonVariables.COUNT
    }, {
        prettyName: 'Average',
        variable: neonVariables.AVG
    }, {
        prettyName: 'Max',
        variable: neonVariables.MAX
    }, {
        prettyName: 'Min',
        variable: neonVariables.MIN
    }, {
        prettyName: 'Sum',
        variable: neonVariables.SUM
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
