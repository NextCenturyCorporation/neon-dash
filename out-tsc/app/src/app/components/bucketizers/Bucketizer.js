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
/**
 * Abstract bucketizer parent class
 */
var Bucketizer = /** @class */ (function () {
    function Bucketizer(granularity) {
        this.startDate = undefined;
        this.endDate = undefined;
        this.granularity = granularity;
    }
    Bucketizer.prototype.setStartDate = function (newStartDate) {
        this.startDate = newStartDate;
    };
    Bucketizer.prototype.getStartDate = function () {
        return this.startDate;
    };
    Bucketizer.prototype.setEndDate = function (newEndDate) {
        this.endDate = newEndDate;
    };
    Bucketizer.prototype.getEndDate = function () {
        return this.endDate;
    };
    Bucketizer.prototype.setGranularity = function (granularity) {
        this.granularity = granularity;
    };
    /**
     * Get the granularity of the bucketizer
     * @returns {string}
     */
    Bucketizer.prototype.getGranularity = function () {
        return this.granularity;
    };
    /**
     * Get the total number of buckets
     * @returns {number}
     */
    Bucketizer.prototype.getNumBuckets = function () {
        return this.getBucketIndex(this.endDate);
    };
    return Bucketizer;
}());
export { Bucketizer };
//# sourceMappingURL=Bucketizer.js.map