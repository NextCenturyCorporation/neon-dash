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
import { Pipe, PipeTransform } from '@angular/core';

const suffixes = ['k', 'M', 'G', 'T', 'P', 'E'];

@Pipe({
    name: 'abbreviate'
})
export class AbbreviatePipe implements PipeTransform {
    transform(input: number, precision: number = 0): any {
        if (Number.isNaN(input)) {
            return null;
        } else if (input < 1000) {
            return `${input}`;
        }

        const exp = Math.trunc(
            Math.log(input) / Math.log(1000)
        );

        return (input / Math.pow(1000, exp)).toFixed(precision) + suffixes[exp - 1];
    }
}
