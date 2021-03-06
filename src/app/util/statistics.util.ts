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

export interface DataXY {
    x: number;
    y: number;
}

export interface CategoryDataXY extends DataXY {
    category: string;
}

export class StatisticsUtil {
    /**
     * Create and return a categorized point for the given X/Y value with the given category.
     *
     * @arg {string} category
     * @arg {number} xValue
     * @arg {number} yValue
     * @return {object}
     */
    public static createCategoryXY(category: string, xValue: number, yValue: number): { category: string, x: number, y: number } {
        return {
            category,
            x: xValue,
            y: yValue
        };
    }

    /**
     * Create and return a ROC curve for the given data. Based on scikit-learn's python implementation of roc_curve.
     *
     * @arg {array} dataByCategory An array of objects containing the data (scores) per individual category (line).
     * @arg {function} [callback=null] A function that converts the X/Y values into points. Default: StatisticsUtil.createCategoryXY
     * @arg {number} [divideBy=100] The number of points per line (but not including the first point).
     * @return {object} The AUCs, converted points, and original X/Y values for each line in the ROC curve.
     */
    public static rocCurve(
        dataByCategory: { category: string, data: { label: number, score: number }[] }[],
        callback: (category: string, x: number, y: number) => any = null,
        divideBy: number = 100
    ): { aucs: Map<string, number>, points: any[], xArray: number[], yArray: number[] } {
        let categoriesToAUCs = new Map<string, number>();
        let categoriesToPoints = new Map<string, any[]>();
        let xArray: number[] = [0];
        let yArray: number[] = [0];

        dataByCategory.filter((item) => item.data.length).forEach((categoryItem) => {
            // Copy the data so we can sort it in place.
            let dataCopy = [].concat(categoryItem.data);
            // Sort by descending scores.
            dataCopy.sort((one, two) => two.score - one.score);
            // Find the final index of each distinct score.
            let distinctIndexes = dataCopy.reduce((indexes, item, index) => {
                if ((dataCopy.length === (index + 1)) || ((dataCopy[index + 1].score - item.score) !== 0)) {
                    indexes.push(index);
                }
                return indexes;
            }, []);
            let positiveSum = 0;
            let negativeSum = 0;
            let truePositives = [];
            let falsePositives = [];
            dataCopy.forEach((item) => {
                // Assume 1 is the positive label.
                if (item.label === 1) {
                    positiveSum++;
                } else {
                    negativeSum++;
                }
                truePositives.push(positiveSum);
                falsePositives.push(negativeSum);
            });
            // Only save the true and false positives from distinct indexes.
            let distinctTruePositives = [];
            let distinctFalsePositives = [];
            distinctIndexes.forEach((index) => {
                distinctTruePositives.push(truePositives[index]);
                distinctFalsePositives.push(falsePositives[index]);
            });
            let truePositiveMax = distinctTruePositives[distinctTruePositives.length - 1];
            let falsePositiveMax = distinctFalsePositives[distinctFalsePositives.length - 1];
            let categoryPoints: any[] = [];
            if (!truePositiveMax) {
                // If no true positive max, draw a line from (0, 0) to (1, 0)
                categoryPoints = [StatisticsUtil.createCategoryXY(categoryItem.category, 0, 0),
                    StatisticsUtil.createCategoryXY(categoryItem.category, 1, 0)];
            } else if (!falsePositiveMax) {
                // If no false positive max, draw a line from (0, 1) to (1, 1)
                categoryPoints = [StatisticsUtil.createCategoryXY(categoryItem.category, 0, 1),
                    StatisticsUtil.createCategoryXY(categoryItem.category, 1, 1)];
            } else {
                let xToIndex = new Map<number, number>();
                categoryPoints = [StatisticsUtil.createCategoryXY(categoryItem.category, 0, 0)];

                // Divide each true and false positive by its max to find the true and false positive rates for the curve.
                for (let index = 0; index < distinctIndexes.length; ++index) {
                    // Round to nearest hundredth (or whatever).
                    let xValue = Math.round((distinctFalsePositives[index] / falsePositiveMax) * divideBy) / divideBy;
                    let yValue = Math.round((distinctTruePositives[index] / truePositiveMax) * divideBy) / divideBy;
                    let ignore = false;
                    // Note: Using a Map here seems to be faster than _.findIndex
                    if (!xToIndex.has(xValue)) {
                        // If a point with this X does not already exist, create it.
                        categoryPoints.push(StatisticsUtil.createCategoryXY(categoryItem.category, xValue, yValue));
                        xToIndex.set(xValue, categoryPoints.length - 1);
                    } else if (xValue !== 1.0) {
                        // Else recreate the point using its new (bigger) Y value.
                        categoryPoints[xToIndex.get(xValue)] = StatisticsUtil.createCategoryXY(categoryItem.category, xValue, yValue);
                    } else {
                        // Ignore subsequent Y values if X is 1.
                        ignore = true;
                    }
                    // Save the unique X/Y values for future use.
                    if (xArray.indexOf(xValue) < 0) {
                        xArray.push(xValue);
                    }
                    if (yArray.indexOf(yValue) < 0 && !ignore) {
                        yArray.push(yValue);
                    }
                }
            }
            categoriesToPoints.set(categoryItem.category, categoryPoints);
            categoriesToAUCs.set(categoryItem.category, StatisticsUtil.auc(categoryPoints, 0, 1, (1 / divideBy)));
        });

        // Convert the X/Y values into points for the ROC curve using the given callback function.
        let points = Array.from(categoriesToPoints.values()).reduce((outputPoints, categoryPoints) =>
            // If the callback function is null, just use the default points made by StatisticsUtil.createCategoryXY
            outputPoints.concat(!callback ? categoryPoints : categoryPoints.map((point) => callback(point.category, point.x, point.y))),
        []);

        // Add the 'random' line.
        if (points.length) {
            points.push(callback ? callback('', 0, 0) : StatisticsUtil.createCategoryXY('', 0, 0));
            points.push(callback ? callback('', 1, 1) : StatisticsUtil.createCategoryXY('', 1, 1));
        }

        // The X/Y values should be sorted ascending.
        xArray.sort((one, two) => one - two);
        yArray.sort((one, two) => one - two);

        return {
            aucs: categoriesToAUCs,
            points,
            xArray,
            yArray
        };
    }

