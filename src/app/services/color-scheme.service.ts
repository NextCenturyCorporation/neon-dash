/*
 * Copyright 2017 Next Century Corporation
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
 *
 */
import { Injectable } from '@angular/core';
import { Color, ColorSet } from '../color';

/**
 * Service for getting colors to use for coloring different values in visualizations.
 * The set name and data value are cached, so that you get the same colors for the same values each time.
 */
@Injectable()
export class ColorSchemeService {
    private colorMap: Map<string, ColorSet> = new Map<string, ColorSet>();

    /**
     * Returns the color for the given value from an existing color set for the given database/table/field or creates a new color set if
     * none exists.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string} fieldName
     * @arg {string|string[]} value
     * @return {Color}
     */
    public getColorFor(databaseName: string, tableName: string, fieldName: string, value: string | string[]): Color {
        let colorKey = this.getColorKey(databaseName, tableName, fieldName);
        let colorSet = this.colorMap.get(colorKey);
        if (!colorSet) {
            colorSet = new ColorSet(colorKey, databaseName, tableName, fieldName);
            this.colorMap.set(colorKey, colorSet);
        }
        let colorValue = (value instanceof Array) ? value.join() : value;
        return colorSet.getColorForValue(colorValue);
    }

    /**
     * Returns the unique key for the given database/table/field.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string} fieldName
     * @return {string}
     */
    public getColorKey(databaseName: string, tableName: string, fieldName: string): string {
        return databaseName + '_' + tableName + '_' + fieldName;
    }

    /**
     * Returns the color set for the given database/table/field key.
     *
     * @arg {string} colorKey
     * @return {ColorSet}
     */
    getColorSet(colorKey: string): ColorSet {
        return this.colorMap.get(colorKey);
    }
}
