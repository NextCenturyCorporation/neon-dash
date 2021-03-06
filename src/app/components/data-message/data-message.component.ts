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
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    ViewEncapsulation
} from '@angular/core';

@Component({
    selector: 'app-data-message',
    templateUrl: 'data-message.component.html',
    styleUrls: ['data-message.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated
})
export class DataMessageComponent implements OnInit {
    @Input() displayMessage: string;

    constructor(private changeDetection: ChangeDetectorRef) { }

    ngOnInit() {
        this.changeDetection.detectChanges();
    }

    public getDisplayMessage(): string {
        return this.displayMessage || 'No data to display';
    }
}
