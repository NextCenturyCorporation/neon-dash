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

export class YearBucketizer extends Bucketizer {
    public static readonly GRANULARITY = 'year';

    constructor() {
        super(YearBucketizer.GRANULARITY);
    }

    zeroOutDate(date: Date): Date {
        let zeroed = new Date(date);
        zeroed.setUTCMinutes(0);
        zeroed.setUTCSeconds(0);
        zeroed.setUTCMilliseconds(0);
        zeroed.setUTCHours(0);
        zeroed.setUTCDate(1);
        zeroed.setUTCMonth(0);
        return zeroed;
    }

    getBucketIndex(date: Date): number {
        return date.getUTCFullYear() - this.startDate.getUTCFullYear();
    }

    getDateForBucket(bucketIndex: number): Date {
        let newYear = this.startDate.getUTCFullYear() + bucketIndex;
        let dateForBucket = this.zeroOutDate(this.startDate);
        dateForBucket.setUTCFullYear(newYear);
        return dateForBucket;
    }

    roundUpBucket(date: Date): Date {
        let rounded = this.zeroOutDate(date);
        // If the original date is after the zeroed out version, then go to the next bucket
        if (date > rounded) {
            rounded.setUTCFullYear(rounded.getUTCFullYear() + 1);
        }
        if (rounded > this.endDate) {
            rounded = this.zeroOutDate(this.endDate);
        }
        return rounded;
    }

    roundDownBucket(date: Date): Date {
        let rounded = this.zeroOutDate(date);
        if (rounded < this.startDate) {
            rounded = this.zeroOutDate(this.startDate);
        }
        return rounded;
    }

    getDateFormat(): string {
        return 'yyyy';
    }
}
