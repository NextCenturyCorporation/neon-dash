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

import { Color } from 'nucleus/dist/core/models/color';
import { NeonDashboardColorSet } from './color-set';

describe('NeonDashboardColorSet', () => {
    let color1: Color = new Color('var(--color-set-1)', 'var(--color-set-dark-1)', 'var(--color-set-1-transparency-high)');
    let color2: Color = new Color('var(--color-set-2)', 'var(--color-set-dark-2)', 'var(--color-set-2-transparency-high)');

    it('getColorForValue does set new color for new value', () => {
        let colorSet = new NeonDashboardColorSet('testColorKey', 'testDatabase', 'testTable', 'testColorField');
        expect(colorSet.getColorForValue('testColorValue1')).toEqual(color1);
        expect(colorSet.getColorForValue('testColorValue2')).toEqual(color2);
    });

    it('getColorForValue does use old color for old value', () => {
        let colorSet = new NeonDashboardColorSet('testColorKey', 'testDatabase', 'testTable', 'testColorField');
        colorSet.getColorForValue('testColorValue1');
        colorSet.getColorForValue('testColorValue2');
        expect(colorSet.getColorForValue('testColorValue1')).toEqual(color1);
        expect(colorSet.getColorForValue('testColorValue2')).toEqual(color2);
    });

    it('getAllKeys does return expected array', () => {
        let colorSet = new NeonDashboardColorSet('testColorKey', 'testDatabase', 'testTable', 'testColorField');
        expect(colorSet.getAllKeys()).toEqual([]);
        colorSet.getColorForValue('testColorValue1');
        expect(colorSet.getAllKeys()).toEqual(['testColorValue1']);
        colorSet.getColorForValue('testColorValue2');
        expect(colorSet.getAllKeys()).toEqual(['testColorValue1', 'testColorValue2']);
    });

    it('with custom color map', () => {
        let testColor1 = new Color('a', 'b', 'c');
        let testColor2 = new Color('d', 'e', 'f');

        let colorMap = new Map<string, Color>();
        colorMap.set('testColorValue1', testColor1);
        colorMap.set('testColorValue2', testColor2);

        let colorSet = new NeonDashboardColorSet('testColorKey', 'testDatabase', 'testTable', 'testColorField', colorMap);
        expect(colorSet.getColorForValue('testColorValue1')).toEqual(testColor1);
        expect(colorSet.getColorForValue('testColorValue2')).toEqual(testColor2);
    });
});