    /**
     * Calculate and return the AUC for the ROC curve with the given data.
     *
     * @arg {array} The ROC curve data objects containing "x" and "y" properties.
     * @arg {number} [beginX=0] The begin X coordinate.
     * @arg {number} [endX=1] The end X coordinate.
     * @arg {number} [step=0.01] The step between each X coordinate. There should be (1/step)+1 points in the data.
     * @return {number}
     */
    public static auc(data: any[], beginX: number = 0, endX: number = 1, step: number = 0.01): number {
        let xToY = new Map<number, number>();

        // Multiply the X values in xToY to transform decimals into integers and avoid floating-point arithmetic issues with step addition.
        const multiplier = 100000000;
        const stepMultiplied = Math.round(step * multiplier);

        // Calculate the difference between each sequential data point and put the value into the xToY map.
        data.forEach((item, index) => {
            const itemX = Math.round(item.x * multiplier);
            const itemY = Math.round(item.y * multiplier);

            if (index > 0) {
                const prevX = Math.round(data[index - 1].x * multiplier);
                const prevY = Math.round(data[index - 1].y * multiplier);

                const diffX = itemX - prevX;
                const diffY = itemY - prevY;

                const stepCount = Math.round(diffX / stepMultiplied);
                const stepY = Math.round(diffY / stepCount);

                for (let stepIndex = 1; stepIndex < stepCount; ++stepIndex) {
                    xToY.set(prevX + (stepMultiplied * stepIndex), prevY + (stepY * stepIndex));
                }
            }
            xToY.set(itemX, itemY);
        });

        let sum = 0;
        let end = endX * multiplier;

        // Calculate the ROC's AUC using the xToY map.
        for (let currentX = (beginX * multiplier); currentX < end; currentX += stepMultiplied) {
            sum += ((xToY.get(currentX) + xToY.get(currentX + stepMultiplied)) / 2);
        }

        return Math.round((sum * step) / multiplier * 10000) / 10000;
    }
}
