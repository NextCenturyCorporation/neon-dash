var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var ColorSet = /** @class */ (function () {
    function ColorSet(name) {
        this.currentIndex = 0;
        this.mappings = new Map();
        this.name = name;
    }
    /**
     * Get the color for a value
     * @param {string} value
     * @return {Color}
     */
    ColorSet.prototype.getColorForValue = function (value) {
        var color = this.mappings.get(value);
        if (color == null) {
            color = this.colorList[this.currentIndex];
            this.mappings.set(value, color);
            this.currentIndex = (this.currentIndex + 1) % this.colorList.length;
        }
        return color;
    };
    /**
     * Get the map of colors
     * @return {Map<string, Color>}
     */
    ColorSet.prototype.getColorMap = function () {
        return this.mappings;
    };
    /**
     * Get the list of all the keys that have a color in the set
     * @return {string[]}
     */
    ColorSet.prototype.getAllKeys = function () {
        return Array.from(this.mappings.keys());
    };
    return ColorSet;
}());
export { ColorSet };
/**
 * Service for getting colors to use for coloring different values in visualizations.
 * The set name and data value are cached, so that you get the same colors for the same values each time.
 */
var ColorSchemeService = /** @class */ (function () {
    function ColorSchemeService() {
        this.colorMaps = new Map();
        // Palette generated with http://tools.medialab.sciences-po.fr/iwanthue/
        this.colorList = [
            [
                new Color(31, 120, 180), new Color(51, 160, 44), new Color(227, 26, 28),
                new Color(255, 127, 0), new Color(106, 61, 154), new Color(177, 89, 40),
                new Color(166, 206, 227), new Color(178, 223, 138), new Color(251, 154, 153),
                new Color(253, 191, 111), new Color(202, 178, 214), new Color(255, 255, 153)
            ],
            [
                new Color(228, 26, 28), new Color(55, 126, 184), new Color(77, 175, 74),
                new Color(152, 78, 163), new Color(255, 127, 0), new Color(255, 255, 51),
                new Color(166, 86, 40), new Color(247, 129, 191), new Color(153, 153, 153)
            ],
            [
                new Color(1, 63, 165),
                new Color(0, 161, 73),
                new Color(171, 79, 193),
                new Color(131, 126, 0),
                new Color(190, 165, 255),
                new Color(184, 68, 6),
                new Color(187, 134, 198),
                new Color(255, 148, 89),
                new Color(120, 33, 65),
                new Color(255, 132, 189),
                new Color(230, 65, 81),
                new Color(192, 0, 89)
            ],
            [
                new Color(217, 66, 163),
                new Color(144, 186, 48),
                new Color(31, 137, 255),
                new Color(255, 163, 72),
                new Color(0, 89, 162),
                new Color(136, 232, 164),
                new Color(111, 0, 60),
                new Color(0, 123, 45),
                new Color(221, 142, 194),
                new Color(0, 77, 1),
                new Color(255, 143, 132),
                new Color(119, 79, 0)
            ],
            [
                new Color(103, 0, 31), new Color(178, 24, 43), new Color(214, 96, 77),
                new Color(244, 165, 130), new Color(253, 219, 199), new Color(247, 247, 247),
                new Color(209, 229, 240), new Color(146, 197, 222), new Color(67, 147, 195),
                new Color(33, 102, 172), new Color(5, 48, 97)
            ]
        ];
        this.colorPosition = 0;
    }
    /**
     * Get the color for a value within a set
     * @param {string} set
     * @param {string} value
     */
    ColorSchemeService.prototype.getColorFor = function (set, value) {
        var colorSet = this.colorMaps.get(set);
        if (colorSet == null) {
            colorSet = new ColorSet(set);
            colorSet.colorList = this.colorList[this.colorPosition];
            this.colorMaps.set(set, colorSet);
            this.colorPosition = (this.colorPosition + 1) % this.colorList.length;
        }
        var colorKey = (value instanceof Array) ? value.join() : value;
        return colorSet.getColorForValue(colorKey);
    };
    /**
     * Get the color set for a key
     * @param {string} set
     * @return {ColorSet}
     */
    ColorSchemeService.prototype.getColorSet = function (set) {
        return this.colorMaps.get(set);
    };
    ColorSchemeService = __decorate([
        Injectable()
    ], ColorSchemeService);
    return ColorSchemeService;
}());
export { ColorSchemeService };
/**
 * General color class.
 * This class can provide colors in a hex string, RGB formatted, or in RGB percent.
 */
var Color = /** @class */ (function () {
    function Color(r, g, b) {
        this.red = r;
        this.green = g;
        this.blue = b;
    }
    /**
     * Create a color object from an array of RGB values.
     * The array must have 3 elements in it
     * @param {number[]} rgb
     * @return {Color}
     */
    Color.fromRgbArray = function (rgb) {
        if (rgb == null || rgb.length !== 3) {
            return null;
        }
        return new Color(rgb[0], rgb[1], rgb[2]);
    };
    /**
     * Create a color object from an RGB string, like "rgb(39, 96, 126)"
     * @param {string} rgbstring
     * @return {Color}
     */
    Color.fromRgbString = function (rgbstring) {
        if (rgbstring == null || rgbstring.length < 5) {
            return null;
        }
        var rgbstringarray = rgbstring.replace(/[^\d,]/g, '').split(',');
        var red = Number(rgbstringarray[0]);
        var green = Number(rgbstringarray[1]);
        var blue = Number(rgbstringarray[2]);
        return Color.fromRgbArray([red, green, blue]);
    };
    Color.prototype.getBase255 = function (value) {
        return value;
    };
    Color.prototype.getBase1 = function (value) {
        return value / 255;
    };
    Color.prototype.getHex = function (value) {
        return value.toString(16);
    };
    /**
     * Get the 'inactive' color, aka the RGBA string with an alpha of 0.3
     * @return {string}
     */
    Color.prototype.getInactiveRgba = function () {
        return this.toRgba(0.3);
    };
    /**
     * Get the color as a string of RGB percentages
     * @return {string}
     */
    Color.prototype.toPercentages = function () {
        return '' + this.getBase1(this.red) + ',' +
            this.getBase1(this.green) + ',' +
            this.getBase1(this.blue);
    };
    /**
     * Get the color as a rgb(0,0,0) string
     * @return {string}
     */
    Color.prototype.toRgb = function () {
        return 'rgb(' + this.getBase255(this.red) + ',' +
            this.getBase255(this.green) + ',' +
            this.getBase255(this.blue) + ')';
    };
    /**
     * Get the color as a rgba(0,0,0,a) string
     * @param a alpha value (0-1)
     * @return {string}
     */
    Color.prototype.toRgba = function (a) {
        return 'rgba(' + this.getBase255(this.red) + ',' +
            this.getBase255(this.green) + ',' +
            this.getBase255(this.blue) + ',' +
            a + ')';
    };
    /**
     * Get the color as a '#RRGGBB' string
     * @return {string}
     */
    Color.prototype.toHexString = function () {
        return '#' + this.getHex(this.red) +
            this.getHex(this.green) +
            this.getHex(this.blue);
    };
    return Color;
}());
export { Color };
//# sourceMappingURL=color-scheme.service.js.map