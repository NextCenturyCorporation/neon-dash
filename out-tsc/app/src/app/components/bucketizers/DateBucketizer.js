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
'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Bucketizer } from './Bucketizer';
var DateBucketizer = /** @class */ (function (_super) {
    __extends(DateBucketizer, _super);
    function DateBucketizer() {
        var _this = _super.call(this, DateBucketizer.DAY) || this;
        _this.setGranularity(DateBucketizer.DAY);
        return _this;
    }
    DateBucketizer.prototype.setGranularity = function (newGranularity) {
        this.granularity = newGranularity;
        if (newGranularity === DateBucketizer.DAY) {
            this.millisMultiplier = DateBucketizer.MILLIS_IN_DAY;
        }
        else if (newGranularity === DateBucketizer.HOUR) {
            this.millisMultiplier = DateBucketizer.MILLIS_IN_HOUR;
        }
    };
    DateBucketizer.prototype.getMillisMultiplier = function () {
        return this.millisMultiplier;
    };
    /**
     * Sets the minutes, seconds and millis to 0. If the granularity of the date is day,
     * then the hours are also zeroed
     * @param date
     * @returns {Date}
     */
    DateBucketizer.prototype.zeroOutDate = function (date) {
        var zeroed = new Date(date);
        zeroed.setUTCMinutes(0);
        zeroed.setUTCSeconds(0);
        zeroed.setUTCMilliseconds(0);
        if (this.granularity === DateBucketizer.DAY) {
            zeroed.setUTCHours(0);
        }
        return zeroed;
    };
    /**
     * Calculates the bucket index for the date
     * @param {Date} date the date to get the index of
     * @return 0 if date is before or in the same bucket as the start date, or the number of
     * granularity intervals after the start date otherwise
     */
    DateBucketizer.prototype.getBucketIndex = function (date) {
        var effectiveStartDate = this.zeroOutDate(this.getStartDate());
        var difference = date.getTime() - effectiveStartDate.getTime();
        difference = (difference < 0) ? 0 : difference;
        return Math.floor(difference / this.millisMultiplier);
    };
    /**
     * Calculate the representative date for a particular bucket at the current granularity
     * @param {Number} bucketIndex
     * @return {Date} the date that represents the specified bucket (usually the start of
     * that bucket)
     */
    DateBucketizer.prototype.getDateForBucket = function (bucketIndex) {
        var effectiveStartDate = this.zeroOutDate(this.getStartDate());
        var startDateInMs = effectiveStartDate.getTime();
        return new Date(startDateInMs + (this.millisMultiplier * bucketIndex));
    };
    /**
     * Calculate the number of intervals or buckets needed at the current granularity
     * @return {Number} the number of buckets
     */
    DateBucketizer.prototype.getNumBuckets = function () {
        var effectiveStartDate = this.zeroOutDate(this.getStartDate());
        // We want the start of the next bucket, however, roundUpBucket will not go past the end date and we need this to
        var endDatePlusOneDay = new Date(this.getEndDate().getTime() + this.millisMultiplier);
        var effectiveEndDate = this.zeroOutDate(endDatePlusOneDay);
        // TODO - The absolute value doesn't make sense here; we just don't want negative
        // values
        var difference = Math.abs(effectiveEndDate.getTime() - effectiveStartDate.getTime());
        return Math.ceil(difference / this.millisMultiplier);
    };
    /**
     * Rounds the date up to the beginning of the next bucket, unless the date is already at
     * the start of the current bucket
     * @param date
     * @returns {Date}
     */
    DateBucketizer.prototype.roundUpBucket = function (date) {
        var roundedDate = this.zeroOutDate(new Date(date.getTime() - 1 + this.millisMultiplier));
        if (roundedDate > this.getEndDate()) {
            return this.getEndDate();
        }
        else {
            return roundedDate;
        }
    };
    /**
     * Rounds the date down to the beginning of the current bucket
     * @param date
     * @returns {Date}
     */
    DateBucketizer.prototype.roundDownBucket = function (date) {
        var roundedDate = this.zeroOutDate(new Date(date.getTime() + 1));
        if (roundedDate < this.getStartDate()) {
            return this.getStartDate();
        }
        else {
            return roundedDate;
        }
    };
    DateBucketizer.prototype.getDateFormat = function () {
        if (this.getGranularity() === DateBucketizer.DAY) {
            return 'd MMM yyyy';
        }
        return 'd MMM yyyy HH:mm';
    };
    DateBucketizer.DAY = 'day';
    DateBucketizer.HOUR = 'hour';
    // Cache the number of milliseconds in an hour for processing.
    DateBucketizer.MILLIS_IN_HOUR = 1000 * 60 * 60;
    DateBucketizer.MILLIS_IN_DAY = DateBucketizer.MILLIS_IN_HOUR * 24;
    return DateBucketizer;
}(Bucketizer));
export { DateBucketizer };
//# sourceMappingURL=DateBucketizer.js.map