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

/**
 * General color class.
 * This class can provide colors in a hex string, RGB formatted, or in RGB percent.
 */
export class Color {
    private red: number;
    private green: number;
    private blue: number;

    /**
     * Creates and returns a Color object using the given Hex string like #123 or #112233.
     * @arg {string} inputHex
     * @return {Color}
     */
    static fromHexString(inputHex: string): Color {
        // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        let hex = inputHex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? new Color(
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ) : null;
    }

    /**
     * Create a color object from an array of RGB values.
     * The array must have 3 elements in it
     * @arg {number[]} rgb
     * @return {Color}
     */
    static fromRgbArray(rgb: number[]): Color {
        if (rgb == null || rgb.length !== 3) {
            return null;
        }
        return new Color(rgb[0], rgb[1], rgb[2]);
    }

    /**
     * Create a color object from an RGB string, like "rgb(39, 96, 126)"
     * @arg {string} rgbstring
     * @return {Color}
     */
    static fromRgbString(rgbstring: string): Color {
        if (rgbstring == null || rgbstring.length < 5) {
            return null;
        }
        let rgbstringarray = rgbstring.replace(/[^\d,]/g, '').split(',');
        let red = Number(rgbstringarray[0]);
        let green = Number(rgbstringarray[1]);
        let blue = Number(rgbstringarray[2]);
        return Color.fromRgbArray([red, green, blue]);
    }

    constructor(r: number, g: number, b: number) {
        this.red = r;
        this.green = g;
        this.blue = b;
    }

    private getBase255(value: number) {
        return value;
    }

    private getBase1(value: number) {
        return value / 255;
    }

    private getHex(value: number) {
        return value.toString(16);
    }

    /**
     * Get the 'inactive' color, aka the RGBA string with an alpha of 0.3
     * @return {string}
     */
    getInactiveRgba(): string {
        return this.toRgba(0.2);
    }

    /**
     * Get the color as a string of RGB percentages
     * @return {string}
     */
    toPercentages(): string {
        return '' + this.getBase1(this.red) + ',' +
            this.getBase1(this.green) + ',' +
            this.getBase1(this.blue);
    }

    /**
     * Get the color as a rgb(0,0,0) string
     * @return {string}
     */
    toRgb(): string {
        return 'rgb(' + this.getBase255(this.red) + ',' +
            this.getBase255(this.green) + ',' +
            this.getBase255(this.blue) + ')';
    }

    /**
     * Get the color as a rgba(0,0,0,a) string
     * @arg a alpha value (0-1)
     * @return {string}
     */
    toRgba(a: number): string {
        return 'rgba(' + this.getBase255(this.red) + ',' +
            this.getBase255(this.green) + ',' +
            this.getBase255(this.blue) + ',' +
            a + ')';
    }

    /**
     * Get the color as a '#RRGGBB' string
     * @return {string}
     */
    toHexString(): string {
        return '#' + this.getHex(this.red) +
            this.getHex(this.green) +
            this.getHex(this.blue);
    }
}

/**
 * A set of colors, used to keep track of which values map to which colors
 */
export class ColorSet {
    // TODO Move to WidgetService
    private colors: Color[] = [
        // NEON TEAL COLOR THEME
        new Color(255, 135, 55),  // #FF8737 (orange)
        new Color(94, 80, 143),   // #5E508F (deep purple)
        new Color(177, 194, 54),  // #B1C236 (lime)
        new Color(243, 88, 112),  // #F35870 (pink)
        new Color(255, 214, 0),   // #FFD600 (yellow)
        new Color(179, 79, 146),  // #B34F92 (purple)
        new Color(106, 204, 127), // #6ACC7F (sea green)
        new Color(255, 107, 86)   // #FF6b56 (deep orange)
    ];
    private currentIndex: number = 0;

    constructor(private colorKey: string, private databaseName: string, private tableName: string, private fieldName: string,
        private valueToColor: Map<string, Color> = new Map<string, Color>()) {

        // Do nothing.
    }

    /**
     * Returns the color field.
     *
     * @return {string}
     */
    getColorField(): string {
        return this.fieldName;
    }

    /**
     * Returns the color for the given value.
     *
     * @arg {string} value
     * @return {Color}
     */
    getColorForValue(value: string): Color {
        let color = this.valueToColor.get(value);
        if (!color) {
            color = this.colors[this.currentIndex];
            this.valueToColor.set(value, color);
            this.currentIndex = (this.currentIndex + 1) % this.colors.length;
        }
        return color;
    }

    /**
     * Returns the map of colors.
     *
     * @return {Map<string, Color>}
     */
    getColorMap(): Map<string, Color> {
        return this.valueToColor;
    }

    /**
     * Returns the list of keys in this color set.
     *
     * @return {string[]}
     */
    getAllKeys(): string[] {
        return Array.from(this.valueToColor.keys()).sort();
    }
}
