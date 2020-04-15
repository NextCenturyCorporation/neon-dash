/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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

'use strict';

import { YearBucketizer } from './YearBucketizer';

describe('yearBucketizer', () => {
    let bucketizer;

    beforeEach(() => {
        bucketizer = new YearBucketizer();
    });

    it('initial values are correct', () => {
        expect(bucketizer.getStartDate()).toBe(undefined);
        expect(bucketizer.getEndDate()).toBe(undefined);
    });

    it('setters and getters for start and end dates work', () => {
        let past = new Date(1980, 1, 2, 3, 4, 5);
        let future = new Date(2050, 5, 4, 3, 2, 1);
        bucketizer.setStartDate(past);
        bucketizer.setEndDate(future);
        expect(bucketizer.getStartDate()).toBe(past);
        expect(bucketizer.getEndDate()).toBe(future);
    });

    it('zero out year', () => {
        let originalDay = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        let zeroDay = bucketizer.zeroOutDate(originalDay);
        expect(zeroDay.getUTCFullYear()).toBe(originalDay.getUTCFullYear());
        expect(zeroDay.getUTCMonth()).toBe(0);
        expect(zeroDay.getUTCDate()).toBe(1);
        expect(zeroDay.getUTCHours()).toBe(0);
        expect(zeroDay.getUTCMinutes()).toBe(0);
        expect(zeroDay.getUTCSeconds()).toBe(0);
        expect(zeroDay.getUTCMilliseconds()).toBe(0);
    });

    it('zero out is idempotent', () => {
        let originalDate = new Date(1980, 1, 2, 3, 4, 5);
        let zeroDate = bucketizer.zeroOutDate(originalDate);
        let doubleZeroDate = bucketizer.zeroOutDate(zeroDate);
        expect(doubleZeroDate.toUTCString()).toBe(zeroDate.toUTCString());
    });

    it('bucket index of start date is 0', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        expect(bucketizer.getBucketIndex(startDate)).toBe(0);
    });

    it('bucket index of later that year is 0', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        let laterThatYear = new Date(startDate);
        laterThatYear.setUTCMonth(11);
        expect(bucketizer.getBucketIndex(laterThatYear)).toBe(0);
    });

    it('bucket index of the next year is 1', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        let nextYear = new Date(Date.UTC(1981, 0, 1));
        expect(bucketizer.getBucketIndex(nextYear)).toBe(1);
    });

    it('getDateForBucket() returns a zeroed out date that matches that bucket', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        let dateIndex = 1;
        bucketizer.setStartDate(startDate);
        let nextDate = bucketizer.getDateForBucket(dateIndex);
        // The representative date should be a zeroed out day
        let zeroNextDay = bucketizer.zeroOutDate(nextDate);
        expect(nextDate.toUTCString()).toBe(zeroNextDay.toUTCString());
        // And the index of the date should be the index we passed in
        expect(bucketizer.getBucketIndex(nextDate)).toBe(dateIndex);
    });

    it('get num buckets for zero length', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        bucketizer.setEndDate(startDate);
        // All data is expected to be before the zeroed out end date, so if the end date is the same
        // as the start date, then there can't be any data.
        expect(bucketizer.getNumBuckets()).toBe(0);
    });

    it('get num buckets for next year', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        let nextYear = new Date(Date.UTC(1981, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        bucketizer.setEndDate(nextYear);
        // So long as the end date is on the following UTC day, there will be 1 bucket
        expect(bucketizer.getNumBuckets()).toBe(1);
    });

    it('round down bucket works like zero out date', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);

        let nextYear = new Date(Date.UTC(1981, 0, 2, 3, 4, 5));
        expect(bucketizer.roundDownBucket(nextYear).toUTCString()).toBe(bucketizer.getDateForBucket(1).toUTCString());
    });

    it('round down bucket will not go before start date', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);

        let previousYear = new Date(Date.UTC(1979, 0, 1, 3, 4, 5));
        expect(bucketizer.roundDownBucket(previousYear).toUTCString()).toBe(bucketizer.getDateForBucket(0).toUTCString());
    });

    it('round up bucket goes to the start of the first bucket after the provided date', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);

        // One second later than the start date, so go to the next bucket
        let nextSecond = new Date(Date.UTC(1980, 1, 2, 3, 4, 6));
        expect(bucketizer.roundUpBucket(nextSecond).toUTCString()).toBe(bucketizer.getDateForBucket(1).toUTCString());
    });

    it('round up bucket is idempotent', () => {
        // One second later than the start date, so go to the next bucket
        let nextSecond = new Date(Date.UTC(1980, 1, 2, 3, 4, 6));
        let rounded = bucketizer.roundUpBucket(nextSecond);
        expect(bucketizer.roundUpBucket(rounded).toUTCString()).toBe(rounded.toUTCString());
    });

    it('round up bucket will not go after end date', () => {
        let endDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setEndDate(endDate);

        let nextYear = new Date(Date.UTC(1981, 1, 2, 3, 4, 5));
        let lastBucketDate = bucketizer.zeroOutDate(bucketizer.getEndDate());
        expect(bucketizer.roundUpBucket(nextYear).toUTCString()).toBe(lastBucketDate.toUTCString());
    });
});
