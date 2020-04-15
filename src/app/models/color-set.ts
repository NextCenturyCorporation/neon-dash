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

import { Color, ColorSet } from '@caci-critical-insight-solutions/nucleus-core';

export class NeonDashboardColorSet extends ColorSet {
    private neonDashboardColors: Color[] = [
        new Color('var(--color-set-1)', 'var(--color-set-dark-1)', 'var(--color-set-1-transparency-high)'),
        new Color('var(--color-set-2)', 'var(--color-set-dark-2)', 'var(--color-set-2-transparency-high)'),
        new Color('var(--color-set-3)', 'var(--color-set-dark-3)', 'var(--color-set-3-transparency-high)'),
        new Color('var(--color-set-4)', 'var(--color-set-dark-4)', 'var(--color-set-4-transparency-high)'),
        new Color('var(--color-set-5)', 'var(--color-set-dark-5)', 'var(--color-set-5-transparency-high)'),
        new Color('var(--color-set-6)', 'var(--color-set-dark-6)', 'var(--color-set-6-transparency-high)'),
        new Color('var(--color-set-7)', 'var(--color-set-dark-7)', 'var(--color-set-7-transparency-high)'),
        new Color('var(--color-set-8)', 'var(--color-set-dark-8)', 'var(--color-set-8-transparency-high)'),
        new Color('var(--color-set-light-1)', 'var(--color-set-1)', 'var(--color-set-light-1-transparency-high)'),
        new Color('var(--color-set-light-2)', 'var(--color-set-2)', 'var(--color-set-light-2-transparency-high)'),
        new Color('var(--color-set-light-3)', 'var(--color-set-3)', 'var(--color-set-light-3-transparency-high)'),
        new Color('var(--color-set-light-4)', 'var(--color-set-4)', 'var(--color-set-light-4-transparency-high)'),
        new Color('var(--color-set-light-5)', 'var(--color-set-5)', 'var(--color-set-light-5-transparency-high)'),
        new Color('var(--color-set-light-6)', 'var(--color-set-6)', 'var(--color-set-light-6-transparency-high)'),
        new Color('var(--color-set-light-7)', 'var(--color-set-7)', 'var(--color-set-light-7-transparency-high)'),
        new Color('var(--color-set-light-8)', 'var(--color-set-8)', 'var(--color-set-light-8-transparency-high)')
    ];

    protected getColorArray(): Color[] {
        return this.neonDashboardColors;
    }
}
