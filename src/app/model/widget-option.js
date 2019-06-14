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

export const AggregationType = {
    AVG: 'avg',
    COUNT: 'count',
    MAX: 'max',
    MIN: 'min',
    SUM: 'sum'
};

class OptionChoice {
    constructor(prettyName, variable) {
        this.prettyName = prettyName;
        this.variable = variable;
    }
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
        new OptionChoice('Year', 'year'),
        new OptionChoice('Month', 'month'),
        new OptionChoice('Day', 'day'),
        new OptionChoice('Hour', 'hour'),
        new OptionChoice('Minute', 'minute')
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

export const OptionType = {
    DATABASE: 'DATABASE',
    FIELD: 'FIELD',
    FIELD_ARRAY: 'FIELD_ARRAY',
    FREE_TEXT: 'FREE_TEXT',
    MULTIPLE_SELECT: 'MULTIPLE_SELECT',
    NON_PRIMITIVE: 'NON_PRIMITIVE',
    COLOR: 'COLOR',
    SELECT: 'SELECT',
    TABLE: 'TABLE'
};

export class WidgetOption {
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
        optionType,
        isRequired,
        bindingKey,
        prettyName,
        valueDefault,
        valueChoices,
        hideFromMenu
    ) {
        this.optionType = optionType;
        this.isRequired = isRequired;
        this.bindingKey = bindingKey;
        this.prettyName = prettyName;
        this.valueDefault = valueDefault;
        this.valueChoices = valueChoices;
        this.hideFromMenu = hideFromMenu || false;
    }

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
        bindingKey,
        prettyName,
        valueDefault,
        hideFromMenu
    ) {
        super(OptionType.COLOR, false, bindingKey, prettyName, valueDefault, undefined, hideFromMenu || false);
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
    constructor(bindingKey, prettyName, isRequired, hideFromMenu) {
        // Value default and choices are set elsewhere.
        super(OptionType.FIELD_ARRAY, isRequired, bindingKey, prettyName, undefined, undefined, hideFromMenu || false);
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
    constructor(bindingKey, prettyName, isRequired, hideFromMenu) {
        // Value default and choices are set elsewhere.
        super(OptionType.FIELD, isRequired || false, bindingKey, prettyName, undefined, undefined, hideFromMenu || false);
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
        bindingKey,
        prettyName,
        valueDefault,
        hideFromMenu
    ) {
        super(OptionType.FREE_TEXT, false, bindingKey, prettyName, valueDefault, undefined, hideFromMenu || false);
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
        bindingKey,
        prettyName,
        valueDefault,
        valueChoices,
        hideFromMenu
    ) {
        super(OptionType.MULTIPLE_SELECT, true, bindingKey, prettyName, valueDefault, valueChoices, hideFromMenu || false);
    }
}

export class WidgetNonPrimitiveOption extends WidgetOption {
    /**
     * @constructor
     * @arg {string} bindingKey
     * @arg {string} prettyName
     * @arg {any} valueDefault
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(
        bindingKey,
        prettyName,
        valueDefault,
        hideFromMenu
    ) {
        super(OptionType.NON_PRIMITIVE, false, bindingKey, prettyName, valueDefault, undefined, hideFromMenu || false);
        this._intermediateValue = undefined;
    }

    get intermediateValue() {
        if (this._intermediateValue === undefined) {
            try {
                const value = this.valueCurrent || this.valueDefault;
                this._intermediateValue = _.isEmpty(value) ? '' : yaml.safeDump(value);
            } catch {
                // Ignore error
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
     * @arg {boolean|function} [hideFromMenu=false]
     */
    constructor(
        bindingKey,
        prettyName,
        valueDefault,
        valueChoices,
        hideFromMenu
    ) {
        super(OptionType.SELECT, true, bindingKey, prettyName, valueDefault, valueChoices, hideFromMenu || false);
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
