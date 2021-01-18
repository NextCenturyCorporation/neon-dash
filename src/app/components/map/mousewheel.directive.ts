/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { Directive, Output, HostListener, EventEmitter } from '@angular/core';

@Directive({ selector: '[mouseWheel]' })
export class MouseWheelDirective {
    @Output() mouseWheelUp = new EventEmitter();
    @Output() mouseWheelDown = new EventEmitter();

    @HostListener('mousewheel', ['$event'])
    onMouseWheelChrome(event: MouseWheelEvent) {
        this.mouseWheelFunc(event);
    }

    @HostListener('DOMMouseScroll', ['$event'])
    onMouseWheelFirefox(event: MouseWheelEvent) {
        this.mouseWheelFunc(event);
    }

    @HostListener('onmousewheel', ['$event'])
    onMouseWheelIE(event: MouseWheelEvent) {
        this.mouseWheelFunc(event);
    }

    mouseWheelFunc(event: MouseWheelEvent) {
        const delta = Math.max(-1, Math.min(1, (event['wheelDelta'] || -event.detail)));
        if (delta > 0) {
            this.mouseWheelUp.emit(event);
        } else if (delta < 0) {
            this.mouseWheelDown.emit(event);
        }
        // For IE
        event.returnValue = false;
        // For Chrome and Firefox
        if (event.preventDefault) {
            event.preventDefault();
        }
    }
}
