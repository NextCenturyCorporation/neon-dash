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
var YearBucketizer = /** @class */ (function (_super) {
    __extends(YearBucketizer, _super);
    function YearBucketizer() {
        return _super.call(this, YearBucketizer.GRANULARITY) || this;
    }
    YearBucketizer.prototype.zeroOutDate = function (date) {
        var zeroed = new Date(date);
        zeroed.setUTCMinutes(0);
        zeroed.setUTCSeconds(0);
        zeroed.setUTCMilliseconds(0);
        zeroed.setUTCHours(0);
        zeroed.setUTCDate(1);
        zeroed.setUTCMonth(0);
        return zeroed;
    };
    YearBucketizer.prototype.getBucketIndex = function (date) {
        return date.getUTCFullYear() - this.startDate.getUTCFullYear();
    };
    YearBucketizer.prototype.getDateForBucket = function (bucketIndex) {
        var newYear = this.startDate.getUTCFullYear() + bucketIndex;
        var dateForBucket = this.zeroOutDate(this.startDate);
        dateForBucket.setUTCFullYear(newYear);
        return dateForBucket;
    };
    YearBucketizer.prototype.roundUpBucket = function (date) {
        var rounded = this.zeroOutDate(date);
        // If the original date is after the zeroed out version, then go to the next bucket
        if (date > rounded) {
            rounded.setUTCFullYear(rounded.getUTCFullYear() + 1);
        }
        if (rounded > this.endDate) {
            rounded = this.zeroOutDate(this.endDate);
        }
        return rounded;
    };
    YearBucketizer.prototype.roundDownBucket = function (date) {
        var rounded = this.zeroOutDate(date);
        if (rounded < this.startDate) {
            rounded = this.zeroOutDate(this.startDate);
        }
        return rounded;
    };
    YearBucketizer.prototype.getDateFormat = function () {
        return 'yyyy';
    };
    YearBucketizer.GRANULARITY = 'year';
    return YearBucketizer;
}(Bucketizer));
export { YearBucketizer };
//# sourceMappingURL=YearBucketizer.js.map