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

interface MinMax { max: number; min: number; }
type OptionCallback = (options: any) => boolean;
interface OptionChoice { prettyName: string; variable: any; }

export enum OptionType {
    BOOLEAN,
    DATABASE,
    FIELD,
    NUMBER,
    STRING,
    TABLE,
    ARRAY_BOOLEAN,
    ARRAY_FIELD,
    ARRAY_NUMBER,
    ARRAY_STRING
}

export class WidgetOption {
    public valueCurrent: any;

    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {string} isRequired
     * @arg {OptionType} optionType
     * @arg {any} valueDefault
     * @arg {OptionChoice|MinMax} valueChoices
     * @arg {boolean|OptionCallback} [showInMenu=true]
     */
    constructor(
        public bindingKey: string,
        public prettyName: string,
        public isRequired: boolean,
        public optionType: OptionType,
        public valueDefault: any,
        public valueChoices: OptionChoice[] | MinMax,
        public showInMenu: boolean | OptionCallback = true
    ) {}
}

export class WidgetDatabaseOption extends WidgetOption {
    /**
     * @constructor
     */
    constructor() {
        // Value default and choices are set elsewhere.
        super('database', 'Database', true, OptionType.DATABASE, undefined, undefined, true);
    }
}

export class WidgetFieldOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {string} isRequired
     * @arg {boolean|OptionCallback} [showInMenu=true]
     */
    constructor(bindingKey: string, prettyName: string, isRequired: boolean, showInMenu: boolean | OptionCallback = true) {
        // Value default and choices are set elsewhere.
        super(bindingKey, prettyName, isRequired, OptionType.FIELD, undefined, undefined, showInMenu);
    }
}

export class WidgetTableOption extends WidgetOption {
    /**
     * @constructor
     */
    constructor() {
        // Value default and choices are set elsewhere.
        super('table', 'Table', true, OptionType.TABLE, undefined, undefined, true);
    }
}

/**
 * Manages configurable options for all widgets.
 */
export class WidgetOptionCollection {
    // An object containing strings mapped to WidgetOption objects.
    private _collection: { [bindingKey: string]: WidgetOption; } = {};

    public databases: DatabaseMetaData[] = [];
    public fields: FieldMetaData[] = [];
    public tables: TableMetaData[] = [];

    /**
     * @constructor
     * @arg {Injector} injector
     */
    constructor(protected injector: Injector) {}

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
            this.append(option, this.injector.get(option.bindingKey, option.valueDefault));
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
        variable: 'count'
    }, {
        prettyName: 'Average',
        variable: 'average'
    }, {
        prettyName: 'Max',
        variable: 'max'
    }, {
        prettyName: 'Min',
        variable: 'min'
    }, {
        prettyName: 'Sum',
        variable: 'sum'
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
