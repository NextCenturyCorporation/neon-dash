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
var MonthBucketizer = /** @class */ (function (_super) {
    __extends(MonthBucketizer, _super);
    function MonthBucketizer() {
        return _super.call(this, MonthBucketizer.GRANULARITY) || this;
    }
    /**
     * Get a copy of the date with the date/time set to the 1st of the month
     * @param date
     * @returns {Date}
     */
    MonthBucketizer.prototype.zeroOutDate = function (date) {
        var zeroed = new Date(date);
        zeroed.setUTCMinutes(0);
        zeroed.setUTCSeconds(0);
        zeroed.setUTCMilliseconds(0);
        zeroed.setUTCHours(0);
        zeroed.setUTCDate(1);
        return zeroed;
    };
    /**
     * Get the index of the bucket for a specific date
     * @param date
     * @returns {number}
     */
    MonthBucketizer.prototype.getBucketIndex = function (date) {
        var yearDifference = date.getUTCFullYear() - this.startDate.getUTCFullYear();
        var monthDifference = date.getUTCMonth() - this.startDate.getUTCMonth();
        return yearDifference * 12 + monthDifference;
    };
    /**
     * Get the date for a bucket
     * @param bucketIndex
     * @returns {Date}
     */
    MonthBucketizer.prototype.getDateForBucket = function (bucketIndex) {
        var newMonth = this.startDate.getUTCMonth() + bucketIndex;
        var dateForBucket = this.zeroOutDate(this.startDate);
        dateForBucket.setUTCMonth(newMonth);
        return dateForBucket;
    };
    /**
     * Get a date that fits in the bucket (Rounded up) for a date
     * @param date
     * @returns {Date}
     */
    MonthBucketizer.prototype.roundUpBucket = function (date) {
        var rounded = this.zeroOutDate(date);
        // If the original date is after the zeroed out version, then go to the next bucket
        if (date > rounded) {
            rounded.setUTCMonth(rounded.getUTCMonth() + 1);
        }
        if (rounded > this.endDate) {
            rounded = this.zeroOutDate(this.endDate);
        }
        return rounded;
    };
    /**
     * Get a date that fits in the bucket (Rounded down) for a date
     * @param date
     * @returns {Date}
     */
    MonthBucketizer.prototype.roundDownBucket = function (date) {
        var rounded = this.zeroOutDate(date);
        if (rounded < this.startDate) {
            rounded = this.zeroOutDate(this.startDate);
        }
        return rounded;
    };
    MonthBucketizer.prototype.getDateFormat = function () {
        return 'MMM yyyy';
    };
    MonthBucketizer.GRANULARITY = 'month';
    return MonthBucketizer;
}(Bucketizer));
export { MonthBucketizer };
//# sourceMappingURL=MonthBucketizer.js.map