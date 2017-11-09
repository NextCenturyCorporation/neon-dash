/*
 * Reimplemented from: jquery.tagcloud.js at https://github.com/addywaddy/jquery.tagcloud.js by Adam Groves Copyright 2008
 */

export class TextCloud {
    private options: TextCloudOptions;

    constructor(options: TextCloudOptions) {
        this.options = options;
    }

    createTextCloud(data: any[]): any[] {
        let lowest = 0;
        let highest = 0;
        if (data.length > 0) {
            lowest = data[0].value;
            highest = data[0].value;
        }
        for (let d of data) {
            let v = d.value;
            if (v > highest) {
                highest = v;
            }
            if (v < lowest) {
                lowest = v;
            }
        }
        let range = highest - lowest;

        if (range === 0) {
            range = 1;
        }

        // Sizes
        let fontIncr = (this.options.size.end - this.options.size.start) / range;

        // Colors
        let colorIncr;
        if (this.options.color) {
            colorIncr = this.colorIncrement(this.options.color, range);
        }

        return data.map((item) => {
            let weighting = item['value'] - lowest;
            item['fontSize'] = this.options.size.start + (weighting * fontIncr) + this.options.size.unit;

            if (this.options.color) {
                item['color'] = this.tagColor(this.options.color, colorIncr, weighting);
            }
            return item;
        });
    }

    private colorIncrement(color: ColorOptions, range: number): number[] {
        return this.toRGB(color.end).map((n, i) => {
            return (n - this.toRGB(color.start)[i]) / range;
        });
    }

    // Converts hex to an RGB array
    private toRGB(code: string): number[] {
        if (code.length === 4) {
            code = code.replace(/(\w)(\w)(\w)/gi, '\$1\$1\$2\$2\$3\$3');
        }
        let hex = /(\w{2})(\w{2})(\w{2})/.exec(code);
        return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
    }

    private tagColor(color: ColorOptions, increment: number[], weighting: number) {
        let rgb = this.toRGB(color.start).map((n, i) => {
            let ref = Math.round(n + (increment[i] * weighting));
            if (ref > 255) {
                ref = 255;
            } else {
                if (ref < 0) {
                    ref = 0;
                }
            }
            return ref;
        });
        return this.toHex(rgb);
    }

    // Converts an RGB array to hex
    private toHex(ary: number[]): string {
        return '#' + ary.map((i) => {
            let hex = i.toString(16);
            hex = (hex.length === 1) ? '0' + hex : hex;
            return hex;
        }).join('');
    }

}

export class TextCloudOptions {
    size: SizeOptions = new SizeOptions();
    color: ColorOptions;

    constructor(size?: SizeOptions, color?: ColorOptions) {
        this.size = size || new SizeOptions();
        if (color) {
            this.color = color;
        }
    }
}

export class SizeOptions {
    start: number;
    end: number;
    unit: string;

    constructor(start?: number, end?: number, unit?: string) {
        this.start = start || 14;
        this.end = end || 18;
        this.unit = unit || 'pt';
    }
}

export class ColorOptions {
    start: string;
    end: string;

    constructor(start: string, end: string) {
        this.start = start;
        this.end = end;
    }
}
