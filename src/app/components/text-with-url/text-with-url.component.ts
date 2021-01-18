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
import { ChangeDetectionStrategy, ViewEncapsulation, Component, Input } from '@angular/core';
import { CoreUtil } from '@caci-critical-insight-solutions/nucleus-core';

@Component({
    selector: 'app-text-with-url',
    templateUrl: './text-with-url.component.html',
    styleUrls: ['./text-with-url.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TextWithUrlComponent {
    @Input() text: string;
    public url = [];
    public splitText = [];
    hasUrl(text: string) {
        let textObject = CoreUtil.hasUrl(text);
        this.url = textObject.url;
        this.splitText = textObject.splitText;
        return textObject.test;
    }
}
