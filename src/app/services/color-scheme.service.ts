/*
 * Copyright 2016 Next Century Corporation
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
class ColorSet {
    public colorList: Color[];
    public currentIndex: number = 0;
    public mappings: Map<string, Color> = new Map<string, Color>();

    getColorForValue(value: string): Color {
        let color = this.mappings.get(value);
        if (color == null) {
            color = this.colorList[this.currentIndex];
            this.mappings.set(value, color);

            this.currentIndex = (this.currentIndex + 1) % this.colorList.length;
        }
        return color;
    }
}

/**
 * Service for getting colors to use for coloring different values in visualizations.
 * The set name and data value are cached, so that you get the same colors for the same values each time.
 */
@Injectable()
export class ColorSchemeService {
    private colorMaps: Map<string, ColorSet> = new Map<string, ColorSet>();

    // Palette generated with http://tools.medialab.sciences-po.fr/iwanthue/
    private colorList = [
        [
            Color.fromRgbArray([189, 172, 0]),
            Color.fromRgbArray([205, 179, 255]),
            Color.fromRgbArray([255, 223, 84]),
            Color.fromRgbArray([250, 247, 255]),
            Color.fromRgbArray([255, 163, 113]),
            Color.fromRgbArray([0, 50, 36]),
            Color.fromRgbArray([255, 138, 140]),
            Color.fromRgbArray([184, 79, 0]),
            Color.fromRgbArray([1, 49, 136]),
            Color.fromRgbArray([255, 82, 137]),
            Color.fromRgbArray([103, 253, 73])
        ],
        [
            Color.fromRgbArray([255, 192, 164]),
            Color.fromRgbArray([39, 13, 184]),
            Color.fromRgbArray([0, 74, 96]),
            Color.fromRgbArray([255, 211, 247]),
            Color.fromRgbArray([164, 0, 180]),
            Color.fromRgbArray([161, 227, 255]),
            Color.fromRgbArray([255, 195, 51]),
            Color.fromRgbArray([0, 175, 198]),
            Color.fromRgbArray([255, 118, 223]),
            Color.fromRgbArray([152, 255, 236]),
            Color.fromRgbArray([219, 104, 255]),
            Color.fromRgbArray([103, 45, 0]),
            Color.fromRgbArray([0, 55, 116]),
            Color.fromRgbArray([0, 177, 250]),
            Color.fromRgbArray([0, 101, 78])
        ],
        [
            Color.fromRgbArray([0, 19, 42]),
            Color.fromRgbArray([2, 68, 226]),
            Color.fromRgbArray([1, 245, 214]),
            Color.fromRgbArray([0, 120, 130]),
            Color.fromRgbArray([1, 161, 157]),
            Color.fromRgbArray([130, 255, 173]),
            Color.fromRgbArray([241, 0, 33]),
            Color.fromRgbArray([119, 91, 0]),
            Color.fromRgbArray([0, 112, 250]),
            Color.fromRgbArray([255, 106, 95]),
            Color.fromRgbArray([7, 0, 41]),
            Color.fromRgbArray([214, 159, 255]),
            Color.fromRgbArray([255, 65, 145]),
            Color.fromRgbArray([30, 0, 2]),
            Color.fromRgbArray([3, 224, 214]),
            Color.fromRgbArray([255, 224, 162])
        ],
        [
            Color.fromRgbArray([107, 64, 236]),
            Color.fromRgbArray([246, 255, 208]),
            Color.fromRgbArray([1, 252, 152]),
            Color.fromRgbArray([60, 0, 68]),
            Color.fromRgbArray([164, 110, 0]),
            Color.fromRgbArray([255, 155, 216]),
            Color.fromRgbArray([141, 0, 77]),
            Color.fromRgbArray([206, 255, 242]),
            Color.fromRgbArray([0, 127, 237]),
            Color.fromRgbArray([1, 118, 186]),
            Color.fromRgbArray([0, 180, 124]),
            Color.fromRgbArray([0, 151, 43]),
            Color.fromRgbArray([152, 0, 115]),
            Color.fromRgbArray([203, 145, 0]),
            Color.fromRgbArray([72, 0, 96]),
            Color.fromRgbArray([53, 11, 0])
        ],
        [
            Color.fromRgbArray([167, 27, 0]),
            Color.fromRgbArray([1, 230, 171]),
            Color.fromRgbArray([118, 185, 255]),
            Color.fromRgbArray([0, 34, 8]),
            Color.fromRgbArray([1, 119, 154]),
            Color.fromRgbArray([93, 0, 12]),
            Color.fromRgbArray([0, 37, 46]),
            Color.fromRgbArray([255, 161, 183]),
            Color.fromRgbArray([131, 180, 0]),
            Color.fromRgbArray([136, 143, 255]),
            Color.fromRgbArray([255, 147, 127]),
            Color.fromRgbArray([255, 37, 168]),
            Color.fromRgbArray([201, 255, 117]),
            Color.fromRgbArray([255, 250, 126]),
            Color.fromRgbArray([0, 228, 90]),
            Color.fromRgbArray([50, 0, 46])
        ],
        [
            Color.fromRgbArray([244, 183, 0]),
            Color.fromRgbArray([127, 133, 0]),
            Color.fromRgbArray([141, 0, 5]),
            Color.fromRgbArray([74, 95, 0]),
            Color.fromRgbArray([65, 62, 0]),
            Color.fromRgbArray([70, 48, 0]),
            Color.fromRgbArray([255, 182, 105]),
            Color.fromRgbArray([88, 143, 0]),
            Color.fromRgbArray([18, 108, 0]),
            Color.fromRgbArray([156, 123, 255]),
            Color.fromRgbArray([122, 0, 185]),
            Color.fromRgbArray([227, 0, 185]),
            Color.fromRgbArray([84, 0, 29]),
            Color.fromRgbArray([179, 255, 175]),
            Color.fromRgbArray([1, 137, 82]),
            Color.fromRgbArray([24, 0, 24])
        ],
        [
            Color.fromRgbArray([72, 8, 0]),
            Color.fromRgbArray([0, 12, 108]),
            Color.fromRgbArray([195, 0, 75]),
            Color.fromRgbArray([255, 124, 153]),
            Color.fromRgbArray([255, 135, 27]),
            Color.fromRgbArray([0, 21, 148]),
            Color.fromRgbArray([198, 210, 255]),
            Color.fromRgbArray([255, 251, 65]),
            Color.fromRgbArray([254, 255, 176]),
            Color.fromRgbArray([209, 255, 63])
        ]
    ];
    private colorPosition = 0;

