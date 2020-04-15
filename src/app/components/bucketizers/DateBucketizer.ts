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

import { Bucketizer } from './Bucketizer';

export class DateBucketizer extends Bucketizer {
    public static readonly DAY: string = 'day';
    public static readonly HOUR: string = 'hour';
    // Cache the number of milliseconds in an hour for processing.
    public static readonly MILLIS_IN_HOUR: number = 1000 * 60 * 60;
    public static readonly MILLIS_IN_DAY: number = DateBucketizer.MILLIS_IN_HOUR * 24;

    private millisMultiplier: number;

    constructor() {
        super(DateBucketizer.DAY);
        this.setGranularity(DateBucketizer.DAY);
    }

    setGranularity(newGranularity: string): void {
        this.granularity = newGranularity;
        if (newGranularity === DateBucketizer.DAY) {
            this.millisMultiplier = DateBucketizer.MILLIS_IN_DAY;
        } else if (newGranularity === DateBucketizer.HOUR) {
            this.millisMultiplier = DateBucketizer.MILLIS_IN_HOUR;
        }
    }

    getMillisMultiplier(): number {
        return this.millisMultiplier;
    }

    /**
     * Sets the minutes, seconds and millis to 0. If the granularity of the date is day,
     * then the hours are also zeroed
     * @param date
     * @returns {Date}
     */
    zeroOutDate(date: Date): Date {
        let zeroed = new Date(date);
        zeroed.setUTCMinutes(0);
        zeroed.setUTCSeconds(0);
        zeroed.setUTCMilliseconds(0);
        if (this.granularity === DateBucketizer.DAY) {
            zeroed.setUTCHours(0);
        }
        return zeroed;
    }

    /**
     * Calculates the bucket index for the date
     * @param {Date} date the date to get the index of
     * @return 0 if date is before or in the same bucket as the start date, or the number of
     * granularity intervals after the start date otherwise
     */
    getBucketIndex(date: Date): number {
        let effectiveStartDate = this.zeroOutDate(this.getStartDate());
        let difference = date.getTime() - effectiveStartDate.getTime();
        difference = (difference < 0) ? 0 : difference;
        return Math.floor(difference / this.millisMultiplier);
    }

    /**
     * Calculate the representative date for a particular bucket at the current granularity
     * @param {Number} bucketIndex
     * @return {Date} the date that represents the specified bucket (usually the start of
     * that bucket)
     */
    getDateForBucket(bucketIndex: number): Date {
        let effectiveStartDate = this.zeroOutDate(this.getStartDate());
        let startDateInMs = effectiveStartDate.getTime();
        return new Date(startDateInMs + (this.millisMultiplier * bucketIndex));
    }

    /**
     * Calculate the number of intervals or buckets needed at the current granularity
     * @return {Number} the number of buckets
     */
    getNumBuckets(): number {
        let effectiveStartDate = this.zeroOutDate(this.getStartDate());
        // We want the start of the next bucket, however, roundUpBucket will not go past the end date and we need this to
        let endDatePlusOneDay = new Date(this.getEndDate().getTime() + this.millisMultiplier);
        let effectiveEndDate = this.zeroOutDate(endDatePlusOneDay);

        // TODO - The absolute value doesn't make sense here; we just don't want negative
        // values
        let difference = Math.abs(effectiveEndDate.getTime() - effectiveStartDate.getTime());
        return Math.ceil(difference / this.millisMultiplier);
    }

    /**
     * Rounds the date up to the beginning of the next bucket, unless the date is already at
     * the start of the current bucket
     * @param date
     * @returns {Date}
     */
    roundUpBucket(date): Date {
        let roundedDate = this.zeroOutDate(new Date(date.getTime() - 1 + this.millisMultiplier));
        if (roundedDate > this.getEndDate()) {
            return this.getEndDate();
        }
        return roundedDate;
    }

    /**
     * Rounds the date down to the beginning of the current bucket
     * @param date
     * @returns {Date}
     */
    roundDownBucket(date): Date {
        let roundedDate = this.zeroOutDate(new Date(date.getTime() + 1));
        if (roundedDate < this.getStartDate()) {
            return this.getStartDate();
        }
        return roundedDate;
    }

    getDateFormat(): string {
        if (this.getGranularity() === DateBucketizer.DAY) {
            return 'd MMM yyyy';
        }
        return 'd MMM yyyy HH:mm';
    }
}
