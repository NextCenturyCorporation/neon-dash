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
import { AbbreviatePipe } from './abbreviate.pipe';

describe('AbbreviatePipe', () => {
    it('simple use cases', () => {
        const pipe = new AbbreviatePipe();
        expect(pipe).toBeTruthy();

        expect(pipe.transform(1100, 1)).toEqual('1.1k');
        expect(pipe.transform(1100)).toEqual('1k');
        expect(pipe.transform(10, 1)).toEqual('10');
        expect(pipe.transform(101, 1)).toEqual('101');
        expect(pipe.transform(101)).toEqual('101');
        expect(pipe.transform(1001, 1)).toEqual('1.0k');
        expect(pipe.transform(1000000)).toEqual('1M');
        expect(pipe.transform(Number.NaN)).toEqual(null);
    });
});
