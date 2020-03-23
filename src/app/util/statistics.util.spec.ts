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

describe('Statistics Util ROC Curve', () => {
    // From https://github.com/scikit-learn/scikit-learn/blob/master/sklearn/metrics/tests/test_ranking.py

    /* eslint-disable max-len */
    const yLabels = [0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0];
    const yScores = [0.45694917, 0.29426178, 0.62909544, 0.52564127, 0.43930741, 0.40326766, 0.63564666, 0.7078242, 0.43521499, 0.2973276, 0.73049925, 0.51426788, 0.5, 0.58127285, 0.2910559, 0.40226652, 0.59710459, 0.42453628, 0.60622856, 0.30087059, 0.23674613, 0.70308893, 0.38839061, 0.41488322, 0.57563921, 0.29777361, 0.7138464, 0.58414426, 0.36815957, 0.34806711, 0.39806773, 0.24045098, 0.31232754, 0.47886189, 0.55994448, 0.1957087, 0.16537287, 0.5, 0.59267271, 0.50743622, 0.45198026, 0.58069845, 0.48409389, 0.64544662, 0.32097684, 0.24951254, 0.54268176, 0.66017933, 0.49305559, 0.40135854];
    const fprArray = [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.84, 0.88, 0.92, 0.96, 1];
    const tprArray = [0.08, 0.4, 0.64, 0.8, 0.84, 0.96, 0.96, 0.96, 0.96, 0.96, 0.96, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    /* eslint-enable max-len */

    const bisectorPointArray: any[] = [{
        category: '',
        x: 0,
        y: 0
    }, {
        category: '',
        x: 1,
        y: 1
    }];

    function createPointArray(fprArrayInput: number[], tprArrayInput: number[], category: string): any[] {
        return fprArrayInput.map((fpr, index) => ({
            category,
            x: fpr,
            y: tprArrayInput[index]
        }));
    }

    beforeAll(() => {
        /* eslint-disable-next-line no-console */
        console.log('STARTING STATISTICS UTIL ROC CURVE TESTS...');
    });

    it('with simple, completely correct data', () => {
        const dataByCategory = [{
            category: 'testCategory',
            data: [{
                label: 0,
                score: 0
            }, {
                label: 1,
                score: 1
            }]
        }];
        const actual = StatisticsUtil.rocCurve(dataByCategory);

        const expectedArrayX = [0, 1];
        const expectedArrayY = [0, 1];
        const expectedPointArray = [
            { category: 'testCategory', x: 0, y: 0 },
            { category: 'testCategory', x: 0, y: 1 },
            { category: 'testCategory', x: 1, y: 1 }
        ].concat(bisectorPointArray);

        expect(actual.aucs.get('testCategory')).toEqual(1.0);
        expect(actual.points).toEqual(expectedPointArray);
        expect(actual.xArray).toEqual(expectedArrayX);
        expect(actual.yArray).toEqual(expectedArrayY);
    });

    it('with simple, mostly correct data', () => {
        const dataByCategory = [{
            category: 'testCategory',
            data: [{
                label: 0,
                score: 0
            }, {
                label: 0,
                score: 0
            }, {
                label: 1,
                score: 0
            }, {
                label: 1,
                score: 1
            }]
        }];
        const actual = StatisticsUtil.rocCurve(dataByCategory);

        const expectedArrayX = [0, 1];
        const expectedArrayY = [0, 0.5, 1];
        const expectedPointArray = [
            { category: 'testCategory', x: 0, y: 0 },
            { category: 'testCategory', x: 0, y: 0.5 },
            { category: 'testCategory', x: 1, y: 1 }
        ].concat(bisectorPointArray);

        expect(actual.aucs.get('testCategory')).toEqual(0.75);
        expect(actual.points).toEqual(expectedPointArray);
        expect(actual.xArray).toEqual(expectedArrayX);
        expect(actual.yArray).toEqual(expectedArrayY);
    });

    it('with simple, half correct data', () => {
        const dataByCategory = [{
            category: 'testCategory',
            data: [{
                label: 0,
                score: 0
            }, {
                label: 0,
                score: 1
            }, {
                label: 1,
                score: 0
            }, {
                label: 1,
                score: 1
            }]
        }];
        const actual = StatisticsUtil.rocCurve(dataByCategory);

        const expectedArrayX = [0, 0.5, 1];
        const expectedArrayY = [0, 0.5, 1];
        const expectedPointArray = [
            { category: 'testCategory', x: 0, y: 0 },
            { category: 'testCategory', x: 0.5, y: 0.5 },
            { category: 'testCategory', x: 1, y: 1 }
        ].concat(bisectorPointArray);

        expect(actual.aucs.get('testCategory')).toEqual(0.5);
        expect(actual.points).toEqual(expectedPointArray);
        expect(actual.xArray).toEqual(expectedArrayX);
        expect(actual.yArray).toEqual(expectedArrayY);
    });

    it('with simple, completely incorrect data', () => {
        const dataByCategory = [{
            category: 'testCategory',
            data: [{
                label: 0,
                score: 1
            }, {
                label: 1,
                score: 0
            }]
        }];
        const actual = StatisticsUtil.rocCurve(dataByCategory);

        const expectedArrayX = [0, 1];
        const expectedArrayY = [0];
        const expectedPointArray = [
            { category: 'testCategory', x: 0, y: 0 },
            { category: 'testCategory', x: 1, y: 0 }
        ].concat(bisectorPointArray);

        expect(actual.aucs.get('testCategory')).toEqual(0.0);
        expect(actual.points).toEqual(expectedPointArray);
        expect(actual.xArray).toEqual(expectedArrayX);
        expect(actual.yArray).toEqual(expectedArrayY);
    });

    it('with advanced data', () => {
        const dataByCategory = [{
            category: 'testCategory',
            data: yLabels.map((yLabel, index) => ({
                label: yLabel,
                score: yScores[index]
            }))
        }];
        const actual = StatisticsUtil.rocCurve(dataByCategory);

        const expectedArrayX = fprArray;
        /* eslint-disable-next-line max-len */
        const expectedArrayY = [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.76, 0.8, 0.84, 0.88, 0.92, 0.96, 1];
        const expectedPointArray = [{ category: 'testCategory', x: 0, y: 0 }].concat(createPointArray(fprArray, tprArray, 'testCategory'))
            .concat(bisectorPointArray);

        expect(actual.aucs.get('testCategory')).toEqual(0.9192);
        expect(actual.points).toEqual(expectedPointArray);
        expect(actual.xArray).toEqual(expectedArrayX);
        expect(actual.yArray).toEqual(expectedArrayY);
    });

    it('with multiple categories', () => {
        const dataByCategory = [{
            category: 'testCategory1',
            data: [{
                label: 0,
                score: 0
            }, {
                label: 1,
                score: 1
            }]
        }, {
            category: 'testCategory2',
            data: [{
                label: 0,
                score: 0
            }, {
                label: 0,
                score: 0
            }, {
                label: 1,
                score: 0
            }, {
                label: 1,
                score: 1
            }]
        }, {
            category: 'testCategory3',
            data: [{
                label: 0,
                score: 0
            }, {
                label: 0,
                score: 1
            }, {
                label: 1,
                score: 0
            }, {
                label: 1,
                score: 1
            }]
        }, {
            category: 'testCategory4',
            data: [{
                label: 0,
                score: 1
            }, {
                label: 1,
                score: 0
            }]
        }];
        const actual = StatisticsUtil.rocCurve(dataByCategory);

        const expectedArrayX = [0, 0.5, 1];
        const expectedArrayY = [0, 0.5, 1];
        const expectedPointArray = [
            { category: 'testCategory1', x: 0, y: 0 },
            { category: 'testCategory1', x: 0, y: 1 },
            { category: 'testCategory1', x: 1, y: 1 },
            { category: 'testCategory2', x: 0, y: 0 },
            { category: 'testCategory2', x: 0, y: 0.5 },
            { category: 'testCategory2', x: 1, y: 1 },
            { category: 'testCategory3', x: 0, y: 0 },
            { category: 'testCategory3', x: 0.5, y: 0.5 },
            { category: 'testCategory3', x: 1, y: 1 },
            { category: 'testCategory4', x: 0, y: 0 },
            { category: 'testCategory4', x: 1, y: 0 }
        ].concat(bisectorPointArray);

        expect(actual.aucs.get('testCategory1')).toEqual(1.0);
        expect(actual.aucs.get('testCategory2')).toEqual(0.75);
        expect(actual.aucs.get('testCategory3')).toEqual(0.5);
        expect(actual.aucs.get('testCategory4')).toEqual(0.0);
        expect(actual.points).toEqual(expectedPointArray);
        expect(actual.xArray).toEqual(expectedArrayX);
        expect(actual.yArray).toEqual(expectedArrayY);
    });

    it('with callback function', () => {
        const dataByCategory = [{
            category: 'testCategory',
            data: [{
                label: 0,
                score: 0
            }, {
                label: 1,
                score: 1
            }]
        }];
        const callback = (category: string, xValue: number, yValue: number): any => ({
            group: category,
            xValue,
            yValue
        });
        const actual = StatisticsUtil.rocCurve(dataByCategory, callback);

        const expectedArrayX = [0, 1];
        const expectedArrayY = [0, 1];
        const expectedPointArray = [
            { group: 'testCategory', xValue: 0, yValue: 0 },
            { group: 'testCategory', xValue: 0, yValue: 1 },
            { group: 'testCategory', xValue: 1, yValue: 1 },
            { group: '', xValue: 0, yValue: 0 },
            { group: '', xValue: 1, yValue: 1 }
        ];

        expect(actual.aucs.get('testCategory')).toEqual(1.0);
        expect(actual.points).toEqual(expectedPointArray);
        expect(actual.xArray).toEqual(expectedArrayX);
        expect(actual.yArray).toEqual(expectedArrayY);
    });

    it('with divide-by', () => {
        const dataByCategory = [{
            category: 'testCategory',
            data: yLabels.map((yLabel, index) => ({
                label: yLabel,
                score: yScores[index]
            }))
        }];
        const actual = StatisticsUtil.rocCurve(dataByCategory, StatisticsUtil.createCategoryXY.bind(StatisticsUtil), 1000);

        const expectedArrayX = fprArray;
        /* eslint-disable-next-line max-len */
        const expectedArrayY = [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.76, 0.8, 0.84, 0.88, 0.92, 0.96, 1];
        const expectedPointArray = [{ category: 'testCategory', x: 0, y: 0 }].concat(createPointArray(fprArray, tprArray, 'testCategory'))
            .concat(bisectorPointArray);

        expect(actual.aucs.get('testCategory')).toEqual(0.9192);
        expect(actual.points).toEqual(expectedPointArray);
        expect(actual.xArray).toEqual(expectedArrayX);
        expect(actual.yArray).toEqual(expectedArrayY);
    });
});

