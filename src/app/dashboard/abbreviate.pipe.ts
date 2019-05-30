import { Pipe, PipeTransform } from '@angular/core';

const suffixes = ['k', 'M', 'G', 'T', 'P', 'E'];

@Pipe({
  name: 'abbreviate'
})
export class AbbreviatePipe implements PipeTransform {
  transform(input: number, precision: number = 0): any {
    if (Number.isNaN(input)) {
      return null;
    } else if (input < 1000) {
      return `${input}`;
    }

    const exp = Math.trunc(
      Math.log(input) / Math.log(1000)
    );

    return (input / Math.pow(1000, exp)).toFixed(precision) + suffixes[exp - 1];
  }
}