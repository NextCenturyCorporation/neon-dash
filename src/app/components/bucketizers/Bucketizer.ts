/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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

/**
 * Abstract bucketizer parent class
 */
export abstract class Bucketizer {
    protected startDate: Date;
    protected endDate: Date;
    protected granularity: string;

    constructor(granularity: string) {
        this.startDate = undefined;
        this.endDate = undefined;
        this.granularity = granularity;
    }

    setStartDate(newStartDate: Date): void {
        this.startDate = newStartDate;
    }

    getStartDate(): Date {
        return this.startDate;
    }

    setEndDate(newEndDate: Date): void {
        this.endDate = newEndDate;
    }

    getEndDate(): Date {
        return this.endDate;
    }

    setGranularity(granularity: string): void {
        this.granularity = granularity;
    }

    /**
     * Get the granularity of the bucketizer
     * @returns {string}
     */
    getGranularity(): string {
        return this.granularity;
    }

    /**
     * Get the total number of buckets
     * @returns {number}
     */
    getNumBuckets(): number {
        return this.getBucketIndex(this.endDate);
    }

    /**
     * Get a copy of the date with the date/time set to the beginning of the bucket
     * @param date
     * @returns {Date}
     */
    abstract zeroOutDate(date: Date): Date;

    /**
     * Get the index of the bucket for a specific date
     * @param date
     * @returns {number}
     */
    abstract getBucketIndex(date: Date): number;

    /**
     * Get the date forthe start of a bucket
     * @param bucketIndex
     * @returns {Date}
     */
    abstract getDateForBucket(bucketIndex: number): Date;

    /**
     * Get a date that fits in the bucket (Rounded up) for a date
     * @param date
     * @returns {Date}
     */
    abstract roundUpBucket(date: Date): Date;

    /**
     * Get a date that fits in the bucket (Rounded down) for a date
     * @param date
     * @returns {Date}
     */
    abstract roundDownBucket(date: Date): Date;

    /**
     * Get the date format for this bucketizer
     */
    abstract getDateFormat(): string;
}
