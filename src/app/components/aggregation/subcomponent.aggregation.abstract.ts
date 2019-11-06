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
import { ElementRef } from '@angular/core';

import { DateFormat, DateUtil } from 'component-library/dist/core/date.util';

import * as _ from 'lodash';

export interface AggregationSubcomponentListener {

    /**
     * Returns the hidden canvas element reference for the subcomponent.
     *
     * @return {ElementRef}
     * @abstract
     */
    getHiddenCanvas(): ElementRef;

    /**
     * Deselects the selected area.
     *
     * @abstract
     */
    subcomponentRequestsDeselect();

    /**
     * Filters the given value.
     *
     * @arg {string} group
     * @arg {any} value
     * @arg {boolean} doNotReplace
     * @override
     */
    subcomponentRequestsFilter(group: string, value: any, doNotReplace?: boolean);

    /**
     * Filters the given bounds.
     *
     * @arg {any} beginX
     * @arg {any} beginY
     * @arg {any} endX
     * @arg {any} endY
     * @arg {boolean} [doNotReplace=false]
     * @abstract
     */
    subcomponentRequestsFilterOnBounds(beginX: any, beginY: any, endX: any, endY: any, doNotReplace?: boolean);

    /**
     * Filters the given domain.
     *
     * @arg {any} beginX
     * @arg {any} endX
     * @arg {boolean} [doNotReplace=false]
     * @abstract
     */
    subcomponentRequestsFilterOnDomain(beginX: any, endX: any, doNotReplace?: boolean);

    /**
     * Redraws the component.
     *
     * @arg {event} [event]
     * @abstract
     */
    subcomponentRequestsRedraw(event?);

    /**
     * Selects the given area.
     *
     * @arg {number} x
     * @arg {number} y
     * @arg {number} width
     * @arg {number} height
     * @abstract
     */
    subcomponentRequestsSelect(x: number, y: number, width: number, height: number);
}

export abstract class AbstractAggregationSubcomponent {
    /**
     * @constructor
     * @arg {any} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     */
    constructor(
        protected options: any,
        protected listener: AggregationSubcomponentListener,
        protected elementRef: ElementRef
    ) { }

    /**
     * Destroys all the subcomponent elements.
     *
     * @abstract
     */
    public abstract destroy();

    /**
     * Draws all the subcomponent elements with the given data and metadata.
     *
     * @arg {array} data
     * @arg {any} meta
     * @abstract
     */
    public abstract draw(data: any[], meta: any);

    /**
     * Returns the minimum dimensions needed for the subcomponent.
     *
     * @return { { height: number, width: number } }
     * @abstract
     */
    public abstract getMinimumDimensions(): { height: number, width: number };

    /**
     * Returns the label for a visualization element using the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @abstract
     */
    public abstract getVisualizationElementLabel(count: number): string;

    /**
     * Configures the visualization to ignore any of the user's "select" events.
     *
     * @abstract
     */
    public abstract ignoreSelectEvents(): void;

    /**
     * Initializes all the subcomponent elements.
     *
     * @return {boolean}
     * @abstract
     */
    public abstract initialize();

    /**
     * Returns whether the chart is horizontal.
     *
     * @return {boolean}
     * @abstract
     */
    public abstract isHorizontal(): boolean;

    /**
     * Returns whether the given text is a date string.
     *
     * @arg {string} text
     * @return {boolean}
     */
    protected isDateString(text: string): boolean {
        return DateUtil.verifyDateStringStrict(text);
    }

    /**
     * Returns whether the given text is a finite number string.
     *
     * @arg {string} text
     * @return {boolean}
     */
    protected isNumberString(text: string): boolean {
        return _.isFinite(_.toNumber(text));
    }

    /**
     * Redraws all the subcomponent elements.
     *
     * @abstract
     */
    public abstract redraw();

    /**
     * Selects the given items and deselects all other items.
     *
     * @arg {any[]} items
     * @abstract
     */
    public abstract select(items: any[]): void;

    /**
     * Returns the given date or string as a pretty date long string.
     *
     * @arg {Date|string} item
     * @return {string}
     */
    protected toDateLongString(item: Date | string): string {
        return DateUtil.fromDateToString(item, DateFormat.PRETTY);
    }

    /**
     * Returns the given date or string as a pretty date short label.
     *
     * @arg {Date|string} item
     * @return {string}
     */
    protected toDateShortLabel(item: Date | string): string {
        switch (this.options.granularity) {
            case 'minute':
            case 'hour':
                return DateUtil.fromDateToString(item, DateFormat.MINUTE);
            case 'day':
                return DateUtil.fromDateToString(item, DateFormat.DAY);
            case 'month':
                return DateUtil.fromDateToString(item, DateFormat.MONTH);
            case 'year':
                return DateUtil.fromDateToString(item, DateFormat.YEAR);
        }
        return '';
    }

    /**
     * Returns the given number or string as a pretty number string (with commas).
     *
     * @arg {number} item
     * @return {string}
     */
    protected toNumberString(item: number | string): string {
        let itemAsNumber = _.toNumber(item);
        if (!_.isInteger(itemAsNumber)) {
            itemAsNumber = Math.round((itemAsNumber + 0.001) * 100) / 100;
            itemAsNumber = itemAsNumber > 999 ? Math.trunc(itemAsNumber) : itemAsNumber;
        }
        if (_.isInteger(itemAsNumber)) {
            return ('' + itemAsNumber).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        return '' + itemAsNumber;
    }
}
