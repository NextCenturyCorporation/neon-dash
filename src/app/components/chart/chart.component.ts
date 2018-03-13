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
import {
    Component, Input, ElementRef,
    OnInit, OnChanges, SimpleChanges
} from '@angular/core';
import 'chart.js';

declare let Chart;

@Component({
  selector: 'app-chart',
  template: '',
  styles: [':host { display: block; }']
})
export class ChartComponent implements OnInit, OnChanges  {
    chart: any;

    @Input() type: string;
    @Input() data: any;
    @Input() options: any;

    private canvas;

    constructor(private elementRef: ElementRef) { }

    ngOnInit() {
        Chart.defaults.global.defaultFontFamily = 'Roboto, sans-serif';
        Chart.defaults.global.defaultFontSize = 10;

        Chart.Tooltip.positioners.neonBarMousePosition = (elements, eventPosition) => {
            // If the mouse is inside the bar, return the mouse position itself.
            if (elements.some((element) => {
                return element.inRange(eventPosition.x, eventPosition.y);
            })) {
                return eventPosition;
            }

            let barPosition = elements[elements.length - 1].tooltipPosition();

            // If the bar is horizontal, return the position based on the extent of the bar.
            if (elements[0]._view.height !== undefined) {
                return {
                    x: Math.max(Math.min(eventPosition.x, barPosition.x), elements[0]._view.base),
                    y: Math.max(Math.min(eventPosition.y, barPosition.y * 2), 0)
                };
            }

            // If the bar is vertical, return the position based on the extent of the bar.
            return {
                x: Math.max(Math.min(eventPosition.x, barPosition.x * 2), 0),
                y: Math.min(Math.max(eventPosition.y, barPosition.y), elements[0]._view.base)
            };
        };

        this.create();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.chart) {
            if (changes.data) {
                let currentValue = changes.data.currentValue;
                ['datasets', 'labels', 'xLabels', 'yLabels'].forEach((property) => {
                    this.chart.data[property] = currentValue[property];
                });
            }
            this.chart.update();
        }
    }

    getNativeElement() {
        return this.elementRef.nativeElement;
    }

    private create() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.elementRef.nativeElement.appendChild(this.canvas);
            this.chart = new Chart(this.canvas, {
                type: this.type,
                data: this.data,
                options: this.options
            });
        }
    }
}
