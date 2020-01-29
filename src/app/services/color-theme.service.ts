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
import { AbstractColorThemeService, Theme } from '@caci-critical-insight-solutions/nucleus-core';
import { Color, ColorMap, ColorSet } from '@caci-critical-insight-solutions/nucleus-core';
import { NeonDashboardColorSet } from '../models/color-set';

export class NeonTheme implements Theme {
    public accentColorObject: Color;
    public textColorObject: Color;

    /**
     * @constructor
     */
    constructor(public accentColorString: string, public id: string, public textColorString: string, public name: string) {
        this.accentColorObject = Color.fromString(accentColorString);
        this.textColorObject = Color.fromString(textColorString);
    }
}

export class ColorThemeService extends AbstractColorThemeService {
    public static THEME_DARK: Theme = new NeonTheme('#01B7C1', 'neon-dark', '#FFFFFF', 'Dark');
    public static THEME_GREEN: Theme = new NeonTheme('#FFA600', 'neon-green', '#333333', 'Green');
    public static THEME_TEAL: Theme = new NeonTheme('#54C8CD', 'neon-teal', '#333333', 'Teal');

    // TODO Let different databases and tables in the same dataset have different color maps.
    private colorKeyToColorSet: Map<string, ColorSet> = new Map<string, ColorSet>();
    private currentThemeId: string = ColorThemeService.THEME_TEAL.id;

    constructor() {
        super();
        document.body.className = this.currentThemeId;
    }

    /**
     * Returns the color for the given value from an existing color set for the given database/table/field or creates a new color set if
     * none exists.
     *
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string} fieldName
     * @arg {string|string[]} value
     * @return {Color}
     * @override
     */
    public getColor(databaseName: string, tableName: string, fieldName: string, value: string | string[]): Color {
        let colorKey = this.getColorKey(databaseName, tableName, fieldName);
        let colorSet = this.colorKeyToColorSet.get(colorKey);
        if (!colorSet) {
            colorSet = new NeonDashboardColorSet(colorKey, databaseName, tableName, fieldName);
            this.colorKeyToColorSet.set(colorKey, colorSet);
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
     * @override
     */
    public getColorKey(databaseName: string, tableName: string, fieldName: string): string {
        return databaseName + '_' + tableName + '_' + fieldName;
    }

    /**
     * Returns the color set for the given database/table/field key.
     *
     * @arg {string} colorKey
     * @return {ColorSet}
     * @override
     */
    public getColorSet(colorKey: string): ColorSet {
        return this.colorKeyToColorSet.get(colorKey);
    }

    /**
     * Returns the ID for the current application theme.
     *
     * @return {string}
     * @override
     */
    public getTheme(): string {
        return this.currentThemeId;
    }

    /**
     * Returns the list of available application themes.
     *
     * @return {Theme[]}
     * @override
     */
    public getThemes(): Theme[] {
        return [
            ColorThemeService.THEME_DARK,
            // TODO THOR-852 Add green theme
            // ColorThemeService.THEME_GREEN,
            ColorThemeService.THEME_TEAL
        ];
    }

    /**
     * Returns the accent color for the current application theme.
     *
     * @return {Color}
     * @override
     */
    public getThemeAccentColor(): Color {
        return (this.getThemes().filter((theme) => theme.id === this.currentThemeId)[0] as NeonTheme).accentColorObject;
    }

    /**
     * Returns the hex for the accent color for the current application theme.
     *
     * @return {string}
     * @override
     */
    public getThemeAccentColorHex(): string {
        return (this.getThemes().filter((theme) => theme.id === this.currentThemeId)[0] as NeonTheme).accentColorString;
    }

    /**
     * Returns the text color for the current application theme.
     *
     * @return {Color}
     * @override
     */
    public getThemeTextColor(): Color {
        return (this.getThemes().filter((theme) => theme.id === this.currentThemeId)[0] as NeonTheme).textColorObject;
    }

    /**
     * Returns the hex for the text color for the current application theme.
     *
     * @return {string}
     * @override
     */
    public getThemeTextColorHex(): string {
        return (this.getThemes().filter((theme) => theme.id === this.currentThemeId)[0] as NeonTheme).textColorString;
    }

    /**
     * Initializes the starting colors using the given input.
     *
     * @arg {ColorMap} colors
     * @override
     */
    public initializeColors(colors: ColorMap): void {
        this.colorKeyToColorSet = new Map<string, ColorSet>();
        Object.keys(colors || {}).forEach((databaseName) => {
            Object.keys(colors[databaseName]).forEach((tableName) => {
                Object.keys(colors[databaseName][tableName]).forEach((fieldName) => {
                    let valueToColor = new Map<string, Color>();
                    Object.keys(colors[databaseName][tableName][fieldName]).forEach((valueName) => {
                        let color = colors[databaseName][tableName][fieldName][valueName];
                        valueToColor.set(valueName, Color.fromString(color));
                    });
                    let colorKey = this.getColorKey(databaseName, tableName, fieldName);
                    let colorSet = new NeonDashboardColorSet(colorKey, databaseName, tableName, fieldName, valueToColor);
                    this.colorKeyToColorSet.set(colorKey, colorSet);
                });
            });
        });
    }

    /**
     * Sets the current application theme to the theme with the given ID.
     *
     * @arg {string} id
     * @override
     */
    public setTheme(id: string): void {
        if (id !== this.currentThemeId) {
            this.currentThemeId = id;
            document.body.className = this.currentThemeId;
        }
    }
}
