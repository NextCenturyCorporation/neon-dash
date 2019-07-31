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
import * as _ from 'lodash';
import * as yaml from 'js-yaml';

export enum AggregationType {
    AVG = 'avg',
    COUNT = 'count',
    MAX = 'max',
    MIN = 'min',
    SUM = 'sum'
}

export enum CompoundFilterType {
    AND = 'and',
    OR = 'or'
}

export enum SortOrder {
    ASCENDING = 'ascending',
    DESCENDING = 'descending'
}

export enum TimeInterval {
    MINUTE = 'minute',
    HOUR = 'hour',
    DAY_OF_MONTH = 'dayOfMonth',
    MONTH = 'month',
    YEAR = 'year'
}

type OptionCallback = (options: any) => boolean;

class OptionChoice {
    constructor(public prettyName: string, public variable: any) { }
}

export const OptionChoices = {
    Aggregation: [
        new OptionChoice('Count', AggregationType.COUNT),
        new OptionChoice('Average', AggregationType.AVG),
        new OptionChoice('Max', AggregationType.MAX),
        new OptionChoice('Min', AggregationType.MIN),
        new OptionChoice('Sum', AggregationType.SUM)
    ],

    AscendingFalseDescendingTrue: [
        new OptionChoice('Ascending', false),
        new OptionChoice('Descending', true)
    ],

    DateGranularity: [
        new OptionChoice('Year', TimeInterval.YEAR),
        new OptionChoice('Month', TimeInterval.MONTH),
        new OptionChoice('Day', TimeInterval.DAY_OF_MONTH),
        new OptionChoice('Hour', TimeInterval.HOUR),
        new OptionChoice('Minute', TimeInterval.MINUTE)
    ],

    HideFalseShowTrue: [
        new OptionChoice('Hide', false),
        new OptionChoice('Show', true)
    ],

    NoFalseYesTrue: [
        new OptionChoice('No', false),
        new OptionChoice('Yes', true)
    ],

    OrFalseAndTrue: [
        new OptionChoice('OR', false),
        new OptionChoice('AND', true)
    ],

    ShowFalseHideTrue: [
        new OptionChoice('Show', false),
        new OptionChoice('Hide', true)
    ],

    YesFalseNoTrue: [
        new OptionChoice('Yes', false),
        new OptionChoice('No', true)
    ]
};

export enum OptionType {
    COLOR = 'COLOR',
    DATABASE = 'DATABASE',
    FIELD = 'FIELD',
    FIELD_ARRAY = 'FIELD_ARRAY',
    FREE_TEXT = 'FREE_TEXT',
    MULTIPLE_SELECT = 'MULTIPLE_SELECT',
    NON_PRIMITIVE = 'NON_PRIMITIVE',
    NUMBER = 'NUMBER',
    SELECT = 'SELECT',
    TABLE = 'TABLE'
}

export class WidgetOption {
    public valueCurrent: any;

    /**
     * @constructor
     * @arg {OptionType} optionType
     * @arg {boolean} isRequired
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {OptionChoice[]} valueChoices
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(
        public optionType: OptionType,
        public isRequired: boolean,
        public bindingKey: string,
        public prettyName: string,
        public valueDefault: any,
        public valueChoices: OptionChoice[],
        public hideFromMenu: boolean | OptionCallback = false
    ) { }

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     */
    getValueToSaveInBindings() {
        return this.valueCurrent;
    }
}

export class WidgetColorOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(
        bindingKey: string,
        prettyName: string,
        valueDefault: any,
        hideFromMenu: boolean | OptionCallback = false
    ) {
        super(OptionType.COLOR, false, bindingKey, prettyName, valueDefault, undefined, hideFromMenu);
    }
}

export class WidgetDatabaseOption extends WidgetOption {
    /**
     * @constructor
     */
    constructor() {
        // Value default and choices are set elsewhere.
        super(OptionType.DATABASE, true, 'database', 'Database', undefined, undefined, false);
    }

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     * @override
     */
    getValueToSaveInBindings() {
        return this.valueCurrent.name;
    }
}

export class WidgetFieldArrayOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {boolean} isRequired
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(bindingKey: string, prettyName: string, isRequired: boolean, hideFromMenu: boolean | OptionCallback = false) {
        // Value default and choices are set elsewhere.
        super(OptionType.FIELD_ARRAY, isRequired, bindingKey, prettyName, undefined, undefined, hideFromMenu);
    }

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     * @override
     */
    getValueToSaveInBindings() {
        return this.valueCurrent.map((fieldElement) => fieldElement.columnName);
    }
}

