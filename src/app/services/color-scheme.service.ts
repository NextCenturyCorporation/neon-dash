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

/**
 * A set of colors, used to keep track of which values map to which colors
 */
export class ColorSet {
    public name: string;
    public colorList: Color[];
    private currentIndex: number = 0;
    private mappings: Map<string, Color> = new Map<string, Color>();

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Get the color for a value
     * @param {string} value
     * @return {Color}
     */
    getColorForValue(value: string): Color {
        let color = this.mappings.get(value);
        if (color == null) {
            color = this.colorList[this.currentIndex];
            this.mappings.set(value, color);
            this.currentIndex = (this.currentIndex + 1) % this.colorList.length;
        }
        return color;
    }

    /**
     * Get the map of colors
     * @return {Map<string, Color>}
     */
    getColorMap(): Map<string, Color> {
        return this.mappings;
    }

    /**
     * Get the list of all the keys that have a color in the set
     * @return {string[]}
     */
    getAllKeys(): string[] {
        return Array.from(this.mappings.keys()).sort();
    }
}

/**
 * Service for getting colors to use for coloring different values in visualizations.
 * The set name and data value are cached, so that you get the same colors for the same values each time.
 */
@Injectable()
export class ColorSchemeService {
    private colorMaps: Map<string, ColorSet> = new Map<string, ColorSet>();

    // Palettes generated with http://tools.medialab.sciences-po.fr/iwanthue/
    private colorList = [
        [   //3 colors - defined palette
            new Color(173, 216, 230),
            new Color(223, 159, 159),
            new Color(255, 218, 153)
        ],
        [   //9 colors
            new Color(228, 26, 28),
            new Color(55, 126, 184),
            new Color(77, 175, 74),
            new Color(152, 78, 163),
            new Color(255, 127, 0),
            new Color(96, 69, 20),
            new Color(166, 86, 40),
            new Color(247, 129, 191),
            new Color(153, 153, 153)
        ],
        [   //11 colors
            new Color(103, 0, 31),
            new Color(178, 24, 43),
            new Color(214, 96, 77),
            new Color(244, 165, 130),
            new Color(253, 219, 199),
            new Color(247, 247, 247),
            new Color(209, 229, 240),
            new Color(146, 197, 222),
            new Color(67, 147, 195),
            new Color(33, 102, 172),
            new Color(5, 48, 97)
        ],
        [   //12 colors
            new Color(31, 120, 180),
            new Color(51, 160, 44),
            new Color(227, 26, 28),
            new Color(255, 127, 0),
            new Color(106, 61, 154),
            new Color(177, 89, 40),
            new Color(166, 206, 227),
            new Color(178, 223, 138),
            new Color(251, 154, 153),
            new Color(253, 191, 111),
            new Color(202, 178, 214),
            new Color(255, 255, 153)
        ],
        [   //24 colors
            new Color(163, 180, 4),
            new Color(19, 97, 255),
            new Color(49, 148, 0),
            new Color(255, 100, 243),
            new Color(0, 158, 87),
            new Color(143, 105, 255),
            new Color(166, 155, 0),
            new Color(91, 5, 147),
            new Color(224, 159, 15),
            new Color(54, 44, 138),
            new Color(253, 20, 20),
            new Color(2, 139, 216),
            new Color(174, 0, 15),
            new Color(0, 57, 129),
            new Color(202, 166, 85),
            new Color(222, 131, 255),
            new Color(93, 80, 0),
            new Color(195, 0, 131),
            new Color(255, 89, 95),
            new Color(114, 0, 102),
            new Color(255, 63, 133),
            new Color(129, 89, 133),
            new Color(120, 15, 31),
            new Color(232, 143, 190)
        ],
        [   //35 colors - random palette
            new Color(31, 120, 180),
            new Color(127, 19, 242),
            new Color(7, 87, 8),
            new Color(177, 89, 40),
            new Color(227, 26, 28),
            new Color(51, 160, 44),
            new Color(241, 103, 32),
            new Color(103, 0, 31),
            new Color(5, 48, 97),
            new Color(251, 154, 153),
            new Color(178, 223, 138),
            new Color(77, 207, 214),
            new Color(253, 191, 111),
            new Color(166, 206, 227),
            new Color(20, 171, 145),
            new Color(255, 255, 153),
            new Color(200, 22, 192),
            new Color(136, 232, 164),
            new Color(253, 219, 199),
            new Color(0, 89, 162),
            new Color(178, 141, 124),
            new Color(67, 147, 195),
            new Color(255, 163, 72),
            new Color(209, 229, 240),
            new Color(177, 177, 177),
            new Color(31, 137, 255),
            new Color(146, 197, 222),
            new Color(202, 178, 214),
            new Color(144, 186, 48),
            new Color(250, 122, 109),
            new Color(111, 0, 60),
            new Color(217, 66, 163),
            new Color(0, 123, 45),
            new Color(221, 142, 194),
            new Color(119, 79, 0)
        ]
    ];
    private colorPosition = 0;

    /**
     * Get the color for a value within a set
     * @param {string} set
     * @param {string} value
     */
    public getColorFor(set: string, value: string | string[]): Color {
        let colorSet = this.colorMaps.get(set);
        if (colorSet == null) {
            colorSet = new ColorSet(set);
            colorSet.colorList = this.colorList[this.colorPosition];
            this.colorMaps.set(set, colorSet);
            this.colorPosition = (this.colorPosition + 1) % this.colorList.length;
        }
        let colorKey = (value instanceof Array) ? value.join() : value;
        return colorSet.getColorForValue(colorKey);
    }

    /**
     * Get the color set for a key
     * @param {string} set
     * @return {ColorSet}
     */
    getColorSet(set: string): ColorSet {
        return this.colorMaps.get(set);
    }
    /**
     * Sets the colorList position based on the amount of available colors being greater than the array length
     * in order to provide color uniqueness
     * @param {number} length
     */
    public setColorListByLength(length: number) {
        for (let i = 0; i < this.colorList.length; i++) {
            if (length <= this.colorList[i].length) {
                this.colorPosition = i;
                break;
            }
        }

        //if there is no palette large enough to cover the length of the array,
        // then select the largest palette
        if (this.colorPosition === 0 && length > this.colorList[0].length) {
            this.colorPosition = this.colorList.length - 1;
        }
    }
    /**
     * Sets the colorList position based on a given index
     * @param {number} index
     */
    public setColorListByIndex(index: number) {
        this.colorPosition = index;
    }
}

/**
 * General color class.
 * This class can provide colors in a hex string, RGB formatted, or in RGB percent.
 */
export class Color {
    private red: number;
    private green: number;
    private blue: number;

    /**
     * Create a color object from an array of RGB values.
     * The array must have 3 elements in it
     * @param {number[]} rgb
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
     * @param {string} rgbstring
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
     * @param a alpha value (0-1)
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