    private activeColorScheme: Color[];
    private activeColorSchemeName: string;
    private allColorSchemes: {
        [key: string]: Color[];
    };

    constructor() {
        let defaultCs = [
            new Color(31, 120, 180), new Color(51, 160, 44), new Color(227, 26, 28),
            new Color(255, 127, 0), new Color(106, 61, 154), new Color(177, 89, 40),
            new Color(166, 206, 227), new Color(178, 223, 138), new Color(251, 154, 153),
            new Color(253, 191, 111), new Color(202, 178, 214), new Color(255, 255, 153),
        ];
        let defaultKey = 'default';
        this.allColorSchemes = {};
        this.allColorSchemes['default'] = defaultCs;
        this.allColorSchemes['bright'] = [
            new Color(228, 26, 28), new Color(55, 126, 184), new Color(77, 175, 74),
            new Color(152, 78, 163), new Color(255, 127, 0), new Color(255, 255, 51),
            new Color(166, 86, 40), new Color(247, 129, 191), new Color(153, 153, 153)
        ];
        this.allColorSchemes['divergentHotCold'] = [
            new Color(103, 0, 31), new Color(178, 24, 43), new Color(214, 96, 77),
            new Color(244, 165, 130), new Color(253, 219, 199), new Color(247, 247, 247),
            new Color(209, 229, 240), new Color(146, 197, 222), new Color(67, 147, 195),
            new Color(33, 102, 172), new Color(5, 48, 97)];
        this.setActiveColorScheme(defaultKey);
    }

    /**
     * @param {string} key
     * @deprecated
     */
    public setActiveColorScheme(key: string): void {
        if (this.allColorSchemes.hasOwnProperty(key)) {
            this.activeColorSchemeName = key;
            this.activeColorScheme = this.allColorSchemes[key];
        }
    }

    /**
     * @deprecated
     * @param {number} index
     * @return {Color}
     */
    public getColor(index: number): Color {
        if (index >= 0) {
            index = index % this.activeColorScheme.length;
            return this.activeColorScheme[index];

        }
        return null;
    };

    /**
     * @deprecated
     * @param {number} index
     * @return {string}
     */
    public getColorAsRgb(index: number): string {
        return this.getColor(index).toRgb();
    }

    /**
     * Get the color for a value within a set
     * @param {string} set
     * @param {string} value
     */
    public getColorFor(set: string, value: string) {
        let colorSet = this.colorMaps.get(set);
        if (colorSet == null) {
            colorSet = new ColorSet();
            colorSet.colorList = this.colorList[this.colorPosition];
            this.colorMaps.set(set, colorSet);

            this.colorPosition = (this.colorPosition + 1) % this.colorList.length;
        }
        return colorSet.getColorForValue(value);
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
     * Get the color as a '#RRGGBB' string
     * @return {string}
     */
    toHexString(): string {
        return '#' + this.getHex(this.red) +
            this.getHex(this.green) +
            this.getHex(this.blue);
    }
}
