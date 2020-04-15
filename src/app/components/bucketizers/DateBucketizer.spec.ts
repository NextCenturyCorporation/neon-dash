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

import { DateBucketizer } from './DateBucketizer';

describe('dateBucketizer', () => {
    let bucketizer: DateBucketizer;

    beforeEach(() => {
        bucketizer = new DateBucketizer();
    });

    it('constants are correct', () => {
        expect(DateBucketizer.DAY).toBe('day');
        expect(DateBucketizer.HOUR).toBe('hour');
    });

    it('initial values are correct', () => {
        expect(bucketizer.getStartDate()).toBe(undefined);
        expect(bucketizer.getEndDate()).toBe(undefined);
        expect(bucketizer.getGranularity()).toBe(DateBucketizer.DAY);
        expect(bucketizer.getMillisMultiplier()).toBe(1000 * 60 * 60 * 24);
    });

    it('setters and getters for start and end dates work', () => {
        let past = new Date(1980, 1, 2, 3, 4, 5);
        let future = new Date(2050, 5, 4, 3, 2, 1);
        bucketizer.setStartDate(past);
        bucketizer.setEndDate(future);
        expect(bucketizer.getStartDate()).toBe(past);
        expect(bucketizer.getEndDate()).toBe(future);
    });

    it('switch granularities', () => {
        bucketizer.setGranularity(DateBucketizer.HOUR);
        expect(bucketizer.getGranularity()).toBe(DateBucketizer.HOUR);
        expect(bucketizer.getMillisMultiplier()).toBe(1000 * 60 * 60);
    });

    it('zero out days', () => {
        let originalDay = new Date(1980, 1, 2, 3, 4, 5);
        let zeroDay = bucketizer.zeroOutDate(originalDay);
        expect(zeroDay.getUTCFullYear()).toBe(originalDay.getUTCFullYear());
        expect(zeroDay.getUTCMonth()).toBe(originalDay.getUTCMonth());
        expect(zeroDay.getUTCDate()).toBe(originalDay.getUTCDate());
        expect(zeroDay.getUTCHours()).toBe(0);
        expect(zeroDay.getUTCMinutes()).toBe(0);
        expect(zeroDay.getUTCSeconds()).toBe(0);
        expect(zeroDay.getUTCMilliseconds()).toBe(0);
    });

    it('zero out hours', () => {
        let originalDay = new Date(1980, 1, 2, 3, 4, 5);
        bucketizer.setGranularity('hour');
        let zeroDay = bucketizer.zeroOutDate(originalDay);
        expect(zeroDay.getUTCFullYear()).toBe(originalDay.getUTCFullYear());
        expect(zeroDay.getUTCMonth()).toBe(originalDay.getUTCMonth());
        expect(zeroDay.getUTCDate()).toBe(originalDay.getUTCDate());
        expect(zeroDay.getUTCHours()).toBe(originalDay.getUTCHours());
        expect(zeroDay.getUTCMinutes()).toBe(0);
        expect(zeroDay.getUTCSeconds()).toBe(0);
        expect(zeroDay.getUTCMilliseconds()).toBe(0);
    });

    it('zero out is idempotent (daily)', () => {
        let originalDay = new Date(1980, 1, 2, 3, 4, 5);
        bucketizer.setGranularity(DateBucketizer.DAY);
        let zeroDay = bucketizer.zeroOutDate(originalDay);
        let doubleZeroDay = bucketizer.zeroOutDate(zeroDay);
        expect(doubleZeroDay.toUTCString()).toBe(zeroDay.toUTCString());
    });

    it('zero out is idempotent (hourly)', () => {
        let originalDay = new Date(1980, 1, 2, 3, 4, 5);
        bucketizer.setGranularity(DateBucketizer.HOUR);
        let zeroDay = bucketizer.zeroOutDate(originalDay);
        let doubleZeroDay = bucketizer.zeroOutDate(zeroDay);
        expect(doubleZeroDay.toUTCString()).toBe(zeroDay.toUTCString());
    });

    it('daily bucket index of start date is 0', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        expect(bucketizer.getBucketIndex(startDate)).toBe(0);
    });

    it('daily bucket index of start date plus one day', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        // Create a date that is at the start of the next date
        let nextDay = new Date(Date.UTC(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth(),
            startDate.getUTCDate() + 1,
            0,
            0
        ));
        expect(bucketizer.getBucketIndex(nextDay)).toBe(1);
    });

    it('daily bucket index of start date plus one hour', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        // Create a date that is at the start of the next date
        let nextHour = new Date(Date.UTC(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth(),
            startDate.getUTCDate(),
            startDate.getUTCHours() + 1,
            0
        ));
        expect(bucketizer.getBucketIndex(nextHour)).toBe(0);
    });

    it('hourly bucket index of start date is 0', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        bucketizer.setGranularity(DateBucketizer.HOUR);
        expect(bucketizer.getBucketIndex(startDate)).toBe(0);
    });

    it('hourly bucket index of start date plus one hour', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        bucketizer.setGranularity(DateBucketizer.HOUR);
        // Create a date that is at the start of the next date
        let nextHour = new Date(Date.UTC(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth(),
            startDate.getUTCDate(),
            startDate.getUTCHours() + 1,
            0
        ));
        expect(bucketizer.getBucketIndex(nextHour)).toBe(1);
    });

    it('daily bucket index of start date plus one day if given hours', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        bucketizer.setStartDate(startDate);
        bucketizer.setGranularity(DateBucketizer.HOUR);
        // Create a date that is at the start of the next date
        let nextDay = new Date(Date.UTC(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth(),
            startDate.getUTCDate() + 1,
            startDate.getUTCHours(),
            0
        ));
        expect(bucketizer.getBucketIndex(nextDay)).toBe(24);
    });

    it('getDateForBucket() returns a zeroed out date that matches that bucket (daily)', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        let dateIndex = 1;
        bucketizer.setGranularity(DateBucketizer.DAY);
        bucketizer.setStartDate(startDate);
        let nextDate = bucketizer.getDateForBucket(dateIndex);
        // The representative date should be a zeroed out day
        let zeroNextDay = bucketizer.zeroOutDate(nextDate);
        expect(nextDate.toUTCString()).toBe(zeroNextDay.toUTCString());
        // And the index of the date should be the index we passed in
        expect(bucketizer.getBucketIndex(nextDate)).toBe(dateIndex);
    });

    it('getDateForBucket() returns a zeroed out date that matches that bucket (hourly)', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        let dateIndex = 1;
        bucketizer.setGranularity(DateBucketizer.HOUR);
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

        expect(bucketizer.getNumBuckets()).toBe(1);
    });

    it('get num buckets for same day', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        let laterThatDay = new Date(Date.UTC(1980, 1, 2, 3, 4, 7));
        bucketizer.setStartDate(startDate);
        bucketizer.setEndDate(laterThatDay);

        expect(bucketizer.getNumBuckets()).toBe(1);
    });

    it('get num buckets for start of next day', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        let endDate = new Date(Date.UTC(1980, 1, 3, 0, 0, 0));
        bucketizer.setStartDate(startDate);
        bucketizer.setEndDate(endDate);
        // So long as the end date is on the following UTC day, there will be 2 buckets.  One for each day.
        expect(bucketizer.getNumBuckets()).toBe(2);
    });

    it('get num buckets for mid  of next day', () => {
        let startDate = new Date(Date.UTC(1980, 1, 2, 3, 4, 5));
        let laterThatDay = new Date(Date.UTC(1980, 1, 3, 5, 7, 9));
        bucketizer.setStartDate(startDate);
        bucketizer.setEndDate(laterThatDay);
        // So long as the end date is on the following UTC day, there will be 2 buckets. One for each day.
        expect(bucketizer.getNumBuckets()).toBe(2);
    });
});