export class WidgetFieldOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {boolean} [isRequired=false]
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(bindingKey: string, prettyName: string, isRequired: boolean = false, hideFromMenu: boolean | OptionCallback = false) {
        // Value default and choices are set elsewhere.
        super(OptionType.FIELD, isRequired, bindingKey, prettyName, undefined, undefined, hideFromMenu);
    }

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     * @override
     */
    getValueToSaveInBindings() {
        return this.valueCurrent.columnName;
    }
}

export class WidgetFreeTextOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(
        bindingKey: string,
        prettyName: string,
        valueDefault: any,
        hideFromMenu: boolean | OptionCallback = false
    ) {
        super(OptionType.FREE_TEXT, false, bindingKey, prettyName, valueDefault, undefined, hideFromMenu);
    }
}

export class WidgetMultipleSelectOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {OptionChoice[]} valueChoices
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(
        bindingKey: string,
        prettyName: string,
        valueDefault: any,
        valueChoices: OptionChoice[],
        hideFromMenu: boolean | OptionCallback = false
    ) {
        super(OptionType.MULTIPLE_SELECT, true, bindingKey, prettyName, valueDefault, valueChoices, hideFromMenu);
    }
}

export class WidgetNonPrimitiveOption extends WidgetOption {
    private _intermediateValue: string;

    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(
        bindingKey: string,
        prettyName: string,
        valueDefault: any,
        hideFromMenu: boolean | OptionCallback = false
    ) {
        super(OptionType.NON_PRIMITIVE, false, bindingKey, prettyName, valueDefault, undefined, hideFromMenu);
        this._intermediateValue = undefined;
    }

    get intermediateValue() {
        if (this._intermediateValue === undefined) {
            try {
                const value = this.valueCurrent || this.valueDefault;
                this._intermediateValue = _.isEmpty(value) ? '' : yaml.safeDump(value);
            } catch {
                console.error('ERROR WidgetNonPrimitiveOption: get intermediateValue() failed');
            }
            this._intermediateValue = this._intermediateValue || '';
        }
        return this._intermediateValue;
    }

    set intermediateValue(value) {
        this._intermediateValue = value;
        try {
            this.valueCurrent = _.isEmpty(value) ? undefined : yaml.safeLoad(this._intermediateValue);
        } catch {
            console.error('ERROR WidgetNonPrimitiveOption: set intermediateValue() failed');
        }
    }

    getValueToSaveInBindings() {
        delete this._intermediateValue;
        return this.valueCurrent || this.valueDefault;
    }
}

export class WidgetNumberOption extends WidgetOption {
    private _intermediateValue: number|string;

    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(
        bindingKey: string,
        prettyName: string,
        valueDefault: any,
        hideFromMenu: boolean | OptionCallback = false
    ) {
        super(OptionType.NUMBER, false, bindingKey, prettyName, valueDefault, undefined, hideFromMenu);
        this._intermediateValue = undefined;
    }

    get intermediateValue() {
        if (this._intermediateValue === undefined) {
            try {
                const value = this.valueCurrent || this.valueDefault;
                this._intermediateValue = _.isNumber(_.toNumber(value)) ? value : null;
            } catch {
                console.error('ERROR WidgetNumberOption: get intermediateValue() failed');
            }
            this._intermediateValue = this._intermediateValue;
        }
        return this._intermediateValue;
    }

    set intermediateValue(value) {
        this._intermediateValue = value;
        try {
            this.valueCurrent = !_.isNaN(Number(value)) ? this._intermediateValue : null;
        } catch {
            console.error('ERROR WidgetNumberOption: set intermediateValue() failed');
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
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(
        bindingKey: string,
        prettyName: string,
        valueDefault: any,
        valueChoices: OptionChoice[],
        hideFromMenu: boolean | OptionCallback = false
    ) {
        super(OptionType.SELECT, true, bindingKey, prettyName, valueDefault, valueChoices, hideFromMenu);
    }
}

export class WidgetTableOption extends WidgetOption {
    /**
     * @constructor
     */
    constructor() {
        // Value default and choices are set elsewhere.
        super(OptionType.TABLE, true, 'table', 'Table', undefined, undefined, false);
    }

    /**
     * Returns the current value to save in the bindings.
     *
     * @return {any}
     * @override
     */
    getValueToSaveInBindings() {
        return this.valueCurrent.name;
    }
}

/**
 * Returns whether the given WidgetOption object is a FIELD or FIELD_ARRAY.
 */
export function isFieldOption(option) {
    return option.optionType === OptionType.FIELD || option.optionType === OptionType.FIELD_ARRAY;
}
