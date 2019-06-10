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
import { ElementRef } from '@angular/core';

/**
 * General color class.
 * This class can provide colors in a hex string, RGB formatted, or in RGB percent.
 */
export class Color {
    /**
     * Creates and returns a Color object using the given Hex string like "#123" or "#112233" or "112233".
     * @arg {string} inputHex
     * @return {Color}
     */
    static fromHexString(inputHex: string): Color {
        if (!inputHex) {
            return null;
        }
        // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        let hex = inputHex.replace(shorthandRegex, (__m, red, green, blue) => red + red + green + green + blue + blue);
        let hexArray = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(hex);
        if (hexArray) {
            let rgb = parseInt(hexArray[1], 16) + ',' + parseInt(hexArray[2], 16) + ',' + parseInt(hexArray[3], 16);
            return new Color((inputHex.indexOf('#') === 0 ? inputHex : ('#' + inputHex)), 'rgba(' + rgb + ',0.66)',
                'rgba(' + rgb + ',0.33)');
        }
        return null;
    }

    /**
     * Creates and returns a Color object using the given RGB numbers.
     * @arg {number} red
     * @arg {number} green
     * @arg {number} blue
     * @return {Color}
     */
    static fromRgb(red: number, green: number, blue: number): Color {
        if (red === null || green === null || blue === null) {
            return null;
        }
        let rgb = red + ',' + green + ',' + blue;
        return new Color('rgb(' + rgb + ')', 'rgba(' + rgb + ',0.66)', 'rgba(' + rgb + ',0.33)');
    }

    /**
     * Creates and returns a Color object using the given RGB array like [12, 34, 56].
     * @arg {number[]} inputRGB
     * @return {Color}
     */
    static fromRgbArray(inputRGB: number[]): Color {
        if (inputRGB === null || inputRGB.length !== 3) {
            return null;
        }
        return Color.fromRgb(inputRGB[0], inputRGB[1], inputRGB[2]);
    }

    /**
     * Creates and returns a Color object using the given RGB string like "12,34,56".
     * @arg {string} inputRGB
     * @return {Color}
     */
    static fromRgbString(inputRGB: string): Color {
        if (inputRGB === null || inputRGB.length < 5) {
            return null;
        }
        let arrayRGB = inputRGB.replace(/[^\d,]/g, '').split(',');
        return arrayRGB.length === 3 ? Color.fromRgb(Number(arrayRGB[0]), Number(arrayRGB[1]), Number(arrayRGB[2])) : null;
    }

    /**
     * @constructor
     * @arg {string} css
     * @arg {string} hoverColor
     * @arg {string} transparencyHigh
     */
    constructor(private css: string, private hoverColor: string, private transparencyHigh: string) {}

    /**
     * Returns the computed CSS for the color using the given ElementRef object to find custom CSS properties like "--variable".
     * @arg {ElementRef} elementRef
     * @return {string}
     */
    public getComputedCss(elementRef: ElementRef): string {
        return this.computeColor(this.css, elementRef);
    }

    /**
     * Returns the CSS for the hover color using the given ElementRef object to find custom CSS properties like "--variable".
     * @arg {ElementRef} elementRef
     * @return {string}
     */
    public getComputedCssHoverColor(elementRef: ElementRef): string {
        return this.computeColor(this.hoverColor, elementRef);
    }

    /**
     * Returns the CSS for the high transparency color using the given ElementRef object to find custom CSS properties like "--variable".
     * @arg {ElementRef} elementRef
     * @return {string}
     */
    public getComputedCssTransparencyHigh(elementRef: ElementRef): string {
        return this.computeColor(this.transparencyHigh, elementRef);
    }

    /**
     * Returns the CSS for the color.
     * @return {string}
     */
    public getCss(): string {
        return this.css;
    }

    /**
     * Returns the CSS for the hover color.
     * @return {string}
     */
    public getHoverColor(): string {
        return this.hoverColor;
    }

    /**
     * Returns the CSS for the color with high transparency.
     * @return {string}
     */
    public getCssTransparencyHigh(): string {
        return this.transparencyHigh;
    }

    /**
     * Returns the color for the given CSS using the given ElementRef object to find custom CSS properties like "--variable".
     * @arg {string} colorCss
     * @arg {ElementRef} elementRef
     * @return {string}
     */
    private computeColor(colorCss: string, elementRef: ElementRef): string {
        if (colorCss.indexOf('var(--') === 0) {
            let css = colorCss.substring(4, colorCss.length - 1);
            css = css.indexOf(',') >= 0 ? css.substring(0, css.indexOf(',')) : css;
            return getComputedStyle(elementRef.nativeElement).getPropertyValue(css).trim();
        }
        if (colorCss.indexOf('--') === 0) {
            return getComputedStyle(elementRef.nativeElement).getPropertyValue(colorCss).trim();
        }
        return colorCss;
    }
}

/**
 * A set of colors, used to keep track of which values map to which colors
 */
export class ColorSet {
    private colors: Color[] = [
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

    private currentIndex: number = 0;

    /**
     * @constructor
     * @arg {string} colorKey
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string} fieldName
     * @arg {Map<string, Color>} [valueToColor=new Map<string, Color>()]
     */
    constructor(private colorKey: string, private databaseName: string, private tableName: string, private fieldName: string,
        private valueToColor: Map<string, Color> = new Map<string, Color>()) {}

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
