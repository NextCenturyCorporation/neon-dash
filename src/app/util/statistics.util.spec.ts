/**
 * Copyright 2019 Next Century Corporation
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
import { StatisticsUtil } from './statistics.util';

describe('Statistics Util', () => {
    beforeAll(() => {
        /* eslint-disable-next-line no-console */
        console.log('STARTING STATISTICS UTIL TESTS...');
    });

    it('auc test 01', () => {
        const data = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.5);
    });

    it('auc test 02', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.5);
    });

    it('auc test 03', () => {
        const data = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
        expect(StatisticsUtil.auc(data)).toEqual(0);
    });

    it('auc test 04', () => {
        const data = [{ x: 0, y: 1 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(1);
    });

    it('auc test 05', () => {
        const data = [{ x: 0, y: 0 }, { x: 1, y: 0.5 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.25);
    });

    it('auc test 06', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.75);
    });

    it('auc test 07', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.1, y: 0 }, { x: 0.9, y: 1 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.5);
    });

    it('auc test 08', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.01, y: 0 }, { x: 0.99, y: 1 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.5);
    });

    it('auc test 09', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.01, y: 1 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.995);
    });

    it('auc test 10', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.99, y: 0 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.005);
    });

    it('auc test 11', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.01, y: 0.99 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.99);
    });

    it('auc test 12', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.99, y: 0.01 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.01);
    });

    it('auc test 13', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.1, y: 0.8 }, { x: 0.2, y: 0.9 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.885);
    });

    it('auc test 14', () => {
        const data = [{ x: 0, y: 0 }, { x: 0.5, y: 0.6 }, { x: 1, y: 1 }];
        expect(StatisticsUtil.auc(data)).toEqual(0.55);
    });

    it('auc test 15', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.1, y: 0.2 },
            { x: 0.2, y: 0.4 },
            { x: 0.3, y: 0.6 },
            { x: 0.4, y: 0.8 },
            { x: 0.5, y: 1 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.75);
    });

    it('auc test 16', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.01, y: 0.2 },
            { x: 0.02, y: 0.4 },
            { x: 0.03, y: 0.6 },
            { x: 0.04, y: 0.8 },
            { x: 0.05, y: 1 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.975);
    });

    it('auc test 17', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.05, y: 0.1 },
            { x: 0.15, y: 0.2 },
            { x: 0.25, y: 0.3 },
            { x: 0.35, y: 0.4 },
            { x: 0.45, y: 0.5 },
            { x: 0.55, y: 0.6 },
            { x: 0.65, y: 0.7 },
            { x: 0.75, y: 0.8 },
            { x: 0.85, y: 0.9 },
            { x: 0.95, y: 1 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.5475);
    });

    it('auc test 18', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.1, y: 0.15 },
            { x: 0.2, y: 0.25 },
            { x: 0.3, y: 0.35 },
            { x: 0.4, y: 0.45 },
            { x: 0.5, y: 0.55 },
            { x: 0.6, y: 0.65 },
            { x: 0.7, y: 0.75 },
            { x: 0.8, y: 0.85 },
            { x: 0.9, y: 0.95 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.545);
    });

    it('auc test 19', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.1, y: 0.4 },
            { x: 0.2, y: 0.8 },
            { x: 0.3, y: 0.85 },
            { x: 0.4, y: 0.9 },
            { x: 0.5, y: 0.92 },
            { x: 0.6, y: 0.94 },
            { x: 0.7, y: 0.96 },
            { x: 0.8, y: 0.98 },
            { x: 0.9, y: 0.99 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.824);
    });

    it('auc test 20', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.05, y: 0.4 },
            { x: 0.15, y: 0.8 },
            { x: 0.25, y: 0.83 },
            { x: 0.35, y: 0.86 },
            { x: 0.45, y: 0.89 },
            { x: 0.55, y: 0.92 },
            { x: 0.65, y: 0.94 },
            { x: 0.75, y: 0.96 },
            { x: 0.85, y: 0.88 },
            { x: 0.95, y: 0.99 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.8373);
    });

    it('auc test 21', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.05, y: 0.8 },
            { x: 0.1, y: 0.82 },
            { x: 0.2, y: 0.84 },
            { x: 0.3, y: 0.86 },
            { x: 0.4, y: 0.88 },
            { x: 0.5, y: 0.9 },
            { x: 0.6, y: 0.92 },
            { x: 0.7, y: 0.94 },
            { x: 0.8, y: 0.96 },
            { x: 0.9, y: 0.98 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.8795);
    });

    it('auc test 22', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.05, y: 0.8 },
            { x: 0.15, y: 0.82 },
            { x: 0.25, y: 0.84 },
            { x: 0.35, y: 0.86 },
            { x: 0.45, y: 0.88 },
            { x: 0.55, y: 0.9 },
            { x: 0.65, y: 0.92 },
            { x: 0.75, y: 0.94 },
            { x: 0.85, y: 0.96 },
            { x: 0.95, y: 0.98 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.8705);
    });

    it('auc test 23', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.05, y: 0.1 },
            { x: 0.15, y: 0.1 },
            { x: 0.25, y: 0.3 },
            { x: 0.35, y: 0.3 },
            { x: 0.45, y: 0.5 },
            { x: 0.55, y: 0.5 },
            { x: 0.65, y: 0.7 },
            { x: 0.75, y: 0.7 },
            { x: 0.85, y: 0.9 },
            { x: 0.95, y: 0.9 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.5);
    });

    it('auc test 24', () => {
        const data = [
            { x: 0, y: 0 },
            { x: 0.1, y: 0.15 },
            { x: 0.2, y: 0.15 },
            { x: 0.3, y: 0.35 },
            { x: 0.4, y: 0.35 },
            { x: 0.5, y: 0.55 },
            { x: 0.6, y: 0.55 },
            { x: 0.7, y: 0.75 },
            { x: 0.8, y: 0.75 },
            { x: 0.9, y: 0.95 },
            { x: 1, y: 1 }
        ];
        expect(StatisticsUtil.auc(data)).toEqual(0.505);
    });
});
