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


@Injectable()
export class ColorSchemeService {

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

    public setActiveColorScheme(key: string): void {
        if (this.allColorSchemes.hasOwnProperty(key)) {
            this.activeColorSchemeName = key;
            this.activeColorScheme = this.allColorSchemes[key];
        }
    }

    public getColor(index: number): Color {
        if (index >= 0) {
            index = index % this.activeColorScheme.length;
            let c = this.activeColorScheme[index];
            return c;

        }
        return null;
    };

    public getColorAsRgb(index: number): string {
        let c = this.getColor(index);
        return c.toRgb();
    }
}

export class Color {
    private red: number;
    private green: number;
    private blue: number;

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

    toPercentages(): string {
        return '' + this.getBase1(this.red) + ',' +
            this.getBase1(this.green) + ',' +
            this.getBase1(this.blue);
    }

    toRgb(): string {
        return 'rgb(' + this.getBase255(this.red) + ',' +
            this.getBase255(this.green) + ',' +
            this.getBase255(this.blue) + ')';
    }

    toHexString(): string {
        return '#' + this.getHex(this.red) +
            this.getHex(this.green) +
            this.getHex(this.blue);
    }
}
