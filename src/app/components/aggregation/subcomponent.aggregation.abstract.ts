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
import { ElementRef } from '@angular/core';

import * as _ from 'lodash';
import * as moment from 'moment-timezone';

export interface AggregationSubcomponentOptions {
    granularity: string;
    hideGridLines: boolean;
    hideGridTicks: boolean;
    lineCurveTension: number;
    lineFillArea: boolean;
    logScaleX: boolean;
    logScaleY: boolean;
    scaleMaxX: string;
    scaleMaxY: string;
    scaleMinX: string;
    scaleMinY: string;
    showHeat: boolean;
    yPercentage: number;
}

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
     * @arg {AggregationSubcomponentOptions} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     */
    constructor(
        protected options: AggregationSubcomponentOptions,
        protected listener: AggregationSubcomponentListener,
        protected elementRef: ElementRef
    ) {}

    /**
     * Deselects the given item or all the subcomponent elements.
     *
     * @arg {any} [item]
     * @abstract
     */
    public abstract deselect(item?: any);

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
     * Initializes all the subcomponent elements.
     *
     * @abstract
     */
    public abstract initialize();

    /**
     * Returns whether the given text is a date string.
     *
     * @arg {string} text
     * @return {boolean}
     */
    protected isDateString(text: string): boolean {
        return moment(text, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]').isValid();
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
     * Returns the given date or string as a pretty date long string.
     *
     * @arg {Date|string} item
     * @return {string}
     */
    protected toDateLongString(item: Date | string): string {
        return moment(item, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]').format('ddd, MMM D, YYYY, h:mm A');
    }

    /**
     * Returns the given date or string as a pretty date short label.
     *
     * @arg {Date|string} item
     * @return {string}
     */
    protected toDateShortLabel(item: Date | string): string {
        let dateObject = moment(item, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        switch (this.options.granularity) {
            case 'minute':
            case 'hour':
                return dateObject.format('MMM D, YYYY, h:mm A');
            case 'day':
                return dateObject.format('MMM D, YYYY');
            case 'month':
                return dateObject.format('MMM YYYY');
            case 'year':
                return dateObject.format('YYYY');
        }
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
