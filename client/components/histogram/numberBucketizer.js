'use strict';
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

var numberBucketizer = numberBucketizer || function() {
    var INTEGER = 'int';
    var FLOAT = 'float';

    var DEFAULT_NUM_BUCKETS = 20;

    var startValue;
    var endValue;
    var numBuckets;
    var bucketSize;

    var getStartValue = function() {
        return startValue;
    };

    var setStartValue = function(value) {
        startValue = value;
    };

    var getEndValue = function() {
        return endValue;
    };

    var setEndValue = function(value) {
        endValue = value;
    };

    var getNumBuckets = function() {
        return numBuckets;
    };

    var setNumBuckets = function(buckets) { // Maybe don't give the user access to this.
        numBuckets = buckets;
        updateBucketSize();
    };

    var updateNumBuckets = function() {
        numBuckets = Math.ceil((endValue - startValue) / bucketSize);
    };

    var getBucketSize = function() {
        if(!bucketSize) {
            bucketSize = (endValue - startValue) / (numBuckets || DEFAULT_NUM_BUCKETS); 
        }
        return bucketSize;
    };

    var setBucketSize = function(size) {
        bucketSize = size;
        updateNumBuckets();
    };

    /*var updateBucketSize = function() {
        bucketSize = 
    };*/

    var getBucketIndex = function(value) {
        if(!numBuckets || !bucketSize) {
            return -1;
        }
        var difference = value - startValue;
        difference = (difference < 0) ? 0 : difference;
        return Math.floor(difference / bucketSize);
    };

    // Returned range goes from low (inclusive) to high (exclusive).
    var getRangeForBucket = function(bucketNumber) {
        var range = {};
        range.low = (bucketNumber <= 0) ? startValue : startValue + bucketNumber * bucketSize;
        range.high = (range.low + bucketSize > endValue) ? endValue : range.low + bucketSize;
        return range;
    };

    return {
        getStartValue: getStartValue,
        setStartValue: setStartValue,
        getEndValue: getEndValue,
        setEndValue: setEndValue,
        getNumBuckets: getNumBuckets,
        setNumBuckets: setNumBuckets,
        getBucketSize: setBucketSize,
        getBucketIndex: getBucketIndex,
        getRangeForBucket: getRangeForBucket
    };
};