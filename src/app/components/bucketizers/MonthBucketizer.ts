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

import { Bucketizer } from './Bucketizer';

export class MonthBucketizer extends Bucketizer {
    public static readonly GRANULARITY = 'month';

    constructor() {
        super(MonthBucketizer.GRANULARITY);
    }

    /**
     * Get a copy of the date with the date/time set to the 1st of the month
     * @param date
     * @returns {Date}
     */
    zeroOutDate(date: Date): Date {
        let zeroed = new Date(date);
        zeroed.setUTCMinutes(0);
        zeroed.setUTCSeconds(0);
        zeroed.setUTCMilliseconds(0);
        zeroed.setUTCHours(0);
        zeroed.setUTCDate(1);
        return zeroed;
    }

    /**
     * Get the index of the bucket for a specific date
     * @param date
     * @returns {number}
     */
    getBucketIndex(date: Date): number {
        let yearDifference = date.getUTCFullYear() - this.startDate.getUTCFullYear();
        let monthDifference = date.getUTCMonth() - this.startDate.getUTCMonth();
        return yearDifference * 12 + monthDifference;
    }

    /**
     * Get the date for a bucket
     * @param bucketIndex
     * @returns {Date}
     */
    getDateForBucket(bucketIndex: number): Date {
        let newMonth = this.startDate.getUTCMonth() + bucketIndex;
        let dateForBucket = this.zeroOutDate(this.startDate);
        dateForBucket.setUTCMonth(newMonth);
        return dateForBucket;
    }

    /**
     * Get a date that fits in the bucket (Rounded up) for a date
     * @param date
     * @returns {Date}
     */
    roundUpBucket(date: Date): Date {
        let rounded = this.zeroOutDate(date);
        // If the original date is after the zeroed out version, then go to the next bucket
        if (date > rounded) {
            rounded.setUTCMonth(rounded.getUTCMonth() + 1);
        }
        if (rounded > this.endDate) {
            rounded = this.zeroOutDate(this.endDate);
        }
        return rounded;
    }

    /**
     * Get a date that fits in the bucket (Rounded down) for a date
     * @param date
     * @returns {Date}
     */
    roundDownBucket(date: Date): Date {
        let rounded = this.zeroOutDate(date);
        if (rounded < this.startDate) {
            rounded = this.zeroOutDate(this.startDate);
        }
        return rounded;
    }

    getDateFormat(): string {
        return 'MMM yyyy';
    }
}
